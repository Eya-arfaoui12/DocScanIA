from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.utils import timezone
from django.utils.html import strip_tags
from django.core.mail import EmailMultiAlternatives

from knox.models import AuthToken

from .models import PasswordResetToken
from .serializers import (
    RegisterSerializer, 
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserDetailSerializer,
    ChangePasswordSerializer
)

User = get_user_model()


class RegisterViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        """POST /accounts/register/"""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # ✅ CORRECTION : Créer un token pour l'utilisateur
            _, token = AuthToken.objects.create(user)
            
            return Response({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "image": request.build_absolute_uri(user.image.url) if user.image else None
                },
                "token": token  # ✅ Retourner le token
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        """POST /accounts/login/"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            user = authenticate(request, email=email, password=password)
            
            if user:
                _, token = AuthToken.objects.create(user)
                return Response({
                    "user": {
                        "id": user.id, 
                        "email": user.email, 
                        "role": user.role,
                        "image": request.build_absolute_uri(user.image.url) if user.image else None
                    },
                    "token": token
                })
            
            return Response(
                {"error": "Invalid credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewset(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """GET /accounts/users/ - Seuls les admins peuvent voir tous les utilisateurs"""
        if request.user.role != 'admin':
            return Response(
                {"error": "Permission denied"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        users = User.objects.all()
        data = [{"id": u.id, "email": u.email, "role": u.role} for u in users]
        return Response(data)
    
    # ✅ Une seule action qui gère GET, PUT et PATCH sur /me/
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """
        GET /accounts/users/me/ - Récupérer les informations de l'utilisateur connecté
        PUT/PATCH /accounts/users/me/ - Mettre à jour le profil
        """
        if request.method == 'GET':
            serializer = UserDetailSerializer(request.user, context={'request': request})
            return Response(serializer.data)
        
        # PUT ou PATCH
        serializer = UserDetailSerializer(
            request.user, 
            data=request.data, 
            partial=request.method == 'PATCH',
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
     # ✅ NOUVEAU : Endpoint pour changer le mot de passe
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """
        POST /accounts/users/change-password/
        Body: {
            "current_password": "OldPass123!",
            "new_password": "NewPass123!",
            "confirm_password": "NewPass123!"
        }
        """
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Changer le mot de passe
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            
            return Response({
                'message': 'Mot de passe modifié avec succès',
                'success': True
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class PasswordResetViewset(viewsets.ViewSet):
    """
    ViewSet pour gérer la réinitialisation de mot de passe
    """
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'], url_path='request')
    def request_reset(self, request):
        """
        POST /accounts/password-reset/request/
        Body: { "email": "user@example.com" }
        """
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Invalider les anciens tokens
            PasswordResetToken.objects.filter(
                user=user,
                used=False
            ).update(used=True)
            
            # Créer un nouveau token
            reset_token = PasswordResetToken.objects.create(
                user=user,
                ip_address=self._get_client_ip(request)
            )
            
            # URL de réinitialisation
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_url = f"{frontend_url}/reset-password/confirm?token={reset_token.token}"
            
            # Envoyer l'email
            self._send_reset_email(user, reset_url)
            
        except User.DoesNotExist:
            # Pour des raisons de sécurité, ne pas révéler si l'email existe
            pass
        
        return Response({
            'message': 'If an account exists with this email, a password reset link has been sent.',
            'success': True
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='validate/(?P<token>[^/.]+)')
    def validate_token(self, request, token=None):
        """
        GET /accounts/password-reset/validate/{token}/
        """
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            
            if reset_token.is_valid():
                return Response({
                    'valid': True,
                    'message': 'Token is valid'
                }, status=status.HTTP_200_OK)
            else:
                error_message = 'This reset link has already been used.' if reset_token.used else 'This reset link has expired.'
                return Response({
                    'valid': False,
                    'error': error_message
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except PasswordResetToken.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Invalid reset token'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='confirm')
    def confirm_reset(self, request):
        """
        POST /accounts/password-reset/confirm/
        Body: {
            "token": "abc123...",
            "new_password": "NewPass123!",
            "confirm_password": "NewPass123!"
        }
        """
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        
        return Response({
            'message': 'Password has been reset successfully',
            'success': True
        }, status=status.HTTP_200_OK)
    
    def _get_client_ip(self, request):
        """Récupère l'adresse IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _send_reset_email(self, user, reset_url):
        """Envoie l'email de réinitialisation"""
        subject = 'Password Reset Request'
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4F46E5;">Password Reset Request</h2>
                
                <p>Hello {user.email},</p>
                
                <p>You have requested to reset your password. Click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #4F46E5; 
                              color: white; 
                              padding: 12px 30px; 
                              text-decoration: none; 
                              border-radius: 5px; 
                              display: inline-block;
                              font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    <strong>This link will expire in 1 hour.</strong>
                </p>
                
                <p style="color: #666; font-size: 14px;">
                    Link: {reset_url}
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px;">
                    If you didn't request this, please ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_content = strip_tags(html_content)
        
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            print(f"✅ Email sent to {user.email}")
            print(f"🔗 Reset URL: {reset_url}")
            
        except Exception as e:
            print(f"❌ Error sending email: {str(e)}")
            print(f"🔗 Reset URL (console): {reset_url}")