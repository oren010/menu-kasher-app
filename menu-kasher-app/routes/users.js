const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { 
  requireAuth, 
  requireAdmin, 
  requirePermission,
  auditLogger,
  adminActionRateLimiter
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// ROUTES POUR UTILISATEURS (SELF-SERVICE)
// ========================================

/**
 * GET /api/users/me
 * Obtenir son propre profil
 */
router.get('/me', 
  requireAuth,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          adultsCount: true,
          childrenCount: true,
          allergens: true,
          dietaryRestrictions: true,
          excludedIngredients: true,
          includeLunch: true,
          includeDinner: true,
          includeAdultMeals: true,
          includeChildMeals: true,
          cookingSkillLevel: true,
          preferredDifficulty: true,
          dietGoal: true,
          currentWeight: true,
          targetWeight: true,
          dailyCalorieTarget: true,
          weeklyRefinedMeals: true,
          budgetLevel: true,
          kosherLevel: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              menus: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  }
);

/**
 * PUT /api/users/me
 * Mettre à jour son propre profil
 */
router.put('/me',
  requireAuth,
  auditLogger('USER_UPDATE_PROFILE', 'users'),
  async (req, res) => {
    try {
      const {
        name,
        adultsCount,
        childrenCount,
        allergens,
        dietaryRestrictions,
        excludedIngredients,
        includeLunch,
        includeDinner,
        includeAdultMeals,
        includeChildMeals,
        cookingSkillLevel,
        preferredDifficulty,
        dietGoal,
        currentWeight,
        targetWeight,
        dailyCalorieTarget,
        weeklyRefinedMeals,
        budgetLevel,
        kosherLevel
      } = req.body;

      // Validation des données
      const updateData = {};
      
      if (name !== undefined) {
        if (!name || name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Le nom doit contenir au moins 2 caractères'
          });
        }
        updateData.name = name.trim();
      }

      if (adultsCount !== undefined) {
        const adults = parseInt(adultsCount);
        if (isNaN(adults) || adults < 1 || adults > 10) {
          return res.status(400).json({
            success: false,
            message: 'Le nombre d\'adultes doit être entre 1 et 10'
          });
        }
        updateData.adultsCount = adults;
      }

      if (childrenCount !== undefined) {
        const children = parseInt(childrenCount);
        if (isNaN(children) || children < 0 || children > 10) {
          return res.status(400).json({
            success: false,
            message: 'Le nombre d\'enfants doit être entre 0 et 10'
          });
        }
        updateData.childrenCount = children;
      }

      // Arrays
      if (allergens !== undefined) updateData.allergens = Array.isArray(allergens) ? allergens : [];
      if (dietaryRestrictions !== undefined) updateData.dietaryRestrictions = Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [];
      if (excludedIngredients !== undefined) updateData.excludedIngredients = Array.isArray(excludedIngredients) ? excludedIngredients : [];

      // Booleans
      if (includeLunch !== undefined) updateData.includeLunch = Boolean(includeLunch);
      if (includeDinner !== undefined) updateData.includeDinner = Boolean(includeDinner);
      if (includeAdultMeals !== undefined) updateData.includeAdultMeals = Boolean(includeAdultMeals);
      if (includeChildMeals !== undefined) updateData.includeChildMeals = Boolean(includeChildMeals);

      // Enums/Strings
      if (cookingSkillLevel !== undefined) updateData.cookingSkillLevel = cookingSkillLevel;
      if (preferredDifficulty !== undefined) updateData.preferredDifficulty = preferredDifficulty;
      if (dietGoal !== undefined) updateData.dietGoal = dietGoal;
      if (budgetLevel !== undefined) updateData.budgetLevel = budgetLevel;
      if (kosherLevel !== undefined) updateData.kosherLevel = kosherLevel;

      // Numbers
      if (currentWeight !== undefined) {
        const weight = parseFloat(currentWeight);
        updateData.currentWeight = isNaN(weight) ? null : weight;
      }
      if (targetWeight !== undefined) {
        const weight = parseFloat(targetWeight);
        updateData.targetWeight = isNaN(weight) ? null : weight;
      }
      if (dailyCalorieTarget !== undefined) {
        const calories = parseInt(dailyCalorieTarget);
        updateData.dailyCalorieTarget = isNaN(calories) ? null : calories;
      }
      if (weeklyRefinedMeals !== undefined) {
        const meals = parseInt(weeklyRefinedMeals);
        updateData.weeklyRefinedMeals = isNaN(meals) ? 2 : meals;
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          adultsCount: true,
          childrenCount: true,
          allergens: true,
          dietaryRestrictions: true,
          excludedIngredients: true,
          includeLunch: true,
          includeDinner: true,
          includeAdultMeals: true,
          includeChildMeals: true,
          cookingSkillLevel: true,
          preferredDifficulty: true,
          dietGoal: true,
          currentWeight: true,
          targetWeight: true,
          dailyCalorieTarget: true,
          weeklyRefinedMeals: true,
          budgetLevel: true,
          kosherLevel: true
        }
      });

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil'
      });
    }
  }
);

/**
 * PUT /api/users/me/password
 * Changer son mot de passe
 */
router.put('/me/password',
  requireAuth,
  auditLogger('USER_CHANGE_PASSWORD', 'users'),
  async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Les nouveaux mots de passe ne correspondent pas'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
        });
      }

      if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
        });
      }

      // Récupérer l'utilisateur avec le mot de passe
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          passwordHash: true
        }
      });

      if (!user || !user.passwordHash) {
        return res.status(400).json({
          success: false,
          message: 'Aucun mot de passe défini pour ce compte'
        });
      }

      // Vérifier l'ancien mot de passe
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe actuel incorrect'
        });
      }

      // Hasher le nouveau mot de passe
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Mettre à jour
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          passwordHash: newPasswordHash
        }
      });

      res.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès'
      });

    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de mot de passe'
      });
    }
  }
);

/**
 * GET /api/users/me/activity
 * Obtenir l'historique d'activité de l'utilisateur
 */
router.get('/me/activity',
  requireAuth,
  async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const activities = await prisma.auditLog.findMany({
        where: {
          userId: req.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          action: true,
          tableName: true,
          newData: true,
          ipAddress: true,
          success: true,
          createdAt: true
        }
      });

      const total = await prisma.auditLog.count({
        where: {
          userId: req.user.id
        }
      });

      res.json({
        success: true,
        activities,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'activité'
      });
    }
  }
);

// ========================================
// ROUTES POUR ADMINISTRATEURS
// ========================================

/**
 * GET /api/users
 * Lister tous les utilisateurs (admin seulement)
 */
router.get('/', 
  ...requirePermission('users.read'),
  async (req, res) => {
    try {
      const { 
        search, 
        status, 
        sort = 'name',
        order = 'asc',
        limit = 20, 
        offset = 0 
      } = req.query;

      // Construire les filtres
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (status) {
        switch (status) {
          case 'active':
            where.isActive = true;
            break;
          case 'inactive':
            where.isActive = false;
            break;
          case 'new':
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            where.createdAt = { gte: weekAgo };
            break;
        }
      }

      // Validation du tri
      const validSortFields = ['name', 'email', 'createdAt', 'lastLogin'];
      const sortField = validSortFields.includes(sort) ? sort : 'name';
      const sortOrder = order === 'desc' ? 'desc' : 'asc';

      const users = await prisma.user.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          emailVerified: true,
          adultsCount: true,
          childrenCount: true,
          allergens: true,
          createdAt: true,
          lastLogin: true,
          lastLoginIp: true,
          loginAttempts: true,
          lockedUntil: true,
          _count: {
            select: {
              menus: true
            }
          }
        }
      });

      const total = await prisma.user.count({ where });

      res.json({
        success: true,
        users,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  }
);

/**
 * GET /api/users/:id
 * Obtenir un utilisateur spécifique (admin seulement)
 */
router.get('/:id',
  ...requirePermission('users.read'),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          menus: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              isActive: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              menus: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Masquer le hash du mot de passe
      delete user.passwordHash;

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'utilisateur'
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * Mettre à jour un utilisateur (admin seulement)
 */
router.put('/:id',
  adminActionRateLimiter,
  ...requirePermission('users.update'),
  auditLogger('ADMIN_UPDATE_USER', 'users'),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const {
        name,
        email,
        adultsCount,
        childrenCount,
        allergens,
        isActive,
        emailVerified,
        resetPassword
      } = req.body;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      const updateData = {};

      // Validation et préparation des données
      if (name !== undefined) {
        if (!name || name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Le nom doit contenir au moins 2 caractères'
          });
        }
        updateData.name = name.trim();
      }

      if (email !== undefined) {
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return res.status(400).json({
            success: false,
            message: 'Email invalide'
          });
        }

        // Vérifier l'unicité de l'email
        const emailExists = await prisma.user.findFirst({
          where: {
            email: email.toLowerCase().trim(),
            NOT: { id: userId }
          }
        });

        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Cet email est déjà utilisé'
          });
        }

        updateData.email = email.toLowerCase().trim();
      }

      if (adultsCount !== undefined) {
        const adults = parseInt(adultsCount);
        if (isNaN(adults) || adults < 1 || adults > 10) {
          return res.status(400).json({
            success: false,
            message: 'Le nombre d\'adultes doit être entre 1 et 10'
          });
        }
        updateData.adultsCount = adults;
      }

      if (childrenCount !== undefined) {
        const children = parseInt(childrenCount);
        if (isNaN(children) || children < 0 || children > 10) {
          return res.status(400).json({
            success: false,
            message: 'Le nombre d\'enfants doit être entre 0 et 10'
          });
        }
        updateData.childrenCount = children;
      }

      if (allergens !== undefined) {
        updateData.allergens = Array.isArray(allergens) ? allergens : [];
      }

      if (isActive !== undefined) {
        updateData.isActive = Boolean(isActive);
      }

      if (emailVerified !== undefined) {
        updateData.emailVerified = Boolean(emailVerified);
      }

      // Réinitialiser les tentatives de connexion si compte réactivé
      if (updateData.isActive === true && !existingUser.isActive) {
        updateData.loginAttempts = 0;
        updateData.lockedUntil = null;
      }

      // Réinitialiser le mot de passe si demandé
      if (resetPassword) {
        const tempPassword = 'TempPass' + Math.random().toString(36).substring(7) + '!';
        updateData.passwordHash = await bcrypt.hash(tempPassword, 12);
        
        // Log du mot de passe temporaire (à sécuriser en production)
        console.log(`Mot de passe temporaire pour ${existingUser.email}: ${tempPassword}`);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          emailVerified: true,
          adultsCount: true,
          childrenCount: true,
          allergens: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        user: updatedUser,
        ...(resetPassword && { tempPassword: 'Un mot de passe temporaire a été généré (voir les logs)' })
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'utilisateur'
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur (admin seulement)
 */
router.delete('/:id',
  adminActionRateLimiter,
  ...requirePermission('users.delete'),
  auditLogger('ADMIN_DELETE_USER', 'users'),
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          _count: {
            select: {
              menus: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Supprimer l'utilisateur et ses données associées
      await prisma.$transaction(async (tx) => {
        // Supprimer les menus de l'utilisateur
        await tx.menu.deleteMany({
          where: { userId }
        });

        // Supprimer les sessions de l'utilisateur
        await tx.session.deleteMany({
          where: { userId }
        });

        // Supprimer les logs d'audit de l'utilisateur (optionnel)
        // await tx.auditLog.deleteMany({
        //   where: { userId }
        // });

        // Supprimer l'utilisateur
        await tx.user.delete({
          where: { id: userId }
        });
      });

      res.json({
        success: true,
        message: `Utilisateur ${user.email} supprimé avec succès`
      });

    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'utilisateur'
      });
    }
  }
);

/**
 * GET /api/users/:id/activity
 * Obtenir l'historique d'activité d'un utilisateur (admin seulement)
 */
router.get('/:id/activity',
  ...requirePermission('users.read'),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { limit = 50, offset = 0 } = req.query;

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      const activities = await prisma.auditLog.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          action: true,
          tableName: true,
          recordId: true,
          newData: true,
          ipAddress: true,
          endpoint: true,
          httpMethod: true,
          success: true,
          createdAt: true
        }
      });

      const total = await prisma.auditLog.count({
        where: { userId: userId }
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        activities,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'activité utilisateur'
      });
    }
  }
);

/**
 * POST /api/users/:id/unlock
 * Déverrouiller un compte utilisateur (admin seulement)
 */
router.post('/:id/unlock',
  adminActionRateLimiter,
  ...requirePermission('users.update'),
  auditLogger('ADMIN_UNLOCK_USER', 'users'),
  async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, lockedUntil: true, loginAttempts: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: 0,
          lockedUntil: null
        }
      });

      res.json({
        success: true,
        message: `Compte ${user.email} déverrouillé avec succès`
      });

    } catch (error) {
      console.error('Erreur lors du déverrouillage:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du déverrouillage du compte'
      });
    }
  }
);

/**
 * GET /api/users/stats
 * Statistiques des utilisateurs (admin seulement)
 */
router.get('/stats/overview',
  ...requirePermission('users.read'),
  async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        newUsersThisWeek,
        usersLoggedInToday,
        usersLoggedInYesterday,
        lockedUsers
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.user.count({ where: { lastLogin: { gte: today } } }),
        prisma.user.count({ where: { lastLogin: { gte: yesterday, lt: today } } }),
        prisma.user.count({ where: { lockedUntil: { gt: now } } })
      ]);

      // Calcul des tendances
      const dailyLoginChange = usersLoggedInToday - usersLoggedInYesterday;
      const dailyLoginTrend = dailyLoginChange > 0 ? 'up' : dailyLoginChange < 0 ? 'down' : 'stable';

      res.json({
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          newUsersThisWeek,
          usersLoggedInToday,
          usersLoggedInYesterday,
          lockedUsers,
          trends: {
            dailyLogin: {
              change: dailyLoginChange,
              trend: dailyLoginTrend,
              percentage: usersLoggedInYesterday > 0 ? Math.round((dailyLoginChange / usersLoggedInYesterday) * 100) : 0
            }
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

// Gestion des erreurs
router.use((error, req, res, next) => {
  console.error('Erreur dans les routes utilisateurs:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

module.exports = router;