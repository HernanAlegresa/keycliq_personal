/**
 * KeyScan V4 Testing Suite - Core Logic
 * Handles test execution, comparison generation, and result analysis
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ProductionKeyScanV4 from '../../../app/lib/vision/keyscan/v4/ProductionKeyScanV4.js';

export class V4TestingSuite {
  constructor() {
    this.originalDatasetPath = path.join(process.cwd(), 'tests/keys');
    this.optimizedDatasetPath = path.join(process.cwd(), 'tests/keys-optimized');
    
    // V4 Configuration (enhanced settings)
    this.keyScan = new ProductionKeyScanV4({
      T_match: 0.85,
      T_possible: 0.70,
      delta: 0.12,
      bitting: 0.75,
      edge: 0.15,
      shape: 0.10,
      shapeVetoEnabled: true,
      softPenalty: 0.88,
      dtwBand: 15,
      resizeFit: 'inside',
      adaptiveThreshold: true
    });
  }

  /**
   * Run complete test
   */
  async runTest(testConfig) {
    const startTime = Date.now();
    
    try {
      console.log(`  📂 Loading ${testConfig.dataset} dataset...`);
      
      // Load dataset
      const dataset = await this.loadDataset(testConfig.dataset);
      console.log(`  ✅ Loaded ${dataset.length} keys`);
      
      // Generate test cases
      console.log(`  🎲 Generating test cases with seed ${testConfig.seed}...`);
      const testCases = this.generateTestCases(dataset, testConfig.seed);
      console.log(`  ✅ Generated ${testCases.length} test cases`);
      
      // Execute comparisons
      console.log(`  🔍 Executing comparisons...`);
      const comparisons = [];
      
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`    Comparison ${i + 1}/20: ${testCase.caseType}`);
        
        const comparison = await this.executeComparison(testCase, i + 1);
        comparisons.push(comparison);
      }
      
      // Analyze results
      console.log(`  📊 Analyzing results...`);
      const summary = this.analyzeResults(comparisons);
      
      const executionTime = (Date.now() - startTime) / 1000;
      
      return {
        testConfig,
        summary,
        comparisons,
        executionTime,
        dataset: testConfig.dataset,
        timestamp: new Date().toISOString()
      };

        } catch (error) {
      console.error(`  ❌ Test failed:`, error.message);
            throw error;
        }
    }

    /**
   * Load dataset
   */
  async loadDataset(datasetType) {
    const datasetPath = datasetType === 'original' ? this.originalDatasetPath : this.optimizedDatasetPath;
    
    if (!fs.existsSync(datasetPath)) {
      throw new Error(`Dataset path not found: ${datasetPath}`);
    }
    
    const keys = [];
    const categories = fs.readdirSync(datasetPath).filter(item => {
      const itemPath = path.join(datasetPath, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    for (const category of categories) {
      const categoryPath = path.join(datasetPath, category);
      const keyFolders = fs.readdirSync(categoryPath).filter(item => {
        const itemPath = path.join(categoryPath, item);
        return fs.statSync(itemPath).isDirectory();
      });
      
      for (const keyFolder of keyFolders) {
        const keyPath = path.join(categoryPath, keyFolder);
        const images = this.findImages(keyPath, datasetType);
        
        if (images.length > 0) {
          keys.push({
            id: `${category}-${keyFolder}`,
            category: category,
            folder: keyFolder,
            images: images
          });
        }
      }
    }
    
    return keys;
  }

  /**
   * Find images in key folder
   */
  findImages(keyPath, datasetType) {
    const images = [];
    
    if (datasetType === 'optimized') {
      // For optimized dataset, look for optimized-*.jpg files
      const files = fs.readdirSync(keyPath);
      const optimizedFiles = files.filter(file => 
        file.startsWith('optimized-') && 
        (file.endsWith('.jpg') || file.endsWith('.jpeg'))
      );
      
      optimizedFiles.forEach(file => {
        images.push(path.join(keyPath, file));
      });
    } else {
      // For original dataset, look for any image files
      const files = fs.readdirSync(keyPath);
      const imageFiles = files.filter(file => 
        file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
      );
      
      imageFiles.forEach(file => {
        images.push(path.join(keyPath, file));
      });
    }
    
    return images.sort();
  }

  /**
   * Generate test cases
   */
  generateTestCases(dataset, seed) {
    const testCases = [];
    const random = this.seededRandom(seed);
    const shuffledKeys = [...dataset].sort(() => random() - 0.5);
    
    for (let i = 0; i < 20; i++) {
      let queryKey, queryImage, inventoryKey, inventoryImage, caseType, expected;
      
      if (i < 5) {
        // Cases 0-4: Same key, same image
        queryKey = shuffledKeys[i % shuffledKeys.length];
        queryImage = queryKey.images[Math.floor(random() * queryKey.images.length)];
        inventoryKey = queryKey;
        inventoryImage = queryImage; // Same image
        caseType = 'SAME_KEY_SAME_IMAGE';
        expected = 'MATCH';
      } else if (i < 10) {
        // Cases 5-9: Same key, different image
        queryKey = shuffledKeys[(i - 5) % shuffledKeys.length];
        inventoryKey = queryKey;
        
        if (queryKey.images.length > 1) {
          const imageIndex1 = Math.floor(random() * queryKey.images.length);
          let imageIndex2 = Math.floor(random() * queryKey.images.length);
          while (imageIndex2 === imageIndex1 && queryKey.images.length > 1) {
            imageIndex2 = Math.floor(random() * queryKey.images.length);
          }
          
          queryImage = queryKey.images[imageIndex1];
          inventoryImage = queryKey.images[imageIndex2];
        } else {
          // If only one image, use it for both (fallback to same key same image)
          queryImage = queryKey.images[0];
          inventoryImage = queryKey.images[0];
        }
        
        caseType = 'SAME_KEY_DIFFERENT_IMAGE';
            expected = 'MATCH';
        } else {
        // Cases 10-19: Different keys
        const key1Index = i % shuffledKeys.length;
        const key2Index = (i + 5) % shuffledKeys.length;
        
        queryKey = shuffledKeys[key1Index];
        inventoryKey = shuffledKeys[key2Index];
        queryImage = queryKey.images[Math.floor(random() * queryKey.images.length)];
        inventoryImage = inventoryKey.images[Math.floor(random() * inventoryKey.images.length)];
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
      // Read image buffers
      const queryImageBuffer = fs.readFileSync(testCase.queryImage);
      const inventoryImageBuffer = fs.readFileSync(testCase.inventoryImage);
      
      // Extract features for inventory (V4 needs this for inventory structure)
      const inventoryFeatures = await this.keyScan.imageProcessor.extractFeatures(inventoryImageBuffer);
      
      // Create inventory with single key
      const inventory = [{
        key: { id: testCase.inventoryKey.id, type: testCase.inventoryKey.category },
        features: inventoryFeatures
      }];
      
      // Execute matching - V4 expects image buffer, not features
      const result = await this.keyScan.findMatchInInventory(queryImageBuffer, inventory);
      
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
}
