# v1.6.0: smarter محتاج إيه؟ / اشتري إيه؟ (occasion gaps, kinds, pivots, usage-based buy, noise filter)
from playwright.sync_api import sync_playwright
import json,sys,time
URL='http://localhost:8765/'; R=[]
def rec(i,d,ok,det=''): R.append({'id':i,'desc':d,'status':'PASS' if ok else 'FAIL','detail':str(det)}); print(('PASS' if ok else 'FAIL'),i,d,det if not ok else '')
SEED=open(__file__.replace('v16/v16_suite.py','v15/v15_suite.py')).read().split('SEED="""')[1].split('"""')[0]
CASUAL=[('تيشيرت أبيض','top','#f4f4f1','كاجوال'),('تيشيرت أسود','top','#1b1b1d','كاجوال'),('تيشيرت رمادي','top','#8b9096','كاجوال'),('بولو كحلي','top','#1c2a4f','كاجوال'),
 ('هودي رمادي','hoodie','#8b9096','كاجوال','شتا'),('جينز','bottom','#3d68b0','كاجوال'),('بنطلون أسود','bottom','#1b1b1d','كاجوال'),('بنطلون كاكي','bottom','#b0a078','كاجوال'),
 ('كوتشي أبيض','shoes','#f4f4f1','كاجوال'),('كوتشي أسود','shoes','#1b1b1d','كاجوال'),('جاكيت جينز','outer','#3d68b0','كاجوال')]
FORMAL_NO_SHOES=CASUAL+[('قميص أبيض رسمي','top','#f4f4f1','رسمي'),('بنطلون قماش رمادي','bottom','#4a4d52','رسمي')]
BALANCED=[('ت1','top','#f4f4f1','كاجوال'),('ت2','top','#1b1b1d','كاجوال'),('ت3','top','#1c2a4f','كاجوال'),('ت4','top','#8b9096','كاجوال'),
 ('ب1','bottom','#3d68b0','كاجوال'),('ب2','bottom','#1b1b1d','كاجوال'),('ب3','bottom','#b0a078','كاجوال'),('ب4','bottom','#4a4d52','كاجوال'),
 ('ج1','shoes','#f4f4f1','كاجوال'),('ج2','shoes','#1b1b1d','كاجوال'),('ج3','shoes','#6b4423','كاجوال'),
 ('ك1','outer','#3d68b0','كاجوال'),('ك2','outer','#1b1b1d','كاجوال'),('ك3','outer','#b0a078','كاجوال')]
def fresh(b,seed,vp=(390,844)):
    ctx=b.new_context(viewport={'width':vp[0],'height':vp[1]}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    ctx.route('https://api.github.com/**',lambda r:r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{"body":"","assets":[]}'))
    pg.goto(URL); pg.wait_for_timeout(500); pg.evaluate(SEED,seed); pg.wait_for_timeout(200); pg.click('#t-wardrobe'); return ctx,pg,errs
def cnt(pg): return pg.evaluate("async()=>{const db=await new Promise(r=>{const q=indexedDB.open('wardrobe');q.onsuccess=()=>r(q.result)});return await new Promise(r=>{const q=db.transaction('items').objectStore('items').count();q.onsuccess=()=>r(q.result)})}")
def needs(pg):
    pg.click('#wn-mine'); pg.click('#wn-need'); pg.wait_for_selector('#needRes .outs, #needRes .note',timeout=20000); pg.wait_for_timeout(100)
with sync_playwright() as p:
    b=p.chromium.launch(); allerr=[]
    ctx,pg,errs=fresh(b,FORMAL_NO_SHOES); n0=cnt(pg); needs(pg); allerr+=errs
    txt=pg.inner_text('#needRes')
    rec('D1','Occasion map shown; the weak occasion (رسمي: 0 outfits) is flagged',pg.locator('.gapr').count()==2 and pg.locator('.gapr.weak').count()==1 and 'رسمي' in pg.locator('.gapr.weak').inner_text())
    s=pg.evaluate("analyzeNeeds(items.filter(i=>i.type!=='acc')).suggestions.map(s=>({t:s.v.type,o:s.occ,k:s.kind,g:s.gapGain}))")
    rec('D2','First suggestion is the formal shoes that unlock the dead formal pieces (kind=gap)',s and s[0]['t']=='shoes' and s[0]['o']=='رسمي' and s[0]['k']=='gap',s)
    rec('D3','Suggestion titled by kind (جزمة كلاسيك + color), not just "جزمة"',pg.locator('#needRes .out >> nth=0').inner_text().find('جزمة كلاسيك')>=0)
    rec('D4','Reason states the gap with before → after in words',('بتسد فجوة في أطقم رسمي' in txt) and ('ولا طقم' in txt))
    per=pg.evaluate("(()=>{const s=analyzeNeeds(items.filter(i=>i.type!=='acc')).suggestions;return s.map(x=>x.v.type+'|'+x.occ)})()")
    rec('D5','One card per type+occasion; at most 4 cards; alternatives listed as text',len(per)==len(set(per)) and len(per)<=4 and 'ألوان بديلة' in txt,per)
    rec('D6','Pivot cards: carriers shown; formal pieces listed under "بتتلبس مع قليل"',('القطع اللي شايلة دولابك' in txt) and ('قطع بتتلبس مع قليل' in txt) and ('قميص أبيض رسمي' in txt.split('قطع بتتلبس مع قليل')[1]))
    rec('D7','Analysis saves nothing (item count unchanged)',cnt(pg)==n0)
    # add from suggestion -> preset occasion
    pg.click('#needRes [data-add] >> nth=0'); pg.click('#dlgYes'); pg.wait_for_timeout(300)
    rec('D8','Add from suggestion presets the occasion (رسمي) and color; nothing saved before Save',pg.input_value('#occ')=='رسمي' and cnt(pg)==n0)
    pg.click('#m-form [data-close]'); pg.wait_for_timeout(150)
    # buy
    pg.click('#wn-buy'); pg.click('#bType button[data-k=shoes]')
    opts=pg.locator('#bOcc option').all_inner_texts()
    pg.click('#bType button[data-k=hoodie]'); hopts=pg.locator('#bOcc option').all_inner_texts()
    rec('D9','Usage list depends on the type (shoes has جزمة كلاسيك; hoodie has no formal option)',any('جزمة كلاسيك' in o for o in opts) and not any('رسمي' in o for o in hopts),(opts,hopts))
    pg.click('#bType button[data-k=shoes]')
    for l in ['أسود','بني']: pg.click(f'#bCols [data-l="{l}"]')
    pg.select_option('#bOcc','رسمي'); pg.click('#bGo'); pg.wait_for_selector('#bRes .cmp'); bt=pg.inner_text('#bRes')
    rec('D10','Buy with chosen usage: gap noted, verdict "بتسد فجوة مهمة", compared colors use that usage',('بتسد فجوة مهمة' in bt) and ('جزمة كلاسيك' in bt))
    pg.select_option('#bOcc','auto'); pg.click('#bGo'); pg.wait_for_selector('#bRes .cmp'); bu=pg.evaluate("buy.res.use")
    rec('D11','Auto usage picks the usage that fills the gap (رسمي) for shoes',bu=='رسمي',bu)
    rec('D12','Buy saves nothing; add button asks for confirmation first',cnt(pg)==n0 and (pg.click('#bRes [data-add] >> nth=0') or True) and pg.locator('#dbg.show').count()==1)
    pg.click('#dlgNo')
    # overflow
    ok=True
    for w in (320,360,390,430,768,1280):
        pg.set_viewport_size({'width':w,'height':800}); pg.click('#wn-need'); pg.wait_for_selector('#needRes .outs, #needRes .note'); ok&=pg.evaluate("document.documentElement.scrollWidth<=innerWidth")
    rec('D13','No horizontal overflow at 320–1280 on the new needs screen',ok)
    allerr+=errs; ctx.close()
    # balanced wardrobe: no filler
    ctx,pg,errs=fresh(b,BALANCED); needs(pg); allerr+=errs
    ks=pg.evaluate("analyzeNeeds(items.filter(i=>i.type!=='acc')).suggestions.map(s=>s.kind)")
    rec('D14','Balanced wardrobe: no gap/slot suggestions (only an optional "boost" block, never filler)',all(k not in('gap','slot') for k in ks) and pg.locator('#needRes .gapr.weak').count()==0,ks)
    ctx.close()
    # performance on a large wardrobe
    big=[]
    cols=['#f4f4f1','#1b1b1d','#1c2a4f','#8b9096','#b0a078','#3d68b0','#6b4423','#4a4d52','#556b2f','#6d1f2e','#c8a02a']
    occs=['كاجوال','رسمي','خروجة','رياضي']
    for i in range(66):
        t=['top','bottom','shoes','outer','top','bottom'][i%6]; big.append((f'{t}{i}',t,cols[i%len(cols)],occs[(i//3)%4]))
    ctx,pg,errs=fresh(b,big); t=time.time(); pg.click('#wn-need'); pg.wait_for_selector('#needRes .outs, #needRes .note',timeout=30000); ms=int((time.time()-t)*1000)
    pg.click('#wn-buy'); pg.click('#bCols [data-l="أسود"]'); pg.click('#bCols [data-l="كحلي"]'); pg.click('#bCols [data-l="بوردو"]'); t=time.time(); pg.click('#bGo'); pg.wait_for_selector('#bRes .cmp,#bRes .note'); mb=int((time.time()-t)*1000)
    rec('D15','Performance on 66 pieces (desktop Chromium): needs < 3 s, buy < 1.5 s',ms<3000 and mb<1500,(ms,mb)); print('needs ms',ms,'buy ms',mb)
    allerr+=errs; ctx.close()
    rec('D16','No console/page errors in the whole run',not allerr,allerr)
    b.close()
n=sum(r['status']=='PASS' for r in R); print(n,'/',len(R)); json.dump(R,open(__file__.replace('.py','_results.json'),'w'),ensure_ascii=False,indent=1)
