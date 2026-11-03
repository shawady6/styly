/* Wardrobe sub-navigation + the three new sections: محتاج إيه؟ · اشتري إيه؟ · مقاساتي.
   "ملابسي" is the existing wardrobe (renderMine in screens.js). */
const WSECS=[['mine','ملابسي'],['need','محتاج إيه؟'],['buy','اشتري إيه؟'],['sizes','مقاساتي']];
let wsec='mine';
try{const s=sessionStorage.getItem('styly-wsec');if(WSECS.some(x=>x[0]===s))wsec=s}catch(e){}

function setHeadH(){const h=document.querySelector('.top');if(h)document.documentElement.style.setProperty('--head-h',h.offsetHeight+'px')}
window.addEventListener('resize',setHeadH);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(setHeadH);

function drawSubnav(){
  $('#wnav').innerHTML=WSECS.map(([k,l])=>`<button type="button" role="tab" id="wn-${k}" aria-selected="${wsec===k}" aria-controls="w-${k}" class="${wsec===k?'on':''}" data-k="${k}">${l}</button>`).join('');
  $('#wnav').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(wsec!==b.dataset.k)setWsec(b.dataset.k)});
}
function setWsec(k){
  wsec=k;try{sessionStorage.setItem('styly-wsec',k)}catch(e){}
  renderWardrobe();window.scrollTo(0,0);
}
/* called by renderWardrobe(): show one section only */
function showWsec(){
  drawSubnav();
  WSECS.forEach(([k])=>$('#w-'+k).classList.toggle('hide',k!==wsec));
  $('#addBtn').classList.toggle('show',curTab==='wardrobe'&&wsec==='mine');
  if(wsec==='need')renderNeed();
  if(wsec==='buy')renderBuy();
  if(wsec==='sizes')renderSizes();
  setHeadH();
}

/* ---------- shared bits ---------- */
const vTile=(v,label)=>`<div class="pic vt" style="--vc:${v.color}"><span>${esc(label||'جديدة')}</span></div>`;
function outfitRow(o){
  const order=['top','bottom','outer','shoes'];
  return `<div class="ims">${order.filter(k=>o.sel[k]).map(k=>{const i=o.sel[k];return i.virtual?vTile(i,iname(i)):`<div class="pic">${imgTag(i)}</div>`}).join('')}</div>`;
}
const exNames=o=>['top','bottom','outer','shoes'].filter(k=>o.sel[k]).map(k=>{const i=o.sel[k];return i.virtual?'<b>'+esc(iname(i))+' (جديدة)</b>':esc(i.name||TYPES[i.type])}).join(' + ');
function limitedNote(d){
  if(d.level==='none')return `<div class="note">${ic('info')}<div><b>التحليل مش متاح لسه.</b> محتاج على الأقل 4 قطع (حاليًا ${d.n}) عشان أحسب أطقم وأقارن بشكل مفيد، وإلا النتايج هتبقى مضللة.</div></div>`;
  if(d.level==='limited')return `<div class="note">${ic('info')}<div><b>التحليل محدود.</b> ${d.miss.length?'مفيش عندك: '+d.miss.join('، ')+'. ':''}${d.n<8?'عدد القطع ('+d.n+') قليل. ':''}النتايج تقريبية وهتتحسن كل ما تضيف قطع.</div></div>`;
  return '';
}
function addFromSuggestion(type,color,label){
  askConfirm('تضيف القطعة للدولاب؟','هتفتح لك شاشة الإضافة ومعاها النوع واللون. مفيش حاجة بتتحفظ غير لما تختار صورة وتضغط حفظ.','افتح الإضافة').then(ok=>{
    if(!ok)return;newItem(type,{color,name:label});
  });
}

/* ---------- محتاج إيه؟ ---------- */
function renderNeed(){
  const el=$('#w-need'),its=items.filter(i=>i.type!=='acc'),d=dataLevel(its);
  let h=`<div class="page"><h2 class="h1">محتاج إيه؟</h2><p class="sub" style="margin-top:4px">بجرّب قطع افتراضية على دولابك (من غير ما أحفظ حاجة) وأشوف كام طقم جديد حقيقي هتفتحه.</p>`+limitedNote(d);
  if(d.level==='none'){el.innerHTML=h+'</div>';return}
  const base=baseline(its);
  const cnt=k=>base.L[k].length;
  h+=`<div class="stats" style="margin-top:var(--sp-4)"><div class="stat"><b>${base.count}</b><span>طقم حالي</span></div><div class="stat"><b>${base.unused.length}</b><span>قطعة برا الأطقم</span></div><div class="stat"><b>${its.length}</b><span>قطعة</span></div></div>
    <p class="hint">فوق ${cnt('top')} · تحت ${cnt('bottom')} · جزمة ${cnt('shoes')} · جاكيت ${cnt('outer')} — الطقم المقبول تناسقه ${GOOD}% أو أكتر، والمكرر بيتحسب مرة واحدة.</p>
    <div id="needRes" class="sec"><p class="sub"><span class="spin" style="display:inline-block;vertical-align:-3px"></span> بحلل الدولاب…</p></div></div>`;
  el.innerHTML=h;
  setTimeout(()=>{   /* let the spinner paint before the heavy loop */
    const r=analyzeNeeds(its),box=$('#needRes');if(!box||wsec!=='need')return;
    if(!r.suggestions.length){box.innerHTML=`<div class="note">${ic('check')}<div><b>دولابك متوازن.</b> مفيش قطعة هتفتح ${MIN_NEW} أطقم جديدة أو أكتر بتناسق كويس، ومش هقترح حاجة لمجرد الملء.</div></div>`;return}
    box.innerHTML=`<div class="sec-h"><h2>الأنسب تضيفه (حسب القيمة)</h2></div><div class="outs" style="padding:0">`+r.suggestions.map((s,n)=>suggestionCard(s,n+1,r.base)).join('')+'</div>';
    box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addFromSuggestion(b.dataset.t,b.dataset.c,b.dataset.l));
  },30);
}
function reasonOf(s,base,its){
  const p=[];
  if(base.count===0)p.push('دلوقتي مفيش ولا طقم كامل مقبول');
  p.push(`هتفتح <b>${s.count}</b> طقم جديد حقيقي بمتوسط تناسق ${s.avg}%`);
  if(s.unlocked)p.push(`وهتشغّل ${s.unlocked} قطعة مش داخلة في أي طقم حاليًا`);
  const k=slotKey(s.v.type),n=base.L[k].length;
  if(n<=2)p.push(`وعندك ${n?'':'ولا '}${SLOT_LBL[k]}${n?' ('+n+') بس':''}`);
  if(s.repeats)p.push(`(${s.repeats} تركيبة مكررة اتشالت من الحساب)`);
  if(occasionsKnown(its))p.push(`مناسبة للـ ${esc(s.v.occ)}`);
  return p.join('، ')+'.';
}
function suggestionCard(s,rank,base){
  const its=items.filter(i=>i.type!=='acc');
  return `<div class="out"><div class="hd"><b><span class="rk">${rank}</span> <i class="dotc" style="background:${s.v.color};display:inline-block;vertical-align:-1px"></i> ${esc(TYPES[s.v.type])} ${esc(s.label)}</b><span class="pill g">+${s.count} طقم</span></div>
    <p class="sub" style="margin-bottom:var(--sp-3)">${reasonOf(s,base,its)}</p>
    ${s.examples.map(o=>`<div style="margin-bottom:var(--sp-3)">${outfitRow(o)}<p class="hint">${exNames(o)} · ${o.score}%</p></div>`).join('')}
    <button class="btn ghost sm" data-add="1" data-t="${s.v.type}" data-c="${s.v.color}" data-l="${esc(TYPES[s.v.type]+' '+s.label)}" type="button">${ic('plus')}<span>ضيفها للدولاب</span></button></div>`;
}

/* ---------- اشتري إيه؟ ---------- */
let buy={type:'top',cols:[],occ:'auto',season:'auto',res:null};
const BUY_TYPES=['top','hoodie','bottom','outer','shoes'];
const BUY_COLORS=(()=>{const s=new Set();return PAL.filter(c=>!s.has(c.label)&&s.add(c.label))})();
function renderBuy(){
  if(buy.res&&buy.res.n!==items.length)buy.res=null;   /* wardrobe changed: old comparison is stale */
  const el=$('#w-buy'),its=items.filter(i=>i.type!=='acc'),d=dataLevel(its);
  let h=`<div class="page"><h2 class="h1">اشتري إيه؟</h2><p class="sub" style="margin-top:4px">اختار نوع القطعة ولونين أو تلاتة محتار بينهم، وأقولك أنهي أحسن لدولابك. القطع دي افتراضية ومش بتتحفظ.</p>`+limitedNote(d);
  if(d.level==='none'){el.innerHTML=h+'</div>';return}
  h+=`<div class="f-l" id="bTl">نوع القطعة</div><div class="seg" id="bType" role="group" aria-labelledby="bTl">${BUY_TYPES.map(k=>`<button type="button" data-k="${k}" aria-pressed="${buy.type===k}" class="${buy.type===k?'on':''}">${TYPES[k]}</button>`).join('')}</div>
    <div class="f-l" id="bCl">الألوان اللي محتار بينها (2 أو 3) — اخترت ${buy.cols.length}</div>
    <div class="swgrid" id="bCols" role="group" aria-labelledby="bCl">${BUY_COLORS.map(c=>`<button type="button" class="sws ${buy.cols.includes(c.label)?'on':''}" data-l="${esc(c.label)}" aria-pressed="${buy.cols.includes(c.label)}"><i style="background:${c.h}"></i><span>${esc(c.label)}</span></button>`).join('')}</div>
    <div class="two"><div><label class="f" for="bOcc">المناسبة</label><select id="bOcc"><option value="auto">أنسب مناسبة (تلقائي)</option>${OCCS.map(o=>`<option ${buy.occ===o?'selected':''}>${o}</option>`).join('')}</select></div>
    <div><label class="f" for="bSea">الموسم</label><select id="bSea"><option value="auto">حسب النوع</option>${['كل السنة','صيف','شتا','مواسم انتقالية'].map(o=>`<option ${buy.season===o?'selected':''}>${o}</option>`).join('')}</select></div></div>
    <div class="err hide" id="bErr" role="alert"></div>
    <button class="btn" id="bGo" type="button" style="margin-top:var(--sp-4)">${ic('mix')}<span>قارن الألوان</span></button><div id="bRes" class="sec"></div></div>`;
  el.innerHTML=h;
  $('#bOcc').value=buy.occ;$('#bSea').value=buy.season;
  $('#bType').querySelectorAll('button').forEach(b=>b.onclick=()=>{buy.type=b.dataset.k;buy.res=null;renderBuy()});
  $('#bCols').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const l=b.dataset.l,i=buy.cols.indexOf(l);
    if(i>=0)buy.cols.splice(i,1);else if(buy.cols.length>=3){toast('أقصى حاجة 3 ألوان');return}else buy.cols.push(l);
    buy.res=null;renderBuy();
  });
  $('#bOcc').onchange=()=>{buy.occ=$('#bOcc').value;buy.res=null};$('#bSea').onchange=()=>{buy.season=$('#bSea').value;buy.res=null};
  $('#bGo').onclick=runBuy;
  if(buy.res)drawBuyRes();
}
function runBuy(){
  const err=$('#bErr');
  if(buy.cols.length<2){err.innerHTML=ic('alert')+'<span>اختار لونين على الأقل عشان أقارن.</span>';err.classList.remove('hide');return}
  err.classList.add('hide');
  const its=items.filter(i=>i.type!=='acc'),cols=buy.cols.map(l=>BUY_COLORS.find(c=>c.label===l));
  $('#bRes').innerHTML='<p class="sub"><span class="spin" style="display:inline-block;vertical-align:-3px"></span> بقارن…</p>';
  setTimeout(()=>{
    buy.res=compareColors(its,buy.type,cols,buy.occ,buy.season==='auto'?null:buy.season);
    buy.res.its=its;buy.res.type=buy.type;buy.res.n=items.length;drawBuyRes();
    const r=$('#bRes');if(r)r.scrollIntoView({behavior:'smooth',block:'start'});
  },30);
}
function buyReason(best,second,base){
  let t=`${best.label} هتفتح <b>${best.count}</b> طقم جديد (متوسط تناسق ${best.avg}%)`;
  if(second&&best.count>second.count)t+=` — أكتر من ${second.label} بـ ${best.count-second.count}`;
  else if(second&&best.count===second.count)t+=` — بنفس عدد ${second.label} لكن تناسقها وتنوعها أحسن`;
  if(best.unlocked)t+=`، وبتشغّل ${best.unlocked} قطعة مش داخلة في أي طقم`;
  return t+'.';
}
function drawBuyRes(){
  const r=buy.res,box=$('#bRes');if(!box||!r)return;
  const best=r.results[0],second=r.results[1];
  if(r.results.every(x=>x.count===0)){
    box.innerHTML=`<div class="note">${ic('info')}<div><b>مفيش لون فيهم هيفتح أطقم جديدة.</b> ممكن لأن ${TYPES[r.type]} متكرر عندك بنفس الألوان، أو ناقصك قطع تانية (فوق / تحت / جزمة) تكمّل بيها الطقم، أو الموسم/المناسبة مش مناسبين.</div></div>`;return;
  }
  const tie=r.results.length>1&&r.results.every(x=>x.count===best.count&&Math.abs(x.avg-best.avg)<=1);
  let h=`<div class="note" style="border-color:var(--accent)">${ic('check')}<div><b>الأفضل: ${esc(best.label)}</b><br>${tie?'الألوان متقاربة جدًا في القيمة؛ اختار اللي بتحبه. ':''}${buyReason(best,second,r.base)}</div></div>
    <div class="sec-h" style="margin-top:var(--sp-5)"><h2>المقارنة</h2></div>
    <div class="cmp">${r.results.map((x,n)=>`<div class="cmpc ${n===0?'best':''}"><i class="dotc" style="background:${x.hex};width:22px;height:22px"></i><b>${esc(x.label)}</b><span class="pill ${n===0?'g':''}">${x.count} طقم</span><small>تناسق ${x.avg}%</small><small>تنوع ${x.touched} قطعة</small><small>مكرر ${x.repeats}</small></div>`).join('')}</div>
    <p class="hint">طقم جديد = مقبول التناسق (≥ ${GOOD}%) ومش مكرر لحاجة موجودة. التنوع = عدد قطعك اللي هتدخل في الأطقم الجديدة. المكرر = تركيبات اتشالت لأنها شبه أطقم موجودة.</p>`;
  h+=r.results.map(x=>{
    const rj=x.rejected,notes=[];if(rj.season)notes.push(rj.season+' تركيبة اتلغت لتعارض الموسم');if(rj.occ)notes.push(rj.occ+' تركيبة اتلغت لاختلاف المناسبة');
    return `<div class="out" style="margin-top:var(--sp-3)"><div class="hd"><b><i class="dotc" style="background:${x.hex};display:inline-block;vertical-align:-1px"></i> ${esc(x.label)}${r.its&&occasionsKnown(r.its)?` <span class="sub">· ${esc(x.v.occ)}</span>`:''}</b><span class="pill ${x.count?'g':'b'}">${x.count} طقم</span></div>
      ${x.examples.length?x.examples.map(o=>`<div style="margin-bottom:var(--sp-3)">${outfitRow(o)}<p class="hint">${exNames(o)} · ${o.score}%</p></div>`).join(''):'<p class="sub">مفيش أطقم جديدة بالون ده.</p>'}
      ${notes.length?`<p class="hint">${notes.join(' · ')}</p>`:''}
      ${x.count?`<button class="btn ghost sm" data-add="1" data-t="${r.type}" data-c="${x.hex}" data-l="${esc(TYPES[r.type]+' '+x.label)}" type="button">${ic('plus')}<span>ضيفها للدولاب</span></button>`:''}</div>`}).join('');
  box.innerHTML=h;
  box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addFromSuggestion(b.dataset.t,b.dataset.c,b.dataset.l));
}

/* ---------- مقاساتي ---------- */
/* Stored in localStorage (key styly-measurements), NOT in IndexedDB: raising the DB version would make an
   older APK unable to open the database after a downgrade, and these few numbers do not need a store. */
const MS_KEY='styly-measurements';
const MS_GROUPS=[
  ['pants','البنطلون',[['waist','الوسط'],['hip','الهيب'],['thigh','الفخذ'],['leg','الرجل']]],
  ['shirt','القميص',[['chest','عرض الصدر'],['length','الطول']]],
  ['hoodie','الهودي',[['chest','عرض الصدر'],['sleeve','طول الكم'],['length','طول الهودي']]],
  ['jacket','الجاكيت',[['chest','عرض الصدر'],['shoulder','عرض الكتف'],['sleeve','طول الكم'],['length','طول الجاكيت']]]
];
function cleanMeasure(o){
  const out={};
  for(const [g,,fs] of MS_GROUPS){out[g]={};for(const [k] of fs){const v=o&&o[g]&&o[g][k];if(typeof v==='number'&&isFinite(v)&&v>0&&v<=250)out[g][k]=v}}
  return out;
}
let measures=cleanMeasure({});
try{const x=JSON.parse(localStorage.getItem(MS_KEY)||'null');if(x&&x.data)measures=cleanMeasure(x.data)}catch(e){}
function saveMeasures(){try{localStorage.setItem(MS_KEY,JSON.stringify({v:1,updated:Date.now(),data:measures}));return true}catch(e){return false}}
const msOpen={};let msBuilt=false;
function renderSizes(force){
  const el=$('#w-sizes');
  if(msBuilt&&!force)return;
  msBuilt=true;
  el.innerHTML=`<div class="page"><h2 class="h1">مقاساتي</h2><p class="sub" style="margin-top:4px">قياساتك الشخصية بالسنتيمتر (cm). بتتحفظ على الجهاز بس.</p><div class="accs">`+
   MS_GROUPS.map(([g,l,fs])=>{
     const open=!!msOpen[g],filled=fs.filter(([k])=>measures[g][k]).length;
     return `<div class="acc" data-g="${g}"><button type="button" class="acc-h" id="ah-${g}" aria-expanded="${open}" aria-controls="ab-${g}"><span>${l}${filled?` <small class="sub">· ${filled}/${fs.length}</small>`:''}</span><span class="acc-i" aria-hidden="true">${open?'−':'+'}</span></button>
      <div class="acc-b ${open?'':'hide'}" id="ab-${g}" role="region" aria-labelledby="ah-${g}">${fs.map(([k,fl])=>`<div class="fld"><label for="m-${g}-${k}">${fl} <small class="sub">(cm)</small></label><input type="number" inputmode="decimal" step="0.5" min="1" max="250" id="m-${g}-${k}" data-g="${g}" data-k="${k}" value="${measures[g][k]!==undefined?measures[g][k]:''}"></div>`).join('')}
      <div class="err hide" id="me-${g}" role="alert"></div>
      <button type="button" class="btn sm" data-save="${g}" style="margin-top:var(--sp-3)">حفظ مقاسات ${l}</button></div></div>`}).join('')+`</div></div>`;
  el.querySelectorAll('.acc-h').forEach(b=>b.onclick=()=>{
    const g=b.closest('.acc').dataset.g;msOpen[g]=!msOpen[g];
    b.setAttribute('aria-expanded',msOpen[g]);b.querySelector('.acc-i').textContent=msOpen[g]?'−':'+';
    $('#ab-'+g).classList.toggle('hide',!msOpen[g]);
  });
  el.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>saveGroup(b.dataset.save));
}
function saveGroup(g){
  const grp=MS_GROUPS.find(x=>x[0]===g),err=$('#me-'+g),next={};let bad=null;
  for(const [k,l] of grp[2]){
    const inp=$('#m-'+g+'-'+k),raw=inp.value.trim().replace(',','.');inp.removeAttribute('aria-invalid');
    if(raw==='')continue;
    const v=parseFloat(raw);
    if(!isFinite(v)||v<=0||v>250){inp.setAttribute('aria-invalid','true');bad=bad||l}else next[k]=Math.round(v*10)/10;
  }
  if(bad){err.innerHTML=ic('alert')+'<span>قيمة "'+esc(bad)+'" لازم تكون رقم بين 1 و 250 سم.</span>';err.classList.remove('hide');return}
  err.classList.add('hide');
  const prev=measures[g];measures[g]=next;
  if(!saveMeasures()){measures[g]=prev;toast('ماقدرتش أحفظ المقاسات. جرّب تاني.');return}
  for(const [k] of grp[2]){const inp=$('#m-'+g+'-'+k);inp.value=next[k]!==undefined?next[k]:''}
  const filled=Object.keys(next).length;
  $('#ah-'+g+' span:first-child').innerHTML=grp[1]+(filled?` <small class="sub">· ${filled}/${grp[2].length}</small>`:'');
  toast('اتحفظت مقاسات '+grp[1]);
}
