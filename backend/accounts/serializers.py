from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import PasswordResetToken

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret.pop('password', None)
        return ret


class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(  # ✅ AJOUT
        write_only=True,
        required=False,  # ✅ False pour ne pas casser le frontend existant
        style={'input_type': 'password'},
        label='Confirmer le mot de passe'
    )
    role = serializers.ChoiceField(
        choices=User.ROLE_CHOICES,
        default='user'
    )
    image = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'password2', 'username', 'role', 'image', 'birthday')  # ✅ Ajout password2
        extra_kwargs = {
            'password': {
                'write_only': True,
                'min_length': 8  # ✅ Validation longueur
            }
        }

    def validate(self, attrs):
        """✅ Valider password2 SEULEMENT s'il est fourni"""
        password = attrs.get('password')
        password2 = attrs.get('password2')
        
        # ✅ Vérifier seulement si password2 est fourni
        if password2 and password != password2:
            raise serializers.ValidationError({
                'password2': 'Les mots de passe ne correspondent pas.'
            })
        
        return attrs

    def create(self, validated_data):
        # ✅ Retirer password2 s'il existe
        validated_data.pop('password2', None)
        
        role = validated_data.pop('role', 'user')
        image = validated_data.pop('image', None)
        user = User.objects.create_user(role=role, **validated_data)
        if image:
            user.image = image
            user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer pour la demande de réinitialisation de mot de passe
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        value = value.lower().strip()
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer pour confirmer la réinitialisation avec le nouveau mot de passe
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        # Vérifier que les mots de passe correspondent
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        
        # Vérifier la validité du token
        try:
            reset_token = PasswordResetToken.objects.get(token=attrs['token'])
            
            if not reset_token.is_valid():
                if reset_token.used:
                    raise serializers.ValidationError({
                        'token': 'This reset link has already been used. Please request a new one.'
                    })
                else:
                    raise serializers.ValidationError({
                        'token': 'This reset link has expired. Please request a new one.'
                    })
            
            attrs['reset_token'] = reset_token
            
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({
                'token': 'Invalid reset token. Please request a new password reset.'
            })
        
        return attrs
    
    def save(self):
        reset_token = self.validated_data['reset_token']
        new_password = self.validated_data['new_password']
        
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        reset_token.mark_as_used()
        
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer pour afficher et mettre à jour les détails d'un utilisateur
    ✅ Adapté au modèle CustomUser
    """
    image_url = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = (
            'id', 
            'email', 
            'username', 
            'role', 
            'birthday', 
            'image', 
            'image_url',
            'date_joined',
            'is_active'
        )
        read_only_fields = ('id', 'role', 'date_joined')
    
    def get_image_url(self, obj):
        """Retourne l'URL complète de l'image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def validate_email(self, value):
        """Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur"""
        user = self.instance
        if user and User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé par un autre compte.")
        return value
    
    def validate_username(self, value):
        """Vérifier que le username n'est pas déjà utilisé par un autre utilisateur"""
        if not value:  # Permettre les valeurs vides
            return value
        user = self.instance
        if user and User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value
    
    def update(self, instance, validated_data):
        """
        Mise à jour du profil utilisateur
        Gère tous les champs modifiables
        """
        # Mettre à jour les champs texte
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.birthday = validated_data.get('birthday', instance.birthday)
        
        # Gestion de l'image
        if 'image' in validated_data:
            image = validated_data.get('image')
            if image:
                # Supprimer l'ancienne image si elle existe
                if instance.image:
                    instance.image.delete(save=False)
                instance.image = image
            elif image is None:
                # Si image=None, supprimer l'image existante
                if instance.image:
                    instance.image.delete(save=False)
                instance.image = None
        
        instance.save()
        return instance
    
class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer pour changer le mot de passe de l'utilisateur connecté
    """
    current_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        # Vérifier que les nouveaux mots de passe correspondent
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Les mots de passe ne correspondent pas.'
            })
        
        # Vérifier que le nouveau mot de passe est différent de l'ancien
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError({
                'new_password': 'Le nouveau mot de passe doit être différent de l\'ancien.'
            })
        
        return attrs
    
    def validate_current_password(self, value):
        user = self.context.get('request').user
        if not user.check_password(value):
            raise serializers.ValidationError('Le mot de passe actuel est incorrect.')
        return value