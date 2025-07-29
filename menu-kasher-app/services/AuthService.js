const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { PermissionUtils } = require('../config/permissions');

const prisma = new PrismaClient();

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-menu-kasher-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Configuration sécurité
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const BCRYPT_ROUNDS = 12;

class AuthService {
  // ========================================
  // GESTION UTILISATEURS
  // ========================================

  /**
   * Inscription d'un nouvel utilisateur
   */
  async registerUser(userData) {
    try {
      const { email, password, name, adultsCount, childrenCount, allergens = [] } = userData;

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Un compte existe déjà avec cet email');
      }

      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          adultsCount: parseInt(adultsCount) || 2,
          childrenCount: parseInt(childrenCount) || 1,
          allergens: Array.isArray(allergens) ? allergens : [],
          isActive: true,
          emailVerified: false // À implémenter plus tard
        }
      });

      // Créer un log d'audit
      await this.createAuditLog({
        action: 'USER_REGISTER',
        tableName: 'users',
        recordId: user.id,
        newData: { email, name },
        success: true
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          adultsCount: user.adultsCount,
          childrenCount: user.childrenCount,
          allergens: user.allergens
        }
      };

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  /**
   * Connexion utilisateur
   */
  async loginUser(email, password, ipAddress, userAgent) {
    try {
      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Vérifier si le compte est verrouillé
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockedUntil - new Date()) / 60000);
        throw new Error(`Compte verrouillé. Réessayez dans ${remainingTime} minutes.`);
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        throw new Error('Compte désactivé. Contactez l\'administrateur.');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        // Incrémenter les tentatives échouées
        await this.handleFailedLogin(user.id);
        throw new Error('Email ou mot de passe incorrect');
      }

      // Réinitialiser les tentatives de connexion
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date(),
          lastLoginIp: ipAddress
        }
      });

      // Générer les tokens
      const accessToken = this.generateJWT(user, 'user');
      const refreshToken = this.generateRefreshToken();

      // Créer une session
      const session = await prisma.session.create({
        data: {
          token: refreshToken,
          userId: user.id,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
        }
      });

      // Log d'audit
      await this.createAuditLog({
        action: 'USER_LOGIN',
        tableName: 'users',
        recordId: user.id,
        newData: { email, ipAddress },
        ipAddress,
        success: true
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          adultsCount: user.adultsCount,
          childrenCount: user.childrenCount,
          allergens: user.allergens
        }
      };

    } catch (error) {
      // Log d'audit pour échec de connexion
      await this.createAuditLog({
        action: 'USER_LOGIN_FAILED',
        tableName: 'users',
        newData: { email, reason: error.message },
        ipAddress,
        success: false
      });

      console.error('Erreur lors de la connexion utilisateur:', error);
      throw error;
    }
  }

  // ========================================
  // GESTION ADMINISTRATEURS
  // ========================================

  /**
   * Connexion administrateur
   */
  async loginAdmin(email, password, ipAddress, userAgent) {
    try {
      // Récupérer l'administrateur
      const admin = await prisma.admin.findUnique({
        where: { email }
      });

      if (!admin) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Vérifier si le compte est verrouillé
      if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((admin.lockedUntil - new Date()) / 60000);
        throw new Error(`Compte verrouillé. Réessayez dans ${remainingTime} minutes.`);
      }

      // Vérifier si le compte est actif
      if (!admin.isActive) {
        throw new Error('Compte administrateur désactivé.');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

      if (!isPasswordValid) {
        // Incrémenter les tentatives échouées
        await this.handleFailedAdminLogin(admin.id);
        throw new Error('Email ou mot de passe incorrect');
      }

      // Réinitialiser les tentatives de connexion
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date(),
          lastLoginIp: ipAddress
        }
      });

      // Générer les tokens
      const accessToken = this.generateJWT(admin, 'admin');
      const refreshToken = this.generateRefreshToken();

      // Créer une session admin
      const session = await prisma.session.create({
        data: {
          token: refreshToken,
          adminId: admin.id,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
        }
      });

      // Log d'audit
      await this.createAuditLog({
        adminId: admin.id,
        action: 'ADMIN_LOGIN',
        tableName: 'admins',
        recordId: admin.id,
        newData: { email, ipAddress },
        ipAddress,
        success: true
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions
        }
      };

    } catch (error) {
      // Log d'audit pour échec de connexion admin
      await this.createAuditLog({
        action: 'ADMIN_LOGIN_FAILED',
        tableName: 'admins',
        newData: { email, reason: error.message },
        ipAddress,
        success: false
      });

      console.error('Erreur lors de la connexion admin:', error);
      throw error;
    }
  }

  // ========================================
  // GESTION DES TOKENS
  // ========================================

  /**
   * Générer un token JWT
   */
  generateJWT(user, type = 'user') {
    const payload = {
      id: user.id,
      email: user.email,
      type: type, // 'user' ou 'admin'
      iat: Math.floor(Date.now() / 1000)
    };

    // Ajouter des données spécifiques selon le type
    if (type === 'admin') {
      payload.role = user.role;
      payload.permissions = user.permissions;
    }

    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'menu-kasher-app',
      audience: type
    });
  }

  /**
   * Vérifier un token JWT
   */
  verifyJWT(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expiré');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token invalide');
      } else {
        throw new Error('Erreur de vérification du token');
      }
    }
  }

  /**
   * Générer un token de refresh
   */
  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Générer un token de réinitialisation
   */
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Renouveler un token d'accès
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Récupérer la session
      const session = await prisma.session.findUnique({
        where: { token: refreshToken },
        include: {
          user: true,
          admin: true
        }
      });

      if (!session) {
        throw new Error('Token de refresh invalide');
      }

      // Vérifier si la session n'a pas expiré
      if (session.expiresAt < new Date()) {
        // Supprimer la session expirée
        await prisma.session.delete({
          where: { id: session.id }
        });
        throw new Error('Session expirée');
      }

      // Générer un nouveau token d'accès
      let newAccessToken;
      if (session.user) {
        newAccessToken = this.generateJWT(session.user, 'user');
      } else if (session.admin) {
        newAccessToken = this.generateJWT(session.admin, 'admin');
      } else {
        throw new Error('Session invalide');
      }

      return {
        success: true,
        accessToken: newAccessToken
      };

    } catch (error) {
      console.error('Erreur lors du renouvellement du token:', error);
      throw error;
    }
  }

  // ========================================
  // DÉCONNEXION
  // ========================================

  /**
   * Déconnexion (supprimer la session)
   */
  async logout(refreshToken, userId = null, adminId = null) {
    try {
      if (refreshToken) {
        // Supprimer la session par token
        const session = await prisma.session.findUnique({
          where: { token: refreshToken }
        });

        if (session) {
          await prisma.session.delete({
            where: { id: session.id }
          });

          // Log d'audit
          await this.createAuditLog({
            userId: session.userId,
            adminId: session.adminId,
            action: session.userId ? 'USER_LOGOUT' : 'ADMIN_LOGOUT',
            tableName: 'sessions',
            recordId: session.id,
            success: true
          });
        }
      }

      return { success: true };

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  // ========================================
  // GESTION DES ÉCHECS DE CONNEXION
  // ========================================

  /**
   * Gérer les tentatives de connexion échouées pour un utilisateur
   */
  async handleFailedLogin(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const attempts = (user.loginAttempts || 0) + 1;
    const updateData = { loginAttempts: attempts };

    // Si on atteint le max, verrouiller le compte
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCK_TIME);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
  }

  /**
   * Gérer les tentatives de connexion échouées pour un admin
   */
  async handleFailedAdminLogin(adminId) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    const attempts = (admin.loginAttempts || 0) + 1;
    const updateData = { loginAttempts: attempts };

    // Si on atteint le max, verrouiller le compte
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCK_TIME);
    }

    await prisma.admin.update({
      where: { id: adminId },
      data: updateData
    });
  }

  // ========================================
  // VALIDATION ET PERMISSIONS
  // ========================================

  /**
   * Vérifier une permission pour un admin
   */
  hasPermission(adminPermissions, requiredPermission) {
    return PermissionUtils.hasPermission(adminPermissions, requiredPermission);
  }

  /**
   * Vérifier l'accès à une page pour un rôle
   */
  canAccessPage(role, page) {
    return PermissionUtils.canAccessPage(role, page);
  }

  // ========================================
  // LOGS D'AUDIT
  // ========================================

  /**
   * Créer un log d'audit
   */
  async createAuditLog(logData) {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: logData.adminId || null,
          userId: logData.userId || null,
          action: logData.action,
          tableName: logData.tableName || null,
          recordId: logData.recordId || null,
          oldData: logData.oldData || null,
          newData: logData.newData || null,
          ipAddress: logData.ipAddress || null,
          endpoint: logData.endpoint || null,
          httpMethod: logData.httpMethod || null,
          success: logData.success !== false // Par défaut true
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création du log d\'audit:', error);
      // Ne pas faire échouer l'opération principale pour un log
    }
  }

  // ========================================
  // NETTOYAGE ET MAINTENANCE
  // ========================================

  /**
   * Nettoyer les sessions expirées
   */
  async cleanupExpiredSessions() {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`🧹 ${result.count} sessions expirées supprimées`);
      return result.count;

    } catch (error) {
      console.error('Erreur lors du nettoyage des sessions:', error);
      return 0;
    }
  }

  /**
   * Nettoyer les anciens logs d'audit (garde 90 jours)
   */
  async cleanupOldAuditLogs() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`🧹 ${result.count} anciens logs d'audit supprimés`);
      return result.count;

    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
      return 0;
    }
  }
}

module.exports = new AuthService();