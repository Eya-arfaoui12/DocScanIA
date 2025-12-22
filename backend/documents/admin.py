"""
Configuration avancée de l'admin Django pour les documents
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Document, ClassificationLog


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Admin avancé pour les documents"""
    
    list_display = [
        'id',
        'original_filename_short',
        'owner_link',
        'predicted_class_badge',
        'confidence_display',
        'status_badge',
        'uploaded_at'
    ]
    list_filter = [
        'predicted_class',
        'processed',
        'uploaded_at',
        ('owner', admin.RelatedOnlyFieldListFilter)
    ]
    search_fields = ['original_filename', 'extracted_text', 'owner__email']
    readonly_fields = [
        'uploaded_at',
        'processed_at',
        'file_size',
        'text_length',
        'processing_time',
        'confidence_percentage'
    ]
    
    fieldsets = (
        ('Propriétaire', {
            'fields': ('owner',)
        }),
        ('Fichier', {
            'fields': ('file', 'original_filename', 'file_size', 'uploaded_at')
        }),
        ('Classification', {
            'fields': (
                'predicted_class',
                'confidence',
                'confidence_percentage',
                'probability_factures',
                'probability_contrats',
                'probability_cartes_identite'
            )
        }),
        ('Texte Extrait', {
            'fields': ('extracted_text', 'extracted_text_raw', 'text_length'),
            'classes': ('collapse',)
        }),
        ('Données Structurées', {
            'fields': ('structured_data',),
            'classes': ('collapse',)
        }),
        ('Traitement', {
            'fields': ('processed', 'processing_time', 'processed_at', 'error_message')
        })
    )
    
    actions = [
        'mark_as_processed',
        'reprocess_documents',
        'export_to_csv',
        'delete_selected_with_files'
    ]
    
    # Personnalisation des colonnes
    
    def original_filename_short(self, obj):
        """Affiche le nom du fichier tronqué"""
        if len(obj.original_filename) > 30:
            return f"{obj.original_filename[:27]}..."
        return obj.original_filename
    original_filename_short.short_description = "Fichier"
    
    def owner_link(self, obj):
        """Lien vers le propriétaire"""
        if obj.owner:
            url = reverse('admin:accounts_customuser_change', args=[obj.owner.id])
            return format_html('<a href="{}">{}</a>', url, obj.owner.email)
        return "-"
    owner_link.short_description = "Propriétaire"
    
    def predicted_class_badge(self, obj):
        """Badge coloré pour la classe prédite"""
        if not obj.predicted_class:
            return format_html('<span style="color: gray;">Non traité</span>')
        
        colors = {
            'factures': '#10b981',
            'contrats': '#3b82f6',
            'cartes_identite': '#f59e0b'
        }
        color = colors.get(obj.predicted_class, '#6b7280')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_predicted_class_display()
        )
    predicted_class_badge.short_description = "Classe"
    
    def confidence_display(self, obj):
        """Affiche la confiance avec couleur"""
        if not obj.confidence:
            return "-"
        
        percentage = obj.confidence_percentage
        if percentage >= 90:
            color = '#10b981'  # Vert
        elif percentage >= 70:
            color = '#f59e0b'  # Orange
        else:
            color = '#ef4444'  # Rouge
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color,
            percentage
        )
    confidence_display.short_description = "Confiance"
    
    def status_badge(self, obj):
        """Badge de statut"""
        if obj.processed:
            if obj.error_message:
                return format_html(
                    '<span style="background-color: #ef4444; color: white; padding: 3px 8px; border-radius: 3px;">⚠ Erreur</span>'
                )
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 8px; border-radius: 3px;">✓ Traité</span>'
            )
        return format_html(
            '<span style="background-color: #6b7280; color: white; padding: 3px 8px; border-radius: 3px;">⏳ En attente</span>'
        )
    status_badge.short_description = "Statut"
    
    # Actions personnalisées
    
    def mark_as_processed(self, request, queryset):
        """Marquer comme traité"""
        updated = queryset.update(processed=True, processed_at=timezone.now())
        self.message_user(request, f'{updated} document(s) marqué(s) comme traité(s).')
    mark_as_processed.short_description = "Marquer comme traité"
    
    def reprocess_documents(self, request, queryset):
        """Retraiter les documents sélectionnés"""
        from ml_models.ml_service import get_classifier
        from ml_models.document_parser import DocumentParser
        
        classifier = get_classifier()
        parser = DocumentParser()
        success_count = 0
        
        for document in queryset:
            try:
                result = classifier.process_document(document.file.path)
                
                if result['success']:
                    document.predicted_class = result['predicted_class']
                    document.confidence = result['confidence']
                    document.extracted_text = result['extracted_text']
                    document.extracted_text_raw = result['extracted_text_raw']
                    document.text_length = result['text_length']
                    document.processing_time = result['processing_time']
                    document.processed = True
                    document.processed_at = timezone.now()
                    
                    probs = result['all_probabilities']
                    document.probability_factures = probs.get('factures', 0)
                    document.probability_contrats = probs.get('contrats', 0)
                    document.probability_cartes_identite = probs.get('cartes_identite', 0)
                    
                    structured = parser.parse_document(
                        result['extracted_text'],
                        result['predicted_class']
                    )
                    document.structured_data = structured
                    document.error_message = None
                    document.save()
                    success_count += 1
                else:
                    document.error_message = result['error']
                    document.save()
            except Exception as e:
                document.error_message = str(e)
                document.save()
        
        self.message_user(request, f'{success_count} document(s) retraité(s) avec succès.')
    reprocess_documents.short_description = "Retraiter les documents"
    
    def export_to_csv(self, request, queryset):
        """Exporter en CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="documents.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Fichier', 'Propriétaire', 'Classe', 'Confiance',
            'Traité', 'Date Upload'
        ])
        
        for doc in queryset:
            writer.writerow([
                doc.id,
                doc.original_filename,
                doc.owner.email if doc.owner else '',
                doc.predicted_class or '',
                doc.confidence_percentage if doc.confidence else '',
                'Oui' if doc.processed else 'Non',
                doc.uploaded_at.strftime('%Y-%m-%d %H:%M')
            ])
        
        return response
    export_to_csv.short_description = "Exporter en CSV"
    
    def delete_selected_with_files(self, request, queryset):
        """Supprimer avec les fichiers physiques"""
        count = queryset.count()
        for doc in queryset:
            doc.delete()  # Utilise la méthode delete() qui supprime le fichier
        self.message_user(request, f'{count} document(s) et fichier(s) supprimé(s).')
    delete_selected_with_files.short_description = "Supprimer (avec fichiers)"


@admin.register(ClassificationLog)
class ClassificationLogAdmin(admin.ModelAdmin):
    """Admin pour les logs avec filtres avancés"""
    
    list_display = [
        'id',
        'document_link',
        'user_link',
        'action_badge',
        'success_badge',
        'timestamp'
    ]
    list_filter = ['action', 'success', 'timestamp']
    search_fields = [
        'document__original_filename',
        'user__email',
        'action'
    ]
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    def document_link(self, obj):
        """Lien vers le document"""
        url = reverse('admin:documents_document_change', args=[obj.document.id])
        return format_html('<a href="{}">{}</a>', url, obj.document.original_filename)
    document_link.short_description = "Document"
    
    def user_link(self, obj):
        """Lien vers l'utilisateur"""
        if obj.user:
            url = reverse('admin:accounts_customuser_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.email)
        return "-"
    user_link.short_description = "Utilisateur"
    
    def action_badge(self, obj):
        """Badge pour l'action"""
        colors = {
            'upload': '#3b82f6',
            'classification': '#10b981',
            'delete': '#ef4444',
            'update': '#f59e0b'
        }
        color = colors.get(obj.action, '#6b7280')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.action
        )
    action_badge.short_description = "Action"
    
    def success_badge(self, obj):
        """Badge de succès/échec"""
        if obj.success:
            return format_html('<span style="color: #10b981;">✓ Succès</span>')
        return format_html('<span style="color: #ef4444;">✗ Échec</span>')
    success_badge.short_description = "Statut"
    
    def has_add_permission(self, request):
        """Empêche l'ajout manuel de logs"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Empêche la modification des logs"""
        return False