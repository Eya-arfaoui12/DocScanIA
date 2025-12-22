from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone
from datetime import timedelta
import secrets


class CustomUserManager(BaseUserManager): 
    def create_user(self, email, password=None, role='user', **extra_fields): 
        if not email: 
            raise ValueError('Email is a required field')
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields): 
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, role='admin', **extra_fields)


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=200, null=True, blank=True)
    birthday = models.DateField(null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    image = models.ImageField(upload_to='user_images/', null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    def __str__(self):
        return self.email


class PasswordResetToken(models.Model):
    """
    Modèle pour gérer les tokens de réinitialisation de mot de passe
    """
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='custom_reset_tokens'
    )
    token = models.CharField(max_length=100, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
    
    def save(self, *args, **kwargs):
        if not self.token:
            # Générer un token sécurisé
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            # Le token expire après 1 heure
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Vérifie si le token est toujours valide"""
        if self.used:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True
    
    def mark_as_used(self):
        """Marque le token comme utilisé"""
        self.used = True
        self.save(update_fields=['used'])
    
    def __str__(self):
        status = "Used" if self.used else ("Expired" if timezone.now() > self.expires_at else "Valid")
        return f"Reset token for {self.user.email} - {status}"