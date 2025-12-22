"""
Tests pour les views de l'application accounts
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from knox.models import AuthToken
from accounts.models import PasswordResetToken

User = get_user_model()


@pytest.mark.django_db
class TestRegisterViewset:
    """Tests pour l'inscription"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    def test_register_user_success(self, client):
        """✅ Test : Inscription réussie"""
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'role': 'user'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'token' in response.data
        assert response.data['user']['email'] == 'newuser@example.com'
        
        # Vérifier que l'utilisateur existe
        assert User.objects.filter(email='newuser@example.com').exists()
    
    def test_register_with_existing_email(self, client):
        """✅ Test : Email déjà utilisé"""
        User.objects.create_user(
            email='existing@example.com',
            password='pass'
        )
        
        url = reverse('register')
        data = {
            'email': 'existing@example.com',
            'password': 'NewPass123!',
            'password2': 'NewPass123!',
            'role': 'user'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data
    
    def test_register_with_mismatched_passwords(self, client):
        """✅ Test : Mots de passe différents"""
        url = reverse('register')
        data = {
            'email': 'user@example.com',
            'password': 'Pass123!',
            'password2': 'DifferentPass123!',
            'role': 'user'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_without_email(self, client):
        """✅ Test : Sans email"""
        url = reverse('register')
        data = {
            'password': 'Pass123!',
            'password2': 'Pass123!',
            'role': 'user'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data


@pytest.mark.django_db
class TestLoginViewset:
    """Tests pour la connexion"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='testuser@example.com',
            password='TestPass123!',
            role='user'
        )
    
    def test_login_success(self, client, user):
        """✅ Test : Connexion réussie"""
        url = reverse('login')
        data = {
            'email': 'testuser@example.com',
            'password': 'TestPass123!'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'user' in response.data
        assert 'token' in response.data
        assert response.data['user']['email'] == 'testuser@example.com'
    
    def test_login_with_wrong_password(self, client, user):
        """✅ Test : Mauvais mot de passe"""
        url = reverse('login')
        data = {
            'email': 'testuser@example.com',
            'password': 'WrongPassword123!'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'error' in response.data
    
    def test_login_with_nonexistent_user(self, client):
        """✅ Test : Utilisateur inexistant"""
        url = reverse('login')
        data = {
            'email': 'nonexistent@example.com',
            'password': 'Pass123!'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_without_email(self, client):
        """✅ Test : Sans email"""
        url = reverse('login')
        data = {
            'password': 'Pass123!'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data


@pytest.mark.django_db
class TestUserViewset:
    """Tests pour les endpoints utilisateur"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='Pass123!',
            role='user'
        )
    
    @pytest.fixture
    def admin(self):
        return User.objects.create_superuser(
            email='admin@example.com',
            password='AdminPass123!'
        )
    
    @pytest.fixture
    def authenticated_client(self, client, user):
        """Client avec authentification"""
        _, token = AuthToken.objects.create(user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    @pytest.fixture
    def admin_client(self, client, admin):
        """Client admin authentifié"""
        _, token = AuthToken.objects.create(admin)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return client
    
    def test_get_me_success(self, authenticated_client, user):
        """✅ Test : Récupérer son profil"""
        url = reverse('users-me')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
        assert response.data['role'] == user.role
    
    def test_get_me_without_auth(self, client):
        """✅ Test : Sans authentification"""
        url = reverse('users-me')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_profile(self, authenticated_client, user):
        """✅ Test : Mettre à jour son profil"""
        url = reverse('users-me')
        data = {
            'username': 'Updated Username'
        }
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'Updated Username'
        
        # Vérifier en base de données
        user.refresh_from_db()
        assert user.username == 'Updated Username'
    
    def test_change_password_success(self, authenticated_client, user):
        """✅ Test : Changer son mot de passe"""
        url = reverse('users-change-password')
        data = {
            'current_password': 'Pass123!',
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        
        # Vérifier que le nouveau mot de passe fonctionne
        user.refresh_from_db()
        assert user.check_password('NewSecurePass123!')
    
    def test_change_password_wrong_current(self, authenticated_client):
        """✅ Test : Ancien mot de passe incorrect"""
        url = reverse('users-change-password')
        data = {
            'current_password': 'WrongPass123!',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_list_users_as_admin(self, admin_client, user, admin):
        """✅ Test : Liste des utilisateurs (admin)"""
        url = reverse('users-list')
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2  # admin + user
    
    def test_list_users_as_regular_user(self, authenticated_client):
        """✅ Test : Liste des utilisateurs (user normal)"""
        url = reverse('users-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestPasswordResetViewset:
    """Tests pour la réinitialisation de mot de passe"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='OldPass123!'
        )
    
    def test_request_password_reset(self, client, user, mailoutbox):
        """✅ Test : Demander une réinitialisation"""
        url = reverse('password-reset-request-reset')
        data = {'email': 'user@example.com'}
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        
        # Vérifier qu'un token a été créé
        assert PasswordResetToken.objects.filter(user=user, used=False).exists()
        
        # Vérifier qu'un email a été envoyé (avec pytest-django)
        assert len(mailoutbox) == 1
        assert mailoutbox[0].to == ['user@example.com']
    
    def test_request_reset_nonexistent_email(self, client, mailoutbox):
        """✅ Test : Email inexistant (ne révèle pas l'existence)"""
        url = reverse('password-reset-request-reset')
        data = {'email': 'nonexistent@example.com'}
        
        response = client.post(url, data, format='json')
        
        # Devrait retourner 200 pour ne pas révéler si l'email existe
        assert response.status_code == status.HTTP_200_OK
        
        # Mais aucun email envoyé
        assert len(mailoutbox) == 0
    
    def test_validate_token_valid(self, client, user):
        """✅ Test : Valider un token valide"""
        reset_token = PasswordResetToken.objects.create(user=user)
        
        url = reverse('password-reset-validate-token', kwargs={'token': reset_token.token})
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['valid'] is True
    
    def test_validate_token_invalid(self, client):
        """✅ Test : Token invalide"""
        url = reverse('password-reset-validate-token', kwargs={'token': 'invalid-token'})
        response = client.get(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['valid'] is False
    
    def test_validate_token_expired(self, client, user):
        """✅ Test : Token expiré"""
        from django.utils import timezone
        from datetime import timedelta
        
        expired_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() - timedelta(hours=2)
        )
        
        url = reverse('password-reset-validate-token', kwargs={'token': expired_token.token})
        response = client.get(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['valid'] is False
    
    def test_confirm_password_reset(self, client, user):
        """✅ Test : Confirmer la réinitialisation"""
        reset_token = PasswordResetToken.objects.create(user=user)
        
        url = reverse('password-reset-confirm-reset')
        data = {
            'token': reset_token.token,
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        
        # Vérifier que le mot de passe a changé
        user.refresh_from_db()
        assert user.check_password('NewSecurePass123!')
        
        # Vérifier que le token est marqué comme utilisé
        reset_token.refresh_from_db()
        assert reset_token.used is True
    
    def test_confirm_with_mismatched_passwords(self, client, user):
        """✅ Test : Mots de passe différents"""
        reset_token = PasswordResetToken.objects.create(user=user)
        
        url = reverse('password-reset-confirm-reset')
        data = {
            'token': reset_token.token,
            'new_password': 'NewPass123!',
            'confirm_password': 'DifferentPass123!'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_logout(self, client, user):
        """✅ Test : Déconnexion"""
        _, token = AuthToken.objects.create(user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        url = reverse('knox_logout')
        response = client.post(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Vérifier que le token n'est plus valide
        response = client.get(reverse('users-me'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED