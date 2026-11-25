'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),site=process.env.SACT_TEST_SITE||root;
const evidence=process.env.SACT_STARTUP_EVIDENCE||path.join(require('node:os').tmpdir(),'sactcheck-card-startup');
fs.mkdirSync(evidence,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname), file=path.resolve(site,'.'+rel+(rel.endsWith('/')?'index.html':''));
 if(!file.startsWith(site+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});const errors=[];const results={};
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  let release;const hold=new Promise(r=>{release=r});
  await page.route('**/protocols/catalogue-bundle.json.gz*',async route=>{await hold;await route.continue();});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#sactRuntimeLoadStatus').waitFor({state:'visible'});
  for(const width of [1280,375]){
   await page.setViewportSize({width,height:900});const b=await page.locator('#sactRuntimeLoadStatus').boundingBox();assert(Math.abs(b.x+b.width/2-width/2)<2);assert(Math.abs(b.y+b.height/2-450)<2);assert(b.width<=width-30);
   await page.screenshot({path:path.join(evidence,'loading-'+width+'.png')});
  }
  assert.match(await page.locator('#sactRuntimeLoadStatus').textContent(),/get our protocols in order/);
  release();await page.waitForFunction(()=>window.SACTCHECK_CATALOGUE_STATE==='ready');await page.waitForFunction(()=>!document.getElementById('sactRuntimeLoadStatus'));
  await page.waitForFunction(()=>[...document.querySelectorAll('.regimen-card[data-json-protocol-id]')].every(c=>c.dataset.sactCardReady==='true'));
  results.catalogue=await page.evaluate(()=>window.SACTCHECK_PROTOCOL_LOAD_STATUS);assert.equal(results.catalogue.unavailable,0);
  results.hydration=await page.evaluate(()=>{
   const originalInterface=window.SACTCheckInterface,originalPrint=window.SACTCheckAntiemeticPrintV0810;let interfaceCalls=0,printCalls=0;
   window.SACTCheckInterface={...originalInterface,decorateCards(){interfaceCalls++;originalInterface.decorateCards()}};
   window.SACTCheckAntiemeticPrintV0810={...originalPrint,decorate(){printCalls++;originalPrint.decorate()}};
   window.SACTCheckUIStabilityV0810.hydrateAll();window.SACTCheckInterface=originalInterface;window.SACTCheckAntiemeticPrintV0810=originalPrint;
   return {interfaceCalls,printCalls,cards:document.querySelectorAll('.regimen-card[data-json-protocol-id]').length};
  });assert.equal(results.hydration.interfaceCalls,1);assert.equal(results.hydration.printCalls,1);
  // Exact identifiers and all explicit historical aliases must retain their previous resolution.
  assert.equal(await page.evaluate(()=>{const api=window.SACTCheckProtocolLoader,ids=window.SACTCheckProtocolIds,records=api.getLoadedProtocols().map(x=>x.protocol),map=window.SACTCHECK_PROTOCOLS_BY_ID;return [...records.map(x=>x.protocol_id),...Object.keys(ids.migrations),'missing'].every(id=>api.getProtocolById(id)===(ids.resolve(id,map.values())||map.get(id)||null));}),true);
  results.wallets=[];
  for(const route of ['00862','00525','00353'])for(const width of [1280,375]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/patient/'+route+'/',{waitUntil:'networkidle'});
   const box=await page.locator('.pt-wallet').evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,scroll:document.documentElement.scrollWidth,children:[...el.children].map(c=>{const b=c.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}})};});
   assert(box.scroll<=width+1,route+' page overflow');assert(box.width<=647.1);assert(box.children.every(c=>c.left>=box.left-1&&c.right<=box.right+1),route+' card border');
   if(width===1280)assert(Math.abs(box.children[1].right-box.right)<2,route+' trailing cut line');
   if(route==='00862')await page.locator('.pt-wallet').screenshot({path:path.join(evidence,'wallet-'+width+'.png')});
   results.wallets.push({route,viewport:width,...box});
  }
  await page.setViewportSize({width:1280,height:900});await page.emulateMedia({media:'print'});await page.goto(base+'/patient/00862/',{waitUntil:'networkidle'});
  const printBefore=await page.locator('.pt-wallet').boundingBox();
  const originalCss=cp.execFileSync('git',['show','3368f80d8c6f0390ccd085b34609a87cbea4cf50:assets/patient/patient-overview-v08445.css'],{cwd:root});
  await page.route('**/patient-overview-v08445.css*',route=>route.fulfill({body:originalCss,contentType:'text/css'}));await page.reload({waitUntil:'networkidle'});
  assert.deepEqual(await page.locator('.pt-wallet').boundingBox(),printBefore);results.printGeometryUnchanged=true;
  await context.close();
  const failed=await browser.newPage();await failed.route('**/protocols/index.json*',route=>route.fulfill({status:404,body:'Unavailable'}));await failed.goto(base,{waitUntil:'domcontentloaded'});await failed.locator('#protocolLoaderWarning.protocol-loader-fatal').waitFor();assert.equal(await failed.locator('#sactRuntimeLoadStatus').count(),0);await failed.close();results.failedLoadNotice=true;
  assert.deepEqual(errors,[]);results.pageErrors=errors;
  fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.closeAllConnections();server.close();});
