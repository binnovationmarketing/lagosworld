/**
 * migrate-products.js
 * Migrates all 512 jewelry products from products-data.js → Supabase
 * Also downloads images from conectavenda CDN → Supabase Storage
 *
 * Usage:
 *   node scripts/migrate-products.js [--skip-images]
 *
 * Requires env vars (copy from .env or Vercel):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY   (service_role key — bypasses RLS)
 */
'use strict';

const https  = require('https');
const http   = require('http');
const path   = require('path');
const fs     = require('fs');

// ── Load env ────────────────────────────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const SKIP_IMAGES  = process.argv.includes('--skip-images');
const STORAGE_BUCKET = 'jewelry-images';
const BATCH_SIZE   = 50;  // insert N products per batch
const IMG_DELAY_MS = 120; // delay between image downloads (be polite to CDN)

// ── Load products from static JS file ────────────────────────────────────────
const productsDataPath = path.join(__dirname, '../public/js/products-data.js');
if (!fs.existsSync(productsDataPath)) {
  console.error('❌ products-data.js not found at', productsDataPath);
  process.exit(1);
}

// Evaluate the JS file to get PRODUCTS array
const code = fs.readFileSync(productsDataPath, 'utf8');
const window = {};
eval(code.replace('window.PRODUCTS', 'window.PRODUCTS'));
const PRODUCTS = window.PRODUCTS;

if (!Array.isArray(PRODUCTS) || PRODUCTS.length === 0) {
  console.error('❌ Could not parse PRODUCTS array from products-data.js');
  process.exit(1);
}

console.log(`✅ Loaded ${PRODUCTS.length} products from products-data.js`);

// ── Supabase REST helpers ─────────────────────────────────────────────────────
function supabaseRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url   = new URL(SUPABASE_URL + endpoint);
    const data  = body ? JSON.stringify(body) : null;
    const opts  = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method,
      headers: {
        'apikey':         SUPABASE_KEY,
        'Authorization':  `Bearer ${SUPABASE_KEY}`,
        'Content-Type':   'application/json',
        'Prefer':         method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : ''
      }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(raw ? JSON.parse(raw) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Download image helper ─────────────────────────────────────────────────────
function downloadImage(imgUrl) {
  return new Promise((resolve, reject) => {
    const mod = imgUrl.startsWith('https') ? https : http;
    mod.get(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0 LagosWorld/1.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/webp' }));
    }).on('error', reject);
  });
}

// ── Upload image to Supabase Storage ─────────────────────────────────────────
function uploadToStorage(filename, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const url  = new URL(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`);
    const opts = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers: {
        'apikey':         SUPABASE_KEY,
        'Authorization':  `Bearer ${SUPABASE_KEY}`,
        'Content-Type':   contentType,
        'Content-Length': buffer.length,
        'x-upsert':       'true'
      }
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`Storage upload ${res.statusCode}: ${raw}`));
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function storagePublicUrl(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Extract UUID from image URL ───────────────────────────────────────────────
function extractFilename(imgUrl) {
  const parts = imgUrl.split('/');
  return parts[parts.length - 1]; // e.g. "bb31f640-007b-4234-ba1c-cd34a662e443.webp"
}

// ── Process images for one product ───────────────────────────────────────────
async function processImages(product) {
  if (SKIP_IMAGES) return { img_primary: product.img, img_hover: product.img2, images: product.imgs };

  const urls    = [...new Set(product.imgs.filter(Boolean))];
  const stored  = [];

  for (const imgUrl of urls) {
    const filename = extractFilename(imgUrl);
    try {
      const { buffer, contentType } = await downloadImage(imgUrl);
      await uploadToStorage(filename, buffer, contentType);
      stored.push(storagePublicUrl(filename));
      process.stdout.write('.');
    } catch (e) {
      console.warn(`\n  ⚠ Image download failed (${filename}): ${e.message} — keeping original URL`);
      stored.push(imgUrl); // fallback: keep original URL
    }
    await sleep(IMG_DELAY_MS);
  }

  return {
    img_primary: stored[0] || product.img,
    img_hover:   stored[1] || stored[0] || product.img2,
    images:      stored
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Lagos Jewelry — Product Migration');
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Products: ${PRODUCTS.length}`);
  console.log(`   Images:   ${SKIP_IMAGES ? 'SKIPPED (keeping original URLs)' : 'downloading to Supabase Storage'}\n`);

  // Step 1 — Ensure storage bucket exists (will fail silently if already exists)
  if (!SKIP_IMAGES) {
    try {
      await supabaseRequest('POST', '/storage/v1/bucket', {
        id: STORAGE_BUCKET, name: STORAGE_BUCKET, public: true
      });
      console.log(`✅ Storage bucket '${STORAGE_BUCKET}' created`);
    } catch (e) {
      if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
        console.warn(`⚠ Bucket creation: ${e.message} (may already exist — continuing)`);
      } else {
        console.log(`✅ Storage bucket '${STORAGE_BUCKET}' already exists`);
      }
    }
  }

  // Step 2 — Process and upsert products in batches
  let inserted = 0, failed = 0;

  for (let i = 0; i < PRODUCTS.length; i += BATCH_SIZE) {
    const batch = PRODUCTS.slice(i, i + BATCH_SIZE);
    const rows  = [];

    for (const p of batch) {
      const imgData = await processImages(p);
      rows.push({
        id:          p.id,
        name:        (p.name || '').trim(),
        sku:         p.sku  || null,
        category:    p.cat  || 'OUTROS',
        images:      imgData.images,
        img_primary: imgData.img_primary || null,
        img_hover:   imgData.img_hover   || null,
        min_price:   p.minPrice || 0,
        max_price:   p.maxPrice || 0,
        variations:  p.variacoes || [],
        description: p.descricao || null,
        active:      true,
        sort_order:  i
      });
    }

    try {
      await supabaseRequest('POST', '/rest/v1/jewelry_products', rows);
      inserted += rows.length;
      console.log(`\n✅ Batch ${Math.floor(i/BATCH_SIZE)+1}: inserted ${rows.length} products (total: ${inserted})`);
    } catch (e) {
      failed += rows.length;
      console.error(`\n❌ Batch failed: ${e.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Migration complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Failed:   ${failed}`);
  console.log(`   Table:    jewelry_products`);
  if (!SKIP_IMAGES) console.log(`   Storage:  ${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
