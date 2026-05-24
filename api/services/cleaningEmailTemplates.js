/**
 * cleaningEmailTemplates.js
 * Lagos Cleaning — 5-email VIP sequence
 * Brand: clean white, teal #1a9e97, dark #0d1f1f, Georgia/Arial
 * Strategy: organic, warm, trust-building — attract VIP homeowners
 */

const BASE_URL = 'https://lagosworld.app';
const PHONE    = '+12156262345';
const WA_LINK  = `https://wa.me/12156262345`;

// ── Shared wrapper ────────────────────────────────────────────────────────────
function wrap(content, previewText = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Lagos Cleaning</title>
${previewText ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${previewText}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</span>` : ''}
</head>
<body style="margin:0;padding:0;background:#eaf6f5;font-family:Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eaf6f5;padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#0d2c2b 0%,#124f4d 50%,#0d2c2b 100%);padding:36px 40px 28px;text-align:center">
        <!-- LC Logo mark -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px">
          <tr><td style="text-align:center">
            <img src="https://lagosworld.app/images/lw-logo.svg" alt="LW" width="56" height="56"
                 style="display:block;width:56px;height:56px;border:1px solid rgba(26,158,151,.5)">
          </td></tr>
        </table>
        <div style="font-size:22px;letter-spacing:6px;color:#ffffff;font-family:Georgia,serif;font-weight:normal;text-transform:uppercase">Lagos</div>
        <div style="font-size:9px;letter-spacing:9px;color:#1a9e97;margin-top:5px;font-family:Arial,sans-serif;text-transform:uppercase">C&nbsp;L&nbsp;E&nbsp;A&nbsp;N&nbsp;I&nbsp;N&nbsp;G</div>
        <div style="margin-top:16px;height:1px;background:linear-gradient(90deg,transparent,rgba(26,158,151,.6),transparent)"></div>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:36px 40px 28px">
        ${content}
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="padding:0 40px">
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(26,158,151,.3),transparent)"></div>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:20px 40px 32px;text-align:center;background:#f7fffe">
        <div style="font-size:11px;letter-spacing:3px;color:#1a9e97;margin-bottom:10px">✦ LAGOS CLEANING ✦</div>
        <p style="font-size:11px;color:#7a9a99;margin:0 0 8px;letter-spacing:.5px">
          Philadelphia, PA · ${PHONE}
        </p>
        <p style="font-size:10px;color:#a0b8b7;margin:0">
          <a href="${BASE_URL}/cleaning" style="color:#1a9e97;text-decoration:none">Book Now</a>
          &nbsp;·&nbsp;
          <a href="${WA_LINK}" style="color:#1a9e97;text-decoration:none">WhatsApp</a>
          &nbsp;·&nbsp;
          <a href="mailto:admin.lagosworld@gmail.com" style="color:#1a9e97;text-decoration:none">Contact</a>
        </p>
        <p style="font-size:9px;color:#c0d0cf;margin:12px 0 0;letter-spacing:.5px">
          Lagos World · Professional Cleaning Services
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Teal CTA button ───────────────────────────────────────────────────────────
function btn(text, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0">
    <tr><td style="background:#1a9e97;padding:15px 38px;text-align:center;border-radius:2px">
      <a href="${url}" style="color:#ffffff;font-family:Arial,sans-serif;font-size:13px;letter-spacing:2px;text-decoration:none;font-weight:bold">${text.toUpperCase()}</a>
    </td></tr>
  </table>`;
}

// ── Divider ───────────────────────────────────────────────────────────────────
const hr = `<div style="border-top:1px solid #e0f0ef;margin:24px 0"></div>`;

// ── Body text ─────────────────────────────────────────────────────────────────
function p(text, style = '') {
  return `<p style="color:#2d4a49;font-size:15px;line-height:1.8;margin:0 0 16px;font-family:Arial,sans-serif;${style}">${text}</p>`;
}

function h(text) {
  return `<h2 style="color:#0d2c2b;font-size:21px;letter-spacing:.5px;font-weight:bold;margin:0 0 20px;font-family:Georgia,serif">${text}</h2>`;
}

function bullet(items) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px">
    ${items.map(i => `<tr>
      <td style="color:#1a9e97;padding-right:10px;font-size:16px;vertical-align:top;padding-bottom:8px">✓</td>
      <td style="color:#2d4a49;font-size:14px;line-height:1.7;font-family:Arial,sans-serif;padding-bottom:8px">${i}</td>
    </tr>`).join('')}
  </table>`;
}

function highlight(text) {
  return `<div style="background:#f0fafa;border-left:3px solid #1a9e97;padding:16px 20px;margin:20px 0;border-radius:0 4px 4px 0">
    <p style="color:#0d2c2b;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">${text}</p>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 1 — Inquiry Confirmed (immediate — replaces old plain HTML)
// ═══════════════════════════════════════════════════════════════════════════════
function cleaningConfirmed(firstName, details = {}) {
  const { service_type, recurrence, address, city, preferred_date } = details;
  const fullAddress = [address, city].filter(Boolean).join(', ');

  return wrap(`
    ${h(`Your request is confirmed, ${firstName}.`)}
    ${p('Thank you for choosing <strong>Lagos Cleaning</strong>.')}
    ${p('We received your request and our team will contact you within <strong>2 hours</strong> to confirm your appointment and answer any questions.')}
    ${hr}
    ${service_type ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
      ${[
        ['Service', service_type],
        ['Frequency', recurrence || 'One-time'],
        ['Location', fullAddress || '—'],
        ['Preferred Date', preferred_date || 'Flexible']
      ].map(([k, v]) => `
      <tr>
        <td style="color:#7a9a99;font-size:12px;letter-spacing:1px;padding:8px 16px 8px 0;border-bottom:1px solid #e8f4f3;white-space:nowrap">${k.toUpperCase()}</td>
        <td style="color:#2d4a49;font-size:14px;padding:8px 0 8px;border-bottom:1px solid #e8f4f3;font-weight:bold">${v}</td>
      </tr>`).join('')}
    </table>` : ''}
    ${highlight('Our team is dedicated to making your home shine. Every visit is handled with care, professionalism and attention to detail.')}
    ${hr}
    ${p('Need to talk to us right now?', 'font-size:13px;color:#7a9a99;margin-bottom:8px')}
    ${btn('Message Us on WhatsApp', WA_LINK)}
    ${p('With care,<br><strong>Lagos Cleaning Team</strong>', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'We received your request and will confirm your appointment soon.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 2 — 24h Follow-up
// ═══════════════════════════════════════════════════════════════════════════════
function cleaningFollowup24h(firstName) {
  return wrap(`
    ${h(`Hi ${firstName}, just checking in.`)}
    ${p('We wanted to make sure you received our message yesterday.')}
    ${p('Your home deserves a clean that actually makes a difference — and that\'s exactly what we deliver.')}
    ${hr}
    ${p('Here is what you can expect with Lagos Cleaning:')}
    ${bullet([
      'Professional team — trained, reliable and respectful of your space',
      'Deep clean on every visit — not just surface-level tidying',
      'Flexible scheduling to fit your routine',
      'Clear communication before, during and after each service',
      'Satisfaction guaranteed — we make it right if anything is missed'
    ])}
    ${hr}
    ${highlight('"Our goal is simple: you come home and feel immediately at peace. That\'s the Lagos Cleaning standard."')}
    ${p('Ready to confirm your appointment?')}
    ${btn('Book My Cleaning Now', BASE_URL + '/cleaning')}
    ${p('Or reply to this email and we\'ll sort everything out for you.', 'font-size:13px;color:#7a9a99;text-align:center;margin-top:12px')}
    ${p('With care,<br><strong>Lagos Cleaning Team</strong>', 'font-size:13px;color:#7a9a99;margin-top:20px')}
  `, 'Your home deserves a clean that makes a real difference.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 3 — 7-Day Re-engagement
// ═══════════════════════════════════════════════════════════════════════════════
function cleaningReengagement(firstName) {
  return wrap(`
    ${h('Your home is waiting, ' + firstName + '.')}
    ${p('Life gets busy. We understand.')}
    ${p('But a clean, organized home isn\'t just about appearances — it affects your energy, your focus and how you feel every single day.')}
    ${hr}
    <div style="text-align:center;margin:28px 0">
      ${[
        ['🏠', 'A clean home creates peace of mind'],
        ['✨', 'Your space reflects who you are'],
        ['⏱', 'Professional cleaning saves you hours every week'],
        ['💚', 'Give yourself the gift of a truly clean home']
      ].map(([icon, text]) => `
      <div style="margin:12px 0;padding:14px 20px;background:#f0fafa;border-radius:4px">
        <span style="font-size:20px;margin-right:10px">${icon}</span>
        <span style="color:#0d2c2b;font-size:14px;font-family:Arial,sans-serif">${text}</span>
      </div>`).join('')}
    </div>
    ${hr}
    ${p('Lagos Cleaning serves homeowners in Philadelphia who expect the best.')}
    ${p('Is this week a good time to schedule?')}
    ${btn('Schedule My Cleaning', BASE_URL + '/cleaning')}
    <div style="text-align:center;margin-top:12px">
      <a href="${WA_LINK}" style="color:#1a9e97;font-size:13px;text-decoration:none;letter-spacing:1px">MESSAGE US ON WHATSAPP →</a>
    </div>
    ${p('With care,<br><strong>Lagos Cleaning</strong>', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'A clean home creates peace of mind — schedule your visit today.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 4 — 30-Day Review Request
// ═══════════════════════════════════════════════════════════════════════════════
function cleaningReview(firstName) {
  return wrap(`
    ${h(`${firstName}, how was your experience?`)}
    ${p('We hope Lagos Cleaning delivered everything you expected — and more.')}
    ${hr}
    <div style="text-align:center;margin:24px 0">
      <div style="font-size:28px;letter-spacing:6px;color:#1a9e97">★★★★★</div>
      <div style="font-size:11px;letter-spacing:3px;color:#7a9a99;margin-top:8px">SHARE YOUR EXPERIENCE</div>
    </div>
    ${hr}
    ${p('Your honest review helps other Philadelphia homeowners find trustworthy cleaning service — and it helps our small, family-run business grow with confidence.')}
    ${highlight('It only takes 60 seconds to leave a review. And it means everything to us.')}
    ${btn('Leave a Review on Google', 'https://g.page/r/your-google-place-id/review')}
    <div style="text-align:center;margin-top:12px">
      <a href="${WA_LINK}?text=My+review+for+Lagos+Cleaning:" style="color:#1a9e97;font-size:13px;text-decoration:none;letter-spacing:1px">SEND VIA WHATSAPP →</a>
    </div>
    ${hr}
    ${p('And if anything was not perfect on your last visit — please tell us. We will make it right.', 'font-size:13px;color:#7a9a99')}
    ${p('With gratitude,<br><strong>Lagos Cleaning Team</strong>', 'font-size:13px;color:#7a9a99;margin-top:20px')}
  `, 'Your review helps our community find trusted cleaning service.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 5 — Referral
// ═══════════════════════════════════════════════════════════════════════════════
function cleaningReferral(firstName) {
  return wrap(`
    ${h('Know someone who needs a clean home?')}
    ${p(`Hi ${firstName},`)}
    ${p('A clean, organized home is one of the best gifts you can give — to yourself or someone you care about.')}
    ${hr}
    <div style="text-align:center;margin:20px 0;line-height:2.2">
      <div style="color:#2d4a49;font-size:15px">A busy neighbor.</div>
      <div style="color:#2d4a49;font-size:15px">A hardworking friend.</div>
      <div style="color:#2d4a49;font-size:15px">A family member who needs support.</div>
      <div style="color:#1a9e97;font-size:15px;font-style:italic;margin-top:8px;font-family:Georgia,serif">Someone who deserves a truly clean home.</div>
    </div>
    ${hr}
    ${p('Refer a friend to Lagos Cleaning and <strong>both of you receive a special discount</strong> on the next service.')}
    ${highlight('We built this business through trust and referrals. Every person you send our way is treated like family.')}
    ${btn('Refer a Friend Now', WA_LINK + '?text=I+want+to+refer+a+friend+to+Lagos+Cleaning')}
    ${p('Simply share our number: <strong>${PHONE}</strong> or our website with a friend and let us know so we can apply your reward.', 'font-size:13px;color:#7a9a99;margin-top:16px')}
    ${p('Thank you for being part of the Lagos family.<br><strong>Lagos Cleaning Team</strong>', 'font-size:13px;color:#7a9a99;margin-top:20px')}
  `, 'Refer a friend and both of you receive a special discount.');
}

// ── Cleaning admin notification ───────────────────────────────────────────────
function cleaningAdminNotification(requestData) {
  const {
    customer_name, customer_email, customer_phone,
    service_type, recurrence, address, city,
    preferred_date, description, calLink
  } = requestData;

  const fullAddress = [address, city].filter(Boolean).join(', ');

  return wrap(`
    <div style="display:inline-block;background:#e8f8f7;padding:4px 14px;margin-bottom:20px;border-radius:2px;border:1px solid rgba(26,158,151,.3)">
      <span style="color:#1a9e97;font-size:10px;letter-spacing:3px">NEW CLEANING REQUEST</span>
    </div>
    ${h('New Lead — Lagos Cleaning')}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
      ${[
        ['Name',     customer_name],
        ['Email',    customer_email],
        ['Phone',    customer_phone || '—'],
        ['Service',  service_type],
        ['Frequency',recurrence || 'One-time'],
        ['Address',  fullAddress || '—'],
        ['Date',     preferred_date || 'Flexible'],
        ['Notes',    description || '—']
      ].map(([k, v]) => `
      <tr>
        <td style="color:#7a9a99;font-size:12px;letter-spacing:1px;padding:8px 16px 8px 0;border-bottom:1px solid #e0f0ef;white-space:nowrap">${k.toUpperCase()}</td>
        <td style="color:#2d4a49;font-size:14px;padding:8px 0;border-bottom:1px solid #e0f0ef">${v || '—'}</td>
      </tr>`).join('')}
    </table>
    ${calLink ? `${btn('📅 Add to Google Calendar', calLink)}` : ''}
    ${btn('View Admin Panel', BASE_URL + '/admin')}
  `, 'New cleaning request — Lagos Cleaning');
}

module.exports = {
  cleaningConfirmed,
  cleaningFollowup24h,
  cleaningReengagement,
  cleaningReview,
  cleaningReferral,
  cleaningAdminNotification
};
