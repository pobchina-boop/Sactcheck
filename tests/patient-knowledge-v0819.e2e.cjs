'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
(async()=>{const root=path.resolve(__dirname,'..'),server=await require('../tools/local-site-server.cjs').serve(process.env.SACT_SITE_DIR||root);const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
const output=path.join(root,'validation/v0819');fs.mkdirSync(output,{recursive:true});const results=[];
try{for(const width of [1440,390]){
const context=await browser.newContext({viewport:{width,height:980}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
await page.goto(server.url+'/patient/00568/');await page.getByRole('link',{name:'Open patient knowledge base',exact:true}).click();await page.waitForURL('**/knowledge.html');
assert.equal(await page.locator('[data-day]').count(),21);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no page-wide horizontal overflow');
const requests=[];page.on('request',r=>requests.push(r.url()));
await page.locator('#pk-start').fill('2026-12-20');await page.locator('#pk-start').dispatchEvent('change');await page.locator('[data-day="21"]').click();
assert.match(await page.locator('#pk-day-number').innerText(),/9 Jan/i);assert.match(await page.locator('#pk-next').innerText(),/10 Jan/);
await page.locator('#pk-phase').selectOption('maintenance');assert.doesNotMatch(await page.locator('#pk-active-medicines').innerText(),/carboplatin/i);
assert.match(await page.locator('#pk-active-medicines').innerText(),/Pembrolizumab.*Pemetrexed/);
assert.equal(requests.length,0,'date/day/phase interactions make no network requests');assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
await page.locator('#cycle').screenshot({path:path.join(output,`timeline-${width}.png`)});
await page.reload();assert.equal(await page.locator('#pk-start').inputValue(),'');
await page.screenshot({path:path.join(output,`knowledge-${width}.png`),fullPage:true});
await page.goto(server.url);await page.waitForFunction(()=>document.querySelector('.regimen-card[data-json-protocol-id="nccp-00568-v5"]')?.dataset.sactCardReady==='true',null,{timeout:45000});await page.locator('#regimenSearch').fill('00568');
const card=page.locator('.regimen-card[data-json-protocol-id="nccp-00568-v5"]');await card.locator('[data-open-regimen-workflow]').click();await page.locator('[data-workflow-knowledge]').click();
await page.locator('#regimenInformationOverlay').waitFor({state:'visible'});assert.ok(await page.locator('#regimenInformationOverlay').isVisible(),'clinician knowledge opens');
await page.locator('[data-regimen-info-close]').click();
await card.locator('[data-open-regimen-workflow]').click({force:true});
const popupPromise=page.waitForEvent('popup');await page.locator('[data-workflow-consent]').click();const draft=await popupPromise;await draft.waitForLoadState();assert.match(draft.url(),/consent\.html$/);
await draft.locator('#discussion-benefit').fill('Discussion test: individual goals and review.');await draft.emulateMedia({media:'print'});assert.match(await draft.locator('#discussion-benefit-print').innerText(),/individual goals/);
if(width===1440){await draft.pdf({path:path.join(output,'consent-print-check.pdf'),format:'A4',printBackground:true});}
await draft.emulateMedia({media:'screen'});await draft.locator('#consent-clear').click();assert.equal(await draft.locator('#discussion-benefit').inputValue(),'');await draft.close();
assert.deepEqual(errors,[]);results.push({width,portalToKnowledge:true,all21Days:true,dateAcrossYear:true,maintenance:true,noPersistenceOrTransmission:true,clinicianKnowledge:true,consentDraft:true,noPageErrors:true});await context.close();
}
const noJS=await browser.newContext({javaScriptEnabled:false});const p=await noJS.newPage();await p.goto(server.url+'/patient/00568/knowledge.html');await p.getByText('Read the whole cycle as text',{exact:true}).click();assert.ok(await p.getByRole('heading',{name:'Day 15–21: Prepare for your next review'}).isVisible());await noJS.close();
fs.writeFileSync(path.join(output,'journey-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exit(1);});
