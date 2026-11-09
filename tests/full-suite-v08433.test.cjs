'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const scope=json('validation/colorectal-v08433/scope.json'),idx=json('protocols/index.json').protocols,codes=[...scope.new_codes,...scope.retrospective_codes];
const E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule'),Registry=require('../js/patient-asset-registry-v0810'),Evidence=require('../js/treatment-evidence-v08413');
const kb=json('data/regimen-knowledge-base-v08433-addendum.json').regimen_profiles,proto=c=>json(idx.find(x=>x.path.includes('/'+c+'-')).path);
require('./helpers/net-suite-registration-v08437.cjs').registry(Registry.codes);assert(Registry.codes.includes('00244'),'Audited v34 regorafenib accounts for the added patient registry entry');assert.equal(codes.length,10);assert.equal(kb.length,10);
const expectedDays={'00555':14,'00783':14,'00691':14,'00238':14,'00791':14};
// One visible absolute bilirubin result supplies both source-specific representations.
// Reuse the established laboratory adapter; never change clinical rule units.
const Lab=require('../js/local-lab-profile');
for(const c of ['00783','00691','00238','00449','00448']){
 const p=proto(c),defs=p.input_definitions,ratio=defs.bilirubin_uln_multiple?'bilirubin_uln_multiple':'bilirubin_ratio_uln';
 const absolute=defs.fluorouracil_bilirubin_umol_l?'fluorouracil_bilirubin_umol_l':'bilirubin_umol_l';
 assert.equal(defs[ratio].derived_actual_field,absolute);assert.equal(defs[absolute].ui_derived_from,ratio);
 const calculation=Lab.calculate({...defs[ratio],id:ratio},{bilirubin:'90'},{...Lab.read(),bilirubinUln:20});
 assert.equal(calculation.ratio,4.5);assert.equal(calculation.highestPart.actual,90);
 assert.equal(Lab.calculate({...defs[ratio],id:ratio},{bilirubin:''}),null,'Blank must not become normal');
}
for(const c of codes){
 const p=proto(c),d=json('data/patient-knowledge/'+c+'.json'),k=kb.find(x=>x.protocol_id===p.protocol_id);
 assert.equal(p.metadata.source_checked_date,c==='00448'?'2026-11-05':'2026-11-04');if(c==='00448')assert.equal(p.metadata.clinical_audit_release,'0.84.35');assert.match(p.metadata.source_pdf_sha256,/^[0-9a-f]{64}$/);
 for(const flag of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[flag],false);
 assert.equal(E.assess(p,{}).complete,false);assert(!['proceed','proceed_with_caution'].includes(E.assess(p,{}).actionType));
 assert(D.buildModel(p).phases.length);assert(k.treatment_rationale.line);assert(!/undefined|\[object Object\]/.test(Evidence.render(k)));
 if(scope.new_codes.includes(c)){assert.equal(D.buildModel(p).phases[0].cycleLength,expectedDays[c]);for(const f of ['trial','population','comparison','checked'])assert(k.evidence_at_a_glance[f],c+' evidence '+f);assert(!Evidence.render(k).includes('<strong></strong>'));}
 const guide=read(`patient/${c}/guide.html`),card=read(`patient/${c}/sactcard.html`),portal=read(`patient/${c}/index.html`),wiki=read(`patient/${c}/knowledge.html`);
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3);require('./helpers/patient-overview-v08445.cjs').validate(portal,c);
 assert.equal((guide.match(/data-hcc-target=/g)||[]).length,d.anatomy.length);assert(guide.includes('Full-body anatomical illustration'));assert(guide.includes('hcc-static-connectors'));
 for(const t of ['pt-document-identity','Your personal plan',c==='00448'?'5 November 2026':'4 November 2026']){assert(guide.includes(t));assert(wiki.includes(t));}
 for(const t of ['FRONT / CONTACTS','BACK / TREATMENT RECORD','Do not cut the centre line','100%','oncowiki-qr.png','EXAMPLE ONLY','Add to Home Screen'])assert(card.includes(t),c+' card '+t);
 for(const name of ['guide','sactcard','knowledge','handbook','consent-form','passport','logistics','supportive-care','treatment-journey']){
  const file=`patient/${c}/${name}.pdf`;assert(fs.existsSync(path.join(root,file)),file);assert(fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(root,`docs/patient/${c}/${name}.pdf`))),file+' download copy');
 }
 for(const name of fs.readdirSync(path.join(root,'patient',c)).filter(f=>f.endsWith('.html'))){
  const h=read(`patient/${c}/${name}`);assert(!/undefined|\[object Object\]|typical null-day/.test(h),c+'/'+name);
  for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',c,m[1].split(/[?#]/)[0])),c+'/'+name+': '+m[1]);}
 }
}
assert(Evidence.render(kb.find(k=>k.protocol_id.includes('00238'))).includes('95.34% CI 0.713–0.937'));
assert.equal(new Set(json('data/regimen-knowledge-base-v08433-addendum.json').evidence_records.map(x=>x.evidence_id)).size,5);
const reconciliation=require('../js/source-reconciliation-v0700');const current783=proto('00783'),before783=JSON.stringify(current783);reconciliation.apply(current783);reconciliation.apply(current783);assert.equal(JSON.stringify(current783),before783,'Historical runtime patch must not overwrite audited protocol');
const merged=structuredClone(json('data/regimen-knowledge-base-v08433-addendum.json')),beforeKnowledge=JSON.stringify(merged.regimen_profiles.find(k=>k.protocol_id===current783.protocol_id));reconciliation.mergeKnowledgePayload(merged,json('data/regimen-knowledge-base-v0700-addendum.json'));assert.equal(JSON.stringify(merged.regimen_profiles.find(k=>k.protocol_id===current783.protocol_id)),beforeKnowledge);assert.equal(merged.evidence_records.filter(k=>k.protocol_id===current783.protocol_id).length,1);
const anatomy={};vm.runInNewContext(read('js/patient-anatomy-data-v08431.js'),anatomy);for(const c of codes)assert.deepEqual(JSON.parse(JSON.stringify(anatomy.SACTCheckAnatomyData[c].anatomy)),json(`data/patient-knowledge/${c}.json`).anatomy);
const x={fetch:async()=>({ok:true,json:async()=>json('data/emetogenic-risk-map.json')}),console};vm.runInNewContext(read('js/emetogenic-risk.js'),x);
(async()=>{await x.SACTCheckEmetogenicRisk.load();const r=x.SACTCheckEmetogenicRisk;
assert.equal(r.get(proto('00691'),{}).scriptId,null);
assert.equal(r.get(proto('00691'),{treatmentPhase:'induction'}).level,'high');
assert.equal(r.get(proto('00691'),{treatmentPhase:'chemoradiation'}).level,'oral_minimal_low');
for(const c of ['00555','00783'])assert.equal(r.get(proto(c),{}).level,'high');
assert.equal(r.get(proto('00238'),{}).level,'moderate');assert.equal(r.get(proto('00791'),{}).level,'low');
const card=read('patient/00691/sactcard.html');for(const term of ['FOLFIRINOX cycle record','six induction cycles only','Chemoradiation record'])assert(card.includes(term));
const support=json('data/phase-support-v0838.json').regimens;assert.equal(support['00691'].length,2);assert.equal(support['00691'][1].id,'chemoradiation');assert.equal(support['00691'][1].medicines.length,0);
for(const c of ['00555','00783'])assert(json('data/patient-knowledge/'+c+'.json').schedule_summary.includes('48'));
assert(json('data/patient-knowledge/00691.json').schedule_summary.includes('46'));
const coverage=json('validation/colorectal-v08433/coverage.json');assert.equal(coverage.completed_colorectal_context_suites,31);assert.equal(coverage.remaining.length,10);
console.log('v0.84.33: ten integrated suites, full anatomical content, printable assets and phase-specific supportive care verified.');})().catch(e=>{console.error(e);process.exitCode=1});
