#!/usr/bin/env node

/**
 * KeyScan V4 Testing Suite - Clean Implementation
 * Professional testing system for V4 with complete HTML reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { V4TestingSuite } from './v4-testing-suite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class V4TestRunner {
  constructor() {
    this.baseOutputPath = path.join(__dirname, '../../../tests/results/v4');
    this.testSuite = new V4TestingSuite();
  }

  /**
   * Run all V4 tests
   */
  async runAllTests() {
    console.log('🚀 Starting KeyScan V4 Testing Suite...');
    console.log('📋 This will run comprehensive tests with professional HTML reports');
    console.log('📁 Results will be saved in tests/results/v4/');
    
    try {
      // Ensure output directory exists
      await fs.promises.mkdir(this.baseOutputPath, { recursive: true });

      const tests = [
        {
          name: 'Test 1',
          description: 'ORIGINAL Dataset Analysis',
          dataset: 'original',
          seed: 42,
          config: 'default'
        },
        {
          name: 'Test 2', 
          description: 'OPTIMIZED Dataset Analysis',
          dataset: 'optimized',
          seed: 123,
          config: 'default'
        },
        {
          name: 'Test 3',
          description: 'OPTIMIZED Dataset Analysis',
          dataset: 'optimized', 
          seed: 456,
          config: 'default'
        }
      ];

      const results = [];

      for (const test of tests) {
        console.log(`\n🔍 Running ${test.name}: ${test.description}`);
        
        const testResult = await this.runSingleTest(test);
        results.push(testResult);
        
        if (testResult.success) {
          console.log(`✅ ${test.name} completed successfully`);
          console.log(`📊 Accuracy: ${testResult.accuracy}%`);
          console.log(`📁 Report: tests/results/v4/${testResult.folder}/test-report.html`);
        } else {
          console.log(`❌ ${test.name} failed: ${testResult.error}`);
        }
      }

      // Generate summary
      this.generateSummary(results);
      
      return {
        success: results.every(r => r.success),
        results: results
      };

    } catch (error) {
      console.error('❌ Error running V4 tests:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run single test
   */
  async runSingleTest(testConfig) {
    try {
      const testFolder = `test-${testConfig.name.split(' ')[1]}`;
      const outputPath = path.join(this.baseOutputPath, testFolder);
      
      // Ensure test directory exists
      await fs.promises.mkdir(outputPath, { recursive: true });

      // Execute test
      const testResults = await this.testSuite.runTest(testConfig);
      
      // Generate JSON report
      const jsonPath = path.join(outputPath, 'test-results.json');
      await fs.promises.writeFile(jsonPath, JSON.stringify(testResults, null, 2));

      // Generate HTML report
      const htmlReport = this.generateHTMLReport(testResults, testConfig);
      const htmlPath = path.join(outputPath, 'test-report.html');
      await fs.promises.writeFile(htmlPath, htmlReport);

      return {
        success: true,
        name: testConfig.name,
        folder: testFolder,
        accuracy: testResults.summary.global.accuracy,
        results: testResults
      };

    } catch (error) {
      return {
        success: false,
        name: testConfig.name,
        error: error.message
      };
    }
  }

  /**
   * Generate summary
   */
  generateSummary(results) {
    console.log('\n📊 V4 Testing Summary:');
    console.log('='.repeat(50));
    
    results.forEach(result => {
      if (result.success) {
        console.log(`${result.name}: ✅ ${result.accuracy}% accuracy`);
      } else {
        console.log(`${result.name}: ❌ ${result.error}`);
      }
    });
    
    const successfulTests = results.filter(r => r.success);
    const avgAccuracy = successfulTests.length > 0 
      ? (successfulTests.reduce((sum, r) => sum + r.accuracy, 0) / successfulTests.length).toFixed(1)
      : 0;
    
    console.log(`\n🎯 Average Accuracy: ${avgAccuracy}%`);
    console.log(`📈 Successful Tests: ${successfulTests.length}/${results.length}`);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(testResults, testConfig) {
    const timestamp = new Date().toISOString();
    const datasetType = testConfig.dataset === 'original' ? 'ORIGINAL' : 'OPTIMIZED';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KeyScan V4 ${testConfig.name} - ${datasetType} Dataset</title>
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
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
            color: white; padding: 40px; text-align: center; 
        }
        
        .header h1 { font-size: 2.5em; font-weight: 300; margin-bottom: 10px; }
        .header .subtitle { font-size: 1.2em; opacity: 0.9; margin-bottom: 5px; }
        .header .timestamp { font-size: 0.9em; opacity: 0.7; }
        
        .test-explanation {
            background: #e8f5e8; padding: 30px; margin: 30px;
            border-radius: 12px; border-left: 5px solid #28a745;
        }
        
        .test-explanation h2 { color: #155724; margin-bottom: 15px; }
        .test-explanation p { color: #155724; margin-bottom: 10px; }
        .test-explanation ul { color: #155724; margin-left: 20px; }
        .test-explanation li { margin-bottom: 5px; }
        
        .metrics { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 25px; margin: 30px; 
        }
        
        .metric-card { 
            background: #f8f9fa; padding: 30px; border-radius: 12px; 
            border-left: 5px solid #28a745; transition: transform 0.2s;
        }
        
        .metric-card:hover { transform: translateY(-2px); }
        
        .metric-card h3 { color: #333; margin-bottom: 15px; font-size: 1.1em; }
        .metric-value { font-size: 2.5em; font-weight: 700; color: #28a745; margin-bottom: 5px; }
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
            margin-left: 10px; padding: 4px 8px; border-radius: 4px; 
            font-size: 0.7em; font-weight: 600; text-transform: uppercase;
        }
        
        .same-key-same-image { background: #e3f2fd; color: #1565c0; }
        .same-key-different-image { background: #fff3e0; color: #ef6c00; }
        .different-key { background: #fce4ec; color: #c2185b; }
        
        .comparison-body { padding: 25px; }
        
        .images { 
            display: grid; grid-template-columns: 1fr 1fr; 
            gap: 25px; margin-bottom: 25px; 
        }
        
        .image-container { text-align: center; }
        
        .image-container img { 
            max-width: 100%; height: 200px; object-fit: contain; 
            border: 2px solid #e9ecef; border-radius: 8px; 
            background: #f8f9fa; 
        }
        
        .image-label { 
            margin-top: 10px; font-weight: 600; color: #495057; 
            font-size: 0.9em; 
        }
        
        .metrics-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
        }
        
        .metric-item { 
            background: #f8f9fa; padding: 15px; border-radius: 8px; 
            text-align: center; 
        }
        
        .metric-item .label { 
            font-size: 0.8em; color: #6c757d; font-weight: 600; 
            text-transform: uppercase; margin-bottom: 5px; 
        }
        
        .metric-item .value { 
            font-size: 1.2em; font-weight: 700; color: #333; 
        }
        
        @media (max-width: 768px) {
            .images { grid-template-columns: 1fr; }
            .metrics-grid { grid-template-columns: repeat(3, 1fr); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 KeyScan V4 ${testConfig.name}</h1>
            <div class="subtitle">${datasetType} Dataset Analysis</div>
            <div class="timestamp">Generated: ${timestamp}</div>
        </div>
        
        <div class="test-explanation">
            <h2>📋 Test Methodology</h2>
            <p><strong>KeyScan V4 Performance Evaluation</strong></p>
            <p>This test evaluates KeyScan V4 algorithm performance using a comprehensive comparison methodology:</p>
            <ul>
                <li><strong>Dataset:</strong> ${testConfig.dataset === 'original' ? 'Original dataset with multiple images per key' : 'Optimized dataset with standardized orientation (handle left, tip right, teeth up)'}</li>
                <li><strong>Test Cases:</strong> 20 key comparisons covering different scenarios</li>
                <li><strong>Case Types:</strong> Same key same image (5 cases), Same key different image (5 cases), Different keys (10 cases)</li>
                <li><strong>Algorithm:</strong> V4 with enhanced DTW, improved edge detection, and canonicalized shape matching</li>
                <li><strong>Evaluation:</strong> Accuracy measurement across all case types</li>
            </ul>
            <p><strong>Expected Performance:</strong> V4 should achieve better accuracy than V3, especially on different orientations and edge cases.</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card ${testResults.summary.global.accuracy >= 80 ? 'success' : testResults.summary.global.accuracy >= 60 ? 'warning' : 'danger'}">
                <h3>Global Accuracy</h3>
                <div class="metric-value">${testResults.summary.global.accuracy.toFixed(1)}%</div>
                <div class="metric-label">${testResults.summary.global.totalCorrect}/${testResults.summary.global.totalTests} correct</div>
            </div>
            <div class="metric-card ${testResults.summary.byCaseType['SAME_KEY_SAME_IMAGE']?.accuracy >= 90 ? 'success' : testResults.summary.byCaseType['SAME_KEY_SAME_IMAGE']?.accuracy >= 70 ? 'warning' : 'danger'}">
                <h3>Same Key, Same Image</h3>
                <div class="metric-value">${testResults.summary.byCaseType['SAME_KEY_SAME_IMAGE']?.accuracy.toFixed(1) || 0}%</div>
                <div class="metric-label">${testResults.summary.byCaseType['SAME_KEY_SAME_IMAGE']?.correct || 0}/${testResults.summary.byCaseType['SAME_KEY_SAME_IMAGE']?.total || 0} correct</div>
            </div>
            <div class="metric-card ${testResults.summary.byCaseType['SAME_KEY_DIFFERENT_IMAGE']?.accuracy >= 90 ? 'success' : testResults.summary.byCaseType['SAME_KEY_DIFFERENT_IMAGE']?.accuracy >= 70 ? 'warning' : 'danger'}">
                <h3>Same Key, Different Image</h3>
                <div class="metric-value">${testResults.summary.byCaseType['SAME_KEY_DIFFERENT_IMAGE']?.accuracy.toFixed(1) || 0}%</div>
                <div class="metric-label">${testResults.summary.byCaseType['SAME_KEY_DIFFERENT_IMAGE']?.correct || 0}/${testResults.summary.byCaseType['SAME_KEY_DIFFERENT_IMAGE']?.total || 0} correct</div>
            </div>
            <div class="metric-card ${testResults.summary.byCaseType['DIFFERENT_KEY']?.accuracy >= 90 ? 'success' : testResults.summary.byCaseType['DIFFERENT_KEY']?.accuracy >= 70 ? 'warning' : 'danger'}">
                <h3>Different Keys</h3>
                <div class="metric-value">${testResults.summary.byCaseType['DIFFERENT_KEY']?.accuracy.toFixed(1) || 0}%</div>
                <div class="metric-label">${testResults.summary.byCaseType['DIFFERENT_KEY']?.correct || 0}/${testResults.summary.byCaseType['DIFFERENT_KEY']?.total || 0} correct</div>
            </div>
        </div>
        
        <div class="config-section">
            <h3>⚙️ V4 Configuration</h3>
            <div class="config-grid">
                <div class="config-item">
                    <div class="label">Match Threshold</div>
                    <div class="value">0.85</div>
                </div>
                <div class="config-item">
                    <div class="label">Possible Threshold</div>
                    <div class="value">0.70</div>
                </div>
                <div class="config-item">
                    <div class="label">Delta Threshold</div>
                    <div class="value">0.12</div>
                </div>
                <div class="config-item">
                    <div class="label">Bitting Weight</div>
                    <div class="value">0.75</div>
                </div>
                <div class="config-item">
                    <div class="label">Edge Weight</div>
                    <div class="value">0.15</div>
                </div>
                <div class="config-item">
                    <div class="label">Shape Weight</div>
                    <div class="value">0.10</div>
                </div>
                <div class="config-item">
                    <div class="label">Shape Veto</div>
                    <div class="value">Enabled (Soft)</div>
                </div>
                <div class="config-item">
                    <div class="label">DTW Band %</div>
                    <div class="value">15%</div>
                </div>
                <div class="config-item">
                    <div class="label">Execution Time</div>
                    <div class="value">${testResults.executionTime.toFixed(1)}s</div>
                </div>
            </div>
        </div>
        
        <div class="comparisons-section">
            <h2>🔍 Detailed Comparisons</h2>
            ${this.generateComparisonsHTML(testResults.comparisons)}
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate comparisons HTML
   */
  generateComparisonsHTML(comparisons) {
    return comparisons.map(comparison => {
      const caseTypeClass = comparison.caseType.toLowerCase().replace(/_/g, '-');
      
      return `
        <div class="comparison">
            <div class="comparison-header">
                <h3>Comparison ${comparison.comparison}</h3>
                <div>
                    <span class="status-badge ${comparison.isCorrect ? 'status-correct' : 'status-incorrect'}">${comparison.isCorrect ? '✅ Correct' : '❌ Incorrect'}</span>
                    <span class="case-type ${caseTypeClass}">${comparison.caseType}</span>
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
  const runner = new V4TestRunner();
  const result = await runner.runAllTests();
  
  if (result.success) {
    console.log('\n✅ V4 Testing Suite completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ V4 Testing Suite failed!');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('run-v4-tests.js')) {
  main();
}
