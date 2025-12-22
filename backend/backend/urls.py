"""
URLs principales du projet
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from backend.health import health_check, readiness_check, liveness_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),  
    path('api/admin/', include('adminmanagement.urls')),
    path('api/', include('documents.urls')),

    # ⭐ NOUVEAU: Health check endpoints pour Kubernetes
    path('api/health/', health_check, name='health_check'),
    path('api/ready/', readiness_check, name='readiness_check'),
    path('api/live/', liveness_check, name='liveness_check'),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)