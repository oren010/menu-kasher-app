const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermissionsAndRoles() {
  console.log('🔍 Vérification des permissions et rôles...\n');
  
  try {
    // Lister toutes les permissions
    const permissions = await prisma.permission.findMany({
      orderBy: { resource: 'asc' }
    });
    
    console.log('📋 PERMISSIONS (' + permissions.length + ' total):');
    const byResource = {};
    permissions.forEach(p => {
      if (!byResource[p.resource]) byResource[p.resource] = [];
      byResource[p.resource].push(p.action);
    });
    
    Object.entries(byResource).forEach(([resource, actions]) => {
      console.log('  📁', resource + ':', actions.join(', '));
    });
    
    console.log('\n👥 RÔLES:');
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
    
    roles.forEach(role => {
      console.log('  🎭', role.displayName, '(' + role.name + ')');
      console.log('      📝', role.description);
      console.log('      🔑', role.permissions.length, 'permissions');
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissionsAndRoles();