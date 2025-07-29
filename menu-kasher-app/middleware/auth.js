const AuthService = require('../services/AuthService');
const rateLimit = require('express-rate-limit');

// ========================================
// MIDDLEWARE D'AUTHENTIFICATION UTILISATEURS
// ========================================

/**
 * Middleware pour vérifier l'authentification des utilisateurs
 */
const requireAuth = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.substring(7); // Retirer "Bearer "

    // Vérifier le token
    const decoded = AuthService.verifyJWT(token);

    // Vérifier que c'est un token utilisateur
    if (decoded.type !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Token invalide pour cette ressource'
      });
    }

    // Récupérer l'utilisateur depuis la base de données
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        adultsCount: true,
        childrenCount: true,
        allergens: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte utilisateur désactivé'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    req.userToken = decoded;

    await prisma.$disconnect();
    next();

  } catch (error) {
    console.error('Erreur middleware requireAuth:', error);
    
    let message = 'Erreur d\'authentification';
    let status = 401;

    if (error.message === 'Token expiré') {
      message = 'Token expiré, veuillez vous reconnecter';
    } else if (error.message === 'Token invalide') {
      message = 'Token invalide';
    }

    return res.status(status).json({
      success: false,
      message: message
    });
  }
};

// ========================================
// MIDDLEWARE D'AUTHENTIFICATION ADMINISTRATEURS
// ========================================

/**
 * Middleware pour vérifier l'authentification des administrateurs
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification administrateur requis'
      });
    }

    const token = authHeader.substring(7); // Retirer "Bearer "

    // Vérifier le token
    const decoded = AuthService.verifyJWT(token);

    // Vérifier que c'est un token admin
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès administrateur requis'
      });
    }

    // Récupérer l'administrateur depuis la base de données
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Administrateur non trouvé'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte administrateur désactivé'
      });
    }

    // Ajouter l'admin à la requête
    req.admin = admin;
    req.adminToken = decoded;

    await prisma.$disconnect();
    next();

  } catch (error) {
    console.error('Erreur middleware requireAdmin:', error);
    
    let message = 'Erreur d\'authentification administrateur';
    let status = 401;

    if (error.message === 'Token expiré') {
      message = 'Token administrateur expiré, veuillez vous reconnecter';
    } else if (error.message === 'Token invalide') {
      message = 'Token administrateur invalide';
    }

    return res.status(status).json({
      success: false,
      message: message
    });
  }
};

// ========================================
// MIDDLEWARE DE PERMISSIONS SPÉCIFIQUES
// ========================================

/**
 * Middleware pour vérifier une permission spécifique
 * Utilise requireAdmin en premier
 */
const requirePermission = (permission) => {
  return [
    requireAdmin, // D'abord vérifier l'auth admin
    async (req, res, next) => {
      try {
        const admin = req.admin;

        // Vérifier la permission
        const hasPermission = AuthService.hasPermission(admin.permissions, permission);

        if (!hasPermission) {
          // Log de tentative d'accès non autorisé
          await AuthService.createAuditLog({
            adminId: admin.id,
            action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            newData: { 
              permission: permission,
              endpoint: req.originalUrl,
              method: req.method
            },
            ipAddress: req.ip,
            endpoint: req.originalUrl,
            httpMethod: req.method,
            success: false
          });

          return res.status(403).json({
            success: false,
            message: `Permission '${permission}' requise`
          });
        }

        next();

      } catch (error) {
        console.error('Erreur middleware requirePermission:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur de vérification des permissions'
        });
      }
    }
  ];
};

// ========================================
// MIDDLEWARE DE LIMITATION DE TAUX
// ========================================

/**
 * Rate limiter pour les tentatives de connexion
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Maximum 15 tentatives par IP (augmenté de 5 à 15)
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Utiliser le générateur IP par défaut (gère IPv6 automatiquement)
  // keyGenerator par défaut gère automatiquement IPv4/IPv6
  // Ignorer les requêtes réussies - NE PAS compter les connexions valides
  skipSuccessfulRequests: true,
  // Ignorer les requêtes en cas de succès HTTP
  skip: (req, res) => res.statusCode < 400,
  // Handler personnalisé
  handler: (req, res) => {
    console.log(`🚫 Rate limit dépassé pour IP: ${req.ip}, Email: ${req.body.email || 'N/A'}`);
    res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion. Veuillez patienter 15 minutes avant de réessayer.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter général pour les API
 */
const generalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Maximum 100 requêtes par IP par minute
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez ralentir.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter permissif pour l'authentification admin
 */
const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Maximum 200 requêtes par IP par minute (plus permissif)
  message: {
    success: false,
    message: 'Trop de requêtes d\'authentification. Veuillez ralentir.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * Rate limiter strict pour les actions administratives sensibles
 */
const adminActionRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Maximum 20 actions par admin par 5 minutes
  message: {
    success: false,
    message: 'Trop d\'actions administratives. Veuillez patienter.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ========================================
// MIDDLEWARE D'AUDIT AUTOMATIQUE
// ========================================

/**
 * Middleware pour enregistrer automatiquement les actions dans les logs d'audit
 */
const auditLogger = (action, tableName = null) => {
  return async (req, res, next) => {
    // Sauvegarder la méthode send originale
    const originalSend = res.send;

    // Remplacer res.send pour capturer la réponse
    res.send = function(data) {
      try {
        // Déterminer si l'action a réussi
        let success = true;
        let responseData = null;

        if (typeof data === 'string') {
          try {
            responseData = JSON.parse(data);
            success = responseData.success !== false && res.statusCode < 400;
          } catch (e) {
            success = res.statusCode < 400;
          }
        } else if (typeof data === 'object') {
          responseData = data;
          success = data.success !== false && res.statusCode < 400;
        } else {
          success = res.statusCode < 400;
        }

        // Créer le log d'audit
        const logData = {
          action: action,
          tableName: tableName,
          ipAddress: req.ip,
          endpoint: req.originalUrl,
          httpMethod: req.method,
          success: success
        };

        // Ajouter l'ID de l'admin ou de l'utilisateur
        if (req.admin) {
          logData.adminId = req.admin.id;
        } else if (req.user) {
          logData.userId = req.user.id;
        }

        // Ajouter les données de la requête (en excluant les mots de passe)
        if (req.body && Object.keys(req.body).length > 0) {
          const sanitizedBody = { ...req.body };
          delete sanitizedBody.password;
          delete sanitizedBody.passwordHash;
          delete sanitizedBody.currentPassword;
          delete sanitizedBody.newPassword;
          
          logData.newData = sanitizedBody;
        }

        // Créer le log de manière asynchrone
        AuthService.createAuditLog(logData).catch(error => {
          console.error('Erreur lors de la création du log d\'audit:', error);
        });

      } catch (error) {
        console.error('Erreur dans le middleware auditLogger:', error);
      }

      // Appeler la méthode send originale
      return originalSend.call(this, data);
    };

    next();
  };
};

// ========================================
// MIDDLEWARE DE VALIDATION DES DONNÉES
// ========================================

/**
 * Middleware pour valider les données d'inscription
 */
const validateRegistration = (req, res, next) => {
  const { email, password, name, adultsCount, childrenCount } = req.body;

  // Validation email
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({
      success: false,
      message: 'Email invalide'
    });
  }

  // Validation mot de passe
  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Le mot de passe doit contenir au moins 8 caractères'
    });
  }

  // Vérifier la complexité du mot de passe
  if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
    return res.status(400).json({
      success: false,
      message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    });
  }

  // Validation nom
  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Le nom doit contenir au moins 2 caractères'
    });
  }

  // Validation compteurs famille (optionnels mais doivent être valides si fournis)
  if (adultsCount !== undefined && (isNaN(adultsCount) || adultsCount < 1 || adultsCount > 10)) {
    return res.status(400).json({
      success: false,
      message: 'Le nombre d\'adultes doit être entre 1 et 10'
    });
  }

  if (childrenCount !== undefined && (isNaN(childrenCount) || childrenCount < 0 || childrenCount > 10)) {
    return res.status(400).json({
      success: false,
      message: 'Le nombre d\'enfants doit être entre 0 et 10'
    });
  }

  next();
};

/**
 * Middleware pour valider les données de connexion
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email et mot de passe requis'
    });
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({
      success: false,
      message: 'Format d\'email invalide'
    });
  }

  next();
};

// ========================================
// MIDDLEWARE DE SÉCURITÉ HEADERS
// ========================================

/**
 * Middleware pour ajouter des headers de sécurité
 */
const securityHeaders = (req, res, next) => {
  // Protection contre le clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Protection XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Empêcher la détection MIME
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Politique de référent stricte
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Politique de permissions
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requirePermission,
  loginRateLimiter,
  generalRateLimiter,
  authRateLimiter,
  adminActionRateLimiter,
  auditLogger,
  validateRegistration,
  validateLogin,
  securityHeaders
};