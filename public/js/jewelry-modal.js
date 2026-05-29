// ── Product Modal ─────────────────────────────────────────────────────────────
let _modalThumbs=[];

function openModal(id){
  const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
  modalProd=p;modalImgIdx=0;selVar=null;
  const vars=getVars(p);
  // Apply admin overrides
  const activeImgs=imgsOv[p.id]&&imgsOv[p.id].length?imgsOv[p.id]:p.imgs;
  modalProd._activeImgs=activeImgs;
  document.getElementById('m-img').src=activeImgs[0];
  document.getElementById('m-img').classList.remove('zoomed');
  document.getElementById('m-sku').textContent=p.sku?'SKU: '+p.sku:'';
  document.getElementById('m-name').textContent=p.name;
  document.getElementById('m-cat').textContent='✝ '+p.cat;
  document.getElementById('m-desc').innerHTML=descOv[p.id]!==undefined?descOv[p.id]:(p.descricao||'Semi-jewelry plated in Gold 18k with premium finish and hypoallergenic process. Exclusive design with 1 year warranty from Lagos Jewelry.');
  document.getElementById('m-price').textContent='—';
  document.getElementById('m-add').disabled=true;
  updateModalCounter();
  // Video (if set by admin)
  let vEl=document.getElementById('m-admin-video');
  if(vEl)vEl.remove();
  if(videoOv[p.id]){
    const vWrap=document.createElement('div');vWrap.id='m-admin-video';
    vWrap.style.cssText='margin:1rem 0;';
    const ytM=videoOv[p.id].match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if(ytM){vWrap.innerHTML=`<iframe width="100%" height="200" src="https://www.youtube.com/embed/${ytM[1]}" frameborder="0" allowfullscreen></iframe>`;}
    else{vWrap.innerHTML=`<video src="${videoOv[p.id]}" controls style="width:100%;max-height:200px;display:block" preload="metadata"></video>`;}
    const descEl=document.getElementById('m-desc');
    descEl.parentNode.insertBefore(vWrap,descEl.nextSibling);
  }
  // Thumbs — defer to next frame so modal open animation isn't blocked
  const th=document.getElementById('m-thumbs');th.innerHTML='';
  _modalThumbs=[];
  requestAnimationFrame(()=>{
    activeImgs.forEach((img,i)=>{
      const im=document.createElement('img');im.className='modal-thumb'+(i===0?' on':'');
      im.src=img;im.loading='lazy';im.decoding='async';
      im.onclick=()=>setModalImg(i);
      th.appendChild(im);
      _modalThumbs.push(im);
    });
  });
  // Variants
  const vd=document.getElementById('m-vars');vd.innerHTML='';
  vars.forEach(v=>{
    const b=document.createElement('button');b.className='var-btn';
    b.textContent=(v.desc||'Option')+' — $'+v.price.toFixed(2);
    b.onclick=()=>{
      vd.querySelectorAll('.var-btn').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');selVar=v;
      let ph='$'+v.price.toFixed(2);
      if(v.original>v.price)ph+=' <span style="font-size:.9rem;text-decoration:line-through;color:var(--dim);font-family:Montserrat">$'+v.original.toFixed(2)+'</span>';
      document.getElementById('m-price').innerHTML=ph;
      document.getElementById('m-add').disabled=false;
    };
    vd.appendChild(b);
  });
  if(vars.length===1)vd.querySelector('.var-btn').click();
  document.getElementById('modal-bg').classList.add('open');
  document.body.style.overflow='hidden';
  if(typeof _modalOpen!=='undefined')_modalOpen=true;
}

function setModalImg(i){
  if(!modalProd)return;
  modalImgIdx=i;
  const imgs=modalProd._activeImgs||modalProd.imgs;
  updateModalCounter();
  requestAnimationFrame(()=>{
    document.getElementById('m-img').src=imgs[i];
    document.getElementById('m-img').classList.remove('zoomed');
    (_modalThumbs.length?_modalThumbs:Array.from(document.querySelectorAll('.modal-thumb')))
      .forEach((t,idx)=>t.classList.toggle('on',idx===i));
  });
}

function updateModalCounter(){
  if(!modalProd)return;
  const _imgs=modalProd._activeImgs||modalProd.imgs;
  document.getElementById('m-counter').textContent=(modalImgIdx+1)+' / '+_imgs.length;
}

function modalPrev(){if(modalProd){const imgs=modalProd._activeImgs||modalProd.imgs;setModalImg((modalImgIdx-1+imgs.length)%imgs.length)}}
function modalNext(){if(modalProd){const imgs=modalProd._activeImgs||modalProd.imgs;setModalImg((modalImgIdx+1)%imgs.length)}}

function closeModal(){document.getElementById('modal-bg').classList.remove('open');document.body.style.overflow='';if(typeof _modalOpen!=='undefined')_modalOpen=false;}

function addFromModal(){
  if(!modalProd||!selVar)return;
  const v=getVars(modalProd).find(x=>x.id===selVar.id)||selVar;
  const p=modalProd;
  closeModal();
  requestAnimationFrame(()=>addToCart(p,v));
}
