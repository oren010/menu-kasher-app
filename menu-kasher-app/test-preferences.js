const { PrismaClient } = require('@prisma/client');
const UserPreferencesService = require('./services/UserPreferencesService');

const prisma = new PrismaClient();
const preferencesService = new UserPreferencesService(prisma);

async function testPreferencesSystem() {
  try {
    console.log('🧪 Test du système de préférences utilisateur\n');

    // 1. Trouver un utilisateur de test
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      console.log('❌ Aucun utilisateur trouvé pour les tests');
      return;
    }

    console.log(`📋 Test avec l'utilisateur: ${testUser.name} (${testUser.email})`);

    // 2. Obtenir les préférences actuelles
    console.log('\n1️⃣ Récupération des préférences actuelles...');
    const currentPreferences = await preferencesService.getUserPreferences(testUser.id);
    console.log('✅ Préférences récupérées:', {
      kosherLevel: currentPreferences.kosherLevel,
      familySize: `${currentPreferences.adultsCount} adultes, ${currentPreferences.childrenCount} enfants`,
      cookingSkill: currentPreferences.cookingSkillLevel,
      allergies: currentPreferences.allergens.length
    });

    // 3. Mettre à jour les préférences
    console.log('\n2️⃣ Mise à jour des préférences...');
    const updatedPreferences = await preferencesService.updateUserPreferences(testUser.id, {
      kosherLevel: 'moderate',
      dietaryRestrictions: ['vegetarian'],
      allergens: ['nuts', 'dairy'],
      cookingSkillLevel: 'intermediate',
      preferredDifficulty: 'medium',
      dietGoal: 'maintain',
      budgetLevel: 'medium',
      weeklyRefinedMeals: 3,
      excludedIngredients: ['champignons', 'épinards']
    });
    console.log('✅ Préférences mises à jour');

    // 4. Analyser les préférences
    console.log('\n3️⃣ Analyse des préférences...');
    const analysis = await preferencesService.analyzeUserPreferences(testUser.id);
    console.log('✅ Analyse terminée:', {
      familySize: analysis.familySize,
      hasChildren: analysis.hasChildren,
      isKosher: analysis.isKosher,
      hasAllergies: analysis.hasAllergies,
      recommendationsCount: analysis.recommendations.length
    });

    if (analysis.recommendations.length > 0) {
      console.log('\n📝 Recommandations:');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority}] ${rec.title}: ${rec.description}`);
      });
    }

    // 5. Générer des suggestions d'amélioration
    console.log('\n4️⃣ Génération de suggestions...');
    const suggestions = await preferencesService.suggestImprovements(testUser.id);
    console.log(`✅ ${suggestions.length} suggestions générées`);
    
    if (suggestions.length > 0) {
      console.log('\n💡 Suggestions d\'amélioration:');
      suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. [${suggestion.priority}] ${suggestion.title}: ${suggestion.description}`);
      });
    }

    // 6. Obtenir les statistiques globales
    console.log('\n5️⃣ Statistiques globales...');
    const stats = await preferencesService.getPreferencesStatistics();
    console.log('✅ Statistiques obtenues:', {
      totalUsers: stats.total,
      kosherUsers: stats.kosher,
      usersWithAllergies: stats.allergies,
      usersWithGoals: stats.goals
    });

    console.log('\n🎉 Tous les tests du système de préférences ont réussi !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests si ce fichier est appelé directement
if (require.main === module) {
  testPreferencesSystem();
}

module.exports = testPreferencesSystem;