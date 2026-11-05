'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');

async function noOverflow(page,label){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label}: no page-wide horizontal overflow`);}
async function capture(page,name){if(process.env.SACT_VISUAL_DIR){fs.mkdirSync(process.env.SACT_VISUAL_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SACT_VISUAL_DIR,name+'.png')});}}
async function topOf(page,selector){return page.locator(selector).evaluate(n=>n.getBoundingClientRect().top);}
async function retainedClinicalContent(page,selector){
 const inventory=await page.evaluate(async selector=>{
  const source=new DOMParser().parseFromString(await (await fetch(location.pathname)).text(),'text/html');
  const normalise=s=>s.replace(/\s+/g,' ').trim();
  const text=root=>[...root.querySelectorAll(selector)].flatMap(s=>[...s.querySelectorAll('p,h3,li')].map(n=>normalise(n.textContent))).filter(Boolean);
  const remaining=text(document);const missing=[];
  for(const original of text(source)){const i=remaining.indexOf(original);if(i<0)missing.push(original);else remaining.splice(i,1);}
  const images=root=>[...root.querySelectorAll(selector)].flatMap(s=>[...s.querySelectorAll('.hcc-anatomy img')].map(n=>n.getAttribute('src')));
  return {missing,originalImages:images(source),currentImages:images(document)};
 },selector);
 assert.deepEqual(inventory.missing,[],'every original clinical paragraph, list item and subheading is retained');
 assert.deepEqual(inventory.currentImages,inventory.originalImages,'original detailed anatomical image paths are retained');
}
async function homeJourney(page,url,width){
 await page.goto(url);
 await page.waitForFunction(()=>window.SACTCHECK_PROTOCOL_LOAD_STATUS?.loaded>0,null,{timeout:60000});
 await page.waitForFunction(()=>!document.querySelector('.protocol-loader-toast'));
 assert(await page.locator('#feasibilityTitle').isVisible(),'evaluation boundary stays visible');
 const details=page.locator('#prototypeNotice .feasibility-details');
 assert.equal(await details.getAttribute('open'),null);
 await details.locator('summary').click();
 assert(await details.getByText('iPhone use:',{exact:true}).isVisible(),'iPhone advice remains reachable');
 assert.match(await details.innerText(),/does not prescribe or authorise treatment/);
 assert.match(await details.innerText(),/Do not enter identifiable patient information/);
 await details.locator('summary').click();
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});
 assert(await details.getByText('For demonstration and structured evaluation. Independent consultant and oncology-pharmacy validation is pending.',{exact:true}).isVisible(),'full evaluation and independent-validation warning is visible in print');
 assert.equal(await details.getAttribute('open'),'','evaluation details expand for print');
 await capture(page,`evaluation-print-${width}`);
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 assert.equal(await details.getAttribute('open'),null,'closed evaluation state is restored after print');
 const search=await page.locator('#regimenSearch').boundingBox();
 if(width<600){assert(search.y<450,'search is in the first mobile viewport');assert(search.y<await topOf(page,'.home-mission-copy'),'search precedes the introduction visually');}
 await noOverflow(page,'landing');await capture(page,`landing-${width}`);
 await page.locator('#regimenSearch').fill('00555');
 await page.waitForFunction(()=>document.querySelector('#regimenGrid [data-json-protocol-id="nccp-00555-v6b"]')?.innerText.includes('Best match'));
 await page.locator('[data-view-regimen-results]').click();
 await page.waitForFunction(()=>{const y=document.querySelector('#catalogCount').getBoundingClientRect().top;return y>=0&&y<80;});
 assert.equal(await page.evaluate(()=>document.activeElement.id),'catalogCount','results count receives keyboard focus');
 const best=page.locator('#regimenGrid [data-json-protocol-id="nccp-00555-v6b"]');
 assert(await best.isVisible(),'exact NCCP match is visible');
 assert(await best.evaluate(n=>n.getBoundingClientRect().top)<200,'first match appears directly after the result count');
 assert.equal(await page.locator('#tumourFilter').count(),1,'secondary filters are retained');
 await noOverflow(page,'results');await capture(page,`results-${width}`);
 await page.evaluate(()=>SACTCheckProtocolLoader.launchProtocol('nccp-00555-v6b'));
 await page.waitForFunction(()=>scrollY===0);
 assert.match(await page.locator('#jsonSelectedRegimen').innerText(),/FOLFOXIRI/);
 assert(await topOf(page,'#jsonSelectedRegimen')<500,'selected regimen appears before secondary tools');
 assert(await topOf(page,'#jsonAssessmentForm')<800,'first assessment task is in the initial viewport');
 const tools=page.locator('.assessment-tools');assert.equal(await tools.getAttribute('open'),null);
 await tools.locator('summary').click();assert(await page.locator('#jsonOfficialPdf').isVisible(),'source remains accessible in tools');
 await tools.locator('summary').click();
 await noOverflow(page,'assessment');await capture(page,`assessment-${width}`);
}
async function patientJourney(page,url,width){
 await page.goto(url+'/patient/00555/');
 await retainedClinicalContent(page,'[data-patient-panel]');
 assert(await topOf(page,'.pt-tabs')<450,'named patient sections appear beside the title');
 assert.equal(await page.locator('.pt-document-choices a[href="knowledge.html"]').innerText(),'Open the full OncoWiki: your treatment, explained','established reference link retained');
 for(const href of ['guide.pdf','handbook.pdf','knowledge.pdf'])assert.equal(await page.locator(`.pt-document-choices a[href="${href}"]`).count(),1,`${href} format retained`);
 assert(await page.locator('#urgent').isVisible(),'urgent advice is never collapsed');
 const artwork=await page.locator('.hcc-anatomy img').getAttribute('src');assert.match(artwork,/body|anatom|patient/i,'detailed anatomy image is retained');
 await capture(page,`patient-${width}`);
 await page.locator('.pt-document-choices').scrollIntoViewIfNeeded();await capture(page,`patient-formats-${width}`);
 await page.getByRole('link',{name:'My tests and checks',exact:true}).click();assert(await page.locator('#my-tests').isVisible());assert.equal(await page.locator('#my-treatment').isVisible(),false);
 await page.locator('.pt-expand-details').click();assert.equal(await page.locator('[data-patient-panel][hidden]').count(),0,'expand-all reveals every original panel');
 assert.equal(await page.locator('[data-patient-panel] details:not([open])').count(),0,'nested details are expanded');
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('[data-patient-panel][hidden]').count(),0,'all panels are printable');
 assert(await page.locator('.hcc-anatomy img').isVisible(),'anatomical illustration remains printable');
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));await noOverflow(page,'patient');
 await page.goto(url+'/patient/00555/knowledge.html');
 await retainedClinicalContent(page,'main[data-patient-knowledge]>section');
 const topics=page.locator('main>details.pk-section').filter({has:page.locator('.pk-contents')});
 assert.equal(await topics.getAttribute('open'),null,'topic navigation initially compact');
 assert(await topics.evaluate(n=>n.getBoundingClientRect().top)<750,'topic chooser appears before urgent reference text');
 assert(await page.locator('#urgent').isVisible(),'reference urgent advice remains expanded');
 await capture(page,`knowledge-${width}`);
 const toggle=page.locator('.oncowiki-detail-controls button');await toggle.click();
 assert.equal(await page.locator('main details:not([open])').count(),0,'expand-all opens every nested clinical detail');
 await toggle.click();assert.equal(await page.locator('main details[open]').count(),0,'collapse-all restores a compact reference');
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('main details:not([open])').count(),0,'complete reference content expands for printing');
 assert(await page.locator('#medicines p').first().isVisible(),'clinical text remains visible in print');
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 assert.equal(await page.locator('main details[open]').count(),0,'screen disclosure state restored after printing');await noOverflow(page,'reference');
}
async function consentDiscussionJourney(page,url,width){
 await page.goto(url+'/patient/00568/consent.html');
 await page.locator('link[data-consent-discussion-styles]').waitFor({state:'attached'});
 await retainedClinicalContent(page,'#consent-discussion');
 const fields=await page.evaluate(async()=>{
  const source=new DOMParser().parseFromString(await (await fetch(location.pathname)).text(),'text/html');
  const normalise=s=>s.replace(/\s+/g,' ').trim();
  const inventory=root=>[...root.querySelectorAll('#consent-discussion textarea,#consent-discussion input')].map(n=>({tag:n.tagName,id:n.id,type:n.getAttribute('type'),value:n.getAttribute('value'),checked:n.getAttribute('checked'),placeholder:n.getAttribute('placeholder'),autocomplete:n.getAttribute('autocomplete'),spellcheck:n.getAttribute('spellcheck'),label:normalise(n.id?root.querySelector(`label[for="${n.id}"]`).textContent:n.closest('label').textContent)}));
  return {source:inventory(source),current:inventory(document)};
 });
 assert.deepEqual(fields.current,fields.source,'all original discussion fields, labels and initial values are preserved');
 assert(await page.getByText('Clinician draft — consent discussion support.',{exact:true}).isVisible(),'draft boundary stays visible');
 assert.match(await page.locator('.consent-privacy-warning').innerText(),/Do not enter names, MRNs or dates of birth/);
 const start=page.getByRole('button',{name:'Start discussion',exact:true});const startBox=await start.boundingBox();
 assert(startBox.y+startBox.height<900,'clear start action appears in the first viewport');
 const navigation=page.getByRole('navigation',{name:'Consent discussion sections'});
 for(const name of ['Purpose','Risks','Understanding'])assert(await navigation.getByRole('link',{name,exact:true}).isVisible(),`${name}: early labelled section navigation`);
 await noOverflow(page,'consent discussion');await capture(page,`consent-discussion-${width}`);
 await start.focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'discussion-benefit','keyboard start action focuses first editable field');
 assert(await topOf(page,'label[for="discussion-benefit"]')<150,'first task label is visible after start');
 await capture(page,`consent-start-${width}`);
 const purpose=page.locator('.consent-purpose-context');assert.equal(await purpose.getAttribute('open'),null,'extended schedule initially compact');
 await purpose.locator('summary').click();assert.match(await purpose.innerText(),/Carboplatin stops/);await purpose.locator('summary').click();
 const riskLink=navigation.getByRole('link',{name:'Risks',exact:true});await riskLink.focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'consent-risks','keyboard section navigation focuses its heading');
 const understanding=navigation.getByRole('link',{name:'Understanding',exact:true});await understanding.focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'consent-understanding');
 const textareas=page.locator('#consent-discussion textarea');
 for(let i=0;i<await textareas.count();i++)await textareas.nth(i).fill(`Synthetic discussion note ${i+1}: review example only.`);
 const checks=page.locator('#consent-discussion input[type="checkbox"]');for(let i=0;i<await checks.count();i++)await checks.nth(i).check();
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});
 assert.equal(await purpose.getAttribute('open'),'','complete treatment schedule expands in print');
 assert(await purpose.getByText(/Carboplatin stops/).isVisible(),'full treatment explanation remains printable');
 assert(await page.locator('.consent-privacy-warning').isVisible(),'privacy warning remains printable');
 for(let i=0;i<await textareas.count();i++){
  const id=await textareas.nth(i).getAttribute('id');const printed=page.locator('#'+id+'-print');
  assert(await printed.isVisible(),`${id}: synthetic entry is visible in print`);assert.equal(await printed.innerText(),`Synthetic discussion note ${i+1}: review example only.`);
 }
 assert.equal(await page.locator('#consent-discussion input[type="checkbox"]:checked').count(),await checks.count(),'all discussion tick states are retained for print');
 await capture(page,`consent-print-${width}`);
 if(process.env.SACT_VISUAL_DIR&&width===1440)await page.pdf({path:path.join(process.env.SACT_VISUAL_DIR,'consent-discussion-synthetic.pdf'),preferCSSPageSize:true,printBackground:true});
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 assert.equal(await purpose.getAttribute('open'),null,'screen guidance state restored after print');
 const tools=page.locator('.consent-secondary-tools');await tools.locator('summary').click();await page.getByRole('button',{name:'Clear entries',exact:true}).click();
 for(let i=0;i<await textareas.count();i++)assert.equal(await textareas.nth(i).inputValue(),'','clear preserves original reset behavior');
 assert.equal(await page.locator('#consent-discussion input:checked').count(),0,'clear resets discussion ticks');
 await textareas.first().fill('Synthetic reload check');await page.reload();assert.equal(await page.locator('#discussion-benefit').inputValue(),'','entries remain memory-only and clear on reload');
 await noOverflow(page,'consent discussion after reset');
}
(async()=>{
 const root=path.resolve(__dirname,'..');const server=await require('../tools/local-site-server.cjs').serve(process.env.SACT_SITE_DIR||root);let browser;
 try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));await homeJourney(page,server.url,width);await patientJourney(page,server.url,width);await consentDiscussionJourney(page,server.url,width);assert.deepEqual(errors,[],`${width}px: JavaScript page errors`);await page.close();}
  console.log('Task navigation, evaluation disclosure, document choices, consent draft keyboard/reset and complete detail/print checks passed at 390px and 1440px.');
 }finally{if(browser)await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
