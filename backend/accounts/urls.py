# accounts/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from knox import views as knox_views
from .views import (
    RegisterViewset, 
    LoginViewset, 
    UserViewset,
    PasswordResetViewset
)

router = DefaultRouter()
router.register('users', UserViewset, basename='users')
router.register('password-reset', PasswordResetViewset, basename='password-reset')

urlpatterns = [
    # ✅ ENDPOINTS PUBLICS (sans authentification)
    path('register/', RegisterViewset.as_view({'post': 'create'}), name='register'),
    path('login/', LoginViewset.as_view({'post': 'create'}), name='login'),
    
    # ✅ ENDPOINTS PROTÉGÉS (avec authentification Knox)
    path('logout/', knox_views.LogoutView.as_view(), name='knox_logout'),
    path('logoutall/', knox_views.LogoutAllView.as_view(), name='knox_logoutall'),
] + router.urls