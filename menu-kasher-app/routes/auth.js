const express = require('express');
const AuthService = require('../services/AuthService');
const { 
  loginRateLimiter, 
  generalRateLimiter,
  authRateLimiter,
  validateRegistration, 
  validateLogin, 
  requireAuth, 
  requireAdmin,
  auditLogger,
  securityHeaders
} = require('../middleware/auth');

const router = express.Router();

// Appliquer les headers de sécurité à toutes les routes
router.use(securityHeaders);

// ========================================
// ROUTES D'AUTHENTIFICATION UTILISATEURS
// ========================================

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', 
  generalRateLimiter,
  validateRegistration,
  auditLogger('USER_REGISTER', 'users'),
  async (req, res) => {
    try {
      const { email, password, name, adultsCount, childrenCount, allergens } = req.body;

      const result = await AuthService.registerUser({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        adultsCount,
        childrenCount,
        allergens
      });

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        user: result.user
      });

    } catch (error) {
      console.error('Erreur inscription:', error);
      
      let message = 'Erreur lors de l\'inscription';
      let status = 500;

      if (error.message.includes('existe déjà')) {
        message = error.message;
        status = 409; // Conflict
      } else if (error.message.includes('invalide')) {
        message = error.message;
        status = 400; // Bad Request
      }

      res.status(status).json({
        success: false,
        message: message
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
router.post('/login',
  loginRateLimiter,
  validateLogin,
  auditLogger('USER_LOGIN_ATTEMPT', 'users'),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || '';

      const result = await AuthService.loginUser(
        email.toLowerCase().trim(),
        password,
        ipAddress,
        userAgent
      );

      // Définir le cookie de refresh token (httpOnly pour la sécurité)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
      });

      res.json({
        success: true,
        message: 'Connexion réussie',
        accessToken: result.accessToken,
        user: result.user
      });

    } catch (error) {
      console.error('Erreur connexion utilisateur:', error);
      
      let message = 'Erreur de connexion';
      let status = 401;

      if (error.message.includes('incorrect')) {
        message = 'Email ou mot de passe incorrect';
      } else if (error.message.includes('verrouillé')) {
        message = error.message;
        status = 423; // Locked
      } else if (error.message.includes('désactivé')) {
        message = error.message;
        status = 403; // Forbidden
      }

      res.status(status).json({
        success: false,
        message: message
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Déconnexion utilisateur
 */
router.post('/logout',
  auditLogger('USER_LOGOUT', 'sessions'),
  async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Supprimer le cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      console.error('Erreur déconnexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion'
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Profil utilisateur courant
 */
router.get('/me',
  requireAuth,
  async (req, res) => {
    try {
      res.json({
        success: true,
        user: req.user
      });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  }
);

/**
 * POST /api/auth/refresh-token
 * Renouvellement du token d'accès
 */
router.post('/refresh-token',
  generalRateLimiter,
  async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Token de refresh requis'
        });
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        accessToken: result.accessToken
      });

    } catch (error) {
      console.error('Erreur renouvellement token:', error);
      
      let message = 'Erreur de renouvellement du token';
      let status = 401;

      if (error.message.includes('invalide')) {
        message = 'Token de refresh invalide';
      } else if (error.message.includes('expiré')) {
        message = 'Session expirée, veuillez vous reconnecter';
      }

      // Supprimer le cookie si le token est invalide
      res.clearCookie('refreshToken');

      res.status(status).json({
        success: false,
        message: message
      });
    }
  }
);

// ========================================
// ROUTES D'AUTHENTIFICATION ADMINISTRATEURS
// ========================================

/**
 * POST /api/admin/login
 * Connexion administrateur
 */
router.post('/admin/login',
  loginRateLimiter,
  validateLogin,
  auditLogger('ADMIN_LOGIN_ATTEMPT', 'admins'),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || '';

      const result = await AuthService.loginAdmin(
        email.toLowerCase().trim(),
        password,
        ipAddress,
        userAgent
      );

      // Définir le cookie de refresh token pour admin
      res.cookie('adminRefreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
      });

      res.json({
        success: true,
        message: 'Connexion administrateur réussie',
        accessToken: result.accessToken,
        admin: result.admin
      });

    } catch (error) {
      console.error('Erreur connexion admin:', error);
      
      let message = 'Erreur de connexion administrateur';
      let status = 401;

      if (error.message.includes('incorrect')) {
        message = 'Email ou mot de passe incorrect';
      } else if (error.message.includes('verrouillé')) {
        message = error.message;
        status = 423; // Locked
      } else if (error.message.includes('désactivé')) {
        message = 'Compte administrateur désactivé';
        status = 403; // Forbidden
      }

      res.status(status).json({
        success: false,
        message: message
      });
    }
  }
);

/**
 * GET /api/admin/me
 * Profil administrateur courant
 */
router.get('/admin/me',
  authRateLimiter,
  requireAdmin,
  async (req, res) => {
    try {
      res.json({
        success: true,
        admin: req.admin
      });
    } catch (error) {
      console.error('Erreur récupération profil admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil administrateur'
      });
    }
  }
);

/**
 * POST /api/admin/logout
 * Déconnexion administrateur
 */
router.post('/admin/logout',
  auditLogger('ADMIN_LOGOUT', 'sessions'),
  async (req, res) => {
    try {
      const refreshToken = req.cookies?.adminRefreshToken || req.body.refreshToken;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Supprimer le cookie admin
      res.clearCookie('adminRefreshToken');

      res.json({
        success: true,
        message: 'Déconnexion administrateur réussie'
      });

    } catch (error) {
      console.error('Erreur déconnexion admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion administrateur'
      });
    }
  }
);

/**
 * POST /api/admin/refresh-token
 * Renouvellement du token d'accès administrateur
 */
router.post('/admin/refresh-token',
  generalRateLimiter,
  async (req, res) => {
    try {
      const refreshToken = req.cookies?.adminRefreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Token de refresh administrateur requis'
        });
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        accessToken: result.accessToken
      });

    } catch (error) {
      console.error('Erreur renouvellement token admin:', error);
      
      let message = 'Erreur de renouvellement du token administrateur';
      let status = 401;

      if (error.message.includes('invalide')) {
        message = 'Token de refresh administrateur invalide';
      } else if (error.message.includes('expiré')) {
        message = 'Session administrateur expirée, veuillez vous reconnecter';
      }

      // Supprimer le cookie si le token est invalide
      res.clearCookie('adminRefreshToken');

      res.status(status).json({
        success: false,
        message: message
      });
    }
  }
);

// ========================================
// ROUTES DE GESTION DES MOTS DE PASSE
// ========================================

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
router.post('/forgot-password',
  generalRateLimiter,
  auditLogger('PASSWORD_RESET_REQUEST', 'users'),
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({
          success: false,
          message: 'Email invalide'
        });
      }

      // Pour des raisons de sécurité, on retourne toujours succès
      // même si l'email n'existe pas
      res.json({
        success: true,
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation'
      });

      // TODO: Implémenter l'envoi d'email
      console.log(`🔐 Demande de reset password pour: ${email}`);

    } catch (error) {
      console.error('Erreur forgot password:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la demande de réinitialisation'
      });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Réinitialisation du mot de passe avec token
 */
router.post('/reset-password',
  generalRateLimiter,
  auditLogger('PASSWORD_RESET_COMPLETE', 'users'),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token et nouveau mot de passe requis'
        });
      }

      // Valider le nouveau mot de passe
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }

      if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
        });
      }

      // TODO: Implémenter la validation du token et la mise à jour du mot de passe
      
      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      });

    } catch (error) {
      console.error('Erreur reset password:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la réinitialisation du mot de passe'
      });
    }
  }
);

// ========================================
// ROUTES DE MAINTENANCE
// ========================================

/**
 * POST /api/auth/cleanup-sessions
 * Nettoyer les sessions expirées (admin uniquement)
 */
router.post('/cleanup-sessions',
  requireAdmin,
  auditLogger('CLEANUP_SESSIONS', 'sessions'),
  async (req, res) => {
    try {
      const deletedCount = await AuthService.cleanupExpiredSessions();

      res.json({
        success: true,
        message: `${deletedCount} sessions expirées supprimées`
      });

    } catch (error) {
      console.error('Erreur nettoyage sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des sessions'
      });
    }
  }
);

// ========================================
// MIDDLEWARE DE GESTION D'ERREURS
// ========================================

router.use((error, req, res, next) => {
  console.error('Erreur dans les routes d\'authentification:', error);

  // Log de l'erreur
  AuthService.createAuditLog({
    action: 'AUTH_ERROR',
    newData: { 
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl 
    },
    ipAddress: req.ip,
    endpoint: req.originalUrl,
    httpMethod: req.method,
    success: false
  }).catch(console.error);

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

module.exports = router;