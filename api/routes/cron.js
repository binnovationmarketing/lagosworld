/**
 * cron.js — Daily email queue processor
 * Vercel Cron calls GET /api/cron/emails every day at 9am ET
 */
const express = require('express');
const router = express.Router();
const { processDueEmails } = require('../services/email');

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

module.exports = router;
