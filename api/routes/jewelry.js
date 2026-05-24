const express = require('express');
const router = express.Router();
const { sendEmail, sendOrderEmails } = require('../services/email');

// POST: Criar novo pedido de jewelry
router.post('/orders', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, delivery_method, address, items, total } = req.body;

    // Validação
    if (!customer_name || !customer_email || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

// PUT /api/jewelry/overrides/:id — upsert one product
router.put('/overrides/:id', async (req, res) => {
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

module.exports = router;
