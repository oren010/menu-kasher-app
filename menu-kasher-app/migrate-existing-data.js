#!/usr/bin/env node

/**
 * Script de migration des données existantes avant la migration du schéma
 * 
 * Ce script migre les données des anciens champs vers les nouveaux :
 * - recipes.isKosher -> recipes.dietaryTags
 * - recipes.tags -> recipes.mealTags  
 * - recipes.ustensils -> recipes.equipment
 * - ingredients.isKosher -> ingredients.dietaryTags
 * - users: anciens champs vers nouveaux
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateRecipes() {
  console.log('🔄 Migration des recettes...');
  
  try {
    // Obtenir toutes les recettes
    const recipes = await prisma.$queryRaw`
      SELECT id, "isKosher", tags, ustensils, "dietaryTags", "mealTags", equipment
      FROM recipes 
      WHERE "isKosher" IS NOT NULL OR tags IS NOT NULL OR ustensils IS NOT NULL
    `;
    
    console.log(`📋 ${recipes.length} recettes à migrer`);
    
    for (const recipe of recipes) {
      const updates = {};
      
      // Migrer isKosher vers dietaryTags
      if (recipe.isKosher && (!recipe.dietaryTags || recipe.dietaryTags.length === 0)) {
        updates.dietaryTags = ['kosher'];
      }
      
      // Migrer tags vers mealTags
      if (recipe.tags && recipe.tags.length > 0 && (!recipe.mealTags || recipe.mealTags.length === 0)) {
        updates.mealTags = recipe.tags;
      }
      
      // Migrer ustensils vers equipment
      if (recipe.ustensils && recipe.ustensils.length > 0 && (!recipe.equipment || recipe.equipment.length === 0)) {
        updates.equipment = recipe.ustensils;
      }
      
      // Appliquer les mises à jour
      if (Object.keys(updates).length > 0) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: updates
        });
        console.log(`  ✅ Recette ${recipe.id} migrée`);
      }
    }
    
    console.log('✅ Migration des recettes terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration des recettes:', error);
  }
}

async function migrateIngredients() {
  console.log('🔄 Migration des ingrédients...');
  
  try {
    // Obtenir tous les ingrédients
    const ingredients = await prisma.$queryRaw`
      SELECT id, "isKosher", "dietaryTags"
      FROM ingredients 
      WHERE "isKosher" IS NOT NULL
    `;
    
    console.log(`📋 ${ingredients.length} ingrédients à migrer`);
    
    for (const ingredient of ingredients) {
      if (ingredient.isKosher && (!ingredient.dietaryTags || ingredient.dietaryTags.length === 0)) {
        await prisma.ingredient.update({
          where: { id: ingredient.id },
          data: {
            dietaryTags: ['kosher']
          }
        });
        console.log(`  ✅ Ingrédient ${ingredient.id} migré`);
      }
    }
    
    console.log('✅ Migration des ingrédients terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration des ingrédients:', error);
  }
}

async function migrateUsers() {
  console.log('🔄 Migration des utilisateurs...');
  
  try {
    // Obtenir tous les utilisateurs avec anciens champs
    const users = await prisma.$queryRaw`
      SELECT id, allergies, "familySize", preferences
      FROM users 
      WHERE allergies IS NOT NULL OR "familySize" IS NOT NULL OR preferences IS NOT NULL
    `;
    
    console.log(`📋 ${users.length} utilisateurs à migrer`);
    
    for (const user of users) {
      const updates = {};
      
      // Migrer allergies vers allergens si pas déjà défini
      if (user.allergies && user.allergies.length > 0) {
        const currentUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { allergens: true }
        });
        
        if (!currentUser.allergens || currentUser.allergens.length === 0) {
          updates.allergens = user.allergies;
        }
      }
      
      // Migrer familySize vers adultsCount/childrenCount si approprié
      if (user.familySize && typeof user.familySize === 'number') {
        // Estimation : 60% adultes, 40% enfants
        const adults = Math.max(1, Math.ceil(user.familySize * 0.6));
        const children = Math.max(0, user.familySize - adults);
        
        updates.adultsCount = adults;
        updates.childrenCount = children;
      }
      
      // Migrer preferences si c'est un objet vers les nouveaux champs
      if (user.preferences && typeof user.preferences === 'object') {
        if (user.preferences.budget) {
          updates.budgetLevel = user.preferences.budget;
        }
        if (user.preferences.cookingLevel) {
          updates.cookingSkillLevel = user.preferences.cookingLevel;
        }
      }
      
      // Appliquer les mises à jour
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        });
        console.log(`  ✅ Utilisateur ${user.id} migré`);
      }
    }
    
    console.log('✅ Migration des utilisateurs terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration des utilisateurs:', error);
  }
}

async function fixMealConstraints() {
  console.log('🔄 Correction des contraintes de repas...');
  
  try {
    // Identifier les doublons potentiels dans meals
    const duplicates = await prisma.$queryRaw`
      SELECT "menuId", date, "mealType", audience, COUNT(*) as count
      FROM meals 
      GROUP BY "menuId", date, "mealType", audience
      HAVING COUNT(*) > 1
    `;
    
    console.log(`📋 ${duplicates.length} groupes de doublons trouvés`);
    
    for (const duplicate of duplicates) {
      // Garder le premier, supprimer les autres
      const meals = await prisma.meal.findMany({
        where: {
          menuId: duplicate.menuId,
          date: duplicate.date,
          mealType: duplicate.mealType,
          audience: duplicate.audience
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Supprimer tous sauf le premier
      for (let i = 1; i < meals.length; i++) {
        await prisma.meal.delete({
          where: { id: meals[i].id }
        });
        console.log(`  ✅ Doublon de repas supprimé: ${meals[i].id}`);
      }
    }
    
    console.log('✅ Correction des contraintes terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la correction des contraintes:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Démarrage de la migration des données existantes...\n');
    
    // 1. Migrer les recettes
    await migrateRecipes();
    
    // 2. Migrer les ingrédients
    await migrateIngredients();
    
    // 3. Migrer les utilisateurs
    await migrateUsers();
    
    // 4. Corriger les contraintes de repas
    await fixMealConstraints();
    
    console.log('\n🎉 Migration des données existantes terminée !');
    console.log('\n📋 Vous pouvez maintenant exécuter :');
    console.log('   npx prisma db push --accept-data-loss');
    
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
  migrateRecipes,
  migrateIngredients,
  migrateUsers,
  fixMealConstraints
};