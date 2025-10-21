import { prisma } from "../utils/db.server.js";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary.server.js";
import { extractFeaturesV5 } from "./keyscan.server.js";

/**
 * Obtener todas las llaves de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} search - T├®rmino de b├║squeda opcional
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
 * Obtener una llave espec├¡fica por ID
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
 * Obtener las últimas llaves del usuario (para Recent Keys)
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número de llaves a obtener (default: 2)
 * @returns {Promise<Array>} Lista de llaves más recientes
 */
export async function getRecentKeys(userId, limit = 2) {
  return await prisma.key.findMany({
    where: {
      userId
    },
    orderBy: { 
      createdAt: "desc" 
    },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      createdAt: true
    }
  });
}

/**
 * Crear una nueva llave
 * @param {Object} keyData - Datos de la llave
 * @param {string} keyData.userId - ID del usuario
 * @param {string} keyData.name - Nombre de la llave
 * @param {string} keyData.description - Descripci├│n opcional
 * @param {string} keyData.imageDataUrl - Data URL de la imagen
 * @returns {Promise<Object>} Llave creada
 */
export async function createKey({ userId, name, description, unit, door, notes, imageDataUrl }) {
  try {
    let imageUrl = null;
    let imagePublicId = null;
    let signature = null;
    let sigStatus = "pending";

    // Subir imagen a Cloudinary solo si est├í configurado (staging/production)
    if (imageDataUrl && imageDataUrl.startsWith('data:')) {
      const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET;
      
      if (hasCloudinaryConfig) {
        console.log('­ƒôñ Subiendo imagen a Cloudinary...');
        const uploadResult = await uploadImageToCloudinary(imageDataUrl);
        
        if (uploadResult.success) {
          imageUrl = uploadResult.url;
          imagePublicId = uploadResult.publicId;
          console.log('Ô£à Imagen subida a Cloudinary:', imageUrl);
        } else {
          console.error('ÔØî Error subiendo imagen a Cloudinary:', uploadResult.error);
          // Continuar sin imagen en caso de error
        }
      } else {
        console.log('ÔÜá´©Å  Cloudinary no configurado - modo localhost (imagen en memoria)');
        // En localhost: guardar un placeholder o null
        // La imagen se mantiene en sessionStorage para display
        imageUrl = null;
        imagePublicId = null;
      }
    }

    // Extraer signature V5 si tenemos imagen
    if (imageDataUrl && imageDataUrl.startsWith('data:')) {
      try {
        // Extraer signature
        console.log('🔬 Extrayendo signature V5...');
        const startSig = Date.now();
        
        const features = await extractFeaturesV5(imageDataUrl);
        
        // Verificar calidad de features
        const isSegmentationValid = features.quality.segmentationValid === true;
        const isBittingValid = features.quality.bittingValid === true;
        
        console.log(`­ƒôè Quality check: segmentation=${isSegmentationValid}, bitting=${isBittingValid}`);
        
        if (isSegmentationValid && isBittingValid) {
          signature = features;
          sigStatus = "ready";
          
          const sigTime = Date.now() - startSig;
          console.log(`Ô£à Signature extra├¡da exitosamente en ${sigTime}ms`);
        } else {
          console.warn('ÔÜá´©Å  Feature extraction quality insufficient');
          console.warn(`   segmentationValid: ${features.quality.segmentationValid} (${typeof features.quality.segmentationValid})`);
          console.warn(`   bittingValid: ${features.quality.bittingValid} (${typeof features.quality.bittingValid})`);
          
          // En localhost, ser m├ís permisivo para testing
          if (process.env.NODE_ENV === 'development') {
            console.log('­ƒöº Modo desarrollo: Aceptando signature aunque quality sea insuficiente');
            signature = features;
            sigStatus = "ready";
          } else {
            sigStatus = "failed";
          }
        }
      } catch (error) {
        console.error('ÔØî Error extrayendo signature:', error.message);
        sigStatus = "failed";
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
        signature: signature,
        sigStatus: sigStatus
      }
    });

    console.log('Ô£à Llave creada exitosamente:', key.id);
    console.log(`   sigStatus: ${sigStatus}`);
    return key;
  } catch (error) {
    console.error('ÔØî Error creando llave:', error);
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

  // Manejar actualizaci├│n de imagen si se proporciona
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
 * @returns {Promise<boolean>} true si se elimin├│, false si no se encontr├│
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
      // Continuar con la eliminaci├│n de la llave aunque falle la eliminaci├│n de la imagen
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
 * @param {Array} signature - Vector de caracter├¡sticas opcional
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
 * Obtener estad├¡sticas de llaves de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estad├¡sticas
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
