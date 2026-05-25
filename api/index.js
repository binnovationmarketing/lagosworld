require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const jewelryRoutes  = require('./routes/jewelry');
const cleaningRoutes = require('./routes/cleaning');
const coursesRoutes  = require('./routes/courses');
const cronRoutes     = require('./routes/cron');
const adminRoutes    = require('./routes/admin');
const { sendEmail }  = require('./services/email');

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
    // Allow requests with no origin (Vercel cron, curl, Postman)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
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
app.use('/api/send-order', strictLimiter);
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
    const { sendEmail } = require('./services/email');
    const { FROM } = require('./services/email');
    const nodemailer = require('nodemailer');
    const t = require('./services/emailTemplates');

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

// Order email confirmation
const { sendOrderEmails } = require('./services/email');

app.post('/api/send-order',
  body('name').notEmpty().trim().isLength({ max: 200 }).escape().withMessage('Name required'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Invalid email'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('address').optional().trim().isLength({ max: 500 }).escape(),
  body('total').isNumeric().withMessage('Total must be a number'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  async (req, res) => {
  if (!validate(req, res)) return;
  const { name, phone, email, address, zip, city, state, payment,
          items, total, shipping, deliveryType, zelle_proof, notes } = req.body;

  if (!email && !phone) return res.status(400).json({ error: 'email or phone required' });

  // ── 1. Build email HTML ────────────────────────────────────────────────────
  const itemRows = (items || []).map(i =>
    `<tr><td style="padding:6px 12px">${i.name} ${i.variant ? '('+i.variant+')' : ''} ×${i.qty}</td><td style="padding:6px 12px;text-align:right">$${(i.price*i.qty).toFixed(2)}</td></tr>`
  ).join('');

  const payInfo = payment === 'zelle'
    ? `<p><strong>💸 Zelle:</strong> +1 (215) 626-2345 — Dayane Lago<br>Send proof via WhatsApp: <strong>+1 (215) 626-2345</strong> or email: binnovationmarketing@gmail.com</p>`
    : `<p><strong>💵 Cash:</strong> ${deliveryType === 'local' ? 'Same city — 4h delivery ($10 fee)' : 'Outside city — 6h delivery ($20 fee)'}</p>`;

  const html = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf6ee;padding:20px">
<div style="max-width:580px;margin:0 auto;background:#111;color:#e4ddd0;padding:2rem;border:1px solid rgba(201,168,76,.3)">
  <div style="text-align:center;margin-bottom:1.5rem">
    <div style="font-size:2rem;color:#c9a84c;font-family:Georgia,serif;letter-spacing:.3em">✝ Lagos Jewelry</div>
    <div style="font-size:.75rem;color:#8a8070;letter-spacing:.3em">ORDER CONFIRMATION</div>
  </div>
  <p style="color:#c9a84c;font-size:.85rem;margin-bottom:.5rem">Proverbs 31:25 — "She is clothed with strength and dignity"</p>
  <hr style="border:none;border-top:1px solid rgba(201,168,76,.2);margin:1rem 0">
  <p><strong>Customer:</strong> ${name}</p>
  <p><strong>Phone:</strong> ${phone || '—'}</p>
  <p><strong>Email:</strong> ${email || '—'}</p>
  <p><strong>Ship to:</strong> ${address}, ${city}, ${state} ${zip}</p>
  <hr style="border:none;border-top:1px solid rgba(201,168,76,.2);margin:1rem 0">
  <table style="width:100%;font-size:.85rem">${itemRows}</table>
  <hr style="border:none;border-top:1px solid rgba(201,168,76,.2);margin:.5rem 0">
  <p style="text-align:right"><strong>Shipping:</strong> ${shipping === 0 ? '🎉 FREE' : '$'+Number(shipping).toFixed(2)}</p>
  <p style="text-align:right;font-size:1.2rem;color:#c9a84c"><strong>TOTAL: $${Number(total).toFixed(2)}</strong></p>
  ${payInfo}
  ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
  ${zelle_proof ? `<p><strong>Zelle proof attached.</strong></p>` : ''}
  <hr style="border:none;border-top:1px solid rgba(201,168,76,.2);margin:1rem 0">
  <p style="font-size:.7rem;color:#8a8070;text-align:center">Lagos Jewelry · Philadelphia, PA · +12156262345 · binnovationmarketing@gmail.com</p>
</div></body></html>`;

  // ── 2. Save order to Supabase ─────────────────────────────────────────────
  let orderId = null;
  try {
    const subtotal = Number(total) - Number(shipping || 0);
    const { data: orderData, error: orderErr } = await supabase
      .from('jewelry_orders')
      .insert([{
        customer_name:   name,
        customer_email:  email  || '',
        customer_phone:  phone  || '',
        delivery_method: deliveryType || payment || 'standard',
        address,
        city:            city  || '',
        state:           state || '',
        zip:             zip   || '',
        payment_method:  payment || '',
        shipping_cost:   Number(shipping) || 0,
        subtotal:        subtotal > 0 ? subtotal : Number(total) || 0,
        total:           Number(total) || 0,
        status:          'pending',
        notes:           notes || ''
      }])
      .select('id')
      .single();

    if (!orderErr && orderData?.id) {
      orderId = orderData.id;
      const lineItems = (items || []).map(i => ({
        order_id:     orderId,
        product_name: i.name,
        variant_desc: i.variant || '',
        quantity:     Number(i.qty) || 1,
        unit_price:   Number(i.price) || 0
        // line_total is GENERATED ALWAYS — omit
      }));
      if (lineItems.length) await supabase.from('order_items').insert(lineItems);
    } else if (orderErr) {
      console.error('DB order save failed:', orderErr.message);
    }
  } catch (dbErr) {
    console.error('DB save exception:', dbErr.message);
  }

  // ── 3. Respond immediately ────────────────────────────────────────────────
  res.json({ ok: true, message: 'Order confirmed. Check your email!' });

  // ── 4. Send premium emails + queue post-purchase sequence (non-blocking) ──
  sendOrderEmails({
    name, phone, email, address, city, state, zip,
    payment, items, total, shipping, deliveryType, notes, orderId
  }, supabase).catch(e => console.error('Email dispatch failed:', e.message));
});
