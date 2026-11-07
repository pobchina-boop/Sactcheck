/* Focused browser regression for the visible SACT service selector.
 * Run from a full checkout with Playwright and Chromium available:
 *   CHROMIUM_PATH=/usr/bin/chromium node tests/homepage-service-layout.e2e.cjs
 * --fixture-only writes a self-contained local review page without launching a browser.
 * --support-css PATH can supply the unchanged haem stylesheet in a partial checkout.
 * --homepage-css PATH can render the pinned baseline for visual comparison.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const option = name => {
  const at = process.argv.indexOf(name);
  return at < 0 ? undefined : process.argv[at + 1];
};
const read = file => fs.readFileSync(file, 'utf8');
const index = read(path.join(root, 'index.html'));
const serviceMarkup = index.match(/<section\b[^>]*\bid="portalSwitcher"[^>]*>[\s\S]*?<\/section>/)?.[0];
assert.ok(serviceMarkup, 'Use the existing production service selector markup');
const policyCss = [...index.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
  .map(match => match[1]).find(css => css.includes('body[data-haematology-enabled="false"]'));
assert.ok(policyCss, 'Retain the production haematology visibility policy');
const supportCss = read(option('--support-css') || path.join(root, 'css/haemato-oncology-v0490.css'));
const homepageCss = read(option('--homepage-css') || path.join(root, 'css/homepage-search-v0847.css'));
const scopeScript = read(path.join(root, 'js/library-scope-v08441.js'));
const controllerScript = read(path.join(root, 'js/haemato-oncology.js'));
const fixtureDir = path.resolve(option('--fixture-dir') || fs.mkdtempSync(path.join(os.tmpdir(), 'sactcheck-homepage-layout-')));
fs.mkdirSync(fixtureDir, {recursive: true});
const scriptTag = source => '<script>' + source.replace(/<\/script/gi, '<\\/script') + '</script>';
const fixture = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SACTCheck service selector layout review</title>
<style>
:root{--navy:#12314a;--blue:#176b9b;--line:#d5dee6;--muted:#5a6875}
*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f3f6f8;color:#17212b}
main{max-width:1180px;margin:22px auto;padding:0 18px 52px}
button{font:inherit;cursor:pointer}section{background:white;border:1px solid var(--line);border-radius:10px;padding:18px}
.fixture-note{margin:24px auto;max-width:1144px;padding:0 18px;line-height:1.5}
.fixture-note h1{font-size:21px;color:var(--navy)}.fixture-controls{display:flex;flex-wrap:wrap;gap:8px}
.fixture-controls button{padding:10px;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--navy)}
${supportCss}\n${homepageCss}\n${policyCss}
</style></head><body class="search-priority-home" data-haematology-enabled="false" data-library-domain="solid">
<div class="fixture-note"><h1>SACTCheck service selector layout review</h1>
<p>This isolated fixture uses the production service markup, styles and visibility controller. The two-service option tests future layout only.</p>
<div class="fixture-controls"><button type="button" data-fixture="policy">Current solid tumour policy</button>
<button type="button" data-fixture="single">One visible service, stale body flag</button>
<button type="button" data-fixture="two">Two visible services, layout only</button></div></div>
<main>${serviceMarkup}</main>
${scriptTag("try{localStorage.setItem('sactcheck.library-domain.v0500','haem')}catch(_){}")}
${scriptTag(scopeScript)}\n${scriptTag(controllerScript)}
${scriptTag(`window.setFixtureMode = function(mode) {
  document.body.dataset.haematologyEnabled = mode === 'policy' ? 'false' : 'true';
  document.querySelector('[data-library-domain-choice="haem"]').hidden = mode !== 'two';
};
document.querySelectorAll('[data-fixture]').forEach(button => button.addEventListener('click', () => setFixtureMode(button.dataset.fixture)));`)}
</body></html>`;
const fixturePath = path.join(fixtureDir, 'homepage-service-layout-review.html');
fs.writeFileSync(fixturePath, fixture);

async function verify() {
  const {chromium} = require('playwright');
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'});
  const results = [];
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(fixturePath).href);
    const savedState = await page.evaluate(() => ({
      domain:document.body.dataset.libraryDomain,
      saved:localStorage.getItem('sactcheck.library-domain.v0500'),
      haemHidden:document.querySelector('[data-library-domain-choice="haem"]').hidden
    }));
    assert.deepEqual(savedState, {domain:'solid',saved:'solid',haemHidden:true}, 'A saved haem preference remains reset by the unchanged policy/controller');
    for (const width of [1280, 760, 390, 320]) {
      await page.setViewportSize({width,height:600});
      for (const mode of ['policy','single','two']) {
        await page.evaluate(value => window.setFixtureMode(value), mode);
        const layout = await page.locator('#portalSwitcher').evaluate(parent => {
          const box = parent.getBoundingClientRect(), style = getComputedStyle(parent);
          const left = box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
          const right = box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
          const children = [...parent.children].filter(node => getComputedStyle(node).display !== 'none').map(node => {
            const rect=node.getBoundingClientRect();
            return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width};
          });
          return {left,right,children,overflow:document.documentElement.scrollWidth > innerWidth};
        });
        assert.equal(layout.children.length, mode === 'two' ? 2 : 1, `${width}/${mode}: visible service count`);
        assert.equal(layout.overflow,false,`${width}/${mode}: no horizontal page overflow`);
        const close = (a,b) => Math.abs(a-b) < 1;
        if (mode !== 'two' || width <= 760) {
          for (const item of layout.children) {
            assert.ok(close(item.left,layout.left) && close(item.right,layout.right),`${width}/${mode}: each row uses the entire content width`);
          }
          if (mode === 'two') assert.ok(layout.children[1].top >= layout.children[0].bottom,`${width}/${mode}: mobile services stack`);
        } else {
          const [first,second]=layout.children;
          assert.ok(close(first.width,second.width),`${width}/${mode}: desktop services have equal widths`);
          assert.ok(close(first.top,second.top) && close(first.left,layout.left) && close(second.right,layout.right),`${width}/${mode}: desktop services fill one row`);
        }
        await page.screenshot({path:path.join(fixtureDir,`${width}-${mode}.png`),fullPage:true});
        results.push({width,mode,...layout});
      }
    }
    await page.evaluate(() => window.setFixtureMode('policy'));
    await page.locator('[data-library-domain-choice="solid"]').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-library-domain-choice="haem"]').evaluate(node => node === document.activeElement), false, 'Hidden haematology is not a keyboard stop');
    fs.writeFileSync(path.join(fixtureDir,'results.json'),JSON.stringify({passed:true,results},null,2)+'\n');
    console.log(`PASS: 12 service layouts, saved preference reset and hidden keyboard state. Evidence: ${fixtureDir}`);
  } finally { await browser.close(); }
}
if (process.argv.includes('--fixture-only')) console.log(`Fixture prepared; browser assertions not run: ${fixturePath}`);
else verify().catch(error => {console.error(error);process.exitCode=1;});
