'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const scope=json('validation/lung-backbones-v08428/scope.json'),idx=json('data/lung-backbones-v08428-source-index.json'),kb=json('data/regimen-knowledge-base-v08428-addendum.json'),protocols=json('protocols/index.json').protocols;
const Engine=require('../js/assessment-engine'),Registry=require('../js/patient-asset-registry-v0810'),Journey=require('../js/treatment-journey-v0837'),Dose=require('../js/protocol-dose-schedule'),Evidence=require('../js/treatment-evidence-v08413');
assert.equal(scope.new_codes.length,5);assert.equal(scope.retrospective_codes.length,5);assert.equal(idx.codes.length,10);assert.equal(kb.regimen_profiles.length,10);assert.equal(Registry.codes.length,174);assert(Registry.codes.includes('00244'),'Audited v34 regorafenib accounts for the added patient registry entry');
for(const code of idx.codes){
 const p=json(protocols.find(r=>r.path.includes('/'+code+'-')).path),k=kb.regimen_profiles.find(k=>k.protocol_id===p.protocol_id);
 assert.equal(p.metadata.sactcheck_encoding_version,'0.84.28');assert.equal(p.metadata.full_suite_release,'0.84.28');
 for(const flag of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[flag],false);
 const r=Engine.assess(p,{});assert.equal(r.complete,false);assert(!['proceed','proceed_with_caution'].includes(r.actionType));
 assert.equal(new Set(p.rule_engine.rules.map(r=>r.rule_id||r.id)).size,p.rule_engine.rules.length);
 assert(Dose.buildModel(p).phases.length);assert(k.treatment_rationale.line&&k.evidence_at_a_glance.sources.length);assert(!/undefined|\[object Object\]/.test(Evidence.render(k)));
}
const routes=idx.codes.filter(c=>c!=='00621').concat(['00621/lung','00568']);
for(const route of routes){
 const d=json(route.includes('/')?`data/patient-knowledge-contexts/${route}.json`:`data/patient-knowledge/${route}.json`),html=read(`patient/${route}/index.html`),guide=read(`patient/${route}/guide.html`);
 assert(d.patient_summary.phases.length>=2);assert.equal(d.evidence.metrics.length,0);assert(Journey.definitions[route.replace('/',':')]);
 if(require('../data/patient-presentation-v08431.json').routes[route]){
  assert.equal((html.match(/data-patient-panel/g)||[]).length,5);assert(html.includes('knowledge.html#cycle'));assert(html.includes('handbook.pdf'));assert(guide.includes('hcc-static-connectors'));assert(guide.includes('oncowiki-qr.png'));assert.equal((guide.match(/class="pt-page /g)||[]).length,3);
 }else{
 assert.equal((html.match(/<details id="(?:side-effects|cycle|tools)"/g)||[]).length,3);
 assert(!/<details[^>]*\bopen\b/.test(html));assert(html.indexOf('id="urgent"')<html.indexOf('<details'));
 for(const id of ['urgent','side-effects','cycle','tools','medicines','monitoring-schedule','treatment-logistics'])assert(html.includes(`id="${id}"`));
 for(const text of ['Call 112 / 999','37.5°C','36°C','even with a normal temperature','Evening / weekend number','explain back','guide.pdf'])assert(html.includes(text),route+'/'+text);
 for(const text of ['My SACT card','ps-map','qr.png','Oncology phone','Out of hours'])assert(guide.includes(text),route+'/'+text);
 }
 assert(!/undefined|\[object Object\]|<input|<select/.test(html));
 for(const file of fs.readdirSync(`${root}/patient/${route}`).filter(n=>n.endsWith('.html'))){
  const text=read(`patient/${route}/${file}`);
  for(const m of text.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',route,m[1].split(/[?#]/)[0])),route+'/'+file+': '+m[1]);}
 }
}
assert.equal(json('data/patient-knowledge/00621.json').suite_release,'0.84.21');assert(json('data/breast-library-contexts-v0837.json').regimens['00621']);assert.equal(Registry.relativePath('00621','knowledge','lung'),'patient/00621/lung/knowledge.html');
assert.equal(Registry.relativePath('00310','knowledge'),'patient/00310/scope.html?asset=knowledge');
for(const slug of ['backbone_00304','backbone_00310','backbone_00318']){
 const d=json(`data/patient-knowledge-contexts/00849/${slug}.json`);assert(JSON.stringify(d).includes('up to three planned doses'));assert(!JSON.stringify(d).includes('two planned doses'));
}
const base=json('validation/lung-backbones-v08428/baseline-hashes.json');
for(const [file,h] of Object.entries(base.files)){if(!/^(patient|docs\/patient|data\/patient-knowledge|data\/patient-knowledge-contexts)\//.test(file))continue;assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),require('./helpers/retrospective-v08428.cjs').expectedHash(file,h),file);}
const ctx={fetch:async()=>({ok:true,json:async()=>json('data/emetogenic-risk-map.json')}),console};vm.runInNewContext(read('js/emetogenic-risk.js'),ctx);
(async()=>{await ctx.SACTCheckEmetogenicRisk.load('data/emetogenic-risk-map.json');
 for(const [code,days]of Object.entries({'00281':{day1:'high',day8:'low'},'00310':{day1:'high',day8:'low'},'00339':{1:'high',8:'minimal',15:'minimal'},'00343':{1:'high',8:'high',15:'minimal',22:'minimal'}})){
  const p=json(protocols.find(r=>r.path.includes('/'+code+'-')).path),risk=ctx.SACTCheckEmetogenicRisk;
  assert.equal(risk.get(p).scriptId,null);assert.equal(risk.get(p,{treatmentDay:'unknown'}).scriptId,null);
  for(const [day,level]of Object.entries(days)){const r=risk.get(p,{treatmentDay:day});assert.equal(r.level,level,code+'/'+day);assert(r.scriptId);}
 }
 console.log('v0.84.28: ten source-integrated suites, eleven summary-first routes, explicit treatment-day support, guarded shared indications and preservation checks pass.');
})().catch(e=>{console.error(e);process.exitCode=1});
