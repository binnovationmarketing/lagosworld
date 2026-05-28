const nodemailer = require('nodemailer');
const t  = require('./emailTemplates');
const ct = require('./cleaningEmailTemplates');
const { createCleaningEvent } = require('./calendar');

// Always CC these addresses on every outbound email
// lagosvipcleaning = primary ops inbox; dayanelago22 = owner; binnovation = dev
const ADMINS = ['lagosvipcleaning@gmail.com', 'dayanelago22@gmail.com', 'binnovationmarketing@gmail.com'];

// Singleton transporter — reused across warm function instances
let _transporter = null;
function createTransporter() {
  if (!_transporter) {
    // No pool mode — Vercel serverless doesn't flush pooled SMTP connections
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
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
    from, to: ADMINS.join(', '),
    subject: `COMPRA REALIZADA LAGOS WORLD - ${name}`,
    html: t.orderConfirmation(orderData)
  });

  // 2. Customer confirmation — always send (even if customer is an admin/test account)
  if (email) {
    const isAdminEmail = ADMINS.includes(email);
    await transporter.sendMail({
      from, to: email,
      cc: isAdminEmail ? [] : ADMINS.join(', '), // CC admins on customer copies, skip if same address
      subject: `✦ LW ✦ Pedido Confirmado — Lagos Jewelry — ${name}`,
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
      // ── Jewelry sequence ──────────────────────────────────────────────────
      case 'care':
        html    = t.jewelryCare(firstName);
        subject = 'LW · How to keep your jewelry beautiful for longer';
        break;
      case 'crosssell':
        html    = t.crossSell(firstName);
        subject = 'LW · Complete your look with these matching pieces';
        break;
      case 'review':
        html    = t.reviewRequest(firstName);
        subject = 'LW · How did you feel wearing your Lagos Jewelry piece?';
        break;
      case 'referral':
        html    = t.referral(firstName);
        subject = 'LW · Share Lagos Jewelry with a woman you love';
        break;
      // ── Cleaning sequence ─────────────────────────────────────────────────
      case 'clean_followup':
        html    = ct.cleaningFollowup24h(firstName);
        subject = 'Lagos Cleaning · Did you get our message?';
        break;
      case 'clean_reengagement':
        html    = ct.cleaningReengagement(firstName);
        subject = 'Lagos Cleaning · Your home deserves the best';
        break;
      case 'clean_review':
        html    = ct.cleaningReview(firstName);
        subject = 'Lagos Cleaning · How was your experience?';
        break;
      case 'clean_referral':
        html    = ct.cleaningReferral(firstName);
        subject = 'Lagos Cleaning · Know someone who needs a clean home?';
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

// ── ICS file generator — attaches to admin email; Gmail auto-shows "Add to Calendar" ──
function buildICS({ title, location, description, date, durationHours = 2 }) {
  // Produce a compact YYYYMMDDTHHMMSSZ timestamp
  function toICSDate(jsDate) {
    return jsDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
  let dtStart, dtEnd;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Requested date at 09:00 local ET (UTC-5 winter / UTC-4 summer — use UTC-5 as safe default)
    const d = new Date(`${date}T14:00:00Z`); // 09:00 ET = 14:00 UTC (winter)
    const e = new Date(d.getTime() + durationHours * 60 * 60 * 1000);
    dtStart = toICSDate(d);
    dtEnd   = toICSDate(e);
  } else {
    // No date — use tomorrow 9am UTC-5
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setUTCHours(14, 0, 0, 0);
    const e = new Date(d.getTime() + durationHours * 60 * 60 * 1000);
    dtStart = toICSDate(d);
    dtEnd   = toICSDate(e);
  }

  const uid  = `clean-${Date.now()}@lagosworld.app`;
  const now  = toICSDate(new Date());
  // Escape ICS special chars
  const esc  = s => (s || '').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lagos World//Cleaning//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(location || '')}`,
    `DESCRIPTION:${esc(description || '')}`,
    'STATUS:CONFIRMED',
    'ATTENDEE;CN=Lagos Cleaning;RSVP=FALSE:mailto:lagosvipcleaning@gmail.com',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
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
    add:     'lagosvipcleaning@gmail.com',
  });
  if (start) { params.set('dates', `${start}/${end}`); }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── Cleaning request confirmation (VIP templates + queue sequence) ────────────
async function sendCleaningConfirmation(requestData, supabase = null) {
  const {
    customer_name, customer_email, customer_phone,
    service_type, recurrence, address, city,
    preferred_date, description, requestId
  } = requestData;

  const firstName = (customer_name || '').split(' ')[0];
  const transporter = createTransporter();
  const from = FROM();

  // Build calendar link + ICS attachment
  const fullAddress = [address, city].filter(Boolean).join(', ');
  const calEventData = {
    title:       `🧹 ${service_type} — ${customer_name}`,
    location:    fullAddress,
    description: `Phone: ${customer_phone || '—'}\nEmail: ${customer_email}\nFrequency: ${recurrence || 'One-time'}\nNotes: ${description || '—'}`,
    date:        preferred_date || null,
  };
  const calLink = buildCalendarLink(calEventData);
  const icsContent = buildICS(calEventData);

  // Admin — VIP teal template + .ics attachment (Gmail shows "Add to Calendar" automatically)
  await transporter.sendMail({
    from, to: ADMINS,
    subject: `🧹 New Cleaning Request — ${customer_name}`,
    html: ct.cleaningAdminNotification({
      customer_name, customer_email, customer_phone,
      service_type, recurrence, address, city,
      preferred_date, description, calLink
    }),
    attachments: [{
      filename:    'booking.ics',
      content:     icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST'
    }]
  });

  // Customer — VIP confirmed template
  if (customer_email && !ADMINS.includes(customer_email)) {
    await transporter.sendMail({
      from, to: customer_email,
      subject: '✔ Lagos Cleaning · Your request is confirmed',
      html: ct.cleaningConfirmed(firstName, {
        service_type, recurrence, address, city, preferred_date
      })
    });

    // Queue cleaning follow-up sequence in email_queue
    if (supabase) {
      const now = new Date();
      const queue = [
        { email_type: 'clean_followup',     days: 1  },
        { email_type: 'clean_reengagement', days: 7  },
        { email_type: 'clean_review',       days: 30 },
        { email_type: 'clean_referral',     days: 45 }
      ].map(({ email_type, days }) => {
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return {
          order_id:       null,
          customer_email,
          customer_name,
          email_type,
          scheduled_at:   d.toISOString(),
          status:         'pending'
        };
      });
      await supabase.from('email_queue').insert(queue)
        .then(({ error }) => { if (error) console.error('Cleaning queue error:', error.message); });
    }
  }

  // Google Calendar — auto-create event (fire separately so email never blocks on calendar failure)
  try {
    // Detect first-time client (golden color) — count prior bookings for this email
    let isFirstBooking = false;
    if (supabase && customer_email) {
      const { count } = await supabase
        .from('cleaning_requests')
        .select('id', { count: 'exact', head: true })
        .eq('customer_email', customer_email);
      isFirstBooking = (count <= 1); // <=1 because current booking is already inserted
    }

    await createCleaningEvent({
      customerName:   customer_name,
      customerEmail:  customer_email,
      customerPhone:  customer_phone,
      serviceType:    service_type,
      recurrence,
      address,
      city,
      preferredDate:  preferred_date,
      description,
      requestId,
      isFirstBooking,
    });
  } catch (calErr) {
    // Calendar failure must NEVER block email or booking save
    console.error('Calendar event failed (booking saved, email sent):', calErr.message);
  }

  console.log(`Cleaning emails sent — ${customer_name} (${customer_email})`);
}

module.exports = { sendEmail, sendOrderEmails, processDueEmails, sendCleaningConfirmation, ADMINS, FROM };
