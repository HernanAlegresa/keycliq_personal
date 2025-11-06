/**
 * Convert a blob URL to a data URL
 * @param {string} blobUrl - Blob URL
 * @returns {Promise<string>} Data URL
 */
export async function blobToDataURL(blobUrl) {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting blob to data URL:', error);
    throw error;
  }
}

/**
 * Convert a file to a data URL
 * @param {File} file - File object
 * @returns {Promise<string>} Data URL
 */
export async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to convert file to data URL'));
    reader.readAsDataURL(file);
  });
}

/**
 * Construye una URL optimizada de Cloudinary agregando transformaciones comunes
 * sin necesidad de conocer el publicId.
 *
 * @param {string} imageUrl - URL original devuelta por Cloudinary
 * @param {Object} options - Opciones de transformación
 * @param {number} [options.width] - Anchura deseada (se redondea al entero más cercano)
 * @param {number} [options.height] - Altura deseada (opcional)
 * @param {string|null} [options.crop] - Estrategia de recorte (fill, limit, etc.). Null para omitir
 * @param {string|null} [options.gravity] - Gravity cuando se usa crop fill (por defecto auto)
 * @param {string|null} [options.quality] - Calidad (auto por defecto)
 * @param {string|null} [options.format] - Formato (auto por defecto)
 * @returns {string} URL transformada o la original si no es Cloudinary
 */
export function buildOptimizedCloudinaryUrl(
  imageUrl,
  {
    width,
    height,
    crop = 'fill',
    gravity,
    quality = 'auto',
    format = 'auto',
  } = {}
) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  if (!imageUrl.includes('/upload/')) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    const [prefix, suffix] = url.pathname.split('/upload/');
    if (!suffix) {
      return imageUrl;
    }

    const suffixParts = suffix.split('/');
    const firstPart = suffixParts[0];
    const restParts = suffixParts.slice(1);

    const desiredTokens = [];
    if (format) desiredTokens.push(`f_${format}`);
    if (quality) desiredTokens.push(`q_${quality}`);

    if (crop) {
      desiredTokens.push(`c_${crop}`);
      if (!gravity && crop === 'fill') {
        desiredTokens.push('g_auto');
      }
    }

    if (gravity) {
      desiredTokens.push(`g_${gravity}`);
    }

    if (width) {
      desiredTokens.push(`w_${Math.round(width)}`);
    }

    if (height) {
      desiredTokens.push(`h_${Math.round(height)}`);
    }

    if (desiredTokens.length === 0) {
      return imageUrl;
    }

    const overridePrefixes = desiredTokens.map((token) => token.split('_')[0]);

    if (firstPart.startsWith('v')) {
      url.pathname = `${prefix}/upload/${desiredTokens.join(',')}/${suffix}`;
    } else {
      const existingTokens = firstPart.split(',');
      const filteredExisting = existingTokens.filter((token) => {
        const prefixKey = token.split('_')[0];
        return !overridePrefixes.includes(prefixKey);
      });
      const mergedTokens = [...filteredExisting, ...desiredTokens];
      url.pathname = `${prefix}/upload/${mergedTokens.join(',')}/${restParts.join('/')}`;
    }

    return url.toString();
  } catch (error) {
    console.warn('Failed to build optimized Cloudinary URL', error);
    return imageUrl;
  }
}