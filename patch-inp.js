#!/usr/bin/env node
// INP fix patch — applies all 5 interaction latency fixes
// Run: node patch-inp.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/jewelry/index.html');
let html = fs.readFileSync(filePath, 'utf8');

let changed = 0;

function replace(label, from, to) {
  if (!html.includes(from)) {
    console.error(`❌ NOT FOUND: ${label}`);
    process.exit(1);
  }
  html = html.replace(from, to);
  console.log(`✅ ${label}`);
  changed++;
}

// ── FIX 1: Cache card list — avoid querySelectorAll('.card') on every filter ──
// Add _cardCache after _matchedCards declaration
replace(
  'Add _cardCache',
  `let _matchedCards=[];`,
  `let _matchedCards=[];
let _cardCache=null; // cached once — all .card elements (static DOM)`
);

// ── FIX 2: filterCat — yield BEFORE expensive renderShopPage ─────────────────
// Active-state paint fires first; renderShopPage runs after browser paints
replace(
  'filterCat: yield with setTimeout before heavy DOM work',
  `function filterCat(cat,btn){
  curCat=cat;shopPage=1;
  document.querySelectorAll('.nav-cat,.fp').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  applyFilters();
  if(window.scrollY>200)document.getElementById('catalog').scrollIntoView({behavior:'smooth',block:'start'});
}`,
  `function filterCat(cat,btn){
  curCat=cat;shopPage=1;
  document.querySelectorAll('.nav-cat,.fp').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  // Yield: browser paints the active-state change first, then runs the heavy filter
  setTimeout(()=>{
    applyFilters();
    if(window.scrollY>200)document.getElementById('catalog').scrollIntoView({behavior:'smooth',block:'start'});
  },0);
}`
);

// ── FIX 3: renderShopPage — use cached cards, batch DOM writes ────────────────
replace(
  'renderShopPage: use cached cards + requestAnimationFrame for DOM mutations',
  `function renderShopPage(){
  const cards=Array.from(document.querySelectorAll('.card'));
  _matchedCards=cards.filter(c=>
    (curCat==='ALL'||c.dataset.cat===curCat)&&
    (!curSearch||c.dataset.name.includes(curSearch)||c.dataset.cat.toLowerCase().includes(curSearch))
  );
  const total=_matchedCards.length;
  const totalPages=Math.ceil(total/SHOP_PAGE_SIZE)||1;
  shopPage=Math.max(1,Math.min(shopPage,totalPages));
  const start=(shopPage-1)*SHOP_PAGE_SIZE;
  const pageSet=new Set(_matchedCards.slice(start,start+SHOP_PAGE_SIZE));
  cards.forEach(c=>c.classList.toggle('hidden',!pageSet.has(c)));
  document.getElementById('res-n').textContent=total;
  renderShopPagination(total,totalPages);
}`,
  `function renderShopPage(){
  // Cache cards once (DOM is static — no cards are added/removed)
  if(!_cardCache)_cardCache=Array.from(document.querySelectorAll('.card'));
  const cards=_cardCache;
  _matchedCards=cards.filter(c=>
    (curCat==='ALL'||c.dataset.cat===curCat)&&
    (!curSearch||c.dataset.name.includes(curSearch)||c.dataset.cat.toLowerCase().includes(curSearch))
  );
  const total=_matchedCards.length;
  const totalPages=Math.ceil(total/SHOP_PAGE_SIZE)||1;
  shopPage=Math.max(1,Math.min(shopPage,totalPages));
  const start=(shopPage-1)*SHOP_PAGE_SIZE;
  const pageSet=new Set(_matchedCards.slice(start,start+SHOP_PAGE_SIZE));
  // Batch all className mutations in one rAF — single layout pass
  requestAnimationFrame(()=>{
    cards.forEach(c=>c.classList.toggle('hidden',!pageSet.has(c)));
  });
  document.getElementById('res-n').textContent=total;
  renderShopPagination(total,totalPages);
}`
);

// ── FIX 4a: openModal — cache modal thumbs in _modalThumbs array ──────────────
replace(
  'openModal: declare _modalThumbs cache',
  `function closeModal(){document.getElementById('modal-bg').classList.remove('open');document.body.style.overflow=''}`,
  `let _modalThumbs=[];
function closeModal(){document.getElementById('modal-bg').classList.remove('open');document.body.style.overflow=''}`
);

replace(
  'openModal: populate _modalThumbs when building thumbs',
  `  const th=document.getElementById('m-thumbs');th.innerHTML='';
  requestAnimationFrame(()=>{
    activeImgs.forEach((img,i)=>{
      const im=document.createElement('img');im.className='modal-thumb'+(i===0?' on':'');
      im.src=img;im.loading='lazy';im.decoding='async';
      im.onclick=()=>setModalImg(i);
      th.appendChild(im);
    });
  });`,
  `  const th=document.getElementById('m-thumbs');th.innerHTML='';
  _modalThumbs=[];
  requestAnimationFrame(()=>{
    activeImgs.forEach((img,i)=>{
      const im=document.createElement('img');im.className='modal-thumb'+(i===0?' on':'');
      im.src=img;im.loading='lazy';im.decoding='async';
      im.onclick=()=>setModalImg(i);
      th.appendChild(im);
      _modalThumbs.push(im);
    });
  });`
);

// ── FIX 4b: setModalImg — use _modalThumbs cache, skip querySelectorAll ───────
replace(
  'setModalImg: use cached _modalThumbs instead of querySelectorAll',
  `function setModalImg(i){
  if(!modalProd)return;
  modalImgIdx=i;
  const imgs=modalProd._activeImgs||modalProd.imgs;
  document.getElementById('m-img').src=imgs[i];
  document.getElementById('m-img').classList.remove('zoomed');
  document.querySelectorAll('.modal-thumb').forEach((t,idx)=>t.classList.toggle('on',idx===i));
  updateModalCounter();
}`,
  `function setModalImg(i){
  if(!modalProd)return;
  modalImgIdx=i;
  const imgs=modalProd._activeImgs||modalProd.imgs;
  // Update counter immediately (zero cost)
  updateModalCounter();
  // Defer src + thumb class updates — avoids blocking paint on every nav press
  requestAnimationFrame(()=>{
    document.getElementById('m-img').src=imgs[i];
    document.getElementById('m-img').classList.remove('zoomed');
    // Use cached array — no DOM query, no forced layout
    (_modalThumbs.length?_modalThumbs:Array.from(document.querySelectorAll('.modal-thumb')))
      .forEach((t,idx)=>t.classList.toggle('on',idx===i));
  });
}`
);

// ── FIX 5: closeAdmin — clear heavy table BEFORE removing open class ──────────
// 500+ rows trigger massive layout recalc when panel becomes visible/hidden.
// Empty the table first → browser repaints a lightweight empty panel.
replace(
  'closeAdmin: clear table before closing to avoid 500-row layout recalc',
  `function closeAdmin(){document.getElementById('admin-panel').classList.remove('open');document.body.style.overflow=''}`,
  `function closeAdmin(){
  document.getElementById('admin-tbody').innerHTML=''; // clear heavy table first
  document.getElementById('admin-panel').classList.remove('open');
  document.body.style.overflow='';
}`
);

// ── FIX 6: selDelivery — yield updateCheckoutSummary (innerHTML rebuild) ──────
replace(
  'selDelivery: yield before summary rebuild',
  `  updateCheckoutSummary();
}

function handleProof(input){`,
  `  setTimeout(()=>updateCheckoutSummary(),0);
}

function handleProof(input){`
);

// Write back
fs.writeFileSync(filePath, html, 'utf8');
console.log(`\n✅ All ${changed} INP patches applied.`);
