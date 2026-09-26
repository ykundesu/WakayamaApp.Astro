import sys,json,time,urllib.parse,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
sys.stdout.reconfigure(encoding='utf-8')
OUT=Path('test-results');OUT.mkdir(exist_ok=True)
BASE='http://127.0.0.1:4347';API='https://wakosen-app-api.yoking.dev/v1'
INIT="""for(const [k,v] of Object.entries({hasCompletedInitialSetup:'true',admissionYear:'2025',studentClass:'B',colorScheme:'light',pwaInstallBannerDismissedAt:String(Date.now())}))localStorage.setItem(k,v);const RealDate=Date;const offset=new RealDate('2026-01-27T03:00:00Z').getTime()-RealDate.now();globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[RealDate.now()+offset]));}static now(){return RealDate.now()+offset}};"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True,timezone_id='Asia/Tokyo',service_workers='block');ctx.add_init_script(INIT)
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 mode={'offline':False}
 def api(route):
  path=urllib.parse.urlsplit(route.request.url).path
  if '/classes/' in path and mode['offline']:route.abort();return
  if '/dormitory/events/' in path:
   year=int(path.rsplit('/',1)[-1].split('.')[0])
   if year==2023:route.fulfill(status=404,json={});return
   data={'academic_year':2025,'events':[{'date':f'01/{d:02}','grade':None if d%2 else 1,'name':'寮生活についての説明会' if d==27 else '寮の行事 '+str(d)} for d in range(1,32)]+[{'date':'02/10','grade':1,'name':'学年集会'},{'date':'02/20','grade':None,'name':'避難訓練'}]}
   data['academic_year']=year
   route.fulfill(json=data);return
  route.fulfill(response=page.request.get('http://127.0.0.1:3001'+path))
 page.route(API+'/**',api)
 page.goto(BASE+'/classes',wait_until='networkidle')
 page.add_init_script("window.sawFalseOffline=false;new MutationObserver(()=>{if(document.body?.innerText.includes('ネットに接続できません'))window.sawFalseOffline=true;}).observe(document,{childList:true,subtree:true});")
 page.reload(wait_until='networkidle');assert not page.evaluate('window.sawFalseOffline')
 mode['offline']=True;page.reload(wait_until='networkidle');expect(page.get_by_text('ネットに接続できません',exact=True)).to_be_visible();assert '不明' not in page.locator('body').inner_text();mode['offline']=False
 print('PASS: 再検証中に偽の接続エラーなし・本当の失敗時だけ警告',flush=True)
 page.goto(BASE+'/meals',wait_until='networkidle');page.screenshot(path=str(OUT/'ux-meals.png'))
 centers=page.locator('.tab').evaluate_all("els=>els.map(e=>{const a=e.querySelector('.tab-icon').getBoundingClientRect(),b=e.querySelector('.tab-label').getBoundingClientRect();return Math.abs(a.x+a.width/2-b.x-b.width/2)})")
 assert max(centers)<1,centers
 glyph=page.evaluate("""async()=>{await document.fonts.ready;const c=document.createElement('canvas').getContext('2d');c.font='24px MaterialCommunityIcons';c.textAlign='center';const m=c.measureText(String.fromCodePoint(984085));return {left:m.actualBoundingBoxLeft,right:m.actualBoundingBoxRight};}""")
 assert abs(glyph['left']-glyph['right'])<1,glyph
 page.evaluate("window.sawLoading=false;new MutationObserver(()=>{const e=document.querySelector('.route-loading');if(e){window.sawLoading=true;window.loadingDirection=getComputedStyle(e).flexDirection;}}).observe(document,{childList:true,subtree:true});")
 page.get_by_role('tab',name='設定',exact=True).click();expect(page.get_by_role('heading',name='学生情報')).to_be_visible();assert page.evaluate('window.sawLoading');assert page.evaluate('window.loadingDirection')=='column'
 page.screenshot(path=str(OUT/'ux-settings-light-mobile.png'))
 page.get_by_label('入学年度',exact=True).select_option('2024');expect(page.get_by_text('2年 B組',exact=True)).to_be_visible()
 page.get_by_role('radio',name='ダーク',exact=True).check();page.screenshot(path=str(OUT/'ux-settings-dark-mobile.png'))
 page.get_by_role('switch',name='行事を表示',exact=True).uncheck();expect(page.get_by_role('tab',name='行事',exact=True)).not_to_be_visible()
 page.get_by_role('button',name='標準に戻す',exact=True).click();expect(page.get_by_role('tab',name='行事',exact=True)).to_be_visible()
 page.get_by_role('button',name='予定を上へ移動',exact=True).click();assert page.locator('.tab').first.get_attribute('aria-label')=='予定'
 page.get_by_role('button',name='標準に戻す',exact=True).click()
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.settings-screen').evaluate('e=>e.scrollTop=0');page.screenshot(path=str(OUT/'ux-settings-dark-desktop.png'))
 print('PASS: タブの即時ローディング・中心揃え・新設定の保存/非表示/並び替え',flush=True)
 page.get_by_role('tab',name='行事',exact=True).click();expect(page.locator('[data-today=true]')).to_be_visible();page.wait_for_timeout(300)
 pos=page.evaluate("(()=>{const r=document.querySelector('.events-scroll'),t=document.querySelector('[data-today=true]');return {scroll:r.scrollTop,delta:t.getBoundingClientRect().top-r.getBoundingClientRect().top,behavior:getComputedStyle(r).scrollBehavior}})()")
 assert pos['scroll']>200 and abs(pos['delta']-32)<3 and pos['behavior']=='auto',pos
 page.screenshot(path=str(OUT/'ux-events-desktop.png'))
 page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='今日',exact=True).click();page.screenshot(path=str(OUT/'ux-events-mobile.png'))
 page.locator('.events-scroll').evaluate('e=>e.scrollTop=0');page.get_by_role('tab',name='設定',exact=True).click();expect(page.get_by_role('heading',name='学生情報')).to_be_visible();page.get_by_role('tab',name='行事',exact=True).click();expect(page.locator('[data-today=true]')).to_be_visible()
 print('PASS: 今日の行事を含む日付へ即時スクロール・再入場でも実行',flush=True)
 page.get_by_role('button',name='前の年度',exact=True).click()
 expect(page.locator('.events-year-navigation strong')).to_have_text('2024年度')
 expect(page.get_by_role('heading',name=re.compile(r'2025\s*1月'))).to_be_visible()
 expect(page.locator('[data-today=true]')).to_have_count(0)
 assert page.locator('.events-scroll').evaluate('e=>e.scrollTop')==0
 page.screenshot(path=str(OUT/'ux-events-previous-year.png'))
 page.get_by_role('button',name='前の年度',exact=True).click()
 expect(page.get_by_role('heading',name='行事データはまだありません')).to_be_visible()
 expect(page.locator('.events-item')).to_have_count(0)
 page.get_by_role('button',name='今日',exact=True).click()
 expect(page.locator('.events-year-navigation strong')).to_have_text('2025年度')
 expect(page.locator('[data-today=true]')).to_be_visible()
 expect(page.get_by_role('button',name='次の年度',exact=True)).to_be_disabled()
 print('PASS: 過去年度のAPI取得・年度404・今日で現在年度へ復帰',flush=True)
 page.goto(BASE+'/classes',wait_until='networkidle');page.get_by_role('button',name=re.compile('2025年度 .*後期')).click();page.wait_for_timeout(400);page.screenshot(path=str(OUT/'ux-class-modal.png'))
 # One pointer activation must advance exactly one class; both semester arrows toggle.
 for name,expected in [('クラスを次へ','C'),('クラスを次へ','D'),('クラスを前へ','C')]:
  button=page.get_by_role('button',name=name,exact=True)
  button.click()
  assert button.locator('..').inner_text().splitlines().count(expected)==1
 button.tap();assert button.locator('..').inner_text().splitlines().count('B')==1
 button.focus();button.press('Enter');assert button.locator('..').inner_text().splitlines().count('A')==1
 for name in ['学期を切り替える（＋）','学期を切り替える（−）']:
  button=page.get_by_role('button',name=name,exact=True)
  before=button.locator('..').inner_text()
  button.click();assert button.locator('..').inner_text()!=before
  button.click();assert button.locator('..').inner_text()==before
 print('PASS: 単一クリックで1段階、学期の両ボタンが往復切替',flush=True)
 page.goto(BASE+'/',wait_until='networkidle');page.get_by_role('button',name='行事',exact=True).first.scroll_into_view_if_needed();page.screenshot(path=str(OUT/'ux-home-events.png'))
 assert not errors,errors
 ctx.close()
 ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();page.route(API+'/**',lambda r:r.fulfill(status=404,json={}))
 page.goto(BASE+'/',wait_until='networkidle');expect(page.get_by_text('初期設定',exact=True)).to_be_visible();page.wait_for_timeout(500)
 backdrop=page.get_by_test_id('initial-setup-backdrop');box=backdrop.bounding_box();assert box['width']==390 and box['height']==844,box
 assert backdrop.evaluate("e=>getComputedStyle(e).backgroundColor")=='rgba(0, 0, 0, 0.7)'
 assert backdrop.evaluate("e=>getComputedStyle(e).opacity")=='1'
 page.screenshot(path=str(OUT/'ux-initial-setup.png'))
 print('PASS: 初期設定の全面70%暗幕',flush=True)
 ctx.close()
 ctx=browser.new_context(viewport={'width':390,'height':844},color_scheme='light',service_workers='block')
 ctx.add_init_script("localStorage.setItem('colorScheme','dark');localStorage.setItem('hasCompletedInitialSetup','true');")
 page=ctx.new_page()
 page.route('**/*.js',lambda r:r.abort())
 for path in ['/', '/classes', '/events', '/settings', '/meals']:
  page.goto(BASE+path,wait_until='networkidle')
  expect(page.locator('.initial-dark')).to_be_visible()
  expect(page.locator('.initial-light')).not_to_be_visible()
  assert page.locator('.initial-dark > div').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(11, 17, 32)'
  assert page.locator('.tabbar:visible').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(11, 17, 32)'
 page.screenshot(path=str(OUT/'ux-dark-before-javascript.png'))
 print('PASS: ライトOSでも保存済みダークをJS起動前から表示',flush=True)
 page.unroute('**/*.js')
 page.route(API+'/**',lambda r:r.fulfill(status=404,json={}))
 page.add_init_script("window.lightFrames=0;function sample(){const e=document.querySelector('#app > div:not(.initial-shell)');if(e&&getComputedStyle(e).backgroundColor==='rgb(248, 250, 252)')window.lightFrames++;requestAnimationFrame(sample)}requestAnimationFrame(sample);")
 page.reload(wait_until='networkidle')
 assert page.evaluate('window.lightFrames')==0
 assert page.locator('#app > div').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(11, 17, 32)'
 ctx.close();browser.close()
