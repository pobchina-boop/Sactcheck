'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const evidence=process.env.SACT_WORKFLOW_EVIDENCE_DIR;

async function backgroundRestored(page){
  assert.deepEqual(await page.evaluate(()=>window.workflowBackgroundBefore.filter(item=>
    item.node.inert!==item.inert||item.node.getAttribute('inert')!==item.attribute||item.node.getAttribute('aria-hidden')!==item.ariaHidden
  ).map(item=>item.node.id||item.node.tagName)),[],'Closing must restore exact preexisting background states');
}

(async()=>{
  if(evidence) fs.mkdirSync(evidence,{recursive:true});
  const server=await require('../tools/local-site-server.cjs').serve(process.env.SACT_SITE_DIR||root);
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  const results=[];
  try{
    for(const width of [390,1440]){
      const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      let releaseData;
      const dataReady=new Promise(resolve=>{releaseData=resolve;});
      await page.route('**/data/regimen-workflow-v0750.json*',async route=>{await dataReady;await route.continue();});
      await page.goto(server.url,{waitUntil:'load'});
      await page.waitForFunction(()=>document.querySelector('[data-json-protocol-id="nccp-00568-v5"]')?.dataset.sactCardReady==='true');
      await page.locator('#regimenSearch').fill('00568');
      const opener=page.locator('[data-json-protocol-id="nccp-00568-v5"] [data-open-regimen-workflow]');
      const overlay=page.locator('#regimenWorkflowOverlay');
      const close=page.locator('#regimenWorkflowOverlay .workflow-close');
      await page.evaluate(()=>{
        const fixture=document.createElement('div');
        fixture.id='workflow-existing-inert-fixture';
        fixture.setAttribute('inert','preserved');
        fixture.setAttribute('aria-hidden','true');
        document.body.appendChild(fixture);
        window.workflowBackgroundBefore=[...document.body.children].map(node=>({node,inert:node.inert,attribute:node.getAttribute('inert'),ariaHidden:node.getAttribute('aria-hidden')}));
      });
      await opener.focus();
      assert(await opener.evaluate(node=>node===document.activeElement),'The launcher must be focused before opening');
      await opener.click();
      await page.getByRole('dialog',{name:'Regimen workflow',exact:true}).waitFor({state:'visible'});
      assert(await close.evaluate(node=>node===document.activeElement),'Focus must enter the dialog before its data resolves');
      assert.equal(await page.locator('#workflowPanelBody').getAttribute('aria-busy'),'true');
      assert(await page.evaluate(()=>[...document.body.children].filter(node=>node.id!=='regimenWorkflowOverlay').every(node=>node.inert)),'Background must be inert while loading');
      await page.keyboard.press('Tab');
      assert(await close.evaluate(node=>node===document.activeElement),'Loading dialog Tab must remain on its only control');
      await page.keyboard.press('Shift+Tab');
      assert(await close.evaluate(node=>node===document.activeElement),'Loading dialog Shift+Tab must remain on its only control');
      await page.evaluate(()=>{
        document.getElementById('regimenSearch').focus();
        const added=document.createElement('button');
        added.id='workflow-added-background';
        added.textContent='Background sentinel';
        document.body.appendChild(added);
      });
      assert(await close.evaluate(node=>node===document.activeElement),'Background programmatic focus must not escape the dialog');
      await page.waitForFunction(()=>document.getElementById('workflow-added-background').inert);
      if(evidence) await page.screenshot({path:path.join(evidence,`workflow-loading-${width}.png`)});
      await page.keyboard.press('Escape');
      assert(await overlay.isHidden(),'Escape must dismiss the dialog while loading');
      assert(await opener.evaluate(node=>node===document.activeElement),'Escape must restore its launcher');
      await backgroundRestored(page);
      assert.equal(await page.locator('#workflow-added-background').getAttribute('inert'),null,'New background siblings must be restored too');
      await page.locator('#regimenSearch').fill('00555');
      const secondOpener=page.locator('[data-json-protocol-id^="nccp-00555-"] [data-open-regimen-workflow]').first();
      const secondTitle=await secondOpener.evaluate(node=>{
        const protocol=window.SACTCheckProtocolLoader.getProtocolById(node.dataset.openRegimenWorkflow);
        return protocol.metadata.short_title||protocol.metadata.title||protocol.protocol_id;
      });
      await secondOpener.click();
      assert(await close.evaluate(node=>node===document.activeElement),'Reopening another regimen while data is pending must focus inside');
      releaseData();
      await page.waitForFunction(title=>document.getElementById('workflowPanelTitle')?.textContent===title,secondTitle);
      assert.equal(await page.locator('#workflowPanelTitle').innerText(),secondTitle,'A stale first request must not replace the newly selected regimen');
      await page.keyboard.press('Escape');
      assert(await secondOpener.evaluate(node=>node===document.activeElement),'A pending-data reopen must remember its own launcher');
      await backgroundRestored(page);
      await page.locator('#regimenSearch').fill('00568');
      await opener.click();
      await page.locator('[data-workflow-assess]').waitFor({state:'visible'});
      assert.equal(await page.locator('#workflowPanelBody').getAttribute('aria-busy'),null);
      assert(await close.evaluate(node=>node===document.activeElement),'Async rendering must preserve the stable initial focus');
      const visited=[];
      let wrapped=false;
      for(let index=0;index<40;index++){
        await page.evaluate(()=>{window.workflowPreviousFocus=document.activeElement;});
        await page.keyboard.press('Tab');
        const current=await page.evaluate(()=>({inside:document.getElementById('regimenWorkflowOverlay').contains(document.activeElement),close:document.activeElement.matches('.workflow-close'),text:document.activeElement.textContent.trim()}));
        assert(current.inside,'Tab must not reach background controls');
        if(current.close){wrapped=true;break;}
        visited.push(current.text);
      }
      assert(wrapped,'Tab must wrap to the first dialog control');
      assert(visited.includes('Open assessment'),'Keyboard traversal must include assessment');
      assert(visited.some(text=>/regimen profile/i.test(text)),'Keyboard traversal must include knowledge');
      await page.keyboard.press('Shift+Tab');
      assert(await page.evaluate(()=>document.activeElement===window.workflowPreviousFocus),'Shift+Tab must wrap to the final dialog control');
      await page.keyboard.press('Tab');
      assert(await close.evaluate(node=>node===document.activeElement),'Forward wrap must return to close');
      if(evidence) await page.screenshot({path:path.join(evidence,`workflow-keyboard-${width}.png`)});
      await page.keyboard.press('Escape');
      assert(await opener.evaluate(node=>node===document.activeElement),'Rendered-dialog Escape must restore its launcher');
      await backgroundRestored(page);
      await opener.click();
      await page.locator('[data-workflow-assess]').waitFor({state:'visible'});
      await page.mouse.click(2,500);
      assert(await overlay.isHidden(),'A real backdrop click must dismiss the dialog');
      assert(await opener.evaluate(node=>node===document.activeElement),'Backdrop dismissal must restore the launcher');
      await backgroundRestored(page);
      await opener.click();
      await close.click();
      assert(await overlay.isHidden(),'The close button must dismiss the dialog');
      assert(await opener.evaluate(node=>node===document.activeElement),'The close button must restore the launcher');
      await backgroundRestored(page);

      await opener.click();
      const consentPromise=page.waitForEvent('popup');
      await page.locator('[data-workflow-consent]').click();
      const consent=await consentPromise;
      await consent.waitForLoadState();
      assert.match(consent.url(),/patient\/00568\/consent-form\.html/,'Consent must retain the regimen-specific destination');
      assert(await overlay.isHidden(),'Consent must open after workflow closes');
      await backgroundRestored(page);
      await consent.close();

      await opener.click();
      await page.locator('.workflow-patient-disclosure summary').click();
      const patientPromise=page.waitForEvent('popup');
      await page.locator('[data-workflow-patient-guide]').click();
      const patient=await patientPromise;
      await patient.waitForLoadState();
      assert.match(patient.url(),/patient\/00568\/(?:index\.html)?$/,'Patient platform must retain the regimen-specific destination');
      assert(await overlay.isHidden(),'Patient platform must open after workflow closes');
      await backgroundRestored(page);
      await patient.close();

      await opener.click();
      await page.locator('[data-workflow-knowledge]').click();
      const knowledgeClose=page.locator('[data-regimen-info-close]').first();
      await knowledgeClose.waitFor({state:'visible'});
      assert(await overlay.isHidden(),'Knowledge must take over after workflow closes');
      assert(await knowledgeClose.evaluate(node=>node===document.activeElement&&!node.closest('[inert]')),'Workflow must not steal focus or leave knowledge inert');
      await page.keyboard.press('Tab');
      assert(await page.evaluate(()=>!document.getElementById('regimenWorkflowOverlay').contains(document.activeElement)),'A closed workflow must release its keyboard trap');
      await knowledgeClose.click();

      await opener.click();
      const popupPromise=page.waitForEvent('popup');
      await page.locator('[data-workflow-support]').click();
      const support=await popupPromise;
      await support.waitForLoadState();
      assert.match(support.url(),/patient\/00568\/(supportive-care|supportive-care-selector)/,'Support must retain the regimen-specific destination');
      await support.close();
      assert(await overlay.isVisible(),'A support document in a new tab must preserve the workflow');
      await page.locator('.workflow-patient-disclosure summary').click();
      const passportPromise=page.waitForEvent('popup');
      await page.locator('[data-workflow-passport-card]').click();
      const passport=await passportPromise;
      await passport.waitForLoadState();
      assert.match(passport.url(),/patient\/00568\/.*passport/i,'Passport must retain its regimen-specific destination');
      await passport.close();
      await page.locator('[data-workflow-assess]').click();
      await page.locator('#jsonAssessmentScreen').waitFor({state:'visible'});
      assert(await overlay.isHidden(),'Assessment must open after workflow closes');
      const input=page.locator('#jsonInput_anc_x10e9_l');
      await input.focus();
      assert(await input.evaluate(node=>node===document.activeElement&&!node.closest('[inert]')),'Assessment must receive keyboard focus with background state restored');
      await input.fill('0.3');
      await page.getByRole('button',{name:'Run assessment engine',exact:true}).click();
      assert.match(await page.locator('#jsonResult').innerText(),/hold|withhold|delay/i,'The existing clinical assessment action must still run');
      assert.deepEqual(errors,[],'Workflow journeys must not raise browser errors');
      results.push({width,loadingFocus:true,tabWrap:true,backgroundInert:true,restoredOnEscapeBackdropAndClose:true,asyncRender:true,consent:true,patient:true,knowledge:true,support:true,passport:true,assessment:true});
      await page.close();
    }
    if(evidence) fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(results,null,2)+'\n');
    console.log(JSON.stringify(results,null,2));
  }finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
