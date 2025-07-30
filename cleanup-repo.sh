#!/bin/bash

echo "🧹 Nettoyage du repository pour GitHub..."

cd /opt/app/menu-kasher-app

# Supprimer les fichiers de documentation temporaire
echo "📝 Suppression des fichiers de documentation temporaire..."
rm -f PHASE*.md
rm -f CORRECTION*.md
rm -f VERIFICATION*.md
rm -f IDENTIFIANTS*.md
rm -f ADMIN_LOGIN_TODO.md
rm -f SOLUTION_FINALE*.md

# Supprimer les scripts de test et migration temporaires
echo "🧪 Suppression des scripts de test et migration..."
rm -f test-*.js
rm -f verify-*.js
rm -f add-*.js
rm -f apply-*.js
rm -f migrate-*.js
rm -f migration-*.js
rm -f create-admin.js
rm -f reset-*.js
rm -f server-simple.js

# Supprimer les fichiers de backup
echo "💾 Suppression des backups..."
rm -rf backups/

# Supprimer les scripts d'installation temporaires
echo "🔧 Suppression des scripts d'installation..."
rm -f install-*.sh
rm -f admin-utils.sh

# Garder seulement les fichiers essentiels
echo "✅ Fichiers conservés :"
echo "- server.js (serveur principal)"
echo "- package.json"
echo "- README.md" 
echo "- ROADMAP_COMMERCIALISATION.md"
echo "- CLAUDE.md (documentation projet)"
echo "- Dossiers : public/, routes/, services/, middleware/, prisma/"

echo ""
echo "🎯 Nettoyage terminé ! Repository prêt pour GitHub."