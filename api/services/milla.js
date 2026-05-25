/**
 * milla.js — Autonomous AI agent for Lagos World
 * Powered by Google Gemini 1.5 Flash (free tier: 1,500 req/day)
 * Channel-agnostic: web widget, SMS (Telnyx), WhatsApp (future)
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é Milla, a secretária executiva virtual da Lagos World. Atende pelo site (chat) e por SMS/WhatsApp.

A Lagos World tem 3 linhas de negócio:
  1. Lagos Jewelry — joias artesanais premium (lagosworld.app/jewelry)
  2. Lagos Cleaning — limpeza residencial e comercial (lagosworld.app/cleaning)
  3. CH Elite Power Washing — lavagem de alta pressão (lagosworld.app/powerwashing)

─── PERSONALIDADE ───
Seja calorosa, direta e profissional. Responda em português brasileiro.
Se o cliente falar inglês, responda em inglês. Máximo 3 parágrafos por mensagem.
Use 1–2 emojis por mensagem. Nunca invente informações.

─── LAGOS JEWELRY ───
Joias artesanais: brincos, colares, pulseiras, anéis. Preços $25–$350.
Compra: lagosworld.app/jewelry
IMPORTANTE: Endereços dos pontos de retirada parceiros só são revelados APÓS pagamento confirmado.
Quando o cliente perguntar onde retirar → responda: "Após confirmar seu pedido, você receberá o endereço do nosso parceiro mais próximo de você por email. Priorizamos a segurança de todos. ✦"

─── LAGOS CLEANING ───
Serviços: residencial, comercial, quinzenal, mensal, pontual.
Área: Philadelphia PA e South Jersey NJ.
Desconto: código LAGOS15 para 15% OFF na primeira vez.
SLA: confirmação em até 2 horas.
Para orçar, SEMPRE pergunte:
  1. Cidade/bairro
  2. Tipo (casa, apartamento, escritório, loja)
  3. Tamanho (nº de quartos OU metragem)
  4. Frequência desejada (única, semanal, quinzenal, mensal)
  5. Alguma necessidade específica? (pets, alérgicos, área de foco)

─── CH ELITE POWER WASHING ───
Serviços: entrada de garagem, deck, pátio, fachada, calçada.
Área: Philadelphia PA, New Jersey, DMV.
Para orçar, SEMPRE pergunte:
  1. Cidade
  2. Tipo de superfície (concreto, madeira, tijolo, etc.)
  3. Tamanho estimado
WhatsApp direto CH Elite: (240) 780-6473

─── FLUXO DE ATENDIMENTO ───
1. Identificar interesse (jewelry / cleaning / power washing / dúvida geral)
2. Qualificar com as perguntas certas (não faça todas de uma vez — seja natural)
3. Informar sobre serviço + valor aproximado (ou dizer que enviará orçamento em 2h)
4. Coletar: nome, telefone, email, data preferida
5. Confirmar agendamento e avisar que a equipe entrará em contato
6. Ao final da conversa → usar ferramenta send_admin_summary

─── REGRAS ABSOLUTAS ───
• NUNCA revele endereços de parceiros antes de pagamento confirmado
• NUNCA invente preços de limpeza sem qualificar o imóvel
• SEMPRE colete telefone + email antes de fechar agendamento
• Se não souber → "Vou verificar com nossa equipe e te respondo em breve 🤝"
• Não discuta concorrentes`;

// ── Tool Declarations (Gemini format) ─────────────────────────────────────────
const TOOL_DECLARATIONS = [
  {
    name: 'book_appointment',
    description: 'Salva agendamento de limpeza ou power washing no sistema. Use quando o cliente confirmar interesse e fornecer dados básicos.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customer_name:  { type: 'STRING', description: 'Nome completo' },
        customer_email: { type: 'STRING', description: 'Email' },
        customer_phone: { type: 'STRING', description: 'Telefone com DDD' },
        service_type:   { type: 'STRING', description: 'residential | commercial | power_washing' },
        city:           { type: 'STRING', description: 'Cidade' },
        address:        { type: 'STRING', description: 'Endereço completo se fornecido' },
        preferred_date: { type: 'STRING', description: 'Data preferida YYYY-MM-DD' },
        message:        { type: 'STRING', description: 'Detalhes e necessidades do cliente' },
        recurrence:     { type: 'STRING', description: 'once | weekly | biweekly | monthly' }
      },
      required: ['customer_name', 'customer_phone', 'service_type']
    }
  },
  {
    name: 'send_admin_summary',
    description: 'Envia resumo do atendimento para o administrador. Use sempre ao encerrar uma conversa significativa.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customer_name:  { type: 'STRING' },
        customer_email: { type: 'STRING' },
        customer_phone: { type: 'STRING' },
        intent:         { type: 'STRING', description: 'jewelry | cleaning | power_washing | general' },
        summary:        { type: 'STRING', description: 'Resumo da conversa em 3-5 linhas' },
        action_taken:   { type: 'STRING', description: 'O que foi feito' },
        next_step:      { type: 'STRING', description: 'O que a equipe Lagos precisa fazer agora' },
        priority:       { type: 'STRING', description: 'high | normal | low' }
      },
      required: ['summary', 'intent', 'action_taken', 'priority']
    }
  }
];

// ── Main Entry Point ──────────────────────────────────────────────────────────
async function processMessage(supabase, sessionId, userMessage, channel = 'web') {
  // Load existing conversation
  let { data: session } = await supabase
    .from('milla_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  const history = session?.messages || [];

  // Init Gemini model
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
  });

  const chat = model.startChat({ history });

  // Send user message
  const result = await chat.sendMessage(userMessage);
  const response = result.response;

  // Check for function/tool calls
  const functionCalls = response.functionCalls();
  let assistantText = '';

  if (functionCalls && functionCalls.length > 0) {
    // Execute each tool
    const toolResponses = [];
    for (const fc of functionCalls) {
      const toolResult = await executeTool(supabase, fc.name, fc.args, sessionId);
      toolResponses.push({
        functionResponse: { name: fc.name, response: toolResult }
      });
    }

    // Send tool results back to get final text response
    const result2 = await chat.sendMessage(toolResponses);
    assistantText = result2.response.text();
  } else {
    assistantText = response.text();
  }

  // Save full updated history
  const updatedHistory = await chat.getHistory();
  await saveSession(supabase, session, sessionId, channel, updatedHistory);

  return assistantText || 'Desculpe, não consegui processar. Tente novamente. 🙏';
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
      : { ok: true, message: 'Agendamento salvo com sucesso no sistema.' };
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

async function sendAdminEmail(input) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const priorityColor = { high: '#e05252', normal: '#b8922e', low: '#1a9e97' };
  const priorityLabel = { high: '🔴 ALTA', normal: '🟡 NORMAL', low: '🟢 BAIXA' };
  const pc = priorityColor[input.priority] || '#b8922e';
  const pl = priorityLabel[input.priority] || '🟡 NORMAL';

  const html = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf6ee;padding:20px;margin:0">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4dc;padding:2rem">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;padding-bottom:.8rem;border-bottom:1px solid #e8e4dc">
    <div>
      <div style="font-size:1.2rem;color:#b8922e;letter-spacing:.15em;font-weight:700">MILLA · LAGOS WORLD</div>
      <div style="font-size:.65rem;color:#a09890;letter-spacing:.2em;margin-top:.15rem">RESUMO DE ATENDIMENTO</div>
    </div>
    <div style="background:${pc};color:#fff;padding:.3rem .8rem;border-radius:4px;font-size:.65rem;letter-spacing:.15em;font-weight:700">${pl}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-bottom:1rem">
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4;width:110px">Cliente</td><td style="padding:.45rem .6rem;font-weight:700;border-bottom:1px solid #f0ece4">${input.customer_name || '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Telefone</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.customer_phone ? `<a href="tel:${input.customer_phone}" style="color:#b8922e">${input.customer_phone}</a>` : '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Email</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.customer_email ? `<a href="mailto:${input.customer_email}" style="color:#b8922e">${input.customer_email}</a>` : '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;border-bottom:1px solid #f0ece4">Interesse</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4;text-transform:capitalize">${input.intent || '—'}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top;border-bottom:1px solid #f0ece4">Resumo</td><td style="padding:.45rem .6rem;line-height:1.6;border-bottom:1px solid #f0ece4">${input.summary}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top;border-bottom:1px solid #f0ece4">Ação tomada</td><td style="padding:.45rem .6rem;border-bottom:1px solid #f0ece4">${input.action_taken}</td></tr>
    <tr><td style="padding:.45rem .6rem;color:#7a6a5a;vertical-align:top">Próximo passo</td><td style="padding:.45rem .6rem;font-weight:700;color:#b8922e">${input.next_step || '—'}</td></tr>
  </table>
  <p style="font-size:.62rem;color:#a09890;text-align:center;margin:0;padding-top:.8rem;border-top:1px solid #f0ece4">Lagos World · Milla Agent (Gemini) · ${new Date().toLocaleString('pt-BR', { timeZone: 'America/New_York' })}</p>
</div>
</body></html>`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from:    `"Milla · Lagos World" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_USER,
      subject: `🤖 Milla [${(input.priority||'normal').toUpperCase()}] ${input.intent} — ${input.customer_name||'Lead novo'} — ${input.action_taken}`,
      html
    });
  } catch(e) {
    console.error('Milla email error:', e.message);
  }
}

module.exports = { processMessage };
