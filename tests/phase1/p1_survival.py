# Data-survival: create data with the OLD build (main), then serve the NEW build on the same origin/profile.
from playwright.sync_api import sync_playwright
import os,json,subprocess,time,shutil,sys
HERE=os.path.dirname(os.path.abspath(__file__)); G=os.path.join(HERE,'images'); S=os.path.join(HERE,'.work')
OLD=os.path.join(S,'old'); NEW=os.path.abspath(os.path.join(HERE,'..','..','www')); PORT=8766; UD=os.path.join(S,'ud'); shutil.rmtree(UD,ignore_errors=True)
def serve(d):
    return subprocess.Popen(['python3','-m','http.server',str(PORT)],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
DUMP="""async()=>{const db=await new Promise(r=>{const q=indexedDB.open('wardrobe');q.onsuccess=()=>r(q.result)});const g=s=>new Promise(r=>{const q=db.transaction(s).objectStore(s).getAll();q.onsuccess=()=>r(q.result)});return{v:db.version,items:await g('items'),outfits:await g('outfits'),plan:await g('plan'),prefs:localStorage.getItem('styly-prefs'),lb:localStorage.getItem('styly-last-backup')}}"""
res={}
# old files must look OLDER than the new build, otherwise If-Modified-Since makes the server answer 304 for the new files (a test artifact, not an app issue)
for _f in os.listdir(OLD): os.utime(os.path.join(OLD,_f),(1600000000,1600000000))
srv=serve(OLD); time.sleep(1)
with sync_playwright() as p:
    c=p.chromium.launch_persistent_context(UD,viewport={'width':390,'height':844}); pg=c.new_page(); pg.goto(f'http://localhost:{PORT}/'); pg.wait_for_timeout(1200)
    res['old_ui']=pg.locator('#t-wardrobe').count()==1 and pg.locator('#t-home').count()==0
    for f,typ,name in [('n_top.jpg','top','a'),('n_bot.jpg','bottom','b'),('br_sh.jpg','shoes','c'),('w_top.jpg','top','d')]:
        pg.click('#addBtn')
        with pg.expect_file_chooser() as fc: pg.click('#pFile')
        fc.value.set_files(os.path.join(G,f)); pg.wait_for_selector('#photoTools:not(.hide)'); pg.wait_for_timeout(150)
        pg.click(f'#typeSeg button[data-k={typ}]'); pg.fill('#name',name); pg.click('#saveItem'); pg.wait_for_timeout(300)
    pg.click('#t-mix'); pg.click('#shuffle'); pg.click('#saveOutfit'); pg.fill('#oName','o1'); pg.click('#oSave'); pg.wait_for_timeout(300)
    pg.click('#t-plan'); pg.click('#chg'); pg.click('#pickList .pk'); pg.wait_for_timeout(300)
    before=pg.evaluate(DUMP); c.close()
srv.terminate(); srv.wait(); time.sleep(1)
srv=serve(NEW); time.sleep(1)
with sync_playwright() as p:
    c=p.chromium.launch_persistent_context(UD,viewport={'width':390,'height':844}); pg=c.new_page(); pg.goto(f'http://localhost:{PORT}/'); 
    for _i in range(40):
        pg.wait_for_timeout(500)
        st=pg.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.map(x=>x.active&&x.active.state).join())")
        n=pg.locator('#t-home').count()
        if st=='activated' and n: break
    print('WAITED',_i*0.5,st,n)
    res['first_launch_after_update_is_new_ui']=pg.locator('#t-home').count()==1
    pg.goto(f'http://localhost:{PORT}/'); pg.wait_for_timeout(800)
    res['second_launch_new_ui']=pg.locator('#t-home').count()==1
    after=pg.evaluate(DUMP)
    res['db_identical']=json.dumps(before,sort_keys=True)==json.dumps(after,sort_keys=True)
    res['counts']=[len(after['items']),len(after['outfits']),len(after['plan'])]
    pg.click('#t-wardrobe'); res['wardrobe_tiles']=pg.locator('#grid .tile').count()
    pg.click('#t-outfits'); res['outfit_cards']=pg.locator('#outfits .out').count()
    pg.click('#t-plan'); res['plan_has_outfit']=pg.locator('#detail .ims').count()==1
    pg.click('#t-mix'); pg.click('#shuffle'); pg.wait_for_timeout(200); res['mix_score_old_items']=pg.locator('#score .ring').count()==1
    # edit an old item (no colorAuto) and save
    pg.click('#t-wardrobe'); pg.click('#grid .tile'); pg.click('#editItem'); pg.wait_for_timeout(300); pg.click('#saveItem'); pg.wait_for_timeout(400)
    ed=pg.evaluate(DUMP); old0=[i for i in before['items'] if i['id']==ed['items'][-1]['id']]
    res['edit_old_item_ok']=len(ed['items'])==len(before['items'])
    c.close()
srv.terminate()
print(json.dumps(res,ensure_ascii=False,indent=1))
json.dump(res,open(os.path.join(G,'p1_survival.json'),'w'))
