#!/usr/bin/env node

/**
 * Script de migración forzada para Heroku
 * Aplica el schema de PostgreSQL y resuelve problemas de migración
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

async function forceMigration() {
  console.log('🚀 Iniciando migración forzada...');
  
  try {
    // 1. Generar cliente de Prisma
    console.log('📦 Generando cliente de Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 2. Aplicar schema a la base de datos
    console.log('🔄 Aplicando schema a PostgreSQL...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    // 3. Verificar conexión
    console.log('✅ Verificando conexión...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // 4. Verificar tablas
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const keyCount = await prisma.key.count();
    
    console.log(`📊 Base de datos verificada:`);
    console.log(`   - Usuarios: ${userCount}`);
    console.log(`   - Sesiones: ${sessionCount}`);
    console.log(`   - Llaves: ${keyCount}`);
    
    console.log('🎉 Migración completada exitosamente!');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
forceMigration();
