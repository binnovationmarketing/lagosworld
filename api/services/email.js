const nodemailer = require('nodemailer');
const t = require('./emailTemplates');

const ADMINS = ['binnovationmarketing@gmail.com'];

// Singleton transporter — reused across warm function instances
let _transporter = null;
function createTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      pool: true,
      maxConnections: 3
    });
  }
  return _transporter;
}

const FROM = () => `"Lagos World" <${process.env.EMAIL_USER}>`;

// ── Generic sendEmail (cleaning / professionals routes) ───────────────────────
async function sendEmail(to, subject, htmlContent) {
  const transporter = createTransporter();

  // Admin copy
  await transporter.sendMail({
    from: FROM(), to: ADMINS,
    subject: `[LAGOS] ${subject}`,
    html: t.adminNotification(subject, { 'Sent to': to, Subject: subject })
  });

  // Customer copy (skip if customer is an admin)
  if (to && !ADMINS.includes(to)) {
    await transporter.sendMail({
      from: FROM(), to,
      subject: `[Lagos World] ${subject}`,
      html: htmlContent
    });
  }

  console.log(`Emails dispatched — admin notified, customer: ${to}`);
  return { success: true };
}

// ── Order confirmation + welcome + queue post-purchase sequence ───────────────
async function sendOrderEmails(orderData, supabase) {
  const { name, email, phone, address, city, state, zip,
          payment, items, total, shipping, deliveryType, notes, orderId } = orderData;

  const firstName = (name || '').split(' ')[0];
  const transporter = createTransporter();
  const from = FROM();

  // 1. Admin notification
  await transporter.sendMail({
    from, to: ADMINS,
    subject: `COMPRA REALIZADA LAGOS WORLD - ${name}`,
    html: t.orderConfirmation(orderData)
  });

  // 2. Customer confirmation
  if (email && !ADMINS.includes(email)) {
    await transporter.sendMail({
      from, to: email,
      subject: `✝ Pedido Confirmado — Lagos Jewelry — ${name}`,
      html: t.orderConfirmation(orderData)
    });

    // 3. Queue post-purchase sequence in Supabase
    if (supabase && orderId) {
      const now = new Date();
      const queue = [
        { email_type: 'care',     days: 3  },
        { email_type: 'crosssell',days: 7  },
        { email_type: 'review',   days: 10 },
        { email_type: 'referral', days: 21 }
      ].map(({ email_type, days }) => {
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return {
          order_id:       orderId,
          customer_email: email,
          customer_name:  name,
          email_type,
          scheduled_at:   d.toISOString(),
          status:         'pending'
        };
      });
      await supabase.from('email_queue').insert(queue);
    }
  }

  console.log(`Order emails sent — ${name} (${email})`);
}

// ── Cron: send due emails from queue ─────────────────────────────────────────
async function processDueEmails(supabase) {
  const { data: due, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50);

  if (error || !due?.length) return { sent: 0 };

  const transporter = createTransporter();
  const from = FROM();
  let sent = 0;

  for (const row of due) {
    const firstName = (row.customer_name || '').split(' ')[0];
    let html, subject;

    switch (row.email_type) {
      case 'care':
        html = t.jewelryCare(firstName);
        subject = 'How to keep your jewelry beautiful for longer';
        break;
      case 'crosssell':
        html = t.crossSell(firstName);
        subject = 'Complete your look with these matching pieces';
        break;
      case 'review':
        html = t.reviewRequest(firstName);
        subject = 'How did you feel wearing your Lagos Jewelry piece?';
        break;
      case 'referral':
        html = t.referral(firstName);
        subject = 'Share Lagos Jewelry with a woman you love';
        break;
      default:
        continue;
    }

    try {
      await transporter.sendMail({ from, to: row.customer_email, subject, html });
      await supabase.from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id);
      sent++;
    } catch (e) {
      await supabase.from('email_queue').update({ status: 'failed' }).eq('id', row.id);
      console.error(`Queue email failed (${row.id}):`, e.message);
    }
  }

  console.log(`Email queue processed: ${sent}/${due.length} sent`);
  return { sent, total: due.length };
}

module.exports = { sendEmail, sendOrderEmails, processDueEmails, ADMINS, FROM };
