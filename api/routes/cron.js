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
    // ── Cleaning ─────────────────────────────────────────────────────────────
    clean_confirmed:    { html: ct.cleaningConfirmed(firstName),    subject: '✔ Lagos Cleaning · Your request is confirmed' },
    clean_followup:     { html: ct.cleaningFollowup24h(firstName),  subject: 'Lagos Cleaning · Did you get our message?' },
    clean_reengagement: { html: ct.cleaningReengagement(firstName), subject: 'Lagos Cleaning · Your home deserves the best' },
    clean_review:       { html: ct.cleaningReview(firstName),       subject: 'Lagos Cleaning · How was your experience?' },
    clean_referral:     { html: ct.cleaningReferral(firstName),     subject: 'Lagos Cleaning · Know someone who needs a clean home?' },
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
