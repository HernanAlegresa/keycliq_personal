/**
 * KeyScan V3 Testing Suite - Core Logic
 * Handles test execution, comparison generation, and result analysis
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ProductionKeyScanV3 } from '../../../app/lib/vision/keyscan/v3/ProductionKeyScanV3.js';

export class V3TestingSuite {
  constructor() {
    this.originalDatasetPath = path.join(process.cwd(), 'tests/keys');
    this.optimizedDatasetPath = path.join(process.cwd(), 'tests/keys-optimized');
    
    // V3 Configuration (matching staging settings)
    this.keyScan = new ProductionKeyScanV3({
      matching: {
        thresholds: { T_match: 0.82, T_possible: 0.70, delta: 0.15 },
        weights: { bitting: 0.80, edge: 0.12, shape: 0.08 },
        shapeVeto: { enabled: false }
      },
      imageProcessor: {
        resize: { width: 400, height: 200, fit: 'fill' },
        grayscale: true,
        normalize: true,
        sharpen: { enabled: true, sigma: 1.0 }
      }
    });

    this.configuration = {
      version: 'V3',
      thresholds: { T_match: 0.82, T_possible: 0.70, delta: 0.15 },
      weights: { bitting: 0.80, edge: 0.12, shape: 0.08 },
      shapeVeto: { enabled: false },
      imageProcessor: {
        resize: { width: 400, height: 200, fit: 'fill' },
        grayscale: true,
        normalize: true,
        sharpen: { enabled: true, sigma: 1.0 }
      }
    };
  }

  /**
   * Run complete test with specified dataset type and seed
   */
  async runTest(datasetType, seed) {
    console.log(`   📊 Loading ${datasetType} dataset...`);
    
    // Load dataset
    const dataset = datasetType === 'optimized' 
      ? await this.loadOptimizedDataset() 
      : await this.loadOriginalDataset();
    
    console.log(`   📊 Dataset loaded: ${Object.values(dataset).flat().length} total keys`);
    
    // Generate test cases
    const testCases = this.generateTestCases(dataset, 20, seed);
    console.log(`   📋 Generated ${testCases.length} test cases`);
    
    // Execute comparisons
    console.log(`   🔍 Executing comparisons...`);
    const comparisons = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const comparison = await this.executeComparison(testCase, i + 1);
      comparisons.push(comparison);
      
      if ((i + 1) % 5 === 0) {
        console.log(`     Progress: ${i + 1}/${testCases.length} comparisons completed`);
      }
    }
    
    // Analyze results
    const analysis = this.analyzeResults(comparisons);
    
    return {
      analysis,
      comparisons,
      configuration: this.configuration,
      datasetType,
      seed
    };
  }

  /**
   * Load original dataset (multiple images per key)
   */
  async loadOriginalDataset() {
    const dataset = { regular: [], lockbox: [], heavy: [] };
    
    for (const category of ['Regular', 'Lockbox', 'Heavy']) {
      const categoryPath = path.join(this.originalDatasetPath, category);
      if (!fs.existsSync(categoryPath)) continue;
      
      const keyFolders = fs.readdirSync(categoryPath)
        .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());
      
      for (const keyFolder of keyFolders) {
        const keyPath = path.join(categoryPath, keyFolder);
        const images = fs.readdirSync(keyPath)
          .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
          .map(file => path.join(keyPath, file));
        
        if (images.length > 0) {
          dataset[category.toLowerCase()].push({
            id: `${category.toLowerCase()}-${keyFolder}`,
            folder: keyFolder,
            category: category.toLowerCase(),
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
   * Generate balanced test cases
   */
  generateTestCases(dataset, totalComparisons = 20, seed = 42) {
    const allKeys = [...dataset.regular, ...dataset.lockbox, ...dataset.heavy];
    
    if (allKeys.length < totalComparisons) {
      throw new Error(`Insufficient keys: ${allKeys.length} available, ${totalComparisons} needed`);
    }
    
    // Use seeded random for reproducible results
    let random = this.seededRandom(seed);
    
    // Shuffle keys
    const shuffledKeys = [...allKeys].sort(() => random() - 0.5);
    
    const testCases = [];
    
    // Generate test cases with balanced distribution
    for (let i = 0; i < totalComparisons; i++) {
      const inventoryKey = shuffledKeys[i % shuffledKeys.length];
      const inventoryImage = inventoryKey.images[Math.floor(random() * inventoryKey.images.length)];
      
      let queryKey, queryImage, caseType, expected;
      
      if (i < 5) {
        // Cases 0-4: Same key, same image
        queryKey = inventoryKey;
        queryImage = inventoryImage;
        caseType = 'SAME_KEY_SAME_IMAGE';
        expected = 'MATCH';
      } else if (i < 10) {
        // Cases 5-9: Same key, different image
        queryKey = inventoryKey;
        const otherImages = inventoryKey.images.filter(img => img !== inventoryImage);
        if (otherImages.length > 0) {
          queryImage = otherImages[Math.floor(random() * otherImages.length)];
          caseType = 'SAME_KEY_DIFFERENT_IMAGE';
          expected = 'MATCH';
        } else {
          // Fallback to different key if no other images
          const otherKey = shuffledKeys[(i + 10) % shuffledKeys.length];
          queryKey = otherKey;
          queryImage = otherKey.images[Math.floor(random() * otherKey.images.length)];
          caseType = 'DIFFERENT_KEY';
          expected = 'NO_MATCH';
        }
      } else {
        // Cases 10-19: Different keys
        const otherKey = shuffledKeys[(i + 10) % shuffledKeys.length];
        queryKey = otherKey;
        queryImage = otherKey.images[Math.floor(random() * otherKey.images.length)];
        caseType = 'DIFFERENT_KEY';
        expected = 'NO_MATCH';
      }
      
      testCases.push({
        comparison: i + 1,
        inventoryKey,
        inventoryImage,
        queryKey,
        queryImage,
        caseType,
        expected
      });
    }
    
    return testCases;
  }

  /**
   * Execute individual comparison
   */
  async executeComparison(testCase, comparisonNumber) {
    try {
      // Extract features from both images
      const queryFeatures = await this.keyScan.imageProcessor.extractFeatures(
        fs.readFileSync(testCase.queryImage)
      );
      
      const inventoryFeatures = await this.keyScan.imageProcessor.extractFeatures(
        fs.readFileSync(testCase.inventoryImage)
      );
      
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
        actual: 'ERROR',
        similarity: 0,
        confidence: 0,
        margin: 0,
        bittingSimilarity: 0,
        shapeSimilarity: 0,
        edgeSimilarity: 0,
        inventoryKeyId: testCase.inventoryKey.id,
        queryKeyId: testCase.queryKey.id,
        queryThumbnail: null,
        inventoryThumbnail: null
      };
    }
  }

  /**
   * Determine if result is correct
   */
  isResultCorrect(result, testCase) {
    if (testCase.caseType.includes('SAME_KEY')) {
      return result.decision === 'MATCH';
    } else {
      return result.decision === 'NO_MATCH';
    }
  }

  /**
   * Create thumbnail for HTML display
   */
  async createThumbnail(imagePath) {
    try {
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
   * Analyze test results
   */
  analyzeResults(comparisons) {
    const validComparisons = comparisons.filter(c => !c.error);
    
    // Group by case type
    const byCaseType = {
      SAME_KEY_SAME_IMAGE: validComparisons.filter(c => c.caseType === 'SAME_KEY_SAME_IMAGE'),
      SAME_KEY_DIFFERENT_IMAGE: validComparisons.filter(c => c.caseType === 'SAME_KEY_DIFFERENT_IMAGE'),
      DIFFERENT_KEY: validComparisons.filter(c => c.caseType === 'DIFFERENT_KEY')
    };
    
    // Calculate metrics by case type
    const metrics = {};
    for (const [caseType, results] of Object.entries(byCaseType)) {
      const correct = results.filter(r => r.isCorrect).length;
      const total = results.length;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      
      // Calculate additional metrics
      const similarities = results.map(r => r.similarity).filter(s => s !== undefined);
      const margins = results.map(r => r.margin).filter(m => m !== undefined);
      const bittingScores = results.map(r => r.bittingSimilarity).filter(s => s !== undefined);
      
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
}
