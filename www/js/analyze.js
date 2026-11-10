/* Styly outfit-analysis service: ONE engine used by "محتاج إيه؟" and "اشتري إيه؟".
   It does not score anything itself: every outfit is rated by the existing outfitScore (RULES, pairScore, learned prefs).
   This layer only (1) enumerates outfits, (2) filters illogical / repeated ones, (3) compares the wardrobe
   before and after adding a *virtual* piece. Virtual pieces are never written to the database.
   Plain rule-based counting: no AI / machine learning. */
const GOOD=70;                 /* an outfit counts when outfitScore >= GOOD */
const MIN_NEW=3;               /* a suggestion must create at least this many NEW outfits */
const CAP=30;                  /* max pieces per slot enumerated (newest first) */
const ASLOTS=[['top',['top','hoodie'],'فوق'],['bottom',['bottom'],'تحت'],['shoes',['shoes'],'جزمة'],['outer',['outer'],'جاكيت']];
const SLOT_LBL={top:'قميص / هودي',bottom:'بنطلون',shoes:'جزمة',outer:'جاكيت'};
const slotKey=t=>t==='hoodie'?'top':t;       /* same mapping the Outfit Builder uses */

function slotLists(its){
  const L={};
  for(const [k,types] of ASLOTS)L[k]=its.filter(i=>types.includes(i.type)).slice().reverse().slice(0,CAP);
  return L;
}
function sigOf(sel){   /* two outfits that look the same (same piece types in the same color names) count once */
  return ['top','bottom','shoes','outer'].map(k=>sel[k]?k+':'+sel[k].type+':'+prof(sel[k]).label:'').join('|');
}
/* why a combination is rejected: returns an outfit or a reason code.
   Verdicts are memoised by the attributes that outfitScore reads (color, occasion, pattern, season), so pieces that look
   alike are scored once. The cache lives for one analysis run (baseline() resets it) because learned prefs can change. */
let JC=new Map();
const pk=i=>i?i.color+'|'+i.occ+'|'+(i.pattern||'')+'|'+(i.season||''):'';
function judge(sel){
  const key=pk(sel.top)+'/'+pk(sel.bottom)+'/'+pk(sel.shoes)+'/'+pk(sel.outer);
  let v=JC.get(key);
  if(v===undefined){v=judgeRaw(sel);JC.set(key,typeof v==='object'?v.score:v)}
  else if(typeof v==='number')v={score:v};
  return typeof v==='object'?{score:v.score,sel,sig:sigOf(sel)}:v;
}
function judgeRaw(sel){
  const r=outfitScore(sel,null);
  if(!r)return'low';
  if(r.score<GOOD)return'low';
  const fs=Object.values(sel).map(i=>FORM[i.occ]).filter(v=>v!==undefined);
  if(fs.length&&Math.max(...fs)-Math.min(...fs)>=2)return'occ';
  const v=Object.values(sel);
  if(v.some(i=>i.season==='صيف')&&v.some(i=>i.season==='شتا'))return'season';
  return{score:r.score};
}
/* all outfits for the given slot lists: core (top+bottom+shoes) and layered (core+outer) */
function enumerate(L,stat){
  const out=[];
  for(const t of L.top)for(const b of L.bottom)for(const s of L.shoes){
    const base={top:t,bottom:b,shoes:s};
    const j=judge(base);
    if(typeof j==='object')out.push(j);else if(stat)stat[j]++;
    if(typeof j!=='object')continue;   /* a jacket is layered only on a core outfit that already works (same rule for real and virtual pieces) */
    for(const o of L.outer){
      const j2=judge({...base,outer:o});
      if(typeof j2==='object')out.push(j2);else if(stat)stat[j2]++;
    }
  }
  return out;
}
const uniq=a=>{const m=new Map();for(const o of a){const p=m.get(o.sig);if(!p||o.score>p.score)m.set(o.sig,o)}return[...m.values()]};

/* the occasion an outfit belongs to: the one most of its pieces have (ties go to the more formal one) */
function occOfSel(sel){
  const c={};for(const i of Object.values(sel))c[i.occ]=(c[i.occ]||0)+1;
  return Object.keys(c).sort((a,b)=>c[b]-c[a]||(FORM[b]||0)-(FORM[a]||0))[0];
}
/* what a piece is called: type + the occasion the user gave it (there is no separate "style" field, so no data change) */
const KIND={
  top:{'رسمي':'قميص رسمي','كاجوال':'تيشيرت / قميص كاجوال','رياضي':'تيشيرت رياضي','خروجة':'قميص خروجة'},
  hoodie:{'كاجوال':'هودي كاجوال','رياضي':'هودي رياضي','خروجة':'هودي خروجة'},
  bottom:{'رسمي':'بنطلون قماش (كلاسيك)','كاجوال':'جينز / بنطلون كاجوال','رياضي':'بنطلون / شورت رياضي','خروجة':'بنطلون خروجة'},
  shoes:{'رسمي':'جزمة كلاسيك','كاجوال':'كوتشي كاجوال','رياضي':'كوتشي رياضي','خروجة':'جزمة / كوتشي خروجة'},
  outer:{'رسمي':'جاكيت / بليزر رسمي','كاجوال':'جاكيت كاجوال','رياضي':'جاكيت رياضي','خروجة':'جاكيت خروجة'}
};
const kindLabel=(t,o)=>(KIND[t]&&KIND[t][o])||TYPES[t];
const occsFor=t=>KIND[t]?Object.keys(KIND[t]):OCCS;
/* the wardrobe as it is now */
function baseline(its){
  JC=new Map();
  const L=slotLists(its),all=enumerate(L,null),u=uniq(all),sigs=new Set(u.map(o=>o.sig)),used=new Set();
  for(const o of all)Object.values(o.sel).forEach(i=>used.add(i.id));
  const core=[...L.top,...L.bottom,...L.shoes,...L.outer],byOcc={},pv={};
  for(const o of u){const k=occOfSel(o.sel);byOcc[k]=(byOcc[k]||0)+1;for(const i of Object.values(o.sel))pv[i.id]=(pv[i.id]||0)+1}
  return{L,outfits:u,sigs,used,count:u.length,byOcc,pv,unused:core.filter(i=>!used.has(i.id))};
}
function makeVirtual(type,color,occ,season){
  return{id:-1,virtual:true,name:'قطعة جديدة',type,color,occ:occ||'كاجوال',season:season||(type==='hoodie'?'شتا':'كل السنة'),pattern:'سادة',img:null};
}
/* wardrobe + one virtual piece, compared with the baseline */
function simulate(its,base,v){
  const k=slotKey(v.type),L={...base.L,[k]:[v]},stat={low:0,occ:0,season:0};
  const all=enumerate(L,stat),fresh=uniq(all).filter(o=>!base.sigs.has(o.sig));
  const repeats=uniq(all).length-fresh.length;
  const touched=new Set(),unlocked=new Set(),dead=new Set(base.unused.map(i=>i.id));
  for(const o of fresh)for(const i of Object.values(o.sel)){if(i.id===-1)continue;touched.add(i.id);if(dead.has(i.id))unlocked.add(i.id)}
  const avg=fresh.length?Math.round(fresh.reduce((a,o)=>a+o.score,0)/fresh.length):0;
  fresh.sort((a,b)=>b.score-a.score);
  const byOcc={};for(const o of fresh){const k=occOfSel(o.sel);byOcc[k]=(byOcc[k]||0)+1}
  return{v,byOcc,count:fresh.length,avg,touched:touched.size,unlocked:unlocked.size,repeats,rejected:stat,
    value:fresh.length*10+unlocked.size*8+touched.size*2+avg/10,examples:pickExamples(fresh,3)};
}
/* examples: highest scoring, but prefer different pieces so the user sees variety */
function pickExamples(list,n){
  const out=[],seen=new Set();
  for(const o of list){
    const ids=Object.values(o.sel).filter(i=>i.id!==-1).map(i=>i.id);
    if(out.length&&ids.every(id=>seen.has(id)))continue;
    out.push(o);ids.forEach(id=>seen.add(id));if(out.length>=n)break;
  }
  for(const o of list){if(out.length>=n)break;if(!out.includes(o))out.push(o)}
  return out;
}
/* occasions that matter for this wardrobe = occasions it already has pieces for */
function occasionsKnown(its){return new Set(its.map(i=>i.occ)).size>1}
function occGaps(its,base){
  const rel=[...new Set(its.map(i=>i.occ))],cnt=o=>base.byOcc[o]||0,max=Math.max(0,...rel.map(cnt));
  const rows=rel.map(o=>({occ:o,n:cnt(o)})).sort((a,b)=>b.n-a.n);
  const gaps=rows.filter(r=>r.n===0&&max>=3||r.n>0&&r.n<4&&max>=r.n*3).map(r=>({...r,lead:max}));
  return{rows,max,gaps};
}
/* simulate one virtual piece for one occasion; gapGain = new outfits in an occasion the wardrobe is weak at */
function simOcc(its,base,type,color,season,occ,gapSet){
  const r=simulate(its,base,makeVirtual(type,color,occ,season));
  r.occ=occ;r.before=base.byOcc[occ]||0;r.gapGain=gapSet.has(occ)?(r.byOcc[occ]||0):0;
  r.value+=r.gapGain*12;
  return r;
}
/* occasions worth testing for a type when the user did not choose one */
function candOccs(its,base,type,gaps){
  const cnt={};its.forEach(i=>cnt[i.occ]=(cnt[i.occ]||0)+1);
  const known=occasionsKnown(its),ok=occsFor(type);
  let c=known?[...gaps.gaps.map(g=>g.occ),...Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,1)]:['كاجوال'];
  c=[...new Set(c)].filter(o=>ok.includes(o));
  return c.length?c.slice(0,3):[ok.includes('كاجوال')?'كاجوال':ok[0]];
}
/* how much data the analysis has */
function dataLevel(its){
  const L=slotLists(its),miss=['top','bottom','shoes'].filter(k=>!L[k].length).map(k=>SLOT_LBL[k]);
  const n=its.filter(i=>i.type!=='acc').length;
  if(n<4)return{level:'none',miss,n};
  if(miss.length||n<8)return{level:'limited',miss,n};
  return{level:'ok',miss,n};
}
/* "محتاج إيه؟": 1) find occasion gaps, 2) try versatile colors per type/occasion, 3) keep only suggestions that matter */
const NEED_LABELS=['أسود','أبيض','كحلي','رمادي','رمادي غامق','بيج','كاكي','جملي','بني','أزرق دنيم','سماوي','زيتي','بوردو','خردلي'];
function analyzeNeeds(its){
  const base=baseline(its),gaps=occGaps(its,base),gapSet=new Set(gaps.gaps.map(g=>g.occ)),res=[];
  const cols=NEED_LABELS.map(l=>PAL.find(c=>c.label===l)).filter(Boolean);
  for(const type of ['top','hoodie','bottom','shoes','outer']){
    const have=base.L[slotKey(type)].length;
    for(const occ of candOccs(its,base,type,gaps))for(const c of cols){
      const r=simOcc(its,base,type,c.h,null,occ,gapSet);r.label=c.label;r.have=have;
      if(r.count<MIN_NEW&&!r.gapGain)continue;
      /* only suggestions that matter: they fill an occasion gap, or a slot the wardrobe barely has, or add a lot */
      r.kind=r.gapGain>=(r.before<2?1:2)?'gap':have<=2?'slot':(r.count>=6&&(r.unlocked>0||r.count>=10))?'boost':null;
      if(r.kind)res.push(r);
    }
  }
  /* gaps first, then barely-covered slots, then the rest; by value inside each group */
  const KR={gap:0,slot:1,boost:2};
  res.sort((a,b)=>KR[a.kind]-KR[b.kind]||b.value-a.value);
  /* one suggestion per type+occasion; other colors that are nearly as good are listed as alternatives, not as extra cards */
  const out=[];
  for(const r of res){
    const first=out.find(x=>x.v.type===r.v.type&&x.occ===r.occ);
    if(first){if(r.kind===first.kind&&r.value>=first.value*0.85&&first.alts.length<3)first.alts.push(r.label);continue}
    r.alts=[];out.push(r);
  }
  const needs=out.filter(r=>r.kind!=='boost').slice(0,4),boosts=out.filter(r=>r.kind==='boost').slice(0,2);
  return{base,gaps,suggestions:needs,boosts};
}
/* pieces that carry the wardrobe and pieces that hardly go with anything */
function pivots(base){
  const all=[...base.L.top,...base.L.bottom,...base.L.shoes,...base.L.outer],n=i=>base.pv[i.id]||0;
  const strong=all.filter(i=>n(i)>=3).sort((a,b)=>n(b)-n(a)).slice(0,3);
  const weak=all.filter(i=>n(i)<=1).sort((a,b)=>n(a)-n(b)).slice(0,4);
  return{strong,weak,n};
}
/* "اشتري إيه؟": compare the colors the user is torn between; with no chosen usage, pick the usage that suits the pieces best */
function compareColors(its,type,colors,occ,season){
  const base=baseline(its),gaps=occGaps(its,base),gapSet=new Set(gaps.gaps.map(g=>g.occ));
  let use=occ;
  if(!occ||occ==='auto'){
    /* an occasion the wardrobe is weak at wins when this type can fill it; otherwise the usage with the most value */
    let bestSum=-1,gapOcc=null,gapSum=-1;
    for(const o of candOccs(its,base,type,gaps)){
      const rr=colors.map(c=>simOcc(its,base,type,c.h,season||null,o,gapSet)),sum=rr.reduce((a,r)=>a+r.value,0);
      if(sum>bestSum){bestSum=sum;use=o}
      if(rr.some(r=>r.gapGain>0)&&sum>gapSum){gapSum=sum;gapOcc=o}
    }
    if(gapOcc)use=gapOcc;
  }
  const rs=colors.map(c=>{const r=simOcc(its,base,type,c.h,season||null,use,gapSet);r.label=c.label;r.hex=c.h;return r});
  rs.sort((a,b)=>b.value-a.value);
  return{base,gaps,use,results:rs};
}
