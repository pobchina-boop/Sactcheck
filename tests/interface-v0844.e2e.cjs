'use strict';
// Real browser checks with local asset routing, so no server or external network is needed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.SACT_BROWSER_OUTPUT||'/tmp/sact-interface-v0844';
fs.mkdirSync(out,{recursive:true});
const report=[];
(async()=>{
 for(const width of [1440,390]){
  const b=await chromium.launch({...(process.env.SACT_BROWSER_EXECUTABLE?{executablePath:process.env.SACT_BROWSER_EXECUTABLE}:{}),args:['--no-sandbox','--no-zygote','--single-process','--disable-gpu']});
  try{
   const c=await b.newContext({viewport:{width,height:1000}}),errors=[],missing=[];
   await c.route('**/*',route=>{
    const url=new URL(route.request().url());if(url.hostname!=='sactcheck.test')return route.fulfill({status:204,body:''});
    let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep)&&file!==root)return route.fulfill({status:403,body:''});
    if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    if(!fs.existsSync(file)){missing.push(url.pathname);return route.fulfill({status:404,body:'missing'});}
    const contentType={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
    return route.fulfill({body:fs.readFileSync(file),contentType});
   });
   const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto('http://sactcheck.test/');
   await p.waitForFunction(()=>document.querySelectorAll('.regimen-card[data-v0740-actions="ready"]').length>=376);
   const count=await p.locator('.regimen-card[data-json-protocol-id]').count();
   assert.equal(await p.locator('#clinicalScenarioLauncher,#globalScenarioInterpreter,[data-open-global-scenario]').count(),0);
   const badCards=await p.locator('.regimen-card[data-json-protocol-id]').evaluateAll(cards=>cards.filter(card=>{
    const buttons=[...card.querySelectorAll('.card-actions > button,.card-actions > a')].filter(e=>getComputedStyle(e).display!=='none');
    return buttons.length!==3||!buttons[0].textContent.includes('Clinic workflow')||!buttons[1].textContent.includes('Patient platform')||buttons[2].textContent.trim()!=='NCCP source';
   }).map(c=>c.dataset.jsonProtocolId));assert.deepEqual(badCards,[]);
   await p.locator('#regimenSearch').fill('00568');
   const card=p.locator('[data-json-protocol-id="nccp-00568-v5"]');await card.waitFor({state:'visible'});
   const popupWait=p.waitForEvent('popup');await card.locator('[data-open-patient-support]').click();const popup=await popupWait;await popup.waitForLoadState();assert.match(popup.url(),/\/patient\/00568\//);await popup.close();
   await card.locator('[data-open-regimen-workflow]').click();
   const patient=p.locator('.workflow-module.patient');await patient.waitFor({state:'visible'});await patient.scrollIntoViewIfNeeded();
   assert.equal(await patient.locator('[data-workflow-print-passport]').count(),0);
   const layout=await patient.evaluate(el=>{
    const box=el.getBoundingClientRect(),heading=el.querySelector('h3').getBoundingClientRect();
    const rects=[...el.querySelectorAll('button,a.btn')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.trim(),x:r.x,y:r.y,right:r.right,bottom:r.bottom};});
    const overlap=rects.flatMap((a,i)=>rects.slice(i+1).filter(b=>Math.min(a.right,b.right)>Math.max(a.x,b.x)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.y,b.y)+1));
    return {overflow:rects.filter(r=>r.x<box.x||r.right>box.right+1||r.y<heading.bottom),overlap:overlap.length,count:rects.length};
   });assert.deepEqual(layout.overflow,[]);assert.equal(layout.overlap,0);assert.ok(layout.count>=4);
   await p.screenshot({path:path.join(out,`workflow-${width}.png`)});
   await p.locator('[data-workflow-assess]').click();await p.locator('#jsonAssessmentScreen').waitFor({state:'visible'});
   assert.equal(await p.locator('#jsonAssessmentScreen h1').innerText(),'Treatment assessment engine');
   const run=p.getByRole('button',{name:'Run assessment engine',exact:true});
   await p.locator('#jsonInput_anc_x10e9_l').fill('0.3');await run.click();assert.match(await p.locator('#jsonResult').innerText(),/hold|withhold|delay/i);
   await p.locator('#jsonReset').click();
   await p.locator('[data-lab-analyte="bilirubin"]').fill('42');await run.click();
   const lft=await p.locator('#jsonResult').innerText();assert.match(lft,/42.*(µmol\/L|umol\/L)/);assert.doesNotMatch(lft,/÷|→ decision value/);
   await p.locator('#jsonReset').click();
   await p.locator('#jsonInput_cortisol_nmol_l').fill('200');await p.locator('#jsonInput_cortisol_sample_time').fill('09:00');
   await p.locator('.steroid-context > summary').click();await p.locator('#jsonInput_recent_steroid_use').selectOption('yes');
   for(const [field,value]of Object.entries({steroid_name:'dexamethasone',steroid_dose:'8 mg daily',steroid_route:'oral',steroid_duration:'3 days',steroid_last_dose:'yesterday'}))await p.locator('#jsonInput_'+field).fill(value);
   await run.click();let endocrine=await p.locator('#jsonEndocrineContextResult').innerText();assert.match(endocrine,/dexamethasone/);assert.match(endocrine,/8 mg daily/);assert.match(endocrine,/does not exclude adrenal insufficiency/);
   await p.locator('#jsonEndocrineContextResult').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`cortisol-${width}.png`)});
   const downloadWait=p.waitForEvent('download');await p.locator('#jsonGeneratePdf').click();const download=await downloadWait;await download.saveAs(path.join(out,`cortisol-${width}.pdf`));
   await p.locator('#jsonReset').click();await p.locator('#jsonInput_cortisol_nmol_l').fill('400');await run.click();endocrine=await p.locator('#jsonEndocrineContextResult').innerText();assert.match(endocrine,/No time-matched/);assert.match(endocrine,/unknown or not recorded/);
   await p.locator('#jsonReset').click();await p.locator('#jsonInput_tsh_miu_l').fill('4.5');await p.locator('#jsonEndocrineReferences > summary').click();await p.locator('#endocrineReferenceProfile').selectOption('custom');await p.locator('[data-endocrine-limit="tshUpper"]').fill('5.33');await p.locator('[data-endocrine-limit="tshUpper"]').blur();await run.click();assert.match(await p.locator('#jsonEndocrineContextResult').innerText(),/Within the selected/);
   await p.locator('[data-endocrine-limit="tshLower"]').fill('');await p.locator('[data-endocrine-limit="tshLower"]').blur();await run.click();assert.match(await p.locator('#jsonEndocrineContextResult').innerText(),/limits incomplete or invalid/);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   report.push({width,cards:count,card_destinations:'pass',patient_popup:'pass',patient_layout:layout,assessment_partial_anc:'pass',concise_bilirubin:'pass',steroid_context:'pass',unknown_history:'pass',custom_reference_limits:'pass',pdf_download:'pass',runtime_errors:errors,missing_assets:missing});
  }finally{await b.close();}
 }
 fs.writeFileSync(path.join(root,'validation/interface-v0844/browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
