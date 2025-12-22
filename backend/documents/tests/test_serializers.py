"""
Tests pour les serializers de l'application documents
"""
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from documents.models import Document, ClassificationLog
from documents.serializers import (
    DocumentUploadSerializer,
    DocumentSerializer,
    StructuredTextSerializer,
    ClassificationLogSerializer
)

User = get_user_model()


@pytest.mark.django_db
class TestDocumentUploadSerializer:
    """Tests pour DocumentUploadSerializer"""
    
    def test_valid_file_upload(self):
        """✅ Test : Upload de fichier valide"""
        file = SimpleUploadedFile(
            name='test_doc.jpg',
            content=b'fake image content',
            content_type='image/jpeg'
        )
        
        data = {'file': file}
        serializer = DocumentUploadSerializer(data=data)
        
        assert serializer.is_valid()
        assert serializer.validated_data['file'].name == 'test_doc.jpg'
    
    def test_missing_file(self):
        """✅ Test : Fichier manquant"""
        data = {}
        serializer = DocumentUploadSerializer(data=data)
        
        assert not serializer.is_valid()
        assert 'file' in serializer.errors
    
    def test_multiple_file_types(self):
        """✅ Test : Différents types de fichiers"""
        file_types = [
            ('test.jpg', 'image/jpeg'),
            ('test.png', 'image/png'),
            ('test.pdf', 'application/pdf'),
        ]
        
        for filename, content_type in file_types:
            file = SimpleUploadedFile(
                name=filename,
                content=b'fake content',
                content_type=content_type
            )
            
            data = {'file': file}
            serializer = DocumentUploadSerializer(data=data)
            
            assert serializer.is_valid(), f"Failed for {filename}"


@pytest.mark.django_db
class TestDocumentSerializer:
    """Tests pour DocumentSerializer"""
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='testuser@example.com',
            password='TestPass123!'
        )
    
    @pytest.fixture
    def document(self, user):
        file = SimpleUploadedFile(
            name='test_doc.jpg',
            content=b'fake image content',
            content_type='image/jpeg'
        )
        
        return Document.objects.create(
            file=file,
            original_filename='test_doc.jpg',
            file_size=1024,
            owner=user,
            predicted_class='factures',
            confidence=0.8534,
            extracted_text='Text content here',
            text_length=100,
            processed=True
        )
    
    def test_serialize_document(self, document):
        """✅ Test : Sérialiser un document"""
        factory = APIRequestFactory()
        request = factory.get('/')
        
        serializer = DocumentSerializer(document, context={'request': request})
        data = serializer.data
        
        assert data['id'] == document.id
        assert data['original_filename'] == 'test_doc.jpg'
        assert data['owner_email'] == document.owner.email
        assert data['predicted_class'] == 'factures'
        assert data['confidence'] == 0.8534
        assert data['confidence_percentage'] == 85.34
        assert data['processed'] is True
    
    def test_serialize_document_without_classification(self, user):
        """✅ Test : Document non traité"""
        file = SimpleUploadedFile(
            name='unprocessed.jpg',
            content=b'content',
            content_type='image/jpeg'
        )
        
        doc = Document.objects.create(
            file=file,
            original_filename='unprocessed.jpg',
            file_size=512,
            owner=user,
            processed=False
        )
        
        factory = APIRequestFactory()
        request = factory.get('/')
        
        serializer = DocumentSerializer(doc, context={'request': request})
        data = serializer.data
        
        assert data['processed'] is False
        assert data['predicted_class'] is None
        assert data['confidence_percentage'] == 0
    
    def test_read_only_fields(self, document):
        """✅ Test : Champs en lecture seule"""
        factory = APIRequestFactory()
        request = factory.get('/')
        
        update_data = {
            'predicted_class': 'contrats',  # read-only
            'confidence': 0.95,  # read-only
            'original_filename': 'hacked.jpg'  # modifiable
        }
        
        serializer = DocumentSerializer(
            document,
            data=update_data,
            partial=True,
            context={'request': request}
        )
        
        assert serializer.is_valid()
        updated_doc = serializer.save()
        
        # Les champs read-only ne doivent pas changer
        assert updated_doc.predicted_class == 'factures'
        assert updated_doc.confidence == 0.8534
    
    def test_serialize_with_structured_data(self, user):
        """✅ Test : Document avec données structurées"""
        file = SimpleUploadedFile(
            name='facture.jpg',
            content=b'content',
            content_type='image/jpeg'
        )
        
        structured_data = {
            'numero_facture': 'FR-001',
            'montant_total': '174.00',
            'date': '02/12/2025'
        }
        
        doc = Document.objects.create(
            file=file,
            original_filename='facture.jpg',
            file_size=2048,
            owner=user,
            structured_data=structured_data
        )
        
        factory = APIRequestFactory()
        request = factory.get('/')
        
        serializer = DocumentSerializer(doc, context={'request': request})
        data = serializer.data
        
        assert data['structured_data'] == structured_data
        assert data['structured_data']['numero_facture'] == 'FR-001'


@pytest.mark.django_db
class TestStructuredTextSerializer:
    """Tests pour StructuredTextSerializer"""
    
    def test_serialize_structured_text(self):
        """✅ Test : Sérialiser du texte structuré"""
        data = {
            'document_id': 1,
            'predicted_class': 'factures',
            'formats': {
                'raw': 'Raw text here',
                'html': 'Raw text here<br>',
                'structured': {'numero': 'FR-001'}
            }
        }
        
        serializer = StructuredTextSerializer(data)
        serialized_data = serializer.data
        
        assert serialized_data['document_id'] == 1
        assert serialized_data['predicted_class'] == 'factures'
        assert 'raw' in serialized_data['formats']
        assert 'html' in serialized_data['formats']
        assert 'structured' in serialized_data['formats']
    
    def test_validate_structured_text_data(self):
        """✅ Test : Validation des données"""
        data = {
            'document_id': 1,
            'predicted_class': 'contrats',
            'formats': {
                'raw': 'Text',
                'html': '<p>Text</p>',
                'structured': {}
            }
        }
        
        serializer = StructuredTextSerializer(data=data)
        assert serializer.is_valid()


@pytest.mark.django_db
class TestClassificationLogSerializer:
    """Tests pour ClassificationLogSerializer"""
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='Pass123!'
        )
    
    @pytest.fixture
    def document(self, user):
        file = SimpleUploadedFile(
            name='doc.jpg',
            content=b'content',
            content_type='image/jpeg'
        )
        
        return Document.objects.create(
            file=file,
            original_filename='doc.jpg',
            file_size=1024,
            owner=user
        )
    
    @pytest.fixture
    def log(self, document, user):
        return ClassificationLog.objects.create(
            document=document,
            user=user,
            action='upload',
            details={'filename': 'doc.jpg'},
            success=True
        )
    
    def test_serialize_log(self, log):
        """✅ Test : Sérialiser un log"""
        serializer = ClassificationLogSerializer(log)
        data = serializer.data
        
        assert data['id'] == log.id
        assert data['user_email'] == log.user.email
        assert data['document_name'] == log.document.original_filename
        assert data['action'] == 'upload'
        assert data['success'] is True
        assert 'timestamp' in data
    
    def test_serialize_multiple_logs(self, document, user):
        """✅ Test : Sérialiser plusieurs logs"""
        logs = [
            ClassificationLog.objects.create(
                document=document,
                user=user,
                action='upload',
                success=True
            ),
            ClassificationLog.objects.create(
                document=document,
                user=user,
                action='classification',
                success=True
            ),
            ClassificationLog.objects.create(
                document=document,
                user=user,
                action='export_pdf',
                success=True
            )
        ]
        
        serializer = ClassificationLogSerializer(logs, many=True)
        data = serializer.data
        
        assert len(data) == 3
        assert data[0]['action'] == 'upload'
        assert data[1]['action'] == 'classification'
        assert data[2]['action'] == 'export_pdf'
    
    def test_log_with_details(self, document, user):
        """✅ Test : Log avec détails"""
        details = {
            'predicted_class': 'factures',
            'confidence': 0.95,
            'processing_time': 2.5
        }
        
        log = ClassificationLog.objects.create(
            document=document,
            user=user,
            action='classification',
            details=details,
            success=True
        )
        
        serializer = ClassificationLogSerializer(log)
        data = serializer.data
        
        assert data['details'] == details
        assert data['details']['predicted_class'] == 'factures'
    
    def test_log_without_user(self, document):
        """✅ Test : Log sans utilisateur"""
        log = ClassificationLog.objects.create(
            document=document,
            action='system_action',
            success=True,
            user=None  # ✅ Explicitement None
        )
        
        serializer = ClassificationLogSerializer(log)
        data = serializer.data
        
        # Vérifier que le champ existe et est None
        assert 'user_email' in data
        assert data['user_email'] is None