"""
Serializers pour l'API REST avec authentification
"""

from rest_framework import serializers
from .models import Document, ClassificationLog


class DocumentUploadSerializer(serializers.Serializer):
    """Serializer pour l'upload de documents"""
    file = serializers.FileField()


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer complet pour les documents"""
    
    confidence_percentage = serializers.ReadOnlyField()
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_role = serializers.CharField(source='owner.role', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id',
            'file',
            'original_filename',
            'file_size',
            'owner_email',
            'owner_role',
            'predicted_class',
            'confidence',
            'confidence_percentage',
            'probability_factures',
            'probability_contrats',
            'probability_cartes_identite',
            'extracted_text',
            'extracted_text_raw',
            'text_length',
            'structured_data',
            'processed',
            'processing_time',
            'error_message',
            'uploaded_at',
            'processed_at'
        ]
        read_only_fields = [
            'predicted_class',
            'confidence',
            'extracted_text',
            'extracted_text_raw',
            'text_length',
            'structured_data',
            'processed',
            'processing_time',
            'uploaded_at',
            'processed_at',
            'owner_email',
            'owner_role'
        ]


class StructuredTextSerializer(serializers.Serializer):
    """Serializer pour le texte structuré"""
    document_id = serializers.IntegerField()
    predicted_class = serializers.CharField()
    formats = serializers.DictField()


class ClassificationLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs"""
    
    user_email = serializers.SerializerMethodField()  # ✅ CHANGEMENT ICI
    document_name = serializers.CharField(source='document.original_filename', read_only=True)
    
    class Meta:
        model = ClassificationLog
        fields = [
            'id',
            'document',
            'document_name',
            'user_email',
            'timestamp',
            'action',
            'details',
            'success'
        ]
        read_only_fields = fields
    
    def get_user_email(self, obj):  # ✅ AJOUT
        """Retourne l'email ou None si pas d'utilisateur"""
        return obj.user.email if obj.user else None