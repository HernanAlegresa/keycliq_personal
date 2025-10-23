/**
 * KeyScan V3 Final - Hybrid Balanced System
 * Optimized for maximum discrimination and consistency
 */

import dotenv from 'dotenv';
import OpenAI from 'openai';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hybrid balanced schema for V3 final system
const KeySignatureSchema = z.object({
  // Core structural parameters
  number_of_cuts: z.union([z.number().int().min(0), z.null()]).optional(),
  blade_profile: z.union([z.string(), z.null()]).optional(),
  groove_count: z.union([z.number().int().min(0), z.null()]).optional(),
  
  // Visual parameters with balanced specificity
  key_color: z.union([z.string(), z.null()]).optional(),
  bow_shape: z.union([z.string(), z.null()]).optional(),
  has_bow_text: z.union([z.boolean(), z.null()]).optional(),
  unique_mark: z.union([z.boolean(), z.null()]).optional(),
  
  // METADATA
  confidence_score: z.union([z.number().min(0).max(1), z.string().transform(val => Math.min(Math.max(parseFloat(val) || 0.5, 0), 1))]).optional(),
});

// Hybrid balanced prompt for V3 final system
const HYBRID_BALANCED_PROMPT = `You are an expert key analyst focusing on BALANCED discrimination and consistency.

CRITICAL INSTRUCTIONS:
- Focus on parameters that distinguish keys while being consistent for the same key
- Be specific but not overly detailed to avoid inconsistencies
- ONLY extract what you can see with 100% certainty
- Use null for ANY uncertainty or doubt
- NEVER invent, assume, or guess any parameter
- Use general but distinctive categories for consistency

Return a JSON object with this exact structure:

{
  "number_of_cuts": exact_number_of_cuts_or_null,
  "blade_profile": "general blade profile or null",
  "groove_count": exact_groove_count_or_null,
  "key_color": "general color category or null",
  "bow_shape": "general bow shape or null",
  "has_bow_text": true_if_any_text_visible_on_bow_false_otherwise_or_null,
  "unique_mark": true_if_any_distinctive_mark_tape_stain_paint_false_otherwise_or_null,
  "confidence_score": 0.95
}

EXTRACTION GUIDELINES:
- number_of_cuts: Count each individual cut precisely (MOST IMPORTANT)
- blade_profile: Use general categories (single-sided, double-sided, flat, curved)
- groove_count: Count parallel grooves on the blade precisely
- key_color: Use general color categories (silver, brass, gold, bronze, copper)
- bow_shape: Use general shapes (round, square, rectangular, oval, hexagonal)
- has_bow_text: TRUE if any text/code is visible on bow, FALSE if none, null if unclear
- unique_mark: TRUE if any distinctive mark/tape/stain/paint, FALSE if none, null if unclear

PRECISION REQUIREMENTS:
- If you cannot see a parameter clearly, use null
- If you are not 100% certain, use null
- If the image quality is poor, use null
- If the parameter is partially obscured, use null
- NEVER guess or assume any parameter value
- Better to have null than wrong information

BALANCE FOCUS:
- Be specific enough to distinguish different keys
- Be general enough to be consistent for the same key
- Focus on reliable visual characteristics
- Avoid overly specific descriptions that vary between images`;

/**
 * Analyze key with AI using hybrid balanced parameters
 */
export async function analyzeKeyWithAI(imageBuffer, mimeType = 'image/jpeg') {
  try {
    console.log('🤖 Starting Hybrid Balanced AI analysis...');
    
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
              text: HYBRID_BALANCED_PROMPT
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
      temperature: 0.1
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
    const validatedSignature = KeySignatureSchema.parse(parsedData);
    console.log('✅ Validated signature:', validatedSignature);

    return {
      success: true,
      signature: validatedSignature,
      rawResponse: rawResponse
    };

  } catch (error) {
    console.error('❌ Hybrid Balanced AI analysis failed:', error.message);
    return {
      success: false,
      error: error.message,
      signature: null
    };
  }
}

/**
 * Compare hybrid balanced key signatures with tolerance
 */
export function compareKeySignatures(signature1, signature2) {
  console.log('🔍 Comparing Hybrid Balanced signatures...');
  console.log('Signature 1:', signature1);
  console.log('Signature 2:', signature2);

  // Balanced parameter weights for V3 final system
  const parameterWeights = {
    unique_mark: 0.30,         // 30% - Highest weight (most distinctive)
    key_color: 0.25,           // 25% - High weight (very distinctive)
    bow_shape: 0.20,           // 20% - High weight (structural distinction)
    number_of_cuts: 0.15,      // 15% - Important but with tolerance
    has_bow_text: 0.05,        // 5% - Lower weight (can vary)
    blade_profile: 0.03,       // 3% - Lower weight (common)
    groove_count: 0.02         // 2% - Lower weight (less distinctive)
  };

  let totalWeight = 0;
  let weightedMatches = 0;

  // Compare each parameter with tolerance
  Object.entries(parameterWeights).forEach(([param, weight]) => {
    const val1 = signature1[param];
    const val2 = signature2[param];
    
    console.log(`Comparing ${param}: "${val1}" vs "${val2}"`);
    
    // Handle null values
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
    
    // Both have values - compare with tolerance for specific parameters
    if (param === 'number_of_cuts') {
      // Tolerance for number_of_cuts (±1 difference)
      const diff = Math.abs(parseInt(val1) - parseInt(val2));
      if (diff === 0) {
        console.log(`✅ Exact match for ${param}`);
        totalWeight += weight;
        weightedMatches += weight;
      } else if (diff === 1) {
        console.log(`⚠️ Close match for ${param} (tolerance: ±1)`);
        totalWeight += weight;
        weightedMatches += weight * 0.8; // 80% similarity for close match
      } else {
        console.log(`❌ No match for ${param} (diff: ${diff})`);
        totalWeight += weight;
      }
    } else if (param === 'bow_shape') {
      // Tolerance for bow_shape (similar shapes)
      const shape1 = val1.toLowerCase();
      const shape2 = val2.toLowerCase();
      
      if (shape1 === shape2) {
        console.log(`✅ Exact match for ${param}`);
        totalWeight += weight;
        weightedMatches += weight;
      } else if (areSimilarShapes(shape1, shape2)) {
        console.log(`⚠️ Similar shapes for ${param}`);
        totalWeight += weight;
        weightedMatches += weight * 0.7; // 70% similarity for similar shapes
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

  const similarity = totalWeight > 0 ? weightedMatches / totalWeight : 0;
  console.log(`📊 Final similarity: ${(similarity * 100).toFixed(1)}%`);

  // Balanced thresholds for V3 final system
  let matchType;
  if (similarity >= 0.92) {
    matchType = 'MATCH_FOUND';
  } else if (similarity >= 0.80) {
    matchType = 'POSSIBLE_MATCH';
  } else {
    matchType = 'NO_MATCH';
  }

  console.log(`🎯 Match type: ${matchType}`);

  return {
    similarity,
    matchType,
    details: {
      totalWeight,
      weightedMatches,
      parameterWeights
    }
  };
}

/**
 * Helper function to determine if shapes are similar
 */
function areSimilarShapes(shape1, shape2) {
  const similarShapes = [
    ['rectangular', 'rectangular-wide', 'rectangular-narrow'],
    ['round', 'round-small', 'round-large'],
    ['square', 'square-small', 'square-large']
  ];
  
  for (const group of similarShapes) {
    if (group.includes(shape1) && group.includes(shape2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Create consensus signature from multiple analyses
 */
export function createConsensusSignature(analyses) {
  console.log('🔄 Creating consensus signature from', analyses.length, 'analyses');
  
  if (analyses.length === 0) {
    throw new Error('No analyses provided for consensus');
  }

  // For now, return the first analysis (can be enhanced later)
  const consensus = analyses[0];
  console.log('✅ Consensus signature created:', consensus);
  
  return consensus;
}