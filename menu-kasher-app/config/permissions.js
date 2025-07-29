/**
 * Configuration des rôles et permissions pour le système d'administration
 * 
 * Ce fichier définit :
 * - Les rôles disponibles et leurs permissions
 * - Les permissions granulaires par ressource
 * - Les matrices de permissions
 */

// PERMISSIONS GRANULAIRES
const PERMISSIONS = {
  // Gestion des utilisateurs
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete'
  },
  
  // Gestion des recettes
  RECIPES: {
    CREATE: 'recipes.create',
    READ: 'recipes.read',
    UPDATE: 'recipes.update',
    DELETE: 'recipes.delete'
  },
  
  // Gestion des ingrédients
  INGREDIENTS: {
    CREATE: 'ingredients.create',
    READ: 'ingredients.read',
    UPDATE: 'ingredients.update',
    DELETE: 'ingredients.delete'
  },
  
  // Gestion des catégories
  CATEGORIES: {
    CREATE: 'categories.create',
    READ: 'categories.read',
    UPDATE: 'categories.update',
    DELETE: 'categories.delete'
  },
  
  // Analytics et logs
  ANALYTICS: {
    VIEW: 'analytics.view'
  },
  
  LOGS: {
    VIEW: 'logs.view'
  },
  
  // Système
  SYSTEM: {
    SETTINGS: 'system.settings'
  },
  
  // Gestion des admins
  ADMINS: {
    CREATE: 'admins.create',
    READ: 'admins.read',
    UPDATE: 'admins.update',
    DELETE: 'admins.delete'
  }
};

// RÔLES ET LEURS PERMISSIONS
const ROLES = {
  SUPER_ADMIN: {
    name: 'super_admin',
    displayName: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système',
    permissions: [
      // Utilisateurs
      PERMISSIONS.USERS.CREATE,
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.UPDATE,
      PERMISSIONS.USERS.DELETE,
      
      // Recettes
      PERMISSIONS.RECIPES.CREATE,
      PERMISSIONS.RECIPES.READ,
      PERMISSIONS.RECIPES.UPDATE,
      PERMISSIONS.RECIPES.DELETE,
      
      // Ingrédients
      PERMISSIONS.INGREDIENTS.CREATE,
      PERMISSIONS.INGREDIENTS.READ,
      PERMISSIONS.INGREDIENTS.UPDATE,
      PERMISSIONS.INGREDIENTS.DELETE,
      
      // Catégories
      PERMISSIONS.CATEGORIES.CREATE,
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.CATEGORIES.UPDATE,
      PERMISSIONS.CATEGORIES.DELETE,
      
      // Analytics & Logs
      PERMISSIONS.ANALYTICS.VIEW,
      PERMISSIONS.LOGS.VIEW,
      PERMISSIONS.SYSTEM.SETTINGS,
      
      // Admins
      PERMISSIONS.ADMINS.CREATE,
      PERMISSIONS.ADMINS.READ,
      PERMISSIONS.ADMINS.UPDATE,
      PERMISSIONS.ADMINS.DELETE
    ]
  },
  
  CONTENT_ADMIN: {
    name: 'content_admin',
    displayName: 'Gestionnaire de Contenu',
    description: 'Gestion des recettes, ingrédients et catégories',
    permissions: [
      // Recettes (complet)
      PERMISSIONS.RECIPES.CREATE,
      PERMISSIONS.RECIPES.READ,
      PERMISSIONS.RECIPES.UPDATE,
      PERMISSIONS.RECIPES.DELETE,
      
      // Ingrédients (complet)
      PERMISSIONS.INGREDIENTS.CREATE,
      PERMISSIONS.INGREDIENTS.READ,
      PERMISSIONS.INGREDIENTS.UPDATE,
      PERMISSIONS.INGREDIENTS.DELETE,
      
      // Catégories (complet)
      PERMISSIONS.CATEGORIES.CREATE,
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.CATEGORIES.UPDATE,
      PERMISSIONS.CATEGORIES.DELETE,
      
      // Utilisateurs (lecture seule)
      PERMISSIONS.USERS.READ
    ]
  },
  
  USER_ADMIN: {
    name: 'user_admin',
    displayName: 'Gestionnaire Utilisateurs',
    description: 'Gestion des comptes utilisateurs et de leurs données',
    permissions: [
      // Utilisateurs (complet)
      PERMISSIONS.USERS.CREATE,
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.UPDATE,
      PERMISSIONS.USERS.DELETE,
      
      // Contenu (lecture seule pour contexte)
      PERMISSIONS.RECIPES.READ,
      PERMISSIONS.INGREDIENTS.READ,
      PERMISSIONS.CATEGORIES.READ
    ]
  },
  
  ANALYTICS_ADMIN: {
    name: 'analytics_admin',
    displayName: 'Analyste',
    description: 'Accès aux rapports, statistiques et logs du système',
    permissions: [
      // Analytics et logs
      PERMISSIONS.ANALYTICS.VIEW,
      PERMISSIONS.LOGS.VIEW,
      
      // Lecture seule sur tout pour les rapports
      PERMISSIONS.USERS.READ,
      PERMISSIONS.RECIPES.READ,
      PERMISSIONS.INGREDIENTS.READ,
      PERMISSIONS.CATEGORIES.READ
    ]
  }
};

// MATRICE DE PERMISSIONS POUR INTERFACE ADMIN
const PERMISSION_MATRIX = {
  // Pages accessibles par rôle
  PAGES: {
    '/admin/dashboard': ['super_admin', 'content_admin', 'user_admin', 'analytics_admin'],
    '/admin/users': ['super_admin', 'user_admin'],
    '/admin/recipes': ['super_admin', 'content_admin'],
    '/admin/ingredients': ['super_admin', 'content_admin'],
    '/admin/categories': ['super_admin', 'content_admin'],
    '/admin/analytics': ['super_admin', 'analytics_admin'],
    '/admin/logs': ['super_admin', 'analytics_admin'],
    '/admin/settings': ['super_admin'],
    '/admin/admins': ['super_admin']
  },
  
  // API endpoints par permission
  API_ENDPOINTS: {
    'GET /api/users': [PERMISSIONS.USERS.READ],
    'POST /api/users': [PERMISSIONS.USERS.CREATE],
    'PUT /api/users/:id': [PERMISSIONS.USERS.UPDATE],
    'DELETE /api/users/:id': [PERMISSIONS.USERS.DELETE],
    
    'GET /api/recipes': [PERMISSIONS.RECIPES.READ],
    'POST /api/recipes': [PERMISSIONS.RECIPES.CREATE],
    'PUT /api/recipes/:id': [PERMISSIONS.RECIPES.UPDATE],
    'DELETE /api/recipes/:id': [PERMISSIONS.RECIPES.DELETE],
    
    'GET /api/ingredients': [PERMISSIONS.INGREDIENTS.READ],
    'POST /api/ingredients': [PERMISSIONS.INGREDIENTS.CREATE],
    'PUT /api/ingredients/:id': [PERMISSIONS.INGREDIENTS.UPDATE],
    'DELETE /api/ingredients/:id': [PERMISSIONS.INGREDIENTS.DELETE],
    
    'GET /api/categories': [PERMISSIONS.CATEGORIES.READ],
    'POST /api/categories': [PERMISSIONS.CATEGORIES.CREATE],
    'PUT /api/categories/:id': [PERMISSIONS.CATEGORIES.UPDATE],
    'DELETE /api/categories/:id': [PERMISSIONS.CATEGORIES.DELETE],
    
    'GET /api/analytics/*': [PERMISSIONS.ANALYTICS.VIEW],
    'GET /api/logs': [PERMISSIONS.LOGS.VIEW],
    'GET /api/settings': [PERMISSIONS.SYSTEM.SETTINGS],
    'PUT /api/settings': [PERMISSIONS.SYSTEM.SETTINGS],
    
    'GET /api/admin/users': [PERMISSIONS.ADMINS.READ],
    'POST /api/admin/users': [PERMISSIONS.ADMINS.CREATE],
    'PUT /api/admin/users/:id': [PERMISSIONS.ADMINS.UPDATE],
    'DELETE /api/admin/users/:id': [PERMISSIONS.ADMINS.DELETE]
  }
};

// UTILITAIRES POUR VÉRIFICATION DES PERMISSIONS
const PermissionUtils = {
  /**
   * Vérifie si un admin a une permission spécifique
   */
  hasPermission(adminPermissions, requiredPermission) {
    return adminPermissions.includes(requiredPermission);
  },
  
  /**
   * Vérifie si un admin a l'un des permissions requis (OR)
   */
  hasAnyPermission(adminPermissions, requiredPermissions) {
    return requiredPermissions.some(permission => 
      adminPermissions.includes(permission)
    );
  },
  
  /**
   * Vérifie si un admin a tous les permissions requis (AND)
   */
  hasAllPermissions(adminPermissions, requiredPermissions) {
    return requiredPermissions.every(permission => 
      adminPermissions.includes(permission)
    );
  },
  
  /**
   * Obtient les permissions d'un rôle
   */
  getRolePermissions(roleName) {
    const role = Object.values(ROLES).find(r => r.name === roleName);
    return role ? role.permissions : [];
  },
  
  /**
   * Vérifie si un rôle peut accéder à une page
   */
  canAccessPage(roleName, pagePath) {
    const allowedRoles = PERMISSION_MATRIX.PAGES[pagePath];
    return allowedRoles && allowedRoles.includes(roleName);
  },
  
  /**
   * Vérifie si un admin peut accéder à un endpoint API
   */
  canAccessEndpoint(adminPermissions, method, path) {
    const endpointKey = `${method.toUpperCase()} ${path}`;
    const requiredPermissions = PERMISSION_MATRIX.API_ENDPOINTS[endpointKey];
    
    if (!requiredPermissions) {
      return false; // Endpoint non défini = accès refusé
    }
    
    return this.hasAnyPermission(adminPermissions, requiredPermissions);
  }
};

module.exports = {
  PERMISSIONS,
  ROLES,
  PERMISSION_MATRIX,
  PermissionUtils
};