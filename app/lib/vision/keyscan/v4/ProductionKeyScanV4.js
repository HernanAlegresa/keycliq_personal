import ImageProcessorV4 from './ImageProcessorV4.js';
import MatchingAlgorithmV4 from './MatchingAlgorithmV4.js';

class ProductionKeyScanV4 {
    constructor(config = {}) {
        this.config = {
            // Thresholds calibrados para V4
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
                softPenalty: config.softPenalty || 0.88,
                huThreshold: config.huThreshold || 0.25,
                hausdorffThreshold: config.hausdorffThreshold || 140
            },
            dtw: {
                bandPercentage: config.dtwBand || 6
            },
            preprocessing: {
                resizeFit: config.resizeFit || 'inside',  // Cambio clave
                adaptiveThreshold: config.adaptiveThreshold !== false
            }
        };

        this.imageProcessor = new ImageProcessorV4({
            resizeWidth: 400,
            resizeHeight: 200,
            resizeFit: this.config.preprocessing.resizeFit,
            adaptiveThreshold: this.config.preprocessing.adaptiveThreshold,
            grayscale: true,
            normalize: true,
            sharpenSigma: 1.0
        });

        this.matchingAlgorithm = new MatchingAlgorithmV4({
            T_match: this.config.thresholds.T_match,
            T_possible: this.config.thresholds.T_possible,
            delta: this.config.thresholds.delta,
            bitting: this.config.weights.bitting,
            edge: this.config.weights.edge,
            shape: this.config.weights.shape,
            shapeVetoEnabled: this.config.shapeVeto.enabled,
            softPenalty: this.config.shapeVeto.softPenalty,
            huThreshold: this.config.shapeVeto.huThreshold,
            hausdorffThreshold: this.config.shapeVeto.hausdorffThreshold,
            dtwBand: this.config.dtw.bandPercentage
        });
    }

    /**
     * Busca match en inventario con mejoras V4
     */
    async findMatchInInventory(queryImageBuffer, inventory) {
        try {
            console.log('🔍 KeyScan V4 - Iniciando búsqueda en inventario...');
            
            // Extraer features de la imagen de consulta
            const queryFeatures = await this.imageProcessor.extractFeatures(queryImageBuffer);
            console.log('✅ Features de consulta extraídos');

            let bestMatch = null;
            let bestScore = -1;
            let allResults = [];

            // Comparar contra cada llave del inventario
            for (const inventoryItem of inventory) {
                try {
                    const comparisonResult = await this.matchingAlgorithm.compareKeys(
                        { features: queryFeatures },
                        { features: inventoryItem.features }
                    );

                    const result = {
                        keyId: inventoryItem.key.id,
                        keyType: inventoryItem.key.type,
                        similarity: comparisonResult.similarity,
                        decision: comparisonResult.decision,
                        confidence: comparisonResult.confidence,
                        margin: comparisonResult.margin,
                        details: comparisonResult.details
                    };

                    allResults.push(result);

                    // Actualizar mejor match
                    if (comparisonResult.similarity > bestScore) {
                        bestScore = comparisonResult.similarity;
                        bestMatch = result;
                    }

                } catch (error) {
                    console.error(`Error comparando con llave ${inventoryItem.key.id}:`, error);
                }
            }

            // Ordenar resultados por similitud
            allResults.sort((a, b) => b.similarity - a.similarity);

            // Determinar decisión final
            const finalDecision = this.makeFinalDecision(bestMatch, allResults);

            console.log(`🎯 KeyScan V4 - Decisión final: ${finalDecision.decision} (${finalDecision.confidence}%)`);

            return {
                decision: finalDecision.decision,
                confidence: finalDecision.confidence,
                bestMatch: bestMatch,
                topCandidates: allResults.slice(0, 3), // Top 3 candidatos
                allResults: allResults,
                queryFeatures: queryFeatures,
                algorithmVersion: 'V4'
            };

        } catch (error) {
            console.error('Error en findMatchInInventory V4:', error);
            return {
                decision: 'NO_MATCH',
                confidence: 0,
                bestMatch: null,
                topCandidates: [],
                allResults: [],
                error: error.message,
                algorithmVersion: 'V4'
            };
        }
    }

    /**
     * Toma decisión final basada en el mejor match y candidatos
     */
    makeFinalDecision(bestMatch, allResults) {
        if (!bestMatch || allResults.length === 0) {
            return { decision: 'NO_MATCH', confidence: 0 };
        }

        // Si hay un match claro
        if (bestMatch.decision === 'MATCH') {
            return {
                decision: 'MATCH',
                confidence: bestMatch.confidence
            };
        }

        // Si es posible, verificar margen con el segundo mejor
        if (bestMatch.decision === 'POSSIBLE' && allResults.length > 1) {
            const secondBest = allResults[1];
            const margin = bestMatch.similarity - secondBest.similarity;
            
            // Si el margen es suficiente, confirmar como MATCH
            if (margin >= this.config.thresholds.delta) {
                return {
                    decision: 'MATCH',
                    confidence: Math.min(100, bestMatch.confidence + 10)
                };
            }
        }

        // Retornar decisión original
        return {
            decision: bestMatch.decision,
            confidence: bestMatch.confidence
        };
    }

    /**
     * Obtiene configuración actual
     */
    getConfiguration() {
        return {
            version: 'V4',
            thresholds: this.config.thresholds,
            weights: this.config.weights,
            shapeVeto: this.config.shapeVeto,
            dtw: this.config.dtw,
            preprocessing: this.config.preprocessing
        };
    }

    /**
     * Actualiza configuración
     */
    updateConfiguration(newConfig) {
        Object.assign(this.config, newConfig);
        
        // Recrear algoritmos con nueva configuración
        this.matchingAlgorithm = new MatchingAlgorithmV4({
            T_match: this.config.thresholds.T_match,
            T_possible: this.config.thresholds.T_possible,
            delta: this.config.thresholds.delta,
            bitting: this.config.weights.bitting,
            edge: this.config.weights.edge,
            shape: this.config.weights.shape,
            shapeVetoEnabled: this.config.shapeVeto.enabled,
            softPenalty: this.config.shapeVeto.softPenalty,
            huThreshold: this.config.shapeVeto.huThreshold,
            hausdorffThreshold: this.config.shapeVeto.hausdorffThreshold,
            dtwBand: this.config.dtw.bandPercentage
        });

        this.imageProcessor = new ImageProcessorV4({
            resizeFit: this.config.preprocessing.resizeFit,
            adaptiveThreshold: this.config.preprocessing.adaptiveThreshold
        });
    }
}

export default ProductionKeyScanV4;
