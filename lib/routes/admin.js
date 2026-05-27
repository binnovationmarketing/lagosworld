/**
 * admin.js — Admin authentication route
 *
 * POST /api/admin/auth
 *   Body: { password: string }
 *   Returns: { token: string }  (JWT, 12h expiry)
 *
 * Password stored in ADMIN_PASSWORD env var (never in client HTML).
 * Token stored in sessionStorage on client — expires when tab closes.
 */
const express = require('express');
const router = express.Router();
const { signAdminToken } = require('../middleware/auth');

router.post('/auth', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required.' });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error('ADMIN_PASSWORD env var not set');
    return res.status(500).json({ error: 'Server misconfiguration.' });
  }

  // Constant-time comparison to prevent timing attacks
  const crypto = require('crypto');
  const a = Buffer.from(password);
  const b = Buffer.from(expected);

  // timingSafeEqual requires same length — pad to max length
  const len = Math.max(a.length, b.length);
  const aBuf = Buffer.alloc(len); a.copy(aBuf);
  const bBuf = Buffer.alloc(len); b.copy(bBuf);

  let match = false;
  try { match = crypto.timingSafeEqual(aBuf, bBuf) && a.length === b.length; }
  catch { match = false; }

  if (!match) {
    // Same response time on failure to prevent user enumeration
    return res.status(401).json({ error: 'Invalid password.' });
  }

  const token = signAdminToken();
  res.json({ ok: true, token, expiresIn: '12h' });
});

module.exports = router;
