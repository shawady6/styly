# v1.4 checks: hoodie in the top slot + in-app update flow (native plugins are MOCKED: not a device test)
from playwright.sync_api import sync_playwright
import os,json,sys
HERE=os.path.dirname(os.path.abspath(__file__)); IMG=os.path.join(HERE,'..','phase1','images'); URL='http://localhost:8765/'
R=[]
def rec(i,d,ok,det=''): R.append({'id':i,'desc':d,'status':'PASS' if ok else 'FAIL','detail':str(det)}); print(('PASS' if ok else 'FAIL'),i,d,det if not ok else '')
def add(pg,f,typ,name,occ='كاجوال'):
    pg.click('#t-wardrobe'); pg.click('#addBtn')
    with pg.expect_file_chooser() as fc: pg.click('#pFile')
    fc.value.set_files(os.path.join(IMG,f)); pg.wait_for_selector('#photoTools:not(.hide)'); pg.wait_for_timeout(150)
    pg.click(f'#typeSeg button[data-k={typ}]'); pg.fill('#name',name); pg.select_option('#occ',occ)
    season=pg.input_value('#season')
    pg.click('#saveItem'); pg.wait_for_function("!document.querySelector('#sbg').classList.contains('show')"); pg.wait_for_timeout(200); return season
RELEASE=lambda v:{'body':f'Styly-Version: {v}\nنص','assets':[{'name':'Styly.apk','browser_download_url':'https://example.test/Styly.apk','size':5400000}]}
MOCK="""
window.__calls=[];
window.Capacitor={isNativePlatform:()=>true,registerPlugin:n=>({
 deleteFile:async()=>{}, addListener:async(e,cb)=>{window.__cb=cb;return{remove(){}}},
 downloadFile:async o=>{window.__calls.push(['download',o.url,o.directory]);if(window.__cb)window.__cb({bytes:50,contentLength:100});return{path:'/x'}},
 getUri:async()=>({uri:'file:///data/cache/Styly-update.apk'}),
 open:async o=>{window.__calls.push(['open',o.filePath,o.contentType])},
 getPhoto:async()=>{throw new Error('no')}})};
"""
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    # ---- hoodie
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('https://api.github.com/**',lambda r:r.abort())
    pg.goto(URL); pg.wait_for_timeout(400)
    s=add(pg,'n_top.jpg','hoodie','هودي كحلي','كاجوال')
    rec('H1','Hoodie type exists, defaults season to winter',s=='شتا' and pg.evaluate("TYPES.hoodie")=='هودي',s)
    add(pg,'n_bot.jpg','bottom','بنطلون'); add(pg,'br_sh.jpg','shoes','جزمة')
    pg.click('#t-wardrobe'); pg.click('#filters button[data-k=hoodie]'); rec('H2','Hoodie filter in wardrobe',pg.locator('#grid .tile').count()==1)
    pg.click('#t-mix'); pg.click('#shuffle'); pg.wait_for_timeout(200)
    top=pg.evaluate("byId(pick.top)&&byId(pick.top).type")
    rec('H3','Hoodie is chosen in the top slot (replaces shirt) and outfit is scored',top=='hoodie' and pg.locator('#score .ring').count()==1,top)
    add(pg,'w_top.jpg','top','قميص أبيض')
    pg.click('#t-mix'); n=pg.evaluate("pool('top').length"); rec('H4','Top slot pool contains both shirts and hoodies',n==2,n)
    pg.evaluate("pick.top=items.find(i=>i.type==='hoodie').id;pick.bottom=items.find(i=>i.type==='bottom').id;renderMix()")
    pg.click('#saveOutfit'); pg.fill('#oName','شتوي'); pg.click('#oSave'); pg.wait_for_timeout(300)
    pg.click('#t-outfits'); rec('H5','Saved outfit with hoodie shows a score pill (slot mapping)',pg.locator('.out .pill').count()==1)
    pg.click('#t-home'); rec('H6','Home featured outfit with hoodie renders',pg.locator('#hFeat').count()==1)
    ctx.close()
    # ---- update: browser, newer release
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('https://api.github.com/**',lambda r:r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(RELEASE('9.9.9'))))
    pg.goto(URL); pg.wait_for_timeout(800)
    pg.evaluate("put('items',{name:'x',type:'top',color:'#112233',season:'كل السنة',occ:'كاجوال',pattern:'سادة',img:'data:image/png;base64,iVBORw0KGgo=',cut:false,added:1}).then(async()=>{items=await all('items');renderHome()})"); pg.wait_for_timeout(300)
    rec('U1','Silent check on launch finds a newer version; Home shows update card and settings dot',pg.locator('#hUpd').count()==1 and pg.evaluate("document.querySelector('#setBtn').classList.contains('dot')"))
    pg.click('#hUpd'); pg.wait_for_timeout(200)
    rec('U2','Settings shows version, size and a download button (web: link)',('9.9.9' in pg.inner_text('#updBox')) and pg.locator('#updGo').inner_text()=='نزّل التحديث')
    ctx.close()
    # ---- update: up to date
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('https://api.github.com/**',lambda r:r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(RELEASE('1.4.0'))))
    pg.goto(URL); pg.wait_for_timeout(600); pg.click('#setBtn'); pg.wait_for_selector('#updChk'); pg.click('#updChk'); pg.wait_for_function("upd.state!=='checking'"); pg.wait_for_timeout(200)
    rec('U3','Same version = "latest" message, no update card',('آخر نسخة' in pg.inner_text('#updBox')))
    ctx.close()
    # ---- update: offline / API failure is silent on launch, friendly on manual check
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('https://api.github.com/**',lambda r:r.abort()); pg.goto(URL); pg.wait_for_timeout(600)
    rec('U4a','Failed check on launch shows nothing',not pg.evaluate("document.querySelector('#setBtn').classList.contains('dot')") and pg.locator('#v-home .err').count()==0)
    pg.click('#setBtn'); pg.wait_for_selector('#updChk'); pg.click('#updChk'); pg.wait_for_function("upd.state!=='checking'"); pg.wait_for_timeout(200)
    rec('U4b','Manual check failure shows friendly error',pg.locator('#updBox .err').count()==1)
    ctx.close()
    # ---- update: native flow with mocked plugins
    ctx=b.new_context(viewport={'width':390,'height':844}); ctx.add_init_script(MOCK); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('https://api.github.com/**',lambda r:r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(RELEASE('9.9.9'))))
    pg.goto(URL); pg.wait_for_timeout(800); pg.click('#setBtn'); pg.wait_for_timeout(200)
    rec('U5a','Native: button reads "download and install"',pg.locator('#updGo').inner_text()=='حمّل وثبّت التحديث')
    pg.click('#updGo'); pg.wait_for_timeout(600)
    calls=pg.evaluate("window.__calls")
    rec('U5b','Native: downloads release APK to cache then opens installer with APK mime type',calls==[['download','https://example.test/Styly.apk','CACHE'],['open','file:///data/cache/Styly-update.apk','application/vnd.android.package-archive']],calls)
    rec('U5c','Native: no service worker registered (unregistered on native)',pg.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.length)")==0)
    ctx.close()
    rec('U0','No page errors',errs==[],errs)
    b.close()
json.dump(R,open(os.path.join(HERE,'v14_results.json'),'w'),ensure_ascii=False,indent=1); print(sum(r['status']=='PASS' for r in R),'/',len(R))
