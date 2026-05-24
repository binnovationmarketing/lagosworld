/**
 * cron.js — Daily email queue processor + manual email dispatch
 * Vercel Cron calls GET /api/cron/emails every day at 9am ET
 */
const express = require('express');
const router = express.Router();
const { processDueEmails } = require('../services/email');
const nodemailer = require('nodemailer');
const t = require('../services/emailTemplates');

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
    welcome:    { html: t.welcome(firstName),            subject: '✝ Bem-vinda à Lagos — sua joia especial espera por você' },
    care:       { html: t.jewelryCare(firstName),        subject: 'How to keep your jewelry beautiful for longer' },
    crosssell:  { html: t.crossSell(firstName),          subject: 'Complete your look with these matching pieces' },
    review:     { html: t.reviewRequest(firstName),      subject: 'How did you feel wearing your Lagos Jewelry piece?' },
    referral:   { html: t.referral(firstName),           subject: 'Share Lagos Jewelry with a woman you love' },
    vip:        { html: t.vipInvitation(firstName),      subject: '✝ You\'ve been invited to the Lagos VIP Circle' },
    gift:       { html: t.giftCampaign(firstName),       subject: 'The perfect gift for the woman in your life' },
    brand:      { html: t.brandStory(firstName),         subject: 'The story behind every Lagos piece' },
    firstoffer: { html: t.firstPurchaseOffer(firstName), subject: 'A special offer — just for you' },
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
