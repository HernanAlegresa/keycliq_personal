/**
 * Test de Simulación de Staging - End-to-End
 * 
 * Simula el flujo completo de un usuario escaneando llaves en staging
 * usando imágenes reales del dataset optimizado.
 * 
 * Uso:
 *   node scripts/test-staging-simulation.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProductionKeyScanV5 } from '../app/lib/vision/keyscan/v5/ProductionKeyScanV5.js';
import { ImageProcessorV3Fixed } from '../app/lib/vision/keyscan/v3/ImageProcessorV3Fixed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🎭 SIMULACIÓN DE STAGING - Test End-to-End\n');
console.log('Simulando usuario escaneando llaves en staging...\n');

// ==================== CONFIGURACIÓN ====================

const TESTS_DIR = path.join(projectRoot, 'tests/keys-optimized');

// Simular inventario de usuario con 3 llaves
const USER_INVENTORY_KEYS = [
  { category: 'regular', keyId: 'regular-01', image: 'aligned' },
  { category: 'regular', keyId: 'regular-05', image: 'aligned' },
  { category: 'lockbox', keyId: 'lockbox-02', image: 'aligned' },
];

// Simular escaneos de usuario
const USER_SCANS = [
  // CASO 1: Usuario escanea una llave que está en su inventario (different photo)
  { 
    category: 'regular', 
    keyId: 'regular-01', 
    image: 'generated',
    description: '🔑 Usuario escanea Regular-01 (diferente foto del inventario)',
    expectedResult: 'MATCH'
  },
  
  // CASO 2: Usuario escanea otra llave de su inventario (different photo)
  { 
    category: 'lockbox', 
    keyId: 'lockbox-02', 
    image: 'generated',
    description: '🔑 Usuario escanea Lockbox-02 (diferente foto del inventario)',
    expectedResult: 'MATCH'
  },
  
  // CASO 3: Usuario escanea una llave NUEVA (no está en inventario)
  { 
    category: 'regular', 
    keyId: 'regular-13', 
    image: 'aligned',
    description: '🔑 Usuario escanea Regular-13 (llave nueva, no en inventario)',
    expectedResult: 'NO_MATCH'
  },
  
  // CASO 4: Usuario escanea llave similar pero diferente
  { 
    category: 'regular', 
    keyId: 'regular-17', 
    image: 'aligned',
    description: '🔑 Usuario escanea Regular-17 (diferente a las del inventario)',
    expectedResult: 'NO_MATCH'
  },
];

// ==================== FUNCIONES AUXILIARES ====================

function getImagePath(category, keyId, imageType) {
  const ext = imageType === 'aligned' ? 'jpg' : 'png';
  return path.join(TESTS_DIR, category, keyId, `${imageType}-${keyId}.${ext}`);
}

async function extractFeatures(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const processor = new ImageProcessorV3Fixed();
  return await processor.extractFeatures(imageBuffer);
}

async function buildUserInventory() {
  console.log('📦 Construyendo inventario del usuario...\n');
  
  const inventory = [];
  
  for (const item of USER_INVENTORY_KEYS) {
    const imagePath = getImagePath(item.category, item.keyId, item.image);
    
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  Imagen no encontrada: ${imagePath}`);
      continue;
    }
    
    console.log(`   Procesando ${item.keyId}...`);
    const features = await extractFeatures(imagePath);
    
    inventory.push({
      key: {
        id: item.keyId,
        name: `${item.category} ${item.keyId}`,
        type: item.category,
      },
      features: features
    });
  }
  
  console.log(`\n✅ Inventario construido: ${inventory.length} llaves\n`);
  return inventory;
}

async function simulateScan(scanConfig, inventory) {
  const { category, keyId, image, description, expectedResult } = scanConfig;
  
  console.log('─'.repeat(70));
  console.log(description);
  console.log('─'.repeat(70));
  
  // 1. Obtener imagen del escaneo
  const scanImagePath = getImagePath(category, keyId, image);
  
  if (!fs.existsSync(scanImagePath)) {
    console.log(`❌ ERROR: Imagen no encontrada: ${scanImagePath}\n`);
    return { success: false, reason: 'Image not found' };
  }
  
  console.log(`📸 Imagen escaneada: ${path.basename(scanImagePath)}`);
  
  // 2. Extraer features de la imagen escaneada
  console.log('🔬 Extrayendo features de la imagen...');
  const startExtract = Date.now();
  const imageBuffer = fs.readFileSync(scanImagePath);
  const queryFeatures = await extractFeatures(scanImagePath);
  const extractTime = Date.now() - startExtract;
  console.log(`   ⏱️  Tiempo de extracción: ${extractTime}ms`);
  
  // 3. Buscar match en inventario usando V5
  console.log('🔍 Buscando match en inventario...');
  const startMatch = Date.now();
  const keyScan = new ProductionKeyScanV5();
  const matchResult = await keyScan.findMatchInInventory(queryFeatures, inventory);
  const matchTime = Date.now() - startMatch;
  console.log(`   ⏱️  Tiempo de matching: ${matchTime}ms`);
  
  // 4. Determinar resultado
  const totalTime = extractTime + matchTime;
  let actualResult = 'NO_MATCH';
  let matchedKey = null;
  let similarity = 0;
  let confidence = 0;
  
  if (matchResult) {
    actualResult = matchResult.decision || matchResult.matchStatus;
    matchedKey = matchResult.key;
    similarity = matchResult.similarity;
    confidence = matchResult.confidence;
  }
  
  // 5. Mostrar resultados
  console.log('\n📊 RESULTADO:');
  console.log(`   Decisión: ${actualResult}`);
  console.log(`   Esperado: ${expectedResult}`);
  
  if (matchedKey) {
    console.log(`   Match encontrado: ${matchedKey.name}`);
    console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
    console.log(`   Confidence: ${confidence}`);
  }
  
  console.log(`   ⏱️  Tiempo total: ${totalTime}ms (target: <350ms)`);
  
  // 6. Verificar si es correcto
  const isCorrect = (
    (expectedResult === 'MATCH' && (actualResult === 'MATCH' || actualResult === 'POSSIBLE')) ||
    (expectedResult === 'NO_MATCH' && actualResult === 'NO_MATCH')
  );
  
  if (isCorrect) {
    console.log('   ✅ CORRECTO');
  } else {
    console.log('   ❌ INCORRECTO');
  }
  
  // 7. Simular respuesta de usuario (UX flow)
  console.log('\n👤 EXPERIENCIA DE USUARIO:');
  if (actualResult === 'MATCH') {
    console.log('   → Pantalla: "Match Found"');
    console.log(`   → Muestra: ${matchedKey?.name || 'Unknown'}`);
    console.log('   → Opciones: [Open Details] [Scan Another] [Done]');
  } else if (actualResult === 'POSSIBLE') {
    console.log('   → Pantalla: "Possible Match"');
    console.log(`   → Muestra: ${matchedKey?.name || 'Unknown'}`);
    console.log('   → Pregunta: "Is this the key you scanned?"');
    console.log('   → Opciones: [Yes] [No, Save as New] [Try Again]');
  } else {
    console.log('   → Pantalla: "No Match Found"');
    console.log('   → Mensaje: "This key doesn\'t match any in your inventory"');
    console.log('   → Opciones: [Save as New Key] [Scan Another]');
  }
  
  console.log('\n');
  
  return {
    success: true,
    actualResult,
    expectedResult,
    isCorrect,
    totalTime,
    similarity,
    matchedKey,
    performance: {
      extractTime,
      matchTime,
      totalTime,
      withinTarget: totalTime < 350
    }
  };
}

// ==================== EJECUCIÓN PRINCIPAL ====================

async function runSimulation() {
  const results = {
    total: 0,
    correct: 0,
    incorrect: 0,
    tests: []
  };
  
  try {
    // 1. Construir inventario del usuario
    const inventory = await buildUserInventory();
    
    if (inventory.length === 0) {
      console.log('❌ ERROR: No se pudo construir el inventario\n');
      process.exit(1);
    }
    
    // 2. Simular escaneos del usuario
    console.log('🎬 INICIANDO SIMULACIÓN DE ESCANEOS\n');
    
    for (let i = 0; i < USER_SCANS.length; i++) {
      console.log(`\n📍 Test ${i + 1}/${USER_SCANS.length}\n`);
      
      const result = await simulateScan(USER_SCANS[i], inventory);
      
      if (result.success) {
        results.total++;
        if (result.isCorrect) {
          results.correct++;
        } else {
          results.incorrect++;
        }
        results.tests.push(result);
      }
      
      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 3. Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE SIMULACIÓN');
    console.log('='.repeat(70));
    console.log(`\n✅ Tests correctos: ${results.correct}/${results.total}`);
    console.log(`❌ Tests incorrectos: ${results.incorrect}/${results.total}`);
    console.log(`🎯 Accuracy: ${((results.correct / results.total) * 100).toFixed(1)}%`);
    
    // Performance summary
    const avgTime = results.tests.reduce((sum, t) => sum + t.totalTime, 0) / results.tests.length;
    const maxTime = Math.max(...results.tests.map(t => t.totalTime));
    const withinTarget = results.tests.filter(t => t.performance.withinTarget).length;
    
    console.log('\n⏱️  PERFORMANCE:');
    console.log(`   Tiempo promedio: ${avgTime.toFixed(0)}ms`);
    console.log(`   Tiempo máximo: ${maxTime}ms`);
    console.log(`   Dentro de target (<350ms): ${withinTarget}/${results.total}`);
    
    // User Experience summary
    console.log('\n👤 EXPERIENCIA DE USUARIO:');
    const matchCount = results.tests.filter(t => t.actualResult === 'MATCH').length;
    const possibleCount = results.tests.filter(t => t.actualResult === 'POSSIBLE').length;
    const noMatchCount = results.tests.filter(t => t.actualResult === 'NO_MATCH').length;
    
    console.log(`   MATCH: ${matchCount} (${((matchCount/results.total)*100).toFixed(0)}%)`);
    console.log(`   POSSIBLE: ${possibleCount} (${((possibleCount/results.total)*100).toFixed(0)}%)`);
    console.log(`   NO_MATCH: ${noMatchCount} (${((noMatchCount/results.total)*100).toFixed(0)}%)`);
    
    // Conclusión
    console.log('\n' + '='.repeat(70));
    
    if (results.correct === results.total && withinTarget === results.total) {
      console.log('✅ SIMULACIÓN EXITOSA');
      console.log('\n🎉 El sistema está listo para staging!');
      console.log('   - Todos los tests pasaron correctamente');
      console.log('   - Performance dentro del target');
      console.log('   - Experiencia de usuario fluida\n');
      process.exit(0);
    } else if (results.correct >= results.total * 0.9) {
      console.log('⚠️  SIMULACIÓN CON ADVERTENCIAS');
      console.log('\n📋 El sistema funciona pero con algunas observaciones:');
      if (results.incorrect > 0) {
        console.log(`   - ${results.incorrect} test(s) no coincidieron con lo esperado`);
      }
      if (withinTarget < results.total) {
        console.log(`   - ${results.total - withinTarget} test(s) excedieron el target de tiempo`);
      }
      console.log('\n💡 Revisar casos específicos antes de deploy a staging\n');
      process.exit(0);
    } else {
      console.log('❌ SIMULACIÓN FALLIDA');
      console.log('\n⚠️  El sistema necesita ajustes antes de staging:');
      console.log(`   - Solo ${results.correct}/${results.total} tests correctos`);
      console.log('   - Revisar configuración y thresholds\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR EN SIMULACIÓN:');
    console.error(error);
    process.exit(1);
  }
}

// ==================== EJECUTAR ====================

console.log('🚀 Iniciando simulación de staging...\n');
console.log('Este test simula el flujo completo de un usuario:');
console.log('  1. Usuario tiene 3 llaves en su inventario');
console.log('  2. Usuario escanea 4 llaves diferentes');
console.log('  3. Sistema procesa y compara con inventario');
console.log('  4. Sistema muestra resultado apropiado\n');

runSimulation();

