'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),E=require('./runtime/js/assessment-engine'),D=require('./runtime/js/protocol-dose-schedule');
const home=__dirname,m=require('./transition-manifest.json'),results=[];
for(const code of ['00596','00680'])for(const named of [false,true]){
 const p=JSON.parse(fs.readFileSync(path.join(home,m.protocols.find(x=>x.code===code).candidate))),input={assessment_phase:'treatment',cycle_day:1,ifosfamide_product:'other',ifosfamide_laboratory_units_verified:true,serum_creatinine_umol_l:100,bilirubin_umol_l:10,alt_uln_multiple:1,ast_uln_multiple:1,alp_uln_multiple:1};
 if(code==='00680')delete input.cycle_day;
 if(named)input.ifosfamide_other_product_name_and_source='Different supplied product and its own current SmPC require pharmacy verification';
 const a=E.assess(p,input),d=D.buildModificationModel(p,a),ids=a.findings.map(f=>f.ruleId),errors=[];
 try{assert.deepEqual(a.invalid,[]);assert.deepEqual(a.errors,[]);assert.equal(ids.includes('IFO_OTHER_PRODUCT_IDENTITY_MISSING'),!named);assert.ok(ids.includes('IFO_OTHER_PRODUCT_REVIEW'));assert.ok(d.rows.some(r=>r.componentId==='ifosfamide'&&!r.quantified));assert.ok(!ids.some(x=>/^IFO_PRODUCT_(SERUM|BILIRUBIN|ALT|AST|ALP)/.test(x)),'Named Mitoxana thresholds are not a universal other-product substitute');}catch(e){errors.push(e.message);}
 results.push({code,name:'Other product identity supplied='+named,input,status:errors.length?'failed':'passed',errors,observed:{action:a.actionType,findings:a.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId)).map(f=>({id:f.ruleId,type:f.actionType})),rows:d.rows}});
}
const report={total:results.length,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,results};const out=path.join(home,process.argv[2]||'other-product-identity-results.json');assert.ok(!fs.existsSync(out));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed}));process.exitCode=report.failed?1:0;
