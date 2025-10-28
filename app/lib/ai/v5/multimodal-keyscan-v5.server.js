/**
 * KeyScan V5 - ModelAI System (Reconstructed)
 * Sistema puro ModelAI usando GPT-4o para análisis de llaves
 * Basado en análisis exhaustivo de los 10 tests originales
 */

import { z } from 'zod';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { saveDebugLog, saveComparisonAnalysis } from '../../debug/v5-debugging.server.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// V5 Schema - 9 parámetros exactos de los tests
const V5KeySignatureSchema = z.object({
  peak_count: z.union([z.number().int().min(0), z.null()]).optional(),
  blade_profile: z.union([z.string(), z.null()]).optional(),
  groove_count: z.union([z.number().int().min(0), z.null()]).optional(),
  key_color: z.union([z.string(), z.null()]).optional(),
  bow_shape: z.union([z.string(), z.null()]).optional(),
  bowmark: z.union([z.boolean(), z.null()]).optional(),
  bowcode: z.union([z.boolean(), z.null()]).optional(),
  bow_size: z.union([z.string(), z.null()]).optional(),
  surface_finish: z.union([z.boolean(), z.null()]).optional(),
  confidence_score: z.union([z.number().min(0).max(1), z.string().transform(val => Math.min(Math.max(parseFloat(val) || 0.5, 0), 1))]).optional(),
});

// V5 Prompt - Basado en los tests originales
const V5_PROMPT = `You are an expert key analyst focusing on PRECISE DISCRIMINATION based on real dataset characteristics.

CRITICAL INSTRUCTIONS:
- Be EXTREMELY precise and conservative in your extractions
- ONLY extract what you can see with 100% absolute certainty
- Use null for ANY uncertainty, doubt, or unclear visibility
- NEVER invent, assume, or guess any parameter
- Use EXACT dataset-based categories for maximum discrimination
- When in doubt, use null - better safe than wrong

Return a JSON object with this exact structure:

{
  "peak_count": exact_number_of_visible_peaks_in_teeth_or_null,
  "blade_profile": "single-sided" | "double-sided" | "flat" | "curved" | null,
  "groove_count": exact_groove_count_or_null,
  "key_color": "silver" | "brass" | "gold" | "bronze" | "black" | "other" | null,
  "bow_shape": "rectangle" | "oval" | "circular" | "square" | "triangular" | "irregular" | null,
  "bowmark": true_if_user_mark_tape_marker_false_otherwise_or_null,
  "bowcode": true_if_factory_code_engraved_false_otherwise_or_null,
  "bow_size": "small" | "medium" | "large" | null,
  "surface_finish": true_if_worn_used_false_if_new_or_null,
  "confidence_score": 0.0_to_1.0
}

PARAMETER DEFINITIONS:

1. PEAK COUNT:
   - Count visible peaks in the key teeth/dentition
   - Use null if unclear

2. BLADE PROFILE:
   - "single-sided": Blade has teeth on one side only
   - "double-sided": Blade has teeth on both sides
   - "flat": Blade is completely flat
   - "curved": Blade has curved profile
   - Use null if unclear

3. GROOVE COUNT:
   - Count parallel grooves on the blade
   - Use null if unclear

4. KEY COLOR:
   - "silver": Silver/metallic color
   - "brass": Brass/golden color
   - "gold": Gold color
   - "bronze": Bronze color
   - "black": Black color
   - "other": Other color
   - Use null if unclear

5. BOW SHAPE:
   - "rectangle": Rectangular shape
   - "oval": Oval shape
   - "circular": Circular shape
   - "square": Square shape
   - "triangular": Triangular shape
   - "irregular": Irregular shape
   - Use null if unclear

6. BOWMARK:
   - true: User has marked the key (tape, marker, etc.)
   - false: No user marks visible
   - Use null if unclear

7. BOWCODE:
   - true: Factory code/engraving visible on bow
   - false: No factory code visible
   - Use null if unclear

8. BOW SIZE:
   - "small": Small bow size
   - "medium": Medium bow size
   - "large": Large bow size
   - Use null if unclear

9. SURFACE FINISH:
   - true: Key appears worn/used
   - false: Key appears new
   - Use null if unclear

CRITICAL: Only return valid JSON, no additional text or explanations.`;

/**
 * Analiza imagen de llave con V5 ModelAI con debugging detallado
 */
export async function analyzeKeyWithV5AI(imageBuffer, mimeType = 'image/jpeg') {
  const debugId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const debugLog = {
    id: debugId,
    timestamp: new Date().toISOString(),
    step: 'ai_analysis_start',
    imageSize: imageBuffer.length,
    mimeType: mimeType
  };

  try {
    console.log(`🔬 [${debugId}] V5 AI Analysis: Starting GPT-4o analysis...`);
    console.log(`🔬 [${debugId}] Image size: ${imageBuffer.length} bytes, MIME: ${mimeType}`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: V5_PROMPT
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    debugLog.step = 'ai_response_received';
    debugLog.rawResponse = content;
    debugLog.responseLength = content.length;
    
    console.log(`📝 [${debugId}] V5 Raw AI response (${content.length} chars):`, content);
    
    // Extract JSON from response (handle markdown format)
    let jsonString = content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    } else if (content.trim().startsWith('{')) {
      // Try to find JSON object boundaries
      const startIndex = content.indexOf('{');
      const lastIndex = content.lastIndexOf('}');
      if (startIndex !== -1 && lastIndex !== -1) {
        jsonString = content.substring(startIndex, lastIndex + 1);
      }
    }
    
    debugLog.step = 'json_extraction';
    debugLog.extractedJson = jsonString;
    
    console.log(`🔍 [${debugId}] V5 Extracted JSON:`, jsonString);
    const parsed = JSON.parse(jsonString);
    
    // Validate with schema
    const validated = V5KeySignatureSchema.parse(parsed);
    
    debugLog.step = 'validation_success';
    debugLog.validatedSignature = validated;
    debugLog.success = true;
    
    // Save debug log to file
    await saveDebugLog(debugLog);
    
    console.log(`✅ [${debugId}] V5 Analysis completed successfully`);
    console.log(`📊 [${debugId}] Extracted parameters:`, Object.keys(validated).length);
    
    return {
      success: true,
      signature: validated,
      rawResponse: content,
      debugId: debugId
    };
  } catch (error) {
    debugLog.step = 'error';
    debugLog.error = error.message;
    debugLog.success = false;
    
    // Save debug log even on error
    await saveDebugLog(debugLog);
    
    console.error(`❌ [${debugId}] V5 AI Analysis Error:`, error);
    return {
      success: false,
      error: error.message,
      signature: null,
      debugId: debugId
    };
  }
}

/**
 * Compara parámetros individuales con lógica V5
 */
export function compareV5Parameter(value1, value2, paramName) {
  // Caso 1: Valores null (one_null)
  if (value1 === null || value2 === null) {
    return { match: false, reason: 'one_null', similarity: 0.0 };
  }
  
  // Caso 2: Valores idénticos (exact_match)
  if (value1 === value2) {
    return { match: true, reason: 'exact_match', similarity: 1.0 };
  }
  
  // Caso 3: Tolerancia solo para peak_count (±1)
  if (paramName === 'peak_count' && Math.abs(value1 - value2) === 1) {
    return { match: true, reason: 'close_match', similarity: 0.8 };
  }
  
  // Caso 4: Resto (no_match)
  return { match: false, reason: 'no_match', similarity: 0.0 };
}

/**
 * Compara signatures V5 con pesos confirmados y debugging detallado
 */
export async function compareV5KeySignatures(signature1, signature2, debugId = null) {
  if (!signature1 || !signature2) return { similarity: 0, matchType: 'NO_MATCH', details: {} };

  const comparisonId = debugId || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔍 [${comparisonId}] Starting V5 signature comparison...`);
  console.log(`🔍 [${comparisonId}] Query signature:`, signature1);
  console.log(`🔍 [${comparisonId}] Inventory signature:`, signature2);

  // Pesos confirmados de los tests (6 con peso, 3 sin peso)
  const weights = {
    bowmark: 0.35,        // 35% - Más crítico
    bowcode: 0.30,        // 30% - Muy importante
    surface_finish: 0.20, // 20% - Importante
    key_color: 0.10,      // 10% - Moderado
    bow_shape: 0.03,      // 3% - Bajo
    bow_size: 0.02,       // 2% - Muy bajo
    // Parámetros sin peso (0%):
    peak_count: 0.00,     // Solo tolerancia ±1
    groove_count: 0.00,   // Solo exact match
    blade_profile: 0.00   // Ignorado completamente
  };

  let totalWeight = 0;
  let weightedScore = 0;
  const parameterDetails = {};

  console.log(`📊 [${comparisonId}] Comparing parameters with weights:`, weights);

  // Solo parámetros con peso > 0
  for (const [param, weight] of Object.entries(weights)) {
    if (weight > 0) {
      const comparison = compareV5Parameter(
        signature1[param], 
        signature2[param], 
        param
      );
      
      totalWeight += weight;
      weightedScore += weight * comparison.similarity;
      
      parameterDetails[param] = {
        match: comparison.match,
        reason: comparison.reason,
        similarity: comparison.similarity,
        value1: signature1[param],
        value2: signature2[param],
        weight: weight,
        contribution: weight * comparison.similarity
      };

      console.log(`  📋 [${comparisonId}] ${param}: "${signature1[param]}" vs "${signature2[param]}" → ${comparison.reason} (similarity: ${comparison.similarity}, contribution: ${(weight * comparison.similarity).toFixed(3)})`);
    }
  }

  const similarity = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Lógica de decisión V5: similarity >= 0.95 genera MATCH_FOUND
  let matchType;
  if (similarity >= 0.95) {
    matchType = 'MATCH_FOUND';
  } else {
    matchType = 'NO_MATCH';
  }

  console.log(`🎯 [${comparisonId}] Final result: similarity=${similarity.toFixed(3)}, matchType=${matchType}`);
  console.log(`🎯 [${comparisonId}] Total weight: ${totalWeight}, Weighted score: ${weightedScore.toFixed(3)}`);

  const result = { 
    similarity, 
    matchType, 
    details: { 
      totalWeight, 
      weightedScore, 
      parameterDetails,
      weights 
    } 
  };

  // Save detailed comparison analysis
  const analysis = {
    id: comparisonId,
    timestamp: new Date().toISOString(),
    querySignature: signature1,
    inventorySignature: signature2,
    result: result,
    stepByStep: parameterDetails
  };

  await saveComparisonAnalysis(analysis);

  return result;
}

/**
 * Toma decisión final V5 basada en comparaciones con debugging
 */
export function makeV5Decision(comparisons, debugId = null) {
  const decisionId = debugId || `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🎯 [${decisionId}] Making V5 decision with ${comparisons.length} comparisons...`);
  
  const highMatches = comparisons.filter(c => c.similarity >= 0.95);
  const perfectMatches = comparisons.filter(c => c.similarity === 1.0);
  
  console.log(`🎯 [${decisionId}] High matches (>=0.95): ${highMatches.length}`);
  console.log(`🎯 [${decisionId}] Perfect matches (=1.0): ${perfectMatches.length}`);
  
  if (highMatches.length === 0) {
    console.log(`❌ [${decisionId}] Decision: NO_MATCH - No high similarity matches found`);
    return { 
      type: 'NO_MATCH', 
      message: 'Llave no encontrada en el inventario',
      allResults: comparisons
    };
  }
  
  if (highMatches.length === 1) {
    console.log(`✅ [${decisionId}] Decision: MATCH_FOUND - Single high similarity match`);
    return { 
      type: 'MATCH_FOUND', 
      result: highMatches[0],
      message: 'Llave encontrada con alta precisión',
      allResults: comparisons
    };
  }
  
  if (perfectMatches.length > 1) {
    console.log(`🔍 [${decisionId}] Decision: POSSIBLE_KEYS - Multiple perfect matches`);
    return { 
      type: 'POSSIBLE_KEYS', 
      candidates: perfectMatches,
      message: `Se encontraron ${perfectMatches.length} llaves idénticas. Selecciona la correcta:`,
      allResults: comparisons
    };
  }
  
  if (highMatches.length > 1) {
    console.log(`🔍 [${decisionId}] Decision: POSSIBLE_KEYS - Multiple high similarity matches`);
    return { 
      type: 'POSSIBLE_KEYS', 
      candidates: highMatches,
      message: `Se encontraron ${highMatches.length} llaves similares. Selecciona la correcta:`,
      allResults: comparisons
    };
  }
}
