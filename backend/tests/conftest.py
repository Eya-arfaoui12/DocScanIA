"""
Configuration globale pour pytest
"""
import pytest
from django.conf import settings
from django.core.management import call_command


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    """
    Configuration de la base de données pour les tests
    """
    with django_db_blocker.unblock():
        # Appliquer les migrations
        call_command('migrate', '--noinput')


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """
    Active l'accès à la DB pour tous les tests
    (Alternative à marquer chaque test avec @pytest.mark.django_db)
    """
    pass


@pytest.fixture
def api_client():
    """
    Fixture pour créer un client API
    """
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def create_user():
    """
    Factory fixture pour créer des utilisateurs
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    def make_user(**kwargs):
        defaults = {
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'role': 'user'
        }
        defaults.update(kwargs)
        
        password = defaults.pop('password')
        user = User.objects.create_user(**defaults)
        user.set_password(password)
        user.save()
        user.raw_password = password  # Pour les tests de login
        return user
    
    return make_user


@pytest.fixture
def create_admin():
    """
    Factory fixture pour créer des admins
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    def make_admin(**kwargs):
        defaults = {
            'email': 'admin@example.com',
            'password': 'AdminPass123!'
        }
        defaults.update(kwargs)
        
        password = defaults.pop('password')
        user = User.objects.create_superuser(**defaults)
        user.raw_password = password
        return user
    
    return make_admin


@pytest.fixture
def authenticated_client(api_client, create_user):
    """
    Client API authentifié avec un utilisateur normal
    """
    from knox.models import AuthToken
    
    user = create_user()
    _, token = AuthToken.objects.create(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
    api_client.user = user
    
    return api_client


@pytest.fixture
def admin_client(api_client, create_admin):
    """
    Client API authentifié avec un admin
    """
    from knox.models import AuthToken
    
    admin = create_admin()
    _, token = AuthToken.objects.create(admin)
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
    api_client.user = admin
    
    return api_client


@pytest.fixture
def create_document():
    """
    Factory fixture pour créer des documents
    """
    from documents.models import Document
    from django.core.files.uploadedfile import SimpleUploadedFile
    
    def make_document(owner, **kwargs):
        defaults = {
            'file': SimpleUploadedFile(
                name='test_doc.jpg',
                content=b'fake content',
                content_type='image/jpeg'
            ),
            'original_filename': 'test_doc.jpg',
            'file_size': 1024,
            'owner': owner
        }
        defaults.update(kwargs)
        
        return Document.objects.create(**defaults)
    
    return make_document


@pytest.fixture
def sample_image():
    """
    Fixture pour créer une image de test
    """
    from django.core.files.uploadedfile import SimpleUploadedFile
    
    return SimpleUploadedFile(
        name='sample.jpg',
        content=b'fake image content',
        content_type='image/jpeg'
    )


@pytest.fixture
def sample_pdf():
    """
    Fixture pour créer un PDF de test
    """
    from django.core.files.uploadedfile import SimpleUploadedFile
    
    return SimpleUploadedFile(
        name='sample.pdf',
        content=b'%PDF-1.4 fake pdf content',
        content_type='application/pdf'
    )


# Configuration pour mocker les services externes
@pytest.fixture
def mock_email_backend(settings):
    """
    Mock le backend d'envoi d'emails
    """
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'


@pytest.fixture
def mock_ml_service():
    """
    Mock le service de classification ML
    """
    from unittest.mock import patch, MagicMock
    
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
            'extracted_text': 'Sample extracted text',
            'extracted_text_raw': 'Sample extracted text',
            'text_length': 100,
            'processing_time': 1.5
        }
        mock.return_value = classifier
        yield classifier


# Markers personnalisés
def pytest_configure(config):
    """
    Configuration des markers personnalisés
    """
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "ml: marks tests that require ML models"
    )