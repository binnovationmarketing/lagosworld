// ── Filter, Search & Pagination ──────────────────────────────────────────────
let shopPageSize=20;
let shopPage=1;
let _matchedCards=[];
let _cardCache=null; // cached after renderAllCards()
let _visibleCards=new Set(); // track current visible cards — only toggle delta
let _searchTimer=null; // debounce timer for search

// ── Render all product cards into #grid (replaces static HTML) ───────────────
function renderAllCards(){
  const grid = document.getElementById('grid');
  if (!grid) return;
  const CAT_ICONS = {
    'BRINCOS':'💎','ANÉIS':'💍','COLARES':'📿',
    'PULSEIRAS E BRACELETES':'✨','CONJUNTOS':'👑',
    'PINGENTES':'🔮','ACESSÓRIOS':'🌟','AÇO':'⚡','OUTROS':'✦'
  };
  _visibleCards=new Set(); // reset on re-render
  grid.innerHTML = PRODUCTS.map((p, idx) => {
    const imgCount = p.imgs ? p.imgs.length : 1;
    const price = p.minPrice === p.maxPrice
      ? `$${p.minPrice.toFixed(2)}`
      : `$${p.minPrice.toFixed(2)} – $${p.maxPrice.toFixed(2)}`;
    const loading = idx < 20 ? 'eager' : 'lazy';
    const fetchprio = idx < 3 ? ' fetchpriority="high"' : '';
    return `<div class="card hidden" data-cat="${p.cat}" data-name="${(p.name||'').toLowerCase()}" data-sku="${(p.sku||'').toLowerCase()}" style="animation-delay:${(idx%20)*50}ms">
  <div class="card-imgs">
    <img class="card-img" src="${p.img}" alt="${p.name}" loading="${loading}"${fetchprio}>
    <img class="card-img-b" src="${p.img2||p.img}" alt="${p.name}" loading="lazy">
    <div class="card-overlay"></div>
    <div class="zoom-hint">🔍</div>
    <div class="img-count">📷 ${imgCount} foto${imgCount>1?'s':''}</div>
    <div class="card-action">
      <button class="quick-add" onclick="event.stopPropagation();requestAnimationFrame(()=>openModal(${p.id}))">
        <span>✦</span><span>View Details</span>
      </button>
    </div>
  </div>
  <div class="card-info" onclick="requestAnimationFrame(()=>openModal(${p.id}))">
    <div class="card-sku">${p.sku||''}</div>
    <div class="card-name">${p.name}</div>
    <div class="card-cat">${p.cat}</div>
    <div class="card-price"><span class="price-val">${p.minPrice>0?price:'—'}</span></div>
  </div>
</div>`;
  }).join('');
  _cardCache = null; // reset so renderShopPage re-queries
  renderCatFilters();
}

// ── Render category filter buttons with live counts ───────────────────────────
function renderCatFilters(){
  const wrap = document.getElementById('cat-filters');
  if (!wrap) return;
  const CAT_ICONS = {
    'BRINCOS':'💎','ANÉIS':'💍','COLARES':'📿',
    'PULSEIRAS E BRACELETES':'✨','CONJUNTOS':'👑',
    'PINGENTES':'🔮','ACESSÓRIOS':'🌟','AÇO':'⚡'
  };
  const counts = {};
  PRODUCTS.forEach(p => { counts[p.cat] = (counts[p.cat]||0) + 1; });
  const total = PRODUCTS.length;
  const cats = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  wrap.innerHTML =
    `<button class="fp${curCat==='ALL'?' active':''}" onclick="filterCat('ALL',this)"><span>✦ All (${total})</span></button>` +
    cats.map(([cat, n]) => {
      const icon = CAT_ICONS[cat] || '✦';
      return `<button class="fp${curCat===cat?' active':''}" onclick="filterCat('${cat}',this)"><span>${icon} ${cat} (${n})</span></button>`;
    }).join('');
}

function filterCat(cat,btn){
  curCat=cat;shopPage=1;
  // Frame 1: paint the active button state immediately
  requestAnimationFrame(()=>{
    document.querySelectorAll('.nav-cat,.fp').forEach(b=>b.classList.remove('active'));
    if(btn)btn.classList.add('active');
    // Frame 2: run heavy filter + pagination after active state is painted
    requestAnimationFrame(()=>{
      applyFilters();
      if(window.scrollY>200)document.getElementById('catalog').scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
}

// Debounced — called from passive input listener in jewelry-init.js
function doSearch(q){
  clearTimeout(_searchTimer);
  _searchTimer=setTimeout(()=>{curSearch=q.toLowerCase().trim();shopPage=1;applyFilters();},180);
}

function applyFilters(){
  shopPage=1;
  renderShopPage();
}

function renderShopPage(){
  // Cache cards once (DOM is static — no cards are added/removed)
  if(!_cardCache)_cardCache=Array.from(document.querySelectorAll('.card'));
  const cards=_cardCache;
  _matchedCards=cards.filter(c=>
    (curCat==='ALL'||c.dataset.cat===curCat)&&
    (!curSearch||c.dataset.name.includes(curSearch)||c.dataset.cat.toLowerCase().includes(curSearch)||c.dataset.sku.includes(curSearch))
  );
  const total=_matchedCards.length;
  const totalPages=Math.ceil(total/shopPageSize)||1;
  shopPage=Math.max(1,Math.min(shopPage,totalPages));
  const start=(shopPage-1)*shopPageSize;
  const pageSet=new Set(_matchedCards.slice(start,start+shopPageSize));
  // rAF 1: card show/hide — delta only (hide old visible, show new page)
  // Max 40 DOM touches (20 old + 20 new) instead of 588
  requestAnimationFrame(()=>{
    for(const c of _visibleCards){if(!pageSet.has(c))c.classList.add('hidden');}
    for(const c of pageSet){c.classList.remove('hidden');}
    _visibleCards=new Set(pageSet);
    document.getElementById('res-n').textContent=total;
    // rAF 2: pagination HTML (deferred so nav-cat click paints instantly → fixes INP)
    requestAnimationFrame(()=>renderShopPagination(total,totalPages));
  });
}

function renderShopPagination(total,totalPages){
  const wrap=document.getElementById('shop-pagination');
  if(!wrap)return;
  if(totalPages<=1){wrap.innerHTML='';return;}
  const start=(shopPage-1)*shopPageSize+1;
  const end=Math.min(shopPage*shopPageSize,total);
  let btns='';
  for(let i=1;i<=totalPages;i++){
    if(i===1||i===totalPages||Math.abs(i-shopPage)<=2){
      btns+=`<button onclick="shopGoPage(${i})" style="width:36px;height:36px;border:1px solid ${i===shopPage?'#c9a84c':'rgba(201,168,76,.25)'};background:${i===shopPage?'#c9a84c':'transparent'};color:${i===shopPage?'#0a0a0a':'#c9a84c'};font-family:'Montserrat',sans-serif;font-size:.72rem;cursor:pointer;transition:all .15s;font-weight:${i===shopPage?'700':'400'}">${i}</button>`;
    }else if(Math.abs(i-shopPage)===3){
      btns+=`<span style="color:rgba(201,168,76,.4);padding:0 .3rem">…</span>`;
    }
  }
  wrap.innerHTML=`
    <div style="display:inline-flex;flex-direction:column;align-items:center;gap:1rem">
      <div style="display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap;justify-content:center">
        <p style="font-size:.7rem;color:rgba(201,168,76,.6);letter-spacing:.15em;font-family:'Montserrat',sans-serif">
          Showing <strong style="color:#c9a84c">${start}–${end}</strong> of <strong style="color:#c9a84c">${total}</strong> pieces
        </p>
        <div style="display:flex;align-items:center;gap:.4rem;font-size:.62rem;font-family:'Montserrat',sans-serif;color:rgba(201,168,76,.5);letter-spacing:.1em">
          per page:
          <button onclick="setShopPageSize(20)" style="padding:.2rem .55rem;border:1px solid ${shopPageSize===20?'#c9a84c':'rgba(201,168,76,.25)'};background:${shopPageSize===20?'rgba(201,168,76,.12)':'transparent'};color:${shopPageSize===20?'#c9a84c':'rgba(201,168,76,.5)'};font-family:'Montserrat',sans-serif;font-size:.62rem;cursor:pointer;transition:all .15s;font-weight:${shopPageSize===20?'700':'400'}">20</button>
          <button onclick="setShopPageSize(40)" style="padding:.2rem .55rem;border:1px solid ${shopPageSize===40?'#c9a84c':'rgba(201,168,76,.25)'};background:${shopPageSize===40?'rgba(201,168,76,.12)':'transparent'};color:${shopPageSize===40?'#c9a84c':'rgba(201,168,76,.5)'};font-family:'Montserrat',sans-serif;font-size:.62rem;cursor:pointer;transition:all .15s;font-weight:${shopPageSize===40?'700':'400'}">40</button>
        </div>
      </div>
      <div style="display:flex;gap:.3rem;align-items:center">
        <button onclick="shopGoPage(${shopPage-1})" ${shopPage===1?'disabled':''} style="width:36px;height:36px;border:1px solid rgba(201,168,76,.25);background:transparent;color:#c9a84c;cursor:pointer;font-size:1rem;opacity:${shopPage===1?.3:1}">‹</button>
        ${btns}
        <button onclick="shopGoPage(${shopPage+1})" ${shopPage===totalPages?'disabled':''} style="width:36px;height:36px;border:1px solid rgba(201,168,76,.25);background:transparent;color:#c9a84c;cursor:pointer;font-size:1rem;opacity:${shopPage===totalPages?.3:1}">›</button>
      </div>
    </div>`;
}

function shopGoPage(n){
  const totalPages=Math.ceil(_matchedCards.length/shopPageSize)||1;
  if(n<1||n>totalPages)return;
  shopPage=n;
  renderShopPage();
  document.getElementById('catalog').scrollIntoView({behavior:'smooth',block:'start'});
}

function setShopPageSize(n){
  shopPageSize=n;
  shopPage=1;
  renderShopPage();
}
