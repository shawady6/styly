/* Styly color engine.
   Everything from "known color pairings" down (RULES, pairScore, outfitScore, prefs) is copied
   verbatim from v1.2 so scoring is unchanged. Only naming / palette / learning is new in Phase 1. */
const hex2=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
function toHSL(hex){
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;
  let h=0,s=0;
  if(d){s=d/(1-Math.abs(2*l-1));
    h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}
  return{h,s,l};
}
function toLab(hex){
  const f=c=>{c/=255;return c>.04045?Math.pow((c+.055)/1.055,2.4):c/12.92};
  const r=f(parseInt(hex.slice(1,3),16)),g=f(parseInt(hex.slice(3,5),16)),b=f(parseInt(hex.slice(5,7),16));
  let x=(r*.4124+g*.3576+b*.1805)/.95047,y=r*.2126+g*.7152+b*.0722,z=(r*.0193+g*.1192+b*.9505)/1.08883;
  const t=v=>v>.008856?Math.cbrt(v):7.787*v+16/116;
  x=t(x);y=t(y);z=t(z);return[116*y-16,500*(x-y),200*(y-z)];
}
/* tags: BK black, WH white, GY greys, WM warm neutrals (cream/beige/camel/khaki), BR browns, NV navy, BL denim blue, LB sky,
   TL teal, MT mint, GN greens, OL olive, YL yellows, OR orange, PC peach, CO coral, RS terracotta, RD red, BD burgundy, PK pinks, PU purples
   Row = [canonical name (used by RULES), hex, tag, optional display label]. Extra rows only add finer display names
   for shades that map to an existing canonical name, so pairing rules keep working. */
const PAL=[
['أسود','#1b1b1d','BK'],['فحمي','#383c42','GY'],['رمادي غامق','#5d636b','GY'],['رمادي','#8b9096','GY'],['رمادي فاتح','#c5c9cd','GY'],
['أبيض','#f4f4f1','WH'],['أبيض','#efede6','WH','أوف وايت'],['كريمي','#efe5cf','WM'],['بيج','#dcc7a6','WM'],['كاكي','#b0a078','WM'],['جملي','#bf9560','WM'],
['بني','#6b4423','BR'],['شوكولاتة','#3f2616','BR'],
['كحلي','#1c2a4f','NV'],['أزرق','#3d68b0','BL'],['أزرق','#5b7fb5','BL','أزرق دنيم'],['أزرق ملكي','#2347b5','BL'],['سماوي','#8cc4e8','LB'],['سماوي','#bcd8ee','LB','أزرق فاتح'],
['بترولي','#12606b','TL'],['تركواز','#2fb8b8','TL'],['نعناعي','#9bd9b9','MT'],
['أخضر','#2f9a4d','GN'],['أخضر غامق','#1d4a30','GN'],['زمردي','#16805f','GN'],['ليموني','#aacb3a','GN'],['زيتي','#636a30','OL'],
['أصفر','#f1cb22','YL'],['خردلي','#cfa21b','YL'],['برتقالي','#e8731a','OR'],['خوخي','#f9c9a4','PC'],['مرجاني','#ef6f5a','CO'],['قرميدي','#a9502d','RS'],
['أحمر','#c4262c','RD'],['بوردو','#6e202f','BD'],['بوردو','#4f1827','BD','نبيذي'],['وردي','#e5799f','PK'],['وردي','#cfa3ab','PK','وردي مغبر'],['وردي فاتح','#f3c4cc','PK'],['فوشيا','#c71f7a','PK'],
['بنفسجي','#64389a','PU'],['لافندر','#b5a7da','PU']
].map(([n,h,t,l])=>({n,h,t,label:l||n,lab:toLab(h)}));
const CATOF={BK:'N',WH:'N',GY:'N',WM:'N',NV:'V',BR:'E',OL:'E',RS:'E',BL:'D'};
const dE=(a,b)=>Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2);
function nearestPal(hx){
  const L=toLab(hx);let best=PAL[0],bd=1e12;
  for(const c of PAL){const d=(L[0]-c.lab[0])**2+(L[1]-c.lab[1])**2+(L[2]-c.lab[2])**2;if(d<bd){bd=d;best=c}}
  return best;
}
const paletteLabel=hx=>nearestPal(hx).label;
const PAL_LABELS=[...new Set(PAL.map(c=>c.label))];

/* ---- learned color names: tiny local memory of the user's corrections ----
   Each correction is one sample {lab,label}. A sample only affects NEW auto-naming of colors within
   LEARN_R (Lab distance) of it, so one correction can never rename the whole palette. */
const LEARN_KEY='styly-color-learning',LEARN_R=7,LEARN_MAX=300;
let learned=[];
try{const x=JSON.parse(localStorage.getItem(LEARN_KEY)||'[]');if(Array.isArray(x))learned=x.filter(s=>s&&Array.isArray(s.lab)&&typeof s.label==='string')}catch(e){}
const saveLearned=()=>{try{localStorage.setItem(LEARN_KEY,JSON.stringify(learned))}catch(e){}};
function learnedFor(hx){
  if(!learned.length)return null;
  const L=toLab(hx);let best=null,bd=LEARN_R;
  for(const s of learned){const d=dE(L,s.lab);if(d<=bd){bd=d;best=s}}
  return best;
}
function addLearning(hx,label){
  const L=toLab(hx);
  learned=learned.filter(s=>dE(L,s.lab)>2.5);          /* a newer correction replaces near-identical older ones */
  learned.push({lab:L.map(v=>Math.round(v*10)/10),label});
  if(learned.length>LEARN_MAX)learned=learned.slice(-LEARN_MAX);
  saveLearned();
}
const resetLearning=()=>{learned=[];saveLearned()};
/* automatic name for a freshly picked color: learned override first, else nearest palette name */
function autoName(hx){
  const s=learnedFor(hx);
  return s?{label:s.label,source:'learned'}:{label:paletteLabel(hx),source:'palette'};
}
/* display name of a stored item: the user's correction if any, else the palette name (never changes retroactively) */
const iname=i=>(i&&i.colorName)||paletteLabel((i&&i.color)||'#888888');
const cname=hx=>paletteLabel(hx);

const _pc={};
function prof(it){
  const hx=(it&&it.color)||'#888888';
  if(_pc[hx])return _pc[hx];
  const q=toHSL(hx),best=nearestPal(hx);
  return _pc[hx]={...q,name:best.n,label:best.label,tag:best.t,cat:CATOF[best.t]||'C'};
}

/* ---- image helpers ---- */
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const loadCanvas=(url,max)=>new Promise((res,rej)=>{
  const im=new Image();
  im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=mk(Math.max(1,Math.round(im.width*k)),Math.max(1,Math.round(im.height*k)));c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c)};
  im.onerror=rej;im.src=url;
});
function hasAlpha(c){
  const d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;
  let n=0;for(let i=3;i<d.length;i+=16)if(d[i]<200)n++;
  return n>(d.length/16)*.02;
}

/* dominant color via k-means: drops background-like pixels (border median) so small items still work (unchanged) */
function domColor(c){
  const w=c.width,h=c.height,d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
  const A=hasAlpha(c),dist=(p,q)=>(p[0]-q[0])**2+(p[1]-q[1])**2+(p[2]-q[2])**2;
  const med=a=>a.sort((x,y)=>x-y)[a.length>>1];
  const br=[[],[],[]],push=(x,y)=>{const i=(y*w+x)*4;if(d[i+3]>200){br[0].push(d[i]);br[1].push(d[i+1]);br[2].push(d[i+2])}};
  for(let x=0;x<w;x+=Math.max(1,w>>5)){push(x,0);push(x,h-1)}
  for(let y=0;y<h;y+=Math.max(1,h>>5)){push(0,y);push(w-1,y)}
  const bg=br[0].length?[med(br[0]),med(br[1]),med(br[2])]:null;
  const sx=Math.max(1,Math.floor(w/70)),sy=Math.max(1,Math.floor(h/70)),all=[],fg=[];
  for(let y=0;y<h;y+=sy)for(let x=0;x<w;x+=sx){
    const i=(y*w+x)*4;if(d[i+3]<=200)continue;
    const p=[d[i],d[i+1],d[i+2]];all.push(p);
    if(!A&&bg&&dist(p,bg)>2500)fg.push(p);
  }
  const pts=(A||fg.length<Math.max(10,all.length*.03))?all:fg;
  if(pts.length<10)return null;
  let cs=[pts[0]];
  while(cs.length<3){let best=pts[0],bd=-1;for(const p of pts){let m=1e12;for(const q of cs){const v=dist(p,q);if(v<m)m=v}if(m>bd){bd=m;best=p}}cs.push(best)}
  let cnt=[0,0,0];
  for(let it=0;it<8;it++){
    const sum=cs.map(()=>[0,0,0,0]);
    for(const p of pts){let bi=0,bd=1e12;cs.forEach((q,i)=>{const v=dist(p,q);if(v<bd){bd=v;bi=i}});const t=sum[bi];t[0]+=p[0];t[1]+=p[1];t[2]+=p[2];t[3]++}
    cs=cs.map((q,i)=>sum[i][3]?[sum[i][0]/sum[i][3],sum[i][1]/sum[i][3],sum[i][2]/sum[i][3]]:q);cnt=sum.map(t=>t[3]);
  }
  return hex2(...cs[cnt.indexOf(Math.max(...cnt))]);
}

/* known color pairings (from fashion style guides: contrast, neutrals, classic pairs). pattern: exact name or #TAG. first match wins. */
const RULES=[
// pairs to avoid
['كحلي','أسود',40,'كحلي مع أسود مش أفضل تناسق'],
['#BR','أسود',42,'بني مع أسود مش متناسق'],
['زيتي','كاكي',40,'زيتي مع كاكي بيبان مش متناسق'],
['أحمر','#GN',38,'أحمر مع أخضر ممكن يبان زي زينة الكريسماس'],
['أحمر','#PK',42,'أحمر مع وردي ألوان متقاربة ومتخانقة'],
['برتقالي','#PK',42,'برتقالي مع وردي مش متناسق'],
['برتقالي','أحمر',44,'برتقالي مع أحمر ألوان حادة مع بعض'],
// classics
['أسود','أبيض',93,'أبيض وأسود تباين قوي ومضمون'],
['أسود','جملي',90,'أسود مع جملي من أشهر التنسيقات'],
['كحلي','أبيض',95,'كحلي مع أبيض تناسق كلاسيكي'],
['كحلي','#WM',92,'كحلي مع {b} تناسق كلاسيكي'],
['كحلي','بوردو',90,'كحلي مع بوردو تناسق راقي'],
['كحلي','#BR',88,'كحلي مع {b} متناسقين'],
['كحلي','#GY',88,'كحلي مع {b} أنيق'],
['كحلي','نعناعي',88,'كحلي مع نعناعي ألوان هادية ومنعشة'],
['كحلي','خردلي',86,'كحلي مع خردلي تباين جميل'],
['كحلي','مرجاني',86,'كحلي مع مرجاني تباين جميل'],
['كحلي','#PK',85,'كحلي مع {b} تناسق جميل'],
['كحلي','سماوي',82,'كحلي مع سماوي درجات من الأزرق'],
['كحلي','لافندر',80,'كحلي مع لافندر تناسق هادي'],
['كحلي','أحمر',80,'كحلي مع أحمر تناسق كلاسيكي'],
['كحلي','زيتي',80,'كحلي مع زيتي تناسق ترابي'],
['كحلي','أزرق',68,'درجتين من الأزرق قريبين'],
['#GY','#PK',88,'رمادي مع وردي من التنسيقات الناجحة'],
['#GY','سماوي',88,'رمادي مع سماوي هادي وأنيق'],
['#GY','نعناعي',86,'رمادي مع نعناعي هادي ومنعش'],
['#GY','لافندر',86,'رمادي مع لافندر هادي وأنيق'],
['#GY','بوردو',84,'رمادي مع بوردو راقي'],
['#GY','خردلي',84,'رمادي مع خردلي تباين جميل'],
['#GY','#TL',84,'رمادي مع {b} تناسق جميل'],
['#GY','مرجاني',82,'رمادي مع مرجاني تباين جميل'],
['#BR','زيتي',86,'بني مع زيتي ألوان ترابية متناسقة'],
['#BR','أخضر غامق',88,'بني مع أخضر غامق تناسق ترابي'],
['#BR','كريمي',88,'بني مع كريمي هادي ودافي'],
['#BR','بيج',86,'بني مع بيج ألوان ترابية'],
['#BR','أزرق',86,'بني مع جينز تناسق مريح'],
['#BR','نعناعي',82,'بني مع نعناعي تناسق هادي'],
['#BR','سماوي',82,'بني مع سماوي تناسق مريح'],
['#BR','خردلي',82,'بني مع خردلي ألوان دافية'],
['#BR','جملي',80,'بني مع جملي درجات قريبة'],
['زيتي','بيج',92,'زيتي مع بيج تناسق ترابي كلاسيكي'],
['زيتي','كريمي',90,'زيتي مع كريمي تناسق ترابي'],
['زيتي','جملي',84,'زيتي مع جملي ألوان ترابية'],
['زيتي','#GY',80,'زيتي مع {b} متناسقين'],
['زيتي','خردلي',80,'زيتي مع خردلي ألوان ترابية'],
['زيتي','أزرق',78,'زيتي مع جينز تناسق مريح'],
['بوردو','#WM',86,'بوردو مع {b} تناسق راقي'],
['بوردو','أزرق',84,'بوردو مع جينز تناسق جميل'],
['نعناعي','كريمي',88,'نعناعي مع كريمي هادي ومنعش'],
['نعناعي','أزرق',80,'نعناعي مع جينز منعش'],
['نعناعي','#PK',78,'نعناعي مع {b} ألوان باستيل'],
['نعناعي','مرجاني',78,'نعناعي مع مرجاني مرح'],
['نعناعي','لافندر',76,'نعناعي مع لافندر ألوان باستيل'],
['نعناعي','خردلي',74,'نعناعي مع خردلي تباين دافي'],
['#TL','#WM',84,'{a} مع {b} تناسق هادي'],
['#TL','مرجاني',80,'{a} مع مرجاني تباين جميل'],
['#TL','خردلي',80,'{a} مع خردلي تباين جميل'],
['لافندر','#WM',76,'لافندر مع {b} تناسق هادي'],
['خردلي','#WM',74,'خردلي مع {b} ألوان دافية'],
['مرجاني','أزرق',82,'مرجاني مع جينز تباين جميل'],
['مرجاني','#WM',80,'مرجاني مع {b} تناسق دافي'],
['أحمر','كحلي',82,'أحمر مع كحلي كلاسيكي'],
['أحمر','أزرق',76,'أحمر مع جينز تناسق مريح'],
['أحمر','#WM',68,'أحمر مع {b}'],
['أزرق','#WM',86,'جينز مع {b} تناسق مريح'],
['أزرق','خردلي',84,'جينز مع خردلي تباين جميل'],
['أزرق','#GY',84,'جينز مع {b} مريح'],
['أزرق','#PK',82,'جينز مع {b} تناسق لطيف'],
['أزرق','برتقالي',72,'أزرق مع برتقالي ألوان متضادة'],
['أزرق','أصفر',70,'أزرق مع أصفر تباين قوي'],
];
const _rc=(p,P)=>p[0]==='#'?P.tag===p.slice(1):P.name===p;
function pairScore(A,B,shoe){
  const a=A.name,b=B.name;
  if(a===b){
    if(A.tag==='BK'||A.tag==='WH')return{s:62,n:'لون واحد كله'};
    return Math.abs(A.l-B.l)>=.2?{s:70,n:'درجتين من نفس اللون'}:{s:38,n:'نفس اللون تمامًا بدون تباين'};
  }
  if(A.tag==='GY'&&B.tag==='GY')return Math.abs(A.l-B.l)>=.22?{s:82,n:'درجات رمادي متدرجة'}:{s:50,n:'رمادي قريب جدًا من بعضه'};
  for(const r of RULES){
    let x=null,y=null;
    if(_rc(r[0],A)&&_rc(r[1],B)){x=A;y=B}else if(_rc(r[0],B)&&_rc(r[1],A)){x=B;y=A}
    if(x){
      if(shoe&&r[0]==='كحلي'&&r[1]==='أسود')return{s:78,n:'جزمة سودا مع كحلي مقبولة'};
      return{s:r[2],n:r[3].replace('{a}',x.name).replace('{b}',y.name)};
    }
  }
  if(A.tag==='WH'||B.tag==='WH')return{s:93,n:'الأبيض بيمشي مع أي لون'};
  if(A.tag==='BK'||B.tag==='BK')return{s:88,n:'الأسود لون آمن مع الباقي'};
  const ca=A.cat,cb=B.cat;
  if(ca==='N'&&cb==='N')return{s:82,n:'ألوان محايدة مع بعض'};
  if(ca==='N'||cb==='N'){
    const o=ca==='N'?B:A,nn=ca==='N'?A:B;
    if(nn.name==='بيج'&&o.cat==='C'&&o.s>.6)return{s:62,n:'بيج مع لون قوي'};
    return{s:80,n:nn.name+' محايد مع '+o.name};
  }
  if(ca==='D'||cb==='D')return{s:76,n:'جينز بيمشي مع أغلب الألوان'};
  if(ca==='V'||cb==='V'){const o=ca==='V'?B:A;return o.cat==='C'?{s:66,n:'كحلي مع لون واضح'}:{s:72,n:'كحلي مع '+o.name}}
  if(ca==='E'&&cb==='E')return{s:78,n:'ألوان ترابية متناسقة'};
  if(ca==='E'||cb==='E')return{s:58,n:'لون ترابي مع لون واضح'};
  let dh=Math.abs(A.h-B.h);dh=Math.min(dh,360-dh);const dl=Math.abs(A.l-B.l);
  if(dh<=25)return dl>=.2?{s:72,n:'درجات متقاربة من نفس العائلة'}:{s:48,n:'ألوان متقاربة جدًا بدون تباين'};
  if(dh>=150)return Math.min(A.s,B.s)>.55?{s:42,n:'لونين متضادين قويين'}:{s:64,n:'ألوان متضادة متوازنة'};
  if(dh>=90)return{s:50,n:'ألوان مختلفة محتاجة تدقيق'};
  return{s:45,n:'ألوان مش متناسقة'};
}

/* learned taste (stored locally) */
let prefs={};
try{prefs=JSON.parse(localStorage.getItem('styly-prefs')||'{}')}catch(e){}
const pkey=(x,y)=>[x,y].sort().join('|');
const prefOf=(x,y)=>prefs[pkey(x,y)]||0;
function learn(sel,sign){
  const k=Object.keys(sel).filter(t=>sel[t]),ps=k.flatMap((x,i)=>k.slice(i+1).map(y=>[x,y]));
  ps.forEach(([x,y])=>{const q=pkey(prof(sel[x]).name,prof(sel[y]).name);prefs[q]=Math.max(-30,Math.min(30,(prefs[q]||0)+sign*8))});
  try{localStorage.setItem('styly-prefs',JSON.stringify(prefs))}catch(e){}
}
const FORM={'رسمي':3,'خروجة':2,'كاجوال':1,'رياضي':0};
function recentItems(){
  const now=new Date();now.setHours(0,0,0,0);const lim=new Date(now);lim.setDate(lim.getDate()-7);const s=new Set();
  for(const p of plan){const d=parse(p.date);if(d>=lim&&d<=now){const o=outfits.find(x=>x.id===p.outfitId);if(o)o.ids.forEach(id=>s.add(id))}}
  return s;
}
/* outfit scoring: sel={top,bottom,shoes,outer} -> {score,note} */
function outfitScore(sel,recent){
  const keys=['top','bottom','shoes','outer'].filter(k=>sel[k]);
  if(keys.length<2)return null;
  const pairs=[['top','bottom',.4],['bottom','shoes',.25],['top','shoes',.15],['outer','top',.1],['outer','bottom',.1]];
  let sum=0,wt=0,bw=-1,best={n:''},worst={s:101,n:''},tb=null;
  for(const [a,b,w] of pairs){
    if(!sel[a]||!sel[b])continue;
    const pa=prof(sel[a]),pb=prof(sel[b]),r=pairScore(pa,pb,b==='shoes'),v=Math.max(0,Math.min(100,r.s+prefOf(pa.name,pb.name)));
    sum+=v*w;wt+=w;if(r.s*w>bw){bw=r.s*w;best={n:r.n}}if(r.s<worst.s)worst={s:r.s,n:r.n};if(a==='top'&&b==='bottom')tb=v;
  }
  if(!wt)return null;
  let score=sum/wt,pen=0;const why=[];
  if(tb!==null)score=Math.min(score,tb+15);
  if(sel.top&&sel.bottom&&Math.abs(prof(sel.top).l-prof(sel.bottom).l)>=.3)score=Math.min(100,score+4);
  if(worst.s<50)why.push(worst.n);
  if(keys.length>=3){const nm=new Set(keys.map(k=>prof(sel[k]).name));if(nm.size===1&&!['BK','WH'].includes(prof(sel[keys[0]]).tag)){pen+=15;why.push('كل القطع بنفس اللون')}}
  const fam=new Set();keys.forEach(k=>{const p=prof(sel[k]);if(p.cat==='C')fam.add(Math.round(p.h/45)%8)});
  if(fam.size>2){pen+=12*(fam.size-2);why.push('ألوان واضحة كتير في طقم واحد')}
  const fs=keys.map(k=>FORM[sel[k].occ]).filter(v=>v!==undefined),sp=fs.length?Math.max(...fs)-Math.min(...fs):0;
  if(sp>=3){pen+=30;why.push('قطع رسمية مع رياضية')}else if(sp===2){pen+=15;why.push('مناسبات مختلفة في الطقم')}
  if(keys.filter(k=>(sel[k].pattern||'سادة')!=='سادة').length>=2){pen+=15;why.push('نقشتين مع بعض')}
  if(keys.some(k=>sel[k].season==='صيف')&&keys.some(k=>sel[k].season==='شتا')){pen+=20;why.push('قطع من موسمين مختلفين')}
  if(recent){const n=keys.filter(k=>recent.has(sel[k].id)).length;if(n){pen+=8*n;why.push('فيه قطع لبستها الأسبوع ده')}}
  score=Math.max(0,Math.min(100,score-pen));
  return{score:Math.round(score),note:why[0]||best.n,ok:!why.length};
}
