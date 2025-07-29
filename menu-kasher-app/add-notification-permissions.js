const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addNotificationPermissions() {
  try {
    console.log('🔄 Ajout des permissions de notifications...');

    // Définir les nouvelles permissions
    const newPermissions = [
      {
        name: 'notifications.create',
        resource: 'notifications',
        action: 'create',
        description: 'Créer et envoyer des notifications aux utilisateurs et admins'
      },
      {
        name: 'notifications.read',
        resource: 'notifications',
        action: 'read',
        description: 'Consulter toutes les notifications du système'
      },
      {
        name: 'notifications.update',
        resource: 'notifications',
        action: 'update',
        description: 'Modifier et gérer les notifications existantes'
      },
      {
        name: 'notifications.delete',
        resource: 'notifications',
        action: 'delete',
        description: 'Supprimer et nettoyer les notifications'
      }
    ];

    // Ajouter les permissions
    for (const permission of newPermissions) {
      const existing = await prisma.permission.findUnique({
        where: { name: permission.name }
      });

      if (!existing) {
        await prisma.permission.create({
          data: permission
        });
        console.log(`✅ Permission ajoutée: ${permission.name}`);
      } else {
        console.log(`⚠️ Permission existe déjà: ${permission.name}`);
      }
    }

    // Récupérer le rôle super_admin
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'super_admin' }
    });

    if (superAdminRole) {
      // Ajouter les nouvelles permissions au super_admin
      const notificationPermissions = newPermissions.map(p => p.name);
      const updatedPermissions = [...new Set([...superAdminRole.permissions, ...notificationPermissions])];

      await prisma.role.update({
        where: { id: superAdminRole.id },
        data: {
          permissions: updatedPermissions
        }
      });

      console.log('✅ Permissions ajoutées au rôle super_admin');
    }

    // Mettre à jour l'admin existant
    const admin = await prisma.admin.findUnique({
      where: { email: 'admin@menu-kasher.app' }
    });

    if (admin) {
      const notificationPermissions = newPermissions.map(p => p.name);
      const updatedPermissions = [...new Set([...admin.permissions, ...notificationPermissions])];

      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          permissions: updatedPermissions
        }
      });

      console.log('✅ Permissions ajoutées à l\'admin principal');
    }

    console.log('🎉 Permissions de notifications ajoutées avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addNotificationPermissions();