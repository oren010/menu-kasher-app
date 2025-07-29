const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAdmin() {
  console.log('🔍 Vérification de l\'administrateur par défaut...\n');
  
  try {
    // Récupérer l'admin par défaut
    const admin = await prisma.admin.findUnique({
      where: { email: 'admin@menu-kasher.app' }
    });
    
    if (!admin) {
      console.log('❌ Admin par défaut non trouvé !');
      return;
    }
    
    console.log('✅ ADMIN PAR DÉFAUT TROUVÉ:');
    console.log('  📧 Email:', admin.email);
    console.log('  👤 Nom:', admin.name);
    console.log('  🎭 Rôle:', admin.role);
    console.log('  🔓 Actif:', admin.isActive ? 'Oui' : 'Non');
    console.log('  🔑 Permissions:', admin.permissions.length, 'au total');
    console.log('  📅 Créé le:', admin.createdAt.toLocaleDateString('fr-FR'));
    
    // Tester le mot de passe
    const isPasswordValid = await bcrypt.compare('Admin123!', admin.passwordHash);
    console.log('  🔐 Mot de passe par défaut:', isPasswordValid ? 'Valide ✅' : 'Invalide ❌');
    
    console.log('\n🔑 PERMISSIONS DE L\'ADMIN:');
    admin.permissions.forEach((perm, index) => {
      console.log(`  ${index + 1}. ${perm}`);
    });
    
    // Vérifier les dernières connexions
    console.log('\n🕐 HISTORIQUE:');
    console.log('  📅 Dernière connexion:', admin.lastLogin || 'Jamais');
    console.log('  🌐 Dernière IP:', admin.lastLoginIp || 'Aucune');
    console.log('  🚫 Tentatives échouées:', admin.loginAttempts);
    console.log('  🔒 Verrouillé jusqu\'à:', admin.lockedUntil || 'Non verrouillé');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();