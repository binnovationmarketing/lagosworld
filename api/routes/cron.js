/**
 * cron.js — Daily email queue processor + manual email dispatch
 * Vercel Cron calls GET /api/cron/emails every day at 9am ET
 */
const express = require('express');
const router = express.Router();
const { processDueEmails } = require('../services/email');
const nodemailer = require('nodemailer');
const t  = require('../services/emailTemplates');
const ct = require('../services/cleaningEmailTemplates');

router.get('/emails', async (req, res) => {
  // Basic auth: only Vercel cron (or CRON_SECRET header) can trigger
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
// GET /api/cron/sync-catalog — fetches Estação 79 catalog, inserts new products
// Runs daily at 9am via Vercel Cron. Protected by CRON_SECRET.
router.get('/sync-catalog', async (req, res) => {
  const secret = req.headers['x-cron-secret'] || req.headers['authorization']?.replace('Bearer ','') || req.query.secret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const CATALOG_TOKEN = '2441f464b56e9641d86b2772287d13d5';
  const API_BASE      = 'https://dados.conectavenda.com.br/api';

  function mapCategory(g = '') {
    g = g.toUpperCase();
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
      vars.push({ id: v.variacao_id, desc: v.variacao_descricao || '', price: p, stock: v.variacao_estoque ?? null, active: v.variacao_ativo !== 0, order: v.variacao_ordem || 0 });
    }
    const imgs = raw.produto_imagens || [];
    return {
      id:           raw.produto_id,
      source_id:    raw.produto_id,
      sku:          (raw.produto_referencia || '').trim(),
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
      sort_order:   0,
      updated_at:   new Date().toISOString()
    };
  }

  try {
    // 1. Open session
    const sessRes = await fetch(`${API_BASE}/cliente/iniciar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'conecta-session': '' },
      body: JSON.stringify({ catalogo: CATALOG_TOKEN })
    });
    const session = sessRes.headers.get('conecta-session');
    if (!session) throw new Error('No Conecta Venda session token');

    // 2. Fetch catalog
    const catRes  = await fetch(`${API_BASE}/produtos/listar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'conecta-session': session },
      body: JSON.stringify({ catalogo: CATALOG_TOKEN, pagina: 1, limite: 1000 })
    });
    const rawItems = await catRes.json();
    if (!Array.isArray(rawItems)) throw new Error(`Unexpected catalog response: ${JSON.stringify(rawItems).slice(0,200)}`);

    // Deduplicate by produto_id
    const seen = new Map();
    for (const p of rawItems) if (p.produto_id && !seen.has(p.produto_id)) seen.set(p.produto_id, p);
    const unique = [...seen.values()];

    // 3. Compare with DB
    const { data: existing } = await req.supabase.from('jewelry_products').select('source_id, sku').limit(2000);
    const existingIds  = new Set((existing || []).map(r => r.source_id).filter(Boolean));
    const existingSkus = new Set((existing || []).map(r => r.sku).filter(Boolean));

    const transformed = unique.map(transformProduct);
    const newProducts = transformed.filter(p => p.source_id && !existingIds.has(p.source_id) && !existingSkus.has(p.sku));

    // 4. Insert new products
    let inserted = 0;
    for (let i = 0; i < newProducts.length; i += 50) {
      const { error } = await req.supabase.from('jewelry_products').insert(newProducts.slice(i, i + 50));
      if (!error) inserted += Math.min(50, newProducts.length - i);
      else console.error('[sync-catalog] Insert error:', error.message);
    }

    const summary = {
      ok: true, timestamp: new Date().toISOString(),
      catalogTotal: unique.length, dbBefore: existing?.length || 0,
      inserted, newProducts: newProducts.map(p => ({ sku: p.sku, name: p.name, category: p.category }))
    };
    console.log(`[sync-catalog] Done: ${inserted} inserted, ${unique.length} in catalog`);
    return res.json(summary);

  } catch (err) {
    console.error('[sync-catalog] Error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Manual email dispatch ─────────────────────────────────────────────────────
// POST /api/cron/send  { type, to, name }
// type: welcome | care | crosssell | review | referral | vip | gift | brand
router.post('/send', async (req, res) => {
  const secret = req.headers['x-cron-secret'] || req.query.secret || req.body.secret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
