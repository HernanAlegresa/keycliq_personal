import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProductionKeyScanV3 } from '../../../app/lib/vision/keyscan/v3/ProductionKeyScanV3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class V3TestingSuiteOptimized {
  constructor() {
    this.optimizedDatasetPath = path.join(__dirname, '../../../tests/keys-optimized');
    this.keyScan = new ProductionKeyScanV3();
    
    // Inventario de 24 llaves disponibles
    this.availableKeys = [];
  }

  /**
   * Cargar dataset optimizado y crear inventario
   */
  async loadOptimizedDataset() {
    console.log('📁 Cargando dataset optimizado...');
    
    const categories = ['regular', 'lockbox', 'heavy'];
    const inventory = [];

    for (const category of categories) {
      const categoryPath = path.join(this.optimizedDatasetPath, category);
      
      if (!fs.existsSync(categoryPath)) {
        console.warn(`⚠️ Categoría no encontrada: ${category}`);
        continue;
      }

      const keyFolders = fs.readdirSync(categoryPath)
        .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory())
        .sort();

      for (const keyFolder of keyFolders) {
        const keyPath = path.join(categoryPath, keyFolder);
        
        // Buscar imagen alineada
        const alignedImage = fs.readdirSync(keyPath)
          .find(file => file.startsWith('aligned-') && /\.jpg$/i.test(file));
        
        // Buscar imagen generada (opcional)
        const generatedImage = fs.readdirSync(keyPath)
          .find(file => file.startsWith('generated-') && /\.(png|jpg)$/i.test(file));

        if (alignedImage) {
          const keyData = {
            id: `${category}-${keyFolder}`,
            category,
            folder: keyFolder,
            alignedImage: path.join(keyPath, alignedImage),
            generatedImage: generatedImage ? path.join(keyPath, generatedImage) : null
          };
          
          inventory.push(keyData);
          console.log(`✅ ${keyData.id} - aligned: ${alignedImage}${generatedImage ? `, generated: ${generatedImage}` : ''}`);
        }
      }
    }

    // Seleccionar máximo 24 llaves disponibles
    this.availableKeys = inventory.slice(0, 24);
    console.log(`📊 Inventario creado: ${this.availableKeys.length} llaves`);
    
    return this.availableKeys;
  }

  /**
   * Ejecutar test individual con formato específico
   * @param {number} seed - Semilla para aleatoriedad controlada
   */
  async runOptimizedTest(seed = Date.now()) {
    console.log(`🚀 Iniciando test optimizado (seed: ${seed})`);
    
    // Configurar aleatoriedad
    this.seed = seed;
    this.prng = this.createSeededPRNG(seed);
    
    // Cargar dataset
    await this.loadOptimizedDataset();
    
    if (this.availableKeys.length < 24) {
      throw new Error(`Insuficientes llaves disponibles: ${this.availableKeys.length}/24`);
    }

    console.log('📋 Estructura del test:');
    console.log('   - 12 comparaciones: Same Key - Different Image');
    console.log('   - 12 comparaciones: Different Keys');
    console.log('   - Total: 24 comparaciones');

    const comparisons = [];
    const startTime = Date.now();

    // FASE 1: Same Key - Different Image (12 comparaciones)
    console.log('\n🔍 Fase 1: Same Key - Different Image...');
    const skDiComparisons = await this.generateSKDIComparisons(12);
    comparisons.push(...skDiComparisons);

    // FASE 2: Different Keys (12 comparaciones)
    console.log('\n🔍 Fase 2: Different Keys...');
    const dkComparisons = await this.generateDKComparisons(12);
    comparisons.push(...dkComparisons);

    const executionTime = Date.now() - startTime;

    // Análisis de resultados
    const analysis = this.analyzeResults(comparisons, executionTime);

    return {
      seed: this.seed,
      executionTime,
      analysis,
      comparisons,
      configuration: {
        totalComparisons: 24,
        skDiComparisons: 12,
        dkComparisons: 12,
        availableKeys: this.availableKeys.length
      }
    };
  }

  /**
   * Generar comparaciones Same Key - Different Image
   */
  async generateSKDIComparisons(count) {
    const comparisons = [];
    
    // Obtener llaves que tienen tanto aligned como generated
    const keysWithGenerated = this.availableKeys.filter(key => key.generatedImage);
    
    if (keysWithGenerated.length < count) {
      console.warn(`⚠️ Solo ${keysWithGenerated.length} llaves tienen imagen generada, usando ${keysWithGenerated.length} comparaciones SK-DI`);
      count = keysWithGenerated.length;
    }

    // Seleccionar llaves aleatoriamente
    const selectedKeys = this.shuffleArray([...keysWithGenerated], this.prng).slice(0, count);
    
    for (let i = 0; i < count; i++) {
      const key = selectedKeys[i];
      
      console.log(`  ${i + 1}. ${key.id}: ${path.basename(key.alignedImage)} vs ${path.basename(key.generatedImage)}`);
      
      const comparison = await this.performComparison(
        i + 1,
        'SAME_KEY_DIFFERENT_IMAGE',
        key.alignedImage,
        key.generatedImage,
        key.id,
        key.id
      );
      
      comparisons.push(comparison);
    }
    
    return comparisons;
  }

  /**
   * Generar comparaciones Different Keys
   */
  async generateDKComparisons(count) {
    const comparisons = [];
    
    for (let i = 0; i < count; i++) {
      // Seleccionar dos llaves diferentes aleatoriamente
      const [key1, key2] = this.selectDifferentKeys(this.prng);
      
      // Decidir qué imagen usar para query (generated o optimized aleatoriamente)
      let queryImage;
      if (key2.generatedImage && this.prng() < 0.5) {
        queryImage = key2.generatedImage;
      } else {
        // Si no hay generated o random dice no, usar aligned
        queryImage = key2.alignedImage;
        // Como fallback, buscar optimized si existe
        const optimizedDir = path.dirname(key2.alignedImage);
        const optimizedFiles = fs.readdirSync(optimizedDir)
          .filter(file => file.startsWith('optimized-') && /\.jpg$/i.test(file));
        
        if (optimizedFiles.length > 0) {
          queryImage = path.join(optimizedDir, optimizedFiles[0]);
        }
      }
      
      console.log(`  ${i + 1}. ${key1.id} vs ${key2.id}: ${path.basename(key1.alignedImage)} vs ${path.basename(queryImage)}`);
      
      const comparison = await this.performComparison(
        12 + i + 1, // Continuar numeración desde SK-DI
        'DIFFERENT_KEY',
        key1.alignedImage,
        queryImage,
        key1.id,
        key2.id
      );
      
      comparisons.push(comparison);
    }
    
    return comparisons;
  }

  /**
   * Realizar comparación individual
   */
  async performComparison(comparisonNumber, caseType, inventoryImagePath, queryImagePath, inventoryKeyId, queryKeyId) {
    try {
      // Leer imágenes
      const inventoryBuffer = fs.readFileSync(inventoryImagePath);
      const queryBuffer = fs.readFileSync(queryImagePath);

      // Extraer features de inventario
      const inventoryFeatures = await this.keyScan.imageProcessor.extractFeatures(inventoryBuffer);
      
      // Extraer features de query
      const queryFeatures = await this.keyScan.imageProcessor.extractFeatures(queryBuffer);

      // Simular inventario con estructura correcta esperada por KeyScan V3
      const mockInventory = [{
        key: {
          id: inventoryKeyId,
          type: 'key' // Tipo por defecto
        },
        features: inventoryFeatures,
        imagePath: inventoryImagePath
      }];

      // Usar KeyScan para comparar
      const result = await this.keyScan.findMatchInInventory(queryFeatures, mockInventory);

      // Determinar si es correcto
      const expected = caseType === 'SAME_KEY_DIFFERENT_IMAGE' ? 'MATCH' : 'NO_MATCH';
      const actual = result.decision || 'NO_MATCH';
      const isCorrect = expected === actual;

      return {
        comparison: comparisonNumber,
        caseType,
        expected,
        actual,
        isCorrect,
        similarity: result.details?.similarity || 0,
        confidence: result.confidence || 0,
        margin: result.margin || 0,
        bittingSimilarity: result.bittingSimilarity || 0,
        shapeSimilarity: result.details?.shapeSimilarity || 0,
        edgeSimilarity: result.edgeSimilarity || 0,
        inventoryKeyId,
        queryKeyId,
        inventoryImagePath,
        queryImagePath,
        queryThumbnail: null, // await this.createThumbnail(queryBuffer),
        inventoryThumbnail: null, // await this.createThumbnail(inventoryBuffer),
        processingTime: result.processingTime || 0,
        error: result.details?.error || null
      };

    } catch (error) {
      console.error(`❌ Error en comparación ${comparisonNumber}:`, error.message);
      
      return {
        comparison: comparisonNumber,
        caseType,
        expected: caseType === 'SAME_KEY_DIFFERENT_IMAGE' ? 'MATCH' : 'NO_MATCH',
        actual: 'ERROR',
        isCorrect: false,
        similarity: 0,
        confidence: 0,
        margin: 0,
        bittingSimilarity: 0,
        shapeSimilarity: 0,
        edgeSimilarity: 0,
        inventoryKeyId,
        queryKeyId,
        inventoryImagePath,
        queryImagePath,
        queryThumbnail: null,
        inventoryThumbnail: null,
        processingTime: 0,
        error: error.message
      };
    }
  }

  /**
   * Analizar resultados
   */
  analyzeResults(comparisons, executionTime) {
    const total = comparisons.length;
    const correct = comparisons.filter(c => c.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    // Análisis por tipo de caso
    const byCaseType = {};
    
    ['SAME_KEY_DIFFERENT_IMAGE', 'DIFFERENT_KEY'].forEach(caseType => {
      const caseComparisons = comparisons.filter(c => c.caseType === caseType);
      const caseCorrect = caseComparisons.filter(c => c.isCorrect).length;
      
      byCaseType[caseType] = {
        total: caseComparisons.length,
        correct: caseCorrect,
        accuracy: caseComparisons.length > 0 ? (caseCorrect / caseComparisons.length) * 100 : 0,
        medianSimilarity: this.calculateMedian(caseComparisons.map(c => c.similarity)),
        medianMargin: this.calculateMedian(caseComparisons.map(c => c.margin)),
        medianBittingScore: this.calculateMedian(caseComparisons.map(c => c.bittingSimilarity))
      };
    });

    return {
      global: {
        totalTests: total,
        totalCorrect: correct,
        accuracy
      },
      byCaseType,
      executionTime
    };
  }

  /**
   * Seleccionar dos llaves diferentes
   */
  selectDifferentKeys(prng) {
    const shuffled = this.shuffleArray([...this.availableKeys], prng);
    return [shuffled[0], shuffled[1]];
  }

  /**
   * Crear PRNG con semilla
   */
  createSeededPRNG(seed) {
    let state = seed % 2147483647;
    return () => {
      state = (state * 16807) % 2147483647;
      return state / 2147483647;
    };
  }

  /**
   * Barajar array con PRNG
   */
  shuffleArray(array, prng) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Calcular mediana
   */
  calculateMedian(values) {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Crear thumbnail base64
   */
  async createThumbnail(imageBuffer) {
    try {
      // Crear thumbnail básico en base64 para el reporte
      return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('Error creando thumbnail:', error.message);
      return null;
    }
  }
}
