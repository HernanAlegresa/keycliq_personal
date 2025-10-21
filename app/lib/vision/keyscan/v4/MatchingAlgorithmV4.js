import ShapeVeto from './ShapeVeto.js';

class MatchingAlgorithmV4 {
    constructor(config = {}) {
        // Thresholds calibrados basados en análisis V3
        this.config = {
            thresholds: {
                T_match: config.T_match || 0.98,        // MUY estricto para reducir FPR
                T_possible: config.T_possible || 0.95,  // MUY estricto
                delta: config.delta || 0.02             // MUY estricto
            },
            weights: {
                bitting: config.bitting || 0.8,
                edge: config.edge || 0.12,
                shape: config.shape || 0.08
            },
            shapeVeto: {
                enabled: config.shapeVetoEnabled !== false,
                softPenalty: config.softPenalty || 0.88,  // Factor de penalización suave
                huThreshold: config.huThreshold || 0.25,  // Umbral para hu similarity
                hausdorffThreshold: config.hausdorffThreshold || 140 // Umbral para hausdorff
            },
            dtw: {
                bandPercentage: config.dtwBand || 6      // Band más flexible
            }
        };

        this.shapeVeto = new ShapeVeto();
    }

    /**
     * Compara dos llaves con mejoras V4
     */
    async compareKeys(key1, key2) {
        try {
            // 1. Comparación de bitting con DTW band ajustado
            const bittingSimilarity = await this.compareBitting(key1.features.bitting, key2.features.bitting);
            
            // 2. Comparación de bordes
            const edgeSimilarity = await this.compareEdges(key1.features.edge, key2.features.edge);
            
            // 3. Comparación de shape con canonicalización
            const shapeResult = await this.compareShapeWithCanonicalization(key1.features.shape, key2.features.shape);
            const shapeSimilarity = shapeResult.similarity;
            
            // 4. Cálculo de similitud ponderada
            let weightedSimilarity = (
                bittingSimilarity * this.config.weights.bitting +
                edgeSimilarity * this.config.weights.edge +
                shapeSimilarity * this.config.weights.shape
            );

            // 5. Aplicar Shape Veto suave si está habilitado
            let vetoApplied = false;
            if (this.config.shapeVeto.enabled && shapeResult.details) {
                const { huSimilarity, hausdorff } = shapeResult.details;
                
                if (huSimilarity < this.config.shapeVeto.huThreshold || 
                    hausdorff > this.config.shapeVeto.hausdorffThreshold) {
                    weightedSimilarity *= this.config.shapeVeto.softPenalty;
                    vetoApplied = true;
                }
            }

            // 6. Tomar decisión con thresholds calibrados
            const decision = this.makeDecision(weightedSimilarity);
            
            return {
                decision: decision.status,
                similarity: weightedSimilarity,
                confidence: decision.confidence,
                margin: decision.margin,
                details: {
                    bittingSimilarity,
                    edgeSimilarity,
                    shapeSimilarity,
                    weightedSimilarity,
                    vetoApplied,
                    shapeDetails: shapeResult.details,
                    canonicalization: shapeResult.canonicalization
                }
            };

        } catch (error) {
            console.error('Error en compareKeys V4:', error);
            return {
                decision: 'NO_MATCH',
                similarity: 0,
                confidence: 0,
                margin: 0,
                error: error.message
            };
        }
    }

    /**
     * Comparación de bitting con DTW band ajustado
     */
    async compareBitting(bitting1, bitting2) {
        if (!bitting1 || !bitting2) return 0;

        try {
            const profile1 = bitting1.profile || [];
            const profile2 = bitting2.profile || [];
            
            if (profile1.length === 0 || profile2.length === 0) return 0;

            // DTW con band ajustado (6% en lugar del default)
            const dtwSimilarity = this.calculateDTWSimilarity(profile1, profile2, this.config.dtw.bandPercentage);
            
            // Comparación de notches
            const notchesSimilarity = this.compareNotches(bitting1.notches || 0, bitting2.notches || 0);
            
            // Comparación de varianza
            const varianceSimilarity = this.compareVariance(bitting1.variance || 0, bitting2.variance || 0);
            
            // Combinación ponderada
            const combined = (
                dtwSimilarity * 0.6 +      // 60% DTW
                notchesSimilarity * 0.3 +   // 30% notches
                varianceSimilarity * 0.1    // 10% varianza
            );

            return Math.max(0, Math.min(1, combined));

        } catch (error) {
            console.error('Error en compareBitting V4:', error);
            return 0;
        }
    }

    /**
     * Comparación de bordes mejorada
     */
    async compareEdges(edge1, edge2) {
        if (!edge1 || !edge2) return 0;

        try {
            const histogram1 = edge1.histogram || [];
            const histogram2 = edge2.histogram || [];
            
            if (histogram1.length === 0 || histogram2.length === 0) return 0;

            // Correlación mejorada con normalización
            const correlation = this.calculateCorrelation(histogram1, histogram2);
            return Math.max(0, correlation);

        } catch (error) {
            console.error('Error en compareEdges V4:', error);
            return 0;
        }
    }

    /**
     * Comparación de shape con canonicalización de orientación
     */
    async compareShapeWithCanonicalization(shape1, shape2) {
        if (!shape1 || !shape2) {
            return { similarity: 0, details: null, canonicalization: null };
        }

        try {
            // Comparación original
            const originalResult = await this.shapeVeto.compareHuMoments(shape1, shape2);
            
            // Intentar canonicalización si hay momentos válidos
            let canonicalizedResult = null;
            let canonicalization = null;
            
            if (shape1.moments && shape2.moments && 
                shape1.moments.length > 0 && shape2.moments.length > 0) {
                
                canonicalizedResult = await this.tryCanonicalization(shape1, shape2);
                canonicalization = canonicalizedResult.method;
            }
            
            // Usar el mejor resultado
            let bestResult = originalResult;
            if (canonicalizedResult && canonicalizedResult.similarity > originalResult.similarity) {
                bestResult = canonicalizedResult;
            }
            
            return {
                similarity: bestResult.similarity,
                details: {
                    huSimilarity: bestResult.similarity,
                    hausdorff: bestResult.hausdorff || 0,
                    passed: bestResult.passed || false
                },
                canonicalization: canonicalization
            };

        } catch (error) {
            console.error('Error en compareShapeWithCanonicalization V4:', error);
            return { similarity: 0, details: null, canonicalization: null };
        }
    }

    /**
     * Intenta canonicalización de orientación
     */
    async tryCanonicalization(shape1, shape2) {
        try {
            // Deskew: alinear eje mayor horizontalmente
            const deskewed1 = this.applyDeskew(shape1);
            const deskewed2 = this.applyDeskew(shape2);
            
            const deskewResult = await this.shapeVeto.compareHuMoments(deskewed1, deskewed2);
            
            // Mirroring: probar orientación espejada
            const mirrored1 = this.applyMirroring(deskewed1);
            const mirrored2 = this.applyMirroring(deskewed2);
            
            const mirrorResult = await this.shapeVeto.compareHuMoments(mirrored1, mirrored2);
            
            // Retornar el mejor resultado
            if (mirrorResult.similarity > deskewResult.similarity) {
                return { ...mirrorResult, method: 'deskew+mirror' };
            } else {
                return { ...deskewResult, method: 'deskew' };
            }

        } catch (error) {
            console.error('Error en tryCanonicalization V4:', error);
            return { similarity: 0, method: 'failed' };
        }
    }

    /**
     * Aplica deskew a los momentos de shape
     */
    applyDeskew(shape) {
        if (!shape.moments || shape.moments.length < 2) return shape;
        
        // Simplificación: rotar momentos para alinear eje mayor
        const rotatedMoments = [...shape.moments];
        if (rotatedMoments.length > 1) {
            // Rotación de 90 grados en el plano de momentos
            const temp = rotatedMoments[1];
            rotatedMoments[1] = rotatedMoments[2] || 0;
            rotatedMoments[2] = temp;
        }
        
        return {
            ...shape,
            moments: rotatedMoments
        };
    }

    /**
     * Aplica mirroring a los momentos de shape
     */
    applyMirroring(shape) {
        if (!shape.moments || shape.moments.length < 3) return shape;
        
        // Simplificación: invertir momento de simetría
        const mirroredMoments = [...shape.moments];
        if (mirroredMoments.length > 2) {
            mirroredMoments[2] = -mirroredMoments[2]; // Invertir momento de simetría
        }
        
        return {
            ...shape,
            moments: mirroredMoments
        };
    }

    /**
     * Calcula similitud DTW con band personalizado
     */
    calculateDTWSimilarity(profile1, profile2, bandPercentage = 6) {
        if (profile1.length === 0 || profile2.length === 0) return 0;
        
        const maxLength = Math.max(profile1.length, profile2.length);
        const band = Math.ceil(maxLength * bandPercentage / 100);
        
        // DTW con band limitado
        const distance = this.dynamicTimeWarping(profile1, profile2, band);
        
        // Normalizar a similitud (0-1)
        const maxPossibleDistance = maxLength * 10; // Asumiendo valores típicos
        const similarity = Math.max(0, 1 - (distance / maxPossibleDistance));
        
        return Math.min(1, similarity);
    }

    /**
     * Implementación DTW con band
     */
    dynamicTimeWarping(seq1, seq2, band) {
        const n = seq1.length;
        const m = seq2.length;
        
        // Crear matriz de costos con band limitado
        const cost = Array(n + 1).fill().map(() => Array(m + 1).fill(Infinity));
        cost[0][0] = 0;
        
        // Llenar primera fila y columna
        for (let i = 1; i <= Math.min(n, band); i++) {
            cost[i][0] = cost[i-1][0] + Math.abs(seq1[i-1] - seq2[0]);
        }
        
        for (let j = 1; j <= Math.min(m, band); j++) {
            cost[0][j] = cost[0][j-1] + Math.abs(seq1[0] - seq2[j-1]);
        }
        
        // Llenar el resto con band constraint
        for (let i = 1; i <= n; i++) {
            const startJ = Math.max(1, i - band);
            const endJ = Math.min(m, i + band);
            
            for (let j = startJ; j <= endJ; j++) {
                const diff = Math.abs(seq1[i-1] - seq2[j-1]);
                cost[i][j] = diff + Math.min(
                    cost[i-1][j],
                    cost[i][j-1],
                    cost[i-1][j-1]
                );
            }
        }
        
        return cost[n][m];
    }

    /**
     * Compara número de notches
     */
    compareNotches(notches1, notches2) {
        if (notches1 === notches2) return 1;
        if (notches1 === 0 || notches2 === 0) return 0.5;
        
        const diff = Math.abs(notches1 - notches2);
        const max = Math.max(notches1, notches2);
        return Math.max(0, 1 - (diff / max));
    }

    /**
     * Compara varianza
     */
    compareVariance(variance1, variance2) {
        if (variance1 === 0 && variance2 === 0) return 1;
        
        const maxVar = Math.max(variance1, variance2);
        if (maxVar === 0) return 1;
        
        const diff = Math.abs(variance1 - variance2);
        return Math.max(0, 1 - (diff / maxVar));
    }

    /**
     * Calcula correlación entre histogramas
     */
    calculateCorrelation(hist1, hist2) {
        if (hist1.length !== hist2.length) return 0;
        
        const n = hist1.length;
        let sum1 = 0, sum2 = 0, sum1sq = 0, sum2sq = 0, psum = 0;
        
        for (let i = 0; i < n; i++) {
            sum1 += hist1[i];
            sum2 += hist2[i];
            sum1sq += hist1[i] * hist1[i];
            sum2sq += hist2[i] * hist2[i];
            psum += hist1[i] * hist2[i];
        }
        
        const num = psum - (sum1 * sum2 / n);
        const den = Math.sqrt((sum1sq - sum1 * sum1 / n) * (sum2sq - sum2 * sum2 / n));
        
        return den === 0 ? 0 : num / den;
    }

    /**
     * Toma decisión con thresholds calibrados
     */
    makeDecision(similarity) {
        const { T_match, T_possible, delta } = this.config.thresholds;
        
        if (similarity >= T_match) {
            return {
                status: 'MATCH',
                confidence: Math.round((similarity - T_match) / (1 - T_match) * 100),
                margin: similarity - T_match
            };
        } else if (similarity >= T_possible) {
            return {
                status: 'POSSIBLE',
                confidence: Math.round((similarity - T_possible) / (T_match - T_possible) * 100),
                margin: similarity - T_possible
            };
        } else {
            return {
                status: 'NO_MATCH',
                confidence: 0,
                margin: similarity - T_possible
            };
        }
    }
}

export default MatchingAlgorithmV4;
