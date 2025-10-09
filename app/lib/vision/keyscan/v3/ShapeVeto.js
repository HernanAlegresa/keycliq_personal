/**
 * KeyScan V3 - Shape Veto Module
 * Veto temprano basado en Hausdorff Distance + Hu Moments
 * CR├ìTICO para reducir FPR de 100% a Ôëñ10%
 */

export class ShapeVeto {
  constructor(config = {}) {
    this.config = {
      // Thresholds (calibrar con datos reales)
      hausdorff_max: 50,          // Distancia Hausdorff m├íxima permitida
      hu_similarity_min: 0.70,    // Similitud m├¡nima de Hu Moments
      compactness_tolerance: 0.30, // Tolerancia en compactness
      area_ratio_tolerance: 0.40,  // Tolerancia en ratio de ├íreas
      ...config
    };
  }

  /**
   * Compara dos formas y decide si pasan el veto
   * @param {Object} shape1 - Primera forma {contour, metadata}
   * @param {Object} shape2 - Segunda forma {contour, metadata}
   * @returns {Object} {passed, hausdorff, huSimilarity, details}
   */
  compareShapes(shape1, shape2) {
    try {
      // 1. Usar Hu Moments precalculados (optimizaci├│n)
      const huMoments1 = shape1.huMoments || this.computeHuMoments(shape1.contour);
      const huMoments2 = shape2.huMoments || this.computeHuMoments(shape2.contour);
      const huSimilarity = this.compareHuMoments(huMoments1, huMoments2);
      
      // 2. Calcular Hausdorff Distance solo si necesario (costoso)
      let hausdorff = 0;
      if (shape1.contour && shape2.contour && shape1.contour.length > 0 && shape2.contour.length > 0) {
        hausdorff = this.computeHausdorffDistance(shape1.contour, shape2.contour);
      }
      
      // 3. Comparar m├®tricas b├ísicas
      const compactnessCheck = this.compareCompactness(
        shape1.metadata,
        shape2.metadata
      );
      
      const areaRatioCheck = this.compareAreaRatio(
        shape1.metadata,
        shape2.metadata
      );
      
      // 4. Decisi├│n de veto
      const hausdorffPass = hausdorff <= this.config.hausdorff_max;
      const huPass = huSimilarity >= this.config.hu_similarity_min;
      const compactnessPass = compactnessCheck;
      const areaRatioPass = areaRatioCheck;
      
      const passed = hausdorffPass && huPass && compactnessPass && areaRatioPass;
      
      return {
        passed,
        hausdorff,
        huSimilarity,
        compactnessPass,
        areaRatioPass,
        details: {
          hausdorffCheck: { value: hausdorff, max: this.config.hausdorff_max, passed: hausdorffPass },
          huCheck: { value: huSimilarity, min: this.config.hu_similarity_min, passed: huPass },
          compactnessCheck: { passed: compactnessPass },
          areaRatioCheck: { passed: areaRatioPass }
        }
      };
      
    } catch (error) {
      console.error(`Error en shape veto: ${error.message}`);
      return {
        passed: false,
        hausdorff: Infinity,
        huSimilarity: 0,
        error: error.message
      };
    }
  }

  /**
   * Calcula Hausdorff Distance entre dos contornos
   * @param {Array} contour1 - Primer contorno
   * @param {Array} contour2 - Segundo contorno
   * @returns {number} Distancia Hausdorff
   */
  computeHausdorffDistance(contour1, contour2) {
    if (!contour1 || !contour2 || contour1.length === 0 || contour2.length === 0) {
      return Infinity;
    }
    
    // Hausdorff distance = max(h(A,B), h(B,A))
    // donde h(A,B) = max(min(d(a,b) for b in B) for a in A)
    
    const h1 = this.directedHausdorff(contour1, contour2);
    const h2 = this.directedHausdorff(contour2, contour1);
    
    return Math.max(h1, h2);
  }

  /**
   * Calcula directed Hausdorff distance
   * @param {Array} contourA - Contorno A
   * @param {Array} contourB - Contorno B
   * @returns {number} Distancia dirigida
   */
  directedHausdorff(contourA, contourB) {
    // Sample contours para performance (cada 5 puntos)
    const sampledA = this.sampleContour(contourA, 50);
    const sampledB = this.sampleContour(contourB, 50);
    
    let maxMinDist = 0;
    
    for (const pointA of sampledA) {
      let minDist = Infinity;
      
      for (const pointB of sampledB) {
        const dist = this.euclideanDistance(pointA, pointB);
        minDist = Math.min(minDist, dist);
      }
      
      maxMinDist = Math.max(maxMinDist, minDist);
    }
    
    return maxMinDist;
  }

  /**
   * Sample contour para reducir complejidad computacional
   * @param {Array} contour - Contorno
   * @param {number} targetPoints - N├║mero de puntos objetivo
   * @returns {Array} Contorno sampleado
   */
  sampleContour(contour, targetPoints) {
    if (contour.length <= targetPoints) {
      return contour;
    }
    
    const step = Math.floor(contour.length / targetPoints);
    const sampled = [];
    
    for (let i = 0; i < contour.length; i += step) {
      sampled.push(contour[i]);
    }
    
    return sampled;
  }

  /**
   * Calcula distancia euclidiana entre dos puntos
   * @param {Object} p1 - Punto 1 {x, y}
   * @param {Object} p2 - Punto 2 {x, y}
   * @returns {number} Distancia
   */
  euclideanDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calcula los 7 Hu Moments invariantes
   * @param {Array} contour - Contorno
   * @returns {Array} 7 Hu Moments
   */
  computeHuMoments(contour) {
    if (!contour || contour.length < 3) {
      return new Array(7).fill(0);
    }
    
    // Calcular momentos centrales
    const moments = this.computeCentralMoments(contour);
    
    // Calcular momentos normalizados
    const { m00, m20, m02, m11, m30, m03, m12, m21 } = moments;
    
    if (m00 === 0) {
      return new Array(7).fill(0);
    }
    
    // Normalizar
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
   * Calcula momentos centrales del contorno
   * @param {Array} contour - Contorno
   * @returns {Object} Momentos centrales
   */
  computeCentralMoments(contour) {
    // Calcular centroide
    let sumX = 0, sumY = 0;
    for (const point of contour) {
      sumX += point.x;
      sumY += point.y;
    }
    const cx = sumX / contour.length;
    const cy = sumY / contour.length;
    
    // Calcular momentos centrales
    let m00 = 0, m10 = 0, m01 = 0;
    let m20 = 0, m02 = 0, m11 = 0;
    let m30 = 0, m03 = 0, m12 = 0, m21 = 0;
    
    for (const point of contour) {
      const x = point.x - cx;
      const y = point.y - cy;
      
      m00 += 1;
      m10 += x;
      m01 += y;
      m20 += x * x;
      m02 += y * y;
      m11 += x * y;
      m30 += x * x * x;
      m03 += y * y * y;
      m12 += x * y * y;
      m21 += x * x * y;
    }
    
    return { m00, m10, m01, m20, m02, m11, m30, m03, m12, m21 };
  }

  /**
   * Compara dos sets de Hu Moments
   * @param {Array} hu1 - Hu Moments 1
   * @param {Array} hu2 - Hu Moments 2
   * @returns {number} Similitud [0,1]
   */
  compareHuMoments(hu1, hu2) {
    if (!hu1 || !hu2) {
      console.log(`­ƒöì DEBUG compareHuMoments: hu1 or hu2 is null/undefined`);
      return 0;
    }
    
    if (hu1.length !== 7 || hu2.length !== 7) {
      console.log(`­ƒöì DEBUG compareHuMoments: Invalid length - hu1.length=${hu1.length}, hu2.length=${hu2.length}`);
      return 0;
    }
    
    // Usar log-scale para Hu Moments (son muy peque├▒os)
    let totalDist = 0;
    let validMoments = 0;
    
    for (let i = 0; i < 7; i++) {
      if (hu1[i] !== 0 && hu2[i] !== 0 && !isNaN(hu1[i]) && !isNaN(hu2[i])) {
        const logH1 = Math.sign(hu1[i]) * Math.log10(Math.abs(hu1[i]) + 1e-10);
        const logH2 = Math.sign(hu2[i]) * Math.log10(Math.abs(hu2[i]) + 1e-10);
        totalDist += Math.abs(logH1 - logH2);
        validMoments++;
      }
    }
    
    if (validMoments === 0) {
      console.log(`­ƒöì DEBUG compareHuMoments: No valid moments found`);
      return 0;
    }
    
    const avgDist = totalDist / validMoments;
    
    // Convertir distancia a similitud [0,1]
    // Distancia t├¡pica entre formas similares: 0-2
    // Distancia t├¡pica entre formas diferentes: 2-10+
    const similarity = Math.max(0, 1 - avgDist / 5);
    
    return similarity;
  }

  /**
   * Compara compactness entre dos formas
   * @param {Object} meta1 - Metadata 1
   * @param {Object} meta2 - Metadata 2
   * @returns {boolean} Pass/fail
   */
  compareCompactness(meta1, meta2) {
    if (!meta1 || !meta2) return false;
    
    const comp1 = meta1.compactness || 0;
    const comp2 = meta2.compactness || 0;
    
    const diff = Math.abs(comp1 - comp2);
    
    return diff <= this.config.compactness_tolerance;
  }

  /**
   * Compara ratio de ├íreas entre dos formas
   * @param {Object} meta1 - Metadata 1
   * @param {Object} meta2 - Metadata 2
   * @returns {boolean} Pass/fail
   */
  compareAreaRatio(meta1, meta2) {
    if (!meta1 || !meta2) return false;
    
    const area1 = meta1.contourArea || meta1.area || 0;
    const area2 = meta2.contourArea || meta2.area || 0;
    
    if (area1 === 0 || area2 === 0) return false;
    
    const ratio = Math.min(area1, area2) / Math.max(area1, area2);
    
    return ratio >= (1 - this.config.area_ratio_tolerance);
  }

  /**
   * Calibra thresholds bas├índose en dataset
   * @param {Array} sameKeyPairs - Pares de misma llave
   * @param {Array} differentKeyPairs - Pares de llaves diferentes
   * @returns {Object} Thresholds calibrados
   */
  calibrateThresholds(sameKeyPairs, differentKeyPairs) {
    // Calcular distribuci├│n de m├®tricas
    const sameKeyMetrics = sameKeyPairs.map(pair => 
      this.compareShapes(pair.shape1, pair.shape2)
    );
    
    const differentKeyMetrics = differentKeyPairs.map(pair =>
      this.compareShapes(pair.shape1, pair.shape2)
    );
    
    // Encontrar threshold que maximiza F1 score
    // Target: FPR Ôëñ 10%, mantener recall ÔëÑ 75%
    
    const hausdorffValues = [
      ...sameKeyMetrics.map(m => m.hausdorff),
      ...differentKeyMetrics.map(m => m.hausdorff)
    ].filter(v => v !== Infinity).sort((a, b) => a - b);
    
    const huSimValues = [
      ...sameKeyMetrics.map(m => m.huSimilarity),
      ...differentKeyMetrics.map(m => m.huSimilarity)
    ].sort((a, b) => b - a);
    
    // Buscar threshold que da FPR Ôëñ 10%
    let bestHausdorff = this.config.hausdorff_max;
    let bestHuSim = this.config.hu_similarity_min;
    let bestF1 = 0;
    
    for (let i = 0; i < hausdorffValues.length; i += Math.floor(hausdorffValues.length / 20)) {
      for (let j = 0; j < huSimValues.length; j += Math.floor(huSimValues.length / 20)) {
        const testHausdorff = hausdorffValues[i];
        const testHuSim = huSimValues[j];
        
        // Calcular TP, FP, TN, FN
        let tp = 0, fp = 0, tn = 0, fn = 0;
        
        for (const metric of sameKeyMetrics) {
          if (metric.hausdorff <= testHausdorff && metric.huSimilarity >= testHuSim) {
            tp++;
          } else {
            fn++;
          }
        }
        
        for (const metric of differentKeyMetrics) {
          if (metric.hausdorff <= testHausdorff && metric.huSimilarity >= testHuSim) {
            fp++;
          } else {
            tn++;
          }
        }
        
        const precision = tp / (tp + fp) || 0;
        const recall = tp / (tp + fn) || 0;
        const f1 = 2 * (precision * recall) / (precision + recall) || 0;
        const fpr = fp / (fp + tn) || 0;
        
        // Objetivo: FPR Ôëñ 10% y recall ÔëÑ 75%
        if (fpr <= 0.10 && recall >= 0.75 && f1 > bestF1) {
          bestF1 = f1;
          bestHausdorff = testHausdorff;
          bestHuSim = testHuSim;
        }
      }
    }
    
    return {
      hausdorff_max: bestHausdorff,
      hu_similarity_min: bestHuSim,
      metrics: {
        f1: bestF1,
        calibration_samples: {
          sameKey: sameKeyPairs.length,
          differentKey: differentKeyPairs.length
        }
      }
    };
  }
}

