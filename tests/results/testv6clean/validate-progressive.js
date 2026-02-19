import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use OPENAI_API_KEY from environment only (no hardcoded secrets).
// Run with: OPENAI_API_KEY=sk-... node validate-progressive.js (or set in .env and load dotenv).
if (!process.env.OPENAI_API_KEY?.trim()) {
  console.error('OPENAI_API_KEY must be set in the environment. Do not commit secrets.');
  process.exit(1);
}
console.log('OPENAI_API_KEY configured:', true);

console.log('🔍 KeyCliq V6 Progressive Validation');
console.log('=====================================');

// PASO 1: Verificar acceso al dataset
async function step1_verifyDataset() {
  console.log('\n📂 PASO 1: Verificando acceso al dataset...');
  
  const datasetPath = path.resolve(__dirname, '../../../../keys-optimized');
  console.log(`Dataset path: ${datasetPath}`);
  console.log(`Exists: ${fs.existsSync(datasetPath)}`);
  
  if (!fs.existsSync(datasetPath)) {
    throw new Error('Dataset not found');
  }
  
  const regularPath = path.join(datasetPath, 'regular');
  const lockboxPath = path.join(datasetPath, 'lockbox');
  
  console.log(`Regular path exists: ${fs.existsSync(regularPath)}`);
  console.log(`Lockbox path exists: ${fs.existsSync(lockboxPath)}`);
  
  // Contar llaves disponibles
  let totalKeys = 0;
  const keys = [];
  
  ['regular', 'lockbox'].forEach(subdir => {
    const subdirPath = path.join(datasetPath, subdir);
    if (fs.existsSync(subdirPath)) {
      const items = fs.readdirSync(subdirPath, { withFileTypes: true });
      items.forEach(item => {
        if (item.isDirectory()) {
          const keyPath = path.join(subdir, item.name);
          const keyDir = path.join(datasetPath, keyPath);
          
          const files = fs.readdirSync(keyDir);
          const hasImages = files.some(file => 
            file.endsWith('.jpg') || file.endsWith('.png')
          );
          
          if (hasImages) {
            totalKeys++;
            keys.push({
              id: item.name,
              path: keyPath,
              fullPath: keyDir,
              images: files.filter(file => 
                file.endsWith('.jpg') || file.endsWith('.png')
              )
            });
          }
        }
      });
    }
  });
  
  console.log(`✅ Total keys found: ${totalKeys}`);
  console.log(`Sample keys: ${keys.slice(0, 5).map(k => k.id).join(', ')}`);
  
  return keys;
}

// PASO 2: Probar carga de imágenes
async function step2_testImageLoading(keys) {
  console.log('\n🖼️ PASO 2: Probando carga de imágenes...');
  
  // Seleccionar 3 llaves aleatorias
  const testKeys = keys.slice(0, 3);
  
  for (const key of testKeys) {
    console.log(`\nTesting key: ${key.id}`);
    console.log(`Available images: ${key.images.join(', ')}`);
    
    // Seleccionar una imagen aleatoria
    const alignedImages = key.images.filter(img => img.startsWith('aligned-'));
    const generatedImages = key.images.filter(img => img.startsWith('generated-'));
    const availableImages = alignedImages.length > 0 ? alignedImages : generatedImages;
    
    if (availableImages.length === 0) {
      console.log(`❌ No suitable images for ${key.id}`);
      continue;
    }
    
    const selectedImage = availableImages[0];
    const imagePath = path.join(key.fullPath, selectedImage);
    
    console.log(`Selected image: ${selectedImage}`);
    console.log(`Full path: ${imagePath}`);
    console.log(`File exists: ${fs.existsSync(imagePath)}`);
    
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      console.log(`File size: ${stats.size} bytes`);
      
      // Intentar leer como buffer
      try {
        const buffer = fs.readFileSync(imagePath);
        console.log(`✅ Buffer loaded: ${buffer.length} bytes`);
      } catch (error) {
        console.log(`❌ Error reading file: ${error.message}`);
      }
    }
  }
  
  return testKeys;
}

// PASO 3: Probar extracción con AI
async function step3_testAIExtraction(testKeys) {
  console.log('\n🤖 PASO 3: Probando extracción con GPT-4o...');
  
  // Verificar API key
  console.log('Checking OpenAI API key...');
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not found in environment');
  }
  console.log(`✅ API key found: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);
  
  // Importar módulo de AI
  console.log('Loading AI module...');
  const { analyzeKeyWithHybridBalancedAI } = await import('../../../../../app/lib/ai/multimodal-keyscan.server.js');
  console.log('✅ AI module loaded');
  
  // Probar extracción en una imagen
  const testKey = testKeys[0];
  const alignedImages = testKey.images.filter(img => img.startsWith('aligned-'));
  const generatedImages = testKey.images.filter(img => img.startsWith('generated-'));
  const availableImages = alignedImages.length > 0 ? alignedImages : generatedImages;
  const selectedImage = availableImages[0];
  const imagePath = path.join(testKey.fullPath, selectedImage);
  
  console.log(`\nTesting extraction on: ${testKey.id}/${selectedImage}`);
  
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    
    console.log('Calling analyzeKeyWithHybridBalancedAI...');
    const result = await analyzeKeyWithHybridBalancedAI(imageBuffer, mimeType);
    
    console.log('✅ Extraction successful!');
    console.log('Extracted parameters:');
    Object.entries(result).forEach(([key, value]) => {
      console.log(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    });
    
    return result;
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    throw error;
  }
}

// PASO 4: Probar comparación de signatures
async function step4_testSignatureComparison(testKeys) {
  console.log('\n🔍 PASO 4: Probando comparación de signatures...');
  
  // Importar módulo de comparación
  const { compareHybridBalancedKeySignatures } = await import('../../../../../app/lib/ai/multimodal-keyscan.server.js');
  console.log('✅ Comparison module loaded');
  
  // Extraer signatures de dos llaves diferentes
  console.log('Extracting signatures from two different keys...');
  
  const signatures = [];
  for (let i = 0; i < 2; i++) {
    const testKey = testKeys[i];
    const alignedImages = testKey.images.filter(img => img.startsWith('aligned-'));
    const generatedImages = testKey.images.filter(img => img.startsWith('generated-'));
    const availableImages = alignedImages.length > 0 ? alignedImages : generatedImages;
    const selectedImage = availableImages[0];
    const imagePath = path.join(testKey.fullPath, selectedImage);
    
    console.log(`\nExtracting from ${testKey.id}/${selectedImage}...`);
    
    const { analyzeKeyWithHybridBalancedAI } = await import('../../../../../app/lib/ai/multimodal-keyscan.server.js');
    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    
    const signature = await analyzeKeyWithHybridBalancedAI(imageBuffer, mimeType);
    signatures.push(signature);
    console.log(`✅ Signature ${i + 1} extracted`);
  }
  
  // Comparar signatures
  console.log('\nComparing signatures...');
  const comparison = compareHybridBalancedKeySignatures(signatures[0].signature, signatures[1].signature);
  
  console.log('✅ Comparison successful!');
  console.log(`Similarity: ${(comparison.similarity * 100).toFixed(1)}%`);
  console.log(`Match type: ${comparison.matchType}`);
  console.log('Parameter matches:');
  Object.entries(comparison.parameterMatches || {}).forEach(([key, match]) => {
    console.log(`  ${key}: ${match ? '✓' : '✗'}`);
  });
  
  return comparison;
}

// Función principal
async function main() {
  try {
    console.log('Starting progressive validation...\n');
    
    // PASO 1: Verificar dataset
    const keys = await step1_verifyDataset();
    
    // PASO 2: Probar carga de imágenes
    const testKeys = await step2_testImageLoading(keys);
    
    // PASO 3: Probar extracción con AI
    const signature = await step3_testAIExtraction(testKeys);
    
    // PASO 4: Probar comparación
    const comparison = await step4_testSignatureComparison(testKeys);
    
    console.log('\n🎉 All validation steps completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`✅ Dataset access: ${keys.length} keys available`);
    console.log(`✅ Image loading: Working correctly`);
    console.log(`✅ AI extraction: GPT-4o working`);
    console.log(`✅ Signature comparison: Working correctly`);
    console.log(`✅ Similarity result: ${(comparison.similarity * 100).toFixed(1)}%`);
    
    console.log('\n🚀 Ready to run full tests!');
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar validación
main().catch(console.error);
