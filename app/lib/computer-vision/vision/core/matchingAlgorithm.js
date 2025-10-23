/**
 * Matching Algorithm Core Module - V1.2 Hybrid
 * Enhanced matching with adaptive thresholds and delta-margin scoring
 * 20D signature: 8D contour + 6D bitting + 3D bow + 3D shank
 */

export class MatchingAlgorithm {
  constructor(config = {}) {
    this.config = {
      // Adaptive thresholds by context
      thresholds: {
        sameKey: {
          match: config.sameKeyMatch || 0.90,
          possible: config.sameKeyPossible || 0.80,
          noMatch: config.sameKeyNoMatch || 0.70
        },
        differentKey: {
          match: config.differentKeyMatch || 0.95,
          possible: config.differentKeyPossible || 0.85,
          noMatch: config.differentKeyNoMatch || 0.75
        },
        inventory: {
          match: config.inventoryMatch || 0.92,
          possible: config.inventoryPossible || 0.82,
          noMatch: config.inventoryNoMatch || 0.72
        }
      },
      // Enhanced weights for 20D signature
      weights: {
        contour: 0.30,    // 30% contour features (8D)
        bitting: 0.50,    // 50% bitting features (6D)
        bow: 0.15,        // 15% bow features (3D)
        shank: 0.05       // 5% shank features (3D)
      },
      // Delta margin for top matches
      deltaMargin: config.deltaMargin || 0.05,
      algorithm: 'cosine_similarity'
    };
  }

  /**
   * Compare two key signatures using enhanced weighted scoring
   * @param {Array} signatureA - First signature (20D)
   * @param {Array} signatureB - Second signature (20D)
   * @param {string} context - Context type ('sameKey', 'differentKey', 'inventory')
   * @returns {Object} Comparison result with score and status
   */
  compareSignatures(signatureA, signatureB, context = 'inventory') {
    try {
      // Validate signatures
      if (!signatureA || !signatureB) {
        throw new Error('Invalid signatures provided');
      }

      if (signatureA.length !== 20 || signatureB.length !== 20) {
        throw new Error('Signatures must be 20D (8D contour + 6D bitting + 3D bow + 3D shank)');
      }

      // Split signatures into feature groups
      const contourA = signatureA.slice(0, 8);
      const bittingA = signatureA.slice(8, 14);
      const bowA = signatureA.slice(14, 17);
      const shankA = signatureA.slice(17, 20);
      
      const contourB = signatureB.slice(0, 8);
      const bittingB = signatureB.slice(8, 14);
      const bowB = signatureB.slice(14, 17);
      const shankB = signatureB.slice(17, 20);

      // Calculate similarities for each feature group
      const contourSimilarity = this.calculateCosineSimilarity(contourA, contourB);
      const bittingSimilarity = this.calculateCosineSimilarity(bittingA, bittingB);
      const bowSimilarity = this.calculateCosineSimilarity(bowA, bowB);
      const shankSimilarity = this.calculateCosineSimilarity(shankA, shankB);

      // Calculate weighted score
      const weightedScore = this.calculateWeightedScore({
        contour: contourSimilarity,
        bitting: bittingSimilarity,
        bow: bowSimilarity,
        shank: shankSimilarity
      });

      // Determine match status using adaptive thresholds
      const matchStatus = this.determineMatchStatus(weightedScore, context);

      return {
        score: weightedScore,
        status: matchStatus,
        context: context,
        details: {
          contourSimilarity,
          bittingSimilarity,
          bowSimilarity,
          shankSimilarity,
          weights: this.config.weights
        }
      };

    } catch (error) {
      throw new Error(`Error comparing signatures: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} vectorA - First vector
   * @param {Array} vectorB - Second vector
   * @returns {number} Cosine similarity (0-1)
   */
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

  /**
   * Calculate weighted score from feature similarities
   * @param {Object} similarities - Feature similarities
   * @returns {number} Weighted score (0-1)
   */
  calculateWeightedScore(similarities) {
    const { contour, bitting, bow, shank } = similarities;
    const { weights } = this.config;
    
    return (weights.contour * contour) + 
           (weights.bitting * bitting) + 
           (weights.bow * bow) + 
           (weights.shank * shank);
  }

  /**
   * Determine match status using adaptive thresholds
   * @param {number} score - Weighted similarity score
   * @param {string} context - Context type
   * @returns {string} Match status
   */
  determineMatchStatus(score, context) {
    const thresholds = this.config.thresholds[context] || this.config.thresholds.inventory;
    
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

  /**
   * Find best match in inventory with delta-margin analysis
   * @param {Array} querySignature - Query signature (20D)
   * @param {Array} inventorySignatures - Array of inventory signatures
   * @param {string} context - Context type
   * @returns {Object} Best match result with delta analysis
   */
  findBestMatch(querySignature, inventorySignatures, context = 'inventory') {
    try {
      if (!inventorySignatures || inventorySignatures.length === 0) {
        return {
          status: 'NO_MATCH',
          score: 0,
          deltaMargin: 0,
          message: 'No keys in inventory'
        };
      }

      let bestMatch = null;
      let secondBestMatch = null;
      let bestScore = 0;
      let secondBestScore = 0;

      // Compare with each inventory signature
      for (let i = 0; i < inventorySignatures.length; i++) {
        const comparison = this.compareSignatures(querySignature, inventorySignatures[i], context);
        
        if (comparison.score > bestScore) {
          // Move current best to second best
          secondBestMatch = bestMatch;
          secondBestScore = bestScore;
          
          // Set new best
          bestScore = comparison.score;
          bestMatch = {
            index: i,
            score: comparison.score,
            status: comparison.status,
            details: comparison.details
          };
        } else if (comparison.score > secondBestScore) {
          secondBestScore = comparison.score;
          secondBestMatch = {
            index: i,
            score: comparison.score,
            status: comparison.status,
            details: comparison.details
          };
        }
      }

      // Calculate delta margin
      const deltaMargin = bestScore - secondBestScore;
      const isConfidentMatch = deltaMargin >= this.config.deltaMargin;

      return {
        ...bestMatch,
        deltaMargin,
        isConfidentMatch,
        secondBestScore,
        finalStatus: isConfidentMatch ? bestMatch.status : 'LOW_CONFIDENCE'
      };

    } catch (error) {
      throw new Error(`Error finding best match: ${error.message}`);
    }
  }

  /**
   * Update adaptive thresholds for different contexts
   * @param {string} context - Context type
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(context, newThresholds) {
    if (this.config.thresholds[context]) {
      this.config.thresholds[context] = {
        ...this.config.thresholds[context],
        ...newThresholds
      };
    } else {
      throw new Error(`Unknown context: ${context}`);
    }
  }

  /**
   * Update weights for feature groups
   * @param {Object} newWeights - New weight values
   */
  updateWeights(newWeights) {
    this.config.weights = {
      ...this.config.weights,
      ...newWeights
    };
  }

  /**
   * Update delta margin for confidence analysis
   * @param {number} newDeltaMargin - New delta margin value
   */
  updateDeltaMargin(newDeltaMargin) {
    this.config.deltaMargin = newDeltaMargin;
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Validate signature format
   * @param {Array} signature - Signature to validate
   * @returns {boolean} Is valid
   */
  validateSignature(signature) {
    if (!Array.isArray(signature)) {
      return false;
    }

    if (signature.length !== 20) {
      return false;
    }

    // Check if all values are numbers
    return signature.every(value => typeof value === 'number' && !isNaN(value));
  }

  /**
   * Analyze signature quality
   * @param {Array} signature - Signature to analyze
   * @returns {Object} Quality metrics
   */
  analyzeSignatureQuality(signature) {
    if (!this.validateSignature(signature)) {
      return { isValid: false, quality: 0 };
    }

    // Split signature into feature groups
    const contour = signature.slice(0, 8);
    const bitting = signature.slice(8, 14);
    const bow = signature.slice(14, 17);
    const shank = signature.slice(17, 20);

    // Calculate feature quality metrics
    const contourQuality = this.calculateFeatureQuality(contour);
    const bittingQuality = this.calculateFeatureQuality(bitting);
    const bowQuality = this.calculateFeatureQuality(bow);
    const shankQuality = this.calculateFeatureQuality(shank);

    const overallQuality = (contourQuality + bittingQuality + bowQuality + shankQuality) / 4;

    return {
      isValid: true,
      quality: overallQuality,
      details: {
        contour: contourQuality,
        bitting: bittingQuality,
        bow: bowQuality,
        shank: shankQuality
      }
    };
  }

  /**
   * Calculate feature quality based on variance and range
   * @param {Array} features - Feature vector
   * @returns {number} Quality score (0-1)
   */
  calculateFeatureQuality(features) {
    if (features.length === 0) return 0;

    const mean = features.reduce((a, b) => a + b, 0) / features.length;
    const variance = features.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / features.length;
    const stdDev = Math.sqrt(variance);
    const range = Math.max(...features) - Math.min(...features);

    // Quality based on variance and range
    const varianceQuality = Math.min(1, stdDev / 0.5); // Good variance
    const rangeQuality = Math.min(1, range / 0.8); // Good range
    const overallQuality = (varianceQuality + rangeQuality) / 2;

    return Math.max(0, Math.min(1, overallQuality));
  }
}

