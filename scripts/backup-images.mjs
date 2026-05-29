#!/usr/bin/env node
/**
 * backup-images.mjs — Lagos Jewelry image insurance
 *
 * Downloads every product image from the Conecta Venda CDN and uploads it to
 * the Supabase Storage bucket `jewelry-images`. Removes the single point of
 * failure where 1255 product photos live only on the supplier's CDN.
 *
 * PHASE 1 (default): download + upload only. Does NOT touch the live site.
 * PHASE 2 (--cutover): also rewrites jewelry_products image URLs to Supabase,
 *          making the store independent of the supplier. Run only when ready.
 *
 * Usage:
 *   export SUPABASE_URL=https://vthtufcomuaiyeussrrj.supabase.co
 *   export SUPABASE_SERVICE_KEY=...        # service_role key, backend only
 *   node scripts/backup-images.mjs            # backup (insurance)
 *   node scripts/backup-images.mjs --dry-run  # show what would happen
 *   node scripts/backup-images.mjs --cutover  # backup + rewrite DB URLs
 *
 * Safe to re-run: existing objects are skipped (resumable).
 */

import fs from 'fs';

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'jewelry-images';
const PREFIX = 'catalog';            // folder inside the bucket
const CDN_HOST = 'img1.conectavenda.com.br';
const CONCURRENCY = 8;
const MAP_FILE = './scripts/image-url-map.json';

const DRY = process.argv.includes('--dry-run');
const CUTOVER = process.argv.includes('--cutover');

if (!URL_BASE || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.');
  process.exit(1);
}

const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

// uuid.webp filename from a CDN url -> storage path `catalog/uuid.webp`
const pathFor = (url) => `${PREFIX}/${url.split('/').pop().split('?')[0]}`;
const publicUrl = (p) => `${URL_BASE}/storage/v1/object/public/${BUCKET}/${p}`;

async function fetchAllProducts() {
  const sel = 'id,images,img_primary,img_hover';
  const r = await fetch(
    `${URL_BASE}/rest/v1/jewelry_products?select=${sel}&limit=5000`,
    { headers: H }
  );
  if (!r.ok) throw new Error('DB fetch failed: ' + r.status + ' ' + (await r.text()));
  return r.json();
}

// collect every distinct CDN url across the catalog
function collectCdnUrls(products) {
  const set = new Set();
  for (const p of products) {
    const all = [...(Array.isArray(p.images) ? p.images : []), p.img_primary, p.img_hover];
    for (const u of all) if (u && u.includes(CDN_HOST)) set.add(u);
  }
  return [...set];
}

// HEAD the public url; 200 = already uploaded (resumable skip)
async function existsInBucket(storagePath) {
  const r = await fetch(publicUrl(storagePath), { method: 'HEAD' });
  return r.ok;
}

async function backupOne(cdnUrl) {
  const sp = pathFor(cdnUrl);
  if (await existsInBucket(sp)) return { sp, status: 'skip' };
  if (DRY) return { sp, status: 'would-upload' };

  const dl = await fetch(cdnUrl);
  if (!dl.ok) return { sp, status: 'download-fail-' + dl.status };
  const buf = Buffer.from(await dl.arrayBuffer());
  const ct = dl.headers.get('content-type') || 'image/webp';

  const up = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${sp}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': ct, 'x-upsert': 'true' },
    body: buf,
  });
  if (!up.ok) return { sp, status: 'upload-fail-' + up.status + ':' + (await up.text()).slice(0, 80) };
  return { sp, status: 'uploaded', bytes: buf.length };
}

// simple promise pool
async function runPool(items, worker) {
  const results = [];
  let i = 0, done = 0;
  async function next() {
    while (i < items.length) {
      const idx = i++;
      const res = await worker(items[idx]);
      results[idx] = res;
      done++;
      if (done % 25 === 0 || done === items.length)
        process.stdout.write(`\r  ${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
  process.stdout.write('\n');
  return results;
}

async function cutover(products, urlMap) {
  console.log('\n[CUTOVER] rewriting DB image URLs -> Supabase...');
  const rewrite = (u) => (u && urlMap[u]) || u;
  let changed = 0;
  for (const p of products) {
    const imgs = (Array.isArray(p.images) ? p.images : []).map(rewrite);
    const imgP = rewrite(p.img_primary);
    const imgH = rewrite(p.img_hover);
    const before = JSON.stringify([p.images, p.img_primary, p.img_hover]);
    const after = JSON.stringify([imgs, imgP, imgH]);
    if (before === after) continue;
    if (DRY) { changed++; continue; }
    const r = await fetch(`${URL_BASE}/rest/v1/jewelry_products?id=eq.${p.id}`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ images: imgs, img_primary: imgP, img_hover: imgH }),
    });
    if (!r.ok) { console.error(`  row ${p.id} PATCH failed: ${r.status}`); continue; }
    changed++;
  }
  console.log(`[CUTOVER] ${changed} products ${DRY ? 'would be' : ''} updated.`);
  console.log('[CUTOVER] now regenerate products-data.js (see CLAUDE.md).');
}

(async () => {
  console.log(`Mode: ${CUTOVER ? 'BACKUP + CUTOVER' : 'BACKUP'}${DRY ? ' (dry-run)' : ''}`);
  const products = await fetchAllProducts();
  console.log(`Products: ${products.length}`);
  const urls = collectCdnUrls(products);
  console.log(`Distinct CDN images: ${urls.length}`);

  const results = await runPool(urls, backupOne);
  const tally = results.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
  console.log('Backup tally:', tally);

  // build + save old->new url map
  const urlMap = {};
  for (const u of urls) urlMap[u] = publicUrl(pathFor(u));
  fs.writeFileSync(MAP_FILE, JSON.stringify(urlMap, null, 2));
  console.log(`URL map saved: ${MAP_FILE} (${urls.length} entries)`);

  const failed = results.filter((r) => r.status.includes('fail'));
  if (failed.length) {
    console.warn(`\n⚠ ${failed.length} failures (re-run to retry):`);
    failed.slice(0, 10).forEach((r) => console.warn('  ', r.sp, r.status));
  }

  if (CUTOVER) {
    if (failed.length) {
      console.error('\nAborting cutover: backup had failures. Fix first, then re-run with --cutover.');
      process.exit(1);
    }
    await cutover(products, urlMap);
  } else {
    console.log('\nDone (insurance). To make the site supplier-independent: --cutover');
  }
})().catch((e) => { console.error(e); process.exit(1); });
