#!/usr/bin/env node

/**
 * KeyScan V3 Testing Suite - Clean Implementation
 * Professional testing system for V3 with complete HTML reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { V3TestingSuite } from './v3-testing-suite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class V3TestRunner {
  constructor() {
    this.baseOutputPath = path.join(__dirname, '../../../tests/results/v3');
    this.testSuite = new V3TestingSuite();
  }

  /**
   * Run all V3 tests
   */
  async runAllTests() {
    console.log('🚀 Starting KeyScan V3 Testing Suite...');
    console.log('📋 This will run comprehensive tests with professional HTML reports');
    console.log('📁 Results will be saved in tests/results/v3/');
    
    try {
      // Ensure output directory exists
      await fs.promises.mkdir(this.baseOutputPath, { recursive: true });

      // Test 1: Original Dataset
      console.log('\n=== TEST 1: Original Dataset ===');
      const test1Result = await this.runTest(1, 'original', 42);
      
      // Test 2: Optimized Dataset  
      console.log('\n=== TEST 2: Optimized Dataset ===');
      const test2Result = await this.runTest(2, 'optimized', 123);
      
      // Test 3: Additional Validation
      console.log('\n=== TEST 3: Additional Validation ===');
      const test3Result = await this.runTest(3, 'optimized', 456);

      // Summary
      console.log('\n🎉 All V3 Tests Completed Successfully!');
      console.log('\n📊 Results Summary:');
      console.log(`   Test 1 (Original): ${test1Result.analysis?.global?.accuracy?.toFixed(1) || 'N/A'}% accuracy`);
      console.log(`   Test 2 (Optimized): ${test2Result.analysis?.global?.accuracy?.toFixed(1) || 'N/A'}% accuracy`);
      console.log(`   Test 3 (Validation): ${test3Result.analysis?.global?.accuracy?.toFixed(1) || 'N/A'}% accuracy`);
      
      console.log('\n📁 Results available in:');
      console.log('   📂 tests/results/v3/test-1/');
      console.log('   📂 tests/results/v3/test-2/');
      console.log('   📂 tests/results/v3/test-3/');

      return {
        success: true,
        tests: [test1Result, test2Result, test3Result]
      };

    } catch (error) {
      console.error('❌ Error running V3 tests:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run individual test
   */
  async runTest(testNumber, datasetType, seed) {
    console.log(`📋 Running Test ${testNumber} with ${datasetType} dataset (seed: ${seed})`);
    
    try {
      const startTime = Date.now();
      
      // Run the test
      const result = await this.testSuite.runTest(datasetType, seed);
      
      const executionTime = Date.now() - startTime;
      
      // Save results
      const testPath = path.join(this.baseOutputPath, `test-${testNumber}`);
      await fs.promises.mkdir(testPath, { recursive: true });
      
      // Generate HTML report
      const htmlReport = this.generateHTMLReport(result, testNumber, datasetType, seed, executionTime);
      const htmlPath = path.join(testPath, 'test-report.html');
      await fs.promises.writeFile(htmlPath, htmlReport);
      
      // Save JSON data
      const jsonData = {
        testNumber,
        datasetType,
        seed,
        executionTime,
        timestamp: new Date().toISOString(),
        ...result
      };
      const jsonPath = path.join(testPath, 'test-results.json');
      await fs.promises.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
      
      console.log(`   ✅ Test ${testNumber} completed in ${(executionTime / 1000).toFixed(1)}s`);
      console.log(`   📄 Report saved: ${htmlPath}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error in Test ${testNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive HTML report
   */
  generateHTMLReport(result, testNumber, datasetType, seed, executionTime) {
    const { analysis, comparisons, configuration } = result;
    const timestamp = new Date().toISOString();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KeyScan V3 Test ${testNumber} - ${datasetType.toUpperCase()} Dataset</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; color: #333; background: #f8f9fa; 
        }
        
        .container { 
            max-width: 1400px; margin: 0 auto; background: white; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        }
        
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; padding: 40px; text-align: center; 
        }
        
        .header h1 { font-size: 2.5em; font-weight: 300; margin-bottom: 10px; }
        .header .subtitle { font-size: 1.2em; opacity: 0.9; margin-bottom: 5px; }
        .header .timestamp { font-size: 0.9em; opacity: 0.7; }
        
        .test-explanation {
            background: #e3f2fd; padding: 30px; margin: 30px;
            border-radius: 12px; border-left: 5px solid #2196f3;
        }
        
        .test-explanation h2 { color: #1976d2; margin-bottom: 15px; }
        .test-explanation p { color: #1565c0; margin-bottom: 10px; }
        .test-explanation ul { color: #1565c0; margin-left: 20px; }
        .test-explanation li { margin-bottom: 5px; }
        
        .metrics { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 25px; margin: 30px; 
        }
        
        .metric-card { 
            background: #f8f9fa; padding: 30px; border-radius: 12px; 
            border-left: 5px solid #667eea; transition: transform 0.2s;
        }
        
        .metric-card:hover { transform: translateY(-2px); }
        
        .metric-card h3 { color: #333; margin-bottom: 15px; font-size: 1.1em; }
        .metric-value { font-size: 2.5em; font-weight: 700; color: #667eea; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        
        .success { border-left-color: #28a745; }
        .success .metric-value { color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .warning .metric-value { color: #ffc107; }
        .danger { border-left-color: #dc3545; }
        .danger .metric-value { color: #dc3545; }
        
        .config-section {
            background: #f8f9fa; padding: 30px; margin: 30px; border-radius: 12px;
        }
        
        .config-section h3 { color: #495057; margin-bottom: 20px; }
        .config-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
        }
        
        .config-item { 
            background: white; padding: 20px; border-radius: 8px; 
            border-left: 3px solid #28a745; 
        }
        
        .config-item .label { font-size: 0.9em; color: #6c757d; font-weight: 600; }
        .config-item .value { font-size: 1.1em; color: #212529; margin-top: 5px; font-family: monospace; }
        
        .comparisons-section { margin: 30px; }
        .comparisons-section h2 { color: #333; margin-bottom: 25px; }
        
        .comparison { 
            border: 1px solid #e9ecef; margin-bottom: 25px; border-radius: 12px; 
            overflow: hidden; background: white; 
        }
        
        .comparison-header { 
            background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; 
            display: flex; justify-content: space-between; align-items: center; 
        }
        
        .comparison-header h3 { color: #333; margin: 0; }
        
        .status-badge { 
            padding: 8px 16px; border-radius: 25px; font-size: 0.8em; font-weight: 600; 
        }
        
        .status-correct { background: #d4edda; color: #155724; }
        .status-incorrect { background: #f8d7da; color: #721c24; }
        
        .case-type { 
            padding: 6px 12px; border-radius: 6px; font-size: 0.7em; font-weight: 600; 
            text-transform: uppercase; letter-spacing: 0.5px; margin-left: 10px;
        }
        
        .same-key-same-image { background: #d4edda; color: #155724; }
        .same-key-different-image { background: #fff3cd; color: #856404; }
        .different-key { background: #f8d7da; color: #721c24; }
        
        .comparison-body { padding: 30px; }
        
        .images { 
            display: flex; gap: 40px; margin-bottom: 30px; justify-content: center; 
        }
        
        .image-container { text-align: center; }
        .image-container img { 
            max-width: 250px; max-height: 150px; border: 3px solid #e9ecef; 
            border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
        }
        
        .image-label { 
            font-size: 0.9em; color: #666; margin-top: 15px; font-weight: 500; 
        }
        
        .metrics-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
        }
        
        .metric-item { 
            background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; 
        }
        
        .metric-item .label { font-size: 0.8em; color: #666; text-transform: uppercase; font-weight: 600; }
        .metric-item .value { font-size: 1.4em; font-weight: 700; color: #333; margin-top: 8px; }
        
        .footer { 
            background: #343a40; color: white; padding: 25px; text-align: center; 
            font-size: 0.9em; 
        }
        
        @media (max-width: 768px) {
            .images { flex-direction: column; gap: 20px; }
            .metrics { grid-template-columns: 1fr; }
            .config-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 KeyScan V3 Test ${testNumber}</h1>
            <div class="subtitle">${datasetType.toUpperCase()} Dataset Analysis</div>
            <div class="timestamp">Generated: ${timestamp}</div>
        </div>
        
        <div class="test-explanation">
            <h2>📋 Test Methodology</h2>
            <p><strong>KeyScan V3 Performance Evaluation</strong></p>
            <p>This test evaluates KeyScan V3 algorithm performance using a comprehensive comparison methodology:</p>
            <ul>
                <li><strong>Dataset:</strong> ${datasetType === 'original' ? 'Original dataset with multiple images per key (front, back, angles)' : 'Optimized dataset with standardized orientation (handle left, tip right, teeth up)'}</li>
                <li><strong>Test Cases:</strong> 20 key comparisons covering different scenarios</li>
                <li><strong>Case Types:</strong> Same key same image (5 cases), Same key different image (5 cases), Different keys (10 cases)</li>
                <li><strong>Algorithm:</strong> V3 with DTW bitting analysis, edge detection, and shape matching</li>
                <li><strong>Evaluation:</strong> Accuracy measurement across all case types</li>
            </ul>
            <p><strong>Expected Performance:</strong> V3 should achieve high accuracy on identical images but may struggle with different orientations and different keys.</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card ${analysis.global.accuracy >= 80 ? 'success' : analysis.global.accuracy >= 60 ? 'warning' : 'danger'}">
                <h3>Global Accuracy</h3>
                <div class="metric-value">${analysis.global.accuracy.toFixed(1)}%</div>
                <div class="metric-label">${analysis.global.totalCorrect}/${analysis.global.totalTests} correct</div>
            </div>
            <div class="metric-card ${analysis.byCaseType.SAME_KEY_SAME_IMAGE.accuracy >= 95 ? 'success' : 'warning'}">
                <h3>Same Key, Same Image</h3>
                <div class="metric-value">${analysis.byCaseType.SAME_KEY_SAME_IMAGE.accuracy.toFixed(1)}%</div>
                <div class="metric-label">${analysis.byCaseType.SAME_KEY_SAME_IMAGE.correct}/${analysis.byCaseType.SAME_KEY_SAME_IMAGE.total} correct</div>
            </div>
            <div class="metric-card ${analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE.accuracy >= 70 ? 'success' : 'warning'}">
                <h3>Same Key, Different Image</h3>
                <div class="metric-value">${analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE.accuracy.toFixed(1)}%</div>
                <div class="metric-label">${analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE.correct}/${analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE.total} correct</div>
            </div>
            <div class="metric-card ${analysis.byCaseType.DIFFERENT_KEY.accuracy >= 80 ? 'success' : 'warning'}">
                <h3>Different Keys</h3>
                <div class="metric-value">${analysis.byCaseType.DIFFERENT_KEY.accuracy.toFixed(1)}%</div>
                <div class="metric-label">${analysis.byCaseType.DIFFERENT_KEY.correct}/${analysis.byCaseType.DIFFERENT_KEY.total} correct</div>
            </div>
        </div>
        
        <div class="config-section">
            <h3>⚙️ V3 Configuration</h3>
            <div class="config-grid">
                <div class="config-item">
                    <div class="label">Match Threshold</div>
                    <div class="value">${configuration.thresholds.T_match}</div>
                </div>
                <div class="config-item">
                    <div class="label">Possible Threshold</div>
                    <div class="value">${configuration.thresholds.T_possible}</div>
                </div>
                <div class="config-item">
                    <div class="label">Delta Threshold</div>
                    <div class="value">${configuration.thresholds.delta}</div>
                </div>
                <div class="config-item">
                    <div class="label">Bitting Weight</div>
                    <div class="value">${configuration.weights.bitting}</div>
                </div>
                <div class="config-item">
                    <div class="label">Edge Weight</div>
                    <div class="value">${configuration.weights.edge}</div>
                </div>
                <div class="config-item">
                    <div class="label">Shape Weight</div>
                    <div class="value">${configuration.weights.shape}</div>
                </div>
                <div class="config-item">
                    <div class="label">Shape Veto</div>
                    <div class="value">${configuration.shapeVeto.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div class="config-item">
                    <div class="label">Execution Time</div>
                    <div class="value">${(executionTime / 1000).toFixed(1)}s</div>
                </div>
            </div>
        </div>
        
        <div class="comparisons-section">
            <h2>🔍 Detailed Comparisons</h2>
            ${this.generateComparisonsHTML(comparisons)}
        </div>
        
        <div class="footer">
            <p>KeyScan V3 Testing Suite | Professional Analysis Report</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML for all comparisons
   */
  generateComparisonsHTML(comparisons) {
    return comparisons.map(comparison => {
      const caseTypeClass = comparison.caseType.toLowerCase().replace(/_/g, '-');
      const statusClass = comparison.isCorrect ? 'status-correct' : 'status-incorrect';
      const statusText = comparison.isCorrect ? '✅ Correct' : '❌ Incorrect';
      
      return `
        <div class="comparison">
            <div class="comparison-header">
                <h3>Comparison ${comparison.comparison}</h3>
                <div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span class="case-type ${caseTypeClass}">${comparison.caseType.replace(/_/g, ' ')}</span>
                </div>
            </div>
            <div class="comparison-body">
                <div class="images">
                    <div class="image-container">
                        <img src="${comparison.queryThumbnail}" alt="Query Key">
                        <div class="image-label">Query: ${comparison.queryKeyId}</div>
                    </div>
                    <div class="image-container">
                        <img src="${comparison.inventoryThumbnail}" alt="Inventory Key">
                        <div class="image-label">Inventory: ${comparison.inventoryKeyId}</div>
                    </div>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-item">
                        <div class="label">Expected</div>
                        <div class="value">${comparison.expected}</div>
                    </div>
                    <div class="metric-item">
                        <div class="label">Actual</div>
                        <div class="value" style="color: ${comparison.isCorrect ? '#28a745' : '#dc3545'};">${comparison.actual}</div>
                    </div>
                    <div class="metric-item">
                        <div class="label">Similarity</div>
                        <div class="value">${comparison.similarity.toFixed(3)}</div>
                    </div>
                </div>
            </div>
        </div>
      `;
    }).join('');
  }
}

async function main() {
  const runner = new V3TestRunner();
  const result = await runner.runAllTests();
  
  if (result.success) {
    console.log('\n✅ V3 Testing Suite completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ V3 Testing Suite failed!');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('run-v3-tests.js')) {
  main();
}

export { V3TestRunner };
