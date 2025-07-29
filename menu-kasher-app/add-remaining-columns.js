// Script pour ajouter les colonnes manquantes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRemainingColumns() {
  console.log("🔄 Ajout des colonnes manquantes...");
  
  try {
    // Colonnes manquantes pour recipe_ingredients
    console.log("📝 Ajout des colonnes recipe_ingredients...");
    await prisma.$executeRaw`ALTER TABLE "recipe_ingredients" ADD COLUMN IF NOT EXISTS "isOptional" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "recipe_ingredients" ADD COLUMN IF NOT EXISTS "section" TEXT`;
    
    // Colonnes manquantes pour shopping_lists
    console.log("📝 Ajout des colonnes shopping_lists...");
    await prisma.$executeRaw`ALTER TABLE "shopping_lists" ADD COLUMN IF NOT EXISTS "excludeAvailable" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "shopping_lists" ADD COLUMN IF NOT EXISTS "groupByCategory" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "shopping_lists" ADD COLUMN IF NOT EXISTS "showRecipeLinks" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "shopping_lists" ADD COLUMN IF NOT EXISTS "estimatedCost" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "shopping_lists" ADD COLUMN IF NOT EXISTS "budgetAlert" BOOLEAN DEFAULT false`;
    
    // Colonnes manquantes pour shopping_list_items
    console.log("📝 Ajout des colonnes shopping_list_items...");
    await prisma.$executeRaw`ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "actualCost" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "actualQuantity" DOUBLE PRECISION`;
    await prisma.$executeRaw`ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "store" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "recipeNames" TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    await prisma.$executeRaw`ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "isOptional" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'normal'`;
    
    // Colonnes manquantes pour menus
    console.log("📝 Ajout des colonnes menus...");
    await prisma.$executeRaw`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "includeLunch" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "includeDinner" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "includeAdultMeals" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "includeChildMeals" BOOLEAN DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "maxDifficulty" TEXT DEFAULT 'medium'`;
    await prisma.$executeRaw`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "budgetLevel" TEXT DEFAULT 'medium'`;
    await prisma.$executeRaw`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "varietyLevel" TEXT DEFAULT 'high'`;
    await prisma.$executeRaw`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "specialDays" JSONB[] DEFAULT ARRAY[]::JSONB[]`;
    
    // Extension du modèle Settings
    console.log("📝 Ajout des colonnes settings...");
    await prisma.$executeRaw`ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'general'`;
    await prisma.$executeRaw`ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT true`;
    
    console.log("✅ Toutes les colonnes manquantes ajoutées !");
    
  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'ajout
if (require.main === module) {
  addRemainingColumns()
    .then(() => {
      console.log("🎉 Colonnes ajoutées avec succès !");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Échec:", error);
      process.exit(1);
    });
}

module.exports = { addRemainingColumns };