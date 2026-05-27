const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/email');

// POST: Inscrição em curso
router.post('/enroll', async (req, res) => {
  try {
    const { course_id, student_name, student_email, student_phone, modality } = req.body;

    if (!course_id || !student_name || !student_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Pegar info do curso
    const { data: courseData } = await req.supabase
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .single();

    const { data, error } = await req.supabase
      .from('course_enrollments')
      .insert([{
        course_id,
        student_name,
        student_email,
        student_phone,
        modality,
        status: 'enrolled'
      }])
      .select();

    if (error) throw error;

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Nova Inscrição em Curso</h2>
          <p><strong>Curso:</strong> ${courseData?.title || 'N/A'}</p>
          <p><strong>Aluno:</strong> ${student_name}</p>
          <p><strong>Email:</strong> ${student_email}</p>
          <p><strong>Telefone:</strong> ${student_phone || 'N/A'}</p>
          <p><strong>Modalidade:</strong> ${modality || 'N/A'}</p>
        </body>
      </html>
    `;

    await sendEmail(student_email, 'Course Enrollment Confirmation', htmlContent, data);

    res.json({ success: true, enrollment: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Listar cursos disponíveis
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('courses')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Criar curso (admin)
router.post('/', async (req, res) => {
  try {
    const { title, description, modalities, price, duration_hours, instructor_name } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Missing title' });
    }

    const { data, error } = await req.supabase
      .from('courses')
      .insert([{
        title,
        description,
        modalities: modalities || [],
        price,
        duration_hours,
        instructor_name,
        status: 'active'
      }])
      .select();

    if (error) throw error;
    res.json({ success: true, course: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Waitlist — sends email to admin
router.post('/waitlist', async (req, res) => {
  try {
    const { name, email, phone, course } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const { transporter } = require('../services/email');
    const courseLabel = {
      eyebrow: 'Eyebrow Design & Shaping',
      lashes: 'Eyelash Extensions',
      skincare: 'Skin Care & Laser Therapy',
      massage: 'Massage Therapy',
      'sports-massage': 'Sports Massage',
      all: 'All Courses'
    }[course] || course || 'All Courses';

    const html = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf6ee;padding:20px">
<div style="max-width:560px;margin:0 auto;background:#0a0a0a;color:#e4ddd0;padding:2rem;border:1px solid rgba(184,146,46,.3)">
  <div style="text-align:center;margin-bottom:1.5rem">
    <div style="font-size:1.5rem;color:#b8922e;font-family:Georgia,serif;letter-spacing:.3em">LAGOS COURSES</div>
    <div style="font-size:.7rem;color:#7a7268;letter-spacing:.3em;margin-top:.3rem">WAITLIST · NEW ENTRY</div>
  </div>
  <hr style="border:none;border-top:1px solid rgba(184,146,46,.2);margin:1rem 0">
  <p><strong style="color:#b8922e">Name:</strong> ${name || '—'}</p>
  <p><strong style="color:#b8922e">Email:</strong> ${email}</p>
  <p><strong style="color:#b8922e">Phone:</strong> ${phone || '—'}</p>
  <p><strong style="color:#b8922e">Course Interest:</strong> ${courseLabel}</p>
  <hr style="border:none;border-top:1px solid rgba(184,146,46,.2);margin:1rem 0">
  <p style="font-size:.72rem;color:#7a7268;text-align:center">Lagos Courses · Lagos World · Philadelphia, PA</p>
</div></body></html>`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'binnovationmarketing@gmail.com',
      subject: `Waitlist Course Lagos World — ${name || email}`,
      html
    });

    res.json({ success: true });
  } catch (err) {
    console.error('waitlist error:', err);
    res.status(500).json({ error: 'Failed to send' });
  }
});

module.exports = router;
