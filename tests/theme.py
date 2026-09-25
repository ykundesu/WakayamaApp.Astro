"""Check automatic theme before JS, across mounting/reload, and on OS changes."""
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:4347'
INIT = """
localStorage.setItem('colorScheme', 'auto');
localStorage.setItem('hasCompletedInitialSetup', 'true');
window.lightFrames = 0;
function sample() {
  if (matchMedia('(prefers-color-scheme: dark)').matches) {
    const bright = [...document.querySelectorAll('#app div')].some(e => {
      const r = e.getBoundingClientRect();
      const color = getComputedStyle(e).backgroundColor;
      return r.width > 200 && r.height > 100 &&
        (color === 'rgb(248, 250, 252)' || color === 'rgb(255, 255, 255)');
    });
    if (bright) window.lightFrames++;
  }
  requestAnimationFrame(sample);
}
requestAnimationFrame(sample);
"""

with sync_playwright() as p:
    for engine in [p.chromium, p.firefox]:
        browser = engine.launch()
        context = browser.new_context(color_scheme='dark', service_workers='block',
                                      viewport={'width': 390, 'height': 844})
        context.add_init_script(INIT)
        page = context.new_page()
        page.route('**/v1/**', lambda r: r.fulfill(status=404, json={}))
        for path in ['/', '/classes', '/meals', '/events', '/settings']:
            page.route('**/*.js', lambda r: r.abort())
            page.goto(BASE + path, wait_until='networkidle')
            expect(page.locator('.initial-dark')).to_be_visible()
            assert page.evaluate('window.lightFrames') == 0, (engine.name, path, 'static')
            page.unroute('**/*.js')
            page.reload(wait_until='networkidle')
            expect(page.locator('.initial-dark')).to_have_count(0)
            assert page.evaluate('window.lightFrames') == 0, (engine.name, path, 'mount')
            page.reload(wait_until='networkidle')
            assert page.evaluate('window.lightFrames') == 0, (engine.name, path, 'reload')
        page.emulate_media(color_scheme='light')
        expect(page.locator('html')).to_have_attribute('data-theme', 'light')
        page.emulate_media(color_scheme='dark')
        expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
        assert page.evaluate("localStorage.getItem('colorScheme')") == 'auto'
        print(f'PASS: {engine.name}: automatic theme before JS, mount, reload, and OS changes', flush=True)
        browser.close()
