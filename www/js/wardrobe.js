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
function addFromSuggestion(type,color,label,occ){
  askConfirm('تضيف القطعة للدولاب؟','هتفتح لك شاشة الإضافة ومعاها النوع واللون. مفيش حاجة بتتحفظ غير لما تختار صورة وتضغط حفظ.','افتح الإضافة').then(ok=>{
    if(!ok)return;newItem(type,{color,name:label,occ});
  });
}

/* ---------- محتاج إيه؟ ---------- */
const ocnt=(n,w)=>n===0?'ولا '+w:n===1?w+' واحد':n+' '+w;
function gapCard(r){
  if(!r.gaps)return '';
  const rows=r.gaps.rows;if(rows.length<2)return '';
  const max=Math.max(1,r.gaps.max),weak=new Set(r.gaps.gaps.map(g=>g.occ));
  return `<div class="sec-h" style="margin-top:var(--sp-5)"><h2>أطقمك حسب المناسبة</h2></div><div class="gapc">${rows.map(x=>`<div class="gapr ${weak.has(x.occ)?'weak':''}"><span class="gl">${esc(x.occ)}</span><span class="gbar"><i style="width:${Math.max(3,Math.round(x.n/max*100))}%"></i></span><b>${x.n}</b></div>`).join('')}</div>`+
    (r.gaps.gaps.length?`<p class="hint">ضعيف: ${r.gaps.gaps.map(g=>esc(g.occ)+' ('+g.n+' بس)').join('، ')} — الاقتراحات تحت بتركّز على سد الفجوة دي.</p>`:`<p class="hint">توزيعك على المناسبات متوازن.</p>`);
}
function pivotCard(r){
  if(!r.base)return '';
  const pv=pivots(r.base),tile=i=>`<div class="pvt"><div class="pic">${imgTag(i)}</div><small>${esc(i.name||TYPES[i.type])}</small><span class="pill ${pv.n(i)>=3?'g':'b'}">${pv.n(i)} طقم</span></div>`;
  let h='';
  if(pv.strong.length)h+=`<div class="sec-h" style="margin-top:var(--sp-5)"><h2>القطع اللي شايلة دولابك</h2></div><div class="pvg">${pv.strong.map(tile).join('')}</div><p class="hint">دي أكتر قطع داخلة في أطقم. لو هتشتري، اشتري حاجة تتلبس معاها.</p>`;
  if(pv.weak.length)h+=`<div class="sec-h" style="margin-top:var(--sp-5)"><h2>قطع بتتلبس مع قليل</h2></div><div class="pvg">${pv.weak.map(tile).join('')}</div><p class="hint">دي داخلة في طقم واحد أو مفيش. فكّر قبل ما تشتري حاجة شبهها، أو اشتري اللي يكمّلها.</p>`;
  return h;
}
function renderNeed(){
  const el=$('#w-need'),its=items.filter(i=>i.type!=='acc'),d=dataLevel(its);
  let h=`<div class="page"><h2 class="h1">محتاج إيه؟</h2><p class="sub" style="margin-top:4px">بجرّب قطع افتراضية على دولابك (من غير ما أحفظ حاجة) وأشوف إيه اللي هيسد فجوة حقيقية عندك.</p>`+limitedNote(d);
  if(d.level==='none'){el.innerHTML=h+'</div>';return}
  const base=baseline(its);
  const cnt=k=>base.L[k].length;
  h+=`<div class="stats" style="margin-top:var(--sp-4)"><div class="stat"><b>${base.count}</b><span>طقم حالي</span></div><div class="stat"><b>${base.unused.length}</b><span>قطعة برا الأطقم</span></div><div class="stat"><b>${its.length}</b><span>قطعة</span></div></div>
    <p class="hint">فوق ${cnt('top')} · تحت ${cnt('bottom')} · جزمة ${cnt('shoes')} · جاكيت ${cnt('outer')} — الطقم المقبول تناسقه ${GOOD}% أو أكتر، والمكرر بيتحسب مرة واحدة.</p>
    <div id="needRes" class="sec"><p class="sub"><span class="spin" style="display:inline-block;vertical-align:-3px"></span> بحلل الدولاب…</p></div></div>`;
  el.innerHTML=h;
  setTimeout(()=>{   /* let the spinner paint before the heavy loop */
    const r=analyzeNeeds(its),box=$('#needRes');if(!box||wsec!=='need')return;
    let o=gapCard(r);
    if(r.suggestions.length)o+=`<div class="sec-h" style="margin-top:var(--sp-5)"><h2>الأهم تشتريه</h2></div><div class="outs" style="padding:0">`+r.suggestions.map((s,n)=>suggestionCard(s,n+1,r.base)).join('')+'</div>';
    else{
      o+=`<div class="note" style="margin-top:var(--sp-4)">${ic('check')}<div><b>دولابك متوازن.</b> مفيش فجوة في مناسبة ولا نوع ناقص، ومش هقترح حاجة لمجرد الملء.${r.boosts&&r.boosts.length?' لو لسه عايز تزوّد، دي أحسن إضافة:':''}</div></div>`;
      if(r.boosts&&r.boosts.length)o+=`<div class="outs" style="padding:0;margin-top:var(--sp-3)">`+r.boosts.map((s,n)=>suggestionCard(s,n+1,r.base)).join('')+'</div>';
    }
    box.innerHTML=o+pivotCard(r);
    box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addFromSuggestion(b.dataset.t,b.dataset.c,b.dataset.l,b.dataset.o));
  },30);
}
/* plain-language reason: what gap it fills, with before -> after, not just a count */
function reasonOf(s,base,its){
  const p=[],w=SLOT_LBL[slotKey(s.v.type)];
  if(base.count===0)p.push('دلوقتي مفيش ولا طقم كامل مقبول');
  if(s.kind==='gap'||s.gapGain)p.push(`بتسد فجوة في أطقم <b>${esc(s.occ)}</b>: عندك ${s.before?'<b>'+s.before+'</b> طقم':'ولا طقم'}، وهتبقى <b>${s.before+s.gapGain}</b>`);
  else if(s.kind==='slot')p.push(`عندك ${ocnt(s.have,w)} بس، والقطعة دي هتفتح <b>${s.count}</b> طقم جديد`);
  else p.push(`هتفتح <b>${s.count}</b> طقم جديد بمتوسط تناسق ${s.avg}%`);
  if(s.unlocked)p.push(`وهتشغّل ${s.unlocked} قطعة واقفة مش داخلة في أي طقم`);
  return p.join('، ')+'.';
}
function suggestionCard(s,rank,base){
  const its=items.filter(i=>i.type!=='acc'),name=kindLabel(s.v.type,s.occ)+' '+s.label;
  return `<div class="out"><div class="hd"><b><span class="rk">${rank}</span> <i class="dotc" style="background:${s.v.color};display:inline-block;vertical-align:-1px"></i> ${esc(name)}</b><span class="pill g">+${s.count} طقم</span></div>
    <p class="sub" style="margin-bottom:var(--sp-3)">${reasonOf(s,base,its)}</p>
    ${s.alts&&s.alts.length?`<p class="hint" style="margin-top:0">ألوان بديلة بنفس القيمة تقريبًا: ${s.alts.map(esc).join('، ')}</p>`:''}
    ${s.examples.map(o=>`<div style="margin-bottom:var(--sp-3)">${outfitRow(o)}<p class="hint">${exNames(o)} · ${o.score}%</p></div>`).join('')}
    <button class="btn ghost sm" data-add="1" data-t="${s.v.type}" data-c="${s.v.color}" data-o="${esc(s.occ)}" data-l="${esc(name)}" type="button">${ic('plus')}<span>ضيفها للدولاب</span></button></div>`;
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
    <div class="two"><div><label class="f" for="bOcc">نوع القطعة / الاستخدام</label><select id="bOcc"><option value="auto">أنسب استخدام (تلقائي)</option>${occsFor(buy.type).map(o=>`<option value="${o}">${esc(kindLabel(buy.type,o))}</option>`).join('')}</select></div>
    <div><label class="f" for="bSea">الموسم</label><select id="bSea"><option value="auto">حسب النوع</option>${['كل السنة','صيف','شتا','مواسم انتقالية'].map(o=>`<option ${buy.season===o?'selected':''}>${o}</option>`).join('')}</select></div></div>
    <div class="err hide" id="bErr" role="alert"></div>
    <button class="btn" id="bGo" type="button" style="margin-top:var(--sp-4)">${ic('mix')}<span>قارن الألوان</span></button><div id="bRes" class="sec"></div></div>`;
  el.innerHTML=h;
  $('#bOcc').value=buy.occ;$('#bSea').value=buy.season;
  $('#bType').querySelectorAll('button').forEach(b=>b.onclick=()=>{buy.type=b.dataset.k;if(!occsFor(buy.type).includes(buy.occ))buy.occ='auto';buy.res=null;renderBuy()});
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
function buyReason(best,second,base,use){
  let t=`${best.label} هتفتح <b>${best.count}</b> طقم جديد (متوسط تناسق ${best.avg}%)`;
  if(best.gapGain)t+=`، وبتسد فجوة في أطقم ${esc(use)} (عندك ${best.before||'ولا'} طقم، هتبقى ${best.before+best.gapGain})`;
  if(second&&best.count>second.count)t+=` — أكتر من ${second.label} بـ ${best.count-second.count}`;
  else if(second&&best.count===second.count)t+=` — بنفس عدد ${second.label} لكن تناسقها وتنوعها أحسن`;
  if(best.unlocked)t+=`، وبتشغّل ${best.unlocked} قطعة مش داخلة في أي طقم`;
  return t+'.';
}
const verdictOf=b=>b.gapGain&&b.before<2?['g','بتسد فجوة مهمة']:b.count>=8?['g','إضافة قوية']:b.count>=3?['m','إضافة معقولة']:['b','إضافة ضعيفة — فكّر تاني'];
function drawBuyRes(){
  const r=buy.res,box=$('#bRes');if(!box||!r)return;
  const best=r.results[0],second=r.results[1],use=r.use,kn=kindLabel(r.type,use);
  if(r.results.every(x=>x.count===0)){
    box.innerHTML=`<div class="note">${ic('info')}<div><b>مفيش لون فيهم هيفتح أطقم جديدة (${esc(kn)}).</b> ممكن لأنه متكرر عندك بنفس الألوان، أو ناقصك قطع تانية (فوق / تحت / جزمة) تكمّل بيها الطقم، أو الموسم/الاستخدام مش مناسبين. جرّب استخدام تاني من القايمة.</div></div>`;return;
  }
  const tie=r.results.length>1&&r.results.every(x=>x.count===best.count&&Math.abs(x.avg-best.avg)<=1);
  const vd=verdictOf(best),autoNote=buy.occ==='auto'?`<p class="hint" style="margin-top:var(--sp-2)">الاستخدام اخترته تلقائي: ${esc(kn)}${best.gapGain?' (لأن عندك فجوة فيه)':''}. تقدر تغيّره من القايمة فوق.</p>`:'';
  let h=`<div class="note" style="border-color:var(--accent)">${ic('check')}<div><b>الأفضل: ${esc(kn)} ${esc(best.label)}</b> <span class="pill ${vd[0]}">${vd[1]}</span><br>${tie?'الألوان متقاربة جدًا في القيمة؛ اختار اللي بتحبه. ':''}${buyReason(best,second,r.base,use)}</div></div>
    <div class="sec-h" style="margin-top:var(--sp-5)"><h2>المقارنة</h2></div>
    <div class="cmp">${r.results.map((x,n)=>`<div class="cmpc ${n===0?'best':''}"><i class="dotc" style="background:${x.hex};width:22px;height:22px"></i><b>${esc(x.label)}</b><span class="pill ${n===0?'g':''}">${x.count} طقم</span><small>تناسق ${x.avg}%</small><small>تنوع ${x.touched} قطعة</small><small>مكرر ${x.repeats}</small></div>`).join('')}</div>
    ${autoNote}<p class="hint">طقم جديد = مقبول التناسق (≥ ${GOOD}%) ومش مكرر لحاجة موجودة. التنوع = عدد قطعك اللي هتدخل في الأطقم الجديدة. المكرر = تركيبات اتشالت لأنها شبه أطقم موجودة.</p>`;
  h+=r.results.map(x=>{
    const rj=x.rejected,notes=[];if(rj.season)notes.push(rj.season+' تركيبة اتلغت لتعارض الموسم');if(rj.occ)notes.push(rj.occ+' تركيبة اتلغت لاختلاف المناسبة');
    return `<div class="out" style="margin-top:var(--sp-3)"><div class="hd"><b><i class="dotc" style="background:${x.hex};display:inline-block;vertical-align:-1px"></i> ${esc(x.label)}</b><span class="pill ${x.count?'g':'b'}">${x.count} طقم</span></div>
      ${x.gapGain?`<p class="sub" style="margin-bottom:var(--sp-2)">بتسد فجوة في أطقم ${esc(use)}: ${x.before} ← ${x.before+x.gapGain} طقم.</p>`:''}
      ${x.examples.length?x.examples.map(o=>`<div style="margin-bottom:var(--sp-3)">${outfitRow(o)}<p class="hint">${exNames(o)} · ${o.score}%</p></div>`).join(''):'<p class="sub">مفيش أطقم جديدة بالون ده.</p>'}
      ${notes.length?`<p class="hint">${notes.join(' · ')}</p>`:''}
      ${x.count?`<button class="btn ghost sm" data-add="1" data-t="${r.type}" data-c="${x.hex}" data-o="${esc(use)}" data-l="${esc(kn+' '+x.label)}" type="button">${ic('plus')}<span>ضيفها للدولاب</span></button>`:''}</div>`}).join('');
  box.innerHTML=h;
  box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addFromSuggestion(b.dataset.t,b.dataset.c,b.dataset.l,b.dataset.o));
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
const XK=/^x[a-z0-9]{1,12}$/,IDK=/^[a-z0-9]{1,12}$/,MAXI=30,MAXF=20;
const okVal=v=>typeof v==='number'&&isFinite(v)&&v>0&&v<=250;
const okLbl=l=>typeof l==='string'&&l.trim().length>0&&l.length<=30;
const cleanFields=(arr,re)=>Array.isArray(arr)?arr.filter(f=>Array.isArray(f)&&re.test(f[0])&&okLbl(f[1])).slice(0,MAXF).map(f=>[f[0],f[1].trim()]):[];
function cleanMeasure(o){
  const out={extra:{},items:[]};
  for(const [g,,fs] of MS_GROUPS){
    const ex=cleanFields(o&&o.extra&&o.extra[g],XK);
    if(ex.length)out.extra[g]=ex;
    out[g]={};
    for(const [k] of fs.concat(ex)){const v=o&&o[g]&&o[g][k];if(okVal(v))out[g][k]=v}
  }
  if(o&&Array.isArray(o.items))for(const it of o.items.slice(0,MAXI)){
    if(!it||!IDK.test(it.id)||!okLbl(it.name))continue;
    const fields=cleanFields(it.fields,IDK),values={};
    for(const [k] of fields){const v=it.values&&it.values[k];if(okVal(v))values[k]=v}
    out.items.push({id:it.id,name:it.name.trim(),fields,values});
  }
  return out;
}
let measures=cleanMeasure({});
try{const x=JSON.parse(localStorage.getItem(MS_KEY)||'null');if(x&&x.data)measures=cleanMeasure(x.data)}catch(e){}
function saveMeasures(){try{localStorage.setItem(MS_KEY,JSON.stringify({v:1,updated:Date.now(),data:measures}));return true}catch(e){return false}}
const msOpen={};let msBuilt=false,msDraft={};
const rid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-3);
function msDefs(){
  const a=MS_GROUPS.map(([g,l,fs])=>({g,label:l,fields:fs.map(f=>[f[0],f[1],false]).concat((measures.extra[g]||[]).map(f=>[f[0],f[1],true])),vals:measures[g],custom:false}));
  return a.concat(measures.items.map(it=>({g:'c_'+it.id,label:it.name,fields:it.fields.map(f=>[f[0],f[1],true]),vals:it.values,custom:true,item:it})));
}
function msSnap(){document.querySelectorAll('#w-sizes input[data-g]').forEach(i=>{msDraft[i.dataset.g+'|'+i.dataset.k]=i.value})}
function msRedraw(){msSnap();renderSizes(true)}
function renderSizes(force){
  const el=$('#w-sizes');
  if(msBuilt&&!force)return;
  msBuilt=true;
  const defs=msDefs();
  el.innerHTML=`<div class="page"><h2 class="h1">مقاساتي</h2><p class="sub" style="margin-top:4px">قياساتك الشخصية بالسنتيمتر (cm). بتتحفظ على الجهاز بس.</p><div class="accs">`+
   defs.map(({g,label:l,fields:fs,vals,custom})=>{
     const open=!!msOpen[g],filled=fs.filter(([k])=>vals[k]).length;
     return `<div class="acc" data-g="${g}"><button type="button" class="acc-h" id="ah-${g}" aria-expanded="${open}" aria-controls="ab-${g}"><span>${esc(l)}${filled?` <small class="sub">· ${filled}/${fs.length}</small>`:''}</span><span class="acc-i" aria-hidden="true">${open?'−':'+'}</span></button>
      <div class="acc-b ${open?'':'hide'}" id="ab-${g}" role="region" aria-labelledby="ah-${g}">${fs.length?'':'<p class="hint">لسه مفيش مقاسات. أضف أول مقاس من تحت.</p>'}${fs.map(([k,fl,x])=>{const dk=g+'|'+k,dv=dk in msDraft?msDraft[dk]:(vals[k]!==undefined?vals[k]:'');return `<div class="fld"><label for="m-${g}-${k}">${esc(fl)} <small class="sub">(cm)</small></label><div class="fld-r"><input type="number" inputmode="decimal" step="0.5" min="1" max="250" id="m-${g}-${k}" data-g="${g}" data-k="${k}" value="${esc(String(dv))}">${x?`<button type="button" class="btn ghost sm" data-delf="${g}" data-k="${k}" aria-label="حذف مقاس ${esc(fl)}">حذف</button>`:''}</div></div>`}).join('')}
      <div class="err hide" id="me-${g}" role="alert"></div>
      <button type="button" class="btn sm" data-save="${g}" style="margin-top:var(--sp-3)">حفظ مقاسات ${esc(l)}</button>
      <div class="addf"><label class="f" for="nf-${g}">مقاس جديد لـ${esc(l)}</label><div class="fld-r"><input type="text" id="nf-${g}" maxlength="30" placeholder="مثال: الرقبة" autocomplete="off"><button type="button" class="btn ghost sm" data-addf="${g}">إضافة مقاس</button></div></div>
      ${custom?`<button type="button" class="btn dan sm" data-deli="${g}" style="margin-top:var(--sp-3)">حذف ${esc(l)}</button>`:''}</div></div>`}).join('')+
   `</div><div class="addi"><div style="padding:var(--sp-4)"><label class="f" for="ni">عنصر جديد بمقاساته (جاكيت شتوي، بدلة، حذاء...)</label><div class="fld-r"><input type="text" id="ni" maxlength="40" placeholder="اسم العنصر" autocomplete="off"><button type="button" class="btn sm" id="addItem">إضافة عنصر</button></div><div class="err hide" id="ni-err" role="alert"></div></div></div></div>`;
  msDraft={};
  el.querySelectorAll('.acc-h').forEach(b=>b.onclick=()=>{
    const g=b.closest('.acc').dataset.g;msOpen[g]=!msOpen[g];
    b.setAttribute('aria-expanded',msOpen[g]);b.querySelector('.acc-i').textContent=msOpen[g]?'−':'+';
    $('#ab-'+g).classList.toggle('hide',!msOpen[g]);
  });
  el.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>saveGroup(b.dataset.save));
  el.querySelectorAll('[data-addf]').forEach(b=>b.onclick=()=>addField(b.dataset.addf));
  el.querySelectorAll('[data-delf]').forEach(b=>b.onclick=()=>delField(b.dataset.delf,b.dataset.k));
  el.querySelectorAll('[data-deli]').forEach(b=>b.onclick=()=>delItem(b.dataset.deli));
  $('#addItem').onclick=addItem;
  el.querySelectorAll('input[type=text]').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();(i.id==='ni'?$('#addItem'):i.parentNode.querySelector('[data-addf]')).click()}});
}
function msErr(id,msg){const e=$('#'+id);e.innerHTML=ic('alert')+'<span>'+esc(msg)+'</span>';e.classList.remove('hide')}
function addField(g){
  const d=msDefs().find(x=>x.g===g),inp=$('#nf-'+g),name=inp.value.trim().replace(/\s+/g,' ');
  if(!name){msErr('me-'+g,'اكتب اسم المقاس الأول.');return}
  if(name.length>30){msErr('me-'+g,'الاسم طويل (30 حرف بالكتير).');return}
  if(d.fields.some(f=>f[1]===name)){msErr('me-'+g,'المقاس ده موجود بالفعل.');return}
  if(d.fields.length>=MAXF){msErr('me-'+g,'وصلت للحد الأقصى من المقاسات ('+MAXF+').');return}
  const k=d.custom?rid():'x'+rid(),snap=JSON.stringify(measures);
  if(d.custom)d.item.fields.push([k,name]);else(measures.extra[g]=measures.extra[g]||[]).push([k,name]);
  if(!saveMeasures()){measures=cleanMeasure(JSON.parse(snap));toast('ماقدرتش أحفظ المقاس. جرّب تاني.');return}
  msOpen[g]=true;msRedraw();toast('اتضاف مقاس '+name);
  setTimeout(()=>{const n=$('#m-'+g+'-'+k);if(n)n.focus()},0);
}
function delField(g,k){
  const d=msDefs().find(x=>x.g===g),f=d&&d.fields.find(x=>x[0]===k);if(!f)return;
  askConfirm('تحذف مقاس "'+f[1]+'"؟','القيمة المحفوظة ليه هتتمسح.','احذف',true).then(ok=>{
    if(!ok)return;
    const snap=JSON.stringify(measures);
    if(d.custom){d.item.fields=d.item.fields.filter(x=>x[0]!==k);delete d.item.values[k]}
    else{measures.extra[g]=(measures.extra[g]||[]).filter(x=>x[0]!==k);delete measures[g][k];if(!measures.extra[g].length)delete measures.extra[g]}
    delete msDraft[g+'|'+k];
    if(!saveMeasures()){measures=cleanMeasure(JSON.parse(snap));toast('ماقدرتش أحفظ التغيير.');return}
    msRedraw();toast('اتحذف المقاس');
  });
}
function addItem(){
  const inp=$('#ni'),name=inp.value.trim().replace(/\s+/g,' ');
  if(!name){msErr('ni-err','اكتب اسم العنصر الأول.');return}
  if(name.length>40){msErr('ni-err','الاسم طويل (40 حرف بالكتير).');return}
  if(msDefs().some(d=>d.label===name)){msErr('ni-err','العنصر ده موجود بالفعل.');return}
  if(measures.items.length>=MAXI){msErr('ni-err','وصلت للحد الأقصى من العناصر ('+MAXI+').');return}
  const id=rid(),snap=JSON.stringify(measures);
  measures.items.push({id,name,fields:[],values:{}});
  if(!saveMeasures()){measures=cleanMeasure(JSON.parse(snap));toast('ماقدرتش أحفظ العنصر. جرّب تاني.');return}
  msOpen['c_'+id]=true;msRedraw();toast('اتضاف '+name);
  setTimeout(()=>{const n=$('#nf-c_'+id);if(n)n.focus()},0);
}
function delItem(g){
  const d=msDefs().find(x=>x.g===g);if(!d)return;
  askConfirm('تحذف "'+d.label+'"؟','العنصر وكل مقاساته هيتمسحوا.','احذف',true).then(ok=>{
    if(!ok)return;
    const snap=JSON.stringify(measures);
    measures.items=measures.items.filter(x=>x!==d.item);
    if(!saveMeasures()){measures=cleanMeasure(JSON.parse(snap));toast('ماقدرتش أحفظ التغيير.');return}
    delete msOpen[g];msRedraw();toast('اتحذف '+d.label);
  });
}
function saveGroup(g){
  const d=msDefs().find(x=>x.g===g),err=$('#me-'+g),next={};let bad=null;
  for(const [k,l] of d.fields){
    const inp=$('#m-'+g+'-'+k),raw=inp.value.trim().replace(',','.');inp.removeAttribute('aria-invalid');
    if(raw==='')continue;
    const v=parseFloat(raw);
    if(!isFinite(v)||v<=0||v>250){inp.setAttribute('aria-invalid','true');bad=bad||l}else next[k]=Math.round(v*10)/10;
  }
  if(bad){err.innerHTML=ic('alert')+'<span>قيمة "'+esc(bad)+'" لازم تكون رقم بين 1 و 250 سم.</span>';err.classList.remove('hide');return}
  err.classList.add('hide');
  const prev=d.custom?d.item.values:measures[g];
  if(d.custom)d.item.values=next;else measures[g]=next;
  if(!saveMeasures()){if(d.custom)d.item.values=prev;else measures[g]=prev;toast('ماقدرتش أحفظ المقاسات. جرّب تاني.');return}
  for(const [k] of d.fields){const inp=$('#m-'+g+'-'+k);inp.value=next[k]!==undefined?next[k]:''}
  const filled=Object.keys(next).length;
  $('#ah-'+g+' span:first-child').innerHTML=esc(d.label)+(filled?` <small class="sub">· ${filled}/${d.fields.length}</small>`:'');
  toast('اتحفظت مقاسات '+d.label);
}
