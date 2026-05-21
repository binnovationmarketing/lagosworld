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

    // Salvar no banco
    const { data, error } = await req.supabase
      .from('jewelry_orders')
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        delivery_method,
        address,
        items: items,
        total,
        status: 'pending'
      }])
      .select();

    if (error) throw error;

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
            ${items.map(item => `
              <li>
                ${item.title} (SKU: ${item.sku})
                <br>Qty: ${item.quantity} x $${item.price.toFixed(2)}
                <br>Subtotal: $${(item.quantity * item.price).toFixed(2)}
              </li>
            `).join('')}
          </ul>
          <h3>Total: $${total.toFixed(2)}</h3>
        </body>
      </html>
    `;

    await sendEmail(customer_email, 'New Jewelry Order', htmlContent, data);

    res.json({ success: true, order: data[0] });
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
