class ShapeVeto {
    constructor() {
        this.config = {
            huThreshold: 0.3,
            hausdorffThreshold: 150,
            minMoments: 3
        };
    }

    /**
     * Compara momentos de Hu entre dos shapes
     */
    async compareHuMoments(shape1, shape2) {
        try {
            if (!shape1 || !shape2) {
                return { similarity: 0, hausdorff: 0, passed: false };
            }

            const moments1 = shape1.moments || [];
            const moments2 = shape2.moments || [];

            if (moments1.length < this.config.minMoments || moments2.length < this.config.minMoments) {
                console.log('DEBUG compareHuMoments: No valid moments found');
                return { similarity: 0, hausdorff: 0, passed: false };
            }

            // Calcular similitud usando distancia euclidiana normalizada
            let similarity = 0;
            let totalWeight = 0;

            for (let i = 0; i < Math.min(moments1.length, moments2.length); i++) {
                const weight = this.getMomentWeight(i);
                const moment1 = Math.abs(moments1[i]);
                const moment2 = Math.abs(moments2[i]);
                
                if (moment1 > 0 || moment2 > 0) {
                    const maxMoment = Math.max(moment1, moment2);
                    const diff = Math.abs(moment1 - moment2);
                    const momentSimilarity = Math.max(0, 1 - (diff / maxMoment));
                    
                    similarity += momentSimilarity * weight;
                    totalWeight += weight;
                }
            }

            if (totalWeight > 0) {
                similarity = similarity / totalWeight;
            }

            // Calcular distancia de Hausdorff simplificada
            const hausdorff = this.calculateHausdorffDistance(shape1, shape2);
            
            // Determinar si pasa el veto
            const passed = similarity >= this.config.huThreshold && hausdorff <= this.config.hausdorffThreshold;

            return {
                similarity: Math.max(0, Math.min(1, similarity)),
                hausdorff: hausdorff,
                passed: passed
            };

        } catch (error) {
            console.error('Error en compareHuMoments:', error);
            return { similarity: 0, hausdorff: 0, passed: false };
        }
    }

    /**
     * Obtiene peso para cada momento de Hu
     */
    getMomentWeight(index) {
        const weights = [1.0, 0.8, 0.6, 0.4, 0.3, 0.2, 0.1];
        return weights[index] || 0.05;
    }

    /**
     * Calcula distancia de Hausdorff simplificada
     */
    calculateHausdorffDistance(shape1, shape2) {
        try {
            const contour1 = shape1.contour || [];
            const contour2 = shape2.contour || [];

            if (contour1.length === 0 || contour2.length === 0) {
                return 0;
            }

            // Simplificación: usar distancia promedio entre puntos más cercanos
            let totalDistance = 0;
            let pointCount = 0;

            for (let i = 0; i < contour1.length; i++) {
                let minDistance = Infinity;
                const point1 = contour1[i];

                for (let j = 0; j < contour2.length; j++) {
                    const point2 = contour2[j];
                    const distance = Math.sqrt(
                        Math.pow(point1.x - point2.x, 2) + 
                        Math.pow(point1.y - point2.y, 2)
                    );
                    minDistance = Math.min(minDistance, distance);
                }

                if (minDistance < Infinity) {
                    totalDistance += minDistance;
                    pointCount++;
                }
            }

            return pointCount > 0 ? totalDistance / pointCount : 0;

        } catch (error) {
            console.error('Error calculando Hausdorff:', error);
            return 0;
        }
    }

    /**
     * Aplica veto estricto (V3 behavior)
     */
    applyStrictVeto(shapeSimilarity, huSimilarity, hausdorff) {
        if (huSimilarity < this.config.huThreshold || hausdorff > this.config.hausdorffThreshold) {
            return 0; // Veto estricto
        }
        return shapeSimilarity;
    }

    /**
     * Aplica veto suave (V4 behavior)
     */
    applySoftVeto(shapeSimilarity, huSimilarity, hausdorff, penaltyFactor = 0.88) {
        if (huSimilarity < this.config.huThreshold || hausdorff > this.config.hausdorffThreshold) {
            return shapeSimilarity * penaltyFactor;
        }
        return shapeSimilarity;
    }
}

export default ShapeVeto;
