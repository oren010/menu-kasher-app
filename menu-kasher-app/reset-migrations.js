// Script pour nettoyer les migrations échouées de Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetMigrations() {
  console.log("🔄 Nettoyage des migrations échouées...");
  
  try {
    // Supprimer les enregistrements de migrations échouées de la table _prisma_migrations
    await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE "migration_name" LIKE '%enhanced%'`;
    
    console.log("✅ Migrations échouées supprimées");
    
    // Vérifier les migrations restantes
    const remainingMigrations = await prisma.$queryRaw`SELECT * FROM "_prisma_migrations" ORDER BY "started_at"`;
    
    console.log("📋 Migrations restantes:", remainingMigrations.length);
    remainingMigrations.forEach(m => {
      console.log(`  - ${m.migration_name}: ${m.finished_at ? 'SUCCESS' : 'PENDING'}`);
    });
    
  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le nettoyage
if (require.main === module) {
  resetMigrations()
    .then(() => {
      console.log("🎉 Nettoyage terminé !");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Échec:", error);
      process.exit(1);
    });
}

module.exports = { resetMigrations };