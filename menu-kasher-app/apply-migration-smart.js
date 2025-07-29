// Script de migration intelligent qui évite les conflits
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function smartMigration() {
  console.log("🔄 Début de la migration intelligente...");
  
  try {
    // Étape 1: Ajouter les nouvelles colonnes seulement
    console.log("📝 Étape 1: Ajout des colonnes sans migration des données...");
    
    // Extension du modèle User
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

    // Extension des autres modèles
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
    
    // Meals - ajouter audience avec valeur par défaut
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "audience" TEXT DEFAULT 'both'`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "isPlanned" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "isCooked" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "rating" INTEGER`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "leftoverPortions" INTEGER DEFAULT 0`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "servingsActual" INTEGER`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "difficulty" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "timeActual" INTEGER`;
    
    console.log("  ✅ Toutes les colonnes ajoutées");
    
    // Étape 2: Migration progressive des données SANS changer les contraintes
    console.log("📝 Étape 2: Migration des données (sans changer les contraintes)...");
    
    // Migration des données User
    await prisma.$executeRaw`
      UPDATE "users" SET 
        "adultsCount" = GREATEST(1, COALESCE("familySize", 4) - COALESCE("childrenCount", 2)),
        "dietaryRestrictions" = CASE 
          WHEN "kosherLevel" IS NOT NULL AND "kosherLevel" != 'none' THEN ARRAY['kosher']::TEXT[]
          ELSE ARRAY[]::TEXT[]
        END,
        "allergens" = COALESCE("allergies", ARRAY[]::TEXT[]),
        "excludedIngredients" = ARRAY['tofu']::TEXT[],
        "includeChildMeals" = CASE WHEN COALESCE("childrenCount", 0) > 0 THEN true ELSE false END
    `;
    
    // Migration des données meals - juste populer audience sans changer mealType
    await prisma.$executeRaw`
      UPDATE "meals" SET 
        "audience" = CASE 
          WHEN "mealType" LIKE '%children%' THEN 'children'
          WHEN "mealType" LIKE '%adults%' THEN 'adults'
          ELSE 'both'
        END
      WHERE "audience" = 'both'
    `;
    
    // Migration des données recipes - populer les nouveaux champs sans changer mealType
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
    
    // Ajouter des données nutritionnelles de base
    await prisma.$executeRaw`
      UPDATE "ingredients" SET 
        "caloriesPer100g" = CASE 
          WHEN LOWER("name") LIKE '%saumon%' THEN 208.0
          WHEN LOWER("name") LIKE '%tomate%' THEN 18.0
          WHEN LOWER("name") LIKE '%courgette%' THEN 17.0
          WHEN LOWER("name") LIKE '%pâte%' THEN 131.0
          WHEN LOWER("name") LIKE '%beurre%' THEN 717.0
          WHEN LOWER("name") LIKE '%pain%' THEN 265.0
          WHEN LOWER("name") LIKE '%thon%' THEN 144.0
          ELSE NULL
        END,
        "dietaryTags" = ARRAY['kosher']::TEXT[],
        "seasonality" = ARRAY['year_round']::TEXT[]
      WHERE "caloriesPer100g" IS NULL
    `;
    
    console.log("  ✅ Données migrées avec succès");
    
    console.log("✅ Migration intelligente terminée !");
    console.log("📝 Note: Les contraintes d'unicité et types de repas restent inchangés pour préserver les données");
    
  } catch (error) {
    console.error("❌ Erreur durant la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
if (require.main === module) {
  smartMigration()
    .then(() => {
      console.log("🎉 Migration intelligente appliquée avec succès !");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Échec de la migration:", error);
      process.exit(1);
    });
}

module.exports = { smartMigration };