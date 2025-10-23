/**
 * Test V6 Integration Script
 * Verifica que el sistema V6 esté funcionando correctamente
 */

import dotenv from 'dotenv';
import { analyzeKeyWithAI, compareKeySignatures } from '../app/lib/ai/multimodal-keyscan.server.js';
import { processKeyImageV6 } from '../app/lib/keyscan.server.js';
import { dataUrlToBinary } from '../app/utils/imageConversion.js';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🔍 Testing V6 Integration...');
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

async function testV6System() {
  try {
    console.log('\n=== TEST 1: AI Analysis ===');
    
    // Test with a sample image
    const testImagePath = path.join(process.cwd(), 'tests/keys-optimized/regular/regular-01/aligned-regular-01.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.error('❌ Test image not found:', testImagePath);
      return;
    }
    
    console.log('📸 Loading test image:', testImagePath);
    const imageBuffer = fs.readFileSync(testImagePath);
    
    // Test AI analysis
    console.log('🤖 Testing AI analysis...');
    const analysisResult = await analyzeKeyWithAI(imageBuffer, 'image/jpeg');
    
    if (analysisResult.success) {
      console.log('✅ AI analysis successful');
      console.log('Signature structure:', Object.keys(analysisResult.signature));
      console.log('Quantitative properties:', analysisResult.signature.quantitative_properties);
      console.log('Qualitative properties:', analysisResult.signature.qualitative_properties);
      console.log('Structural features:', analysisResult.signature.structural_features);
    } else {
      console.error('❌ AI analysis failed:', analysisResult.error);
      return;
    }
    
    console.log('\n=== TEST 2: Signature Comparison ===');
    
    // Create a mock inventory with the same signature
    const mockInventory = [
      {
        key: { id: 'test-key-1' },
        signature: analysisResult.signature
      }
    ];
    
    // Test comparison
    console.log('🔍 Testing signature comparison...');
    const comparison = compareKeySignatures(analysisResult.signature, analysisResult.signature);
    
    console.log('Comparison result:', {
      similarity: comparison.similarity,
      matchType: comparison.matchType,
      details: comparison.details
    });
    
    console.log('\n=== TEST 3: Full V6 Processing ===');
    
    // Convert image to data URL for V6 processing
    const base64Image = imageBuffer.toString('base64');
    const dataURL = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('🔄 Testing full V6 processing...');
    const v6Result = await processKeyImageV6(dataURL, mockInventory);
    
    console.log('V6 Processing result:', {
      success: v6Result.success,
      decision: v6Result.decision,
      confidence: v6Result.confidence,
      details: v6Result.details
    });
    
    if (v6Result.success && v6Result.decision === 'MATCH') {
      console.log('✅ V6 system working correctly - MATCH found');
    } else {
      console.log('⚠️ V6 system result:', v6Result.decision);
    }
    
    console.log('\n=== TEST 4: Different Key Test ===');
    
    // Test with a different key
    const differentImagePath = path.join(process.cwd(), 'tests/keys-optimized/regular/regular-02/aligned-regular-02.jpg');
    
    if (fs.existsSync(differentImagePath)) {
      console.log('📸 Loading different test image:', differentImagePath);
      const differentImageBuffer = fs.readFileSync(differentImagePath);
      const differentBase64 = differentImageBuffer.toString('base64');
      const differentDataURL = `data:image/jpeg;base64,${differentBase64}`;
      
      console.log('🔄 Testing with different key...');
      const differentResult = await processKeyImageV6(differentDataURL, mockInventory);
      
      console.log('Different key result:', {
        success: differentResult.success,
        decision: differentResult.decision,
        confidence: differentResult.confidence
      });
      
      if (differentResult.success && differentResult.decision === 'NO_MATCH') {
        console.log('✅ V6 system correctly identified different key as NO_MATCH');
      } else {
        console.log('⚠️ V6 system result for different key:', differentResult.decision);
      }
    } else {
      console.log('⚠️ Different test image not found, skipping different key test');
    }
    
    console.log('\n🎉 V6 Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testV6System();
