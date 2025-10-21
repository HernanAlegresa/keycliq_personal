/**
 * ProductionKeyScan V3 FIXED - Sistema completo con correcciones
 * Usa ImageProcessorV3Fixed para extracción mejorada
 */

import { ImageProcessorV3Fixed } from './ImageProcessorV3Fixed.js';
import { MatchingAlgorithmV3Optimized } from './MatchingAlgorithmV3Optimized.js';

export class ProductionKeyScanV3Fixed {
  constructor(config = {}) {
    // Usar el procesador de imágenes corregido
    this.imageProcessor = new ImageProcessorV3Fixed(config.imageProcessor);
    
    // Usar algoritmo de matching optimizado (ya funciona bien)
    this.matchingAlgorithm = new MatchingAlgorithmV3Optimized(config.matching);
    
    this.config = {
      version: '3.1.1-fixed',
      qualityThresholds: {
        minResolution: 50000,
        minAspectRatio: 1.2,
        maxAspectRatio: 4.0
      },
      ...config
    };
    
    console.log('🔧 Initializing KeyScan V3 Fixed - Con correcciones específicas basadas en análisis detallado');
  }

  /**
   * Procesa imagen de llave con extracción mejorada
   */
  async processKeyImage(imageInput, context = {}) {
    try {
      const startTime = Date.now();
      
      // Validar calidad de imagen
      const qualityCheck = await this.validateImageQuality(imageInput);
      if (!qualityCheck.valid) {
        return {
          success: false,
          error: `Calidad de imagen insuficiente: ${qualityCheck.reason}`,
          processingTime: Date.now() - startTime
        };
      }
      
      // Extraer features con el procesador corregido
      const features = await this.imageProcessor.extractFeatures(imageInput);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        features: features,
        metadata: {
          processingTime,
          version: this.config.version,
          qualityCheck
        }
      };
      
    } catch (error) {
      console.error(`Error en processKeyImage fixed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - Date.now()
      };
    }
  }

  /**
   * Encuentra match en inventario usando matching mejorado
   */
  async findMatchInInventory(queryFeatures, inventory, context = {}) {
    try {
      if (!inventory || inventory.length === 0) {
        return null;
      }

      let bestMatch = null;
      let bestSimilarity = -Infinity;
      const comparisons = [];

      // Comparar con cada item del inventario
      for (const item of inventory) {
        if (!item.features) continue;
        
        const comparison = this.matchingAlgorithm.compareKeys(
          queryFeatures,
          item.features,
          context.type || 'inventory'
        );
        
        comparisons.push({
          keyId: item.key.id,
          similarity: comparison.similarity,
          status: comparison.matchStatus,
          confidence: comparison.confidence,
          details: comparison.details,
          processingTime: comparison.processingTime
        });
        
        if (comparison.similarity > bestSimilarity) {
          bestSimilarity = comparison.similarity;
          bestMatch = {
            ...comparison,
            key: item.key,
            decision: comparison.matchStatus,
            margin: 0 // Calculate margin vs second best
          };
        }
      }
      
      // Calcular margin (diferencia con el segundo mejor)
      if (comparisons.length > 1) {
        comparisons.sort((a, b) => b.similarity - a.similarity);
        bestMatch.margin = comparisons[0].similarity - comparisons[1].similarity;
      }
      
      return bestMatch;
      
    } catch (error) {
      console.error(`Error en findMatchInInventory fixed: ${error.message}`);
      return null;
    }
  }

  /**
   * Validación de calidad de imagen
   */
  async validateImageQuality(imageInput) {
    try {
      const sharp = (await import('sharp')).default;
      const metadata = await sharp(imageInput).metadata();
      
      const pixelCount = metadata.width * metadata.height;
      
      if (pixelCount < this.config.qualityThresholds.minResolution) {
        return {
          valid: false,
          reason: `Resolución insuficiente: ${pixelCount} pixels < ${this.config.qualityThresholds.minResolution}`,
          metadata
        };
      }
      
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio < this.config.qualityThresholds.minAspectRatio || 
          aspectRatio > this.config.qualityThresholds.maxAspectRatio) {
        return {
          valid: false,
          reason: `Aspect ratio inválido: ${aspectRatio.toFixed(2)}`,
          metadata
        };
      }
      
      return {
        valid: true,
        metadata
      };
      
    } catch (error) {
      return {
        valid: false,
        reason: `Error validando imagen: ${error.message}`
      };
    }
  }

  /**
   * Obtener información del sistema
   */
  getSystemInfo() {
    return {
      version: this.config.version,
      imageProcessor: 'ImageProcessorV3Fixed',
      matchingAlgorithm: 'MatchingAlgorithmV3Optimized',
      improvements: [
        'Bitting profile normalization and alignment',
        'Robust edge detection',
        'Improved Hu Moments calculation',
        'Fixed feature extraction consistency'
      ]
    };
  }
}
