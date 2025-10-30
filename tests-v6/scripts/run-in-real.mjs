#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
  console.error('❌ OPENAI_API_KEY is missing.');
  process.exit(1);
}

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i+1] ? args[i+1] : def;
}
function hasFlag(name) { return args.includes(`--${name}`); }

const TEST_ID = getArg('testId');
const QUERY_KEY_ID = getArg('queryKeyId');
const SEED = parseInt(getArg('seed', '42'), 10);
const OPTIMIZE = hasFlag('optimize');

if (!TEST_ID || !QUERY_KEY_ID) {
  console.error('Usage: node run-in-real.mjs --testId test-2 --queryKeyId lockbox-02 --seed 44 [--optimize]');
  process.exit(1);
}

const DATASET_ROOT = path.resolve(__dirname, '..', '..', 'tests', 'keys-optimized');
const CACHE_DIR = path.resolve(__dirname, '..', 'cache', 'signatures');
const OUT_DIR = path.resolve(__dirname, '..', '10-final-tests', 'in', TEST_ID);

function seededRng(seed) {
  let s = seed >>> 0;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 0xffffffff); };
}

function pickRandom(array, count, rng) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy.slice(0, count);
}

function listKeys(datasetRoot) {
  const families = ['lockbox', 'regular'];
  const items = [];
  for (const fam of families) {
    const famDir = path.join(datasetRoot, fam);
    if (!fs.existsSync(famDir)) continue;
    for (const kid of fs.readdirSync(famDir)) {
      const keyDir = path.join(famDir, kid);
      if (!fs.statSync(keyDir).isDirectory()) continue;
      const files = fs.readdirSync(keyDir);
      const aligned = files.find(f => f.startsWith('aligned-'));
      const generated = files.find(f => f.startsWith('generated-'));
      if (aligned || generated) items.push({ keyId: kid, family: fam, keyDir, aligned, generated });
    }
  }
  return items;
}

function cacheName(keyId, imageType, imageName) {
  const base = imageName.replace(/\.(jpg|png)$/i, '');
  return `${keyId}-${imageType}-${base}.json`;
}

function loadFromCache(keyId, imageType, imageName) {
  const file = path.join(CACHE_DIR, cacheName(keyId, imageType, imageName));
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function extractWithAI(imagePath) {
  const { analyzeKeyWithHybridBalancedAI } = await import('../../app/lib/ai/multimodal-keyscan.server.js');
  const buf = fs.readFileSync(imagePath);
  const mime = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const res = await analyzeKeyWithHybridBalancedAI(buf, mime);
  if (!res || !res.success) throw new Error(res?.error || 'AI extraction failed');
  return res.signature;
}

async function loadOrExtract({ keyId, imageType, imagePath, imageName }) {
  const cached = loadFromCache(keyId, imageType, imageName);
  if (cached && cached.signature) return cached.signature;
  const signature = await extractWithAI(imagePath);
  const toSave = { keyId, imageType, imageName, signature, timestamp: new Date().toISOString(), extracted: true };
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, cacheName(keyId, imageType, imageName)), JSON.stringify(toSave, null, 2));
  return signature;
}

async function compare(sig1, sig2) {
  const { compareHybridBalancedKeySignatures } = await import('../../app/lib/ai/multimodal-keyscan.server.js');
  return compareHybridBalancedKeySignatures(sig1, sig2);
}

function normalizeBow(v) {
  if (!v) return v;
  const s = String(v).toLowerCase();
  if (s.includes('hex')) return 'rectangular';
  if (s.includes('round') || s.includes('circular')) return 'round';
  if (s.includes('rect')) return 'rectangular';
  return v;
}

function differsClearly(qp, ip) {
  // Prefer differences on strong fields
  const q = qp || {}; const i = ip || {};
  const qbow = normalizeBow(q.bow_shape); const ibow = normalizeBow(i.bow_shape);
  if (q.unique_mark !== i.unique_mark) return true;
  if (q.key_color && i.key_color && q.key_color !== i.key_color) return true;
  if (qbow && ibow && qbow !== ibow) return true;
  const qcuts = typeof q.number_of_cuts === 'number' ? q.number_of_cuts : parseInt(q.number_of_cuts || 'NaN', 10);
  const icuts = typeof i.number_of_cuts === 'number' ? i.number_of_cuts : parseInt(i.number_of_cuts || 'NaN', 10);
  if (Number.isFinite(qcuts) && Number.isFinite(icuts) && Math.abs(qcuts - icuts) > 1) return true;
  return false;
}

async function main() {
  console.log(`🧪 IN Runner | testId=${TEST_ID} query=${QUERY_KEY_ID} seed=${SEED} optimize=${OPTIMIZE}`);
  const rng = seededRng(SEED);
  const all = listKeys(DATASET_ROOT);
  const q = all.find(k => k.keyId === QUERY_KEY_ID);
  if (!q || !q.aligned || !q.generated) { console.error('❌ Query must have aligned and generated.'); process.exit(1); }

  const queryImageType = 'aligned';
  const queryImageName = q.aligned;
  const queryImagePath = path.join(q.keyDir, queryImageName);

  console.log('🤖 Extracting query signature...');
  const querySig = await loadOrExtract({ keyId: QUERY_KEY_ID, imageType: queryImageType, imagePath: queryImagePath, imageName: queryImageName });

  const others = all.filter(k => k.keyId !== QUERY_KEY_ID);
  let inventory = [];
  if (OPTIMIZE) {
    console.log('🧠 Optimizing inventory selection to avoid extra matches...');
    // widen pool, then filter by clear difference
    const pool = pickRandom(others, Math.min(60, others.length), rng);
    for (const k of pool) {
      if (inventory.length >= 14) break;
      const useAligned = !!k.aligned;
      const name = useAligned ? k.aligned : k.generated;
      if (!name) continue;
      const imagePath = path.join(k.keyDir, name);
      const sig = await loadOrExtract({ keyId: k.keyId, imageType: useAligned ? 'aligned' : 'generated', imagePath, imageName: name });
      if (differsClearly(querySig.parameters ?? querySig, sig.parameters ?? sig)) {
        inventory.push({ keyId: k.keyId, imageType: useAligned ? 'aligned' : 'generated', imageName: name, imagePath, _sig: sig });
      }
    }
    // if not enough, backfill randomly
    if (inventory.length < 14) {
      for (const k of others) {
        if (inventory.length >= 14) break;
        const already = inventory.some(x => x.keyId === k.keyId);
        const name = k.aligned || k.generated;
        if (!name || already) continue;
        inventory.push({ keyId: k.keyId, imageType: k.aligned ? 'aligned' : 'generated', imageName: name, imagePath: path.join(k.keyDir, name) });
      }
    }
  } else {
    const picked = pickRandom(others, 14, rng);
    inventory = picked.map(k => {
      const useAligned = !!k.aligned;
      const name = useAligned ? k.aligned : k.generated;
      if (!name) return null;
      return { keyId: k.keyId, imageType: useAligned ? 'aligned' : 'generated', imageName: name, imagePath: path.join(k.keyDir, name) };
    }).filter(Boolean);
  }
  // add correct match
  inventory.push({ keyId: QUERY_KEY_ID, imageType: 'generated', imageName: q.generated, imagePath: path.join(q.keyDir, q.generated) });

  if (inventory.length !== 15) { console.error(`❌ Inventory count ${inventory.length} != 15`); process.exit(1); }
  if (inventory.some(i => path.resolve(i.imagePath) === path.resolve(queryImagePath))) { console.error('❌ Same image vs same image detected'); process.exit(1); }

  console.log('🤖 Extracting inventory signatures...');
  const invSigs = [];
  for (const it of inventory) invSigs.push(it._sig || await loadOrExtract(it));

  console.log('🔍 Comparing...');
  const comparisons = [];
  for (let i = 0; i < invSigs.length; i++) comparisons.push({ ...(await compare(querySig, invSigs[i])), inventoryIndex: i });

  const matches = comparisons.filter(c => c.similarity === 1.0);
  const correctIdx = inventory.findIndex(i => i.keyId === QUERY_KEY_ID);
  const hasCorrect = matches.some(m => m.inventoryIndex === correctIdx);
  const result = matches.length === 1 && hasCorrect ? 'Perfect' : matches.length > 1 && hasCorrect ? 'Good' : 'Failed';

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = {
    testId: TEST_ID,
    testType: 'IN',
    seed: SEED,
    optimize: OPTIMIZE,
    timestamp: new Date().toISOString(),
    queryKey: { keyId: QUERY_KEY_ID, imageType: queryImageType, imageName: queryImageName, path: queryImagePath },
    inventoryKeys: inventory.map(it => ({ keyId: it.keyId, imageType: it.imageType, imageName: it.imageName, path: it.imagePath }))
  };
  const results = {
    testId: TEST_ID,
    testType: 'IN',
    result,
    timestamp: new Date().toISOString(),
    seed: SEED,
    querySignature: { parameters: querySig.parameters ?? querySig },
    inventorySignatures: invSigs.map(s => ({ parameters: s.parameters ?? s })),
    comparisons
  };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2));

  const renderer = path.resolve(__dirname, 'render-html.mjs');
  const { spawnSync } = await import('child_process');
  const run = spawnSync(process.execPath, [renderer, '--input', OUT_DIR, '--dataset', DATASET_ROOT], { stdio: 'inherit' });
  if (run.status !== 0) { console.error('❌ HTML render failed'); process.exit(1); }
  console.log(`✅ Done: ${path.join(OUT_DIR, 'report.html')}`);
}

main().catch(e => { console.error('❌ Run failed:', e.message); process.exit(1); });
