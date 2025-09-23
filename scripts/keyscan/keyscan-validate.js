#!/usr/bin/env node

/**
 * Dataset Validation Script
 * Validates the Key Scan dataset structure and files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_PATH = path.join(__dirname, '..', '..', 'tests', 'fixtures');
const KEYS_PATH = path.join(FIXTURES_PATH, 'keys');

console.log('🔍 Key Scan Dataset Validation');
console.log('================================\n');

// Check if fixtures directory exists
if (!fs.existsSync(FIXTURES_PATH)) {
  console.error('❌ Fixtures directory not found:', FIXTURES_PATH);
  process.exit(1);
}

// Check if manifest.json exists
const manifestPath = path.join(FIXTURES_PATH, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ manifest.json not found');
  process.exit(1);
}

console.log('✅ manifest.json found');

// Load and validate manifest
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`✅ Manifest loaded - Dataset: ${manifest.dataset.name}`);
  console.log(`   Total Keys: ${manifest.dataset.totalKeys}`);
  console.log(`   Total Images: ${manifest.dataset.totalImages}`);
} catch (error) {
  console.error('❌ Error loading manifest.json:', error.message);
  process.exit(1);
}

// Check keys directory
if (!fs.existsSync(KEYS_PATH)) {
  console.error('❌ Keys directory not found:', KEYS_PATH);
  process.exit(1);
}

console.log('✅ Keys directory found');

// Validate each key directory
const keyDirs = fs.readdirSync(KEYS_PATH).filter(dir => dir.startsWith('key_'));
console.log(`\n📁 Found ${keyDirs.length} key directories`);

let totalImages = 0;
let validKeys = 0;

keyDirs.forEach(keyDir => {
  const keyPath = path.join(KEYS_PATH, keyDir);
  const metadataPath = path.join(keyPath, 'metadata.json');
  
  console.log(`\n🔑 Validating ${keyDir}:`);
  
  // Check metadata.json exists
  if (!fs.existsSync(metadataPath)) {
    console.log(`   ❌ metadata.json missing`);
    return;
  }
  
  // Load metadata
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`   ✅ metadata.json valid`);
    console.log(`   📝 Description: ${metadata.description}`);
  } catch (error) {
    console.log(`   ❌ Error loading metadata: ${error.message}`);
    return;
  }
  
  // Check image files
  const files = fs.readdirSync(keyPath).filter(file => file.endsWith('.jpg'));
  const expectedFiles = [
    `${keyDir}_angle_00.jpg`,
    `${keyDir}_angle_01.jpg`
  ];
  
  console.log(`   📸 Found ${files.length} image files`);
  
  expectedFiles.forEach(expectedFile => {
    if (files.includes(expectedFile)) {
      console.log(`   ✅ ${expectedFile}`);
      totalImages++;
    } else {
      console.log(`   ❌ Missing: ${expectedFile}`);
    }
  });
  
  if (files.length === 2) {
    validKeys++;
  }
});

console.log('\n📊 Validation Summary:');
console.log(`   Valid Keys: ${validKeys}/${keyDirs.length}`);
console.log(`   Total Images: ${totalImages}`);
console.log(`   Expected Images: ${keyDirs.length * 2}`);

if (validKeys === keyDirs.length && totalImages === keyDirs.length * 2) {
  console.log('\n🎉 Dataset validation PASSED!');
  console.log('✅ Ready for Key Scan development');
  process.exit(0);
} else {
  console.log('\n❌ Dataset validation FAILED!');
  console.log('⚠️  Please fix the issues above before proceeding');
  process.exit(1);
}
