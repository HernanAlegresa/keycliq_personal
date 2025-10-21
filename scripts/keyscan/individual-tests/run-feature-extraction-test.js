#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { V3FeatureExtractionTest } from './v3-feature-extraction-test.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FeatureExtractionTestRunner {
  constructor() {
    this.baseOutputPath = path.join(__dirname, '../../../tests/results/individual-tests/v3');
    this.testSuite = new V3FeatureExtractionTest();
  }

  async runFeatureExtractionTest(testNumber = 'feature-extraction') {
    console.log(`🚀 Iniciando Test de Extracción de Features V3`);
    console.log(`📁 Output: tests/results/individual-tests/v3/${testNumber}/`);
    
    try {
      // Crear directorio de resultados
      const testPath = path.join(this.baseOutputPath, testNumber);
      await fs.promises.mkdir(testPath, { recursive: true });

      console.log(`🎯 Objetivo: Validar consistencia de extracción Same Key - Different Image`);

      const startTime = Date.now();
      
      // Ejecutar test
      const results = await this.testSuite.runCompleteTest();
      
      const executionTime = Date.now() - startTime;
      
      // Generar reporte HTML
      const htmlReport = this.generateHTMLReport(results, testNumber, executionTime);
      const htmlPath = path.join(testPath, 'feature-extraction-report.html');
      await fs.promises.writeFile(htmlPath, htmlReport);
      
      // Guardar datos JSON
      const jsonData = {
        testType: 'feature-extraction',
        testNumber,
        executionTime,
        timestamp: new Date().toISOString(),
        ...results
      };
      
      const jsonPath = path.join(testPath, 'feature-extraction-results.json');
      await fs.promises.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
      
      console.log(`\n✅ Test completado en ${(executionTime / 1000).toFixed(1)}s`);
      console.log(`📊 Llaves analizadas: ${results.summary.totalKeys}`);
      console.log(`✅ Exitosos: ${results.summary.successfulTests}`);
      console.log(`❌ Fallidos: ${results.summary.failedTests}`);
      
      if (results.analysis && results.analysis.overallSimilarity) {
        console.log(`\n📈 Estadísticas de Similaridad:`);
        console.log(`   Similaridad General: ${(results.analysis.overallSimilarity.mean * 100).toFixed(1)}% (mediana: ${(results.analysis.overallSimilarity.median * 100).toFixed(1)}%)`);
        console.log(`   Bitting Features: ${(results.analysis.bittingSimilarity.mean * 100).toFixed(1)}% (mediana: ${(results.analysis.bittingSimilarity.median * 100).toFixed(1)}%)`);
        console.log(`   Shape Features: ${(results.analysis.shapeSimilarity.mean * 100).toFixed(1)}% (mediana: ${(results.analysis.shapeSimilarity.median * 100).toFixed(1)}%)`);
      }
      
      console.log(`\n📄 Reporte: ${htmlPath}`);
      console.log(`📊 Datos: ${jsonPath}`);
      
      return results;
      
    } catch (error) {
      console.error(`❌ Error en test:`, error.message);
      throw error;
    }
  }

  /**
   * Generar reporte HTML detallado
   */
  generateHTMLReport(result, testNumber, executionTime) {
    const { summary, results, analysis } = result;
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KeyScan V3 - Feature Extraction Test</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #3498db;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .key-analysis {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
            background: white;
        }
        .key-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .key-id {
            font-weight: bold;
            color: #3498db;
            font-size: 1.2em;
        }
        .key-category {
            background: #3498db;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        .key-content {
            display: grid;
            grid-template-columns: 1fr 1fr 400px;
            gap: 20px;
            padding: 20px;
        }
        .image-section {
            text-align: center;
        }
        .image-section h4 {
            margin: 0 0 10px;
            color: #333;
            font-size: 0.9em;
        }
        .image-path {
            font-size: 0.7em;
            color: #666;
            word-break: break-all;
            margin-top: 8px;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
        }
        .results-section {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        .result-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 4px 0;
            border-bottom: 1px solid #eee;
        }
        .result-label {
            font-weight: 500;
            color: #555;
        }
        .result-value {
            font-weight: bold;
        }
        .similarity-high { color: #27ae60; }
        .similarity-medium { color: #f39c12; }
        .similarity-low { color: #e74c3c; }
        .analysis-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .analysis-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .analysis-card h4 {
            margin: 0 0 15px;
            color: #333;
        }
        .metric-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #3498db;
        }
        .prob-lem-key {
            border-left-color: #e74c3c !important;
            background: #fdf2f2 !important;
        }
        .footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔬 KeyScan V3 - Feature Extraction Test</h1>
            <p>Validación de Consistencia en Extracción de Features • ${testNumber} • ${new Date().toLocaleString()}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${summary.totalKeys}</div>
                <div class="stat-label">Llaves Analizadas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${summary.successfulTests}</div>
                <div class="stat-label">Tests Exitosos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${summary.failedTests}</div>
                <div class="stat-label">Tests Fallidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${(executionTime / 1000).toFixed(1)}s</div>
                <div class="stat-label">Tiempo Total</div>
            </div>
        </div>

        ${analysis && analysis.overallSimilarity ? `
        <div class="section">
            <h2>📊 Análisis de Consistencia General</h2>
            <div class="analysis-grid">
                <div class="analysis-card">
                    <h4>Similaridad General</h4>
                    <div class="metric-value">${(analysis.overallSimilarity.mean * 100).toFixed(1)}%</div>
                    <div>Rango: ${(analysis.overallSimilarity.min * 100).toFixed(1)}% - ${(analysis.overallSimilarity.max * 100).toFixed(1)}%</div>
                    <div>Mediana: ${(analysis.overallSimilarity.median * 100).toFixed(1)}%</div>
                </div>
                <div class="analysis-card">
                    <h4>Features Bitting</h4>
                    <div class="metric-value">${(analysis.bittingSimilarity.mean * 100).toFixed(1)}%</div>
                    <div>Rango: ${(analysis.bittingSimilarity.min * 100).toFixed(1)}% - ${(analysis.bittingSimilarity.max * 100).toFixed(1)}%</div>
                    <div>Mediana: ${(analysis.bittingSimilarity.median * 100).toFixed(1)}%</div>
                </div>
                <div class="analysis-card">
                    <h4>Features Shape</h4>
                    <div class="metric-value">${(analysis.shapeSimilarity.mean * 100).toFixed(1)}%</div>
                    <div>Rango: ${(analysis.shapeSimilarity.min * 100).toFixed(1)}% - ${(analysis.shapeSimilarity.max * 100).toFixed(1)}%</div>
                    <div>Mediana: ${(analysis.shapeSimilarity.median * 100).toFixed(1)}%</div>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>🔍 Análisis Detallado por Llave</h2>
            ${results.map(keyResult => {
              const similarity = keyResult.comparison?.similarity || 0;
              const similarityClass = similarity > 0.8 ? 'similarity-high' : 
                                    similarity > 0.6 ? 'similarity-medium' : 'similarity-low';
              const isProblemKey = similarity < 0.6;
              
              return `
            <div class="key-analysis ${isProblemKey ? 'prob-lem-key' : ''}">
                <div class="key-header">
                    <div class="key-id">${keyResult.keyId}</div>
                    <div class="key-category">${keyResult.category}</div>
                </div>
                <div class="key-content">
                    <div class="image-section">
                        <h4>Imagen Aligned</h4>
                        <div class="image-path">${path.basename(keyResult.alignedImagePath)}</div>
                        ${keyResult.features?.aligned ? `
                        <div style="margin-top: 10px; font-size: 0.8em;">
                            <div><strong>Bitting:</strong> ${keyResult.features.aligned.bitting.profileLength} puntos</div>
                            <div><strong>Shape:</strong> ${keyResult.features.aligned.shape.huMomentsCount} Hu moments</div>
                            <div><strong>Edge:</strong> ${keyResult.features.aligned.edge.count} features</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="image-section">
                        <h4>Imagen Generated</h4>
                        <div class="image-path">${path.basename(keyResult.generatedImagePath)}</div>
                        ${keyResult.features?.generated ? `
                        <div style="margin-top: 10px; font-size: 0.8em;">
                            <div><strong>Bitting:</strong> ${keyResult.features.generated.bitting.profileLength} puntos</div>
                            <div><strong>Shape:</strong> ${keyResult.features.generated.shape.huMomentsCount} Hu moments</div>
                            <div><strong>Edge:</strong> ${keyResult.features.generated.edge.count} features</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="results-section">
                        ${keyResult.error ? `
                        <div class="result-row" style="color: #e74c3c;">
                            <span class="result-label">Error:</span>
                            <span class="result-value">${keyResult.error}</span>
                        </div>
                        ` : ''}
                        ${keyResult.comparison ? `
                        <div class="result-row">
                            <span class="result-label">Similaridad General:</span>
                            <span class="result-value ${similarityClass}">${(similarity * 100).toFixed(1)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Match Status:</span>
                            <span class="result-value">${keyResult.comparison.matchStatus}</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Confianza:</span>
                            <span class="result-value">${keyResult.comparison.confidence.toFixed(1)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Bitting Similarity:</span>
                            <span class="result-value">${(keyResult.comparison.bittingSimilarity * 100).toFixed(1)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Shape Similarity:</span>
                            <span class="result-value">${(keyResult.comparison.shapeSimilarity * 100).toFixed(1)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Edge Similarity:</span>
                            <span class="result-value">${(keyResult.comparison.edgeSimilarity * 100).toFixed(1)}%</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            `}).join('')}
        </div>

        <div class="footer">
            <p>KeyScan V3 - Feature Extraction Test | Generado el ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new FeatureExtractionTestRunner();
  const testNumber = process.argv[2] || 'feature-extraction';
  
  runner.runFeatureExtractionTest(testNumber)
    .then(() => {
      console.log('\n🎉 Test de extracción de features completado exitosamente!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Error ejecutando test:', error);
      process.exit(1);
    });
}

export { FeatureExtractionTestRunner };
