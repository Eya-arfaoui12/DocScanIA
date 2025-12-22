"""
Tests unitaires pour le modèle User
"""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from datetime import date

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Tests pour le modèle CustomUser"""
    
    def test_create_user_with_email(self):
        """✅ Test : Créer un utilisateur avec email"""
        user = User.objects.create_user(
            email='newuser@example.com',
            password='SecurePass123!',
            role='user'  # ✅ Ajout du rôle
        )
        
        assert user.email == 'newuser@example.com'
        assert user.role == 'user'
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False
        assert user.check_password('SecurePass123!')
    
    def test_create_superuser(self):
        """✅ Test : Créer un superuser"""
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='AdminPass123!'
        )
        
        assert admin.role == 'admin'  # ✅ Vérifier le rôle admin
        assert admin.is_staff is True
        assert admin.is_superuser is True
        assert admin.is_active is True
    
    def test_user_string_representation(self):
        """✅ Test : Représentation string du User"""
        user = User.objects.create_user(
            email='test@example.com',
            password='pass'
        )
        
        assert str(user) == 'test@example.com'
    
    def test_email_is_required(self):
        """✅ Test : Email obligatoire"""
        with pytest.raises(ValueError, match='Email is a required field'):
            User.objects.create_user(email='', password='pass')
    
    def test_email_is_unique(self):
        """✅ Test : Email unique"""
        User.objects.create_user(
            email='duplicate@example.com',
            password='pass'
        )
        
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                email='duplicate@example.com',
                password='pass'
            )
    
    def test_user_with_birthday(self):
        """✅ Test : Utilisateur avec date de naissance"""
        user = User.objects.create_user(
            email='user@example.com',
            password='pass',
            birthday=date(1990, 1, 15)
        )
        
        assert user.birthday == date(1990, 1, 15)
    
    def test_user_with_image(self):
        """✅ Test : Utilisateur avec image"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'fake image content',
            content_type='image/jpeg'
        )
        
        user = User.objects.create_user(
            email='user@example.com',
            password='pass',
            image=image
        )
        
        assert user.image is not None
        assert 'test_image' in user.image.name