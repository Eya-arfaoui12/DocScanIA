import os
import sys
import zipfile

def download_zip_from_google_drive(file_id, destination_folder):
    """
    Télécharge un fichier ZIP depuis Google Drive et l'extrait
    """
    try:
        import gdown
    except ImportError:
        print("📦 Installation de gdown...")
        os.system(f"{sys.executable} -m pip install gdown")
        import gdown
    
    zip_path = "model_folder.zip"
    
    if os.path.exists(destination_folder) and os.listdir(destination_folder):
        print(f"✅ Le dossier modèle existe déjà : {destination_folder}")
        return True
    
    print(f"📥 Téléchargement du fichier ZIP depuis Google Drive...")
    
    try:
        # Créer le dossier de destination
        os.makedirs(destination_folder, exist_ok=True)
        
        # Télécharger le fichier ZIP
        url = f"https://drive.google.com/uc?id={file_id}"
        print(f"   URL : {url}")
        gdown.download(url, zip_path, quiet=False)
        
        # Extraire
        print("   Extraction des fichiers...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(destination_folder)
        
        # Nettoyer
        os.remove(zip_path)
        
        print(f"✅ Modèle téléchargé et extrait avec succès !")
        return True
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False

if __name__ == "__main__":
    # ⚠️ Remplacer par l'ID du fichier ZIP
    GOOGLE_DRIVE_FILE_ID = "VOTRE_ID_FICHIER_ZIP"
    MODEL_FOLDER = os.path.join("ml_models", "model")
    
    print("=" * 60)
    print("🤖 Téléchargement du modèle")
    print("=" * 60)
    
    success = download_zip_from_google_drive(GOOGLE_DRIVE_FILE_ID, MODEL_FOLDER)
    sys.exit(0 if success else 1)