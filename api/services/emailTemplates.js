/**
 * emailTemplates.js
 * Lagos Jewelry — 14-email funnel templates
 * Brand: dark #111, gold #c9a84c, cream #e4ddd0, Georgia/serif
 */

const BASE_URL = 'https://lagosworld.app';

// ── Shared wrapper ────────────────────────────────────────────────────────────
function wrap(content, previewText = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Lagos Jewelry</title>
${previewText ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${previewText}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</span>` : ''}
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:580px;background:#0d0d0d;border:1px solid rgba(201,168,76,.25);border-radius:2px">

      <!-- HEADER -->
      <tr><td style="padding:32px 40px 20px;text-align:center;border-bottom:1px solid rgba(201,168,76,.15)">
        <!-- LW Monogram Logo -->
        <div style="margin-bottom:14px">
          <img src="https://lagosworld.app/images/lw-logo.png" alt="LW" width="64" height="64"
               style="display:inline-block;width:64px;height:64px;border:0"
               onerror="this.style.display='none'">
          <!--[if !mso]><!-->
          <div style="display:none;font-size:0;max-height:0" aria-hidden="true">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
              <tr><td style="width:64px;height:64px;background:#0d0d0d;border:1px solid rgba(201,168,76,.3);text-align:center;vertical-align:middle">
                <span style="font-size:32px;color:#c9a84c;font-family:Georgia,serif;font-style:italic;font-weight:bold;letter-spacing:-2px">LW</span>
              </td></tr>
            </table>
          </div>
          <!--<![endif]-->
        </div>
        <div style="font-size:11px;letter-spacing:4px;color:#8a7a5e;font-family:Georgia,serif;margin-bottom:8px">✝</div>
        <div style="font-size:26px;letter-spacing:6px;color:#c9a84c;font-family:Georgia,serif;font-weight:normal">LAGOS</div>
        <div style="font-size:9px;letter-spacing:8px;color:#8a7a5e;margin-top:4px;font-family:Georgia,serif">J E W E L R Y</div>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:36px 40px">
        ${content}
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:24px 40px 36px;border-top:1px solid rgba(201,168,76,.15);text-align:center">
        <p style="font-size:11px;color:#5a4e3c;letter-spacing:1px;margin:0 0 8px;font-family:Georgia,serif;font-style:italic">
          "She is clothed with strength and dignity" — Proverbs 31:25
        </p>
        <p style="font-size:10px;color:#4a4032;margin:0;letter-spacing:1px">
          Lagos Jewelry · Philadelphia, PA · +12156262345
        </p>
        <p style="font-size:10px;color:#3a3028;margin:8px 0 0">
          <a href="${BASE_URL}/jewelry" style="color:#8a7a5e;text-decoration:none;letter-spacing:1px">Shop</a>
          &nbsp;·&nbsp;
          <a href="https://wa.me/12156262345" style="color:#8a7a5e;text-decoration:none;letter-spacing:1px">WhatsApp</a>
          &nbsp;·&nbsp;
          <a href="mailto:admin.lagosworld@gmail.com" style="color:#8a7a5e;text-decoration:none;letter-spacing:1px">Contact</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Gold CTA button ───────────────────────────────────────────────────────────
function btn(text, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0">
    <tr><td style="background:#c9a84c;padding:14px 36px;text-align:center">
      <a href="${url}" style="color:#0d0d0d;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-decoration:none;font-weight:bold">${text.toUpperCase()}</a>
    </td></tr>
  </table>`;
}

// ── Divider ───────────────────────────────────────────────────────────────────
const hr = `<div style="border-top:1px solid rgba(201,168,76,.2);margin:24px 0"></div>`;

// ── Body text style ───────────────────────────────────────────────────────────
function p(text, style = '') {
  return `<p style="color:#c8bfb0;font-size:15px;line-height:1.8;margin:0 0 16px;font-family:Georgia,serif;${style}">${text}</p>`;
}

function h(text) {
  return `<h2 style="color:#c9a84c;font-size:20px;letter-spacing:2px;font-weight:normal;margin:0 0 24px;font-family:Georgia,serif">${text}</h2>`;
}

function bullet(items) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px">
    ${items.map(i => `<tr>
      <td style="color:#c9a84c;padding-right:10px;font-size:14px;vertical-align:top;padding-bottom:8px">✦</td>
      <td style="color:#c8bfb0;font-size:14px;line-height:1.7;font-family:Georgia,serif;padding-bottom:8px">${i}</td>
    </tr>`).join('')}
  </table>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 1 — Welcome
// ═══════════════════════════════════════════════════════════════════════════════
function welcome(firstName) {
  return wrap(`
    ${h(`Welcome, ${firstName}.`)}
    ${p('Welcome to Lagos Jewelry.')}
    ${p('We created this collection for women who want more than accessories. Each piece was selected to bring elegance, confidence and meaning to your everyday life.')}
    ${hr}
    ${p('Here, you will find:', 'color:#8a7a5e;font-size:13px;letter-spacing:1px')}
    ${bullet([
      '18k gold-plated jewelry, hypoallergenic',
      'Elegant designs for daily wear',
      'Gift-ready options selected with care',
      'Pieces with beauty, strength and purpose'
    ])}
    ${hr}
    ${p('Whether you are choosing something for yourself or for someone special, our goal is simple:')}
    ${p('"To help you feel beautiful, confident and intentional."', 'color:#c9a84c;font-style:italic;font-size:16px')}
    ${btn('Shop Lagos Jewelry', BASE_URL + '/jewelry')}
    ${hr}
    <!-- Founder signature -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px">
      <tr>
        <td style="padding-right:16px;vertical-align:middle">
          <img src="https://lagosworld.app/images/dayane-1.png" alt="Dayane Lago" width="64" height="64"
               style="border-radius:50%;width:64px;height:64px;border:1px solid rgba(201,168,76,.3);object-fit:cover;display:block">
        </td>
        <td style="vertical-align:middle">
          <div style="color:#c9a84c;font-size:14px;font-family:Georgia,serif;font-style:italic">Dayane Lago</div>
          <div style="color:#8a7a5e;font-size:10px;letter-spacing:2px;margin-top:3px">FOUNDER · LAGOS WORLD</div>
        </td>
      </tr>
    </table>
  `, 'Discover jewelry made for women who carry beauty, strength and identity.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 2 — First Purchase Offer
// ═══════════════════════════════════════════════════════════════════════════════
function firstPurchaseOffer(firstName) {
  return wrap(`
    ${h(`A special gift for you, ${firstName}.`)}
    ${p('Your first piece from Lagos Jewelry should feel special.')}
    ${p('That is why we prepared a welcome offer:')}
    <div style="text-align:center;margin:28px 0;padding:24px;border:1px solid rgba(201,168,76,.3)">
      <div style="font-size:11px;letter-spacing:4px;color:#8a7a5e;margin-bottom:8px">USE CODE</div>
      <div style="font-size:32px;letter-spacing:8px;color:#c9a84c;font-family:Georgia,serif">WELCOME10</div>
      <div style="font-size:11px;letter-spacing:2px;color:#8a7a5e;margin-top:8px">10% OFF YOUR FIRST ORDER</div>
    </div>
    ${p('This is a perfect moment to choose a piece for:')}
    ${bullet([
      'Your everyday look',
      'A special occasion or birthday gift',
      'A meaningful surprise',
      'A simple upgrade to your presence'
    ])}
    ${btn('Use My 10% Discount', BASE_URL + '/jewelry')}
    ${hr}
    ${p('This offer is available for a limited time.', 'font-size:12px;color:#5a4e3c;text-align:center')}
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e')}
  `, 'Your first Lagos Jewelry piece deserves something special.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 3 — Brand Story
// ═══════════════════════════════════════════════════════════════════════════════
function brandStory(firstName) {
  return wrap(`
    ${h('Why Lagos Jewelry was created.')}
    ${p(`Hi ${firstName},`)}
    ${p('Lagos Jewelry was created with a clear purpose:')}
    ${p('"To help women feel elegant, confident and connected to who they are."', 'color:#c9a84c;font-style:italic;font-size:16px;text-align:center')}
    ${hr}
    ${p('We believe jewelry is not only about appearance. It is about <em>presence</em>.')}
    ${p('The right piece can change how a woman walks into a room. It can mark a season, honor a moment, or become part of her personal identity.')}
    ${p('That is why every piece in our collection is selected with intention.')}
    <div style="text-align:center;margin:24px 0">
      ${['Not random.', 'Not ordinary.', 'Not without meaning.'].map(s =>
        `<div style="color:#c9a84c;font-size:14px;letter-spacing:3px;margin:8px 0">${s}</div>`
      ).join('')}
    </div>
    ${p('Lagos Jewelry is for women who value beauty, strength and purpose.')}
    ${btn('Discover the Collection', BASE_URL + '/jewelry')}
    ${hr}
    <!-- Founder photo - brand story -->
    <div style="text-align:center;margin:20px 0 0">
      <img src="https://lagosworld.app/images/dayane-2.png" alt="Dayane Lago — Lagos World"
           width="280" style="width:280px;max-width:100%;border:1px solid rgba(201,168,76,.2);display:inline-block">
      <div style="color:#8a7a5e;font-size:10px;letter-spacing:3px;margin-top:8px">DAYANE LAGO · FOUNDER</div>
    </div>
  `, 'This is more than jewelry. This is identity, beauty and purpose.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 4 — Abandoned Cart 1
// ═══════════════════════════════════════════════════════════════════════════════
function abandonedCart1(firstName) {
  return wrap(`
    ${h('You left something beautiful behind.')}
    ${p(`Hi ${firstName},`)}
    ${p('You left a beautiful piece in your cart.')}
    ${p('Sometimes the right jewelry finds you before you are ready to decide.')}
    ${hr}
    ${p('Your selected item is still available — but some pieces may sell out. Quantities are limited.', 'color:#c9a84c;font-style:italic')}
    ${hr}
    ${p('Review your cart and complete your order when you are ready.')}
    ${btn('Return to My Cart', BASE_URL + '/jewelry')}
    ${hr}
    ${p('Need help choosing? Message us on WhatsApp anytime.', 'font-size:12px;color:#5a4e3c;text-align:center')}
    <div style="text-align:center;margin-top:8px">
      <a href="https://wa.me/12156262345" style="color:#c9a84c;font-size:12px;letter-spacing:2px;text-decoration:none">OPEN WHATSAPP →</a>
    </div>
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Your Lagos Jewelry piece is still waiting for you.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 5 — Abandoned Cart 2
// ═══════════════════════════════════════════════════════════════════════════════
function abandonedCart2(firstName) {
  return wrap(`
    ${h('Still thinking about it?')}
    ${p(`Hi ${firstName},`)}
    ${p('Here is why many women choose our pieces:')}
    ${bullet([
      'Elegant design for everyday wear',
      '18k gold-plated finish',
      'Hypoallergenic materials — safe for sensitive skin',
      'Easy to combine with any outfit',
      'Perfect for personal use or gifting',
      'Selected with care by Lagos Jewelry'
    ])}
    ${hr}
    ${p('"Jewelry is one of the simplest ways to elevate your look without changing your entire wardrobe."', 'color:#c9a84c;font-style:italic;font-size:15px')}
    ${hr}
    ${p('A small detail can change the whole presence.')}
    ${btn('Complete My Order', BASE_URL + '/jewelry')}
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Elegant, hypoallergenic and selected for everyday beauty.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 6 — Abandoned Cart 3 (incentive)
// ═══════════════════════════════════════════════════════════════════════════════
function abandonedCart3(firstName) {
  return wrap(`
    ${h('Last chance.')}
    ${p(`Hi ${firstName},`)}
    ${p('This is your final reminder.')}
    ${p('The piece you selected is still in your cart — but availability can change.')}
    ${p('To help you complete your order today, use this code:')}
    <div style="text-align:center;margin:28px 0;padding:24px;border:1px solid rgba(201,168,76,.3)">
      <div style="font-size:11px;letter-spacing:4px;color:#8a7a5e;margin-bottom:8px">DISCOUNT CODE</div>
      <div style="font-size:32px;letter-spacing:8px;color:#c9a84c;font-family:Georgia,serif">LAGOS10</div>
      <div style="font-size:11px;letter-spacing:2px;color:#8a7a5e;margin-top:8px">10% OFF — TODAY ONLY</div>
    </div>
    ${p('If you were choosing a gift — this is the moment to secure it.<br>If you were choosing something for yourself — this is your sign.')}
    ${btn('Complete My Order Now', BASE_URL + '/jewelry')}
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Complete your order before your selected piece is gone.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 7 — Browse Abandonment
// ═══════════════════════════════════════════════════════════════════════════════
function browseAbandonment(firstName) {
  return wrap(`
    ${h('We noticed you liked this piece.')}
    ${p(`Hi ${firstName},`)}
    ${p('We noticed you were looking at one of our pieces.')}
    ${p('Good choice.', 'color:#c9a84c;font-style:italic;font-size:18px;text-align:center')}
    ${hr}
    ${p('That design is ideal for women who want something elegant, versatile and easy to wear with different outfits.')}
    ${p('You can wear it for:')}
    ${bullet([
      'Work and professional settings',
      'Dinner and special occasions',
      'Church and Sunday service',
      'Meetings and presentations',
      'Everyday confidence'
    ])}
    ${p('Take another look before it is gone.')}
    ${btn('View This Piece Again', BASE_URL + '/jewelry')}
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Take another look at one of our most elegant selections.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 8 — Order Confirmation (post-purchase)
// ═══════════════════════════════════════════════════════════════════════════════
function orderConfirmation({ name, phone, email, address, city, state, zip, payment, items, total, shipping, deliveryType, notes }) {
  const firstName = (name || '').split(' ')[0];
  const itemRows = (items || []).map(i =>
    `<tr>
      <td style="color:#c8bfb0;font-size:14px;padding:10px 0;border-bottom:1px solid rgba(201,168,76,.1);font-family:Georgia,serif">
        ${i.name} ${i.variant ? `<span style="color:#8a7a5e">(${i.variant})</span>` : ''} ×${i.qty}
      </td>
      <td style="color:#c9a84c;font-size:14px;padding:10px 0;border-bottom:1px solid rgba(201,168,76,.1);text-align:right;font-family:Georgia,serif">
        $${(i.price * i.qty).toFixed(2)}
      </td>
    </tr>`
  ).join('');

  const payBlock = payment === 'zelle'
    ? `<div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);padding:16px 20px;margin:20px 0">
        <div style="color:#c9a84c;font-size:11px;letter-spacing:3px;margin-bottom:8px">PAYMENT — ZELLE</div>
        <div style="color:#c8bfb0;font-size:14px;line-height:1.7">
          Send to: <strong style="color:#c9a84c">+12156262345 — Dayane Lago</strong><br>
          Send proof via WhatsApp: +12156262345<br>
          or email: binnovationmarketing@gmail.com
        </div>
      </div>`
    : `<div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);padding:16px 20px;margin:20px 0">
        <div style="color:#c9a84c;font-size:11px;letter-spacing:3px;margin-bottom:8px">PAYMENT — CASH</div>
        <div style="color:#c8bfb0;font-size:14px">
          ${deliveryType === 'local' ? 'Same city — 4h delivery ($10 fee)' : 'Outside city — 6h delivery ($20 fee)'}
        </div>
      </div>`;

  return wrap(`
    ${h(`Order confirmed, ${firstName}.`)}
    ${p('Thank you for choosing Lagos Jewelry. Your order has been received and is being prepared with care.')}
    ${hr}
    <div style="margin-bottom:20px">
      <div style="font-size:10px;letter-spacing:3px;color:#8a7a5e;margin-bottom:12px">CUSTOMER</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
        <tr><td style="color:#8a7a5e;font-size:12px;padding-bottom:6px">Name</td><td style="color:#c8bfb0;font-size:13px;text-align:right">${name}</td></tr>
        <tr><td style="color:#8a7a5e;font-size:12px;padding-bottom:6px">Phone</td><td style="color:#c8bfb0;font-size:13px;text-align:right">${phone || '—'}</td></tr>
        <tr><td style="color:#8a7a5e;font-size:12px;padding-bottom:6px">Email</td><td style="color:#c8bfb0;font-size:13px;text-align:right">${email || '—'}</td></tr>
        <tr><td style="color:#8a7a5e;font-size:12px">Ship to</td><td style="color:#c8bfb0;font-size:13px;text-align:right">${address}, ${city}, ${state} ${zip}</td></tr>
      </table>
    </div>
    ${hr}
    <div style="font-size:10px;letter-spacing:3px;color:#8a7a5e;margin-bottom:12px">ORDER</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
      <tr>
        <td style="color:#8a7a5e;font-size:13px;padding-top:12px">Shipping</td>
        <td style="color:#c8bfb0;font-size:13px;text-align:right;padding-top:12px">${shipping === 0 ? '🎉 FREE' : '$' + Number(shipping).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="color:#c9a84c;font-size:17px;letter-spacing:1px;padding-top:12px;font-family:Georgia,serif">TOTAL</td>
        <td style="color:#c9a84c;font-size:17px;text-align:right;padding-top:12px;font-family:Georgia,serif"><strong>$${Number(total).toFixed(2)}</strong></td>
      </tr>
    </table>
    ${payBlock}
    ${notes ? `${hr}${p(`<em>Notes:</em> ${notes}`, 'font-size:13px;color:#8a7a5e')}` : ''}
    ${hr}
    ${p('Any questions? Message us on WhatsApp anytime.', 'font-size:12px;color:#5a4e3c;text-align:center')}
    <div style="text-align:center;margin-top:8px">
      <a href="https://wa.me/12156262345" style="color:#c9a84c;font-size:12px;letter-spacing:2px;text-decoration:none">WHATSAPP →</a>
    </div>
  `, 'Your new piece is being prepared with care.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 9 — Jewelry Care (day 3)
// ═══════════════════════════════════════════════════════════════════════════════
function jewelryCare(firstName) {
  return wrap(`
    ${h('How to keep your jewelry beautiful.')}
    ${p(`Hi ${firstName},`)}
    ${p('Your Lagos Jewelry piece was selected to bring elegance to your everyday life.')}
    ${p('To keep it beautiful for longer, follow these simple care steps:')}
    ${hr}
    ${[
      ['Put jewelry on last', 'After perfume, lotion and makeup — never before.'],
      ['Avoid water', 'Remove before showering, swimming, gym or beach.'],
      ['Store separately', 'Each piece in its own pouch or compartment.'],
      ['Clean gently', 'Use a soft, dry cloth. No chemicals or ultrasonic cleaners.'],
      ['Keep it dry', 'Store in a cool, dry place away from direct sunlight.']
    ].map(([title, desc]) =>
      `<div style="margin-bottom:20px;padding-left:16px;border-left:2px solid #c9a84c">
        <div style="color:#c9a84c;font-size:12px;letter-spacing:2px;margin-bottom:4px">${title.toUpperCase()}</div>
        <div style="color:#c8bfb0;font-size:14px;line-height:1.7">${desc}</div>
      </div>`
    ).join('')}
    ${hr}
    ${p('"The better you care for your piece, the longer it keeps its shine."', 'color:#c9a84c;font-style:italic;text-align:center')}
    ${btn('Shop New Arrivals', BASE_URL + '/jewelry')}
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Simple care tips for your Lagos Jewelry piece.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 10 — Cross-sell (day 7)
// ═══════════════════════════════════════════════════════════════════════════════
function crossSell(firstName) {
  return wrap(`
    ${h('Complete your look.')}
    ${p(`Hi ${firstName},`)}
    ${p('Your recent Lagos Jewelry piece can become even more elegant when paired with the right match.')}
    ${hr}
    ${p('We selected pieces that combine beautifully with your order:')}
    ${bullet([
      'Delicate earrings to frame your face',
      'Matching bracelet for layered elegance',
      'Minimalist necklace as a daily staple',
      'Elegant ring for a complete set',
      'Gift-ready set for someone special'
    ])}
    ${hr}
    <div style="text-align:center;margin:20px 0">
      <div style="color:#c8bfb0;font-size:14px;line-height:2;letter-spacing:1px">
        One main piece.<br>
        One supporting piece.<br>
        One final detail.
      </div>
      <div style="color:#c9a84c;font-size:13px;letter-spacing:2px;margin-top:12px;font-style:italic">
        That is enough to elevate your presence.
      </div>
    </div>
    ${btn('Complete My Look', BASE_URL + '/jewelry')}
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Your new jewelry piece pairs beautifully with these selections.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 11 — Review Request (day 10)
// ═══════════════════════════════════════════════════════════════════════════════
function reviewRequest(firstName) {
  return wrap(`
    ${h('How did you feel wearing it?')}
    ${p(`Hi ${firstName},`)}
    ${p('We hope you are enjoying your Lagos Jewelry piece.')}
    ${hr}
    <div style="text-align:center;margin:24px 0">
      <div style="font-size:24px;letter-spacing:6px;color:#c9a84c">★★★★★</div>
      <div style="font-size:11px;letter-spacing:3px;color:#8a7a5e;margin-top:8px">YOUR REVIEW MATTERS</div>
    </div>
    ${hr}
    ${p('Your opinion helps other women choose with confidence and helps our small business grow with trust.')}
    ${p('It only takes one minute — and it means everything to us.')}
    ${btn('Leave a Review', 'https://wa.me/12156262345?text=My+review+for+Lagos+Jewelry:')}
    ${hr}
    ${p('Thank you for supporting Lagos Jewelry.<br><br>With care,<br>Dayane Lago', 'font-size:13px;color:#8a7a5e')}
  `, 'Your opinion helps other women choose with confidence.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 12 — Referral (day 21)
// ═══════════════════════════════════════════════════════════════════════════════
function referral(firstName) {
  return wrap(`
    ${h('Share beauty with someone you love.')}
    ${p(`Hi ${firstName},`)}
    ${p('Do you know a woman who would love Lagos Jewelry?')}
    <div style="text-align:center;margin:24px 0;line-height:2.2">
      <div style="color:#c8bfb0;font-size:15px">A friend.</div>
      <div style="color:#c8bfb0;font-size:15px">A sister.</div>
      <div style="color:#c8bfb0;font-size:15px">A mother.</div>
      <div style="color:#c8bfb0;font-size:15px">A daughter.</div>
      <div style="color:#c9a84c;font-size:15px;font-style:italic;margin-top:8px">Someone who deserves something beautiful.</div>
    </div>
    ${hr}
    ${p('Share Lagos Jewelry with her. When someone you refer places an order, you receive a special thank-you reward from us.')}
    ${p('"Because beauty grows when it is shared."', 'color:#c9a84c;font-style:italic;text-align:center')}
    ${btn('Refer a Friend', 'https://wa.me/12156262345?text=I+want+to+refer+a+friend+to+Lagos+Jewelry')}
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Give beauty, receive appreciation.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 13 — Gift Campaign (seasonal)
// ═══════════════════════════════════════════════════════════════════════════════
function giftCampaign(firstName, occasion = 'someone special') {
  return wrap(`
    ${h('A meaningful gift for ' + occasion + '.')}
    ${p(`Hi ${firstName},`)}
    ${p('Some gifts are useful. Others are <em>remembered</em>.')}
    ${p('Jewelry has a different meaning — it becomes part of someone\'s story.', 'color:#c9a84c')}
    ${hr}
    ${p('If you are looking for a gift, Lagos Jewelry has elegant options for:')}
    ${bullet([
      'Birthdays and anniversaries',
      'Mother\'s Day and Valentine\'s Day',
      'Christmas and graduation',
      'Personal milestones',
      'A simple "I love you"'
    ])}
    ${hr}
    ${p('"Choose a piece that says what words sometimes cannot."', 'color:#c9a84c;font-style:italic;text-align:center;font-size:16px')}
    ${btn('Shop Gift Ideas', BASE_URL + '/jewelry')}
    ${p('With care,<br>Lagos Jewelry', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Jewelry is one of the most personal gifts a woman can receive.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 14 — VIP Invitation (after 2+ purchases)
// ═══════════════════════════════════════════════════════════════════════════════
function vipInvitation(firstName) {
  return wrap(`
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:6px;color:#c9a84c;margin-bottom:4px">EXCLUSIVE INVITATION</div>
      <div style="width:40px;height:1px;background:#c9a84c;margin:12px auto"></div>
    </div>
    ${h(`You are invited, ${firstName}.`)}
    ${p('Because you are part of our Lagos Jewelry community, we want to invite you to our <strong style="color:#c9a84c">VIP list</strong>.')}
    ${hr}
    ${p('As a VIP member, you receive:')}
    ${bullet([
      'Early access to new collections before public launch',
      'Private offers and exclusive discounts',
      'Limited and curated pieces',
      'Gift campaigns and seasonal specials',
      'Personal styling recommendations from Dayane'
    ])}
    ${hr}
    ${p('"Lagos Jewelry VIP is for women who want first access to what is new, elegant and meaningful."', 'color:#c9a84c;font-style:italic;text-align:center')}
    <div style="text-align:center;margin:28px 0;padding:20px;border:1px solid rgba(201,168,76,.4)">
      <div style="font-size:10px;letter-spacing:5px;color:#8a7a5e">SPOTS ARE LIMITED</div>
    </div>
    ${btn('Join VIP List', 'https://wa.me/12156262345?text=I+want+to+join+Lagos+Jewelry+VIP')}
    ${p('With care,<br>Dayane Lago<br>Lagos World', 'font-size:13px;color:#8a7a5e;margin-top:24px')}
  `, 'Early access, special pieces and private offers.');
}

// ── Admin notification template ───────────────────────────────────────────────
function adminNotification(subject, details) {
  const rows = Object.entries(details).map(([k, v]) =>
    `<tr>
      <td style="color:#8a7a5e;font-size:12px;letter-spacing:1px;padding:8px 0;border-bottom:1px solid rgba(201,168,76,.1);white-space:nowrap;padding-right:20px">${k.toUpperCase()}</td>
      <td style="color:#c8bfb0;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(201,168,76,.1)">${v || '—'}</td>
    </tr>`
  ).join('');

  return wrap(`
    <div style="display:inline-block;background:rgba(201,168,76,.15);padding:4px 12px;margin-bottom:20px">
      <span style="color:#c9a84c;font-size:10px;letter-spacing:3px">ADMIN NOTIFICATION</span>
    </div>
    ${h(subject)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows}
    </table>
    ${btn('View Admin Panel', BASE_URL + '/admin')}
  `, subject);
}

module.exports = {
  welcome,
  firstPurchaseOffer,
  brandStory,
  abandonedCart1,
  abandonedCart2,
  abandonedCart3,
  browseAbandonment,
  orderConfirmation,
  jewelryCare,
  crossSell,
  reviewRequest,
  referral,
  giftCampaign,
  vipInvitation,
  adminNotification
};
