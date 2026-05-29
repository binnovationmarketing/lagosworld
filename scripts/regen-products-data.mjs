#!/usr/bin/env node
/**
 * regen-products-data.mjs — rebuild public/js/products-data.js from Supabase.
 *
 * Run after every catalog sync or manual DB change. Replaces the brittle
 * inline snippet in CLAUDE.md (which emitted the wrong field name).
 *
 * IMPORTANT field mapping (do not change without updating the frontend):
 *   newArrival <- jewelry_products.new_arrival   (drives ✦NEW badge +
 *                 "Novidades" carousel; frontend reads p.newArrival)
 *   stock      <- stock_qty                      (drives In Stock badge)
 *   featured   <- featured                       (carried through; not yet
 *                 consumed by any frontend)
 *
 * Usage:
 *   export SUPABASE_URL=https://vthtufcomuaiyeussrrj.supabase.co
 *   export SUPABASE_SERVICE_KEY=...
 *   node scripts/regen-products-data.mjs
 */

import fs from 'fs';

const BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!BASE || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.');
  process.exit(1);
}
const h = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const sel = [
  'id', 'source_id', 'sku', 'name', 'description', 'category',
  'images', 'img_primary', 'img_hover', 'min_price', 'max_price',
  'variations', 'active', 'featured', 'new_arrival', 'stock_qty', 'created_at',
].join(',');

const r = await fetch(
  `${BASE}/rest/v1/jewelry_products?select=${sel}&active=eq.true&order=category.asc,name.asc&limit=3000`,
  { headers: h }
);
if (!r.ok) { console.error('DB fetch failed:', r.status, await r.text()); process.exit(1); }
const products = await r.json();

const t = products.map((p) => {
  const imgs = Array.isArray(p.images) ? p.images : [];
  const v = (p.variations || []).map((x) => ({
    id: x.id, desc: x.desc || '',
    price: x.price || p.min_price || 0,
    original: x.price || p.min_price || 0,
  }));
  return {
    id: p.id,
    name: p.name || '',
    sku: p.sku || '',
    cat: p.category || 'OUTROS',
    imgs,
    img: p.img_primary || imgs[0] || '',
    img2: p.img_hover || imgs[1] || imgs[0] || '',
    minPrice: p.min_price || 0,
    maxPrice: p.max_price || p.min_price || 0,
    variacoes: v,
    descricao: p.description || '',
    featured: !!p.featured,
    newArrival: !!p.new_arrival,   // <-- the fix: frontend reads p.newArrival
    stock: p.stock_qty || 0,
  };
});

fs.writeFileSync(
  './public/js/products-data.js',
  '/* Lagos Jewelry — Full Product Data */\n' +
  '/* AUTO-GENERATED ' + new Date().toISOString() + ' — scripts/regen-products-data.mjs */\n' +
  'window.PRODUCTS=' + JSON.stringify(t) + ';'
);

const stats = {
  products: t.length,
  newArrival: t.filter((x) => x.newArrival).length,
  inStock: t.filter((x) => x.stock > 0).length,
  featured: t.filter((x) => x.featured).length,
};
console.log('Done:', JSON.stringify(stats));
