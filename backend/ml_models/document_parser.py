"""
Parseur intelligent pour extraire des champs structurés
"""

import re


class DocumentParser:
    """Classe pour parser et structurer différents types de documents"""
    
    @staticmethod
    def parse_carte_identite(text):
        """Parse une carte d'identité française"""
        structured = {}
        
        # Numéro de carte - Patterns plus flexibles
        numero_patterns = [
            r'N[°:o]?\s*[:\s]*(\d{12,15})',  # N° 044298303457
            r'ONDENTIT[ÉE]\s+N[°:o]?\s*[:\s]*(\d{12,15})',  # ONDENTITÉ N°: 044298303457
            r'IDENTIT[ÉE]\s+N[°:o]?\s*[:\s]*(\d{12,15})',  # IDENTITÉ N°: 044298303457
            r'CNI\s*[:\s]*(\d{12,15})',  # CNI: 044298303457
        ]
        
        for pattern in numero_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                structured['numero_carte'] = match.group(1)
                break
        
        # Nom - Patterns améliorés
        nom_patterns = [
            r'Nom\s*[:\s]+([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s]+?)(?:\n|Pr[ée]nom)',  # Nom: DUPONT
            r'Mom\s*[:\s]+([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s]+?)(?:\n|Pr[ée]nom)',  # Erreur OCR: Mom au lieu de Nom
            r'(?:Nom|Mom)\s*[:\s]*([A-ZÀ-Ÿ]{2,})',  # Nom simple
        ]
        
        for pattern in nom_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                nom_candidat = match.group(1).strip()
                # Filtrer les faux positifs
                if len(nom_candidat) >= 2 and nom_candidat not in ['CARTE', 'NATIONALE', 'IDENTITE', 'REPUBLIQUE']:
                    structured['nom'] = nom_candidat
                    break
        
        # Prénom(s) - Patterns améliorés
        prenom_patterns = [
            r'Pr[ée]nom[s]?\s*[:\s]*\)?\s*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s,]+?)(?:\n|$)',  # Prénom(s): CHARLES, PIERRE
            r'Prénoms\)\s*[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s,]+?)(?:\n|$)',  # Erreur OCR
        ]
        
        for pattern in prenom_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                prenom_candidat = match.group(1).strip()
                # Nettoyer et valider
                prenom_candidat = prenom_candidat.replace('PEBRRE', 'PIERRE')  # Corriger erreur OCR commune
                if len(prenom_candidat) >= 2:
                    structured['prenom'] = prenom_candidat
                    break
        
        # Nationalité
        nat_patterns = [
            r'Nationalit[ée]\s*[:\s]*([A-Za-zÀ-ÿ]+)',
            r'Nationality\s*[:\s]*([A-Za-zÀ-ÿ]+)',
        ]
        
        for pattern in nat_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                structured['nationalite'] = match.group(1).strip()
                break
        
        # Date de naissance - Patterns multiples
        date_patterns = [
            r'(?:N[ée]\s+le|Date\s+de\s+naissance)\s*[:\s]*(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})',
            r'\b(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})\b',  # Format date seul
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                structured['date_naissance'] = match.group(1)
                break
        
        # Sexe
        sexe_match = re.search(r'\b([MF])\b', text)
        if sexe_match:
            structured['sexe'] = 'Masculin' if sexe_match.group(1) == 'M' else 'Féminin'
        
        return structured
    
    @staticmethod
    def parse_facture(text):
        """Parse une facture"""
        structured = {}
        
        # Numéro de facture - Patterns améliorés
        numero_patterns = [
            r'FACTURE\s+N[°o]?\s*[:\s]*([A-Z0-9\-]+)',  # FACTURE N° FR-001
            r'Facture\s*[:\s#]*([A-Z0-9\-]+)',  # Facture: FR-001
            r'Invoice\s+(?:No|Number|#)\s*[:\s]*([A-Z0-9\-]+)',  # Invoice No: FR-001
            r'N[°o]\s*(?:de\s+)?facture\s*[:\s]*([A-Z0-9\-]+)',  # N° de facture: FR-001
        ]
        
        for pattern in numero_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                numero = match.group(1).strip()
                # Filtrer les faux positifs courts
                if len(numero) >= 3 and numero not in ['QT', 'QTE', 'TVA']:
                    structured['numero_facture'] = numero
                    break
        
        # Date - Multiples formats
        date_patterns = [
            r'DATE\s*[:\s]*(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})',
            r'Date\s*[:\s]*(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})',
            r'Le\s+(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                structured['date'] = match.group(1)
                break
        
        # Montant total - Patterns multiples (français et anglais)
        montant_patterns = [
            r'Total\s+(?:de\s+la\s+facture)?\s*[:\s]*([\d\s,.]+)\s*[€$£]',  # Total de la facture 174.00 €
            r'(?:Total|TOTAL)\s*[:\s]*([\d\s,.]+)\s*[€$£]',  # TOTAL: 174.00 €
            r'(?:Grand\s+)?Total\s*[:\s]*([\d\s,.]+)\s*[€$£]',  # Grand Total: 174.00 €
            r'(?:Amount\s+Due|Total\s+Amount)\s*[:\s]*([\d\s,.]+)\s*[€$£]',  # Amount Due: 174.00 €
            r'([\d\s,.]+)\s*[€$£]\s*$',  # 174.00 € en fin de ligne
        ]
        
        for pattern in montant_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                # Prendre le plus grand montant trouvé
                montants = []
                for m in matches:
                    try:
                        # Nettoyer et convertir
                        montant_clean = m.replace(' ', '').replace(',', '.')
                        montant_float = float(montant_clean)
                        montants.append(montant_float)
                    except:
                        continue
                
                if montants:
                    structured['montant_total'] = f"{max(montants):.2f}"
                    break
        
        # TVA
        tva_patterns = [
            r'TVA\s+(\d+(?:\.\d+)?)\s*%',  # TVA 20.0%
            r'TVA\s*[:\s]*([\d\s,.]+)\s*[€$£]',  # TVA: 29.00 €
            r'VAT\s+(\d+(?:\.\d+)?)\s*%',  # VAT 20%
        ]
        
        for pattern in tva_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                tva_value = match.group(1).strip()
                structured['tva'] = tva_value
                break
        
        # Client (Facturé à)
        client_match = re.search(r'FACTUR[ÉE]\s+[ÀA]\s*[:\s]*([A-Za-zÀ-ÿ\s]+?)(?:\n|$)', text, re.IGNORECASE)
        if client_match:
            structured['client'] = client_match.group(1).strip()
        
        return structured
    
    @staticmethod
    def parse_contrat(text):
        """Parse un contrat"""
        structured = {}
        
        # Type de contrat - Patterns améliorés
        type_patterns = [
            r'Contrat\s+de\s+([A-Za-zÀ-ÿ\s]+?)(?:à|À|$)',  # Contrat de travail à
            r'Contrat\s+de\s+([A-Za-zÀ-ÿ\s]+?)(?:\n)',  # Contrat de travail
            r'CONTRAT\s+DE\s+([A-Z\s]+?)(?:À|$)',  # CONTRAT DE TRAVAIL À
        ]
        
        for pattern in type_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                type_contrat = match.group(1).strip()
                # Nettoyer et capturer le type complet
                # Chercher si "Durée Déterminée" ou "Durée Indéterminée" suit
                if re.search(r'Dur[ée]e\s+D[ée]termin[ée]e', text, re.IGNORECASE):
                    type_contrat += " à Durée Déterminée (CDD)"
                elif re.search(r'Dur[ée]e\s+Ind[ée]termin[ée]e', text, re.IGNORECASE):
                    type_contrat += " à Durée Indéterminée (CDI)"
                
                structured['type_contrat'] = type_contrat
                break
        
        # Parties (employeur et employé)
        # Employeur
        employeur_patterns = [
            r'(?:SOCI[ÉE]T[ÉE]|Entreprise)\s*[:\s]*([A-Za-zÀ-ÿ\s]+?)(?:\.|Bas[ée]e|$)',
            r"d['']une\s+part\s*[:\s]*([A-Z][A-Za-zÀ-ÿ\s]+?)(?:\.|Bas[ée]e)",
        ]
        
        for pattern in employeur_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                structured['employeur'] = match.group(1).strip()
                break
        
        # Employé
        employe_patterns = [
            r'EMPLOY[ÉE]\s+(?:Mr|Mme|M\.|Mlle)\s+([A-Za-zÀ-ÿ\s]+?)(?:\n|N[ée])',
            r"d['']autre\s+part\s*[:\s]*(?:Mr|Mme|M\.|Mlle)\s+([A-Za-zÀ-ÿ\s]+?)(?:\n|N[ée])",
        ]
        
        for pattern in employe_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                structured['employe'] = match.group(1).strip()
                break
        
        # Date de naissance de l'employé
        date_naissance_match = re.search(r'N[ée]\s+le\s*[:\s]*(\d{1,2}\s+[a-zéû]+\s+\d{4})', text, re.IGNORECASE)
        if date_naissance_match:
            structured['date_naissance_employe'] = date_naissance_match.group(1)
        
        # Date du contrat
        date_patterns = [
            r'(?:Fait|Sign[ée])\s+[àa]\s+[A-Za-zÀ-ÿ\s]+,?\s+le\s+(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})',
            r'\b(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})\b',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                structured['date_contrat'] = match.group(1)
                break
        
        # Fonction/Poste
        fonction_match = re.search(r'en\s+sa\s+qualit[ée]\s+de\s+([A-Z][A-Za-zÀ-ÿ\s]+?)(?:\s*,|$)', text, re.IGNORECASE)
        if fonction_match:
            structured['fonction'] = fonction_match.group(1).strip()
        
        return structured
    
    @classmethod
    def parse_document(cls, text, doc_type):
        """Parse un document selon son type"""
        if doc_type == 'cartes_identite':
            return cls.parse_carte_identite(text)
        elif doc_type == 'factures':
            return cls.parse_facture(text)
        elif doc_type == 'contrats':
            return cls.parse_contrat(text)
        else:
            return {}