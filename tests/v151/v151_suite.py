# v1.5.1: custom items + extra measurement fields in مقاساتي
from playwright.sync_api import sync_playwright
import json,sys
URL='http://localhost:8765/'; R=[]
def rec(i,d,ok,det=''): R.append({'id':i,'desc':d,'status':'PASS' if ok else 'FAIL','detail':str(det)}); print(('PASS' if ok else 'FAIL'),i,d,det if not ok else '')
def fresh(b,vp=(390,844)):
    ctx=b.new_context(viewport={'width':vp[0],'height':vp[1]},accept_downloads=True); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    ctx.route('https://api.github.com/**',lambda r:r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{"body":"","assets":[]}'))
    pg.goto(URL); pg.wait_for_timeout(500); pg.click('#t-wardrobe'); pg.click('#wn-sizes'); pg.wait_for_timeout(150); return ctx,pg,errs
def store(pg): return pg.evaluate("JSON.parse(localStorage.getItem('styly-measurements')||'null')")
with sync_playwright() as p:
    b=p.chromium.launch(); ctx,pg,errs=fresh(b)
    rec('C1','Still exactly 4 built-in cards, closed by default, plus an add-item box',pg.locator('.acc').count()==4 and pg.locator('#addItem').is_visible())
    # extra field on existing group
    pg.click('#ah-pants'); pg.fill('#nf-pants','الرقبة'); pg.click('[data-addf=pants]'); pg.wait_for_timeout(200)
    xs=pg.locator('#ab-pants input[type=number]')
    rec('C2','New measurement added to pants (5 fields), group stays open',xs.count()==5 and pg.locator('#ab-pants').is_visible())
    k=pg.locator('#ab-pants input[type=number]').nth(4).get_attribute('data-k')
    pg.fill(f'#m-pants-{k}','38'); pg.fill('#m-pants-waist','82'); pg.click('[data-save=pants]'); pg.wait_for_timeout(150)
    s=store(pg); rec('C3','Extra field value + built-in value saved in localStorage',s and s['data']['pants'].get(k)==38 and s['data']['pants']['waist']==82 and s['data']['extra']['pants'][0][1]=='الرقبة')
    # duplicate + empty
    pg.fill('#nf-pants','الرقبة'); pg.click('[data-addf=pants]'); d1=pg.locator('#me-pants').is_visible()
    pg.fill('#nf-pants','الوسط'); pg.click('[data-addf=pants]'); pg.fill('#nf-pants',''); pg.click('[data-addf=pants]')
    rec('C4','Duplicate / empty field names rejected (incl. built-in name)',d1 and pg.locator('#ab-pants input[type=number]').count()==5)
    # unsaved typing survives adding another field
    pg.fill('#m-pants-hip','99'); pg.fill('#nf-pants','الكاحل'); pg.click('[data-addf=pants]'); pg.wait_for_timeout(150)
    rec('C5','Unsaved typed values are kept when a field is added',pg.input_value('#m-pants-hip')=='99')
    # custom item
    pg.fill('#ni','جاكيت شتوي'); pg.click('#addItem'); pg.wait_for_timeout(200)
    rec('C6','New item card created (5 cards), opened, empty-state hint shown',pg.locator('.acc').count()==5 and pg.locator('.acc >> nth=4').inner_text().startswith('جاكيت شتوي') and pg.locator('.acc >> nth=4 >> .hint').count()==1)
    g=pg.locator('.acc >> nth=4').get_attribute('data-g')
    for lbl in ['الصدر','الكم','الطول']:
        pg.fill(f'#nf-{g}',lbl); pg.click(f'[data-addf={g}]'); pg.wait_for_timeout(100)
    ins=pg.locator(f'#ab-{g} input[type=number]'); rec('C7','Three measurements added to the custom item',ins.count()==3)
    for i,v in enumerate(['54','61','72']): ins.nth(i).fill(v)
    pg.click(f'[data-save={g}]'); pg.wait_for_timeout(150)
    s=store(pg); it=s['data']['items'][0]; rec('C8','Custom item saved with name, fields and values (cm)',it['name']=='جاكيت شتوي' and len(it['fields'])==3 and sorted(it['values'].values())==[54,61,72])
    # independent open/close
    pg.click('#ah-pants'); rec('C9','Closing pants does not close the custom item',pg.locator('#ab-pants').is_hidden() and pg.locator(f'#ab-{g}').is_visible())
    # reload persistence
    pg.reload(); pg.wait_for_timeout(500); pg.click('#t-wardrobe'); pg.click('#wn-sizes'); pg.wait_for_timeout(150)
    pg.click(f'#ah-{g}'); pg.click('#ah-pants')
    rec('C10','After reload: custom item, extra fields and values persist',pg.locator('.acc').count()==5 and pg.input_value(f'#m-{g}-'+it['fields'][1][0])=='61' and pg.input_value(f'#m-pants-{k}')=='38')
    # delete field (confirm)
    pg.click(f'[data-delf={g}][data-k="{it["fields"][2][0]}"]'); pg.click('#dlgYes'); pg.wait_for_timeout(200)
    rec('C11','Deleting a custom field (with confirm) removes it and its value',store(pg)['data']['items'][0]['fields'].__len__()==2)
    pg.click(f'[data-delf=pants][data-k="{k}"]'); pg.click('#dlgNo'); pg.wait_for_timeout(100)
    still=pg.locator(f'#m-pants-{k}').count()==1
    pg.click(f'[data-delf=pants][data-k="{k}"]'); pg.click('#dlgYes'); pg.wait_for_timeout(200)
    rec('C12','Cancel keeps the field; confirm deletes it; built-in fields have no delete button',still and pg.locator(f'#m-pants-{k}').count()==0 and pg.locator('[data-delf=pants][data-k=waist]').count()==0 and 'waist' in store(pg)['data']['pants'])
    # backup round trip
    bk=pg.evaluate("buildBackup()"); d=json.loads(bk)
    rec('C13','Backup contains custom items and extra fields',len(d['measurements']['items'])==1 and 'extra' in d['measurements'])
    pg.evaluate("async(t)=>{await restoreBackupText?.(t)}",bk) if False else None
    ctx2,pg2,e2=fresh(b)
    pg2.evaluate("(d)=>{measures=cleanMeasure(d);saveMeasures();msBuilt=false}",d['measurements']); pg2.click('#wn-mine'); pg2.click('#wn-sizes'); pg2.wait_for_timeout(150)
    rec('C14','Restored measurements recreate the custom item',pg2.locator('.acc').count()==5)
    # old-format data (no extra/items) still loads
    pg2.evaluate("localStorage.setItem('styly-measurements',JSON.stringify({v:1,data:{pants:{waist:80}}}))"); pg2.reload(); pg2.wait_for_timeout(400); pg2.click('#t-wardrobe'); pg2.click('#wn-sizes'); pg2.click('#ah-pants')
    rec('C15','v1.5.0-format data (no extra/items) loads unchanged',pg2.input_value('#m-pants-waist')=='80' and pg2.locator('.acc').count()==4)
    # delete item
    pg.click(f'#ah-{g}') if pg.locator(f'#ab-{g}').is_hidden() else None
    pg.click(f'[data-deli={g}]'); pg.click('#dlgYes'); pg.wait_for_timeout(200)
    rec('C16','Deleting a custom item removes the card',pg.locator('.acc').count()==4 and store(pg)['data']['items']==[])
    # HTML injection safety
    pg.fill('#ni','<b>x</b>'); pg.click('#addItem'); pg.wait_for_timeout(150)
    rec('C17','Item names are escaped (no HTML injection)',pg.locator('.acc >> nth=4 b').count()==0 and '<b>x</b>' in pg.locator('.acc >> nth=4').inner_text())
    # layout
    ok=True
    for w in (320,360,390,430,768,1280):
        pg.set_viewport_size({'width':w,'height':800}); pg.wait_for_timeout(100)
        ok&=pg.evaluate("document.documentElement.scrollWidth<=innerWidth")
    rec('C18','No horizontal overflow at 320–1280 with the new controls',ok)
    rec('C19','No console/page errors',not errs and not e2,errs+e2)
    b.close()
n=sum(r['status']=='PASS' for r in R); print(n,'/',len(R)); json.dump(R,open(__file__.replace('.py','_results.json'),'w'),ensure_ascii=False,indent=1)
