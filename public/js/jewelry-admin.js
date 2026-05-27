// ── Admin Panel ───────────────────────────────────────────────────────────────
let adminUnlocked=false;
let adminToken=sessionStorage.getItem('lj_admin_token')||'';
if(adminToken){adminUnlocked=true;document.getElementById('admin-fab').classList.add('show');}

// Konami-style unlock sequence
const SEQ=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight'];
let seqIdx=0;
document.addEventListener('keydown',e=>{
  if(e.key===SEQ[seqIdx]){seqIdx++;if(seqIdx===SEQ.length){seqIdx=0;unlockAdmin()}}else seqIdx=0;
  if(e.key==='Escape'){requestAnimationFrame(()=>{closeModal();closeCheckout();closeAdmin()})}
});
// Swipe right from left edge to open admin on mobile
let touchStartX=0,touchStartY=0;
document.addEventListener('touchstart',e=>{touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-touchStartX;
  const dy=e.changedTouches[0].clientY-touchStartY;
  if(dx>100&&Math.abs(dy)<50&&touchStartX<50)unlockAdmin();
});

async function unlockAdmin(){
  if(adminUnlocked)return;
  const pw=prompt('🔐 Admin password:');
  if(!pw)return;
  try{
    const r=await fetch('/api/admin/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    const d=await r.json();
    if(r.ok&&d.token){
      adminToken=d.token;
      sessionStorage.setItem('lj_admin_token',adminToken);
      adminUnlocked=true;
      document.getElementById('admin-fab').classList.add('show');
      showToast('✝ Admin mode activated!');
    }else{showToast('⚠ '+(d.error||'Wrong password'));}
  }catch{showToast('⚠ Auth error — check connection');}
}

function openAdmin(){
  if(!adminUnlocked)return;
  document.getElementById('admin-panel').classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>buildAdminTable(),0);
}

function closeAdmin(){
  document.getElementById('admin-tbody').innerHTML='';
  document.getElementById('admin-panel').classList.remove('open');
  document.body.style.overflow='';
}

function adminSearch(q){
  document.querySelectorAll('#admin-tbody tr').forEach(r=>r.style.display=r.dataset.name.includes(q.toLowerCase())?'':'none');
}

function buildAdminTable(){
  const tb=document.getElementById('admin-tbody');tb.innerHTML='';
  PRODUCTS.forEach(p=>{
    const curName = nameOv[p.id] || p.name;
    const curDesc = descOv[p.id] || '';
    const metaRow = document.createElement('tr');
    metaRow.dataset.name = (p.name+' '+p.cat).toLowerCase();
    metaRow.style.cssText = 'background:rgba(201,168,76,.07)';
    metaRow.innerHTML = `<td colspan="2" style="color:var(--gold);font-size:.7rem;letter-spacing:.1em">✦ ${p.sku||p.id}</td>
      <td colspan="2"><input style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(201,168,76,.2);color:#e4ddd0;padding:4px 6px;font-size:.75rem" type="text" placeholder="Product name" value="${curName.replace(/"/g,'&quot;')}" id="an_${p.id}"></td>
      <td colspan="2"><input style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(201,168,76,.2);color:#e4ddd0;padding:4px 6px;font-size:.75rem" type="text" placeholder="Description override" value="${curDesc.replace(/"/g,'&quot;')}" id="ad_${p.id}"></td>
      <td><button class="admin-save" onclick="saveDetails(${p.id})">Save</button></td>`;
    tb.appendChild(metaRow);

    p.variacoes.forEach(v=>{
      const cur=(priceOv[p.id+'_'+v.id]??v.price).toFixed(2);
      const tr=document.createElement('tr');tr.dataset.name=(p.name+' '+p.cat).toLowerCase();
      tr.innerHTML=`<td></td><td style="font-size:.75rem;color:#9a9080">${p.name}</td><td>${p.cat}</td><td>${v.desc||'—'}</td>
        <td style="color:var(--gold);font-weight:700">${cur}</td>
        <td><input class="admin-price-inp" type="number" step="0.01" min="1" value="${cur}" id="ap_${p.id}_${v.id}"></td>
        <td><button class="admin-save" onclick="savePrice(${p.id},${v.id})">Save</button></td>`;
      tb.appendChild(tr);
    });
  });
}

async function savePrice(pid,vid){
  const v=parseFloat(document.getElementById(`ap_${pid}_${vid}`).value);
  if(isNaN(v)||v<1)return showToast('⚠ Invalid price');
  priceOv[pid+'_'+vid]=v;
  localStorage.setItem('lj_prices',JSON.stringify(priceOv));
  const prodKeys=Object.keys(priceOv).filter(k=>k.startsWith(pid+'_'));
  const prodPriceOv={};
  prodKeys.forEach(k=>prodPriceOv[k]=priceOv[k]);
  try{
    const r=await fetch(`/api/jewelry/overrides/${pid}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+adminToken},
      body:JSON.stringify({price_overrides:prodPriceOv})
    });
    if(r.ok)showToast('✝ Price synced for all users: $'+v.toFixed(2));
    else showToast('⚠ Saved locally — API sync failed');
  }catch{showToast('⚠ Saved locally — offline');}
  buildAdminTable();
}

async function saveDetails(pid){
  const nameEl=document.getElementById('an_'+pid);
  const descEl=document.getElementById('ad_'+pid);
  if(!nameEl)return;
  const name=nameEl.value.trim();
  const desc=descEl?descEl.value.trim():'';
  nameOv[pid]=name;
  descOv[pid]=desc;
  localStorage.setItem('lj_names',JSON.stringify(nameOv));
  localStorage.setItem('lj_desc', JSON.stringify(descOv));
  document.querySelectorAll('.card').forEach(card=>{
    const btn=card.querySelector('[onclick*="openModal"]');
    if(!btn)return;
    const m=(btn.getAttribute('onclick')||'').match(/\d+/);
    if(m&&Number(m[0])===pid){
      const el=card.querySelector('.card-name');
      if(el&&name)el.textContent=name;
    }
  });
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

function exportPrices(){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(priceOv,null,2)],{type:'application/json'}));
  a.download='lagos_prices.json';a.click();
}
