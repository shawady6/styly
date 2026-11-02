/* Styly screens: navigation, home, wardrobe, add/edit, mix, saved outfits, weekly plan. */

/* ---------- navigation ---------- */
const TABS=[['home','الرئيسية','home'],['wardrobe','الدولاب','grid'],['mix','تركيب','mix'],['outfits','أطقمي','mark'],['plan','الأسبوع','cal']];
let curTab='home';
TABS.forEach(([k,l,i])=>{const b=$('#t-'+k);b.innerHTML=ic(i)+'<span>'+l+'</span>';b.onclick=()=>tab(k)});
$('#addBtn').innerHTML=ic('plus')+'<span>قطعة</span>';
$('#setBtn').innerHTML=ic('gear');
$('#searchIc').innerHTML=ic('search');
$('#shuffle').innerHTML=ic('spark')+'<span>نسّق لي</span>';
$('#saveOutfit').innerHTML=ic('mark')+'<span>حفظ الطقم</span>';
$('#prevW').innerHTML=ic('r');$('#nextW').innerHTML=ic('l');
function renderCurrent(){
  if(curTab==='home')renderHome();if(curTab==='wardrobe')renderWardrobe();if(curTab==='mix')renderMix();
  if(curTab==='outfits')renderOutfits();if(curTab==='plan')renderPlan();
}
function tab(n){
  curTab=n;
  TABS.forEach(([k])=>{$('#v-'+k).classList.toggle('hide',k!==n);const b=$('#t-'+k);b.classList.toggle('on',k===n);if(k===n)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  $('#addBtn').classList.toggle('show',n==='wardrobe');
  window.scrollTo(0,0);updateDot();renderCurrent();
}
const itemsByType=o=>{const s={};outfitItems(o).forEach(i=>{const k=slotOf(i.type);if(!s[k])s[k]=i});return s};
const scoreCls=n=>n>=75?'g':n>=55?'m':'b';
function emptyState(icon,title,text,btn,id){
  return `<div class="em-ic">${ic(icon)}</div><h3>${title}</h3>`+(text?`<p>${text}</p>`:'')+(btn?`<button class="btn" id="${id}" type="button">${btn}</button>`:'');
}
const miniTile=i=>`<button class="tile" data-id="${i.id}" type="button"><div class="pic">${imgTag(i)}</div><div class="cap"><b>${esc(i.name||'بدون اسم')}</b><i class="dotc" style="background:${i.color}"></i></div></button>`;

/* ---------- home / dashboard ---------- */
function weekPlanned(){
  const days=new Set([...Array(7)].map((_,i)=>{const d=weekStart(0);d.setDate(d.getDate()+i);return iso(d)}));
  return plan.filter(p=>days.has(p.date)&&outfits.some(o=>o.id===p.outfitId)).length;
}
function featuredOutfit(){
  const today=iso(new Date()),p=plan.find(x=>x.date===today),po=p&&outfits.find(o=>o.id===p.outfitId);
  if(po&&outfitItems(po).length)return{o:po,tag:'طقم النهارده'};
  let best=null,bs=-1;
  for(const o of outfits){if(!outfitItems(o).length)continue;const r=outfitScore(itemsByType(o));const s=r?r.score:0;if(s>bs){bs=s;best=o}}
  return best?{o:best,tag:'من أطقمك المحفوظة'}:null;
}
function renderHome(){
  const el=$('#v-home');
  if(!items.length){
    el.innerHTML=`<div class="page"><div class="over">أهلاً بيك في</div><h2 class="h1">دولابك الشخصي</h2></div>
      <div class="empty" style="padding-top:var(--sp-6)">${emptyState('shirt','ابدأ بأول قطعة','صوّر قطعة من دولابك وهنسّقها لك مع باقي هدومك.','إضافة أول قطعة','hAdd')}
      <ol class="steps"><li><i>١</i>صوّر قطعك</li><li><i>٢</i>ركّب أطقم بتناسق ألوان مضبوط</li><li><i>٣</i>وزّعها على أيام الأسبوع</li></ol></div>`;
    $('#hAdd').onclick=()=>newItem();return;
  }
  const f=featuredOutfit(),recent=[...items].reverse().slice(0,8),due=Date.now()-lastBackup()>14*864e5;
  let h=`<div class="page"><div class="over">دولابك</div><h2 class="h1">النهارده تلبس إيه؟</h2>
    <div class="stats"><div class="stat"><b>${items.length}</b><span>قطعة</span></div><div class="stat"><b>${outfits.length}</b><span>طقم</span></div><div class="stat"><b>${weekPlanned()}/7</b><span>أيام مخططة</span></div></div>`;
  h+=`<div class="sec"><div class="sec-h"><h2>${f?f.tag:'طقم مميز'}</h2></div>`;
  if(f){
    const r=outfitScore(itemsByType(f.o));
    h+=`<button class="feat" id="hFeat" type="button"><div class="feat-h"><b>${esc(f.o.name||'طقم بدون اسم')}</b>${r?`<span class="pill ${scoreCls(r.score)}">${r.score}%</span>`:''}</div><div class="ims">${outfitItems(f.o).map(i=>`<div class="pic">${imgTag(i)}</div>`).join('')}</div></button>`;
  }else{
    h+=`<div class="note">${ic('spark')}<div>لسه معندكش أطقم محفوظة. ركّب أول طقم من قطعك.<button class="btn sm" id="hMake" type="button">ركّب طقم</button></div></div>`;
  }
  h+=`</div><div class="sec"><div class="sec-h"><h2>آخر القطع</h2><button class="linkbtn" id="hAll" type="button">كل الدولاب</button></div><div class="hscroll">${recent.map(miniTile).join('')}</div></div>
    <div class="sec"><div class="sec-h"><h2>وصول سريع</h2></div><div class="quick">
      <button class="qa" data-go="add" type="button">${ic('plus')}إضافة قطعة</button>
      <button class="qa" data-go="mix" type="button">${ic('mix')}تركيب طقم</button>
      <button class="qa" data-go="outfits" type="button">${ic('mark')}أطقمي</button>
      <button class="qa" data-go="plan" type="button">${ic('cal')}الأسبوع</button></div></div>`;
  if(upd.state==='available')h+=`<div class="sec"><div class="note">${ic('up')}<div>في نسخة جديدة من Styly (${esc(upd.info.version)}).<button class="btn sm" id="hUpd" type="button">حدّث دلوقتي</button></div></div></div>`;
  if(due)h+=`<div class="sec"><div class="note">${ic('bak')}<div>${lastBackup()?'عدّى أكتر من أسبوعين على آخر نسخة احتياطية.':'لسه ماعملتش نسخة احتياطية.'}<button class="btn sm ghost" id="hBk" type="button">افتح الإعدادات</button></div></div></div>`;
  h+='</div>';
  el.innerHTML=h;
  el.querySelectorAll('.tile').forEach(e=>e.onclick=()=>showDetail(+e.dataset.id));
  el.querySelectorAll('.qa').forEach(b=>b.onclick=()=>{const g=b.dataset.go;if(g==='add')newItem();else tab(g)});
  const m=$('#hMake');if(m)m.onclick=()=>tab('mix');
  const a=$('#hAll');if(a)a.onclick=()=>tab('wardrobe');
  const b=$('#hBk');if(b)b.onclick=openSettings;
  const hu=$('#hUpd');if(hu)hu.onclick=openSettings;
  const ft=$('#hFeat');if(ft)ft.onclick=()=>tab(plan.some(p=>p.outfitId===f.o.id&&p.date===iso(new Date()))?'plan':'outfits');
}

/* ---------- wardrobe ---------- */
let wq='',wocc='all';
function renderWardrobe(){
  const cnt=k=>k==='all'?items.length:items.filter(i=>i.type===k).length;
  $('#filters').innerHTML=[['all','الكل'],...Object.entries(TYPES)].map(([k,l])=>`<button data-k="${k}" role="tab" aria-selected="${filter===k}" class="${filter===k?'on':''}">${l}<small>${cnt(k)}</small></button>`).join('');
  $('#filters').querySelectorAll('button').forEach(b=>b.onclick=()=>{filter=b.dataset.k;renderWardrobe()});
  drawChips($('#wOcc'),wocc,k=>{wocc=k;renderWardrobe()});
  const q=wq.trim().toLowerCase();
  const list=items.filter(i=>(filter==='all'||i.type===filter)&&(wocc==='all'||i.occ===wocc)&&(!q||[i.name,iname(i),TYPES[i.type],i.occ,i.season].some(v=>String(v||'').toLowerCase().includes(q)))).slice().reverse();
  $('#grid').innerHTML=list.map(i=>`<button class="tile" data-id="${i.id}" type="button"><div class="pic">${imgTag(i)}</div><div class="cap"><b>${esc(i.name||'بدون اسم')}</b><i class="dotc" style="background:${i.color}"></i></div><div class="sub">${esc(iname(i))} · ${esc(i.occ)}</div></button>`).join('');
  $('#grid').querySelectorAll('.tile').forEach(e=>e.onclick=()=>showDetail(+e.dataset.id));
  const none=!items.length,filtered=items.length&&!list.length;
  const em=$('#empty');
  em.classList.toggle('hide',!(none||filtered));
  if(none){em.innerHTML=emptyState('shirt','الدولاب فاضي','صوّر أول قطعة وهتظهر هنا.','إضافة قطعة','emptyAdd');$('#emptyAdd').onclick=()=>newItem()}
  else if(filtered){em.innerHTML=emptyState('search','مفيش نتايج','جرّب تغيّر البحث أو الفلتر.','مسح الفلاتر','clrF');$('#clrF').onclick=()=>{wq='';wocc='all';filter='all';$('#q').value='';renderWardrobe()}}
  $('#filters').classList.toggle('hide',!items.length);$('#wOcc').classList.toggle('hide',!items.length);document.querySelector('#v-wardrobe .search').classList.toggle('hide',!items.length);
  $('#addBtn').classList.toggle('show',curTab==='wardrobe');
}
$('#q').addEventListener('input',e=>{wq=e.target.value;renderWardrobe()});
$('#addBtn').onclick=()=>newItem();
function drawChips(el,cur,cb){
  el.innerHTML=[['all','كل المناسبات'],...OCCS.map(o=>[o,o])].map(([k,l])=>`<button class="chip ${cur===k?'on':''}" data-k="${k}" type="button" aria-pressed="${cur===k}">${l}</button>`).join('');
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>cb(b.dataset.k));
}
function drawOcc(el,cur,cb){
  el.innerHTML=[['all','الكل'],...OCCS.map(o=>[o,o])].map(([k,l])=>`<button data-k="${k}" role="tab" aria-selected="${cur===k}" class="${cur===k?'on':''}">${l}</button>`).join('');
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>cb(b.dataset.k));
}

/* ---------- detail / delete ---------- */
function showDetail(id){
  const i=byId(id);if(!i)return;openId=id;
  $('#dStage').innerHTML=imgTag(i);
  $('#dName').textContent=i.name||'بدون اسم';
  const rows=[['النوع',TYPES[i.type]],['اللون',`<span style="display:inline-flex;align-items:center;gap:8px"><i class="dotc" style="background:${i.color}"></i>${esc(iname(i))}</span>`],['الموسم',esc(i.season)],['المناسبة',esc(i.occ)]];
  if(i.pattern&&i.pattern!=='سادة')rows.push(['النقشة',esc(i.pattern)]);
  $('#dInfo').innerHTML=rows.map(([k,v])=>`<div class="dl"><span>${k}</span><span>${k==='النوع'?esc(v):v}</span></div>`).join('');
  $('#editItem').innerHTML=ic('edit')+'<span>تعديل</span>';
  $('#del').innerHTML=ic('trash')+'<span>حذف القطعة</span>';
  sheet('detail');
}
$('#editItem').onclick=()=>editItem(openId);
$('#del').onclick=async()=>{
  const id=openId;
  if(!await askConfirm('حذف القطعة؟','القطعة هتتشال كمان من أي طقم هي فيه. الطقم اللي يفضل فاضي هيتحذف.','حذف',true))return;
  await rm('items',id);items=await all('items');
  for(const o of outfits){
    const ids=o.ids.filter(x=>x!==id);
    if(ids.length===o.ids.length)continue;
    if(ids.length===0){await rm('outfits',o.id);for(const p of plan.filter(x=>x.outfitId===o.id))await rm('plan',p.date)}
    else await put('outfits',{...o,ids});
  }
  outfits=await all('outfits');plan=await all('plan');
  for(const k of Object.keys(pick))if(pick[k]===id)delete pick[k];
  sheet(null);renderCurrent();updateDot();toast('اتحذفت القطعة');
};

/* ---------- photo capture (unchanged behavior) ---------- */
async function getPhoto(source){
  const C=window.Capacitor;
  let cam=null;
  try{if(source!=='file'&&C&&C.isNativePlatform&&C.isNativePlatform())cam=(C.Plugins&&C.Plugins.Camera)||C.registerPlugin('Camera')}catch(e){}
  if(cam){
    try{
      const r=await cam.getPhoto({quality:90,allowEditing:false,resultType:'dataUrl',source:source==='camera'?'CAMERA':'PHOTOS',correctOrientation:true,width:1280});
      return r.dataUrl;
    }catch(e){
      const m=String((e&&e.message)||e);
      if(!/cancel/i.test(m))toast('ماقدرتش أفتح '+(source==='camera'?'الكاميرا':'المعرض')+'. اتأكد إن التطبيق معاه الإذن.');
      return null;
    }
  }
  return new Promise(res=>{
    const f=$('#file');
    if(source==='camera')f.setAttribute('capture','environment');else f.removeAttribute('capture');
    f.onchange=()=>{const x=f.files[0];f.value='';if(!x)return res(null);const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(x)};
    f.click();
  });
}

/* ---------- add / edit item ---------- */
/* F = form state. auto = what was originally extracted from the photo (kept as-is on the record).
   userName = a name the user chose; undefined means "use the automatic name". */
let F={};
const SRC_TXT={photo:'اتاخد من الصورة',tap:'اتاخد من نقطة على الصورة',manual:'اخترته يدوي',learned:'اسم اتعلّمه من تصحيحاتك',corrected:'اسم صحّحته انت'};
function nameOptions(){
  const extra=[...new Set(learned.map(s=>s.label))].filter(l=>!PAL_LABELS.includes(l));
  return [...PAL_LABELS,...extra];
}
function syncColor(){
  const hx=F.color,an=autoName(hx),opts=nameOptions();
  $('#colSw').style.background=hx;
  $('#color').value=hx;
  const shown=F.userName!==undefined?F.userName:an.label;
  $('#colName').textContent=shown;
  $('#colSrc').textContent=F.userName!==undefined?SRC_TXT.corrected:(an.source==='learned'?SRC_TXT.learned:SRC_TXT[F.colorSrc||'manual']);
  const inList=F.userName!==undefined&&opts.includes(F.userName);
  const custom=F.userName!==undefined&&!inList;
  $('#nameSel').innerHTML=`<option value="">تلقائي: ${esc(an.label)}</option>`+opts.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('')+'<option value="__c">اسم آخر…</option>';
  $('#nameSel').value=F.userName===undefined?'':custom?'__c':F.userName;
  $('#nameCustom').classList.toggle('hide',!custom&&!F.customOpen);
  if(custom||F.customOpen)$('#nameCustom').value=F.userName||'';
  $('#quickc').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.h===hx));
}
function setColor(hx,src){F.color=hx;F.colorSrc=src;F.userName=undefined;F.customOpen=false;syncColor()}
$('#color').oninput=()=>setColor($('#color').value,'manual');
$('#nameSel').onchange=()=>{
  const v=$('#nameSel').value;
  if(v===''){F.userName=undefined;F.customOpen=false}
  else if(v==='__c'){F.customOpen=true;F.userName=$('#nameCustom').value.trim()||undefined}
  else{F.userName=v;F.customOpen=false}
  syncColor();if(v==='__c')$('#nameCustom').focus();
};
$('#nameCustom').oninput=()=>{const v=$('#nameCustom').value.trim();F.userName=v||undefined;F.customOpen=true;$('#colName').textContent=v||autoName(F.color).label;$('#colSrc').textContent=v?SRC_TXT.corrected:''};
(function(){
  const seen=new Set(),q=$('#quickc');
  q.innerHTML=PAL.filter(c=>!seen.has(c.label)&&seen.add(c.label)).map(c=>`<button type="button" data-h="${c.h}" style="background:${c.h}" aria-label="${esc(c.label)}"></button>`).join('');
  q.querySelectorAll('button').forEach(b=>b.onclick=()=>setColor(b.dataset.h,'manual'));
})();

function paintStage(){
  const s=$('#stage');
  s.classList.remove('busy');
  if(!F.img){
    s.innerHTML=`<div class="pickrow"><button id="pCam" type="button">${ic('cam')}<span>كاميرا</span></button><button id="pGal" type="button">${ic('img')}<span>المعرض</span></button><button id="pFile" type="button">${ic('file')}<span>ملف PNG</span></button></div>`;
    $('#pCam').onclick=()=>choose('camera');$('#pGal').onclick=()=>choose('gallery');$('#pFile').onclick=()=>choose('file');
    $('#photoTools').classList.add('hide');
  }else{
    s.innerHTML=`<img src="${F.img}" alt="صورة القطعة" style="cursor:crosshair">`;
    $('#photoTools').classList.remove('hide');
  }
}
$('#stage').onclick=e=>{
  const im=e.target.closest('img');if(!im||!F.canvas)return;
  const r=im.getBoundingClientRect(),nw=F.canvas.width,nh=F.canvas.height,k=Math.min(r.width/nw,r.height/nh);
  const x=Math.round((e.clientX-r.left-(r.width-nw*k)/2)/k),y=Math.round((e.clientY-r.top-(r.height-nh*k)/2)/k);
  if(x<0||y<0||x>=nw||y>=nh)return;
  const d=F.canvas.getContext('2d',{willReadFrequently:true}).getImageData(Math.max(0,x-3),Math.max(0,y-3),7,7).data;
  let R=0,G=0,B=0,n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>200){R+=d[i];G+=d[i+1];B+=d[i+2];n++}
  if(n){setColor(hex2(R/n,G/n,B/n),'tap');toast('اتاخد اللون: '+autoName(F.color).label)}
};
function showErr(msg){const e=$('#photoErr');e.innerHTML=msg?ic('alert')+'<span>'+esc(msg)+'</span>':'';e.classList.toggle('hide',!msg)}
function resetForm(){
  F={img:null,canvas:null,cut:false,color:'#27407a',colorSrc:'manual',type:'top',auto:null,userName:undefined,customOpen:false,base:null};
  $('#name').value='';$('#season').value='كل السنة';$('#occ').value='كاجوال';$('#pattern').value='سادة';
  showErr('');$('#saveItem').disabled=false;$('#saveItem').textContent='حفظ القطعة';
}
function newItem(presetType){
  resetForm();F.type=TYPES[presetType]?presetType:'top';
  $('#formTitle').textContent='قطعة جديدة';
  drawTypeSeg();paintStage();syncColor();sheet('form');
}
async function editItem(id){
  const i=byId(id);if(!i)return;
  resetForm();
  F.base=i;F.type=i.type;F.img=i.img;F.cut=!!i.cut;F.color=i.color;F.colorSrc=i.colorAuto&&i.colorAuto.source==='tap'?'tap':'photo';
  F.auto=i.colorAuto||null;
  F.userName=i.colorName||undefined;
  $('#name').value=i.name||'';$('#season').value=i.season;$('#occ').value=i.occ;$('#pattern').value=i.pattern||'سادة';
  $('#formTitle').textContent='تعديل القطعة';
  drawTypeSeg();paintStage();syncColor();sheet('form');
  try{F.canvas=await loadCanvas(i.img,900)}catch(e){}
}
function drawTypeSeg(){
  $('#typeSeg').innerHTML=Object.entries(TYPES).map(([k,l])=>`<button type="button" data-k="${k}" aria-pressed="${F.type===k}" class="${F.type===k?'on':''}">${l}</button>`).join('');
  $('#typeSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{F.type=b.dataset.k;if(F.type==='hoodie'&&!F.base)$('#season').value='شتا';drawTypeSeg()});
}
async function choose(src){
  const url=await getPhoto(src);if(!url)return;
  const st=$('#stage');
  st.innerHTML='<div class="busy-t"><span class="spin"></span>جاري المعالجة…</div>';st.classList.add('busy');
  await new Promise(r=>setTimeout(r,30));
  try{
    F.canvas=await loadCanvas(url,900);
    F.cut=hasAlpha(F.canvas);
    F.img=F.cut?F.canvas.toDataURL('image/png'):F.canvas.toDataURL('image/jpeg',.85);
    const col=domColor(F.canvas);
    if(col){F.auto={hex:col,label:autoName(col).label,source:'photo'};setColor(col,'photo')}
    showErr('');
  }catch(e){F.img=null;F.canvas=null;showErr('الصورة دي ماتفتحتش. جرّب صورة تانية.')}
  paintStage();
}
$('#retake').onclick=()=>{F.img=null;F.canvas=null;F.cut=false;F.auto=null;paintStage()};
let savingItem=false;
$('#saveItem').onclick=async()=>{
  if(savingItem)return;
  if(!F.img){showErr('اختار صورة للقطعة الأول.');$('#stage').scrollIntoView({block:'center'});return}
  savingItem=true;const b=$('#saveItem');b.disabled=true;b.innerHTML='<span class="spin"></span><span>جاري الحفظ…</span>';
  try{
    const hx=F.color,an=autoName(hx),label=F.userName!==undefined?F.userName:an.label;
    /* learn only from a real correction of the automatic name */
    if(F.userName!==undefined&&F.userName!==an.label)addLearning(hx,F.userName);
    const rec={...(F.base||{}),name:$('#name').value.trim(),type:F.type,color:hx,season:$('#season').value,occ:$('#occ').value,pattern:$('#pattern').value,img:F.img,cut:F.cut,added:F.base?F.base.added:Date.now()};
    rec.colorAuto=F.auto||{hex:hx,label:paletteLabel(hx),source:'manual'};   /* original extraction is preserved */
    if(label!==paletteLabel(hx))rec.colorName=label;else delete rec.colorName;
    const wasEdit=!!F.base,t=F.type;
    await put('items',rec);
    items=await all('items');sheet(null);
    if(!wasEdit&&curTab==='wardrobe'){filter='all';wq='';wocc='all';$('#q').value=''}
    renderCurrent();updateDot();toast(wasEdit?'اتحفظ التعديل':'اتضافت القطعة');
  }catch(e){toast('ماقدرتش أحفظ القطعة. جرّب تاني.')}
  finally{savingItem=false;b.disabled=false;b.textContent='حفظ القطعة'}
};

/* ---------- mix ---------- */
let mixOcc='all',outOcc='all';
const pool=t=>items.filter(i=>SLOT_TYPES[t].includes(i.type)&&(mixOcc==='all'||i.occ===mixOcc));
const curSel=()=>{const s={};SLOTS.forEach(([t])=>{const i=byId(pick[t]);if(i)s[t]=i});return s};
function ring(score){
  const C=2*Math.PI*29,off=C*(1-score/100);
  return `<div class="ring ${scoreCls(score)}"><svg viewBox="0 0 68 68" aria-hidden="true"><circle class="tr" cx="34" cy="34" r="29"/><circle class="pg" cx="34" cy="34" r="29" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg><b>${score}</b></div>`;
}
function renderMix(){
  drawOcc($('#mixOcc'),mixOcc,k=>{mixOcc=k;for(const t of Object.keys(pick))if(!pool(t).some(i=>i.id===pick[t]))delete pick[t];renderMix()});
  const miss=[];
  $('#slots').innerHTML=SLOTS.map(([t,l,opt])=>{
    const list=pool(t),cur=byId(pick[t]);
    const noneAtAll=!items.some(i=>SLOT_TYPES[t].includes(i.type));
    let body;
    if(cur)body=`<div class="pic">${imgTag(cur)}</div>`;
    else if(!list.length)body=`<div class="ph">${ic(TYPE_IC[t])}<span>${mixOcc!=='all'&&!noneAtAll?'مفيش '+l+' '+esc(mixOcc):'مفيش '+l+' في الدولاب'}</span><button type="button" data-add="${t}">+ ضيف ${l}</button></div>`;
    else body=`<div class="ph">${ic(TYPE_IC[t])}<span>${opt?'بدون '+l:'اختار '+l}</span></div>`;
    if(!cur&&!opt)miss.push(l);
    return `<div class="slotc ${t==='top'||t==='bottom'?'tall':''} ${!cur&&!opt?'missing':''}" data-t="${t}">${body}
      <div class="meta"><span class="sub">${l}${cur?' · '+esc(iname(cur)):''}</span><b>${cur?esc(cur.name||'بدون اسم'):'—'}</b></div>
      <div class="nav"><button class="arr" data-d="1" type="button" aria-label="${l}: التالي" ${list.length?'':'disabled'}>${ic('r')}</button>${list.length?`<button class="best" data-b="${t}" type="button">الأنسب للباقي</button>`:'<span style="flex:1"></span>'}<button class="arr" data-d="-1" type="button" aria-label="${l}: السابق" ${list.length?'':'disabled'}>${ic('l')}</button></div></div>`}).join('');
  $('#slots').querySelectorAll('.arr').forEach(b=>b.onclick=()=>{
    const t=b.closest('.slotc').dataset.t,opt=SLOTS.find(s=>s[0]===t)[2],list=pool(t).map(i=>i.id);
    if(!list.length)return;if(opt)list.push(null);
    const d=+b.dataset.d;
    let ix=list.indexOf(pick[t]===undefined?(opt?null:undefined):pick[t]);
    if(ix<0)ix=d>0?-1:0;
    ix=(ix+d+list.length)%list.length;
    if(list[ix]===null)delete pick[t];else pick[t]=list[ix];
    renderMix();
  });
  $('#slots').querySelectorAll('.best').forEach(b=>b.onclick=()=>bestFor(b.dataset.b));
  $('#slots').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>newItem(b.dataset.add));
  const r=outfitScore(curSel()),sc=$('#score');
  if(!r)sc.innerHTML=`<div class="tx"><b>تناسق الطقم</b><span class="sub">اختار قطعتين أو أكتر وهقيّم لك تناسق الألوان.</span></div>`;
  else sc.innerHTML=ring(r.score)+`<div class="tx"><b>تناسق الطقم <span class="pill ${scoreCls(r.score)}">${r.score}%</span></b><span class="sub">${esc(r.note)}</span>${miss.length?`<span class="sub" style="display:block">ناقص: ${miss.join('، ')}</span>`:''}</div>`;
}
function bestFor(t){
  const sel=curSel();delete sel[t];
  if(Object.keys(sel).length<1){toast('اختار قطعة تانية الأول');return}
  const rc=recentItems();let best=null,bs=-1;
  for(const c of pool(t)){const r=outfitScore({...sel,[t]:c},rc);if(r&&r.score>bs){bs=r.score;best=c}}
  if(!best)return;
  pick[t]=best.id;renderMix();toast('الأنسب: '+(best.name||'بدون اسم')+' ('+bs+'%)');
}
$('#shuffle').onclick=()=>{
  SLOTS.forEach(([t,,opt])=>{const l=pool(t);
    if(!l.length||(opt&&Math.random()<.5)){delete pick[t];return}
    pick[t]=rnd(l).id});
  renderMix();
};
$('#saveOutfit').onclick=()=>{
  if(Object.keys(curSel()).length<2){toast('اختار قطعتين على الأقل');return}
  $('#oName').value='';sheet('name');
};
let saving=false;
$('#oSave').onclick=async()=>{
  if(saving)return;saving=true;
  try{
    const ids=SLOTS.map(([t])=>pick[t]).filter(Boolean),key=[...ids].sort().join(',');
    if(outfits.some(o=>[...o.ids].sort().join(',')===key)){sheet(null);toast('الطقم ده محفوظ قبل كده في "أطقمي"');return}
    await put('outfits',{name:$('#oName').value.trim(),ids,added:Date.now()});
    learn(curSel(),1);
    outfits=await all('outfits');sheet(null);toast('اتحفظ الطقم في "أطقمي"');
  }finally{saving=false}
};

/* ---------- saved outfits ---------- */
function outfitOcc(o){const ocs=new Set(outfitItems(o).map(i=>i.occ));return ocs.size===1?[...ocs][0]:'مختلط'}
function collage(o){const its=outfitItems(o);return `<div class="collage n${Math.min(its.length,4)}">${its.map(i=>`<div class="pic">${imgTag(i)}</div>`).join('')}</div>`}
function renderOutfits(){
  drawOcc($('#outOcc'),outOcc,k=>{outOcc=k;renderOutfits()});
  $('#outOcc').classList.toggle('hide',!outfits.length);
  const list=[...outfits].reverse().filter(o=>outfitItems(o).length&&(outOcc==='all'||outfitOcc(o)===outOcc));
  $('#outfits').innerHTML=list.map(o=>{const r=outfitScore(itemsByType(o));return `<div class="out"><div class="hd"><b>${esc(o.name||'طقم بدون اسم')} <span class="sub">· ${esc(outfitOcc(o))}</span></b>${r?`<span class="pill ${scoreCls(r.score)}">${r.score}%</span>`:''}</div>${collage(o)}<div class="ft"><span class="sub">${outfitItems(o).length} قطع</span><button class="iconbtn dan" data-id="${o.id}" type="button" aria-label="حذف الطقم">${ic('trash')}</button></div></div>`}).join('');
  $('#outfits').querySelectorAll('button').forEach(b=>b.onclick=async()=>{
    if(!await askConfirm('حذف الطقم؟','هيتشال كمان من الأسبوع لو كان متحدد فيه.','حذف',true))return;
    const id=+b.dataset.id;await rm('outfits',id);
    for(const p of plan.filter(x=>x.outfitId===id))await rm('plan',p.date);
    outfits=await all('outfits');plan=await all('plan');renderOutfits();toast('اتحذف الطقم');
  });
  const em=$('#empty2');
  em.classList.toggle('hide',list.length>0);
  if(!list.length){
    if(outfits.length){em.innerHTML=emptyState('mark','مفيش أطقم '+esc(outOcc),'جرّب مناسبة تانية.')}
    else{em.innerHTML=emptyState('mark','مفيش أطقم محفوظة','ركّب طقم واحفظه وهيظهر هنا.','ركّب طقم','goMix');$('#goMix').onclick=()=>tab('mix')}
  }
}

/* ---------- weekly plan ---------- */
let weekOff=0,selDate=null;
function weekStart(off){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+1)%7)+off*7);return d}
const weekDays=()=>{const s=weekStart(weekOff);return[...Array(7)].map((_,i)=>{const d=new Date(s);d.setDate(s.getDate()+i);return d})};
function renderPlan(){
  const days=weekDays(),today=iso(new Date());
  if(!selDate||!days.some(d=>iso(d)===selDate))selDate=days.some(d=>iso(d)===today)?today:iso(days[0]);
  $('#weekLbl').textContent=days[0].getDate()+'/'+(days[0].getMonth()+1)+'  –  '+days[6].getDate()+'/'+(days[6].getMonth()+1);
  $('#strip').innerHTML=days.map(d=>{
    const k=iso(d),p=plan.find(x=>x.date===k),o=p&&outfits.find(x=>x.id===p.outfitId),first=o&&outfitItems(o)[0];
    return `<button class="dy ${k===today?'today':''} ${k===selDate?'sel':''}" data-d="${k}" type="button" aria-pressed="${k===selDate}" aria-label="${DAYN[d.getDay()]} ${d.getDate()}"><span>${DAYS[d.getDay()]}</span><span class="n">${d.getDate()}</span><span class="t">${first?imgTag(first):''}</span></button>`}).join('');
  $('#strip').querySelectorAll('.dy').forEach(b=>b.onclick=()=>{selDate=b.dataset.d;renderPlan()});
  const d=parse(selDate),p=plan.find(x=>x.date===selDate),o=p&&outfits.find(x=>x.id===p.outfitId);
  $('#detail').innerHTML=`<h3>${DAYN[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}</h3>`+(o
    ?`<span class="sub">${esc(o.name||'طقم بدون اسم')}</span><div class="ims">${outfitItems(o).map(i=>`<div class="pic">${imgTag(i)}</div>`).join('')}</div><div class="btns two"><button class="btn" id="chg" type="button">غيّر الطقم</button><button class="btn dan" id="clr" type="button">شيل الطقم</button></div>`
    :`<div class="noday">ماحددتش طقم لليوم ده</div><div class="btns"><button class="btn" id="chg" type="button">اختار طقم</button></div>`);
  $('#chg').onclick=()=>openPick(selDate);
  const c=$('#clr');if(c)c.onclick=async()=>{await rm('plan',selDate);plan=await all('plan');renderPlan()};
}
function openPick(k){
  const d=parse(k),cur=plan.find(x=>x.date===k);
  $('#pickTitle').textContent='طقم '+DAYN[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1);
  $('#pickList').innerHTML=outfits.length?[...outfits].reverse().filter(o=>outfitItems(o).length).map(o=>`<button class="pk out ${cur&&cur.outfitId===o.id?'sel':''}" data-id="${o.id}" type="button"><div class="hd"><b>${esc(o.name||'طقم بدون اسم')}</b></div><div class="ims">${outfitItems(o).map(i=>`<div class="pic">${imgTag(i)}</div>`).join('')}</div></button>`).join(''):'<div class="empty" style="padding:24px 0"><p style="margin:0 auto">احفظ طقم من تبويب "تركيب" الأول.</p></div>';
  $('#pickList').querySelectorAll('.pk').forEach(e=>e.onclick=async()=>{
    await put('plan',{date:k,outfitId:+e.dataset.id});plan=await all('plan');sheet(null);renderPlan()});
  $('#clearDay').classList.add('hide');
  sheet('pick');
}
$('#prevW').onclick=()=>{weekOff--;selDate=null;renderPlan()};
$('#nextW').onclick=()=>{weekOff++;selDate=null;renderPlan()};
$('#fillWeek').onclick=async()=>{
  if(!outfits.length){toast('احفظ أطقم الأول من تبويب "تركيب"');return}
  for(const d of weekDays()){const k=iso(d);if(!plan.find(x=>x.date===k))await put('plan',{date:k,outfitId:rnd(outfits).id})}
  plan=await all('plan');renderPlan();toast('اتوزعت الأطقم');
};
