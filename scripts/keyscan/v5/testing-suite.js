import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProductionKeyScanV5 } from '../../../app/lib/vision/keyscan/v5/ProductionKeyScanV5.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class V5TestingSuiteCorrected {
  constructor() {
    this.datasetPath = path.join(__dirname, '../../../tests/keys');
    this.optimizedDatasetPath = path.join(__dirname, '../../../tests/keys-optimized');
    this.keyScan = new ProductionKeyScanV5();
  }

  /**
   * Load both original and optimized datasets
   */
  async loadDatasets() {
    const originalDataset = await this.loadOriginalDataset();
    const optimizedDataset = await this.loadOptimizedDataset();
    
    return { original: originalDataset, optimized: optimizedDataset };
  }

  /**
   * Load original dataset (multiple images per key)
   */
  async loadOriginalDataset() {
    const dataset = { regular: [], lockbox: [], heavy: [] };
    
    for (const category of ['regular', 'lockbox', 'heavy']) {
      const categoryPath = path.join(this.datasetPath, category);
      if (!fs.existsSync(categoryPath)) continue;
      
      const keyFolders = fs.readdirSync(categoryPath)
        .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());
      
      for (const keyFolder of keyFolders) {
        const keyPath = path.join(categoryPath, keyFolder);
        const images = fs.readdirSync(keyPath)
          .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
          .map(file => path.join(keyPath, file));
        
        if (images.length > 0) {
          dataset[category].push({
            id: `${category}-${keyFolder}`,
            folder: keyFolder,
            category: category,
            images: images
          });
        }
      }
    }
    
    return dataset;
  }

  /**
   * Load aligned/generated dataset for V5 (user conditions: mango izquierda, dientes hacia arriba, llave horizontal)
   */
  async loadOptimizedDataset() {
    const dataset = { regular: [], lockbox: [], heavy: [] };
    
    // V5 uses aligned and generated images (user conditions) - THIS IS THE CORRECT LOGIC!
    // Images are organized in key folders: tests/keys-optimized/regular/key-01/aligned-key-01.jpg
    for (const category of ['regular', 'lockbox', 'heavy']) {
      const categoryPath = path.join(this.optimizedDatasetPath, category);
      if (!fs.existsSync(categoryPath)) continue;
      
      const keyFolders = fs.readdirSync(categoryPath)
        .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());
      
      for (const keyFolder of keyFolders) {
        const keyPath = path.join(categoryPath, keyFolder);
        
        // Look for aligned and generated images in each key folder
        const images = fs.readdirSync(keyPath)
          .filter(file => {
            const fileName = file.toLowerCase();
            return (fileName.includes('aligned') || fileName.includes('generated')) && 
                   /\.(jpg|jpeg|png)$/i.test(file);
          })
          .map(file => path.join(keyPath, file));
        
        if (images.length > 0) {
          dataset[category].push({
            id: `${category}-${keyFolder}`,
            folder: keyFolder,
            category: category,
            images: images
          });
        }
      }
    }
    
    return dataset;
  }

  /**
   * Find matching key in original dataset
   */
  findMatchingKeyInOriginal(optimizedKey, originalDataset) {
    const category = optimizedKey.category;
    const folder = optimizedKey.folder;
    
    return originalDataset[category].find(key => key.folder === folder);
  }

  /**
   * Select best alternative image for same key different image test
   */
  selectBestAlternativeImage(originalKey, optimizedImage) {
    // Filter out the optimized image and select the best alternative
    const alternativeImages = originalKey.images.filter(img => 
      !img.includes('optimized') && 
      !img.includes(path.basename(optimizedImage))
    );
    
    if (alternativeImages.length === 0) {
      // If no alternatives, use any different image
      return originalKey.images.find(img => !img.includes(path.basename(optimizedImage)));
    }
    
    // Select the image with the most different filename (likely different angle)
    return alternativeImages[0]; // For now, just take the first alternative
  }

  /**
   * Generate test cases for final 24-key test (12 same-key-different-image + 12 different-key)
   */
  async generateTestCases(datasets, seed) {
    const { original: originalDataset, optimized } = datasets;
    const random = this.seededRandom(seed);
    
    // Combine all keys from both datasets
    const allOptimizedKeys = [...optimized.regular, ...optimized.lockbox, ...optimized.heavy];
    const allOriginalKeys = [...originalDataset.regular, ...originalDataset.lockbox, ...originalDataset.heavy];
    
    // Shuffle keys
    const shuffledOptimized = [...allOptimizedKeys].sort(() => random() - 0.5);
    const shuffledOriginal = [...allOriginalKeys].sort(() => random() - 0.5);
    
    const testCases = [];
    
    // 12 Same Key Different Image tests (final test structure)
    for (let i = 0; i < 12; i++) {
      const optimizedKey = shuffledOptimized[i % shuffledOptimized.length];
      const originalKey = this.findMatchingKeyInOriginal(optimizedKey, originalDataset);
      
      if (originalKey && originalKey.images.length > 1) {
        const queryImage = optimizedKey.images[0]; // Use optimized image as query
        const inventoryImage = this.selectBestAlternativeImage(originalKey, queryImage);
        
        testCases.push({
          comparison: i + 1,
          inventoryKey: optimizedKey, // Use optimized key for inventory
          inventoryImage,
          queryKey: optimizedKey,
          queryImage,
          caseType: 'SAME_KEY_DIFFERENT_IMAGE',
          expected: 'MATCH'
        });
      }
    }
    
    // 12 Different Keys tests (final test structure)
    for (let i = 0; i < 12; i++) {
      const queryKey = shuffledOptimized[(i + 12) % shuffledOptimized.length];
      const inventoryKey = shuffledOptimized[(i + 24) % shuffledOptimized.length];
      
      // Ensure they are different keys
      if (queryKey.folder !== inventoryKey.folder) {
        const queryImage = queryKey.images[0];
        const inventoryImage = inventoryKey.images[0];
        
        testCases.push({
          comparison: i + 13,
          inventoryKey,
          inventoryImage,
          queryKey,
          queryImage,
          caseType: 'DIFFERENT_KEY',
          expected: 'NO_MATCH'
        });
      }
    }
    
    return testCases;
  }

  /**
   * Seeded random number generator
   */
  seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  /**
   * Execute individual comparison
   */
  async executeComparison(testCase, comparisonNumber) {
    try {
      // Extract features for both images
      const queryFeatures = await this.keyScan.imageProcessor.extractFeatures(testCase.queryImage);
      const inventoryFeatures = await this.keyScan.imageProcessor.extractFeatures(testCase.inventoryImage);
      
      // Create inventory with single key
      const inventory = [{
        key: { id: testCase.inventoryKey.id, type: testCase.inventoryKey.category },
        features: inventoryFeatures
      }];
      
      // Execute matching
      const result = await this.keyScan.findMatchInInventory(queryFeatures, inventory);
      
      // Determine if result is correct
      const isCorrect = this.isResultCorrect(result, testCase);
      
      // Create thumbnails for HTML
      const queryThumbnail = await this.createThumbnail(testCase.queryImage);
      const inventoryThumbnail = await this.createThumbnail(testCase.inventoryImage);
      
      return {
        comparison: comparisonNumber,
        caseType: testCase.caseType,
        expected: testCase.expected,
        actual: result.decision || result.matchStatus || 'NO_MATCH',
        isCorrect: isCorrect,
        similarity: result.details?.similarity || result.similarity || 0,
        confidence: result.confidence || 0,
        margin: result.margin || 0,
        bittingSimilarity: result.details?.bittingSimilarity || 0,
        shapeSimilarity: result.shapeVeto?.huSimilarity || result.details?.shapeSimilarity || 0,
        edgeSimilarity: result.details?.edgeSimilarity || 0,
        inventoryKeyId: testCase.inventoryKey.id,
        queryKeyId: testCase.queryKey.id,
        queryImagePath: testCase.queryImage,
        inventoryImagePath: testCase.inventoryImage,
        queryThumbnail,
        inventoryThumbnail,
        processingTime: result.processingTime || 0
      };

    } catch (error) {
      console.error(`Error in comparison ${comparisonNumber}:`, error.message);
      return {
        comparison: comparisonNumber,
        caseType: testCase.caseType,
        expected: testCase.expected,
        actual: 'ERROR',
        isCorrect: false,
        error: error.message,
        queryKeyId: testCase.queryKey.id,
        inventoryKeyId: testCase.inventoryKey.id
      };
    }
  }

  /**
   * Determine if result is correct
   */
  isResultCorrect(result, testCase) {
    const actual = result.decision || result.matchStatus || 'NO_MATCH';
    const expected = testCase.expected;
    
    return actual === expected;
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

  /**
   * Run the corrected test with 24 comparisons
   */
  async runCorrectedTest(seed) {
    console.log('🎯 Running V5 Final Test - 24 Key Comparisons');
    console.log(`📊 Dataset: Aligned/Generated (user conditions) + Original`);
    console.log(`📊 Test structure: 12 same-key-different-image + 12 different-key`);
    console.log(`🎲 Using seed: ${seed}`);

    const datasets = await this.loadDatasets();
    const testCases = await this.generateTestCases(datasets, seed);
    
    console.log(`📋 Generated ${testCases.length} test cases`);
    
    const results = [];
    let processedCount = 0;

    for (const testCase of testCases) {
      processedCount++;
      console.log(`   ${processedCount}/${testCases.length}: ${testCase.caseType} - ${testCase.queryKey.id}`);
      
      const comparison = await this.executeComparison(testCase, processedCount);
      results.push(comparison);
    }

    // Calculate analysis
    const analysis = this.calculateAnalysis(results);
    const configuration = this.getConfiguration();

    return {
      analysis,
      comparisons: results,
      configuration,
      testMetadata: {
        version: 'v5',
        testType: 'final-24-comparisons',
        seed: seed,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Calculate test analysis
   */
  calculateAnalysis(results) {
    const global = {
      totalTests: results.length,
      totalCorrect: results.filter(r => r.isCorrect).length,
      accuracy: 0
    };
    global.accuracy = global.totalTests > 0 ? (global.totalCorrect / global.totalTests) * 100 : 0;

    const byCaseType = {};

    // Group by case type
    const caseTypes = [...new Set(results.map(r => r.caseType))];
    
    for (const caseType of caseTypes) {
      const caseResults = results.filter(r => r.caseType === caseType);
      const correct = caseResults.filter(r => r.isCorrect).length;
      
      byCaseType[caseType] = {
        total: caseResults.length,
        correct: correct,
        accuracy: caseResults.length > 0 ? (correct / caseResults.length) * 100 : 0,
        medianSimilarity: this.calculateMedian(caseResults.map(r => r.similarity || 0)),
        medianMargin: this.calculateMedian(caseResults.map(r => r.margin || 0)),
        medianBittingScore: this.calculateMedian(caseResults.map(r => r.bittingSimilarity || 0))
      };
    }

    return { global, byCaseType };
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Get configuration for this test
   */
  getConfiguration() {
    return {
      version: 'v5-final',
      thresholds: {
        T_match: 0.82,
        T_possible: 0.70,
        delta: 0.15
      },
      weights: {
        bitting: 0.80,
        edge: 0.12,
        shape: 0.08
      },
      shapeVeto: {
        enabled: false
      }
    };
  }
}
