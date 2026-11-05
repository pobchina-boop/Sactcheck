'use strict';
// Read-only baseline journeys. This does not validate current clinical sources.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../../..'),output=__dirname;
const {chromium}=require(require.resolve('playwright',{paths:[root]}));
const codes=['00212','00214','00215','00244','00382','00207','00225','00328','00330','00331'];
const index=JSON.parse(fs.readFileSync(path.join(root,'protocols/index.json'))).protocols;
const urls=new Map();
const report={purpose:'Fresh current-checkout software/UI preservation review only; no current-source clinical batch validated',baseline_commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),version:JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version,checked_at_utc:new Date().toISOString(),widths:[390,1440],assessments:[],pages:[],downloads:[],screenshots:[],page_errors:[],failed_local_requests:[],assertion_failures:[],observed_gaps:[]};
function captureFailure(label,error){report.assertion_failures.push({label,message:error.message});}
async function metrics(page){return page.evaluate(()=>({headings:[...document.querySelectorAll('h1,h2')].filter(n=>n.getClientRects().length).map(n=>n.textContent.trim()).slice(0,6),page_width:document.documentElement.scrollWidth,viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,context_excerpt:(document.querySelector('main')||document.body).innerText.replace(/\s+/g,' ').slice(0,850),anatomy_images:[...document.querySelectorAll('.hcc-anatomy img,img[src*="anatom"],img[src*="body"]')].map(n=>({src:n.getAttribute('src'),alt:n.getAttribute('alt'),visible:n.getClientRects().length>0})),pdf_links:[...document.querySelectorAll('a[href]')].filter(n=>/\.pdf(?:[?#]|$)/i.test(n.getAttribute('href'))).map(n=>({label:n.textContent.trim(),href:n.href})),broken_images:[...document.images].filter(n=>n.complete&&n.naturalWidth===0).map(n=>n.src)}));}
async function screenshot(page,file){await page.screenshot({path:path.join(output,file)});report.screenshots.push({file,url:page.url().replace(/http:\/\/127\.0\.0\.1:\d+/,''),viewport:page.viewportSize(),sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(output,file))).digest('hex'),manually_viewed:false});}
(async()=>{const server=await require(path.join(root,'tools/local-site-server.cjs')).serve(path.join(root,'_site'));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  for(const width of report.widths){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});page.setDefaultTimeout(15000);
   page.on('pageerror',e=>report.page_errors.push({width,url:page.url(),message:e.message}));
   page.on('requestfailed',r=>{if(r.url().startsWith(server.url))report.failed_local_requests.push({width,url:r.url().replace(server.url,''),error:r.failure()?.errorText});});
   await page.goto(server.url);await page.waitForFunction(()=>window.SACTCHECK_PROTOCOL_LOAD_STATUS?.loaded>0,null,{timeout:60000});
   await page.waitForFunction(()=>!document.querySelector('.protocol-loader-toast'));await page.selectOption('#tumourFilter','Gastrointestinal');
   for(const code of codes){
    const entry=index.find(p=>p.id.includes(code));assert(entry,code+' protocol index entry');
    await page.locator('#regimenSearch').fill(code);const card=page.locator(`[data-json-protocol-id="${entry.id}"]`);
    await card.waitFor({state:'visible'});const row={code,width,protocol_id:entry.id,catalogue_heading:await card.locator('h2').innerText(),card_present:true};
    try{
     await card.locator('[data-open-regimen-workflow]').click();await page.locator('#regimenWorkflowOverlay [data-workflow-assess]').click();await page.locator('#jsonSelectedRegimen').waitFor({state:'visible'});
     row.regimen=await page.locator('#jsonSelectedRegimen').innerText();row.context=await page.locator('#jsonSelectedRegimenContext').innerText();row.tumour_context=await page.locator('#jsonProtocolTumour').innerText();
     assert.match(row.context,new RegExp(code),'selected code matches requested regimen');
     row.input_count=await page.locator('#jsonAssessmentForm input,#jsonAssessmentForm select,#jsonAssessmentForm textarea').count();assert(row.input_count>0,'assessment inputs available');
     row.layout=await metrics(page);assert.equal(row.layout.overflow,false,'assessment has no page-wide horizontal overflow');
     if(width===390&&code==='00328')await screenshot(page,'00328-assessment-mobile.png');
     await page.getByRole('button',{name:'Run assessment engine',exact:true}).click();await page.locator('#jsonResult').waitFor({state:'visible'});
     row.empty_input_result={title:await page.locator('#jsonStatusTitle').innerText(),action:await page.locator('#jsonStatusAction').innerText(),coverage:await page.locator('#jsonCoverageMetric').innerText(),completion:await page.locator('#jsonCompleteMetric').innerText()};
     assert.match(row.empty_input_result.coverage,/unassessed/,'missing-input coverage is explicit');
     row.launch_and_empty_input_result_rendered=true;
    }catch(e){captureFailure(code+' assessment '+width,e);row.error=e.message;}
    report.assessments.push(row);console.log('Assessment',code,width,row.error||'rendered');
    if(await page.locator('#jsonBackLibrary').isVisible())await page.locator('#jsonBackLibrary').click();else await page.goto(server.url);
   }
   for(const code of codes){for(const leaf of ['','knowledge.html','consent.html','consent-form.html','supportive-care.html']){
    const relative=`/patient/${code}/${leaf}`;const response=await page.goto(server.url+relative,{waitUntil:'networkidle'});const row={code,width,route:relative,http_status:response.status()};
    if(response.status()===404){row.missing_route=true;report.observed_gaps.push({code,route:relative,gap:'Route absent in current baseline'});}
    else{
     assert.equal(response.status(),200,relative+' response');await page.evaluate(()=>document.fonts.ready);row.layout=await metrics(page);
     if(row.layout.overflow)report.observed_gaps.push({code,width,route:relative,gap:'Page-wide horizontal overflow',width:row.layout.page_width,viewport:width});
     if(row.layout.broken_images.length)report.observed_gaps.push({code,width,route:relative,gap:'Broken rendered images',images:row.layout.broken_images});
     for(const link of row.layout.pdf_links){const u=new URL(link.href);if(u.origin===server.url){const key=u.pathname;urls.set(key,[...(urls.get(key)||[]),relative]);}}
     if(width===390&&code==='00212'&&leaf==='')await screenshot(page,'00212-patient-mobile-breast-context.png');
     if(width===1440&&code==='00214'&&leaf==='knowledge.html')await screenshot(page,'00214-knowledge-desktop-lung-context.png');
     if(width===1440&&code==='00382'&&leaf==='')await screenshot(page,'00382-patient-desktop-existing-colorectal.png');
    }
    report.pages.push(row);console.log('HTML',code,width,leaf||'index',row.http_status);
   }}
   await page.close();
  }
  const downloadsContext=await browser.newContext();for(const [relative,from] of urls){const r=await downloadsContext.request.get(server.url+relative);const data=await r.body();const item={route:relative,linked_from:[...new Set(from)],http_status:r.status(),pdf_magic:data.subarray(0,5).toString()==='%PDF-',bytes:data.length};report.downloads.push(item);if(!item.pdf_magic||item.http_status!==200)report.observed_gaps.push({route:relative,gap:'Linked download absent or not PDF',http_status:item.http_status});}await downloadsContext.close();
 }catch(e){captureFailure('runner',e);process.exitCode=1;}
 finally{if(browser)await browser.close();await server.close();report.summary={assessment_states:report.assessments.length,successful_assessment_journeys:report.assessments.filter(x=>x.launch_and_empty_input_result_rendered).length,html_states:report.pages.length,html_200:report.pages.filter(x=>x.http_status===200).length,html_404:report.pages.filter(x=>x.http_status===404).length,unique_pdf_downloads:report.downloads.length,pdf_download_failures:report.downloads.filter(x=>x.http_status!==200||!x.pdf_magic).length,page_errors:report.page_errors.length,failed_local_requests:report.failed_local_requests.length,assertion_failures:report.assertion_failures.length};fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary,null,2));if(report.assertion_failures.length||report.page_errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
