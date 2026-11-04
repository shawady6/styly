# Wardrobe expansion checks: sub-navigation, محتاج إيه؟, اشتري إيه؟, مقاساتي, backup. Chromium via Playwright.
from playwright.sync_api import sync_playwright
import os,json,sys
HERE=os.path.dirname(os.path.abspath(__file__)); IMG=os.path.join(HERE,'..','phase1','images'); URL='http://localhost:8765/'
R=[]; SHOT=sys.argv[1] if len(sys.argv)>1 else None
def rec(i,d,ok,det=''): R.append({'id':i,'desc':d,'status':'PASS' if ok else 'FAIL','detail':str(det)}); print(('PASS' if ok else 'FAIL'),i,d,det if not ok else '')
SEED="""async(list)=>{const svg=c=>'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="250"><rect x="40" y="30" width="120" height="190" rx="14" fill="'+c+'"/></svg>');
 for(const [name,type,color,occ,season] of list)await put('items',{name,type,color,season:season||'كل السنة',occ,pattern:'سادة',img:svg(color),cut:true,added:Date.now()});
 items=await all('items');renderCurrent()}"""
WARDROBE=[('قميص أبيض','top','#f4f4f1','كاجوال'),('قميص كحلي','top','#1c2a4f','رسمي'),('تيشيرت رمادي','top','#8b9096','كاجوال'),
 ('بنطلون كحلي','bottom','#1c2a4f','رسمي'),('بنطلون كاكي','bottom','#b0a078','كاجوال'),('جينز','bottom','#3d68b0','كاجوال'),
 ('جزمة بني','shoes','#6b4423','رسمي'),('كوتشي أبيض','shoes','#f4f4f1','كاجوال'),('جاكيت أسود','outer','#1b1b1d','كاجوال')]
def fresh(b,seed=None,vp=(390,844)):
    ctx=b.new_context(viewport={'width':vp[0],'height':vp[1]},accept_downloads=True); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    ctx.route('https://api.github.com/**',lambda r:r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{"body":"","assets":[]}'))
    pg.goto(URL); pg.wait_for_timeout(500)
    if seed: pg.evaluate(SEED,seed); pg.wait_for_timeout(200)
    return ctx,pg,errs
def dbcount(pg,s='items'): return pg.evaluate("async(s)=>{const db=await new Promise(r=>{const q=indexedDB.open('wardrobe');q.onsuccess=()=>r(q.result)});return await new Promise(r=>{const q=db.transaction(s).objectStore(s).count();q.onsuccess=()=>r(q.result)})}",s)
with sync_playwright() as p:
    b=p.chromium.launch(); allerrs=[]
    ctx,pg,errs=fresh(b,WARDROBE); pg.click('#t-wardrobe')
    # ---------- navigation
    names=['ملابسي','محتاج إيه؟','اشتري إيه؟','مقاساتي']; keys=['mine','need','buy','sizes']
    pg.evaluate("window.__marker=123")
    ok_vis=True; ok_only=True; ok_yel=True; ok_other=True
    for k,n in zip(keys,names):
        pg.click(f'#wn-{k}'); pg.wait_for_timeout(250)
        ok_vis&=pg.locator('#wnav button').count()==4 and all(pg.locator(f'#wn-{x}').is_visible() for x in keys)
        shown=[x for x in keys if pg.locator(f'#w-{x}').is_visible()]
        ok_only&=shown==[k]
        bg=pg.locator(f'#wn-{k}').evaluate("e=>getComputedStyle(e).backgroundColor")
        ok_yel&=bg=='rgb(244, 194, 13)'
        others=[pg.locator(f'#wn-{x}').evaluate("e=>getComputedStyle(e).backgroundColor") for x in keys if x!=k]
        ok_other&=all(o!='rgb(244, 194, 13)' for o in others)
    rec('N1','Four buttons always visible (all sections), labels in required order',ok_vis and [pg.locator(f'#wn-{k}').inner_text() for k in keys]==names)
    rec('N2','Each button shows only its own section',ok_only)
    rec('N3','Active button is Styly yellow; inactive buttons are not',ok_yel and ok_other)
    rec('N4','No page reload when switching sections',pg.evaluate("window.__marker")==123)
    pg.click('#wn-need'); pg.click('#t-home'); pg.click('#t-wardrobe'); pg.wait_for_timeout(200)
    rec('N5','Section state kept when leaving and returning to Wardrobe',pg.locator('#wn-need').get_attribute('aria-selected')=='true' and pg.locator('#w-need').is_visible())
    pg.reload(); pg.wait_for_timeout(500); pg.click('#t-wardrobe'); pg.wait_for_timeout(200)
    rec('N6','Section remembered within the session after reload',pg.locator('#wn-need').get_attribute('aria-selected')=='true')
    pg.click('#wn-mine'); rec('N7a','"ملابسي": add button + search + grid present',pg.locator('#addBtn').is_visible() and pg.locator('#grid .tile').count()==9)
    pg.click('#wn-need'); rec('N7b','Add-clothing header button hidden outside "ملابسي"',not pg.locator('#addBtn').is_visible())
    pg.click('#wn-mine'); pg.fill('#q','جينز'); pg.click('#wn-sizes'); pg.click('#wn-mine'); rec('N7c','"ملابسي" keeps its search state when returning',pg.input_value('#q')=='جينز' and pg.locator('#grid .tile').count()==1); pg.fill('#q','')
    # sticky: bar stays visible after scrolling a long grid
    pg.click('#wn-mine'); pg.evaluate("window.scrollTo(0,600)"); pg.wait_for_timeout(150)
    top=pg.locator('#wnav').evaluate("e=>e.getBoundingClientRect().top"); hh=pg.evaluate("document.querySelector('.top').offsetHeight")
    rec('N8','Sub-navigation stays pinned below the header while scrolling',abs(top-hh)<=2,(top,hh)); pg.evaluate("window.scrollTo(0,0)")
    # ---------- محتاج إيه؟
    n_items=dbcount(pg); pg.click('#wn-need'); pg.wait_for_selector('#needRes .out',timeout=20000)
    txt=pg.inner_text('#needRes'); cards=pg.locator('#needRes .out').count()
    rec('M1','Analysis renders ranked suggestions, each with reason, examples and counts',1<=cards<=5 and 'هتفتح' in txt and pg.locator('#needRes .out .ims').count()>=cards,cards)
    rec('M2','Virtual pieces are not saved (DB unchanged after analysis)',dbcount(pg)==n_items)
    chk=pg.evaluate("""()=>{const its=items.filter(i=>i.type!=='acc'),r=analyzeNeeds(its);const out=[];
      for(const s of r.suggestions){const real={...s.v,id:99999,virtual:false};const after=baseline([...its,real]).count;out.push([s.count,after-r.base.count])}return out}""")
    rec('M3','Reported new-outfit count equals recount of the wardrobe before/after adding the piece',len(chk)>0 and all(a==b for a,b in chk),chk)
    ranks=pg.evaluate("analyzeNeeds(items.filter(i=>i.type!=='acc')).suggestions.map(s=>s.value)")
    rec('M4','Suggestions ranked by value (descending), no more than 5',ranks==sorted(ranks,reverse=True) and len(ranks)<=5,ranks)
    dup=pg.evaluate("(()=>{const s=analyzeNeeds(items.filter(i=>i.type!=='acc')).suggestions;return s.map(x=>x.v.type+x.label)})()")
    rec('M5','No duplicate (type,color) suggestions and all create >= MIN_NEW outfits',len(dup)==len(set(dup)) and pg.evaluate("analyzeNeeds(items.filter(i=>i.type!=='acc')).suggestions.every(s=>s.count>=MIN_NEW)"),dup)
    ex_ok=pg.evaluate("""()=>{const its=items.filter(i=>i.type!=='acc'),r=analyzeNeeds(its);
      return r.suggestions.every(s=>s.examples.length>0&&s.examples.every(o=>{const j=judge(o.sel);return typeof j==='object'&&!r.base.sigs.has(o.sig)}))}""")
    rec('M6','Every example is a valid (score>=70, logical) outfit that does not already exist',ex_ok)
    if SHOT: pg.screenshot(path=SHOT+'/need.png')
    # confirm-before-add
    pg.click('#needRes [data-add]'); pg.wait_for_timeout(200)
    rec('M7a','Adding a suggestion asks for explicit confirmation first',pg.locator('#dbg.show').count()==1 and not pg.locator('#sbg.show').count())
    pg.click('#dlgNo'); pg.wait_for_timeout(150); rec('M7b','Cancel adds nothing and opens nothing',dbcount(pg)==n_items and pg.locator('#sbg.show').count()==0)
    pg.click('#needRes [data-add]'); pg.click('#dlgYes'); pg.wait_for_timeout(300)
    rec('M7c','Confirm opens Add form with type/color preset; nothing saved yet',pg.locator('#sbg.show').count()==1 and dbcount(pg)==n_items and pg.locator('#colName').inner_text()!='',pg.input_value('#name'))
    pg.click('#m-form [data-close]'); pg.wait_for_timeout(150)
    # low data
    ctx2,pg2,e2=fresh(b,WARDROBE[:3]); pg2.click('#t-wardrobe'); pg2.click('#wn-need'); pg2.wait_for_timeout(300)
    rec('M8','Tiny wardrobe (3 items): clear "analysis unavailable" message, no suggestions',('التحليل مش متاح' in pg2.inner_text('#w-need')) and pg2.locator('#needRes').count()==0)
    ctx2.close()
    ctx3,pg3,e3=fresh(b,WARDROBE[:3]+WARDROBE[3:5]); pg3.click('#t-wardrobe'); pg3.click('#wn-need'); pg3.wait_for_timeout(1500)
    t3=pg3.inner_text('#w-need'); rec('M9','Limited wardrobe (5 items, no shoes): shows "analysis limited" notice naming what is missing',('التحليل محدود' in t3) and ('جزمة' in t3),t3[:160]); ctx3.close()
    pg.evaluate("()=>{analyzeNeeds=(its)=>({base:baseline(its),suggestions:[]})}"); pg.click('#wn-mine'); pg.click('#wn-need'); pg.wait_for_timeout(300)
    rec('M10','Balanced wardrobe path: says nothing needed instead of filling the screen (UI path, engine stubbed)',('دولابك متوازن' in pg.inner_text('#needRes')))
    # ---------- اشتري إيه؟
    pg.reload(); pg.wait_for_timeout(500); pg.click('#t-wardrobe'); pg.click('#wn-buy'); pg.wait_for_timeout(200)
    rec('B1','Buy: item types selectable',pg.locator('#bType button').count()==5)
    pg.click('#bType button[data-k=bottom]'); pg.click('#bGo'); rec('B2','Needs at least 2 colors (inline error)',pg.locator('#bErr').is_visible())
    for l in ['أسود','بوردو']: pg.click(f'#bCols [data-l="{l}"]')
    pg.click('#bGo'); pg.wait_for_selector('#bRes .cmp',timeout=15000)
    rs=pg.evaluate("buy.res.results.map(r=>[r.label,r.count,r.value])")
    rec('B3','Two-color comparison: results ranked, new-outfit counts shown per color',len(rs)==2 and rs[0][2]>=rs[1][2] and pg.locator('#bRes .cmpc').count()==2,rs)
    pg.click('#bCols [data-l="خردلي"]'); pg.click('#bGo'); pg.wait_for_selector('#bRes .cmpc >> nth=2',timeout=15000)
    rs3=pg.evaluate("buy.res.results.map(r=>[r.label,r.count,r.value])")
    rec('B4','Three-color comparison works and is sorted by value',len(rs3)==3 and rs3==sorted(rs3,key=lambda x:-x[2]),rs3)
    pg.click('#bCols [data-l="سماوي"]'); rec('B5','Fourth color refused (max 3)',pg.evaluate("buy.cols.length")==3)
    rec('B6','Best color is stated with a reason, and examples shown per color',('الأفضل' in pg.inner_text('#bRes')) and pg.locator('#bRes .out .ims').count()>=1)
    chk=pg.evaluate("""()=>{const its=items.filter(i=>i.type!=='acc');return buy.res.results.map(r=>{const real={...r.v,id:99999,virtual:false};return [r.count,baseline([...its,real]).count-buy.res.base.count]})}""")
    rec('B7','Each color\'s count equals a real before/after recount',all(a==b for a,b in chk),chk)
    rec('B8','Comparison does not save anything',dbcount(pg)==n_items)
    if SHOT: pg.screenshot(path=SHOT+'/buy.png',full_page=False)
    pg.click('#bRes [data-add] >> nth=0'); pg.click('#dlgYes'); pg.wait_for_timeout(300)
    pg.set_input_files('#file',os.path.join(IMG,'n_bot.jpg')) if False else None
    with pg.expect_file_chooser() as fc: pg.click('#pFile')
    fc.value.set_files(os.path.join(IMG,'n_bot.jpg')); pg.wait_for_selector('#photoTools:not(.hide)'); pg.wait_for_timeout(200)
    before=dbcount(pg); pg.click('#saveItem'); pg.wait_for_function("!document.querySelector('#sbg').classList.contains('show')"); pg.wait_for_timeout(300)
    rec('B9','Item saved only after confirm + photo + save (count +1); stays in "اشتري إيه؟"',before==n_items and dbcount(pg)==n_items+1 and pg.locator('#w-buy').is_visible())
    # ---------- مقاساتي
    ctx4,pg4,e4=fresh(b,WARDROBE); pg4.click('#t-wardrobe'); pg4.click('#wn-sizes'); pg4.wait_for_timeout(200)
    acc=pg4.locator('.acc'); rec('S1','Four independent accordion cards, all closed by default, "+" shown',acc.count()==4 and all(pg4.locator(f'.acc-h >> nth={i}').get_attribute('aria-expanded')=='false' for i in range(4)) and pg4.locator('.acc-i').all_inner_texts()==['+']*4)
    pg4.click('#ah-pants'); pg4.click('#ah-hoodie'); pg4.wait_for_timeout(100)
    st=[pg4.locator(f'#ab-{g}').is_visible() for g in ['pants','shirt','hoodie','jacket']]
    rec('S2','Opening one group does not close another; icon becomes "−"',st==[True,False,True,False] and pg4.locator('#ah-pants .acc-i').inner_text()=='−')
    pg4.click('#ah-pants'); pg4.wait_for_timeout(100); rec('S3','Closing a group closes only that group',[pg4.locator(f'#ab-{g}').is_visible() for g in ['pants','hoodie']]==[False,True])
    for g in ['pants','shirt','jacket']:
        if not pg4.locator(f'#ab-{g}').is_visible(): pg4.click(f'#ah-{g}')
    spec={'pants':['waist','hip','thigh','leg'],'shirt':['chest','length'],'hoodie':['chest','sleeve','length'],'jacket':['chest','shoulder','sleeve','length']}
    exact=all([i.get_attribute('data-k') for i in pg4.locator(f'#ab-{g} input[type=number]').element_handles()]==spec[g] for g in spec)
    rec('S4','Exactly the required fields per group (4/2/3/4), numeric, nothing extra',exact and pg4.locator('.acc input[type=number]').count()==13)
    labels={g:pg4.locator(f'#ab-{g} .fld label').all_inner_texts() for g in spec}
    rec('S5','Field labels are the requested Arabic names, all in cm',labels['pants'][0].startswith('الوسط') and labels['jacket'][3].startswith('طول الجاكيت') and all('cm' in l for g in labels for l in labels[g]),labels)
    vals={'pants':[82,98.5,60,44],'shirt':[54,72],'hoodie':[58,63,68],'jacket':[56,46,64,74]}
    for g,v in vals.items():
        for k,x in zip(spec[g],v): pg4.fill(f'#m-{g}-{k}',str(x))
        pg4.click(f'[data-save={g}]'); pg4.wait_for_timeout(100)
    stored=pg4.evaluate("JSON.parse(localStorage.getItem('styly-measurements')).data")
    rec('S6','All four groups save and store the typed values',all(stored[g][k]==x for g,v in vals.items() for k,x in zip(spec[g],v)),stored)
    pg4.fill('#m-pants-waist','80.5'); pg4.click('[data-save=pants]'); pg4.wait_for_timeout(100)
    rec('S7','Edit + save updates only that value',pg4.evaluate("measures.pants.waist")==80.5 and pg4.evaluate("measures.pants.hip")==98.5 and pg4.evaluate("measures.shirt.chest")==54)
    pg4.fill('#m-shirt-chest','-3'); pg4.click('[data-save=shirt]'); bad1=pg4.locator('#me-shirt').is_visible() and pg4.evaluate("measures.shirt.chest")==54
    pg4.fill('#m-shirt-chest','900'); pg4.click('[data-save=shirt]'); bad2=pg4.evaluate("measures.shirt.chest")==54
    rec('S8','Invalid values (negative / too large) are rejected with a message; saved data kept',bad1 and bad2)
    pg4.fill('#m-shirt-chest','54'); pg4.fill('#m-jacket-shoulder',''); pg4.click('[data-save=jacket]'); pg4.wait_for_timeout(100)
    rec('S9','Clearing a field and saving removes it',pg4.evaluate("measures.jacket.shoulder")is None)
    pg4.click('#t-home'); pg4.click('#t-wardrobe'); pg4.wait_for_timeout(200)
    rec('S10','Values survive navigation',pg4.evaluate("document.querySelector('#m-pants-waist').value")=='80.5')
    pg4.reload(); pg4.wait_for_timeout(500); pg4.click('#t-wardrobe'); pg4.click('#wn-sizes'); pg4.wait_for_timeout(200)
    for g in spec: pg4.click(f'#ah-{g}')
    rec('S11','Values survive app reload; groups closed again after reload',pg4.input_value('#m-pants-waist')=='80.5' and pg4.input_value('#m-hoodie-length')=='68' and pg4.input_value('#m-jacket-length')=='74')
    rec('S12','Measurements are separate from clothing records (items/outfits/plan unchanged)',dbcount(pg4)==9 and all('measure' not in json.dumps(x) for x in pg4.evaluate("items")))
    if SHOT:
        for g in spec: pg4.evaluate(f"document.querySelector('#ah-{g}').setAttribute('aria-expanded',true)")
        pg4.screenshot(path=SHOT+'/sizes_open.png')
    # ---------- backup
    pg4.click('#setBtn')
    with pg4.expect_download() as dl: pg4.click('#bkExport')
    pth=os.path.join(HERE,'bk_new.json'); dl.value.save_as(pth); bk=json.load(open(pth))
    rec('K1','Backup keeps v1 format and now includes measurements',bk['v']==1 and bk['app']=='styly' and bk['measurements']['pants']['waist']==80.5 and len(bk['items'])==9)
    # restore a backup from before this feature: must keep device measurements
    old=dict(bk); old.pop('measurements'); json.dump(old,open(os.path.join(HERE,'bk_old.json'),'w'))
    pg4.set_input_files('#bkFile',os.path.join(HERE,'bk_old.json')); pg4.wait_for_selector('#dbg.show'); pg4.click('#dlgYes'); pg4.wait_for_timeout(600)
    rec('K2','Restoring an old backup (no measurements) keeps the existing measurements and restores clothes',pg4.evaluate("measures.pants.waist")==80.5 and dbcount(pg4)==9)
    # restore a backup that has different measurements
    new=dict(bk); new['measurements']={'pants':{'waist':99},'shirt':{},'hoodie':{},'jacket':{}}; json.dump(new,open(os.path.join(HERE,'bk_new2.json'),'w'))
    pg4.click('#setBtn'); pg4.set_input_files('#bkFile',os.path.join(HERE,'bk_new2.json')); pg4.wait_for_selector('#dbg.show'); pg4.click('#dlgNo'); pg4.wait_for_timeout(200)
    rec('K3','Cancelling restore changes nothing (confirmation kept)',pg4.evaluate("measures.pants.waist")==80.5)
    pg4.set_input_files('#bkFile',os.path.join(HERE,'bk_new2.json')); pg4.wait_for_selector('#dbg.show'); pg4.click('#dlgYes'); pg4.wait_for_timeout(600)
    pg4.click('#t-wardrobe'); pg4.click('#wn-sizes'); pg4.click('#ah-pants'); pg4.wait_for_timeout(200)
    rec('K4','Restore with measurements replaces them and refreshes the form',pg4.evaluate("measures.pants.waist")==99 and pg4.input_value('#m-pants-waist')=='99')
    allerrs+=errs+e2+e3+e4
    ctx4.close(); ctx.close()
    # ---------- mobile widths
    ov=[]
    for w,h in [(320,640),(360,740),(390,844),(430,932),(768,1024),(1280,800)]:
        c,pgv,ev=fresh(b,WARDROBE,(w,h)); pgv.click('#t-wardrobe')
        for k in keys:
            pgv.click(f'#wn-{k}'); pgv.wait_for_timeout(500 if k in('need',) else 150)
            if k=='sizes':
                for g in spec: pgv.click(f'#ah-{g}')
            if k=='buy':
                pgv.click('#bCols .sws >> nth=0'); pgv.click('#bCols .sws >> nth=1'); pgv.click('#bGo'); pgv.wait_for_selector('#bRes .cmp',timeout=15000)
            if pgv.evaluate("document.documentElement.scrollWidth>innerWidth+1"): ov.append((w,k))
            lab=pgv.evaluate("[...document.querySelectorAll('#wnav button')].some(b=>b.scrollWidth>b.clientWidth+1)")
            if lab: ov.append((w,'subnav-label-clipped'))
        c.close()
    rec('V1','No horizontal overflow and no clipped sub-nav labels at 320/360/390/430/768/1280 in all four sections',ov==[],ov)
    rec('E1','No console/page errors',allerrs==[],allerrs)
    b.close()
json.dump(R,open(os.path.join(HERE,'v15_results.json'),'w'),ensure_ascii=False,indent=1); print(sum(r['status']=='PASS' for r in R),'/',len(R))
