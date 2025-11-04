/**
 * KeyScan V6 Server-side wrapper
 * Este archivo solo se ejecuta en el servidor (Node.js)
 * Versión 6: Hybrid Balanced AI System (GPT-4o multimodal)
 */

import { dataUrlToBinary } from '../utils/imageConversion.js';
import { analyzeKeyWithHybridBalancedAI, compareHybridBalancedKeySignatures } from './ai/active-logic/multimodal-keyscan.server.js';
import { saveMatchingResult } from './matching.server.js';
import { prisma } from '../utils/db.server.js';

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
      
      // Collect all comparisons for efficient processing
      const allComparisons = [];
      
      // Comparar con cada llave del inventario
      for (const inventoryItem of inventory) {
        if (!inventoryItem.signature) continue;
        
        const comparison = compareHybridBalancedKeySignatures(querySignature, inventoryItem.signature);
        allComparisons.push({
          keyId: inventoryItem.key.id,
          signature: inventoryItem.signature,
          similarity: comparison.similarity,
          matchType: comparison.matchType,
          details: comparison.details
        });
      }
      
      // Sort by similarity descending
      allComparisons.sort((a, b) => b.similarity - a.similarity);
      
      if (allComparisons.length > 0) {
        const bestMatch = allComparisons[0];
        const bestScore = bestMatch.similarity;
        const secondBestScore = allComparisons.length > 1 ? allComparisons[1].similarity : 0;
        const margin = bestScore - secondBestScore;
        
        console.log(`📊 Best match: ${(bestScore * 100).toFixed(1)}% similarity, margin: ${(margin * 100).toFixed(1)}%`);
        
        // V6 Decision Logic: similarity === 1.0 is MATCH_FOUND
        let decision = 'NO_MATCH';
        let matchType = 'NO_MATCH';
        
        if (bestScore === 1.0) {
          // Check how many perfect matches we have
          const perfectMatches = allComparisons.filter(c => c.similarity === 1.0);
          
          if (perfectMatches.length > 1) {
            // Multiple perfect matches → POSSIBLE_KEYS
            decision = 'POSSIBLE';
            matchType = 'POSSIBLE_KEYS';
            bestMatch.candidates = perfectMatches.map(m => ({
              keyId: m.keyId,
              similarity: m.similarity,
              matchType: m.matchType
            }));
          } else if (perfectMatches.length === 1) {
            // Single perfect match → MATCH_FOUND
            decision = 'MATCH';
            matchType = 'MATCH_FOUND';
          }
        } else {
          // Not a perfect match → NO_MATCH
          decision = 'NO_MATCH';
          matchType = 'NO_MATCH';
        }
        
        // Guardar matching result
        if (userId && keyQueryId) {
          try {
            const matchedSignature = bestMatch.signature;
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
        
        // Return result with candidates if POSSIBLE_KEYS
        const resultDetails = {
          keyId: bestMatch.keyId,
          similarity: bestScore,
          margin: margin,
          matchType: bestMatch.matchType,
          details: bestMatch.details
        };
        
        if (bestMatch.candidates) {
          resultDetails.candidates = bestMatch.candidates;
        }
        
        return {
          success: true,
          decision: decision,
          match: decision === 'MATCH',
          confidence: bestScore * 100,
          details: resultDetails,
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
    const result = await analyzeKeyWithHybridBalancedAI(imageBuffer, 'image/jpeg');
    
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

