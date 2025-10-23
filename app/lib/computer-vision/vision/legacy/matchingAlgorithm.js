/**
 * Matching Algorithm Core Module - V1 Simplified
 * Handles key signature comparison with single distance metric
 * Score: 0.6*bitting + 0.4*contour
 */

export class MatchingAlgorithm {
  constructor(config = {}) {
    this.config = {
      matchThreshold: config.matchThreshold || 0.85,
      possibleThreshold: config.possibleThreshold || 0.75,
      noMatchThreshold: config.noMatchThreshold || 0.65,
      algorithm: 'cosine_similarity',
      weights: {
        contour: 0.4,    // 40% contour features
        bitting: 0.6      // 60% bitting features
      }
    };
  }

  /**
   * Compare two key signatures using weighted cosine similarity
   * @param {Array} signatureA - First signature (16D)
   * @param {Array} signatureB - Second signature (16D)
   * @returns {Object} Comparison result with score and status
   */
  compareSignatures(signatureA, signatureB) {
    try {
      // Validate signatures
      if (!signatureA || !signatureB) {
        throw new Error('Invalid signatures provided');
      }

      if (signatureA.length !== 16 || signatureB.length !== 16) {
        throw new Error('Signatures must be 16D (8D contour + 8D bitting)');
      }

      // Split signatures into contour and bitting parts
      const contourA = signatureA.slice(0, 8);
      const bittingA = signatureA.slice(8, 16);
      const contourB = signatureB.slice(0, 8);
      const bittingB = signatureB.slice(8, 16);

      // Calculate cosine similarity for each part
      const contourSimilarity = this.calculateCosineSimilarity(contourA, contourB);
      const bittingSimilarity = this.calculateCosineSimilarity(bittingA, bittingB);

      // Calculate weighted score
      const weightedScore = this.calculateWeightedScore(contourSimilarity, bittingSimilarity);

      // Determine match status
      const matchStatus = this.determineMatchStatus(weightedScore);

      return {
        score: weightedScore,
        status: matchStatus,
        details: {
          contourSimilarity,
          bittingSimilarity,
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
   * Calculate weighted score from contour and bitting similarities
   * @param {number} contourSimilarity - Contour similarity score
   * @param {number} bittingSimilarity - Bitting similarity score
   * @returns {number} Weighted score (0-1)
   */
  calculateWeightedScore(contourSimilarity, bittingSimilarity) {
    const { contour, bitting } = this.config.weights;
    
    return (contour * contourSimilarity) + (bitting * bittingSimilarity);
  }

  /**
   * Determine match status based on score and thresholds
   * @param {number} score - Weighted similarity score
   * @returns {string} Match status
   */
  determineMatchStatus(score) {
    if (score >= this.config.matchThreshold) {
      return 'MATCH';
    } else if (score >= this.config.possibleThreshold) {
      return 'POSSIBLE';
    } else if (score >= this.config.noMatchThreshold) {
      return 'LOW_CONFIDENCE';
    } else {
      return 'NO_MATCH';
    }
  }

  /**
   * Find best match in inventory
   * @param {Array} querySignature - Query signature (16D)
   * @param {Array} inventorySignatures - Array of inventory signatures
   * @returns {Object} Best match result
   */
  findBestMatch(querySignature, inventorySignatures) {
    try {
      if (!inventorySignatures || inventorySignatures.length === 0) {
        return {
          status: 'NO_MATCH',
          score: 0,
          message: 'No keys in inventory'
        };
      }

      let bestMatch = null;
      let bestScore = 0;

      // Compare with each inventory signature
      for (let i = 0; i < inventorySignatures.length; i++) {
        const comparison = this.compareSignatures(querySignature, inventorySignatures[i]);
        
        if (comparison.score > bestScore) {
          bestScore = comparison.score;
          bestMatch = {
            index: i,
            score: comparison.score,
            status: comparison.status,
            details: comparison.details
          };
        }
      }

      return bestMatch || {
        status: 'NO_MATCH',
        score: 0,
        message: 'No suitable match found'
      };

    } catch (error) {
      throw new Error(`Error finding best match: ${error.message}`);
    }
  }

  /**
   * Update thresholds for different contexts
   * @param {string} context - Context type ('sameKey', 'differentKey', 'inventory')
   * @param {Object} thresholds - New threshold values
   */
  updateThresholds(context, thresholds) {
    switch (context) {
      case 'sameKey':
        this.config.matchThreshold = thresholds.match || 0.80;
        this.config.possibleThreshold = thresholds.possible || 0.70;
        this.config.noMatchThreshold = thresholds.noMatch || 0.60;
        break;
      case 'differentKey':
        this.config.matchThreshold = thresholds.match || 0.95;
        this.config.possibleThreshold = thresholds.possible || 0.85;
        this.config.noMatchThreshold = thresholds.noMatch || 0.75;
        break;
      case 'inventory':
        this.config.matchThreshold = thresholds.match || 0.90;
        this.config.possibleThreshold = thresholds.possible || 0.80;
        this.config.noMatchThreshold = thresholds.noMatch || 0.70;
        break;
      default:
        throw new Error(`Unknown context: ${context}`);
    }
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

    if (signature.length !== 16) {
      return false;
    }

    // Check if all values are numbers
    return signature.every(value => typeof value === 'number' && !isNaN(value));
  }
}