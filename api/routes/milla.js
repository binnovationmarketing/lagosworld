/**
 * milla.js — Milla agent API routes
 * POST /api/milla/chat   — web widget
 * POST /api/milla/sms    — Twilio webhook (ready for SMS automation)
 */
const express = require('express');
const router  = express.Router();
const { processMessage } = require('../services/milla');

// ── Web widget ────────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { message, sessionId, channel } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'message required' });
  if (!sessionId)                   return res.status(400).json({ error: 'sessionId required' });

  try {
    const reply = await processMessage(req.supabase, sessionId, message.trim(), channel || 'web');
    res.json({ ok: true, reply });
  } catch (err) {
    const detail = err?.message || String(err);
    console.error('Milla chat error:', detail, err?.status, err?.errorDetails);
    const noKey  = !process.env.GEMINI_API_KEY;
    const userMsg = noKey
      ? 'GEMINI_API_KEY não configurada no Vercel.'
      : `Milla indisponível: ${detail.slice(0,120)}`;
    res.status(500).json({ error: userMsg, detail });
  }
});

// ── Twilio SMS webhook ────────────────────────────────────────────────────────
// When you get a Twilio number: set SMS webhook → POST https://lagosworld.app/api/milla/sms
router.post('/sms', async (req, res) => {
  const { Body: message, From: phone } = req.body;
  if (!message || !phone) return res.status(400).send('');

  const sessionId = 'sms_' + phone.replace(/\D/g, '');
  try {
    const reply = await processMessage(req.supabase, sessionId, message, 'sms');
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(reply)}</Message></Response>`);
  } catch(err) {
    console.error('Milla SMS error:', err);
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Desculpe, estou com dificuldades técnicas. Ligue para +1 (215) 626-2345 ou acesse lagosworld.app</Message></Response>`);
  }
});

// ── WhatsApp webhook (Meta Cloud API / Twilio WhatsApp — future) ──────────────
router.post('/whatsapp', async (req, res) => {
  // Verification handshake (Meta)
  if (req.query['hub.mode'] === 'subscribe') {
    return res.send(req.query['hub.challenge']);
  }
  const entry   = req.body?.entry?.[0];
  const change  = entry?.changes?.[0];
  const msg     = change?.value?.messages?.[0];
  if (!msg) return res.json({ ok: true });

  const phone   = msg.from;
  const message = msg.text?.body || msg.interactive?.button_reply?.title || '';
  if (!message) return res.json({ ok: true });

  const sessionId = 'wa_' + phone;
  try {
    // Reply would be sent via Meta API (implement when WhatsApp Business approved)
    await processMessage(req.supabase, sessionId, message, 'whatsapp');
  } catch(err) {
    console.error('Milla WhatsApp error:', err);
  }
  res.json({ ok: true }); // Always 200 to Meta
});

function escapeXml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

module.exports = router;
