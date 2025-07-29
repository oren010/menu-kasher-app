const { PrismaClient } = require('@prisma/client');
const { PermissionUtils } = require('./config/permissions');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testNewFeatures() {
  console.log('🧪 Test des nouvelles fonctionnalités...\n');
  
  try {
    // 1. Test du système de permissions
    console.log('🔐 TEST DU SYSTÈME DE PERMISSIONS:');
    
    const admin = await prisma.admin.findFirst();
    const adminPermissions = admin.permissions;
    
    console.log('  ✅ Permission users.read:', PermissionUtils.hasPermission(adminPermissions, 'users.read'));
    console.log('  ✅ Permission inexistante:', PermissionUtils.hasPermission(adminPermissions, 'invalid.permission'));
    console.log('  ✅ Accès page dashboard:', PermissionUtils.canAccessPage('super_admin', '/admin/dashboard'));
    console.log('  ✅ Accès page interdite:', PermissionUtils.canAccessPage('content_admin', '/admin/admins'));
    
    // 2. Test de création d'une session
    console.log('\n🔗 TEST DE CRÉATION DE SESSION:');
    
    const sessionData = {
      token: 'test-token-' + Date.now(),
      adminId: admin.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    };
    
    const session = await prisma.session.create({
      data: sessionData
    });
    
    console.log('  ✅ Session créée:', session.id);
    console.log('  ✅ Token:', session.token);
    console.log('  ✅ Expire le:', session.expiresAt.toLocaleDateString('fr-FR'));
    
    // 3. Test de création d'un log d'audit
    console.log('\n📊 TEST DE LOG D\'AUDIT:');
    
    const auditData = {
      adminId: admin.id,
      action: 'TEST',
      tableName: 'test_table',
      recordId: 'test-record-123',
      newData: {
        test: true,
        timestamp: new Date().toISOString()
      },
      ipAddress: '127.0.0.1',
      endpoint: '/api/test',
      httpMethod: 'POST',
      success: true
    };
    
    const auditLog = await prisma.auditLog.create({
      data: auditData
    });
    
    console.log('  ✅ Log d\'audit créé:', auditLog.id);
    console.log('  ✅ Action:', auditLog.action);
    console.log('  ✅ Données:', JSON.stringify(auditLog.newData));
    
    // 4. Test de création d'un nouvel admin
    console.log('\n👤 TEST DE CRÉATION D\'ADMIN:');
    
    const newAdminData = {
      email: 'test-admin@menu-kasher.app',
      passwordHash: await bcrypt.hash('TestPassword123!', 12),
      name: 'Admin Test',
      role: 'content_admin',
      permissions: PermissionUtils.getRolePermissions('content_admin')
    };
    
    const newAdmin = await prisma.admin.create({
      data: newAdminData
    });
    
    console.log('  ✅ Nouvel admin créé:', newAdmin.email);
    console.log('  ✅ Rôle:', newAdmin.role);
    console.log('  ✅ Permissions:', newAdmin.permissions.length, 'au total');
    
    // 5. Test de mise à jour utilisateur
    console.log('\n👤 TEST DE MISE À JOUR UTILISATEUR:');
    
    const user = await prisma.user.findFirst();
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          lastLoginIp: '192.168.1.100',
          loginAttempts: 0
        }
      });
      
      console.log('  ✅ Utilisateur mis à jour:', updatedUser.email);
      console.log('  ✅ Dernière connexion:', updatedUser.lastLogin.toLocaleString('fr-FR'));
      console.log('  ✅ IP:', updatedUser.lastLoginIp);
    }
    
    // 6. Nettoyage des données de test
    console.log('\n🧹 NETTOYAGE DES DONNÉES DE TEST:');
    
    await prisma.session.delete({ where: { id: session.id } });
    console.log('  ✅ Session de test supprimée');
    
    await prisma.auditLog.delete({ where: { id: auditLog.id } });
    console.log('  ✅ Log de test supprimé');
    
    await prisma.admin.delete({ where: { id: newAdmin.id } });
    console.log('  ✅ Admin de test supprimé');
    
    console.log('\n🎉 TOUS LES TESTS ONT RÉUSSI !');
    
  } catch (error) {
    console.error('❌ Erreur durant les tests:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testNewFeatures();