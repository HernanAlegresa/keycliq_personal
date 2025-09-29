#!/usr/bin/env node

/**
 * Script de diagnóstico y reparación para KeyCliq
 * Verifica la base de datos y aplica migraciones necesarias
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function diagnoseAndFix() {
  console.log('🔍 Iniciando diagnóstico de KeyCliq...');
  
  try {
    // 1. Verificar conexión a la base de datos
    console.log('📊 Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa');
    
    // 2. Verificar si las tablas existen
    console.log('🔍 Verificando estructura de la base de datos...');
    
    try {
      // Intentar consultar la tabla User
      const userCount = await prisma.user.count();
      console.log(`✅ Tabla User encontrada (${userCount} usuarios)`);
    } catch (error) {
      console.log('❌ Tabla User no encontrada o con problemas');
      console.log('🔧 Aplicando migración de base de datos...');
      
      // Aplicar migración
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Migración aplicada');
    }
    
    // 3. Verificar tablas específicas
    const tables = ['User', 'Session', 'Key'];
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`✅ Tabla ${table}: ${count} registros`);
      } catch (error) {
        console.log(`❌ Problema con tabla ${table}:`, error.message);
      }
    }
    
    // 4. Verificar variables de entorno
    console.log('🔍 Verificando variables de entorno...');
    const requiredVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'STORAGE_PROVIDER',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'CLOUDINARY_UPLOAD_PRESET'
    ];
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Configurado`);
      } else {
        console.log(`❌ ${varName}: FALTANTE`);
      }
    }
    
    console.log('🎉 Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
diagnoseAndFix();
