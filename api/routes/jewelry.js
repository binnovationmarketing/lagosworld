const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/email');

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

    // Enviar email
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Nova Ordem de Jewelry</h2>
          <p><strong>Cliente:</strong> ${customer_name}</p>
          <p><strong>Email:</strong> ${customer_email}</p>
          <p><strong>Telefone:</strong> ${customer_phone}</p>
          <p><strong>Método Entrega:</strong> ${delivery_method}</p>
          ${address ? `<p><strong>Endereço:</strong> ${address}</p>` : ''}
          <h3>Itens:</h3>
          <ul>
            ${(items || []).map(item => `
              <li>
                ${item.title || item.name} ${item.sku ? '(SKU: '+item.sku+')' : ''}
                <br>Qty: ${item.quantity || item.qty} x $${Number(item.price).toFixed(2)}
                <br>Subtotal: $${((item.quantity || item.qty) * item.price).toFixed(2)}
              </li>
            `).join('')}
          </ul>
          <h3>Total: $${Number(total).toFixed(2)}</h3>
        </body>
      </html>
    `;

    res.json({ success: true, order: { ...data[0], customer_name, customer_email, total } });

    // Non-blocking — email failure never kills the response
    sendEmail(customer_email, 'New Jewelry Order', htmlContent, data)
      .catch(e => console.error('Email failed (order saved):', e.message));
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

module.exports = router;
