import json, sys, urllib.parse
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
sys.stdout.reconfigure(encoding="utf-8")
OUT=Path("test-results"); OUT.mkdir(exist_ok=True)
BASE="http://127.0.0.1:4347"
API="https://wakosen-app-api.yoking.dev/v1"
INIT="""for(const [k,v] of Object.entries({hasCompletedInitialSetup:'true',admissionYear:'2025',studentClass:'B',colorScheme:'light',pwaInstallBannerDismissedAt:String(Date.now())})){localStorage.setItem(k,v);localStorage.setItem('@react-native-async-storage/async-storage:'+k,v)}
const RealDate=Date;const offset=new RealDate('2026-01-27T03:00:00Z').getTime()-RealDate.now();globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[RealDate.now()+offset]));}static now(){return RealDate.now()+offset}};"""
results=[]
def record(name):
 results.append(name);print('PASS: '+name,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':390,'height':844},timezone_id='Asia/Tokyo',service_workers='block')
 context.add_init_script(INIT)
 page=context.new_page(); errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 mode={'meals':'normal'}; requests=[]
 def api(route):
  path=urllib.parse.urlsplit(route.request.url).path;requests.append(path)
  if '/meals/' in path and mode['meals']=='404':route.fulfill(status=404,json={'error':'Not Found'});return
  response=page.request.get('http://127.0.0.1:3001'+path)
  if '/meals/' in path and mode['meals']=='missing':
   data=response.json()
   def remove_day(value):
    if isinstance(value,list):return [remove_day(x) for x in value if not isinstance(x,dict) or x.get('date')!='2026-01-27']
    if isinstance(value,dict):return {k:remove_day(v) for k,v in value.items()}
    return value
   route.fulfill(json=remove_day(data));return
  route.fulfill(response=response)
 page.route(API+'/**',api)
 for path in ['/','/classes','/events','/meals','/school-rules','/settings','/changelog','/school-rules/r1']:
  page.goto(BASE+path,wait_until='networkidle');page.wait_for_timeout(300)
  assert not errors,(path,errors)
  assert page.locator('meta[property="og:image"]').get_attribute('content').endswith('/og-image.png')
  page.screenshot(path=str(OUT/('verified-'+(path.strip('/').replace('/','-') or 'home')+'.png')))
 record('全8画面・OGP・JavaScript例外なし')
 page.goto(BASE+'/meals',wait_until='networkidle')
 page.get_by_role('button',name='次の日',exact=True).click()
 expect(page.get_by_role('button',name='日付選択: 2026-01-28 (水)')).to_be_visible()
 start=page.evaluate('performance.timeOrigin')
 page.get_by_role('tab',name='設定',exact=True).click()
 expect(page).to_have_url(BASE+'/settings')
 expect(page.get_by_role('tab',name='設定',exact=True)).to_have_attribute('aria-selected','true')
 before=len(requests)
 page.get_by_role('tab',name='寮食',exact=True).click()
 expect(page.get_by_role('button',name='日付選択: 2026-01-28 (水)')).to_be_visible()
 page.wait_for_timeout(500)
 assert page.evaluate('performance.timeOrigin')==start
 assert any('/meals/' in x for x in requests[before:])
 record('タブ遷移で選択日を保持・全画面リロードなし・API再検証')
 page.get_by_role('button',name='前の日',exact=True).click()
 mode['meals']='missing'
 page.reload(wait_until='networkidle')
 expect(page.get_by_text('404｜この日の寮食データはありません',exact=True)).to_be_visible()
 for label in ['前の日','次の日','朝食','昼食','夕食','再読み込み']:
  expect(page.get_by_label(label,exact=True)).to_be_visible()
 page.screenshot(path=str(OUT/'meals-missing-day.png'))
 record('対象日の欠落は日付・食事タブを残してメニュー領域に404')
 mode['meals']='normal';page.get_by_label('再読み込み',exact=True).click();page.wait_for_timeout(500)
 expect(page.get_by_text('404｜この日の寮食データはありません',exact=True)).not_to_be_visible()
 assert page.evaluate("Object.keys(localStorage).some(k=>k.startsWith('wakosen-api-v1:')&&k.includes('/meals/'))")
 mode['meals']='404';page.reload(wait_until='networkidle')
 expect(page.get_by_text('404｜この日の寮食データはありません',exact=True)).to_be_visible()
 assert page.evaluate("localStorage.getItem('wakosen-api-v1:"+API+"/meals/2026-01-26.json')===null")
 record('週404でも局所表示・古い寮食キャッシュを破棄')
 mode['meals']='normal'
 page.get_by_label('再読み込み',exact=True).click();page.wait_for_timeout(500)
 expect(page.get_by_text('404｜この日の寮食データはありません',exact=True)).not_to_be_visible()
 record('再読み込みで復旧')
 page.goto(BASE+'/settings',wait_until='networkidle')
 print('SETTINGS_CONTROLS',page.get_by_role('button').all_text_contents()[:30],flush=True)
 context.close()
 # Service worker receives real same-origin requests; mock only the external API.
 context=browser.new_context(viewport={'width':390,'height':844},timezone_id='Asia/Tokyo')
 context.add_init_script(INIT);page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def proxy(route):route.fulfill(response=page.request.get('http://127.0.0.1:3001'+urllib.parse.urlsplit(route.request.url).path))
 page.route(API+'/**',proxy)
 page.goto(BASE+'/meals',wait_until='networkidle')
 page.wait_for_function('navigator.serviceWorker.controller !== null',timeout=30000)
 await_cache=page.evaluate('caches.keys()');assert any(x.startswith('wakosen-astro-') for x in await_cache)
 context.set_offline(True)
 page.reload(wait_until='domcontentloaded');page.wait_for_timeout(1200)
 expect(page.get_by_role('button',name='日付選択: 2026-01-27 (火)')).to_be_visible()
 assert 'Chicken Bowl' in page.locator('body').inner_text()
 page.get_by_role('tab',name='設定',exact=True).click()
 expect(page).to_have_url(BASE+'/settings')
 expect(page.get_by_role('tab',name='設定',exact=True)).to_have_attribute('aria-selected','true')
 page.wait_for_timeout(500)
 assert not errors,errors
 record('PWAオフライン再起動・保存済み寮食表示・未訪問設定画面へ遷移')
 context.close();browser.close()
(OUT/'browser-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
