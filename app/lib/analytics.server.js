/**
 * Analytics and User History
 * Provides access to user data history and analytics
 */

import { prisma } from '../utils/db.server.js';

/**
 * Obtener historial completo de un usuario (escaneos + matchings)
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número máximo de queries a devolver (default: 50)
 * @returns {Promise<Array>} Lista de queries con sus matchings ordenados por fecha (más reciente primero)
 */
export async function getUserHistory(userId, limit = 50) {
  try {
    const queries = await prisma.keyQuery.findMany({
      where: { userId },
      include: {
        matchings: {
          include: {
            matchedKey: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Formatear respuesta
    return queries.map(query => ({
      query: {
        id: query.id,
        createdAt: query.createdAt,
        result: query.result
      },
      matchings: query.matchings.map(m => ({
        id: m.id,
        matchType: m.matchType,
        similarity: m.similarity,
        matchedKey: m.matchedKey ? {
          id: m.matchedKey.id,
          name: m.matchedKey.name,
          description: m.matchedKey.description
        } : null,
        createdAt: m.createdAt
      }))
    }));
  } catch (error) {
    console.error('❌ Failed to get user history:', error.message);
    throw error;
  }
}

