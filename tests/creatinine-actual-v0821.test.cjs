'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),Engine=require('../js/assessment-engine.js'),Lab=require('../js/local-lab-profile.js');
const protocol=require('../protocols/lung/00568-pembrolizumab-pemetrexed-and-carboplatin-auc5-therapy.json');
const id='creatinine_ratio_baseline_or_uln',definition=Engine.getInputDefinitions(protocol).find(d=>d.id===id);
assert.equal(definition.actual_result_adapter,'creatinine_uln');
assert.equal(Lab.adapterFor(id),null,'Unannotated baseline fields in other protocols must not be reinterpreted');
assert.equal(Lab.calculate(definition,{creatinine:''}),null);
assert.equal(Lab.calculate(definition,{creatinine:-1}),null);
assert.equal(Lab.calculate(definition,{creatinine:'bad'}),null);
const input={dataset:{labTarget:id,labAnalyte:'creatinine'},value:'600',disabled:false};
const document={readyState:'loading',addEventListener(){},querySelectorAll(selector){return selector.includes('data-lab-target')?[input]:[];}};
let source=fs.readFileSync(path.join(root,'js/generic-assessment-ui.js'),'utf8');
source=source.replace('root.SACTCheckGenericAssessment = Object.freeze({','root.__test = { buildControl, collectRawInputs, comparisonRows, setProtocol(p){activeProtocol=p;} };\n  root.SACTCheckGenericAssessment = Object.freeze({');
const context={document,SACTCheckAssessmentEngine:Engine,SACTCheckLocalLab:Lab,SACTCheckAssessmentOutput:{},SACTCheckAssessmentPdf:{}};
vm.runInNewContext(source,context);const api=context.__test;api.setProtocol(protocol);
const markup=api.buildControl(definition);assert.match(markup,/µmol\/L/);assert.match(markup,/data-lab-analyte="creatinine"/);assert.doesNotMatch(markup,/data-field=/);assert.match(markup,/female/);
const inputs=api.collectRawInputs();assert.equal(Number(inputs[id]),600/90,'Actual result must be divided exactly once');
let result=Engine.assess(protocol,inputs);assert.equal(result.partialAssessment,true);assert.equal(result.invalid.length,0);assert.equal(result.actionType,'permanently_discontinue');assert.equal(result.inputs.anc_x10e9_l,null);
const row=api.comparisonRows({field:id,operator:'>',value:3},inputs,[definition])[0];assert.match(row.actual,/600 µmol\/L ÷ ULN 90 µmol\/L = 6.67 ×ULN/);assert.equal(row.cutoff,'3 ×ULN');assert.doesNotMatch(row.actual,/600 ×/);
for(const [actual,hasG2,hasG3] of [[90,false,false],[135,false,false],[135.01,true,false],[270,true,false],[270.001,true,true]]){
 input.value=String(actual);result=Engine.assess(protocol,api.collectRawInputs());const ids=result.findings.map(f=>f.ruleId||f.id);assert.equal(ids.includes('ICI_RENAL_G2'),hasG2,JSON.stringify({actual,ids}));assert.equal(ids.includes('ICI_RENAL_G3'),hasG3,JSON.stringify({actual,ids}));
}
Lab.write({creatinineUln:100});input.value='600';assert.equal(Number(api.collectRawInputs()[id]),6);Lab.reset();
input.value='';assert.equal(api.collectRawInputs()[id],undefined,'Clearing input must clear the ratio');
assert.equal(Lab.calculate('alt_ast_uln_multiple',{alt:500,ast:400}).ratio,14.7059);
console.log('Raw creatinine form→collection→engine→comparison passed; exact boundaries, single-value partial assessment, changed ULN, clear and legacy isolation passed.');
