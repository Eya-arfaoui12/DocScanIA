"""
Tests pour les views de l'application documents
"""
import pytest
import json
from unittest.mock import patch, MagicMock
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from knox.models import AuthToken
from documents.models import Document, ClassificationLog

User = get_user_model()


@pytest.mark.django_db
class TestDocumentUpload:
    """Tests pour l'upload de documents"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='Pass123!'
        )
    
    @pytest.fixture
    def authenticated_client(self, client, user):
        _, token = AuthToken.objects.create(user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    @pytest.fixture
    def mock_classifier(self):
        """Mock du service ML"""
        with patch('documents.views.get_classifier') as mock:
            classifier = MagicMock()
            classifier.process_document.return_value = {
                'success': True,
                'predicted_class': 'factures',
                'confidence': 0.95,
                'all_probabilities': {
                    'factures': 0.95,
                    'contrats': 0.03,
                    'cartes_identite': 0.02
                },
                'extracted_text': 'FACTURE N° FR-001\nDate: 02/12/2025\nTotal: 174.00 €',
                'extracted_text_raw': 'FACTURE N° FR-001 Date: 02/12/2025 Total: 174.00 €',
                'text_length': 100,
                'processing_time': 1.5
            }
            mock.return_value = classifier
            yield mock
    
    def test_upload_document_success(self, authenticated_client, mock_classifier):
        """✅ Test : Upload réussi avec classification"""
        file = SimpleUploadedFile(
            name='facture.jpg',
            content=b'fake image content',
            content_type='image/jpeg'
        )
        
        url = reverse('document-list')
        data = {'file': file}
        
        response = authenticated_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['original_filename'] == 'facture.jpg'
        assert response.data['predicted_class'] == 'factures'
        assert response.data['confidence'] == 0.95
        assert response.data['processed'] is True
        
        # Vérifier que le document existe en DB
        assert Document.objects.filter(original_filename='facture.jpg').exists()
        
        # Vérifier les logs
        doc = Document.objects.get(original_filename='facture.jpg')
        assert ClassificationLog.objects.filter(document=doc, action='upload').exists()
        assert ClassificationLog.objects.filter(document=doc, action='classification').exists()
    
    def test_upload_without_authentication(self, client):
        """✅ Test : Upload sans authentification"""
        file = SimpleUploadedFile(
            name='doc.jpg',
            content=b'content',
            content_type='image/jpeg'
        )
        
        url = reverse('document-list')
        data = {'file': file}
        
        response = client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_upload_without_file(self, authenticated_client):
        """✅ Test : Upload sans fichier"""
        url = reverse('document-list')
        data = {}
        
        response = authenticated_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    @patch('documents.views.get_classifier')
    def test_upload_with_classification_error(self, mock_classifier, authenticated_client):
        """✅ Test : Erreur lors de la classification"""
        classifier = MagicMock()
        classifier.process_document.return_value = {
            'success': False,
            'error': 'OCR extraction failed'
        }
        mock_classifier.return_value = classifier
        
        file = SimpleUploadedFile(
            name='bad_doc.jpg',
            content=b'content',
            content_type='image/jpeg'
        )
        
        url = reverse('document-list')
        data = {'file': file}
        
        response = authenticated_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED
        doc = Document.objects.get(original_filename='bad_doc.jpg')
        assert doc.processed is False
        assert doc.error_message == 'OCR extraction failed'


@pytest.mark.django_db
class TestDocumentRetrieval:
    """Tests pour la récupération de documents"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='Pass123!'
        )
    
    @pytest.fixture
    def other_user(self):
        return User.objects.create_user(
            email='other@example.com',
            password='Pass123!'
        )
    
    @pytest.fixture
    def admin(self):
        return User.objects.create_superuser(
            email='admin@example.com',
            password='AdminPass123!'
        )
    
    @pytest.fixture
    def authenticated_client(self, client, user):
        _, token = AuthToken.objects.create(user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    @pytest.fixture
    def admin_client(self, client, admin):
        _, token = AuthToken.objects.create(admin)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    @pytest.fixture
    def document(self, user):
        file = SimpleUploadedFile(
            name='test_doc.jpg',
            content=b'content',
            content_type='image/jpeg'
        )
        
        return Document.objects.create(
            file=file,
            original_filename='test_doc.jpg',
            file_size=1024,
            owner=user,
            predicted_class='factures',
            confidence=0.85,
            processed=True
        )
    
    def test_list_own_documents(self, authenticated_client, document):
        """✅ Test : Lister ses propres documents"""
        url = reverse('document-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == document.id
    
    def test_list_documents_as_admin(self, admin_client, document, other_user):
        """✅ Test : Admin voit tous les documents"""
        # Créer un document d'un autre utilisateur
        file = SimpleUploadedFile(
            name='other_doc.jpg',
            content=b'content',
            content_type='image/jpeg'
        )
        Document.objects.create(
            file=file,
            original_filename='other_doc.jpg',
            file_size=512,
            owner=other_user
        )
        
        url = reverse('document-list')
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2
    
    def test_retrieve_own_document(self, authenticated_client, document):
        """✅ Test : Récupérer son propre document"""
        url = reverse('document-detail', kwargs={'pk': document.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == document.id
        assert response.data['original_filename'] == 'test_doc.jpg'
    
    def test_retrieve_other_user_document(self, authenticated_client, other_user):
        """✅ Test : Ne peut pas accéder au document d'un autre"""
        file = SimpleUploadedFile(
            name='private.jpg',
            content=b'content',
            content_type='image/jpeg'
        )
        other_doc = Document.objects.create(
            file=file,
            original_filename='private.jpg',
            file_size=512,
            owner=other_user
        )
        
        url = reverse('document-detail', kwargs={'pk': other_doc.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_own_document(self, authenticated_client, document):
        """✅ Test : Supprimer son propre document"""
        doc_id = document.id
        url = reverse('document-detail', kwargs={'pk': doc_id})
        
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Document.objects.filter(id=doc_id).exists()


@pytest.mark.django_db
class TestDocumentSearch:
    """Tests pour la recherche de documents"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='Pass123!'
        )
    
    @pytest.fixture
    def authenticated_client(self, client, user):
        _, token = AuthToken.objects.create(user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    @pytest.fixture
    def documents(self, user):
        """Créer plusieurs documents de test"""
        docs = []
        
        # Facture
        file1 = SimpleUploadedFile('facture.jpg', b'content', 'image/jpeg')
        docs.append(Document.objects.create(
            file=file1,
            original_filename='facture.jpg',
            file_size=1024,
            owner=user,
            predicted_class='factures',
            confidence=0.95,
            extracted_text='FACTURE N° FR-001',
            processed=True
        ))
        
        # Contrat
        file2 = SimpleUploadedFile('contrat.jpg', b'content', 'image/jpeg')
        docs.append(Document.objects.create(
            file=file2,
            original_filename='contrat.jpg',
            file_size=2048,
            owner=user,
            predicted_class='contrats',
            confidence=0.88,
            extracted_text='CONTRAT DE TRAVAIL',
            processed=True
        ))
        
        # Carte d'identité
        file3 = SimpleUploadedFile('carte.jpg', b'content', 'image/jpeg')
        docs.append(Document.objects.create(
            file=file3,
            original_filename='carte.jpg',
            file_size=1536,
            owner=user,
            predicted_class='cartes_identite',
            confidence=0.92,
            extracted_text='CARTE NATIONALE IDENTITÉ',
            processed=True
        ))
        
        return docs
    
    def test_search_by_text(self, authenticated_client, documents):
        """✅ Test : Recherche par texte"""
        url = reverse('document-search')
        response = authenticated_client.get(url, {'q': 'FACTURE'})
        
        assert response.status_code == status.HTTP_200_OK
        
        # ✅ Gérer la pagination
        assert 'count' in response.data
        assert 'results' in response.data
        assert response.data['count'] == 1
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['original_filename'] == 'facture.jpg'
    
    def test_search_by_class(self, authenticated_client, documents):
        """✅ Test : Filtrer par classe"""
        url = reverse('document-search')
        response = authenticated_client.get(url, {'class': 'contrats'})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['predicted_class'] == 'contrats'
    
    def test_search_by_confidence(self, authenticated_client, documents):
        """✅ Test : Filtrer par confiance minimale"""
        url = reverse('document-search')
        response = authenticated_client.get(url, {'min_confidence': '90'})
        
        assert response.status_code == status.HTTP_200_OK
        # Devrait retourner les documents avec confiance >= 90%
        for doc in response.data['results']:
            assert doc['confidence'] >= 0.90
    
    def test_search_by_date_range(self, authenticated_client, documents):
        """✅ Test : Filtrer par date"""
        from django.utils import timezone
        today = timezone.now().date()
        
        url = reverse('document-search')
        response = authenticated_client.get(url, {
            'date_from': today.isoformat()
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1



@pytest.mark.django_db
class TestDocumentExports:
    """Tests pour les exports de documents"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='Pass123!'
        )
    
    @pytest.fixture
    def authenticated_client(self, client, user):
        _, token = AuthToken.objects.create(user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    @pytest.fixture
    def document(self, user):
        file = SimpleUploadedFile('doc.jpg', b'content', 'image/jpeg')
        return Document.objects.create(
            file=file,
            original_filename='doc.jpg',
            file_size=1024,
            owner=user,
            predicted_class='factures',
            confidence=0.95,
            extracted_text='FACTURE N° FR-001\nTotal: 174.00 €',
            structured_data={'numero_facture': 'FR-001', 'montant_total': '174.00'},
            processed=True
        )
    
    def test_export_json(self, authenticated_client, document):
        """✅ Test : Export JSON"""
        url = reverse('document-export-json', kwargs={'pk': document.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'application/json'
        assert 'attachment' in response['Content-Disposition']
        
        # Vérifier le contenu
        data = json.loads(response.content)
        assert data['filename'] == 'doc.jpg'
        assert data['predicted_class'] == 'factures'
        assert data['structured_data']['numero_facture'] == 'FR-001'
    
    def test_export_csv(self, authenticated_client, document):
        """✅ Test : Export CSV"""
        url = reverse('document-export-csv', kwargs={'pk': document.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
        assert 'attachment' in response['Content-Disposition']
    
    def test_export_txt(self, authenticated_client, document):
        """✅ Test : Export TXT"""
        url = reverse('document-export-txt', kwargs={'pk': document.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/plain'
        assert 'attachment' in response['Content-Disposition']
        assert b'FACTURE' in response.content
    
    def test_export_pdf(self, authenticated_client, document):
        """✅ Test : Export PDF"""
        url = reverse('document-export-pdf', kwargs={'pk': document.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'application/pdf'
        assert 'attachment' in response['Content-Disposition']
    
    def test_export_creates_log(self, authenticated_client, document):
        """✅ Test : Export crée un log"""
        url = reverse('document-export-json', kwargs={'pk': document.id})
        authenticated_client.get(url)
        
        assert ClassificationLog.objects.filter(
            document=document,
            action='export_json'
        ).exists()


@pytest.mark.django_db
class TestDocumentCorrection:
    """Tests pour la correction manuelle"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='Pass123!'
        )
    
    @pytest.fixture
    def authenticated_client(self, client, user):
        _, token = AuthToken.objects.create(user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    @pytest.fixture
    def document(self, user):
        file = SimpleUploadedFile('doc.jpg', b'content', 'image/jpeg')
        return Document.objects.create(
            file=file,
            original_filename='doc.jpg',
            file_size=1024,
            owner=user,
            predicted_class='factures',
            confidence=0.70,
            extracted_text='FACTUR N° FR-001',  # Erreur OCR
            processed=True
        )
    
    def test_correct_classification(self, authenticated_client, document):
        """✅ Test : Corriger la classification"""
        url = reverse('document-correct-classification', kwargs={'pk': document.id})
        data = {
            'predicted_class': 'contrats',
            'structured_data': {'type': 'CDI'}
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        document.refresh_from_db()
        assert document.predicted_class == 'contrats'
        assert document.structured_data.get('manually_validated') is True
        
        # Vérifier le log
        assert ClassificationLog.objects.filter(
            document=document,
            action='manual_correction'
        ).exists()
    
    def test_correct_extracted_text(self, authenticated_client, document):
        """✅ Test : Corriger le texte extrait"""
        url = reverse('document-correct-extracted-text', kwargs={'pk': document.id})
        data = {
            'extracted_text': 'FACTURE N° FR-001',  # Texte corrigé
            'reason': 'Correction erreur OCR'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        document.refresh_from_db()
        assert document.extracted_text == 'FACTURE N° FR-001'
        assert document.structured_data.get('text_manually_corrected') is True
        
        # Vérifier le log
        log = ClassificationLog.objects.filter(
            document=document,
            action='correct_extracted_text'
        ).first()
        assert log is not None
        assert log.details['reason'] == 'Correction erreur OCR'
    
    def test_get_text_for_correction(self, authenticated_client, document):
        """✅ Test : Récupérer le texte pour correction"""
        url = reverse('document-get-text-for-correction', kwargs={'pk': document.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['extracted_text'] == document.extracted_text
        assert response.data['is_corrected'] is False


@pytest.mark.django_db
class TestDocumentStatistics:
    """Tests pour les statistiques"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='Pass123!'
        )
    
    @pytest.fixture
    def authenticated_client(self, client, user):
        _, token = AuthToken.objects.create(user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    @pytest.fixture
    def documents(self, user):
        """Créer plusieurs documents"""
        docs = []
        for i in range(5):
            file = SimpleUploadedFile(f'doc{i}.jpg', b'content', 'image/jpeg')
            docs.append(Document.objects.create(
                file=file,
                original_filename=f'doc{i}.jpg',
                file_size=1024,
                owner=user,
                predicted_class='factures',
                confidence=0.90,
                processed=True
            ))
        return docs
    
    def test_get_statistics(self, authenticated_client, documents):
        """✅ Test : Récupérer les statistiques"""
        url = reverse('document-statistics')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total'] == 5
        assert response.data['processed'] == 5
        assert response.data['factures'] == 5
        assert 'avg_confidence' in response.data
    
    def test_dashboard_stats(self, authenticated_client, documents):
        """✅ Test : Stats du dashboard"""
        url = reverse('document-dashboard-stats')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_documents'] == 5
        assert response.data['processed_documents'] == 5
        assert 'documents_by_class' in response.data
        assert 'monthly_uploads' in response.data
        assert 'recent_documents' in response.data