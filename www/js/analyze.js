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

/* the wardrobe as it is now */
function baseline(its){
  JC=new Map();
  const L=slotLists(its),all=enumerate(L,null),u=uniq(all),sigs=new Set(u.map(o=>o.sig)),used=new Set();
  for(const o of all)Object.values(o.sel).forEach(i=>used.add(i.id));
  const core=[...L.top,...L.bottom,...L.shoes,...L.outer];
  return{L,outfits:u,sigs,used,count:u.length,unused:core.filter(i=>!used.has(i.id))};
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
  return{v,count:fresh.length,avg,touched:touched.size,unlocked:unlocked.size,repeats,rejected:stat,
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
/* best occasion for a virtual piece: only when the wardrobe actually holds more than one occasion */
function occasionsKnown(its){return new Set(its.map(i=>i.occ)).size>1}
function simulateBestOcc(its,base,type,color,season,occ){
  if(occ&&occ!=='auto')return simulate(its,base,makeVirtual(type,color,occ,season));
  const cnt={};its.forEach(i=>cnt[i.occ]=(cnt[i.occ]||0)+1);
  const cand=occasionsKnown(its)?Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,2):['كاجوال'];
  let best=null;
  for(const o of cand){const r=simulate(its,base,makeVirtual(type,color,o,season));if(!best||r.value>best.value)best=r}
  return best;
}
/* how much data the analysis has */
function dataLevel(its){
  const L=slotLists(its),miss=['top','bottom','shoes'].filter(k=>!L[k].length).map(k=>SLOT_LBL[k]);
  const n=its.filter(i=>i.type!=='acc').length;
  if(n<4)return{level:'none',miss,n};
  if(miss.length||n<8)return{level:'limited',miss,n};
  return{level:'ok',miss,n};
}
/* "محتاج إيه؟": try versatile colors on every slot and rank what adds real value */
const NEED_LABELS=['أسود','أبيض','كحلي','رمادي','رمادي غامق','بيج','كاكي','جملي','بني','أزرق دنيم','سماوي','زيتي','بوردو','خردلي'];
function analyzeNeeds(its){
  const base=baseline(its),res=[],seen=new Set();
  const cols=NEED_LABELS.map(l=>PAL.find(c=>c.label===l)).filter(Boolean);
  for(const type of ['top','hoodie','bottom','shoes','outer'])for(const c of cols){
    const r=simulateBestOcc(its,base,type,c.h,null,'auto');
    r.label=c.label;
    if(r.count>=MIN_NEW)res.push(r);
  }
  res.sort((a,b)=>b.value-a.value);
  const out=[],perType={};
  for(const r of res){const t=r.v.type;perType[t]=(perType[t]||0)+1;if(perType[t]>2)continue;out.push(r);if(out.length>=5)break}
  return{base,suggestions:out};
}
/* "اشتري إيه؟": compare the colors the user is torn between */
function compareColors(its,type,colors,occ,season){
  const base=baseline(its);
  const rs=colors.map(c=>{const r=simulateBestOcc(its,base,type,c.h,season||null,occ);r.label=c.label;r.hex=c.h;return r});
  rs.sort((a,b)=>b.value-a.value);
  return{base,results:rs};
}
