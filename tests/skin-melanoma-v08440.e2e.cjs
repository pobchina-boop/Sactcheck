'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'validation/skin-melanoma-v08440/browser');
const routes=['00236','00415','00563','00431','00812','00415/adjuvant'];
const representative=new Set(routes);
const report={checked:new Date().toISOString(),scope:'Current local HTML, real Chromium; not deployed verification or real-device installation',clinical_ui_assessments:{status:'unverified',reason:'Patient UI runner only; source-derived engine tests are separate and do not establish browser assessment journeys.'},pages:[],assessments:[],screenshots:[],failures:[],page_errors:[],failed_requests:[]};
const profile=route=>{const[c,ctx]=route.split('/');return JSON.parse(fs.readFileSync(path.join(root,ctx?`data/patient-knowledge-contexts/${c}/${ctx}.json`:`data/patient-knowledge/${c}.json`),'utf8'));};
async function fit(page,label){const m=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'))}));assert(m.width<=m.viewport,label+' horizontal overflow '+JSON.stringify(m));assert.deepEqual(m.broken,[],label+' broken images');return m;}
async function screenshot(page,name,locator){const file=name+'.png';if(locator)await locator.screenshot({path:path.join(out,file)});else await page.screenshot({path:path.join(out,file)});report.screenshots.push({file,inspected:false});}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=await require('../tools/local-site-server.cjs').serve(process.env.SACT_SITE_DIR||root);let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'});page.setDefaultTimeout(12000);
   page.on('pageerror',e=>report.page_errors.push({width,url:page.url().replace(server.url,''),message:e.message}));
   page.on('requestfailed',r=>{if(r.url().startsWith(server.url)&&r.failure()?.errorText!=='net::ERR_ABORTED')report.failed_requests.push({width,url:r.url().replace(server.url,''),message:r.failure()?.errorText});});
   page.on('response',r=>{if(r.url().startsWith(server.url)&&r.status()>=400)report.failed_requests.push({width,url:r.url().replace(server.url,''),status:r.status()});});
   for(const route of routes){const d=profile(route);for(const leaf of ['','knowledge.html','consent-form.html','supportive-care.html']){
    const label=route+'/'+(leaf||'index')+'/'+width;const row={route,leaf:leaf||'index.html',width};report.pages.push(row);
    try{
     const response=await page.goto(`${server.url}/patient/${route}/${leaf}`,{waitUntil:'load'});assert.equal(response.status(),200,label);await page.evaluate(()=>document.fonts.ready);
     row.initial=await fit(page,label);assert.match(await page.locator('body').innerText(),new RegExp(route.slice(0,5)),label+' regimen identity');
     if(!leaf){
      if(representative.has(route))await screenshot(page,route.replace('/','-')+'-'+width+'-portal');
      const picker=page.locator('#patient-section');row.navigated=[];
      if(await picker.isVisible()){
       const values=await picker.locator('option').evaluateAll(xs=>xs.map(o=>o.value).filter(Boolean));
       for(const value of values){await picker.selectOption(value);assert(await page.locator('#'+value).isVisible(),label+' selected panel '+value);row.navigated.push(value);await fit(page,label+' '+value);}
      }else{
       const links=page.locator('[data-patient-nav]');const count=await links.count();assert(count>=4,label+' navigation count');
       for(let i=0;i<count;i++){const link=links.nth(i);await link.focus();await page.keyboard.press('Enter');const hash=await link.getAttribute('href');assert(await page.locator(hash).isVisible(),label+' keyboard panel '+hash);row.navigated.push(hash);await fit(page,label+' '+hash);}
      }
      const expand=page.getByRole('button',{name:'Expand all details',exact:true});await expand.click();assert.equal(await page.locator('[data-patient-panel][hidden]').count(),0,label+' all panels expand');
      const map=page.locator('[data-authored-map]');assert.equal(await map.count(),1,label+' authored anatomical map');assert.equal(await map.locator('.hcc-organ-card').count(),d.anatomy.length,label+' all organ anchors');
      for(const a of d.anatomy)assert((await map.innerText()).includes(a[3]),label+' retained toxicity explanation '+a[0]);
      row.anatomical_anchors=d.anatomy.length;
      assert(await map.locator('img').evaluate(el=>el.naturalWidth>100),label+' detailed illustration loaded');
      if(representative.has(route))await screenshot(page,route.replace('/','-')+'-'+width+'-anatomy',map);
      assert(await page.locator('a[href="treatment-journey.html"]').count()>0,label+' journey link');
      const journey=await page.request.get(`${server.url}/patient/${route}/treatment-journey.html`);assert.equal(journey.status(),200,label+' journey destination');
      row.downloads=[];
      for(const name of ['guide.pdf','sactcard.pdf','knowledge.pdf','handbook.pdf']){
       const response=await page.request.get(`${server.url}/patient/${route}/${name}`);assert.equal(response.status(),200,label+' '+name);assert.equal((await response.body()).subarray(0,4).toString(),'%PDF',label+' PDF signature '+name);row.downloads.push(name);
      }
      row.expanded=await fit(page,label+' expanded');
     }else if(leaf==='knowledge.html'){
      const expand=page.getByRole('button',{name:'Expand all details',exact:true});assert.equal(await expand.count(),1,label+' progressive reference controls');await expand.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('main details:not([open])').count(),0,label+' expand all reference details');
      assert.equal(await page.locator('[data-authored-map] .hcc-organ-card').count(),d.anatomy.length,label+' reference retains anatomy');row.expanded=await fit(page,label+' expanded');
      if(route==='00431')await screenshot(page,'00431-'+width+'-knowledge');
     }else if(leaf==='consent-form.html'){
      row.signatures=await page.locator('.sign-line').count();assert(row.signatures>=4,label+' signature fields');row.risks=await page.locator('.tick').count();assert(row.risks>0,label+' risk statements');
      const before=await page.locator('.consent-sheet').textContent();await page.emulateMedia({media:'print'});assert.equal(await page.locator('.consent-sheet').textContent(),before,label+' print text retention');await page.emulateMedia({media:'screen'});
      if(route==='00431')await screenshot(page,'00431-'+width+'-consent');
     }else{
      const picker=page.locator('#support-phase');assert.equal(await picker.count(),1,label+' support phase selector');const values=await picker.locator('option').evaluateAll(xs=>xs.map(o=>o.value).filter(Boolean));assert(values.length>0,label+' actual phase choices');row.phases=[];
      for(const value of values){await picker.selectOption(value);assert.equal(await page.locator('[data-support-phase]:visible').count(),1,label+' one active support phase');await fit(page,label+' '+value);row.phases.push(value);}
      if(route==='00415')await screenshot(page,'00415-'+width+'-support');
     }
     row.passed=true;
    }catch(e){row.passed=false;row.error=e.message;report.failures.push({label,message:e.message});console.error('FAIL',label,e.message);}
   }}
   await page.close();
  }
 }catch(e){
  report.execution_error=e.message;report.status=browser?'failed':'blocked_browser_launch';throw e;
 }finally{
  if(browser)await browser.close();await server.close();report.summary={pages:report.pages.length,passed_pages:report.pages.filter(p=>p.passed).length,assessments:report.assessments.length,passed_assessments:report.assessments.filter(p=>p.passed).length,failures:report.failures.length,page_errors:report.page_errors.length,failed_local_requests:report.failed_requests.length};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
 }
 assert.equal(report.pages.length,48);assert.equal(report.assessments.length,0);assert.deepEqual(report.failures,[]);assert.deepEqual(report.page_errors,[]);assert.deepEqual(report.failed_requests,[]);
})().catch(e=>{console.error(e);process.exitCode=1;});
