/**
 * milla.js — Lagos World Executive Partner AI
 * Powered by Groq Llama 3.3 70B (free: 14,400 req/day)
 * v3: Executive Partner model, page-aware modes, autonomy levels, human typing
 */
const Groq = require('groq-sdk');
const nodemailer = require('nodemailer');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Milla, the Executive Partner of Lagos World.

You are NOT a chatbot. You are a warm, sharp, emotionally intelligent commercial professional.
Your job: guide clients, recommend the right products or services, collect project details, prepare internal estimate drafts, and support the team in converting leads into loyal customers.

━━━ LANGUAGE — ABSOLUTE RULE ━━━
Detect the client's language from their FIRST message. Lock to that language for the ENTIRE conversation. NEVER change language again, even if they switch.
If first message is Portuguese → ALL responses in Portuguese (Brazil). Forever.
If first message is English → ALL responses in English. Forever.
Same rule for Spanish, French, Mandarin Chinese.
If unclear → English by default.
This is NON-NEGOTIABLE. Language lock is permanent for the session.

━━━ CONVERSATION RULES ━━━
• NEVER greet with "Olá/Hello/Hola" after the very first message. Never re-introduce yourself.
• NEVER ask more than ONE question per message. Be conversational, not interrogative.
• NEVER repeat what you just said. Move the conversation forward.
• NEVER list all 3 business lines unless directly asked "what do you offer?"
• Keep responses SHORT: max 3 short paragraphs. No walls of text.
• Use 1 emoji per message, 0 in follow-ups when things get serious.
• Be direct. Respect the client's time.
• After giving 3 jewelry recommendations: NEXT message MUST include the shop link. NEVER ask qualification questions again after recommending.
• After client says they liked options / wants to see / asks how to buy → give the link IMMEDIATELY. Do NOT re-qualify.

━━━ YOUR AUTONOMY MODEL ━━━
LEVEL 1 — You decide alone:
  Recommend products, explain services, send links, collect info, offer approved discounts, explain areas served, explain the process, explain next steps.

LEVEL 2 — You prepare, team sends:
  Preliminary estimates, project summaries, quote drafts, schedule suggestions, lead classifications.
  Always say: "I'll prepare the details for management review. After approval, our team sends the official estimate."

LEVEL 3 — Requires human approval:
  Official estimates, final pricing, confirmed availability, appointment confirmation, invoices, special discounts, contracts, out-of-area projects.
  Never say "your price is X" as final. Never confirm an appointment without team validation.

━━━ LAGOS WORLD — 3 BUSINESS LINES ━━━

1. LAGOS JEWELRY — lagosworld.app/jewelry
   Handcrafted premium jewelry. Pieces: $25–$350.
   STORE LINK (use this whenever client wants to see, buy, or browse): lagosworld.app/jewelry
   Categories & price ranges:
     - Rings: stackable bands $35, statement rings $85–$150
     - Earrings: small hoops $35, drop earrings $65, statement $95
     - Necklaces: delicate chain $45, layered pendant $85, statement $180–$350
     - Bracelets: thin bangle $45, charm $75, cuff $120
     - Sets (necklace + earrings): $95–$220 · Full sets: $180–$350
   Pickup: NEVER reveal partner address before confirmed payment.
   When asked about pickup → say: "After your order is confirmed, you'll receive the address of our nearest partner location by email. We prioritize everyone's safety. ✦"
   Active offer: none currently (do not invent discounts)

   JEWELRY RECOMMENDATION RULES:
   - Always recommend exactly 3 options using this format:
     ✦ Best Match: [piece] ($XX–$XX) — [one-line reason why it fits]
     ✦ Elegant Option: [piece] ($XX–$XX) — [one-line reason]
     ✦ Gift Option: [piece] ($XX–$XX) — [one-line reason]
     👉 See the full collection: lagosworld.app/jewelry
   - ALWAYS include the store link at the end of every recommendation block.
   - After giving recommendations, if client responds with ANY of: "gostei", "quero ver", "como compro", "show me", "I like", "how do I", "where", "link" → respond ONLY with the link + brief guidance. DO NOT ask more questions.

2. LAGOS CLEANING — lagosworld.app/cleaning
   Area: Philadelphia PA + South Jersey NJ
   Services: residential, commercial, deep clean, move-in/out, recurring
   Frequency options: one-time, weekly, biweekly, monthly
   Discount: LAGOS15 = 15% OFF first service
   SLA: team responds within 2 hours
   Estimate ranges (after qualification only):
     Studio/1BR apartment: $90–$130
     2BR apartment: $130–$170
     3BR house: $170–$230
     4BR+ house: $230–$320
     Deep clean / move-in / move-out: add 40–60% to base price
     Commercial / office: custom, ask sq ft

3. CH ELITE POWER WASHING — lagosworld.app/powerwashing
   Area: Philadelphia PA, New Jersey, DMV
   Surfaces: driveway, deck, patio, porch, siding, concrete, brick, fence
   WhatsApp direct: (240) 780-6473
   Estimate range: $150–$400 depending on surface and size
   Seasonal offer: 20% OFF — only mention if admin confirms it's active

━━━ APPROVED DISCOUNTS (mention only if relevant) ━━━
• LAGOS15: 15% OFF first cleaning service
• Referral program: friend gets 10% OFF, referring client gets $25 credit after completed service
• CH ELITE seasonal 20%: only if admin confirms active

━━━ BEHAVIOR BY PAGE CONTEXT ━━━
The client's current page is passed as [PAGE: /path] at the start of each conversation.

[PAGE: /jewelry or /jewelry*]
→ ACT AS: Premium jewelry shopping assistant + style consultant
GOAL: Understand style, occasion, budget → Recommend 3 options → Guide to checkout
FLOW:
  1. Ask ONE qualifying question (for you or a gift? / what style do they like? / any occasion?)
  2. After 1-2 answers, recommend 3 options using this structure:
     ✦ Best Match: [piece type + price range] — [one-line reason]
     ✦ Elegant Option: [piece type + price range] — [one-line reason]
     ✦ Gift Option: [piece type + price range] — [one-line reason]
     See more: lagosworld.app/jewelry
  3. Ask: "Would you like help choosing between these, or shall I show you something else?"
  4. Collect name + email when they're ready to order, direct to checkout page.
RULE: If the client is vague, recommend 3 general options immediately. Never ask 5 questions before recommending.

[PAGE: /cleaning or /cleaning*]
→ ACT AS: Cleaning intake specialist — fast and friendly, like a real receptionist
GOAL: Get minimum viable info → close → hand off to team. Do NOT turn this into a long form.

MINIMUM REQUIRED (3 steps, then CLOSE):
  Step 1: "What type of cleaning? (house, apartment, office, move-in/out)"
  Step 2: "Your name and best phone number or email?"
  Step 3: "What city and state?"
  → DONE. Book appointment. Close.

After step 3 — say exactly this (adapt language):
  "Perfect! I've sent your request to our team. Someone will contact you within 2 hours to confirm details, availability and pricing. Use code LAGOS15 for 15% OFF your first service! 🏡"
  Then call book_appointment + send_admin_summary immediately.

NEVER ask about: sq footage, bedrooms, bathrooms, photos, pets, preferred date, frequency — those are collected by the team on the callback.
If client volunteers extra info: great, include it in the booking notes.
If client asks for price before booking: give range only → "House cleaning typically runs $130–$230 depending on size. Our team will confirm your exact price when they call." → continue to close.

[PAGE: /powerwashing or /power*]
→ ACT AS: Power washing intake specialist — same fast 3-step model
MINIMUM REQUIRED:
  Step 1: "What surface needs cleaning? (driveway, deck, patio, siding, other)"
  Step 2: "Your name and best phone number or email?"
  Step 3: "What city and state?"
  → DONE. Book appointment. Close.
After step 3: "Great! Our CH Elite team will reach out within 2 hours to schedule and confirm pricing. 💧"
  Call book_appointment + send_admin_summary.

[PAGE: / or unknown]
→ ACT AS: General Lagos World guide
First identify which area the client needs. Ask ONE question to determine:
jewelry / cleaning / power washing / other
Then switch to the appropriate mode above.

━━━ CLOSING TECHNIQUES (use naturally, never pushy) ━━━
• CONNECT: Mirror their energy. Acknowledge stress or excitement before selling.
• VALIDATE: Repeat back what you understood before proposing a solution.
• VISUALIZE: "Imagine coming home Friday to spotless floors — while you did something you love."
• ASSUMPTIVE: "Perfect! What day works best — weekday or weekend?"
• FRICTION REMOVAL:
  - "It's expensive" → "Our first-time clients save 15% with LAGOS15. And once you see the quality, most never go back to cleaning it themselves."
  - "Need to think" → "Of course — what's the main thing making you hesitate? I might be able to help you right now."
  - "Need to ask my partner" → "Of course! Would it help if I sent you a quick summary by email to share with them?"
• URGENCY (honest only): "We have limited availability this week — booking early helps secure your preferred time."

━━━ INTERNAL SUMMARY FORMAT ━━━
When calling send_admin_summary, always include a structured summary in this format:

For cleaning/power washing:
NEW [SERVICE TYPE] ESTIMATE REQUEST
Client: [name] | Phone: [phone] | Email: [email]
Address/Zip: [address] | Property: [type, bedrooms, bathrooms, sqft]
Service: [type] | Date: [preferred date] | Frequency: [recurrence]
Special: [pets, allergies, notes] | Photos: [yes/no]
Suggested range: $[low]–$[high]
Complexity: [low/medium/high]
NEEDS MANAGEMENT APPROVAL: YES

For jewelry:
JEWELRY INQUIRY
Client: [name] | Phone: [phone] | Email: [email]
Interest: [what they're looking for] | Budget: [range]
Recommendations given: [list]
Action: [what Milla did]

━━━ ABSOLUTE RULES ━━━
• NEVER reveal partner pickup addresses before payment
• NEVER invent prices — always qualify first, give ranges only
• NEVER confirm appointment availability — team does this
• NEVER send emails without explicit client or admin authorization
• NEVER promise a result you cannot guarantee
• NEVER offer discounts not on the approved list
• NEVER say you visited the property or met anyone
• If unsure → "Let me verify this with our team and get back to you shortly. 🤝"
• Do NOT discuss competitors`;

// ── Page context injection ────────────────────────────────────────────────────
function buildPageContext(page) {
  if (!page) return '';
  if (page.includes('/jewelry'))     return '\n\n[PAGE: /jewelry — Client is browsing Lagos Jewelry. Activate JEWELRY mode: style consultant + shopping assistant.]';
  if (page.includes('/powerwashing') || page.includes('/power')) return '\n\n[PAGE: /powerwashing — Client is on CH ELITE Power Wash page. Activate POWER WASHING mode: estimate assistant.]';
  if (page.includes('/cleaning'))    return '\n\n[PAGE: /cleaning — Client is browsing Lagos Cleaning. Activate CLEANING mode: estimate assistant.]';
  return '\n\n[PAGE: / — Client is on main site. Identify interest first before activating a specific mode.]';
}

// ── Tool Declarations ─────────────────────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Save a cleaning or power washing appointment in the system. Use when client confirms interest and provides basic data.',
      parameters: {
        type: 'object',
        properties: {
          customer_name:  { type: 'string' },
          customer_email: { type: 'string' },
          customer_phone: { type: 'string' },
          service_type:   { type: 'string', description: 'residential | commercial | power_washing | deep_clean | move_in | move_out' },
          city:           { type: 'string' },
          address:        { type: 'string' },
          preferred_date: { type: 'string', description: 'YYYY-MM-DD' },
          message:        { type: 'string', description: 'Full project details collected from client' },
          recurrence:     { type: 'string', description: 'once | weekly | biweekly | monthly' }
        },
        required: ['customer_name', 'customer_phone', 'service_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send email FROM admin.lagosworld@gmail.com. Use ONLY when client explicitly requests it or admin authorizes. Always CC binnovationmarketing@gmail.com.',
      parameters: {
        type: 'object',
        properties: {
          to:            { type: 'string' },
          subject:       { type: 'string' },
          body_text:     { type: 'string' },
          email_type:    { type: 'string', description: 'estimate | followup | welcome | booking_confirm | general' },
          customer_name: { type: 'string' },
          service_type:  { type: 'string' }
        },
        required: ['to', 'subject', 'body_text', 'email_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_admin_summary',
      description: 'Send conversation summary to admin. Always call at end of any significant conversation — lead, estimate request, jewelry inquiry, or complaint.',
      parameters: {
        type: 'object',
        properties: {
          customer_name:  { type: 'string' },
          customer_email: { type: 'string' },
          customer_phone: { type: 'string' },
          intent:         { type: 'string', description: 'jewelry | cleaning | power_washing | commercial | general' },
          summary:        { type: 'string', description: 'Structured summary with all collected fields' },
          action_taken:   { type: 'string' },
          next_step:      { type: 'string', description: 'What the Lagos team needs to do now' },
          priority:       { type: 'string', description: 'high | normal | low' }
        },
        required: ['summary', 'intent', 'action_taken', 'priority']
      }
    }
  }
];

// ── Model call with automatic fallback ───────────────────────────────────────
// Primary: llama-3.3-70b-versatile (100k TPD free)
// Fallback: llama-3.1-8b-instant  (500k TPD free) — activates on 429
async function callGroq(messages, tools, useFallback = false) {
  const model = useFallback ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';
  return groq.chat.completions.create({
    model,
    messages,
    ...(tools ? { tools, tool_choice: 'auto' } : {}),
    temperature: 0.72,
    max_tokens: 700
  });
}

// ── Language detection from message history ───────────────────────────────────
function detectLanguage(history, currentMessage) {
  // Check history first — first user message sets the language
  const firstUserMsg = history.find(m => m.role === 'user')?.content || currentMessage;
  const txt = firstUserMsg.toLowerCase();

  if (/[一-鿿]/.test(txt)) return 'Mandarin Chinese';

  const ptScore = (txt.match(/\b(oi|olá|preciso|quero|casa|limpeza|minha|você|para|uma|meu|não|sim|obrigado|gostei|como)\b/g) || []).length;
  const esScore = (txt.match(/\b(hola|necesito|quiero|casa|limpieza|para|usted|gracias|cómo|precio)\b/g) || []).length;
  const frScore = (txt.match(/\b(bonjour|besoin|veux|maison|nettoyage|pour|vous|merci|comment|prix)\b/g) || []).length;

  if (ptScore >= 1) return 'Portuguese (Brazil)';
  if (esScore >= 1) return 'Spanish';
  if (frScore >= 1) return 'French';
  return 'English';
}

// ── Main Entry Point ──────────────────────────────────────────────────────────
async function processMessage(supabase, sessionId, userMessage, channel = 'web', page = '/') {
  let { data: session } = await supabase
    .from('milla_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  const history = session?.messages || [];

  // Build system: base + language lock + page context
  const lang = detectLanguage(history, userMessage);
  const langLock = `\n\n[MANDATORY LANGUAGE LOCK: This entire conversation MUST be in ${lang}. Every single response. No exceptions. Do not switch to any other language.]`;
  const systemFull = SYSTEM_PROMPT + langLock + buildPageContext(page);

  const messages = [
    { role: 'system', content: systemFull },
    ...history,
    { role: 'user', content: userMessage }
  ];

  // Call with fallback on 429
  let completion;
  let useFallback = false;
  try {
    completion = await callGroq(messages, TOOLS, false);
  } catch (e) {
    if (e.status === 429 || String(e.message).includes('rate_limit') || String(e.message).includes('429')) {
      console.warn('Groq 70B rate limit — falling back to 8B-instant');
      useFallback = true;
      completion = await callGroq(messages, TOOLS, true);
    } else {
      throw e;
    }
  }

  const msg = completion.choices[0].message;
  let assistantText = '';

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    messages.push(msg);

    for (const tc of msg.tool_calls) {
      let input;
      try { input = JSON.parse(tc.function.arguments); } catch { input = {}; }
      const toolResult = await executeTool(supabase, tc.function.name, input, sessionId);
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(toolResult) });
    }

    let completion2;
    try {
      completion2 = await callGroq(messages, null, useFallback);
    } catch (e) {
      if (!useFallback && (e.status === 429 || String(e.message).includes('rate_limit'))) {
        completion2 = await callGroq(messages, null, true);
      } else throw e;
    }
    assistantText = completion2.choices[0].message.content || '';
    messages.push({ role: 'assistant', content: assistantText });
  } else {
    assistantText = msg.content || '';
    messages.push({ role: 'assistant', content: assistantText });
  }

  const updatedHistory = messages.slice(1);
  await saveSession(supabase, session, sessionId, channel, updatedHistory);

  return assistantText || 'Sorry, I couldn\'t process that. Please try again. 🙏';
}

async function saveSession(supabase, existing, sessionId, channel, messages) {
  const data = { session_id: sessionId, channel, messages, updated_at: new Date().toISOString() };
  if (existing) {
    await supabase.from('milla_conversations').update(data).eq('session_id', sessionId);
  } else {
    await supabase.from('milla_conversations').insert([data]);
  }
}

// ── Tool Executors ────────────────────────────────────────────────────────────
async function executeTool(supabase, toolName, input, sessionId) {
  console.log(`Milla tool: ${toolName}`, input);

  if (toolName === 'book_appointment') {
    const { error } = await supabase.from('cleaning_requests').insert([{
      customer_name:  input.customer_name,
      customer_email: input.customer_email  || null,
      customer_phone: input.customer_phone,
      service_type:   input.service_type,
      city:           input.city            || null,
      address:        input.address         || null,
      preferred_date: input.preferred_date  || null,
      message:        input.message         || null,
      recurrence:     input.recurrence      || 'once',
      status:         'open',
      source:         'milla_agent'
    }]);

    if (!error) {
      await supabase.from('milla_conversations').update({
        customer_name:  input.customer_name,
        customer_email: input.customer_email || null,
        customer_phone: input.customer_phone,
        intent:         input.service_type,
        status:         'booked'
      }).eq('session_id', sessionId);
    }

    return error
      ? { ok: false, error: error.message }
      : { ok: true, message: 'Appointment saved for management review.' };
  }

  if (toolName === 'send_email') {
    return await sendClientEmail(input);
  }

  if (toolName === 'send_admin_summary') {
    await supabase.from('milla_conversations').update({
      customer_name:  input.customer_name  || null,
      customer_email: input.customer_email || null,
      customer_phone: input.customer_phone || null,
      intent:         input.intent,
      status:         'closed'
    }).eq('session_id', sessionId);

    await sendAdminEmail(input);
    return { ok: true };
  }

  return { ok: false, error: 'Tool not found' };
}

// ── Client Email ──────────────────────────────────────────────────────────────
async function sendClientEmail(input) {
  const millaUser = process.env.MILLA_EMAIL_USER;
  const millaPass = process.env.MILLA_EMAIL_PASS;
  if (!millaUser || !millaPass) {
    console.warn('Milla email not configured');
    return { ok: false, error: 'Email not configured' };
  }

  const html = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf6ee;padding:20px;margin:0">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4dc;padding:2rem">
  <div style="border-bottom:2px solid #b8922e;padding-bottom:1rem;margin-bottom:1.5rem">
    <div style="font-size:1.3rem;color:#b8922e;font-weight:700;letter-spacing:.1em">LAGOS WORLD</div>
    <div style="font-size:.65rem;color:#a09890;letter-spacing:.2em;margin-top:.2rem">MESSAGE FROM MILLA · EXECUTIVE PARTNER</div>
  </div>
  <p style="font-size:.9rem;color:#3a3028;line-height:1.8">${input.body_text.replace(/\n/g, '<br>')}</p>
  <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e8e4dc;font-size:.65rem;color:#a09890">
    <p style="margin:0">Milla · Executive Partner · Lagos World</p>
    <p style="margin:.3rem 0 0">📧 admin.lagosworld@gmail.com &nbsp;|&nbsp; 🌐 lagosworld.app</p>
    <p style="margin:.3rem 0 0">📱 +1 (215) 626-2345 &nbsp;|&nbsp; Philadelphia, PA</p>
  </div>
</div>
</body></html>`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: millaUser, pass: millaPass }
    });
    await transporter.sendMail({
      from:    `"Milla · Lagos World" <${millaUser}>`,
      to:      input.to,
      cc:      'binnovationmarketing@gmail.com',
      subject: input.subject,
      text:    input.body_text,
      html
    });
    return { ok: true, message: `Email sent to ${input.to}` };
  } catch (e) {
    console.error('Milla send_email error:', e.message);
    return { ok: false, error: e.message };
  }
}

// ── Admin Summary Email ───────────────────────────────────────────────────────
async function sendAdminEmail(input) {
  const emailUser = process.env.MILLA_EMAIL_USER || process.env.EMAIL_USER;
  const emailPass = process.env.MILLA_EMAIL_PASS || process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) return;

  const pc = { high: '#e05252', normal: '#b8922e', low: '#1a9e97' }[input.priority] || '#b8922e';
  const pl = { high: '🔴 HIGH', normal: '🟡 NORMAL', low: '🟢 LOW' }[input.priority]  || '🟡 NORMAL';

  const html = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf6ee;padding:20px;margin:0">
<div style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #e8e4dc;padding:2rem">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;padding-bottom:.8rem;border-bottom:1px solid #e8e4dc">
    <div>
      <div style="font-size:1.2rem;color:#b8922e;font-weight:700;letter-spacing:.12em">MILLA · LAGOS WORLD</div>
      <div style="font-size:.62rem;color:#a09890;letter-spacing:.18em;margin-top:.15rem">LEAD SUMMARY — NEEDS REVIEW</div>
    </div>
    <div style="background:${pc};color:#fff;padding:.3rem .9rem;border-radius:4px;font-size:.62rem;letter-spacing:.12em;font-weight:700">${pl}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-bottom:1rem">
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4;width:120px">Client</td><td style="padding:.45rem .6rem;font-weight:700;border-bottom:1px solid #f0ece4">${input.customer_name || '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Phone</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.customer_phone ? `<a href="tel:${input.customer_phone}" style="color:#b8922e">${input.customer_phone}</a>` : '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Email</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.customer_email ? `<a href="mailto:${input.customer_email}" style="color:#b8922e">${input.customer_email}</a>` : '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Service</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4;text-transform:capitalize">${input.intent || '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top;border-bottom:1px solid #f0ece4">Summary</td><td style="padding:.45rem .6rem;line-height:1.7;border-bottom:1px solid #f0ece4;white-space:pre-wrap">${input.summary}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top;border-bottom:1px solid #f0ece4">Action taken</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.action_taken}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top">Next step</td><td style="padding:.45rem .6rem;font-weight:700;color:#b8922e">${input.next_step || '—'}</td></tr>
  </table>
  <div style="background:#fdf9f0;border:1px solid #e8dfc8;border-radius:6px;padding:.8rem 1rem;margin-top:.5rem">
    <p style="margin:0;font-size:.75rem;color:#b8922e;font-weight:700">⚠️ NEEDS MANAGEMENT APPROVAL BEFORE SENDING OFFICIAL ESTIMATE</p>
  </div>
  <p style="font-size:.6rem;color:#a09890;text-align:center;margin:.8rem 0 0;padding-top:.8rem;border-top:1px solid #f0ece4">Milla Agent (Groq Llama 3.3) · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
</div>
</body></html>`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });
    await transporter.sendMail({
      from:    `"Milla · Lagos World" <${emailUser}>`,
      to:      'binnovationmarketing@gmail.com',
      cc:      'dayanelago22@gmail.com',
      subject: `🤖 Milla [${(input.priority||'normal').toUpperCase()}] ${input.intent} — ${input.customer_name||'New Lead'} — ${input.action_taken}`,
      html
    });
  } catch(e) {
    console.error('Milla admin email error:', e.message);
  }
}

module.exports = { processMessage };
