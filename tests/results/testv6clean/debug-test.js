import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting debug test...');
console.log('Current directory:', process.cwd());
console.log('Script directory:', __dirname);

// Verificar que podemos acceder al dataset
const datasetPath = path.resolve(__dirname, '../../../../keys-optimized');
console.log('Dataset path:', datasetPath);
console.log('Dataset exists:', fs.existsSync(datasetPath));

if (fs.existsSync(datasetPath)) {
  const regularPath = path.join(datasetPath, 'regular');
  const lockboxPath = path.join(datasetPath, 'lockbox');
  
  console.log('Regular path exists:', fs.existsSync(regularPath));
  console.log('Lockbox path exists:', fs.existsSync(lockboxPath));
  
  if (fs.existsSync(regularPath)) {
    const regularFiles = fs.readdirSync(regularPath);
    console.log('Regular files count:', regularFiles.length);
    console.log('First 5 regular files:', regularFiles.slice(0, 5));
  }
  
  if (fs.existsSync(lockboxPath)) {
    const lockboxFiles = fs.readdirSync(lockboxPath);
    console.log('Lockbox files count:', lockboxFiles.length);
    console.log('First 5 lockbox files:', lockboxFiles.slice(0, 5));
  }
}

// Verificar que podemos importar el módulo de AI
try {
  console.log('Trying to import AI module...');
  const aiModule = await import('../../../../../app/lib/ai/multimodal-keyscan.server.js');
  console.log('AI module imported successfully');
  console.log('Available functions:', Object.keys(aiModule));
} catch (error) {
  console.error('Error importing AI module:', error);
}

console.log('Debug test completed');
