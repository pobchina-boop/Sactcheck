'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm');
const H=__dirname,R=path.resolve(H,'../../..'),integrated=process.argv.includes('--integrated');
const E=require(path.join(R,'js/assessment-engine')),D=require(path.join(R,'js/protocol-dose-schedule')),V=require(path.join(R,'js/protocol-validator'));
const paths={'00203':'protocols/breast/00203-docetaxel-75-21-day.json','00222':'protocols/lung/00222-pemetrexed-monotherapy.json'};
const P=Object.fromEntries(Object.entries(paths).map(([c,p])=>[c,JSON.parse(fs.readFileSync(integrated?path.join(R,p):path.join(H,'proposed',path.basename(p))))]));
const A=JSON.parse(fs.readFileSync(path.join(H,'authoring.json'))).regimens,rows=[];
const clinical=r=>r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));
const has=(id,t)=>r=>assert(clinical(r).some(f=>f.ruleId===id&&(!t||f.actionType===t)),`Missing ${id}/${t}: ${clinical(r).map(f=>f.ruleId)}`);
const absent=(...ids)=>r=>assert(!clinical(r).some(f=>ids.includes(f.ruleId)),`Unexpected ${ids}: ${clinical(r).map(f=>f.ruleId)}`);
function run(c,name,input,check){const row={code:c,name,input,source:P[c].metadata.source_url};try{const r=E.assess(P[c],input),m=D.buildModificationModel(P[c],r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);check(r,m);row.pass=true;row.actual={action:r.actionType,findings:clinical(r).map(f=>({id:f.ruleId,action:f.actionType}))};}catch(e){row.pass=false;row.error=e.message;}rows.push(row);}
function shape(c,name,fn){try{fn();rows.push({code:c,name,pass:true});}catch(e){rows.push({code:c,name,pass:false,error:e.message});}}
const L=(n,i,f)=>run('00203',n,i,f);
// Previously audited exact NCCP docetaxel count, hepatic and toxicity boundaries.
vm.runInNewContext(fs.readFileSync(path.join(H,'docetaxel-boundaries.cjs'),'utf8'),{L,has,absent,assert,clinical});
for(const c of Object.keys(P)){
 run(c,'Blank assessment cannot clear treatment',{},r=>assert.equal(r.actionType,'incomplete'));
 for(const k of Object.keys(P[c].input_definitions))for(const v of ['',null])run(c,`${k}: absent ${v}`,{[k]:v},r=>{assert.equal(clinical(r).length,0);assert.notEqual(r.actionType,'proceed');});
 shape(c,'Schema and explicit unknown demonstrations',()=>{assert(V.validate(P[c],{strict:true}).valid);for(const inp of Object.values(P[c].input_definitions)){assert.equal(inp.demo_value,'');assert.equal(inp.required,false);}});
 shape(c,'Provenance refreshed and clinical approval still pending',()=>{assert.equal(P[c].metadata.source_checked_date,'2026-11-02');assert.equal(P[c].metadata.source_document_pages,5);assert(/^[a-f0-9]{64}$/.test(P[c].metadata.source_pdf_sha256));assert.equal(P[c].metadata.encoding_maturity.clinical_use_authorised,false);});
 shape(c,'Summary monitoring and source-labelled plan',()=>{const x=c==='00203'?A[c].patient_contexts.lung:A[c],s=x.patient.patient_summary;assert(s.purpose&&s.schedule&&s.preparation.length&&s.phases.length);assert.equal(s.monitoring.filter(x=>x.basis==='Required by regimen').length,2);assert(s.monitoring.some(x=>/Tumour markers/.test(x.test)&&x.basis==='If clinically indicated'));assert(s.monitoring.some(x=>x.stage==='After treatment'&&x.basis==='Team-agreed plan'));assert(s.cycle_expectations.length>=2);assert(x.patient.evidence.metrics.length===0);assert(x.patient.day_groups.every(x=>x.start<=x.end));for(let day=1;day<=21;day++)assert.equal(x.patient.day_groups.filter(x=>x.start<=day&&x.end>=day).length,1);});
}
for(const [c,f,id,action]of [['00203','new_or_worsening_pulmonary_symptoms','DOC_PULMONARY_HOLD','withhold'],['00203','suspected_serious_bowel_toxicity','DOC_BOWEL_URGENT_REVIEW','withhold'],['00203','suspected_severe_cutaneous_reaction','DOC_SCAR_URGENT_REVIEW','withhold'],['00222','concomitant_yellow_fever_vaccine','PEME_YELLOW_FEVER_VACCINE','contraindicated'],['00222','other_live_vaccine_planned','PEME_LIVE_VACCINE_REVIEW','consultant_review']]){
 for(const v of [true,false])run(c,`${f} ${v}`,{[f]:v},v?has(id,action):absent(id));
}
for(const f of ['new_or_worsening_pulmonary_symptoms','suspected_serious_bowel_toxicity','suspected_severe_cutaneous_reaction'])L('Urgent concern prevents automatic 60 mg/m2 dose '+f,{[f]:true,skin_grade:3,current_docetaxel_mg_m2:75},(r,m)=>{assert.equal(r.actionType,'withhold');assert(m.rows.every(x=>x.protocolDose==='No dose now'));});
L('Source skin-grade row is distinct from suspected SCAR',{skin_grade:3,current_docetaxel_mg_m2:75,suspected_severe_cutaneous_reaction:false},r=>{has('DOC_SKIN_75')(r);absent('DOC_SCAR_URGENT_REVIEW')(r);});
run('00222','Concomitant yellow fever contraindication survives adequate counts',{concomitant_yellow_fever_vaccine:true,anc_x10e9_l:2,platelets_x10e9_l:200},has('PEME_YELLOW_FEVER_VACCINE','contraindicated'));
run('00222','Other live vaccine is review not automatic contraindication',{other_live_vaccine_planned:true,concomitant_yellow_fever_vaccine:false},r=>{has('PEME_LIVE_VACCINE_REVIEW')(r);absent('PEME_YELLOW_FEVER_VACCINE')(r);assert.notEqual(r.actionType,'contraindicated');});
for(const inp of [{anc_x10e9_l:1.2},{platelets_x10e9_l:80}])run('00222','Borderline NCCP counts expose SmPC difference',inp,r=>assert(clinical(r).some(x=>/SmPC/.test(JSON.stringify(x)))));
shape('00203','Lung context preserves breast bundle and caps source course at six',()=>{assert.equal(A['00203'].preserve_canonical_patient_content,true);assert(A['00203'].patient_contexts.lung);assert.equal(A['00203'].patient_contexts.lung.patient.patient_summary.card_cycle_count,6);assert(/up to six/i.test(A['00203'].patient_contexts.lung.patient.patient_summary.schedule));assert.equal(A['00203'].patient_contexts.lung.support_plans[0].medicines.filter(x=>/dexamethasone/i.test(x.name)).length,1);});
shape('00222','Indefinite monotherapy uses rolling cycle record',()=>{assert.equal(A['00222'].patient.patient_summary.card_cycle_count,null);assert(/no preset/.test(A['00222'].patient.patient_summary.schedule));assert.equal(A['00222'].patient.agents.length,1);});
// Existing pemetrexed rules get their full 131 source-boundary and service regression.
require('./pemetrexed-regression.cjs');
const legacy=JSON.parse(fs.readFileSync(path.join(H,integrated?'pemetrexed-regression-integrated.json':'pemetrexed-regression-proposed.json')));
rows.push(...legacy.cases.map(x=>({...x,code:'00222',suite:'retained source-boundary regression'})));
const failed=rows.filter(x=>!x.pass),report={release:'0.84.29',date:'2026-11-02',mode:integrated?'integrated':'proposed',total:rows.length,passed:rows.length-failed.length,failed:failed.length,clinical_use_authorised:false,cases:rows};
fs.writeFileSync(path.join(H,integrated?'integrated-results.json':'source-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:failed},null,2));if(failed.length)process.exitCode=1;
