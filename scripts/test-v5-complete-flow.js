/**
 * Complete flow test for V5 - Simulates real staging scenario
 */

import { processKeyImageV5 } from '../app/lib/keyscan.server.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadTestKey(keyPath) {
  const imageBuffer = readFileSync(keyPath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}

async function testCompleteFlow() {
  console.log('\n🔬 ===== V5 COMPLETE FLOW TEST (Staging Simulation) =====\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  try {
    // Scenario 1: First key scan (empty inventory) - Should return NO_MATCH
    console.log('Test 1: First key scan with empty inventory');
    console.log('Expected: NO_MATCH\n');
    
    const firstKeyPath = join(__dirname, '../tests/keys-optimized/regular/regular-01/aligned-regular-01.jpg');
    const firstKeyDataURL = loadTestKey(firstKeyPath);
    
    const result1 = await processKeyImageV5(firstKeyDataURL, []);
    
    const test1Pass = result1.success && result1.decision === 'NO_MATCH';
    results.tests.push({
      name: 'Empty inventory',
      passed: test1Pass,
      result: result1
    });
    
    if (test1Pass) {
      console.log('✅ PASS: Returned NO_MATCH as expected\n');
      results.passed++;
    } else {
      console.log('❌ FAIL: Expected NO_MATCH, got:', result1.decision, '\n');
      results.failed++;
    }
    
    // Scenario 2: Same key comparison (should MATCH)
    console.log('Test 2: Scanning same key against inventory');
    console.log('Expected: MATCH\n');
    
    // Create inventory with the first key's features
    const extractResult = await processKeyImageV5(firstKeyDataURL, []);
    if (!extractResult.success) {
      throw new Error('Failed to extract features for inventory');
    }
    
    // Re-extract features properly
    const { extractFeaturesV5 } = await import('../app/lib/keyscan.server.js');
    const firstKeyFeatures = await extractFeaturesV5(firstKeyDataURL);
    
    if (!firstKeyFeatures.success) {
      throw new Error('Failed to extract features: ' + firstKeyFeatures.error);
    }
    
    const inventory = [
      {
        key: { id: 'key-regular-01', type: 'Regular' },
        features: firstKeyFeatures.features
      }
    ];
    
    const result2 = await processKeyImageV5(firstKeyDataURL, inventory);
    
    const test2Pass = result2.success && (result2.decision === 'MATCH' || result2.decision === 'POSSIBLE');
    results.tests.push({
      name: 'Same key comparison',
      passed: test2Pass,
      result: result2
    });
    
    if (test2Pass) {
      console.log(`✅ PASS: Returned ${result2.decision} with confidence ${result2.confidence}%\n`);
      results.passed++;
    } else {
      console.log('❌ FAIL: Expected MATCH or POSSIBLE, got:', result2.decision, '\n');
      results.failed++;
    }
    
    // Scenario 3: Different key comparison (should NO_MATCH or low confidence)
    console.log('Test 3: Scanning different key against inventory');
    console.log('Expected: NO_MATCH or low confidence POSSIBLE\n');
    
    const differentKeyPath = join(__dirname, '../tests/keys-optimized/regular/regular-02/aligned-regular-02.jpg');
    const differentKeyDataURL = loadTestKey(differentKeyPath);
    
    const result3 = await processKeyImageV5(differentKeyDataURL, inventory);
    
    const test3Pass = result3.success && (
      result3.decision === 'NO_MATCH' || 
      (result3.decision === 'POSSIBLE' && result3.confidence < 30)
    );
    
    results.tests.push({
      name: 'Different key comparison',
      passed: test3Pass,
      result: result3
    });
    
    if (test3Pass) {
      console.log(`✅ PASS: Returned ${result3.decision} with confidence ${result3.confidence}%\n`);
      results.passed++;
    } else {
      console.log(`⚠️  WARNING: Returned ${result3.decision} with confidence ${result3.confidence}%`);
      console.log('   (High confidence for different key - potential false positive)\n');
      results.failed++;
    }
    
    // Scenario 4: Error handling (invalid image)
    console.log('Test 4: Error handling with invalid data');
    console.log('Expected: success: false\n');
    
    const result4 = await processKeyImageV5('invalid-data', inventory);
    
    const test4Pass = !result4.success;
    results.tests.push({
      name: 'Error handling',
      passed: test4Pass,
      result: result4
    });
    
    if (test4Pass) {
      console.log('✅ PASS: Error handled correctly\n');
      results.passed++;
    } else {
      console.log('❌ FAIL: Should have failed with invalid data\n');
      results.failed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}/${results.tests.length}`);
    console.log(`❌ Failed: ${results.failed}/${results.tests.length}`);
    console.log(`📊 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    if (results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED - V5 IS READY FOR STAGING! 🎉\n');
      return true;
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - NEEDS REVIEW BEFORE STAGING\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR IN TEST:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testCompleteFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

