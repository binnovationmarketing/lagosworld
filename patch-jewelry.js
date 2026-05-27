#!/usr/bin/env node
// Patch script — applies JS changes to public/jewelry/index.html
// Run: node patch-jewelry.js

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

// ── 1. Add nameOv variable after videoOv ─────────────────────────────────────
replace(
  'Add nameOv variable',
  `let videoOv = JSON.parse(localStorage.getItem('lj_videos')||'{}');`,
  `let videoOv = JSON.parse(localStorage.getItem('lj_videos')||'{}');
let nameOv  = JSON.parse(localStorage.getItem('lj_names') ||'{}');`
);

// ── 2. Extend syncOverrides to handle names, sale badges, HOT deals ──────────
replace(
  'syncOverrides — patch Supabase row parsing to include names',
  `      if (row.description !== null && row.description !== undefined) descOv[pid] = row.description;
      if (Array.isArray(row.images) && row.images.length) imgsOv[pid] = row.images;
      if (row.video_url) videoOv[pid] = row.video_url;`,
  `      if (row.description !== null && row.description !== undefined) descOv[pid] = row.description;
      if (Array.isArray(row.images) && row.images.length) imgsOv[pid] = row.images;
      if (row.video_url) videoOv[pid] = row.video_url;
      if (row.name !== null && row.name !== undefined) nameOv[pid] = row.name;`
);

replace(
  'syncOverrides — save nameOv to localStorage',
  `    localStorage.setItem('lj_videos', JSON.stringify(videoOv));`,
  `    localStorage.setItem('lj_videos', JSON.stringify(videoOv));
    localStorage.setItem('lj_names',  JSON.stringify(nameOv));`
);

// ── 3. After card thumbnail + price patching, add name + sale badge logic ────
replace(
  'syncOverrides — add name + sale badge patching after price update',
  `      // Update card price display
      const prod = PRODUCTS.find(p => p.id === pid);
      if (prod) {
        const varPrices = prod.variacoes.map(v => priceOv[pid+'_'+v.id] ?? v.price);
        const minPrice = Math.min(...varPrices);
        const maxPrice = Math.max(...varPrices);
        const priceEl = card.querySelector('.price-val');
        if (priceEl) {
          priceEl.textContent = minPrice === maxPrice
            ? \`$\${minPrice.toFixed(2)}\`
            : \`$\${minPrice.toFixed(2)} – $\${maxPrice.toFixed(2)}\`;
        }
      }`,
  `      // Update card name if admin set custom name
      if (nameOv[pid]) {
        const nameEl = card.querySelector('.card-name');
        if (nameEl) nameEl.textContent = nameOv[pid];
      }

      // Update card price display + sale badge
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
            ? \`$\${minPrice.toFixed(2)}\`
            : \`$\${minPrice.toFixed(2)} – $\${maxPrice.toFixed(2)}\`;
        }
        // Sale badge: show strikethrough + discount % when price was reduced
        if (minPrice < origMinPrice) {
          const pct = Math.round((1 - minPrice / origMinPrice) * 100);
          let badge = card.querySelector('.sale-badge');
          if (!badge) {
            badge = document.createElement('div');
            badge.className = 'sale-badge';
            card.style.position = 'relative';
            card.insertBefore(badge, card.firstChild);
          }
          badge.innerHTML = \`-\${pct}%\`;
          const origEl = card.querySelector('.price-orig');
          if (!origEl && priceEl) {
            const s = document.createElement('span');
            s.className = 'price-orig';
            s.textContent = \`$\${origMinPrice.toFixed(2)}\`;
            priceEl.insertAdjacentElement('afterend', s);
          }
        }
      }`
);

// ── 4. Call buildHotDeals() at end of syncOverrides (after DOM patching) ──────
replace(
  'syncOverrides — call buildHotDeals at end',
  `  } catch(e) { /* silent fallback to localStorage */ }
})();`,
  `    buildHotDeals();
  } catch(e) { /* silent fallback to localStorage */ }
})();`
);

// ── 5. Add HOT Deals + hotPrev/hotNext functions after exportPrices() ─────────
replace(
  'Add buildHotDeals, hotPrev, hotNext functions',
  `// ── SCROLL ANIMATIONS ──`,
  `// ── HOT DEALS CAROUSEL ──────────────────────────────────────────────────────
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
    return \`<div class="hot-card" onclick="openModal(\${p.id})">
      <div class="hot-badge">-\${pct}%</div>
      <img src="\${img}" alt="\${name}" loading="lazy">
      <div class="hot-info">
        <div class="hot-name">\${name}</div>
        <div class="hot-prices">
          <span class="hot-orig">$\${origMin.toFixed(2)}</span>
          <span class="hot-now">$\${ovMin.toFixed(2)}</span>
        </div>
      </div>
    </div>\`;
  }).join('');
  _hotIdx = 0;
  _hotSlide();
}
function _hotSlide() {
  const track = document.getElementById('hot-track');
  const cards = track.querySelectorAll('.hot-card');
  if (!cards.length) return;
  const w = cards[0].offsetWidth + 16; // gap
  track.style.transform = \`translateX(-\${_hotIdx * w}px)\`;
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

// ── SCROLL ANIMATIONS ──`
);

// ── 6. Fix INP — defer buildAdminTable in openAdmin ──────────────────────────
replace(
  'INP fix — defer buildAdminTable',
  `function openAdmin(){
  if(!adminUnlocked)return;
  buildAdminTable();
  document.getElementById('admin-panel').classList.add('open');`,
  `function openAdmin(){
  if(!adminUnlocked)return;
  document.getElementById('admin-panel').classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>buildAdminTable(),0);`
);

// Remove duplicate overflow line that was right after the old buildAdminTable call
replace(
  'Remove duplicate overflow line',
  `  document.getElementById('admin-panel').classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>buildAdminTable(),0);
  document.body.style.overflow='hidden';`,
  `  document.getElementById('admin-panel').classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>buildAdminTable(),0);`
);

// ── 7. Extend buildAdminTable to add Name + Description fields ────────────────
replace(
  'buildAdminTable — add name+desc fields',
  `  PRODUCTS.forEach(p=>{
    p.variacoes.forEach(v=>{
      const cur=(priceOv[p.id+'_'+v.id]??v.price).toFixed(2);
      const tr=document.createElement('tr');tr.dataset.name=(p.name+' '+p.cat).toLowerCase();
      tr.innerHTML=\`<td>\${p.sku||'—'}</td><td>\${p.name}</td><td>\${p.cat}</td><td>\${v.desc||'—'}</td>
        <td style="color:var(--gold);font-weight:700">$\${cur}</td>
        <td><input class="admin-price-inp" type="number" step="0.01" min="1" value="\${cur}" id="ap_\${p.id}_\${v.id}"></td>
        <td><button class="admin-save" onclick="savePrice(\${p.id},\${v.id})">Save</button></td>\`;
      tb.appendChild(tr);
    });
  });`,
  `  PRODUCTS.forEach(p=>{
    // Name + Description row (once per product, before variant rows)
    const curName = nameOv[p.id] || p.name;
    const curDesc = descOv[p.id] || '';
    const metaRow = document.createElement('tr');
    metaRow.dataset.name = (p.name+' '+p.cat).toLowerCase();
    metaRow.style.cssText = 'background:rgba(201,168,76,.07)';
    metaRow.innerHTML = \`<td colspan="2" style="color:var(--gold);font-size:.7rem;letter-spacing:.1em">✦ \${p.sku||p.id}</td>
      <td colspan="2"><input style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(201,168,76,.2);color:#e4ddd0;padding:4px 6px;font-size:.75rem" type="text" placeholder="Product name" value="\${curName.replace(/"/g,'&quot;')}" id="an_\${p.id}"></td>
      <td colspan="2"><input style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(201,168,76,.2);color:#e4ddd0;padding:4px 6px;font-size:.75rem" type="text" placeholder="Description override" value="\${curDesc.replace(/"/g,'&quot;')}" id="ad_\${p.id}"></td>
      <td><button class="admin-save" onclick="saveDetails(\${p.id})">Save</button></td>\`;
    tb.appendChild(metaRow);

    p.variacoes.forEach(v=>{
      const cur=(priceOv[p.id+'_'+v.id]??v.price).toFixed(2);
      const tr=document.createElement('tr');tr.dataset.name=(p.name+' '+p.cat).toLowerCase();
      tr.innerHTML=\`<td></td><td style="font-size:.75rem;color:#9a9080">\${p.name}</td><td>\${p.cat}</td><td>\${v.desc||'—'}</td>
        <td style="color:var(--gold);font-weight:700">$\${cur}</td>
        <td><input class="admin-price-inp" type="number" step="0.01" min="1" value="\${cur}" id="ap_\${p.id}_\${v.id}"></td>
        <td><button class="admin-save" onclick="savePrice(\${p.id},\${v.id})">Save</button></td>\`;
      tb.appendChild(tr);
    });
  });`
);

// ── 8. Add saveDetails() function after savePrice() ──────────────────────────
replace(
  'Add saveDetails function',
  `function exportPrices(){`,
  `async function saveDetails(pid){
  const nameEl=document.getElementById('an_'+pid);
  const descEl=document.getElementById('ad_'+pid);
  if(!nameEl)return;
  const name=nameEl.value.trim();
  const desc=descEl?descEl.value.trim():'';
  // Update local
  nameOv[pid]=name;
  descOv[pid]=desc;
  localStorage.setItem('lj_names',JSON.stringify(nameOv));
  localStorage.setItem('lj_desc', JSON.stringify(descOv));
  // Patch visible card name
  document.querySelectorAll('.card').forEach(card=>{
    const btn=card.querySelector('[onclick*="openModal"]');
    if(!btn)return;
    const m=(btn.getAttribute('onclick')||'').match(/\\d+/);
    if(m&&Number(m[0])===pid){
      const el=card.querySelector('.card-name');
      if(el&&name)el.textContent=name;
    }
  });
  // Sync to Supabase
  try{
    const r=await fetch('/api/jewelry/overrides/'+pid,{
      method:'PUT',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+adminToken},
      body:JSON.stringify({name:name||null,description:desc||null})
    });
    if(r.ok)showToast('✝ Name & description saved for all users');
    else showToast('⚠ Saved locally — API sync failed');
  }catch{showToast('⚠ Saved locally — offline');}
}
function exportPrices(){`
);

// Write back
fs.writeFileSync(filePath, html, 'utf8');
console.log(`\n✅ All ${changed} patches applied. File written.`);
