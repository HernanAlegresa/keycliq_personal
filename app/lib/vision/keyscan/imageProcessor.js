/**
 * Image Processing Core Module - V1.2 Hybrid
 * Enhanced preprocessing with Sharp + Canvas (simulating OpenCV.js)
 * 20D signature: 8D contour + 6D bitting + 3D bow + 3D shank
 */

import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';

export class ImageProcessor {
  constructor(config = {}) {
    this.config = {
      useOpenCVSimulation: config.useOpenCVSimulation !== false, // Default true
      fallbackToV1: config.fallbackToV1 || false,
      standardSize: { width: 200, height: 100 },
      preprocessing: {
        gaussianBlur: 1.5,
        adaptiveThreshold: { blockSize: 11, C: 2 },
        deskew: true,
        roiExtraction: true
      }
    };
  }

  /**
   * Load and preprocess image with enhanced preprocessing
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
   * Enhanced preprocessing simulating OpenCV.js
   * @param {Object} image - Sharp image object
   * @returns {Object} Preprocessed image
   */
  async enhancedPreprocessing(image) {
    try {
      // 1. Color conversion (cvtColor equivalent)
      const grayscale = await image
        .greyscale()
        .normalize()
        .toBuffer();

      // 2. Gaussian blur (simulating cv.GaussianBlur)
      const blurred = await sharp(grayscale)
        .blur(this.config.preprocessing.gaussianBlur)
        .toBuffer();

      // 3. Adaptive threshold (simulating cv.adaptiveThreshold)
      const { data, info } = await sharp(blurred)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const adaptiveThreshold = this.applyAdaptiveThreshold(data, info);
      const thresholded = sharp(Buffer.from(adaptiveThreshold), { 
        raw: { width: info.width, height: info.height, channels: 1 } 
      });

      return thresholded;
    } catch (error) {
      throw new Error(`Error in enhanced preprocessing: ${error.message}`);
    }
  }

  /**
   * Apply adaptive threshold (simulating cv.adaptiveThreshold)
   * @param {Uint8Array} data - Image data
   * @param {Object} info - Image info
   * @returns {Uint8Array} Thresholded data
   */
  applyAdaptiveThreshold(data, info) {
    const { width, height } = info;
    const { blockSize, C } = this.config.preprocessing.adaptiveThreshold;
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

    return result;
  }

  /**
   * Detect key ROI with enhanced contour detection
   * @param {Object} image - Sharp image object
   * @returns {Object} ROI coordinates and dimensions
   */
  async detectKeyROI(image) {
    try {
      const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width, height } = info;
      let minX = width, minY = height, maxX = 0, maxY = 0;
      let hasKey = false;

      // Enhanced contour detection
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = data[y * width + x];
          if (pixel > 0) {
            hasKey = true;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (!hasKey) {
        return {
          x: 0,
          y: 0,
          width: width,
          height: height
        };
      }

      // Enhanced margin calculation
      const margin = 0.15; // Increased margin for better ROI
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
    } catch (error) {
      throw new Error(`Error detecting ROI: ${error.message}`);
    }
  }

  /**
   * Deskew image (simulating warpAffine)
   * @param {Object} image - Sharp image object
   * @param {Object} roi - ROI coordinates
   * @returns {Object} Deskewed image
   */
  async deskewImage(image, roi) {
    try {
      if (!this.config.preprocessing.deskew) {
        return await image.extract(roi);
      }

      // Extract ROI first
      const roiImage = await image.extract(roi);
      
      // Simple deskew based on major axis
      const { data, info } = await roiImage
        .raw()
        .toBuffer({ resolveWithObject: true });

      const angle = this.calculateDeskewAngle(data, info);
      
      if (Math.abs(angle) > 0.1) {
        return await roiImage.rotate(angle);
      }
      
      return roiImage;
    } catch (error) {
      // Fallback to non-deskewed
      return await image.extract(roi);
    }
  }

  /**
   * Calculate deskew angle
   * @param {Uint8Array} data - Image data
   * @param {Object} info - Image info
   * @returns {number} Deskew angle in degrees
   */
  calculateDeskewAngle(data, info) {
    const { width, height } = info;
    let sumX = 0, sumY = 0, count = 0;
    let sumXX = 0, sumYY = 0, sumXY = 0;

    // Calculate moments
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          sumX += x;
          sumY += y;
          sumXX += x * x;
          sumYY += y * y;
          sumXY += x * y;
          count++;
        }
      }
    }

    if (count === 0) return 0;

    const meanX = sumX / count;
    const meanY = sumY / count;
    const muXX = sumXX / count - meanX * meanX;
    const muYY = sumYY / count - meanY * meanY;
    const muXY = sumXY / count - meanX * meanY;

    // Calculate angle
    const angle = 0.5 * Math.atan2(2 * muXY, muXX - muYY);
    return angle * 180 / Math.PI;
  }

  /**
   * Extract 8 enhanced contour features
   * @param {Object} image - Binary image
   * @returns {Array} 8D contour features
   */
  async extractContourFeatures(image) {
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Enhanced edge density
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

    // 5. Enhanced compactness
    const area = count;
    const perimeter = edgePixels;
    features.push(area > 0 ? (perimeter * perimeter) / area : 0);

    // 6. Enhanced solidity
    const convexHullArea = this.calculateConvexHullArea(data, width, height);
    features.push(area > 0 ? area / convexHullArea : 0.8);

    // 7. Enhanced eccentricity
    const eccentricity = this.calculateEccentricity(data, width, height);
    features.push(eccentricity);

    // 8. Enhanced circularity
    features.push(area > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0);

    return features;
  }

  /**
   * Extract 6 enhanced bitting features with granularity
   * @param {Object} image - Binary image
   * @returns {Array} 6D bitting features
   */
  async extractBittingFeatures(image) {
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Horizontal projection (enhanced)
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

    // 2. Vertical projection (enhanced)
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

    // 3. Top section density (enhanced granularity)
    const topSection = Math.floor(height * 0.3);
    let topDensity = 0;
    for (let y = 0; y < topSection; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) topDensity++;
      }
    }
    features.push(topDensity / (topSection * width));

    // 4. Middle section density (enhanced granularity)
    const middleStart = Math.floor(height * 0.3);
    const middleEnd = Math.floor(height * 0.7);
    let middleDensity = 0;
    for (let y = middleStart; y < middleEnd; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) middleDensity++;
      }
    }
    features.push(middleDensity / ((middleEnd - middleStart) * width));

    // 5. Bottom section density (enhanced granularity)
    const bottomStart = Math.floor(height * 0.7);
    let bottomDensity = 0;
    for (let y = bottomStart; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) bottomDensity++;
      }
    }
    features.push(bottomDensity / ((height - bottomStart) * width));

    // 6. Enhanced symmetry
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
   * Extract 3 bow (head) features
   * @param {Object} image - Binary image
   * @returns {Array} 3D bow features
   */
  async extractBowFeatures(image) {
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Bow area ratio (top 30% of image)
    const bowHeight = Math.floor(height * 0.3);
    let bowPixels = 0;
    for (let y = 0; y < bowHeight; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) bowPixels++;
      }
    }
    features.push(bowPixels / (bowHeight * width));

    // 2. Bow circularity
    const bowContour = this.calculateBowContour(data, width, height, bowHeight);
    const bowArea = bowPixels;
    const bowPerimeter = bowContour;
    features.push(bowArea > 0 ? (4 * Math.PI * bowArea) / (bowPerimeter * bowPerimeter) : 0);

    // 3. Bow position relative to shank
    const bowCenterY = this.calculateBowCenter(data, width, bowHeight);
    const shankCenterY = this.calculateShankCenter(data, width, height);
    features.push(Math.abs(bowCenterY - shankCenterY) / height);

    return features;
  }

  /**
   * Extract 3 shank (body) features
   * @param {Object} image - Binary image
   * @returns {Array} 3D shank features
   */
  async extractShankFeatures(image) {
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const features = [];

    // 1. Shank length ratio
    const shankStart = Math.floor(height * 0.3);
    const shankEnd = Math.floor(height * 0.8);
    const shankLength = shankEnd - shankStart;
    features.push(shankLength / height);

    // 2. Shank width consistency
    const shankWidths = [];
    for (let y = shankStart; y < shankEnd; y += 5) {
      let leftEdge = 0, rightEdge = width;
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          leftEdge = x;
          break;
        }
      }
      for (let x = width - 1; x >= 0; x--) {
        if (data[y * width + x] > 128) {
          rightEdge = x;
          break;
        }
      }
      shankWidths.push(rightEdge - leftEdge);
    }
    const meanWidth = shankWidths.reduce((a, b) => a + b, 0) / shankWidths.length;
    const widthVariance = shankWidths.reduce((sum, w) => sum + Math.pow(w - meanWidth, 2), 0) / shankWidths.length;
    features.push(Math.sqrt(widthVariance) / meanWidth);

    // 3. Shank straightness
    const shankAngles = [];
    for (let y = shankStart; y < shankEnd - 10; y += 10) {
      const angle = this.calculateShankAngle(data, width, y);
      shankAngles.push(angle);
    }
    const angleVariance = shankAngles.reduce((sum, a) => sum + Math.pow(a, 2), 0) / shankAngles.length;
    features.push(Math.sqrt(angleVariance));

    return features;
  }

  /**
   * Calculate convex hull area
   * @param {Uint8Array} data - Image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {number} Convex hull area
   */
  calculateConvexHullArea(data, width, height) {
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    const hullWidth = maxX - minX;
    const hullHeight = maxY - minY;
    return hullWidth * hullHeight;
  }

  /**
   * Calculate eccentricity
   * @param {Uint8Array} data - Image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {number} Eccentricity
   */
  calculateEccentricity(data, width, height) {
    let m00 = 0, m20 = 0, m02 = 0, m11 = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          m00 += 1;
          m20 += x * x;
          m02 += y * y;
          m11 += x * y;
        }
      }
    }
    
    if (m00 === 0) return 0;
    
    const xc = m20 / m00;
    const yc = m02 / m00;
    const mu20 = m20 - m00 * xc * xc;
    const mu02 = m02 - m00 * yc * yc;
    const mu11 = m11 - m00 * xc * yc;
    
    const a = mu20 + mu02;
    const b = Math.sqrt(4 * mu11 * mu11 + (mu20 - mu02) * (mu20 - mu02));
    
    if (a === 0) return 0;
    
    return Math.sqrt(1 - (a - b) / (a + b));
  }

  /**
   * Calculate bow contour
   * @param {Uint8Array} data - Image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} bowHeight - Bow height
   * @returns {number} Bow contour length
   */
  calculateBowContour(data, width, height, bowHeight) {
    let contour = 0;
    for (let y = 0; y < bowHeight; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          // Check if it's an edge pixel
          let isEdge = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < bowHeight) {
                if (data[ny * width + nx] <= 128) {
                  isEdge = true;
                  break;
                }
              }
            }
            if (isEdge) break;
          }
          if (isEdge) contour++;
        }
      }
    }
    return contour;
  }

  /**
   * Calculate bow center
   * @param {Uint8Array} data - Image data
   * @param {number} width - Image width
   * @param {number} bowHeight - Bow height
   * @returns {number} Bow center Y coordinate
   */
  calculateBowCenter(data, width, bowHeight) {
    let sumY = 0, count = 0;
    for (let y = 0; y < bowHeight; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          sumY += y;
          count++;
        }
      }
    }
    return count > 0 ? sumY / count : bowHeight / 2;
  }

  /**
   * Calculate shank center
   * @param {Uint8Array} data - Image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {number} Shank center Y coordinate
   */
  calculateShankCenter(data, width, height) {
    const shankStart = Math.floor(height * 0.3);
    const shankEnd = Math.floor(height * 0.8);
    let sumY = 0, count = 0;
    
    for (let y = shankStart; y < shankEnd; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y * width + x] > 128) {
          sumY += y;
          count++;
        }
      }
    }
    return count > 0 ? sumY / count : (shankStart + shankEnd) / 2;
  }

  /**
   * Calculate shank angle
   * @param {Uint8Array} data - Image data
   * @param {number} width - Image width
   * @param {number} y - Y coordinate
   * @returns {number} Shank angle
   */
  calculateShankAngle(data, width, y) {
    let leftEdge = 0, rightEdge = width;
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] > 128) {
        leftEdge = x;
        break;
      }
    }
    for (let x = width - 1; x >= 0; x--) {
      if (data[y * width + x] > 128) {
        rightEdge = x;
        break;
      }
    }
    return (rightEdge - leftEdge) / width;
  }

  /**
   * Extract combined 20D signature (8D contour + 6D bitting + 3D bow + 3D shank)
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Array} 20D combined signature
   */
  async extractCombinedSignature(imageBuffer) {
    try {
      const { image } = await this.loadImage(imageBuffer);
      
      // Enhanced preprocessing
      const preprocessed = await this.enhancedPreprocessing(image);
      
      // Detect ROI
      const roi = await this.detectKeyROI(preprocessed);
      
      // Deskew image
      const deskewed = await this.deskewImage(preprocessed, roi);
      
      // Normalize to standard size
      const normalized = await deskewed
        .resize(this.config.standardSize.width, this.config.standardSize.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .greyscale()
        .normalize();

      // Extract all features
      const contourFeatures = await this.extractContourFeatures(normalized);
      const bittingFeatures = await this.extractBittingFeatures(normalized);
      const bowFeatures = await this.extractBowFeatures(normalized);
      const shankFeatures = await this.extractShankFeatures(normalized);
      
      // Combine into 20D signature
      return [...contourFeatures, ...bittingFeatures, ...bowFeatures, ...shankFeatures];
      
    } catch (error) {
      if (this.config.fallbackToV1) {
        console.warn('Falling back to V1 processing:', error.message);
        return await this.fallbackToV1(imageBuffer);
      }
      throw new Error(`Error extracting V1.2 signature: ${error.message}`);
    }
  }

  /**
   * Fallback to V1 processing
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Array} V1 signature
   */
  async fallbackToV1(imageBuffer) {
    // Import V1 processor as fallback
    const { ImageProcessor } = await import('./imageProcessor.js');
    const v1Processor = new ImageProcessor();
    return await v1Processor.extractCombinedSignature(imageBuffer);
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

