import { prisma } from "../utils/db.server.js";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary.server.js";

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
 * @param {string} keyData.imageDataUrl - Data URL de la imagen
 * @returns {Promise<Object>} Llave creada
 */
export async function createKey({ userId, name, description, unit, door, notes, imageDataUrl }) {
  try {
    let imageUrl = null;
    let imagePublicId = null;

    // Subir imagen a Cloudinary si se proporciona
    if (imageDataUrl && imageDataUrl.startsWith('data:')) {
      console.log('📤 Subiendo imagen a Cloudinary...');
      const uploadResult = await uploadImageToCloudinary(imageDataUrl);
      
      if (uploadResult.success) {
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
        console.log('✅ Imagen subida a Cloudinary:', imageUrl);
      } else {
        console.error('❌ Error subiendo imagen a Cloudinary:', uploadResult.error);
        // Continuar sin imagen en caso de error
      }
    }

    const key = await prisma.key.create({
      data: {
        userId,
        name,
        description,
        unit: unit || null,
        door: door || null,
        notes: notes || null,
        imageUrl: imageUrl,
        imagePublicId: imagePublicId,
        sigStatus: "pending"
      }
    });

    console.log('✅ Llave creada exitosamente:', key.id);
    return key;
  } catch (error) {
    console.error('❌ Error creando llave:', error);
    throw error;
  }
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

  // Manejar actualización de imagen si se proporciona
  if (updateData.imageDataUrl && updateData.imageDataUrl.startsWith('data:')) {
    // Eliminar imagen anterior de Cloudinary si existe
    if (existingKey.imagePublicId) {
      await deleteImageFromCloudinary(existingKey.imagePublicId);
    }

    // Subir nueva imagen a Cloudinary
    const uploadResult = await uploadImageToCloudinary(updateData.imageDataUrl);
    
    if (uploadResult.success) {
      updateData.imageUrl = uploadResult.url;
      updateData.imagePublicId = uploadResult.publicId;
      console.log('Image updated in Cloudinary:', uploadResult.url);
    } else {
      console.error('Failed to upload new image to Cloudinary:', uploadResult.error);
      // Mantener imagen anterior en caso de error
      delete updateData.imageDataUrl;
    }
  }

  // Remover imageDataUrl del updateData ya que no es un campo de la base de datos
  delete updateData.imageDataUrl;

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

  // Eliminar imagen de Cloudinary si existe
  if (existingKey.imagePublicId) {
    const deleteResult = await deleteImageFromCloudinary(existingKey.imagePublicId);
    if (deleteResult.success) {
      console.log('Image deleted from Cloudinary:', existingKey.imagePublicId);
    } else {
      console.error('Failed to delete image from Cloudinary:', deleteResult.error);
      // Continuar con la eliminación de la llave aunque falle la eliminación de la imagen
    }
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
    errors.push("Name is required");
  }

  if (data.name && data.name.length > 100) {
    errors.push("Name cannot be longer than 100 characters");
  }

  if (data.description && data.description.length > 500) {
    errors.push("Description cannot be longer than 500 characters");
  }

  if (data.images && !Array.isArray(data.images)) {
    errors.push("Images must be an array");
  }

  if (data.images && data.images.length > 10) {
    errors.push("Cannot upload more than 10 images per key");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
