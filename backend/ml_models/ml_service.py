"""
Service de classification ML pour Django
"""

import os
import time
import cv2
import numpy as np
from PIL import Image
import pytesseract
import torch
from transformers import CamembertTokenizer, CamembertForSequenceClassification
import pickle
from django.conf import settings
import platform

if platform.system() == 'Windows':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


class MLClassifierService:
    """Service pour la classification de documents avec OCR et BERT"""
    
    def __init__(self):
        """Initialise le modèle et le tokenizer"""
        self.model_path = settings.ML_MODEL_PATH
        self.tokenizer = None
        self.model = None
        self.label_encoder = None
        self._load_model()
    
    def _load_model(self):
        """Charge le modèle BERT et le label encoder"""
        try:
            # Charger le tokenizer
            self.tokenizer = CamembertTokenizer.from_pretrained(str(self.model_path))
            
            # Charger le modèle
            self.model = CamembertForSequenceClassification.from_pretrained(str(self.model_path))
            self.model.eval()
            
            # Charger le label encoder
            with open(self.model_path / 'label_encoder.pkl', 'rb') as f:
                self.label_encoder = pickle.load(f)
            
            print("✅ Modèle chargé avec succès")
            
        except Exception as e:
            print(f"❌ Erreur lors du chargement du modèle : {e}")
            raise
    
    def preprocess_image(self, image_path):
        """Prétraite une image pour OCR"""
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Impossible de lire l'image : {image_path}")
        
        # Conversion en niveaux de gris
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Redimensionnement si trop petit
        h, w = gray.shape[:2]
        if h < 1500 or w < 1500:
            scale = max(1500/h, 1500/w)
            new_w, new_h = int(w * scale), int(h * scale)
            gray = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        
        # Débruitage léger
        denoised = cv2.fastNlMeansDenoising(gray, h=5)
        
        # Amélioration du contraste
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(denoised)
        
        # Binarisation Otsu
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return binary
    
    def extract_text(self, image_path):
        """Extrait le texte avec OCR - Retourne 2 versions"""
        try:
            # Prétraiter
            preprocessed = self.preprocess_image(image_path)
            
            # Convertir en PIL Image
            img_pil = Image.fromarray(preprocessed)
            
            # OCR
            custom_config = r'--oem 1 --psm 3'
            text_formatted = pytesseract.image_to_string(
                img_pil,
                lang='fra+eng',
                config=custom_config
            )
            
            # Version brute (pour BERT)
            text_raw = ' '.join(text_formatted.split())
            
            return text_formatted, text_raw
            
        except Exception as e:
            raise Exception(f"Erreur lors de l'extraction OCR : {e}")
    
    def classify_text(self, text):
        """Classifie un texte avec BERT"""
        # Tronquer le texte
        words = text.split()
        text_truncated = ' '.join(words[:400])
        
        # Tokenization
        encoding = self.tokenizer(
            text_truncated,
            add_special_tokens=True,
            max_length=512,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        # Prédiction
        with torch.no_grad():
            outputs = self.model(**encoding)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)
        
        # Résultats
        predicted_class_idx = torch.argmax(probs, dim=-1).item()
        predicted_class = self.label_encoder.classes_[predicted_class_idx]
        confidence = probs[0][predicted_class_idx].item()
        
        # Toutes les probabilités
        all_probs = {
            self.label_encoder.classes_[i]: probs[0][i].item()
            for i in range(len(self.label_encoder.classes_))
        }
        
        return predicted_class, confidence, all_probs
    
    def process_document(self, file_path):
        """Pipeline complet : Image → OCR → Classification"""
        start_time = time.time()
        
        try:
            # Étape 1 : Extraction OCR
            text_formatted, text_raw = self.extract_text(file_path)
            
            if not text_raw or len(text_raw.strip()) < 10:
                return {
                    'success': False,
                    'error': 'Texte extrait trop court ou vide'
                }
            
            # Étape 2 : Classification
            predicted_class, confidence, all_probs = self.classify_text(text_raw)
            
            # Temps de traitement
            processing_time = time.time() - start_time
            
            return {
                'success': True,
                'predicted_class': predicted_class,
                'confidence': confidence,
                'all_probabilities': all_probs,
                'extracted_text': text_formatted,
                'extracted_text_raw': text_raw,
                'text_length': len(text_formatted),
                'processing_time': processing_time
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'processing_time': time.time() - start_time
            }


# Instance singleton
_classifier_instance = None

def get_classifier():
    """Retourne l'instance du classifier (singleton)"""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = MLClassifierService()
    return _classifier_instance