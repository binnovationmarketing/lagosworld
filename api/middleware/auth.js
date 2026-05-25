/**
 * auth.js — JWT middleware for admin-protected routes
 *
 * Usage:
 *   const { requireAdmin } = require('../middleware/auth');
 *   router.put('/overrides/:id', requireAdmin, handler);
 *
 * Token obtained via: POST /api/admin/auth { password }
 * Token sent as:      Authorization: Bearer <token>
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error('JWT_SECRET env var not set');
  return s;
};

/**
 * Middleware: require valid admin JWT in Authorization header.
 * Returns 401 if missing/invalid/expired.
 */
function requireAdmin(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Admin token required. POST /api/admin/auth to get one.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET());
    if (payload.role !== 'admin') throw new Error('Not admin');
    req.adminPayload = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Re-authenticate via /api/admin/auth.' });
  }
}

/**
 * Sign a new admin JWT (12h expiry).
 * Called from POST /api/admin/auth after password check.
 */
function signAdminToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET(), { expiresIn: '12h' });
}

module.exports = { requireAdmin, signAdminToken };
