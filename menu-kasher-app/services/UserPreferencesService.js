const { PrismaClient } = require('@prisma/client');

class UserPreferencesService {
  constructor(prismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Obtenir les préférences complètes d'un utilisateur
   */
  async getUserPreferences(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userPreferences: true,
          availableIngredients: {
            include: {
              ingredient: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return this.formatUserPreferences(user);
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les préférences d'un utilisateur
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          // Composition familiale
          adultsCount: preferences.adultsCount,
          childrenCount: preferences.childrenCount,

          // Préférences alimentaires
          dietaryRestrictions: preferences.dietaryRestrictions || [],
          kosherLevel: preferences.kosherLevel || 'none',
          allergens: preferences.allergens || [],
          excludedIngredients: preferences.excludedIngredients || [],

          // Préférences de repas
          includeLunch: preferences.includeLunch,
          includeDinner: preferences.includeDinner,
          includeAdultMeals: preferences.includeAdultMeals,
          includeChildMeals: preferences.includeChildMeals,

          // Niveau de cuisine
          cookingSkillLevel: preferences.cookingSkillLevel || 'intermediate',
          preferredDifficulty: preferences.preferredDifficulty || 'medium',

          // Objectifs santé
          dietGoal: preferences.dietGoal,
          currentWeight: preferences.currentWeight,
          targetWeight: preferences.targetWeight,
          dailyCalorieTarget: preferences.dailyCalorieTarget,

          // Planning
          weeklyRefinedMeals: preferences.weeklyRefinedMeals || 2,
          budgetLevel: preferences.budgetLevel || 'medium'
        }
      });

      // Mettre à jour les préférences de repas par jour si fournies
      if (preferences.mealPreferences) {
        await this.updateMealPreferences(userId, preferences.mealPreferences);
      }

      // Mettre à jour les ingrédients disponibles si fournis
      if (preferences.availableIngredients) {
        await this.updateAvailableIngredients(userId, preferences.availableIngredients);
      }

      console.log(`✅ Préférences mises à jour pour l'utilisateur ${userId}`);
      return await this.getUserPreferences(userId);

    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les préférences de repas par jour
   */
  async updateMealPreferences(userId, mealPreferences) {
    try {
      // Supprimer les anciennes préférences
      await this.prisma.userMealPreferences.deleteMany({
        where: { userId }
      });

      // Ajouter les nouvelles préférences
      if (mealPreferences.length > 0) {
        const preferences = mealPreferences.map(pref => ({
          userId,
          dayOfWeek: pref.dayOfWeek,
          mealType: pref.mealType,
          audience: pref.audience,
          preferredDifficulty: pref.preferredDifficulty || 'medium',
          preferredTags: pref.preferredTags || []
        }));

        await this.prisma.userMealPreferences.createMany({
          data: preferences
        });
      }

      console.log(`✅ Préférences de repas mises à jour pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences de repas:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les ingrédients disponibles pour un utilisateur
   */
  async updateAvailableIngredients(userId, availableIngredients) {
    try {
      // Supprimer les anciens ingrédients disponibles
      await this.prisma.availableIngredient.deleteMany({
        where: { userId }
      });

      // Ajouter les nouveaux ingrédients disponibles
      if (availableIngredients.length > 0) {
        const ingredients = availableIngredients.map(ingredient => ({
          userId,
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity || 0,
          unit: ingredient.unit || 'unité',
          expiryDate: ingredient.expiryDate ? new Date(ingredient.expiryDate) : null
        }));

        await this.prisma.availableIngredient.createMany({
          data: ingredients
        });
      }

      console.log(`✅ Ingrédients disponibles mis à jour pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des ingrédients disponibles:', error);
      throw error;
    }
  }

  /**
   * Réinitialiser les préférences d'un utilisateur aux valeurs par défaut
   */
  async resetUserPreferences(userId) {
    try {
      const defaultPreferences = {
        adultsCount: 2,
        childrenCount: 2,
        dietaryRestrictions: [],
        kosherLevel: 'none',
        allergens: [],
        excludedIngredients: [],
        includeLunch: true,
        includeDinner: true,
        includeAdultMeals: true,
        includeChildMeals: true,
        cookingSkillLevel: 'intermediate',
        preferredDifficulty: 'medium',
        dietGoal: null,
        currentWeight: null,
        targetWeight: null,
        dailyCalorieTarget: null,
        weeklyRefinedMeals: 2,
        budgetLevel: 'medium'
      };

      await this.updateUserPreferences(userId, defaultPreferences);

      // Supprimer les préférences de repas personnalisées
      await this.prisma.userMealPreferences.deleteMany({
        where: { userId }
      });

      // Supprimer les ingrédients disponibles
      await this.prisma.availableIngredient.deleteMany({
        where: { userId }
      });

      console.log(`✅ Préférences réinitialisées pour l'utilisateur ${userId}`);
      return await this.getUserPreferences(userId);

    } catch (error) {
      console.error('Erreur lors de la réinitialisation des préférences:', error);
      throw error;
    }
  }

  /**
   * Analyser les préférences d'un utilisateur pour générer des recommandations
   */
  async analyzeUserPreferences(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      const analysis = {
        familySize: preferences.adultsCount + preferences.childrenCount,
        hasChildren: preferences.childrenCount > 0,
        isKosher: preferences.kosherLevel !== 'none',
        hasAllergies: preferences.allergens.length > 0,
        hasDietaryRestrictions: preferences.dietaryRestrictions.length > 0,
        hasHealthGoals: !!preferences.dietGoal,
        cookingExperience: preferences.cookingSkillLevel,
        budgetConstraints: preferences.budgetLevel,
        
        recommendations: []
      };

      // Générer des recommandations basées sur l'analyse
      analysis.recommendations = this.generateRecommendations(analysis, preferences);

      return analysis;

    } catch (error) {
      console.error('Erreur lors de l\'analyse des préférences:', error);
      throw error;
    }
  }

  /**
   * Générer des recommandations personnalisées
   */
  generateRecommendations(analysis, preferences) {
    const recommendations = [];

    // Recommandations basées sur la famille
    if (analysis.hasChildren) {
      recommendations.push({
        type: 'family',
        priority: 'high',
        title: 'Repas adaptés aux enfants',
        description: 'Privilégier des recettes simples et appréciées des enfants',
        action: 'Ajouter plus de recettes avec le tag "kid_friendly"'
      });
    }

    // Recommandations kosher
    if (analysis.isKosher) {
      recommendations.push({
        type: 'dietary',
        priority: 'high',
        title: 'Respect des règles kasher',
        description: `Niveau kasher: ${preferences.kosherLevel}`,
        action: 'Filtrer automatiquement les recettes non-kasher'
      });
    }

    // Recommandations allergies
    if (analysis.hasAllergies) {
      recommendations.push({
        type: 'safety',
        priority: 'critical',
        title: 'Attention aux allergènes',
        description: `Allergènes identifiés: ${preferences.allergens.join(', ')}`,
        action: 'Exclure automatiquement les recettes contenant ces allergènes'
      });
    }

    // Recommandations niveau de cuisine
    if (preferences.cookingSkillLevel === 'beginner') {
      recommendations.push({
        type: 'skill',
        priority: 'medium',
        title: 'Recettes pour débutants',
        description: 'Privilégier des recettes simples avec peu d\'ingrédients',
        action: 'Filtrer les recettes par difficulté "facile"'
      });
    }

    // Recommandations objectifs santé
    if (preferences.dietGoal) {
      const goalTexts = {
        'weight_loss': 'Perte de poids',
        'weight_gain': 'Prise de poids',
        'muscle_gain': 'Prise de masse musculaire',
        'maintain': 'Maintien du poids'
      };

      recommendations.push({
        type: 'health',
        priority: 'high',
        title: `Objectif: ${goalTexts[preferences.dietGoal]}`,
        description: 'Adapter les portions et équilibrer les macronutriments',
        action: 'Calculer les calories et macros pour chaque repas'
      });
    }

    // Recommandations budget
    if (preferences.budgetLevel === 'low') {
      recommendations.push({
        type: 'budget',
        priority: 'medium',
        title: 'Optimiser le budget',
        description: 'Privilégier des ingrédients économiques et de saison',
        action: 'Prioriser les recettes avec des ingrédients peu coûteux'
      });
    }

    return recommendations;
  }

  /**
   * Obtenir les statistiques des préférences utilisateurs
   */
  async getPreferencesStatistics() {
    try {
      const [
        totalUsers,
        kosherUsers,
        usersWithAllergies,
        usersWithGoals,
        dietaryRestrictions,
        cookingLevels,
        budgetLevels
      ] = await Promise.all([
        // Total utilisateurs
        this.prisma.user.count(),

        // Utilisateurs kosher (excluant 'none')
        this.prisma.user.count({
          where: {
            kosherLevel: {
              not: 'none'
            }
          }
        }),

        // Utilisateurs avec allergies
        this.prisma.user.count({
          where: {
            allergens: {
              isEmpty: false
            }
          }
        }),

        // Utilisateurs avec objectifs diététiques
        this.prisma.user.count({
          where: {
            dietGoal: {
              not: null
            }
          }
        }),

        // Répartition des restrictions alimentaires
        this.prisma.user.findMany({
          select: {
            dietaryRestrictions: true
          }
        }),

        // Répartition des niveaux de cuisine
        this.prisma.user.groupBy({
          by: ['cookingSkillLevel'],
          _count: {
            id: true
          }
        }),

        // Répartition des niveaux de budget
        this.prisma.user.groupBy({
          by: ['budgetLevel'],
          _count: {
            id: true
          }
        })
      ]);

      // Compter les restrictions alimentaires
      const restrictionCounts = {};
      dietaryRestrictions.forEach(user => {
        user.dietaryRestrictions.forEach(restriction => {
          restrictionCounts[restriction] = (restrictionCounts[restriction] || 0) + 1;
        });
      });

      return {
        total: totalUsers,
        kosher: kosherUsers,
        allergies: usersWithAllergies,
        goals: usersWithGoals,
        dietaryRestrictions: restrictionCounts,
        cookingLevels: cookingLevels.reduce((acc, level) => {
          acc[level.cookingSkillLevel] = level._count.id;
          return acc;
        }, {}),
        budgetLevels: budgetLevels.reduce((acc, level) => {
          acc[level.budgetLevel] = level._count.id;
          return acc;
        }, {})
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Formater les préférences utilisateur pour l'affichage
   */
  formatUserPreferences(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      
      // Composition familiale
      adultsCount: user.adultsCount,
      childrenCount: user.childrenCount,
      
      // Préférences alimentaires
      dietaryRestrictions: user.dietaryRestrictions,
      kosherLevel: user.kosherLevel,
      allergens: user.allergens,
      excludedIngredients: user.excludedIngredients,
      
      // Préférences de repas
      includeLunch: user.includeLunch,
      includeDinner: user.includeDinner,
      includeAdultMeals: user.includeAdultMeals,
      includeChildMeals: user.includeChildMeals,
      
      // Niveau de cuisine
      cookingSkillLevel: user.cookingSkillLevel,
      preferredDifficulty: user.preferredDifficulty,
      
      // Objectifs santé
      dietGoal: user.dietGoal,
      currentWeight: user.currentWeight,
      targetWeight: user.targetWeight,
      dailyCalorieTarget: user.dailyCalorieTarget,
      
      // Planning
      weeklyRefinedMeals: user.weeklyRefinedMeals,
      budgetLevel: user.budgetLevel,
      
      // Relations
      mealPreferences: user.userPreferences || [],
      availableIngredients: user.availableIngredients || [],
      
      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Suggérer des améliorations pour les préférences d'un utilisateur
   */
  async suggestImprovements(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);
      const suggestions = [];

      // Vérifier si les informations de base sont complètes
      if (!preferences.cookingSkillLevel || preferences.cookingSkillLevel === 'intermediate') {
        suggestions.push({
          type: 'profile_completion',
          priority: 'medium',
          title: 'Préciser le niveau de cuisine',
          description: 'Renseigner votre niveau de cuisine pour des recettes mieux adaptées'
        });
      }

      if (!preferences.dietGoal) {
        suggestions.push({
          type: 'health_goals',
          priority: 'low',
          title: 'Définir un objectif santé',
          description: 'Définir un objectif peut aider à personnaliser votre plan alimentaire'
        });
      }

      if (preferences.excludedIngredients.length === 0) {
        suggestions.push({
          type: 'personalization',
          priority: 'low',
          title: 'Personnaliser les exclusions',
          description: 'Exclure les ingrédients que vous n\'aimez pas pour des menus plus adaptés'
        });
      }

      // Vérifications de cohérence
      if (preferences.targetWeight && preferences.currentWeight) {
        const weightDiff = preferences.targetWeight - preferences.currentWeight;
        if (Math.abs(weightDiff) > 20) {
          suggestions.push({
            type: 'health_warning',
            priority: 'high',
            title: 'Objectif de poids ambitieux',
            description: 'Un changement de poids important nécessite un suivi médical'
          });
        }
      }

      return suggestions;

    } catch (error) {
      console.error('Erreur lors de la génération de suggestions:', error);
      throw error;
    }
  }
}

module.exports = UserPreferencesService;