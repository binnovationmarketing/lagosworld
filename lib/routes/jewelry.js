const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');
const { sendEmail, sendOrderEmails } = require('../services/email');

// Input validation helper
function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return false; }
  return true;
}

// POST /api/jewelry/orders — unified order handler (web checkout + admin)
// Replaces legacy /api/send-order — accepts both naming conventions
router.post('/orders',
  body('name').optional().trim().isLength({ max: 200 }).escape(),
  body('customer_name').optional().trim().isLength({ max: 200 }).escape(),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('customer_email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('customer_phone').optional().trim().isLength({ max: 30 }),
  body('total').isNumeric().withMessage('Total must be a number'),
  body('items').isArray({ min: 1 }).withMessage('Items required'),
  async (req, res) => {
  if (!validate(req, res)) return;
  try {
    // Accept both naming conventions
    const name  = (req.body.name  || req.body.customer_name  || '').trim();
    const email = (req.body.email || req.body.customer_email || '').trim();
    const phone = (req.body.phone || req.body.customer_phone || '').trim();

    if (!name)           return res.status(400).json({ error: 'Name required' });
    if (!email && !phone) return res.status(400).json({ error: 'email or phone required' });

    const {
      address = '', city = '', state = '', zip = '',
      payment, delivery_method, deliveryType,
      items, total, shipping = 0,
      zelle_proof, notes = ''
    } = req.body;

    const paymentMethod = payment || delivery_method || '';
    const delivMethod   = deliveryType || delivery_method || paymentMethod;
    const subtotal      = Number(total) - Number(shipping);

    const { data, error } = await req.supabase
      .from('jewelry_orders')
      .insert([{
        customer_name:   name,
        customer_email:  email,
        customer_phone:  phone,
        delivery_method: delivMethod,
        address, city, state, zip,
        payment_method:  paymentMethod,
        shipping_cost:   Number(shipping) || 0,
        subtotal:        subtotal > 0 ? subtotal : Number(total) || 0,
        total:           Number(total) || 0,
        status:          'pending',
        notes
      }])
      .select('id')
      .single();

    if (error) throw error;

    const orderId = data?.id || null;

    if (orderId && Array.isArray(items) && items.length > 0) {
      const lineItems = items.map(i => ({
        order_id:     orderId,
        product_name: i.title   || i.name    || '',
        variant_desc: i.variant || i.sku     || '',
        quantity:     Number(i.quantity || i.qty)   || 1,
        unit_price:   Number(i.price) || 0
        // line_total GENERATED ALWAYS — omit
      }));
      await req.supabase.from('order_items').insert(lineItems);
    }

    // Deduct stock for each item (fire-and-forget — order already saved)
    if (orderId && Array.isArray(items) && items.length > 0) {
      const skuItems = items
        .filter(i => i.sku || i.variant)
        .map(i => ({ sku: (i.sku || i.variant || '').trim(), qty: Number(i.quantity || i.qty) || 1 }))
        .filter(i => i.sku);
      if (skuItems.length > 0) {
        req.supabase.from('jewelry_products').select('sku, stock_qty').in('sku', skuItems.map(i => i.sku))
          .then(({ data: rows }) => {
            return Promise.all((rows || []).map(row => {
              const item = skuItems.find(i => i.sku === row.sku);
              if (!item || row.stock_qty === null) return Promise.resolve();
              const newStock = Math.max(0, (row.stock_qty || 0) - item.qty);
              return req.supabase.from('jewelry_products')
                .update({ stock_qty: newStock, updated_at: new Date().toISOString() })
                .eq('sku', row.sku)
                .then(() => req.supabase.from('stock_deductions').insert([{
                  sku: row.sku, qty: item.qty, order_id: String(orderId), customer_email: email || null
                }]));
            }));
          })
          .catch(e => console.error('Stock deduction failed (order saved):', e.message));
      }
    }

    // Send emails before responding — Vercel freezes the function after res.json()
    // so fire-and-forget won't work; email must complete before the response
    try {
      await sendOrderEmails({
        name, phone, email,
        address, city, state, zip,
        payment: paymentMethod,
        deliveryType: delivMethod,
        items: (items || []).map(i => ({
          name:    i.title   || i.name    || '',
          variant: i.variant || i.sku     || '',
          qty:     Number(i.quantity || i.qty) || 1,
          price:   Number(i.price) || 0
        })),
        total, shipping, notes, orderId, zelle_proof
      }, req.supabase);
    } catch (emailErr) {
      // Order is saved — log email failure but don't block the customer response
      console.error('Email failed (order saved):', emailErr.message);
      console.error('Email error detail:', emailErr.responseCode || '', emailErr.response || '', emailErr.code || '');
    }

    res.json({ ok: true, message: 'Order confirmed. Check your email!' });

  } catch (error) {
    console.error('POST /api/jewelry/orders:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET: Listar pedidos
router.get('/orders', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('jewelry_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Update order status
router.patch('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const { data, error } = await req.supabase
      .from('jewelry_orders')
      .update({ status })
      .eq('id', id)
      .select('id, status, customer_name, customer_email')
      .single();
    if (error) throw error;
    res.json({ ok: true, order: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ── Payment proof request ─────────────────────────────────────────────────────
// POST /api/jewelry/request-proof — send email asking customer for Zelle/payment screenshot
router.post('/request-proof', async (req, res) => {
  try {
    const { orderId, email, name } = req.body;
    if (!orderId || !email) return res.status(400).json({ error: 'orderId and email required' });

    const { sendEmail } = require('../services/email');
    const firstName = (name || 'there').split(' ')[0];
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
        <h2 style="color:#b8922e">Lagos World — Payment Confirmation Needed</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for your order! We noticed we are still waiting for your payment proof for order <strong>#${orderId}</strong>.</p>
        <p>Please reply to this email with a <strong>screenshot or photo of your Zelle / payment receipt</strong> so we can process and ship your order right away.</p>
        <p style="margin-top:1.5rem">If you have already sent it, please disregard this message — we will confirm shortly.</p>
        <p>Questions? Just reply to this email.</p>
        <p style="margin-top:2rem;color:#888;font-size:.85em">— Lagos World Team</p>
      </div>`;

    await sendEmail(email, `Payment proof needed — Order #${orderId}`, html);
    res.json({ ok: true });
  } catch (err) {
    console.error('request-proof error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Product overrides (prices, images, description, video) ───────────────────
// GET /api/jewelry/overrides — return all rows
router.get('/overrides', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('product_overrides')
      .select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/jewelry/overrides/:id — upsert one product (admin only)
router.put('/overrides/:id', requireAdmin, async (req, res) => {
  try {
    const product_id = Number(req.params.id);
    const { price_overrides, name, description, images, video_url, sort_order } = req.body;

    // Build only the fields that were actually sent — avoids clobbering untouched columns
    const upsertRow = { product_id, updated_at: new Date().toISOString() };
    if (price_overrides !== undefined) upsertRow.price_overrides = price_overrides;
    if (name        !== undefined) upsertRow.name        = name || null;
    if (description !== undefined) upsertRow.description = description ?? null;
    if (images      !== undefined) upsertRow.images      = images || [];
    if (video_url   !== undefined) upsertRow.video_url   = video_url || null;
    if (sort_order  !== undefined) upsertRow.sort_order  = sort_order ?? null;

    const { data, error } = await req.supabase
      .from('product_overrides')
      .upsert([upsertRow], { onConflict: 'product_id' })
      .select();
    if (error) throw error;
    res.json({ ok: true, data: data?.[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cart Events (abandoned cart recovery) ────────────────────────────────────
// POST /api/jewelry/cart-events — track add/abandon/purchase from frontend
router.post('/cart-events', async (req, res) => {
  try {
    const { type, name, email, phone, items, total, timestamp, ...extra } = req.body;
    if (!type) return res.status(400).json({ error: 'type required' });

    const { error } = await req.supabase
      .from('cart_events')
      .insert([{
        event_type:     type,
        customer_name:  name  || null,
        customer_email: email || null,
        customer_phone: phone || null,
        items:          Array.isArray(items) ? items : [],
        total:          Number(total) || 0,
        extra_data:     Object.keys(extra).length ? extra : {},
        occurred_at:    timestamp || new Date().toISOString()
      }]);

    if (error) {
      console.error('Cart event insert error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Cart event error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jewelry/cart-events — admin: list recent abandon events with email
router.get('/cart-events', async (req, res) => {
  try {
    const { event_type, limit = 100 } = req.query;
    let q = req.supabase
      .from('cart_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(Number(limit));
    if (event_type) q = q.eq('event_type', event_type);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stock API ─────────────────────────────────────────────────────────────────
// GET /api/jewelry/stock — returns { sku: stock_qty } map for all products
// Used by jewelry frontend to show "Unavailable" overlay on out-of-stock items
router.get('/stock', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('jewelry_products')
      .select('sku, stock_qty')
      .limit(3000);
    if (error) throw error;
    const map = {};
    for (const { sku, stock_qty } of (data || [])) {
      if (sku) map[sku] = stock_qty ?? null; // null = untracked (don't show unavailable)
    }
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jewelry/stock/deduct — deduct stock after confirmed purchase
// Called internally by orders endpoint; also callable manually
// Body: { items: [{ sku, qty }], order_id, customer_email }
router.post('/stock/deduct', async (req, res) => {
  try {
    const { items, order_id, customer_email } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items required' });
    }
    const results = [];
    for (const { sku, qty } of items) {
      if (!sku || !qty || qty <= 0) continue;
      const { data: row } = await req.supabase
        .from('jewelry_products')
        .select('stock_qty')
        .eq('sku', sku)
        .single();
      if (!row || row.stock_qty === null) { results.push({ sku, status: 'untracked' }); continue; }
      const newStock = Math.max(0, (row.stock_qty || 0) - qty);
      const { error } = await req.supabase
        .from('jewelry_products')
        .update({ stock_qty: newStock, updated_at: new Date().toISOString() })
        .eq('sku', sku);
      if (!error) {
        await req.supabase.from('stock_deductions').insert([{
          sku, qty, order_id: order_id || null, customer_email: customer_email || null
        }]);
        results.push({ sku, status: 'deducted', prev: row.stock_qty, new: newStock });
      } else {
        results.push({ sku, status: 'error', error: error.message });
      }
    }
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
