'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
(async()=>{const root=path.resolve(__dirname,'..'),server=await require('./local-site-server.cjs').serve(root);const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});const evidence=[];
try{const page=await b.newPage({viewport:{width:733,height:1062}});for(const code of require('../js/patient-asset-registry-v0810').codes){if(code==='00568')continue;
const htmlPath=path.join(root,'patient',code,'guide.html');
await page.goto(server.url+`/patient/${code}/guide.html`,{waitUntil:'networkidle'});await page.emulateMedia({media:'print'});await page.evaluate(()=>document.fonts.ready);
const result=await page.evaluate(()=>{
 const identity=document.querySelector('.identity').getBoundingClientRect(),anatomy=document.querySelector('.regimen-anatomy').getBoundingClientRect();
 if(anatomy.top<identity.bottom)throw Error('identity/anatomy overlap');
 const section=document.querySelector('.page-two'),last=section.lastElementChild;
 if(last.getBoundingClientRect().bottom>section.getBoundingClientRect().bottom-20)throw Error('Page two overflow');
 // Store connectors in the document from actual print geometry; no guessing column proportions.
 const stage=document.querySelector('.hcc-visual-stage'),svg=stage.querySelector('.hcc-static-connectors'),bounds=stage.getBoundingClientRect();
 svg.setAttribute('viewBox','0 0 100 100');svg.replaceChildren();
 for(const card of stage.querySelectorAll('[data-hcc-target]')){const pin=stage.querySelector(`[data-hcc-pin="${card.dataset.hccTarget}"]`);if(!pin)throw Error('Missing anatomy pin');const a=card.getBoundingClientRect(),p=pin.getBoundingClientRect(),line=document.createElementNS('http://www.w3.org/2000/svg','line');
 for(const [k,v] of Object.entries({x1:((card.classList.contains('left')?a.right:a.left)-bounds.left)/bounds.width*100,y1:((a.top+a.bottom)/2-bounds.top)/bounds.height*100,x2:((p.left+p.right)/2-bounds.left)/bounds.width*100,y2:((p.top+p.bottom)/2-bounds.top)/bounds.height*100}))line.setAttribute(k,v.toFixed(3));line.setAttribute('class',card.classList.contains('bev')?'chemo':'immune');svg.appendChild(line);}
 return {gap:anatomy.top-identity.bottom,svg:svg.outerHTML};
});
let html=fs.readFileSync(htmlPath,'utf8').replace(/<svg[^>]*class="hcc-static-connectors"[\s\S]*?<\/svg>/,result.svg);fs.writeFileSync(htmlPath,html);fs.writeFileSync(path.join(root,'docs/patient',code,'guide.html'),html);
const file=path.join(root,'patient',code,'guide.pdf');await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true});fs.copyFileSync(file,path.join(root,'docs/patient',code,'guide.pdf'));evidence.push({code,identityAnatomyGap:result.gap});console.log(code);
}fs.mkdirSync(path.join(root,'validation'),{recursive:true});fs.writeFileSync(path.join(root,'validation/guide-layout-v0818.json'),JSON.stringify(evidence,null,2));}finally{await b.close();await server.close();}})().catch(e=>{console.error(e);process.exit(1)});
