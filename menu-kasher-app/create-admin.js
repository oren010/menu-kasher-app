const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Supprimer l'admin existant
    await prisma.admin.deleteMany({
      where: { email: 'admin@menu-kasher.app' }
    });

    // Créer le hash pour "admin123"
    const passwordHash = await bcrypt.hash('admin123', 12);

    // Créer l'admin
    const admin = await prisma.admin.create({
      data: {
        id: 'admin-1',
        email: 'admin@menu-kasher.app',
        passwordHash: passwordHash,
        name: 'Administrateur Principal',
        role: 'super_admin',
        permissions: ['all'],
        isActive: true,
        createdBy: 'system'
      }
    });

    console.log('✅ Admin créé avec succès:');
    console.log('Email:', admin.email);
    console.log('Mot de passe: admin123');
    console.log('Hash:', passwordHash);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();