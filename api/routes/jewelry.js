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

// POST: Criar novo pedido de jewelry — with validation
router.post('/orders',
  body('customer_name').notEmpty().trim().isLength({ max: 200 }).escape().withMessage('Name required'),
  body('customer_email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('customer_phone').optional().trim().isLength({ max: 30 }),
  body('total').isNumeric().withMessage('Total must be a number'),
  body('items').isArray({ min: 1 }).withMessage('Items required'),
  async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const { customer_name, customer_email, customer_phone, delivery_method, address, items, total } = req.body;

    // Salvar no banco — mapeia para schema correto (sem coluna items)
    const { data, error } = await req.supabase
      .from('jewelry_orders')
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        delivery_method,
        address,
        total:         Number(total) || 0,
        subtotal:      Number(total) || 0,
        shipping_cost: 0,
        status:        'pending',
        payment_method: delivery_method || ''
      }])
      .select('id');

    if (error) throw error;

    // Salvar itens na tabela order_items
    if (data?.[0]?.id && Array.isArray(items) && items.length > 0) {
      const lineItems = items.map(i => ({
        order_id:     data[0].id,
        product_name: i.title || i.name || '',
        variant_desc: i.sku   || '',
        quantity:     Number(i.quantity || i.qty) || 1,
        unit_price:   Number(i.price) || 0
        // line_total is GENERATED ALWAYS — omit from insert
      }));
      await req.supabase.from('order_items').insert(lineItems);
    }

    const orderId = data?.[0]?.id || null;
    res.json({ success: true, order: { ...data[0], customer_name, customer_email, total } });

    // Non-blocking premium emails (admin + customer + post-purchase queue)
    sendOrderEmails({
      name: customer_name,
      phone: customer_phone,
      email: customer_email,
      address,
      city: '', state: '', zip: '',
      payment: delivery_method,
      deliveryType: delivery_method,
      items: (items || []).map(i => ({
        name: i.title || i.name || '',
        variant: i.sku || '',
        qty: Number(i.quantity || i.qty) || 1,
        price: Number(i.price) || 0
      })),
      total,
      shipping: 0,
      notes: '',
      orderId
    }, req.supabase).catch(e => console.error('Email failed (order saved):', e.message));
  } catch (error) {
    console.error(error);
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
    const { price_overrides, description, images, video_url, sort_order } = req.body;
    const { data, error } = await req.supabase
      .from('product_overrides')
      .upsert([{
        product_id,
        price_overrides: price_overrides || {},
        description:     description ?? null,
        images:          images || [],
        video_url:       video_url || null,
        sort_order:      sort_order ?? null,
        updated_at:      new Date().toISOString()
      }], { onConflict: 'product_id' })
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

module.exports = router;
