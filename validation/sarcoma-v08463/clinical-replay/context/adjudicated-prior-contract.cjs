'use strict';
// A separate, narrowly adjudicated acceptance contract. No historical assertion/report is modified.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const home=__dirname,E=require('./runtime/js/assessment-engine'),D=require('./runtime/js/protocol-dose-schedule'),manifest=require('./transition-manifest.json');
const protocols=Object.fromEntries(manifest.protocols.map(x=>[x.code,JSON.parse(fs.readFileSync(path.join(home,x.candidate)))]));
const renalOriginal=require('./prior-replays/corrected-after/independent/current-results.json').results.filter(r=>r.status==='failed');
const results=[];
function run(code,name,input,classification,check){const a=E.assess(protocols[code],input),m=D.buildModificationModel(protocols[code],a),clinical=a.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId)),ids=clinical.map(x=>x.ruleId);const errors=[];try{for(const k of Object.keys(input))assert.ok(protocols[code].input_definitions[k],'Declared fixture input '+k);assert.deepEqual(a.invalid,[]);assert.deepEqual(a.errors,[]);assert.equal(a.complete,false);assert.notEqual(a.actionType,'proceed');assert.ok(m.rows.every(r=>!r.quantified||(r.actionType==='contraindicated'&&r.protocolDose==='Not to be administered')));check(a,m,ids);}catch(e){errors.push(e.message);}results.push({code,name,input,classification,status:errors.length?'failed':'passed',errors,observed:{action:a.actionType,complete:a.complete,findings:clinical.map(f=>({id:f.ruleId,action:f.actionType,message:f.action.message,components:f.action.components})),rows:m.rows}});}
for(const code of ['00596','00680'])for(const grade of [1,2,3,4])run(code,'Original broad-neuro fixture grade '+grade,{encephalopathy_grade:grade},'prior_source_semantic_adjudication_not_a_new_fixture',function(a,m,ids){
 assert.ok(!ids.includes('NEURO_NOW'),'No assertion of current CNS toxicity without localisation');
 const id=grade<=2?'IFO_NEURO_LOCALISATION_UNRESOLVED':'IFO_SEVERE_CURRENT_NEURO_HOLD';assert.ok(ids.includes(id),id);
 const row=m.rows.find(r=>r.componentId==='ifosfamide');assert.ok(row);
 if(code==='00680'&&grade>=3){assert.ok(ids.includes('HIGH_DOSE_NEURO_STOP'));assert.equal(row.actionType,'discontinue');}
 else assert.equal(row.actionType,'withhold');
 if(code==='00596'){assert.ok(!['discontinue','permanently_discontinue'].includes(row.actionType));if(grade>=3)assert.ok(ids.includes('IE_NEURO_EVENT'));}
 assert.ok(!m.rows.some(r=>r.componentId==='etoposide'&&['withhold','discontinue','permanently_discontinue','contraindicated'].includes(r.actionType)),'No broad-neuro ifosamide restriction transferred to etoposide');
});
assert.equal(renalOriginal.length,6);
for(const r of renalOriginal){
 run(r.code,'Original renal fixture: '+r.name,r.input,'prior_named_product_reconciliation_supersedes_renal_only_component_severity',function(a,m,ids){
  for(const id of ['IFO_PRODUCT_IDENTIFICATION_REQUIRED','IFO_PRODUCT_LABS_MISSING','IFO_PRODUCT_UNITS_UNVERIFIED','IFOS_RENAL_REVIEW','IFOS_RENAL_CONFLICT'])assert.ok(ids.includes(id),id);
  assert.equal(m.rows.find(x=>x.componentId==='ifosfamide').actionType,'withhold');assert.ok(!clinicalContra(a));
  if(r.code==='00596'){assert.equal(m.rows.find(x=>x.componentId==='etoposide').actionType,'consultant_review');assert.ok(ids.includes(r.input.crcl_ml_min<10?'ETO_RENAL_BELOW10':'ETO_RENAL_10_50'));}
 });
 const resolved={...r.input,ifosfamide_product:'mitoxana_pa2299_028_001',ifosfamide_laboratory_units_verified:true,serum_creatinine_umol_l:100,bilirubin_umol_l:10,alt_uln_multiple:1,ast_uln_multiple:1,alp_uln_multiple:1};
 if(r.code==='00596')resolved.cycle_day=1;
 run(r.code,'Product-source reconciliation control: '+r.name,resolved,'new_control_resolves_product_and_applicable_IE_calendar_context_without_erasing_NCCP_renal_review',function(a,m,ids){
  for(const id of ['IFO_PRODUCT_IDENTIFICATION_REQUIRED','IFO_PRODUCT_LABS_MISSING','IFO_PRODUCT_UNITS_UNVERIFIED'])assert.ok(!ids.includes(id),id);
  assert.ok(ids.includes('IFOS_RENAL_REVIEW'));assert.ok(ids.includes('IFOS_RENAL_CONFLICT'));assert.equal(m.rows.find(x=>x.componentId==='ifosfamide').actionType,'consultant_review');assert.ok(!clinicalContra(a));
  if(r.code==='00596')assert.equal(m.rows.find(x=>x.componentId==='etoposide').actionType,'consultant_review');
 });
}
function clinicalContra(a){return a.findings.some(f=>['contraindicated','discontinue','permanently_discontinue'].includes(f.actionType));}
const report={date:'2026-11-18',scope:'Separate specific acceptance contract for14 historical clinical mismatches and6 product-reconciliation controls; historical tests unchanged',total:results.length,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,clinical_approval:false,pharmacy_approval:false,script_sha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),results};const file=path.join(home,process.argv[2]||'adjudicated-prior-contract-results.final.json');assert.ok(!fs.existsSync(file));fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:results.filter(r=>r.status==='failed').map(r=>({name:r.name,errors:r.errors}))}));process.exitCode=report.failed?1:0;
