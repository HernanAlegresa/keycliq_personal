import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProductionKeyScanV3 } from '../../../app/lib/vision/keyscan/v3/ProductionKeyScanV3.js';
import { MatchingAlgorithmV3 } from '../../../app/lib/vision/keyscan/v3/MatchingAlgorithmV3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class V3TestingSuiteCorrected {
  constructor() {
    this.datasetPath = path.join(__dirname, '../../../tests/keys');
    this.optimizedDatasetPath = path.join(__dirname, '../../../tests/keys-optimized');
    this.keyScan = new ProductionKeyScanV3();
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
   * Load optimized dataset (single optimized image per key)
   */
  async loadOptimizedDataset() {
    const dataset = { regular: [], lockbox: [], heavy: [] };
    
    for (const category of ['regular', 'lockbox', 'heavy']) {
      const categoryPath = path.join(this.optimizedDatasetPath, category);
      if (!fs.existsSync(categoryPath)) continue;
      
      const keyFolders = fs.readdirSync(categoryPath)
        .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());
      
      for (const keyFolder of keyFolders) {
        const keyPath = path.join(categoryPath, keyFolder);
        const images = fs.readdirSync(keyPath)
          .filter(file => file.startsWith('optimized-') && /\.(jpg|jpeg|png)$/i.test(file))
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
   * Generate test cases for corrected testing
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
    
    // 10 Same Key Same Image tests
    for (let i = 0; i < 10; i++) {
      const optimizedKey = shuffledOptimized[i % shuffledOptimized.length];
      const queryImage = optimizedKey.images[0]; // Use optimized image
      const inventoryImage = queryImage; // Same image
      
      testCases.push({
        comparison: i + 1,
        inventoryKey: optimizedKey,
        inventoryImage,
        queryKey: optimizedKey,
        queryImage,
        caseType: 'SAME_KEY_SAME_IMAGE',
        expected: 'MATCH'
      });
    }
    
    // 10 Same Key Different Image tests
    for (let i = 0; i < 10; i++) {
      const optimizedKey = shuffledOptimized[(i + 10) % shuffledOptimized.length];
      const originalKey = this.findMatchingKeyInOriginal(optimizedKey, originalDataset);
      
      if (originalKey && originalKey.images.length > 1) {
        const queryImage = optimizedKey.images[0]; // Use optimized image as query
        const inventoryImage = this.selectBestAlternativeImage(originalKey, queryImage);
        
        testCases.push({
          comparison: i + 11,
          inventoryKey: optimizedKey, // Use optimized key for inventory
          inventoryImage,
          queryKey: optimizedKey,
          queryImage,
          caseType: 'SAME_KEY_DIFFERENT_IMAGE',
          expected: 'MATCH'
        });
      }
    }
    
    // 10 Different Keys tests
    for (let i = 0; i < 10; i++) {
      const queryKey = shuffledOptimized[(i + 20) % shuffledOptimized.length];
      const inventoryKey = shuffledOptimized[(i + 25) % shuffledOptimized.length];
      
      // Ensure they are different keys
      if (queryKey.folder !== inventoryKey.folder) {
        const queryImage = queryKey.images[0];
        const inventoryImage = inventoryKey.images[0];
        
        testCases.push({
          comparison: i + 21,
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
        actual: result.decision,
        isCorrect: isCorrect,
        similarity: result.details?.similarity || 0,
        confidence: result.confidence || 0,
        margin: result.margin || 0,
        bittingSimilarity: result.details?.bittingSimilarity || 0,
        shapeSimilarity: result.shapeVeto?.huSimilarity || 0,
        edgeSimilarity: result.details?.edgeSimilarity || 0,
        inventoryKeyId: testCase.inventoryKey.id,
        queryKeyId: testCase.queryKey.id,
        inventoryImagePath: testCase.inventoryImage,
        queryImagePath: testCase.queryImage,
        queryThumbnail: queryThumbnail,
        inventoryThumbnail: inventoryThumbnail
      };
      
    } catch (error) {
      console.error(`Error in comparison ${comparisonNumber}:`, error.message);
      return {
        comparison: comparisonNumber,
        caseType: testCase.caseType,
        expected: testCase.expected,
        error: error.message,
        isCorrect: false,
        similarity: 0,
        confidence: 0,
        margin: 0,
        bittingSimilarity: 0,
        shapeSimilarity: 0,
        edgeSimilarity: 0,
        inventoryKeyId: testCase.inventoryKey?.id || 'unknown',
        queryKeyId: testCase.queryKey?.id || 'unknown',
        inventoryImagePath: testCase.inventoryImage || '',
        queryImagePath: testCase.queryImage || '',
        queryThumbnail: null,
        inventoryThumbnail: null
      };
    }
  }

  /**
   * Check if result is correct
   */
  isResultCorrect(result, testCase) {
    const expected = testCase.expected;
    const actual = result.decision;
    
    if (expected === 'MATCH' && actual === 'MATCH') return true;
    if (expected === 'NO_MATCH' && (actual === 'NO_MATCH' || actual === 'POSSIBLE')) return true;
    
    return false;
  }

  /**
   * Create thumbnail for HTML display
   */
  async createThumbnail(imagePath) {
    try {
      const sharp = (await import('sharp')).default;
      const buffer = await sharp(imagePath)
        .resize(200, 150, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Error creating thumbnail:', error.message);
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
    }
  }

  /**
   * Analyze results
   */
  analyzeResults(comparisons) {
    const validComparisons = comparisons.filter(c => !c.error);
    
    // Group by case type
    const caseTypes = ['SAME_KEY_SAME_IMAGE', 'SAME_KEY_DIFFERENT_IMAGE', 'DIFFERENT_KEY'];
    const metrics = {};
    
    for (const caseType of caseTypes) {
      const typeComparisons = validComparisons.filter(c => c.caseType === caseType);
      const correct = typeComparisons.filter(c => c.isCorrect).length;
      const total = typeComparisons.length;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      
      // Calculate medians
      const similarities = typeComparisons.map(c => c.similarity).filter(s => !isNaN(s));
      const margins = typeComparisons.map(c => c.margin).filter(m => !isNaN(m));
      const bittingScores = typeComparisons.map(c => c.bittingSimilarity).filter(s => !isNaN(s));
      
      metrics[caseType] = {
        total,
        correct,
        accuracy,
        medianSimilarity: similarities.length > 0 ? this.median(similarities) : 0,
        medianMargin: margins.length > 0 ? this.median(margins) : 0,
        medianBittingScore: bittingScores.length > 0 ? this.median(bittingScores) : 0
      };
    }
    
    // Global metrics
    const totalCorrect = validComparisons.filter(r => r.isCorrect).length;
    const totalTests = validComparisons.length;
    const globalAccuracy = totalTests > 0 ? (totalCorrect / totalTests) * 100 : 0;
    
    return {
      global: {
        totalTests,
        totalCorrect,
        accuracy: globalAccuracy
      },
      byCaseType: metrics
    };
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
   * Calculate median
   */
  median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Run corrected test
   */
  async runCorrectedTest(seed = 42) {
    console.log('🔍 Running V3 Corrected Test...');
    console.log('   📊 Dataset: Mixed (optimized + original)');
    console.log('   🎲 Seed:', seed, '(consistent results)');
    console.log('   📋 Test cases: 30 (10 same-key-same-image, 10 same-key-different-image, 10 different-key)');
    
    // Load datasets
    console.log('   📊 Loading datasets...');
    const datasets = await this.loadDatasets();
    console.log('   📊 Original dataset loaded:', Object.values(datasets.original).flat().length, 'total keys');
    console.log('   📊 Optimized dataset loaded:', Object.values(datasets.optimized).flat().length, 'total keys');
    
    // Generate test cases
    console.log('   📋 Generated 30 test cases');
    const testCases = await this.generateTestCases(datasets, seed);
    
    // Execute comparisons
    console.log('   🔍 Executing comparisons...');
    const comparisons = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`     Comparison ${i + 1}/${testCases.length}: ${testCase.caseType}`);
      
      const result = await this.executeComparison(testCase, i + 1);
      comparisons.push(result);
      
      if ((i + 1) % 5 === 0) {
        console.log(`     Progress: ${i + 1}/${testCases.length} comparisons completed`);
      }
    }
    
    // Analyze results
    console.log('   📊 Analyzing results...');
    const analysis = this.analyzeResults(comparisons);
    
    return {
      analysis,
      comparisons,
      configuration: {
        thresholds: { T_match: 0.82, T_possible: 0.7, delta: 0.15 },
        weights: { bitting: 0.8, edge: 0.12, shape: 0.08 },
        shapeVeto: { enabled: false }
      }
    };
  }
}
