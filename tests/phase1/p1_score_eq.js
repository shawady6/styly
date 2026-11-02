// Scoring equivalence: old v1.2 vs new color.js, executed in vm with identical (hex-based) inputs.
const fs=require('fs'),vm=require('vm');
const old=fs.readFileSync(process.argv[2],'utf8');
const oldJS=old.slice(old.indexOf('const hex2'),old.indexOf('/* ---------- add item'));
const newJS=fs.readFileSync(process.argv[3],'utf8');
const mkctx=()=>{const c={localStorage:{getItem:()=>null,setItem(){}},document:{},console,Math,JSON};vm.createContext(c);return c};
const A=mkctx(),B=mkctx();
vm.runInContext(oldJS+';this.API={PAL,prof,pairScore,outfitScore,RULES}',A);
vm.runInContext(newJS+';this.API={PAL,prof,pairScore,outfitScore,RULES}',B);
// 1) rules + scoring functions textually identical
const seg=s=>s.slice(s.indexOf('/* known color pairings'),s.indexOf('/* ---------- add item')>0?s.indexOf('/* ---------- add item'):undefined);
const a=oldJS.slice(oldJS.indexOf('/* known color pairings')),b=newJS.slice(newJS.indexOf('/* known color pairings'));
console.log('scoring source identical:',a.trim()===b.trim());
// 2) behavior: random items
let n=0,bad=0,diffName=0;const rnd=()=>'#'+[0,0,0].map(()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join('');
const occ=['كاجوال','رسمي','رياضي','خروجة'],pat=['سادة','مخطط'],sea=['كل السنة','صيف','شتا'];
for(let i=0;i<20000;i++){
  const mk=(id)=>({id,color:rnd(),occ:occ[i*7%4],pattern:pat[i%2],season:sea[i%3]});
  const sel={top:mk(1),bottom:mk(2),shoes:mk(3),outer:i%2?mk(4):undefined};
  if(!sel.outer)delete sel.outer;
  // compare using canonical-name profiles: same hex -> compare names; if palette differs (new rows), compare through pairing on SAME profiles
  const ra=A.API.outfitScore(sel,null),rb=B.API.outfitScore(sel,null);n++;
  const pa=Object.values(sel).every(x=>A.API.prof(x).name===B.API.prof(x).name);
  if(!pa){diffName++;continue}
  if(JSON.stringify(ra)!==JSON.stringify(rb))bad++;
}
console.log({samples:n,sameCanonicalNames:n-diffName,sampleWithNewCanonicalName:diffName,scoreMismatches:bad});
