/* Styly settings, backup / restore, init. Backup format v1 is unchanged; "colorLearning" is an optional extra key. */
const LB='styly-last-backup';
const lastBackup=()=>{try{return +localStorage.getItem(LB)||0}catch(e){return 0}};
function markBackup(){try{localStorage.setItem(LB,String(Date.now()))}catch(e){}updateDot()}
function updateDot(){$('#setBtn').classList.toggle('dot',(items.length>0&&(Date.now()-lastBackup()>14*864e5))||upd.state==='available')}
function nativePlugin(n){const C=window.Capacitor;try{if(C&&C.isNativePlatform&&C.isNativePlatform())return(C.Plugins&&C.Plugins[n])||C.registerPlugin(n)}catch(e){}return null}
async function buildBackup(){
  return JSON.stringify({app:'styly',v:1,date:new Date().toISOString(),items:await all('items'),outfits:await all('outfits'),plan:await all('plan'),prefs,colorLearning:learned});
}
function chunks(str,n){
  const out=[];let i=0;
  while(i<str.length){let j=Math.min(str.length,i+n);if(j<str.length){const c=str.charCodeAt(j-1);if(c>=0xD800&&c<=0xDBFF)j--}out.push(str.slice(i,j));i=j}
  return out;
}

/* ---------- settings ---------- */
const THEMES=[['light','فاتح','sun'],['dark','داكن','moon'],['system','تلقائي','auto']];
function drawTheme(){
  const cur=getTheme();
  $('#themeSeg').innerHTML=THEMES.map(([k,l,i])=>`<button type="button" role="radio" aria-checked="${cur===k}" class="${cur===k?'on':''}" data-k="${k}">${l}</button>`).join('');
  $('#themeSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{applyTheme(b.dataset.k);drawTheme()});
}
function openSettings(){
  const lb=lastBackup();
  drawTheme();
  $('#bkInfo').textContent=items.length+' قطعة · '+outfits.length+' طقم · '+(lb?'آخر نسخة: '+new Date(lb).toLocaleDateString('ar-EG'):'لسه ماعملتش نسخة');
  $('#bkExport').innerHTML=ic('up')+'<span>حفظ نسخة احتياطية</span>';
  $('#bkImport').innerHTML=ic('bak')+'<span>استرجاع من نسخة</span>';
  $('#learnInfo').textContent=learned.length?('اتعلّم '+learned.length+' تصحيح لأسماء الألوان'):'لسه مفيش تصحيحات متعلَّمة';
  $('#learnReset').disabled=!learned.length;
  $('#verInfo').textContent='Styly '+APP_VERSION;
  renderUpdate();sheet('settings');
}
$('#setBtn').onclick=openSettings;
$('#learnReset').onclick=async()=>{
  if(!await askConfirm('مسح التعلّم؟','هيتمسح اللي اتعلّمه التطبيق من تصحيحاتك لأسماء الألوان. أسماء القطع المحفوظة مش هتتأثر.','مسح',true))return;
  resetLearning();openSettings();toast('اتمسح التعلّم');
};
$('#bkExport').onclick=async()=>{
  const json=await buildBackup(),name='styly-backup-'+iso(new Date())+'.json';
  const FS=nativePlugin('Filesystem'),SH=nativePlugin('Share');
  if(FS&&SH){
    try{
      const parts=chunks(json,1500000);
      await FS.writeFile({path:name,data:parts[0],directory:'CACHE',encoding:'utf8'});
      for(const part of parts.slice(1))await FS.appendFile({path:name,data:part,directory:'CACHE',encoding:'utf8'});
      const r=await FS.getUri({path:name,directory:'CACHE'});
      await SH.share({title:'نسخة Styly الاحتياطية',dialogTitle:'احفظ النسخة الاحتياطية',url:r.uri});
      markBackup();sheet(null);toast('اتعملت النسخة. اتأكد إنك حفظتها في مكان آمن.');
    }catch(e){
      if(!/cancel/i.test(String((e&&e.message)||e)))toast('ماقدرتش أعمل النسخة. جرّب تاني.');
    }
    return;
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.download=name;
  document.body.appendChild(a);a.click();a.remove();markBackup();sheet(null);toast('اتنزلت النسخة');
};
$('#bkImport').onclick=()=>$('#bkFile').click();
$('#bkFile').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  let d;try{d=JSON.parse(await f.text())}catch(x){toast('الملف ده مش نسخة Styly صحيحة');return}
  if(!d||d.app!=='styly'||!Array.isArray(d.items)){toast('الملف ده مش نسخة Styly صحيحة');return}
  if(!await askConfirm('استبدال الدولاب الحالي؟','هتستبدل الدولاب الحالي ('+items.length+' قطعة) بالنسخة ('+d.items.length+' قطعة، '+(d.outfits||[]).length+' طقم). الحالي هيتمسح.','استبدال',true))return;
  for(const st of ['items','outfits','plan'])await tx(st,'readwrite',o=>o.clear());
  for(const i of d.items)await put('items',i);
  for(const o of d.outfits||[])await put('outfits',o);
  for(const q of d.plan||[])await put('plan',q);
  prefs=d.prefs||{};try{localStorage.setItem('styly-prefs',JSON.stringify(prefs))}catch(x){}
  learned=Array.isArray(d.colorLearning)?d.colorLearning.filter(s=>s&&Array.isArray(s.lab)&&typeof s.label==='string'):learned;saveLearned();
  items=await all('items');outfits=await all('outfits');plan=await all('plan');pick={};
  sheet(null);tab('home');updateDot();toast('اتسترجع الدولاب: '+items.length+' قطعة');
};

/* ---------- init ---------- */
(async()=>{
  await openDB();items=await all('items');outfits=await all('outfits');plan=await all('plan');
  tab('home');updateDot();checkUpdate(true);
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  /* the Android app ships its web files inside the APK: a cache-first service worker there only risks showing stale UI */
  const native=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
  if('serviceWorker'in navigator){
    if(native)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
    else if(location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();
