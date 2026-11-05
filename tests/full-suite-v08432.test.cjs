'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const scope=json('validation/colorectal-v08432/scope.json'),idx=json('protocols/index.json').protocols,codes=[...scope.new_codes,...scope.retrospective_codes];
const E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule'),Registry=require('../js/patient-asset-registry-v0810'),Evidence=require('../js/treatment-evidence-v08413');
const kb=json('data/regimen-knowledge-base-v08432-addendum.json').regimen_profiles,proto=c=>json(idx.find(x=>x.path.includes('/'+c+'-')).path);
assert.equal(Registry.codes.length,170);assert.equal(codes.length,10);assert.equal(kb.length,10);
const expectedDays={'00660':14,'00421':7,'00427':56,'00428':7,'00486':56};
for(const c of codes){
 const p=proto(c),d=json('data/patient-knowledge/'+c+'.json'),k=kb.find(x=>x.protocol_id===p.protocol_id);
 assert.equal(p.metadata.source_checked_date,'2026-11-04');assert.match(p.metadata.source_pdf_sha256,/^[0-9a-f]{64}$/);
 for(const flag of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[flag],false);
 assert.equal(E.assess(p,{}).complete,false);assert(!['proceed','proceed_with_caution'].includes(E.assess(p,{}).actionType));
 assert(D.buildModel(p).phases.length);assert(k.treatment_rationale.line);assert(!/undefined|\[object Object\]/.test(Evidence.render(k)));
 if(scope.new_codes.includes(c)){assert.equal(D.buildModel(p).phases[0].cycleLength,expectedDays[c]);for(const f of ['trial','population','comparison','checked'])assert(k.evidence_at_a_glance[f],c+' evidence '+f);assert(!Evidence.render(k).includes('<strong></strong>'));}
 const guide=read(`patient/${c}/guide.html`),card=read(`patient/${c}/sactcard.html`),portal=read(`patient/${c}/index.html`),wiki=read(`patient/${c}/knowledge.html`);
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert.equal((portal.match(/data-patient-panel/g)||[]).length,5);
 assert.equal((guide.match(/data-hcc-target=/g)||[]).length,d.anatomy.length);assert(guide.includes('Full-body anatomical illustration'));assert(guide.includes('hcc-static-connectors'));
 for(const t of ['pt-document-identity','Your personal plan','4 November 2026']){assert(guide.includes(t));assert(wiki.includes(t));}
 for(const t of ['FRONT / CONTACTS','BACK / TREATMENT RECORD','Do not cut the centre line','100%','oncowiki-qr.png','EXAMPLE ONLY','Add to Home Screen'])assert(card.includes(t),c+' card '+t);
 for(const name of ['guide','sactcard','knowledge','handbook','consent-form','passport','logistics','supportive-care','treatment-journey']){
  const file=`patient/${c}/${name}.pdf`;assert(fs.existsSync(path.join(root,file)),file);assert(fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(root,`docs/patient/${c}/${name}.pdf`))),file+' download copy');
 }
 for(const name of fs.readdirSync(path.join(root,'patient',c)).filter(f=>f.endsWith('.html'))){
  const h=read(`patient/${c}/${name}`);assert(!/undefined|\[object Object\]|typical null-day/.test(h),c+'/'+name);
  for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',c,m[1].split(/[?#]/)[0])),c+'/'+name+': '+m[1]);}
 }
}
const bevSummary=JSON.stringify(json('data/patient-knowledge/00623.json').patient_summary.monitoring);
for(const term of ['Blood pressure / urine protein','after treatment','regular urine dipstick','Heart assessment / ECHO','chest-wall radiation'])assert(bevSummary.includes(term),'00623 summary monitoring: '+term);
const p=proto('00660'),inp={stomatitis_current_grade:1,stomatitis_highest_grade:3};
let rows=D.buildModificationModel(p,E.assess(p,inp)).rows;assert.equal(rows.length,2);for(const r of rows)assert.match(r.protocolDose,/Confirm the current component dose level/);
rows=D.buildModificationModel(p,E.assess(p,{...inp,current_fluorouracil_bolus_level:-1,current_fluorouracil_infusion_level:0})).rows;
assert.equal(rows.find(x=>x.componentId==='5fu_bolus').protocolDose,'240 mg/m²');assert.equal(rows.find(x=>x.componentId==='5fu_infusion').protocolDose,'2000 mg/m²');
rows=D.buildModificationModel(p,E.assess(p,{...inp,stomatitis_highest_grade:4,current_fluorouracil_bolus_level:-1,current_fluorouracil_infusion_level:-1})).rows;for(const r of rows)assert.equal(r.protocolDose,'discontinue');

for(const c of ['00209','00321','00227']){
 const p=proto(c),input={diarrhoea_current_grade:0,diarrhoea_highest_grade:3};
 const missing=D.buildModificationModel(p,E.assess(p,input)).rows;
 assert(missing.length);for(const r of missing.filter(x=>x.ruleId.includes('DIARRHOEA')))assert.match(r.protocolDose,/Confirm the current component dose level/);
 for(const key of Object.keys(p.input_definitions).filter(k=>/^current_.*_dose_level$/.test(k)))input[key]=-1;
 const adjusted=D.buildModificationModel(p,E.assess(p,input)).rows.filter(x=>x.ruleId.includes('DIARRHOEA'));
 for(const r of adjusted)assert.equal(r.actionLabel,'Dose level -2');
}
const anatomy={};vm.runInNewContext(read('js/patient-anatomy-data-v08431.js'),anatomy);for(const c of codes)assert.deepEqual(JSON.parse(JSON.stringify(anatomy.SACTCheckAnatomyData[c].anatomy)),json(`data/patient-knowledge/${c}.json`).anatomy);
const x={fetch:async()=>({ok:true,json:async()=>json('data/emetogenic-risk-map.json')}),console};vm.runInNewContext(read('js/emetogenic-risk.js'),x);
(async()=>{await x.SACTCheckEmetogenicRisk.load();const r=x.SACTCheckEmetogenicRisk;assert.equal(r.get(proto('00486'),{}).scriptId,null);for(const n of [1,8,15,22,29,36])assert.equal(r.get(proto('00486'),{treatmentDay:String(n)}).level,[1,15,29].includes(n)?'moderate':'low');for(const c of ['00660','00421','00427','00428'])assert.equal(r.get(proto(c),{}).level,'low');
const coverage=json('validation/colorectal-v08432/coverage.json');assert.equal(coverage.completed_colorectal_context_suites,26);assert.equal(coverage.remaining.length,15);
console.log('v0.84.32: ten integrated suites, anatomical content, printable assets, dose-history safeguards and day-specific FLOX supportive care verified.');})().catch(e=>{console.error(e);process.exitCode=1});
