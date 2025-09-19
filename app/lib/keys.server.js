import { prisma } from "../utils/db.server.js";

/**
 * Obtener todas las llaves de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} search - Término de búsqueda opcional
 * @returns {Promise<Array>} Lista de llaves
 */
export async function getUserKeys(userId, search = "") {
  const where = {
    userId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    })
  };

  return await prisma.key.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });
}

/**
 * Obtener una llave específica por ID
 * @param {string} keyId - ID de la llave
 * @param {string} userId - ID del usuario (para verificar ownership)
 * @returns {Promise<Object|null>} Llave encontrada o null
 */
export async function getKeyById(keyId, userId) {
  return await prisma.key.findFirst({
    where: {
      id: keyId,
      userId
    }
  });
}

/**
 * Crear una nueva llave
 * @param {Object} keyData - Datos de la llave
 * @param {string} keyData.userId - ID del usuario
 * @param {string} keyData.name - Nombre de la llave
 * @param {string} keyData.description - Descripción opcional
 * @param {Array} keyData.images - Array de URLs de imágenes
 * @returns {Promise<Object>} Llave creada
 */
export async function createKey({ userId, name, description, unit, door, notes, images = [] }) {
  return await prisma.key.create({
    data: {
      userId,
      name,
      description,
      unit: unit || null,
      door: door || null,
      notes: notes || null,
      images: images.length > 0 ? images : null,
      sigStatus: "pending"
    }
  });
}

/**
 * Actualizar una llave existente
 * @param {string} keyId - ID de la llave
 * @param {string} userId - ID del usuario (para verificar ownership)
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object|null>} Llave actualizada o null
 */
export async function updateKey(keyId, userId, updateData) {
  // Verificar que la llave pertenece al usuario
  const existingKey = await getKeyById(keyId, userId);
  if (!existingKey) {
    return null;
  }

  return await prisma.key.update({
    where: { id: keyId },
    data: {
      ...updateData,
      updatedAt: new Date()
    }
  });
}

/**
 * Eliminar una llave
 * @param {string} keyId - ID de la llave
 * @param {string} userId - ID del usuario (para verificar ownership)
 * @returns {Promise<boolean>} true si se eliminó, false si no se encontró
 */
export async function deleteKey(keyId, userId) {
  // Verificar que la llave pertenece al usuario
  const existingKey = await getKeyById(keyId, userId);
  if (!existingKey) {
    return false;
  }

  await prisma.key.delete({
    where: { id: keyId }
  });

  return true;
}

/**
 * Actualizar el estado de firma de una llave
 * @param {string} keyId - ID de la llave
 * @param {string} userId - ID del usuario
 * @param {string} sigStatus - Nuevo estado ('pending' | 'ready' | 'failed')
 * @param {Array} signature - Vector de características opcional
 * @returns {Promise<Object|null>} Llave actualizada o null
 */
export async function updateKeySignature(keyId, userId, sigStatus, signature = null) {
  const existingKey = await getKeyById(keyId, userId);
  if (!existingKey) {
    return null;
  }

  return await prisma.key.update({
    where: { id: keyId },
    data: {
      sigStatus,
      ...(signature && { signature })
    }
  });
}

/**
 * Obtener estadísticas de llaves de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas
 */
export async function getKeyStats(userId) {
  const [total, pending, ready, failed] = await Promise.all([
    prisma.key.count({ where: { userId } }),
    prisma.key.count({ where: { userId, sigStatus: "pending" } }),
    prisma.key.count({ where: { userId, sigStatus: "ready" } }),
    prisma.key.count({ where: { userId, sigStatus: "failed" } })
  ]);

  return {
    total,
    pending,
    ready,
    failed
  };
}

/**
 * Validar datos de llave
 * @param {Object} data - Datos a validar
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export function validateKeyData(data) {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push("El nombre es requerido");
  }

  if (data.name && data.name.length > 100) {
    errors.push("El nombre no puede tener más de 100 caracteres");
  }

  if (data.description && data.description.length > 500) {
    errors.push("La descripción no puede tener más de 500 caracteres");
  }

  if (data.images && !Array.isArray(data.images)) {
    errors.push("Las imágenes deben ser un array");
  }

  if (data.images && data.images.length > 10) {
    errors.push("No se pueden subir más de 10 imágenes por llave");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
