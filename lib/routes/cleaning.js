const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sendEmail, sendCleaningConfirmation, sendCleaningInvoice } = require('../services/email');

// POST /api/cleaning/zip-capture — record hero zip widget entries (fire-and-forget analytics)
router.post('/zip-capture', async (req, res) => {
  try {
    const { zip, served, source, city, county, state_abbr } = req.body;
    if (!zip || !/^\d{5}$/.test(zip)) return res.status(400).json({ error: 'Invalid zip' });
    const referrer  = req.get('Referer') || null;
    const userAgent = req.get('User-Agent') || null;
    await req.supabase.from('zip_leads').insert([{
      zip,
      served: !!served,
      source: source || 'hero_widget',
      city:       city       || null,
      county:     county     || null,
      state_abbr: state_abbr || null,
      referrer,
      user_agent: userAgent
    }]);
    res.json({ ok: true });
  } catch (err) {
    // Never crash — this is analytics-only
    console.error('zip-capture error:', err.message);
    res.json({ ok: false });
  }
});

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
  body('service_type').notEmpty().isIn([
    // Power washing (powerwashing/index.html select values)
    'house_exterior','driveway_sidewalk','deck_patio','roof_softwash',
    'commercial','gutter_cleaning','multiple',
    // Cleaning (cleaning/index.html select values)
    'house','apartment','movein','moveout','onetime','office',
    'power_deck','power_patio','power_siding','power_full',
    // Airbnb / hosting
    'airbnb',
    // Legacy/API direct values
    'residential','power_washing'
  ]).withMessage('Invalid service type'),
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
    const allowed = ['open', 'pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled'];
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

// POST /api/cleaning/invoice — send invoice to customer
router.post('/invoice', async (req, res) => {
  try {
    const { request_id, customer_email, customer_name, service_type, address, city, preferred_date, amount, notes } = req.body;

    let requestData = { customer_email, customer_name, service_type, address, city, preferred_date, amount, notes };

    // If request_id provided, fetch from DB (overrides body fields)
    if (request_id) {
      const { data, error } = await req.supabase
        .from('cleaning_requests')
        .select('*')
        .eq('id', request_id)
        .single();
      if (error) return res.status(404).json({ error: 'Request not found' });
      requestData = { ...data, amount, notes: notes || data.description };
      requestData.customer_email = data.customer_email;
      requestData.customer_name  = data.customer_name;
    }

    if (!requestData.customer_email) return res.status(400).json({ error: 'customer_email required' });

    await sendCleaningInvoice(requestData);
    res.json({ success: true, sent_to: requestData.customer_email });
  } catch (err) {
    console.error('Invoice send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cleaning/zip-stats — admin dashboard: zip lead analytics
router.get('/zip-stats', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('zip_leads')
      .select('zip, served, city, county, state_abbr, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;

    const rows = data || [];

    // Aggregate by ZIP
    const byZip = {};
    rows.forEach(r => {
      if (!byZip[r.zip]) byZip[r.zip] = { zip: r.zip, city: r.city || null, county: r.county || null, state_abbr: r.state_abbr || null, total: 0, served: 0, unserved: 0 };
      // Backfill city/county if missing from earlier records
      if (!byZip[r.zip].city && r.city) byZip[r.zip].city = r.city;
      if (!byZip[r.zip].county && r.county) byZip[r.zip].county = r.county;
      if (!byZip[r.zip].state_abbr && r.state_abbr) byZip[r.zip].state_abbr = r.state_abbr;
      byZip[r.zip].total++;
      if (r.served) byZip[r.zip].served++; else byZip[r.zip].unserved++;
    });
    const rankedZips = Object.values(byZip).sort((a, b) => b.total - a.total);

    // Aggregate by City
    const byCity = {};
    rows.forEach(r => {
      const key = r.city || `ZIP ${r.zip}`;
      if (!byCity[key]) byCity[key] = { city: key, county: r.county || null, state_abbr: r.state_abbr || null, total: 0, served: 0, unserved: 0, zips: new Set() };
      if (!byCity[key].county && r.county) byCity[key].county = r.county;
      byCity[key].total++;
      byCity[key].zips.add(r.zip);
      if (r.served) byCity[key].served++; else byCity[key].unserved++;
    });
    const rankedCities = Object.values(byCity)
      .map(c => ({ ...c, zips: c.zips.size }))
      .sort((a, b) => b.total - a.total);

    // Aggregate by County
    const byCounty = {};
    rows.forEach(r => {
      const key = r.county || 'Unknown';
      if (!byCounty[key]) byCounty[key] = { county: key, total: 0, served: 0, unserved: 0 };
      byCounty[key].total++;
      if (r.served) byCounty[key].served++; else byCounty[key].unserved++;
    });
    const rankedCounties = Object.values(byCounty).sort((a, b) => b.total - a.total);

    res.json({ total: rows.length, rankedZips, rankedCities, rankedCounties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
