"""
Tests pour le parseur de documents
"""
import pytest
from ml_models.document_parser import DocumentParser


class TestDocumentParser:
    """Tests pour la classe DocumentParser"""
    
    @pytest.fixture
    def parser(self):
        return DocumentParser()


class TestParseCarteIdentite:
    """Tests pour le parsing de cartes d'identité"""
    
    @pytest.fixture
    def parser(self):
        return DocumentParser()
    
    def test_parse_complete_carte_identite(self, parser):
        """✅ Test : Carte d'identité complète"""
        text = """
        RÉPUBLIQUE FRANÇAISE
        CARTE NATIONALE D'IDENTITÉ N°: 044298303457
        
        Nom: DUPONT
        Prénom(s): CHARLES, PIERRE
        
        Né(e) le: 15/03/1985
        Sexe: M
        Nationalité: Française
        """
        
        result = parser.parse_carte_identite(text)
        
        assert result['numero_carte'] == '044298303457'
        assert result['nom'] == 'DUPONT'
        assert 'CHARLES' in result['prenom']
        assert result['date_naissance'] == '15/03/1985'
        assert result['sexe'] == 'Masculin'
        assert result['nationalite'] == 'Française'
    
    def test_parse_carte_with_ocr_errors(self, parser):
        """✅ Test : Carte avec erreurs OCR"""
        text = """
        CARTE NATIONALE ONDENTITÉ N°: 044298303457
        
        Mom: MARTIN
        Prénoms): JEAN, PAUL
        
        Né le: 20/07/1990
        Sexe: M
        """
        
        result = parser.parse_carte_identite(text)
        
        assert result['numero_carte'] == '044298303457'
        # Le parser devrait corriger "Mom" en "Nom"
        assert 'nom' in result
        assert 'prenom' in result
    
    def test_parse_carte_feminine(self, parser):
        """✅ Test : Carte d'identité féminine"""
        text = """
        CARTE NATIONALE D'IDENTITÉ N° 044298303457
        
        Nom: DUBOIS
        Prénom(s): MARIE
        
        Née le: 12/11/1988
        Sexe: F
        Nationalité: Française
        """
        
        result = parser.parse_carte_identite(text)
        
        assert result['sexe'] == 'Féminin'
        assert result['nom'] == 'DUBOIS'
        assert result['prenom'] == 'MARIE'
    
    def test_parse_carte_incomplete(self, parser):
        """✅ Test : Carte incomplète"""
        text = """
        CARTE NATIONALE D'IDENTITÉ
        
        Nom: BERNARD
        """
        
        result = parser.parse_carte_identite(text)
        
        assert 'nom' in result
        assert result['nom'] == 'BERNARD'
        # Les autres champs peuvent être absents
    
    def test_parse_carte_with_different_date_formats(self, parser):
        """✅ Test : Différents formats de date"""
        date_formats = [
            ("Né le: 15/03/1985", "15/03/1985"),
            ("Date de naissance: 15-03-1985", "15-03-1985"),
            ("Né le: 15.03.1985", "15.03.1985"),
        ]
        
        for text_pattern, expected_date in date_formats:
            text = f"CARTE NATIONALE D'IDENTITÉ\nNom: TEST\n{text_pattern}"
            result = parser.parse_carte_identite(text)
            
            assert 'date_naissance' in result
            assert expected_date in result['date_naissance']


class TestParseFacture:
    """Tests pour le parsing de factures"""
    
    @pytest.fixture
    def parser(self):
        return DocumentParser()
    
    def test_parse_complete_facture(self, parser):
        """✅ Test : Facture complète"""
        text = """
        FACTURE N° FR-001
        DATE: 02/12/2025
        
        FACTURÉ À: Jean Dupont
        
        Article: Produit A    Quantité: 5    Prix: 29.00 €
        
        Total HT: 145.00 €
        TVA 20.0%: 29.00 €
        Total de la facture: 174.00 €
        """
        
        result = parser.parse_facture(text)
        
        assert result['numero_facture'] == 'FR-001'
        assert result['date'] == '02/12/2025'
        assert result['montant_total'] == '174.00'
        assert result['tva'] == '20.0'
        assert result['client'] == 'Jean Dupont'
    
    def test_parse_facture_with_different_formats(self, parser):
        """✅ Test : Différents formats de facture"""
        text = """
        Invoice No: INV-2025-001
        Date: 02/12/2025
        
        Amount Due: 250.50 €
        VAT 20%
        """
        
        result = parser.parse_facture(text)
        
        assert 'numero_facture' in result
        assert result['date'] == '02/12/2025'
        assert 'montant_total' in result
    
    def test_parse_facture_without_tva(self, parser):
        """✅ Test : Facture sans TVA"""
        text = """
        FACTURE N° FR-002
        DATE: 03/12/2025
        
        Total: 100.00 €
        """
        
        result = parser.parse_facture(text)
        
        assert result['numero_facture'] == 'FR-002'
        assert result['date'] == '03/12/2025'
        assert result['montant_total'] == '100.00'
    
    def test_parse_facture_multiple_amounts(self, parser):
        """✅ Test : Facture avec plusieurs montants (prend le plus grand)"""
        text = """
        FACTURE N° FR-003
        
        Acompte: 50.00 €
        Reste à payer: 100.00 €
        Total: 150.00 €
        """
        
        result = parser.parse_facture(text)
        
        # Devrait prendre le montant le plus élevé
        assert float(result['montant_total']) == 150.00
    
    def test_parse_facture_with_decimal_comma(self, parser):
        """✅ Test : Montant avec virgule décimale"""
        text = """
        FACTURE N° FR-004
        
        Total: 1 234,56 €
        """
        
        result = parser.parse_facture(text)
        
        assert 'montant_total' in result
        # Le parser devrait convertir la virgule en point
    
    def test_parse_facture_incomplete(self, parser):
        """✅ Test : Facture incomplète"""
        text = """
        FACTURE
        
        Total: 99.99 €
        """
        
        result = parser.parse_facture(text)
        
        # Au moins le montant devrait être extrait
        assert 'montant_total' in result


class TestParseContrat:
    """Tests pour le parsing de contrats"""
    
    @pytest.fixture
    def parser(self):
        return DocumentParser()
    
    def test_parse_complete_contrat(self, parser):
        """✅ Test : Contrat complet"""
        text = """
        CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE
        
        Entre :
        SOCIÉTÉ ABC, d'une part
        Basée à Paris
        
        Et :
        EMPLOYÉ Mr Jean MARTIN
        Né le 15 janvier 1985
        en sa qualité de Développeur
        d'autre part
        
        Fait à Paris, le 01/12/2025
        """
        
        result = parser.parse_contrat(text)
        
        assert 'DURÉE INDÉTERMINÉE' in result['type_contrat'] or 'CDI' in result['type_contrat']
        assert result['employeur'] == 'ABC'
        assert 'MARTIN' in result['employe']
        assert result['date_naissance_employe'] == '15 janvier 1985'
        assert result['fonction'] == 'Développeur'
        assert result['date_contrat'] == '01/12/2025'
    
    def test_parse_contrat_cdd(self, parser):
        """✅ Test : Contrat CDD"""
        text = """
        CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE
        
        SOCIÉTÉ XYZ, d'une part
        
        EMPLOYÉ Mme Sophie BERNARD
        Né le 20 mars 1990
        en sa qualité de Chef de projet
        d'autre part
        
        Signé à Lyon, le 15/11/2025
        """
        
        result = parser.parse_contrat(text)
        
        assert 'DÉTERMINÉE' in result['type_contrat'] or 'CDD' in result['type_contrat']
        assert result['employeur'] == 'XYZ'
        assert 'BERNARD' in result['employe']
        assert result['fonction'] == 'Chef de projet'
    
    def test_parse_contrat_minimal(self, parser):
        """✅ Test : Contrat minimal"""
        text = """
        CONTRAT DE TRAVAIL
        
        Entreprise: TechCorp
        EMPLOYÉ Mr Pierre DURAND
        """
        
        result = parser.parse_contrat(text)
        
        assert 'type_contrat' in result
        assert 'employe' in result
    
    def test_parse_contrat_with_abbreviations(self, parser):
        """✅ Test : Contrat avec abréviations"""
        text = """
        CONTRAT DE TRAVAIL CDI
        
        SOCIÉTÉ: Innovation SA
        Mr David PETIT
        en sa qualité de Ingénieur
        """
        
        result = parser.parse_contrat(text)
        
        assert 'type_contrat' in result
        assert 'fonction' in result


class TestParseDocument:
    """Tests pour la méthode parse_document (dispatcher)"""
    
    @pytest.fixture
    def parser(self):
        return DocumentParser()
    
    def test_parse_document_facture(self, parser):
        """✅ Test : Parser une facture via parse_document"""
        text = "FACTURE N° FR-001\nTotal: 100.00 €"
        result = parser.parse_document(text, 'factures')
        
        assert 'numero_facture' in result
        assert result['numero_facture'] == 'FR-001'
    
    def test_parse_document_contrat(self, parser):
        """✅ Test : Parser un contrat via parse_document"""
        text = "CONTRAT DE TRAVAIL\nSOCIÉTÉ: ABC"
        result = parser.parse_document(text, 'contrats')
        
        assert 'type_contrat' in result
    
    def test_parse_document_carte_identite(self, parser):
        """✅ Test : Parser une carte d'identité via parse_document"""
        text = "CARTE NATIONALE D'IDENTITÉ N° 123456789\nNom: DUPONT"
        result = parser.parse_document(text, 'cartes_identite')
        
        assert 'numero_carte' in result
        assert 'nom' in result
    
    def test_parse_document_unknown_type(self, parser):
        """✅ Test : Type de document inconnu"""
        text = "Some text"
        result = parser.parse_document(text, 'unknown_type')
        
        assert result == {}


class TestEdgeCases:
    """Tests pour les cas limites"""
    
    @pytest.fixture
    def parser(self):
        return DocumentParser()
    
    def test_empty_text(self, parser):
        """✅ Test : Texte vide"""
        result = parser.parse_facture("")
        assert isinstance(result, dict)
        
        result = parser.parse_contrat("")
        assert isinstance(result, dict)
        
        result = parser.parse_carte_identite("")
        assert isinstance(result, dict)
    
    def test_text_with_special_characters(self, parser):
        """✅ Test : Texte avec caractères spéciaux"""
        text = """
        FACTURE N° FR-001
        Client: Jean-François O'Connor
        Total: 1,234.56 €
        """
        
        result = parser.parse_facture(text)
        
        assert 'numero_facture' in result
    
    def test_text_with_accents(self, parser):
        """✅ Test : Texte avec accents"""
        text = """
        CARTE NATIONALE D'IDENTITÉ N° 123456789
        Nom: FRANÇOIS
        Prénom: José
        Nationalité: Française
        """
        
        result = parser.parse_carte_identite(text)
        
        assert 'nom' in result
        assert 'nationalite' in result
    
    def test_case_insensitive_parsing(self, parser):
        """✅ Test : Parsing insensible à la casse"""
        text_lower = "facture n° fr-001\ndate: 02/12/2025"
        text_upper = "FACTURE N° FR-001\nDATE: 02/12/2025"
        
        result_lower = parser.parse_facture(text_lower)
        result_upper = parser.parse_facture(text_upper)
        
        assert result_lower['numero_facture'] == result_upper['numero_facture']
        assert result_lower['date'] == result_upper['date']
    
    def test_multiline_fields(self, parser):
        """✅ Test : Champs sur plusieurs lignes"""
        text = """
        CONTRAT DE TRAVAIL
        
        SOCIÉTÉ:
        Innovation Tech
        123 rue de la République
        75001 Paris
        """
        
        result = parser.parse_contrat(text)
        
        # Devrait extraire au moins le nom de la société
        assert 'employeur' in result or 'type_contrat' in result


class TestRegressionPrevention:
    """Tests pour prévenir les régressions"""
    
    @pytest.fixture
    def parser(self):
        return DocumentParser()
    
    def test_common_ocr_errors(self, parser):
        """✅ Test : Erreurs OCR communes"""
        # "O" confondu avec "0", "l" avec "1", etc.
        text = """
        FACTURE N° FR-OO1
        Total: l74.00 €
        """
        
        result = parser.parse_facture(text)
        
        # Le parser devrait quand même extraire des informations
        assert 'numero_facture' in result or 'montant_total' in result
    
    def test_missing_spaces(self, parser):
        """✅ Test : Espaces manquants"""
        text = "FACTURE N°FR-001 DATE:02/12/2025 TOTAL:174.00€"
        
        result = parser.parse_facture(text)
        
        assert 'numero_facture' in result
        assert result['numero_facture'] == 'FR-001'
    
    def test_extra_whitespace(self, parser):
        """✅ Test : Espaces en trop"""
        text = """
        FACTURE    N°    FR-001
        
        
        Date:     02/12/2025
        Total:    174.00   €
        """
        
        result = parser.parse_facture(text)
        
        assert result['numero_facture'] == 'FR-001'
        assert result['date'] == '02/12/2025'