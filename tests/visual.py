import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
from pathlib import Path
from datetime import datetime, timezone
import json, urllib.parse
out=Path('test-results');out.mkdir(exist_ok=True)
routes=['/','/classes','/events','/meals','/school-rules','/settings','/changelog']
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 results=[]
 for name,base in [('reference','https://wakosen-app.yoking.dev'),('astro','http://127.0.0.1:4347')]:
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,service_workers='block')
  context.add_init_script("""for(const [key,value] of Object.entries({hasCompletedInitialSetup:'true',admissionYear:'2025',studentClass:'B',colorScheme:'light',pwaInstallBannerDismissedAt:String(Date.now())})){localStorage.setItem(key,value);localStorage.setItem('@react-native-async-storage/async-storage:'+key,value)}""")
  context.add_init_script("const RealDate=Date;const offset=new RealDate('2026-01-27T03:00:00Z').getTime()-RealDate.now();globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[RealDate.now()+offset]));}static now(){return RealDate.now()+offset}};");page=context.new_page()
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def api(route):
   path=urllib.parse.urlsplit(route.request.url).path
   response=page.request.get('http://127.0.0.1:3001'+path)
   route.fulfill(response=response)
  page.route('https://wakosen-app-api.yoking.dev/**',api)
  for route in routes:
   page.goto(base+route,wait_until='networkidle');page.wait_for_timeout(1200)
   label=route.strip('/') or 'home'
   page.screenshot(path=str(out/f'{name}-{label}.png'))
   results.append({'version':name,'route':route,'errors':list(errors),'text':page.locator('body').inner_text()[:300]});errors.clear()
  context.close()
 browser.close()
 (out/'visual.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(results,ensure_ascii=False,indent=2))

