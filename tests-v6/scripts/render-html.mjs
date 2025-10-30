#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function fileToBase64(imgPath) {
  try {
    const buf = fs.readFileSync(imgPath);
    const isPng = imgPath.toLowerCase().endsWith('.png');
    return {
      ok: true,
      mime: isPng ? 'image/png' : 'image/jpeg',
      base64: buf.toString('base64'),
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function normalizeWindowsPath(p) {
  return p.replace(/\\/g, '/');
}

function resolveImagePath(datasetRoot, keyId, imageName) {
  const family = keyId && keyId.startsWith('lockbox') ? 'lockbox' : 'regular';
  return path.join(datasetRoot, family, keyId, imageName);
}

function pickKeyId(obj) {
  return obj.keyId ?? obj.id ?? '';
}

function pickImageName(obj) {
  return obj.imageName ?? obj.image ?? '';
}

function pickAbsPath(obj) {
  return obj.path ?? '';
}

function renderComparisonTable(queryParams, invParams) {
  const keys = Object.keys(queryParams || {}).filter((k) => k !== 'confidence_score');
  return keys
    .map((k) => {
      const qv0 = queryParams[k];
      const iv0 = invParams ? invParams[k] : undefined;
      const qv = qv0 && typeof qv0 === 'object' && 'value' in qv0 ? qv0.value : qv0;
      const iv = iv0 && typeof iv0 === 'object' && 'value' in iv0 ? iv0.value : iv0;
      const match = qv === iv ? '✓' : '✗';
      const color = match === '✓' ? '#28a745' : '#dc3545';
      return `<tr>
        <td>${k}</td>
        <td>${qv}</td>
        <td>${iv ?? ''}</td>
        <td style="text-align:center;font-weight:bold;color:${color}">${match}</td>
      </tr>`;
    })
    .join('');
}

function renderHTML({ manifest, results, queryImgB64, inventoryImgsB64 }) {
  const matches = results.comparisons.filter((c) => c.similarity === 1.0).length;
  const noMatches = results.comparisons.length - matches;
  const statusClass = results.result === 'Perfect' ? 'status-perfect' : results.result === 'Good' ? 'status-good' : 'status-failed';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${manifest.testId} - KeyCliq V6</title>
<style>
  body{font-family: 'Open Sans', sans-serif; background:#f5f7fa; color:#333; margin:0;}
  .container{max-width:1280px; margin:0 auto; padding:24px;}
  .header{background:linear-gradient(135deg,#006209,#004d07); color:#fff; padding:24px; border-radius:14px;}
  .header h1{font-family:'Raleway',sans-serif; font-weight:700; margin:0 0 6px 0}
  .card{background:#fff; border-radius:14px; padding:20px; margin-top:20px; box-shadow:0 4px 18px rgba(0,0,0,.08)}
  h2{font-family:'Raleway',sans-serif; color:#006209; margin:0 0 12px 0}
  .summary{display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px}
  .pill{display:inline-block; padding:6px 12px; border-radius:999px; font-weight:700}
  .status-perfect{background:#28a745;color:#fff}
  .status-good{background:#ffc107;color:#333}
  .status-failed{background:#dc3545;color:#fff}
  .grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px}
  .inv{background:#f8f9fa; border:1px solid #e9ecef; border-radius:10px; padding:10px; text-align:center}
  .inv img{width:100%; height:92px; object-fit:contain; background:#fff; border-radius:6px}
  table{width:100%; border-collapse:collapse; font-size:14px}
  th,td{padding:8px 10px; border-bottom:1px solid #e9ecef; text-align:left}
  th{background:#eef2f4; color:#495057}
  .cmp{background:#f8f9fa; border:1px solid #e9ecef; border-radius:12px; padding:14px; margin-top:14px}
  .cmp-head{display:flex; align-items:center; justify-content:space-between}
  .badge{padding:6px 10px; border-radius:999px; font-weight:700}
  .match{background:#28a745;color:#fff}
  .nomatch{background:#dc3545;color:#fff}
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KeyCliq V6 - ${manifest.testId}</h1>
      <div>${manifest.testType} • Seed ${manifest.seed} • MATCH_FOUND = 1.0</div>
    </div>

    <div class="card">
      <h2>Test Result</h2>
      <div class="pill ${statusClass}">${results.result}</div>
      <div class="summary" style="margin-top:12px">
        <div class="card" style="margin:0"><strong>Matches Found</strong><div>${matches}/15</div></div>
        <div class="card" style="margin:0"><strong>No Matches</strong><div>${noMatches}/15</div></div>
      </div>
    </div>

    <div class="card">
      <h2>Query Key</h2>
      <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap">
        <div>
          <img src="data:${queryImgB64.mime};base64,${queryImgB64.base64}" alt="Query" style="max-width:320px; height:auto; border-radius:10px; box-shadow:0 6px 18px rgba(0,0,0,.15)" />
          <div style="margin-top:6px"><strong>Image:</strong> ${manifest.queryKey.imageName}</div>
        </div>
        <div style="flex:1; min-width:280px">
          <table>
            <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
            <tbody>
              ${Object.entries(results.querySignature.parameters || {})
                .filter(([k]) => k !== 'confidence_score')
                .map(([k, v]) => {
                  const val = v && typeof v === 'object' && 'value' in v ? v.value : v;
                  return `<tr><td>${k}</td><td>${val}</td></tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Inventory (15)</h2>
      <div class="grid">
        ${manifest.inventoryKeys.map((ik, i) => {
          const label = pickKeyId(ik) || pickImageName(ik) || `item-${i+1}`;
          return `
          <div class="inv" onclick="document.getElementById('cmp-${i}').scrollIntoView()">
            <img src="data:${inventoryImgsB64[i].mime};base64,${inventoryImgsB64[i].base64}" alt="${label}" />
            <div style="margin-top:6px; font-weight:700; color:#006209">${label}</div>
          </div>`
        }).join('')}
      </div>
    </div>

    <div class="card">
      <h2>Comparisons</h2>
      ${results.comparisons.map((c, i) => {
        const isMatch = c.similarity === 1.0;
        const badge = isMatch ? 'match' : 'nomatch';
        const label = isMatch ? 'MATCH_FOUND' : 'NO_MATCH';
        const invParams = results.inventorySignatures[c.inventoryIndex]?.parameters || {};
        return `
          <div class="cmp" id="cmp-${i}">
            <div class="cmp-head">
              <div><strong>Comparison ${i + 1}</strong></div>
              <div style="display:flex; gap:10px; align-items:center">
                <div style="font-weight:700">${c.similarity.toFixed(3)}</div>
                <div class="badge ${badge}">${label}</div>
              </div>
            </div>
            <div style="display:flex; gap:18px; margin-top:10px; flex-wrap:wrap">
              <img src="data:${queryImgB64.mime};base64,${queryImgB64.base64}" alt="Query" style="max-width:200px; height:auto; object-fit:contain; border-radius:8px; background:#fff" />
              <img src="data:${inventoryImgsB64[c.inventoryIndex].mime};base64,${inventoryImgsB64[c.inventoryIndex].base64}" alt="Inventory ${i+1}" style="max-width:200px; height:auto; object-fit:contain; border-radius:8px; background:#fff" />
            </div>
            <div style="margin-top:12px">
              <table>
                <thead><tr><th>Parameter</th><th>Query</th><th>Inventory</th><th>Match</th></tr></thead>
                <tbody>
                  ${renderComparisonTable(results.querySignature.parameters || {}, invParams)}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="card" style="text-align:center">
      <a href="manifest.json" target="_blank" style="color:#006209; font-weight:700; margin-right:16px">View Manifest</a>
      <a href="results.json" target="_blank" style="color:#006209; font-weight:700">View Results</a>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  // args: --input <dir> [--dataset <path>]
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf('--input');
  if (inputIdx === -1 || !args[inputIdx + 1]) {
    console.error('Usage: node render-html.mjs --input <testDir> [--dataset <datasetRoot>]');
    process.exit(1);
  }
  const testDir = path.resolve(args[inputIdx + 1]);
  const datasetIdx = args.indexOf('--dataset');
  const datasetRoot = datasetIdx !== -1 && args[datasetIdx + 1]
    ? path.resolve(args[datasetIdx + 1])
    : path.resolve(__dirname, '..', '..', 'tests', 'keys-optimized');

  const manifestPath = path.join(testDir, 'manifest.json');
  const resultsPath = path.join(testDir, 'results.json');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(resultsPath)) {
    console.error('manifest.json or results.json not found in input directory');
    process.exit(1);
  }

  const manifest = readJson(manifestPath);
  const results = readJson(resultsPath);

  // Build base64 images from paths: prefer absolute manifest.path if available
  const queryAbs = pickAbsPath(manifest.queryKey);
  const queryKeyId = pickKeyId(manifest.queryKey);
  const queryImageName = pickImageName(manifest.queryKey);
  const queryImagePath = queryAbs && fs.existsSync(queryAbs) ? queryAbs : resolveImagePath(datasetRoot, queryKeyId, queryImageName);
  const queryImgB64 = fileToBase64(queryImagePath);
  const inventoryImgsB64 = manifest.inventoryKeys.map((ik) => {
    const abs = pickAbsPath(ik);
    let p = abs && fs.existsSync(abs) ? abs : undefined;
    if (!p) {
      const kid = pickKeyId(ik);
      const iname = pickImageName(ik);
      p = resolveImagePath(datasetRoot, kid, iname);
    }
    return fileToBase64(p);
  });

  // Fallbacks for any missing images
  const placeholder = { ok: true, mime: 'image/svg+xml', base64: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="14">Image not found</text></svg>').toString('base64') };
  const safeQuery = queryImgB64.ok ? queryImgB64 : placeholder;
  const safeInv = inventoryImgsB64.map((x) => (x.ok ? x : placeholder));

  const html = renderHTML({ manifest, results, queryImgB64: safeQuery, inventoryImgsB64: safeInv });
  const outPath = path.join(testDir, 'report.html');
  fs.writeFileSync(outPath, html);
  console.log(`✅ HTML rendered: ${outPath}`);
}

main().catch((e) => {
  console.error('❌ Render failed:', e);
  process.exit(1);
});
