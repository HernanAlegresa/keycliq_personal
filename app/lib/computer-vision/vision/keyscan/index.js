/**
 * KeyScan Version Selector
 * Factory para seleccionar versi├│n de KeyScan basado en ENV variable
 */

import { ProductionKeyScanV3 } from './v3/ProductionKeyScanV3.js';
import { ProductionKeyScanV4 } from './v4/ProductionKeyScanV4.js';
import { ProductionKeyScanV5 } from './v5/ProductionKeyScanV5.js';

const DEFAULT_VERSION = 'v5';

const VERSIONS = {
  v3: ProductionKeyScanV3,
  v4: ProductionKeyScanV4,
  v5: ProductionKeyScanV5
};

/**
 * Obtener instancia de KeyScan seg├║n versi├│n configurada
 * @param {string} version - Versi├│n espec├¡fica ('v3') o null para usar ENV
 * @returns {Object} Instancia de KeyScan
 */
export function getKeyScan(version = null) {
  const selectedVersion = version || process.env.KEYSCAN_VERSION || DEFAULT_VERSION;

  if (!VERSIONS[selectedVersion]) {
    console.warn(`ÔÜá´©Å KeyScan version '${selectedVersion}' not found, using default '${DEFAULT_VERSION}'`);
    return new VERSIONS[DEFAULT_VERSION]();
  }

  console.log(`­ƒöæ Using KeyScan ${selectedVersion}`);
  return new VERSIONS[selectedVersion]();
}

export function getActiveVersion() {
  return process.env.KEYSCAN_VERSION || DEFAULT_VERSION;
}

export function getAvailableVersions() {
  return Object.keys(VERSIONS);
}

export { ProductionKeyScanV3, ProductionKeyScanV4, ProductionKeyScanV5 };

export default {
  getKeyScan,
  getActiveVersion,
  getAvailableVersions,
  ProductionKeyScanV3,
  ProductionKeyScanV4,
  ProductionKeyScanV5
};

