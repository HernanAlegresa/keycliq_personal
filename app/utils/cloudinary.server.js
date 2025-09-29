import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Subir imagen a Cloudinary
 * @param {string} imageDataUrl - Data URL de la imagen (data:image/jpeg;base64,...)
 * @param {string} folder - Carpeta donde guardar (opcional)
 * @returns {Promise<Object>} Resultado de la subida
 */
export async function uploadImageToCloudinary(imageDataUrl, folder = 'keycliq_keys') {
  try {
    // Convertir data URL a buffer
    const base64Data = imageDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Eliminar imagen de Cloudinary
 * @param {string} publicId - Public ID de la imagen
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export async function deleteImageFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtener URL optimizada de Cloudinary
 * @param {string} publicId - Public ID de la imagen
 * @param {Object} options - Opciones de transformación
 * @returns {string} URL optimizada
 */
export function getOptimizedImageUrl(publicId, options = {}) {
  const defaultOptions = {
    width: 400,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  };

  const transformOptions = { ...defaultOptions, ...options };
  
  return cloudinary.url(publicId, {
    ...transformOptions,
    secure: true,
  });
}
