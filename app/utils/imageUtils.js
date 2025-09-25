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
