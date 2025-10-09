/**
 * KeyScan V3 - Matching Algorithm
 * Shape-First con veto temprano + DTW + Calibraci├│n
 */

import { ShapeVeto } from './ShapeVeto.js';

export class MatchingAlgorithmV3 {
  constructor(config = {}) {
    this.config = {
      // Thresholds CALIBRADOS basados en testing progresivo exitoso
      // Balance entre robustez (same-key-diff-photo) y discriminaci├│n (different-keys)
      thresholds: {
        T_match: 0.82,           // MATCH: basado en testing (same-key-diff-photo = 0.857-0.889)
        T_possible: 0.70,        // POSSIBLE: casos l├¡mite (0.70-0.81)
        delta: 0.15,             // Margen m├¡nimo entre top1 y top2 (15%)
        shape_veto: 0.70         // (legacy, no se usa como gate)
      },
      
      // Pesos de features (bitting es M├üS IMPORTANTE con DTW real)
      weights: {
        bitting: 0.80,           // Bitting DTW REAL (aumentado de 0.75)
        edge: 0.12,              // Edge patterns (reducido)
        shape: 0.08              // Shape como se├▒al secundaria (reducido)
      },
      
      // Shape analysis configuration (NO es gate, solo se├▒al)
      shapeVeto: {
        enabled: false,              // NO actuar como gate obligatorio
        hausdorff_max: 150,          // Permisivo (solo para se├▒al)
        hu_similarity_min: 0.20,     // Permisivo (solo para se├▒al)
        compactness_tolerance: 0.60,  
        area_ratio_tolerance: 0.70
      },
      
      ...config
    };
    
    console.log('­ƒöì DEBUG - MatchingAlgorithmV3 constructor:');
    console.log('  - Config passed:', config);
    console.log('  - Final thresholds:', this.config.thresholds);
    
    this.shapeVeto = new ShapeVeto(this.config.shapeVeto);
  }

  /**
   * Compara dos llaves con shape-first architecture
   * @param {Object} queryFeatures - Features de query
   * @param {Object} referenceFeatures - Features de referencia
   * @param {string} context - Contexto ('sameKey', 'differentKey', 'inventory')
   * @returns {Object} Resultado de comparaci├│n
   */
  compareKeys(queryFeatures, referenceFeatures, context = 'inventory') {
    try {
      const startTime = Date.now();
      
      // PASO 1: Shape Analysis (NO es gate obligatorio, solo se├▒al)
      const shapeVetoResult = this.shapeVeto.compareShapes(
        queryFeatures.shape,
        referenceFeatures.shape
      );
      
      console.log(`Ôä╣´©Å  Shape Analysis: huSimilarity=${shapeVetoResult.huSimilarity}, hausdorff=${shapeVetoResult.hausdorff}, passed=${shapeVetoResult.passed}`);
      
      // PASO 2: Features discriminativas (bitting con DTW real + edge + shape)
      const similarities = this.calculateFeatureSimilarities(
        queryFeatures,
        referenceFeatures
      );
      
      // PASO 3: Weighted similarity
      const weightedSimilarity = this.calculateWeightedSimilarity(similarities);
      
      // PASO 4: Decisi├│n calibrada
      const decision = this.makeDecision(weightedSimilarity, context);
      
      const processingTime = Date.now() - startTime;
      
      return {
        similarity: weightedSimilarity,
        matchStatus: decision.status,
        confidence: decision.confidence,
        shapeVeto: {
          ...shapeVetoResult,
          // Mapear nombres para el log
          huMomentDistance: shapeVetoResult.huSimilarity,
          hausdorffDistance: shapeVetoResult.hausdorff,
          huMomentThreshold: this.config.shapeVeto.hu_similarity_min,
          hausdorffThreshold: this.config.shapeVeto.hausdorff_max
        },
        details: {
          bittingSimilarity: similarities.bitting,
          edgeSimilarity: similarities.edge,
          shapeSimilarity: shapeVetoResult.huSimilarity,
          vetoDetails: shapeVetoResult.details
        },
        processingTime
      };
      
    } catch (error) {
      console.error(`Error en compareKeys: ${error.message}`);
      return {
        similarity: 0,
        matchStatus: 'NO_MATCH',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Calcula similitudes de features individuales
   * @param {Object} queryFeatures - Features query
   * @param {Object} refFeatures - Features referencia
   * @returns {Object} Similitudes
   */
  calculateFeatureSimilarities(queryFeatures, refFeatures) {
    const similarities = {};
    
    // 1. Bitting Similarity (DTW - peso 0.75)
    if (queryFeatures.bitting && refFeatures.bitting) {
      similarities.bitting = this.compareBittingProfiles(
        queryFeatures.bitting,
        refFeatures.bitting
      );
    } else {
      similarities.bitting = 0;
    }
    
    // 2. Edge Similarity (peso 0.15)
    if (queryFeatures.edge && refFeatures.edge) {
      similarities.edge = this.compareEdgeFeatures(
        queryFeatures.edge,
        refFeatures.edge
      );
    } else {
      similarities.edge = 0;
    }
    
    // 3. Shape Similarity (peso 0.10)
    if (queryFeatures.shape && refFeatures.shape) {
      similarities.shape = this.compareShapeFeatures(
        queryFeatures.shape,
        refFeatures.shape
      );
    } else {
      similarities.shape = 0;
    }
    
    return similarities;
  }

  /**
   * Compara perfiles de bitting usando DTW RESTRICTIVO + validaci├│n de notches
   * @param {Object} profile1 - Perfil 1
   * @param {Object} profile2 - Perfil 2
   * @returns {number} Similitud [0,1]
   */
  compareBittingProfiles(profile1, profile2) {
    try {
      // PASO 1: Validar conteo de notches (importante pero permisivo para frente/dorso)
      const notchSimilarity = this.compareNotchPatterns(
        profile1.notches,
        profile2.notches
      );
      
      // Si los notches son EXTREMADAMENTE diferentes, penalizar
      // Threshold 0.3 (permisivo para same-key-diff-photo)
      if (notchSimilarity < 0.3) {
        console.log(`ÔÜá´©Å  Notch count muy diferente: ${profile1.notches?.length} vs ${profile2.notches?.length}, sim=${notchSimilarity.toFixed(3)}`);
        return notchSimilarity * 0.6; // Penalizaci├│n moderada (no severa)
      }
      
      // PASO 2: Comparar perfiles DTW con banda restrictiva
      const profileSimilarity = this.compareDTWProfiles(
        profile1.profile,
        profile2.profile
      );
      
      // PASO 3: Validar varianza del perfil (detecta perfiles planos vs dentados)
      const variance1 = this.calculateProfileVariance(profile1.profile);
      const variance2 = this.calculateProfileVariance(profile2.profile);
      const varianceSimilarity = this.compareVariances(variance1, variance2);
      
      // Combinaci├│n: DTW (60%), Notches (30%), Varianza (10%)
      const combined = profileSimilarity * 0.60 + notchSimilarity * 0.30 + varianceSimilarity * 0.10;
      
      console.log(`­ƒôè Bitting detailed breakdown:`);
      console.log(`   - DTW (60%): ${profileSimilarity.toFixed(3)} ÔåÆ ${(profileSimilarity * 0.60).toFixed(3)}`);
      console.log(`   - Notches (30%): ${notchSimilarity.toFixed(3)} (${profile1.notches?.length || 0} vs ${profile2.notches?.length || 0}) ÔåÆ ${(notchSimilarity * 0.30).toFixed(3)}`);
      console.log(`   - Variance (10%): ${varianceSimilarity.toFixed(3)} (${variance1.toFixed(4)} vs ${variance2.toFixed(4)}) ÔåÆ ${(varianceSimilarity * 0.10).toFixed(3)}`);
      console.log(`   - Combined: ${combined.toFixed(3)}`);
      
      return combined;
      
    } catch (error) {
      console.error(`Error comparando perfiles: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Calcula varianza de un perfil (detecta perfiles planos vs dentados)
   */
  calculateProfileVariance(profile) {
    if (!profile || profile.length === 0) return 0;
    
    const mean = profile.reduce((sum, val) => sum + val, 0) / profile.length;
    const variance = profile.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / profile.length;
    
    return variance;
  }
  
  /**
   * Compara varianzas de dos perfiles
   */
  compareVariances(var1, var2) {
    if (var1 === 0 && var2 === 0) return 1;
    if (var1 === 0 || var2 === 0) return 0;
    
    const ratio = Math.min(var1, var2) / Math.max(var1, var2);
    
    // Penalizaci├│n exponencial para varianzas muy diferentes
    return Math.exp(-Math.abs(1 - ratio) * 3.0);
  }

  /**
   * Compara profiles DTW con banda MUY RESTRICTIVA de Sakoe-Chiba
   * Para discriminar entre llaves muy parecidas pero diferentes
   * @param {Array} prof1 - Profile 1
   * @param {Array} prof2 - Profile 2
   * @returns {number} Similitud
   */
  compareDTWProfiles(prof1, prof2) {
    if (!prof1 || !prof2 || prof1.length === 0 || prof2.length === 0) {
      return 0;
    }
    
    const n = prof1.length;
    const m = prof2.length;
    
    // Banda BALANCEADA de 8% (balance entre robustez y discriminaci├│n)
    // Permite same-key-diff-photo pero rechaza different-keys
    const windowSize = Math.floor(Math.max(n, m) * 0.08);
    
    // Matriz DTW
    const dtw = Array(n + 1).fill(null).map(() => 
      Array(m + 1).fill(Infinity)
    );
    
    dtw[0][0] = 0;
    
    // Llenar matriz DTW con restricci├│n de banda
    for (let i = 1; i <= n; i++) {
      // Limitar j a la ventana permitida
      const jStart = Math.max(1, Math.floor((i * m / n) - windowSize));
      const jEnd = Math.min(m, Math.ceil((i * m / n) + windowSize));
      
      for (let j = jStart; j <= jEnd; j++) {
        // CR├ìTICO: Penalizaci├│n cuadr├ítica para diferencias grandes
        const diff = Math.abs(prof1[i - 1] - prof2[j - 1]);
        const cost = diff * diff; // Cuadr├ítico en vez de lineal
        
        // Solo calcular si estamos dentro de la banda
        const candidates = [];
        if (i > 0 && dtw[i - 1][j] < Infinity) candidates.push(dtw[i - 1][j]);
        if (j > 0 && dtw[i][j - 1] < Infinity) candidates.push(dtw[i][j - 1]);
        if (i > 0 && j > 0 && dtw[i - 1][j - 1] < Infinity) candidates.push(dtw[i - 1][j - 1]);
        
        if (candidates.length > 0) {
          dtw[i][j] = cost + Math.min(...candidates);
        }
      }
    }
    
    // Si no hay camino v├ílido, perfiles muy diferentes
    if (dtw[n][m] === Infinity) {
      return 0;
    }
    
    // Convertir distancia DTW a similitud [0,1]
    // Normalizar por el camino m├ís largo
    const maxPathLength = Math.max(n, m);
    const normalizedDistance = Math.sqrt(dtw[n][m] / maxPathLength); // Ra├¡z para deshacer cuadr├ítico
    
    // Penalizaci├│n exponencial BALANCEADA (factor 3.5)
    // Balance entre discriminar different-keys y aceptar same-key-diff-photo
    const similarity = Math.exp(-normalizedDistance * 3.5);
    
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Compara patrones de notches (M├üS DISCRIMINATIVO)
   * @param {Array} notches1 - Notches 1
   * @param {Array} notches2 - Notches 2
   * @returns {number} Similitud
   */
  compareNotchPatterns(notches1, notches2) {
    if (!notches1 || !notches2) return 0;
    
    const count1 = notches1.length;
    const count2 = notches2.length;
    
    if (count1 === 0 && count2 === 0) return 1;
    if (count1 === 0 || count2 === 0) return 0;
    
    // Penalizar fuertemente diferencias en conteo
    const countDiff = Math.abs(count1 - count2);
    const maxCount = Math.max(count1, count2);
    
    // Si la diferencia es > 2 notches, muy diferentes
    if (countDiff > 2) return 0;
    
    // Similitud exponencial (penaliza diferencias)
    const countSim = Math.exp(-countDiff / maxCount);
    
    return countSim;
  }

  /**
   * Compara edge features (M├üS DISCRIMINATIVO)
   * @param {Object} edge1 - Edge 1
   * @param {Object} edge2 - Edge 2
   * @returns {number} Similitud
   */
  compareEdgeFeatures(edge1, edge2) {
    const mag1 = edge1.magnitude || 0;
    const mag2 = edge2.magnitude || 0;
    const den1 = edge1.density || 0;
    const den2 = edge2.density || 0;
    
    const maxMag = Math.max(mag1, mag2, 1);
    const maxDen = Math.max(den1, den2, 1);
    
    // Usar funci├│n exponencial para penalizar diferencias
    const magDiff = Math.abs(mag1 - mag2) / maxMag;
    const denDiff = Math.abs(den1 - den2) / maxDen;
    
    const magSim = Math.exp(-magDiff * 3.0); // Factor 3 = m├ís discriminativo
    const denSim = Math.exp(-denDiff * 3.0);
    
    // Promedio geom├®trico (m├ís estricto que promedio aritm├®tico)
    return Math.sqrt(magSim * denSim);
  }

  /**
   * Compara shape features b├ísicos
   * @param {Object} shape1 - Shape 1
   * @param {Object} shape2 - Shape 2
   * @returns {number} Similitud
   */
  compareShapeFeatures(shape1, shape2) {
    if (!shape1 || !shape2) return 0;
    
    // Usar Hu Moments si est├ín disponibles
    if (shape1.huMoments && shape2.huMoments) {
      return this.shapeVeto.compareHuMoments(shape1.huMoments, shape2.huMoments);
    }
    
    // Fallback: comparar metadata b├ísica
    if (shape1.metadata && shape2.metadata) {
      const aspectRatio1 = shape1.metadata.width / shape1.metadata.height;
      const aspectRatio2 = shape2.metadata.width / shape2.metadata.height;
      const aspectRatioSim = 1 - Math.abs(aspectRatio1 - aspectRatio2) / Math.max(aspectRatio1, aspectRatio2);
      
      return Math.max(0, aspectRatioSim);
    }
    
    return 0;
  }

  /**
   * Calcula weighted similarity
   * @param {Object} similarities - Similitudes individuales
   * @returns {number} Similitud ponderada
   */
  calculateWeightedSimilarity(similarities) {
    const weights = this.config.weights;
    let weightedSum = 0;
    let totalWeight = 0;
    
    console.log('­ƒöì DEBUG - Similarities:', similarities);
    console.log('­ƒöì DEBUG - Weights:', weights);
    
    for (const [feature, similarity] of Object.entries(similarities)) {
      if (weights[feature] && !isNaN(similarity) && isFinite(similarity)) {
        weightedSum += similarity * weights[feature];
        totalWeight += weights[feature];
        console.log(`­ƒöì DEBUG - ${feature}: ${similarity} * ${weights[feature]} = ${similarity * weights[feature]}`);
      }
    }
    
    const result = totalWeight > 0 ? weightedSum / totalWeight : 0;
    console.log(`­ƒöì DEBUG - Weighted similarity: ${weightedSum} / ${totalWeight} = ${result}`);
    
    return result;
  }

  /**
   * Toma decisi├│n calibrada
   * @param {number} similarity - Similitud
   * @param {string} context - Contexto
   * @returns {Object} {status, confidence}
   */
  makeDecision(similarity, context) {
    const thresholds = this.config.thresholds;
    
    console.log(`­ƒöì DEBUG - makeDecision: similarity=${similarity}, T_match=${thresholds.T_match}, T_possible=${thresholds.T_possible}`);
    
    let status = 'NO_MATCH';
    let confidence = 0;
    
    if (similarity >= thresholds.T_match) {
      status = 'MATCH';
      confidence = Math.min(100, ((similarity - thresholds.T_match) / (1 - thresholds.T_match)) * 100);
      console.log(`­ƒöì DEBUG - MATCH: similarity ${similarity} >= T_match ${thresholds.T_match}`);
    } else if (similarity >= thresholds.T_possible) {
      status = 'POSSIBLE';
      confidence = Math.max(0, ((similarity - thresholds.T_possible) / (thresholds.T_match - thresholds.T_possible)) * 50);
      console.log(`­ƒöì DEBUG - POSSIBLE: similarity ${similarity} >= T_possible ${thresholds.T_possible}`);
    } else {
      status = 'NO_MATCH';
      confidence = 0;
      console.log(`­ƒöì DEBUG - NO_MATCH: similarity ${similarity} < T_possible ${thresholds.T_possible}`);
    }
    
    console.log(`­ƒöì DEBUG - Final decision: ${status} (confidence: ${confidence})`);
    return { status, confidence };
  }

  /**
   * Busca mejor match en inventario con shape veto
   * @param {Object} queryFeatures - Features query
   * @param {Array} inventory - Inventario
   * @param {string} context - Contexto
   * @returns {Object} Mejor match
   */
  findBestMatch(queryFeatures, inventory, context = 'inventory') {
    if (!inventory || inventory.length === 0) {
      return null;
    }
    
    let bestMatch = null;
    let highestSimilarity = -1;
    let secondHighestSimilarity = -1;
    
    for (const item of inventory) {
      const comparison = this.compareKeys(queryFeatures, item.features, context);
      
      if (comparison.similarity > highestSimilarity) {
        secondHighestSimilarity = highestSimilarity;
        highestSimilarity = comparison.similarity;
        bestMatch = {
          key: item.key,
          similarity: comparison.similarity,
          matchStatus: comparison.matchStatus,
          confidence: comparison.confidence,
          shapeVeto: comparison.shapeVeto,
          details: comparison.details
        };
      } else if (comparison.similarity > secondHighestSimilarity) {
        secondHighestSimilarity = comparison.similarity;
      }
    }
    
    // Calcular margin
    const margin = highestSimilarity - secondHighestSimilarity;
    
    console.log(`­ƒöì DEBUG - findBestMatch: highest=${highestSimilarity}, second=${secondHighestSimilarity}, margin=${margin}, delta=${this.config.thresholds.delta}`);
    
    // Validar margin (SIEMPRE - sin modo permisivo)
    if (bestMatch && margin < this.config.thresholds.delta) {
      // Margin insuficiente ÔåÆ degradar a POSSIBLE
      console.log(`­ƒöì DEBUG - Margin insuficiente: ${margin} < ${this.config.thresholds.delta}, degradando a POSSIBLE`);
      if (bestMatch.matchStatus === 'MATCH') {
        bestMatch.matchStatus = 'POSSIBLE';
        bestMatch.confidence = bestMatch.confidence * 0.5;
      }
    }
    
    if (bestMatch) {
      bestMatch.margin = margin;
    }
    
    return bestMatch;
  }

  /**
   * Calibra thresholds bas├índose en dataset
   * @param {Array} sameKeyPairs - Pares same-key
   * @param {Array} differentKeyPairs - Pares different-key
   * @returns {Object} Thresholds calibrados
   */
  calibrateThresholds(sameKeyPairs, differentKeyPairs) {
    // Calcular ROC curve
    const scores = [];
    
    for (const pair of sameKeyPairs) {
      const result = this.compareKeys(pair.query, pair.reference, 'sameKey');
      scores.push({ score: result.similarity, label: 1 }); // Positive
    }
    
    for (const pair of differentKeyPairs) {
      const result = this.compareKeys(pair.query, pair.reference, 'differentKey');
      scores.push({ score: result.similarity, label: 0 }); // Negative
    }
    
    // Ordenar por score
    scores.sort((a, b) => b.score - a.score);
    
    // Buscar threshold ├│ptimo (FPR Ôëñ 10%, maximizar recall)
    let bestThreshold = 0.85;
    let bestF1 = 0;
    
    for (let i = 0; i < scores.length; i++) {
      const threshold = scores[i].score;
      
      let tp = 0, fp = 0, tn = 0, fn = 0;
      
      for (const s of scores) {
        if (s.score >= threshold) {
          if (s.label === 1) tp++;
          else fp++;
        } else {
          if (s.label === 0) tn++;
          else fn++;
        }
      }
      
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1 = 2 * (precision * recall) / (precision + recall) || 0;
      const fpr = fp / (fp + tn) || 0;
      
      // Objetivo: FPR Ôëñ 10% y recall ÔëÑ 75%
      if (fpr <= 0.10 && recall >= 0.75 && f1 > bestF1) {
        bestF1 = f1;
        bestThreshold = threshold;
      }
    }
    
    return {
      T_match: bestThreshold,
      T_possible: bestThreshold * 0.88, // 88% de T_match
      delta: 0.12,
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

