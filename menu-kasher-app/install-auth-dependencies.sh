#!/bin/bash

# Script d'installation des dépendances pour le système d'authentification et d'administration

echo "🔧 Installation des dépendances pour l'authentification et l'administration..."

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Exécutez ce script depuis le répertoire du projet."
    exit 1
fi

echo "📦 Installation des dépendances de sécurité..."

# Dépendances principales pour l'authentification
npm install bcryptjs jsonwebtoken express-rate-limit helmet cors

# Dépendances pour la validation et les sessions
npm install express-validator express-session

# Dépendances optionnelles pour Redis (sessions avancées)
echo "📦 Installation des dépendances optionnelles..."
npm install redis connect-redis

# Dépendances pour les logs et monitoring
npm install winston morgan

# Dépendances pour les tâches programmées
npm install node-cron

# Dépendances pour les emails (si pas déjà installé)
npm install nodemailer

# Vérification de l'installation
echo "✅ Vérification des dépendances installées..."

# Fonction pour vérifier si un package est installé
check_package() {
    if npm list "$1" &> /dev/null; then
        echo "  ✅ $1"
    else
        echo "  ❌ $1 - ÉCHEC"
    fi
}

echo "📋 Statut des dépendances :"
check_package "bcryptjs"
check_package "jsonwebtoken"
check_package "express-rate-limit"
check_package "helmet"
check_package "cors"
check_package "express-validator"
check_package "express-session"
check_package "redis"
check_package "connect-redis"
check_package "winston"
check_package "morgan"
check_package "node-cron"
check_package "nodemailer"

echo ""
echo "🎉 Installation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "  1. Exécuter la migration Prisma : npx prisma db push"
echo "  2. Exécuter le script de migration : node migration-admin-auth.js"
echo "  3. Redémarrer l'application"
echo ""
echo "⚠️  Note : Assurez-vous que PostgreSQL est en cours d'exécution"