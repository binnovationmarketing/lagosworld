const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sendEmail, sendCleaningConfirmation } = require('../services/email');

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return false; }
  return true;
}

// POST: Criar solicitação de limpeza (Cliente) — with validation
router.post('/requests',
  body('customer_name').notEmpty().trim().isLength({ max: 200 }).escape().withMessage('Name required'),
  body('customer_email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('customer_phone').optional().trim().isLength({ max: 30 }),
  body('service_type').notEmpty().isIn(['residential','commercial','power_washing']).withMessage('Invalid service type'),
  body('address').optional().trim().isLength({ max: 500 }).escape(),
  body('description').optional().trim().isLength({ max: 2000 }).escape(),
  async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const {
      customer_name, customer_email, customer_phone,
      service_type, employment_type,
      address, city, recurrence,
      description, preferred_date, estimated_hours
    } = req.body;

    const { data, error } = await req.supabase
      .from('cleaning_requests')
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        service_type,
        employment_type,
        address,
        city,
        recurrence,
        description,
        preferred_date,
        estimated_hours,
        status: 'open'
      }])
      .select();

    if (error) throw error;

    // Send email before responding — Vercel freezes function after res.json()
    const requestId = data?.[0]?.id || null;
    try {
      await sendCleaningConfirmation(
        { customer_name, customer_email, customer_phone, service_type, recurrence, address, city, preferred_date, description, requestId },
        req.supabase
      );
    } catch (emailErr) {
      console.error('Email failed (request saved):', emailErr.message, emailErr.responseCode || '');
    }

    res.json({ success: true, request: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Listar solicitações (admin dashboard)
router.get('/requests', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('cleaning_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Cadastro de Profissional de Limpeza
router.post('/professionals', async (req, res) => {
  try {
    const { name, email, phone, specialties, hourly_rate } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await req.supabase
      .from('cleaning_professionals')
      .insert([{
        name,
        email,
        phone,
        specialties: specialties || [],
        hourly_rate,
        status: 'pending'
      }])
      .select();

    if (error) throw error;

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Novo Profissional de Limpeza Cadastrado</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone}</p>
          <p><strong>Especialidades:</strong> ${specialties ? specialties.join(', ') : 'N/A'}</p>
          <p><strong>Taxa Horária:</strong> $${hourly_rate || 'N/A'}</p>
        </body>
      </html>
    `;

    res.json({ success: true, professional: data[0] });

    // Non-blocking — email failure never kills the response
    sendEmail(email, 'Professional Registration Received', htmlContent, data)
      .catch(e => console.error('Email failed (professional saved):', e.message));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Listar profissionais
router.get('/professionals', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('cleaning_professionals')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Update request status
router.patch('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'scheduled', 'completed', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const { data, error } = await req.supabase
      .from('cleaning_requests')
      .update({ status })
      .eq('id', id)
      .select('id, status, customer_name, customer_email')
      .single();
    if (error) throw error;
    res.json({ ok: true, request: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
