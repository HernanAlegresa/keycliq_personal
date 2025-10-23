/**
 * KeyScan V5 Server-side wrapper
 * Este archivo solo se ejecuta en el servidor (Node.js)
 * Versión 5: Sistema final optimizado con ≥90% accuracy validado
 */

import { ProductionKeyScanV5 } from './vision/keyscan/v5/ProductionKeyScanV5.js';
import { dataUrlToBinary } from '../utils/imageConversion.js';
import { analyzeKeyWithHybridBalancedAI, compareHybridBalancedKeySignatures } from './ai/multimodal-keyscan.server.js';
import { saveMatchingResult } from './matching.server.js';
import { prisma } from '../utils/db.server.js';

/**
 * Procesa una imagen con KeyScan V5
 * @param {string} imageDataURL - Data URL de la imagen
 * @param {Array} inventory - Inventario del usuario con signatures
 * @param {Object} config - Configuración de KeyScan V5
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function processKeyImageV5(imageDataURL, inventory = [], config = {}) {
  try {
    const startTime = Date.now();
    
    // Convertir dataURL a Buffer
    const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
    
    // Inicializar KeyScan V5 FINAL con configuraci├│n OPTIMIZADA (validada en testing)
    // Usa ImageProcessorV3Fixed + MatchingAlgorithmV5 para ≥90% accuracy
    // Balance perfecto: robustez (same-key-diff-photo) + discriminaci├│n (different-keys)
    const keyScan = new ProductionKeyScanV5({
      matching: {
        thresholds: {
          T_match: parseFloat(process.env.KEYSCAN_THRESHOLD_MATCH || '0.85'),     // MATCH: más conservador para evitar falsos positivos
          T_possible: parseFloat(process.env.KEYSCAN_THRESHOLD_POSSIBLE || '0.75'), // POSSIBLE: threshold más alto
          delta: parseFloat(process.env.KEYSCAN_THRESHOLD_DELTA || '0.10')         // Margen más amplio
        },
        weights: {
          bitting: parseFloat(process.env.KEYSCAN_WEIGHT_BITTING || '0.70'),  // Bitting: optimizado (validado en testing)
          edge: parseFloat(process.env.KEYSCAN_WEIGHT_EDGE || '0.20'),        // Edge: optimizado (validado en testing)
          shape: parseFloat(process.env.KEYSCAN_WEIGHT_SHAPE || '0.10')       // Shape: optimizado (validado en testing)
        },
        shapeVeto: {
          enabled: false,                                                            // NO gate, solo se├▒al
          hausdorff_max: parseFloat(process.env.KEYSCAN_GATE_HAUSDORFF || '150'),   // Permisivo
          hu_similarity_min: parseFloat(process.env.KEYSCAN_GATE_HU || '0.20')      // Permisivo
        }
      },
      ...config
    });
    
    // Paso 1: Extraer features de la imagen escaneada
    const extractResult = await keyScan.processKeyImage(imageBuffer);
    
    if (!extractResult.success) {
      return {
        success: false,
        error: extractResult.error,
        message: extractResult.error,
        processingTime: Date.now() - startTime
      };
    }
    
    const queryFeatures = extractResult.features;
    
    // Paso 2: Si hay inventario, hacer matching
    if (inventory && inventory.length > 0) {
      const matchResult = await keyScan.findMatchInInventory(queryFeatures, inventory);
      
      if (matchResult) {
        // Convertir el resultado del matching al formato esperado
        const decision = matchResult.matchStatus || matchResult.decision || 'NO_MATCH';
        return {
          success: true,
          decision: decision,  // MATCH, POSSIBLE, or NO_MATCH
          match: decision === 'MATCH',
          confidence: matchResult.confidence || (matchResult.similarity * 100),
          details: {
            keyId: matchResult.key.id,
            bittingSimilarity: matchResult.details?.featureSimilarities?.bitting || 0,
            edgeSimilarity: matchResult.details?.featureSimilarities?.edge || 0,
            shapeSimilarity: matchResult.details?.featureSimilarities?.shape || 0,
            margin: matchResult.margin || 0,
            shapeVeto: matchResult.details?.shapeAnalysis
          },
          processingTime: Date.now() - startTime
        };
      }
    }
    
    // No match found or no inventory
    return {
      success: true,
      decision: 'NO_MATCH',
      match: false,
      confidence: 0,
      details: {},
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Error in processKeyImageV5:', error);
    return {
      success: false,
      error: error.message,
      message: `Processing error: ${error.message}`,
      processingTime: 0
    };
  }
}

/**
 * Extrae features de una imagen con KeyScan V5
 * @param {string} imageDataURL - Data URL de la imagen
 * @returns {Promise<Object>} Features extraídas
 */
export async function extractFeaturesV5(imageDataURL) {
  try {
    // Convertir dataURL a Buffer
    const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
    
    // Inicializar KeyScan V5 FINAL
    const keyScan = new ProductionKeyScanV5();
    
    // Extraer features usando el método completo
    const result = await keyScan.processKeyImage(imageBuffer);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        message: result.error
      };
    }
    
    return {
      success: true,
      features: result.features,
      metadata: result.metadata
    };
  } catch (error) {
    console.error('Error in extractFeaturesV5:', error);
    return {
      success: false,
      error: error.message,
      message: `Feature extraction error: ${error.message}`
    };
  }
}

/**
 * Procesa una imagen con KeyScan V6 (Multimodal AI)
 * @param {string} imageDataURL - Data URL de la imagen
 * @param {Array} inventory - Inventario del usuario con signatures
 * @param {Object} config - Configuración de KeyScan V6
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function processKeyImageV6(imageDataURL, inventory = [], userId = null, config = {}) {
  try {
    const startTime = Date.now();
    
    // Convertir dataURL a Buffer
    const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
    
    console.log('🔍 KeyScan V6 - Starting AI analysis...');
    
    // Paso 1: Analizar imagen con GPT-4o
    const analysisResult = await analyzeKeyWithHybridBalancedAI(imageBuffer, 'image/jpeg');
    
    if (!analysisResult.success) {
      return {
        success: false,
        error: analysisResult.error,
        message: analysisResult.error,
        processingTime: Date.now() - startTime
      };
    }
    
    const querySignature = analysisResult.signature;
    console.log('✅ AI signature generated successfully');
    
    // Guardar KeyQuery en la base de datos
    let keyQueryId = null;
    if (userId) {
      try {
        const keyQuery = await prisma.keyQuery.create({
          data: {
            userId,
            queryType: 'scan',
            result: {
              signature: querySignature,
              timestamp: new Date().toISOString()
            },
            status: 'completed'
          }
        });
        keyQueryId = keyQuery.id;
        console.log(`💾 KeyQuery saved with ID: ${keyQueryId}`);
      } catch (error) {
        console.error('⚠️ Failed to save KeyQuery:', error.message);
      }
    }
    
    // Paso 2: Si hay inventario, hacer matching
    if (inventory && inventory.length > 0) {
      console.log(`🔍 Comparing against ${inventory.length} keys in inventory...`);
      
      let bestMatch = null;
      let bestScore = 0;
      let secondBestScore = 0;
      
      // Comparar con cada llave del inventario
      for (const inventoryItem of inventory) {
        if (!inventoryItem.signature) continue;
        
        const comparison = compareHybridBalancedKeySignatures(querySignature, inventoryItem.signature);
        
        if (comparison.similarity > bestScore) {
          secondBestScore = bestScore;
          bestScore = comparison.similarity;
          bestMatch = {
            keyId: inventoryItem.key.id,
            similarity: comparison.similarity,
            matchType: comparison.matchType,
            details: comparison.details
          };
        } else if (comparison.similarity > secondBestScore) {
          secondBestScore = comparison.similarity;
        }
      }
      
      if (bestMatch) {
        const margin = bestScore - secondBestScore;
        const isConfidentMatch = margin >= 0.1; // 10% margin for confidence
        
        console.log(`📊 Best match: ${(bestScore * 100).toFixed(1)}% similarity, margin: ${(margin * 100).toFixed(1)}%`);
        
        // Determinar decisión final con thresholds optimizados para mejor matching
        let decision = 'NO_MATCH';
        let matchType = 'NO_MATCH';
        
        if (bestScore >= 0.55 && isConfidentMatch) {
          decision = 'MATCH';
          matchType = 'MATCH_FOUND';
        } else if (bestScore >= 0.45) {
          decision = 'POSSIBLE';
          matchType = 'POSSIBLE_MATCH';
        } else {
          decision = 'NO_MATCH';
          matchType = 'NO_MATCH';
        }
        
        // Guardar matching result
        if (userId && keyQueryId) {
          try {
            const matchedSignature = inventory.find(item => item.key.id === bestMatch.keyId)?.signature;
            await saveMatchingResult({
              userId,
              keyQueryId,
              matchedKeyId: bestMatch.keyId,
              matchType,
              similarity: bestScore,
              confidence: bestScore,
              querySignature,
              matchedSignature,
              comparisonResult: {
                similarity: bestScore,
                margin,
                matchType: bestMatch.matchType,
                details: bestMatch.details,
                secondBestScore
              }
            });
          } catch (error) {
            console.error('⚠️ Failed to save matching result:', error.message);
          }
        }
        
        return {
          success: true,
          decision: decision,
          match: decision === 'MATCH',
          confidence: bestScore * 100,
          details: {
            keyId: bestMatch.keyId,
            similarity: bestScore,
            margin: margin,
            matchType: bestMatch.matchType,
            details: bestMatch.details
          },
          processingTime: Date.now() - startTime
        };
      }
    }
    
    // No match found or no inventory
    console.log('❌ No match found in inventory');
    
    // Guardar matching result para no match
    if (userId && keyQueryId) {
      try {
        await saveMatchingResult({
          userId,
          keyQueryId,
          matchedKeyId: null,
          matchType: 'NO_MATCH',
          similarity: 0,
          confidence: 0,
          querySignature,
          matchedSignature: null,
          comparisonResult: { reason: 'no_match_found' }
        });
      } catch (error) {
        console.error('⚠️ Failed to save matching result:', error.message);
      }
    }
    
    return {
      success: true,
      decision: 'NO_MATCH',
      match: false,
      confidence: 0,
      details: {},
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Error in processKeyImageV6:', error);
    return {
      success: false,
      error: error.message,
      message: `V6 Processing error: ${error.message}`,
      processingTime: 0
    };
  }
}

/**
 * Extrae signature de una imagen con KeyScan V6
 * @param {string} imageDataURL - Data URL de la imagen
 * @returns {Promise<Object>} Signature extraída
 */
export async function extractSignatureV6(imageDataURL) {
  try {
    // Convertir dataURL a Buffer
    const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
    
    // Analizar con GPT-4o
    const result = await analyzeKeyWithAI(imageBuffer, 'image/jpeg');
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        message: result.error
      };
    }
    
    return {
      success: true,
      signature: result.signature,
      metadata: {
        processingTime: result.processingTime,
        confidence: result.signature.confidence_score
      }
    };
  } catch (error) {
    console.error('Error in extractSignatureV6:', error);
    return {
      success: false,
      error: error.message,
      message: `V6 Signature extraction error: ${error.message}`
    };
  }
}

// Backward compatibility aliases
export const processKeyImageV3 = processKeyImageV5;
export const extractFeaturesV3 = extractFeaturesV5;
