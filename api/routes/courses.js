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

module.exports = router;
