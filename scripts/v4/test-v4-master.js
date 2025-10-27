/**
 * KeyScan V4 - Master Test Script
 * Tests the V4 master final logic with highest accuracy
 */

import { analyzeKeyWithHybridBalancedAI } from '../../app/lib/ai/v4/multimodal-keyscan-v4.server.js';
import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  totalRuns: 3,  // Optimized for $5 budget
  inventorySize: 15,
  datasetPath: 'tests/keys-optimized',
  resultsPath: 'tests/results/v4',
  version: 'V4 (Master Final Logic)'
};

// Key categories and their paths
const KEY_CATEGORIES = {
  regular: 'tests/keys-optimized/regular',
  heavy: 'tests/keys-optimized/heavy',
  lockbox: 'tests/keys-optimized/lockbox'
};

/**
 * Get all available keys from the dataset
 */
function getAllKeys() {
  const allKeys = [];
  
  Object.entries(KEY_CATEGORIES).forEach(([category, categoryPath]) => {
    if (fs.existsSync(categoryPath)) {
      const keyFolders = fs.readdirSync(categoryPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      keyFolders.forEach(keyFolder => {
        const keyPath = path.join(categoryPath, keyFolder);
        const images = fs.readdirSync(keyPath)
          .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'));
        
        if (images.length > 0) {
          allKeys.push({
            id: `${category}-${keyFolder}`,
            category,
            path: keyPath,
            images
          });
        }
      });
    }
  });
  
  return allKeys;
}

/**
 * Run a single test
 */
async function runSingleTest(runNumber, allKeys) {
  console.log(`\n🧪 Running V4 Test ${runNumber}/${TEST_CONFIG.totalRuns}`);
  
  // Select random inventory
  const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
  const inventory = shuffledKeys.slice(0, TEST_CONFIG.inventorySize);
  
  // Select query key (not in inventory)
  const queryKey = shuffledKeys[TEST_CONFIG.inventorySize];
  
  console.log(`📋 Inventory: ${inventory.length} keys`);
  console.log(`🔍 Query: ${queryKey.id}`);
  
  try {
    // Analyze inventory keys
    const inventorySignatures = [];
    for (const key of inventory) {
      const imagePath = path.join(key.path, key.images[0]);
      const imageBuffer = fs.readFileSync(imagePath);
      
      const result = await analyzeKeyWithHybridBalancedAI(imageBuffer, []);
      if (result.success) {
        inventorySignatures.push({
          keyId: key.id,
          signature: result.querySignature
        });
      }
    }
    
    // Analyze query key
    const queryImagePath = path.join(queryKey.path, queryKey.images[0]);
    const queryImageBuffer = fs.readFileSync(queryImagePath);
    
    const queryResult = await analyzeKeyWithHybridBalancedAI(queryImageBuffer, inventorySignatures);
    
    if (queryResult.success) {
      const correctComparisons = queryResult.results.filter(r => r.isCorrect).length;
      const accuracy = (correctComparisons / queryResult.results.length) * 100;
      
      console.log(`✅ Test completed - Accuracy: ${accuracy.toFixed(1)}%`);
      
      return {
        runNumber,
        queryKey: queryKey.id,
        inventorySize: inventorySignatures.length,
        correctComparisons,
        totalComparisons: queryResult.results.length,
        accuracy,
        passed: accuracy >= 95 // V4 threshold (highest)
      };
    } else {
      console.log(`❌ Test failed - Error: ${queryResult.error}`);
      return {
        runNumber,
        queryKey: queryKey.id,
        error: queryResult.error,
        passed: false
      };
    }
  } catch (error) {
    console.log(`❌ Test failed - Exception: ${error.message}`);
    return {
      runNumber,
      queryKey: queryKey.id,
      error: error.message,
      passed: false
    };
  }
}

/**
 * Main test execution
 */
async function runV4Tests() {
  console.log(`🚀 Starting ${TEST_CONFIG.version} Tests`);
  console.log(`📊 Configuration: ${TEST_CONFIG.totalRuns} runs, ${TEST_CONFIG.inventorySize} inventory size`);
  
  const allKeys = getAllKeys();
  console.log(`🗝️ Available keys: ${allKeys.length}`);
  
  if (allKeys.length < TEST_CONFIG.inventorySize + 1) {
    console.log('❌ Not enough keys for testing');
    return;
  }
  
  const results = [];
  
  for (let i = 1; i <= TEST_CONFIG.totalRuns; i++) {
    const result = await runSingleTest(i, allKeys);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate summary
  const passedTests = results.filter(r => r.passed).length;
  const totalAccuracy = results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / results.length;
  
  console.log(`\n📊 V4 Test Summary:`);
  console.log(`✅ Passed: ${passedTests}/${TEST_CONFIG.totalRuns} (${(passedTests/TEST_CONFIG.totalRuns*100).toFixed(1)}%)`);
  console.log(`📈 Average Accuracy: ${totalAccuracy.toFixed(1)}%`);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(TEST_CONFIG.resultsPath, `v4-test-summary-${timestamp}.json`);
  
  if (!fs.existsSync(TEST_CONFIG.resultsPath)) {
    fs.mkdirSync(TEST_CONFIG.resultsPath, { recursive: true });
  }
  
  fs.writeFileSync(resultsFile, JSON.stringify({
    version: TEST_CONFIG.version,
    timestamp,
    configuration: TEST_CONFIG,
    results,
    summary: {
      passedTests,
      totalTests: TEST_CONFIG.totalRuns,
      passRate: (passedTests/TEST_CONFIG.totalRuns*100).toFixed(1),
      averageAccuracy: totalAccuracy.toFixed(1)
    }
  }, null, 2));
  
  console.log(`💾 Results saved to: ${resultsFile}`);
}

// Run tests
runV4Tests().catch(console.error);
