from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, PasswordResetToken


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Admin personnalisé pour CustomUser"""
    model = CustomUser
    
    list_display = ('email', 'username', 'role', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('role', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'username')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'birthday', 'image')}),
        ('Permissions', {'fields': ('role', 'is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'is_staff', 'is_active')}
        ),
    )
    
    readonly_fields = ('date_joined', 'last_login')


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """Admin pour les tokens de réinitialisation"""
    list_display = ('user', 'token_preview', 'created_at', 'expires_at', 'used', 'is_valid_status', 'ip_address')
    list_filter = ('used', 'created_at', 'expires_at')
    search_fields = ('user__email', 'token', 'ip_address')
    readonly_fields = ('token', 'created_at', 'expires_at', 'user', 'ip_address')
    ordering = ('-created_at',)
    
    def token_preview(self, obj):
        if len(obj.token) > 10:
            return f"{obj.token[:6]}...{obj.token[-4:]}"
        return obj.token
    token_preview.short_description = 'Token'
    
    def is_valid_status(self, obj):
        return obj.is_valid()
    is_valid_status.boolean = True
    is_valid_status.short_description = 'Valid'
    
    def has_add_permission(self, request):
        return False
    
    actions = ['mark_as_used', 'delete_expired_tokens']
    
    def mark_as_used(self, request, queryset):
        updated = queryset.filter(used=False).update(used=True)
        self.message_user(request, f'{updated} token(s) marked as used.')
    mark_as_used.short_description = 'Mark selected tokens as used'
    
    def delete_expired_tokens(self, request, queryset):
        from django.utils import timezone
        expired = queryset.filter(expires_at__lt=timezone.now())
        count = expired.count()
        expired.delete()
        self.message_user(request, f'{count} expired token(s) deleted.')
    delete_expired_tokens.short_description = 'Delete expired tokens'


admin.site.site_header = "OCR Backend Administration"
admin.site.site_title = "OCR Admin"
admin.site.index_title = "Welcome to OCR Administration"