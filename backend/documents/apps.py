"""
Configuration de l'application documents
"""

from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    """Configuration pour l'app documents"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'documents'
    verbose_name = 'Gestion des Documents'
    
    def ready(self):
        """Initialisation au démarrage"""
        # Pré-charger le modèle ML au démarrage
        try:
            from ml_models.ml_service import get_classifier
            get_classifier()
            print("✅ Modèle ML chargé au démarrage")
        except Exception as e:
            print(f"⚠️ Erreur lors du chargement du modèle : {e}")