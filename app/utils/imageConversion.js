/**
 * Convert data URL to binary data and MIME type
 * @param {string} dataUrl - Data URL (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
 * @returns {Object} { data: Buffer, mimeType: string }
 */
export function dataUrlToBinary(dataUrl) {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      throw new Error('Invalid data URL');
    }

    // Parse data URL
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid data URL format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Convert base64 to binary
    const binaryData = Buffer.from(base64Data, 'base64');
    
    return {
      data: binaryData,
      mimeType: mimeType
    };
  } catch (error) {
    console.error('Error converting data URL to binary:', error);
    throw error;
  }
}

/**
 * Get MIME type from file or data URL
 * @param {string} input - File path, data URL, or MIME type string
 * @returns {string} MIME type
 */
export function getMimeType(input) {
  if (input.startsWith('data:')) {
    const matches = input.match(/^data:([A-Za-z-+\/]+);/);
    return matches ? matches[1] : 'image/jpeg';
  }
  
  // Default to JPEG
  return 'image/jpeg';
}
