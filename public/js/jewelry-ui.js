// ── UI: Hot Deals Carousel, Scroll Animations, Newsletter ────────────────────

// ── HOT DEALS CAROUSEL ───────────────────────────────────────────────────────
let _hotIdx = 0;

function buildHotDeals() {
  const deals = PRODUCTS.filter(p => {
    const origMin = Math.min(...p.variacoes.map(v => v.price));
    const ovMin   = Math.min(...p.variacoes.map(v => priceOv[p.id+'_'+v.id] ?? v.price));
    return ovMin < origMin;
  });
  const section = document.getElementById('hot-deals-section');
  if (!deals.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  const track = document.getElementById('hot-track');
  track.innerHTML = deals.map(p => {
    const ovMin   = Math.min(...p.variacoes.map(v => priceOv[p.id+'_'+v.id] ?? v.price));
    const origMin = Math.min(...p.variacoes.map(v => v.price));
    const pct     = Math.round((1 - ovMin / origMin) * 100);
    const img     = (imgsOv[p.id] && imgsOv[p.id][0]) || p.imgs[0] || '';
    const name    = nameOv[p.id] || p.name;
    return `<div class="hot-card" onclick="openModal(${p.id})">
      <div class="hot-badge">-${pct}%</div>
      <img src="${img}" alt="${name}" loading="lazy">
      <div class="hot-info">
        <div class="hot-name">${name}</div>
        <div class="hot-prices">
          <span class="hot-orig">${origMin.toFixed(2)}</span>
          <span class="hot-now">${ovMin.toFixed(2)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
  _hotIdx = 0;
  _hotSlide();
}

function _hotSlide() {
  const track = document.getElementById('hot-track');
  const cards = track.querySelectorAll('.hot-card');
  if (!cards.length) return;
  const w = cards[0].offsetWidth + 16;
  track.style.transform = `translateX(-${_hotIdx * w}px)`;
}

function hotPrev() {
  const track = document.getElementById('hot-track');
  const total = track.querySelectorAll('.hot-card').length;
  _hotIdx = (_hotIdx - 1 + total) % total;
  _hotSlide();
}

function hotNext() {
  const track = document.getElementById('hot-track');
  const total = track.querySelectorAll('.hot-card').length;
  _hotIdx = (_hotIdx + 1) % total;
  _hotSlide();
}

// ── SCROLL ANIMATIONS ─────────────────────────────────────────────────────────
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis')})},{threshold:.1});
document.querySelectorAll('.animate-in').forEach(el=>obs.observe(el));

// ── KEYBOARD NAV for modal images ─────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  if(!document.getElementById('modal-bg').classList.contains('open'))return;
  if(e.key==='ArrowLeft')modalPrev();
  else if(e.key==='ArrowRight')modalNext();
});

// ── NEWSLETTER POPUP ──────────────────────────────────────────────────────────
(function(){
  if (localStorage.getItem('nl_shown')) return;
  setTimeout(() => {
    const popup = document.getElementById('newsletter-popup');
    const inner = popup.querySelector('div');
    popup.style.opacity = '1';
    popup.style.pointerEvents = 'all';
    inner.style.transform = 'translateY(0)';
  }, 2500);
})();

function closeNewsletter() {
  const popup = document.getElementById('newsletter-popup');
  popup.style.opacity = '0';
  popup.style.pointerEvents = 'none';
  localStorage.setItem('nl_shown', '1');
}

async function submitNewsletter() {
  const name = document.getElementById('nl-name').value.trim();
  const email = document.getElementById('nl-email').value.trim();
  const btn = document.getElementById('nl-btn');
  if (!email || !email.includes('@')) {
    document.getElementById('nl-email').style.borderColor = '#c9a84c';
    return;
  }
  btn.textContent = 'Subscribing...';
  btn.disabled = true;
  try {
    await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, source: 'jewelry-popup' })
    });
  } catch(e) { /* silent */ }
  btn.textContent = "✅ You're In! Welcome to the VIP List!";
  btn.style.background = '#16A34A';
  btn.style.color = '#fff';
  setTimeout(closeNewsletter, 2000);
}
