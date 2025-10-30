// Script real de tests V5 ModelAI con dataset optimizado
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar funciones V5 reales
import { analyzeKeyWithV5AI, compareV5KeySignatures, makeV5Decision } from '../../../app/lib/ai/v5/multimodal-keyscan-v5.server.js';

// Configuración del dataset optimizado
const DATASET_PATH = path.join(__dirname, '../../keys-optimized');
const OUTPUT_PATH = path.join(__dirname, 'html-reports');

// Asegurar que el directorio de salida existe
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

// Función para obtener todas las imágenes disponibles
function getAllImages() {
  const images = [];
  const categories = ['heavy', 'lockbox', 'regular'];
  
  for (const category of categories) {
    const categoryPath = path.join(DATASET_PATH, category);
    if (fs.existsSync(categoryPath)) {
      const keyFolders = fs.readdirSync(categoryPath);
      
      for (const keyFolder of keyFolders) {
        const keyPath = path.join(categoryPath, keyFolder);
        const files = fs.readdirSync(keyPath);
        
        for (const file of files) {
          if (file.endsWith('.jpg') || file.endsWith('.png')) {
            images.push({
              category,
              keyId: keyFolder,
              filename: file,
              fullPath: path.join(keyPath, file),
              imageType: file.includes('aligned') ? 'aligned' : 'generated'
            });
          }
        }
      }
    }
  }
  
  return images;
}

// Función para analizar una imagen con V5 ModelAI
async function analyzeImage(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    const result = await analyzeKeyWithV5AI(imageBuffer, mimeType);
    return result;
  } catch (error) {
    console.error(`Error analizando imagen ${imagePath}:`, error);
    return null;
  }
}

// Función para generar datos de test
function generateTestData(images) {
  console.log('🎲 Generating test data...');
  
  // Separar imágenes por tipo
  const alignedImages = images.filter(img => img.imageType === 'aligned');
  const generatedImages = images.filter(img => img.imageType === 'generated');
  
  console.log(`📊 Aligned images: ${alignedImages.length}`);
  console.log(`📊 Generated images: ${generatedImages.length}`);
  
  // Test 1: Query IN inventory (same key, different image)
  // Buscar una llave que tenga tanto aligned como generated
  const keysWithBothTypes = {};
  alignedImages.forEach(img => {
    if (!keysWithBothTypes[img.keyId]) {
      keysWithBothTypes[img.keyId] = { aligned: null, generated: null };
    }
    keysWithBothTypes[img.keyId].aligned = img;
  });
  
  generatedImages.forEach(img => {
    if (keysWithBothTypes[img.keyId]) {
      keysWithBothTypes[img.keyId].generated = img;
    }
  });
  
  // Encontrar una llave que tenga ambos tipos
  const availableKeys = Object.keys(keysWithBothTypes).filter(keyId => 
    keysWithBothTypes[keyId].aligned && keysWithBothTypes[keyId].generated
  );
  
  if (availableKeys.length === 0) {
    throw new Error('No keys found with both aligned and generated images');
  }
  
  // Seleccionar aleatoriamente una llave que tenga ambos tipos
  const selectedKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
  const test1Query = keysWithBothTypes[selectedKey].aligned; // Query aligned
  const test1Inventory = [
    keysWithBothTypes[selectedKey].generated, // Same key, generated image
    ...alignedImages.filter(img => img.keyId !== selectedKey).slice(0, 14) // 14 different keys
  ];
  
  // Test 2: Query NOT in inventory
  // Seleccionar aleatoriamente una llave generated que NO esté en el inventario del Test 1
  const test1KeyIds = test1Inventory.map(img => img.keyId);
  const availableForTest2 = generatedImages.filter(img => !test1KeyIds.includes(img.keyId));
  
  if (availableForTest2.length === 0) {
    throw new Error('No available generated keys for Test 2');
  }
  
  const test2Query = availableForTest2[Math.floor(Math.random() * availableForTest2.length)];
  const test2Inventory = alignedImages.filter(img => 
    img.keyId !== test2Query.keyId
  ).slice(0, 15);
  
  console.log(`✅ Test 1 - Query: ${test1Query.filename} (${test1Query.keyId})`);
  console.log(`✅ Test 1 - Inventory: ${test1Inventory.length} keys`);
  console.log(`✅ Test 2 - Query: ${test2Query.filename} (${test2Query.keyId})`);
  console.log(`✅ Test 2 - Inventory: ${test2Inventory.length} keys`);
  
  return {
    test1: { query: test1Query, inventory: test1Inventory },
    test2: { query: test2Query, inventory: test2Inventory }
  };
}

// Función para ejecutar un test completo
async function executeTest(testData, testNumber) {
  console.log(`\n🔍 Executing Test ${testNumber}...`);
  
  // Analizar query
  console.log(`📸 Analyzing query: ${testData.query.filename}`);
  const querySignature = await analyzeImage(testData.query.fullPath);
  
  if (!querySignature) {
    throw new Error(`Could not analyze query image: ${testData.query.filename}`);
  }
  
  // Analizar inventario - asegurar exactamente 15 llaves
  console.log(`📸 Analyzing inventory (${testData.inventory.length} keys)...`);
  const inventorySignatures = [];
  
  for (const [index, image] of testData.inventory.entries()) {
    console.log(`  ${index + 1}/15: ${image.filename}`);
    const signature = await analyzeImage(image.fullPath);
    
    if (signature) {
      inventorySignatures.push({
        image,
        signature
      });
    } else {
      console.warn(`⚠️  Failed to analyze ${image.filename}, skipping...`);
    }
  }
  
  // Verificar que tenemos exactamente 15 llaves analizadas
  if (inventorySignatures.length !== 15) {
    console.warn(`⚠️  Expected 15 keys, got ${inventorySignatures.length}. Test may be incomplete.`);
  }
  
  // Comparar query con inventario
  console.log(`🔄 Comparing query with inventory...`);
  const comparisons = [];
  
  for (const item of inventorySignatures) {
    const comparison = compareV5KeySignatures(querySignature, item.signature);
    comparisons.push({
      image: item.image,
      signature: item.signature,
      comparison
    });
  }
  
  // Ordenar por similitud
  comparisons.sort((a, b) => b.comparison.similarity - a.comparison.similarity);
  
  // Tomar decisión final
  const decision = makeV5Decision(comparisons.map(c => c.comparison));
  
  console.log(`✅ Test ${testNumber} completed: ${decision.type} (${comparisons.length} comparisons)`);
  
  return {
    query: {
      image: testData.query,
      signature: querySignature
    },
    inventory: inventorySignatures,
    comparisons,
    decision
  };
}

// Función para generar HTML de test
function generateTestHTML(testResult, testNumber, testType) {
  const { query, inventory, comparisons, decision } = testResult;
  
  // Determinar status del test según la nueva lógica
  let statusClass, statusText, statusIcon;
  
  if (testType === 'EN_INVENTARIO') {
    if (decision.type === 'MATCH_FOUND' && decision.matches.length === 1) {
      statusClass = 'status-perfect';
      statusText = 'Perfect';
      statusIcon = '✅';
    } else if (decision.type === 'MATCH_FOUND' && decision.matches.length > 1) {
      // Verificar si hay un match con 100% de similitud
      const perfectMatch = comparisons.find(c => c.comparison.similarity === 1.0);
      if (perfectMatch) {
        statusClass = 'status-good';
        statusText = 'Good';
        statusIcon = '⚙️';
      } else {
        statusClass = 'status-failed';
        statusText = 'Fail';
        statusIcon = '❌';
      }
    } else {
      statusClass = 'status-failed';
      statusText = 'Fail';
      statusIcon = '❌';
    }
  } else { // NO_EN_INVENTARIO
    if (decision.type === 'NO_MATCH') {
      statusClass = 'status-perfect';
      statusText = 'Perfect';
      statusIcon = '✅';
    } else {
      statusClass = 'status-failed';
      statusText = 'Fail';
      statusIcon = '❌';
    }
  }
  
  // Contar comparaciones exitosas
  const successfulComparisons = comparisons.filter(c => c.comparison.matchType === 'MATCH_FOUND').length;
  const totalComparisons = comparisons.length;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KeyScan B5 Model AI - Test ${testNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Open Sans', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #006209 0%, #004d07 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 98, 9, 0.3);
        }

        .header h1 {
            font-family: 'Raleway', sans-serif;
            font-weight: bold;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }

        .summary-section {
            background: white;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .summary-section h2 {
            font-family: 'Raleway', sans-serif;
            font-weight: bold;
            color: #006209;
            margin-bottom: 20px;
            font-size: 1.8rem;
        }

        .summary-boxes {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .summary-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #006209;
            text-align: center;
        }

        .summary-box h3 {
            font-family: 'Raleway', sans-serif;
            font-weight: bold;
            color: #006209;
            margin-bottom: 10px;
            font-size: 1.2rem;
        }

        .summary-box .value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-bottom: 20px;
        }

        .status-perfect {
            background: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
        }

        .status-good {
            background: #fff3cd;
            color: #856404;
            border: 2px solid #ffeaa7;
        }

        .status-failed {
            background: #f8d7da;
            color: #721c24;
            border: 2px solid #f5c6cb;
        }

        .query-section, .inventory-section, .results-section {
            background: white;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .query-section h3, .inventory-section h3, .results-section h3 {
            font-family: 'Raleway', sans-serif;
            font-weight: bold;
            color: #006209;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }

        .query-image {
            text-align: center;
            margin-bottom: 20px;
        }

        .query-image img {
            max-width: 300px;
            max-height: 200px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .inventory-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .inventory-item {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }

        .inventory-item img {
            width: 80px;
            height: 60px;
            object-fit: cover;
            border-radius: 5px;
            margin-bottom: 5px;
        }

        .inventory-item .key-id {
            font-size: 0.8rem;
            font-weight: bold;
            color: #006209;
        }

        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .results-table th,
        .results-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        .results-table th {
            background: #006209;
            color: white;
            font-weight: bold;
        }

        .results-table tr:nth-child(even) {
            background: #f8f9fa;
        }

        .similarity-cell {
            font-weight: bold;
            font-size: 1.1rem;
        }

        .similarity-perfect {
            color: #28a745;
        }

        .similarity-good {
            color: #ffc107;
        }

        .similarity-failed {
            color: #dc3545;
        }

        .match-type {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: bold;
        }

        .match-found {
            background: #d4edda;
            color: #155724;
        }

        .no-match {
            background: #f8d7da;
            color: #721c24;
        }

        .possible-keys {
            background: #fff3cd;
            color: #856404;
        }

        .navigation {
            text-align: center;
            margin-top: 30px;
        }

        .nav-button {
            display: inline-block;
            padding: 12px 24px;
            background: #006209;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            margin: 0 10px;
            transition: background 0.3s;
        }

        .nav-button:hover {
            background: #004d07;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>KeyScan B5 Model AI — Test #${testNumber}</h1>
            <div class="subtitle">${testType === 'EN_INVENTARIO' ? 'Key in Inventory' : 'Key not in Inventory'}</div>
        </div>

        <div class="summary-section">
            <h2>Summary of the Test</h2>
            <div class="summary-boxes">
                <div class="summary-box">
                    <h3>Comparisons</h3>
                    <div class="value">${successfulComparisons} of ${totalComparisons}</div>
                </div>
                <div class="summary-box">
                    <h3>Result Status</h3>
                    <div class="status-badge ${statusClass}">${statusIcon} ${statusText}</div>
                </div>
            </div>
        </div>

        <div class="query-section">
            <h3>Query Key</h3>
            <div class="query-image">
                <img src="data:image/jpeg;base64,${fs.readFileSync(query.image.fullPath).toString('base64')}" alt="Query Key">
                <p><strong>Image:</strong> ${query.image.filename}</p>
            </div>
        </div>

        <div class="inventory-section">
            <h3>Inventory Keys</h3>
            <div class="inventory-grid">
                ${inventory.map(item => `
                    <div class="inventory-item">
                        <img src="data:image/jpeg;base64,${fs.readFileSync(item.image.fullPath).toString('base64')}" 
                             alt="${item.image.filename}">
                        <div class="key-id">${item.image.keyId}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="results-section">
            <h3>Comparisons</h3>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Comparison</th>
                        <th>Key ID</th>
                        <th>Image</th>
                        <th>Similarity</th>
                        <th>Match Type</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${comparisons.map((comp, index) => {
                      const similarity = comp.comparison.similarity;
                      let similarityClass = 'similarity-failed';
                      if (similarity >= 0.95) similarityClass = 'similarity-perfect';
                      else if (similarity >= 0.8) similarityClass = 'similarity-good';
                      
                      let matchTypeClass = 'no-match';
                      let matchTypeText = 'NO_MATCH';
                      if (comp.comparison.matchType === 'MATCH_FOUND') {
                        matchTypeClass = 'match-found';
                        matchTypeText = 'MATCH_FOUND';
                      }
                      
                      return `
                        <tr>
                            <td><strong>Comparison ${index + 1}</strong></td>
                            <td><strong>${comp.image.keyId}</strong></td>
                            <td>
                                <img src="data:image/jpeg;base64,${fs.readFileSync(comp.image.fullPath).toString('base64')}" 
                                     alt="${comp.image.filename}" 
                                     style="width: 80px; height: 60px; object-fit: cover; border-radius: 5px;">
                                <br><small>${comp.image.filename}</small>
                            </td>
                            <td class="similarity-cell ${similarityClass}">${similarity.toFixed(3)}</td>
                            <td><span class="match-type ${matchTypeClass}">${matchTypeText}</span></td>
                            <td>
                                <strong>Parameters:</strong><br>
                                ${Object.entries(comp.comparison.details.parameterDetails).map(([param, detail]) => 
                                  `• ${param}: ${detail.reason} (${detail.similarity?.toFixed(2) || 'N/A'})`
                                ).join('<br>')}
                            </td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="navigation">
            <a href="index.html" class="nav-button">🏠 General Index</a>
            ${testNumber === 1 ? '<a href="test2-report.html" class="nav-button">➡️ Test 2</a>' : '<a href="test1-report.html" class="nav-button">⬅️ Test 1</a>'}
        </div>

        <div class="footer">
            <p>KeyScan B5 Model AI - Key Recognition System</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US')}</p>
        </div>
    </div>
</body>
</html>`;
  
  return html;
}

// Función principal
async function main() {
  try {
    console.log('🔑 KeyScan B5 Model AI - Real Tests with Optimized Dataset');
    console.log('=========================================================');
    
    // Verificar que el dataset existe
    if (!fs.existsSync(DATASET_PATH)) {
      throw new Error(`Dataset not found at: ${DATASET_PATH}`);
    }
    
    // Obtener todas las imágenes
    console.log('📁 Loading optimized dataset...');
    const images = getAllImages();
    console.log(`✅ Found ${images.length} images`);
    
    if (images.length === 0) {
      throw new Error('No images found in the optimized dataset');
    }
    
    // Generar datos de test
    const testData = generateTestData(images);
    
    // Ejecutar Test 1
    console.log('\n🚀 Starting Test 1...');
    const test1Result = await executeTest(testData.test1, 1);
    
    // Ejecutar Test 2
    console.log('\n🚀 Starting Test 2...');
    const test2Result = await executeTest(testData.test2, 2);
    
    // Generar HTMLs
    console.log('\n📝 Generating HTML reports...');
    
    const test1HTML = generateTestHTML(test1Result, 1, 'EN_INVENTARIO');
    const test2HTML = generateTestHTML(test2Result, 2, 'NO_EN_INVENTARIO');
    
    // Guardar archivos
    fs.writeFileSync(path.join(OUTPUT_PATH, 'test1-report.html'), test1HTML);
    fs.writeFileSync(path.join(OUTPUT_PATH, 'test2-report.html'), test2HTML);
    
    console.log('✅ HTML files generated successfully');
    console.log(`📁 Location: ${OUTPUT_PATH}`);
    
    // Mostrar resumen
    console.log('\n📈 TEST SUMMARY');
    console.log('===============');
    console.log(`Test 1 (Key in inventory): ${test1Result.decision.type}`);
    console.log(`  - Max similarity: ${test1Result.comparisons[0]?.comparison.similarity.toFixed(3) || 'N/A'}`);
    console.log(`  - Matches found: ${test1Result.decision.matches?.length || 0}`);
    console.log(`  - Comparisons: ${test1Result.comparisons.length}`);
    console.log(`Test 2 (Key not in inventory): ${test2Result.decision.type}`);
    console.log(`  - Max similarity: ${test2Result.comparisons[0]?.comparison.similarity.toFixed(3) || 'N/A'}`);
    console.log(`  - Matches found: ${test2Result.decision.matches?.length || 0}`);
    console.log(`  - Comparisons: ${test2Result.comparisons.length}`);
    
    // Evaluar resultados según la nueva lógica
    let test1Status, test2Status;
    
    if (test1Result.decision.type === 'MATCH_FOUND' && test1Result.decision.matches.length === 1) {
      test1Status = '✅ Perfect';
    } else if (test1Result.decision.type === 'MATCH_FOUND' && test1Result.decision.matches.length > 1) {
      const perfectMatch = test1Result.comparisons.find(c => c.comparison.similarity === 1.0);
      test1Status = perfectMatch ? '⚙️ Good' : '❌ Fail';
    } else {
      test1Status = '❌ Fail';
    }
    
    test2Status = test2Result.decision.type === 'NO_MATCH' ? '✅ Perfect' : '❌ Fail';
    
    console.log('\n🎯 FINAL EVALUATION');
    console.log('===================');
    console.log(`Test 1: ${test1Status}`);
    console.log(`Test 2: ${test2Status}`);
    
    console.log('\n🎉 Tests completed successfully!');
    console.log('\n📂 To view the results:');
    console.log(`   - Test 1: file://${path.resolve(OUTPUT_PATH, 'test1-report.html')}`);
    console.log(`   - Test 2: file://${path.resolve(OUTPUT_PATH, 'test2-report.html')}`);
    
  } catch (error) {
    console.error('❌ Error executing tests:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar
main();
