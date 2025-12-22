# Modèle Classification OCR - Django

## Contenu
- model/ : CamemBERT fine-tuné pour classification de documents
- model_config.json : Configuration du modèle
- django_classifier.py : Classe prête pour intégration Django

## Installation

### Dépendances Python
```bash
pip install transformers torch pytesseract pillow opencv-python
```

### Tesseract OCR
```bash
# Ubuntu/Debian
apt-get install tesseract-ocr tesseract-ocr-fra tesseract-ocr-eng

# macOS
brew install tesseract tesseract-lang

# Windows
# Télécharger depuis: https://github.com/UB-Mannheim/tesseract/wiki
```

## Utilisation Django
```python
from django_classifier import OCRDocumentClassifier

# Initialiser le classifier
classifier = OCRDocumentClassifier('path/to/model')

# Classifier une image
result = classifier.process('image.jpg')

# Résultats
print(f"Classe prédite: {result['predicted_class']}")
print(f"Confiance: {result['confidence']:.2%}")
print(f"Texte extrait: {result['extracted_text'][:100]}...")
```

## Structure recommandée
```
your_django_project/
├── ml_models/
│   ├── model/              # Dossier du modèle
│   ├── model_config.json   # Configuration
│   └── django_classifier.py # Classe classifier
├── manage.py
└── your_app/
    └── views.py            # Utiliser classifier ici
```

## Exemple d'intégration dans une vue Django
```python
from django.shortcuts import render
from django.core.files.storage import default_storage
from ml_models.django_classifier import OCRDocumentClassifier
import os

classifier = OCRDocumentClassifier('ml_models/model')

def classify_document(request):
    if request.method == 'POST' and request.FILES.get('document'):
        uploaded_file = request.FILES['document']
        
        # Sauvegarder temporairement
        file_path = default_storage.save(f'temp/{uploaded_file.name}', uploaded_file)
        full_path = os.path.join(default_storage.location, file_path)
        
        # Classifier
        result = classifier.process(full_path)
        
        # Nettoyer
        default_storage.delete(file_path)
        
        return render(request, 'result.html', {'result': result})
    
    return render(request, 'upload.html')
```

## Notes
- Le modèle est basé sur CamemBERT (optimisé pour le français)
- Supporte les images JPG, PNG, PDF
- Extraction OCR avec Tesseract (français et anglais)
- Prédictions avec scores de confiance
