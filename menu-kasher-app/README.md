# 🏠 Menu Kasher Familial

Application web de gestion de menus et de courses optimisée pour une famille kasher, avec distinction enfants/adultes, génération automatique de menus, recettes, liste de courses par catégories et quantités.

## 🎯 Objectif du projet

Développer une application web familiale qui respecte les contraintes kasher et facilite l'organisation des repas en famille avec :

- **Gestion de menus hebdomadaires** : Planification sur 14 jours glissants
- **Recettes adaptées** : Base de recettes kasher pour chaque type de repas
- **Génération automatique** : Création de menus selon les préférences
- **Listes de courses intelligentes** : Agrégation par catégories et quantités
- **Interface familiale** : Simple, intuitive et responsive

## 🔧 Stack technique

### Frontend
- **Interface** : HTML5 + CSS3 + JavaScript (Vanilla)
- **Framework CSS** : Bootstrap 5.3
- **Icons** : Bootstrap Icons
- **Design** : Interface familiale, responsive, moderne

### Backend
- **Runtime** : Node.js 18
- **Framework** : Express.js
- **Base de données** : PostgreSQL (conteneur Docker local)
- **ORM** : Prisma avec migrations automatiques
- **API** : REST endpoints

### Déploiement
- **Conteneurisation** : Docker + Docker Compose
- **Reverse Proxy** : Nginx
- **SSL** : Certificats Elestio
- **Infrastructure** : Elestio (requis pour fonctionnement complet)

## 📦 Structure du projet

```
menu-kasher-app/
├── public/                     # Frontend statique
│   ├── index.html             # Interface principale
│   └── app.js                 # Logique JavaScript
├── services/                   # Services métier
│   ├── MenuService.js         # Gestion des menus
│   ├── RecipeService.js       # Gestion des recettes
│   └── ShoppingListService.js # Gestion des courses
├── prisma/                    # Configuration base de données
│   ├── schema.prisma          # Schéma des tables
│   ├── seed.js               # Données de démarrage
│   └── migrations/           # Migrations automatiques
├── init-db/                   # Scripts d'initialisation PostgreSQL
│   └── 01-init.sql           # Script d'initialisation
├── postgres-data/             # Données PostgreSQL persistantes (généré)
├── server.js                  # Serveur principal (avec PostgreSQL)
├── server-simple.js           # Serveur démo (données en mémoire)
├── package.json               # Dépendances Node.js
└── README.md                  # Documentation
```

## 🗄️ Base de données

### Tables principales

- **Users** : Profils famille (taille, enfants, préférences kasher)
- **Categories** : Catégories d'ingrédients (fruits/légumes, viandes, etc.)
- **Ingredients** : Base centralisée d'ingrédients kasher
- **Recipes** : Recettes avec instructions, temps, ustensiles
- **Menus** : Plannings de 14 jours
- **Meals** : Repas individuels (déjeuner/dîner enfants/adultes)
- **ShoppingLists** : Listes générées automatiquement
- **ShoppingListItems** : Articles avec quantités agrégées

## 🧠 Fonctionnalités

### ✅ Implémentées

#### Gestion des menus
- Création de menus sur 14 jours
- Types de repas :
  - **Déjeuner enfants** : Froid, simple, transportable
  - **Dîner enfants** : Inspiré des adultes, simplifié
  - **Dîner adultes** : Gastronomique avec suggestion de boisson
- **Contraintes Shabbat** : Pas de menu vendredi soir ni samedi midi
- **Dessert spécial** : Samedi soir uniquement pour adultes
- Génération automatique avec préférences
- Adaptation des portions selon la famille

#### Gestion des recettes
- Base de recettes kasher
- Filtrage par type de repas
- Recherche textuelle
- Détails complets (ingrédients, instructions, temps)
- Suggestions de boissons
- Gestion des ustensiles nécessaires

#### Listes de courses
- Génération automatique depuis les menus
- Agrégation intelligente des quantités
- Groupement par catégories
- Gestion d'achat (cocher les articles)
- Export/impression (prévu)

#### Interface utilisateur
- Navigation par onglets (Menus, Recettes, Courses, Ingrédients)
- Design responsive (mobile-friendly)
- Animations et transitions fluides
- Modales pour les détails
- Notifications utilisateur

### 🚧 Contraintes respectées

- **100% Kasher** : Tous les ingrédients et recettes
- **Aucun tofu** : Exclusion explicite
- **Pas de menu Shabbat** : Vendredi soir et samedi midi
- **Simplicité enfants** : Déjeuners transportables
- **App privée** : Usage familial interne

## 🚀 Installation et déploiement

### Prérequis
- Infrastructure Elestio (obligatoire)
- Docker et Docker Compose
- Node.js 18+ (pour développement local)

### Démarrage rapide

L'application utilise maintenant PostgreSQL en conteneur Docker local avec migrations automatiques !

1. **Démarrage automatique**
```bash
# L'application démarre automatiquement avec PostgreSQL
docker compose up -d postgres menu-kasher-app
```

2. **Configuration automatique**
- PostgreSQL se configure automatiquement
- Les migrations Prisma s'exécutent au démarrage
- Les données de démonstration sont ajoutées
- L'application est immédiatement opérationnelle

3. **Accès aux données**
- **Interface web** : https://votre-domaine.elestio.app
- **API** : https://votre-domaine.elestio.app/api/
- **PostgreSQL** : Accessible sur le port 15432 (externe)

### Déploiement Docker

L'application est automatiquement déployée via Docker Compose :

```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "172.17.0.1:15432:5432"
    volumes:
      - ./menu-kasher-app/postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=menu_kasher
      - POSTGRES_USER=menu_user
      - POSTGRES_PASSWORD=menu_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U menu_user -d menu_kasher"]

  menu-kasher-app:
    image: node:18
    ports:
      - "172.17.0.1:13001:3001"
    volumes:
      - ./menu-kasher-app:/app
    working_dir: /app
    restart: always
    command: sh -c "npm install && npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run start-full"
    environment:
      - DATABASE_URL=postgresql://menu_user:menu_password@postgres:5432/menu_kasher?schema=public
    depends_on:
      postgres:
        condition: service_healthy
```

### Accès à l'application

- **URL** : https://votre-domaine.elestio.app
- **API** : https://votre-domaine.elestio.app/api/
- **Port interne** : 3001
- **Statut** : https://votre-domaine.elestio.app/api/

## 🔌 API Endpoints

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détails utilisateur

### Recettes
- `GET /api/recipes` - Liste des recettes
- `GET /api/recipes/:id` - Détails recette
- `POST /api/recipes` - Créer recette
- `PUT /api/recipes/:id` - Modifier recette

### Menus
- `GET /api/menus` - Liste des menus
- `GET /api/menus/:id` - Détails menu avec repas
- `POST /api/menus` - Créer menu
- `POST /api/menus/:id/generate` - Générer repas automatiquement

### Listes de courses
- `GET /api/shopping-lists` - Liste des courses
- `POST /api/shopping-lists/generate` - Générer depuis menu

### Ingrédients
- `GET /api/categories` - Catégories avec ingrédients
- `GET /api/ingredients` - Liste des ingrédients
- `POST /api/ingredients` - Ajouter ingrédient

### Statistiques
- `GET /api/stats` - Statistiques globales

## 🎨 Design et UX

### Palette de couleurs
- **Primaire** : #2E5266 (Bleu foncé)
- **Secondaire** : #6C9BD1 (Bleu clair)
- **Accent** : #F4A261 (Orange chaleureux)
- **Succès** : #2A9D8F (Vert)
- **Arrière-plan** : #F8F9FA (Gris très clair)

### Typographie
- **Police** : Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Hiérarchie** : H1-H6 avec tailles adaptatives
- **Lisibilité** : Contraste optimisé pour tous les âges

### Responsive Design
- **Mobile First** : Interface optimisée mobile
- **Breakpoints** : Bootstrap 5 standards
- **Navigation** : Onglets adaptatifs
- **Cards** : Système de grille flexible

## 📱 Utilisation

### Créer un menu
1. Aller dans l'onglet "Menus"
2. Cliquer "Nouveau Menu"
3. Définir nom et date de début
4. Cliquer "Générer" pour remplir automatiquement

### Consulter les recettes
1. Onglet "Recettes"
2. Filtrer par type de repas
3. Rechercher par nom/ingrédient
4. Cliquer "Voir" pour les détails

### Générer une liste de courses
1. Avoir un menu actif
2. Onglet "Courses"
3. Cliquer "Générer Liste"
4. La liste agrège automatiquement les ingrédients

### Gérer les ingrédients
1. Onglet "Ingrédients"
2. Parcourir par catégories
3. Vérifier le statut kasher
4. Ajouter de nouveaux ingrédients

## 🔧 Développement

### Scripts disponibles
```bash
npm start          # Version démo (données en mémoire)
npm run start-full # Version complète avec PostgreSQL
npm run dev        # Mode développement avec auto-reload
npm run migrate    # Migrations Prisma
npm run generate   # Générer client Prisma
npm run seed       # Peupler la base de données
```

### Architecture modulaire
- **Services** : Logique métier séparée
- **API REST** : Endpoints découplés
- **Frontend statique** : Pas de framework lourd
- **Volume mounts** : Développement en temps réel

### Base de données PostgreSQL
- **Conteneur Docker** : PostgreSQL 15 Alpine
- **Persistance** : Volume Docker pour les données
- **Migrations automatiques** : Prisma au démarrage
- **Healthcheck** : Vérification de santé automatique
- **Accès admin** : Port 15432 pour outils externes

**Connexion à la base :**
```bash
# Avec psql
psql -h 172.17.0.1 -p 15432 -U menu_user -d menu_kasher

# Variables de connexion
Host: 172.17.0.1
Port: 15432
Database: menu_kasher
Username: menu_user
Password: menu_password
```

### Extensibilité
- Ajout facile de nouveaux types de repas
- Système de plugins pour contraintes alimentaires
- API prête pour application mobile
- Base de données évolutive avec migrations

## 🐛 Dépannage

### Problèmes courants

**L'application ne démarre pas**
```bash
# Vérifier les logs Docker
docker logs app-menu-kasher-app-1

# Redémarrer le conteneur
docker compose restart menu-kasher-app
```

**Erreur de base de données**
```bash
# Vérifier PostgreSQL
docker logs app-postgres-1

# Redémarrer PostgreSQL
docker compose restart postgres

# Vérifier la connectivité
nc -zv 172.17.0.1 15432

# Version de secours (sans BDD)
npm start
```

**Interface non accessible**
```bash
# Vérifier nginx
docker compose -f /opt/elestio/nginx/docker-compose.yml logs

# Tester connectivité interne
curl http://172.17.0.1:13001
```

## 🚀 Prochaines évolutions

### Fonctionnalités prévues
- [ ] **Gestion du stock** : Ingrédients disponibles
- [ ] **Historique des menus** : Réutilisation facile
- [ ] **Export PDF** : Menus et listes imprimables
- [ ] **Notifications** : Rappels de courses
- [ ] **Multi-utilisateurs** : Plusieurs familles
- [ ] **Mode hors-ligne** : PWA avec cache
- [ ] **Intégration externe** : APIs de courses en ligne

### Améliorations techniques
- [ ] **Tests automatisés** : Unit + Integration
- [ ] **Performance** : Cache Redis
- [ ] **Monitoring** : Logs structurés
- [ ] **Mobile app** : React Native
- [ ] **i18n** : Support multilingue

## 📄 Licence

Projet privé familial - Usage interne uniquement

---

**🏠 Fait avec ❤️ pour les familles kasher**

*Application développée selon les meilleures pratiques et optimisée pour l'infrastructure Elestio*