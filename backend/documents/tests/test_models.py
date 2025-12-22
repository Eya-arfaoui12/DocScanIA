"""
Tests unitaires pour le modèle Document
"""
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from documents.models import Document
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestDocumentModel:
    """Tests pour le modèle Document"""
    
    @pytest.fixture
    def user(self):
        """Fixture : Créer un utilisateur"""
        return User.objects.create_user(
            email='testuser@example.com',
            password='TestPass123!'
        )
    
    @pytest.fixture
    def fake_file(self):
        """Fixture : Créer un faux fichier"""
        return SimpleUploadedFile(
            name='test_document.jpg',
            content=b'fake image content',
            content_type='image/jpeg'
        )
    
    def test_create_document(self, user, fake_file):
        """✅ Test : Créer un document"""
        doc = Document.objects.create(
            file=fake_file,
            original_filename='test_document.jpg',
            file_size=1024,
            owner=user
        )
        
        assert doc.original_filename == 'test_document.jpg'
        assert doc.owner == user
        assert doc.file_size == 1024
        assert doc.processed is False
        assert doc.uploaded_at is not None
    
    def test_document_string_representation(self, user, fake_file):
        """✅ Test : Représentation string du Document"""
        doc = Document.objects.create(
            file=fake_file,
            original_filename='my_doc.pdf',
            file_size=2048,
            owner=user,
            predicted_class='factures'
        )
        
        assert 'my_doc.pdf' in str(doc)
        assert user.email in str(doc)
    
    def test_document_confidence_percentage(self, user, fake_file):
        """✅ Test : Pourcentage de confiance"""
        doc = Document.objects.create(
            file=fake_file,
            original_filename='doc.jpg',
            file_size=1024,
            owner=user,
            confidence=0.8534
        )
        
        assert doc.confidence_percentage == 85.34
    
    def test_document_without_confidence(self, user, fake_file):
        """✅ Test : Document sans confiance"""
        doc = Document.objects.create(
            file=fake_file,
            original_filename='doc.jpg',
            file_size=1024,
            owner=user
        )
        
        assert doc.confidence_percentage == 0
    
    def test_document_belongs_to_user(self, user, fake_file):
        """✅ Test : Le document appartient à un utilisateur"""
        doc = Document.objects.create(
            file=fake_file,
            original_filename='doc.jpg',
            file_size=1024,
            owner=user
        )
        
        assert doc.owner.id == user.id
        assert user.documents.filter(id=doc.id).exists()
    
    def test_document_structured_data(self, user, fake_file):
        """✅ Test : Données structurées"""
        structured_data = {
            'numero_facture': 'FR-001',
            'montant_total': '174.00'
        }
        
        doc = Document.objects.create(
            file=fake_file,
            original_filename='facture.jpg',
            file_size=1024,
            owner=user,
            structured_data=structured_data
        )
        
        assert doc.structured_data['numero_facture'] == 'FR-001'
        assert doc.structured_data['montant_total'] == '174.00'