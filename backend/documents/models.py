"""
Modèles pour la gestion des documents
"""

from django.db import models
from django.utils import timezone
from django.conf import settings
import os


def document_upload_path(instance, filename):
    """Génère le chemin de sauvegarde pour les fichiers uploadés"""
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    # Organiser par utilisateur
    user_id = instance.owner.id if instance.owner else 'anonymous'
    return f'uploads/user_{user_id}/{timestamp}_{filename}'


class Document(models.Model):
    """Modèle pour stocker les documents et leurs classifications"""
    
    # Propriétaire du document
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Propriétaire',
        null=True,  # Pour permettre migration
        blank=True
    )
    
    # Fichier
    file = models.FileField(upload_to=document_upload_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text="Taille du fichier en octets")
    
    # Classification
    predicted_class = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        choices=[
            ('factures', 'Factures'),
            ('contrats', 'Contrats'),
            ('cartes_identite', 'Cartes d\'identité'),
        ]
    )
    confidence = models.FloatField(blank=True, null=True)
    
    # Probabilités par classe
    probability_factures = models.FloatField(blank=True, null=True)
    probability_contrats = models.FloatField(blank=True, null=True)
    probability_cartes_identite = models.FloatField(blank=True, null=True)
    
    # Texte extrait (2 versions)
    extracted_text = models.TextField(
        blank=True,
        null=True,
        help_text="Texte avec formatage (retours à la ligne)"
    )
    extracted_text_raw = models.TextField(
        blank=True,
        null=True,
        help_text="Texte brut pour BERT"
    )
    text_length = models.IntegerField(blank=True, null=True)
    
    # Champs structurés (JSON)
    structured_data = models.JSONField(
        blank=True,
        null=True,
        help_text="Données structurées extraites"
    )
    
    # Métadonnées
    processed = models.BooleanField(default=False)
    processing_time = models.FloatField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Document"
        verbose_name_plural = "Documents"
        indexes = [
            models.Index(fields=['owner', '-uploaded_at']),
            models.Index(fields=['predicted_class']),
        ]
    
    def __str__(self):
        owner_name = self.owner.email if self.owner else 'Anonyme'
        return f"{self.original_filename} - {owner_name} - {self.predicted_class or 'Non traité'}"
    
    @property
    def confidence_percentage(self):
        """Retourne la confiance en pourcentage"""
        return round(self.confidence * 100, 2) if self.confidence else 0
    
    def delete(self, *args, **kwargs):
        """Supprime aussi le fichier physique"""
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)


class ClassificationLog(models.Model):
    """Log des classifications pour audit"""
    
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='logs'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=100)
    details = models.JSONField(blank=True, null=True)
    success = models.BooleanField(default=True)
    
    # Utilisateur qui a effectué l'action
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='classification_logs'
    )
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.document.original_filename} - {self.action}"