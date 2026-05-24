require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jewelryRoutes = require('./routes/jewelry');
const cleaningRoutes = require('./routes/cleaning');
const coursesRoutes = require('./routes/courses');
const { sendEmail } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/cleaning', cleaningRoutes);
app.use('/api/courses', coursesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lagos Platform API running' });
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
const nodemailer = require('nodemailer');

app.post('/api/send-order', async (req, res) => {
  const { name, phone, email, address, zip, city, state, payment,
          items, total, shipping, deliveryType, zelle_proof, notes } = req.body;

  if (!email && !phone) return res.status(400).json({ error: 'email or phone required' });

  // ── 1. Build email HTML ────────────────────────────────────────────────────
  const itemRows = (items || []).map(i =>
    `<tr><td style="padding:6px 12px">${i.name} ${i.variant ? '('+i.variant+')' : ''} ×${i.qty}</td><td style="padding:6px 12px;text-align:right">$${(i.price*i.qty).toFixed(2)}</td></tr>`
  ).join('');

  const payInfo = payment === 'zelle'
    ? `<p><strong>💸 Zelle:</strong> +1 (215) 626-2345 — Dayane Lago<br>Send proof to: dayane@lagosjewelry.com</p>`
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
  <p style="font-size:.7rem;color:#8a8070;text-align:center">Lagos Jewelry · Philadelphia, PA · +1 (215) 626-2345</p>
</div></body></html>`;

  // ── 2. Save order to Supabase (non-blocking) ───────────────────────────────
  try {
    const subtotal = Number(total) - Number(shipping || 0);
    const { data: orderData, error: orderErr } = await supabase
      .from('jewelry_orders')
      .insert([{
        customer_name:  name,
        customer_email: email  || '',
        customer_phone: phone  || '',
        delivery_method: deliveryType || payment || 'standard',
        address,
        city:    city  || '',
        state:   state || '',
        zip:     zip   || '',
        payment_method:  payment || '',
        shipping_cost:   Number(shipping) || 0,
        subtotal:        subtotal > 0 ? subtotal : Number(total) || 0,
        total:           Number(total)    || 0,
        status: 'pending',
        notes:  notes || ''
      }])
      .select('id')
      .single();

    if (!orderErr && orderData?.id) {
      // Insert line items into order_items
      const lineItems = (items || []).map(i => ({
        order_id:     orderData.id,
        product_name: i.name,
        variant_desc: i.variant || '',
        quantity:     Number(i.qty) || 1,
        unit_price:   Number(i.price) || 0
        // line_total is GENERATED ALWAYS — omit from insert
      }));
      if (lineItems.length > 0) {
        await supabase.from('order_items').insert(lineItems);
      }
    } else if (orderErr) {
      console.error('DB order save failed:', orderErr.message);
    }
  } catch (dbErr) {
    console.error('DB save exception:', dbErr.message);
  }

  // ── 3. Respond immediately — email is fire-and-forget ──────────────────────
  res.json({ ok: true, message: 'Order confirmed. Check your email!' });

  // ── 4. Send emails non-blocking ────────────────────────────────────────────
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const attachments = [];
    if (zelle_proof) {
      const matches = zelle_proof.match(/^data:(.+);base64,(.+)$/);
      if (matches) attachments.push({ filename: 'zelle_proof.jpg', content: matches[2], encoding: 'base64' });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: ['binnovationmarketing@gmail.com', 'dayanelago22@gmail.com'],
      subject: `COMPRA REALIZADA LAGOS WORLD - ${name}`,
      html, attachments
    });

    if (email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `✝ Pedido Confirmado — Lagos Jewelry — ${name}`,
        html
      });
    }
  } catch (mailErr) {
    console.error('Email failed (order already saved):', mailErr.message);
  }
});
