/* Styly core: constants, icons, helpers, theme, IndexedDB, toast / sheet / confirm.
   Data layer is unchanged from v1.2: DB "wardrobe" v2, stores items / outfits / plan. */
const APP_VERSION='1.5.1';
const TYPES={top:'قميص / تيشيرت',hoodie:'هودي',bottom:'بنطلون / شورت',outer:'جاكيت',shoes:'جزمة',acc:'إكسسوار'};
const SLOTS=[['top','فوق',false],['bottom','تحت',false],['outer','جاكيت',true],['shoes','جزمة',false]];
const DAYN=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const DAYS=['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
/* a hoodie takes the shirt/T-shirt place in the outfit: it is chosen in the "top" slot */
const SLOT_TYPES={top:['top','hoodie'],bottom:['bottom'],outer:['outer'],shoes:['shoes']};
const slotOf=t=>t==='hoodie'?'top':t;
const OCCS=['كاجوال','رسمي','رياضي','خروجة'];

/* line icons (24px grid, stroke = currentColor) */
const P={
  home:'<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
  grid:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  mix:'<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  mark:'<path d="M18 21l-6-4.5L6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/>',
  cal:'<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  cam:'<path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.8"/>',
  img:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="m21 15-5-5L5 21"/>',
  shuf:'<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  bak:'<path d="M12 4v11m0 0 4-4m-4 4-4-4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  up:'<path d="M12 16V5m0 0-4 4m4-4 4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 16v4M17 18h4"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  r:'<path d="m9 6 6 6-6 6"/>',
  l:'<path d="m15 6-6 6 6 6"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  edit:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.01"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  hoodie:'<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3"/><path d="M8 3c0 4 8 4 8 0M12 7.500V11"/>',
  shirt:'<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0Z"/>',
  pants:'<path d="M7 3h10l1 18h-4.5L12 9l-1.5 12H6Z"/>',
  jacket:'<path d="M9 3 4 6v15h6V9m5-6 5 3v15h-6V9"/><path d="M9 3h6M12 9v12"/>',
  shoe:'<path d="M3 17v-3l5-1 3-5 2 1.5c1 .8 2 1 3.5 1.3L20 14.500V17Z"/><path d="M3 17h17"/>',
  watch:'<rect x="7" y="7" width="10" height="10" rx="3"/><path d="M9 7l.7-4h4.600l.7 4M9 17l.7 4h4.600l.7-4M12 10v2.500l1.5 1"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800"/>',
  moon:'<path d="M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500Z"/>',
  auto:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'
};
const ic=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${P[n]||''}</svg>`;
const TYPE_IC={top:'shirt',hoodie:'hoodie',bottom:'pants',outer:'jacket',shoes:'shoe',acc:'watch'};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
let items=[],outfits=[],plan=[],filter='all',pick={},openId=null;

/* ---------- theme: light / dark / system, stored locally ---------- */
const THEME_KEY='styly-theme';
const getTheme=()=>{try{const t=localStorage.getItem(THEME_KEY);return t==='light'||t==='dark'?t:'system'}catch(e){return'system'}};
function applyTheme(t){
  const r=document.documentElement;
  if(t==='light'||t==='dark')r.setAttribute('data-theme',t);else r.removeAttribute('data-theme');
  try{if(t==='light'||t==='dark')localStorage.setItem(THEME_KEY,t);else localStorage.removeItem(THEME_KEY)}catch(e){}
}

/* ---------- IndexedDB (unchanged schema) ---------- */
let db;
const openDB=()=>new Promise((res,rej)=>{
  const r=indexedDB.open('wardrobe',2);
  r.onupgradeneeded=()=>{const d=r.result;
    if(!d.objectStoreNames.contains('items'))d.createObjectStore('items',{keyPath:'id',autoIncrement:true});
    if(!d.objectStoreNames.contains('outfits'))d.createObjectStore('outfits',{keyPath:'id',autoIncrement:true});
    if(!d.objectStoreNames.contains('plan'))d.createObjectStore('plan',{keyPath:'date'});};
  r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error);
});
const tx=(s,m,f)=>new Promise((res,rej)=>{const t=db.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)});
const all=s=>tx(s,'readonly',o=>o.getAll());
const put=(s,v)=>tx(s,'readwrite',o=>o.put(v));
const rm=(s,id)=>tx(s,'readwrite',o=>o.delete(id));

/* ---------- ui helpers ---------- */
let tt;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3000)}
const imgTag=i=>`<img class="${i.cut?'cut':''}" src="${i.img}" alt="">`;
const byId=id=>items.find(i=>i.id===id);
const outfitItems=o=>o.ids.map(byId).filter(Boolean);

/* focus management shared by the bottom sheet and the confirm dialog */
let lastFocus=null;
function trap(e,box){
  if(e.key!=='Tab')return;
  const f=[...box.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null);
  if(!f.length){e.preventDefault();box.focus();return}
  const a=f[0],z=f[f.length-1];
  if(e.shiftKey&&(document.activeElement===a||document.activeElement===box)){e.preventDefault();z.focus()}
  else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
}
const SHEET_TITLES={form:'قطعة',detail:'تفاصيل القطعة',pick:'اختيار طقم',settings:'الإعدادات',name:'اسم الطقم'};
function sheet(mode){
  const bg=$('#sbg'),sh=bg.querySelector('.sheet'),was=bg.classList.contains('show');
  if(mode&&!was)lastFocus=document.activeElement;
  bg.classList.toggle('show',!!mode);
  sh.scrollTop=0;
  ['form','detail','pick','name','settings'].forEach(m=>$('#m-'+m).classList.toggle('hide',m!==mode));
  document.body.style.overflow=mode?'hidden':'';
  if(mode){sh.setAttribute('aria-label',SHEET_TITLES[mode]||'');sh.focus({preventScroll:true})}
  else if(was&&lastFocus&&document.contains(lastFocus)){try{lastFocus.focus({preventScroll:true})}catch(e){}}
}
document.addEventListener('click',e=>{if(e.target.closest('[data-close]')||e.target.id==='sbg')sheet(null)});
document.addEventListener('keydown',e=>{
  if($('#dbg').classList.contains('show')){if(e.key==='Escape')closeConfirm(false);else trap(e,$('#dbg .dlg'));return}
  if($('#sbg').classList.contains('show')){if(e.key==='Escape')sheet(null);else trap(e,$('#sbg .sheet'))}
});

/* accessible confirm dialog (replaces window.confirm) */
let confirmRes=null,confirmFocus=null;
function askConfirm(title,text,okLabel,danger){
  return new Promise(res=>{
    confirmRes=res;confirmFocus=document.activeElement;
    $('#dlgT').textContent=title;$('#dlgP').textContent=text||'';
    const y=$('#dlgYes');y.textContent=okLabel||'تأكيد';y.classList.toggle('dan',!!danger);
    $('#dbg').classList.add('show');$('#dlgNo').focus();
  });
}
function closeConfirm(v){
  $('#dbg').classList.remove('show');
  const r=confirmRes;confirmRes=null;
  if(confirmFocus&&document.contains(confirmFocus)){try{confirmFocus.focus({preventScroll:true})}catch(e){}}
  if(r)r(v);
}
$('#dlgYes').onclick=()=>closeConfirm(true);
$('#dlgNo').onclick=()=>closeConfirm(false);
$('#dbg').addEventListener('click',e=>{if(e.target.id==='dbg')closeConfirm(false)});

/* dates */
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parse=k=>new Date(k+'T00:00:00');
