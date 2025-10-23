/**
 * KeyScan V6 Optimized - Server-side wrapper
 * New approach with essential parameters and direct matching
 */

import { dataUrlToBinary } from '../utils/imageConversion.js';
import { analyzeKeyWithOptimizedAI, compareOptimizedKeySignatures } from './ai/multimodal-keyscan-optimized.server.js';

/**
 * Process a key image with optimized KeyScan V6
 * @param {string} imageDataURL - Data URL of the image
 * @param {Array} inventory - User inventory with signatures
 * @param {Object} config - Configuration for optimized KeyScan V6
 * @returns {Promise<Object>} Processing result
 */
export async function processKeyImageOptimizedV6(imageDataURL, inventory = [], config = {}) {
  try {
    const startTime = Date.now();
    
    // Convert dataURL to Buffer
    const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
    
    console.log('🔍 KeyScan V6 Optimized - Starting AI analysis...');
    
    // Step 1: Analyze image with optimized GPT-4o
    const analysisResult = await analyzeKeyWithOptimizedAI(imageBuffer, 'image/jpeg');
    
    if (!analysisResult.success) {
      return {
        success: false,
        error: analysisResult.error,
        message: analysisResult.error,
        processingTime: Date.now() - startTime
      };
    }
    
    const querySignature = analysisResult.signature;
    console.log('✅ Optimized AI signature generated successfully');
    
    // Step 2: If there's inventory, perform matching
    if (inventory && inventory.length > 0) {
      console.log(`🔍 Comparing against ${inventory.length} keys in inventory...`);
      
      let bestMatch = null;
      let bestScore = 0;
      let secondBestScore = 0;
      
      // Compare with each key in inventory
      for (const inventoryItem of inventory) {
        if (!inventoryItem.signature) continue;
        
        const comparison = compareOptimizedKeySignatures(querySignature, inventoryItem.signature);
        
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
        
        // Determine final decision with optimized thresholds
        let decision = 'NO_MATCH';
        if (bestScore >= 0.7 && isConfidentMatch) {
          decision = 'MATCH';
        } else if (bestScore >= 0.5) {
          decision = 'POSSIBLE';
        } else {
          decision = 'NO_MATCH';
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
    return {
      success: true,
      decision: 'NO_MATCH',
      match: false,
      confidence: 0,
      details: {},
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Error in processKeyImageOptimizedV6:', error);
    return {
      success: false,
      error: error.message,
      message: `Optimized V6 Processing error: ${error.message}`,
      processingTime: 0
    };
  }
}

/**
 * Extract signature from an image with optimized KeyScan V6
 * @param {string} imageDataURL - Data URL of the image
 * @returns {Promise<Object>} Extracted signature
 */
export async function extractSignatureOptimizedV6(imageDataURL) {
  try {
    // Convert dataURL to Buffer
    const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
    
    // Analyze with optimized GPT-4o
    const result = await analyzeKeyWithOptimizedAI(imageBuffer, 'image/jpeg');
    
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
    console.error('Error in extractSignatureOptimizedV6:', error);
    return {
      success: false,
      error: error.message,
      message: `Optimized V6 Signature extraction error: ${error.message}`
    };
  }
}

/**
 * Get essential parameters list for debugging
 * @returns {Array} List of essential parameters
 */
export function getEssentialParameters() {
  return [
    'stamped_code',
    'number_of_cuts', 
    'cut_depths',
    'bow_shape',
    'blade_profile',
    'groove_count',
    'material',
    'unique_mark',
    'cut_depth_precision',
    'blade_profile_detail',
    'shoulder_stop',
    'bow_text'
  ];
}

/**
 * Compare two signatures using optimized logic
 * @param {Object} signature1 - First signature
 * @param {Object} signature2 - Second signature
 * @returns {Object} Comparison result
 */
export function compareSignaturesOptimizedV6(signature1, signature2) {
  return compareOptimizedKeySignatures(signature1, signature2);
}
