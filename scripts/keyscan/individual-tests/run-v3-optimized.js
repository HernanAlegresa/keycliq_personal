#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { V3TestingSuiteOptimized } from './v3-testing-suite-optimized.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class V3OptimizedTestRunner {
  constructor() {
    this.baseOutputPath = path.join(__dirname, '../../../tests/results/individual-tests/v3');
    this.testSuite = new V3TestingSuiteOptimized();
  }

  async runOptimizedTest(testNumber = 1) {
    console.log(`🚀 Iniciando Test Individual Optimizado V3`);
    console.log(`📁 Output: tests/results/individual-tests/v3/${testNumber}/`);
    
    try {
      // Crear directorio de resultados
      const testPath = path.join(this.baseOutputPath, `test-${testNumber}`);
      await fs.promises.mkdir(testPath, { recursive: true });

      // Generar semilla única
      const seed = Date.now();
      console.log(`🎲 Seed: ${seed}`);

      const startTime = Date.now();
      
      // Ejecutar test
      const results = await this.testSuite.runOptimizedTest(seed);
      
      const executionTime = Date.now() - startTime;
      
      // Generar reporte HTML
      const htmlReport = await this.generateHTMLReport(results, testNumber, seed, executionTime);
      const htmlPath = path.join(testPath, 'test-report.html');
      await fs.promises.writeFile(htmlPath, htmlReport);
      
      // Guardar datos JSON
      const jsonData = {
        testNumber,
        datasetType: 'optimized',
        seed,
        executionTime,
        timestamp: new Date().toISOString(),
        ...results
      };
      
      const jsonPath = path.join(testPath, 'test-results.json');
      await fs.promises.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
      
      console.log(`✅ Test completado en ${(executionTime / 1000).toFixed(1)}s`);
      console.log(`📊 Accuracy: ${results.analysis.global.accuracy.toFixed(1)}%`);
      console.log(`📄 Reporte: ${htmlPath}`);
      console.log(`📊 Datos: ${jsonPath}`);
      
      // Mostrar resumen por tipo
      console.log(`\n📋 Resumen por tipo:`);
      Object.entries(results.analysis.byCaseType).forEach(([type, stats]) => {
        console.log(`   ${type}: ${stats.correct}/${stats.total} (${stats.accuracy.toFixed(1)}%)`);
      });
      
      return results;
      
    } catch (error) {
      console.error(`❌ Error en test:`, error.message);
      throw error;
    }
  }

  /**
   * Generar reporte HTML completo
   */
  async generateHTMLReport(result, testNumber, seed, executionTime) {
    const { analysis, comparisons, configuration } = result;
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KeyScan V3 - Test Individual Optimizado ${testNumber}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            color: #667eea;
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
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .comparison {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
            background: white;
        }
        .comparison-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .comparison-number {
            font-weight: bold;
            color: #667eea;
            font-size: 1.1em;
        }
        .comparison-type {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        .comparison-content {
            display: grid;
            grid-template-columns: 1fr 1fr 300px;
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
        .thumbnail {
            max-width: 150px;
            max-height: 100px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .image-path {
            font-size: 0.7em;
            color: #666;
            word-break: break-all;
            margin-top: 8px;
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
        .match-correct {
            color: #28a745;
        }
        .match-incorrect {
            color: #dc3545;
        }
        .match-error {
            color: #ffc107;
        }
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }
        .type-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .type-stat {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .type-stat h4 {
            margin: 0 0 15px;
            color: #333;
        }
        .accuracy-big {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
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
            <h1>🔍 KeyScan V3 - Test Individual Optimizado</h1>
            <p>Test ${testNumber} • Seed: ${seed} • ${new Date().toLocaleString()}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${analysis.global.accuracy.toFixed(1)}%</div>
                <div class="stat-label">Accuracy Global</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysis.global.totalCorrect}/${analysis.global.totalTests}</div>
                <div class="stat-label">Tests Correctos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${(executionTime / 1000).toFixed(1)}s</div>
                <div class="stat-label">Tiempo Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${configuration.availableKeys}</div>
                <div class="stat-label">Llaves Inventario</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Análisis por Tipo de Caso</h2>
            <div class="type-stats">
                ${Object.entries(analysis.byCaseType).map(([type, stats]) => `
                <div class="type-stat">
                    <h4>${type.replace(/_/g, ' ')}</h4>
                    <div class="accuracy-big">${stats.accuracy.toFixed(1)}%</div>
                    <div class="result-row">
                        <span class="result-label">Correctos:</span>
                        <span class="result-value">${stats.correct}/${stats.total}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Similaridad Media:</span>
                        <span class="result-value">${stats.medianSimilarity.toFixed(3)}</span>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🔍 Comparaciones Detalladas</h2>
            ${comparisons.map(comp => `
            <div class="comparison">
                <div class="comparison-header">
                    <div class="comparison-number">Comparación ${comp.comparison}</div>
                    <div class="comparison-type">${comp.caseType.replace(/_/g, ' ')}</div>
                </div>
                <div class="comparison-content">
                    <div class="image-section">
                        <h4>Inventory</h4>
                        ${comp.inventoryThumbnail ? `<img src="${comp.inventoryThumbnail}" class="thumbnail" alt="Inventory">` : '<div class="thumbnail">No thumbnail</div>'}
                        <div class="image-path">${path.basename(comp.inventoryImagePath)}</div>
                        <div style="margin-top: 8px; font-size: 0.8em; color: #666;">${comp.inventoryKeyId}</div>
                    </div>
                    <div class="image-section">
                        <h4>Query</h4>
                        ${comp.queryThumbnail ? `<img src="${comp.queryThumbnail}" class="thumbnail" alt="Query">` : '<div class="thumbnail">No thumbnail</div>'}
                        <div class="image-path">${path.basename(comp.queryImagePath)}</div>
                        <div style="margin-top: 8px; font-size: 0.8em; color: #666;">${comp.queryKeyId}</div>
                    </div>
                    <div class="results-section">
                        <div class="result-row">
                            <span class="result-label">Esperado:</span>
                            <span class="result-value">${comp.expected}</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Resultado:</span>
                            <span class="result-value ${comp.isCorrect ? 'match-correct' : (comp.actual === 'ERROR' ? 'match-error' : 'match-incorrect')}">
                                ${comp.actual}
                            </span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Correcto:</span>
                            <span class="result-value ${comp.isCorrect ? 'match-correct' : 'match-incorrect'}">
                                ${comp.isCorrect ? '✅' : '❌'}
                            </span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Similaridad:</span>
                            <span class="result-value">${(comp.similarity * 100).toFixed(1)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Confianza:</span>
                            <span class="result-value">${comp.confidence.toFixed(1)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Bitting Sim:</span>
                            <span class="result-value">${(comp.bittingSimilarity * 100).toFixed(1)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Shape Sim:</span>
                            <span class="result-value">${(comp.shapeSimilarity * 100).toFixed(1)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Edge Sim:</span>
                            <span class="result-value">${(comp.edgeSimilarity * 100).toFixed(1)}%</span>
                        </div>
                        ${comp.error ? `
                        <div class="result-row" style="color: #dc3545;">
                            <span class="result-label">Error:</span>
                            <span class="result-value">${comp.error}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>KeyScan V3 - Test Individual Optimizado | Generado el ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new V3OptimizedTestRunner();
  const testNumber = process.argv[2] ? parseInt(process.argv[2]) : 1;
  
  runner.runOptimizedTest(testNumber)
    .then(() => {
      console.log('\n🎉 Test completado exitosamente!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Error ejecutando test:', error);
      process.exit(1);
    });
}

export { V3OptimizedTestRunner };
