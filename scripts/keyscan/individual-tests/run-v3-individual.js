#!/usr/bin/env node

/**
 * KeyScan V3 Corrected Test - Real Inventory Testing
 * Tests with proper inventory of 30 keys and single query per test
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { V3TestingSuiteCorrected } from './v3-testing-suite-individual.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class V3CorrectedTestRunner {
  constructor() {
    this.baseOutputDir = path.join(__dirname, '../../../tests/results/individual-tests/v3');
    this.testSuite = new V3TestingSuiteCorrected();
  }

  /**
   * Get the next available test number
   */
  getNextTestNumber() {
    if (!fs.existsSync(this.baseOutputDir)) {
      return 1;
    }
    
    const existingTests = fs.readdirSync(this.baseOutputDir)
      .filter(item => item.startsWith('test-'))
      .map(item => parseInt(item.replace('test-', '')))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    
    return existingTests.length > 0 ? Math.max(...existingTests) + 1 : 1;
  }

  async runCorrectedTest() {
    const testNumber = this.getNextTestNumber();
    this.baseOutputPath = path.join(this.baseOutputDir, `test-${testNumber}`);
    
    console.log('🚀 Starting KeyScan V3 Individual Test...');
    console.log('📋 Real inventory testing with proper same-key-different-image cases');
    console.log(`📁 Results will be saved in tests/results/individual-tests/v3/test-${testNumber}/`);
    console.log('🎲 Each test uses a random seed for different key combinations');
    
    try {
      await fs.promises.mkdir(this.baseOutputPath, { recursive: true });

      // Generate random seed for each test execution
      const randomSeed = Math.floor(Math.random() * 1000000);
      const results = await this.runSingleTest(randomSeed);

      console.log('\n🎉 V3 Corrected Test Completed Successfully!');
      console.log('\n📊 Final Results:');
      console.log(`   📈 Global Accuracy: ${results.analysis.global.accuracy.toFixed(1)}%`);
      console.log(`   ✅ Same Key Same Image: ${results.analysis.byCaseType.SAME_KEY_SAME_IMAGE.accuracy.toFixed(1)}%`);
      console.log(`   🔄 Same Key Different Image: ${results.analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE.accuracy.toFixed(1)}%`);
      console.log(`   ❌ Different Keys: ${results.analysis.byCaseType.DIFFERENT_KEY.accuracy.toFixed(1)}%`);

      console.log(`\n📁 Report: ${path.join(this.baseOutputPath, 'test-report.html')}`);
      console.log(`📊 Data: ${path.join(this.baseOutputPath, 'test-results.json')}`);

      console.log('\n✅ V3 Corrected Testing completed successfully!');

    } catch (error) {
      console.error('❌ An error occurred during V3 corrected testing:', error);
      process.exit(1);
    }
  }

  async runSingleTest(seed) {
    const outputPath = this.baseOutputPath;
    await fs.promises.mkdir(outputPath, { recursive: true });

    const startTime = Date.now();
    const results = await this.testSuite.runCorrectedTest(seed);
    const executionTime = Date.now() - startTime;
    
    // Generate HTML report
    const htmlReport = await this.generateHTMLReport(results, 'corrected', seed, executionTime);
    const htmlPath = path.join(outputPath, 'test-report.html');
    await fs.promises.writeFile(htmlPath, htmlReport);
    
    // Save JSON data
    const jsonData = {
      testNumber: 1,
      datasetType: 'corrected',
      seed,
      executionTime,
      timestamp: new Date().toISOString(),
      ...results
    };
    const jsonPath = path.join(outputPath, 'test-results.json');
    await fs.promises.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
    
    console.log(`   📊 Accuracy: ${results.analysis.global.accuracy.toFixed(1)}%`);
    console.log(`   📁 Report: ${htmlPath}`);
    console.log(`   📊 Data: ${jsonPath}`);
    
    return results;
  }

  /**
   * Generate comprehensive HTML report
   */
  async generateHTMLReport(result, datasetType, seed, executionTime) {
    const { analysis, comparisons, configuration } = result;
    const timestamp = new Date().toISOString();
    
    // Generate detailed comparisons HTML
    let comparisonsHTML = '';
    for (let i = 0; i < comparisons.length; i++) {
      const comparison = comparisons[i];
      const statusClass = comparison.isCorrect ? 'status-correct' : 'status-incorrect';
      const statusIcon = comparison.isCorrect ? '✅' : '❌';
      const caseTypeClass = comparison.caseType.toLowerCase().replace(/_/g, '-');
      
      // Create thumbnails for images
      const queryThumbnail = await this.createThumbnail(comparison.queryImagePath);
      const inventoryThumbnail = await this.createThumbnail(comparison.inventoryImagePath);
      
      comparisonsHTML += `
        <div class="comparison">
            <div class="comparison-header">
                <h3>Comparison ${i + 1}</h3>
                <div>
                    <span class="status-badge ${statusClass}">${statusIcon} ${comparison.isCorrect ? 'Correct' : 'Incorrect'}</span>
                    <span class="case-type ${caseTypeClass}">${comparison.caseType}</span>
                </div>
            </div>
            <div class="comparison-body">
                <div class="images">
                    <div class="image-container">
                        <img src="${queryThumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4='}" alt="Query Key">
                        <div class="image-label">Query: ${comparison.queryKeyId}</div>
                    </div>
                    <div class="image-container">
                        <img src="${inventoryThumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4='}" alt="Inventory Key">
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
                        <div class="value">${comparison.similarity ? comparison.similarity.toFixed(3) : 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KeyScan V3 Individual Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em; }
        .content { padding: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
        .metric-value { font-size: 2.5em; font-weight: bold; color: #667eea; margin: 10px 0; }
        .metric-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .section { margin: 40px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .comparison { background: #f8f9fa; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; }
        .comparison.incorrect { border-left-color: #dc3545; }
        .comparison-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .comparison-header h3 { margin: 0; color: #333; }
        .status-badge { padding: 5px 10px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .status-correct { background: #d4edda; color: #155724; }
        .status-incorrect { background: #f8d7da; color: #721c24; }
        .case-type { padding: 5px 10px; background: #e9ecef; color: #495057; border-radius: 4px; font-size: 0.8em; }
        .same-key-same-image { background: #d1ecf1; color: #0c5460; }
        .same-key-different-image { background: #fff3cd; color: #856404; }
        .different-key { background: #f8d7da; color: #721c24; }
        .images { display: flex; gap: 20px; margin: 15px 0; }
        .image-container { flex: 1; text-align: center; }
        .image-container img { max-width: 200px; max-height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .image-label { margin-top: 8px; font-size: 0.9em; color: #666; }
        .metrics-grid-small { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 15px 0; }
        .metric-item { background: white; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-item .label { font-size: 0.8em; color: #666; margin-bottom: 5px; }
        .metric-item .value { font-size: 1.2em; font-weight: bold; }
        .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .config-item { background: white; padding: 15px; border-radius: 6px; text-align: center; }
        .config-item .label { font-size: 0.8em; color: #666; margin-bottom: 5px; }
        .config-item .value { font-size: 1.1em; font-weight: bold; color: #333; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 KeyScan V3 Individual Test Report</h1>
            <p>Real inventory testing with proper same-key-different-image cases</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Test Summary</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${analysis.global.accuracy.toFixed(1)}%</div>
                        <div class="metric-label">Global Accuracy</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analysis.global.totalTests}</div>
                        <div class="metric-label">Total Tests</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analysis.global.totalCorrect}</div>
                        <div class="metric-label">Correct Results</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${(executionTime / 1000).toFixed(1)}s</div>
                        <div class="metric-label">Execution Time</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🎯 Performance by Case Type</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${analysis.byCaseType.SAME_KEY_SAME_IMAGE.accuracy.toFixed(1)}%</div>
                        <div class="metric-label">Same Key Same Image</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE.accuracy.toFixed(1)}%</div>
                        <div class="metric-label">Same Key Different Image</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analysis.byCaseType.DIFFERENT_KEY.accuracy.toFixed(1)}%</div>
                        <div class="metric-label">Different Keys</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🔍 Test Configuration</h2>
                <div class="config-grid">
                    <div class="config-item">
                        <div class="label">Dataset</div>
                        <div class="value">${datasetType.toUpperCase()}</div>
                    </div>
                    <div class="config-item">
                        <div class="label">Seed</div>
                        <div class="value">${seed}</div>
                    </div>
                    <div class="config-item">
                        <div class="label">Execution Time</div>
                        <div class="value">${(executionTime / 1000).toFixed(2)}s</div>
                    </div>
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
                </div>
            </div>
            
            <div class="section">
                <h2>🔍 Detailed Comparisons</h2>
                <p>This test uses a corrected approach: optimized images for queries, original dataset images for "same key different image" cases, and proper inventory testing.</p>
                ${comparisonsHTML}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Create thumbnail for HTML display
   */
  async createThumbnail(imagePath) {
    try {
      const sharp = (await import('sharp')).default;
      const buffer = await sharp(imagePath)
        .resize(250, 150, { fit: 'inside' })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error(`Error creating thumbnail for ${imagePath}:`, error.message);
      return null;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('run-v3-individual.js')) {
  const runner = new V3CorrectedTestRunner();
  runner.runCorrectedTest();
}
