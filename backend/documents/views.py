"""
Vues API pour la classification de documents avec fonctionnalités avancées
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, parser_classes as api_parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.http import HttpResponse, FileResponse
import tempfile
import os
import json
import csv
from io import BytesIO, StringIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

from .models import Document, ClassificationLog
from .serializers import (
    DocumentSerializer,
    DocumentUploadSerializer,
    StructuredTextSerializer,
    ClassificationLogSerializer
)
from ml_models.ml_service import get_classifier
from ml_models.document_parser import DocumentParser


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les documents avec fonctionnalités avancées
    """
    serializer_class = DocumentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtre les documents selon le rôle
        """
        user = self.request.user
        
        if user.role == 'admin':
            return Document.objects.all()
        else:
            return Document.objects.filter(owner=user)
    
    def create(self, request, *args, **kwargs):
        """Upload et classification automatique d'un document"""
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uploaded_file = serializer.validated_data['file']
        
        document = Document.objects.create(
            file=uploaded_file,
            original_filename=uploaded_file.name,
            file_size=uploaded_file.size,
            owner=request.user
        )
        
        ClassificationLog.objects.create(
            document=document,
            action='upload',
            details={'filename': uploaded_file.name},
            user=request.user
        )
        
        try:
            classifier = get_classifier()
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
                
                parser = DocumentParser()
                structured = parser.parse_document(
                    result['extracted_text'],
                    result['predicted_class']
                )
                document.structured_data = structured
                
                document.save()
                
                ClassificationLog.objects.create(
                    document=document,
                    action='classification',
                    details=result,
                    success=True,
                    user=request.user
                )
                
            else:
                document.error_message = result['error']
                document.save()
                
                ClassificationLog.objects.create(
                    document=document,
                    action='classification',
                    details=result,
                    success=False,
                    user=request.user
                )
            
        except Exception as e:
            document.error_message = str(e)
            document.save()
            
            ClassificationLog.objects.create(
                document=document,
                action='classification',
                details={'error': str(e)},
                success=False,
                user=request.user
            )
        
        serializer = DocumentSerializer(document, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # ==================== EXPORTS ====================
    
    @action(detail=True, methods=['get'])
    def export_json(self, request, pk=None):
        """
        GET /api/documents/{id}/export_json/
        Exporte le document en JSON
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        data = {
            'id': document.id,
            'filename': document.original_filename,
            'uploaded_at': document.uploaded_at.isoformat(),
            'predicted_class': document.predicted_class,
            'confidence': document.confidence_percentage,
            'extracted_text': document.extracted_text,
            'structured_data': document.structured_data or {},
            'metadata': {
                'file_size': document.file_size,
                'processing_time': document.processing_time,
                'owner': document.owner.email if document.owner else None
            }
        }
        
        response = HttpResponse(
            json.dumps(data, indent=2, ensure_ascii=False),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="{document.original_filename}.json"'
        
        # Log
        ClassificationLog.objects.create(
            document=document,
            action='export_json',
            user=request.user
        )
        
        return response
    
    @action(detail=True, methods=['get'])
    def export_csv(self, request, pk=None):
        """
        GET /api/documents/{id}/export_csv/
        Exporte les champs structurés en CSV
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        output = StringIO()
        writer = csv.writer(output)
        
        # En-têtes
        writer.writerow(['Champ', 'Valeur'])
        
        # Données de base
        writer.writerow(['Nom du fichier', document.original_filename])
        writer.writerow(['Date d\'upload', document.uploaded_at.strftime('%Y-%m-%d %H:%M')])
        writer.writerow(['Type de document', document.get_predicted_class_display() if document.predicted_class else 'Non traité'])
        writer.writerow(['Confiance', f"{document.confidence_percentage}%"])
        
        # Données structurées
        if document.structured_data:
            writer.writerow([])
            writer.writerow(['=== Données Extraites ===', ''])
            for key, value in document.structured_data.items():
                writer.writerow([key.replace('_', ' ').title(), value])
        
        # Texte extrait
        writer.writerow([])
        writer.writerow(['=== Texte Complet ===', ''])
        writer.writerow(['Texte', document.extracted_text])
        
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{document.original_filename}.csv"'
        
        ClassificationLog.objects.create(
            document=document,
            action='export_csv',
            user=request.user
        )
        
        return response
    
    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """
        GET /api/documents/{id}/export_pdf/
        Exporte en PDF formaté
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Titre
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30
        )
        elements.append(Paragraph(f"Document: {document.original_filename}", title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Informations générales
        info_data = [
            ['Type de document:', document.get_predicted_class_display() if document.predicted_class else 'Non traité'],
            ['Confiance:', f"{document.confidence_percentage}%"],
            ['Date d\'upload:', document.uploaded_at.strftime('%d/%m/%Y %H:%M')],
            ['Propriétaire:', document.owner.email if document.owner else 'N/A']
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Données structurées
        if document.structured_data:
            elements.append(Paragraph("Données Extraites", styles['Heading2']))
            elements.append(Spacer(1, 0.1*inch))
            
            struct_data = [[key.replace('_', ' ').title(), str(value)] 
                          for key, value in document.structured_data.items()]
            struct_table = Table(struct_data, colWidths=[2*inch, 4*inch])
            struct_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#dbeafe')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            elements.append(struct_table)
            elements.append(Spacer(1, 0.3*inch))
        
        # Texte extrait
        elements.append(Paragraph("Texte Complet", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        text_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=9,
            leading=12
        )
        text = document.extracted_text.replace('\n', '<br/>')
        elements.append(Paragraph(text, text_style))
        
        doc.build(elements)
        buffer.seek(0)
        
        response = FileResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{document.original_filename}.pdf"'
        
        ClassificationLog.objects.create(
            document=document,
            action='export_pdf',
            user=request.user
        )
        
        return response
    
    @action(detail=True, methods=['get'])
    def export_txt(self, request, pk=None):
        """
        GET /api/documents/{id}/export_txt/
        Exporte le texte brut en TXT
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        response = HttpResponse(document.extracted_text or '', content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="{document.original_filename}.txt"'
        
        ClassificationLog.objects.create(
            document=document,
            action='export_txt',
            user=request.user
        )
        
        return response
    
    # ==================== RECHERCHE & FILTRES ====================
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        GET /api/documents/search/?q=text&class=factures&date_from=2025-01-01&min_confidence=80
        Recherche avancée dans les documents
        """
        queryset = self.get_queryset()
        
        # Recherche texte
        query = request.query_params.get('q', '')
        if query:
            queryset = queryset.filter(
                Q(original_filename__icontains=query) |
                Q(extracted_text__icontains=query) |
                Q(extracted_text_raw__icontains=query)
            )
        
        # Filtre par classe
        doc_class = request.query_params.get('class', '')
        if doc_class:
            queryset = queryset.filter(predicted_class=doc_class)
        
        # Filtre par date
        date_from = request.query_params.get('date_from', '')
        if date_from:
            queryset = queryset.filter(uploaded_at__gte=date_from)
        
        date_to = request.query_params.get('date_to', '')
        if date_to:
            queryset = queryset.filter(uploaded_at__lte=date_to)
        
        # Filtre par confiance
        min_confidence = request.query_params.get('min_confidence', '')
        if min_confidence:
            try:
                min_conf = float(min_confidence) / 100.0
                queryset = queryset.filter(confidence__gte=min_conf)
            except ValueError:
                pass
        
        # Filtre par statut
        status_filter = request.query_params.get('status', '')
        if status_filter == 'processed':
            queryset = queryset.filter(processed=True, error_message__isnull=True)
        elif status_filter == 'error':
            queryset = queryset.filter(processed=False, error_message__isnull=False)
        elif status_filter == 'pending':
            queryset = queryset.filter(processed=False)
        
        # Tri
        sort_by = request.query_params.get('sort', '-uploaded_at')
        queryset = queryset.order_by(sort_by)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    # ==================== GESTION DE TAGS/DOSSIERS ====================

    @action(detail=True, methods=['post'])
    @api_parser_classes([JSONParser])  # ← Utiliser api_parser_classes
    def add_tags(self, request, pk=None):
        """
        POST /api/documents/{id}/add_tags/
        Body: {"tags": ["urgent", "client_x", "2025"]}
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        tags = request.data.get('tags', [])
        
        if not document.structured_data:
            document.structured_data = {}
        
        existing_tags = document.structured_data.get('tags', [])
        new_tags = list(set(existing_tags + tags))
        document.structured_data['tags'] = new_tags
        document.save()
        
        ClassificationLog.objects.create(
            document=document,
            action='add_tags',
            details={'tags': tags},
            user=request.user
        )
        
        return Response({
            'message': 'Tags ajoutés',
            'tags': new_tags
        })

    @action(detail=True, methods=['post'])
    @api_parser_classes([JSONParser])  # ← Utiliser api_parser_classes
    def remove_tags(self, request, pk=None):
        """
        POST /api/documents/{id}/remove_tags/
        Body: {"tags": ["urgent"]}
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        tags_to_remove = request.data.get('tags', [])
        
        if document.structured_data and 'tags' in document.structured_data:
            current_tags = document.structured_data['tags']
            document.structured_data['tags'] = [t for t in current_tags if t not in tags_to_remove]
            document.save()
        
        return Response({'message': 'Tags supprimés'})

    @action(detail=True, methods=['post'])
    @api_parser_classes([JSONParser])  # ← Utiliser api_parser_classes
    def set_folder(self, request, pk=None):
        """
        POST /api/documents/{id}/set_folder/
        Body: {"folder": "Projets/2025"}
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        folder = request.data.get('folder', '')
        
        if not document.structured_data:
            document.structured_data = {}
        
        document.structured_data['folder'] = folder
        document.save()
        
        return Response({
            'message': 'Dossier défini',
            'folder': folder
        })
    
    @action(detail=False, methods=['get'])
    def by_folder(self, request):
        """
        GET /api/documents/by_folder/?folder=Projets/2025
        Liste documents d'un dossier
        """
        folder = request.query_params.get('folder', '')
        queryset = self.get_queryset()
        
        # Filtrer par dossier
        documents = [
            doc for doc in queryset 
            if doc.structured_data and doc.structured_data.get('folder') == folder
        ]
        
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def folders(self, request):
        """
        GET /api/documents/folders/
        Liste tous les dossiers de l'utilisateur
        """
        queryset = self.get_queryset()
        folders = set()
        
        for doc in queryset:
            if doc.structured_data and 'folder' in doc.structured_data:
                folders.add(doc.structured_data['folder'])
        
        return Response({
            'folders': sorted(list(folders))
        })
    
    # ==================== FAVORIS ====================
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """
        POST /api/documents/{id}/toggle_favorite/
        Ajouter/Retirer des favoris
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if not document.structured_data:
            document.structured_data = {}
        
        is_favorite = document.structured_data.get('favorite', False)
        document.structured_data['favorite'] = not is_favorite
        document.save()
        
        return Response({
            'message': 'Favoris mis à jour',
            'favorite': document.structured_data['favorite']
        })
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """
        GET /api/documents/favorites/
        Liste des documents favoris
        """
        queryset = self.get_queryset()
        favorites = [
            doc for doc in queryset
            if doc.structured_data and doc.structured_data.get('favorite', False)
        ]
        
        serializer = self.get_serializer(favorites, many=True)
        return Response(serializer.data)
    
    # ==================== CORRECTION MANUELLE ====================
    
    @action(detail=True, methods=['post'])
    def correct_classification(self, request, pk=None):
        """..."""
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        new_class = request.data.get('predicted_class')
        new_structured = request.data.get('structured_data')
        
        old_class = document.predicted_class
        
        if new_class:
            document.predicted_class = new_class
        
        # ✅ CORRECTION : Initialiser structured_data si None
        if not document.structured_data:
            document.structured_data = {}
        
        if new_structured:
            document.structured_data.update(new_structured)
        
        # Marquer comme manuellement validé
        document.structured_data['manually_validated'] = True
        document.save()
        
        ClassificationLog.objects.create(
            document=document,
            action='manual_correction',
            details={
                'old_class': old_class,
                'new_class': new_class,
                'changes': new_structured
            },
            user=request.user
        )
        
        return Response({
            'message': 'Document corrigé',
            'document': DocumentSerializer(document, context={'request': request}).data
        })
        
        
        ##################################
        # Ajoutez cette méthode dans la classe DocumentViewSet
    # À placer dans la section "CORRECTION MANUELLE"

    @action(detail=True, methods=['post'])
    @api_parser_classes([JSONParser])
    def correct_extracted_text(self, request, pk=None):
        """
        POST /api/documents/{id}/correct_extracted_text/
        Body: {
            "extracted_text": "Texte corrigé...",
            "reason": "Correction OCR" (optionnel)
        }
        
        Permet à l'utilisateur de corriger manuellement le texte extrait
        """
        document = self.get_object()
        
        # Vérification des permissions
        if document.owner != request.user and request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupération du nouveau texte
        new_text = request.data.get('extracted_text')
        reason = request.data.get('reason', 'Correction manuelle')
        
        # Validation
        if not new_text:
            return Response(
                {'error': 'Le champ extracted_text est requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_text.strip()) == 0:
            return Response(
                {'error': 'Le texte ne peut pas être vide'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sauvegarde de l'ancien texte pour l'historique
        old_text = document.extracted_text
        old_text_length = document.text_length or 0
        
        # Mise à jour du document
        document.extracted_text = new_text
        document.text_length = len(new_text)
        
        # Marquer comme manuellement corrigé
        if not document.structured_data:
            document.structured_data = {}
        
        document.structured_data['text_manually_corrected'] = True
        document.structured_data['text_correction_date'] = timezone.now().isoformat()
        
        # Re-parser les données structurées avec le nouveau texte
        try:
            parser = DocumentParser()
            updated_structured = parser.parse_document(
                new_text,
                document.predicted_class
            )
            
            # Fusionner avec les données existantes
            document.structured_data.update(updated_structured)
        except Exception as e:
            # Si le parsing échoue, on continue quand même
            pass
        
        document.save()
        
        # Logger l'action
        ClassificationLog.objects.create(
            document=document,
            action='correct_extracted_text',
            details={
                'reason': reason,
                'old_text_length': old_text_length,
                'new_text_length': len(new_text),
                'old_text_preview': old_text[:200] if old_text else '',
                'new_text_preview': new_text[:200]
            },
            user=request.user
        )
        
        return Response({
            'message': 'Texte extrait corrigé avec succès',
            'document': DocumentSerializer(document, context={'request': request}).data,
            'changes': {
                'old_length': old_text_length,
                'new_length': len(new_text),
                'difference': len(new_text) - old_text_length
            }
        })


    @action(detail=True, methods=['get'])
    def get_text_for_correction(self, request, pk=None):
        """
        GET /api/documents/{id}/get_text_for_correction/
        
        Récupère le texte extrait dans un format adapté pour la correction
        Retourne aussi des métadonnées utiles pour l'interface de correction
        """
        document = self.get_object()
        
        # Vérification des permissions
        if document.owner != request.user and request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not document.processed:
            return Response(
                {'error': 'Document non traité'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si déjà corrigé
        is_corrected = bool(
            document.structured_data and 
            document.structured_data.get('text_manually_corrected', False)
        )
        
        correction_date = None
        if is_corrected and document.structured_data:
            correction_date = document.structured_data.get('text_correction_date')
        
        return Response({
            'document_id': document.id,
            'filename': document.original_filename,
            'predicted_class': document.predicted_class,
            'extracted_text': document.extracted_text,
            'extracted_text_raw': document.extracted_text_raw,
            'text_length': document.text_length,
            'is_corrected': is_corrected,
            'correction_date': correction_date,
            'metadata': {
                'confidence': document.confidence_percentage,
                'processing_time': document.processing_time,
                'uploaded_at': document.uploaded_at.isoformat()
            }
        })


    @action(detail=True, methods=['post'])
    @api_parser_classes([JSONParser])
    def revert_text_correction(self, request, pk=None):
        """
        POST /api/documents/{id}/revert_text_correction/
        
        Annule la dernière correction de texte et revient au texte original
        """
        document = self.get_object()
        
        # Vérification des permissions
        if document.owner != request.user and request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier s'il y a une correction à annuler
        if not (document.structured_data and 
                document.structured_data.get('text_manually_corrected')):
            return Response(
                {'error': 'Aucune correction à annuler'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rechercher le texte original dans l'historique
        last_correction = ClassificationLog.objects.filter(
            document=document,
            action='correct_extracted_text'
        ).order_by('-timestamp').first()
        
        if not last_correction:
            return Response(
                {'error': 'Impossible de trouver le texte original'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Restaurer le texte original depuis extracted_text_raw
        if document.extracted_text_raw:
            document.extracted_text = document.extracted_text_raw
            document.text_length = len(document.extracted_text_raw)
            
            # Retirer le marqueur de correction
            if 'text_manually_corrected' in document.structured_data:
                del document.structured_data['text_manually_corrected']
            if 'text_correction_date' in document.structured_data:
                del document.structured_data['text_correction_date']
            
            document.save()
            
            # Logger l'annulation
            ClassificationLog.objects.create(
                document=document,
                action='revert_text_correction',
                details={'reverted_from_log': last_correction.id},
                user=request.user
            )
            
            return Response({
                'message': 'Correction annulée, texte original restauré',
                'document': DocumentSerializer(document, context={'request': request}).data
            })
        else:
            return Response(
                {'error': 'Texte original non disponible'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        ########################################
    
    # ==================== HISTORIQUE & ACTIVITÉ ====================
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        GET /api/documents/{id}/history/
        Historique des actions sur un document
        """
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        logs = ClassificationLog.objects.filter(document=document).order_by('-timestamp')
        serializer = ClassificationLogSerializer(logs, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def activity(self, request):
        """
        GET /api/documents/activity/
        Timeline d'activité de l'utilisateur
        """
        logs = ClassificationLog.objects.filter(
            user=request.user
        ).select_related('document').order_by('-timestamp')[:50]
        
        serializer = ClassificationLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    # ==================== STATISTIQUES AVANCÉES ====================
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        GET /api/documents/dashboard_stats/
        Statistiques détaillées pour le dashboard
        """
        queryset = self.get_queryset()
        
        # Stats de base
        total = queryset.count()
        processed = queryset.filter(processed=True).count()
        errors = queryset.filter(error_message__isnull=False).count()
        
        # Par classe
        by_class = queryset.values('predicted_class').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Par mois (6 derniers mois)
        from datetime import timedelta
        six_months_ago = timezone.now() - timedelta(days=180)
        
        monthly_uploads = {}
        for i in range(6):
            month_start = six_months_ago + timedelta(days=i*30)
            month_end = month_start + timedelta(days=30)
            count = queryset.filter(
                uploaded_at__gte=month_start,
                uploaded_at__lt=month_end
            ).count()
            monthly_uploads[month_start.strftime('%Y-%m')] = count
        
        # Confiance moyenne
        avg_confidence = queryset.filter(
            processed=True
        ).aggregate(avg=Avg('confidence'))['avg']
        
        # Documents récents
        recent = queryset.order_by('-uploaded_at')[:5]
        recent_data = DocumentSerializer(recent, many=True, context={'request': request}).data
        
        # Tags populaires
        all_tags = []
        for doc in queryset:
            if doc.structured_data and 'tags' in doc.structured_data:
                all_tags.extend(doc.structured_data['tags'])
        
        from collections import Counter
        tag_counts = Counter(all_tags).most_common(10)
        
        return Response({
            'total_documents': total,
            'processed_documents': processed,
            'error_documents': errors,
            'pending_documents': total - processed,
            'documents_by_class': list(by_class),
            'monthly_uploads': monthly_uploads,
            'average_confidence': round(avg_confidence * 100, 2) if avg_confidence else 0,
            'recent_documents': recent_data,
            'popular_tags': [{'tag': tag, 'count': count} for tag, count in tag_counts]
        })
    
    # ==================== BATCH OPERATIONS ====================
    
    @action(detail=False, methods=['post'])
    def batch_export(self, request):
        """
        POST /api/documents/batch_export/
        Body: {
            "document_ids": [1, 2, 3],
            "format": "json"
        }
        """
        document_ids = request.data.get('document_ids', [])
        export_format = request.data.get('format', 'json')
        
        documents = self.get_queryset().filter(id__in=document_ids)
        
        if export_format == 'json':
            data = []
            for doc in documents:
                data.append({
                    'id': doc.id,
                    'filename': doc.original_filename,
                    'class': doc.predicted_class,
                    'confidence': doc.confidence_percentage,
                    'text': doc.extracted_text,
                    'structured_data': doc.structured_data
                })
            
            response = HttpResponse(
                json.dumps(data, indent=2, ensure_ascii=False),
                content_type='application/json'
            )
            response['Content-Disposition'] = 'attachment; filename="documents_export.json"'
            return response
        
        elif export_format == 'csv':
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['ID', 'Filename', 'Class', 'Confidence', 'Date', 'Text'])
            
            for doc in documents:
                writer.writerow([
                    doc.id,
                    doc.original_filename,
                    doc.predicted_class,
                    doc.confidence_percentage,
                    doc.uploaded_at.strftime('%Y-%m-%d'),
                    doc.extracted_text[:100] if doc.extracted_text else ''
                ])
            
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="documents_export.csv"'
            return response
        
        return Response({'error': 'Format non supporté'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def batch_delete(self, request):
        """
        POST /api/documents/batch_delete/
        Body: {"document_ids": [1, 2, 3]}
        """
        document_ids = request.data.get('document_ids', [])
        documents = self.get_queryset().filter(id__in=document_ids)
        
        count = documents.count()
        
        # Log avant suppression
        for doc in documents:
            ClassificationLog.objects.create(
                document=doc,
                action='batch_delete',
                user=request.user
            )
        
        documents.delete()
        
        return Response({
            'message': f'{count} documents supprimés',
            'deleted_count': count
        })
    
    # ==================== AUTRES ENDPOINTS EXISTANTS ====================
    
    def retrieve(self, request, *args, **kwargs):
        """GET /api/documents/{id}/"""
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(document)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """PUT /api/documents/{id}/"""
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """DELETE /api/documents/{id}/"""
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        ClassificationLog.objects.create(
            document=document,
            action='delete',
            details={'filename': document.original_filename},
            user=request.user
        )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def classify(self, request):
        """POST /api/documents/classify/ - Classification rapide sans sauvegarde"""
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uploaded_file = serializer.validated_data['file']
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            for chunk in uploaded_file.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name
        
        try:
            classifier = get_classifier()
            result = classifier.process_document(tmp_file_path)
            os.unlink(tmp_file_path)
            
            if result['success']:
                parser = DocumentParser()
                structured = parser.parse_document(
                    result['extracted_text'],
                    result['predicted_class']
                )
                
                return Response({
                    'predicted_class': result['predicted_class'],
                    'confidence': result['confidence'],
                    'confidence_percentage': round(result['confidence'] * 100, 2),
                    'all_probabilities': result['all_probabilities'],
                    'extracted_text': result['extracted_text'],
                    'text_length': result['text_length'],
                    'structured_data': structured,
                    'processing_time': result['processing_time']
                })
            else:
                return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def structured_text(self, request, pk=None):
        """GET /api/documents/{id}/structured_text/"""
        document = self.get_object()
        
        if document.owner != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if not document.processed:
            return Response({'error': 'Document non traité'}, status=status.HTTP_400_BAD_REQUEST)
        
        text_html = document.extracted_text.replace('\n', '<br>')
        
        serializer = StructuredTextSerializer({
            'document_id': document.id,
            'predicted_class': document.predicted_class,
            'formats': {
                'raw': document.extracted_text,
                'html': text_html,
                'structured': document.structured_data or {}
            }
        })
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        """GET /api/documents/my_documents/"""
        documents = Document.objects.filter(owner=request.user)
        
        page = self.paginate_queryset(documents)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """GET /api/documents/statistics/"""
        user = request.user
        
        if user.role == 'admin':
            queryset = Document.objects.all()
        else:
            queryset = Document.objects.filter(owner=user)
        
        stats = queryset.aggregate(
            total=Count('id'),
            processed=Count('id', filter=Q(processed=True)),
            avg_confidence=Avg('confidence'),
            factures=Count('id', filter=Q(predicted_class='factures')),
            contrats=Count('id', filter=Q(predicted_class='contrats')),
            cartes_identite=Count('id', filter=Q(predicted_class='cartes_identite'))
        )
        
        stats['user'] = {
            'id': user.id,
            'email': user.email,
            'role': user.role
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def model_info(self, request):
        """GET /api/documents/model_info/"""
        try:
            classifier = get_classifier()
            config_info = classifier.get_config_info()
            
            return Response({
                'model_config': config_info,
                'status': 'loaded',
                'available_classes': config_info['classes']
            })
        except Exception as e:
            return Response(
                {'error': str(e), 'status': 'error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )