/**
 * Test Optimized V6 System
 * Tests the performance improvements for production
 */

import dotenv from 'dotenv';
import { analyzeKeyWithAI } from '../app/lib/ai/multimodal-keyscan.server.js';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🚀 Testing Optimized V6 System...');
console.log('Environment:', process.env.NODE_ENV);
console.log('');

async function testOptimizedV6() {
  try {
    const testImagePath = path.join(process.cwd(), 'tests/keys-optimized/regular/regular-01/aligned-regular-01.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.error('❌ Test image not found:', testImagePath);
      return;
    }
    
    console.log('📸 Loading test image:', testImagePath);
    const imageBuffer = fs.readFileSync(testImagePath);
    
    console.log('🔄 Testing optimized V6 analysis...');
    const startTime = Date.now();
    
    const result = await analyzeKeyWithAI(imageBuffer, 'image/jpeg');
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n📊 Results:');
    console.log('✅ Success:', result.success);
    console.log('⏱️ Total time:', totalTime + 'ms');
    console.log('📝 Signature structure:', Object.keys(result.signature || {}));
    
    if (result.consensusData) {
      console.log('🔍 Consensus data:', {
        numAnalyses: result.consensusData.numAnalyses,
        environment: process.env.NODE_ENV
      });
    }
    
    // Performance expectations
    const expectedMaxTime = process.env.NODE_ENV === 'production' ? 15000 : 30000; // 15s prod, 30s dev
    const isFastEnough = totalTime < expectedMaxTime;
    
    console.log('\n🎯 Performance Check:');
    console.log(`Expected max time: ${expectedMaxTime}ms`);
    console.log(`Actual time: ${totalTime}ms`);
    console.log(`Performance: ${isFastEnough ? '✅ GOOD' : '❌ TOO SLOW'}`);
    
    if (isFastEnough) {
      console.log('\n🎉 Optimized V6 system is ready for production!');
    } else {
      console.log('\n⚠️ System still too slow for production. Consider further optimizations.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOptimizedV6();
