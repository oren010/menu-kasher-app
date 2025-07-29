-- Script d'initialisation de la base de données Menu Kasher
-- Ce script est exécuté automatiquement lors du premier démarrage de PostgreSQL

-- Assurer que l'utilisateur et la base existent
-- (déjà créés par les variables d'environnement Docker)

-- Extensions utiles pour PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Confirmer que la base est prête
SELECT 'Base de données Menu Kasher initialisée avec succès!' as message;