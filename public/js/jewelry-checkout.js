// ── Checkout ──────────────────────────────────────────────────────────────────
function openCheckout(){
  if(!cart.length)return;
  toggleCart();
  requestAnimationFrame(()=>{
    selPayment=null;selDeliveryType=null;selShipping=null;
    document.querySelectorAll('.pay-opt').forEach(b=>b.classList.remove('sel'));
    document.getElementById('info-zelle').classList.remove('on');
    document.getElementById('cash-delivery').classList.remove('on');
    document.getElementById('proof-upload').classList.remove('on');
    document.getElementById('zip-result').classList.remove('show');
    document.getElementById('co-form').style.display='block';
    document.getElementById('co-success').style.display='none';
    updateCheckoutSummary();
    document.getElementById('co-veil').classList.add('open');
    document.body.style.overflow='hidden';
  });
}

function closeCheckout(){document.getElementById('co-veil').classList.remove('open');document.body.style.overflow=''}

function updateCheckoutSummary(){
  const total=cart.reduce((s,i)=>s+(i.v.price*i.qty),0);
  const ship=selShipping?selShipping.price:0;
  const grandTotal=total+ship;
  document.getElementById('co-sum').innerHTML=
    cart.map(i=>`<div class="co-sum-item"><span>${i.prod.name}${i.v.desc?' ('+i.v.desc+')':''} ×${i.qty}</span><span>$${(i.v.price*i.qty).toFixed(2)}</span></div>`).join('')+
    `<div class="co-sum-ship"><span>Shipping ${selShipping?'('+selShipping.name+')':''}</span><span>${ship===0?'<strong style="color:var(--gold)">FREE</strong>':'$'+ship.toFixed(2)}</span></div>`+
    `<div class="co-sum-total"><span>TOTAL</span><span>$${grandTotal.toFixed(2)}</span></div>`;
}

function selPay(type,btn){
  selPayment=type;
  requestAnimationFrame(()=>{
    document.querySelectorAll('.pay-opt').forEach(b=>b.classList.remove('sel'));
    btn.classList.add('sel');
    document.getElementById('info-zelle').classList.toggle('on',type==='zelle');
    document.getElementById('info-pix').classList.toggle('on',type==='pix');
    document.getElementById('proof-upload').classList.toggle('on',type==='zelle'||type==='pix');
    const cdEl=document.getElementById('cash-delivery');
    cdEl.classList.toggle('on',type==='cash');
    if(type==='cash'){
      const total=cart.reduce((s,i)=>s+(i.v.price*i.qty),0);
      document.getElementById('cash-free').style.display=total>=200?'block':'none';
    }
  });
}

function selDelivery(type,btn){
  selDeliveryType=type;
  document.querySelectorAll('.del-opt').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');
  if(type==='local')selShipping={id:'local',name:'Same City (4h)',price:cart.reduce((s,i)=>s+(i.v.price*i.qty),0)>=200?0:10};
  else if(type==='outside')selShipping={id:'outside',name:'Outside City (6h)',price:cart.reduce((s,i)=>s+(i.v.price*i.qty),0)>=200?0:20};
  else selShipping={id:'free',name:'Free Delivery',price:0};
  setTimeout(()=>updateCheckoutSummary(),0);
}

function handleProof(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const prev=document.getElementById('proof-preview');
    prev.src=e.target.result;prev.style.display='block';
  };
  reader.readAsDataURL(file);
}

function toggleEmailConfirm(){
  const email=document.getElementById('fe').value.trim();
  document.getElementById('email-confirm-row').style.display=email?'flex':'none';
}

async function submitOrder(){
  const name=document.getElementById('fn').value.trim();
  const phone=document.getElementById('fp').value.trim();
  const email=document.getElementById('fe').value.trim();
  const address=document.getElementById('fa').value.trim();
  const zip=document.getElementById('fz').value.trim();
  const city=document.getElementById('fc').value.trim();
  const state=document.getElementById('fst').value.trim();
  if(!name){showToast('⚠ Enter your name');return}
  if(!phone){showToast('⚠ Enter your phone');return}
  if(!email){showToast('⚠ Enter your email');return}
  if(!selPayment){showToast('⚠ Select payment method');return}
  if(selPayment==='cash'&&!selDeliveryType){showToast('⚠ Select delivery type');return}
  const total=cart.reduce((s,i)=>s+(i.v.price*i.qty),0);
  const ship=selShipping?selShipping.price:0;
  const grandTotal=total+ship;
  document.getElementById('submit-btn').disabled=true;
  document.getElementById('submit-btn').textContent='Sending...';
  const payTxt=selPayment==='zelle'?'Zelle: +1 (215) 626-2345 | Dayane Lago':selPayment==='pix'?'Pix/TED Brasil | Chave: admin.lagosworld@gmail.com':' Cash on Delivery';
  const delivTxt=selPayment==='cash'?(selDeliveryType==='local'?'Same City (4h) — $10':'Outside City (6h) — $20'):(selShipping?selShipping.name:'UPS Ground');
  const itemLines=cart.map(i=>{
    const sku=i.prod.sku?` [${i.prod.sku}]`:'';
    const variant=i.v.desc?` (${i.v.desc})`:'';
    return `• ${i.prod.name}${sku}${variant} x${i.qty} = $${(i.v.price*i.qty).toFixed(2)}`;
  }).join('\n');
  const waMsgRaw=[
    '*LAGOS JEWELRY*',
    '(215) 626-2345 | admin.lagosworld@gmail.com',
    '',
    '*PEDIDO CONFIRMADO*',
    '--------------------',
    '',
    '*CLIENTE*',
    `Nome: ${name}`,
    `Telefone: ${phone}`,
    `Email: ${email}`,
    '',
    '*ENDERECO*',
    [address,city,state,zip].filter(Boolean).join(', '),
    '',
    '*ITENS*',
    itemLines,
    '',
    '--------------------',
    `*Entrega:* ${delivTxt}`,
    `*Frete:* ${ship===0?'GRATIS':'$'+ship.toFixed(2)}`,
    `*TOTAL: $${grandTotal.toFixed(2)}*`,
    `*Pagamento:* ${payTxt}`,
    '',
    `*Obs:* ${document.getElementById('fobs').value||'—'}`,
    '',
    '--------------------',
    'Atenciosamente,',
    'Dayane Lago',
    'Founder | Lagos World',
    '"She is clothed with strength and dignity" -- Prov 31:25'
  ].join('\n');
  const waMsg=encodeURIComponent(waMsgRaw);
  const proofFile=document.getElementById('proof-file');
  let zelleProof=null;
  if(proofFile.files[0]){
    zelleProof=await new Promise(res=>{const fr=new FileReader();fr.onload=e=>res(e.target.result);fr.readAsDataURL(proofFile.files[0])});
  }
  const sendEmailCb=document.getElementById('send-email-cb');
  const wantsEmail=!sendEmailCb||sendEmailCb.checked;
  try{
    await fetch('/api/jewelry/orders',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name,phone,email:wantsEmail?email:null,address,zip,city,state,
        payment:selPayment,deliveryType:selDeliveryType,
        items:cart.map(i=>({name:i.prod.name,sku:i.prod.sku||'',variant:i.v.desc,qty:i.qty,price:i.v.price})),
        total:grandTotal,shipping:ship,
        zelle_proof:zelleProof,notes:document.getElementById('fobs').value
      })
    });
  }catch(e){console.warn('Email API unavailable, continuing with WhatsApp')}
  trackCartEvent('purchase',{name,email,phone,address:`${address}, ${city}, ${state} ${zip}`,payment:selPayment,total:grandTotal});
  document.getElementById('co-form').style.display='none';
  document.getElementById('co-success').style.display='block';
  document.getElementById('suc-name').textContent=name;
  document.getElementById('suc-pay-info').innerHTML=selPayment==='zelle'
    ?'💸 Send via Zelle to: <strong>+12156262345 — Dayane Lago</strong>'
    :selPayment==='pix'
    ?'🇧🇷 Pix/TED: chave <strong>admin.lagosworld@gmail.com</strong> — Dayane Lago. Envie o comprovante pelo WhatsApp.'
    :'💵 Cash payment on delivery.';
  setTimeout(()=>window.open('https://wa.me/12156262345?text='+waMsg,'_blank'),800);
}
