/**
 * KeyScan Matching Database Operations
 * Handles saving and retrieving matching results
 */

import { prisma } from '../utils/db.server.js';

/**
 * Save matching result to database
 * @param {Object} params - Matching parameters
 * @param {string} params.userId - User ID
 * @param {string} params.keyQueryId - Key Query ID
 * @param {string|null} params.matchedKeyId - Matched Key ID (null if no match)
 * @param {string} params.matchType - MATCH_FOUND, POSSIBLE_MATCH, NO_MATCH
 * @param {number} params.similarity - Similarity score (0-1)
 * @param {number} params.confidence - Confidence score (0-1)
 * @param {Object} params.querySignature - Signature of the scanned key
 * @param {Object|null} params.matchedSignature - Signature of the matched key
 * @param {Object|null} params.comparisonResult - Detailed comparison results
 * @returns {Promise<Object>} Saved matching record
 */
export async function saveMatchingResult({
  userId,
  keyQueryId,
  matchedKeyId,
  matchType,
  similarity,
  confidence,
  querySignature,
  matchedSignature,
  comparisonResult
}) {
  try {
    console.log('💾 Saving matching result to database...');
    console.log(`   User ID: ${userId}`);
    console.log(`   Key Query ID: ${keyQueryId}`);
    console.log(`   Matched Key ID: ${matchedKeyId || 'None'}`);
    console.log(`   Match Type: ${matchType}`);
    console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
    console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);

    // Validación: MATCH_FOUND requiere matchedKeyId
    if (matchType === 'MATCH_FOUND' && !matchedKeyId) {
      const error = new Error('MATCH_FOUND requires matchedKeyId');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Validación: NO_MATCH no debe tener matchedKeyId
    if (matchType === 'NO_MATCH' && matchedKeyId) {
      const error = new Error('NO_MATCH should not have matchedKeyId');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const matching = await prisma.keyMatching.create({
      data: {
        userId,
        keyQueryId,
        matchedKeyId,
        matchType,
        similarity,
        confidence,
        querySignature,
        matchedSignature,
        comparisonResult
      }
    });

    console.log('✅ Matching result saved successfully');
    console.log(`   Matching ID: ${matching.id}`);

    return matching;
  } catch (error) {
    console.error('❌ Failed to save matching result:', error.message);
    throw error;
  }
}

/**
 * Get matching records for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of records to return
 * @param {number} options.offset - Number of records to skip
 * @param {string} options.matchType - Filter by match type
 * @returns {Promise<Array>} Array of matching records
 */
export async function getUserMatchings(userId, options = {}) {
  try {
    const { limit = 50, offset = 0, matchType } = options;

    const where = {
      userId
    };

    if (matchType) {
      where.matchType = matchType;
    }

    const matchings = await prisma.keyMatching.findMany({
      where,
      include: {
        keyQuery: {
          select: {
            id: true,
            queryType: true,
            createdAt: true
          }
        },
        matchedKey: {
          select: {
            id: true,
            name: true,
            location: true,
            unit: true,
            door: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return matchings;
  } catch (error) {
    console.error('❌ Failed to get user matchings:', error.message);
    throw error;
  }
}

/**
 * Get matching statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Matching statistics
 */
export async function getMatchingStats(userId) {
  try {
    const stats = await prisma.keyMatching.groupBy({
      by: ['matchType'],
      where: {
        userId
      },
      _count: {
        matchType: true
      }
    });

    const total = await prisma.keyMatching.count({
      where: { userId }
    });

    const result = {
      total,
      byType: {}
    };

    stats.forEach(stat => {
      result.byType[stat.matchType] = stat._count.matchType;
    });

    // Calculate percentages
    if (total > 0) {
      result.percentages = {
        MATCH_FOUND: ((result.byType.MATCH_FOUND || 0) / total * 100).toFixed(1),
        POSSIBLE_MATCH: ((result.byType.POSSIBLE_MATCH || 0) / total * 100).toFixed(1),
        NO_MATCH: ((result.byType.NO_MATCH || 0) / total * 100).toFixed(1)
      };
    }

    return result;
  } catch (error) {
    console.error('❌ Failed to get matching stats:', error.message);
    throw error;
  }
}

/**
 * Get detailed matching record by ID
 * @param {string} matchingId - Matching ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<Object|null>} Matching record or null
 */
export async function getMatchingById(matchingId, userId) {
  try {
    const matching = await prisma.keyMatching.findFirst({
      where: {
        id: matchingId,
        userId
      },
      include: {
        keyQuery: {
          select: {
            id: true,
            queryType: true,
            createdAt: true
          }
        },
        matchedKey: {
          select: {
            id: true,
            name: true,
            location: true,
            unit: true,
            door: true,
            imageUrl: true
          }
        }
      }
    });

    return matching;
  } catch (error) {
    console.error('❌ Failed to get matching by ID:', error.message);
    throw error;
  }
}
