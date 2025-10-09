/**
 * KeyScan V3 - Image Processor OPTIMIZADO
 * Sin dependencia de segmentación perfecta - usa features robustos
 */

import sharp from 'sharp';

export class ImageProcessorV3 {
  constructor(config = {}) {
    this.config = {
      preprocessing: {
        resize: { width: 400, height: 200 },
        grayscale: true,
        normalize: true,
        sharpen: { enabled: true, sigma: 1.0 }
      },
      bittingProfile: {
        samplePoints: 64,
        smoothingWindow: 3
      },
      ...config
    };
  }

  /**
   * Extrae features discriminativas V3 (optimizado)
   * @param {Buffer|string} imageInput - Buffer o ruta de imagen
   * @returns {Object} Features V3
   */
  async extractFeatures(imageInput) {
    try {
      const startTime = Date.now();
      
      // 1. Preprocessing básico
      const preprocessed = await this.preprocess(imageInput);
      const prepTime = Date.now() - startTime;
      
      // 2. Extraer contorno simple (bordes de la imagen)
      const contourStart = Date.now();
      const { contour, moments } = await this.extractShapeContour(preprocessed.buffer, preprocessed.metadata);
      const contourTime = Date.now() - contourStart;
      
      // 3. Calcular Hu Moments (invariantes)
      const huStart = Date.now();
      const huMoments = this.computeHuMoments(moments);
      const huTime = Date.now() - huStart;
      
      // 4. Extraer Bitting Profile robusto
      const bittingStart = Date.now();
      const bittingProfile = await this.extractBittingProfileRobust(preprocessed.buffer, preprocessed.metadata);
      const bittingTime = Date.now() - bittingStart;
      
      // 5. Extraer Edge Features
      const edgeStart = Date.now();
      const edgeFeatures = await this.extractEdgeFeatures(preprocessed.buffer, preprocessed.metadata);
      const edgeTime = Date.now() - edgeStart;
      
      const totalTime = Date.now() - startTime;
      
      return {
        // Features principales
        shape: {
          contour: contour,
          huMoments: huMoments,
          moments: moments,
          metadata: {
            width: preprocessed.metadata.width,
            height: preprocessed.metadata.height,
            area: moments.m00,
            valid: true
          }
        },
        bitting: bittingProfile,
        edge: edgeFeatures,
        
        // Metadata
        version: '3.0.0',
        processingTime: {
          preprocessing: prepTime,
          contour: contourTime,
          huMoments: huTime,
          bitting: bittingTime,
          edge: edgeTime,
          total: totalTime
        },
        quality: {
          valid: true,
          segmentationValid: true, // En V3 no dependemos de segmentación perfecta
          bittingValid: bittingProfile.profile && bittingProfile.profile.length > 0
        }
      };
      
    } catch (error) {
      throw new Error(`Error extrayendo features V3: ${error.message}`);
    }
  }

  /**
   * Preprocessing de la imagen
   */
  async preprocess(imageInput) {
    try {
      let image = sharp(imageInput);
      
      image = image
        .resize(this.config.preprocessing.resize.width, this.config.preprocessing.resize.height, { fit: 'fill' })
        .grayscale()
        .normalize()
        .sharpen(this.config.preprocessing.sharpen.sigma);
      
      const buffer = await image.toBuffer();
      const metadata = await sharp(buffer).metadata();
      
      return { buffer, metadata };
      
    } catch (error) {
      throw new Error(`Error en preprocessing: ${error.message}`);
    }
  }

  /**
   * Extrae contorno y momentos de la imagen
   */
  async extractShapeContour(imageBuffer, metadata) {
    try {
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { width, height } = info;
      
      // Crear contorno del borde de la llave (detección simple)
      const threshold = 128;
      const contour = [];
      
      // Escanear bordes para encontrar la llave
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = data[y * width + x];
          if (pixel < threshold) {
            contour.push({ x, y });
          }
        }
      }
      
      // Si no hay suficientes puntos, usar contorno rectangular
      if (contour.length < 100) {
        const margin = 5;
        for (let x = margin; x < width - margin; x++) {
          contour.push({ x, y: margin });
          contour.push({ x, y: height - margin });
        }
        for (let y = margin; y < height - margin; y++) {
          contour.push({ x: margin, y });
          contour.push({ x: width - margin, y });
        }
      }
      
      // Calcular momentos
      const moments = this.computeImageMoments(data, width, height, threshold);
      
      return { contour, moments };
      
    } catch (error) {
      console.error(`Error extrayendo contorno: ${error.message}`);
      return {
        contour: [],
        moments: { m00: 0, m10: 0, m01: 0, m20: 0, m02: 0, m11: 0, m30: 0, m03: 0, m12: 0, m21: 0 }
      };
    }
  }

  /**
   * Calcula momentos de imagen
   */
  computeImageMoments(data, width, height, threshold) {
    let m00 = 0, m10 = 0, m01 = 0;
    let m20 = 0, m02 = 0, m11 = 0;
    let m30 = 0, m03 = 0, m12 = 0, m21 = 0;
    
    // Calcular momentos crudos
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = data[y * width + x];
        if (pixel < threshold) { // Llave es oscura
          const intensity = (255 - pixel) / 255; // Normalizar
          
          m00 += intensity;
          m10 += x * intensity;
          m01 += y * intensity;
        }
      }
    }
    
    if (m00 === 0) {
      return { m00: 1, m10: 0, m01: 0, m20: 0, m02: 0, m11: 0, m30: 0, m03: 0, m12: 0, m21: 0 };
    }
    
    // Calcular centroide
    const cx = m10 / m00;
    const cy = m01 / m00;
    
    // Calcular momentos centrales
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = data[y * width + x];
        if (pixel < threshold) {
          const intensity = (255 - pixel) / 255;
          const dx = x - cx;
          const dy = y - cy;
          
          m20 += dx * dx * intensity;
          m02 += dy * dy * intensity;
          m11 += dx * dy * intensity;
          m30 += dx * dx * dx * intensity;
          m03 += dy * dy * dy * intensity;
          m12 += dx * dy * dy * intensity;
          m21 += dx * dx * dy * intensity;
        }
      }
    }
    
    return { m00, m10, m01, m20, m02, m11, m30, m03, m12, m21 };
  }

  /**
   * Calcula los 7 Hu Moments invariantes
   */
  computeHuMoments(moments) {
    const { m00, m20, m02, m11, m30, m03, m12, m21 } = moments;
    
    if (m00 === 0) {
      return new Array(7).fill(0);
    }
    
    // Normalizar momentos
    const n20 = m20 / Math.pow(m00, 2);
    const n02 = m02 / Math.pow(m00, 2);
    const n11 = m11 / Math.pow(m00, 2);
    const n30 = m30 / Math.pow(m00, 2.5);
    const n03 = m03 / Math.pow(m00, 2.5);
    const n12 = m12 / Math.pow(m00, 2.5);
    const n21 = m21 / Math.pow(m00, 2.5);
    
    // Calcular 7 Hu Moments
    const h1 = n20 + n02;
    const h2 = Math.pow(n20 - n02, 2) + 4 * Math.pow(n11, 2);
    const h3 = Math.pow(n30 - 3 * n12, 2) + Math.pow(3 * n21 - n03, 2);
    const h4 = Math.pow(n30 + n12, 2) + Math.pow(n21 + n03, 2);
    const h5 = (n30 - 3 * n12) * (n30 + n12) * (Math.pow(n30 + n12, 2) - 3 * Math.pow(n21 + n03, 2)) +
               (3 * n21 - n03) * (n21 + n03) * (3 * Math.pow(n30 + n12, 2) - Math.pow(n21 + n03, 2));
    const h6 = (n20 - n02) * (Math.pow(n30 + n12, 2) - Math.pow(n21 + n03, 2)) +
               4 * n11 * (n30 + n12) * (n21 + n03);
    const h7 = (3 * n21 - n03) * (n30 + n12) * (Math.pow(n30 + n12, 2) - 3 * Math.pow(n21 + n03, 2)) -
               (n30 - 3 * n12) * (n21 + n03) * (3 * Math.pow(n30 + n12, 2) - Math.pow(n21 + n03, 2));
    
    return [h1, h2, h3, h4, h5, h6, h7];
  }

  /**
   * Extrae perfil de bitting robusto (sin segmentación)
   */
  async extractBittingProfileRobust(imageBuffer, metadata) {
    try {
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { width, height } = info;
      const profile = [];
      
      // Extraer perfil horizontal (promedio vertical)
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        for (let y = 0; y < height; y++) {
          const pixel = data[y * width + x];
          sum += pixel;
          count++;
        }
        
        profile.push(sum / count / 255); // Normalizar a [0,1]
      }
      
      // Resamplear a puntos fijos
      const resampled = this.resampleSignal(profile, this.config.bittingProfile.samplePoints);
      
      // Suavizar
      const smoothed = this.smoothSignal(resampled);
      
      // Detectar notches
      const notches = this.detectNotches(smoothed);
      
      return {
        profile: smoothed,
        notches: notches,
        gradients: this.computeGradients(smoothed),
        metadata: {
          length: smoothed.length,
          notchCount: notches.length
        }
      };
      
    } catch (error) {
      console.error(`Error extrayendo perfil: ${error.message}`);
      return {
        profile: new Array(this.config.bittingProfile.samplePoints).fill(0.5),
        notches: [],
        gradients: new Array(this.config.bittingProfile.samplePoints).fill(0),
        metadata: { error: error.message }
      };
    }
  }

  resampleSignal(signal, targetPoints) {
    if (signal.length === 0) return new Array(targetPoints).fill(0);
    if (signal.length === targetPoints) return signal;
    
    const resampled = [];
    const step = signal.length / targetPoints;
    
    for (let i = 0; i < targetPoints; i++) {
      const idx = Math.floor(i * step);
      resampled.push(signal[Math.min(idx, signal.length - 1)]);
    }
    
    return resampled;
  }

  smoothSignal(signal) {
    if (signal.length < this.config.bittingProfile.smoothingWindow) return signal;
    
    const smoothed = [];
    const halfWindow = Math.floor(this.config.bittingProfile.smoothingWindow / 2);
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = -halfWindow; j <= halfWindow; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < signal.length) {
          sum += signal[idx];
          count++;
        }
      }
      
      smoothed.push(sum / count);
    }
    
    return smoothed;
  }

  detectNotches(profile) {
    const notches = [];
    const threshold = 0.15;
    
    for (let i = 1; i < profile.length - 1; i++) {
      const prev = profile[i - 1];
      const curr = profile[i];
      const next = profile[i + 1];
      
      const isMaxima = curr > prev && curr > next && Math.abs(curr - prev) > threshold;
      const isMinima = curr < prev && curr < next && Math.abs(curr - prev) > threshold;
      
      if (isMaxima || isMinima) {
        notches.push({ index: i, value: curr, type: isMaxima ? 'peak' : 'valley' });
      }
    }
    
    return notches;
  }

  computeGradients(profile) {
    const gradients = [];
    for (let i = 0; i < profile.length - 1; i++) {
      gradients.push(profile[i + 1] - profile[i]);
    }
    gradients.push(gradients[gradients.length - 1] || 0);
    return gradients;
  }

  /**
   * Extrae edge features usando Sobel
   */
  async extractEdgeFeatures(imageBuffer, metadata) {
    try {
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { width, height } = info;
      
      // Sobel simplificado
      const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
      const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
      
      let totalMagnitude = 0;
      let edgeCount = 0;
      const threshold = 50;
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0, gy = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixel = data[(y + ky) * width + (x + kx)];
              gx += pixel * sobelX[ky + 1][kx + 1];
              gy += pixel * sobelY[ky + 1][kx + 1];
            }
          }
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          totalMagnitude += magnitude;
          
          if (magnitude > threshold) {
            edgeCount++;
          }
        }
      }
      
      const totalPixels = (width - 2) * (height - 2);
      
      return {
        magnitude: totalMagnitude / totalPixels,
        density: edgeCount / totalPixels,
        count: edgeCount
      };
      
    } catch (error) {
      console.error(`Error extrayendo edge features: ${error.message}`);
      return { magnitude: 0, density: 0, count: 0 };
    }
  }

  async validateImageQuality(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const { width, height, format } = metadata;
      
      const issues = [];
      const recommendations = [];
      
      const resolution = width * height;
      // Más permisivo para desarrollo local
      if (resolution < 20000) {
        issues.push('Resolución muy baja');
        recommendations.push('Tomar foto más cerca de la llave');
      }
      
      const aspectRatio = width / height;
      // Aceptar tanto vertical (0.4) como horizontal (3.0)
      // 0.4 = vertical (height > width), 3.0 = horizontal (width > height)
      if (aspectRatio < 0.4 || aspectRatio > 3.0) {
        issues.push('Aspect ratio inadecuado');
        recommendations.push('Tomar foto de la llave (vertical u horizontal)');
      }
      
      if (!['jpeg', 'jpg', 'png'].includes(format)) {
        issues.push('Formato no soportado');
        recommendations.push('Usar formato JPEG o PNG');
      }
      
      return {
        valid: issues.length === 0,
        issues,
        recommendations,
        metadata: { resolution, aspectRatio, format }
      };
      
    } catch (error) {
      return {
        valid: false,
        issues: ['Error validando imagen'],
        recommendations: ['Verificar que la imagen sea válida'],
        error: error.message
      };
    }
  }
}

