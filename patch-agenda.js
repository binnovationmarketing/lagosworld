#!/usr/bin/env node
// patch-agenda.js — Adds Agenda tab (booking calendar) + WhatsApp broadcast to Calendário

const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'public/admin/index.html');
let html = fs.readFileSync(filePath, 'utf8');

let changed = 0;
function replace(label, from, to) {
  if (!html.includes(from)) { console.error(`❌ NOT FOUND: ${label}`); process.exit(1); }
  html = html.replace(from, to);
  console.log(`✅ ${label}`);
  changed++;
}

// ── 1. Add tab button ─────────────────────────────────────────────────────────
replace('Add Agenda tab button',
  `    <button class="tab" onclick="switchTab('templates',this)">📧 Templates</button>
    <button class="tab" onclick="switchTab('calendario',this)">📅 Calendário</button>`,
  `    <button class="tab" onclick="switchTab('templates',this)">📧 Templates</button>
    <button class="tab" onclick="switchTab('agenda',this)">📅 Agenda</button>
    <button class="tab" onclick="switchTab('calendario',this)">📆 Campanhas</button>`
);

// ── 2. Add Agenda tab HTML (before calendário) ────────────────────────────────
replace('Add Agenda tab content',
  `    <!-- CALENDARIO TAB -->
    <div id="tab-calendario" style="display:none">`,
  `    <!-- AGENDA TAB — Booking Calendar -->
    <div id="tab-agenda" style="display:none">
      <div class="dash-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.8rem">
        <div>
          <h2>Agenda <em>de Serviços</em></h2>
          <div class="last-update" id="agenda-subtitle">Scheduling calendar — all cleaning appointments</div>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem">
          <button class="topbar-btn" onclick="agendaNav(-1)">‹ Anterior</button>
          <span id="agenda-month-label" style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--gold);letter-spacing:.05em;min-width:160px;text-align:center"></span>
          <button class="topbar-btn" onclick="agendaNav(1)">Próximo ›</button>
          <button class="topbar-btn primary" onclick="agendaNav(0)">Hoje</button>
        </div>
      </div>
      <!-- Day-of-week header -->
      <div class="cal-grid-header">
        <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
      </div>
      <div id="agenda-grid" class="cal-month-grid"></div>
      <!-- Tooltip (positioned absolute, shown on hover) -->
      <div id="agenda-tooltip" class="agenda-tooltip" style="display:none"></div>
    </div>

    <!-- CALENDARIO TAB -->
    <div id="tab-calendario" style="display:none">`
);

// ── 3. Update Calendário tab header ───────────────────────────────────────────
replace('Update Calendário header',
  `      <div class="dash-header"><h2>Calendário <em>Promocional 2026</em></h2><div class="last-update">Datas estratégicas para campanhas</div></div>`,
  `      <div class="dash-header">
        <div><h2>Campanhas <em>Promocionais 2026</em></h2><div class="last-update">Gere mensagens prontas para WhatsApp Broadcast</div></div>
      </div>`
);

// ── 4. Add CSS for agenda calendar ────────────────────────────────────────────
replace('Add agenda + WhatsApp CSS',
  `/* CALENDARIO */
.cal-month{margin-bottom:2.5rem}`,
  `/* AGENDA CALENDAR */
.cal-grid-header{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;margin-bottom:1px}
.cal-grid-header div{padding:.45rem;text-align:center;font-size:.58rem;letter-spacing:.15em;text-transform:uppercase;color:var(--text-muted);background:var(--dark2)}
.cal-month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--border)}
.cal-day{background:var(--dark2);min-height:110px;padding:.4rem .45rem;position:relative;transition:background .15s;vertical-align:top}
.cal-day:hover{background:#1e1e1e}
.cal-day.other-month{background:#0d0d0d}
.cal-day.other-month .cal-day-num{color:#333}
.cal-day.is-today .cal-day-num{background:var(--gold);color:#000;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:700}
.cal-day-num{font-size:.68rem;color:var(--text-muted);margin-bottom:.3rem;font-weight:600}
.cal-appt{font-size:.6rem;padding:.18rem .45rem;border-radius:2px;margin-bottom:.2rem;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;border-left:2px solid transparent;line-height:1.4;position:relative}
.cal-appt.residential{background:rgba(26,158,151,.18);border-left-color:#1a9e97;color:#7dcecc}
.cal-appt.commercial{background:rgba(59,130,246,.18);border-left-color:#3b82f6;color:#93c5fd}
.cal-appt.power_washing{background:rgba(249,115,22,.18);border-left-color:#f97316;color:#fdba74}
.cal-appt.other{background:rgba(184,146,46,.15);border-left-color:var(--gold);color:var(--gold)}
.agenda-tooltip{position:fixed;z-index:9999;background:#111;border:1px solid rgba(184,146,46,.35);padding:.75rem 1rem;box-shadow:0 8px 32px rgba(0,0,0,.5);max-width:240px;pointer-events:none}
.agenda-tooltip .tt-name{font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:.4rem}
.agenda-tooltip .tt-row{font-size:.65rem;color:var(--text-muted);display:flex;gap:.4rem;margin-bottom:.15rem;align-items:center}
.agenda-tooltip .tt-row span:first-child{color:var(--gold);min-width:14px}
.agenda-tooltip .tt-status{display:inline-block;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;padding:.15rem .4rem;border-radius:2px;margin-top:.3rem}
.agenda-tooltip .tt-status.open{background:rgba(26,158,151,.2);color:#1a9e97}
.agenda-tooltip .tt-status.confirmed{background:rgba(59,130,246,.2);color:#60a5fa}
.agenda-tooltip .tt-status.completed{background:rgba(76,175,79,.2);color:#4caf79}
.agenda-tooltip .tt-status.cancelled{background:rgba(224,82,82,.2);color:#e05252}
/* WHATSAPP BROADCAST */
.cal-campaign-btn{background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.3);color:#25d366;font-size:.58rem;letter-spacing:.12em;padding:.4rem .75rem;cursor:pointer;font-family:'Montserrat',sans-serif;white-space:nowrap;transition:.2s;text-transform:uppercase}
.cal-campaign-btn:hover{background:#25d366;color:#000}
.wa-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9000;display:flex;align-items:center;justify-content:center;padding:1rem}
.wa-modal{background:#111;border:1px solid rgba(37,211,102,.3);max-width:540px;width:100%;padding:1.8rem;position:relative;max-height:90vh;overflow-y:auto}
.wa-modal-title{font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:#25d366;margin-bottom:.3rem}
.wa-modal-event{font-size:.65rem;letter-spacing:.15em;color:var(--text-muted);text-transform:uppercase;margin-bottom:1.2rem}
.wa-textarea{width:100%;background:#0d0d0d;border:1px solid rgba(37,211,102,.25);color:#e4ddd0;font-family:'Montserrat',sans-serif;font-size:.78rem;line-height:1.7;padding:.85rem 1rem;resize:vertical;min-height:260px;outline:none;margin-bottom:.8rem}
.wa-textarea:focus{border-color:#25d366}
.wa-actions{display:flex;gap:.6rem;flex-wrap:wrap}
.wa-copy-btn{background:#25d366;color:#000;border:none;padding:.6rem 1.4rem;font-family:'Montserrat',sans-serif;font-size:.65rem;letter-spacing:.18em;font-weight:700;cursor:pointer;text-transform:uppercase;flex:1;transition:.2s}
.wa-copy-btn:hover{background:#1fbb57}
.wa-close-btn{background:transparent;border:1px solid var(--border);color:var(--text-muted);padding:.6rem 1rem;font-family:'Montserrat',sans-serif;font-size:.65rem;cursor:pointer}
/* CALENDARIO */
.cal-month{margin-bottom:2.5rem}`
);

// ── 5. Add switchTab handler for agenda ───────────────────────────────────────
replace('Add agenda to switchTab',
  `  if (name === 'templates') loadTemplates();
  if (name === 'calendario') loadCalendario();`,
  `  if (name === 'templates') loadTemplates();
  if (name === 'agenda') loadAgenda();
  if (name === 'calendario') loadCalendario();`
);

// ── 6. Replace loadCalendario + openCampaignEmail with new WhatsApp version ──
replace('Replace calendar campaign with WhatsApp generator',
  `function loadCalendario() {
  const cont = document.getElementById('calendario-content');
  const badgeMap = { jewelry: 'badge-jewelry', cleaning: 'badge-cleaning', both: 'badge-both', urgent: 'badge-urgent' };
  const labelMap = { jewelry: 'Jewelry', cleaning: 'Cleaning', both: 'Jewelry + Cleaning', urgent: '🔥 Priority' };
  cont.innerHTML = PROMO_CALENDAR.map(m => \`
    <div class="cal-month">
      <div class="cal-month-title">\${m.month}</div>
      <div class="cal-events">
        \${m.events.map(ev => \`
          <div class="cal-event \${ev.type}">
            <div class="cal-date">\${ev.day}<span>\${ev.dow}</span></div>
            <div class="cal-info">
              <h4>\${ev.name} &nbsp;<span class="cal-badge \${badgeMap[ev.type]}">\${labelMap[ev.type]}</span></h4>
              <p>\${ev.desc}</p>
            </div>
            <button class="cal-campaign-btn" onclick="openCampaignEmail('\${ev.name}')">✉ Campaign</button>
          </div>
        \`).join('')}
      </div>
    </div>
  \`).join('');
}

function openCampaignEmail(eventName) {
  _pendingEmail = null;
  const to = prompt(\`Send "\${eventName}" campaign email to:\`, '');
  if (!to || !to.includes('@')) return;
  const type = eventName.toLowerCase().includes('christmas') || eventName.toLowerCase().includes('new year') ? 'brand'
    : eventName.toLowerCase().includes('vip') ? 'vip'
    : eventName.toLowerCase().includes('gift') || eventName.toLowerCase().includes('valentine') || eventName.toLowerCase().includes('father') ? 'gift'
    : 'welcome';
  fetch('/api/cron/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, to, name: to.split('@')[0] })
  }).then(r => r.json()).then(d => showToast(d.ok ? '✓ Campaign sent to ' + to : '⚠ Failed: ' + d.error))
    .catch(e => showToast('⚠ ' + e.message));
}`,
  `function loadCalendario() {
  const cont = document.getElementById('calendario-content');
  const badgeMap = { jewelry: 'badge-jewelry', cleaning: 'badge-cleaning', both: 'badge-both', urgent: 'badge-urgent' };
  const labelMap = { jewelry: '💎 Jewelry', cleaning: '🧹 Cleaning', both: '💎🧹 Both', urgent: '🔥 Priority' };
  cont.innerHTML = PROMO_CALENDAR.map(m => \`
    <div class="cal-month">
      <div class="cal-month-title">\${m.month}</div>
      <div class="cal-events">
        \${m.events.map((ev, i) => \`
          <div class="cal-event \${ev.type}">
            <div class="cal-date">\${ev.day}<span>\${ev.dow}</span></div>
            <div class="cal-info" style="flex:1">
              <h4>\${ev.name} &nbsp;<span class="cal-badge \${badgeMap[ev.type]}">\${labelMap[ev.type]}</span></h4>
              <p>\${ev.desc}</p>
            </div>
            <button class="cal-campaign-btn" onclick="openWhatsAppBroadcast(\${JSON.stringify(ev).replace(/"/g,'&quot;')})">📲 WhatsApp</button>
          </div>
        \`).join('')}
      </div>
    </div>
  \`).join('');
}

// ── WhatsApp Broadcast Message Generator ─────────────────────────────────────
function generateBroadcastMsg(ev) {
  const name = ev.name;
  const type = (ev.type || 'both');
  const isUrgent = type === 'urgent';
  const isCleaning = type === 'cleaning' || type === 'both';
  const isJewelry = type === 'jewelry' || type === 'both';

  // Seasonal hooks
  const hooks = {
    'Father': 'Dia dos Pais tá chegando',
    'Juneteenth': 'Juneteenth',
    'Independence': 'Quatro de Julho',
    'Summer': 'verão já chegou',
    'Back to School': 'volta às aulas',
    'Labor': 'Labor Day chegando',
    'Fall': 'estação mudando',
    'Halloween': 'Halloween chegando',
    'Thanksgiving': 'Thanksgiving chegando',
    'Black Friday': 'Black Friday',
    'Small Business': 'Small Business Saturday',
    'Cyber': 'Cyber Monday',
    'Christmas': 'Natal chegando',
    'New Year': 'Ano Novo chegando',
    "Valentine": "Dia dos Namorados chegando",
    "Mother": "Dia das Mães chegando",
    "Breast": "Outubro Rosa",
    "Spring": "primavera chegou",
    "Airbnb": "temporada de verão"
  };

  const hook = Object.entries(hooks).find(([k]) => name.includes(k));
  const hookText = hook ? hook[1] : name;

  // Build the message parts
  let opening = '';
  let offer = '';
  let cta = '';

  if (isCleaning && isUrgent) {
    opening = \`Oi! 🔥 \${hookText.charAt(0).toUpperCase() + hookText.slice(1)} e as vagas estão voando aqui na Lagos Cleaning.\`;
    offer = \`⚡ Agenda ainda disponível essa semana em PA & NJ.\\n🎁 Use LAGOS15 e garanta 15% OFF no primeiro serviço.\`;
    cta = \`📲 Responde aqui para reservar sua vaga ou acesse:\\nlagosworld.app/cleaning\\n\\nLagos Cleaning · Bonded & Insured 🏠\`;
  } else if (isCleaning) {
    opening = \`Oi! 🏡 Com o \${hookText}, é o momento perfeito pra deixar a casa limpa e organizada antes que o calendário encha.\`;
    offer = \`A Lagos Cleaning ainda tem vagas disponíveis essa semana em Philadelphia, PA & NJ.\\n\\n✅ Faxina residencial\\n✅ Limpeza profunda\\n✅ Move in / move out\\n✅ CH ELITE Power Wash\\n🎁 Código LAGOS15 — 15% OFF no primeiro serviço\`;
    cta = \`📲 Quer agendar? Responde aqui ou acessa:\\nlagosworld.app/cleaning\\n\\nLagos Cleaning · +1 (215) 626-2345\`;
  } else if (isJewelry) {
    opening = \`Oi! ✨ Com o \${hookText}, já pensou numa peça especial que combine com o momento?\`;
    offer = \`A Lagos Jewelry tem novas peças disponíveis — brincos, colares, anéis e pulseiras em ouro 18k.\\n🎁 Use WELCOME10 e garanta 10% OFF na primeira compra.\`;
    cta = \`💎 Acessa a coleção:\\nlagosworld.app/jewelry\\n\\nLagos Jewelry · Philadelphia, PA\`;
  } else {
    opening = \`Oi! 🌟 Com o \${hookText}, a gente preparou algo especial pra você.\`;
    offer = \`Lagos Cleaning e Lagos Jewelry — dois serviços premium, uma equipe dedicada a cuidar do que importa pra você.\\n\\n🧹 Faxina com 15% OFF (LAGOS15)\\n💎 Joia com 10% OFF (WELCOME10)\`;
    cta = \`📲 Fala com a gente:\\nlagosworld.app\\nLagos World · PA & NJ · +1 (215) 626-2345\`;
  }

  return \`\${opening}

\${offer}

\${cta}\`;
}

function openWhatsAppBroadcast(ev) {
  // ev might come as HTML-escaped object, decode it
  if (typeof ev === 'string') {
    try { ev = JSON.parse(ev.replace(/&quot;/g,'"')); } catch(e) { return; }
  }
  const msg = generateBroadcastMsg(ev);

  // Build modal
  const existing = document.getElementById('wa-broadcast-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'wa-broadcast-modal';
  modal.className = 'wa-modal-overlay';
  modal.innerHTML = \`
    <div class="wa-modal">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem">
        <div>
          <div class="wa-modal-title">📲 WhatsApp Broadcast</div>
          <div class="wa-modal-event">✦ \${ev.name} — \${ev.dow ? ev.dow+', ' : ''}\${ev.day || ''}</div>
        </div>
        <button class="wa-close-btn" onclick="document.getElementById('wa-broadcast-modal').remove()">✕</button>
      </div>
      <div style="font-size:.63rem;color:var(--text-muted);margin-bottom:.6rem;line-height:1.5">
        Mensagem gerada para broadcast. Edite se quiser, depois copie e cole no WhatsApp Business → Broadcast.
      </div>
      <textarea class="wa-textarea" id="wa-msg-text">\${msg}</textarea>
      <div style="font-size:.6rem;color:#25d366;margin-bottom:.7rem">
        ✓ Mensagem personalizada — vai para todos mas cada pessoa sente que é só pra ela
      </div>
      <div class="wa-actions">
        <button class="wa-copy-btn" onclick="copyWaMsg()">📋 Copiar Mensagem</button>
        <button class="wa-copy-btn" style="background:#128c7e;flex:0 0 auto" onclick="openWhatsAppBroadcast({name:'Regenerar',type:'\${ev.type}',desc:'\${(ev.desc||'').replace(/'/g,'\\\\\'')}'})">🔄 Regenerar</button>
        <button class="wa-close-btn" onclick="document.getElementById('wa-broadcast-modal').remove()">Fechar</button>
      </div>
    </div>
  \`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function copyWaMsg() {
  const ta = document.getElementById('wa-msg-text');
  navigator.clipboard.writeText(ta.value).then(() => {
    showToast('✓ Mensagem copiada — cole no WhatsApp Broadcast');
  }).catch(() => {
    ta.select();
    document.execCommand('copy');
    showToast('✓ Copiado!');
  });
}

// ── AGENDA CALENDAR ───────────────────────────────────────────────────────────
let _agendaYear  = new Date().getFullYear();
let _agendaMonth = new Date().getMonth();   // 0-indexed
let _agendaData  = [];                      // cached requests

const SERVICE_LABEL = {
  residential:    'Residencial',
  commercial:     'Comercial',
  power_washing:  'Power Wash',
};
const SERVICE_CLASS = {
  residential:   'residential',
  commercial:    'commercial',
  power_washing: 'power_washing',
};

async function loadAgenda() {
  const label = document.getElementById('agenda-month-label');
  const grid  = document.getElementById('agenda-grid');
  label.textContent = 'Carregando...';
  grid.innerHTML = '';

  try {
    const r = await fetch('/api/cleaning/requests', {
      headers: adminToken ? { 'Authorization': 'Bearer ' + adminToken } : {}
    });
    _agendaData = r.ok ? await r.json() : [];
  } catch(e) {
    _agendaData = [];
  }
  renderAgendaMonth();
}

function agendaNav(dir) {
  if (dir === 0) {
    _agendaYear  = new Date().getFullYear();
    _agendaMonth = new Date().getMonth();
  } else {
    _agendaMonth += dir;
    if (_agendaMonth > 11) { _agendaMonth = 0;  _agendaYear++; }
    if (_agendaMonth < 0)  { _agendaMonth = 11; _agendaYear--; }
  }
  renderAgendaMonth();
}

function renderAgendaMonth() {
  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const label = document.getElementById('agenda-month-label');
  const grid  = document.getElementById('agenda-grid');
  const sub   = document.getElementById('agenda-subtitle');

  label.textContent = \`\${MONTHS_PT[_agendaMonth]} \${_agendaYear}\`;

  // Build lookup: dateStr → [request, ...]
  const lookup = {};
  (_agendaData || []).forEach(req => {
    const d = req.preferred_date; // 'YYYY-MM-DD'
    if (!d) return;
    const [y, m] = d.split('-').map(Number);
    if (y === _agendaYear && m - 1 === _agendaMonth) {
      if (!lookup[d]) lookup[d] = [];
      lookup[d].push(req);
    }
  });

  const thisMonthCount = Object.values(lookup).reduce((s, a) => s + a.length, 0);
  sub.textContent = \`\${thisMonthCount} agendamento\${thisMonthCount !== 1 ? 's' : ''} neste mês\`;

  // Build month grid
  const firstDay = new Date(_agendaYear, _agendaMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(_agendaYear, _agendaMonth + 1, 0).getDate();
  const daysInPrev  = new Date(_agendaYear, _agendaMonth, 0).getDate();
  const today = new Date();
  const todayStr = \`\${today.getFullYear()}-\${String(today.getMonth()+1).padStart(2,'0')}-\${String(today.getDate()).padStart(2,'0')}\`;

  const cells = [];

  // Previous month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, current: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = \`\${_agendaYear}-\${String(_agendaMonth+1).padStart(2,'0')}-\${String(d).padStart(2,'0')}\`;
    cells.push({ day: d, dateStr: ds, current: true, isToday: ds === todayStr, appts: lookup[ds] || [] });
  }
  // Next month filler to complete last row
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  grid.innerHTML = cells.map(cell => {
    if (!cell.current) {
      return \`<div class="cal-day other-month"><div class="cal-day-num">\${cell.day}</div></div>\`;
    }
    const apptHtml = cell.appts.slice(0, 4).map(req => {
      const sc = SERVICE_CLASS[req.service_type] || 'other';
      const sl = SERVICE_LABEL[req.service_type] || req.service_type || '—';
      const fname = (req.customer_name || '').split(' ')[0];
      const safeReq = JSON.stringify({
        customer_name: req.customer_name || '',
        service_type:  req.service_type || '',
        customer_phone: req.customer_phone || '',
        city: req.city || '',
        status: req.status || 'open',
        preferred_date: req.preferred_date || '',
        recurrence: req.recurrence || ''
      }).replace(/"/g, '&quot;');
      return \`<div class="cal-appt \${sc}"
        onmouseenter="showAgendaTooltip(event, \${safeReq})"
        onmouseleave="hideAgendaTooltip()">\${fname} · \${sl}</div>\`;
    }).join('');
    const moreHtml = cell.appts.length > 4
      ? \`<div style="font-size:.55rem;color:var(--text-muted);padding:.1rem .4rem">+\${cell.appts.length - 4} mais</div>\`
      : '';

    return \`<div class="cal-day\${cell.isToday ? ' is-today' : ''}">
      <div class="cal-day-num">\${cell.day}</div>
      \${apptHtml}\${moreHtml}
    </div>\`;
  }).join('');
}

function showAgendaTooltip(e, req) {
  if (typeof req === 'string') {
    try { req = JSON.parse(req.replace(/&quot;/g,'"')); } catch(x) { return; }
  }
  const tt = document.getElementById('agenda-tooltip');
  const sl = SERVICE_LABEL[req.service_type] || req.service_type || '—';
  const recLabel = req.recurrence
    ? \`<div class="tt-row"><span>🔄</span><span>\${req.recurrence}</span></div>\` : '';
  tt.innerHTML = \`
    <div class="tt-name">\${req.customer_name || '—'}</div>
    <div class="tt-row"><span>🧹</span><span>\${sl}</span></div>
    \${req.customer_phone ? \`<div class="tt-row"><span>📞</span><span>\${req.customer_phone}</span></div>\` : ''}
    \${req.city ? \`<div class="tt-row"><span>📍</span><span>\${req.city}</span></div>\` : ''}
    \${req.preferred_date ? \`<div class="tt-row"><span>📅</span><span>\${req.preferred_date}</span></div>\` : ''}
    \${recLabel}
    <span class="tt-status \${req.status || 'open'}">\${req.status || 'open'}</span>
  \`;
  tt.style.display = 'block';
  _positionTooltip(e, tt);
}

function hideAgendaTooltip() {
  document.getElementById('agenda-tooltip').style.display = 'none';
}

function _positionTooltip(e, tt) {
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = e.clientX + 14, y = e.clientY + 14;
  if (x + 260 > vw) x = e.clientX - 260;
  if (y + 200 > vh) y = e.clientY - 200;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

document.addEventListener('mousemove', e => {
  const tt = document.getElementById('agenda-tooltip');
  if (tt && tt.style.display !== 'none') _positionTooltip(e, tt);
});`
);

fs.writeFileSync(filePath, html, 'utf8');
console.log(`\n✅ All ${changed} patches applied.`);
