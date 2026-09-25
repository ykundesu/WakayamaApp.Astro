import json, statistics, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for label,url,latency,download,cpu in [('astro-slow4g','http://127.0.0.1:4347/',150,1600000,4),('astro-fast4g','http://127.0.0.1:4347/',40,10000000,4)]:
  for run in range(3):
   context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
   context.add_init_script("for(const [k,v] of Object.entries({hasCompletedInitialSetup:'true',admissionYear:'2025',studentClass:'B',colorScheme:'light',pwaInstallBannerDismissedAt:String(Date.now())}))localStorage.setItem(k,v)")
   page=context.new_page();cdp=context.new_cdp_session(page)
   cdp.send('Network.enable');cdp.send('Network.setCacheDisabled',{'cacheDisabled':True})
   cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':latency,'downloadThroughput':download/8,'uploadThroughput':750000/8,'connectionType':'cellular4g'})
   cdp.send('Emulation.setCPUThrottlingRate',{'rate':cpu})
   page.goto(url,wait_until='load',timeout=60000)
   page.wait_for_timeout(8000)
   metrics=page.evaluate("""() => ({fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,interactive:performance.getEntriesByName('app-interactive')[0]?.startTime,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.encodedBodySize,type:r.initiatorType,start:r.startTime,end:r.responseEnd})),html:performance.getEntriesByType('navigation')[0].encodedBodySize})""")
   row={'version':label,'run':run+1,**metrics};results.append(row)
   print(label,run+1,'FCP',round(metrics.get('fcp') or 0),'ms','interactive',round(metrics.get('interactive') or 0),'ms',flush=True)
   context.close()
 browser.close()
Path('test-results/performance-final.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
