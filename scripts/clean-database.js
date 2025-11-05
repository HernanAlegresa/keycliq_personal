/**
 * Script para limpiar completamente la base de datos
 * ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos de usuarios
 * Solo ejecutar en staging/production cuando se quiera comenzar desde cero
 * 
 * Uso:
 *   node scripts/clean-database.js
 * 
 * O con confirmación:
 *   node scripts/clean-database.js --confirm
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');

  if (!confirmed) {
    console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de usuarios');
    console.log('📋 Tablas que se limpiarán:');
    console.log('   - User');
    console.log('   - Session');
    console.log('   - PasswordResetToken');
    console.log('   - keys');
    console.log('   - key_signatures');
    console.log('   - key_queries');
    console.log('   - key_matchings');
    console.log('');
    console.log('❌ Para ejecutar, usa: node scripts/clean-database.js --confirm');
    process.exit(1);
  }

  try {
    console.log('🧹 Limpiando base de datos...');
    console.log('');

    // Orden de eliminación considerando foreign keys
    console.log('1. Eliminando key_matchings...');
    await prisma.keyMatching.deleteMany({});
    console.log('   ✅ key_matchings eliminados');

    console.log('2. Eliminando key_signatures...');
    await prisma.keySignature.deleteMany({});
    console.log('   ✅ key_signatures eliminados');

    console.log('3. Eliminando key_queries...');
    await prisma.keyQuery.deleteMany({});
    console.log('   ✅ key_queries eliminados');

    console.log('4. Eliminando keys...');
    await prisma.key.deleteMany({});
    console.log('   ✅ keys eliminados');

    console.log('5. Eliminando PasswordResetToken...');
    await prisma.passwordResetToken.deleteMany({});
    console.log('   ✅ PasswordResetToken eliminados');

    console.log('6. Eliminando Session...');
    await prisma.session.deleteMany({});
    console.log('   ✅ Session eliminados');

    console.log('7. Eliminando User...');
    await prisma.user.deleteMany({});
    console.log('   ✅ User eliminados');

    console.log('');
    console.log('✅ Base de datos limpiada exitosamente');
    console.log('');

    // Verificar que las tablas están vacías
    console.log('📊 Verificación de tablas:');
    const [users, keys, signatures, queries, matchings, sessions, tokens] = await Promise.all([
      prisma.user.count(),
      prisma.key.count(),
      prisma.keySignature.count(),
      prisma.keyQuery.count(),
      prisma.keyMatching.count(),
      prisma.session.count(),
      prisma.passwordResetToken.count()
    ]);

    console.log(`   User: ${users}`);
    console.log(`   keys: ${keys}`);
    console.log(`   key_signatures: ${signatures}`);
    console.log(`   key_queries: ${queries}`);
    console.log(`   key_matchings: ${matchings}`);
    console.log(`   Session: ${sessions}`);
    console.log(`   PasswordResetToken: ${tokens}`);
    console.log('');

    if (users === 0 && keys === 0 && signatures === 0 && queries === 0 && matchings === 0) {
      console.log('✅ Todas las tablas están vacías. Base de datos lista para comenzar desde cero.');
    } else {
      console.log('⚠️  Algunas tablas aún tienen datos. Verificar manualmente.');
    }

  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();

