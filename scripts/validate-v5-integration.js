/**
 * Script de Validación End-to-End para KeyScan V5
 * 
 * Este script valida que la integración de V5 esté completa y funcional.
 * 
 * Uso:
 *   node scripts/validate-v5-integration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Iniciando validación de integración KeyScan V5...\n');

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   ${message}`);
    failed++;
    failures.push({ name, message });
  }
}

// ==================== VALIDACIONES DE ARCHIVOS ====================

console.log('📁 Validando archivos clave...\n');

// 1. Verificar que existen los archivos de V5
const v5Files = [
  'app/lib/vision/keyscan/v5/ProductionKeyScanV5.js',
  'app/lib/vision/keyscan/v5/MatchingAlgorithmV5.js',
];

v5Files.forEach(file => {
  const filePath = path.join(projectRoot, file);
  check(
    `Archivo V5: ${file}`,
    fs.existsSync(filePath),
    `Archivo no encontrado: ${filePath}`
  );
});

// 2. Verificar archivo principal keyscan.server.js
const keyscanServerPath = path.join(projectRoot, 'app/lib/keyscan.server.js');
check(
  'Archivo: app/lib/keyscan.server.js',
  fs.existsSync(keyscanServerPath),
  'Archivo principal no encontrado'
);

if (fs.existsSync(keyscanServerPath)) {
  const keyscanContent = fs.readFileSync(keyscanServerPath, 'utf8');
  
  check(
    'Import ProductionKeyScanV5',
    keyscanContent.includes('ProductionKeyScanV5'),
    'No se está importando ProductionKeyScanV5'
  );
  
  check(
    'Uso de ProductionKeyScanV5',
    keyscanContent.includes('new ProductionKeyScanV5'),
    'No se está instanciando ProductionKeyScanV5'
  );
  
  check(
    'Comentarios actualizados a V5',
    keyscanContent.includes('KeyScan V5') && !keyscanContent.includes('KeyScan V3 Server-side'),
    'Comentarios aún mencionan V3'
  );
}

// 3. Verificar rutas de escaneo
const scanRoutes = [
  'app/routes/scan.jsx',
  'app/routes/scan_.review.jsx',
  'app/routes/scan_.check.jsx',
  'app/routes/scan_.match_yes.jsx',
  'app/routes/scan_.possible.jsx',
  'app/routes/scan_.new.jsx',
];

scanRoutes.forEach(route => {
  const routePath = path.join(projectRoot, route);
  check(
    `Ruta: ${route}`,
    fs.existsSync(routePath),
    `Ruta no encontrada: ${routePath}`
  );
});

// 4. Verificar scan_.check.jsx usa comentarios V5
const scanCheckPath = path.join(projectRoot, 'app/routes/scan_.check.jsx');
if (fs.existsSync(scanCheckPath)) {
  const scanCheckContent = fs.readFileSync(scanCheckPath, 'utf8');
  
  check(
    'Comentarios V5 en scan_.check.jsx',
    scanCheckContent.includes('KEYSCAN V5'),
    'scan_.check.jsx aún tiene comentarios de V3'
  );
  
  check(
    'Import correcto en scan_.check.jsx',
    scanCheckContent.includes('processKeyImageV3') || scanCheckContent.includes('keyscan.server'),
    'No está importando la función de procesamiento'
  );
}

// ==================== VALIDACIONES DE CONFIGURACIÓN ====================

console.log('\n⚙️  Validando configuración...\n');

// 5. Verificar MatchingAlgorithmV5
const matchingAlgPath = path.join(projectRoot, 'app/lib/vision/keyscan/v5/MatchingAlgorithmV5.js');
if (fs.existsSync(matchingAlgPath)) {
  const matchingContent = fs.readFileSync(matchingAlgPath, 'utf8');
  
  check(
    'Thresholds definidos',
    matchingContent.includes('T_match') && matchingContent.includes('T_possible'),
    'Thresholds no están definidos correctamente'
  );
  
  check(
    'Weights definidos',
    matchingContent.includes('bitting') && matchingContent.includes('edge') && matchingContent.includes('shape'),
    'Weights no están definidos correctamente'
  );
  
  check(
    'Lógica adaptativa implementada',
    matchingContent.includes('makeDecisionV5') && matchingContent.includes('adjustedThreshold'),
    'Lógica adaptativa no está implementada'
  );
}

// 6. Verificar selector de versión
const indexPath = path.join(projectRoot, 'app/lib/vision/keyscan/index.js');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  check(
    'DEFAULT_VERSION configurado a v5',
    indexContent.includes("DEFAULT_VERSION = 'v5'"),
    'DEFAULT_VERSION debería estar en v5'
  );
  
  check(
    'Selector de versión disponible',
    indexContent.includes('getKeyScan') && indexContent.includes('KEYSCAN_VERSION'),
    'Selector de versión no está correctamente implementado'
  );
}

// ==================== VALIDACIONES DE TESTS ====================

console.log('\n🧪 Validando resultados de tests...\n');

// 7. Verificar que existen resultados de tests V5
const v5TestsPath = path.join(projectRoot, 'tests/results/v5');
check(
  'Directorio de tests V5',
  fs.existsSync(v5TestsPath),
  'Directorio tests/results/v5 no existe'
);

if (fs.existsSync(v5TestsPath)) {
  const testDirs = fs.readdirSync(v5TestsPath).filter(f => 
    fs.statSync(path.join(v5TestsPath, f)).isDirectory()
  );
  
  check(
    'Múltiples tests ejecutados',
    testDirs.length >= 3,
    `Solo se encontraron ${testDirs.length} tests, se esperan al menos 3`
  );
  
  // Verificar test-final
  const testFinalPath = path.join(v5TestsPath, 'test-final');
  if (fs.existsSync(testFinalPath)) {
    const resultsPath = path.join(testFinalPath, 'test-results.json');
    check(
      'Resultados test-final disponibles',
      fs.existsSync(resultsPath),
      'test-results.json no encontrado en test-final'
    );
    
    if (fs.existsSync(resultsPath)) {
      try {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        const globalAccuracy = results.statistics?.global?.accuracy || 0;
        
        check(
          `Accuracy global ≥ 80%`,
          globalAccuracy >= 0.80,
          `Accuracy es ${(globalAccuracy * 100).toFixed(1)}%, se esperaba ≥80%`
        );
      } catch (e) {
        check(
          'Lectura de resultados',
          false,
          `Error leyendo resultados: ${e.message}`
        );
      }
    }
  }
}

// ==================== VALIDACIONES DE DOCUMENTACIÓN ====================

console.log('\n📚 Validando documentación...\n');

// 8. Verificar documentación de deployment
const deployDocPath = path.join(projectRoot, 'KEYSCAN_V5_DEPLOYMENT.md');
check(
  'Documentación de deployment',
  fs.existsSync(deployDocPath),
  'KEYSCAN_V5_DEPLOYMENT.md no encontrado'
);

// 9. Verificar análisis de falsos positivos
const fpAnalysisPath = path.join(projectRoot, 'KEYSCAN_V5_FALSE_POSITIVES_ANALYSIS.md');
check(
  'Análisis de falsos positivos',
  fs.existsSync(fpAnalysisPath),
  'KEYSCAN_V5_FALSE_POSITIVES_ANALYSIS.md no encontrado'
);

// ==================== VALIDACIONES DE DEPENDENCIAS ====================

console.log('\n📦 Validando dependencias...\n');

// 10. Verificar que ImageProcessorV3Fixed existe (usado por V5)
const processorPath = path.join(projectRoot, 'app/lib/vision/keyscan/v3/ImageProcessorV3Fixed.js');
check(
  'ImageProcessorV3Fixed disponible',
  fs.existsSync(processorPath),
  'V5 depende de ImageProcessorV3Fixed que no existe'
);

// ==================== RESUMEN ====================

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VALIDACIÓN');
console.log('='.repeat(60));
console.log(`✅ Checks pasados: ${passed}`);
console.log(`❌ Checks fallidos: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);
console.log(`🎯 Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log('\n❌ VALIDACIÓN FALLIDA\n');
  console.log('Fallos detectados:');
  failures.forEach(({ name, message }, idx) => {
    console.log(`\n${idx + 1}. ${name}`);
    console.log(`   ${message}`);
  });
  console.log('\n⚠️  Por favor corrija estos problemas antes de deploy a staging.\n');
  process.exit(1);
} else {
  console.log('\n✅ VALIDACIÓN EXITOSA');
  console.log('\n🎉 La integración de KeyScan V5 está completa y lista para staging!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Revisar KEYSCAN_V5_DEPLOYMENT.md para instrucciones de deploy');
  console.log('   2. Configurar monitoreo en staging');
  console.log('   3. Ejecutar test end-to-end en staging');
  console.log('   4. Monitorear métricas primeros 7 días');
  console.log('   5. Ajustar thresholds si es necesario basado en datos reales\n');
  process.exit(0);
}

