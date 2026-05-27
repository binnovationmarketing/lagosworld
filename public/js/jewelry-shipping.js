// ── ZIP Lookup & Shipping ─────────────────────────────────────────────────────
async function lookupZip(zip){
  if(!/^\d{5}$/.test(zip))return;
  const fcEl=document.getElementById('fc');
  const fstEl=document.getElementById('fst');
  const zipEl=document.getElementById('fz');
  fcEl.placeholder='Buscando...';
  fcEl.style.opacity='.5';
  zipEl.style.borderColor='rgba(201,168,76,.5)';
  try{
    const r=await fetch(`https://api.zippopotam.us/us/${zip}`);
    if(!r.ok)throw new Error('ZIP not found');
    const d=await r.json();
    const city=d.places[0]['place name'];
    const state=d.places[0]['state abbreviation'];
    fcEl.value=city;
    fstEl.value=state;
    fcEl.style.opacity='';
    fcEl.placeholder='Philadelphia';
    zipEl.style.borderColor='rgba(201,168,76,.6)';
    calcShipping(zip,city,state);
  }catch(e){
    fcEl.style.opacity='';
    fcEl.placeholder='City (enter manually)';
    fstEl.placeholder='ST';
    zipEl.style.borderColor='rgba(220,80,80,.4)';
    document.getElementById('zip-result').classList.remove('show');
    showToast('⚠ ZIP not found — enter city & state manually');
  }
}

function calcShipping(destZip,city,state){
  const total=cart.reduce((s,i)=>s+(i.v.price*i.qty),0);
  const opts=[];
  if(total>=200){
    opts.push({id:'free_ship',name:'🎉 FREE Shipping — UPS Ground',price:0,eta:'3-5 Business Days',note:'Free on orders over $200'});
  } else {
    const orig=parseInt(ORIGIN_ZIP.substring(0,3));
    const dest=parseInt(destZip.substring(0,3));
    const diff=Math.abs(orig-dest);
    const sameState=state==='PA'||state==='NJ'||state==='DE'||state==='MD';
    if(sameState&&diff<20){
      opts.push({id:'local',name:'⚡ Same Day — Cash Delivery',price:total<200?10:0,eta:'4 Hours',note:'Philadelphia metro area · Cash on delivery'});
      opts.push({id:'outside',name:'🚗 Outside City — Cash Delivery',price:total<200?20:0,eta:'6 Hours',note:'PA & nearby areas · Cash on delivery'});
      opts.push({id:'ups_ground_local',name:'📦 UPS Ground',price:12.99,eta:'1-2 Business Days',note:'Tracked shipping'});
    } else if(diff<50){
      opts.push({id:'ups_ground_1',name:'📦 UPS Ground',price:14.99,eta:'2-3 Business Days',note:'Tracked'});
      opts.push({id:'ups_3day',name:'✈ UPS 3-Day Select',price:24.99,eta:'3 Business Days',note:'Guaranteed'});
    } else if(diff<150){
      opts.push({id:'ups_ground_2',name:'📦 UPS Ground',price:17.99,eta:'3-4 Business Days',note:'Tracked'});
      opts.push({id:'ups_2day',name:'✈ UPS 2nd Day Air',price:34.99,eta:'2 Business Days',note:'Air shipping'});
    } else {
      opts.push({id:'ups_ground_3',name:'📦 UPS Ground',price:22.99,eta:'4-5 Business Days',note:'Tracked'});
      opts.push({id:'ups_2day',name:'✈ UPS 2nd Day Air',price:44.99,eta:'2 Business Days',note:'Air shipping'});
    }
  }
  selShipping=null;
  const container=document.getElementById('ship-options');
  container.innerHTML=opts.map((o,idx)=>`
    <div class="ship-opt${idx===0?' sel':''}" onclick="selectShipping(${JSON.stringify(o).replace(/"/g,"'")},this)" data-id="${o.id}">
      <div>
        <div class="ship-name">${o.name}</div>
        <div class="ship-eta">${o.eta} · ${o.note}</div>
      </div>
      <div class="ship-price">${o.price===0?'FREE':'$'+o.price.toFixed(2)}</div>
    </div>`).join('');
  selectShipping(opts[0]);
  document.getElementById('zip-result').classList.add('show');
  updateCheckoutSummary();
}

function selectShipping(opt, btnEl){
  selShipping=typeof opt==='string'?JSON.parse(opt.replace(/'/g,'"')):opt;
  document.querySelectorAll('.ship-opt').forEach(b=>b.classList.remove('sel'));
  if(btnEl)btnEl.classList.add('sel');
  updateCheckoutSummary();
}
