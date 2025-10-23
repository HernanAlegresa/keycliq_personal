/**
 * Test Hybrid Balanced System
 * Testing the hybrid balanced system with tolerance and balanced thresholds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the hybrid balanced system
import { analyzeKeyWithHybridBalancedAI, compareHybridBalancedKeySignatures } from '../app/lib/ai/multimodal-keyscan-hybrid-balanced.server.js';

async function testHybridBalanced() {
  console.log('🧪 Testing Hybrid Balanced System');
  console.log('==================================');
  console.log('Testing balanced discrimination with tolerance for consistency');
  console.log('');

  try {
    // Test the problematic cases
    const testCases = [
      {
        name: "CRITICAL: Different Keys - lockbox-12 vs heavy-01",
        key1: "lockbox/lockbox-12/aligned-lockbox-12.jpg",
        key2: "optimized-keys-images/heavy/optimized-heavy-01.jpg",
        expected: "NO_MATCH",
        description: "These should be NO_MATCH"
      },
      {
        name: "CRITICAL: Different Keys - heavy vs lockbox",
        key1: "optimized-keys-images/heavy/optimized-heavy-01.jpg",
        key2: "optimized-keys-images/lockbox/optimized-lockbox-02.jpg",
        expected: "NO_MATCH",
        description: "These should be NO_MATCH"
      },
      {
        name: "CRITICAL: Different Keys - lockbox vs regular",
        key1: "optimized-keys-images/lockbox/optimized-lockbox-02.jpg",
        key2: "optimized-keys-images/regular/optimized-regular-01.jpg",
        expected: "NO_MATCH",
        description: "These should be NO_MATCH"
      },
      {
        name: "VALIDATION: Same Key Test",
        key1: "regular/regular-01/aligned-regular-01.jpg",
        key2: "regular/regular-01/generated-regular-01.png",
        expected: "MATCH_FOUND",
        description: "Same key should match"
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      console.log(`📝 Description: ${testCase.description}`);
      console.log(`🎯 Expected: ${testCase.expected}`);
      console.log('');

      try {
        // Load and analyze first key
        const key1Path = path.join(__dirname, '../tests/keys-optimized', testCase.key1);
        const key1Buffer = fs.readFileSync(key1Path);
        const key1MimeType = testCase.key1.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        console.log(`📸 Analyzing Key 1: ${testCase.key1}`);
        const result1 = await analyzeKeyWithHybridBalancedAI(key1Buffer, key1MimeType);
        
        if (!result1.success) {
          throw new Error(`Key 1 analysis failed: ${result1.error}`);
        }

        // Load and analyze second key
        const key2Path = path.join(__dirname, '../tests/keys-optimized', testCase.key2);
        const key2Buffer = fs.readFileSync(key2Path);
        const key2MimeType = testCase.key2.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        console.log(`📸 Analyzing Key 2: ${testCase.key2}`);
        const result2 = await analyzeKeyWithHybridBalancedAI(key2Buffer, key2MimeType);
        
        if (!result2.success) {
          throw new Error(`Key 2 analysis failed: ${result2.error}`);
        }

        // Compare signatures
        console.log('🔍 Comparing signatures...');
        const comparison = compareHybridBalancedKeySignatures(result1.signature, result2.signature);
        
        // Evaluate result
        const passed = comparison.matchType === testCase.expected;
        const evaluation = passed ? '✅ PASS' : '❌ FAIL';
        
        console.log(`\n📊 Results:`);
        console.log(`   Similarity: ${(comparison.similarity * 100).toFixed(1)}%`);
        console.log(`   Match Type: ${comparison.matchType}`);
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Result: ${evaluation}`);
        
        // Show parameter details
        console.log(`\n🔍 Parameter Analysis:`);
        console.log(`   Key 1: ${JSON.stringify(result1.signature, null, 2)}`);
        console.log(`   Key 2: ${JSON.stringify(result2.signature, null, 2)}`);
        
        results.push({
          testCase: testCase.name,
          expected: testCase.expected,
          actual: comparison.matchType,
          similarity: comparison.similarity,
          passed,
          key1Signature: result1.signature,
          key2Signature: result2.signature,
          comparison
        });

      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        results.push({
          testCase: testCase.name,
          expected: testCase.expected,
          actual: 'ERROR',
          similarity: 0,
          passed: false,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n📊 HYBRID BALANCED TEST SUMMARY');
    console.log('================================');
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
    console.log('');
    
    results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${result.testCase}`);
      console.log(`   Expected: ${result.expected} | Actual: ${result.actual}`);
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = path.join(__dirname, '../tests/results', `hybrid-balanced-test-${timestamp}.json`);
    
    const reportData = {
      timestamp: new Date().toISOString(),
      testType: "Hybrid Balanced Test",
      summary: {
        totalTests,
        passedTests,
        successRate,
        failedTests: totalTests - passedTests
      },
      results
    };
    
    fs.writeFileSync(resultsPath, JSON.stringify(reportData, null, 2));
    console.log(`💾 Results saved to: ${resultsPath}`);

    console.log('\n🎯 HYBRID BALANCED FEATURES:');
    console.log('==============================');
    console.log('✅ Balanced thresholds: 92% MATCH, 80% POSSIBLE');
    console.log('✅ Tolerance for number_of_cuts (±1 difference)');
    console.log('✅ Tolerance for similar bow shapes');
    console.log('✅ General but distinctive parameter categories');
    console.log('✅ Focus on consistency for same key, discrimination for different keys');

    if (successRate >= 90) {
      console.log('\n🎉 Hybrid Balanced system validation successful! Ready for comprehensive testing.');
    } else if (successRate >= 75) {
      console.log('\n⚠️  Hybrid Balanced system shows progress but needs refinement.');
    } else {
      console.log('\n❌ Hybrid Balanced system needs significant adjustments.');
    }

  } catch (error) {
    console.error('💥 Hybrid Balanced test failed:', error.message);
    throw error;
  }
}

// Run test
testHybridBalanced()
  .then(() => {
    console.log('\n🎉 Hybrid Balanced test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });
