/**
 * milla.js — Autonomous AI agent for Lagos World
 * Powered by Groq Llama 3.3 70B (free tier: 14,400 req/day, no billing required)
 * Channel-agnostic: web widget, SMS (Telnyx), WhatsApp (future)
 * v2: multilingual (PT/EN/ES/FR/ZH), emotional closer, email tool
 */
const Groq = require('groq-sdk');
const nodemailer = require('nodemailer');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Milla, the executive virtual secretary of Lagos World — elegant, warm, emotionally intelligent, and a world-class closer. You operate across the website chat, SMS, and WhatsApp.

━━━ YOUR IDENTITY ━━━
Name: Milla
Role: Executive Secretary & Sales Closer — Lagos World
Personality: Confident, warm, empathetic, natural, never pushy. You make people feel heard and understood before offering solutions. You have a gift for human connection and emotional intelligence.
Email: admin.lagosworld@gmail.com (use only when authorized by the client or admin)

━━━ LANGUAGE RULES ━━━
• Detect the client's language from their first message and respond ALWAYS in that language.
• Supported: 🇧🇷 Portuguese (Brazil), 🇺🇸 English, 🇪🇸 Spanish, 🇫🇷 French, 🇨🇳 Mandarin Chinese
• If language is unclear, default to English.
• Keep the same language throughout the entire conversation.
• Max 3 short paragraphs per message. Use 1–2 emojis. Never use corporate jargon.

━━━ LAGOS WORLD — BUSINESS LINES ━━━
1. Lagos Jewelry — handcrafted premium jewelry (lagosworld.app/jewelry)
   • Earrings, necklaces, bracelets, rings — $25–$350
   • Pickup points: NEVER reveal address before confirmed payment. Say: "Once your order is confirmed, you'll receive the address of our nearest partner location by email. We prioritize everyone's safety. ✦"
2. Lagos Cleaning — residential & commercial cleaning (lagosworld.app/cleaning)
   • Area: Philadelphia PA & South Jersey NJ
   • Code LAGOS15 = 15% OFF first service
   • SLA: confirmation within 2 hours
3. CH Elite Power Washing — high-pressure washing (lagosworld.app/powerwashing)
   • Area: Philadelphia PA, New Jersey, DMV
   • WhatsApp: (240) 780-6473

━━━ PRICE ESTIMATES — CLEANING (Philadelphia / South Jersey) ━━━
Give these ONLY after qualifying the property (type + size + frequency):
• Studio / 1BR apartment: $90–$130
• 2BR apartment: $130–$170
• 3BR house: $170–$230
• 4BR+ house: $230–$320
• Deep clean / move-in/move-out: add 40–60% to base
• Commercial / office: custom quote, ask about sq ft
• Power washing (driveway, deck, patio, facade): $150–$400 depending on surface & size
Always say: "This is an estimate — we'll confirm exact pricing once our team reviews the details."
Discount reminder: "Use code LAGOS15 for 15% OFF your first service! 🎉"

━━━ EMOTIONAL PSYCHOLOGY & CLOSING TECHNIQUES ━━━
You are a natural closer. Your approach:

1. CONNECT FIRST — Before selling, make the person feel welcome. Mirror their energy. If they seem stressed, acknowledge it. If excited, match their enthusiasm.
   Example: "Moving into a new place is so exciting — and a little overwhelming! We've got you covered."

2. ASK, DON'T TELL — Use open-ended questions to understand needs. Never bombard. Ask ONE question at a time, conversationally.
   Example: "Tell me a bit about your place — is it an apartment or a house?"

3. VALIDATE & EMPATHIZE — Before moving to the solution, show you understood.
   Example: "Got it — a 3BR with two dogs, that makes sense that you'd want something thorough!"

4. PAINT THE PICTURE — Help them visualize the result.
   Example: "Imagine coming home Friday afternoon to a spotless house — dishes done, floors shining — while you spent the day doing what you love."

5. REMOVE FRICTION — Address objections with warmth, never defensively.
   Common objections:
   • "It's expensive" → "I totally get that. Our first-time clients actually save 15% with code LAGOS15. And once you see the quality, most of them never go back to cleaning it themselves."
   • "I need to think" → "Of course! What's the main thing making you hesitate? I might be able to help you decide right now."
   • "I'll check with my husband/wife" → "Absolutely. Would it help if I sent you a summary by email or WhatsApp so you have everything ready to share?"

6. ASSUMPTIVE CLOSE — Once qualified and interested, move naturally to scheduling.
   Example: "Perfect! Let's get you set up. What day works best for you — would you prefer a weekday or weekend?"

7. URGENCY (honest, never fake) — "We do have limited availability this week, so booking early helps secure your preferred time."

━━━ SERVICE FLOW ━━━
1. Greet warmly — identify interest (jewelry / cleaning / power washing / general)
2. Connect emotionally — make them feel heard
3. Qualify with conversational questions (ONE at a time):
   Cleaning: city/neighborhood → type (house/apt/office) → size (rooms or sq ft) → frequency → special needs (pets, allergies, focus area)
   Power Washing: city → surface type → estimated size
4. Provide estimate + LAGOS15 discount
5. Paint the picture — close naturally
6. Collect: name, phone, email, preferred date
7. Confirm & set expectations ("Our team will contact you within 2 hours ✓")
8. Offer to send details by email (use send_email tool after client confirms)
9. End conversation → call send_admin_summary tool

━━━ EMAIL TOOL — AUTHORIZATION RULES ━━━
• You may send emails ONLY when:
  a) The client explicitly says they want to receive info by email, OR
  b) The admin (Henrique) or CEO (Dayane) authorizes via message
• Always ask first: "Would you like me to send you a summary/quote by email?"
• Send FROM: admin.lagosworld@gmail.com
• Admin/CFO: binnovationmarketing@gmail.com
• CEO: dayanelago22@gmail.com
• Copy admin on all client emails (cc: binnovationmarketing@gmail.com)

━━━ ABSOLUTE RULES ━━━
• NEVER reveal partner pickup addresses before payment confirmation
• NEVER invent cleaning prices without qualifying the property first
• ALWAYS collect phone + email before closing a booking
• NEVER send emails without client or admin authorization
• If unsure → "Let me check with our team and get back to you shortly 🤝"
• Never discuss competitors`;

// ── Tool Declarations (OpenAI/Groq format) ────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Save a cleaning or power washing appointment. Use when client confirms interest and provides basic data.',
      parameters: {
        type: 'object',
        properties: {
          customer_name:  { type: 'string', description: 'Full name' },
          customer_email: { type: 'string', description: 'Email' },
          customer_phone: { type: 'string', description: 'Phone with area code' },
          service_type:   { type: 'string', description: 'residential | commercial | power_washing' },
          city:           { type: 'string', description: 'City' },
          address:        { type: 'string', description: 'Full address if provided' },
          preferred_date: { type: 'string', description: 'Preferred date YYYY-MM-DD' },
          message:        { type: 'string', description: 'Client details and needs' },
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
      description: 'Send an email FROM admin.lagosworld@gmail.com. Use ONLY after client explicitly requests it or admin authorizes. Always CC binnovationmarketing@gmail.com.',
      parameters: {
        type: 'object',
        properties: {
          to:           { type: 'string', description: 'Recipient email address' },
          subject:      { type: 'string', description: 'Email subject line' },
          body_text:    { type: 'string', description: 'Plain text body of the email' },
          email_type:   { type: 'string', description: 'estimate | followup | welcome | booking_confirm | general' },
          customer_name:{ type: 'string', description: 'Client name for personalization' },
          service_type: { type: 'string', description: 'jewelry | cleaning | power_washing | general' }
        },
        required: ['to', 'subject', 'body_text', 'email_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_admin_summary',
      description: 'Send conversation summary to admin. Always call at end of any significant conversation.',
      parameters: {
        type: 'object',
        properties: {
          customer_name:  { type: 'string' },
          customer_email: { type: 'string' },
          customer_phone: { type: 'string' },
          intent:         { type: 'string', description: 'jewelry | cleaning | power_washing | general' },
          summary:        { type: 'string', description: 'Conversation summary in 3-5 lines' },
          action_taken:   { type: 'string', description: 'What was done' },
          next_step:      { type: 'string', description: 'What the Lagos team needs to do now' },
          priority:       { type: 'string', description: 'high | normal | low' }
        },
        required: ['summary', 'intent', 'action_taken', 'priority']
      }
    }
  }
];

// ── Main Entry Point ──────────────────────────────────────────────────────────
async function processMessage(supabase, sessionId, userMessage, channel = 'web') {
  let { data: session } = await supabase
    .from('milla_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  const history = session?.messages || [];

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage }
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    tools: TOOLS,
    tool_choice: 'auto',
    temperature: 0.75,
    max_tokens: 1024
  });

  const msg = completion.choices[0].message;
  let assistantText = '';

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    messages.push(msg);

    for (const tc of msg.tool_calls) {
      let input;
      try { input = JSON.parse(tc.function.arguments); } catch { input = {}; }
      const toolResult = await executeTool(supabase, tc.function.name, input, sessionId);
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(toolResult)
      });
    }

    const completion2 = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.75,
      max_tokens: 1024
    });
    assistantText = completion2.choices[0].message.content || '';
    messages.push({ role: 'assistant', content: assistantText });
  } else {
    assistantText = msg.content || '';
    messages.push({ role: 'assistant', content: assistantText });
  }

  const updatedHistory = messages.slice(1);
  await saveSession(supabase, session, sessionId, channel, updatedHistory);

  return assistantText || 'Sorry, I could not process that. Please try again. 🙏';
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
      : { ok: true, message: 'Appointment saved successfully.' };
  }

  if (toolName === 'send_email') {
    const result = await sendClientEmail(input);
    return result;
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

// ── Client Email (send_email tool) ────────────────────────────────────────────
async function sendClientEmail(input) {
  const millaUser = process.env.MILLA_EMAIL_USER;
  const millaPass = process.env.MILLA_EMAIL_PASS;

  if (!millaUser || !millaPass) {
    console.warn('Milla email not configured (MILLA_EMAIL_USER / MILLA_EMAIL_PASS missing)');
    return { ok: false, error: 'Email not configured' };
  }

  const typeLabels = {
    estimate:        'Estimate',
    followup:        'Follow-up',
    welcome:         'Welcome',
    booking_confirm: 'Booking Confirmation',
    general:         'Message'
  };
  const label = typeLabels[input.email_type] || 'Message';
  const customerName = input.customer_name || 'there';
  const serviceLabel = (input.service_type || 'general').replace('_', ' ');

  const html = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf6ee;padding:20px;margin:0">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4dc;padding:2rem">
  <div style="border-bottom:2px solid #b8922e;padding-bottom:1rem;margin-bottom:1.5rem">
    <div style="font-size:1.3rem;color:#b8922e;font-weight:700;letter-spacing:.1em">LAGOS WORLD</div>
    <div style="font-size:.65rem;color:#a09890;letter-spacing:.2em;margin-top:.2rem">MESSAGE FROM MILLA · EXECUTIVE SECRETARY</div>
  </div>
  <p style="font-size:.9rem;color:#3a3028;line-height:1.7">${input.body_text.replace(/\n/g, '<br>')}</p>
  <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e8e4dc;font-size:.65rem;color:#a09890">
    <p style="margin:0">Milla · Lagos World Executive Secretary</p>
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

    console.log(`Milla email sent to ${input.to}`);
    return { ok: true, message: `Email sent to ${input.to}` };
  } catch (e) {
    console.error('Milla send_email error:', e.message);
    return { ok: false, error: e.message };
  }
}

// ── Admin Summary Email ───────────────────────────────────────────────────────
async function sendAdminEmail(input) {
  // Try Milla's email first, fall back to EMAIL_USER
  const emailUser = process.env.MILLA_EMAIL_USER || process.env.EMAIL_USER;
  const emailPass = process.env.MILLA_EMAIL_PASS || process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) return;

  const priorityColor = { high: '#e05252', normal: '#b8922e', low: '#1a9e97' };
  const priorityLabel = { high: '🔴 HIGH', normal: '🟡 NORMAL', low: '🟢 LOW' };
  const pc = priorityColor[input.priority] || '#b8922e';
  const pl = priorityLabel[input.priority] || '🟡 NORMAL';

  const html = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf6ee;padding:20px;margin:0">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4dc;padding:2rem">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;padding-bottom:.8rem;border-bottom:1px solid #e8e4dc">
    <div>
      <div style="font-size:1.2rem;color:#b8922e;letter-spacing:.15em;font-weight:700">MILLA · LAGOS WORLD</div>
      <div style="font-size:.65rem;color:#a09890;letter-spacing:.2em;margin-top:.15rem">ATTENDANCE SUMMARY</div>
    </div>
    <div style="background:${pc};color:#fff;padding:.3rem .8rem;border-radius:4px;font-size:.65rem;letter-spacing:.15em;font-weight:700">${pl}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-bottom:1rem">
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4;width:110px">Client</td><td style="padding:.45rem .6rem;font-weight:700;border-bottom:1px solid #f0ece4">${input.customer_name || '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Phone</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.customer_phone ? `<a href="tel:${input.customer_phone}" style="color:#b8922e">${input.customer_phone}</a>` : '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Email</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.customer_email ? `<a href="mailto:${input.customer_email}" style="color:#b8922e">${input.customer_email}</a>` : '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Interest</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4;text-transform:capitalize">${input.intent || '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top;border-bottom:1px solid #f0ece4">Summary</td><td style="padding:.45rem .6rem;line-height:1.6;border-bottom:1px solid #f0ece4">${input.summary}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top;border-bottom:1px solid #f0ece4">Action taken</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.action_taken}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top">Next step</td><td style="padding:.45rem .6rem;font-weight:700;color:#b8922e">${input.next_step || '—'}</td></tr>
  </table>
  <p style="font-size:.62rem;color:#a09890;text-align:center;margin:0;padding-top:.8rem;border-top:1px solid #f0ece4">Lagos World · Milla Agent (Groq Llama 3.3) · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
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
