# 🍽️ Menu Kasher Familial

Une application complète de gestion de menus kasher pour familles avec système de notifications avancé.

## 🎯 Fonctionnalités

### ✅ **Application Principale**
- 📅 **Gestion de menus** : Planification de repas kasher pour familles
- 📖 **Base de recettes** : Collection de recettes kasher avec filtres
- 🛒 **Listes de courses** : Génération automatique basée sur les menus
- 🥕 **Ingrédients kasher** : Base de données d'ingrédients certifiés
- 👤 **Gestion utilisateurs** : Profils familiaux avec préférences

### 🔔 **Système de Notifications (Phase 4)**
- **APIs complètes** : 12 endpoints CRUD pour notifications
- **Interface admin** : Gestion complète des notifications
- **Interface utilisateur** : Consultation et interaction
- **Types de notifications** : Info, succès, avertissement, erreur
- **Filtrage avancé** : Par statut, type, utilisateur, date
- **Statistiques** : Dashboard avec métriques détaillées

## 🚀 **Déploiement**

### **Prérequis**
- Docker & Docker Compose
- PostgreSQL
- Nginx (pour proxy reverse)
- Infrastructure Elestio (recommandée)

### **Installation**

```bash
# Cloner le repository
git clone https://github.com/oren010/menu-kasher-app.git
cd menu-kasher-app

# Démarrer les services
docker-compose up -d

# Accéder à l'application
# Interface utilisateur : https://votre-domaine:443
# Interface admin : https://votre-domaine:443/admin/login.html
```

### **Configuration**

1. **Variables d'environnement** : Configurer `.env` avec votre domaine
2. **Base de données** : PostgreSQL avec migrations Prisma automatiques
3. **SMTP** : Configuration email pour notifications
4. **Admin** : Identifiants par défaut `admin@menu-kasher.app` / `admin123`

## 🏗️ **Architecture**

### **Stack Technique**
- **Backend** : Node.js, Express.js, Prisma ORM
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
- **Base de données** : PostgreSQL
- **Authentification** : JWT avec middleware sécurisé
- **Conteneurisation** : Docker avec docker-compose
- **Proxy** : Nginx avec SSL et rate limiting

### **Sécurité**
- 🔒 **Rate limiting** : Protection contre attaques brute force
- 🛡️ **CSP** : Content Security Policy configurée
- 🔐 **HTTPS** : SSL/TLS obligatoire
- 🚫 **Headers sécurisés** : Protection XSS, clickjacking
- 📊 **Audit logs** : Traçabilité des actions admin

## 📚 **Documentation**

### **APIs Principales**
- `/api/recipes` - Gestion des recettes kasher
- `/api/menus` - Planification des menus
- `/api/ingredients` - Ingrédients kasher
- `/api/shopping-lists` - Listes de courses
- `/api/notifications` - Système de notifications (Phase 4)
- `/api/auth` - Authentification utilisateurs et admin

### **Interfaces**
- **Utilisateur** : Interface moderne et responsive
- **Admin** : Dashboard complet avec analytics
- **Mobile** : Design adaptatif pour tous appareils

## 🧪 **Tests**

```bash
# Tests API notifications
node menu-kasher-app/test-notifications.js

# Tests d'intégration
# Accéder aux interfaces et tester manuellement
```

## 📁 **Structure du Projet**

```
menu-kasher-app/
├── public/                 # Interface utilisateur
│   ├── admin/             # Interface d'administration
│   ├── assets/            # CSS, JS, images
│   └── index.html         # Page principale
├── routes/                # Routes API Express
├── services/              # Logique métier
├── middleware/            # Middlewares de sécurité
├── prisma/               # Schema et migrations DB
├── docker-compose.yml    # Configuration containers
└── server.js            # Serveur principal
```

## 🔧 **Développement**

### **Commandes Utiles**
```bash
# Développement local
npm run dev

# Migrations base de données
npm run migrate

# Génération client Prisma
npm run generate

# Seeding données initiales
npm run seed
```

### **Contribution**
1. Fork le project
2. Créer une feature branch (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branch (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📊 **Statut du Projet**

- ✅ **Phase 1** : Structure de base et APIs core
- ✅ **Phase 2** : Interface utilisateur complète  
- ✅ **Phase 3** : Système d'authentification admin
- ✅ **Phase 4** : Système de notifications complet
- 🔄 **Phase 5** : Optimisations et fonctionnalités avancées (prochainement)

## 🎉 **Fonctionnalités Récemment Ajoutées**

- ✅ Système de notifications Phase 4 entièrement fonctionnel
- ✅ Interface admin pour gestion des notifications
- ✅ Résolution des problèmes de rate limiting
- ✅ Optimisation des performances nginx
- ✅ Authentification admin sécurisée
- ✅ Tests complets et validation

## 📞 **Support**

Pour toute question ou problème :
- Créer une issue sur GitHub
- Consulter la documentation dans `/docs`
- Vérifier les logs avec `docker-compose logs`

## 📄 **Licence**

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**🍽️ Bon appétit kasher ! 🍽️**
