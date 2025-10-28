/**
 * V5 Debugging Test Script
 * Tests the debugging system with sample data
 */

import { analyzeKeyWithV5AI, compareV5KeySignatures, makeV5Decision } from '../app/lib/ai/v5/multimodal-keyscan-v5.server.js';
import { generateDebugReport, getRecentDebugLogs } from '../app/lib/debug/v5-debugging.server.js';

console.log('🔬 ===== V5 DEBUGGING TEST =====\n');

async function testDebuggingSystem() {
  try {
    // Test 1: AI Analysis with debugging
    console.log('📝 Test 1: AI Analysis with debugging...');
    
    // Create a mock image buffer (in real usage, this would be actual image data)
    const mockImageBuffer = Buffer.from('mock-image-data-for-testing');
    
    const analysisResult = await analyzeKeyWithV5AI(mockImageBuffer, 'image/jpeg');
    
    if (analysisResult.success) {
      console.log('✅ AI Analysis successful');
      console.log('🔍 Debug ID:', analysisResult.debugId);
      console.log('📊 Extracted signature:', analysisResult.signature);
    } else {
      console.log('❌ AI Analysis failed:', analysisResult.error);
    }

    // Test 2: Signature Comparison with debugging
    console.log('\n📝 Test 2: Signature Comparison with debugging...');
    
    const querySignature = {
      peak_count: 5,
      blade_profile: "single-sided",
      groove_count: 1,
      key_color: "brass",
      bow_shape: "rectangle",
      bowmark: false,
      bowcode: true,
      bow_size: "medium",
      surface_finish: false,
      confidence_score: 1
    };

    const inventorySignature = {
      peak_count: 5,
      blade_profile: "single-sided",
      groove_count: 1,
      key_color: "brass",
      bow_shape: "rectangle",
      bowmark: false,
      bowcode: true,
      bow_size: "large", // Different size
      surface_finish: false,
      confidence_score: 1
    };

    const comparisonResult = await compareV5KeySignatures(querySignature, inventorySignature);
    
    console.log('✅ Comparison completed');
    console.log('📊 Similarity:', comparisonResult.similarity);
    console.log('🎯 Match Type:', comparisonResult.matchType);

    // Test 3: Decision Making with debugging
    console.log('\n📝 Test 3: Decision Making with debugging...');
    
    const comparisons = [
      {
        keyId: 'test-key-1',
        similarity: 0.98,
        matchType: 'MATCH_FOUND',
        parameterDetails: {}
      },
      {
        keyId: 'test-key-2',
        similarity: 0.85,
        matchType: 'NO_MATCH',
        parameterDetails: {}
      }
    ];

    const decision = makeV5Decision(comparisons);
    
    console.log('✅ Decision completed');
    console.log('🎯 Decision Type:', decision.type);
    console.log('📝 Message:', decision.message);

    // Test 4: Debug Report Generation
    console.log('\n📝 Test 4: Debug Report Generation...');
    
    const report = await generateDebugReport();
    
    if (report.error) {
      console.log('❌ Report generation failed:', report.error);
    } else {
      console.log('✅ Debug report generated');
      console.log('📊 Total logs:', report.totalLogs);
      console.log('✅ Successful analyses:', report.successfulAnalyses);
      console.log('❌ Failed analyses:', report.failedAnalyses);
      
      if (report.parameterExtractionStats) {
        console.log('\n📈 Parameter Extraction Statistics:');
        Object.entries(report.parameterExtractionStats).forEach(([param, stats]) => {
          console.log(`  ${param}: ${stats.successRate}% success rate (${stats.nullValues}/${stats.total} null values)`);
        });
      }
    }

    // Test 5: Recent Logs Retrieval
    console.log('\n📝 Test 5: Recent Logs Retrieval...');
    
    const recentLogs = await getRecentDebugLogs(10);
    
    console.log(`✅ Retrieved ${recentLogs.length} recent logs`);
    
    if (recentLogs.length > 0) {
      console.log('\n📋 Recent Logs Summary:');
      recentLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.id} - ${log.step} - ${log.success ? 'Success' : 'Failed'}`);
      });
    }

    console.log('\n🎉 ===== DEBUGGING TEST COMPLETED =====');
    console.log('\n📁 Debug files saved to: debug/v5/');
    console.log('🌐 View debugging dashboard at: /debug/v5');
    console.log('🔗 API endpoint: /api/debug-v5?action=logs');

  } catch (error) {
    console.error('❌ Debugging test failed:', error);
  }
}

// Run the test
testDebuggingSystem();
