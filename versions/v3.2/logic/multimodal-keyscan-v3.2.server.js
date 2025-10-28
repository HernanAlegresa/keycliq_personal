/**
 * Hybrid Balanced KeyScan System V3.2 - Contextual Discrimination
 * Implements mandatory contextual discrimination to eliminate false positives
 */

import OpenAI from 'openai';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// V3.2 Contextual schema
const V32ContextualKeySignatureSchema = z.object({
  // Core structural parameters
  number_of_cuts: z.union([z.number().int().min(0), z.null()]).optional(),
  blade_profile: z.union([z.string(), z.null()]).optional(),
  groove_count: z.union([z.number().int().min(0), z.null()]).optional(),
  
  // Visual parameters with contextual specificity
  key_color: z.union([z.string(), z.null()]).optional(),
  bow_shape: z.union([z.string(), z.null()]).optional(),
  has_bow_text: z.union([z.boolean(), z.null()]).optional(),
  unique_mark: z.union([z.boolean(), z.null()]).optional(),
  
  // METADATA
  confidence_score: z.union([z.number().min(0).max(1), z.string().transform(val => Math.min(Math.max(parseFloat(val) || 0.5, 0), 1))]).optional(),
});

// V3.2 Contextual prompt with maximum discrimination
const V32_CONTEXTUAL_PROMPT = `You are an expert key analyst focusing on MAXIMUM DISCRIMINATION.

CRITICAL INSTRUCTIONS:
- Be EXTREMELY precise and conservative in your extractions
- ONLY extract what you can see with 100% absolute certainty
- Use null for ANY uncertainty, doubt, or unclear visibility
- NEVER invent, assume, or guess any parameter
- Use EXACT categories for maximum discrimination
- When in doubt, use null - better safe than wrong

Return a JSON object with this exact structure:

{
  "number_of_cuts": exact_number_of_cuts_or_null,
  "blade_profile": "single-sided OR double-sided OR flat OR curved OR null",
  "groove_count": exact_groove_count_or_null,
  "key_color": "silver OR brass OR null",
  "bow_shape": "rectangular OR circular OR triangular OR hexagonal OR null",
  "has_bow_text": true_if_any_text_visible_on_bow_false_otherwise_or_null,
  "unique_mark": true_if_engraved_code_OR_tape_OR_marker_mark_false_otherwise_or_null,
  "confidence_score": 0.95
}

MAXIMUM DISCRIMINATION GUIDELINES:
- number_of_cuts: Count each individual cut with ABSOLUTE precision (MOST IMPORTANT)
- blade_profile: Use EXACT categories (single-sided, double-sided, flat, curved)
- groove_count: Count parallel grooves on the blade with ABSOLUTE precision
- key_color: Use EXACT categories (silver, brass) - be ULTRA-precise with metal colors
- bow_shape: Use EXACT shapes (rectangular, circular, triangular, hexagonal)
- has_bow_text: TRUE if any text/code is clearly visible on bow, FALSE if none, null if unclear
- unique_mark: TRUE if engraved code OR tape OR marker mark is clearly visible, FALSE if none, null if unclear

ULTRA-CONSERVATIVE REQUIREMENTS:
- If you cannot see a parameter with ABSOLUTE clarity, use null
- If you are not 100% certain, use null
- If the image quality is poor, use null
- If the parameter is partially obscured, use null
- If there is ANY doubt, use null
- NEVER guess or assume any parameter value
- Better to have null than wrong information

MAXIMUM DISCRIMINATION FOCUS:
- Be extremely specific to distinguish different keys
- Be ultra-consistent for the same key across different images
- Focus on the most reliable visual characteristics
- Use exact categories to avoid ANY ambiguity`;

/**
 * Analyze key with AI using V3.2 contextual parameters
 */
export async function analyzeKeyWithV32ContextualAI(imageBuffer, mimeType = 'image/jpeg') {
  try {
    console.log('🤖 Starting V3.2 Contextual AI analysis...');
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
        
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: V32_CONTEXTUAL_PROMPT
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.01  // Ultra-low temperature for maximum consistency
    });
    
    const rawResponse = response.choices[0].message.content;
    console.log('📝 Raw AI response:', rawResponse);

    // Extract JSON from response
    const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const jsonString = jsonMatch[1];
    console.log('🔍 Extracted JSON:', jsonString);

    const parsedData = JSON.parse(jsonString);
    console.log('📊 Raw signature:', parsedData);

    // Validate with schema
    const validatedSignature = V32ContextualKeySignatureSchema.parse(parsedData);
    console.log('✅ Validated signature:', validatedSignature);
    
    return {
      success: true,
      signature: validatedSignature,
      rawResponse: rawResponse
    };
    
  } catch (error) {
    console.error('❌ V3.2 Contextual AI analysis failed:', error.message);
    return {
      success: false,
      error: error.message,
      signature: null
    };
  }
}

/**
 * Compare V3.2 contextual key signatures with mandatory contextual discrimination
 */
export function compareV32ContextualKeySignatures(signature1, signature2, allSignatures = []) {
  console.log('🔍 Comparing V3.2 Contextual signatures...');
  console.log('Signature 1:', signature1);
  console.log('Signature 2:', signature2);

  // V3.2 Contextual parameter weights for maximum discrimination
  const parameterWeights = {
    unique_mark: 0.50,         // 50% - Highest weight (most distinctive)
    key_color: 0.30,           // 30% - Very high weight (very distinctive)
    bow_shape: 0.15,          // 15% - High weight (structural distinction)
    number_of_cuts: 0.03,      // 3% - Lower weight (with tolerance)
    has_bow_text: 0.01,        // 1% - Lower weight (can vary)
    blade_profile: 0.01,       // 1% - Lower weight (common)
    groove_count: 0.00          // 0% - No weight (less distinctive)
  };

  let totalWeight = 0;
  let weightedMatches = 0;

  // Compare each parameter with contextual discrimination
  Object.entries(parameterWeights).forEach(([param, weight]) => {
    const val1 = signature1[param];
    const val2 = signature2[param];
    
    console.log(`Comparing ${param}: "${val1}" vs "${val2}"`);
    
    // Handle null values - ultra-strict
    if (val1 === null && val2 === null) {
      console.log(`✅ Both null - MATCH for ${param}`);
      totalWeight += weight;
      weightedMatches += weight;
      return;
    }
    
    if (val1 === null || val2 === null) {
      console.log(`❌ One null - NO MATCH for ${param}`);
      totalWeight += weight;
      return;
    }
    
    // Both have values - compare with contextual discrimination
    if (param === 'number_of_cuts') {
      // Ultra-strict tolerance for number_of_cuts (exact match only)
      const diff = Math.abs(parseInt(val1) - parseInt(val2));
      if (diff === 0) {
        console.log(`✅ Exact match for ${param}`);
        totalWeight += weight;
        weightedMatches += weight;
      } else {
        console.log(`❌ No match for ${param} (diff: ${diff})`);
        totalWeight += weight;
      }
    } else if (param === 'bow_shape') {
      // Ultra-strict for bow_shape (exact match only)
      const shape1 = val1.toLowerCase();
      const shape2 = val2.toLowerCase();
      
      if (shape1 === shape2) {
        console.log(`✅ Exact match for ${param}`);
        totalWeight += weight;
        weightedMatches += weight;
      } else {
        console.log(`❌ No match for ${param}`);
        totalWeight += weight;
      }
    } else {
      // Exact match for other parameters
      if (val1 === val2) {
        console.log(`✅ Exact match for ${param}`);
        totalWeight += weight;
        weightedMatches += weight;
      } else {
        console.log(`❌ No match for ${param}`);
        totalWeight += weight;
      }
    }
  });
  
  const baseSimilarity = totalWeight > 0 ? weightedMatches / totalWeight : 0;
  console.log(`📊 Base similarity: ${(baseSimilarity * 100).toFixed(1)}%`);

  // V3.2 Contextual discrimination - check against all other signatures
  let contextualPenalty = 0;
  if (allSignatures.length > 0) {
    console.log('🔍 Applying contextual discrimination...');
    
    // Check if this signature is too similar to other keys in inventory
    const otherSignatures = allSignatures.filter(sig => sig !== signature2);
    let similarCount = 0;
    
    otherSignatures.forEach(otherSig => {
      const otherSimilarity = calculateBasicSimilarity(signature2, otherSig);
      if (otherSimilarity > 0.8) {
        similarCount++;
        console.log(`⚠️ Similar to other key: ${(otherSimilarity * 100).toFixed(1)}%`);
      }
    });
    
    // Apply contextual penalty for high similarity with other keys
    if (similarCount > 0) {
      contextualPenalty = similarCount * 0.2; // 20% penalty per similar key
      console.log(`🚫 Contextual penalty: ${(contextualPenalty * 100).toFixed(1)}%`);
    }
  }
  
  const finalSimilarity = Math.max(0, baseSimilarity - contextualPenalty);
  console.log(`📊 Final similarity: ${(finalSimilarity * 100).toFixed(1)}%`);

  // V3.2 Ultra-strict thresholds with contextual discrimination
  let matchType;
  if (finalSimilarity >= 0.99) {
      matchType = 'MATCH_FOUND';
  } else {
    matchType = 'NO_MATCH';
    }
    
  console.log(`🎯 Match type: ${matchType}`);
    
  return {
    similarity: finalSimilarity,
    matchType,
    details: {
      totalWeight,
      weightedMatches,
      parameterWeights,
      contextualPenalty
    }
  };
}

/**
 * Calculate basic similarity between two signatures
 */
function calculateBasicSimilarity(sig1, sig2) {
  const weights = {
    unique_mark: 0.50,
    key_color: 0.30,
    bow_shape: 0.15,
    number_of_cuts: 0.03,
    has_bow_text: 0.01,
    blade_profile: 0.01,
    groove_count: 0.00
  };

  let totalWeight = 0;
  let weightedMatches = 0;

  Object.entries(weights).forEach(([param, weight]) => {
    const val1 = sig1[param];
    const val2 = sig2[param];
    
    if (val1 === null && val2 === null) {
      totalWeight += weight;
      weightedMatches += weight;
    } else if (val1 === null || val2 === null) {
      totalWeight += weight;
    } else if (val1 === val2) {
      totalWeight += weight;
      weightedMatches += weight;
    } else {
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? weightedMatches / totalWeight : 0;
}
