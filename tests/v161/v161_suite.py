# v1.6.1: اشتري إيه؟ — one color is enough, and every outfit per color can be browsed
from playwright.sync_api import sync_playwright
import json
URL='http://localhost:8765/'; R=[]
def rec(i,d,ok,det=''): R.append({'id':i,'desc':d,'status':'PASS' if ok else 'FAIL','detail':str(det)}); print(('PASS' if ok else 'FAIL'),i,d,det if not ok else '')
SEED=open(__file__.replace('v161/v161_suite.py','v15/v15_suite.py')).read().split('SEED="""')[1].split('"""')[0]
W=[('تيشيرت أبيض','top','#f4f4f1','كاجوال'),('تيشيرت أسود','top','#1b1b1d','كاجوال'),('تيشيرت رمادي','top','#8b9096','كاجوال'),('بولو كحلي','top','#1c2a4f','كاجوال'),
 ('هودي رمادي','hoodie','#8b9096','كاجوال','شتا'),('جينز','bottom','#3d68b0','كاجوال'),('بنطلون أسود','bottom','#1b1b1d','كاجوال'),('بنطلون كاكي','bottom','#b0a078','كاجوال'),
 ('كوتشي أبيض','shoes','#f4f4f1','كاجوال'),('كوتشي أسود','shoes','#1b1b1d','كاجوال'),('جاكيت جينز','outer','#3d68b0','كاجوال')]
def cnt(pg): return pg.evaluate("async()=>{const db=await new Promise(r=>{const q=indexedDB.open('wardrobe');q.onsuccess=()=>r(q.result)});return await new Promise(r=>{const q=db.transaction('items').objectStore('items').count();q.onsuccess=()=>r(q.result)})}")
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    ctx.route('https://api.github.com/**',lambda r:r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{"body":"","assets":[]}'))
    pg.goto(URL); pg.wait_for_timeout(500); pg.evaluate(SEED,W); pg.click('#t-wardrobe'); n0=cnt(pg)
    pg.click('#wn-buy'); pg.click('#bType button[data-k=bottom]')
    rec('E1','Button says "شوف الأطقم" with no color; clicking with none shows an error',pg.inner_text('#bGo').strip()=='شوف الأطقم' and (pg.click('#bGo') or True) and pg.locator('#bErr').is_visible())
    pg.click('#bCols [data-l="بيج"]'); rec('E2','Button stays "شوف الأطقم" with one color',pg.inner_text('#bGo').strip()=='شوف الأطقم')
    pg.click('#bGo'); pg.wait_for_selector('#bRes .out'); t=pg.inner_text('#bRes'); k=pg.evaluate("buy.res.results[0].count")
    rec('E3','One color: says how many new outfits it opens, no comparison block',('هتفتح '+str(k)+' طقم جديد' in t) and pg.locator('#bRes .cmp').count()==0 and 'الأفضل:' not in t,t[:200])
    rec('E4','One color: single result card and an add button asking confirmation',pg.locator('#bRes .out').count()==1 and (pg.click('#bRes [data-add]') or True) and pg.locator('#dbg.show').count()==1); pg.click('#dlgNo')
    # all outfits
    btn=pg.locator('#bRes [data-all]'); rec('E5','"شوف كل الأطقم (N)" shown when there are more than the 3 examples',btn.count()==1 and f'({k})' in btn.inner_text(),(k,btn.inner_text() if btn.count() else ''))
    btn.click(); pg.wait_for_timeout(150)
    shown=pg.locator('#allo-0 .alli').count(); rec('E6','First 12 outfits listed (or all if fewer), each with names and score',shown==min(12,k) and '%' in pg.inner_text('#allo-0'),shown)
    if k>12:
        pg.click('#allo-0 .allm'); pg.wait_for_timeout(100); rec('E7','"عرض كمان" loads the next chunk until all N are shown',pg.locator('#allo-0 .alli').count()==min(24,k))
        while pg.locator('#allo-0 .allm').count(): pg.click('#allo-0 .allm'); pg.wait_for_timeout(50)
    rec('E8','Every one of the N new outfits is reachable',pg.locator('#allo-0 .alli').count()==k,(pg.locator('#allo-0 .alli').count(),k))
    rec('E9','All listed outfits are distinct (no repeated combination) and each contains the virtual piece',pg.evaluate("(()=>{const a=buy.res.results[0].all;return new Set(a.map(o=>o.sig)).size===a.length&&a.every(o=>Object.values(o.sel).some(i=>i.virtual))})()"))
    btn.click(); rec('E10','Button toggles: hides the list again',pg.locator('#allo-0').is_hidden() and 'شوف كل الأطقم' in btn.inner_text())
    # three colors, each has its own list
    for l in ['أسود','أزرق دنيم']: pg.click(f'#bCols [data-l="{l}"]')
    pg.click('#bGo'); pg.wait_for_selector('#bRes .cmp'); 
    rec('E11','Three colors: comparison + one "all outfits" button per color with its own list',pg.locator('#bRes .cmp .cmpc').count()==3 and pg.locator('#bRes [data-all]').count()>=2)
    ids=pg.evaluate("[...document.querySelectorAll('#bRes [data-all]')].map(b=>+b.dataset.all)"); pg.click(f'#bRes [data-all="{ids[-1]}"]'); pg.wait_for_timeout(100)
    rec('E12','Opening one color leaves the others closed (independent)',pg.locator('#bRes .allo:not(.hide)').count()==1)
    rec('E13','Nothing saved to the wardrobe',cnt(pg)==n0)
    ok=True
    for w in (320,390,768,1280):
        pg.set_viewport_size({'width':w,'height':800}); pg.wait_for_timeout(100); ok&=pg.evaluate("document.documentElement.scrollWidth<=innerWidth")
    rec('E14','No horizontal overflow with the full list open',ok)
    rec('E15','No console/page errors',not errs,errs)
    b.close()
n=sum(r['status']=='PASS' for r in R); print(n,'/',len(R)); json.dump(R,open(__file__.replace('.py','_results.json'),'w'),ensure_ascii=False,indent=1)
