#!/usr/bin/env node

/**
 * KeyScan V5 Test Runner
 * Final 24-key test (12 same-key-different-image + 12 different-key)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { V5TestingSuiteCorrected } from './testing-suite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class V5TestRunner {
  constructor() {
    this.baseOutputDir = path.join(__dirname, '../../../tests/results/v5');
    this.testSuite = new V5TestingSuiteCorrected();
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

  async runTest() {
    const testNumber = this.getNextTestNumber();
    this.baseOutputPath = path.join(this.baseOutputDir, `test-${testNumber}`);
    
    console.log('🚀 Starting KeyScan V5 Test...');
    console.log('📋 Final 24-key test (12 same-key-different-image + 12 different-key)');
    console.log(`📁 Results will be saved in tests/results/v5/test-${testNumber}/`);
    console.log('🎲 Each test uses a random seed for different key combinations');
    
    try {
      await fs.promises.mkdir(this.baseOutputPath, { recursive: true });

      // Generate random seed for each test execution
      const randomSeed = Math.floor(Math.random() * 1000000);
      const results = await this.runSingleTest(randomSeed);

      console.log('\n🎉 V5 Test Completed Successfully!');
      console.log('\n📊 Final Results:');
      console.log(`   📈 Global Accuracy: ${results.analysis.global.accuracy.toFixed(1)}%`);
      if (results.analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE) {
        console.log(`   🔄 Same Key Different Image: ${results.analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE.accuracy.toFixed(1)}%`);
      }
      if (results.analysis.byCaseType.DIFFERENT_KEY) {
        console.log(`   ❌ Different Keys: ${results.analysis.byCaseType.DIFFERENT_KEY.accuracy.toFixed(1)}%`);
      }

      console.log(`\n📁 Report: ${path.join(this.baseOutputPath, 'test-report.html')}`);
      console.log(`📊 Data: ${path.join(this.baseOutputPath, 'test-results.json')}`);

      console.log('\n✅ V5 Testing completed successfully!');

    } catch (error) {
      console.error('❌ An error occurred during V5 testing:', error);
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
    const htmlReport = await this.generateHTMLReport(results, 'v5-final', seed, executionTime);
    const htmlPath = path.join(outputPath, 'test-report.html');
    await fs.promises.writeFile(htmlPath, htmlReport);
    
    // Save JSON data
    const jsonData = {
      version: 'v5',
      testNumber: this.getNextTestNumber(),
      datasetType: 'final-24-key-test',
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
    const { analysis, comparisons } = result;
    
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
    <title>KeyScan V5 Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em; }
        .content { padding: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #dc3545; }
        .metric-value { font-size: 2.5em; font-weight: bold; color: #dc3545; margin: 10px 0; }
        .metric-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .section { margin: 40px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px; }
        .comparison { background: #f8f9fa; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; }
        .comparison.incorrect { border-left-color: #dc3545; }
        .comparison-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .comparison-header h3 { margin: 0; color: #333; }
        .status-badge { padding: 5px 10px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .status-correct { background: #d4edda; color: #155724; }
        .status-incorrect { background: #f8d7da; color: #721c24; }
        .case-type { padding: 5px 10px; background: #e9ecef; color: #495057; border-radius: 4px; font-size: 0.8em; }
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 KeyScan V5 Test Report</h1>
            <p>Final 24-key test (12 same-key-different-image + 12 different-key) - Production Ready</p>
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
                    ${analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE ? `
                    <div class="metric-card">
                        <div class="metric-value">${analysis.byCaseType.SAME_KEY_DIFFERENT_IMAGE.accuracy.toFixed(1)}%</div>
                        <div class="metric-label">Same Key Different Image</div>
                    </div>` : ''}
                    ${analysis.byCaseType.DIFFERENT_KEY ? `
                    <div class="metric-card">
                        <div class="metric-value">${analysis.byCaseType.DIFFERENT_KEY.accuracy.toFixed(1)}%</div>
                        <div class="metric-label">Different Keys</div>
                    </div>` : ''}
                </div>
            </div>

            <div class="section">
                <h2>🔍 Test Configuration</h2>
                <div class="config-grid">
                    <div class="config-item">
                        <div class="label">Version</div>
                        <div class="value">V5 (Production)</div>
                    </div>
                    <div class="config-item">
                        <div class="label">Seed</div>
                        <div class="value">${seed}</div>
                    </div>
                    <div class="config-item">
                        <div class="label">Execution Time</div>
                        <div class="value">${(executionTime / 1000).toFixed(2)}s</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔍 Detailed Comparisons</h2>
                <p>Final production test with 24 comparisons: 12 same-key-different-image tests and 12 different-key tests.</p>
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
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('run-test.js')) {
  const runner = new V5TestRunner();
  runner.runTest();
}
