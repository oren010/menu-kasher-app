const express = require('express');
const { PrismaClient } = require('@prisma/client');
const UserPreferencesService = require('../services/UserPreferencesService');
const { 
  requireAuth, 
  requireAdmin, 
  requirePermission,
  auditLogger,
  adminActionRateLimiter
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const preferencesService = new UserPreferencesService(prisma);

// ========================================
// ROUTES POUR UTILISATEURS (Autogestion)
// ========================================

/**
 * GET /api/preferences/me
 * Obtenir ses propres préférences
 */
router.get('/me', 
  requireAuth,
  async (req, res) => {
    try {
      const preferences = await preferencesService.getUserPreferences(req.user.id);

      res.json({
        success: true,
        preferences
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des préférences'
      });
    }
  }
);

/**
 * PUT /api/preferences/me
 * Mettre à jour ses propres préférences
 */
router.put('/me',
  requireAuth,
  auditLogger('USER_UPDATE_PREFERENCES', 'preferences'),
  async (req, res) => {
    try {
      const updatedPreferences = await preferencesService.updateUserPreferences(
        req.user.id, 
        req.body
      );

      res.json({
        success: true,
        message: 'Préférences mises à jour avec succès',
        preferences: updatedPreferences
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour des préférences'
      });
    }
  }
);

/**
 * GET /api/preferences/me/analysis
 * Obtenir l'analyse de ses préférences avec recommandations
 */
router.get('/me/analysis',
  requireAuth,
  async (req, res) => {
    try {
      const analysis = await preferencesService.analyzeUserPreferences(req.user.id);

      res.json({
        success: true,
        analysis
      });

    } catch (error) {
      console.error('Erreur lors de l\'analyse des préférences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse des préférences'
      });
    }
  }
);

/**
 * GET /api/preferences/me/suggestions
 * Obtenir des suggestions d'amélioration pour ses préférences
 */
router.get('/me/suggestions',
  requireAuth,
  async (req, res) => {
    try {
      const suggestions = await preferencesService.suggestImprovements(req.user.id);

      res.json({
        success: true,
        suggestions
      });

    } catch (error) {
      console.error('Erreur lors de la génération de suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération de suggestions'
      });
    }
  }
);

/**
 * POST /api/preferences/me/reset
 * Réinitialiser ses préférences aux valeurs par défaut
 */
router.post('/me/reset',
  requireAuth,
  auditLogger('USER_RESET_PREFERENCES', 'preferences'),
  async (req, res) => {
    try {
      const resetPreferences = await preferencesService.resetUserPreferences(req.user.id);

      res.json({
        success: true,
        message: 'Préférences réinitialisées avec succès',
        preferences: resetPreferences
      });

    } catch (error) {
      console.error('Erreur lors de la réinitialisation des préférences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la réinitialisation des préférences'
      });
    }
  }
);

// ========================================
// ROUTES POUR ADMINISTRATEURS
// ========================================

/**
 * GET /api/preferences/stats
 * Obtenir les statistiques des préférences utilisateurs (admin seulement)
 */
router.get('/stats',
  ...requirePermission('users.read'),
  async (req, res) => {
    try {
      const stats = await preferencesService.getPreferencesStatistics();

      res.json({
        success: true,
        stats
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

/**
 * GET /api/preferences/user/:userId
 * Obtenir les préférences d'un utilisateur spécifique (admin seulement)
 */
router.get('/user/:userId',
  ...requirePermission('users.read'),
  async (req, res) => {
    try {
      const preferences = await preferencesService.getUserPreferences(req.params.userId);

      res.json({
        success: true,
        preferences
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des préférences utilisateur:', error);
      res.status(error.message.includes('non trouvé') ? 404 : 500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des préférences'
      });
    }
  }
);

/**
 * PUT /api/preferences/user/:userId
 * Mettre à jour les préférences d'un utilisateur (admin seulement)
 */
router.put('/user/:userId',
  adminActionRateLimiter,
  ...requirePermission('users.update'),
  auditLogger('ADMIN_UPDATE_USER_PREFERENCES', 'preferences'),
  async (req, res) => {
    try {
      const updatedPreferences = await preferencesService.updateUserPreferences(
        req.params.userId, 
        req.body
      );

      res.json({
        success: true,
        message: 'Préférences mises à jour avec succès',
        preferences: updatedPreferences
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences utilisateur:', error);
      res.status(error.message.includes('non trouvé') ? 404 : 500).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour des préférences'
      });
    }
  }
);

/**
 * GET /api/preferences/user/:userId/analysis
 * Obtenir l'analyse des préférences d'un utilisateur (admin seulement)
 */
router.get('/user/:userId/analysis',
  ...requirePermission('users.read'),
  async (req, res) => {
    try {
      const analysis = await preferencesService.analyzeUserPreferences(req.params.userId);

      res.json({
        success: true,
        analysis
      });

    } catch (error) {
      console.error('Erreur lors de l\'analyse des préférences utilisateur:', error);
      res.status(error.message.includes('non trouvé') ? 404 : 500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'analyse des préférences'
      });
    }
  }
);

/**
 * POST /api/preferences/user/:userId/reset
 * Réinitialiser les préférences d'un utilisateur (admin seulement)
 */
router.post('/user/:userId/reset',
  adminActionRateLimiter,
  ...requirePermission('users.update'),
  auditLogger('ADMIN_RESET_USER_PREFERENCES', 'preferences'),
  async (req, res) => {
    try {
      const resetPreferences = await preferencesService.resetUserPreferences(req.params.userId);

      res.json({
        success: true,
        message: 'Préférences réinitialisées avec succès',
        preferences: resetPreferences
      });

    } catch (error) {
      console.error('Erreur lors de la réinitialisation des préférences utilisateur:', error);
      res.status(error.message.includes('non trouvé') ? 404 : 500).json({
        success: false,
        message: error.message || 'Erreur lors de la réinitialisation des préférences'
      });
    }
  }
);

/**
 * GET /api/preferences/analysis/global
 * Obtenir une analyse globale des préférences utilisateurs (admin seulement)
 */
router.get('/analysis/global',
  ...requirePermission('users.read'),
  async (req, res) => {
    try {
      const stats = await preferencesService.getPreferencesStatistics();
      
      // Analyse globale basée sur les statistiques
      const globalAnalysis = {
        overview: {
          totalUsers: stats.total,
          kosherPercentage: Math.round((stats.kosher / stats.total) * 100),
          allergiesPercentage: Math.round((stats.allergies / stats.total) * 100),
          goalsPercentage: Math.round((stats.goals / stats.total) * 100)
        },
        trends: {
          mostCommonDietaryRestrictions: Object.entries(stats.dietaryRestrictions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([restriction, count]) => ({ restriction, count, percentage: Math.round((count / stats.total) * 100) })),
          cookingLevelDistribution: stats.cookingLevels,
          budgetLevelDistribution: stats.budgetLevels
        },
        insights: []
      };

      // Générer des insights basés sur les données
      if (globalAnalysis.overview.kosherPercentage > 50) {
        globalAnalysis.insights.push({
          type: 'dietary',
          message: `${globalAnalysis.overview.kosherPercentage}% des utilisateurs suivent des règles kasher`,
          recommendation: 'Prioriser le développement de recettes kasher'
        });
      }

      if (globalAnalysis.overview.allergiesPercentage > 30) {
        globalAnalysis.insights.push({
          type: 'safety',
          message: `${globalAnalysis.overview.allergiesPercentage}% des utilisateurs ont des allergies`,
          recommendation: 'Renforcer la gestion des allergènes dans les recettes'
        });
      }

      res.json({
        success: true,
        analysis: globalAnalysis
      });

    } catch (error) {
      console.error('Erreur lors de l\'analyse globale:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse globale des préférences'
      });
    }
  }
);

/**
 * GET /api/preferences/export
 * Exporter toutes les préférences utilisateurs (admin seulement)
 */
router.get('/export',
  ...requirePermission('users.read'),
  auditLogger('ADMIN_EXPORT_PREFERENCES', 'preferences'),
  async (req, res) => {
    try {
      const { format = 'json' } = req.query;

      // Récupérer tous les utilisateurs avec leurs préférences
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          adultsCount: true,
          childrenCount: true,
          dietaryRestrictions: true,
          kosherLevel: true,
          allergens: true,
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
          createdAt: true,
          updatedAt: true
        }
      });

      if (format === 'csv') {
        // Conversion en CSV
        const csvHeaders = [
          'ID', 'Nom', 'Email', 'Adultes', 'Enfants', 'Niveau Kasher',
          'Restrictions Alimentaires', 'Allergènes', 'Niveau Cuisine',
          'Objectif Diététique', 'Budget', 'Créé le'
        ].join(',');

        const csvRows = users.map(user => [
          user.id,
          `"${user.name}"`,
          user.email,
          user.adultsCount,
          user.childrenCount,
          user.kosherLevel,
          `"${user.dietaryRestrictions.join(';')}"`,
          `"${user.allergens.join(';')}"`,
          user.cookingSkillLevel,
          user.dietGoal || '',
          user.budgetLevel,
          user.createdAt.toISOString().split('T')[0]
        ].join(','));

        const csvContent = [csvHeaders, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="preferences_export_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Format JSON par défaut
        res.json({
          success: true,
          exportDate: new Date().toISOString(),
          totalUsers: users.length,
          data: users
        });
      }

    } catch (error) {
      console.error('Erreur lors de l\'export des préférences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des préférences'
      });
    }
  }
);

// Gestion des erreurs
router.use((error, req, res, next) => {
  console.error('Erreur dans les routes préférences:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

module.exports = router;