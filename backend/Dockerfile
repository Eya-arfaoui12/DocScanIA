# ==========================================
# ÉTAPE 1 : Builder - Installation des dépendances
# ==========================================
FROM python:3.13-slim AS builder

WORKDIR /app

# Installer les dépendances système pour le build
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements
COPY requirements.txt .

# Créer un environnement virtuel et installer les dépendances
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# ==========================================
# ÉTAPE 2 : Runtime - Image finale légère
# ==========================================
FROM python:3.13-slim

WORKDIR /app

# Installer seulement les dépendances runtime
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copier l'environnement virtuel depuis le builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copier le code de l'application
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p /app/media /app/staticfiles /app/ml_models

# Collecter les fichiers statiques
RUN python manage.py collectstatic --noinput || true

# Exposer le port
EXPOSE 8000

# Script de démarrage avec téléchargement du modèle
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🚀 Démarrage du serveur Django..."\n\
echo "📦 Vérification du modèle ML..."\n\
\n\
# Télécharger le modèle si absent\n\
if [ ! -f "/app/ml_models/model_downloaded.flag" ]; then\n\
    echo "📥 Téléchargement du modèle CamemBERT..."\n\
    python -c "\n\
from transformers import CamembertForSequenceClassification, CamembertTokenizer\n\
import os\n\
model_path = \"/app/ml_models/model\"\n\
os.makedirs(model_path, exist_ok=True)\n\
print(\"Téléchargement du modèle...\")\n\
model = CamembertForSequenceClassification.from_pretrained(\"camembert-base\")\n\
tokenizer = CamembertTokenizer.from_pretrained(\"camembert-base\")\n\
model.save_pretrained(model_path)\n\
tokenizer.save_pretrained(model_path)\n\
print(\"Modèle téléchargé avec succès!\")\n\
"\n\
    touch /app/ml_models/model_downloaded.flag\n\
    echo "✅ Modèle téléchargé et sauvegardé"\n\
else\n\
    echo "✅ Modèle déjà présent"\n\
fi\n\
\n\
echo "📊 Chargement du modèle ML..."\n\
python -c "from ml_models.ml_service import get_classifier; get_classifier()" || echo "⚠️ Avertissement: Modèle ML non disponible"\n\
\n\
echo "🔄 Exécution des migrations..."\n\
python manage.py migrate --noinput\n\
\n\
echo "✅ Serveur prêt sur le port 8000"\n\
python manage.py runserver 0.0.0.0:8000\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]