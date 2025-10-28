/**
 * KeyScan V5 Server-side wrapper
 * Sistema puro ModelAI reconstruido basado en los 10 tests originales
 */

import { dataUrlToBinary } from '../utils/imageConversion.js';
import { analyzeKeyWithV5AI, compareV5KeySignatures, makeV5Decision } from './ai/v5/multimodal-keyscan-v5.server.js';
import { saveMatchingResult } from './matching.server.js';
import { prisma } from '../utils/db.server.js';

/**
 * Procesa una imagen con KeyScan V5 (ModelAI)
 * @param {string} imageDataURL - Data URL de la imagen
 * @param {Array} inventory - Inventario del usuario con signatures
 * @param {string} userId - ID del usuario
 * @param {Object} config - Configuración de KeyScan V5
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function processKeyImageV5(imageDataURL, inventory = [], userId = null, config = {}) {
  try {
    const startTime = Date.now();
    
    // Convertir dataURL a Buffer
    const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
    
    console.log('🔍 KeyScan V5 - Starting AI analysis...');
    
    // Paso 1: Analizar imagen con GPT-4o
    const analysisResult = await analyzeKeyWithV5AI(imageBuffer, 'image/jpeg');
    
    if (!analysisResult.success) {
      return {
        success: false,
        error: analysisResult.error,
        message: analysisResult.error,
        processingTime: Date.now() - startTime
      };
    }
    
    const querySignature = analysisResult.signature;
    console.log('✅ V5 AI signature generated successfully');
    console.log('📊 Query signature:', querySignature);
    
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
      
      const comparisons = [];
      
      // Comparar con cada llave del inventario
      for (let i = 0; i < inventory.length; i++) {
        const inventoryItem = inventory[i];
        if (!inventoryItem.signature) continue;
        
        const comparison = await compareV5KeySignatures(querySignature, inventoryItem.signature, analysisResult.debugId);
        
        comparisons.push({
          inventoryIndex: i,
          keyId: inventoryItem.key.id,
          imageFile: inventoryItem.key.imageFile,
          imagePath: inventoryItem.key.imagePath,
          similarity: comparison.similarity,
          parameterDetails: comparison.details.parameterDetails,
          matchType: comparison.matchType,
          inventorySignature: inventoryItem.signature,
          isCorrect: false // Will be determined later
        });
      }
      
      // Aplicar lógica de decisión V5
      const decision = makeV5Decision(comparisons, analysisResult.debugId);
      
      console.log(`📊 V5 Decision: ${decision.type}`);
      console.log(`📊 Total comparisons: ${comparisons.length}`);
      
      // Guardar matching result
      if (userId && keyQueryId) {
        try {
          const bestMatch = comparisons.find(c => c.similarity === 1.0);
          await saveMatchingResult({
            userId,
            keyQueryId,
            matchedKeyId: bestMatch?.keyId || null,
            matchType: decision.type === 'MATCH_FOUND' ? 'MATCH_FOUND' : 
                      decision.type === 'POSSIBLE_KEYS' ? 'POSSIBLE_KEYS' : 'NO_MATCH',
            similarity: bestMatch?.similarity || 0,
            confidence: bestMatch?.similarity || 0,
            querySignature,
            matchedSignature: bestMatch?.inventorySignature || null,
            comparisonResult: {
              decision: decision,
              comparisons: comparisons,
              totalComparisons: comparisons.length
            }
          });
        } catch (error) {
          console.error('⚠️ Failed to save matching result:', error.message);
        }
      }
      
      // Convertir decisión V5 al formato esperado por la aplicación
      let appDecision = 'NO_MATCH';
      let appMatch = false;
      let appConfidence = 0;
      let appDetails = {};
      
      if (decision.type === 'MATCH_FOUND') {
        appDecision = 'MATCH';
        appMatch = true;
        appConfidence = decision.result.similarity * 100;
        appDetails = {
          keyId: decision.result.keyId,
          similarity: decision.result.similarity,
          matchType: decision.result.matchType,
          details: decision.result.parameterDetails
        };
      } else if (decision.type === 'POSSIBLE_KEYS') {
        appDecision = 'POSSIBLE';
        appMatch = false;
        appConfidence = decision.candidates[0].similarity * 100;
        appDetails = {
          keyId: decision.candidates[0].keyId,
          similarity: decision.candidates[0].similarity,
          matchType: 'POSSIBLE_KEYS',
          candidates: decision.candidates,
          details: decision.candidates[0].parameterDetails
        };
      }
      
      return {
        success: true,
        decision: appDecision,
        match: appMatch,
        confidence: appConfidence,
        details: appDetails,
        processingTime: Date.now() - startTime,
        v5Result: decision // Resultado completo V5 para debugging
      };
    }
    
    // No inventory
    console.log('❌ No inventory available');
    
    // Guardar matching result para no inventory
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
          comparisonResult: { reason: 'no_inventory' }
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
    console.error('Error in processKeyImageV5:', error);
    return {
      success: false,
      error: error.message,
      message: `V5 Processing error: ${error.message}`,
      processingTime: 0
    };
  }
}

/**
 * Extrae signature de una imagen con KeyScan V5
 * @param {string} imageDataURL - Data URL de la imagen
 * @returns {Promise<Object>} Signature extraída
 */
export async function extractSignatureV5(imageDataURL) {
  try {
    // Convertir dataURL a Buffer
    const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
    
    // Analizar con GPT-4o
    const result = await analyzeKeyWithV5AI(imageBuffer, 'image/jpeg');
    
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
    console.error('Error in extractSignatureV5:', error);
    return {
      success: false,
      error: error.message,
      message: `V5 Signature extraction error: ${error.message}`
    };
  }
}
