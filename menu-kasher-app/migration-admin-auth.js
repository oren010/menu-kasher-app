#!/usr/bin/env node

/**
 * Script de migration pour ajouter les fonctionnalités d'administration et d'authentification
 * 
 * Ce script :
 * 1. Applique les nouvelles migrations Prisma
 * 2. Crée les rôles et permissions par défaut
 * 3. Crée un admin super utilisateur par défaut
 * 4. Initialise les données de base
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Configuration par défaut
const DEFAULT_ADMIN = {
  email: 'admin@menu-kasher.app',
  password: 'Admin123!',
  name: 'Administrateur Principal'
};

// Définition des rôles et permissions
const ROLES = [
  {
    name: 'super_admin',
    displayName: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'recipes.create', 'recipes.read', 'recipes.update', 'recipes.delete',
      'ingredients.create', 'ingredients.read', 'ingredients.update', 'ingredients.delete',
      'categories.create', 'categories.read', 'categories.update', 'categories.delete',
      'analytics.view', 'logs.view', 'system.settings',
      'admins.create', 'admins.read', 'admins.update', 'admins.delete'
    ]
  },
  {
    name: 'content_admin',
    displayName: 'Gestionnaire de Contenu',
    description: 'Gestion des recettes, ingrédients et catégories',
    permissions: [
      'recipes.create', 'recipes.read', 'recipes.update', 'recipes.delete',
      'ingredients.create', 'ingredients.read', 'ingredients.update', 'ingredients.delete',
      'categories.create', 'categories.read', 'categories.update', 'categories.delete',
      'users.read'
    ]
  },
  {
    name: 'user_admin',
    displayName: 'Gestionnaire Utilisateurs',
    description: 'Gestion des comptes utilisateurs',
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'recipes.read', 'ingredients.read', 'categories.read'
    ]
  },
  {
    name: 'analytics_admin',
    displayName: 'Analyste',
    description: 'Accès aux rapports et statistiques',
    permissions: [
      'analytics.view', 'logs.view',
      'users.read', 'recipes.read', 'ingredients.read'
    ]
  }
];

const PERMISSIONS = [
  // Users
  { name: 'users.create', resource: 'users', action: 'create', description: 'Créer des utilisateurs' },
  { name: 'users.read', resource: 'users', action: 'read', description: 'Voir les utilisateurs' },
  { name: 'users.update', resource: 'users', action: 'update', description: 'Modifier les utilisateurs' },
  { name: 'users.delete', resource: 'users', action: 'delete', description: 'Supprimer les utilisateurs' },
  
  // Recipes
  { name: 'recipes.create', resource: 'recipes', action: 'create', description: 'Créer des recettes' },
  { name: 'recipes.read', resource: 'recipes', action: 'read', description: 'Voir les recettes' },
  { name: 'recipes.update', resource: 'recipes', action: 'update', description: 'Modifier les recettes' },
  { name: 'recipes.delete', resource: 'recipes', action: 'delete', description: 'Supprimer les recettes' },
  
  // Ingredients
  { name: 'ingredients.create', resource: 'ingredients', action: 'create', description: 'Créer des ingrédients' },
  { name: 'ingredients.read', resource: 'ingredients', action: 'read', description: 'Voir les ingrédients' },
  { name: 'ingredients.update', resource: 'ingredients', action: 'update', description: 'Modifier les ingrédients' },
  { name: 'ingredients.delete', resource: 'ingredients', action: 'delete', description: 'Supprimer les ingrédients' },
  
  // Categories
  { name: 'categories.create', resource: 'categories', action: 'create', description: 'Créer des catégories' },
  { name: 'categories.read', resource: 'categories', action: 'read', description: 'Voir les catégories' },
  { name: 'categories.update', resource: 'categories', action: 'update', description: 'Modifier les catégories' },
  { name: 'categories.delete', resource: 'categories', action: 'delete', description: 'Supprimer les catégories' },
  
  // Analytics & Logs
  { name: 'analytics.view', resource: 'analytics', action: 'view', description: 'Voir les statistiques' },
  { name: 'logs.view', resource: 'logs', action: 'view', description: 'Voir les logs d\'audit' },
  { name: 'system.settings', resource: 'system', action: 'settings', description: 'Gérer les paramètres système' },
  
  // Admins
  { name: 'admins.create', resource: 'admins', action: 'create', description: 'Créer des administrateurs' },
  { name: 'admins.read', resource: 'admins', action: 'read', description: 'Voir les administrateurs' },
  { name: 'admins.update', resource: 'admins', action: 'update', description: 'Modifier les administrateurs' },
  { name: 'admins.delete', resource: 'admins', action: 'delete', description: 'Supprimer les administrateurs' }
];

async function createPermissions() {
  console.log('📝 Création des permissions...');
  
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission
    });
  }
  
  console.log(`✅ ${PERMISSIONS.length} permissions créées/mises à jour`);
}

async function createRoles() {
  console.log('👥 Création des rôles...');
  
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions
      },
      create: role
    });
  }
  
  console.log(`✅ ${ROLES.length} rôles créés/mis à jour`);
}

async function createDefaultAdmin() {
  console.log('👑 Création de l\'administrateur par défaut...');
  
  // Vérifier si un admin existe déjà
  const existingAdmin = await prisma.admin.findFirst({
    where: { email: DEFAULT_ADMIN.email }
  });
  
  if (existingAdmin) {
    console.log('⚠️  Un administrateur avec cet email existe déjà');
    return existingAdmin;
  }
  
  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
  
  // Créer l'admin
  const admin = await prisma.admin.create({
    data: {
      email: DEFAULT_ADMIN.email,
      passwordHash: passwordHash,
      name: DEFAULT_ADMIN.name,
      role: 'super_admin',
      permissions: ROLES.find(r => r.name === 'super_admin').permissions
    }
  });
  
  console.log(`✅ Administrateur créé : ${admin.email}`);
  console.log(`🔑 Mot de passe temporaire : ${DEFAULT_ADMIN.password}`);
  console.log('⚠️  CHANGEZ CE MOT DE PASSE APRÈS LA PREMIÈRE CONNEXION !');
  
  return admin;
}

async function updateExistingUsers() {
  console.log('🔄 Mise à jour des utilisateurs existants...');
  
  // Ajouter des valeurs par défaut pour les nouveaux champs
  const usersToUpdate = await prisma.user.findMany({
    where: {
      passwordHash: null
    }
  });
  
  console.log(`📋 ${usersToUpdate.length} utilisateurs à mettre à jour`);
  
  for (const user of usersToUpdate) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Pas de mot de passe pour l'instant - ils devront s'inscrire
        emailVerified: false, // Email non vérifié
        isActive: true, // Compte actif
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: null
      }
    });
  }
  
  console.log('✅ Utilisateurs mis à jour');
}

async function logMigration() {
  console.log('📊 Enregistrement de la migration...');
  
  // Créer un log d'audit pour cette migration
  await prisma.auditLog.create({
    data: {
      action: 'MIGRATION',
      tableName: 'system',
      recordId: 'admin-auth-migration',
      newData: {
        migration: 'admin-auth-system',
        timestamp: new Date().toISOString(),
        permissions_count: PERMISSIONS.length,
        roles_count: ROLES.length,
        default_admin_created: true
      },
      success: true,
      ipAddress: '127.0.0.1',
      endpoint: 'migration-script'
    }
  });
  
  console.log('✅ Migration enregistrée dans les logs');
}

async function main() {
  try {
    console.log('🚀 Démarrage de la migration Admin & Auth...\n');
    
    // 1. Créer les permissions
    await createPermissions();
    
    // 2. Créer les rôles
    await createRoles();
    
    // 3. Mettre à jour les utilisateurs existants
    await updateExistingUsers();
    
    // 4. Créer l'admin par défaut
    await createDefaultAdmin();
    
    // 5. Logger la migration
    await logMigration();
    
    console.log('\n🎉 Migration terminée avec succès !');
    console.log('\n📋 Résumé :');
    console.log(`   • ${PERMISSIONS.length} permissions créées`);
    console.log(`   • ${ROLES.length} rôles créés`);
    console.log(`   • Administrateur par défaut : ${DEFAULT_ADMIN.email}`);
    console.log(`   • Mot de passe temporaire : ${DEFAULT_ADMIN.password}`);
    console.log('\n⚠️  IMPORTANT : Changez le mot de passe admin après la première connexion !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  createPermissions,
  createRoles,
  createDefaultAdmin,
  updateExistingUsers,
  ROLES,
  PERMISSIONS,
  DEFAULT_ADMIN
};