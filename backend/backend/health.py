"""
Health check endpoints pour Kubernetes
Fichier: backend/health.py
"""

from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError
import os
import sys

def health_check(request):
    """
    Endpoint de santé pour les probes Kubernetes
    GET /api/health/
    
    Vérifie:
    - La connexion à la base de données
    - La disponibilité du modèle ML
    - L'état général de l'application
    """
    health_status = {
        "status": "healthy",
        "checks": {}
    }
    
    status_code = 200
    
    # 1. Vérification de la base de données
    try:
        db_conn = connections['default']
        db_conn.cursor()
        health_status["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except OperationalError as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
        health_status["status"] = "unhealthy"
        status_code = 503
    
    # 2. Vérification du modèle ML (optionnel)
    try:
        from ml_models.ml_service import get_classifier
        classifier = get_classifier()
        if classifier is not None:
            health_status["checks"]["ml_model"] = {
                "status": "healthy",
                "message": "ML model loaded successfully"
            }
        else:
            health_status["checks"]["ml_model"] = {
                "status": "warning",
                "message": "ML model not available"
            }
    except Exception as e:
        health_status["checks"]["ml_model"] = {
            "status": "warning",
            "message": f"ML model check failed: {str(e)}"
        }
        # Ne pas marquer comme unhealthy pour le ML model
    
    # 3. Vérification des dossiers media et static
    try:
        media_path = os.getenv('MEDIA_ROOT', str(settings.MEDIA_ROOT))
        static_path = os.getenv('STATIC_ROOT', str(settings.STATIC_ROOT))
        
        media_exists = os.path.exists(media_path)
        static_exists = os.path.exists(static_path)
        
        if media_exists and static_exists:
            health_status["checks"]["storage"] = {
                "status": "healthy",
                "message": "Media and static directories accessible"
            }
        else:
            health_status["checks"]["storage"] = {
                "status": "warning",
                "message": f"Media: {media_exists}, Static: {static_exists}"
            }
    except Exception as e:
        health_status["checks"]["storage"] = {
            "status": "warning",
            "message": f"Storage check failed: {str(e)}"
        }
    
    # 4. Informations système
    health_status["info"] = {
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "debug_mode": os.getenv('DEBUG', 'False'),
        "environment": os.getenv('ENVIRONMENT', 'development'),
    }
    
    return JsonResponse(health_status, status=status_code)


def readiness_check(request):
    """
    Endpoint de readiness pour Kubernetes
    GET /api/ready/
    
    Vérifie si l'application est prête à recevoir du trafic
    """
    # Vérification rapide de la DB uniquement
    try:
        db_conn = connections['default']
        db_conn.cursor()
        return JsonResponse({
            "status": "ready",
            "message": "Application is ready to receive traffic"
        }, status=200)
    except OperationalError:
        return JsonResponse({
            "status": "not_ready",
            "message": "Database not available"
        }, status=503)


def liveness_check(request):
    """
    Endpoint de liveness pour Kubernetes
    GET /api/live/
    
    Vérifie si l'application est vivante (répond simplement)
    """
    return JsonResponse({
        "status": "alive",
        "message": "Application is running"
    }, status=200)


# Import settings pour accéder aux chemins
from django.conf import settings