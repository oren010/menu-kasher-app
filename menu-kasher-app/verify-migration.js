const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMigration() {
  console.log('🔍 Vérification de la migration des données...\n');
  
  try {
    // Vérifier les recettes migrées
    console.log('📝 RECETTES:');
    const recipes = await prisma.recipe.findMany({
      select: { 
        id: true, 
        name: true, 
        dietaryTags: true, 
        mealTags: true, 
        equipment: true 
      }
    });
    
    const recipesWithDietaryTags = recipes.filter(r => r.dietaryTags.length > 0);
    const recipesWithMealTags = recipes.filter(r => r.mealTags.length > 0);
    const recipesWithEquipment = recipes.filter(r => r.equipment.length > 0);
    
    console.log(`  📊 Total: ${recipes.length} recettes`);
    console.log(`  🥗 Avec dietaryTags: ${recipesWithDietaryTags.length}`);
    console.log(`  🏷️ Avec mealTags: ${recipesWithMealTags.length}`);
    console.log(`  🔧 Avec equipment: ${recipesWithEquipment.length}`);
    
    // Exemples de recettes migrées
    if (recipesWithDietaryTags.length > 0) {
      console.log('  📋 Exemple recette avec dietaryTags:');
      const example = recipesWithDietaryTags[0];
      console.log(`      "${example.name}": ${example.dietaryTags.join(', ')}`);
    }
    
    // Vérifier les ingrédients migrés
    console.log('\n🥕 INGRÉDIENTS:');
    const ingredients = await prisma.ingredient.findMany({
      select: { 
        id: true, 
        name: true, 
        dietaryTags: true 
      }
    });
    
    const ingredientsWithDietaryTags = ingredients.filter(i => i.dietaryTags.length > 0);
    console.log(`  📊 Total: ${ingredients.length} ingrédients`);
    console.log(`  🥗 Avec dietaryTags: ${ingredientsWithDietaryTags.length}`);
    
    if (ingredientsWithDietaryTags.length > 0) {
      console.log('  📋 Exemple ingrédient avec dietaryTags:');
      const example = ingredientsWithDietaryTags[0];
      console.log(`      "${example.name}": ${example.dietaryTags.join(', ')}`);
    }
    
    // Vérifier les utilisateurs migrés
    console.log('\n👤 UTILISATEURS:');
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        isActive: true, 
        emailVerified: true,
        passwordHash: true,
        adultsCount: true,
        childrenCount: true,
        allergens: true
      }
    });
    
    console.log(`  📊 Total: ${users.length} utilisateurs`);
    users.forEach((user, index) => {
      console.log(`  👤 Utilisateur ${index + 1}:`);
      console.log(`      📧 ${user.email}`);
      console.log(`      🔓 Actif: ${user.isActive}`);
      console.log(`      ✅ Email vérifié: ${user.emailVerified}`);
      console.log(`      🔐 Mot de passe: ${user.passwordHash ? 'Non défini' : 'Défini'}`);
      console.log(`      👨‍👩‍👧‍👦 Famille: ${user.adultsCount} adultes, ${user.childrenCount} enfants`);
      console.log(`      🚫 Allergènes: ${user.allergens.length > 0 ? user.allergens.join(', ') : 'Aucun'}`);
    });
    
    // Vérifier les logs d'audit
    console.log('\n📊 LOGS D\'AUDIT:');
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`  📊 Total: ${logs.length} entrées`);
    logs.forEach((log, index) => {
      console.log(`  📝 Log ${index + 1}: ${log.action} sur ${log.tableName} (${log.success ? 'Succès' : 'Échec'})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigration();