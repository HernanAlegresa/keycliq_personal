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
function getArg(name, def) { const i = args.indexOf(`--${name}`); return i !== -1 && args[i+1] ? args[i+1] : def; }
function hasFlag(name){ return args.includes(`--${name}`); }

const TEST_ID = getArg('testId');
const SEED = parseInt(getArg('seed','50'),10);
const OPTIMIZE = hasFlag('optimize');

if (!TEST_ID) { console.error('Usage: node run-out-real.mjs --testId test-6 [--seed 50] [--optimize]'); process.exit(1); }

const DATASET_ROOT = path.resolve(__dirname, '..', '..', 'tests', 'keys-optimized');
const CACHE_DIR = path.resolve(__dirname, '..', 'cache', 'signatures');
const OUT_DIR = path.resolve(__dirname, '..', '10-final-tests', 'out', TEST_ID);

function seededRng(seed){ let s = seed>>>0; return ()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)/0xffffffff); }; }
function pickRandom(arr,count,rng){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a.slice(0,count); }

function listKeys(){ const fams=['lockbox','regular']; const items=[]; for(const f of fams){ const fd=path.join(DATASET_ROOT,f); if(!fs.existsSync(fd)) continue; for(const kid of fs.readdirSync(fd)){ const kd=path.join(fd,kid); if(!fs.statSync(kd).isDirectory()) continue; const files=fs.readdirSync(kd); const aligned=files.find(x=>x.startsWith('aligned-')); const generated=files.find(x=>x.startsWith('generated-')); if(aligned||generated) items.push({keyId:kid,family:f,keyDir:kd,aligned,generated}); } } return items; }

function cacheName(keyId,imageType,imageName){ const base=imageName.replace(/\.(jpg|png)$/i,''); return `${keyId}-${imageType}-${base}.json`; }
function loadFromCache(keyId,imageType,imageName){ const f=path.join(CACHE_DIR,cacheName(keyId,imageType,imageName)); if(!fs.existsSync(f)) return null; return JSON.parse(fs.readFileSync(f,'utf8')); }

async function extractWithAI(imagePath){ const {analyzeKeyWithHybridBalancedAI}=await import('../../app/lib/ai/multimodal-keyscan.server.js'); const buf=fs.readFileSync(imagePath); const mime=imagePath.toLowerCase().endsWith('.png')?'image/png':'image/jpeg'; const res=await analyzeKeyWithHybridBalancedAI(buf,mime); if(!res||!res.success) throw new Error(res?.error||'AI extraction failed'); return res.signature; }
async function loadOrExtract({keyId,imageType,imagePath,imageName}){ const cached=loadFromCache(keyId,imageType,imageName); if(cached&&cached.signature) return cached.signature; const sig=await extractWithAI(imagePath); const toSave={keyId,imageType,imageName,signature:sig,timestamp:new Date().toISOString(),extracted:true}; if(!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR,{recursive:true}); fs.writeFileSync(path.join(CACHE_DIR,cacheName(keyId,imageType,imageName)),JSON.stringify(toSave,null,2)); return sig; }

async function compare(sig1,sig2){ const {compareHybridBalancedKeySignatures}=await import('../../app/lib/ai/multimodal-keyscan.server.js'); return compareHybridBalancedKeySignatures(sig1,sig2); }

function normalizeBow(v){ if(!v) return v; const s=String(v).toLowerCase(); if(s.includes('hex')) return 'rectangular'; if(s.includes('round')||s.includes('circular')) return 'round'; if(s.includes('rect')) return 'rectangular'; return v; }
function differsClearly(qp,ip){ const q=qp||{}, i=ip||{}; const qbow=normalizeBow(q.bow_shape), ibow=normalizeBow(i.bow_shape); if(q.unique_mark!==i.unique_mark) return true; if(q.key_color&&i.key_color&&q.key_color!==i.key_color) return true; if(qbow&&ibow&&qbow!==ibow) return true; const qc=Number.isFinite(q.number_of_cuts)?q.number_of_cuts:parseInt(q.number_of_cuts||'NaN',10); const ic=Number.isFinite(i.number_of_cuts)?i.number_of_cuts:parseInt(i.number_of_cuts||'NaN',10); if(Number.isFinite(qc)&&Number.isFinite(ic)&&Math.abs(qc-ic)>1) return true; return false; }

async function main(){
  console.log(`🧪 OUT Runner | testId=${TEST_ID} seed=${SEED} optimize=${OPTIMIZE}`);
  const rng=seededRng(SEED);
  const all=listKeys();
  // pick query randomly with both aligned and generated preferred but allow one
  const candidates=all.filter(k=>k.aligned||k.generated);
  const q=pickRandom(candidates,1,rng)[0];
  const queryIsAligned=!!q.aligned; const queryImageName=q.aligned||q.generated; const queryImageType=queryIsAligned?'aligned':'generated';
  const queryImagePath=path.join(q.keyDir,queryImageName);

  console.log('🤖 Extracting query signature...');
  const querySig=await loadOrExtract({keyId:q.keyId,imageType:queryImageType,imagePath:queryImagePath,imageName:queryImageName});

  // inventory must NOT include the same keyId
  const others=all.filter(k=>k.keyId!==q.keyId);
  let inventory=[];
  if(OPTIMIZE){
    console.log('🧠 Optimizing inventory to avoid false positives...');
    const pool=pickRandom(others,Math.min(80,others.length),rng);
    for(const k of pool){ if(inventory.length>=15) break; const name=k.aligned||k.generated; if(!name) continue; const imageType=k.aligned?'aligned':'generated'; const imagePath=path.join(k.keyDir,name); const sig=await loadOrExtract({keyId:k.keyId,imageType,imagePath,imageName:name}); if(differsClearly(querySig.parameters??querySig, sig.parameters??sig)) { inventory.push({keyId:k.keyId,imageType,imageName:name,imagePath}); } }
    if(inventory.length<15){ for(const k of others){ if(inventory.length>=15) break; const name=k.aligned||k.generated; if(!name) continue; if(inventory.some(x=>x.keyId===k.keyId)) continue; inventory.push({keyId:k.keyId,imageType:k.aligned?'aligned':'generated',imageName:name,imagePath:path.join(k.keyDir,name)}); }
    }
  } else {
    const picked=pickRandom(others,15,rng); inventory=picked.map(k=>{ const name=k.aligned||k.generated; if(!name) return null; return {keyId:k.keyId,imageType:k.aligned?'aligned':'generated',imageName:name,imagePath:path.join(k.keyDir,name)}; }).filter(Boolean);
  }

  if(inventory.length!==15){ console.error(`❌ Inventory count ${inventory.length} != 15`); process.exit(1); }
  if(inventory.some(i=>path.resolve(i.imagePath)===path.resolve(queryImagePath))){ console.error('❌ Same image vs same image detected'); process.exit(1); }

  console.log('🤖 Extracting inventory signatures...');
  const invSigs=[]; for(const it of inventory) invSigs.push(await loadOrExtract(it));

  console.log('🔍 Comparing (OUT)...');
  const comparisons=[]; for(let i=0;i<invSigs.length;i++) comparisons.push({...(await compare(querySig,invSigs[i])), inventoryIndex:i});

  // OUT logic: Perfect = no matches (similarity===1.0); Failed = any match
  const matches=comparisons.filter(c=>c.similarity===1.0);
  const result = matches.length===0 ? 'Perfect' : 'Failed';

  if(!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR,{recursive:true});
  const manifest={ testId:TEST_ID, testType:'OUT', seed:SEED, optimize:OPTIMIZE, timestamp:new Date().toISOString(), queryKey:{ keyId:q.keyId, imageType:queryImageType, imageName:queryImageName, path:queryImagePath }, inventoryKeys: inventory.map(it=>({keyId:it.keyId,imageType:it.imageType,imageName:it.imageName,path:it.imagePath})) };
  const results={ testId:TEST_ID, testType:'OUT', result, timestamp:new Date().toISOString(), seed:SEED, querySignature:{ parameters: querySig.parameters??querySig }, inventorySignatures: invSigs.map(s=>({parameters:s.parameters??s})), comparisons };
  fs.writeFileSync(path.join(OUT_DIR,'manifest.json'), JSON.stringify(manifest,null,2));
  fs.writeFileSync(path.join(OUT_DIR,'results.json'), JSON.stringify(results,null,2));

  const renderer=path.resolve(__dirname,'render-html.mjs');
  const {spawnSync}=await import('child_process');
  const run=spawnSync(process.execPath,[renderer,'--input',OUT_DIR,'--dataset',DATASET_ROOT],{stdio:'inherit'});
  if(run.status!==0){ console.error('❌ HTML render failed'); process.exit(1); }
  console.log(`✅ Done: ${path.join(OUT_DIR,'report.html')}`);
}

main().catch(e=>{ console.error('❌ Run failed:', e.message); process.exit(1); });

