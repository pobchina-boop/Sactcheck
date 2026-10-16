'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const styling=async p=>p.locator('.wiki-cycle-map').evaluate(el=>{
 const read=(q,props)=>{const s=getComputedStyle(q?el.querySelector(q):el);return Object.fromEntries(props.map(k=>[k,s[k]]));};
 return {map:read(null,['borderRadius','padding','backgroundColor','fontFamily','fontSize','lineHeight']),label:read('.wiki-cycle-label',['fontSize','fontWeight','color']),day:read('.wiki-cycle-day',['fontSize','color']),infusion:read('.infusion',['backgroundColor','color','fontSize','fontWeight','borderRadius']),variable:read('.variable',['backgroundImage','color','borderRadius'])};
});
(async()=>{
 const server=await require('../tools/local-site-server.cjs').serve(root),browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 const report=[];fs.mkdirSync(path.join(root,'validation/cycle-v0831'),{recursive:true});
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:1100}}),p=await context.newPage();
   await p.goto(server.url+'/patient/00568/',{waitUntil:'networkidle'});await p.locator('#wikiCycleChronology').waitFor();const reference=await styling(p);
   await p.locator('#wikiCycleChronology').screenshot({path:path.join(root,`validation/cycle-v0831/reference-${width}.png`)});
   for(const code of ['00209','00321','00226'])for(const file of ['index.html','knowledge.html']){
    const d=require(`../data/patient-knowledge/${code}.json`);await p.goto(server.url+`/patient/${code}/${file}`,{waitUntil:'networkidle'});
    assert.equal(await p.locator('.wiki-cycle-day').count(),d.cycle_days);assert.equal(await p.locator('input,select').count(),0);
    assert.deepEqual(await styling(p),reference,`${code}/${file} styles must match 00568 at ${width}px`);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No document-width overflow');
    await p.locator('#wikiCycleChronology').screenshot({path:path.join(root,`validation/cycle-v0831/${code}-${file.replace('.html','')}-${width}.png`)});
    report.push({code,file,width,referenceStylesMatch:true,days:d.cycle_days,inputs:0});
   }
   await context.close();
  }
  const context=await browser.newContext({javaScriptEnabled:false}),p=await context.newPage();
  for(const code of ['00209','00321','00226'])for(const file of ['index.html','knowledge.html']){
   await p.goto(server.url+`/patient/${code}/${file}`);assert(await p.locator('#wikiCycleChronology').isVisible());assert.equal(await p.locator('input,select').count(),0);
  }
  await context.close();fs.writeFileSync(path.join(root,'validation/cycle-chronology-v0831.json'),JSON.stringify({comparisons:report,allSixPagesWorkWithoutJavaScript:true},null,2)+'\n');
  console.log('12 desktop/mobile visual-style comparisons passed; all six pages show complete graphs without JavaScript or patient input.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
