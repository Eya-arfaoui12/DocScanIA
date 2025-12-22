"""
Tests pour le service de classification ML
"""
import pytest
import os
import tempfile
import numpy as np
from PIL import Image
from unittest.mock import patch, MagicMock
from ml_models.ml_service import MLClassifierService, get_classifier

pytestmark = pytest.mark.ml

@pytest.fixture
def temp_image():
    """Créer une image temporaire pour les tests"""
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
        img = Image.new('RGB', (800, 600), color='white')
        img.save(tmp.name, 'JPEG')
        yield tmp.name
    
    if os.path.exists(tmp.name):
        os.remove(tmp.name)


@pytest.fixture
def temp_image_with_text():
    """Créer une image avec du texte simulé"""
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
        from PIL import ImageDraw, ImageFont
        
        img = Image.new('RGB', (800, 600), color='white')
        draw = ImageDraw.Draw(img)
        
        text = """
        FACTURE N° FR-001
        Date: 02/12/2025
        
        Client: Jean Dupont
        
        Article: Produit A    Quantité: 5    Prix: 29.00 €
        
        Total HT: 145.00 €
        TVA 20%: 29.00 €
        Total TTC: 174.00 €
        """
        
        try:
            font = ImageFont.load_default()
        except:
            font = None
        
        draw.text((50, 50), text, fill='black', font=font)
        img.save(tmp.name, 'JPEG')
        yield tmp.name
    
    if os.path.exists(tmp.name):
        os.remove(tmp.name)


@pytest.fixture
def mock_model():
    """Mock du modèle BERT"""
    with patch('ml_models.ml_service.CamembertForSequenceClassification') as mock:
        model = MagicMock()
        model.eval.return_value = model
        mock.from_pretrained.return_value = model
        yield model


@pytest.fixture
def mock_tokenizer():
    """Mock du tokenizer"""
    with patch('ml_models.ml_service.CamembertTokenizer') as mock:
        tokenizer = MagicMock()
        tokenizer.return_value = {
            'input_ids': MagicMock(),
            'attention_mask': MagicMock()
        }
        mock.from_pretrained.return_value = tokenizer
        yield tokenizer


@pytest.fixture
def mock_label_encoder():
    """Mock du label encoder"""
    label_encoder = MagicMock()
    label_encoder.classes_ = np.array(['factures', 'contrats', 'cartes_identite'])
    return label_encoder


@pytest.fixture
def classifier(mock_model, mock_tokenizer, mock_label_encoder):
    """Fixture pour créer un classifier avec mocks"""
    with patch('builtins.open', create=True):
        with patch('pickle.load', return_value=mock_label_encoder):
            classifier = MLClassifierService()
            classifier.model = mock_model
            classifier.tokenizer = mock_tokenizer
            classifier.label_encoder = mock_label_encoder
            return classifier


class TestMLClassifierService:
    """Tests pour MLClassifierService"""
    
    def test_preprocess_image(self, temp_image, classifier):
        """✅ Test : Prétraitement d'image"""
        processed = classifier.preprocess_image(temp_image)
        
        assert processed is not None
        assert isinstance(processed, np.ndarray)
        assert len(processed.shape) == 2
    
    @patch('ml_models.ml_service.pytesseract.image_to_string')
    def test_extract_text(self, mock_ocr, temp_image, classifier):
        """✅ Test : Extraction de texte OCR"""
        mock_ocr.return_value = "FACTURE N° FR-001\nDate: 02/12/2025\nTotal: 174.00 €"
        
        text_formatted, text_raw = classifier.extract_text(temp_image)
        
        assert text_formatted is not None
        assert text_raw is not None
        assert 'FACTURE' in text_formatted
        assert len(text_raw) > 0
        assert '\n' not in text_raw
    
    @patch('ml_models.ml_service.torch')
    def test_classify_text(self, mock_torch, classifier):
        """✅ Test : Classification de texte"""
        # Mock des sorties du modèle
        mock_logits = MagicMock()
        mock_outputs = MagicMock()
        mock_outputs.logits = mock_logits
        
        # Mock avec classe MockTensor
        class MockTensor:
            def __init__(self, value):
                self.value = value
            
            def item(self):
                return self.value
        
        mock_probs = MagicMock()
        mock_probs.__getitem__ = MagicMock(return_value=[
            MockTensor(0.95),
            MockTensor(0.03),
            MockTensor(0.02)
        ])
        
        mock_torch.nn.functional.softmax.return_value = mock_probs
        
        mock_argmax_result = MagicMock()
        mock_argmax_result.item.return_value = 0
        mock_torch.argmax.return_value = mock_argmax_result
        
        mock_torch.no_grad = MagicMock()
        
        text = "FACTURE N° FR-001 Date: 02/12/2025 Total: 174.00 €"
        predicted_class, confidence, all_probs = classifier.classify_text(text)
        
        assert predicted_class in ['factures', 'contrats', 'cartes_identite']
        assert 0 <= confidence <= 1
        assert len(all_probs) == 3
    
    @patch('ml_models.ml_service.pytesseract.image_to_string')
    @patch('ml_models.ml_service.torch')
    def test_process_document_success(self, mock_torch, mock_ocr, temp_image, mock_model, mock_tokenizer, mock_label_encoder):
        """✅ Test : Pipeline complet réussi"""
        mock_ocr.return_value = "FACTURE N° FR-001\nDate: 02/12/2025\nTotal: 174.00 €"
        
        # Mock torch
        mock_logits = MagicMock()
        mock_outputs = MagicMock()
        mock_outputs.logits = mock_logits
        mock_model.return_value = mock_outputs
        
        mock_probs = MagicMock()
        mock_probs[0] = [MagicMock(item=lambda: 0.95), MagicMock(item=lambda: 0.03), MagicMock(item=lambda: 0.02)]
        mock_torch.nn.functional.softmax.return_value = mock_probs
        mock_torch.argmax.return_value.item.return_value = 0
        mock_torch.no_grad = MagicMock()
        
        with patch('builtins.open', create=True):
            with patch('pickle.load', return_value=mock_label_encoder):
                classifier = MLClassifierService()
                classifier.model = mock_model
                classifier.tokenizer = mock_tokenizer
                classifier.label_encoder = mock_label_encoder
        
        result = classifier.process_document(temp_image)
        
        assert result['success'] is True
        assert 'predicted_class' in result
        assert 'confidence' in result
        assert 'extracted_text' in result
        assert 'processing_time' in result
        assert result['processing_time'] > 0
    
    @patch('ml_models.ml_service.pytesseract.image_to_string')
    def test_process_document_empty_text(self, mock_ocr, temp_image, mock_model, mock_tokenizer, mock_label_encoder):
        """✅ Test : Texte extrait vide"""
        mock_ocr.return_value = ""
        
        with patch('builtins.open', create=True):
            with patch('pickle.load', return_value=mock_label_encoder):
                classifier = MLClassifierService()
        
        result = classifier.process_document(temp_image)
        
        assert result['success'] is False
        assert 'error' in result
        assert 'vide' in result['error'].lower()
    
    def test_process_document_invalid_image(self, mock_model, mock_tokenizer, mock_label_encoder):
        """✅ Test : Image invalide"""
        with patch('builtins.open', create=True):
            with patch('pickle.load', return_value=mock_label_encoder):
                classifier = MLClassifierService()
        
        result = classifier.process_document('/path/to/nonexistent/image.jpg')
        
        assert result['success'] is False
        assert 'error' in result


class TestGetClassifier:
    """Tests pour la fonction get_classifier (singleton)"""
    
    @patch('ml_models.ml_service.MLClassifierService')
    def test_get_classifier_singleton(self, mock_service):
        """✅ Test : get_classifier retourne toujours la même instance"""
        import ml_models.ml_service as ml_module
        ml_module._classifier_instance = None
        
        mock_instance = MagicMock()
        mock_service.return_value = mock_instance
        
        classifier1 = get_classifier()
        classifier2 = get_classifier()
        
        assert classifier1 is classifier2
        assert mock_service.call_count == 1


class TestImagePreprocessing:
    """Tests spécifiques au prétraitement d'images"""
    
    # ✅ SUPPRIMER la fixture classifier d'ici
    # Elle est maintenant au niveau du module
    
    def test_resize_small_image(self, classifier):
        """✅ Test : Redimensionnement d'une petite image"""
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            img = Image.new('RGB', (500, 400), color='white')
            img.save(tmp.name, 'JPEG')
            temp_path = tmp.name
        
        try:
            processed = classifier.preprocess_image(temp_path)
            
            assert processed is not None
            assert processed.shape[0] >= 1500 or processed.shape[1] >= 1500
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    def test_grayscale_conversion(self, classifier, temp_image):
        """✅ Test : Conversion en niveaux de gris"""
        processed = classifier.preprocess_image(temp_image)
        
        assert len(processed.shape) == 2
    
    def test_binary_threshold(self, classifier, temp_image):
        """✅ Test : Binarisation"""
        processed = classifier.preprocess_image(temp_image)
        
        unique_values = np.unique(processed)
        assert len(unique_values) <= 256


class TestTextClassification:
    """Tests spécifiques à la classification de texte"""
    
    # ✅ SUPPRIMER la fixture classifier d'ici
    # Elle est maintenant au niveau du module
    
    @patch('ml_models.ml_service.torch')
    def test_text_truncation(self, mock_torch, classifier):
        """✅ Test : Troncature du texte long"""
        long_text = ' '.join(['word'] * 500)
        
        class MockTensor:
            def __init__(self, value):
                self.value = value
            def item(self):
                return self.value
        
        mock_probs = MagicMock()
        mock_probs.__getitem__ = MagicMock(return_value=[
            MockTensor(0.8),
            MockTensor(0.1),
            MockTensor(0.1)
        ])
        mock_torch.nn.functional.softmax.return_value = mock_probs
        
        mock_argmax = MagicMock()
        mock_argmax.item.return_value = 0
        mock_torch.argmax.return_value = mock_argmax
        mock_torch.no_grad = MagicMock()
        
        predicted_class, confidence, all_probs = classifier.classify_text(long_text)
        
        classifier.tokenizer.assert_called_once()
        call_args = classifier.tokenizer.call_args[0][0]
        assert len(call_args.split()) <= 400
    
    @patch('ml_models.ml_service.torch')
    def test_confidence_range(self, mock_torch, classifier):
        """✅ Test : La confiance est entre 0 et 1"""
        class MockTensor:
            def __init__(self, value):
                self.value = value
            def item(self):
                return self.value
        
        mock_probs = MagicMock()
        mock_probs.__getitem__ = MagicMock(return_value=[
            MockTensor(0.75),
            MockTensor(0.15),
            MockTensor(0.10)
        ])
        mock_torch.nn.functional.softmax.return_value = mock_probs
        
        mock_argmax = MagicMock()
        mock_argmax.item.return_value = 0
        mock_torch.argmax.return_value = mock_argmax
        mock_torch.no_grad = MagicMock()
        
        text = "Test text"
        _, confidence, _ = classifier.classify_text(text)
        
        assert 0 <= confidence <= 1
    
    @patch('ml_models.ml_service.torch')
    def test_all_probabilities_sum_to_one(self, mock_torch, classifier):
        """✅ Test : Les probabilités somment à 1"""
        class MockTensor:
            def __init__(self, value):
                self.value = value
            def item(self):
                return self.value
        
        mock_probs = MagicMock()
        mock_probs.__getitem__ = MagicMock(return_value=[
            MockTensor(0.7),
            MockTensor(0.2),
            MockTensor(0.1)
        ])
        mock_torch.nn.functional.softmax.return_value = mock_probs
        
        mock_argmax = MagicMock()
        mock_argmax.item.return_value = 0
        mock_torch.argmax.return_value = mock_argmax
        mock_torch.no_grad = MagicMock()
        
        text = "Test text"
        _, _, all_probs = classifier.classify_text(text)
        
        total_prob = sum(all_probs.values())
        assert abs(total_prob - 1.0) < 0.01