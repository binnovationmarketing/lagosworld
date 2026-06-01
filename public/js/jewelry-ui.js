// ── UI: Hot Deals Carousel, Scroll Animations, Newsletter ────────────────────

// ── HOT DEALS CAROUSEL ───────────────────────────────────────────────────────
let _hotIdx = 0;

function buildHotDeals() {
  const hasImg = p => !!((imgsOv[p.id] && imgsOv[p.id][0]) || (p.imgs && p.imgs[0]));
  // Move high-value inventory: in-stock pieces ranked by capital tied up
  // (stock × price). Highest first. A discount badge shows only when a real
  // price override exists; otherwise an "In Stock" badge signals ready-to-ship.
  const deals = PRODUCTS
    .filter(p => p.stock > 0 && hasImg(p) && p.minPrice > 0)
    .map(p => {
      const origMin = Math.min(...p.variacoes.map(v => v.price));
      const ovMin   = Math.min(...p.variacoes.map(v => priceOv[p.id+'_'+v.id] ?? v.price));
      return { p, origMin, ovMin, value: (p.stock || 0) * ovMin };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
  const section = document.getElementById('hot-deals-section');
  if (!deals.length) { if (section) section.style.display = 'none'; return; }
  section.style.display = '';
  const track = document.getElementById('hot-track');
  track.innerHTML = deals.map(({ p, origMin, ovMin }) => {
    const discounted = ovMin < origMin;
    const img   = (imgsOv[p.id] && imgsOv[p.id][0]) || p.imgs[0] || '';
    const name  = nameOv[p.id] || p.name;
    const badge = discounted
      ? `<div class="hot-badge">-${Math.round((1 - ovMin / origMin) * 100)}%</div>`
      : `<div class="hot-badge" style="background:linear-gradient(135deg,#16a34a,#22c55e)">✓ In Stock</div>`;
    const prices = discounted
      ? `<span class="hot-orig">${origMin.toFixed(2)}</span><span class="hot-now">${ovMin.toFixed(2)}</span>`
      : `<span class="hot-now">$${ovMin.toFixed(2)}</span>`;
    return `<div class="hot-card" onclick="openModal(${p.id})">
      ${badge}
      <img src="${img}" alt="${name}" loading="lazy">
      <div class="hot-info">
        <div class="hot-name">${name}</div>
        <div class="hot-prices">${prices}</div>
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

// ── NEW ARRIVALS CAROUSEL ─────────────────────────────────────────────────────
let _newIdx = 0;

function buildNewArrivals() {
  // New Arrival = new product physically in stock -> available now.
  // Only show items that actually have a photo (no placeholder cards).
  const hasImg = p => !!((imgsOv[p.id] && imgsOv[p.id][0]) || (p.imgs && p.imgs[0]));
  const arrivals = PRODUCTS.filter(p => p.newArrival && p.stock > 0 && hasImg(p));
  const section = document.getElementById('new-arrivals-section');
  if (!arrivals.length) { if(section) section.style.display='none'; return; }
  if(section) section.style.display = '';
  const track = document.getElementById('new-track');
  if (!track) return;
  track.innerHTML = arrivals.map(p => {
    const img  = (imgsOv[p.id]&&imgsOv[p.id][0]) || p.imgs[0] || '';
    const name = nameOv[p.id] || p.name;
    const price = p.minPrice > 0
      ? (p.minPrice === p.maxPrice ? `$${p.minPrice.toFixed(2)}` : `$${p.minPrice.toFixed(2)}+`)
      : 'Price on request';
    const stockLabel = p.stock > 0
      ? `<span style="font-size:.55rem;color:#16a34a;font-weight:700;letter-spacing:.1em;text-transform:uppercase">✓ In Stock</span>`
      : `<span style="font-size:.55rem;color:#b8922e;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Order Only</span>`;
    const imgHtml = img
      ? `<img src="${img}" alt="${name}" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;display:block">`
      : `<div style="width:100%;aspect-ratio:1;background:linear-gradient(135deg,#f5efe0,#ebe1c8);display:flex;align-items:center;justify-content:center;font-size:2.5rem">💎</div>`;
    return `<div class="hot-card" onclick="requestAnimationFrame(()=>openModal(${p.id}))">
      <div class="new-badge-card">✦ NEW</div>
      ${imgHtml}
      <div class="hot-info">
        <div style="font-size:.58rem;color:#b8922e;letter-spacing:.15em;text-transform:uppercase;margin-bottom:.3rem">${p.cat}</div>
        <div class="hot-name">${name}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.5rem">
          <span style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:700;color:#b8922e">${price}</span>
          ${stockLabel}
        </div>
      </div>
    </div>`;
  }).join('');
  _newIdx = 0;
  _newSlide();
}

function _newSlide() {
  const track = document.getElementById('new-track');
  if(!track) return;
  const cards = track.querySelectorAll('.hot-card');
  if (!cards.length) return;
  const w = cards[0].offsetWidth + 16;
  track.style.transform = `translateX(-${_newIdx * w}px)`;
}

function newPrev() {
  const track = document.getElementById('new-track');
  if(!track) return;
  const total = track.querySelectorAll('.hot-card').length;
  _newIdx = (_newIdx - 1 + total) % total;
  _newSlide();
}

function newNext() {
  const track = document.getElementById('new-track');
  if(!track) return;
  const total = track.querySelectorAll('.hot-card').length;
  _newIdx = (_newIdx + 1) % total;
  _newSlide();
}

// ── NEW HOT CAROUSEL (new in catalog, order-only) ─────────────────────────────
let _newHotIdx = 0;

function buildNewHot() {
  // New Hot = new product from supplier catalog, not in stock -> order only.
  // Only show items that actually have a photo (no placeholder cards).
  const hasImg = p => !!((imgsOv[p.id] && imgsOv[p.id][0]) || (p.imgs && p.imgs[0]));
  const hots = PRODUCTS.filter(p => p.newArrival && !(p.stock > 0) && hasImg(p));
  const section = document.getElementById('new-hot-section');
  if (!hots.length) { if(section) section.style.display='none'; return; }
  if(section) section.style.display = '';
  const track = document.getElementById('newhot-track');
  if (!track) return;
  track.innerHTML = hots.map(p => {
    const img  = (imgsOv[p.id]&&imgsOv[p.id][0]) || p.imgs[0] || '';
    const name = nameOv[p.id] || p.name;
    const price = p.minPrice > 0
      ? (p.minPrice === p.maxPrice ? `$${p.minPrice.toFixed(2)}` : `$${p.minPrice.toFixed(2)}+`)
      : 'Price on request';
    const imgHtml = img
      ? `<img src="${img}" alt="${name}" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;display:block">`
      : `<div style="width:100%;aspect-ratio:1;background:linear-gradient(135deg,#f5efe0,#ebe1c8);display:flex;align-items:center;justify-content:center;font-size:2.5rem">💎</div>`;
    return `<div class="hot-card" onclick="requestAnimationFrame(()=>openModal(${p.id}))">
      <div class="new-badge-card hot">🔥 NEW HOT</div>
      ${imgHtml}
      <div class="hot-info">
        <div style="font-size:.58rem;color:#c94c4c;letter-spacing:.15em;text-transform:uppercase;margin-bottom:.3rem">${p.cat}</div>
        <div class="hot-name">${name}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.5rem">
          <span style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:700;color:#b8922e">${price}</span>
          <span style="font-size:.55rem;color:#b8922e;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Made to Order</span>
        </div>
      </div>
    </div>`;
  }).join('');
  _newHotIdx = 0;
  _newHotSlide();
}

function _newHotSlide() {
  const track = document.getElementById('newhot-track');
  if(!track) return;
  const cards = track.querySelectorAll('.hot-card');
  if (!cards.length) return;
  const w = cards[0].offsetWidth + 16;
  track.style.transform = `translateX(-${_newHotIdx * w}px)`;
}

function newHotPrev() {
  const track = document.getElementById('newhot-track');
  if(!track) return;
  const total = track.querySelectorAll('.hot-card').length;
  _newHotIdx = (_newHotIdx - 1 + total) % total;
  _newHotSlide();
}

function newHotNext() {
  const track = document.getElementById('newhot-track');
  if(!track) return;
  const total = track.querySelectorAll('.hot-card').length;
  _newHotIdx = (_newHotIdx + 1) % total;
  _newHotSlide();
}

// ── SCROLL ANIMATIONS ─────────────────────────────────────────────────────────
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis')})},{threshold:.1});
document.querySelectorAll('.animate-in').forEach(el=>obs.observe(el));

// ── KEYBOARD NAV for modal images ─────────────────────────────────────────────
// passive:false only when modal is open (need to intercept arrow keys); passive otherwise
// Using a flag avoids forcing style recalc on every keydown when modal is closed
let _modalOpen=false;
document.addEventListener('keydown',e=>{
  if(!_modalOpen)return;
  if(e.key==='ArrowLeft')modalPrev();
  else if(e.key==='ArrowRight')modalNext();
},{passive:true});
// _modalOpen is set by jewelry-modal.js openModal/closeModal

// ── SEARCH INPUT — passive debounced listener (replaces inline oninput) ────────
document.addEventListener('DOMContentLoaded',()=>{
  const si=document.getElementById('search');
  if(si) si.addEventListener('input',function(){doSearch(this.value);},{passive:true});
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
