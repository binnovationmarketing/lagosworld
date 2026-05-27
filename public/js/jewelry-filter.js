// ── Filter, Search & Pagination ──────────────────────────────────────────────
let shopPageSize=20;
let shopPage=1;
let _matchedCards=[];
let _cardCache=null; // cached once — all .card elements (static DOM)

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

function doSearch(q){curSearch=q.toLowerCase().trim();shopPage=1;applyFilters()}

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
    (!curSearch||c.dataset.name.includes(curSearch)||c.dataset.cat.toLowerCase().includes(curSearch))
  );
  const total=_matchedCards.length;
  const totalPages=Math.ceil(total/shopPageSize)||1;
  shopPage=Math.max(1,Math.min(shopPage,totalPages));
  const start=(shopPage-1)*shopPageSize;
  const pageSet=new Set(_matchedCards.slice(start,start+shopPageSize));
  // rAF 1: card show/hide (single layout pass — yields to browser paint first)
  requestAnimationFrame(()=>{
    cards.forEach(c=>c.classList.toggle('hidden',!pageSet.has(c)));
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
