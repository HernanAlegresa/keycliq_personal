/**
 * KeyScan V3 - Image Processor CORREGIDO
 * Correcciones específicas basadas en análisis detallado de problemas
 */

import sharp from 'sharp';

export class ImageProcessorV3Fixed {
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
   * Extrae features V3 con correcciones específicas
   */
  async extractFeatures(imageInput) {
    try {
      const startTime = Date.now();
      
      // 1. Preprocessing mejorado
      const preprocessed = await this.preprocessFixed(imageInput);
      const prepTime = Date.now() - startTime;
      
      // 2. Extraer contorno mejorado
      const contourStart = Date.now();
      const { contour, moments } = await this.extractShapeContourFixed(preprocessed.buffer, preprocessed.metadata);
      const contourTime = Date.now() - contourStart;
      
      // 3. Calcular Hu Moments corregidos
      const huStart = Date.now();
      const huMoments = this.computeHuMomentsFixed(moments);
      const huTime = Date.now() - huStart;
      
      // 4. Extraer Bitting Profile CORREGIDO
      const bittingStart = Date.now();
      const bittingProfile = await this.extractBittingProfileFixed(preprocessed.buffer, preprocessed.metadata);
      const bittingTime = Date.now() - bittingStart;
      
      // 5. Extraer Edge Features
      const edgeStart = Date.now();
      const edgeFeatures = await this.extractEdgeFeatures(preprocessed.buffer, preprocessed.metadata);
      const edgeTime = Date.now() - edgeStart;
      
      const totalTime = Date.now() - startTime;
      
      return {
        shape: {
          contour: contour,
          moments: moments,
          huMoments: huMoments,
          area: moments.m00 || 0,
          perimeter: contour.length || 0
        },
        bitting: bittingProfile,
        edge: edgeFeatures,
        metadata: {
          preprocessingTime: prepTime,
          contourTime: contourTime,
          huTime: huTime,
          bittingTime: bittingTime,
          edgeTime: edgeTime,
          totalTime: totalTime,
          imageSize: preprocessed.metadata
        },
        quality: {
          segmentationValid: moments.m00 > 100,
          bittingValid: bittingProfile.metadata.isValid,
          overallQuality: true
        }
      };
      
    } catch (error) {
      console.error(`Error en extractFeatures fixed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preprocessing mejorado para consistencia
   */
  async preprocessFixed(imageInput) {
    try {
      const image = sharp(imageInput);
      const metadata = await image.metadata();
      
      // Resize y preprocesamiento consistente
      const processed = await image
        .resize(this.config.preprocessing.resize.width, this.config.preprocessing.resize.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .greyscale()
        .normalize()
        .sharpen(this.config.preprocessing.sharpen.enabled ? 
          { sigma: this.config.preprocessing.sharpen.sigma } : false
        )
        .png()
        .toBuffer();
      
      return {
        buffer: processed,
        metadata: {
          width: this.config.preprocessing.resize.width,
          height: this.config.preprocessing.resize.height,
          channels: 1
        }
      };
      
    } catch (error) {
      console.error(`Error en preprocess fixed: ${error.message}`);
      throw error;
    }
  }

  /**
   * EXTRAE PERFIL DE BITTING CORREGIDO
   * Problemas identificados y solucionados:
   * 1. Normalización inconsistente entre generated/aligned
   * 2. Falta de alineación automática
   * 3. Detección de notches muy sensible
   */
  async extractBittingProfileFixed(imageBuffer, metadata) {
    try {
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { width, height } = info;
      
      // CORRECCIÓN 1: Mejor extracción del perfil horizontal
      const profile = this.extractHorizontalProfileImproved(data, width, height);
      
      // CORRECCIÓN 2: Resamplear con mejor interpolación
      const resampled = this.resampleSignalImproved(profile, this.config.bittingProfile.samplePoints);
      
      // CORRECCIÓN 3: Suavizado inteligente
      const smoothed = this.smoothSignalImproved(resampled);
      
      // CORRECCIÓN 4: Alineación automática del perfil
      const aligned = this.autoAlignProfile(smoothed);
      
      // CORRECCIÓN 5: Normalización robusta y consistente
      const normalizedProfile = this.normalizeProfileRobust(aligned);
      
      // CORRECCIÓN 6: Detección de notches mejorada
      const notches = this.detectNotchesImproved(normalizedProfile);
      
      return {
        profile: normalizedProfile,
        notches: notches,
        gradients: this.computeGradients(normalizedProfile),
        metadata: {
          length: normalizedProfile.length,
          notchCount: notches.length,
          isValid: normalizedProfile.length > 0 && notches.length >= 0
        }
      };
      
    } catch (error) {
      console.error(`Error extrayendo perfil fixed: ${error.message}`);
      return {
        profile: new Array(this.config.bittingProfile.samplePoints).fill(0.5),
        notches: [],
        gradients: new Array(this.config.bittingProfile.samplePoints).fill(0),
        metadata: { error: error.message, isValid: false }
      };
    }
  }

  /**
   * CORRECCIÓN 1: Mejor extracción horizontal con detección de key
   */
  extractHorizontalProfileImproved(data, width, height) {
    const profile = [];
    
    for (let x = 0; x < width; x++) {
      let keyPixels = [];
      let backgroundPixels = [];
      
      // Separar pixels de key vs background basado en valor
      for (let y = 0; y < height; y++) {
        const pixel = data[y * width + x] / 255;
        
        // Asumir que key es más oscuro (pixel < 0.7)
        if (pixel < 0.7) {
          keyPixels.push(1 - pixel); // Invertir para que key material sea alto
        } else {
          backgroundPixels.push(pixel);
        }
      }
      
      // Si tenemos pixels de key, usar su promedio
      if (keyPixels.length > 0) {
        const keyAvg = keyPixels.reduce((a, b) => a + b, 0) / keyPixels.length;
        profile.push(keyAvg);
      } else {
        // Si no hay key pixels, usar valor bajo
        profile.push(0);
      }
    }
    
    return profile;
  }

  /**
   * CORRECCIÓN 2: Resampleado mejorado
   */
  resampleSignalImproved(signal, targetPoints) {
    if (signal.length === 0) return new Array(targetPoints).fill(0);
    if (signal.length === targetPoints) return [...signal];
    
    const resampled = [];
    const step = signal.length / targetPoints;
    
    for (let i = 0; i < targetPoints; i++) {
      const sourcePos = i * step;
      const index1 = Math.floor(sourcePos);
      const index2 = Math.min(signal.length - 1, index1 + 1);
      const fraction = sourcePos - index1;
      
      // Interpolación lineal mejorada
      const value = signal[index1] * (1 - fraction) + signal[index2] * fraction;
      resampled.push(value);
    }
    
    return resampled;
  }

  /**
   * CORRECCIÓN 3: Suavizado inteligente
   */
  smoothSignalImproved(signal) {
    if (signal.length < 3) return signal;
    
    const smoothed = [];
    const windowSize = 3;
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = -halfWindow; j <= halfWindow; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < signal.length) {
          // Aplicar peso gaussiano simple
          const weight = 1 - Math.abs(j) / (halfWindow + 1);
          sum += signal[idx] * weight;
          count += weight;
        }
      }
      
      smoothed.push(count > 0 ? sum / count : signal[i]);
    }
    
    return smoothed;
  }

  /**
   * CORRECCIÓN 4: Alineación automática del perfil
   */
  autoAlignProfile(profile) {
    if (!profile || profile.length === 0) return profile;
    
    // Encontrar centro de masa del perfil
    let centerOfMass = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < profile.length; i++) {
      centerOfMass += i * profile[i];
      totalWeight += profile[i];
    }
    
    if (totalWeight === 0) return profile;
    
    centerOfMass = centerOfMass / totalWeight;
    const targetCenter = profile.length / 2;
    const shift = targetCenter - centerOfMass;
    
    // Aplicar shift si es significativo
    if (Math.abs(shift) > 2) {
      const shifted = new Array(profile.length).fill(0);
      for (let i = 0; i < profile.length; i++) {
        const newIndex = Math.round(i + shift);
        if (newIndex >= 0 && newIndex < profile.length) {
          shifted[newIndex] = profile[i];
        }
      }
      return shifted;
    }
    
    return profile;
  }

  /**
   * CORRECCIÓN 5: Normalización robusta y consistente
   */
  normalizeProfileRobust(profile) {
    if (!profile || profile.length === 0) return profile;
    
    // Encontrar percentiles para normalización robusta (menos sensible a outliers)
    const sorted = [...profile].sort((a, b) => a - b);
    const p10 = sorted[Math.floor(sorted.length * 0.1)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    
    // Usar percentiles para normalización
    const range = p90 - p10;
    if (range < 0.05) {
      // Perfil muy plano, normalizar a valores neutros
      return profile.map(() => 0.5);
    }
    
    // Normalizar usando percentiles (más robusto)
    return profile.map(value => {
      const normalized = (value - p10) / range;
      return Math.max(0, Math.min(1, normalized));
    });
  }

  /**
   * CORRECCIÓN 6: Detección de notches mejorada y consistente
   */
  detectNotchesImproved(profile) {
    if (!profile || profile.length < 3) return [];
    
    const notches = [];
    
    // Calcular estadísticas mejoradas
    const sorted = [...profile].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    // Threshold más agresivo para detectar más notches
    const threshold = Math.max(0.02, Math.min(0.10, iqr * 0.8));
    
    for (let i = 2; i < profile.length - 2; i++) {
      const prev2 = profile[i - 2];
      const prev1 = profile[i - 1];
      const curr = profile[i];
      const next1 = profile[i + 1];
      const next2 = profile[i + 2];
      
      // Detección más robusta de picos/valles
      const isLocalMax = curr > prev1 && curr > next1 && 
                        curr > prev2 && curr > next2 &&
                        (curr - prev1) > threshold && (curr - next1) > threshold;
      
      const isLocalMin = curr < prev1 && curr < next1 && 
                        curr < prev2 && curr < next2 &&
                        (prev1 - curr) > threshold && (next1 - curr) > threshold;
      
      if (isLocalMax || isLocalMin) {
        notches.push({ 
          position: i / profile.length, // Posición normalizada
          value: curr,
          type: isLocalMax ? 'peak' : 'valley',
          strength: isLocalMax ? 
            Math.min((curr - prev1), (curr - next1)) :
            Math.min((prev1 - curr), (next1 - curr))
        });
      }
    }
    
    return notches;
  }

  /**
   * Contour extraction mejorado
   */
  async extractShapeContourFixed(buffer, metadata) {
    try {
      const { data, info } = await sharp(buffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { width, height } = info;
      
      // Detección mejorada del contorno de la llave
      const threshold = 128;
      const contour = [];
      
      // Detectar pixels de la llave (más oscuros que el fondo)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = data[y * width + x];
          if (pixel < threshold) {
            contour.push({ x, y });
          }
        }
      }
      
      // Calcular momentos con la misma implementación pero mejorada
      const moments = this.computeImageMomentsFixed(data, width, height, threshold);
      
      return { contour, moments };
      
    } catch (error) {
      console.error(`Error extrayendo contorno fixed: ${error.message}`);
      return {
        contour: [],
        moments: { m00: 0, m10: 0, m01: 0, m20: 0, m02: 0, m11: 0, m30: 0, m03: 0, m12: 0, m21: 0 }
      };
    }
  }

  /**
   * Cálculo de momentos mejorado
   */
  computeImageMomentsFixed(data, width, height, threshold) {
    let m00 = 0, m10 = 0, m01 = 0;
    let m20 = 0, m02 = 0, m11 = 0;
    let m30 = 0, m03 = 0, m12 = 0, m21 = 0;
    
    // Calcular momentos crudos
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = data[y * width + x];
        if (pixel < threshold) {
          const intensity = (255 - pixel) / 255; // Normalizar
          
          m00 += intensity;
          m10 += x * intensity;
          m01 += y * intensity;
          m20 += x * x * intensity;
          m02 += y * y * intensity;
          m11 += x * y * intensity;
          m30 += x * x * x * intensity;
          m03 += y * y * y * intensity;
          m12 += x * y * y * intensity;
          m21 += x * x * y * intensity;
        }
      }
    }
    
    // Calcular centroide
    if (m00 > 0) {
      const cx = m10 / m00;
      const cy = m01 / m00;
      
      // Calcular momentos centrales
      let mu20 = 0, mu02 = 0, mu11 = 0;
      let mu30 = 0, mu03 = 0, mu12 = 0, mu21 = 0;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = data[y * width + x];
          if (pixel < threshold) {
            const intensity = (255 - pixel) / 255;
            const dx = x - cx;
            const dy = y - cy;
            
            mu20 += dx * dx * intensity;
            mu02 += dy * dy * intensity;
            mu11 += dx * dy * intensity;
            mu30 += dx * dx * dx * intensity;
            mu03 += dy * dy * dy * intensity;
            mu12 += dx * dy * dy * intensity;
            mu21 += dx * dx * dy * intensity;
          }
        }
      }
      
      return { m00, m10, m01, m20: mu20, m02: mu02, m11: mu11, m30: mu30, m03: mu03, m12: mu12, m21: mu21 };
    }
    
    return { m00, m10, m01, m20: 0, m02: 0, m11: 0, m30: 0, m03: 0, m12: 0, m21: 0 };
  }

  /**
   * Hu Moments corregidos (placeholder para ahora)
   */
  computeHuMomentsFixed(moments) {
    // Por ahora, usar la misma implementación que V3
    // TODO: Mejorar cálculo de Hu Moments
    const { m00, m20, m02, m11, m30, m03, m12, m21 } = moments;
    
    if (m00 === 0) {
      return new Array(7).fill(0);
    }
    
    const n20 = m20 / Math.pow(m00, 2);
    const n02 = m02 / Math.pow(m00, 2);
    const n11 = m11 / Math.pow(m00, 2);
    const n30 = m30 / Math.pow(m00, 2.5);
    const n03 = m03 / Math.pow(m00, 2.5);
    const n12 = m12 / Math.pow(m00, 2.5);
    const n21 = m21 / Math.pow(m00, 2.5);
    
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
    
    const huMoments = [h1, h2, h3, h4, h5, h6, h7];
    
    // Validar y corregir valores inválidos
    return huMoments.map(moment => {
      if (!isFinite(moment) || isNaN(moment)) return 0;
      return moment;
    });
  }

  /**
   * Edge features mejorado
   */
  async extractEdgeFeatures(buffer, metadata) {
    try {
      const { data, info } = await sharp(buffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { width, height } = info;
      
      // Sobel edge detection mejorado
      const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
      const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
      
      let totalMagnitude = 0;
      let edgeCount = 0;
      const threshold = 50;
      const totalPixels = (width - 2) * (height - 2);
      
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
      
      // Normalizar resultados
      const avgMagnitude = totalPixels > 0 ? (totalMagnitude / totalPixels) / 255 : 0;
      const density = totalPixels > 0 ? edgeCount / totalPixels : 0;
      
      return {
        magnitude: Math.min(1, avgMagnitude),
        density: Math.min(1, density),
        count: edgeCount
      };
      
    } catch (error) {
      console.error(`Error extrayendo edge features fixed: ${error.message}`);
      return { magnitude: 0, density: 0, count: 0 };
    }
  }

  computeGradients(profile) {
    const gradients = [];
    for (let i = 0; i < profile.length - 1; i++) {
      gradients.push(profile[i + 1] - profile[i]);
    }
    gradients.push(gradients[gradients.length - 1] || 0);
    return gradients;
  }
}
