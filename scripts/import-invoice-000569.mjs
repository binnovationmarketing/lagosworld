/**
 * import-invoice-000569.mjs
 * Imports Pedido 000569 (Estacao 79, 25/05/2026, R$13,849.04)
 * Sets real stock from purchase invoice.
 * Usage: node scripts/import-invoice-000569.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vthtufcomuaiyeussrrj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) { console.error('Missing SUPABASE_SERVICE_KEY env var.'); process.exit(1); }

const H = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

// ── INVOICE LINE ITEMS ─────────────────────────────────────────────────────
// Extracted from Pedido 000569, Emissão 25/05/2026
// [invoice_sku, qty, unit_price]
const RAW_LINES = [
  // PAGE 1
  ['B10113',       1,  29.90],
  ['B10117',       1,  29.90],
  ['A 637 N16',    1,  39.90],
  ['A 644 N18',    1,  39.90],
  ['B10079',       1,  39.90],
  ['B10081',       1,  39.90],
  ['P 704',        1,  39.90],
  ['P 704',        2,  39.90],  // duplicate line in invoice
  ['P10032',       1,  39.90],
  ['P10054',       1,  39.90],
  ['P10055',       1,  39.90],
  ['A 506 N 14',   2,  39.99],
  ['A 514 N 16',   1,  39.99],
  ['A 518 N 18',   1,  39.99],
  ['B 2510',       1,  39.99],
  ['B 2511',       1,  39.99],
  ['A10034 N14',   1,  44.90],
  ['A 651 N12',    1,  45.90],
  ['A 651 N8',     1,  45.90],
  ['A 652 N10',    1,  45.90],
  ['A 652 N12',    1,  45.90],
  ['A 576 N14',    1,  49.79],
  ['A10031 N16',   1,  49.90],
  ['A10046 N14',   1,  49.90],
  ['A10046 N16',   1,  49.90],
  ['A10048 N16',   1,  49.90],
  ['A10048 N18',   1,  49.90],
  ['B10105',       1,  49.90],
  ['B10123',       1,  49.90],
  ['P10075',       1,  49.90],
  ['P10075',       1,  49.90],  // duplicate line
  ['P10077',       1,  49.90],
  ['A10001 N14',   1,  59.90],
  // PAGE 2
  ['A10029 N16',   1,  59.90],
  ['A10029 N16',   1,  59.90],  // duplicate line
  ['A10043 N10',   1,  59.90],
  ['A10043 N12',   1,  59.90],
  ['A10050 N16',   2,  59.90],
  ['A10051 N18',   1,  59.90],
  ['A10051 N20',   1,  59.90],
  ['B 2954',       1,  59.90],
  ['B 2981',       1,  59.90],
  ['B10019',       1,  59.90],
  ['B10083',       1,  59.90],
  ['B10114',       2,  59.90],
  ['B10122',       1,  59.90],
  ['CO 293',       1,  59.90],
  ['CO10079',      1,  59.90],
  ['CO10080',      2,  59.90],
  ['P10027',       2,  59.90],
  ['PI 261',       2,  59.99],
  ['B 2985',       1,  64.90],
  ['B10013',       1,  69.90],
  ['B10018',       2,  69.90],
  ['B10031',       1,  69.90],
  ['B10094',       1,  69.90],
  ['B10102',       1,  69.90],
  ['B10108',       1,  69.90],
  ['B10118',       1,  69.90],
  ['B10136',       3,  69.90],
  ['B10137',       1,  69.90],
  ['B10138',       3,  69.90],
  ['B2941',        2,  69.90],
  ['CO10075',      2,  69.90],
  ['P10021',       1,  69.90],
  ['BRC 130',      2,  69.99],
  ['A 624 N 14',   1,  79.90],
  ['A 626',        2,  79.90],
  ['A 633 N18',    1,  79.90],
  ['B10007',       2,  79.90],
  ['B10014',       2,  79.90],
  ['B10036',       1,  79.90],
  ['B10095',       2,  79.90],
  ['B10101',       1,  79.90],
  ['B10116',       2,  79.90],
  ['P10011',       1,  79.90],
  ['A 612 N 14',   1,  89.90],
  ['A10025 N14',   1,  89.90],
  ['A10026 N16',   1,  89.90],
  ['A10027 N14',   1,  89.90],
  // PAGE 3
  ['CJ 606',       1,  89.90],
  ['CO10020',      1,  89.90],
  ['CO10063',      2,  89.90],
  ['P 616',        4,  89.99],
  ['A 622 N 14',   1,  99.90],
  ['A10000 N 14',  1,  99.90],
  ['A10022 N18',   1,  99.90],
  ['A10024 N18',   1,  99.90],
  ['A10037 N18',   1,  99.90],
  ['A10038 N14',   1,  99.90],
  ['A10058 N16',   1,  99.90],
  ['A10058 N18',   1,  99.90],
  ['B 2938',       1,  99.90],
  ['B10078',       1,  99.90],
  ['B10082',       2,  99.90],
  ['B10086',       2,  99.90],
  ['B10097',       1,  99.90],
  ['B10100',       2,  99.90],
  ['B10107',       2,  99.90],
  ['B10135',       2,  99.90],
  ['CJ10051',      2,  99.90],
  ['P10016',       1,  99.90],
  ['CJ 596',       1, 119.90],
  ['B 2939',       1, 129.90],
  ['CJ 615',       1, 129.90],
  ['CJ10000',      2, 129.90],
  ['CJ10053',      4, 129.90],
  ['CO10009',      1, 129.90],
  ['BRC 10018',    1, 149.90],
  ['BRC 139',      1, 149.90],
  ['CO 914',       1, 149.90],
  ['P10058',       1, 149.90],
  ['CJ 610',       2, 159.90],
  ['CO 941',       4, 159.90],
  ['CO 907',       1, 169.79],
  ['CJ10032',      1, 169.90],
  ['CJ10033',      1, 189.90],
  ['CJ10048',      1, 199.90],
  ['BRC 140',      1, 229.90],
  ['CJ10023',      1, 239.90],
  ['CJ10026',      1, 279.90],
  ['CJ10020',      1, 329.90],
];

// ── NORMALISE invoice SKU to DB format ────────────────────────────────────
// 1. Strip ring size suffix: " N8", " N10", " N 14", " N 16" etc.
// 2. Add space between letter-prefix and digits if missing
//    e.g. B10113 → B 10113, CO10009 → CO 10009, CJ10000 → CJ 10000
function normalizeSku(raw) {
  let s = raw.trim();
  // Strip size suffix (N followed by 1-2 digits, optionally with space before N or between N and digits)
  s = s.replace(/\s+N\s*\d+$/i, '').trim();
  // Insert space between letter(s) and digit if missing (e.g. B10113→B 10113)
  s = s.replace(/^([A-Z]+)(\d)/, '$1 $2');
  return s.trim();
}

// ── AGGREGATE by base SKU ─────────────────────────────────────────────────
const agg = new Map(); // normalized_sku → { qty, unit_price, raw_skus }
for (const [rawSku, qty, price] of RAW_LINES) {
  const norm = normalizeSku(rawSku);
  if (!agg.has(norm)) agg.set(norm, { qty: 0, unit_price: price, raw_skus: new Set() });
  const e = agg.get(norm);
  e.qty += qty;
  e.raw_skus.add(rawSku);
}

console.log(`\nInvoice: Pedido 000569 — Estacao 79 — 25/05/2026`);
console.log(`Aggregated: ${agg.size} unique base SKUs, ${[...agg.values()].reduce((s,e)=>s+e.qty,0)} total units\n`);

// ── LOAD ALL DB PRODUCTS ──────────────────────────────────────────────────
console.log('Loading DB products...');
const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/jewelry_products?select=id,sku,name,stock_qty&limit=3000`, { headers: H });
const dbProducts = await dbRes.json();
const bySkuMap = new Map(dbProducts.map(p => [p.sku, p]));
console.log(`DB has ${dbProducts.length} products\n`);

// ── RESET ALL STOCK TO 0 first ────────────────────────────────────────────
console.log('Resetting all stock_qty to 0...');
const resetRes = await fetch(`${SUPABASE_URL}/rest/v1/jewelry_products?id=gt.0`, {
  method: 'PATCH',
  headers: { ...H, 'Prefer': 'return=minimal' },
  body: JSON.stringify({ stock_qty: 0 })
});
console.log(`Reset status: ${resetRes.status}\n`);

// ── MATCH & UPDATE ────────────────────────────────────────────────────────
const matched   = [];
const unmatched = [];

for (const [normSku, { qty, unit_price, raw_skus }] of agg) {
  const dbRow = bySkuMap.get(normSku);
  if (dbRow) {
    matched.push({ ...dbRow, invoice_qty: qty, unit_price, raw: [...raw_skus].join(', ') });
  } else {
    unmatched.push({ normSku, qty, unit_price, raw: [...raw_skus].join(', ') });
  }
}

// Update matched products
let updated = 0, failed = 0;
for (const p of matched) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/jewelry_products?id=eq.${p.id}`, {
    method: 'PATCH',
    headers: { ...H, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ stock_qty: p.invoice_qty })
  });
  if (r.ok) updated++;
  else { failed++; console.error(`PATCH failed for ${p.sku}: ${r.status}`); }
}

// ── SUMMARY ───────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════');
console.log('✅ STOCK UPDATE COMPLETE');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Products updated: ${updated}`);
console.log(`  Update failed:   ${failed}`);
console.log(`  Unmatched SKUs:  ${unmatched.length}`);

const totalValue = matched.reduce((s,p)=>s+(p.invoice_qty * p.unit_price),0);
console.log(`  Stock value:     R$ ${totalValue.toFixed(2)}`);

console.log('\n── UPDATED PRODUCTS ────────────────────────────────────────');
for (const p of matched.sort((a,b)=>a.sku.localeCompare(b.sku))) {
  console.log(`  [${String(p.invoice_qty).padStart(2,'0')} un] ${p.sku.padEnd(16)} ${p.name.substring(0,40)}`);
}

if (unmatched.length > 0) {
  console.log('\n── ❌ UNMATCHED (not in DB — may need to add) ──────────────');
  for (const u of unmatched) {
    console.log(`  [${String(u.qty).padStart(2,'0')} un] ${u.normSku.padEnd(16)} raw: "${u.raw}"  @R$${u.unit_price}`);
  }
}

const totalInvoice = RAW_LINES.reduce((s,[,q,p])=>s+(q*p),0);
console.log(`\n── INVOICE TOTAL: R$ ${totalInvoice.toFixed(2)} (160 pieces) ──────────\n`);
