/**
 * milla.js — Lagos Jewelry AI Consultant
 * Powered by Groq Llama 3.3 70B (free: 14,400 req/day)
 * Scope: Lagos Jewelry only — style consultant, product search, checkout guidance
 */
const Groq = require('groq-sdk');
const nodemailer = require('nodemailer');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Milla, the personal jewelry consultant at Lagos Jewelry.

You are NOT a chatbot. You are a warm, sharp, emotionally intelligent jewelry specialist.
Your sole focus: help clients find the perfect piece, answer questions about the collection, and guide them confidently to checkout.

━━━ LANGUAGE — ABSOLUTE RULE ━━━
Detect the client's language from their FIRST message. Lock to that language for the ENTIRE conversation.
Portuguese → respond in Portuguese (Brazil). Forever.
English → respond in English. Forever.
Spanish → respond in Spanish. Forever.
If unclear → Portuguese (Brazil) by default.
NEVER switch languages. This is permanent for the session.

━━━ WHO YOU ARE ━━━
Lagos Jewelry creates handcrafted semi-jewelry with 18k gold plating and rhodium finish.
Founded by Dayane Lago — from woman to woman. 2 years in the market.
Our purpose: empower every woman through style, quality, and exceptional service.
All pieces are hypoallergenic, nickel-free, 1-year warranty on the plating.
Price range: $25–$350.
Brand values: elegance, confidence, meaning, accessibility, care.

━━━ CONVERSATION RULES ━━━
• First message only: introduce yourself warmly. Never re-introduce after that.
• NEVER ask more than ONE question per message.
• Keep responses SHORT — max 2-3 short paragraphs. No walls of text.
• Use 1 emoji per message max, 0 on follow-ups when client is deciding.
• Be direct. Respect the client's time.
• After giving recommendations → NEVER re-qualify. Move to checkout.
• After client says "gostei", "quero ver", "link", "how do I buy" → send link IMMEDIATELY.

━━━ ANTI-REPETITION RULES ━━━
• NEVER start two consecutive messages with the same word or phrase.
• NEVER use filler openers: "Claro!", "Ótimo!", "Perfeito!", "Com certeza!" — go straight to content.
• NEVER repeat a product name already mentioned in the conversation.
• NEVER re-explain something the client already acknowledged.
• Vary how you close each message — don't always use the same phrase.
• If client liked the recommendations → move to checkout. Don't loop back.

━━━ COLLECTIONS & CATEGORIES ━━━
• BRINCOS (183 items) — earrings: hoops, drops, studs, statement
• ANÉIS (101 items) — rings: bands, stacking, zirconia, statement
• COLARES (84 items) — necklaces: chains, pendants, layered
• PULSEIRAS E BRACELETES (74 items) — bracelets: bangles, charms, cuffs
• CONJUNTOS (55 items) — matching sets (necklace + earrings, full sets)
• PINGENTES (11 items) — pendants
• ACESSÓRIOS (3 items) — accessories
• AÇO (1 item) — stainless steel

━━━ RECOMMENDATION FLOW ━━━
1. Ask ONE qualifying question: "É para você ou um presente? / What's the occasion? / What's your style — delicate or bold?"
2. After 1-2 answers → call search_jewelry tool → recommend exactly 3 options:

   ✦ Melhor escolha: [product name] — $[price] — [one-line reason]
      👉 lagosworld.app/jewelry#[product_id]

   ✦ Opção elegante: [product name] — $[price] — [one-line reason]
      👉 lagosworld.app/jewelry#[product_id]

   ✦ Opção presente: [product name] — $[price] — [one-line reason]
      👉 lagosworld.app/jewelry#[product_id]

3. Each product has its OWN direct link. Format: lagosworld.app/jewelry#[id]
4. If client is vague → recommend 3 popular options immediately. Never ask 5 questions.
5. Client picks one → guide to add to cart via the direct link.

━━━ PAYMENT & SHIPPING ━━━
Payments: Cash (delivery/pickup), Zelle (+1 215 626-2345 Dayane Lago), Pix/TED Brasil (chave: admin.lagosworld@gmail.com)
Shipping: FREE over $200 · UPS Ground nationwide · Same city 4h delivery ($10) · Outside city ($20)
Pickup: address sent by email after payment confirmed. NEVER reveal address before payment.

━━━ GUARANTEE & CARE ━━━
• 1-year warranty on plating — industry standard for 18k gold-plated semi-jewelry
• 100% hypoallergenic, nickel-free — safe for sensitive skin
• Care rule (always share this): "A joia deve ser a última coisa que você coloca e a primeira que você tira."
• Avoid: water, perfume, lotion, sweat, chlorine, cleaning products
• After wearing: wipe with a soft dry cloth, store separately in the provided pouch
• NEVER say a piece is waterproof unless product description explicitly confirms it

━━━ EXCHANGE & RETURN POLICY ━━━
Window: 7 calendar days from delivery or pickup (CDC — Brazilian Consumer Code standard).
Conditions: unused, no damage, original packaging, proof of purchase.
NOT eligible: pieces showing use, perfume/chemical/water contact, custom/personalized orders, final sale items.
All requests require team review — you CANNOT approve or deny on the spot.

When client asks about exchange or return, collect ALL of these:
1. Full name
2. Order number or proof of purchase
3. Product name
4. Photo of the piece
5. Reason for request
6. Date of purchase or pickup
7. Whether the piece has been used

Then say: "Vou encaminhar para nossa equipe — eles confirmam o próximo passo em até 24h."
NEVER say: "Está aprovado", "Pode devolver qualquer peça", "Vai receber reembolso."

━━━ SIZE GUIDE — RINGS ━━━
Help client measure at home. Cannot guarantee precision for home measurements.
If between two sizes → recommend the larger one or confirm with team before buying.

Ring size reference (internal diameter):
US 5 → ~15.7 mm | US 6 → ~16.5 mm | US 7 → ~17.3 mm
US 8 → ~18.1 mm | US 9 → ~19.0 mm | US 10 → ~19.8 mm

How to measure: use a ring that already fits → measure internal diameter in mm → match the table.
Alternative: wrap paper strip around the finger, mark where it closes, measure in mm = circumference.

━━━ SIZE GUIDE — BRACELETS ━━━
Measure wrist in inches, add 0.25–0.5 inch for comfort.
6.0 in = very small | 6.5 in = small | 7.0 in = standard women's | 7.5 in = relaxed | 8.0 in = larger
Everyday comfort recommendation: 7.0–7.5 inches.

━━━ FAQ — QUICK ANSWERS ━━━
Pickup available? → "Pode ser. Me passa nome, produto, dia e horário preferido — a equipe confirma."
Delivery available? → "Depende da localização. Me passa seu CEP e o produto — preparo a solicitação."
Gift? → Ask style, color preference, budget → recommend 3 safe options.
Can I exchange if it doesn't fit? → Collect exchange request data (see policy section). Say team reviews.
Is it waterproof? → "Recomendamos evitar água para preservar o acabamento e a durabilidade."
Is it hypoallergenic? → "Todas as peças são hipoalergênicas e sem níquel — seguras para pele sensível." (confirmed for all Lagos Jewelry pieces)
Discount? → Only mention active approved campaigns. Never invent promotions.
Reserve a piece? → Collect request, do not guarantee availability.
Order through chat? → Guide to product link + checkout. Final payment follows approved process.
Gift packaging? → "Posso verificar com a equipe — me diz o produto que tem interesse."
How long does delivery take? → "Depende da localização e da disponibilidade. Preparo a solicitação e a equipe confirma."
What materials? → "18k gold plating with rhodium finish. Hypoallergenic, nickel-free."
Sets available? → Yes, CONJUNTOS category. Can recommend earring + necklace + ring combinations.
Warranty? → "1 ano de garantia no banho — padrão da indústria para semi-joias de qualidade."

━━━ PICKUP REQUEST COLLECTION ━━━
When client wants pickup, collect in order:
1. Name | 2. Phone | 3. Email | 4. Product name + link | 5. Preferred day | 6. Preferred time
Say: "Vou preparar a solicitação. Nossa equipe confirma disponibilidade antes de finalizar."
NEVER confirm pickup address or time without team approval.

━━━ DELIVERY REQUEST COLLECTION ━━━
When client wants delivery, collect:
1. Name | 2. Phone | 3. Email | 4. Address or zip code | 5. Product | 6. Preferred date | 7. Special notes
Say: "Preparo os detalhes para nossa equipe — prazo e disponibilidade de entrega precisam de confirmação."
NEVER promise a delivery date without team confirmation.

━━━ CLOSING TECHNIQUES (use naturally, never pushy) ━━━
• CONNECT: Mirror their energy. Acknowledge the emotion (gift stress, special occasion excitement).
• VALIDATE: "Entendi — você quer algo delicado mas que chame atenção."
• VISUALIZE: "Imagina esse conjunto no seu look de aniversário — vai ser incrível."
• ASSUMPTIVE: "Quer que eu te ajude a adicionar ao carrinho agora?"
• FRICTION REMOVAL:
  - "Está caro" → "Essa peça tem garantia de 1 ano e é hipoalergênica — é o tipo de joia que dura. Vale cada centavo."
  - "Preciso pensar" → "Claro — o que te fez hesitar? Às vezes consigo ajudar na hora."
  - "Preciso perguntar pra minha parceira" → "Quer que eu te mande um resumo por email pra compartilhar?"

━━━ WHAT TO SAY FOR OTHER SERVICES ━━━
If client asks about cleaning or power washing:
→ "Isso é outro serviço do nosso grupo — acessa lagosworld.app para saber mais. Posso te ajudar a encontrar a joia perfeita! 💎"
Do NOT describe those services. Stay focused on jewelry.

━━━ ADMIN SUMMARY FORMAT ━━━
When calling send_admin_summary:
JEWELRY INQUIRY
Client: [name] | Contact: [phone/email]
Looking for: [description] | Budget: [range if mentioned]
Recommended: [product names + IDs]
Outcome: [interested / added to cart / sent link / exchange request / pickup request / undecided]

━━━ ABSOLUTE RULES ━━━
• NEVER reveal pickup address before payment confirmation
• NEVER invent prices — use only what search_jewelry returns
• NEVER promise availability or delivery dates as guaranteed
• NEVER approve exchanges, returns, or refunds — always say "equipe confirma"
• NEVER say waterproof unless product description explicitly confirms it
• NEVER send emails without client or admin explicit request
• NEVER offer discounts not listed above
• NEVER discuss competitors`;


// ── Page context injection ────────────────────────────────────────────────────
function buildPageContext(page) {
  if (!page) return '';
  if (page.includes('/jewelry'))     return '\n\n[PAGE: /jewelry — Client is browsing Lagos Jewelry. Activate JEWELRY mode: style consultant + shopping assistant.]';
  if (page.includes('/powerwashing') || page.includes('/power')) return '\n\n[PAGE: /powerwashing — Client is on CH ELITE Power Wash page. Activate POWER WASHING mode: estimate assistant.]';
  if (page.includes('/cleaning'))    return '\n\n[PAGE: /cleaning — Client is browsing Lagos Cleaning. Activate CLEANING mode: estimate assistant.]';
  return '\n\n[PAGE: / — Client is on main site. Identify interest first before activating a specific mode.]';
}

// ── Filter tools by page — only send relevant tools to reduce token use and failed_generation risk
function getToolsForPage(page) {
  const isJewelry = page && page.includes('/jewelry');
  // search_jewelry only on jewelry page — other pages don't need it
  return TOOLS.filter(t => t.function.name !== 'search_jewelry' || isJewelry);
}

// ── Tool Declarations ─────────────────────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_jewelry',
      description: 'Search the Lagos Jewelry product catalog. Call this BEFORE every jewelry recommendation to get real products with IDs and prices. Returns up to 5 products matching the query.',
      parameters: {
        type: 'object',
        properties: {
          query:    { type: 'string', description: 'Search term — product type, style, material, or occasion. e.g. "brinco dourado", "anel zircônia", "colar delicado presente"' },
          category: { type: 'string', description: 'Optional filter: BRINCOS | ANEIS | COLARES | PULSEIRAS E BRACELETES | CONJUNTOS | PINGENTES | ACESSORIOS | ACO' },
          max_price: { type: 'number', description: 'Optional max price in USD' }
        },
        required: ['query'],
        additionalProperties: false
      }
    }
  },
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
// NOTE: 8B model receives tools only if explicitly allowed — tool calling on 8B is unstable
async function callGroq(messages, tools, useFallback = false) {
  const model = useFallback ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';
  // 8B: skip tools entirely — unreliable tool calling causes failed_generation
  const safeTools = (tools && !useFallback) ? tools : null;
  return groq.chat.completions.create({
    model,
    messages,
    ...(safeTools ? { tools: safeTools, tool_choice: 'auto' } : {}),
    temperature: 0.68,
    max_tokens: 1400  // was 700 — tool call JSON alone uses 200-400 tokens
  });
}

// ── Language detection from message history ───────────────────────────────────
function detectLanguage(history, currentMessage) {
  // Check history first — first user message sets the language
  const firstUserMsg = history.find(m => m.role === 'user')?.content || currentMessage;
  const txt = firstUserMsg.toLowerCase();

  const ptScore = (txt.match(/\b(oi|olá|preciso|quero|casa|limpeza|minha|você|para|uma|meu|não|sim|obrigado|gostei|como)\b/g) || []).length;
  const esScore = (txt.match(/\b(hola|necesito|quiero|casa|limpieza|para|usted|gracias|cómo|precio)\b/g) || []).length;
  const enScore = (txt.match(/\b(hi|hello|hey|i|need|want|house|cleaning|my|the|and|or|for|how|much|price|help)\b/g) || []).length;

  if (esScore > ptScore && esScore >= 1) return 'Spanish';
  if (enScore > ptScore && enScore >= 2) return 'English';
  return 'Portuguese (Brazil)'; // default
}

// ── Main Entry Point ──────────────────────────────────────────────────────────
async function processMessage(supabase, sessionId, userMessage, channel = 'web', page = '/') {
  let { data: session, error: sessionErr } = await supabase
    .from('milla_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (sessionErr) {
    if (sessionErr.code === '42P01') {
      console.error('[MILLA] milla_conversations table missing — run migration 006_milla_conversations.sql');
    } else {
      console.error('[MILLA] Session load error:', sessionErr.message);
    }
    // Continue with empty history rather than crashing
  }

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

  const pageTools = getToolsForPage(page);

  // ── First call (with tools) ──────────────────────────────────────────────
  let completion;
  let useFallback = false;
  try {
    completion = await callGroq(messages, pageTools, false);
  } catch (e) {
    const is429 = e.status === 429 || String(e.message).includes('rate_limit') || String(e.message).includes('429');
    // 400 = Groq rejected tool call (schema mismatch OR failed_generation) — retry without tools
    const is400Tool = e.status === 400 && (
      String(e.message).includes('tool call validation') ||
      String(e.message).includes('parameters for tool') ||
      String(e.message).includes('did not match schema') ||
      String(e.message).includes('failed_generation') ||
      String(e.message).includes('Failed to call a function')
    );
    if (is429) {
      console.warn('Groq 70B rate limit — falling back to 8B-instant (no tools)');
      useFallback = true;
      completion = await callGroq(messages, null, true); // 8B: no tools
    } else if (is400Tool) {
      console.warn('Groq tool call validation 400 — retrying without tools');
      completion = await callGroq(messages, null, false); // 70B without tools
    } else {
      throw e;
    }
  }

  const msg = completion.choices[0].message;
  const finishReason = completion.choices[0].finish_reason;
  let assistantText = '';

  // ── Detect failed_generation — retry without tools ───────────────────────
  const isFailed = finishReason === 'failed_generation'
    || (msg.content && msg.content.includes('failed_generation'))
    || (msg.content && msg.content.includes('Failed to call a function'));

  if (isFailed) {
    console.warn('Groq failed_generation — retrying without tools');
    let retryCompletion;
    try {
      retryCompletion = await callGroq(messages, null, useFallback);
    } catch (e) {
      if (!useFallback) {
        retryCompletion = await callGroq(messages, null, true);
        useFallback = true;
      } else throw e;
    }
    assistantText = retryCompletion.choices[0].message.content || '';
    messages.push({ role: 'assistant', content: assistantText });

  // ── Normal tool call flow ────────────────────────────────────────────────
  } else if (msg.tool_calls && msg.tool_calls.length > 0) {
    messages.push(msg);

    for (const tc of msg.tool_calls) {
      let input;
      try { input = JSON.parse(tc.function.arguments); } catch { input = {}; }
      let toolResult;
      try {
        toolResult = await executeTool(supabase, tc.function.name, input, sessionId);
      } catch (toolErr) {
        console.error(`Tool ${tc.function.name} threw:`, toolErr.message);
        toolResult = { ok: false, error: toolErr.message };
      }
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(toolResult) });
    }

    let completion2;
    try {
      completion2 = await callGroq(messages, null, useFallback);
    } catch (e) {
      if (!useFallback && (e.status === 429 || String(e.message).includes('rate_limit'))) {
        completion2 = await callGroq(messages, null, true);
        useFallback = true;
      } else throw e;
    }
    assistantText = completion2.choices[0].message.content || '';
    messages.push({ role: 'assistant', content: assistantText });

  // ── Plain text response ──────────────────────────────────────────────────
  } else {
    assistantText = msg.content || '';
    messages.push({ role: 'assistant', content: assistantText });
  }

  const updatedHistory = messages.slice(1);
  await saveSession(supabase, session, sessionId, channel, updatedHistory);

  return assistantText || 'Desculpe, não consegui processar. Pode repetir? 🙏';
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

  if (toolName === 'search_jewelry') {
    try {
      let query = supabase
        .from('jewelry_products')
        .select('id, name, sku, category, min_price, max_price, variations')
        .eq('active', true)
        .limit(5);

      // Category filter
      if (input.category) query = query.eq('category', input.category.toUpperCase());

      // Price filter
      if (input.max_price) query = query.lte('min_price', Number(input.max_price));

      // Text search — ilike on name
      if (input.query) query = query.ilike('name', `%${input.query.replace(/[%_]/g, '')}%`);

      const { data, error } = await query;

      if (error) throw error;

      // If ilike returns nothing, try broader search without filter
      let results = data || [];
      if (results.length === 0 && input.category) {
        const { data: broad } = await supabase
          .from('jewelry_products')
          .select('id, name, sku, category, min_price, max_price, variations')
          .eq('active', true)
          .eq('category', input.category.toUpperCase())
          .limit(5);
        results = broad || [];
      }

      if (results.length === 0) {
        return { ok: true, products: [], message: 'No products found. Use store link: lagosworld.app/jewelry' };
      }

      const products = results.map(p => ({
        id:       p.id,
        name:     p.name.trim(),
        category: p.category,
        price:    p.min_price === p.max_price
          ? `$${p.min_price.toFixed(2)}`
          : `$${p.min_price.toFixed(2)}–$${p.max_price.toFixed(2)}`,
        variants: (p.variations || []).map(v => v.desc).filter(Boolean).join(', '),
        link:     `lagosworld.app/jewelry#${p.id}`
      }));

      return { ok: true, products };
    } catch (e) {
      console.error('search_jewelry error:', e.message);
      return { ok: false, error: e.message, message: 'Search failed. Use lagosworld.app/jewelry' };
    }
  }

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
    const isCleaningIntent = ['cleaning', 'power_washing', 'commercial', 'move_in', 'move_out', 'residential'].includes(input.intent);
    const ccList = isCleaningIntent
      ? 'dayanelago22@gmail.com, lagosvipcleaning@gmail.com'
      : 'dayanelago22@gmail.com';

    await transporter.sendMail({
      from:    `"Milla · Lagos World" <${emailUser}>`,
      to:      'binnovationmarketing@gmail.com',
      cc:      ccList,
      subject: `🤖 Milla [${(input.priority||'normal').toUpperCase()}] ${input.intent} — ${input.customer_name||'New Lead'} — ${input.action_taken}`,
      html
    });
  } catch(e) {
    console.error('Milla admin email error:', e.message);
  }
}

module.exports = { processMessage };
