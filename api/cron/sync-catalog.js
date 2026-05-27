/**
 * GET /api/cron/sync-catalog
 * Syncs new products from Estação 79 (Conecta Venda) into jewelry_products.
 *
 * Intended to run on a schedule (e.g. daily via Vercel Cron).
 * Protected by CRON_SECRET header.
 *
 * What it does:
 *   1. Opens a session with Conecta Venda API
 *   2. Fetches full catalog (~547 products, single call)
 *   3. Compares source_id against jewelry_products
 *   4. Inserts new products only (no overwrites)
 *   5. Returns JSON summary: { inserted, skipped, total, newProducts[] }
 */

const { createClient } = require('@supabase/supabase-js');

const CATALOG_TOKEN = '2441f464b56e9641d86b2772287d13d5';
const API_BASE      = 'https://dados.conectavenda.com.br/api';

// ── Auth ──────────────────────────────────────────────────────────────────────
function checkAuth(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret set — allow (dev mode)
  const auth = req.headers['authorization'] || '';
  return auth === `Bearer ${secret}`;
}

// ── Conecta Venda ─────────────────────────────────────────────────────────────
async function initSession() {
  const res = await fetch(`${API_BASE}/cliente/iniciar`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'conecta-session': '' },
    body:    JSON.stringify({ catalogo: CATALOG_TOKEN })
  });
  const session = res.headers.get('conecta-session');
  if (!session) throw new Error('Conecta Venda: no session token in response');
  return session;
}

async function fetchCatalog(session) {
  const res = await fetch(`${API_BASE}/produtos/listar`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'conecta-session': session },
    body:    JSON.stringify({ catalogo: CATALOG_TOKEN, pagina: 1, limite: 1000 })
  });
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`Unexpected catalog response: ${JSON.stringify(data).slice(0,200)}`);
  // Deduplicate by produto_id
  const seen = new Map();
  for (const p of data) {
    if (p.produto_id && !seen.has(p.produto_id)) seen.set(p.produto_id, p);
  }
  return [...seen.values()];
}

// ── Transform ─────────────────────────────────────────────────────────────────
function mapCategory(groupDesc = '') {
  const g = groupDesc.toUpperCase();
  if (g.includes('BRINCO'))             return 'BRINCOS';
  if (g.includes('ANEL'))               return 'ANÉIS';
  if (g.includes('COLAR') || g.includes('CORRENTE') || g.includes('GARGANTILHA')) return 'COLARES';
  if (g.includes('PULSEIRA') || g.includes('BRACELETE')) return 'PULSEIRAS E BRACELETES';
  if (g.includes('CONJUNTO'))           return 'CONJUNTOS';
  if (g.includes('PINGENTE'))           return 'PINGENTES';
  if (g.includes('ACESSORIO') || g.includes('ACESSÓRIO')) return 'ACESSÓRIOS';
  if (g.includes('ACO') || g.includes('AÇO')) return 'AÇO';
  return groupDesc || 'OUTROS';
}

function cleanHtml(html = '') {
  return html.replace(/<[^>]+>/g, '').trim();
}

function transform(raw) {
  const variations = [];
  let minPrice = null, maxPrice = null;

  for (const v of (raw.produto_variacoes || [])) {
    const priceUsd = (v.variacao_preco || 0) / 100;
    if (priceUsd > 0) {
      if (minPrice === null || priceUsd < minPrice) minPrice = priceUsd;
      if (maxPrice === null || priceUsd > maxPrice) maxPrice = priceUsd;
    }
    variations.push({
      id:    v.variacao_id,
      desc:  v.variacao_descricao || '',
      price: priceUsd,
      stock: v.variacao_estoque ?? null,
      active: v.variacao_ativo !== 0,
      order: v.variacao_ordem || 0
    });
  }

  const images = raw.produto_imagens || [];

  return {
    id:           raw.produto_id,
    source_id:    raw.produto_id,
    sku:          (raw.produto_referencia || '').trim(),
    name:         (raw.produto_nome || '').trim(),
    description:  cleanHtml(raw.produto_descricao || ''),
    category:     mapCategory(raw.produto_grupo_descricao),
    category_raw: raw.produto_grupo_descricao || '',
    images,
    img_primary:  images[0] || '',
    img_hover:    images[1] || images[0] || '',
    min_price:    minPrice || 0,
    max_price:    maxPrice || 0,
    variations,
    active:       raw.produto_ativo !== 0,
    featured:     !!raw.produto_tag_destaque,
    sort_order:   0,
    updated_at:   new Date().toISOString()
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // 1. Fetch catalog
    console.log('[sync-catalog] Starting session...');
    const session  = await initSession();
    const rawItems = await fetchCatalog(session);
    console.log(`[sync-catalog] Fetched ${rawItems.length} products from catalog`);

    // 2. Get existing source_ids from DB
    const { data: existing, error: dbErr } = await supabase
      .from('jewelry_products')
      .select('source_id, sku')
      .limit(2000);
    if (dbErr) throw dbErr;

    const existingIds  = new Set(existing.map(r => r.source_id).filter(Boolean));
    const existingSkus = new Set(existing.map(r => r.sku).filter(Boolean));

    // 3. Transform + filter new products
    const transformed  = rawItems.map(transform);
    const newProducts  = transformed.filter(p =>
      p.source_id && !existingIds.has(p.source_id) && !existingSkus.has(p.sku)
    );

    console.log(`[sync-catalog] ${newProducts.length} new products to insert`);

    // 4. Insert in batches of 50
    let inserted = 0;
    for (let i = 0; i < newProducts.length; i += 50) {
      const chunk = newProducts.slice(i, i + 50);
      const { error } = await supabase.from('jewelry_products').insert(chunk);
      if (error) {
        console.error('[sync-catalog] Insert error:', error.message);
        // Continue with next chunk
      } else {
        inserted += chunk.length;
      }
    }

    const summary = {
      ok:          true,
      timestamp:   new Date().toISOString(),
      catalogTotal: rawItems.length,
      dbBefore:    existing.length,
      inserted,
      skipped:     newProducts.length - inserted,
      newProducts: newProducts.map(p => ({ sku: p.sku, name: p.name, category: p.category }))
    };

    console.log(`[sync-catalog] Done: inserted ${inserted}/${newProducts.length}`);
    return res.status(200).json(summary);

  } catch (err) {
    console.error('[sync-catalog] Fatal error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
