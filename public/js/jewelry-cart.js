// ── Cart ──────────────────────────────────────────────────────────────────────
const LS_CART_EVENTS='lj_cart_events';

function addToCart(prod,v){
  const key=prod.id+'_'+v.id;
  const ex=cart.find(i=>i.key===key);
  const cartImg=(imgsOv[prod.id]&&imgsOv[prod.id].length?imgsOv[prod.id]:prod.imgs)[0]||'';
  if(ex)ex.qty++;else cart.push({key,prod,v,qty:1,img:cartImg});
  showToast('✝ '+prod.name+' added!');
  requestAnimationFrame(()=>{
    updateCart();
    const idleFn=()=>trackCartEvent('add',{product:prod.name,variant:v.desc||''});
    if(typeof requestIdleCallback!=='undefined')requestIdleCallback(idleFn,{timeout:2000});
    else setTimeout(idleFn,0);
  });
}

function rmFromCart(key){cart=cart.filter(i=>i.key!==key);updateCart()}

function clearCart(){cart=[];requestAnimationFrame(()=>updateCart())}

function updateCart(){
  const cnt=cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById('cart-badge').textContent=cnt;
  const total=cart.reduce((s,i)=>s+(i.v.price*i.qty),0);
  document.getElementById('cart-total').textContent='$'+total.toFixed(2);
  document.getElementById('co-open-btn').disabled=cart.length===0;
  const pct=Math.min(100,(total/200)*100);
  document.getElementById('ship-bar').style.width=pct+'%';
  const msgEl=document.getElementById('ship-msg');
  if(total>=200){msgEl.innerHTML='🎉 Congrats! FREE SHIPPING on your order!';msgEl.classList.add('free')}
  else{const need=200-total;msgEl.innerHTML=`Add <strong>$${need.toFixed(2)}</strong> more for FREE shipping!`;msgEl.classList.remove('free');const slEl=document.getElementById('ship-left');if(slEl)slEl.textContent=need.toFixed(2);}
  const cb=document.getElementById('cart-body');
  if(!cart.length){cb.innerHTML='<div class="cart-empty"><div class="cart-empty-ico">🛒</div><p>Your cart is empty</p></div>';return}
  cb.innerHTML=cart.map(i=>`
    <div class="cart-item">
      <img class="ci-img" src="${i.img}" alt="${i.prod.name}">
      <div class="ci-info">
        <div class="ci-name">${i.prod.name}</div>
        <div class="ci-var">${i.v.desc||''} · Qty: ${i.qty}</div>
        <div class="ci-price">$${(i.v.price*i.qty).toFixed(2)}</div>
      </div>
      <button class="ci-rm" onclick="rmFromCart('${i.key}')">✕</button>
    </div>`).join('');
}

function toggleCart(){
  const cartEl=document.getElementById('cart');
  const wasOpen=cartEl.classList.contains('on');
  cartEl.classList.toggle('on');
  document.getElementById('cart-veil').classList.toggle('on');
  document.body.style.overflow=cartEl.classList.contains('on')?'hidden':'';
  if(wasOpen && cart.length>0){
    trackCartEvent('cart_abandon');
  }
}

function trackCartEvent(type,extraData){
  try{
    const total=cart.reduce((s,i)=>s+(i.v.price*i.qty),0);
    const itemList=cart.map(i=>({name:i.prod.name,variant:i.v.desc||'',qty:i.qty,price:i.v.price}));
    const name=(document.getElementById('fn')&&document.getElementById('fn').value.trim())||'';
    const email=(document.getElementById('fe')&&document.getElementById('fe').value.trim())||'';
    const phone=(document.getElementById('fp')&&document.getElementById('fp').value.trim())||'';
    const event={type,name,email,phone,items:itemList,total,timestamp:new Date().toISOString(),...(extraData||{})};
    const events=JSON.parse(localStorage.getItem(LS_CART_EVENTS)||'[]');
    events.unshift(event);
    localStorage.setItem(LS_CART_EVENTS,JSON.stringify(events.slice(0,200)));
    const shouldTrack = email || type==='purchase' || type==='cart_abandon' || type==='add';
    if(shouldTrack){
      fetch('/api/jewelry/cart-events',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(event)
      }).catch(()=>{});
    }
  }catch(e){}
}
