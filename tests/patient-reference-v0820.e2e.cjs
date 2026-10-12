'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
(async()=>{const root=path.resolve(__dirname,'..'),server=await require('../tools/local-site-server.cjs').serve(process.env.SACT_SITE_DIR||root),browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{for(const width of [1440,390]){const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(server.url+'/patient/00568/');await page.getByRole('link',{name:'Open complete patient reference →',exact:true}).click();await page.waitForURL('**/knowledge.html');
assert(await page.locator('#pk-start').isVisible());await page.locator('#pk-start').fill('2026-10-12');await page.locator('#pk-start').dispatchEvent('change');assert.match(await page.locator('#pk-next').innerText(),/2 Nov/);
await page.locator('#pk-phase').selectOption('maintenance');assert.doesNotMatch(await page.locator('#pk-active-medicines').innerText(),/Carboplatin/);
await page.locator('[data-day="21"]').click();assert.equal(await page.locator('[data-day="21"]').getAttribute('aria-pressed'),'true');
await page.locator('#pk-clear').click();assert.equal(await page.locator('#pk-start').inputValue(),'');
await page.getByText('Show trial results and what the numbers mean',{exact:true}).click();assert(await page.getByText('19.4%',{exact:true}).isVisible());
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page-wide overflow');assert.deepEqual(errors,[]);await page.close();}
console.log('Desktop/mobile patient reference journey passed.');}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exit(1);});
