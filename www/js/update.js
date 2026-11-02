/* In-app updates. The app asks GitHub for the latest release, compares versions and (on Android)
   downloads the APK itself and hands it to the system installer. Only a version check goes over the network;
   no user data is sent. Needs "install unknown apps" to be allowed once for Styly. */
const REPO='shawady6/styly',UPD_KEY='styly-update-check';
let upd={state:'idle',info:null,pct:0,err:''};   /* idle | checking | none | available | downloading | installing | error */
const verParts=v=>String(v||'').replace(/^v/,'').split('.').map(n=>parseInt(n,10)||0);
function verGt(a,b){const x=verParts(a),y=verParts(b);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return(x[i]||0)>(y[i]||0)}return false}
const isNative=()=>!!nativePlugin('Filesystem');
async function checkUpdate(silent){
  if(upd.state==='downloading'||upd.state==='installing')return;
  if(silent){try{if(Date.now()-(+localStorage.getItem(UPD_KEY)||0)<6*36e5)return}catch(e){}}
  upd={...upd,state:'checking',err:''};renderUpdate();
  try{
    const r=await fetch('https://api.github.com/repos/'+REPO+'/releases/latest',{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!r.ok)throw new Error('http '+r.status);
    const j=await r.json(),m=/Styly-Version:\s*([0-9]+(?:\.[0-9]+){1,2})/i.exec(j.body||''),a=(j.assets||[]).find(x=>/\.apk$/i.test(x.name));
    try{localStorage.setItem(UPD_KEY,String(Date.now()))}catch(e){}
    if(m&&a&&verGt(m[1],APP_VERSION))upd={state:'available',info:{version:m[1],url:a.browser_download_url,size:a.size||0},pct:0,err:''};
    else upd={state:'none',info:null,pct:0,err:''};
  }catch(e){upd={state:'error',info:null,pct:0,err:silent?'':'ماقدرتش أتأكد من التحديثات. اتأكد إنك متصل بالنت.'};if(silent)upd.state='idle'}
  renderUpdate();updateDot();if(curTab==='home')renderHome();
}
async function installUpdate(){
  const a=upd.info;if(!a)return;
  const FS=nativePlugin('Filesystem'),FO=nativePlugin('FileOpener');
  if(!FS||!FO){window.open(a.url,'_blank');return}
  upd={...upd,state:'downloading',pct:0,err:''};renderUpdate();
  let h=null;
  try{
    const name='Styly-update.apk';
    try{await FS.deleteFile({path:name,directory:'CACHE'})}catch(e){}
    try{h=await FS.addListener('progress',e=>{if(e&&e.contentLength){upd.pct=Math.min(99,Math.round(e.bytes/e.contentLength*100));renderUpdate()}})}catch(e){}
    await FS.downloadFile({url:a.url,path:name,directory:'CACHE',progress:true});
    const u=await FS.getUri({path:name,directory:'CACHE'});
    upd={...upd,state:'installing',pct:100};renderUpdate();
    await FO.open({filePath:u.uri,contentType:'application/vnd.android.package-archive',openWithDefault:true});
    toast('اتفتح المثبّت. اضغط تثبيت.');
  }catch(e){
    const m=String((e&&e.message)||e);
    upd={...upd,state:'available',err:/not found|activity/i.test(m)?'ماقدرتش أفتح المثبّت. اسمح للتطبيق يثبّت تطبيقات من الإعدادات وجرّب تاني.':'التحميل فشل. جرّب تاني.'};
  }finally{if(h&&h.remove)try{h.remove()}catch(e){}}
  renderUpdate();
}
function renderUpdate(){
  const el=document.getElementById('updBox');if(!el)return;
  const s=upd.state,i=upd.info,mb=i&&i.size?' ('+(i.size/1048576).toFixed(1)+' MB)':'';
  let h='';
  if(s==='checking')h='<p class="sub"><span class="spin" style="display:inline-block;vertical-align:-3px"></span> بدوّر على تحديث…</p>';
  else if(s==='none')h='<p class="sub">أنت على آخر نسخة ('+APP_VERSION+').</p>';
  else if(s==='available'||s==='downloading'||s==='installing'){
    h=`<p><b>في نسخة جديدة: ${esc(i.version)}</b>${mb}</p>`;
    if(s==='available')h+=`<button class="btn" id="updGo" type="button">${isNative()?'حمّل وثبّت التحديث':'نزّل التحديث'}</button>`;
    else h+=`<div class="progress" role="progressbar" aria-valuenow="${upd.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${upd.pct}%"></i></div><p class="sub">${s==='installing'?'جاهز للتثبيت…':'بنزّل '+upd.pct+'%'}</p>`;
  }
  if(upd.err)h+=`<p class="err">${esc(upd.err)}</p>`;
  if(s!=='checking'&&s!=='downloading'&&s!=='installing')h+=`<button class="btn ghost sm" id="updChk" type="button" style="margin-top:8px">افحص التحديثات</button>`;
  el.innerHTML=h;
  const g=document.getElementById('updGo');if(g)g.onclick=installUpdate;
  const c=document.getElementById('updChk');if(c)c.onclick=()=>checkUpdate(false);
}
