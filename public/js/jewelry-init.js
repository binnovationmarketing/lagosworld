// ── Init — load LAST (calls functions defined in all other files) ─────────────

// ── PARTICLES ────────────────────────────────────────────────────────────────
(()=>{
  const h=document.querySelector('.hero');
  for(let i=0;i<50;i++){
    const el=document.createElement('div');el.className='particle';
    const s=Math.random()*2+1;
    el.style.cssText=`left:${Math.random()*100}%;bottom:0;width:${s}px;height:${s}px;background:rgba(201,168,76,${Math.random()*.8+.2});animation-duration:${Math.random()*20+10}s;animation-delay:${Math.random()*15}s`;
    h.appendChild(el);
  }
})();

// ── Sync overrides from Supabase (source of truth) ───────────────────────────
(async function syncOverrides() {
  try {
    const r = await fetch('/api/jewelry/overrides');
    if (!r.ok) return;
    const rows = await r.json();
    if (!Array.isArray(rows)) return;

    // DB is the single source of truth — rebuild maps from scratch so overrides
    // removed in the DB (e.g. stale marketing images) don't linger in a browser's
    // localStorage cache. Merging used to leave deleted overrides on forever.
    const np = {}, nd = {}, ni = {}, nv = {}, nn = {};
    rows.forEach(row => {
      const pid = row.product_id;
      if (row.price_overrides) Object.assign(np, row.price_overrides);
      if (row.description !== null && row.description !== undefined) nd[pid] = row.description;
      if (Array.isArray(row.images) && row.images.length) ni[pid] = row.images;
      if (row.video_url) nv[pid] = row.video_url;
      if (row.name !== null && row.name !== undefined) nn[pid] = row.name;
    });
    priceOv = np; descOv = nd; imgsOv = ni; videoOv = nv; nameOv = nn;

    localStorage.setItem('lj_prices', JSON.stringify(priceOv));
    localStorage.setItem('lj_desc',   JSON.stringify(descOv));
    localStorage.setItem('lj_imgs',   JSON.stringify(imgsOv));
    localStorage.setItem('lj_videos', JSON.stringify(videoOv));
    localStorage.setItem('lj_names',  JSON.stringify(nameOv));

    // Patch card thumbnails and prices in DOM
    document.querySelectorAll('.card').forEach(card => {
      const btn = card.querySelector('[onclick*="openModal"]');
      if (!btn) return;
      const m = (btn.getAttribute('onclick') || '').match(/\d+/);
      if (!m) return;
      const pid = Number(m[0]);

      const imgs = imgsOv[pid];
      if (imgs && imgs.length) {
        const main = card.querySelector('.card-img');
        const hover = card.querySelector('.card-img-b');
        if (main) main.src = imgs[0];
        if (hover) hover.src = imgs[1] || imgs[0];
        const countEl = card.querySelector('.img-count');
        if (countEl) countEl.textContent = `📷 ${imgs.length} foto${imgs.length > 1 ? 's' : ''}`;
      }

      if (nameOv[pid]) {
        const nameEl = card.querySelector('.card-name');
        if (nameEl) nameEl.textContent = nameOv[pid];
      }

      const prod = PRODUCTS.find(p => p.id === pid);
      if (prod) {
        const varPrices    = prod.variacoes.map(v => priceOv[pid+'_'+v.id] ?? v.price);
        const origPrices   = prod.variacoes.map(v => v.price);
        const minPrice     = Math.min(...varPrices);
        const maxPrice     = Math.max(...varPrices);
        const origMinPrice = Math.min(...origPrices);
        const priceEl = card.querySelector('.price-val');
        if (priceEl) {
          priceEl.textContent = minPrice === maxPrice
            ? `${minPrice.toFixed(2)}`
            : `${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)}`;
        }
        if (minPrice < origMinPrice) {
          const pct = Math.round((1 - minPrice / origMinPrice) * 100);
          let badge = card.querySelector('.sale-badge');
          if (!badge) {
            badge = document.createElement('div');
            badge.className = 'sale-badge';
            card.style.position = 'relative';
            card.insertBefore(badge, card.firstChild);
          }
          badge.innerHTML = `-${pct}%`;
          const origEl = card.querySelector('.price-orig');
          if (!origEl && priceEl) {
            const s = document.createElement('span');
            s.className = 'price-orig';
            s.textContent = `${origMinPrice.toFixed(2)}`;
            priceEl.insertAdjacentElement('afterend', s);
          }
        }
      }
    });
    buildHotDeals();
    buildNewArrivals();
    buildNewHot();
  } catch(e) { buildNewArrivals(); buildNewHot(); /* still show new sections even if overrides fail */ }
})();

// ── STOCK — fetch live stock levels and apply unavailable overlays ────────────
(async function syncStock() {
  try {
    const r = await fetch('/api/jewelry/stock');
    if (!r.ok) return;
    const stockMap = await r.json(); // { sku: stock_qty }
    if (!stockMap || !Object.keys(stockMap).length) return;

    // Store globally so modal can read it
    window.__STOCK__ = stockMap;

    // Apply overlays to all rendered cards
    applyStockOverlays(stockMap);
  } catch (e) { /* non-fatal */ }
})();

function applyStockOverlays(stockMap) {
  if (!stockMap) return;
  document.querySelectorAll('.card[data-sku]').forEach(card => {
    const sku = card.getAttribute('data-sku');
    const qty = stockMap[sku];
    if (qty !== undefined && qty !== null && qty <= 0) {
      markCardUnavailable(card);
    }
  });
  // Also patch cards that embed sku via data attribute added by renderAllCards
  document.querySelectorAll('.card').forEach(card => {
    const btn = card.querySelector('[onclick*="openModal"]');
    if (!btn) return;
    // Try to find product by matching card's rendered name vs PRODUCTS
    const nameEl = card.querySelector('.card-name');
    if (!nameEl) return;
    const name = nameEl.textContent?.trim();
    const prod = PRODUCTS.find(p => (nameEl.textContent?.includes(p.name)));
    if (!prod || !prod.sku) return;
    const qty = stockMap[prod.sku];
    if (qty !== undefined && qty !== null && qty <= 0) {
      markCardUnavailable(card);
    }
  });
}

function markCardUnavailable(card) {
  if (card.querySelector('.stock-unavailable')) return; // already done
  card.style.position = 'relative';
  // Overlay badge
  const badge = document.createElement('div');
  badge.className = 'stock-unavailable';
  badge.innerHTML = 'Unavailable';
  badge.style.cssText = [
    'position:absolute',
    'bottom:0','left:0','right:0',
    'background:rgba(18,18,18,0.72)',
    'color:#e2c97e',
    'font-size:.6rem',
    'letter-spacing:.18em',
    'text-transform:uppercase',
    'text-align:center',
    'padding:.32rem 0',
    'font-family:Montserrat,sans-serif',
    'font-weight:600',
    'pointer-events:none',
    'z-index:4',
    'backdrop-filter:blur(2px)',
  ].join(';');
  card.appendChild(badge);
  // Dim the image slightly
  const img = card.querySelector('.card-img');
  if (img) img.style.cssText += ';filter:grayscale(35%) brightness(0.85)';
  // Disable add-to-cart button but still allow viewing
  const addBtn = card.querySelector('.card-cta, [data-action="add"], .add-btn');
  if (addBtn) { addBtn.style.opacity = '.45'; addBtn.style.pointerEvents = 'none'; }
}

// ── INIT — run pagination on first load ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAllCards();  // inject all product cards from PRODUCTS array
  buildNewArrivals(); // show new arrivals immediately (before overrides load)
  buildNewHot();      // new-in-catalog, order-only carousel
  renderShopPage();
  // Apply stock overlays after cards are rendered (stock fetch may resolve later)
  if (window.__STOCK__) applyStockOverlays(window.__STOCK__);
  // Deep-link: lagosworld.app/jewelry#12345678 opens that product modal
  const hash = window.location.hash.replace('#','');
  if (hash && /^\d+$/.test(hash)) {
    const pid = parseInt(hash, 10);
    if (PRODUCTS.find(p => p.id === pid)) setTimeout(() => openModal(pid), 300);
  }
});
