# 📋 TODO: SYSTÈME ADMIN + LOGIN UTILISATEURS

## 🎯 PHASE 1: CONCEPTION ET PLANIFICATION ✅ TERMINÉE

### 📐 Architecture Base de Données
- [x] **Créer table `admins`** ✅
  - [x] `id`, `email`, `password_hash`, `name`, `role`, `permissions`
  - [x] `is_active`, `last_login`, `created_at`, `updated_at`
- [x] **Modifier table `users`** ✅
  - [x] Ajouter `password_hash`, `email_verified`, `reset_token`
  - [x] Ajouter `is_active`, `login_attempts`, `locked_until`
- [x] **Créer table `sessions`** ✅
  - [x] `id`, `user_id`, `admin_id`, `token`, `expires_at`, `ip_address`
- [x] **Créer table `audit_logs`** ✅
  - [x] `id`, `admin_id`, `action`, `table_name`, `record_id`, `old_data`, `new_data`

### 🔐 Sécurité et Permissions
- [x] **Définir rôles admin** ✅
  - [x] `super_admin` (accès total)
  - [x] `content_admin` (recettes, ingrédients)
  - [x] `user_admin` (gestion utilisateurs)
  - [x] `analytics_admin` (rapports uniquement)
- [x] **Définir permissions granulaires** ✅
  - [x] `users.create`, `users.read`, `users.update`, `users.delete`
  - [x] `recipes.create`, `recipes.read`, `recipes.update`, `recipes.delete`
  - [x] `ingredients.create`, `ingredients.read`, `ingredients.update`, `ingredients.delete`
  - [x] `analytics.view`, `logs.view`, `system.settings`

### 🎉 Résultats Phase 1
- ✅ **Base de données** : 5 nouvelles tables créées (admins, sessions, audit_logs, permissions, roles)
- ✅ **Permissions** : 23 permissions granulaires définies
- ✅ **Rôles** : 4 rôles admin avec permissions appropriées
- ✅ **Admin par défaut** : admin@menu-kasher.app (mot de passe: Admin123!)
- ✅ **Migration** : Données existantes préservées et migrées
- ✅ **Scripts** : Scripts de migration et configuration créés

---

## 🎯 PHASE 2: AUTHENTIFICATION ET SÉCURITÉ

### 🔑 Backend Authentication
- [ ] **Installer dépendances sécurité**
  ```bash
  npm install bcryptjs jsonwebtoken express-rate-limit helmet cors
  npm install express-validator express-session redis connect-redis
  ```
- [ ] **Créer AuthService (`/services/AuthService.js`)**
  - [ ] `hashPassword()` - Hasher les mots de passe avec bcrypt
  - [ ] `comparePassword()` - Vérifier les mots de passe
  - [ ] `generateJWT()` - Créer tokens JWT
  - [ ] `verifyJWT()` - Vérifier tokens JWT
  - [ ] `generateResetToken()` - Tokens de réinitialisation
  - [ ] `validateResetToken()` - Valider tokens reset
- [ ] **Créer middleware d'authentification (`/middleware/auth.js`)**
  - [ ] `requireAuth` - Middleware utilisateurs
  - [ ] `requireAdmin` - Middleware administrateurs
  - [ ] `requirePermission(permission)` - Permissions spécifiques
  - [ ] `rateLimiter` - Limitation tentatives de connexion
- [ ] **Sécurité générale**
  - [ ] Rate limiting login (5 tentatives/15min)
  - [ ] Helmet pour headers sécurisés
  - [ ] CORS configuré correctement
  - [ ] Validation des inputs (express-validator)

### 🔐 Routes d'authentification (`/routes/auth.js`)
- [ ] **POST `/api/auth/login`** - Connexion utilisateurs
- [ ] **POST `/api/auth/register`** - Inscription nouveaux utilisateurs
- [ ] **POST `/api/auth/logout`** - Déconnexion
- [ ] **POST `/api/auth/forgot-password`** - Mot de passe oublié
- [ ] **POST `/api/auth/reset-password`** - Réinitialisation mot de passe
- [ ] **POST `/api/admin/login`** - Connexion administrateurs
- [ ] **GET `/api/auth/me`** - Profil utilisateur courant
- [ ] **GET `/api/admin/me`** - Profil admin courant
- [ ] **POST `/api/auth/refresh-token`** - Renouvellement token

---

## 🎯 PHASE 3: INTERFACE D'ADMINISTRATION

### 📱 Frontend Admin Structure
- [ ] **Créer dossier `/admin`**
  - [ ] `login.html` - Page de connexion admin
  - [ ] `dashboard.html` - Tableau de bord principal
  - [ ] `users.html` - Gestion utilisateurs
  - [ ] `recipes.html` - Gestion recettes
  - [ ] `ingredients.html` - Gestion ingrédients
  - [ ] `categories.html` - Gestion catégories
  - [ ] `analytics.html` - Statistiques et rapports
  - [ ] `logs.html` - Logs d'audit
  - [ ] `settings.html` - Paramètres système
  - [ ] `profile.html` - Profil administrateur

### 🎨 Layout et Composants Admin
- [ ] **Layout principal (`/admin/layout/`)**
  - [ ] `sidebar.html` - Navigation avec permissions
  - [ ] `header.html` - Header avec profil admin et notifications
  - [ ] `breadcrumbs.html` - Navigation breadcrumbs
  - [ ] `footer.html` - Footer admin
- [ ] **CSS/JS Admin (`/admin/assets/`)**
  - [ ] `admin.css` - Styles spécifiques admin
  - [ ] `admin.js` - JavaScript admin global
  - [ ] `dashboard.js` - Logique dashboard
  - [ ] `users.js` - Gestion utilisateurs
  - [ ] `content.js` - Gestion contenu

### 📊 Dashboard Widgets
- [ ] **Statistiques temps réel**
  - [ ] Utilisateurs actifs (dernières 24h)
  - [ ] Nouveaux comptes (jour/semaine/mois)
  - [ ] Recettes créées aujourd'hui
  - [ ] Menus générés aujourd'hui
- [ ] **Graphiques d'utilisation**
  - [ ] Evolution utilisateurs (Chart.js)
  - [ ] Recettes les plus populaires
  - [ ] Utilisation par jour de la semaine
  - [ ] Répartition par catégories d'ingrédients
- [ ] **Alertes système**
  - [ ] Erreurs récentes
  - [ ] Tentatives de connexion suspectes
  - [ ] Comptes à modérer
  - [ ] Performance système

### 🗂️ Tables de Données Admin
- [ ] **Composant DataTable réutilisable**
  - [ ] Pagination intelligente
  - [ ] Tri multi-colonnes
  - [ ] Filtres avancés
  - [ ] Actions bulk (sélection multiple)
  - [ ] Export CSV/Excel
  - [ ] Recherche globale et par colonne

---

## 🎯 PHASE 4: GESTION DES UTILISATEURS

### 👤 Frontend Utilisateur
- [ ] **Pages utilisateur**
  - [ ] `/login.html` - Connexion utilisateur
  - [ ] `/register.html` - Inscription
  - [ ] `/forgot-password.html` - Mot de passe oublié
  - [ ] `/reset-password.html` - Réinitialisation
  - [ ] `/profile.html` - Profil utilisateur
  - [ ] `/account-settings.html` - Paramètres compte
  - [ ] `/verify-email.html` - Vérification email

### 🔐 Sécurité Utilisateur Frontend
- [ ] **Validation côté client (`/public/js/validation.js`)**
  - [ ] Force du mot de passe (8+ caractères, majuscule, chiffre, symbole)
  - [ ] Validation email en temps réel
  - [ ] Confirmation mot de passe
  - [ ] Vérification email disponible
- [ ] **Protection compte**
  - [ ] Messages de verrouillage après tentatives échouées
  - [ ] Notification de connexion suspecte
  - [ ] Option 2FA (Google Authenticator - optionnel)
  - [ ] Historique des connexions

### 👥 Système Multi-utilisateurs
- [ ] **Isolation des données**
  - [ ] Middleware de scope utilisateur
  - [ ] Chaque utilisateur voit uniquement ses menus
  - [ ] Recettes publiques vs privées
  - [ ] Système de partage optionnel
- [ ] **Gestion sessions**
  - [ ] Session persistante (Remember me)
  - [ ] Déconnexion automatique (inactivité)
  - [ ] Gestion multi-appareils
  - [ ] Notification de connexions simultanées

### 🔧 Fonctionnalités Admin Utilisateurs
- [ ] **Interface gestion utilisateurs**
  - [ ] Liste avec filtres (actifs, inactifs, dernière connexion)
  - [ ] Voir profil utilisateur complet
  - [ ] Modifier informations utilisateur
  - [ ] Désactiver/activer compte
  - [ ] Réinitialiser mot de passe utilisateur
  - [ ] Voir historique d'activité utilisateur
  - [ ] Statistiques utilisateur (menus créés, recettes favorites)
- [ ] **Actions bulk utilisateurs**
  - [ ] Désactiver plusieurs comptes
  - [ ] Envoyer email de masse
  - [ ] Exporter données utilisateurs

---

## 🎯 PHASE 5: GESTION DU CONTENU ADMIN

### 📝 Gestion Recettes Admin
- [ ] **Interface recettes admin**
  - [ ] Toutes les recettes (publiques + utilisateurs)
  - [ ] Modérer recettes soumises par utilisateurs
  - [ ] Approuver/rejeter recettes
  - [ ] Modifier recettes existantes
  - [ ] Créer recettes officielles
  - [ ] Dupliquer recettes
  - [ ] Statistiques d'utilisation par recette
- [ ] **Import/Export recettes**
  - [ ] Import CSV/JSON de recettes
  - [ ] Export recettes vers CSV/JSON
  - [ ] Import en masse d'ingrédients

### 🥕 Gestion Ingrédients et Catégories
- [ ] **Interface ingrédients admin**
  - [ ] CRUD complet ingrédients
  - [ ] Gestion des catégories
  - [ ] Fusion d'ingrédients doublons
  - [ ] Import nutritionnel automatique
  - [ ] Gestion des allergènes
- [ ] **Validation et modération**
  - [ ] Ingrédients proposés par utilisateurs
  - [ ] Validation nutritionnelle
  - [ ] Standardisation des unités

---

## 🎯 PHASE 6: MONITORING ET ANALYTICS

### 📊 Analytics Avancées
- [ ] **Métriques utilisateurs**
  - [ ] Taux d'activation (inscription → premier menu)
  - [ ] Taux de rétention (J1, J7, J30)
  - [ ] Recettes les plus créées/utilisées
  - [ ] Temps passé sur l'application
  - [ ] Funnel de conversion
- [ ] **Métriques système**
  - [ ] Performance API (temps de réponse par endpoint)
  - [ ] Erreurs et exceptions (logs structurés)
  - [ ] Utilisation ressources (CPU, RAM, DB)
  - [ ] Temps de réponse base de données

### 📋 Audit et Logs
- [ ] **Système de logs complet (`/services/AuditService.js`)**
  - [ ] Toutes actions admin tracées
  - [ ] Modifications de données utilisateur
  - [ ] Tentatives de connexion (succès/échec)
  - [ ] Actions sensibles (suppression, modification permissions)
- [ ] **Interface logs admin**
  - [ ] Visualisation logs en temps réel
  - [ ] Filtres par action, utilisateur, date
  - [ ] Recherche dans les logs
  - [ ] Export des logs

### 🚨 Système d'Alertes
- [ ] **Alertes automatiques**
  - [ ] Email pour actions critiques
  - [ ] Alertes de sécurité (tentatives de brute force)
  - [ ] Alertes de performance (API lente)
  - [ ] Rapports automatiques hebdomadaires
- [ ] **Notifications admin**
  - [ ] Nouveaux utilisateurs
  - [ ] Recettes à modérer
  - [ ] Erreurs système

---

## 🎯 PHASE 7: TESTS ET SÉCURITÉ

### 🧪 Tests Complets
- [ ] **Tests d'authentification**
  - [ ] Tentatives de connexion invalides
  - [ ] Accès non autorisé aux routes admin
  - [ ] Validation des permissions
  - [ ] Tests de session hijacking
- [ ] **Tests de performance**
  - [ ] Charge utilisateur simultanée (100+ users)
  - [ ] Stress test sur login
  - [ ] Performance génération de menus
- [ ] **Tests sécurité**
  - [ ] Protection injection SQL
  - [ ] Protection XSS
  - [ ] CSRF protection
  - [ ] Rate limiting efficace
  - [ ] Validation inputs côté serveur

### 🔒 Sécurité Production
- [ ] **Hardening serveur**
  - [ ] Variables d'environnement sécurisées
  - [ ] JWT secrets générés aléatoirement
  - [ ] Mots de passe admin forts par défaut
  - [ ] Configuration Redis sécurisée
- [ ] **Nginx sécurisé**
  - [ ] Routes admin protégées par IP (optionnel)
  - [ ] SSL obligatoire (HTTPS only)
  - [ ] Headers de sécurité
  - [ ] Rate limiting nginx

---

## 🎯 PHASE 8: DÉPLOIEMENT ET MAINTENANCE

### 🚀 Déploiement Production
- [ ] **Configuration environnement**
  - [ ] Secrets management (variables d'env)
  - [ ] Configuration base de données production
  - [ ] Configuration Redis/sessions
  - [ ] Configuration email production
- [ ] **Migration base de données**
  - [ ] Scripts de migration Prisma
  - [ ] Création admin par défaut
  - [ ] Données de test vs production
- [ ] **Monitoring production**
  - [ ] Logs centralisés
  - [ ] Alertes monitoring
  - [ ] Health checks

### 💾 Backup et Récupération
- [ ] **Stratégie backup**
  - [ ] Backup base de données quotidien
  - [ ] Backup fichiers utilisateur
  - [ ] Tests de récupération
  - [ ] Documentation procédures
- [ ] **Plan de récupération**
  - [ ] Procédure de rollback
  - [ ] Contact d'urgence
  - [ ] Temps de récupération objectif (RTO)

---

## 📚 DOCUMENTATION

### 📖 Documentation Technique
- [ ] **API Documentation**
  - [ ] Endpoints admin documentés
  - [ ] Schémas de permissions
  - [ ] Exemples d'utilisation
- [ ] **Guide d'installation**
  - [ ] Prérequis système
  - [ ] Étapes d'installation
  - [ ] Configuration
- [ ] **Guide admin**
  - [ ] Interface administrative
  - [ ] Gestion des utilisateurs
  - [ ] Résolution problèmes courants

### 🎓 Formation
- [ ] **Guide utilisateur**
  - [ ] Inscription et connexion
  - [ ] Utilisation de l'application
  - [ ] FAQ utilisateurs
- [ ] **Formation administrateurs**
  - [ ] Vidéos de formation
  - [ ] Bonnes pratiques
  - [ ] Procédures d'urgence

---

## 🏆 ORDRE DE DÉVELOPPEMENT RECOMMANDÉ

### 🥇 **SPRINT 1** (2-3 semaines) - Base Essentielle
1. Architecture base de données (tables admins, sessions, audit)
2. AuthService et middleware d'authentification
3. Routes d'authentification de base
4. Interface de login utilisateur simple
5. Dashboard admin minimal

### 🥈 **SPRINT 2** (2-3 semaines) - Fonctionnalités Core
1. Système de permissions complet
2. Interface admin utilisateurs
3. Gestion recettes admin
4. Interface utilisateur complète (register, profile)
5. Tests de sécurité de base

### 🥉 **SPRINT 3** (2-3 semaines) - Fonctionnalités Avancées
1. Analytics et monitoring
2. Système d'audit complet
3. Import/export données
4. Alertes et notifications
5. Tests de performance

### 🎖️ **SPRINT 4** (1-2 semaines) - Polish et Production
1. Interface polish et UX
2. Documentation complète
3. Tests approfondis
4. Déploiement production
5. Formation utilisateurs

---

## 🔧 STACK TECHNIQUE RECOMMANDÉE

### Backend
- **Node.js + Express.js** (déjà en place)
- **Prisma ORM** (déjà en place)
- **PostgreSQL** (déjà en place)
- **bcryptjs** (hashing mots de passe)
- **jsonwebtoken** (JWT tokens)
- **Redis** (sessions et cache)
- **express-rate-limit** (rate limiting)
- **helmet** (sécurité headers)
- **express-validator** (validation inputs)

### Frontend
- **Bootstrap 5** (déjà en place)
- **DataTables** (tables admin)
- **Chart.js** (graphiques analytics)
- **Vanilla JavaScript** (cohérent avec l'existant)
- **SweetAlert2** (modales jolies)

### Monitoring & Logs
- **Winston** (logging)
- **Morgan** (logs HTTP)
- **Node-cron** (tâches programmées)

---

## ✅ CRITÈRES DE SUCCÈS

- [ ] **Sécurité**: Authentification robuste, permissions granulaires
- [ ] **Performance**: < 500ms temps de réponse API
- [ ] **Usabilité**: Interface intuitive admin et utilisateur
- [ ] **Monitoring**: Visibilité complète sur l'utilisation
- [ ] **Scalabilité**: Architecture supportant 1000+ utilisateurs
- [ ] **Documentation**: Documentation complète pour maintenance

---

## 🚨 NOTES IMPORTANTES

⚠️ **Sécurité First**: Chaque fonctionnalité doit être pensée sécurité d'abord
⚠️ **Tests obligatoires**: Aucune fonctionnalité en production sans tests
⚠️ **Backup avant modification**: Toujours backup avant modification DB
⚠️ **Documentation à jour**: Maintenir la documentation à chaque changement

---

*Ce document est un guide complet pour implémenter un système d'administration et d'authentification professionnel. Chaque point peut être traité indépendamment pour une approche agile.*