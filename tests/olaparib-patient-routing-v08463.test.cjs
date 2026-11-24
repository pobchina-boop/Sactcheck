'use strict';
// Patient routing is a safety boundary: a shared code must never silently
// choose the breast or first-line ovarian instructions for another setting.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..');
const registryFile=path.join(root,'js/patient-asset-registry-v0810.js');
const registrySource=fs.readFileSync(registryFile,'utf8');
function registry(group=''){
 const opened=[];
 const sandbox={module:{exports:{}},URL,location:{href:'https://example.test/review/index.html'},SACTCheckProtocolContext:{activeTumourGroup:()=>group},open:url=>{opened.push(url);return{};}};
 vm.runInNewContext(registrySource,sandbox,{filename:registryFile});
 return {api:sandbox.module.exports,opened};
}
const {api:A}=registry();
const assets={portal:'',knowledge:'knowledge.html',guide:'guide.pdf',passport:'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','consent-pdf':'consent-form.pdf','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf','support-treatment':'support-treatment.html','support-treatment-pdf':'support-treatment.pdf',longitudinal:'treatment-journey.html',handbook:'handbook.pdf'};
const routes={breast:'00588',prostate:'00588/prostate',ovarian_first_line:'00588/ovarian_first_line',ovarian_relapsed:'00588/ovarian_relapsed',pancreatic:'00588/pancreatic'};
const protocol={metadata:{nccp_regimen_code:'00588',tumour_group:'Gynaecology'},indications:[{indication_id:'first_line_advanced_ovarian_maintenance'}]};
assert.deepEqual(Array.from(A.bundleRoutes('00588')),Object.values(routes));
assert.deepEqual(Array.from(A.bundleRoutes('00746')),['00746']);
assert.equal(A.hasDedicated('00746'),true);
for(const [context,route]of Object.entries(routes)){
 for(const [asset,file]of Object.entries(assets)){
  const expected='patient/'+route+'/'+file;
  assert.equal(A.relativePath('00588',asset,context),expected,context+'/'+asset);
  assert.equal(A.relativePath({...protocol,patient_context:context},asset),expected);
  assert.equal(A.publicUrl('00588',asset,context),'https://sactcheck.com/'+expected);
  assert.equal(A.compatibilityUrl('00588',asset,context),'https://sactcheck.com/'+expected);
  assert.equal(A.runtimeUrl('00588',asset,context),'https://example.test/review/'+expected);
 }
}
for(const unknown of ['', 'all','gynaecology','gynecology','ovarian','00588-gyn','combination_00746','00746','breast/../prostate','constructor']){
 for(const asset of Object.keys(assets)){
  assert.equal(A.relativePath(protocol,asset,unknown),'patient/00588/scope.html?asset='+encodeURIComponent(asset),'Unknown context must preserve an asset selection');
 }
}
// Do not use metadata or the first item of the shared protocol as a selection.
assert.equal(A.contextFor(protocol),'');
assert.equal(A.contextFor({...protocol,selected_indication:{indication_id:'00588-gyn',code:'00588a'}}),'');
const activeGroups={Breast:'breast',GU:'prostate',Genitourinary:'prostate',GI:'pancreatic',Gastrointestinal:'pancreatic'};
for(const [group,context]of Object.entries(activeGroups)){
 const {api:R}=registry(group);
 assert.equal(R.relativePath(protocol,'guide'),'patient/'+routes[context]+'/guide.pdf');
 assert.equal(R.relativePath(protocol,'guide','gynaecology'),'patient/00588/scope.html?asset=guide','An unknown explicit choice must not fall back to '+group);
}
for(const group of ['Gynaecology','Gynecology','All','Ovarian'])assert.equal(registry(group).api.relativePath(protocol,'guide'),'patient/00588/scope.html?asset=guide');
assert.equal(registry('Breast').api.relativePath(protocol,'guide','prostate'),'patient/00588/prostate/guide.pdf');
const indications={first_line_advanced_ovarian_maintenance:'ovarian_first_line',platinum_sensitive_relapsed_ovarian_maintenance:'ovarian_relapsed',mcrpc_brca_monotherapy:'prostate',adjuvant_high_risk_early_breast:'breast',pancreatic_maintenance:'pancreatic','00588-gu':'prostate','00588-gi':'pancreatic'};
for(const [indication,context]of Object.entries(indications)){
 for(const field of ['selected_indication_id','indication_id','selected_indication']){
  assert.equal(A.relativePath({...protocol,[field]:indication},'consent-draft'),'patient/'+routes[context]+'/consent-form.html');
 }
 assert.equal(A.relativePath({...protocol,selected_indication:{indication_id:indication}},'handbook'),'patient/'+routes[context]+'/handbook.pdf');
}
const letters={a:'ovarian_first_line',b:'ovarian_first_line',c:'ovarian_first_line',d:'ovarian_relapsed',e:'ovarian_relapsed',f:'ovarian_relapsed',g:'prostate',h:'breast',i:'pancreatic'};
for(const [letter,context]of Object.entries(letters)){
 const expected='patient/'+routes[context]+'/guide.pdf';
 assert.equal(A.relativePath('00588'+letter,'guide'),expected);
 assert.equal(A.relativePath(protocol,'guide',letter),expected);
 assert.equal(A.relativePath({...protocol,reimbursement_code:'00588'+letter},'guide'),expected);
}
for(const [asset,file]of Object.entries(assets)){
 for(const staleContext of ['',...Object.keys(routes),'00588-gyn']){
  assert.equal(A.relativePath({metadata:{nccp_regimen_code:'00746'},patient_context:staleContext},asset),'patient/00746/'+file,'Combination must retain its own '+asset);
 }
}
for(const code of ['00588','00746'])for(const asset of ['../guide.pdf','toString','__proto__','video','unknown'])assert.equal(A.relativePath(code,asset,'breast'),null);
for(const [method,file]of [['publicPortalUrl',''],['guideUrl','guide.pdf'],['passportUrl','passport.pdf'],['sactCardUrl','sactcard.pdf']])assert.equal(A[method]('00588','pancreatic'),'https://sactcheck.com/patient/00588/pancreatic/'+file);
const opener=registry('Breast');
for(const method of ['openPortal','openGuide','openPassport','openSactCard'])opener.api[method]('00588','ovarian_relapsed');
assert.deepEqual(opener.opened,['','guide.pdf','passport.pdf','sactcard.pdf'].map(f=>'https://example.test/review/patient/00588/ovarian_relapsed/'+f));
// Existing shared-code rules stay in force.
assert.equal(A.relativePath('00203','guide','prostate'),'patient/00203/prostate/guide.pdf');
assert.equal(A.relativePath('00203','guide','breast'),'patient/00203/guide.pdf');
assert.equal(A.relativePath('00325','guide','sarcoma'),'patient/00325/gist/guide.pdf');
assert.equal(A.relativePath('00455','guide','melanoma_adjuvant'),'patient/00455/melanoma_adjuvant/guide.pdf');
assert.equal(A.relativePath('00353','guide'),'patient/00353/guide.pdf');

const builder=require('../tools/targeted-patient-suite-v0849.cjs');
const profile=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge/00588.json')));
const scope=builder.renderOlaparibScope(profile);
assert.match(scope,/<title>Choose the olaparib treatment context · Olaparib \(Lynparza\): select your treatment setting/);
assert(!scope.includes('remain pending'));
assert.match(scope,/separate combination regimen/);
assert.match(scope,/00588a–c/);assert.match(scope,/00588d–f/);assert.match(scope,/00588h/);assert.match(scope,/00588g/);assert.match(scope,/00588i/);assert.match(scope,/NCCP 00746/);
const scopeLinks=[...scope.matchAll(/<a data-context="([^"]+)" data-route="([^"]+)" href="([^"]+)">/g)].map(m=>({context:m[1],route:m[2],href:m[3]}));
assert.equal(scopeLinks.length,6);
const selectorSource=fs.readFileSync(path.join(root,'assets/patient/context-selector-v08425.js'),'utf8');
function runSelector(asset,links=scopeLinks,pathname='/review/patient/00588/scope.html'){
 const nodes=links.map(link=>({dataset:{context:link.context,route:link.route},attributes:{href:link.href},setAttribute(name,value){this.attributes[name]=value;},removeAttribute(name){delete this.attributes[name];}}));
 vm.runInNewContext(selectorSource,{URLSearchParams,window:{location:{pathname,search:'?asset='+encodeURIComponent(asset)}},document:{querySelectorAll:selector=>{assert.equal(selector,'[data-context]');return nodes;}}});
 return nodes;
}
for(const [asset,file]of Object.entries(assets)){
 for(const node of runSelector(asset))assert.equal(node.attributes.href,node.dataset.route+file);
}
for(const asset of ['../../outside','constructor','__proto__'])for(const node of runSelector(asset))assert.equal(node.attributes.href,node.dataset.route);
const tampered=runSelector('guide',[{context:'unreviewed',route:'./',href:'./'},{context:'ovarian_first_line',route:'./',href:'./'},{context:'prostate',route:'https://example.test/',href:'https://example.test/'}]);
for(const node of tampered){assert.equal(node.attributes.href,undefined);assert.equal(node.attributes['aria-disabled'],'true');}
assert.equal(runSelector('guide',[{context:'head_neck',route:'head_neck/',href:''}],'/patient/00455/scope.html')[0].attributes.href,'head_neck/guide.pdf');
const generated={};const previousContext=process.env.SACT_SUITE_CONTEXT;
try{
 delete process.env.SACT_SUITE_CONTEXT;
 builder.buildSuite(profile,{anatomy:()=>'',write:(file,html)=>{generated[file]=html;}});
 assert(generated['patient/00588/scope.html']);
 assert(generated['patient/00588/sactcard.html'].includes('https://sactcheck.com/patient/00588/knowledge.html'));
 assert(generated['docs/patient/00588/guide.html'].includes('rel="canonical" href="https://sactcheck.com/patient/00588/guide.pdf"'));
 const nested=[];
 process.env.SACT_SUITE_CONTEXT='prostate';
 builder.buildSuite(profile,{anatomy:()=>'',write:file=>nested.push(file)});
 assert(!nested.some(file=>file.endsWith('/scope.html')),'Nested builds must not publish a second context selector');
}finally{if(previousContext===undefined)delete process.env.SACT_SUITE_CONTEXT;else process.env.SACT_SUITE_CONTEXT=previousContext;}

// Exercise the production context adapter with only its publication and
// journey-rendering dependencies isolated. Phase plans are read from disk.
const contextFile=path.join(root,'tools/patient-suite-context-v08425.cjs');
const contextSource=fs.readFileSync(contextFile,'utf8'),contextRequire=createRequire(contextFile);
function buildContext(context,codes='00588',missingPlan=false){
 const scopedFs={...fs,readFileSync(file,...args){
  if(/data\/patient-knowledge(?:-contexts)?\//.test(String(file)))return JSON.stringify({code:'00588',suite_release:'0.84.63'});
  const bytes=fs.readFileSync(file,...args);
  if(missingPlan&&String(file).endsWith('data/phase-support-contexts-v08463.json')){
   const d=JSON.parse(bytes);delete d.regimens['00588'][context];return JSON.stringify(d);
  }
  return bytes;
 }};
 const sandbox={module:{exports:{}},__dirname:path.dirname(contextFile),process:{env:{SACT_SUITE_CONTEXT:context,SACT_SUITE_CODES:codes}},require:id=>{
  if(id==='node:fs')return scopedFs;
  if(id==='./patient-publication-v08444.cjs')return {decorateGenerated:(_file,html)=>html};
  if(id==='./patient-visual-standard-v08443.cjs')return {};
  if(id==='../js/treatment-journey-v0837.js')return {definitions:Object.fromEntries(codes.split(',').map(code=>[code+':'+context,{context}]))};
  return contextRequire(id);
 }};
 vm.runInNewContext(contextSource,sandbox,{filename:contextFile});
 return sandbox.module.exports;
}
const phaseContexts=JSON.parse(fs.readFileSync(path.join(root,'data/phase-support-contexts-v08463.json'))).regimens['00588'];
for(const context of ['prostate','ovarian_first_line','ovarian_relapsed','pancreatic']){
 const C=buildContext(context);
 assert.equal(C.profilePath('00588'),'data/patient-knowledge-contexts/00588/'+context+'.json');
 assert.equal(C.readPath('data/patient-knowledge/00588.json'),C.profilePath('00588'));
 const transformed=C.output('patient/00588/sactcard.html','<a href="../../">Home</a><img src="../../assets/a.png"><p>https://sactcheck.com/patient/00588/knowledge.html</p><a href="handbook.pdf">Handbook</a>');
 assert.equal(transformed.file,'patient/00588/'+context+'/sactcard.html');
 assert(transformed.html.includes('href="../../../"'));assert(transformed.html.includes('src="../../../assets/a.png"'));
 assert(transformed.html.includes('https://sactcheck.com/patient/00588/'+context+'/knowledge.html'));
 assert(transformed.html.includes('href="handbook.pdf"'));
 const docs=C.output('docs/patient/00588/guide.html',generated['docs/patient/00588/guide.html']);
 assert.equal(docs.file,'docs/patient/00588/'+context+'/guide.html');
 assert(docs.html.includes('url=../../../../patient/00588/'+context+'/guide.pdf'));
 assert(docs.html.includes('href="https://sactcheck.com/patient/00588/'+context+'/guide.pdf"'));
 assert.deepEqual(JSON.parse(JSON.stringify(C.phases({regimens:{'00588':['wrong breast plan']}}).regimens['00588'])),phaseContexts[context]);
 assert.throws(()=>buildContext(context,'00588',true).phases({regimens:{'00588':['wrong breast plan']}}),/Missing reviewed olaparib support context/);
 assert.throws(()=>C.output('patient/00746/index.html',''),/escaped selected codes|Olaparib monotherapy profile escaped00588/);
}
for(const context of ['ovarian_first_line','ovarian_relapsed','pancreatic']){
 for(const codes of ['00746','00588,00746','00353','00588,00353'])assert.throws(()=>buildContext(context,codes),/Olaparib monotherapy context escaped00588/);
 assert.throws(()=>buildContext(context,''),/requires an explicit SACT_SUITE_CODES/);
 assert.throws(()=>buildContext(context).profilePath('00746'),/Olaparib monotherapy profile escaped00588/);
}
assert.throws(()=>buildContext('gynaecology'),/Unsupported patient suite context/);
assert.equal(buildContext('prostate','00203').profilePath('00203'),'data/patient-knowledge-contexts/00203/prostate.json');
// Exercise the actual static fallback script, including retained context URLs.
const fallbackScript=fs.readFileSync(path.join(root,'404.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function fallbackRedirect(pathname){
 let target=null;
 vm.runInNewContext(fallbackScript,{location:{pathname,replace:value=>{target=value;}}});
 return target;
}
for(const [input,output]of [
 ['/docs/patient/00746/','/patient/00746/'],
 ['/docs/patient/00746/guide.html','/patient/00746/guide.pdf'],
 ['/patient/00746','/patient/00746/'],
 ['/docs/patient/00588/','/patient/00588/'],
 ['/docs/patient/00244/gist/guide.html','/patient/00244/gist/guide.pdf']
])assert.equal(fallbackRedirect(input),output,input+' retains its intended treatment route');
for(const context of ['prostate','ovarian_first_line','ovarian_relapsed','pancreatic']){
 assert.equal(fallbackRedirect('/docs/patient/00588/'+context+'/'),'/patient/00588/'+context+'/');
 assert.equal(fallbackRedirect('/docs/patient/00588/'+context+'/guide.html'),'/patient/00588/'+context+'/guide.pdf');
 assert.equal(fallbackRedirect('/patient/00588/'+context),'/patient/00588/'+context+'/');
}
for(const bad of ['/docs/patient/00588/gynaecology/','/docs/patient/00746/prostate/','/patient/99999'])assert.equal(fallbackRedirect(bad),null,'Unknown context is not silently redirected: '+bad);
console.log('Olaparib routing: six canonical suites, every supported asset, explicit indication mapping, ambiguous-context guards, separate combination and context-build isolation passed.');
