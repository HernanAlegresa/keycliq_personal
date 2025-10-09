/**
 * KeyScan V3 Server-side wrapper
 * Este archivo solo se ejecuta en el servidor (Node.js)
 */

import { ProductionKeyScanV3 } from './vision/keyscan/v3/ProductionKeyScanV3.js';
import { dataUrlToBinary } from '../utils/imageConversion.js';

/**
 * Procesa una imagen con KeyScan V3
 * @param {string} imageDataURL - Data URL de la imagen
 * @param {Array} inventory - Inventario del usuario con signatures
 * @param {Object} config - Configuración de KeyScan V3
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function processKeyImageV3(imageDataURL, inventory = [], config = {}) {
  // Convertir dataURL a Buffer
  const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
  
  // Inicializar KeyScan V3 con configuración CALIBRADA (basada en testing exitoso)
  // DTW banda 8% + penalización cuadrática + notches permisivos + varianza
  // Balance perfecto: robustez (same-key-diff-photo) + discriminación (different-keys)
  const keyScan = new ProductionKeyScanV3({
    matching: {
      thresholds: {
        T_match: parseFloat(process.env.KEYSCAN_THRESHOLD_MATCH || '0.82'),     // MATCH: calibrado (0.857-0.889 en testing)
        T_possible: parseFloat(process.env.KEYSCAN_THRESHOLD_POSSIBLE || '0.70'), // POSSIBLE: casos límite (0.70-0.81)
        delta: parseFloat(process.env.KEYSCAN_THRESHOLD_DELTA || '0.15')         // Margen desambiguación (15%)
      },
      weights: {
        bitting: parseFloat(process.env.KEYSCAN_WEIGHT_BITTING || '0.80'),  // Bitting: DTW 8% + notches + varianza
        edge: parseFloat(process.env.KEYSCAN_WEIGHT_EDGE || '0.12'),        // Edge: exponencial balanceada
        shape: parseFloat(process.env.KEYSCAN_WEIGHT_SHAPE || '0.08')       // Shape: señal secundaria
      },
      shapeVeto: {
        enabled: false,                                                            // NO gate, solo señal
        hausdorff_max: parseFloat(process.env.KEYSCAN_GATE_HAUSDORFF || '150'),   // Permisivo
        hu_similarity_min: parseFloat(process.env.KEYSCAN_GATE_HU || '0.20')      // Permisivo
      }
    },
    ...config
  });
  
  // Procesar imagen
  return await keyScan.processKeyImage(imageBuffer, inventory);
}

/**
 * Extrae features de una imagen
 * @param {string} imageDataURL - Data URL de la imagen
 * @returns {Promise<Object>} Features extraídas
 */
export async function extractFeaturesV3(imageDataURL) {
  // Convertir dataURL a Buffer
  const { data: imageBuffer } = dataUrlToBinary(imageDataURL);
  
  // Inicializar KeyScan V3
  const keyScan = new ProductionKeyScanV3();
  
  // Extraer features
  return await keyScan.imageProcessor.extractFeatures(imageBuffer);
}

