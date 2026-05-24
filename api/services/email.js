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

// ── Google Calendar link builder ──────────────────────────────────────────────
function buildCalendarLink({ title, location, description, date, durationHours = 2 }) {
  // date: 'YYYY-MM-DD' or null — default to next 9am if missing
  let start, end;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // 9am–11am on requested date (local time, no Z — Google treats as local)
    const d = date.replace(/-/g, '');
    start = `${d}T090000`;
    end   = `${d}T${String(9 + durationHours).padStart(2,'0')}0000`;
  } else {
    // No date — use open-ended template (Google lets user pick)
    start = '';
    end   = '';
  }
  const params = new URLSearchParams({
    action:  'TEMPLATE',
    text:    title,
    details: description,
    location: location || '',
    add:     'admin.lagosworld@gmail.com',
  });
  if (start) { params.set('dates', `${start}/${end}`); }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── Cleaning request confirmation ─────────────────────────────────────────────
async function sendCleaningConfirmation(requestData) {
  const {
    customer_name, customer_email, customer_phone,
    service_type, recurrence, address, city,
    preferred_date, description
  } = requestData;

  const firstName = (customer_name || '').split(' ')[0];
  const transporter = createTransporter();
  const from = FROM();

  // Build calendar link
  const fullAddress = [address, city].filter(Boolean).join(', ');
  const calLink = buildCalendarLink({
    title:       `🧹 ${service_type} — ${customer_name}`,
    location:    fullAddress,
    description: `Phone: ${customer_phone || '—'}\nEmail: ${customer_email}\nFrequency: ${recurrence || 'One-time'}\nNotes: ${description || '—'}`,
    date:        preferred_date || null,
  });

  const customerHtml = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f0fdff;padding:20px">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:2rem;border-radius:8px;border-top:4px solid #20B2AA">
  <h2 style="color:#20B2AA">🧹 Request Confirmed!</h2>
  <p>Hi <strong>${firstName}</strong>,</p>
  <p>We received your cleaning request and will contact you within <strong>2 hours</strong> to confirm your appointment.</p>
  <table style="width:100%;font-size:.9rem;border-collapse:collapse;margin:1rem 0">
    <tr style="background:#f0fdff"><td style="padding:8px 12px;font-weight:bold">Service</td><td style="padding:8px 12px">${service_type}</td></tr>
    <tr><td style="padding:8px 12px;font-weight:bold">Frequency</td><td style="padding:8px 12px">${recurrence || 'One-time'}</td></tr>
    <tr style="background:#f0fdff"><td style="padding:8px 12px;font-weight:bold">Address</td><td style="padding:8px 12px">${fullAddress || '—'}</td></tr>
    <tr><td style="padding:8px 12px;font-weight:bold">Preferred Date</td><td style="padding:8px 12px">${preferred_date || 'Flexible'}</td></tr>
  </table>
  <p style="color:#666;font-size:.85rem">Questions? Call or text us: <strong>+1 (215) 626-2345</strong></p>
  <p style="color:#20B2AA;font-weight:bold">— Lagos Cleaning Team</p>
</div></body></html>`;

  const adminHtml = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:2rem;border-radius:8px;border-top:4px solid #20B2AA">
  <h2 style="color:#20B2AA">🔔 New Cleaning Lead</h2>
  <p><strong>Name:</strong> ${customer_name}</p>
  <p><strong>Email:</strong> ${customer_email}</p>
  <p><strong>Phone:</strong> ${customer_phone || '—'}</p>
  <p><strong>Service:</strong> ${service_type}</p>
  <p><strong>Frequency:</strong> ${recurrence || 'One-time'}</p>
  <p><strong>Address:</strong> ${fullAddress || '—'}</p>
  <p><strong>Date:</strong> ${preferred_date || 'Flexible'}</p>
  <p><strong>Notes:</strong> ${description || '—'}</p>
  <div style="margin-top:1.5rem">
    <a href="${calLink}" target="_blank" style="display:inline-block;background:#20B2AA;color:#fff;text-decoration:none;padding:.75rem 1.5rem;border-radius:6px;font-weight:bold;font-size:.9rem">📅 Add to Google Calendar</a>
  </div>
</div></body></html>`;

  // Admin notification
  await transporter.sendMail({
    from, to: ADMINS,
    subject: `🧹 New Cleaning Request — ${customer_name}`,
    html: adminHtml
  });

  // Customer confirmation
  if (customer_email && !ADMINS.includes(customer_email)) {
    await transporter.sendMail({
      from, to: customer_email,
      subject: '🧹 Your Cleaning Request — Lagos Cleaning',
      html: customerHtml
    });
  }

  console.log(`Cleaning emails sent — ${customer_name} (${customer_email})`);
}

module.exports = { sendEmail, sendOrderEmails, processDueEmails, sendCleaningConfirmation, ADMINS, FROM };
