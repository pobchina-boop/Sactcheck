'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
(async()=>{const root=path.resolve(__dirname,'..'),server=await require('../tools/local-site-server.cjs').serve(process.env.SACT_SITE_DIR||root);const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
const output=path.join(root,'validation/v0819');fs.mkdirSync(output,{recursive:true});const results=[];
try{for(const width of [1440,390]){
const context=await browser.newContext({viewport:{width,height:980}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
await page.goto(server.url+'/patient/00568/');await page.getByRole('link',{name:'Open patient knowledge base',exact:true}).click();await page.waitForURL('**/knowledge.html');
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no page-wide horizontal overflow');
await page.screenshot({path:path.join(output,`knowledge-${width}.png`),fullPage:true});
await page.goto(server.url);await page.waitForFunction(()=>document.querySelector('.regimen-card[data-json-protocol-id="nccp-00568-v5"]')?.dataset.sactCardReady==='true',null,{timeout:45000});await page.locator('#regimenSearch').fill('00568');
const card=page.locator('.regimen-card[data-json-protocol-id="nccp-00568-v5"]');await card.locator('[data-open-regimen-workflow]').click();await page.locator('[data-workflow-knowledge]').click();
await page.locator('#regimenInformationOverlay').waitFor({state:'visible'});assert.ok(await page.locator('#regimenInformationOverlay').isVisible(),'clinician knowledge opens');await page.locator('[data-regimen-info-close]').click();
await card.locator('[data-open-regimen-workflow]').click({force:true});const popupPromise=page.waitForEvent('popup');await page.locator('[data-workflow-consent]').click();const consent=await popupPromise;await consent.waitForLoadState();assert.match(consent.url(),/consent-form\.html$/);
assert.ok(await consent.getByText('Generic SACT risks / discussion points',{exact:true}).isVisible());assert.ok(await consent.getByText('Regimen / agent-specific material risks',{exact:true}).isVisible());
for(const drug of ['Pembrolizumab','Pemetrexed','Carboplatin']) assert.ok(await consent.getByRole('heading',{name:drug,exact:true}).isVisible());
assert.ok(await consent.getByText(/Prototype · governance review required/i).isVisible());
if(width===1440){await consent.emulateMedia({media:'print'});await consent.pdf({path:path.join(output,'consent-one-page-check.pdf'),format:'A4',printBackground:true});}
await consent.close();assert.deepEqual(errors,[]);results.push({width,knowledgePage:true,clinicianKnowledge:true,onePageConsent:true,noPageErrors:true});await context.close();
}
fs.writeFileSync(path.join(output,'journey-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exit(1);});
