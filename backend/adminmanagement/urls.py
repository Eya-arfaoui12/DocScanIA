from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminUserViewSet, AdminDocumentViewSet

router = DefaultRouter()
router.register('users', AdminUserViewSet, basename='admin-users')
router.register('documents', AdminDocumentViewSet, basename='admin-documents')

urlpatterns = [
    path('', include(router.urls)),
]