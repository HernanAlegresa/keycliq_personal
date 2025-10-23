/**
 * Debug Matching Logic - Test Regular-2 vs Regular-3
 * This script will test the specific case that's failing in staging
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeKeyWithHybridBalancedAI, compareHybridBalancedKeySignatures } from '../app/lib/ai/multimodal-keyscan.server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugMatchingLogic() {
  console.log('🔍 Debugging Matching Logic - Regular-2 vs Regular-3');
  console.log('==================================================');
  
  try {
    // Test with regular-2 and regular-3 images
    const regular2Path = path.join(__dirname, '../tests/keys-optimized/regular/regular-02/aligned-regular-02.jpg');
    const regular3Path = path.join(__dirname, '../tests/keys-optimized/regular/regular-03/aligned-regular-03.jpg');
    
    console.log('📸 Analyzing Regular-2...');
    const regular2Buffer = fs.readFileSync(regular2Path);
    const regular2Result = await analyzeKeyWithHybridBalancedAI(regular2Buffer, 'image/jpeg');
    
    if (!regular2Result.success) {
      throw new Error(`Regular-2 analysis failed: ${regular2Result.error}`);
    }
    
    console.log('📸 Analyzing Regular-3...');
    const regular3Buffer = fs.readFileSync(regular3Path);
    const regular3Result = await analyzeKeyWithHybridBalancedAI(regular3Buffer, 'image/jpeg');
    
    if (!regular3Result.success) {
      throw new Error(`Regular-3 analysis failed: ${regular3Result.error}`);
    }
    
    console.log('\n🔍 Regular-2 Signature:');
    console.log(JSON.stringify(regular2Result.signature, null, 2));
    
    console.log('\n🔍 Regular-3 Signature:');
    console.log(JSON.stringify(regular3Result.signature, null, 2));
    
    console.log('\n🔍 Comparing signatures...');
    const comparison = compareHybridBalancedKeySignatures(regular2Result.signature, regular3Result.signature);
    
    console.log('\n📊 Comparison Result:');
    console.log(`   Similarity: ${(comparison.similarity * 100).toFixed(1)}%`);
    console.log(`   Match Type: ${comparison.matchType}`);
    console.log(`   Expected: NO_MATCH`);
    console.log(`   Result: ${comparison.matchType === 'NO_MATCH' ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (comparison.matchType !== 'NO_MATCH') {
      console.log('\n❌ PROBLEM IDENTIFIED:');
      console.log('   Regular-2 vs Regular-3 should be NO_MATCH but got:', comparison.matchType);
      console.log('   This indicates the matching logic needs adjustment');
      
      // Analyze which parameters are causing the high similarity
      console.log('\n🔍 Parameter Analysis:');
      const sig1 = regular2Result.signature;
      const sig2 = regular3Result.signature;
      
      Object.keys(sig1).forEach(param => {
        if (param === 'confidence_score') return;
        const val1 = sig1[param];
        const val2 = sig2[param];
        const match = val1 === val2 ? '✅' : '❌';
        console.log(`   ${param}: ${val1} vs ${val2} ${match}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugMatchingLogic();
