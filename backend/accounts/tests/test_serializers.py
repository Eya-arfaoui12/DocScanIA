"""
Tests pour les serializers de l'application accounts
"""
import pytest
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model
from accounts.serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserDetailSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from accounts.models import PasswordResetToken

User = get_user_model()


@pytest.mark.django_db
class TestRegisterSerializer:
    """Tests pour RegisterSerializer"""
    
    def test_valid_registration_data(self):
        """✅ Test : Données d'inscription valides"""
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'role': 'user'
        }
        
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid()
        
        user = serializer.save()
        assert user.email == 'newuser@example.com'
        assert user.check_password('SecurePass123!')
        assert user.role == 'user'
    
    def test_passwords_must_match(self):
        """✅ Test : Les mots de passe doivent correspondre"""
        data = {
            'email': 'user@example.com',
            'password': 'Password123!',
            'password2': 'DifferentPass123!',
            'role': 'user'
        }
        
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        # ✅ CORRECTION : L'erreur est dans 'password2' maintenant
        assert 'password2' in serializer.errors
    
    def test_email_already_exists(self):
        """✅ Test : Email déjà utilisé"""
        User.objects.create_user(
            email='existing@example.com',
            password='pass'
        )
        
        data = {
            'email': 'existing@example.com',
            'password': 'NewPass123!',
            'password2': 'NewPass123!',
            'role': 'user'
        }
        
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors
    
    def test_password_too_short(self):
        """✅ Test : Mot de passe trop court"""
        data = {
            'email': 'user@example.com',
            'password': 'short',
            'password2': 'short',
            'role': 'user'
        }
        
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()


@pytest.mark.django_db
class TestLoginSerializer:
    """Tests pour LoginSerializer"""
    
    def test_valid_login_data(self):
        """✅ Test : Données de connexion valides"""
        data = {
            'email': 'user@example.com',
            'password': 'Password123!'
        }
        
        serializer = LoginSerializer(data=data)
        assert serializer.is_valid()
    
    def test_missing_email(self):
        """✅ Test : Email manquant"""
        data = {
            'password': 'Password123!'
        }
        
        serializer = LoginSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors
    
    def test_missing_password(self):
        """✅ Test : Mot de passe manquant"""
        data = {
            'email': 'user@example.com'
        }
        
        serializer = LoginSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors


@pytest.mark.django_db
class TestUserDetailSerializer:
    """Tests pour UserDetailSerializer"""
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='test@example.com',
            password='TestPass123!',
            role='user'
        )
    
    def test_serialize_user(self, user):
        """✅ Test : Sérialiser un utilisateur"""
        factory = APIRequestFactory()
        request = factory.get('/')
        
        serializer = UserDetailSerializer(user, context={'request': request})
        data = serializer.data
        
        assert data['email'] == 'test@example.com'
        assert data['role'] == 'user'
        assert 'id' in data
        assert 'password' not in data  # Le mot de passe ne doit pas être exposé
    
    def test_update_user_profile(self, user):
        """✅ Test : Mettre à jour le profil"""
        factory = APIRequestFactory()
        request = factory.patch('/')
        
        update_data = {
            'username': 'Updated Username'
        }
        
        serializer = UserDetailSerializer(
            user,
            data=update_data,
            partial=True,
            context={'request': request}
        )
        
        assert serializer.is_valid()
        updated_user = serializer.save()
        assert updated_user.username == 'Updated Username'
    
    def test_cannot_change_email_to_existing(self, user):
        """✅ Test : Ne peut pas changer vers un email existant"""
        User.objects.create_user(
            email='existing@example.com',
            password='pass'
        )
        
        factory = APIRequestFactory()
        request = factory.patch('/')
        
        update_data = {
            'email': 'existing@example.com'
        }
        
        serializer = UserDetailSerializer(
            user,
            data=update_data,
            partial=True,
            context={'request': request}
        )
        
        assert not serializer.is_valid()
        assert 'email' in serializer.errors


@pytest.mark.django_db
class TestChangePasswordSerializer:
    """Tests pour ChangePasswordSerializer"""
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='OldPass123!'
        )
    
    def test_change_password_success(self, user):
        """✅ Test : Changement de mot de passe réussi"""
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user
        
        data = {
            'current_password': 'OldPass123!',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        }
        
        serializer = ChangePasswordSerializer(data=data, context={'request': request})
        assert serializer.is_valid()
    
    def test_wrong_current_password(self, user):
        """✅ Test : Ancien mot de passe incorrect"""
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user
        
        data = {
            'current_password': 'WrongPass123!',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        }
        
        serializer = ChangePasswordSerializer(data=data, context={'request': request})
        assert not serializer.is_valid()
        assert 'current_password' in serializer.errors
    
    def test_passwords_must_match(self, user):
        """✅ Test : Les nouveaux mots de passe doivent correspondre"""
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user
        
        data = {
            'current_password': 'OldPass123!',
            'new_password': 'NewPass123!',
            'confirm_password': 'DifferentPass123!'
        }
        
        serializer = ChangePasswordSerializer(data=data, context={'request': request})
        assert not serializer.is_valid()


@pytest.mark.django_db
class TestPasswordResetRequestSerializer:
    """Tests pour PasswordResetRequestSerializer"""
    
    def test_valid_email(self):
        """✅ Test : Email valide"""
        data = {'email': 'user@example.com'}
        serializer = PasswordResetRequestSerializer(data=data)
        assert serializer.is_valid()
    
    def test_invalid_email_format(self):
        """✅ Test : Format d'email invalide"""
        data = {'email': 'not-an-email'}
        serializer = PasswordResetRequestSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors


@pytest.mark.django_db
class TestPasswordResetConfirmSerializer:
    """Tests pour PasswordResetConfirmSerializer"""
    
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='user@example.com',
            password='OldPass123!'
        )
    
    @pytest.fixture
    def reset_token(self, user):
        return PasswordResetToken.objects.create(user=user)
    
    def test_valid_password_reset(self, reset_token):
        """✅ Test : Réinitialisation valide"""
        data = {
            'token': reset_token.token,
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!'
        }
        
        serializer = PasswordResetConfirmSerializer(data=data)
        assert serializer.is_valid()
        
        user = serializer.save()
        assert user.check_password('NewSecurePass123!')
    
    def test_invalid_token(self):
        """✅ Test : Token invalide"""
        data = {
            'token': 'invalid-token-xyz',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        }
        
        serializer = PasswordResetConfirmSerializer(data=data)
        assert not serializer.is_valid()
        assert 'token' in serializer.errors
    
    def test_expired_token(self, user):
        """✅ Test : Token expiré"""
        from django.utils import timezone
        from datetime import timedelta
        
        expired_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() - timedelta(hours=2)
        )
        
        data = {
            'token': expired_token.token,
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        }
        
        serializer = PasswordResetConfirmSerializer(data=data)
        assert not serializer.is_valid()
        assert 'token' in serializer.errors
    
    def test_passwords_must_match(self, reset_token):
        """✅ Test : Les mots de passe doivent correspondre"""
        data = {
            'token': reset_token.token,
            'new_password': 'NewPass123!',
            'confirm_password': 'DifferentPass123!'
        }
        
        serializer = PasswordResetConfirmSerializer(data=data)
        assert not serializer.is_valid()