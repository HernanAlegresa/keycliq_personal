/**
 * Final Test V3 - 20 Random Comparisons
 * Using Hybrid Balanced System
 * 10 same key different image + 10 different keys
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the hybrid balanced system
import { analyzeKeyWithHybridBalancedAI, compareHybridBalancedKeySignatures } from '../app/lib/ai/multimodal-keyscan-hybrid-balanced.server.js';

async function getAvailableKeys(datasetPath) {
  const keys = [];
  const keyDirs = fs.readdirSync(datasetPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const keyDir of keyDirs) {
    const keyPath = path.join(datasetPath, keyDir);
    const subDirs = fs.readdirSync(keyPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const subDir of subDirs) {
      const fullKeyPath = path.join(keyPath, subDir);
      const images = fs.readdirSync(fullKeyPath)
        .filter(file => file.match(/\.(jpg|jpeg|png)$/i));
      
      if (images.length > 0) {
        keys.push({
          keyPath: `${keyDir}/${subDir}`,
          images: images,
          alignedImages: images.filter(img => img.includes('aligned')),
          generatedImages: images.filter(img => img.includes('generated'))
        });
      }
    }
  }
  return keys;
}

async function finalTestV320Comparisons() {
  console.log('🧪 Final Test V3 - 20 Random Comparisons');
  console.log('=========================================');
  console.log('Using Hybrid Balanced System');
  console.log('10 same key different image + 10 different keys');
  console.log('');

  try {
    // Get available keys
    const datasetPath = path.join(__dirname, '../tests/keys-optimized');
    const availableKeys = await getAvailableKeys(datasetPath);
    
    console.log(`📦 Found ${availableKeys.length} available keys`);
    
    if (availableKeys.length < 20) {
      throw new Error('Not enough keys for final test (need at least 20)');
    }

    // Filter keys that have both aligned and generated images for same key tests
    const keysWithBothImages = availableKeys.filter(key => 
      key.alignedImages.length > 0 && key.generatedImages.length > 0
    );
    
    console.log(`📦 Keys with both image types: ${keysWithBothImages.length}`);
    
    if (keysWithBothImages.length < 10) {
      throw new Error('Not enough keys with both image types for same key tests');
    }

    // Create test cases
    const testCases = [];
    
    // 10 same key different image tests
    console.log('🔧 Creating 10 same key different image tests...');
    for (let i = 0; i < 10; i++) {
      const key = keysWithBothImages[i];
      // Randomly choose which image is key1 and which is key2
      const useAlignedFirst = Math.random() < 0.5;
      const key1Image = useAlignedFirst ? key.alignedImages[0] : key.generatedImages[0];
      const key2Image = useAlignedFirst ? key.generatedImages[0] : key.alignedImages[0];
      
      testCases.push({
        name: `Same Key Test ${i + 1}`,
        key1: `${key.keyPath}/${key1Image}`,
        key2: `${key.keyPath}/${key2Image}`,
        expected: 'MATCH_FOUND',
        description: `Same key different image: ${key.keyPath} (${key1Image} vs ${key2Image})`,
        testType: 'SAME_KEY'
      });
    }
    
    // 10 different keys tests
    console.log('🔧 Creating 10 different keys tests...');
    const differentKeys = availableKeys.filter(key => 
      !keysWithBothImages.slice(0, 10).some(testKey => testKey.keyPath === key.keyPath)
    );
    
    for (let i = 0; i < 10; i++) {
      const key1 = differentKeys[i];
      const key2 = differentKeys[(i + 1) % differentKeys.length];
      const key1Image = key1.alignedImages[0] || key1.images[0];
      const key2Image = key2.alignedImages[0] || key2.images[0];
      
      testCases.push({
        name: `Different Keys Test ${i + 1}`,
        key1: `${key1.keyPath}/${key1Image}`,
        key2: `${key2.keyPath}/${key2Image}`,
        expected: 'NO_MATCH',
        description: `Different keys: ${key1.keyPath} vs ${key2.keyPath}`,
        testType: 'DIFFERENT_KEYS'
      });
    }

    console.log(`📋 Created ${testCases.length} test cases`);
    console.log(`   - Same Key Tests: ${testCases.filter(t => t.testType === 'SAME_KEY').length}`);
    console.log(`   - Different Keys Tests: ${testCases.filter(t => t.testType === 'DIFFERENT_KEYS').length}`);
    console.log('');

    const results = [];
    let sameKeyPassed = 0;
    let differentKeysPassed = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🔍 Test ${i + 1}/${testCases.length}: ${testCase.name}`);
      console.log(`📝 Description: ${testCase.description}`);
      console.log(`🎯 Expected: ${testCase.expected}`);
      console.log(`📊 Type: ${testCase.testType}`);
      console.log('');

      try {
        // Load and analyze first key
        const key1Path = path.join(datasetPath, testCase.key1);
        const key1Buffer = fs.readFileSync(key1Path);
        const key1MimeType = testCase.key1.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        console.log(`📸 Analyzing Key 1: ${testCase.key1}`);
        const result1 = await analyzeKeyWithHybridBalancedAI(key1Buffer, key1MimeType);
        
        if (!result1.success) {
          throw new Error(`Key 1 analysis failed: ${result1.error}`);
        }

        // Load and analyze second key
        const key2Path = path.join(datasetPath, testCase.key2);
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
        
        // Track results by test type
        if (testCase.testType === 'SAME_KEY') {
          if (passed) sameKeyPassed++;
        } else if (testCase.testType === 'DIFFERENT_KEYS') {
          if (passed) differentKeysPassed++;
        }
        
        results.push({
          testCase: testCase.name,
          testType: testCase.testType,
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
          testType: testCase.testType,
          expected: testCase.expected,
          actual: 'ERROR',
          similarity: 0,
          passed: false,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n📊 FINAL TEST V3 SUMMARY');
    console.log('=========================');
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const successRate = (passedTests / totalTests) * 100;
    
    const sameKeyTests = results.filter(r => r.testType === 'SAME_KEY');
    const differentKeyTests = results.filter(r => r.testType === 'DIFFERENT_KEYS');
    
    const sameKeySuccessRate = (sameKeyPassed / sameKeyTests.length) * 100;
    const differentKeySuccessRate = (differentKeysPassed / differentKeyTests.length) * 100;
    
    console.log(`✅ Total Passed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
    console.log(`🔑 Same Key Tests: ${sameKeyPassed}/${sameKeyTests.length} (${sameKeySuccessRate.toFixed(1)}%)`);
    console.log(`🔀 Different Key Tests: ${differentKeysPassed}/${differentKeyTests.length} (${differentKeySuccessRate.toFixed(1)}%)`);
    console.log('');
    
    // Detailed results
    console.log('📋 DETAILED RESULTS:');
    console.log('====================');
    
    results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      const testType = result.testType === 'SAME_KEY' ? 'SAME' : 'DIFF';
      console.log(`${status} ${index + 1}. [${testType}] ${result.testCase} - ${result.actual} (${(result.similarity * 100).toFixed(1)}%)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = path.join(__dirname, '../tests/results', `final-test-v3-20-comparisons-${timestamp}.json`);
    
    const reportData = {
      timestamp: new Date().toISOString(),
      testType: "Final Test V3 - 20 Random Comparisons",
      system: "Hybrid Balanced System",
      summary: {
        totalTests,
        passedTests,
        successRate,
        sameKeyTests: sameKeyTests.length,
        sameKeyPassed,
        sameKeySuccessRate,
        differentKeyTests: differentKeyTests.length,
        differentKeysPassed,
        differentKeySuccessRate
      },
      results
    };
    
    fs.writeFileSync(resultsPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    console.log('\n🎯 HYBRID BALANCED SYSTEM FEATURES:');
    console.log('====================================');
    console.log('✅ Balanced thresholds: 92% MATCH, 80% POSSIBLE');
    console.log('✅ Tolerance for number_of_cuts (±1 difference)');
    console.log('✅ Tolerance for similar bow shapes');
    console.log('✅ General but distinctive parameter categories');
    console.log('✅ Focus on consistency for same key, discrimination for different keys');

    if (successRate >= 90) {
      console.log('\n🎉 Final Test V3 validation successful! System ready for production.');
    } else if (successRate >= 80) {
      console.log('\n⚠️  Final Test V3 shows good progress but needs minor adjustments.');
    } else {
      console.log('\n❌ Final Test V3 needs significant adjustments.');
    }

  } catch (error) {
    console.error('💥 Final Test V3 failed:', error.message);
    throw error;
  }
}

// Run test
finalTestV320Comparisons()
  .then(() => {
    console.log('\n🎉 Final Test V3 completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });
