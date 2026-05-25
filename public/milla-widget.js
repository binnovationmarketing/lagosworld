/**
 * Milla Widget v3 — Lagos World Executive Partner AI
 * Include anywhere: <script src="/milla-widget.js"></script>
 * Requires: /api/milla/chat endpoint
 */
(function() {
  'use strict';

  // Session ID — persists per browser tab
  const SESSION_ID = (function() {
    const key = 'milla_session';
    let id = sessionStorage.getItem(key);
    if (!id) { id = 'web_' + Date.now() + '_' + Math.random().toString(36).slice(2,9); sessionStorage.setItem(key, id); }
    return id;
  })();

  // Page context — sent to backend so Milla knows which area of the site
  const PAGE_PATH = window.location.pathname;
  const isJewelry  = PAGE_PATH.includes('jewelry');
  const isPower    = PAGE_PATH.includes('powerwashing') || PAGE_PATH.includes('power');
  const isCleaning = PAGE_PATH.includes('cleaning') || isPower;
  const ACCENT      = isJewelry ? '#b8922e' : '#1a9e97';
  const ACCENT_DARK = isJewelry ? '#8a6d20' : '#147a75';

  // ── CSS ─────────────────────────────────────────────────────────────────────
  const css = `
    #milla-bubble{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9990;width:52px;height:52px;border-radius:50%;background:${ACCENT};border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:1.4rem;transition:transform .15s,box-shadow .15s;outline:none;-webkit-tap-highlight-color:transparent}
    #milla-bubble:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(0,0,0,.45)}
    #milla-bubble .milla-badge{position:absolute;top:-2px;right:-2px;width:13px;height:13px;background:#25d366;border-radius:50%;border:2px solid #fff;animation:milla-pulse 2s infinite}
    @keyframes milla-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:.7}}

    /* ── Desktop panel ── */
    #milla-panel{position:fixed;bottom:5rem;right:1.5rem;z-index:9990;width:360px;max-width:calc(100vw - 3rem);background:#1a1a18;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.6);display:none;flex-direction:column;overflow:hidden;font-family:'Montserrat',Georgia,sans-serif}
    #milla-panel.open{display:flex}

    /* ── Mobile: bottom sheet ── */
    @media(max-width:520px){
      #milla-bubble{bottom:1rem;right:1rem;width:48px;height:48px;font-size:1.3rem}
      #milla-panel{right:0;left:0;bottom:0;width:100%;max-width:100%;border-radius:20px 20px 0 0;border-left:none;border-right:none;border-bottom:none;max-height:82vh}
      #milla-panel.open{display:flex}
    }

    #milla-header{background:${ACCENT};padding:.75rem 1rem;display:flex;align-items:center;gap:.65rem}
    #milla-avatar{width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
    #milla-header-info{flex:1}
    #milla-header-name{font-size:.78rem;font-weight:700;color:#fff;letter-spacing:.05em}
    #milla-header-status{font-size:.58rem;color:rgba(255,255,255,.75);letter-spacing:.07em;display:flex;align-items:center;gap:.3rem;margin-top:.1rem}
    #milla-header-status::before{content:'';width:6px;height:6px;border-radius:50%;background:#25d366;display:inline-block}
    #milla-close{background:none;border:none;color:rgba(255,255,255,.8);font-size:1.1rem;cursor:pointer;padding:.3rem;line-height:1;-webkit-tap-highlight-color:transparent}
    #milla-close:hover{color:#fff}
    #milla-messages{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:.8rem;display:flex;flex-direction:column;gap:.55rem;max-height:340px;min-height:180px;scroll-behavior:smooth}
    @media(max-width:520px){#milla-messages{max-height:55vh;min-height:160px}}
    #milla-messages::-webkit-scrollbar{width:3px}
    #milla-messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
    .milla-msg{max-width:86%;padding:.55rem .8rem;border-radius:12px;font-size:.76rem;line-height:1.6;word-break:break-word;white-space:pre-wrap;animation:milla-fadein .22s ease}
    @keyframes milla-fadein{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
    .milla-msg.agent{background:rgba(255,255,255,.07);color:#e4ddd0;border-bottom-left-radius:3px;align-self:flex-start}
    .milla-msg.user{background:${ACCENT};color:#fff;border-bottom-right-radius:3px;align-self:flex-end}
    .milla-msg.error{background:rgba(224,82,82,.14);color:#e05252;border:1px solid rgba(224,82,82,.2);align-self:flex-start}
    .milla-typing{display:flex;align-items:center;gap:.25rem;padding:.5rem .8rem;background:rgba(255,255,255,.07);border-radius:12px;border-bottom-left-radius:3px;align-self:flex-start}
    .milla-typing-label{font-size:.62rem;color:rgba(255,255,255,.38);margin-right:.25rem;font-family:inherit}
    .milla-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.32);animation:milla-bounce 1.1s infinite}
    .milla-dot:nth-child(2){animation-delay:.18s}
    .milla-dot:nth-child(3){animation-delay:.36s}
    @keyframes milla-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    #milla-input-row{padding:.6rem .75rem;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:.45rem;background:#111;padding-bottom:env(safe-area-inset-bottom,.6rem)}
    #milla-input{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:#e4ddd0;border-radius:8px;padding:.48rem .7rem;font-size:.78rem;font-family:inherit;outline:none;resize:none;max-height:72px;min-height:34px;line-height:1.4;overflow-y:auto;-webkit-appearance:none}
    #milla-input:focus{border-color:${ACCENT}}
    #milla-input::placeholder{color:rgba(255,255,255,.28)}
    #milla-send{background:${ACCENT};border:none;border-radius:8px;width:34px;height:34px;min-width:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.15s;color:#fff;font-size:.85rem;align-self:flex-end;-webkit-tap-highlight-color:transparent}
    #milla-send:hover{background:${ACCENT_DARK}}
    #milla-send:disabled{opacity:.38;cursor:default}
    #milla-footer{padding:.3rem;text-align:center;font-size:.52rem;color:rgba(255,255,255,.18);letter-spacing:.09em;background:#111}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────────────────────────
  const label = isJewelry ? 'Lagos Jewelry' : isPower ? 'CH Elite Power Wash' : isCleaning ? 'Lagos Cleaning' : 'Lagos World';

  const bubble = document.createElement('button');
  bubble.id = 'milla-bubble';
  bubble.title = 'Talk to Milla';
  bubble.innerHTML = `<span>✨</span><span class="milla-badge"></span>`;

  const panel = document.createElement('div');
  panel.id = 'milla-panel';
  panel.innerHTML = `
    <div id="milla-header">
      <div id="milla-avatar">🌟</div>
      <div id="milla-header-info">
        <div id="milla-header-name">Milla · ${label}</div>
        <div id="milla-header-status">Online now</div>
      </div>
      <button id="milla-close" title="Close">✕</button>
    </div>
    <div id="milla-messages"></div>
    <div id="milla-input-row">
      <textarea id="milla-input" placeholder="Type your message..." rows="1"></textarea>
      <button id="milla-send" title="Send">➤</button>
    </div>
    <div id="milla-footer">✦ Milla · Executive Partner · Lagos World</div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  // ── State ────────────────────────────────────────────────────────────────────
  let isOpen  = false;
  let isBusy  = false;
  let greeted = false;

  const messagesEl = panel.querySelector('#milla-messages');
  const inputEl    = panel.querySelector('#milla-input');
  const sendBtn    = panel.querySelector('#milla-send');

  // ── DOM helpers — all scrollTop deferred to rAF to avoid forced layout ───────
  function scrollToBottom() {
    requestAnimationFrame(() => { messagesEl.scrollTop = messagesEl.scrollHeight; });
  }

  function appendMsg(text, role) {
    const div = document.createElement('div');
    div.className = `milla-msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'milla-typing';
    div.innerHTML = '<span class="milla-typing-label">Milla is typing</span><div class="milla-dot"></div><div class="milla-dot"></div><div class="milla-dot"></div>';
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  // ── Human-like typing delay ──────────────────────────────────────────────────
  // Simulates realistic reading + typing pace so responses feel human, not instant.
  // Short reply: ~1.5s · Long reply: ~4s · Always has natural variance.
  function humanDelay(responseText) {
    const words = (responseText || '').trim().split(/\s+/).length;
    const thinkMs  = 900  + Math.random() * 700;   // 0.9–1.6s "thinking"
    const typeMs   = words * 65 + Math.random() * 400; // ~65ms/word typing
    const total    = Math.min(thinkMs + typeMs, 4800);
    return new Promise(r => setTimeout(r, total));
  }

  // ── Toggle ───────────────────────────────────────────────────────────────────
  function toggle() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    bubble.querySelector('span:first-child').textContent = isOpen ? '✕' : '✨';
    if (isOpen && !greeted) { greeted = true; sendGreeting(); }
    if (isOpen) setTimeout(() => inputEl.focus(), 150);
  }

  bubble.addEventListener('click', toggle);
  panel.querySelector('#milla-close').addEventListener('click', toggle);

  // ── Greeting (local, instant — no API call) ──────────────────────────────────
  function sendGreeting() {
    const msg = isJewelry
      ? 'Hi there! ✨ I\'m Milla, your personal jewelry consultant at Lagos World. I can help you find the perfect piece, suggest a gift, or guide you to checkout. What are you looking for today?'
      : isPower
      ? 'Hi! I\'m Milla, Executive Partner at CH Elite Power Wash. 💧 I can help you prepare an estimate for your driveway, patio, deck or any exterior surface. What do you need?'
      : isCleaning
      ? 'Hi! I\'m Milla, Executive Partner at Lagos Cleaning. 🏡 I can help you prepare an estimate for residential, commercial or move-in/out cleaning. What can I help you with?'
      : 'Hi! I\'m Milla, Executive Partner at Lagos World. ✦ I can help with handcrafted jewelry, residential & commercial cleaning, or pressure washing. What brings you here today?';
    appendMsg(msg, 'agent');
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isBusy) return;
    isBusy = true;
    sendBtn.disabled = true;

    // Yield before any DOM work — eliminates INP blocking on keydown/click handler
    await new Promise(r => setTimeout(r, 0));

    appendMsg(text, 'user');
    inputEl.value = '';
    // Reset height in next frame to avoid forced reflow in same task
    requestAnimationFrame(() => { inputEl.style.height = 'auto'; });

    const typing = showTyping();

    try {
      // Fetch API response
      const r = await fetch('/api/milla/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          message:   text,
          sessionId: SESSION_ID,
          channel:   'web',
          page:      PAGE_PATH   // backend uses this for context-aware behavior
        })
      });
      const d = await r.json();

      if (d.ok && d.reply) {
        // Human delay: keep typing indicator visible for realistic duration
        await humanDelay(d.reply);
        typing.remove();
        appendMsg(d.reply, 'agent');
      } else {
        typing.remove();
        appendMsg(d.error || 'Something went wrong. Please try again. 🙏', 'error');
      }
    } catch(e) {
      typing.remove();
      appendMsg('No connection. Please check your internet and try again.', 'error');
    }

    isBusy = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  // ── Event listeners — all heavy work deferred via setTimeout(0) ──────────────
  sendBtn.addEventListener('click', () => setTimeout(sendMessage, 0));

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setTimeout(sendMessage, 0); }
  });

  // Auto-resize: write height='auto' then READ scrollHeight in separate rAF
  // Splitting write/read across two frames eliminates forced reflow on input event
  inputEl.addEventListener('input', () => {
    requestAnimationFrame(() => {
      inputEl.style.height = 'auto';
      requestAnimationFrame(() => {
        inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
      });
    });
  });

  // Auto-open after 8s on first visit (skip admin pages)
  if (!PAGE_PATH.includes('admin') && !sessionStorage.getItem('milla_shown')) {
    sessionStorage.setItem('milla_shown', '1');
    setTimeout(() => { if (!isOpen) toggle(); }, 8000);
  }
})();
