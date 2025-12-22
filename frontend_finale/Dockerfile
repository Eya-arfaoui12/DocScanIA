# ==========================================
# ÉTAPE 1 : Build de l'application React
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci --silent

# Copier le code source
COPY . .

# Build de production
RUN npm run build

# ==========================================
# ÉTAPE 2 : Serveur Nginx pour servir l'app
# ==========================================
FROM nginx:alpine

# Copier les fichiers buildés depuis l'étape précédente
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]