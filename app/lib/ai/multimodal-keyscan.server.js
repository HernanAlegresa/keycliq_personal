/**
 * KeyScan V6 - Multimodal AI Service
 * Replaces traditional computer vision with GPT-4o textual signatures
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

// Schema for validation of AI response
const KeySignatureSchema = z.object({
  quantitative_properties: z.object({
    stamped_code: z.string().optional(),
    number_of_cuts: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]).optional(),
    length_estimate: z.string().optional(),
    width_estimate: z.string().optional(),
    groove_count: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]).optional(),
    cut_depths: z.array(z.union([z.number(), z.string().transform(val => parseFloat(val) || 0)])).optional(),
  }),
  qualitative_properties: z.object({
    material: z.string().optional(),
    color: z.string().optional(),
    finish: z.string().optional(),
    manufacturing_process: z.string().optional(),
    edge_profile: z.string().optional(),
    purpose: z.string().optional(),
    usage_context: z.string().optional(),
  }),
  structural_features: z.object({
    bow: z.object({
      shape: z.string().optional(),
      key_ring_hole: z.string().optional(),
      layers: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]).optional(),
      text: z.array(z.string()).optional(),
    }),
    shoulder_stop: z.string().optional(),
    blade: z.object({
      profile: z.string().optional(),
      grooves: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]).optional(),
      cuts: z.string().optional(),
    }),
    tip: z.string().optional(),
  }),
  unique_features: z.array(z.string()).optional(),
  confidence_score: z.union([z.number().min(0).max(1), z.string().transform(val => Math.min(Math.max(parseFloat(val) || 0.5, 0), 1))]).optional(),
});

// Universal prompt for key analysis
const UNIVERSAL_KEY_PROMPT = `You are an expert key analyst. Analyze this key image and extract ALL visible properties.

Return a JSON object with this exact structure:

{
  "quantitative_properties": {
    "stamped_code": "stamped code if exists",
    "number_of_cuts": number_of_cuts,
    "length_estimate": "estimated length in cm",
    "width_estimate": "estimated width in cm", 
    "groove_count": number_of_grooves,
    "cut_depths": [array_of_depths]
  },
  "qualitative_properties": {
    "material": "main material",
    "color": "dominant color",
    "finish": "finish type",
    "manufacturing_process": "manufacturing process",
    "edge_profile": "edge profile",
    "purpose": "key type",
    "usage_context": "usage context"
  },
  "structural_features": {
    "bow": {
      "shape": "bow shape",
      "key_ring_hole": "hole type",
      "layers": number_of_layers,
      "text": ["visible_texts"]
    },
    "shoulder_stop": "present/absent",
    "blade": {
      "profile": "blade profile",
      "grooves": number_of_grooves,
      "cuts": "cut type"
    },
    "tip": "tip shape"
  },
  "unique_features": ["unique_characteristics"],
  "confidence_score": 0.95
}

Be extremely detailed and precise. Include EVERYTHING you see.`;

/**
 * Analyze a key image using GPT-4o and return structured signature
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Object>} Structured key signature
 */
export async function analyzeKeyWithAI(imageBuffer, mimeType = 'image/jpeg') {
  try {
    console.log('🔍 Starting AI key analysis...');
    
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Call GPT-4o with image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: UNIVERSAL_KEY_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this key image and provide a structured JSON response with all properties."
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
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    // Parse and validate response
    const rawResponse = response.choices[0].message.content;
    console.log('📝 Raw AI response received');
    
    const parsedResponse = JSON.parse(rawResponse);
    const validatedSignature = KeySignatureSchema.parse(parsedResponse);
    
    console.log('✅ Key signature generated successfully');
    
    return {
      success: true,
      signature: validatedSignature,
      rawResponse: rawResponse,
      processingTime: Date.now() - Date.now() // Will be calculated properly
    };
    
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    
    return {
      success: false,
      error: error.message,
      signature: null
    };
  }
}

/**
 * Compare two key signatures and calculate similarity
 * @param {Object} signature1 - First key signature
 * @param {Object} signature2 - Second key signature
 * @returns {Object} Comparison result with similarity score
 */
export function compareKeySignatures(signature1, signature2) {
  try {
    console.log('🔍 Comparing key signatures...');
    
    // Calculate similarity based on different aspects
    const quantitativeSimilarity = calculateQuantitativeSimilarity(
      signature1.quantitative_properties,
      signature2.quantitative_properties
    );
    
    const qualitativeSimilarity = calculateQualitativeSimilarity(
      signature1.qualitative_properties,
      signature2.qualitative_properties
    );
    
    const structuralSimilarity = calculateStructuralSimilarity(
      signature1.structural_features,
      signature2.structural_features
    );
    
    // Weighted average (quantitative is most important)
    const overallSimilarity = (
      quantitativeSimilarity * 0.5 +
      qualitativeSimilarity * 0.3 +
      structuralSimilarity * 0.2
    );
    
    // Determine match type
    let matchType = 'NO_MATCH';
    if (overallSimilarity >= 0.9) {
      matchType = 'MATCH_FOUND';
    } else if (overallSimilarity >= 0.7) {
      matchType = 'POSSIBLE_MATCH';
    }
    
    console.log(`📊 Similarity: ${(overallSimilarity * 100).toFixed(1)}% - ${matchType}`);
    
    return {
      similarity: overallSimilarity,
      matchType,
      details: {
        quantitative: quantitativeSimilarity,
        qualitative: qualitativeSimilarity,
        structural: structuralSimilarity
      }
    };
    
  } catch (error) {
    console.error('❌ Signature comparison failed:', error);
    return {
      similarity: 0,
      matchType: 'ERROR',
      error: error.message
    };
  }
}

/**
 * Calculate quantitative properties similarity
 */
function calculateQuantitativeSimilarity(props1, props2) {
  let matches = 0;
  let total = 0;
  
  // Compare stamped codes (exact match)
  if (props1.stamped_code && props2.stamped_code) {
    total++;
    if (props1.stamped_code === props2.stamped_code) matches++;
  }
  
  // Compare number of cuts
  if (props1.number_of_cuts && props2.number_of_cuts) {
    total++;
    if (props1.number_of_cuts === props2.number_of_cuts) matches++;
  }
  
  // Compare groove count
  if (props1.groove_count && props2.groove_count) {
    total++;
    if (props1.groove_count === props2.groove_count) matches++;
  }
  
  return total > 0 ? matches / total : 0;
}

/**
 * Calculate qualitative properties similarity
 */
function calculateQualitativeSimilarity(props1, props2) {
  let matches = 0;
  let total = 0;
  
  const fields = ['material', 'color', 'finish', 'purpose'];
  
  fields.forEach(field => {
    if (props1[field] && props2[field]) {
      total++;
      if (props1[field].toLowerCase() === props2[field].toLowerCase()) {
        matches++;
      }
    }
  });
  
  return total > 0 ? matches / total : 0;
}

/**
 * Calculate structural features similarity
 */
function calculateStructuralSimilarity(features1, features2) {
  let matches = 0;
  let total = 0;
  
  // Compare bow shape
  if (features1.bow?.shape && features2.bow?.shape) {
    total++;
    if (features1.bow.shape.toLowerCase() === features2.bow.shape.toLowerCase()) {
      matches++;
    }
  }
  
  // Compare blade profile
  if (features1.blade?.profile && features2.blade?.profile) {
    total++;
    if (features1.blade.profile.toLowerCase() === features2.blade.profile.toLowerCase()) {
      matches++;
    }
  }
  
  return total > 0 ? matches / total : 0;
}

