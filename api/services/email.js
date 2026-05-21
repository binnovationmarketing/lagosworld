const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, htmlContent, orderData) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'binnovationmarketing@gmail.com';

    // Email para admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `[LAGOS] ${subject}`,
      html: htmlContent
    });

    // Email de confirmação para cliente
    if (to) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: `[Lagos] ${subject}`,
        html: generateCustomerEmail(subject, orderData)
      });
    }

    console.log(`Email sent to admin and ${to}`);
    return { success: true, message: 'Emails sent' };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

function generateCustomerEmail(subject, data) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #d4af37;">Lagos Platform</h2>
          <p>Obrigado pelo seu interesse!</p>
          <p>Recebemos sua solicitação e entraremos em contato em breve.</p>
          <hr>
          <p><small>Este é um email automático. Não responda.</small></p>
        </div>
      </body>
    </html>
  `;
}

module.exports = { sendEmail, transporter };
