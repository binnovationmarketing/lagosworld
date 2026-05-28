/**
 * cleaningEmailTemplates.js
 * Lagos Cleaning — 12-template full funnel
 * Brand: white #fff, teal #1a9e97, dark #0d2c2b, Georgia/Arial
 * Covers: lead capture → nurture → convert → post-service → referral → recurrence
 */

const BASE_URL     = 'https://lagosworld.app';
const BOOKING_URL  = `${BASE_URL}/cleaning`;
const PHONE        = '+1 (215) 626-2345';
const WA_LINK      = 'https://wa.me/12156262345';
const REVIEW_LINK  = 'https://g.page/r/lagoscleaning/review'; // update with real Google Place ID
const REFERRAL_URL = `${BASE_URL}/cleaning?ref=friend`;
const UNSUBSCRIBE  = `${BASE_URL}/unsubscribe`;

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
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px">
          <tr><td style="text-align:center">
            <img src="https://lagosworld.app/images/lw-logo.svg" alt="LC" width="56" height="56"
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
          Philadelphia, PA &amp; New Jersey · ${PHONE}
        </p>
        <p style="font-size:10px;color:#a0b8b7;margin:0">
          <a href="${BOOKING_URL}" style="color:#1a9e97;text-decoration:none">Book Now</a>
          &nbsp;·&nbsp;
          <a href="${WA_LINK}" style="color:#1a9e97;text-decoration:none">WhatsApp</a>
          &nbsp;·&nbsp;
          <a href="mailto:admin.lagosworld@gmail.com" style="color:#1a9e97;text-decoration:none">Contact</a>
        </p>
        <p style="font-size:9px;color:#c0d0cf;margin:12px 0 4px;letter-spacing:.5px">
          Lagos World · Professional Cleaning Services in PA &amp; NJ
        </p>
        <p style="font-size:9px;color:#c0d0cf;margin:0">
          <a href="${UNSUBSCRIBE}" style="color:#c0d0cf;text-decoration:underline">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function btn(text, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0">
    <tr><td style="background:#1a9e97;padding:15px 38px;text-align:center;border-radius:2px">
      <a href="${url}" style="color:#ffffff;font-family:Arial,sans-serif;font-size:13px;letter-spacing:2px;text-decoration:none;font-weight:bold">${text.toUpperCase()}</a>
    </td></tr>
  </table>`;
}

const hr = `<div style="border-top:1px solid #e0f0ef;margin:24px 0"></div>`;

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

function promoCode(code, offer) {
  return `<div style="text-align:center;margin:24px 0;padding:20px;background:#f0fafa;border:2px dashed rgba(26,158,151,.4);border-radius:4px">
    <div style="font-size:10px;letter-spacing:3px;color:#7a9a99;margin-bottom:8px;font-family:Arial,sans-serif">PROMO CODE</div>
    <div style="font-size:28px;letter-spacing:6px;color:#1a9e97;font-family:Georgia,serif;font-weight:bold">${code}</div>
    <div style="font-size:13px;color:#2d4a49;margin-top:8px;font-family:Arial,sans-serif">${offer}</div>
  </div>`;
}

function detailRow(label, value) {
  return `<tr>
    <td style="color:#7a9a99;font-size:12px;letter-spacing:1px;padding:8px 16px 8px 0;border-bottom:1px solid #e8f4f3;white-space:nowrap;font-family:Arial,sans-serif">${label.toUpperCase()}</td>
    <td style="color:#2d4a49;font-size:14px;padding:8px 0 8px;border-bottom:1px solid #e8f4f3;font-weight:bold;font-family:Arial,sans-serif">${value}</td>
  </tr>`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// 1. WELCOME LEAD — sent immediately after new quote request
// ═══════════════════════════════════════════════════════════════════════════════
function welcomeLead(firstName) {
  return wrap(`
    ${h(`Welcome to Lagos Cleaning, ${firstName}.`)}
    ${p('Thank you for reaching out.')}
    ${p('We provide professional house cleaning, apartment cleaning, move-in / move-out cleaning, office cleaning and CH ELITE Power Wash services across <strong>Pennsylvania and New Jersey</strong>.')}
    ${p('Our team usually responds within <strong>2 hours</strong> with a clear, no-obligation quote.')}
    ${hr}
    ${p('Here is what you can expect with every service:', 'margin-bottom:8px')}
    ${bullet([
      'Flat-rate pricing with no hidden fees',
      'Bonded and insured professionals',
      'Background-checked team members',
      'Eco-friendly cleaning products',
      'Flexible scheduling, including weekends',
      '100% satisfaction guarantee'
    ])}
    ${hr}
    ${promoCode('LAGOS15', '15% OFF your first cleaning')}
    ${p('To move faster, reply to this email with your full address or zip code, the service you need, and your preferred date.', 'font-size:13px;color:#5a7a79')}
    ${btn('Book My Free Quote', BOOKING_URL)}
    ${p(`Questions? Call or text us: <strong>${PHONE}</strong>`, 'font-size:13px;color:#7a9a99;text-align:center;margin-top:16px')}
    ${p('Lagos Cleaning Team', 'font-size:13px;color:#7a9a99;margin-top:20px')}
  `, 'We received your request — here is what to expect next.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. FIRST-TIME OFFER — sent 2h after lead
// ═══════════════════════════════════════════════════════════════════════════════
function firstTimeOffer(firstName) {
  return wrap(`
    ${h(`${firstName}, your first cleaning comes with an advantage.`)}
    ${p('Use code <strong>LAGOS15</strong> and receive 15% OFF your first service.')}
    ${p('You can use this offer for any of our services:')}
    ${bullet([
      'House cleaning',
      'Apartment cleaning',
      'One-time deep clean',
      'Move-in / move-out cleaning',
      'Office cleaning',
      'Select residential and commercial services'
    ])}
    ${hr}
    ${p('Our process is simple:')}
    ${bullet([
      'Request your free quote',
      'Get clear flat-rate pricing',
      'Choose your best date',
      'Our team shows up with all supplies and equipment',
      'You enjoy a cleaner, fresher space'
    ])}
    ${promoCode('LAGOS15', '15% OFF your first cleaning — use at checkout')}
    ${btn('Claim My 15% Off', BOOKING_URL)}
    ${p('Lagos Cleaning Team', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Claim 15% OFF your first cleaning with code LAGOS15.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. TRUST BUILDER — sent Day 1 after lead
// ═══════════════════════════════════════════════════════════════════════════════
function trustBuilder(firstName) {
  return wrap(`
    ${h(`Why homeowners in PA & NJ trust Lagos Cleaning.`)}
    ${p(`Hi ${firstName},`)}
    ${p('Choosing a cleaning company is not just about price.')}
    ${p('You are trusting someone with your home, your space and your time.')}
    ${p('That is why Lagos Cleaning was built around reliability, safety and clear communication.')}
    ${hr}
    ${p('Here is what makes us different:', 'margin-bottom:8px')}
    ${bullet([
      'Bonded and insured team',
      'Background-checked professionals',
      '100% satisfaction guarantee',
      'Eco-friendly cleaning products',
      'Clear flat-rate quotes — no hidden fees',
      'Service across Pennsylvania and New Jersey'
    ])}
    ${hr}
    ${p('We serve homeowners, renters, offices and businesses with different needs:', 'margin-bottom:8px')}
    ${bullet([
      'Regular house cleaning',
      'Apartment cleaning',
      'Move-in / move-out cleaning',
      'One-time deep cleaning',
      'Office and commercial cleaning',
      'CH ELITE Power Wash — driveways, patios, decks and siding'
    ])}
    ${highlight('Every visit is handled by trained, professional cleaners who respect your home and your time.')}
    ${btn('Request Your Free Quote', BOOKING_URL)}
    ${p('Lagos Cleaning Team', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Bonded, insured and background-checked — here is why homeowners choose Lagos Cleaning.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DEEP CLEANING EDUCATION — sent Day 2 after lead
// ═══════════════════════════════════════════════════════════════════════════════
function deepCleaningEdu(firstName) {
  return wrap(`
    ${h('Regular cleaning vs. deep cleaning: which one do you need?')}
    ${p(`Hi ${firstName},`)}
    ${p('A lot of clients ask us this question before booking.')}
    ${hr}
    ${p('<strong>Regular cleaning</strong> is for maintenance.', 'margin-bottom:8px')}
    ${p('It covers the visible areas of the home and keeps everything fresh week after week.')}
    ${p('<strong>Deep cleaning</strong> is for reset.', 'margin-bottom:8px')}
    ${p('It focuses on areas that collect buildup over time:', 'margin-bottom:8px')}
    ${bullet([
      'Baseboards and corners',
      'Bathrooms — grout, fixtures, tile',
      'Kitchen grease and appliances',
      'Cabinets inside and out',
      'Floors, detailed surfaces and hard-to-reach areas'
    ])}
    ${hr}
    ${highlight('If your home has not had a professional cleaning in a while, we recommend starting with a one-time deep clean, then moving to weekly or monthly maintenance.')}
    ${p('This gives your home a better starting point and makes future cleanings faster and easier to maintain.')}
    ${promoCode('LAGOS15', '15% OFF your first cleaning')}
    ${btn('Request Your Free Quote', BOOKING_URL)}
    ${p('Lagos Cleaning Team', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Which service does your home need? Here is the simple answer.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CH ELITE POWER WASH — sent Day 3 after lead
// ═══════════════════════════════════════════════════════════════════════════════
function powerWashElite(firstName) {
  return wrap(`
    ${h('Your driveway, patio or deck may need this.')}
    ${p(`Hi ${firstName},`)}
    ${p('The outside of your home creates the first impression before anyone walks through the door.')}
    ${p('Driveways, patios, decks, porches and siding collect dirt, mold, mildew, algae, tire marks and weather stains over time.')}
    ${hr}
    ${p('That is why we created <strong>CH ELITE Power Wash</strong>.')}
    ${p('This service is designed for homeowners who want their property to look cleaner, brighter and better maintained.')}
    ${p('CH ELITE can help with:', 'margin-bottom:8px')}
    ${bullet([
      'Driveways and concrete',
      'Patios and pavers',
      'Decks and porches',
      'Siding and exterior surfaces'
    ])}
    ${p('Our team uses <strong>commercial-grade equipment</strong>, biodegradable detergents and proven techniques to restore your outdoor surfaces safely and professionally.')}
    ${hr}
    ${highlight('<strong>Current seasonal offer: 20% OFF CH ELITE Power Wash Package.</strong><br>Limited spots available. Book before they fill up.')}
    ${btn('Book Power Wash Quote', BOOKING_URL)}
    ${p('Or reply with photos of the area you want cleaned and we will review it for you.', 'font-size:13px;color:#7a9a99;text-align:center;margin-top:12px')}
    ${p('CH ELITE Power Wash<br>by Lagos Cleaning', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Your outdoor surfaces may need this — 20% OFF CH ELITE Power Wash.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ESTIMATE FOLLOW-UP — sent 24h after quote if not booked
// ═══════════════════════════════════════════════════════════════════════════════
function estimateFollowup(firstName, serviceRequested = 'your requested service') {
  return wrap(`
    ${h(`${firstName}, do you want us to hold your quote?`)}
    ${p('I wanted to follow up on the quote we sent for:')}
    ${highlight(serviceRequested)}
    ${p('We can still help you get this scheduled.')}
    ${p('Before we move forward, I want to make sure everything was clear:', 'margin-bottom:8px')}
    ${bullet([
      'Service requested and what is included',
      'Flat-rate price — no hidden fees',
      'Available dates that fit your schedule',
      'Any special instructions or access notes'
    ])}
    ${hr}
    ${p('With Lagos Cleaning, your quote is simple and transparent.')}
    ${p('You are also protected by our <strong>100% satisfaction guarantee</strong>. If something is not right, contact us within 24 hours and we will make it right.')}
    ${btn('Confirm My Appointment', BOOKING_URL)}
    ${p('Or reply with <strong>"ready"</strong> and we will help schedule you.', 'font-size:13px;color:#5a7a79;text-align:center;margin-top:12px')}
    ${p('Lagos Cleaning Team', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Your quote is still waiting — here is how to confirm your appointment.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. SAME-WEEK BOOKING — sent Day 5 after lead, if not booked
// ═══════════════════════════════════════════════════════════════════════════════
function sameWeekBooking(firstName) {
  return wrap(`
    ${h('We still have limited cleaning spots this week.')}
    ${p(`Hi ${firstName},`)}
    ${p('We still have a few available cleaning spots this week in <strong>Pennsylvania and New Jersey</strong>.')}
    ${p('If you still need help with any of these:', 'margin-bottom:8px')}
    ${bullet([
      'House cleaning',
      'Apartment cleaning',
      'Deep cleaning',
      'Move-in / move-out cleaning',
      'Office cleaning',
      'Power washing'
    ])}
    ${p('Now is a good time to schedule before the calendar fills.')}
    ${hr}
    ${promoCode('LAGOS15', '15% OFF your first cleaning')}
    ${p('For CH ELITE Power Wash, ask us about the current seasonal <strong>20% OFF package</strong>.', 'font-size:13px;color:#5a7a79')}
    ${btn('Book This Week', BOOKING_URL)}
    ${p('Or reply with your preferred day and time and we will make it work.', 'font-size:13px;color:#7a9a99;text-align:center;margin-top:12px')}
    ${p('Lagos Cleaning Team', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Limited spots this week — book before your preferred date fills up.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. OBJECTION BREAKER — sent 48h after estimate if no response
// ═══════════════════════════════════════════════════════════════════════════════
function objectionBreaker(firstName) {
  return wrap(`
    ${h('Still thinking about it? Here is what to know first.')}
    ${p(`Hi ${firstName},`)}
    ${p('If you are still thinking about booking, here are a few things that may help.')}
    ${hr}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
      <tr><td style="padding:14px 0;border-bottom:1px solid #e0f0ef">
        <p style="color:#0d2c2b;font-size:14px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">Do I need to be home?</p>
        <p style="color:#2d4a49;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">No. Many clients provide entry instructions, and we take care of the cleaning while they are away.</p>
      </td></tr>
      <tr><td style="padding:14px 0;border-bottom:1px solid #e0f0ef">
        <p style="color:#0d2c2b;font-size:14px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">Do you bring supplies?</p>
        <p style="color:#2d4a49;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">Yes. Our team brings professional-grade supplies and equipment. You do not need to provide anything.</p>
      </td></tr>
      <tr><td style="padding:14px 0;border-bottom:1px solid #e0f0ef">
        <p style="color:#0d2c2b;font-size:14px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">Are you insured?</p>
        <p style="color:#2d4a49;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">Yes. Lagos Cleaning is bonded and insured. Your home is fully protected.</p>
      </td></tr>
      <tr><td style="padding:14px 0;border-bottom:1px solid #e0f0ef">
        <p style="color:#0d2c2b;font-size:14px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">What if I am not happy?</p>
        <p style="color:#2d4a49;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">You are covered by our 100% satisfaction guarantee. If something is missed, contact us within 24 hours and we will come back to re-clean at no charge.</p>
      </td></tr>
      <tr><td style="padding:14px 0">
        <p style="color:#0d2c2b;font-size:14px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">Do you serve my area?</p>
        <p style="color:#2d4a49;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">We serve the greater Philadelphia metro area, several Pennsylvania counties and South / Central New Jersey.</p>
      </td></tr>
    </table>
    ${btn('Schedule My Cleaning', BOOKING_URL)}
    ${p(`Still have a question? Text us: <strong>${PHONE}</strong>`, 'font-size:13px;color:#7a9a99;text-align:center;margin-top:12px')}
    ${p('Lagos Cleaning Team', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Quick answers to the most common questions before booking.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. POST-SERVICE CARE — sent same day after completed service
// ═══════════════════════════════════════════════════════════════════════════════
function postServiceCare(firstName, serviceType = 'cleaning service') {
  return wrap(`
    ${h(`${firstName}, your service is complete.`)}
    ${p(`Thank you for choosing Lagos Cleaning.`)}
    ${p(`Your <strong>${serviceType}</strong> has been completed. We appreciate the opportunity to take care of your home.`)}
    ${hr}
    ${p('A few important notes:', 'margin-bottom:8px')}
    ${bullet([
      'If everything looks good, no action is needed.',
      'If there is anything we missed, please contact us within 24 hours.',
      'Your service is protected by our 100% satisfaction guarantee.',
      'We will review the issue and make it right at no charge.'
    ])}
    ${hr}
    ${p('To keep your home fresh, we recommend recurring cleaning every:', 'margin-bottom:8px')}
    ${bullet([
      '<strong>Weekly</strong> — best for busy families and larger homes',
      '<strong>Bi-weekly</strong> — best for most homes with regular maintenance',
      '<strong>Monthly</strong> — best for lighter maintenance or smaller spaces',
      '<strong>Seasonally</strong> — for deep cleaning reset before or after a season'
    ])}
    ${btn('Schedule Your Next Cleaning', BOOKING_URL)}
    ${p(`Thank you again for choosing us.<br><strong>Lagos Cleaning Team</strong><br>${PHONE}`, 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Your Lagos Cleaning service is complete — here is what to know.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. REVIEW REQUEST — sent Day 2 after service
// ═══════════════════════════════════════════════════════════════════════════════
function reviewRequest(firstName) {
  return wrap(`
    ${h(`${firstName}, how did we do?`)}
    ${p('Thank you again for choosing Lagos Cleaning.')}
    ${p('If you were happy with the service, would you take 30 seconds to leave us a review?')}
    ${p('Your review helps other homeowners in PA and NJ feel confident choosing our team — and it helps our local business grow with people who deserve trustworthy service.')}
    ${hr}
    <div style="text-align:center;margin:24px 0">
      <div style="font-size:32px;letter-spacing:6px;color:#1a9e97;margin-bottom:8px">★★★★★</div>
      <div style="font-size:11px;letter-spacing:3px;color:#7a9a99;font-family:Arial,sans-serif">SHARE YOUR EXPERIENCE</div>
    </div>
    ${highlight('"Lagos Cleaning was professional, on time and did a great job. I highly recommend them." — A review like this takes 30 seconds and means everything to us.')}
    ${btn('Leave a Google Review', REVIEW_LINK)}
    ${p('Or reply to this email and share your feedback directly with our team.', 'font-size:13px;color:#7a9a99;text-align:center;margin-top:12px')}
    ${hr}
    ${p('If anything was not perfect on your last visit, please tell us. We will make it right.', 'font-size:13px;color:#7a9a99')}
    ${p('With gratitude,<br><strong>Lagos Cleaning Team</strong>', 'font-size:13px;color:#7a9a99;margin-top:20px')}
  `, 'How did we do? Your review helps other homeowners in PA & NJ find trusted cleaning service.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. REFERRAL PROGRAM — sent Day 7 after service
// ═══════════════════════════════════════════════════════════════════════════════
function referralProgram(firstName) {
  return wrap(`
    ${h('Give 10%, get $25 credit.')}
    ${p(`Hi ${firstName},`)}
    ${p('If you know someone who needs house cleaning, apartment cleaning, move-in / move-out cleaning, office cleaning or power washing, you can refer them to Lagos Cleaning.')}
    ${hr}
    ${p('Here is how it works:', 'margin-bottom:8px')}
    ${bullet([
      'Your friend gets <strong>10% OFF</strong> their first booking',
      'You receive a <strong>$25 credit</strong> toward your next service after they complete their first appointment',
      'No limit — the more people you refer, the more credits you earn'
    ])}
    ${hr}
    ${highlight('To refer someone, share our booking link or tell them to mention your name when they book.')}
    ${btn('Refer a Friend', REFERRAL_URL)}
    ${p(`Or send them our number: <strong>${PHONE}</strong>`, 'font-size:13px;color:#7a9a99;text-align:center;margin-top:12px')}
    ${p('Thank you for trusting Lagos Cleaning.<br><strong>Lagos Cleaning Team</strong>', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Refer a friend — they get 10% off, you get $25 credit.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 12. RECURRING CLEANING — sent Day 21 after service
// ═══════════════════════════════════════════════════════════════════════════════
function recurringCleaning(firstName) {
  return wrap(`
    ${h('Want to keep your home clean every month?')}
    ${p(`Hi ${firstName},`)}
    ${p('A one-time cleaning makes your home feel fresh. Recurring cleaning keeps it that way.')}
    ${p('Many Lagos Cleaning clients choose recurring service because it saves time, reduces stress and keeps the home consistently maintained.')}
    ${hr}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
      <tr><td style="padding:14px 16px;background:#f0fafa;border-left:3px solid #1a9e97;margin-bottom:8px;display:block">
        <p style="color:#0d2c2b;font-size:14px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">Weekly cleaning</p>
        <p style="color:#2d4a49;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">Best for busy families, larger homes and high-traffic spaces.</p>
      </td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:8px">
      <tr><td style="padding:14px 16px;background:#f7fffe;border-left:3px solid rgba(26,158,151,.4)">
        <p style="color:#0d2c2b;font-size:14px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">Bi-weekly cleaning</p>
        <p style="color:#2d4a49;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">Best for most homes that need consistent maintenance without daily upkeep.</p>
      </td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
      <tr><td style="padding:14px 16px;background:#f7fffe;border-left:3px solid rgba(26,158,151,.4)">
        <p style="color:#0d2c2b;font-size:14px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">Monthly cleaning</p>
        <p style="color:#2d4a49;font-size:14px;line-height:1.7;margin:0;font-family:Arial,sans-serif">Best for lighter maintenance or smaller homes that stay relatively clean.</p>
      </td></tr>
    </table>
    ${p('Recurring cleaning also helps prevent buildup in kitchens, bathrooms, floors and high-touch areas.')}
    ${hr}
    ${p('To set up recurring service, reply with <strong>"weekly"</strong>, <strong>"bi-weekly"</strong> or <strong>"monthly"</strong> and we will schedule you.', 'font-size:13px;color:#5a7a79')}
    ${btn('Set Up Recurring Service', BOOKING_URL)}
    ${p('Lagos Cleaning Team', 'font-size:13px;color:#7a9a99;margin-top:24px')}
  `, 'Keep your home consistently clean — set up weekly, bi-weekly or monthly service.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN NOTIFICATION — internal alert for every new request
// ═══════════════════════════════════════════════════════════════════════════════
function cleaningAdminNotification(requestData) {
  const {
    customer_name, customer_email, customer_phone,
    service_type, recurrence, address, city,
    preferred_date, description, calLink
  } = requestData;

  const fullAddress = [address, city].filter(Boolean).join(', ');

  return wrap(`
    <div style="display:inline-block;background:#e8f8f7;padding:4px 14px;margin-bottom:20px;border-radius:2px;border:1px solid rgba(26,158,151,.3)">
      <span style="color:#1a9e97;font-size:10px;letter-spacing:3px;font-family:Arial,sans-serif">NEW CLEANING REQUEST</span>
    </div>
    ${h('New Lead — Lagos Cleaning')}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
      ${[
        ['Name',      customer_name],
        ['Email',     customer_email],
        ['Phone',     customer_phone || '—'],
        ['Service',   service_type],
        ['Frequency', recurrence || 'One-time'],
        ['Address',   fullAddress || '—'],
        ['Date',      preferred_date || 'Flexible'],
        ['Notes',     description || '—']
      ].map(([k, v]) => detailRow(k, v || '—')).join('')}
    </table>
    ${calLink ? btn('📅 Add to Google Calendar', calLink) : ''}
    ${btn('View Admin Panel', BASE_URL + '/admin')}
  `, 'New cleaning request — Lagos Cleaning');
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING CONFIRMATION — sent to customer immediately after booking
// ═══════════════════════════════════════════════════════════════════════════════

// Supabase Storage hero image — replace URL when marketing photo is uploaded
const HERO_IMAGE_URL = 'https://lagosworld.app/images/marketing/email-hero.jpg';

// Map service_type to friendly label
const SERVICE_LABELS = {
  house: 'Home Cleaning', apartment: 'Apartment Cleaning',
  movein: 'Move-In / Move-Out Cleaning', onetime: 'One-Time Deep Clean',
  office: 'Office / Commercial Cleaning', residential: 'Residential Cleaning',
  power_deck: 'Deck Power Washing', power_patio: 'Patio Power Washing',
  power_siding: 'House Siding Power Wash', power_full: 'Full Exterior Power Wash',
  house_exterior: 'House Exterior Wash', driveway_sidewalk: 'Driveway & Sidewalk Wash',
  deck_patio: 'Deck & Patio Wash', roof_softwash: 'Roof Soft Wash',
  commercial: 'Commercial Power Washing', multiple: 'Multiple Services',
  power_washing: 'Power Washing',
};

const RECURRENCE_LABELS = {
  weekly: 'Weekly', biweekly: 'Every 2 Weeks', monthly: 'Monthly',
  'one-time': 'One-Time', onetime: 'One-Time',
};

function detailCard(rows) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
         style="background:#f0fafa;border:1px solid #c8e8e7;border-radius:6px;margin:24px 0;overflow:hidden">
    ${rows.filter(([,v]) => v && v !== '—').map(([label, value], i) => `
    <tr>
      <td style="padding:11px 20px;border-bottom:1px solid #daf0ef;background:${i%2===0?'#f0fafa':'#ffffff'}">
        <span style="font-size:10px;letter-spacing:2px;color:#1a9e97;text-transform:uppercase;font-family:Arial,sans-serif">${label}</span><br>
        <span style="font-size:14px;color:#0d2c2b;font-family:Arial,sans-serif;font-weight:bold">${value}</span>
      </td>
    </tr>`).join('')}
  </table>`;
}

function stepFlow(steps) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0">
    <tr>
      ${steps.map(([icon, label], i) => `
      <td align="center" style="padding:0 4px" width="${Math.floor(100/steps.length)}%">
        <div style="width:48px;height:48px;border-radius:50%;background:#1a9e97;margin:0 auto 8px;display:table;text-align:center">
          <span style="display:table-cell;vertical-align:middle;font-size:20px;line-height:1">${icon}</span>
        </div>
        <div style="font-size:11px;color:#2d4a49;font-family:Arial,sans-serif;text-align:center;line-height:1.4">${label}</div>
        ${i < steps.length-1 ? '' : ''}
      </td>
      ${i < steps.length-1 ? `<td style="color:#1a9e97;font-size:18px;padding-bottom:22px" align="center">→</td>` : ''}`).join('')}
    </tr>
  </table>`;
}

function calBtn(calLink) {
  if (!calLink) return '';
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 0">
    <tr><td style="background:#ffffff;border:2px solid #1a9e97;padding:12px 28px;text-align:center;border-radius:2px">
      <a href="${calLink}" style="color:#1a9e97;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1.5px;text-decoration:none;font-weight:bold">📅 ADD TO MY CALENDAR</a>
    </td></tr>
  </table>`;
}

function cleaningConfirmed(firstName, details = {}, calLink = null) {
  const {
    service_type = '', recurrence = '', address = '',
    city = '', preferred_date = ''
  } = details;

  const serviceLabel   = SERVICE_LABELS[service_type] || service_type || 'Cleaning Service';
  const recurrenceLabel = RECURRENCE_LABELS[recurrence] || recurrence || 'One-Time';
  const fullAddress    = [address, city].filter(Boolean).join(', ') || 'Address provided';
  const dateLabel      = preferred_date
    ? new Date(preferred_date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : 'Flexible — we\'ll confirm shortly';

  return wrap(`
    <!-- HERO IMAGE -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="margin:-36px -40px 28px;width:calc(100% + 80px)">
      <tr><td style="padding:0">
        <img src="${HERO_IMAGE_URL}"
             alt="Lagos Cleaning — Professional Home Cleaning"
             width="580" style="display:block;width:100%;max-width:580px;height:auto;object-fit:cover"
             onerror="this.style.display='none'">
      </td></tr>
    </table>

    <!-- CONFIRMED BADGE -->
    <div style="text-align:center;margin-bottom:8px">
      <span style="display:inline-block;background:#e8f8f7;border:1px solid rgba(26,158,151,.4);
                   padding:6px 20px;border-radius:30px;font-size:11px;letter-spacing:3px;
                   color:#1a9e97;font-family:Arial,sans-serif;text-transform:uppercase">
        ✔ &nbsp; Booking Confirmed
      </span>
    </div>

    <!-- HEADLINE -->
    <h1 style="text-align:center;font-family:Georgia,serif;font-size:26px;color:#0d2c2b;
               font-weight:normal;margin:16px 0 4px;letter-spacing:.5px">
      Your home is in great hands, ${firstName}!
    </h1>
    <p style="text-align:center;color:#1a9e97;font-size:14px;font-family:Arial,sans-serif;
              margin:0 0 28px;letter-spacing:.5px">
      We've received your request and our team will be in touch shortly to confirm your appointment.
    </p>

    <!-- BOOKING DETAILS CARD -->
    <div style="font-size:10px;letter-spacing:3px;color:#7a9a99;text-transform:uppercase;
                font-family:Arial,sans-serif;margin-bottom:8px">Your Booking Details</div>
    ${detailCard([
      ['Service',   serviceLabel],
      ['Date',      dateLabel],
      ['Location',  fullAddress],
      ['Frequency', recurrenceLabel],
    ])}

    <!-- CALENDAR BUTTON -->
    ${calBtn(calLink)}

    <!-- WHAT HAPPENS NEXT -->
    <div style="font-size:10px;letter-spacing:3px;color:#7a9a99;text-transform:uppercase;
                font-family:Arial,sans-serif;margin:32px 0 4px;text-align:center">What Happens Next</div>
    ${stepFlow([
      ['✅', 'Request<br>Confirmed'],
      ['📞', 'We Call to<br>Confirm Time'],
      ['🧹', 'Team<br>Arrives'],
    ])}

    <!-- GUARANTEE BANNER -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:linear-gradient(135deg,#0d2c2b,#124f4d);border-radius:6px;margin:28px 0">
      <tr><td style="padding:20px 24px;text-align:center">
        <div style="font-size:22px;margin-bottom:6px">⭐</div>
        <div style="font-size:14px;color:#ffffff;font-family:Georgia,serif;letter-spacing:.5px;margin-bottom:4px">
          100% Satisfaction Guaranteed
        </div>
        <div style="font-size:12px;color:#1a9e97;font-family:Arial,sans-serif">
          Not happy? We come back and make it right — free of charge.
        </div>
      </td></tr>
    </table>

    <!-- WHATSAPP CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:#f0fafa;border:1px solid #c8e8e7;border-radius:6px;margin:0 0 24px">
      <tr><td style="padding:18px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:24px;padding-right:14px;vertical-align:middle">💬</td>
            <td style="vertical-align:middle">
              <div style="font-size:13px;color:#0d2c2b;font-family:Arial,sans-serif;font-weight:bold;margin-bottom:2px">
                Questions? We're here.
              </div>
              <div style="font-size:12px;color:#2d4a49;font-family:Arial,sans-serif">
                Message us on WhatsApp — usually reply in under 5 minutes.
              </div>
            </td>
            <td style="padding-left:16px;white-space:nowrap;vertical-align:middle">
              <a href="${WA_LINK}" style="background:#25D366;color:#ffffff;font-family:Arial,sans-serif;
                                          font-size:11px;font-weight:bold;letter-spacing:1px;padding:10px 16px;
                                          text-decoration:none;border-radius:4px;display:inline-block">
                WHATSAPP
              </a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- BOOK BUTTON -->
    ${btn('View My Booking', BOOKING_URL)}

    <!-- CANCELLATION POLICY -->
    <p style="text-align:center;font-size:11px;color:#a0b8b7;font-family:Arial,sans-serif;
              margin:24px 0 0;line-height:1.6">
      Need to reschedule? No problem — just give us 24 hours notice.<br>
      Reply to this email or WhatsApp us at ${PHONE}.
    </p>
  `, `Your Lagos Cleaning booking is confirmed — we're coming to you, ${firstName}!`);
}
const cleaningFollowup24h   = estimateFollowup;
const cleaningReengagement  = sameWeekBooking;
const cleaningReview        = reviewRequest;
const cleaningReferral      = referralProgram;

module.exports = {
  // Full 12-template funnel
  welcomeLead,
  firstTimeOffer,
  trustBuilder,
  deepCleaningEdu,
  powerWashElite,
  estimateFollowup,
  sameWeekBooking,
  objectionBreaker,
  postServiceCare,
  reviewRequest,
  referralProgram,
  recurringCleaning,
  // Admin notification
  cleaningAdminNotification,
  // Customer confirmation (redesigned)
  cleaningConfirmed,
  // Legacy aliases
  cleaningFollowup24h,
  cleaningReengagement,
  cleaningReview,
  cleaningReferral,
  // Constants (used by email.js)
  WA_LINK,
  BOOKING_URL,
};
