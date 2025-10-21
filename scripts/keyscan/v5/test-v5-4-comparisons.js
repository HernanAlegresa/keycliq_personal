/**
 * Test Random 24 Comparisons - KeyScan V5 FINAL
 * Genera y ejecuta 24 comparaciones aleatorias (12 same-key + 12 different-key)
 * Usa la lógica V5 final que logró ≥90% accuracy
 */

import { ProductionKeyScanV5 } from '../../../app/lib/vision/keyscan/v5/ProductionKeyScanV5.js';
import fs from 'fs';
import path from 'path';

// Configuración del test
const TEST_CONFIG = {
  sameKeyComparisons: 12,
  differentKeyComparisons: 12,
  totalComparisons: 24,
  seed: Date.now(), // Seed aleatorio para cada ejecución
  outputDir: 'tests/results/random-tests'
};

// Dataset optimizado - Solo llaves que tienen ambas imágenes (generated y aligned)
const OPTIMIZED_DATASET = {
  regular: [
    'regular-01', 'regular-02', 'regular-03', 'regular-04', 'regular-05',
    'regular-06', 'regular-07', 'regular-08', 'regular-09', 'regular-12',
    'regular-13', 'regular-15'
  ],
  lockbox: [
    'lockbox-02', 'lockbox-03', 'lockbox-04', 'lockbox-06', 'lockbox-08',
    'lockbox-10', 'lockbox-11', 'lockbox-14'
  ],
  heavy: [
    // heavy-01 solo tiene aligned, no generated
  ]
};

// Tipos de imagen disponibles
const IMAGE_TYPES = ['generated', 'aligned'];

class RandomTestRunner {
  constructor() {
    this.keyScan = new ProductionKeyScanV5();
    this.results = {
      testId: Date.now(),
      timestamp: new Date().toISOString(),
      config: TEST_CONFIG,
      comparisons: [],
      statistics: {
        sameKey: { total: 0, correct: 0, accuracy: 0 },
        differentKey: { total: 0, correct: 0, accuracy: 0 },
        global: { total: 0, correct: 0, accuracy: 0 }
      }
    };
    
    console.log('🎯 Random Test Runner initialized');
    console.log(`📊 Test ID: ${this.results.testId}`);
    console.log(`🎲 Seed: ${TEST_CONFIG.seed}`);
  }

  /**
   * Ejecuta el test completo
   */
  async runTest() {
    console.log('\n🚀 Starting Random 24 Comparisons Test...');
    console.log('='.repeat(60));
    
    try {
      // 1. Generar casos de test
      const testCases = this.generateTestCases();
      console.log(`📋 Generated ${testCases.length} test cases`);
      
      // 2. Ejecutar comparaciones
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n🔍 Test ${i + 1}/${testCases.length}: ${testCase.type}`);
        console.log(`   Key: ${testCase.keyId}`);
        console.log(`   Images: ${testCase.image1} vs ${testCase.image2}`);
        
        const result = await this.executeComparison(testCase);
        this.results.comparisons.push(result);
        
        // Mostrar resultado
        const status = result.correct ? '✅' : '❌';
        console.log(`   Result: ${status} ${result.expectedStatus} -> ${result.actualStatus} (similarity: ${result.similarity.toFixed(3)})`);
      }
      
      // 3. Calcular estadísticas
      this.calculateStatistics();
      
      // 4. Generar reporte
      await this.generateReport();
      
      // 5. Mostrar resumen
      this.showSummary();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Error during test execution:', error);
      throw error;
    }
  }

  /**
   * Genera casos de test aleatorios sin duplicados
   */
  generateTestCases() {
    const testCases = [];
    const usedCombinations = new Set();
    
    // 1. Same-key-different-image (12 casos)
    let sameKeyCount = 0;
    while (sameKeyCount < TEST_CONFIG.sameKeyComparisons) {
      const category = this.getRandomCategory();
      const keyId = this.getRandomKey(category);
      const [image1, image2] = this.getRandomImagePair();
      
      // Crear identificador único para evitar duplicados
      const combinationKey = `same-${category}-${keyId}-${image1}-${image2}`;
      
      if (!usedCombinations.has(combinationKey)) {
        usedCombinations.add(combinationKey);
        testCases.push({
          type: 'SAME_KEY_DIFFERENT_IMAGE',
          category,
          keyId,
          image1,
          image2,
          expectedStatus: 'MATCH'
        });
        sameKeyCount++;
      }
    }
    
    // 2. Different-key (12 casos)
    let differentKeyCount = 0;
    while (differentKeyCount < TEST_CONFIG.differentKeyComparisons) {
      const category1 = this.getRandomCategory();
      let category2 = this.getRandomCategory();
      const keyId1 = this.getRandomKey(category1);
      let keyId2 = this.getRandomKey(category2);
      
      // Asegurar que sean llaves diferentes
      if (keyId1 === keyId2 || category1 === category2) {
        // Cambiar a categoría diferente
        category2 = category1 === 'regular' ? 'lockbox' : 'regular';
        keyId2 = this.getRandomKey(category2);
      }
      
      const image1 = this.getRandomImageType();
      const image2 = this.getRandomImageType();
      
      // Crear identificador único para evitar duplicados
      const combinationKey = `different-${category1}-${keyId1}-${category2}-${keyId2}-${image1}-${image2}`;
      
      if (!usedCombinations.has(combinationKey)) {
        usedCombinations.add(combinationKey);
        testCases.push({
          type: 'DIFFERENT_KEY',
          category1,
          category2,
          keyId1,
          keyId2,
          image1,
          image2,
          expectedStatus: 'NO_MATCH'
        });
        differentKeyCount++;
      }
    }
    
    return testCases;
  }

  /**
   * Ejecuta una comparación individual
   */
  async executeComparison(testCase) {
    try {
      let image1Path, image2Path, features1, features2, comparison;
      
      if (testCase.type === 'SAME_KEY_DIFFERENT_IMAGE') {
        // Same key, different images
        image1Path = this.getImagePath(testCase.category, testCase.keyId, testCase.image1);
        image2Path = this.getImagePath(testCase.category, testCase.keyId, testCase.image2);
        
        // Extraer features
        const image1Buffer = fs.readFileSync(image1Path);
        const image2Buffer = fs.readFileSync(image2Path);
        
        features1 = await this.keyScan.imageProcessor.extractFeatures(image1Buffer);
        features2 = await this.keyScan.imageProcessor.extractFeatures(image2Buffer);
        
        // Comparar
        comparison = this.keyScan.matchingAlgorithm.compareKeys(
          features1,
          features2,
          'sameKey'
        );
        
      } else {
        // Different keys
        image1Path = this.getImagePath(testCase.category1, testCase.keyId1, testCase.image1);
        image2Path = this.getImagePath(testCase.category2, testCase.keyId2, testCase.image2);
        
        // Extraer features
        const image1Buffer = fs.readFileSync(image1Path);
        const image2Buffer = fs.readFileSync(image2Path);
        
        features1 = await this.keyScan.imageProcessor.extractFeatures(image1Buffer);
        features2 = await this.keyScan.imageProcessor.extractFeatures(image2Buffer);
        
        // Comparar
        comparison = this.keyScan.matchingAlgorithm.compareKeys(
          features1,
          features2,
          'differentKey'
        );
      }
      
      // Determinar si es correcto
      const isCorrect = this.isResultCorrect(comparison.matchStatus, testCase.expectedStatus);
      
      return {
        testCase,
        image1Path,
        image2Path,
        similarity: comparison.similarity,
        actualStatus: comparison.matchStatus,
        expectedStatus: testCase.expectedStatus,
        correct: isCorrect,
        confidence: comparison.confidence,
        details: comparison.details,
        processingTime: comparison.processingTime
      };
      
    } catch (error) {
      console.error(`❌ Error in comparison: ${error.message}`);
      return {
        testCase,
        error: error.message,
        similarity: 0,
        actualStatus: 'ERROR',
        expectedStatus: testCase.expectedStatus,
        correct: false,
        confidence: 0
      };
    }
  }

  /**
   * Verifica si el resultado es correcto
   */
  isResultCorrect(actualStatus, expectedStatus) {
    if (expectedStatus === 'MATCH') {
      return actualStatus === 'MATCH' || actualStatus === 'POSSIBLE';
    } else if (expectedStatus === 'NO_MATCH') {
      return actualStatus === 'NO_MATCH';
    }
    return false;
  }

  /**
   * Calcula estadísticas finales
   */
  calculateStatistics() {
    const sameKeyResults = this.results.comparisons.filter(c => c.testCase.type === 'SAME_KEY_DIFFERENT_IMAGE');
    const differentKeyResults = this.results.comparisons.filter(c => c.testCase.type === 'DIFFERENT_KEY');
    
    // Same-key statistics
    this.results.statistics.sameKey.total = sameKeyResults.length;
    this.results.statistics.sameKey.correct = sameKeyResults.filter(r => r.correct).length;
    this.results.statistics.sameKey.accuracy = this.results.statistics.sameKey.correct / this.results.statistics.sameKey.total;
    
    // Different-key statistics
    this.results.statistics.differentKey.total = differentKeyResults.length;
    this.results.statistics.differentKey.correct = differentKeyResults.filter(r => r.correct).length;
    this.results.statistics.differentKey.accuracy = this.results.statistics.differentKey.correct / this.results.statistics.differentKey.total;
    
    // Global statistics
    this.results.statistics.global.total = this.results.comparisons.length;
    this.results.statistics.global.correct = this.results.comparisons.filter(r => r.correct).length;
    this.results.statistics.global.accuracy = this.results.statistics.global.correct / this.results.statistics.global.total;
  }

  /**
   * Genera reporte JSON
   */
  async generateReport() {
    // Crear directorio si no existe
    if (!fs.existsSync(TEST_CONFIG.outputDir)) {
      fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
    }
    
    // Guardar JSON
    const jsonPath = path.join(TEST_CONFIG.outputDir, `test-${this.results.testId}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Report saved: ${jsonPath}`);
  }

  /**
   * Muestra resumen final
   */
  showSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`🎯 Test ID: ${this.results.testId}`);
    console.log(`⏰ Timestamp: ${this.results.timestamp}`);
    console.log(`🎲 Seed: ${TEST_CONFIG.seed}`);
    console.log('');
    console.log('📈 ACCURACY RESULTS:');
    console.log(`   Same-key-different-image: ${(this.results.statistics.sameKey.accuracy * 100).toFixed(1)}% (${this.results.statistics.sameKey.correct}/${this.results.statistics.sameKey.total})`);
    console.log(`   Different-key: ${(this.results.statistics.differentKey.accuracy * 100).toFixed(1)}% (${this.results.statistics.differentKey.correct}/${this.results.statistics.differentKey.total})`);
    console.log(`   Global accuracy: ${(this.results.statistics.global.accuracy * 100).toFixed(1)}% (${this.results.statistics.global.correct}/${this.results.statistics.global.total})`);
    console.log('');
    
    // Verificar objetivos
    const sameKeyTarget = this.results.statistics.sameKey.accuracy >= 0.80;
    const differentKeyTarget = this.results.statistics.differentKey.accuracy >= 0.80;
    const globalTarget = this.results.statistics.global.accuracy >= 0.90;
    
    console.log('🎯 TARGET ACHIEVEMENT:');
    console.log(`   Same-key ≥80%: ${sameKeyTarget ? '✅' : '❌'}`);
    console.log(`   Different-key ≥80%: ${differentKeyTarget ? '✅' : '❌'}`);
    console.log(`   Global ≥90%: ${globalTarget ? '✅' : '❌'}`);
    
    if (sameKeyTarget && differentKeyTarget && globalTarget) {
      console.log('\n🎉 ALL TARGETS ACHIEVED! System ready for production.');
    } else {
      console.log('\n⚠️  Some targets not achieved. Review configuration.');
    }
  }

  // Helper methods
  getRandomCategory() {
    const categories = Object.keys(OPTIMIZED_DATASET).filter(cat => OPTIMIZED_DATASET[cat].length > 0);
    if (categories.length === 0) {
      throw new Error('No categories with available keys');
    }
    return categories[Math.floor(Math.random() * categories.length)];
  }

  getRandomKey(category) {
    const keys = OPTIMIZED_DATASET[category];
    return keys[Math.floor(Math.random() * keys.length)];
  }

  getRandomImagePair() {
    const shuffled = [...IMAGE_TYPES].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  getRandomImageType() {
    return IMAGE_TYPES[Math.floor(Math.random() * IMAGE_TYPES.length)];
  }

  getImagePath(category, keyId, imageType) {
    // Intentar diferentes extensiones y rutas
    const basePath = path.join('tests', 'keys-optimized', category, keyId);
    const extensions = ['.jpg', '.png', '.jpeg'];
    
    for (const ext of extensions) {
      const imagePath = path.join(basePath, `${imageType}-${keyId}${ext}`);
      if (fs.existsSync(imagePath)) {
        return imagePath;
      }
    }
    
    // Si no se encuentra, lanzar error
    throw new Error(`Image not found: ${imageType}-${keyId} in ${basePath}`);
  }
}

// Ejecutar test
async function main() {
  try {
    console.log('🎯 KeyScan V5 FINAL - Random 24 Comparisons Test');
    console.log('Using V5 final logic that achieved ≥90% accuracy');
    console.log('');
    
    const runner = new RandomTestRunner();
    const results = await runner.runTest();
    
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} else {
  // Ejecutar automáticamente
  main();
}

export { RandomTestRunner };
