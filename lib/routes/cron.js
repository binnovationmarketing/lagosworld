/**
 * cron.js — Daily email queue processor + manual email dispatch
 * Vercel Cron calls GET /api/cron/emails every day at 9am ET
 */
const express = require('express');
const router = express.Router();
const { processDueEmails, sendEmail } = require('../services/email');
const nodemailer = require('nodemailer');
const t  = require('../services/emailTemplates');
const ct = require('../services/cleaningEmailTemplates');

// ── Cron auth ─────────────────────────────────────────────────────────────────
// Vercel Cron authenticates with `Authorization: Bearer ${CRON_SECRET}`.
// Manual triggers may also pass x-cron-secret header, ?secret= query, or body.secret.
// Fails closed when CRON_SECRET is set; warns (and allows) only if it is unset
// (local dev). Production MUST set CRON_SECRET on Vercel.
function cronAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.warn('[cron] CRON_SECRET not set — endpoints are UNPROTECTED. Set it on Vercel.');
    return true;
  }
  const bearer = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  const provided = bearer
    || req.headers['x-cron-secret']
    || req.query.secret
    || (req.body && req.body.secret);
  return provided === expected;
}

router.get('/emails', async (req, res) => {
  // Basic auth: only Vercel cron (or CRON_SECRET header) can trigger
  if (!cronAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await processDueEmails(req.supabase);
    console.log('Cron email run:', result);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Cron email error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Abandoned Cart Recovery ───────────────────────────────────────────────────
// GET /api/cron/abandoned-carts — finds abandoned carts from last 24h with email
// Vercel cron can call this or it can be triggered manually with CRON_SECRET
router.get('/abandoned-carts', async (req, res) => {
  if (!cronAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Get abandons from last 24h that have email and no purchase after
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: abandons, error } = await req.supabase
      .from('cart_events')
      .select('*')
      .eq('event_type', 'cart_abandon')
      .not('customer_email', 'is', null)
      .neq('customer_email', '')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false });

    if (error) throw error;

    // Filter: exclude any that completed a purchase after abandoning
    const { data: purchases } = await req.supabase
      .from('cart_events')
      .select('customer_email, occurred_at')
      .eq('event_type', 'purchase')
      .gte('occurred_at', since);

    const purchasedEmails = new Set((purchases || []).map(p => p.customer_email));

    const toRecover = (abandons || []).filter(a =>
      a.customer_email && !purchasedEmails.has(a.customer_email)
    );

    // Send recovery emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      pool: true
    });
    const from = `"Lagos Jewelry" <${process.env.EMAIL_USER}>`;

    let sent = 0, failed = 0;
    for (const abandon of toRecover) {
      const firstName = (abandon.customer_name || abandon.customer_email.split('@')[0]).split(' ')[0];
      const items = Array.isArray(abandon.items) ? abandon.items : [];
      const total = Number(abandon.total) || 0;

      const itemRows = items.map(i =>
        `<tr><td style="padding:4px 8px;font-size:.8rem">${i.name}${i.variant ? ' ('+i.variant+')' : ''} ×${i.qty}</td><td style="padding:4px 8px;text-align:right;color:#b8922e;font-weight:700">$${(i.price*i.qty).toFixed(2)}</td></tr>`
      ).join('');

      const html = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf6ee;padding:20px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4dc;padding:2rem">
  <div style="text-align:center;margin-bottom:1.5rem">
    <div style="font-size:1.8rem;color:#b8922e;letter-spacing:.2em;font-family:Georgia,serif">Lagos Jewelry</div>
    <div style="font-size:.7rem;color:#a09890;letter-spacing:.3em;margin-top:.25rem">YOUR CART IS WAITING</div>
  </div>
  <p style="color:#2c2822;font-size:.9rem;line-height:1.7">Hi ${firstName},</p>
  <p style="color:#2c2822;font-size:.9rem;line-height:1.7">You left something beautiful behind. Your cart is still saved and ready for you.</p>
  <table style="width:100%;border-collapse:collapse;margin:1rem 0;border:1px solid #e8e4dc">${itemRows}</table>
  <p style="text-align:right;font-size:1rem;color:#b8922e;font-weight:700;margin:0">Total: $${total.toFixed(2)}</p>
  <div style="text-align:center;margin:1.5rem 0">
    <a href="https://lagosworld.app/jewelry" style="display:inline-block;padding:.85rem 2.5rem;background:#1a1a1a;color:#fff;text-decoration:none;font-size:.75rem;letter-spacing:.3em;text-transform:uppercase;font-family:Montserrat,sans-serif">Complete My Order →</a>
  </div>
  <p style="font-size:.72rem;color:#a09890;text-align:center;font-style:italic">"She is clothed with strength and dignity" — Proverbs 31:25</p>
  <hr style="border:none;border-top:1px solid #e8e4dc;margin:1rem 0">
  <p style="font-size:.65rem;color:#a09890;text-align:center">Lagos Jewelry · Philadelphia, PA · +12156262345</p>
</div></body></html>`;

      try {
        await transporter.sendMail({
          from,
          to: abandon.customer_email,
          subject: `${firstName}, your Lagos Jewelry cart is waiting ✦`,
          html
        });
        sent++;
        // Log in email_logs
        await req.supabase.from('email_logs').insert([{
          recipient: abandon.customer_email,
          subject: `Abandoned cart recovery`,
          type: 'cart_recovery',
          related_id: abandon.id,
          status: 'sent'
        }]);
      } catch (mailErr) {
        console.error('Abandoned cart email failed:', mailErr.message);
        failed++;
      }
    }

    console.log(`Abandoned cart cron: ${toRecover.length} candidates, ${sent} sent, ${failed} failed`);
    res.json({ ok: true, candidates: toRecover.length, sent, failed });
  } catch (err) {
    console.error('Abandoned cart cron error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Catalog Sync ──────────────────────────────────────────────────────────────
// GET /api/cron/sync-catalog
// Runs every Monday 9am ET via Vercel Cron. Protected by CRON_SECRET.
//
// Strategy:
//   NEW products  → insert (stock initialized from Conecta Venda variacao_estoque)
//   EXISTING SKUs → update catalog data (name, price, images, category, active)
//                   BUT preserve `stock_qty` (managed by invoice uploads + purchases)
//   SKU is the permanent identifier — never changes, never duplicated
//   Changelog stored in catalog_sync_log table for audit trail
router.get('/sync-catalog', async (req, res) => {
  if (!cronAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const CATALOG_TOKEN = process.env.CONECTA_TOKEN;
  const API_BASE      = 'https://dados.conectavenda.com.br/api';
  if (!CATALOG_TOKEN) {
    return res.status(500).json({ ok: false, error: 'CONECTA_TOKEN env var not set' });
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
      // 2-level variations: variacao_descricao = banho/cor (e.g. "Ródio Branco"),
      // variacao_subvariacao = distinguishing attribute (stone). Combine so options
      // stay distinct instead of collapsing to one repeated desc.
      const base = (v.variacao_descricao || '').trim();
      const sub  = (v.variacao_subvariacao || '').trim();
      vars.push({
        id:    v.variacao_id,
        desc:  sub ? (base ? `${base} — ${sub}` : sub) : base,
        price: p,
        stock: v.variacao_estoque ?? null,  // initial stock from supplier (used only on insert)
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

  const runAt = new Date().toISOString();

  try {
    // 1. Open session with Conecta Venda
    const sessRes = await fetch(`${API_BASE}/cliente/iniciar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'conecta-session': '' },
      body: JSON.stringify({ catalogo: CATALOG_TOKEN })
    });
    const session = sessRes.headers.get('conecta-session');
    if (!session) throw new Error('No Conecta Venda session token');

    // 2. Fetch full catalog (paginated up to 2000 items)
    let allRaw = [];
    for (let page = 1; page <= 4; page++) {
      const catRes = await fetch(`${API_BASE}/produtos/listar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'conecta-session': session },
        body: JSON.stringify({ catalogo: CATALOG_TOKEN, pagina: page, limite: 500 })
      });
      const batch = await catRes.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      allRaw = allRaw.concat(batch);
      if (batch.length < 500) break; // last page
    }
    if (!allRaw.length) throw new Error('Empty catalog response');

    // Deduplicate by produto_id (supplier can return dupes)
    const seen = new Map();
    for (const p of allRaw) if (p.produto_id && !seen.has(p.produto_id)) seen.set(p.produto_id, p);
    const unique = [...seen.values()];

    // 3. Load existing products from DB (sku → row)
    const { data: existing, error: dbErr } = await req.supabase
      .from('jewelry_products')
      .select('id, sku, source_id, name, min_price, max_price, images, active, stock_qty')
      .limit(3000);
    if (dbErr) throw dbErr;

    const bySkuMap = new Map((existing || []).map(r => [r.sku, r]));

    // 4. Split into new vs update
    const transformed = unique.map(transformProduct).filter(p => p.sku);
    const toInsert = [];
    const toUpdate = [];

    for (const p of transformed) {
      const existing = bySkuMap.get(p.sku);
      if (!existing) {
        // Brand new product — init stock from Conecta Venda
        const totalStock = p.variations.reduce((s, v) => s + (v.stock || 0), 0);
        toInsert.push({ ...p, stock_qty: totalStock, sort_order: 0, new_arrival: true });
      } else {
        // Existing — update catalog fields but PRESERVE stock_qty
        const changed = (
          existing.name !== p.name ||
          Math.abs((existing.min_price || 0) - p.min_price) > 0.01 ||
          (existing.images?.[0] || '') !== (p.images?.[0] || '') ||
          existing.active !== p.active
        );
        if (changed) {
          toUpdate.push({
            sku:          p.sku,        // match key
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
            // stock_qty intentionally OMITTED — preserved from DB
          });
        }
      }
    }

    // 4b. Self-host images for NEW products: download from the supplier CDN and
    // upload to Supabase Storage, so the catalog never depends on the supplier
    // CDN (established image rule). Falls back to the CDN url on any failure.
    const SB_URL = process.env.SUPABASE_URL;
    async function selfHostImages(urls) {
      const out = [];
      for (const url of (urls || [])) {
        if (!url) continue;
        if (!url.includes('conectavenda')) { out.push(url); continue; }
        try {
          const path = 'catalog/' + url.split('/').pop().split('?')[0];
          const dl = await fetch(url);
          if (!dl.ok) { out.push(url); continue; }
          const buf = Buffer.from(await dl.arrayBuffer());
          const ctype = dl.headers.get('content-type') || 'image/webp';
          const { error } = await req.supabase.storage.from('jewelry-images')
            .upload(path, buf, { contentType: ctype, upsert: true });
          out.push(error ? url : `${SB_URL}/storage/v1/object/public/jewelry-images/${path}`);
        } catch { out.push(url); }
      }
      return out;
    }
    for (const p of toInsert) {
      const hosted = await selfHostImages(p.images);
      p.images      = hosted;
      p.img_primary = hosted[0] || '';
      p.img_hover   = hosted[1] || hosted[0] || '';
    }

    // 5. Insert new products (batch of 50)
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += 50) {
      const { error } = await req.supabase.from('jewelry_products').insert(toInsert.slice(i, i + 50));
      if (!error) inserted += Math.min(50, toInsert.length - i);
      else console.error('[sync-catalog] Insert error:', error.message);
    }

    // 6. Update existing products (one at a time to preserve stock_qty)
    let updated = 0, updateFailed = 0;
    for (const p of toUpdate) {
      const { error } = await req.supabase
        .from('jewelry_products')
        .update(p)
        .eq('sku', p.sku);
      if (!error) updated++;
      else { updateFailed++; console.error('[sync-catalog] Update error:', error.message, 'SKU:', p.sku); }
    }

    // 7. Log this sync run
    const syncLog = {
      ran_at:        runAt,
      catalog_total: unique.length,
      db_before:     existing?.length || 0,
      inserted,
      updated,
      update_failed: updateFailed,
      new_skus:      toInsert.map(p => p.sku),
      updated_skus:  toUpdate.map(p => p.sku),
    };
    await req.supabase.from('catalog_sync_log').insert([syncLog]).then(({ error }) => {
      if (error) console.warn('[sync-catalog] Log insert failed (non-fatal):', error.message);
    });

    const summary = {
      ok: true, timestamp: runAt,
      catalogTotal: unique.length,
      dbBefore: existing?.length || 0,
      inserted, updated, updateFailed,
      newProducts:     toInsert.map(p => ({ sku: p.sku, name: p.name, category: p.category, stock_qty: p.stock_qty })),
      updatedProducts: toUpdate.map(p => ({ sku: p.sku, name: p.name })),
    };
    // 8. Email the weekly catalog update to the owners (only when something changed).
    // Awaited before responding — Vercel freezes the function after res.json().
    if (inserted > 0 || updated > 0) {
      try {
        const recipients = 'dayanelago22@gmail.com, admin.lagosworld@gmail.com';
        const newRows = toInsert.length
          ? toInsert.map(p => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${p.sku}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${p.name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${p.category}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">$${Number(p.min_price||0).toFixed(2)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${p.stock_qty||0}</td></tr>`).join('')
          : '<tr><td colspan="5" style="padding:10px;color:#888">No new products this week.</td></tr>';
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#222">
            <h2 style="color:#b8922e">Lagos Jewelry — Weekly Catalog Update</h2>
            <p>${new Date(runAt).toLocaleString('en-US')}</p>
            <p><strong>${inserted}</strong> new products · <strong>${updated}</strong> updated · ${unique.length} total in supplier catalog.</p>
            <h3 style="color:#b8922e;margin-top:20px">New Products (${inserted})</h3>
            <table style="border-collapse:collapse;width:100%;font-size:13px">
              <thead><tr style="background:#faf6ec">
                <th style="padding:6px 10px;text-align:left">SKU</th><th style="padding:6px 10px;text-align:left">Name</th>
                <th style="padding:6px 10px;text-align:left">Category</th><th style="padding:6px 10px;text-align:left">Price</th>
                <th style="padding:6px 10px">Stock</th>
              </tr></thead>
              <tbody>${newRows}</tbody>
            </table>
            <p style="margin-top:18px;font-size:12px;color:#888">New items publish automatically per the New Hot / New Arrival rules. ${updated} existing products had catalog fields refreshed (stock preserved).</p>
          </div>`;
        await sendEmail(recipients, `Lagos Jewelry — Weekly Catalog Update (${inserted} new, ${updated} updated)`, html);
        console.log('[sync-catalog] Notification email sent to owners');
      } catch (e) {
        console.error('[sync-catalog] Notification email failed (non-fatal):', e.message);
      }
    }

    console.log(`[sync-catalog] Done: ${inserted} inserted, ${updated} updated, ${updateFailed} failed`);
    return res.json(summary);

  } catch (err) {
    console.error('[sync-catalog] Error:', err.message);
    // Log failed run
    await req.supabase.from('catalog_sync_log').insert([{
      ran_at: runAt, error: err.message, ok: false
    }]).catch(() => {});
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── PDF Invoice → Stock Update ────────────────────────────────────────────────
// POST /api/cron/invoice-stock
// Upload an invoice PDF or JSON line items to update stock levels.
// Each line: { sku, qty } — ADDS to stock_qty in jewelry_products
// Also deducts happen automatically in the checkout flow on each purchase.
//
// Body: { items: [{ sku: "REF123", qty: 5 }, ...], invoice_ref: "NF-001" }
// Auth: CRON_SECRET header or query param
router.post('/invoice-stock', async (req, res) => {
  if (!cronAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { items, invoice_ref } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array required: [{ sku, qty }]' });
  }

  const results = [];
  for (const { sku, qty } of items) {
    if (!sku || !qty || qty <= 0) continue;

    // Fetch current stock
    const { data: row, error: fetchErr } = await req.supabase
      .from('jewelry_products')
      .select('id, sku, stock_qty')
      .eq('sku', sku)
      .single();

    if (fetchErr || !row) {
      results.push({ sku, status: 'not_found' });
      continue;
    }

    const newStock = (row.stock_qty || 0) + qty;
    const { error: updateErr } = await req.supabase
      .from('jewelry_products')
      .update({ stock_qty: newStock, updated_at: new Date().toISOString() })
      .eq('sku', sku);

    if (updateErr) {
      results.push({ sku, status: 'error', error: updateErr.message });
    } else {
      results.push({ sku, status: 'updated', prev_stock: row.stock_qty || 0, new_stock: newStock, added: qty });
    }
  }

  // Log the invoice stock update
  await req.supabase.from('stock_updates').insert([{
    invoice_ref: invoice_ref || null,
    items:       items,
    results:     results,
    updated_at:  new Date().toISOString()
  }]).catch(() => {});

  const updated = results.filter(r => r.status === 'updated').length;
  console.log(`[invoice-stock] ${invoice_ref || 'manual'}: ${updated}/${items.length} SKUs updated`);
  res.json({ ok: true, invoice_ref, updated, total: items.length, results });
});

// ── Manual email dispatch ─────────────────────────────────────────────────────
// POST /api/cron/send  { type, to, name }
// type: welcome | care | crosssell | review | referral | vip | gift | brand
router.post('/send', async (req, res) => {
  if (!cronAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { type, to, name } = req.body;
  if (!type || !to) return res.status(400).json({ error: 'type and to required' });

  const firstName = (name || to.split('@')[0]).split(' ')[0];

  const templates = {
    // ── Jewelry ──────────────────────────────────────────────────────────────
    welcome:    { html: t.welcome(firstName),            subject: '✦ LW ✦ Welcome to Lagos World — Your Jewelry Journey Begins' },
    care:       { html: t.jewelryCare(firstName),        subject: 'LW · How to keep your jewelry beautiful for longer' },
    crosssell:  { html: t.crossSell(firstName),          subject: 'LW · Complete your look with these matching pieces' },
    review:     { html: t.reviewRequest(firstName),      subject: 'LW · How did you feel wearing your Lagos Jewelry piece?' },
    referral:   { html: t.referral(firstName),           subject: 'LW · Share Lagos Jewelry with a woman you love' },
    vip:        { html: t.vipInvitation(firstName),      subject: '✦ LW ✦ You have been invited to the Lagos VIP Circle' },
    gift:       { html: t.giftCampaign(firstName),       subject: 'LW · The perfect gift for the woman in your life' },
    brand:      { html: t.brandStory(firstName),         subject: 'LW · The story behind every Lagos piece' },
    firstoffer: { html: t.firstPurchaseOffer(firstName), subject: 'LW · A special welcome offer — just for you' },
    // ── Cleaning — full 12-template funnel ───────────────────────────────────
    clean_welcome:      { html: ct.welcomeLead(firstName),          subject: 'Welcome to Lagos Cleaning — your free quote is one step away' },
    clean_firstoffer:   { html: ct.firstTimeOffer(firstName),       subject: 'Claim 15% OFF your first cleaning with LAGOS15' },
    clean_trust:        { html: ct.trustBuilder(firstName),         subject: 'Why homeowners in PA & NJ trust Lagos Cleaning' },
    clean_education:    { html: ct.deepCleaningEdu(firstName),      subject: 'Regular cleaning vs. deep cleaning: which one do you need?' },
    clean_powerwash:    { html: ct.powerWashElite(firstName),       subject: 'Your driveway, patio or deck may need this' },
    clean_estimate:     { html: ct.estimateFollowup(firstName),     subject: 'Do you want us to hold your quote?' },
    clean_sameweek:     { html: ct.sameWeekBooking(firstName),      subject: 'We still have limited cleaning spots this week' },
    clean_objection:    { html: ct.objectionBreaker(firstName),     subject: 'Still thinking about it? Here is what to know first' },
    clean_postservice:  { html: ct.postServiceCare(firstName),      subject: 'Your Lagos Cleaning service is complete' },
    clean_review:       { html: ct.reviewRequest(firstName),        subject: 'How did we do?' },
    clean_referral:     { html: ct.referralProgram(firstName),      subject: 'Give 10%, get $25 credit' },
    clean_recurring:    { html: ct.recurringCleaning(firstName),    subject: 'Want to keep your home clean every month?' },
    // Legacy aliases
    clean_confirmed:    { html: ct.welcomeLead(firstName),          subject: '✔ Lagos Cleaning · Your request is confirmed' },
    clean_followup:     { html: ct.estimateFollowup(firstName),     subject: 'Lagos Cleaning · Following up on your quote' },
    clean_reengagement: { html: ct.sameWeekBooking(firstName),      subject: 'Lagos Cleaning · Spots still available this week' },
  };

  const tpl = templates[type.toLowerCase()];
  if (!tpl) return res.status(400).json({ error: `Unknown type. Use: ${Object.keys(templates).join(', ')}` });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    const from = `"Lagos World" <${process.env.EMAIL_USER}>`;
    await transporter.sendMail({ from, to, subject: tpl.subject, html: tpl.html });
    console.log(`Manual email sent: ${type} → ${to}`);
    res.json({ ok: true, type, to });
  } catch (err) {
    console.error('Manual email error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
