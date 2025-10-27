/**
 * KeyScan Optimized Test Suite - $5 Budget
 * Runs 3 tests per version (V2, V3, V4) for complete validation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Test configuration
const TEST_SUITE = {
  budget: 5.00, // USD
  estimatedCost: 2.25, // USD
  versions: [
    { name: 'V2', script: 'scripts/v2/test-v2-staging.js', runs: 3, cost: 0.75 },
    { name: 'V3', script: 'scripts/v3/test-v3-evolution.js', runs: 3, cost: 0.75 },
    { name: 'V4', script: 'scripts/v4/test-v4-master.js', runs: 3, cost: 0.75 }
  ]
};

/**
 * Run a single test script
 */
async function runTestScript(version) {
  console.log(`\n🚀 Starting ${version.name} Tests (${version.runs} runs, ~$${version.cost})`);
  console.log(`📄 Script: ${version.script}`);
  
  try {
    const { stdout, stderr } = await execAsync(`node ${version.script}`);
    
    if (stdout) {
      console.log(`✅ ${version.name} Output:`);
      console.log(stdout);
    }
    
    if (stderr) {
      console.log(`⚠️ ${version.name} Warnings:`);
      console.log(stderr);
    }
    
    return { success: true, version: version.name };
  } catch (error) {
    console.log(`❌ ${version.name} Failed:`);
    console.log(error.message);
    return { success: false, version: version.name, error: error.message };
  }
}

/**
 * Generate comprehensive summary
 */
function generateSummary(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summaryFile = `tests/results/test-suite-summary-${timestamp}.json`;
  
  const summary = {
    timestamp,
    budget: TEST_SUITE.budget,
    estimatedCost: TEST_SUITE.estimatedCost,
    actualCost: TEST_SUITE.estimatedCost, // Will be updated with real costs
    results: results,
    summary: {
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      successRate: (results.filter(r => r.success).length / results.length * 100).toFixed(1) + '%'
    }
  };
  
  // Ensure results directory exists
  if (!fs.existsSync('tests/results')) {
    fs.mkdirSync('tests/results', { recursive: true });
  }
  
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log(`\n📊 TEST SUITE SUMMARY:`);
  console.log(`💰 Budget: $${TEST_SUITE.budget}`);
  console.log(`💸 Estimated Cost: $${TEST_SUITE.estimatedCost}`);
  console.log(`✅ Successful: ${summary.summary.successfulTests}/${summary.summary.totalTests}`);
  console.log(`❌ Failed: ${summary.summary.failedTests}/${summary.summary.totalTests}`);
  console.log(`📈 Success Rate: ${summary.summary.successRate}`);
  console.log(`💾 Summary saved to: ${summaryFile}`);
  
  return summary;
}

/**
 * Main test execution
 */
async function runOptimizedTestSuite() {
  console.log(`🎯 KeyScan Optimized Test Suite - $${TEST_SUITE.budget} Budget`);
  console.log(`📊 Configuration: 3 tests per version (V2, V3, V4)`);
  console.log(`💰 Estimated Cost: $${TEST_SUITE.estimatedCost}`);
  console.log(`🔄 Buffer: $${(TEST_SUITE.budget - TEST_SUITE.estimatedCost).toFixed(2)}`);
  
  const results = [];
  
  // Run tests for each version
  for (const version of TEST_SUITE.versions) {
    const result = await runTestScript(version);
    results.push(result);
    
    // Small delay between versions
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary
  const summary = generateSummary(results);
  
  // Check if all tests passed
  const allPassed = results.every(r => r.success);
  
  if (allPassed) {
    console.log(`\n🎉 ALL TESTS PASSED!`);
    console.log(`✅ V2 (Staging): Validated`);
    console.log(`✅ V3 (Evolution): Validated`);
    console.log(`✅ V4 (Master): Validated`);
    console.log(`\n🚀 Ready for production deployment!`);
  } else {
    console.log(`\n⚠️ SOME TESTS FAILED:`);
    results.forEach(r => {
      if (!r.success) {
        console.log(`❌ ${r.version}: ${r.error}`);
      }
    });
  }
  
  return summary;
}

// Run the optimized test suite
runOptimizedTestSuite().catch(console.error);
