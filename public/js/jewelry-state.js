// ── Global State & Utilities — load FIRST ────────────────────────────────────
// PRODUCTS loaded from /js/products-data.js (browser-cached, shared with /admin)
const PRODUCTS = (window.PRODUCTS||[]).map(p=>({
  ...p,
  img:      p.imgs[0]||"",
  img2:     p.imgs[1]||p.imgs[0]||"",
  minPrice: Math.min(...(p.variacoes||[]).map(v=>v.price)),
  maxPrice: Math.max(...(p.variacoes||[]).map(v=>v.price))
}));
const ORIGIN_ZIP = '19103'; // Philadelphia, PA

// Admin override maps — localStorage cache, synced from Supabase on load
let priceOv = JSON.parse(localStorage.getItem('lj_prices')||'{}');
let descOv  = JSON.parse(localStorage.getItem('lj_desc')  ||'{}');
let imgsOv  = JSON.parse(localStorage.getItem('lj_imgs')  ||'{}');
let videoOv = JSON.parse(localStorage.getItem('lj_videos')||'{}');
let nameOv  = JSON.parse(localStorage.getItem('lj_names') ||'{}');

// Cart & UI state
let cart = [];
let curCat = 'ALL', curSearch = '';
let curStockOnly = false; // "Available Now" filter — show only stock>0
let modalProd = null, modalImgIdx = 0, selVar = null;
let selPayment = null;
let selShipping = null;

// Returns variant list with price overrides applied
function getVars(p){
  return p.variacoes.map(v=>{
    const ov=priceOv[p.id+'_'+v.id];
    return{...v,price:ov!==undefined?ov:v.price};
  });
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);
}
