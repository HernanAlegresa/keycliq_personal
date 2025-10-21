import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProductionKeyScanV3 } from '../../../app/lib/vision/keyscan/v3/ProductionKeyScanV3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class V3FeatureExtractionTest {
  constructor() {
    this.optimizedDatasetPath = path.join(__dirname, '../../../tests/keys-optimized');
    this.keyScan = new ProductionKeyScanV3();
    this.results = [];
  }

  /**
   * Cargar dataset y encontrar llaves que tengan tanto aligned como generated
   */
  async loadKeysWithImages() {
    console.log('🔍 Buscando llaves con imágenes aligned y generated...');
    
    const categories = ['regular', 'lockbox', 'heavy'];
    const keysWithImages = [];

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
        
        // Buscar imagen generada
        const generatedImage = fs.readdirSync(keyPath)
          .find(file => file.startsWith('generated-') && /\.(png|jpg)$/i.test(file));

        // Solo incluir si tiene AMBAS imágenes
        if (alignedImage && generatedImage) {
          const keyData = {
            id: `${category}-${keyFolder}`,
            category,
            folder: keyFolder,
            alignedImage: path.join(keyPath, alignedImage),
            generatedImage: path.join(keyPath, generatedImage)
          };
          
          keysWithImages.push(keyData);
          console.log(`✅ ${keyData.id} - ${alignedImage} + ${generatedImage}`);
        }
      }
    }

    console.log(`📊 Encontradas ${keysWithImages.length} llaves con ambas imágenes`);
    return keysWithImages;
  }

  /**
   * Ejecutar test de extracción de features para una llave específica
   */
  async runFeatureExtractionTest(keyData) {
    console.log(`\n🔬 Analizando ${keyData.id}...`);

    try {
      // Leer imágenes
      const alignedBuffer = fs.readFileSync(keyData.alignedImage);
      const generatedBuffer = fs.readFileSync(keyData.generatedImage);

      // Extraer features de ambas imágenes
      console.log(`  📸 Extrayendo features de imagen aligned...`);
      const alignedFeatures = await this.keyScan.imageProcessor.extractFeatures(alignedBuffer);
      
      console.log(`  📸 Extrayendo features de imagen generated...`);
      const generatedFeatures = await this.keyScan.imageProcessor.extractFeatures(generatedBuffer);

      // Analizar similitudes entre features
      const featureAnalysis = this.analyzeFeatureConsistency(alignedFeatures, generatedFeatures);

      // Comparar usando el matching algorithm (opcional, para ver resultado completo)
      const comparisonResult = this.keyScan.matchingAlgorithm.compareKeys(
        generatedFeatures, 
        alignedFeatures, 
        'sameKey'
      );

      const result = {
        keyId: keyData.id,
        category: keyData.category,
        alignedImagePath: keyData.alignedImage,
        generatedImagePath: keyData.generatedImage,
        features: {
          aligned: this.extractFeatureSummary(alignedFeatures),
          generated: this.extractFeatureSummary(generatedFeatures)
        },
        consistency: featureAnalysis,
        comparison: {
          similarity: comparisonResult.similarity,
          matchStatus: comparisonResult.matchStatus,
          confidence: comparisonResult.confidence,
          bittingSimilarity: comparisonResult.details.bittingSimilarity,
          shapeSimilarity: comparisonResult.details.shapeSimilarity,
          edgeSimilarity: comparisonResult.details.edgeSimilarity
        },
        timestamp: new Date().toISOString()
      };

      console.log(`  ✅ Análisis completado - Similarity: ${(comparisonResult.similarity * 100).toFixed(1)}%`);
      
      return result;

    } catch (error) {
      console.error(`❌ Error analizando ${keyData.id}:`, error.message);
      
      return {
        keyId: keyData.id,
        category: keyData.category,
        alignedImagePath: keyData.alignedImage,
        generatedImagePath: keyData.generatedImage,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analizar consistencia de features entre dos imágenes de la misma llave
   */
  analyzeFeatureConsistency(alignedFeatures, generatedFeatures) {
    const analysis = {};

    // 1. Shape Features (Hu Moments)
    if (alignedFeatures.shape?.huMoments && generatedFeatures.shape?.huMoments) {
      analysis.shape = this.compareHuMoments(
        alignedFeatures.shape.huMoments,
        generatedFeatures.shape.huMoments
      );
    }

    // 2. Bitting Profile
    if (alignedFeatures.bitting?.profile && generatedFeatures.bitting?.profile) {
      analysis.bitting = this.compareBittingProfiles(
        alignedFeatures.bitting.profile,
        generatedFeatures.bitting.profile
      );
    }

    // 3. Edge Features
    if (alignedFeatures.edge && generatedFeatures.edge) {
      analysis.edge = this.compareEdgeFeatures(
        alignedFeatures.edge,
        generatedFeatures.edge
      );
    }

    return analysis;
  }

  /**
   * Comparar Hu Moments (invariantes de forma)
   */
  compareHuMoments(hu1, hu2) {
    if (!hu1 || !hu2 || hu1.length !== hu2.length) {
      return { similarity: 0, error: 'Invalid Hu moments' };
    }

    // Calcular distancia euclidiana normalizada
    let sumSquaredDiff = 0;
    for (let i = 0; i < hu1.length; i++) {
      const diff = hu1[i] - hu2[i];
      sumSquaredDiff += diff * diff;
    }
    
    const euclideanDistance = Math.sqrt(sumSquaredDiff);
    const similarity = 1 / (1 + euclideanDistance); // Convertir distancia a similitud

    return {
      similarity,
      euclideanDistance,
      huMoments1: hu1,
      huMoments2: hu2,
      maxDifference: Math.max(...hu1.map((val, i) => Math.abs(val - hu2[i])))
    };
  }

  /**
   * Comparar perfiles de bitting usando DTW básico
   */
  compareBittingProfiles(profile1, profile2) {
    if (!profile1 || !profile2) {
      return { similarity: 0, error: 'Invalid bitting profiles' };
    }

    // DTW simple para comparar perfiles
    const len1 = profile1.length;
    const len2 = profile2.length;
    
    if (len1 === 0 || len2 === 0) {
      return { similarity: 0, error: 'Empty profiles' };
    }

    // Calcular distancia DTW básica
    let dtwDistance = this.calculateDTWDistance(profile1, profile2);
    const similarity = 1 / (1 + dtwDistance / Math.max(len1, len2));

    return {
      similarity,
      dtwDistance,
      profileLength1: len1,
      profileLength2: len2,
      lengthDifference: Math.abs(len1 - len2)
    };
  }

  /**
   * DTW básico para comparar secuencias
   */
  calculateDTWDistance(seq1, seq2) {
    const len1 = seq1.length;
    const len2 = seq2.length;
    
    // Crear matriz de distancias
    const dtw = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(Infinity));
    dtw[0][0] = 0;

    // Llenar matriz DTW
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = Math.abs(seq1[i - 1] - seq2[j - 1]);
        dtw[i][j] = cost + Math.min(
          dtw[i - 1][j],     // inserción
          dtw[i][j - 1],     // eliminación
          dtw[i - 1][j - 1]  // correspondencia
        );
      }
    }

    return dtw[len1][len2];
  }

  /**
   * Comparar edge features
   */
  compareEdgeFeatures(edge1, edge2) {
    if (!edge1 || !edge2) {
      return { similarity: 0, error: 'Invalid edge features' };
    }

    // Comparar conteos y características básicas
    const count1 = edge1.count || 0;
    const count2 = edge2.count || 0;
    
    // Similitud basada en diferencia de conteos
    const countSimilarity = 1 - Math.abs(count1 - count2) / Math.max(count1, count2, 1);

    return {
      similarity: countSimilarity,
      count1,
      count2,
      countDifference: Math.abs(count1 - count2)
    };
  }

  /**
   * Extraer resumen de features para reporte
   */
  extractFeatureSummary(features) {
    return {
      shape: {
        hasHuMoments: !!features.shape?.huMoments,
        huMomentsCount: features.shape?.huMoments?.length || 0,
        shapeValid: features.quality?.segmentationValid || false
      },
      bitting: {
        hasProfile: !!features.bitting?.profile,
        profileLength: features.bitting?.profile?.length || 0,
        bittingValid: features.quality?.bittingValid || false
      },
      edge: {
        count: features.edge?.count || 0,
        hasFeatures: (features.edge?.count || 0) > 0
      },
      quality: features.quality || {}
    };
  }

  /**
   * Ejecutar test completo para todas las llaves
   */
  async runCompleteTest() {
    console.log('🚀 Iniciando test de extracción de features...');
    
    const keysWithImages = await this.loadKeysWithImages();
    
    if (keysWithImages.length === 0) {
      throw new Error('No se encontraron llaves con ambas imágenes (aligned + generated)');
    }

    console.log(`\n📋 Test plan: Analizar ${keysWithImages.length} llaves`);
    console.log('   - Comparar features entre aligned vs generated');
    console.log('   - Validar consistencia de extracción');
    console.log('   - Identificar posibles problemas de estabilidad');

    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < keysWithImages.length; i++) {
      const keyData = keysWithImages[i];
      console.log(`\n[${i + 1}/${keysWithImages.length}] Procesando ${keyData.id}...`);
      
      const result = await this.runFeatureExtractionTest(keyData);
      results.push(result);
      
      // Pequeña pausa para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const executionTime = Date.now() - startTime;
    
    // Análisis general
    const analysis = this.analyzeOverallResults(results);

    return {
      summary: {
        totalKeys: keysWithImages.length,
        successfulTests: results.filter(r => !r.error).length,
        failedTests: results.filter(r => r.error).length,
        executionTime
      },
      results,
      analysis
    };
  }

  /**
   * Analizar resultados generales
   */
  analyzeOverallResults(results) {
    const successfulResults = results.filter(r => !r.error);
    
    if (successfulResults.length === 0) {
      return { error: 'No successful results to analyze' };
    }

    // Estadísticas de similaridad
    const similarities = successfulResults.map(r => r.comparison?.similarity || 0);
    const bittingSimilarities = successfulResults.map(r => r.comparison?.bittingSimilarity || 0);
    const shapeSimilarities = successfulResults.map(r => r.comparison?.shapeSimilarity || 0);

    return {
      overallSimilarity: {
        mean: similarities.reduce((a, b) => a + b, 0) / similarities.length,
        min: Math.min(...similarities),
        max: Math.max(...similarities),
        median: this.calculateMedian(similarities)
      },
      bittingSimilarity: {
        mean: bittingSimilarities.reduce((a, b) => a + b, 0) / bittingSimilarities.length,
        min: Math.min(...bittingSimilarities),
        max: Math.max(...bittingSimilarities),
        median: this.calculateMedian(bittingSimilarities)
      },
      shapeSimilarity: {
        mean: shapeSimilarities.reduce((a, b) => a + b, 0) / shapeSimilarities.length,
        min: Math.min(...shapeSimilarities),
        max: Math.max(...shapeSimilarities),
        median: this.calculateMedian(shapeSimilarities)
      },
      qualityIssues: results.filter(r => r.error).map(r => ({ keyId: r.keyId, error: r.error }))
    };
  }

  calculateMedian(values) {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
