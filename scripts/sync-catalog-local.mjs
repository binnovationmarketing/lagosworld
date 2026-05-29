/**
 * sync-catalog-local.mjs
 * Run locally to bypass Vercel 30s timeout.
 * Usage: node scripts/sync-catalog-local.mjs
 */

const SUPABASE_URL = 'https://vthtufcomuaiyeussrrj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aHR1ZmNvbXVhaXlldXNzcnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU2OTgxNSwiZXhwIjoyMDk1MTQ1ODE1fQ.l1ASVHF0JJa7cENn_gbSoy3b9E0umndmAxEYgj4R6aE';
const CATALOG_TOKEN = '2441f464b56e9641d86b2772287d13d5';
const API_BASE      = 'https://dados.conectavenda.com.br/api';

// Minimal Supabase REST client
function sbFetch(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': opts.prefer || '',
      ...(opts.headers || {}),
    }
  });
}

async function sbSelect(table, select = '*', filters = '') {
  const r = await sbFetch(`/${table}?select=${select}${filters}&limit=3000`);
  if (!r.ok) throw new Error(`Supabase SELECT ${table}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function sbInsert(table, rows) {
  const r = await sbFetch(`/${table}`, {
    method: 'POST',
    prefer: 'return=minimal',
    body: JSON.stringify(rows),
  });
  if (!r.ok) {
    const msg = await r.text();
    throw new Error(`Supabase INSERT ${table}: ${r.status} ${msg}`);
  }
}

async function sbUpdate(table, row, matchCol, matchVal) {
  const r = await sbFetch(`/${table}?${matchCol}=eq.${encodeURIComponent(matchVal)}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: JSON.stringify(row),
  });
  if (!r.ok) {
    const msg = await r.text();
    throw new Error(`Supabase PATCH ${table} where ${matchCol}=${matchVal}: ${r.status} ${msg}`);
  }
}

function mapCategory(g = '') {
  g = (g || '').toUpperCase();
  if (g.includes('BRINCO'))    return 'BRINCOS';
  if (g.includes('ANEL'))      return 'ANÉIS';
  if (g.includes('COLAR') || g.includes('CORRENTE') || g.includes('GARGANTILHA')) return 'COLARES';
  if (g.includes('PULSEIRA') || g.includes('BRACELETE')) return 'PULSEIRAS E BRACELETES';
  if (g.includes('CONJUNTO'))  return 'CONJUNTOS';
  if (g.includes('PINGENTE'))  return 'PINGENTES';
  if (g.includes('ACESSORIO') || g.includes('ACESSÓRIO')) return 'ACESSÓRIOS';
  if (g.includes('ACO') || g.includes('AÇO')) return 'AÇO';
  return g || 'OUTROS';
}

function transformProduct(raw) {
  const vars = []; let minP = null, maxP = null;
  for (const v of (raw.produto_variacoes || [])) {
    const p = (v.variacao_preco || 0) / 100;
    if (p > 0) { if (minP === null || p < minP) minP = p; if (maxP === null || p > maxP) maxP = p; }
    vars.push({
      id:    v.variacao_id,
      desc:  v.variacao_descricao || '',
      price: p,
      stock: v.variacao_estoque ?? null,
      active: v.variacao_ativo !== 0,
      order: v.variacao_ordem || 0
    });
  }
  const imgs = raw.produto_imagens || [];
  const sku  = (raw.produto_referencia || '').trim();
  return {
    source_id:    raw.produto_id,
    sku,
    name:         (raw.produto_nome || '').trim(),
    description:  (raw.produto_descricao || '').replace(/<[^>]+>/g, '').trim(),
    category:     mapCategory(raw.produto_grupo_descricao),
    category_raw: raw.produto_grupo_descricao || '',
    images:       imgs,
    img_primary:  imgs[0] || '',
    img_hover:    imgs[1] || imgs[0] || '',
    min_price:    minP || 0,
    max_price:    maxP || 0,
    variations:   vars,
    active:       raw.produto_ativo !== 0,
    featured:     !!raw.produto_tag_destaque,
    updated_at:   new Date().toISOString()
  };
}

async function main() {
  const runAt = new Date().toISOString();
  console.log(`\n[sync-catalog] Starting at ${runAt}`);

  // 1. Open Conecta Venda session
  console.log('[sync-catalog] Opening Conecta Venda session...');
  const sessRes = await fetch(`${API_BASE}/cliente/iniciar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'conecta-session': '' },
    body: JSON.stringify({ catalogo: CATALOG_TOKEN })
  });
  const session = sessRes.headers.get('conecta-session');
  if (!session) throw new Error('No Conecta Venda session token');
  console.log(`[sync-catalog] Session: ${session.substring(0,20)}...`);

  // 2. Fetch full catalog (paginated)
  let allRaw = [];
  for (let page = 1; page <= 10; page++) {
    process.stdout.write(`[sync-catalog] Fetching page ${page}...`);
    const catRes = await fetch(`${API_BASE}/produtos/listar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'conecta-session': session },
      body: JSON.stringify({ catalogo: CATALOG_TOKEN, pagina: page, limite: 500 })
    });
    const batch = await catRes.json();
    if (!Array.isArray(batch) || batch.length === 0) { console.log(' (empty, stopping)'); break; }
    allRaw = allRaw.concat(batch);
    console.log(` ${batch.length} items (total: ${allRaw.length})`);
    if (batch.length < 500) break;
  }
  if (!allRaw.length) throw new Error('Empty catalog response');

  // Deduplicate by produto_id
  const seen = new Map();
  for (const p of allRaw) if (p.produto_id && !seen.has(p.produto_id)) seen.set(p.produto_id, p);
  const unique = [...seen.values()];
  console.log(`[sync-catalog] Unique products from API: ${unique.length}`);

  // 3. Load existing DB products
  console.log('[sync-catalog] Loading existing products from Supabase...');
  const existing = await sbSelect('jewelry_products', 'id,sku,source_id,name,min_price,max_price,images,active,stock_qty');
  console.log(`[sync-catalog] DB has ${existing.length} existing products`);

  const bySkuMap = new Map(existing.map(r => [r.sku, r]));

  // 4. Split into new vs update
  const transformed = unique.map(transformProduct).filter(p => p.sku);
  const toInsert = [];
  const toUpdate = [];

  for (const p of transformed) {
    const ex = bySkuMap.get(p.sku);
    if (!ex) {
      const totalStock = p.variations.reduce((s, v) => s + (v.stock || 0), 0);
      toInsert.push({ ...p, stock_qty: totalStock, sort_order: 0, new_arrival: true });
    } else {
      const changed = (
        ex.name !== p.name ||
        Math.abs((ex.min_price || 0) - p.min_price) > 0.01 ||
        (ex.images?.[0] || '') !== (p.images?.[0] || '') ||
        ex.active !== p.active
      );
      if (changed) {
        toUpdate.push({
          sku:          p.sku,
          source_id:    p.source_id,
          name:         p.name,
          description:  p.description,
          category:     p.category,
          category_raw: p.category_raw,
          images:       p.images,
          img_primary:  p.img_primary,
          img_hover:    p.img_hover,
          min_price:    p.min_price,
          max_price:    p.max_price,
          variations:   p.variations,
          active:       p.active,
          featured:     p.featured,
          updated_at:   p.updated_at,
          // stock_qty intentionally OMITTED
        });
      }
    }
  }

  console.log(`[sync-catalog] Plan: ${toInsert.length} new | ${toUpdate.length} updates | ${transformed.length - toInsert.length - toUpdate.length} unchanged`);

  // 5. Insert new products (batches of 50)
  let inserted = 0, insertFailed = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    try {
      await sbInsert('jewelry_products', batch);
      inserted += batch.length;
      console.log(`[sync-catalog] Inserted batch ${Math.floor(i/50)+1}: ${inserted}/${toInsert.length}`);
    } catch(e) {
      insertFailed += batch.length;
      console.error(`[sync-catalog] Insert batch error:`, e.message);
    }
  }

  // 6. Update existing products
  let updated = 0, updateFailed = 0;
  for (const p of toUpdate) {
    try {
      await sbUpdate('jewelry_products', p, 'sku', p.sku);
      updated++;
      if (updated % 50 === 0) console.log(`[sync-catalog] Updated ${updated}/${toUpdate.length}...`);
    } catch(e) {
      updateFailed++;
      console.error(`[sync-catalog] Update error SKU ${p.sku}:`, e.message);
    }
  }

  // 7. Log sync run
  const syncLog = {
    ran_at:        runAt,
    catalog_total: unique.length,
    db_before:     existing.length,
    inserted,
    updated,
    update_failed: updateFailed,
    new_skus:      toInsert.map(p => p.sku),
    updated_skus:  toUpdate.map(p => p.sku),
  };
  try {
    await sbInsert('catalog_sync_log', [syncLog]);
    console.log('[sync-catalog] Sync log saved.');
  } catch(e) {
    console.warn('[sync-catalog] Log insert failed (non-fatal):', e.message);
  }

  console.log(`\n✅ Sync complete!`);
  console.log(`   Catalog total:  ${unique.length}`);
  console.log(`   DB before:      ${existing.length}`);
  console.log(`   Inserted:       ${inserted}`);
  console.log(`   Updated:        ${updated}`);
  console.log(`   Update failed:  ${updateFailed}`);
  console.log(`   Insert failed:  ${insertFailed}`);
  if (toInsert.length > 0) {
    console.log(`\n   New products:`);
    toInsert.forEach(p => console.log(`     + [${p.category}] ${p.sku} — ${p.name} (stock: ${p.stock_qty})`));
  }
  if (toUpdate.length > 0) {
    console.log(`\n   Updated products:`);
    toUpdate.forEach(p => console.log(`     ~ ${p.sku} — ${p.name}`));
  }
}

main().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1); });
