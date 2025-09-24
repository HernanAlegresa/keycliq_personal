/**
 * V1.2 Hybrid Testing - Simplified approach
 * Uses V1 base with enhanced features and adaptive thresholds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class V12HybridTester {
  constructor() {
    this.weights = {
      contour: 0.30,    // 30% contour features
      bitting: 0.50,     // 50% bitting features
      bow: 0.15,         // 15% bow features
      shank: 0.05        // 5% shank features
    };
    this.thresholds = {
      sameKey: {
        match: 0.90,
        possible: 0.80,
        noMatch: 0.70
      },
      differentKey: {
        match: 0.95,
        possible: 0.85,
        noMatch: 0.75
      },
      inventory: {
        match: 0.92,
        possible: 0.82,
        noMatch: 0.72
      }
    };
    this.deltaMargin = 0.05;
  }

  async extractContourFeatures(imageBuffer) {
    // Enhanced contour features (8D)
    const { data, info } = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Edge density
    let edgePixels = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = data[y * width + x];
        const top = data[(y - 1) * width + x];
        const bottom = data[(y + 1) * width + x];
        const left = data[y * width + (x - 1)];
        const right = data[y * width + (x + 1)];
        
        if (Math.abs(center - top) > 50 || Math.abs(center - bottom) > 50 ||
            Math.abs(center - left) > 50 || Math.abs(center - right) > 50) {
          edgePixels++;
        }
      }
    }
    features.push(edgePixels / (width * height));

    // 2. Aspect ratio
    features.push(width / height);

    // 3. Centroid X
    let sumX = 0, sumY = 0, count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    features.push(count > 0 ? sumX / count / width : 0.5);

    // 4. Centroid Y
    features.push(count > 0 ? sumY / count / height : 0.5);

    // 5. Compactness
    const area = count;
    const perimeter = edgePixels;
    features.push(area > 0 ? (perimeter * perimeter) / area : 0);

    // 6. Solidity
    const convexHullArea = this.calculateConvexHullArea(data, width, height);
    features.push(area > 0 ? area / convexHullArea : 0.8);

    // 7. Eccentricity
    const eccentricity = this.calculateEccentricity(data, width, height);
    features.push(eccentricity);

    // 8. Circularity
    features.push(area > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0);

    return features;
  }

  async extractBittingFeatures(imageBuffer) {
    // Enhanced bitting features (6D)
    const { data, info } = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Horizontal projection
    const horizontalProjection = new Array(height).fill(0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          horizontalProjection[y]++;
        }
      }
    }
    const maxHorizontal = Math.max(...horizontalProjection);
    features.push(maxHorizontal / width);

    // 2. Vertical projection
    const verticalProjection = new Array(width).fill(0);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (data[y * width + x] > 128) {
          verticalProjection[x]++;
        }
      }
    }
    const maxVertical = Math.max(...verticalProjection);
    features.push(maxVertical / height);

    // 3. Top section density
    const topSection = Math.floor(height * 0.3);
    let topDensity = 0;
    for (let y = 0; y < topSection; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) topDensity++;
      }
    }
    features.push(topDensity / (topSection * width));

    // 4. Middle section density
    const middleStart = Math.floor(height * 0.3);
    const middleEnd = Math.floor(height * 0.7);
    let middleDensity = 0;
    for (let y = middleStart; y < middleEnd; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) middleDensity++;
      }
    }
    features.push(middleDensity / ((middleEnd - middleStart) * width));

    // 5. Bottom section density
    const bottomStart = Math.floor(height * 0.7);
    let bottomDensity = 0;
    for (let y = bottomStart; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) bottomDensity++;
      }
    }
    features.push(bottomDensity / ((height - bottomStart) * width));

    // 6. Enhanced symmetry
    let leftSum = 0, rightSum = 0;
    const centerX = Math.floor(width / 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < centerX; x++) {
        if (data[y * width + x] > 128) leftSum++;
      }
      for (let x = centerX; x < width; x++) {
        if (data[y * width + x] > 128) rightSum++;
      }
    }
    features.push(Math.abs(leftSum - rightSum) / (leftSum + rightSum + 1));

    return features;
  }

  async extractBowFeatures(imageBuffer) {
    // Bow features (3D)
    const { data, info } = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Bow area ratio (top 30% of image)
    const bowHeight = Math.floor(height * 0.3);
    let bowPixels = 0;
    for (let y = 0; y < bowHeight; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) bowPixels++;
      }
    }
    features.push(bowPixels / (bowHeight * width));

    // 2. Bow circularity
    const bowContour = this.calculateBowContour(data, width, height, bowHeight);
    const bowArea = bowPixels;
    const bowPerimeter = bowContour;
    features.push(bowArea > 0 ? (4 * Math.PI * bowArea) / (bowPerimeter * bowPerimeter) : 0);

    // 3. Bow position relative to shank
    const bowCenterY = this.calculateBowCenter(data, width, bowHeight);
    const shankCenterY = this.calculateShankCenter(data, width, height);
    features.push(Math.abs(bowCenterY - shankCenterY) / height);

    return features;
  }

  async extractShankFeatures(imageBuffer) {
    // Shank features (3D)
    const { data, info } = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Shank length ratio
    const shankStart = Math.floor(height * 0.3);
    const shankEnd = Math.floor(height * 0.8);
    const shankLength = shankEnd - shankStart;
    features.push(shankLength / height);

    // 2. Shank width consistency
    const shankWidths = [];
    for (let y = shankStart; y < shankEnd; y += 5) {
      let leftEdge = 0, rightEdge = width;
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          leftEdge = x;
          break;
        }
      }
      for (let x = width - 1; x >= 0; x--) {
        if (data[y * width + x] > 128) {
          rightEdge = x;
          break;
        }
      }
      shankWidths.push(rightEdge - leftEdge);
    }
    const meanWidth = shankWidths.reduce((a, b) => a + b, 0) / shankWidths.length;
    const widthVariance = shankWidths.reduce((sum, w) => sum + Math.pow(w - meanWidth, 2), 0) / shankWidths.length;
    features.push(Math.sqrt(widthVariance) / meanWidth);

    // 3. Shank straightness
    const shankAngles = [];
    for (let y = shankStart; y < shankEnd - 10; y += 10) {
      const angle = this.calculateShankAngle(data, width, y);
      shankAngles.push(angle);
    }
    const angleVariance = shankAngles.reduce((sum, a) => sum + Math.pow(a, 2), 0) / shankAngles.length;
    features.push(Math.sqrt(angleVariance));

    return features;
  }

  calculateConvexHullArea(data, width, height) {
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    const hullWidth = maxX - minX;
    const hullHeight = maxY - minY;
    return hullWidth * hullHeight;
  }

  calculateEccentricity(data, width, height) {
    let m00 = 0, m20 = 0, m02 = 0, m11 = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          m00 += 1;
          m20 += x * x;
          m02 += y * y;
          m11 += x * y;
        }
      }
    }
    
    if (m00 === 0) return 0;
    
    const xc = m20 / m00;
    const yc = m02 / m00;
    const mu20 = m20 - m00 * xc * xc;
    const mu02 = m02 - m00 * yc * yc;
    const mu11 = m11 - m00 * xc * yc;
    
    const a = mu20 + mu02;
    const b = Math.sqrt(4 * mu11 * mu11 + (mu20 - mu02) * (mu20 - mu02));
    
    if (a === 0) return 0;
    
    return Math.sqrt(1 - (a - b) / (a + b));
  }

  calculateBowContour(data, width, height, bowHeight) {
    let contour = 0;
    for (let y = 0; y < bowHeight; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          let isEdge = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < bowHeight) {
                if (data[ny * width + nx] <= 128) {
                  isEdge = true;
                  break;
                }
              }
            }
            if (isEdge) break;
          }
          if (isEdge) contour++;
        }
      }
    }
    return contour;
  }

  calculateBowCenter(data, width, bowHeight) {
    let sumY = 0, count = 0;
    for (let y = 0; y < bowHeight; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          sumY += y;
          count++;
        }
      }
    }
    return count > 0 ? sumY / count : bowHeight / 2;
  }

  calculateShankCenter(data, width, height) {
    const shankStart = Math.floor(height * 0.3);
    const shankEnd = Math.floor(height * 0.8);
    let sumY = 0, count = 0;
    
    for (let y = shankStart; y < shankEnd; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          sumY += y;
          count++;
        }
      }
    }
    return count > 0 ? sumY / count : (shankStart + shankEnd) / 2;
  }

  calculateShankAngle(data, width, y) {
    let leftEdge = 0, rightEdge = width;
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] > 128) {
        leftEdge = x;
        break;
      }
    }
    for (let x = width - 1; x >= 0; x--) {
      if (data[y * width + x] > 128) {
        rightEdge = x;
        break;
      }
    }
    return (rightEdge - leftEdge) / width;
  }

  async extractSignature(imageBuffer) {
    try {
      const contourFeatures = await this.extractContourFeatures(imageBuffer);
      const bittingFeatures = await this.extractBittingFeatures(imageBuffer);
      const bowFeatures = await this.extractBowFeatures(imageBuffer);
      const shankFeatures = await this.extractShankFeatures(imageBuffer);
      
      return [...contourFeatures, ...bittingFeatures, ...bowFeatures, ...shankFeatures];
    } catch (error) {
      throw new Error(`Error extracting V1.2 signature: ${error.message}`);
    }
  }

  calculateCosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return Math.max(0, Math.min(1, dotProduct / (normA * normB)));
  }

  calculateWeightedScore(contourSimilarity, bittingSimilarity, bowSimilarity, shankSimilarity) {
    return (this.weights.contour * contourSimilarity) + 
           (this.weights.bitting * bittingSimilarity) + 
           (this.weights.bow * bowSimilarity) + 
           (this.weights.shank * shankSimilarity);
  }

  determineMatchStatus(score, context) {
    const thresholds = this.thresholds[context] || this.thresholds.inventory;
    
    if (score >= thresholds.match) {
      return 'MATCH';
    } else if (score >= thresholds.possible) {
      return 'POSSIBLE';
    } else if (score >= thresholds.noMatch) {
      return 'LOW_CONFIDENCE';
    } else {
      return 'NO_MATCH';
    }
  }

  async loadDataset() {
    const datasetPath = path.join(__dirname, '..', '..', 'tests', 'fixtures');
    const keys = [];

    for (let i = 1; i <= 7; i++) {
      const keyId = `key_${String(i).padStart(3, '0')}`;
      const keyPath = path.join(datasetPath, 'keys', keyId);
      
      if (fs.existsSync(keyPath)) {
        const key = {
          id: keyId,
          images: [],
          signatures: []
        };

        for (let angle = 0; angle <= 1; angle++) {
          const imagePath = path.join(keyPath, `${keyId}_angle_${String(angle).padStart(2, '0')}.jpg`);
          if (fs.existsSync(imagePath)) {
            key.images.push(imagePath);
          }
        }

        keys.push(key);
      }
    }

    return keys;
  }

  async extractSignatures(keys) {
    console.log('🔍 Extracting V1.2 Hybrid signatures (20D)...');
    
    for (const key of keys) {
      for (const imagePath of key.images) {
        try {
          const imageBuffer = fs.readFileSync(imagePath);
          const signature = await this.extractSignature(imageBuffer);
          key.signatures.push(signature);
          console.log(`✅ ${key.id}: ${signature.length}D signature extracted`);
        } catch (error) {
          console.error(`❌ Error processing ${key.id}: ${error.message}`);
        }
      }
    }

    return keys;
  }

  async testSameKeyConsistency(keys) {
    console.log('\n🧪 Testing Same Key Consistency (V1.2 Hybrid)...');
    
    let passed = 0;
    let total = 0;
    const results = [];

    for (const key of keys) {
      if (key.signatures.length >= 2) {
        const signature1 = key.signatures[0];
        const signature2 = key.signatures[1];
        
        // Split into feature groups
        const contour1 = signature1.slice(0, 8);
        const bitting1 = signature1.slice(8, 14);
        const bow1 = signature1.slice(14, 17);
        const shank1 = signature1.slice(17, 20);
        
        const contour2 = signature2.slice(0, 8);
        const bitting2 = signature2.slice(8, 14);
        const bow2 = signature2.slice(14, 17);
        const shank2 = signature2.slice(17, 20);

        // Calculate similarities
        const contourSimilarity = this.calculateCosineSimilarity(contour1, contour2);
        const bittingSimilarity = this.calculateCosineSimilarity(bitting1, bitting2);
        const bowSimilarity = this.calculateCosineSimilarity(bow1, bow2);
        const shankSimilarity = this.calculateCosineSimilarity(shank1, shank2);
        
        const weightedScore = this.calculateWeightedScore(contourSimilarity, bittingSimilarity, bowSimilarity, shankSimilarity);
        const status = this.determineMatchStatus(weightedScore, 'sameKey');
        
        const testPassed = status === 'MATCH' || status === 'POSSIBLE';
        results.push({
          keyId: key.id,
          score: weightedScore,
          status: status,
          passed: testPassed,
          contourSimilarity,
          bittingSimilarity,
          bowSimilarity,
          shankSimilarity
        });

        if (testPassed) {
          passed++;
        }
        total++;
      }
    }

    const accuracy = total > 0 ? (passed / total) * 100 : 0;
    console.log(`📊 Same Key Consistency: ${accuracy.toFixed(2)}% (${passed}/${total})`);
    
    return { passed, total, accuracy, results };
  }

  async testDifferentKeyDiscrimination(keys) {
    console.log('\n🧪 Testing Different Key Discrimination (V1.2 Hybrid)...');
    
    let passed = 0;
    let total = 0;
    const results = [];

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const keyA = keys[i];
        const keyB = keys[j];
        
        if (keyA.signatures.length > 0 && keyB.signatures.length > 0) {
          const signature1 = keyA.signatures[0];
          const signature2 = keyB.signatures[0];
          
          // Split into feature groups
          const contour1 = signature1.slice(0, 8);
          const bitting1 = signature1.slice(8, 14);
          const bow1 = signature1.slice(14, 17);
          const shank1 = signature1.slice(17, 20);
          
          const contour2 = signature2.slice(0, 8);
          const bitting2 = signature2.slice(8, 14);
          const bow2 = signature2.slice(14, 17);
          const shank2 = signature2.slice(17, 20);

          // Calculate similarities
          const contourSimilarity = this.calculateCosineSimilarity(contour1, contour2);
          const bittingSimilarity = this.calculateCosineSimilarity(bitting1, bitting2);
          const bowSimilarity = this.calculateCosineSimilarity(bow1, bow2);
          const shankSimilarity = this.calculateCosineSimilarity(shank1, shank2);
          
          const weightedScore = this.calculateWeightedScore(contourSimilarity, bittingSimilarity, bowSimilarity, shankSimilarity);
          const status = this.determineMatchStatus(weightedScore, 'differentKey');
          
          const testPassed = status === 'NO_MATCH' || status === 'LOW_CONFIDENCE';
          results.push({
            keyA: keyA.id,
            keyB: keyB.id,
            score: weightedScore,
            status: status,
            passed: testPassed,
            contourSimilarity,
            bittingSimilarity,
            bowSimilarity,
            shankSimilarity
          });

          if (testPassed) {
            passed++;
          }
          total++;
        }
      }
    }

    const accuracy = total > 0 ? (passed / total) * 100 : 0;
    console.log(`📊 Different Key Discrimination: ${accuracy.toFixed(2)}% (${passed}/${total})`);
    
    return { passed, total, accuracy, results };
  }

  async testInventorySimulation(keys) {
    console.log('\n🧪 Testing Inventory Simulation (V1.2 Hybrid)...');
    
    let passed = 0;
    let total = 0;
    const results = [];

    // Simulate user with 3 keys in inventory
    const inventoryKeys = keys.slice(0, 3);
    const newKeys = keys.slice(3);

    for (const newKey of newKeys) {
      if (newKey.signatures.length > 0) {
        const querySignature = newKey.signatures[0];
        const inventorySignatures = inventoryKeys
          .filter(key => key.signatures.length > 0)
          .map(key => key.signatures[0]);

        let bestScore = 0;
        let secondBestScore = 0;
        let bestStatus = 'NO_MATCH';

        // Find best match in inventory
        for (const inventorySignature of inventorySignatures) {
          const contour1 = querySignature.slice(0, 8);
          const bitting1 = querySignature.slice(8, 14);
          const bow1 = querySignature.slice(14, 17);
          const shank1 = querySignature.slice(17, 20);
          
          const contour2 = inventorySignature.slice(0, 8);
          const bitting2 = inventorySignature.slice(8, 14);
          const bow2 = inventorySignature.slice(14, 17);
          const shank2 = inventorySignature.slice(17, 20);

          const contourSimilarity = this.calculateCosineSimilarity(contour1, contour2);
          const bittingSimilarity = this.calculateCosineSimilarity(bitting1, bitting2);
          const bowSimilarity = this.calculateCosineSimilarity(bow1, bow2);
          const shankSimilarity = this.calculateCosineSimilarity(shank1, shank2);
          
          const weightedScore = this.calculateWeightedScore(contourSimilarity, bittingSimilarity, bowSimilarity, shankSimilarity);
          const status = this.determineMatchStatus(weightedScore, 'inventory');

          if (weightedScore > bestScore) {
            secondBestScore = bestScore;
            bestScore = weightedScore;
            bestStatus = status;
          } else if (weightedScore > secondBestScore) {
            secondBestScore = weightedScore;
          }
        }
        
        const deltaMargin = bestScore - secondBestScore;
        const isConfidentMatch = deltaMargin >= this.deltaMargin;
        const finalStatus = isConfidentMatch ? bestStatus : 'LOW_CONFIDENCE';
        
        const testPassed = finalStatus === 'NO_MATCH' || finalStatus === 'LOW_CONFIDENCE';
        results.push({
          queryKey: newKey.id,
          score: bestScore,
          status: finalStatus,
          deltaMargin: deltaMargin,
          isConfidentMatch: isConfidentMatch,
          passed: testPassed
        });

        if (testPassed) {
          passed++;
        }
        total++;
      }
    }

    const accuracy = total > 0 ? (passed / total) * 100 : 0;
    console.log(`📊 Inventory Simulation: ${accuracy.toFixed(2)}% (${passed}/${total})`);
    
    return { passed, total, accuracy, results };
  }

  generateDetailedReport(sameKeyResults, differentKeyResults, inventoryResults) {
    console.log('\n📋 DETAILED V1.2 HYBRID QA REPORT');
    console.log('='.repeat(60));

    // Same Key Consistency Analysis
    console.log('\n🔍 SAME KEY CONSISTENCY ANALYSIS:');
    for (const result of sameKeyResults.results) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${result.keyId}: ${result.score.toFixed(3)} (${result.status}) ${status}`);
      console.log(`     Contour: ${result.contourSimilarity.toFixed(3)}, Bitting: ${result.bittingSimilarity.toFixed(3)}`);
      console.log(`     Bow: ${result.bowSimilarity.toFixed(3)}, Shank: ${result.shankSimilarity.toFixed(3)}`);
    }

    // Different Key Discrimination Analysis
    console.log('\n🔍 DIFFERENT KEY DISCRIMINATION ANALYSIS:');
    for (const result of differentKeyResults.results) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${result.keyA} vs ${result.keyB}: ${result.score.toFixed(3)} (${result.status}) ${status}`);
      console.log(`     Contour: ${result.contourSimilarity.toFixed(3)}, Bitting: ${result.bittingSimilarity.toFixed(3)}`);
      console.log(`     Bow: ${result.bowSimilarity.toFixed(3)}, Shank: ${result.shankSimilarity.toFixed(3)}`);
    }

    // Inventory Simulation Analysis
    console.log('\n🔍 INVENTORY SIMULATION ANALYSIS:');
    for (const result of inventoryResults.results) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   Query ${result.queryKey}: ${result.score.toFixed(3)} (${result.status}) ${status}`);
      console.log(`     Delta Margin: ${result.deltaMargin.toFixed(3)}, Confident: ${result.isConfidentMatch ? 'YES' : 'NO'}`);
    }

    // Score Statistics
    const allScores = [
      ...sameKeyResults.results.map(r => r.score),
      ...differentKeyResults.results.map(r => r.score),
      ...inventoryResults.results.map(r => r.score)
    ];

    const meanScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const minScore = Math.min(...allScores);
    const maxScore = Math.max(...allScores);
    const stdDev = Math.sqrt(allScores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / allScores.length);

    console.log('\n📊 SCORE STATISTICS:');
    console.log(`   Mean Score: ${meanScore.toFixed(3)}`);
    console.log(`   Min Score: ${minScore.toFixed(3)}`);
    console.log(`   Max Score: ${maxScore.toFixed(3)}`);
    console.log(`   Std Deviation: ${stdDev.toFixed(3)}`);

    // Threshold Recommendations
    console.log('\n🎯 V1.2 HYBRID THRESHOLD RECOMMENDATIONS:');
    console.log('   Current V1.2 Hybrid thresholds:');
    console.log(`     Same Key: MATCH≥${this.thresholds.sameKey.match}, POSSIBLE≥${this.thresholds.sameKey.possible}, NO_MATCH≥${this.thresholds.sameKey.noMatch}`);
    console.log(`     Different Key: MATCH≥${this.thresholds.differentKey.match}, POSSIBLE≥${this.thresholds.differentKey.possible}, NO_MATCH≥${this.thresholds.differentKey.noMatch}`);
    console.log(`     Inventory: MATCH≥${this.thresholds.inventory.match}, POSSIBLE≥${this.thresholds.inventory.possible}, NO_MATCH≥${this.thresholds.inventory.noMatch}`);
    console.log(`   Weights: Contour=${this.weights.contour}, Bitting=${this.weights.bitting}, Bow=${this.weights.bow}, Shank=${this.weights.shank}`);
    console.log(`   Delta Margin: ${this.deltaMargin}`);
    
    const sameKeyScores = sameKeyResults.results.map(r => r.score);
    const differentKeyScores = differentKeyResults.results.map(r => r.score);
    
    const sameKeyMean = sameKeyScores.reduce((a, b) => a + b, 0) / sameKeyScores.length;
    const differentKeyMean = differentKeyScores.reduce((a, b) => a + b, 0) / differentKeyScores.length;
    
    console.log(`   Same Key Mean Score: ${sameKeyMean.toFixed(3)}`);
    console.log(`   Different Key Mean Score: ${differentKeyMean.toFixed(3)}`);
  }

  async runCompleteQA() {
    console.log('🚀 Starting V1.2 Hybrid QA Testing...');
    console.log('='.repeat(60));

    try {
      // Load dataset
      const keys = await this.loadDataset();
      console.log(`📁 Loaded ${keys.length} keys from dataset`);

      // Extract signatures
      const keysWithSignatures = await this.extractSignatures(keys);

      // Run tests
      const sameKeyResults = await this.testSameKeyConsistency(keysWithSignatures);
      const differentKeyResults = await this.testDifferentKeyDiscrimination(keysWithSignatures);
      const inventoryResults = await this.testInventorySimulation(keysWithSignatures);

      // Generate detailed report
      this.generateDetailedReport(sameKeyResults, differentKeyResults, inventoryResults);

      // Calculate overall accuracy
      const totalPassed = sameKeyResults.passed + differentKeyResults.passed + inventoryResults.passed;
      const totalTests = sameKeyResults.total + differentKeyResults.total + inventoryResults.total;
      const overallAccuracy = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

      console.log('\n🎯 FINAL V1.2 HYBRID RESULTS:');
      console.log('='.repeat(60));
      console.log(`📊 Same Key Consistency: ${sameKeyResults.accuracy.toFixed(2)}%`);
      console.log(`📊 Different Key Discrimination: ${differentKeyResults.accuracy.toFixed(2)}%`);
      console.log(`📊 Inventory Simulation: ${inventoryResults.accuracy.toFixed(2)}%`);
      console.log(`📊 Overall Accuracy: ${overallAccuracy.toFixed(2)}%`);

      return {
        success: true,
        accuracy: overallAccuracy,
        results: {
          sameKey: sameKeyResults.accuracy,
          differentKey: differentKeyResults.accuracy,
          inventory: inventoryResults.accuracy,
          overall: overallAccuracy
        }
      };

    } catch (error) {
      console.error('❌ V1.2 Hybrid QA Testing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run QA testing
const tester = new V12HybridTester();
tester.runCompleteQA().then(result => {
  if (result.success) {
    console.log('\n✅ V1.2 Hybrid QA Testing completed successfully!');
    console.log(`🎯 Overall Accuracy: ${result.accuracy.toFixed(2)}%`);
  } else {
    console.log('\n❌ V1.2 Hybrid QA Testing failed:', result.error);
  }
}).catch(error => {
  console.error('❌ Unexpected error:', error.message);
});
