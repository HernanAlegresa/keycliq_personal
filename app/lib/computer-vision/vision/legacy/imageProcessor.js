/**
 * Image Processing Core Module - V1 Simplified
 * Handles image loading, preprocessing, and feature extraction
 * 16D signature: 8D contour + 8D bitting
 */

import sharp from 'sharp';

export class ImageProcessor {
  constructor() {
    this.standardSize = { width: 200, height: 100 };
  }

  /**
   * Load and preprocess image
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Object} Processed image data
   */
  async loadImage(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      return {
        image,
        metadata,
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      throw new Error(`Error loading image: ${error.message}`);
    }
  }

  /**
   * Detect key ROI automatically based on contour
   * @param {Object} image - Sharp image object
   * @returns {Object} ROI coordinates and dimensions
   */
  async detectKeyROI(image) {
    // Detect ROI automatically based on contour
    const { data, info } = await image
      .greyscale()
      .normalize()
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasKey = false;

    // Find bounding box of contour
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = data[y * width + x];
        if (pixel > 0) { // White pixel (object)
          hasKey = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!hasKey) {
      // If no key detected, use full image
      return {
        x: 0,
        y: 0,
        width: width,
        height: height
      };
    }

    // Add 10% margin
    const margin = 0.1;
    const keyWidth = maxX - minX;
    const keyHeight = maxY - minY;
    const marginX = Math.floor(keyWidth * margin);
    const marginY = Math.floor(keyHeight * margin);

    return {
      x: Math.max(0, minX - marginX),
      y: Math.max(0, minY - marginY),
      width: Math.min(width - (minX - marginX), keyWidth + 2 * marginX),
      height: Math.min(height - (minY - marginY), keyHeight + 2 * marginY)
    };
  }

  /**
   * Normalize image to standard size
   * @param {Object} image - Sharp image object
   * @param {Object} roi - ROI coordinates
   * @returns {Object} Normalized image
   */
  async normalizeImage(image, roi) {
    // Crop ROI and normalize to standard size
    return await image
      .extract(roi)
      .resize(this.standardSize.width, this.standardSize.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .greyscale()
      .normalize();
  }

  /**
   * Apply adaptive threshold for better binarization
   * @param {Object} image - Sharp image object
   * @returns {Object} Binary image
   */
  async adaptiveThreshold(image) {
    // Adaptive binarization by regions
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const blockSize = 8;
    const C = 2; // Constant for adaptive threshold

    const result = new Uint8Array(data.length);

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        // Calculate local threshold
        let sum = 0;
        let count = 0;
        
        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            sum += data[(y + dy) * width + (x + dx)];
            count++;
          }
        }
        
        const localMean = sum / count;
        const threshold = localMean - C;

        // Apply local threshold
        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            const pixel = data[(y + dy) * width + (x + dx)];
            result[(y + dy) * width + (x + dx)] = pixel > threshold ? 255 : 0;
          }
        }
      }
    }

    return sharp(Buffer.from(result), { raw: { width, height, channels: 1 } });
  }

  /**
   * Extract 8 contour features
   * @param {Object} image - Binary image
   * @returns {Array} 8D contour features
   */
  async extractContourFeatures(image) {
    // Extract 8 contour features
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Edge density (proportion of edge pixels)
    let edgePixels = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = data[y * width + x];
        const top = data[(y - 1) * width + x];
        const bottom = data[(y + 1) * width + x];
        const left = data[y * width + (x - 1)];
        const right = data[y * width + (x + 1)];
        
        if (Math.abs(center - top) > 50 || Math.abs(center - bottom) > 50 ||
            Math.abs(center - left) > 50 || Math.abs(center - right) > 50) {
          edgePixels++;
        }
      }
    }
    features.push(edgePixels / (width * height));

    // 2. Aspect ratio
    features.push(width / height);

    // 3. Centroid X
    let sumX = 0, sumY = 0, count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    features.push(count > 0 ? sumX / count / width : 0.5);

    // 4. Centroid Y
    features.push(count > 0 ? sumY / count / height : 0.5);

    // 5. Compactness (perimeter²/area)
    const area = count;
    const perimeter = edgePixels;
    features.push(area > 0 ? (perimeter * perimeter) / area : 0);

    // 6. Solidity (area/convex hull area)
    features.push(0.8); // Placeholder - implement convex hull if needed

    // 7. Eccentricity
    features.push(0.5); // Placeholder - implement moments if needed

    // 8. Circularity
    features.push(area > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0);

    return features;
  }

  /**
   * Extract 8 bitting features
   * @param {Object} image - Binary image
   * @returns {Array} 8D bitting features
   */
  async extractBittingFeatures(image) {
    // Extract 8 bitting pattern features
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Horizontal projection (tooth density)
    const horizontalProjection = new Array(height).fill(0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          horizontalProjection[y]++;
        }
      }
    }
    const maxHorizontal = Math.max(...horizontalProjection);
    features.push(maxHorizontal / width);

    // 2. Vertical projection (tooth density)
    const verticalProjection = new Array(width).fill(0);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (data[y * width + x] > 128) {
          verticalProjection[x]++;
        }
      }
    }
    const maxVertical = Math.max(...verticalProjection);
    features.push(maxVertical / height);

    // 3. Top third tooth density
    const topThird = Math.floor(height / 3);
    let topDensity = 0;
    for (let y = 0; y < topThird; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) topDensity++;
      }
    }
    features.push(topDensity / (topThird * width));

    // 4. Middle third tooth density
    const middleThird = Math.floor(height / 3);
    let middleDensity = 0;
    for (let y = middleThird; y < middleThird * 2; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) middleDensity++;
      }
    }
    features.push(middleDensity / (middleThird * width));

    // 5. Bottom third tooth density
    const bottomThird = Math.floor(height / 3);
    let bottomDensity = 0;
    for (let y = bottomThird * 2; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) bottomDensity++;
      }
    }
    features.push(bottomDensity / (bottomThird * width));

    // 6. Horizontal variability (standard deviation of projection)
    const meanHorizontal = horizontalProjection.reduce((a, b) => a + b, 0) / height;
    const varianceHorizontal = horizontalProjection.reduce((sum, val) => sum + Math.pow(val - meanHorizontal, 2), 0) / height;
    features.push(Math.sqrt(varianceHorizontal) / width);

    // 7. Vertical variability (standard deviation of projection)
    const meanVertical = verticalProjection.reduce((a, b) => a + b, 0) / width;
    const varianceVertical = verticalProjection.reduce((sum, val) => sum + Math.pow(val - meanVertical, 2), 0) / width;
    features.push(Math.sqrt(varianceVertical) / height);

    // 8. Horizontal symmetry
    let leftSum = 0, rightSum = 0;
    const centerX = Math.floor(width / 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < centerX; x++) {
        if (data[y * width + x] > 128) leftSum++;
      }
      for (let x = centerX; x < width; x++) {
        if (data[y * width + x] > 128) rightSum++;
      }
    }
    features.push(Math.abs(leftSum - rightSum) / (leftSum + rightSum + 1));

    return features;
  }

  /**
   * Extract combined 16D signature (8D contour + 8D bitting)
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Array} 16D combined signature
   */
  async extractCombinedSignature(imageBuffer) {
    try {
      const { image } = await this.loadImage(imageBuffer);
      
      // 1. Detect automatic ROI
      const roi = await this.detectKeyROI(image);
      
      // 2. Normalize image
      const normalized = await this.normalizeImage(image, roi);
      
      // 3. Adaptive binarization
      const binary = await this.adaptiveThreshold(normalized);
      
      // 4. Extract features
      const contourFeatures = await this.extractContourFeatures(binary);
      const bittingFeatures = await this.extractBittingFeatures(binary);
      
      // 5. Combine into 16D signature
      return [...contourFeatures, ...bittingFeatures];
      
    } catch (error) {
      throw new Error(`Error extracting signature: ${error.message}`);
    }
  }

  /**
   * Validate image quality
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Object} Quality metrics
   */
  async validateImageQuality(imageBuffer) {
    try {
      const { image, metadata } = await this.loadImage(imageBuffer);
      
      const quality = {
        resolution: metadata.width * metadata.height,
        aspectRatio: metadata.width / metadata.height,
        hasKey: false,
        isBlurry: false,
        hasGoodContrast: false
      };

      // Validate minimum resolution
      if (quality.resolution < 10000) {
        throw new Error('Image resolution too low');
      }

      // Validate aspect ratio (keys typically 2:1 to 3:1)
      if (quality.aspectRatio < 1.5 || quality.aspectRatio > 4) {
        throw new Error('Image aspect ratio not suitable for key');
      }

      return quality;
    } catch (error) {
      throw new Error(`Error validating image quality: ${error.message}`);
    }
  }
}