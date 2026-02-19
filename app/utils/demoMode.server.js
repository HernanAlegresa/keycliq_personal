const DEFAULT_SCAN_PROBABILITIES = {
  match: 0.4,
  possible: 0.3,
  noMatch: 0.3,
};

export function isDemoMode() {
  return !process.env.OPENAI_API_KEY;
}

function parseProbability(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export function getDemoScanConfig() {
  const raw = {
    match: parseProbability(process.env.DEMO_SCAN_MATCH_PROBABILITY, DEFAULT_SCAN_PROBABILITIES.match),
    possible: parseProbability(process.env.DEMO_SCAN_POSSIBLE_PROBABILITY, DEFAULT_SCAN_PROBABILITIES.possible),
    noMatch: parseProbability(process.env.DEMO_SCAN_NO_MATCH_PROBABILITY, DEFAULT_SCAN_PROBABILITIES.noMatch),
  };
  const sum = raw.match + raw.possible + raw.noMatch;
  if (sum <= 0) return DEFAULT_SCAN_PROBABILITIES;
  return {
    match: raw.match / sum,
    possible: raw.possible / sum,
    noMatch: raw.noMatch / sum,
  };
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomUnique(items, count) {
  const pool = [...items];
  const picked = [];
  while (pool.length > 0 && picked.length < count) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

export function simulateDemoScanResult(inventory) {
  const config = getDemoScanConfig();
  const roll = Math.random();
  const matchThreshold = config.match;
  const possibleThreshold = config.match + config.possible;

  if (roll < matchThreshold) {
    const selected = pickRandom(inventory);
    const similarity = randomInRange(0.9, 0.98);
    return {
      outcome: "MATCH",
      matchedKeyId: selected?.key?.id ?? null,
      confidence: similarity,
      similarity,
      candidates: null,
    };
  }

  if (roll < possibleThreshold) {
    const maxCandidates = Math.min(3, inventory.length);
    const candidateCount = Math.max(1, Math.floor(randomInRange(1, maxCandidates + 1)));
    const selectedCandidates = pickRandomUnique(inventory, candidateCount).map((item) => ({
      keyId: item.key.id,
      similarity: randomInRange(0.75, 0.89),
      matchType: "POSSIBLE_MATCH",
    }));
    const topSimilarity = Math.max(...selectedCandidates.map((c) => c.similarity));
    return {
      outcome: "POSSIBLE",
      matchedKeyId: selectedCandidates[0]?.keyId ?? null,
      confidence: topSimilarity,
      similarity: topSimilarity,
      candidates: selectedCandidates,
    };
  }

  const similarity = randomInRange(0.35, 0.69);
  return {
    outcome: "NO_MATCH",
    matchedKeyId: null,
    confidence: similarity,
    similarity,
    candidates: null,
  };
}
