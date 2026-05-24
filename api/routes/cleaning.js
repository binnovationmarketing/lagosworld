const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/email');

// POST: Criar solicitação de limpeza (Cliente)
router.post('/requests', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, service_type, employment_type, address, description, preferred_date, estimated_hours } = req.body;

    if (!customer_name || !customer_email || !service_type || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await req.supabase
      .from('cleaning_requests')
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        service_type,
        employment_type,
        address,
        description,
        preferred_date,
        estimated_hours,
        status: 'open'
      }])
      .select();

    if (error) throw error;

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Nova Solicitação de Limpeza</h2>
          <p><strong>Cliente:</strong> ${customer_name}</p>
          <p><strong>Email:</strong> ${customer_email}</p>
          <p><strong>Telefone:</strong> ${customer_phone}</p>
          <p><strong>Tipo de Serviço:</strong> ${service_type}</p>
          <p><strong>Tipo de Emprego:</strong> ${employment_type || 'N/A'}</p>
          <p><strong>Endereço:</strong> ${address}</p>
          <p><strong>Descrição:</strong> ${description || 'N/A'}</p>
          <p><strong>Data Preferida:</strong> ${preferred_date || 'N/A'}</p>
          <p><strong>Horas Estimadas:</strong> ${estimated_hours || 'N/A'}</p>
        </body>
      </html>
    `;

    res.json({ success: true, request: data[0] });

    // Non-blocking — email failure never kills the response
    sendEmail(customer_email, 'Cleaning Service Request Received', htmlContent, data)
      .catch(e => console.error('Email failed (request saved):', e.message));
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

module.exports = router;
