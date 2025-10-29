// Datos de prueba para V5 ModelAI Tests
// Basado en la lógica V5 con 9 parámetros exactos y pesos confirmados

export const testData = {
  // TEST 1: Llave EN inventario (debería dar MATCH_FOUND)
  test1: {
    query: {
      peak_count: 5,
      blade_profile: "single-sided",
      groove_count: 2,
      key_color: "silver",
      bow_shape: "rectangle",
      bowmark: true,
      bowcode: false,
      bow_size: "medium",
      surface_finish: true
    },
    inventory: [
      {
        id: "key_001",
        peak_count: 5,
        blade_profile: "single-sided", 
        groove_count: 2,
        key_color: "silver",
        bow_shape: "rectangle",
        bowmark: true,
        bowcode: false,
        bow_size: "medium",
        surface_finish: true
      },
      {
        id: "key_002",
        peak_count: 4,
        blade_profile: "double-sided",
        groove_count: 1,
        key_color: "brass",
        bow_shape: "oval",
        bowmark: false,
        bowcode: true,
        bow_size: "small",
        surface_finish: false
      },
      {
        id: "key_003",
        peak_count: 6,
        blade_profile: "single-sided",
        groove_count: 3,
        key_color: "gold",
        bow_shape: "circular",
        bowmark: true,
        bowcode: true,
        bow_size: "large",
        surface_finish: true
      },
      {
        id: "key_004",
        peak_count: 3,
        blade_profile: "flat",
        groove_count: 0,
        key_color: "black",
        bow_shape: "square",
        bowmark: false,
        bowcode: false,
        bow_size: "small",
        surface_finish: false
      },
      {
        id: "key_005",
        peak_count: 7,
        blade_profile: "curved",
        groove_count: 4,
        key_color: "bronze",
        bow_shape: "triangular",
        bowmark: true,
        bowcode: false,
        bow_size: "large",
        surface_finish: true
      },
      {
        id: "key_006",
        peak_count: 4,
        blade_profile: "single-sided",
        groove_count: 1,
        key_color: "silver",
        bow_shape: "rectangle",
        bowmark: false,
        bowcode: true,
        bow_size: "medium",
        surface_finish: false
      },
      {
        id: "key_007",
        peak_count: 8,
        blade_profile: "double-sided",
        groove_count: 5,
        key_color: "brass",
        bow_shape: "oval",
        bowmark: true,
        bowcode: true,
        bow_size: "large",
        surface_finish: true
      },
      {
        id: "key_008",
        peak_count: 2,
        blade_profile: "flat",
        groove_count: 0,
        key_color: "gold",
        bow_shape: "circular",
        bowmark: false,
        bowcode: false,
        bow_size: "small",
        surface_finish: false
      },
      {
        id: "key_009",
        peak_count: 6,
        blade_profile: "curved",
        groove_count: 3,
        key_color: "black",
        bow_shape: "irregular",
        bowmark: true,
        bowcode: false,
        bow_size: "medium",
        surface_finish: true
      },
      {
        id: "key_010",
        peak_count: 5,
        blade_profile: "single-sided",
        groove_count: 2,
        key_color: "bronze",
        bow_shape: "rectangle",
        bowmark: false,
        bowcode: true,
        bow_size: "medium",
        surface_finish: false
      },
      {
        id: "key_011",
        peak_count: 3,
        blade_profile: "double-sided",
        groove_count: 1,
        key_color: "silver",
        bow_shape: "square",
        bowmark: true,
        bowcode: false,
        bow_size: "small",
        surface_finish: true
      },
      {
        id: "key_012",
        peak_count: 7,
        blade_profile: "flat",
        groove_count: 4,
        key_color: "brass",
        bow_shape: "oval",
        bowmark: false,
        bowcode: true,
        bow_size: "large",
        surface_finish: false
      },
      {
        id: "key_013",
        peak_count: 4,
        blade_profile: "curved",
        groove_count: 2,
        key_color: "gold",
        bow_shape: "circular",
        bowmark: true,
        bowcode: true,
        bow_size: "medium",
        surface_finish: true
      },
      {
        id: "key_014",
        peak_count: 6,
        blade_profile: "single-sided",
        groove_count: 3,
        key_color: "black",
        bow_shape: "triangular",
        bowmark: false,
        bowcode: false,
        bow_size: "large",
        surface_finish: false
      },
      {
        id: "key_015",
        peak_count: 8,
        blade_profile: "double-sided",
        groove_count: 5,
        key_color: "bronze",
        bow_shape: "irregular",
        bowmark: true,
        bowcode: true,
        bow_size: "large",
        surface_finish: true
      }
    ]
  },

  // TEST 2: Llave NO en inventario (debería dar NO_MATCH)
  test2: {
    query: {
      peak_count: 9,
      blade_profile: "double-sided",
      groove_count: 6,
      key_color: "other",
      bow_shape: "irregular",
      bowmark: true,
      bowcode: true,
      bow_size: "large",
      surface_finish: false
    },
    inventory: [
      {
        id: "key_001",
        peak_count: 5,
        blade_profile: "single-sided", 
        groove_count: 2,
        key_color: "silver",
        bow_shape: "rectangle",
        bowmark: true,
        bowcode: false,
        bow_size: "medium",
        surface_finish: true
      },
      {
        id: "key_002",
        peak_count: 4,
        blade_profile: "double-sided",
        groove_count: 1,
        key_color: "brass",
        bow_shape: "oval",
        bowmark: false,
        bowcode: true,
        bow_size: "small",
        surface_finish: false
      },
      {
        id: "key_003",
        peak_count: 6,
        blade_profile: "single-sided",
        groove_count: 3,
        key_color: "gold",
        bow_shape: "circular",
        bowmark: true,
        bowcode: true,
        bow_size: "large",
        surface_finish: true
      },
      {
        id: "key_004",
        peak_count: 3,
        blade_profile: "flat",
        groove_count: 0,
        key_color: "black",
        bow_shape: "square",
        bowmark: false,
        bowcode: false,
        bow_size: "small",
        surface_finish: false
      },
      {
        id: "key_005",
        peak_count: 7,
        blade_profile: "curved",
        groove_count: 4,
        key_color: "bronze",
        bow_shape: "triangular",
        bowmark: true,
        bowcode: false,
        bow_size: "large",
        surface_finish: true
      },
      {
        id: "key_006",
        peak_count: 4,
        blade_profile: "single-sided",
        groove_count: 1,
        key_color: "silver",
        bow_shape: "rectangle",
        bowmark: false,
        bowcode: true,
        bow_size: "medium",
        surface_finish: false
      },
      {
        id: "key_007",
        peak_count: 8,
        blade_profile: "double-sided",
        groove_count: 5,
        key_color: "brass",
        bow_shape: "oval",
        bowmark: true,
        bowcode: true,
        bow_size: "large",
        surface_finish: true
      },
      {
        id: "key_008",
        peak_count: 2,
        blade_profile: "flat",
        groove_count: 0,
        key_color: "gold",
        bow_shape: "circular",
        bowmark: false,
        bowcode: false,
        bow_size: "small",
        surface_finish: false
      },
      {
        id: "key_009",
        peak_count: 6,
        blade_profile: "curved",
        groove_count: 3,
        key_color: "black",
        bow_shape: "irregular",
        bowmark: true,
        bowcode: false,
        bow_size: "medium",
        surface_finish: true
      },
      {
        id: "key_010",
        peak_count: 5,
        blade_profile: "single-sided",
        groove_count: 2,
        key_color: "bronze",
        bow_shape: "rectangle",
        bowmark: false,
        bowcode: true,
        bow_size: "medium",
        surface_finish: false
      },
      {
        id: "key_011",
        peak_count: 3,
        blade_profile: "double-sided",
        groove_count: 1,
        key_color: "silver",
        bow_shape: "square",
        bowmark: true,
        bowcode: false,
        bow_size: "small",
        surface_finish: true
      },
      {
        id: "key_012",
        peak_count: 7,
        blade_profile: "flat",
        groove_count: 4,
        key_color: "brass",
        bow_shape: "oval",
        bowmark: false,
        bowcode: true,
        bow_size: "large",
        surface_finish: false
      },
      {
        id: "key_013",
        peak_count: 4,
        blade_profile: "curved",
        groove_count: 2,
        key_color: "gold",
        bow_shape: "circular",
        bowmark: true,
        bowcode: true,
        bow_size: "medium",
        surface_finish: true
      },
      {
        id: "key_014",
        peak_count: 6,
        blade_profile: "single-sided",
        groove_count: 3,
        key_color: "black",
        bow_shape: "triangular",
        bowmark: false,
        bowcode: false,
        bow_size: "large",
        surface_finish: false
      },
      {
        id: "key_015",
        peak_count: 8,
        blade_profile: "double-sided",
        groove_count: 5,
        key_color: "bronze",
        bow_shape: "irregular",
        bowmark: true,
        bowcode: true,
        bow_size: "large",
        surface_finish: true
      }
    ]
  }
};

// Función para calcular similitud V5
export function calculateV5Similarity(query, inventory) {
  const weights = {
    bowmark: 0.35,        // 35%
    bowcode: 0.30,        // 30%
    surface_finish: 0.20, // 20%
    key_color: 0.10,      // 10%
    bow_shape: 0.03,      // 3%
    bow_size: 0.02,       // 2%
    peak_count: 0.00,     // Solo tolerancia ±1
    groove_count: 0.00,   // Solo exact match
    blade_profile: 0.00   // Ignorado
  };

  const results = [];

  for (const key of inventory) {
    let totalWeight = 0;
    let weightedScore = 0;
    const parameterDetails = {};

    // Solo parámetros con peso > 0
    for (const [param, weight] of Object.entries(weights)) {
      if (weight > 0) {
        let similarity = 0;
        let match = false;
        let reason = '';

        // Valores null
        if (query[param] === null || key[param] === null) {
          similarity = 0;
          match = false;
          reason = 'one_null';
        }
        // Valores idénticos
        else if (query[param] === key[param]) {
          similarity = 1.0;
          match = true;
          reason = 'exact_match';
        }
        // No match
        else {
          similarity = 0;
          match = false;
          reason = 'no_match';
        }

        totalWeight += weight;
        weightedScore += weight * similarity;
        
        parameterDetails[param] = {
          match,
          reason,
          similarity
        };
      }
    }

    // Tolerancia para peak_count (±1)
    if (query.peak_count !== null && key.peak_count !== null) {
      if (Math.abs(query.peak_count - key.peak_count) === 1) {
        parameterDetails.peak_count = {
          match: true,
          reason: 'close_match',
          similarity: 0.8
        };
      } else if (query.peak_count === key.peak_count) {
        parameterDetails.peak_count = {
          match: true,
          reason: 'exact_match',
          similarity: 1.0
        };
      } else {
        parameterDetails.peak_count = {
          match: false,
          reason: 'no_match',
          similarity: 0.0
        };
      }
    }

    // Exact match para groove_count
    if (query.groove_count !== null && key.groove_count !== null) {
      if (query.groove_count === key.groove_count) {
        parameterDetails.groove_count = {
          match: true,
          reason: 'exact_match',
          similarity: 1.0
        };
      } else {
        parameterDetails.groove_count = {
          match: false,
          reason: 'no_match',
          similarity: 0.0
        };
      }
    }

    const finalSimilarity = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    let matchType = 'NO_MATCH';
    if (finalSimilarity >= 0.95) {
      matchType = 'MATCH_FOUND';
    }

    results.push({
      keyId: key.id,
      similarity: finalSimilarity,
      matchType,
      details: {
        totalWeight,
        weightedScore,
        parameterDetails,
        weights
      }
    });
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}
