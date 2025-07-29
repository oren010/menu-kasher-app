// Script pour appliquer la migration vers le schéma avancé
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyEnhancedMigration() {
  console.log("🔄 Début de l'application de la migration avancée...");
  
  try {
    // Étape 1: Ajouter les nouvelles colonnes avec valeurs par défaut
    console.log("📝 Étape 1: Ajout des nouvelles colonnes...");
    
    // 1. Extension du modèle User
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "adultsCount" INTEGER DEFAULT 2`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dietaryRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "excludedIngredients" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "includeLunch" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "includeDinner" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "includeAdultMeals" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "includeChildMeals" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cookingSkillLevel" TEXT DEFAULT 'intermediate'`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferredDifficulty" TEXT DEFAULT 'medium'`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dietGoal" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currentWeight" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "targetWeight" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dailyCalorieTarget" INTEGER`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weeklyRefinedMeals" INTEGER DEFAULT 2`;
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "budgetLevel" TEXT DEFAULT 'medium'`;
    
    console.log('  ✅ Colonnes utilisateur ajoutées');
    
    // 2. Migration des données User existantes
    await prisma.$executeRaw`
      UPDATE "users" SET 
        "adultsCount" = GREATEST(1, "familySize" - "childrenCount"),
        "dietaryRestrictions" = CASE 
          WHEN "kosherLevel" != 'none' AND "kosherLevel" IS NOT NULL THEN ARRAY['kosher']::TEXT[]
          ELSE ARRAY[]::TEXT[]
        END,
        "allergens" = COALESCE("allergies", ARRAY[]::TEXT[]),
        "excludedIngredients" = ARRAY['tofu']::TEXT[],
        "includeChildMeals" = CASE WHEN "childrenCount" > 0 THEN true ELSE false END
    `;
    
    console.log('  ✅ Données utilisateur migrées');
    
    // 3. Extension des autres modèles
    await prisma.$executeRaw`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "color" TEXT`;
    
    // Ingredients
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "caloriesPer100g" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "proteinPer100g" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "carbsPer100g" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "fatPer100g" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "seasonality" TEXT[] DEFAULT ARRAY['year_round']::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "averageCost" TEXT DEFAULT 'medium'`;
    await prisma.$executeRaw`ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "shelfLife" INTEGER`;
    
    console.log('  ✅ Colonnes ingrédients ajoutées');
    
    // Recipes
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "totalTime" INTEGER`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "audience" TEXT DEFAULT 'both'`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "cuisine" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "caloriesPerServing" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "proteinPerServing" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "carbsPerServing" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "fatPerServing" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "mealTags" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "occasionTags" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "suggestedSides" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "personalNotes" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "isTested" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "isBookmarked" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "lastMade" TIMESTAMP(3)`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "timesCooked" INTEGER DEFAULT 0`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "canMakeAhead" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "freezable" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "leftoverDays" INTEGER`;
    
    console.log('  ✅ Colonnes recettes ajoutées');
    
    // Meals - ajouter audience avec valeur par défaut
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "audience" TEXT DEFAULT 'both'`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "isPlanned" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "isCooked" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "rating" INTEGER`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "leftoverPortions" INTEGER DEFAULT 0`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "servingsActual" INTEGER`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "difficulty" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "timeActual" INTEGER`;
    
    console.log('  ✅ Colonnes repas ajoutées');
    
    // Étape 2: Migration des données existantes
    console.log('📝 Étape 2: Migration des données existantes...');
    
    // Migration des données meals
    await prisma.$executeRaw`
      UPDATE "meals" SET 
        "audience" = CASE 
          WHEN "mealType" LIKE '%children%' THEN 'children'
          WHEN "mealType" LIKE '%adults%' THEN 'adults'
          ELSE 'both'
        END
      WHERE "audience" = 'both'
    `;
    
    // Mise à jour des mealType pour le nouveau format
    await prisma.$executeRaw`
      UPDATE "meals" SET 
        "mealType" = CASE 
          WHEN "mealType" LIKE '%lunch%' THEN 'lunch'
          WHEN "mealType" LIKE '%dinner%' THEN 'dinner'
          ELSE 'dinner'
        END
    `;
    
    // Migration des données recipes
    await prisma.$executeRaw`
      UPDATE "recipes" SET 
        "audience" = CASE 
          WHEN "mealType" LIKE '%children%' THEN 'children'
          WHEN "mealType" LIKE '%adults%' THEN 'adults'
          ELSE 'both'
        END,
        "totalTime" = COALESCE("prepTime", 0) + COALESCE("cookTime", 0),
        "dietaryTags" = CASE 
          WHEN "isKosher" = true THEN ARRAY['kosher']::TEXT[]
          ELSE ARRAY[]::TEXT[]
        END,
        "equipment" = COALESCE("ustensils", ARRAY[]::TEXT[]),
        "occasionTags" = COALESCE("tags", ARRAY[]::TEXT[])
      WHERE "audience" = 'both' OR "totalTime" IS NULL
    `;
    
    // Mise à jour des mealType pour les recettes
    await prisma.$executeRaw`
      UPDATE "recipes" SET 
        "mealType" = CASE 
          WHEN "mealType" LIKE '%lunch%' THEN 'lunch'
          WHEN "mealType" LIKE '%dinner%' THEN 'dinner'
          ELSE 'dinner'
        END
    `;
    
    console.log('  ✅ Données migrées');
    
    // Étape 3: Créer les nouvelles tables
    console.log('📝 Étape 3: Création des nouvelles tables...');
    
    // Créer la table des préférences utilisateur (si elle n'existe pas)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "user_meal_preferences" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "dayOfWeek" TEXT NOT NULL,
        "mealType" TEXT NOT NULL,
        "audience" TEXT NOT NULL,
        "preferredDifficulty" TEXT NOT NULL DEFAULT 'medium',
        "preferredTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
        CONSTRAINT "user_meal_preferences_pkey" PRIMARY KEY ("id")
      )
    `;
    
    // Créer la table des évaluations (si elle n'existe pas)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "recipe_ratings" (
        "id" TEXT NOT NULL,
        "recipeId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "rating" INTEGER NOT NULL,
        "comment" TEXT,
        "difficulty" INTEGER,
        "wouldMakeAgain" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "recipe_ratings_pkey" PRIMARY KEY ("id")
      )
    `;
    
    console.log('  ✅ Nouvelles tables créées');
    
    console.log('✅ Migration terminée avec succès !');
    console.log('🔄 Redémarrage du client Prisma...');
    
    // Regénérer le client Prisma
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
    throw error;
  }
}

// Exécuter la migration
if (require.main === module) {
  applyEnhancedMigration()
    .then(() => {
      console.log('🎉 Migration appliquée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { applyEnhancedMigration };