// Script de validación para los tests V5 ModelAI
import { testData, calculateV5Similarity } from './test-data.js';

console.log('🔑 KeyScan V5 ModelAI - Validación de Tests\n');

// Validar Test 1 (Llave EN inventario)
console.log('📊 TEST 1 - Llave EN Inventario');
console.log('=====================================');

const test1Results = calculateV5Similarity(testData.test1.query, testData.test1.inventory);
const test1PerfectMatches = test1Results.filter(r => r.similarity === 1.0);
const test1MatchFound = test1Results.filter(r => r.matchType === 'MATCH_FOUND');

console.log(`Query: ${JSON.stringify(testData.test1.query, null, 2)}`);
console.log(`\nInventario: ${testData.test1.inventory.length} llaves`);
console.log(`\nResultados:`);
console.log(`- Perfect Matches (1.0): ${test1PerfectMatches.length}`);
console.log(`- MATCH_FOUND: ${test1MatchFound.length}`);
console.log(`- Mejor similitud: ${test1Results[0].similarity.toFixed(3)}`);

if (test1PerfectMatches.length > 0) {
    console.log(`✅ PERFECT: Test 1 pasó - Encontró match exacto`);
    console.log(`   Key ID: ${test1PerfectMatches[0].keyId}`);
    console.log(`   Similitud: ${test1PerfectMatches[0].similarity}`);
} else {
    console.log(`❌ FAILED: Test 1 falló - No encontró match exacto`);
}

console.log('\n' + '='.repeat(50) + '\n');

// Validar Test 2 (Llave NO en inventario)
console.log('📊 TEST 2 - Llave NO en Inventario');
console.log('=====================================');

const test2Results = calculateV5Similarity(testData.test2.query, testData.test2.inventory);
const test2PerfectMatches = test2Results.filter(r => r.similarity === 1.0);
const test2MatchFound = test2Results.filter(r => r.matchType === 'MATCH_FOUND');

console.log(`Query: ${JSON.stringify(testData.test2.query, null, 2)}`);
console.log(`\nInventario: ${testData.test2.inventory.length} llaves`);
console.log(`\nResultados:`);
console.log(`- Perfect Matches (1.0): ${test2PerfectMatches.length}`);
console.log(`- MATCH_FOUND: ${test2MatchFound.length}`);
console.log(`- Mejor similitud: ${test2Results[0].similarity.toFixed(3)}`);

if (test2PerfectMatches.length === 0 && test2MatchFound.length === 0) {
    console.log(`✅ PERFECT: Test 2 pasó - No encontró matches (esperado)`);
    console.log(`   Mejor similitud: ${test2Results[0].similarity.toFixed(3)} (debería ser < 0.95)`);
} else {
    console.log(`❌ FAILED: Test 2 falló - Encontró matches inesperados`);
    console.log(`   Perfect matches: ${test2PerfectMatches.length}`);
    console.log(`   MATCH_FOUND: ${test2MatchFound.length}`);
}

console.log('\n' + '='.repeat(50) + '\n');

// Resumen final
console.log('📈 RESUMEN DE VALIDACIÓN');
console.log('========================');

const test1Passed = test1PerfectMatches.length > 0;
const test2Passed = test2PerfectMatches.length === 0 && test2MatchFound.length === 0;

console.log(`Test 1 (EN inventario): ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Test 2 (NO en inventario): ${test2Passed ? '✅ PASSED' : '❌ FAILED'}`);

if (test1Passed && test2Passed) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('Los datos de prueba están correctos y listos para generar los reportes HTML.');
} else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON');
    console.log('Revisar los datos de prueba antes de continuar.');
}

console.log('\n📁 Archivos generados:');
console.log('- tests/results/v5-optimized/html-reports/test1-report.html');
console.log('- tests/results/v5-optimized/html-reports/test2-report.html');
console.log('- tests/results/v5-optimized/html-reports/index.html');
console.log('- tests/results/v5-optimized/test-data.js');
console.log('- tests/results/v5-optimized/validate-tests.js');
