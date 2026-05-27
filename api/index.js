require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const jewelryRoutes  = require('../lib/routes/jewelry');
const cleaningRoutes = require('../lib/routes/cleaning');
const coursesRoutes  = require('../lib/routes/courses');
const cronRoutes     = require('../lib/routes/cron');
const adminRoutes    = require('../lib/routes/admin');
const millaRoutes    = require('../lib/routes/milla');
const { sendEmail }  = require('../lib/services/email');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// General: 60 req/min per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' }
});

// Strict: 10 req/min for order/contact/subscribe endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please slow down.' }
});

// ── Security Headers (helmet) ─────────────────────────────────────────────────
// Adds X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.
// CSP is permissive for our CDN assets (Google Fonts, Unsplash, Motion.js, WhatsApp)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https:", "blob:"],
      connectSrc:  ["'self'", "https://api.zippopotam.us", "https://wa.me"],
      frameSrc:    ["'self'", "https://www.youtube.com"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false // allow images from external CDNs
}));

// ── CORS — restrict to our domains only ──────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://lagosworld.app',
  'https://www.lagosworld.app',
  'http://localhost:3000',
  'http://localhost:5500', // Live Server for local dev
  'http://127.0.0.1:5500'
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow: no origin (cron/curl), our domains, any Vercel preview of this project
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (/^https:\/\/lagosworld(-[a-z0-9]+-binnovationmarketings-projects)?\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Cron-Secret'],
  credentials: true
}));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' })); // prevent large payload DoS
app.use(generalLimiter); // apply to all routes

// Strict rate limit on transactional endpoints
app.use('/api/jewelry/orders', strictLimiter);
app.use('/api/cleaning/requests', strictLimiter);
app.use('/api/newsletter/subscribe', strictLimiter);
app.use('/api/jewelry/cart-events', rateLimit({ windowMs: 60*1000, max: 120, standardHeaders: true, legacyHeaders: false }));

// Supabase Client — service_role key for backend writes (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_KEY
    || process.env.SUPABASE_ANON_KEY
);

// Attach supabase to request
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Routes
app.use('/api/jewelry',  jewelryRoutes);
app.use('/api/cleaning', cleaningRoutes);
app.use('/api/courses',  coursesRoutes);
app.use('/api/cron',     cronRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/milla',    millaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lagos Platform API running' });
});

// ── Input validation helper ───────────────────────────────────────────────────
function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
}

// Newsletter subscribe — with validation
app.post('/api/newsletter/subscribe',
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('name').optional().trim().isLength({ max: 100 }).escape(),
  body('source').optional().trim().isLength({ max: 50 }).escape(),
  async (req, res) => {
  if (!validate(req, res)) return;
  const { email, name, source } = req.body;
  const cleanEmail = email.toLowerCase().trim();
  const firstName = (name || cleanEmail.split('@')[0]).split(' ')[0];

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert([{
        email: cleanEmail,
        name: name || null,
        source: source || 'website',
        subscribed_at: new Date().toISOString(),
        active: true
      }], { onConflict: 'email' });
    if (error) throw error;
    res.json({ ok: true, message: 'Subscribed!' });

    // Non-blocking: welcome email to subscriber + admin notification
    const { sendEmail } = require('../lib/services/email');
    const { FROM } = require('../lib/services/email');
    const nodemailer = require('nodemailer');
    const t = require('../lib/services/emailTemplates');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      pool: true
    });
    const from = `"Lagos World" <${process.env.EMAIL_USER}>`;

    // Welcome email to subscriber
    transporter.sendMail({
      from, to: cleanEmail,
      subject: '✝ Welcome to Lagos — Your World of Jewelry Begins Here',
      html: t.welcome(firstName)
    }).catch(e => console.error('Newsletter welcome email failed:', e.message));

    // Admin notification
    transporter.sendMail({
      from,
      to: 'binnovationmarketing@gmail.com',
      subject: `📧 New Newsletter Subscriber — ${cleanEmail}`,
      html: `<p><strong>New subscriber:</strong> ${name || '(no name)'} &lt;${cleanEmail}&gt;</p><p><strong>Source:</strong> ${source || 'website'}</p>`
    }).catch(e => console.error('Newsletter admin notify failed:', e.message));

  } catch (err) {
    console.error('Newsletter subscribe error:', err.message);
    res.status(500).json({ error: 'Could not save subscription' });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Local dev: node api/index.js
// Vercel: exports app as serverless function handler
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Lagos Platform API running on port ${PORT}`);
  });
}

module.exports = app;
