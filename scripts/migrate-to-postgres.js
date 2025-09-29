#!/usr/bin/env node

/**
 * Script para migrar de SQLite a PostgreSQL
 * Este script debe ejecutarse después de configurar las variables de entorno
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function migrateToPostgres() {
  console.log('🚀 Iniciando migración a PostgreSQL...');
  
  try {
    // 1. Generar el cliente de Prisma
    console.log('📦 Generando cliente de Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 2. Ejecutar migraciones
    console.log('🔄 Ejecutando migraciones...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('✅ Migración completada exitosamente!');
    console.log('📊 Base de datos PostgreSQL configurada y lista para usar.');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToPostgres();
}

export { migrateToPostgres };
