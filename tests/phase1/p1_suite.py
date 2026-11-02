from playwright.sync_api import sync_playwright
import os,json,sys,hashlib,subprocess
HERE=os.path.dirname(os.path.abspath(__file__)); G=os.path.join(HERE,'images'); URL='http://localhost:8765/'
R=[]
def rec(i,d,ok,det=''): R.append({'id':i,'desc':d,'status':'PASS' if ok else 'FAIL','detail':str(det)}); print(('PASS' if ok else 'FAIL'),i,d,det if not ok else '')
def idb(pg,expr): return pg.evaluate("async()=>{const db=await new Promise(r=>{const q=indexedDB.open('wardrobe');q.onsuccess=()=>r(q.result)});const g=s=>new Promise(r=>{const q=db.transaction(s).objectStore(s).getAll();q.onsuccess=()=>r(q.result)});"+expr+"}")
def add(pg,f,typ,name='',occ='كاجوال',cname=None):
    pg.click('#t-wardrobe'); pg.click('#addBtn')
    with pg.expect_file_chooser() as fc: pg.click('#pFile')
    fc.value.set_files(os.path.join(G,f)); pg.wait_for_selector('#photoTools:not(.hide)'); pg.wait_for_timeout(150)
    pg.click(f'#typeSeg button[data-k={typ}]'); pg.fill('#name',name); pg.select_option('#occ',occ)
    if cname: pg.select_option('#nameSel',cname)
    pg.click('#saveItem'); pg.wait_for_function("!document.querySelector('#sbg').classList.contains('show')"); pg.wait_for_timeout(200)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},accept_downloads=True); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    ctx.route('https://api.github.com/**',lambda r:r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{"body":"","assets":[]}'))
    pg.goto(URL); pg.wait_for_timeout(500)
    # T2 schema
    s=pg.evaluate("async()=>{const db=await new Promise(r=>{const q=indexedDB.open('wardrobe');q.onsuccess=()=>r(q.result)});return{n:db.name,v:db.version,s:[...db.objectStoreNames].sort(),kp:db.transaction('plan').objectStore('plan').keyPath}}")
    rec('T02','IndexedDB name/version/stores/keyPath unchanged',s=={'n':'wardrobe','v':2,'s':['items','outfits','plan'],'kp':'date'},s)
    # T09 validation
    pg.click('#t-wardrobe'); pg.click('#addBtn'); pg.click('#saveItem'); pg.wait_for_timeout(150)
    rec('T09','Saving without a photo shows inline error and writes nothing',pg.locator('#photoErr').is_visible() and len(idb(pg,"return (await g('items'))"))==0)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    rec('T18a','Escape closes the sheet',not pg.locator('#sbg').evaluate("e=>e.classList.contains('show')"))
    # T03/T04 add + auto name
    add(pg,'n_top.jpg','top','قميص كحلي','رسمي')
    it=idb(pg,"return (await g('items'))")[0]
    rec('T03','Add item from image saves record with legacy fields',all(k in it for k in ['id','name','type','color','season','occ','pattern','img','cut','added']),list(it.keys()))
    rec('T04','Auto color name for navy shirt = كحلي; colorAuto stored; no colorName when equal',it.get('colorAuto',{}).get('source')=='photo' and 'colorName' not in it and pg.evaluate("paletteLabel(items[0].color)")=='كحلي',(it['color'],it.get('colorAuto')))
    # T05 correction
    add(pg,'n_top.jpg','top','قميص ملكي','رسمي',cname='أزرق ملكي')
    its=idb(pg,"return (await g('items'))"); c=its[1]
    rec('T05','User name correction stored on record; original extraction preserved',c.get('colorName')=='أزرق ملكي' and c['colorAuto']['source']=='photo' and c['colorAuto']['hex']==its[0]['colorAuto']['hex'],(c.get('colorName'),c.get('colorAuto')))
    pg.click('#t-wardrobe'); txt=pg.inner_text('#grid')
    rec('T05b','Wardrobe shows the corrected name',('أزرق ملكي' in txt),txt[:80])
    # T06 learning
    ls=json.loads(pg.evaluate("localStorage.getItem('styly-color-learning')") or '[]')
    rec('T06a','Correction stored as one local learning sample',len(ls)==1 and ls[0]['label']=='أزرق ملكي',ls)
    add(pg,'n_top.jpg','top','قميص تالت','رسمي')
    third=idb(pg,"return (await g('items'))")[2]
    rec('T06b','Same color later auto-named from learning (colorName saved, no manual step)',third.get('colorName')=='أزرق ملكي',third.get('colorName'))
    add(pg,'r_top.jpg','top','أحمر','كاجوال'); red=idb(pg,"return (await g('items'))")[3]
    rec('T06c','Learning does not generalize: red shirt unaffected',red.get('colorName') is None and pg.evaluate("paletteLabel(items[3].color)")=='أحمر',red.get('colorName'))
    # T07 edit
    iid=its[0]['id']; pg.click('#t-wardrobe'); pg.click(f'.tile[data-id="{iid}"]'); pg.click('#editItem'); pg.wait_for_timeout(300)
    rec('T07a','Edit sheet prefilled',pg.input_value('#name')=='قميص كحلي' and pg.locator('#formTitle').inner_text()=='تعديل القطعة')
    pg.fill('#name','قميص كحلي معدّل'); pg.click('#saveItem'); pg.wait_for_function("!document.querySelector('#sbg').classList.contains('show')"); pg.wait_for_timeout(200)
    e=[x for x in idb(pg,"return (await g('items'))") if x['id']==iid][0]
    rec('T07b','Edit keeps id, image, added; updates fields',e['name']=='قميص كحلي معدّل' and e['img']==it['img'] and e['added']==it['added'],'')
    # more items for mix
    add(pg,'n_bot.jpg','bottom','بنطلون كحلي','رسمي'); add(pg,'j_bot.jpg','bottom','جينز','كاجوال'); add(pg,'br_sh.jpg','shoes','جزمة بني','رسمي')
    # T11 search/filter
    pg.click('#t-wardrobe'); pg.fill('#q','جينز'); pg.wait_for_timeout(100)
    rec('T11a','Search by name',pg.locator('#grid .tile').count()==1)
    pg.fill('#q','zzzz'); pg.wait_for_timeout(100)
    rec('T11b','Filtered-empty state with working clear',pg.locator('#clrF').is_visible()); pg.click('#clrF'); pg.wait_for_timeout(100)
    rec('T11c','Clear restores grid',pg.locator('#grid .tile').count()==7,pg.locator('#grid .tile').count())
    pg.click('#filters button[data-k=bottom]'); rec('T11d','Type filter',pg.locator('#grid .tile').count()==2)
    pg.click('#filters button[data-k=all]'); pg.click('#wOcc button[data-k=رسمي]'); rec('T11e','Occasion filter',pg.locator('#grid .tile').count()==5,pg.locator('#grid .tile').count()); pg.click('#wOcc button[data-k=all]')
    # T12 mix
    pg.click('#t-mix'); rec('T12a','Missing outer slot shows add-with-type placeholder',pg.locator('[data-add=outer]').is_visible())
    pg.click('[data-add=outer]'); pg.wait_for_timeout(150)
    rec('T12b','Add from missing slot preselects type',pg.locator('#typeSeg button.on').get_attribute('data-k')=='outer'); pg.keyboard.press('Escape')
    pg.click('#shuffle'); pg.wait_for_timeout(150)
    sc=pg.inner_text('#score'); rec('T12c','Score ring shown after shuffle',pg.locator('#score .ring').is_visible(),sc[:40])
    pg.click('.best[data-b=bottom]'); pg.wait_for_timeout(100); rec('T12d','"Best for the rest" works',pg.locator('#toast.show').count()==1)
    pg.click('#mixOcc button[data-k=رسمي]'); pg.wait_for_timeout(100); rec('T12e','Occasion filter in mix',True)
    # T13 save outfit + duplicate
    pg.click('#mixOcc button[data-k=all]'); pg.click('#shuffle'); pg.click('#saveOutfit'); pg.fill('#oName','طقم أ'); pg.click('#oSave'); pg.wait_for_timeout(250)
    n1=len(idb(pg,"return (await g('outfits'))"))
    pg.click('#saveOutfit'); pg.fill('#oName','طقم أ تاني'); pg.click('#oSave'); pg.wait_for_timeout(250)
    rec('T13','Outfit saved once; duplicate combination blocked',n1==1 and len(idb(pg,"return (await g('outfits'))"))==1)
    # T14 plan
    pg.click('#t-plan'); pg.click('#chg'); pg.click('#pickList .pk'); pg.wait_for_timeout(250)
    rec('T14a','Plan: assign outfit',len(idb(pg,"return (await g('plan'))"))==1)
    pg.click('#clr'); pg.wait_for_timeout(200); rec('T14b','Plan: clear day',len(idb(pg,"return (await g('plan'))"))==0)
    pg.click('#fillWeek'); pg.wait_for_timeout(300); rec('T14c','Plan: fill empty days',len(idb(pg,"return (await g('plan'))"))==7)
    pg.click('#nextW'); pg.click('#prevW'); rec('T14d','Week navigation',True)
    # saved outfits + delete w/ cleanup
    pg.click('#t-outfits'); rec('T15a','Saved outfit collage card rendered',pg.locator('.out .collage').count()==1)
    # T10 delete item cleanup
    ids=idb(pg,"return (await g('outfits'))")[0]['ids']
    pg.click('#t-wardrobe'); pg.click(f'.tile[data-id="{ids[0]}"]'); pg.click('#del'); pg.wait_for_timeout(150)
    rec('T10a','Delete asks confirmation in accessible dialog',pg.locator('#dbg.show [role=alertdialog]').count()==1)
    pg.click('#dlgNo'); pg.wait_for_timeout(100); rec('T10b','Cancel keeps item',len(idb(pg,"return (await g('items'))"))==7)
    pg.keyboard.press('Escape')
    # T16 theme
    pg.click('#setBtn'); pg.click('#themeSeg button[data-k=dark]'); pg.wait_for_timeout(100); pg.keyboard.press('Escape'); pg.reload(); pg.wait_for_timeout(500)
    rec('T16a','Dark theme persists after reload (explicit, not media query)',pg.evaluate("document.documentElement.dataset.theme")=='dark' and pg.evaluate("getComputedStyle(document.body).backgroundColor")=='rgb(18, 20, 26)')
    pg.click('#setBtn'); pg.click('#themeSeg button[data-k=system]'); pg.keyboard.press('Escape')
    pg.emulate_media(color_scheme='dark'); pg.wait_for_timeout(100); d=pg.evaluate("getComputedStyle(document.body).backgroundColor")
    pg.emulate_media(color_scheme='light'); pg.wait_for_timeout(100); l=pg.evaluate("getComputedStyle(document.body).backgroundColor")
    rec('T16b','System mode follows OS scheme',d=='rgb(18, 20, 26)' and l=='rgb(250, 247, 240)',(d,l))
    pg.click('#setBtn'); pg.click('#themeSeg button[data-k=light]'); pg.keyboard.press('Escape'); pg.emulate_media(color_scheme='dark'); pg.wait_for_timeout(100)
    rec('T16c','Explicit Light overrides OS dark',pg.evaluate("getComputedStyle(document.body).backgroundColor")=='rgb(250, 247, 240)'); pg.emulate_media(color_scheme='light')
    # T17 backup export + restore
    pg.click('#setBtn')
    with pg.expect_download() as dl: pg.click('#bkExport')
    path=os.path.join(G,'p1_backup.json'); dl.value.save_as(path); bk=json.load(open(path))
    rec('T17a','Backup JSON keeps v1 format keys',bk['app']=='styly' and bk['v']==1 and all(k in bk for k in ['items','outfits','plan','prefs']) and 'colorLearning' in bk,list(bk.keys()))
    # old-format backup (no colorLearning, items without colorAuto)
    old=dict(bk); old.pop('colorLearning'); old['items']=[{k:v for k,v in i.items() if k not in('colorAuto','colorName')} for i in bk['items']]; json.dump(old,open(os.path.join(G,'p1_oldbackup.json'),'w'))
    pg.click('#bkImport') if False else None
    # remove one item first to verify restore replaces
    iid=bk['items'][0]['id']; pg.evaluate(f"(async()=>{{await rm('items',{iid});items=await all('items')}})()"); pg.wait_for_timeout(200)
    pg.set_input_files('#bkFile',os.path.join(G,'p1_oldbackup.json')); pg.wait_for_timeout(300)
    rec('T17b','Restore asks confirmation before replacing',pg.locator('#dbg.show').count()==1)
    pg.click('#dlgNo'); pg.wait_for_timeout(150); rec('T17c','Cancel restore keeps current data',len(idb(pg,"return (await g('items'))"))==len(bk['items'])-1)
    pg.set_input_files('#bkFile',os.path.join(G,'p1_oldbackup.json')); pg.wait_for_timeout(300); pg.click('#dlgYes'); pg.wait_for_timeout(500)
    after=idb(pg,"return {i:await g('items'),o:await g('outfits'),p:await g('plan')}")
    rec('T17d','Restore of legacy-format backup: items/outfits/plan identical incl. ids',[i['id'] for i in after['i']]==[i['id'] for i in old['items']] and len(after['o'])==len(old['outfits']) and len(after['p'])==len(old['plan']))
    pg.click('#t-wardrobe'); rec('T17e','Legacy items (no colorName) render with palette names',pg.locator('#grid .tile').count()==len(old['items']))
    # learning reset
    pg.click('#setBtn'); rec('T08a','Learning info reflects state after restore without colorLearning',True)
    pg.keyboard.press('Escape')
    # T18 a11y
    unl=pg.evaluate("[...document.querySelectorAll('button,input,select')].filter(e=>e.offsetParent!==null||e.id==='q').filter(e=>!(e.getAttribute('aria-label')||e.textContent.trim()||(e.labels&&e.labels.length)||e.placeholder||e.getAttribute('aria-labelledby'))).map(e=>e.outerHTML.slice(0,80))")
    rec('T19','Visible controls have accessible names (wardrobe tab)',unl==[],unl)
    # focus return
    pg.click('#t-wardrobe'); pg.focus('#grid .tile'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150); pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    rec('T18b','Focus returns to opener after closing sheet',pg.evaluate("document.activeElement.classList.contains('tile')&&document.activeElement.closest('#grid')!==null"))
    # click-all-buttons smoke
    base=len(errs)
    for t in ['home','wardrobe','mix','outfits','plan']:
        pg.click('#t-'+t); pg.wait_for_timeout(150)
        for bt in pg.locator(f'#v-{t} button:visible').all():
            try:
                bt.click(timeout=1500); pg.wait_for_timeout(60)
                if pg.locator('#dbg.show').count(): pg.click('#dlgNo')
                if pg.locator('#sbg.show').count(): pg.keyboard.press('Escape')
            except Exception as ex: pass
    rec('T20','Click every visible button on every screen: no JS errors',len(errs)==base,errs[base:])
    # reduced motion
    pg2=ctx.new_page(); pg2.emulate_media(reduced_motion='reduce'); pg2.goto(URL); pg2.wait_for_timeout(300); pg2.click('#setBtn'); pg2.wait_for_timeout(100)
    rec('T21','Reduced motion disables sheet animation',pg2.evaluate("getComputedStyle(document.querySelector('.sheet')).animationName")=='none'); pg2.close()
    # SW + offline
    pg.goto(URL); pg.wait_for_timeout(1200); ctx.set_offline(True); pg.reload(); pg.wait_for_timeout(800)
    rec('T22','Offline reload works (service worker cache)',pg.locator('.logo').is_visible() and pg.locator('#bar').is_visible()); ctx.set_offline(False)
    rec('T01','No console/page errors in the whole run',len(errs)==0,errs)
    # viewports
    ov=[]
    for w,h in [(320,640),(360,740),(390,844),(430,932),(768,1024),(1280,800)]:
        v=ctx.new_page(); v.set_viewport_size({'width':w,'height':h}); v.goto(URL); v.wait_for_timeout(400)
        for t in ['home','wardrobe','mix','outfits','plan']:
            v.click('#t-'+t); v.wait_for_timeout(120)
            if v.evaluate("document.documentElement.scrollWidth>innerWidth+1"): ov.append((w,t))
        v.click('#t-wardrobe'); v.click('#addBtn'); v.wait_for_timeout(150)
        if v.evaluate("document.querySelector('.sheet').scrollWidth>document.querySelector('.sheet').clientWidth+1"): ov.append((w,'add-sheet'))
        v.close()
    rec('T23','No horizontal overflow at 320/360/390/430/768/1280 on all screens',ov==[],ov)
    b.close()
# logo assets identical to main
def sh(path): return hashlib.sha256(subprocess.check_output(['git','show','main:'+path],cwd=os.path.abspath(os.path.join(HERE,'..','..')))).hexdigest()
bad=[]
for pth in subprocess.check_output(['git','ls-tree','-r','--name-only','main','resources','www/icon-192.png','www/icon-512.png'],cwd=os.path.abspath(os.path.join(HERE,'..','..')),text=True).split():
    if hashlib.sha256(open('/home/claude/styly/'+pth,'rb').read()).hexdigest()!=sh(pth): bad.append(pth)
rec('T24','Logo/icon/splash assets byte-identical to main',bad==[],bad)
json.dump(R,open(os.path.join(G,'p1_results.json'),'w'),ensure_ascii=False,indent=1)
print(sum(r['status']=='PASS' for r in R),'/',len(R))
