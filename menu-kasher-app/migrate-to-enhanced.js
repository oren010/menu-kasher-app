// Script de migration pour le nouveau schéma avancé
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToEnhancedSchema() {
  console.log('🔄 Début de la migration vers le schéma avancé...');
  
  try {
    // 1. Sauvegarder les données existantes
    console.log('📋 Récupération des données existantes...');
    
    const existingUsers = await prisma.user.findMany({
      include: {
        menus: {
          include: {
            meals: {
              include: {
                recipe: true
              }
            }
          }
        },
        shoppingLists: {
          include: {
            items: {
              include: {
                ingredient: true
              }
            }
          }
        }
      }
    });
    
    const existingRecipes = await prisma.recipe.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });
    
    const existingIngredients = await prisma.ingredient.findMany({
      include: {
        category: true
      }
    });
    
    const existingCategories = await prisma.category.findMany();
    
    console.log(`📊 Trouvé: ${existingUsers.length} utilisateurs, ${existingRecipes.length} recettes, ${existingIngredients.length} ingrédients`);
    
    // 2. Migrer les données avec les nouvelles colonnes
    console.log('🔄 Migration des utilisateurs...');
    
    for (const user of existingUsers) {
      const updatedUserData = {
        // Mapping des anciens champs vers les nouveaux
        adultsCount: Math.max(1, (user.familySize || 4) - (user.childrenCount || 2)),
        childrenCount: user.childrenCount || 2,
        
        // Conversion des préférences kosher
        dietaryRestrictions: user.kosherLevel === 'none' ? [] : ['kosher'],
        kosherLevel: user.kosherLevel || 'none',
        allergens: user.allergies || [],
        excludedIngredients: ['tofu'], // Exclusion par défaut du tofu comme spécifié
        
        // Préférences de repas (par défaut activées)
        includeLunch: true,
        includeDinner: true,
        includeAdultMeals: true,
        includeChildMeals: user.childrenCount > 0,
        
        // Niveau de cuisine par défaut
        cookingSkillLevel: 'intermediate',
        preferredDifficulty: 'medium',
        
        // Pas d'objectifs santé par défaut
        dietGoal: null,
        currentWeight: null,
        targetWeight: null,
        dailyCalorieTarget: null,
        
        // Préférences de planning
        weeklyRefinedMeals: 2,
        budgetLevel: 'medium'
      };
      
      console.log(`  ↻ Migration utilisateur: ${user.name}`);
      
      // Note: Prisma ne peut pas faire UPDATE avec des nouveaux champs lors de migration
      // Cette logique sera appliquée après la migration des colonnes
    }
    
    // 3. Migrer les recettes avec nouvelles métadonnées
    console.log('🔄 Migration des recettes...');
    
    for (const recipe of existingRecipes) {
      console.log(`  ↻ Migration recette: ${recipe.name}`);
      
      // Calculer les nouvelles propriétés
      const enhancedRecipeData = {
        // Nouvelles propriétés basées sur les anciennes
        audience: recipe.mealType.includes('children') ? 'children' : 
                 recipe.mealType.includes('adults') ? 'adults' : 'both',
        
        // Mapper les types de repas
        mealType: recipe.mealType.includes('lunch') ? 'lunch' : 
                 recipe.mealType.includes('dinner') ? 'dinner' : 'dinner',
        
        // Propriétés nutritionnelles (estimations par défaut)
        caloriesPerServing: estimateCalories(recipe),
        proteinPerServing: null,
        carbsPerServing: null,
        fatPerServing: null,
        
        // Tags alimentaires basés sur les contraintes existantes
        dietaryTags: recipe.isKosher ? ['kosher'] : [],
        mealTags: [],
        occasionTags: [],
        allergens: [],
        
        // Équipement basé sur les instructions
        equipment: extractEquipmentFromInstructions(recipe.instructions),
        suggestedSides: [],
        
        // Métadonnées utilisateur
        personalNotes: null,
        isTested: false,
        isBookmarked: false,
        lastMade: null,
        timesCooked: 0,
        
        // Planification
        canMakeAhead: false,
        freezable: false,
        leftoverDays: estimateLeftoverDays(recipe),
        
        // Calcul du temps total
        totalTime: (recipe.prepTime || 0) + (recipe.cookTime || 0)
      };
      
      // Cette logique sera appliquée après la migration
    }
    
    // 4. Migrer les ingrédients avec propriétés nutritionnelles
    console.log('🔄 Migration des ingrédients...');
    
    for (const ingredient of existingIngredients) {
      console.log(`  ↻ Migration ingrédient: ${ingredient.name}`);
      
      const enhancedIngredientData = {
        // Propriétés nutritionnelles (base de données nutritionnelle simplifiée)
        caloriesPer100g: getNutritionalData(ingredient.name, 'calories'),
        proteinPer100g: getNutritionalData(ingredient.name, 'protein'),
        carbsPer100g: getNutritionalData(ingredient.name, 'carbs'),
        fatPer100g: getNutritionalData(ingredient.name, 'fat'),
        
        // Tags alimentaires
        dietaryTags: getDietaryTags(ingredient.name),
        allergens: getAllergens(ingredient.name),
        
        // Disponibilité
        seasonality: getSeasonality(ingredient.name),
        averageCost: 'medium',
        shelfLife: getShelfLife(ingredient.name)
      };
      
      // Cette logique sera appliquée après la migration
    }
    
    console.log('✅ Analyse de migration terminée. Données préparées pour la migration.');
    console.log('📝 Note: Exécuter "npx prisma migrate dev" pour appliquer les changements de schéma.');
    
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Fonctions utilitaires pour estimer les données manquantes
function estimateCalories(recipe) {
  // Estimation basique basée sur le type de repas et les ingrédients
  const baseCalories = {
    'lunch_children': 300,
    'dinner_children': 400,
    'dinner_adults': 500
  };
  return baseCalories[recipe.mealType] || 400;
}

function extractEquipmentFromInstructions(instructions) {
  const equipment = [];
  const instructionText = instructions.join(' ').toLowerCase();
  
  if (instructionText.includes('four')) equipment.push('oven');
  if (instructionText.includes('casserole') || instructionText.includes('cuire')) equipment.push('stovetop');
  if (instructionText.includes('mixer') || instructionText.includes('mélanger')) equipment.push('mixer');
  if (instructionText.includes('poêle')) equipment.push('pan');
  
  return equipment;
}

function estimateLeftoverDays(recipe) {
  // Estimation basée sur le type d'ingrédients
  if (recipe.name.toLowerCase().includes('poisson')) return 1;
  if (recipe.name.toLowerCase().includes('viande')) return 2;
  return 3; // Par défaut
}

function getNutritionalData(ingredientName, type) {
  // Base de données nutritionnelle simplifiée
  const nutritionDb = {
    'saumon': { calories: 208, protein: 25.4, carbs: 0, fat: 12.4 },
    'tomates': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    'courgettes': { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
    'pâtes': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
    'beurre': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
    'pain': { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
    'thon': { calories: 144, protein: 23, carbs: 0, fat: 4.9 }
  };
  
  const ingredient = nutritionDb[ingredientName.toLowerCase()];
  return ingredient ? ingredient[type] : null;
}

function getDietaryTags(ingredientName) {
  const tags = [];
  const name = ingredientName.toLowerCase();
  
  // Tous les ingrédients actuels sont kosher par défaut
  tags.push('kosher');
  
  // Végétarien/végétalien
  if (!['saumon', 'thon', 'beurre'].some(meat => name.includes(meat))) {
    tags.push('vegetarian');
    if (!['beurre'].some(dairy => name.includes(dairy))) {
      tags.push('vegan');
    }
  }
  
  // Sans gluten
  if (!['pâtes', 'pain'].some(gluten => name.includes(gluten))) {
    tags.push('gluten_free');
  }
  
  return tags;
}

function getAllergens(ingredientName) {
  const allergens = [];
  const name = ingredientName.toLowerCase();
  
  if (['pâtes', 'pain'].some(gluten => name.includes(gluten))) {
    allergens.push('gluten');
  }
  
  if (['beurre'].some(dairy => name.includes(dairy))) {
    allergens.push('dairy');
  }
  
  return allergens;
}

function getSeasonality(ingredientName) {
  const name = ingredientName.toLowerCase();
  
  if (['tomates', 'courgettes'].some(summer => name.includes(summer))) {
    return ['summer', 'autumn'];
  }
  
  return ['year_round'];
}

function getShelfLife(ingredientName) {
  const name = ingredientName.toLowerCase();
  
  if (['saumon', 'thon'].some(fish => name.includes(fish))) return 2;
  if (['tomates', 'courgettes'].some(veg => name.includes(veg))) return 7;
  if (['pâtes'].some(dry => name.includes(dry))) return 365;
  if (['pain'].some(bread => name.includes(bread))) return 3;
  if (['beurre'].some(dairy => name.includes(dairy))) return 14;
  
  return 7; // Par défaut
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  migrateToEnhancedSchema()
    .then(() => {
      console.log('🎉 Migration préparée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { migrateToEnhancedSchema };