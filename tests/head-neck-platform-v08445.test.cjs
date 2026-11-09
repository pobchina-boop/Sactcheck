'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Ids=require('../js/protocol-id-migrations'),Lab=require('../js/local-lab-profile'),Dose=require('../js/protocol-dose-schedule');
for(const [oldId,newId] of Object.entries(Ids.migrations)){
 const current={protocol_id:newId,metadata:{nccp_regimen_code:Ids.codeInId(newId)}};
 assert.equal(Ids.resolve(oldId,[current]),current);
 assert.equal(Ids.resolve(newId,[current]),current);
 assert.equal(Ids.resolve(oldId,[]),null);
 assert.equal(Ids.resolve(oldId,[current,{...current}]),null);
 assert.equal(Ids.resolve({protocol_id:oldId,metadata:{nccp_regimen_code:'00001'}},[current]),null);
 assert.equal(Ids.resolve(oldId,[{...current,metadata:{nccp_regimen_code:'00001'}}]),null);
 assert.equal(Ids.resolve(newId.replace(/-v.*$/,'-v999'),[current]),null);
 assert.equal(Ids.matches(oldId,newId),true);
 assert.deepEqual(Ids.compatibleKeys(oldId),[newId,oldId]);
}
assert.equal(Ids.matches('nccp-00207-v6','nccp-00558-v13'),false);
assert.equal(Ids.matches('garbage','garbage'),false);
assert.equal(Ids.normaliseCode('207'),'00207');
const definition={id:'alt_ast_uln_multiple',type:'number',derived_actual_fields:{ast:'ast_u_l'}};
assert.deepEqual(Lab.derivedActualFields(definition,{ast:'181',alt:'99'}),{ast_u_l:'181'});
assert.deepEqual(Lab.derivedActualFields(definition,{ast:'0'}),{ast_u_l:'0'});
for(const raw of ['',null,undefined,-1,'NaN','invalid'])assert.deepEqual(Lab.derivedActualFields(definition,{ast:raw}),{});
// Execute the production collector with a minimal DOM: invalid/missing ALT must
// neither replace nor erase the absolute AST used by the independent 5-FU rule.
const ui=fs.readFileSync(require.resolve('../js/generic-assessment-ui.js'),'utf8');
const collector=ui.slice(ui.indexOf('  function collectRawInputs('),ui.indexOf('  function refreshLabPreviews('));
function collect(ast,alt,disabled=false){
 const controls=[{dataset:{labTarget:definition.id,labAnalyte:'ast'},value:ast,disabled},{dataset:{labTarget:definition.id,labAnalyte:'alt'},value:alt,disabled:false}];
 const context={LocalLab:Lab,activeProtocol:{input_definitions:{[definition.id]:definition}},latestLabCalculations:{},cssEscape:x=>x,inputControlSelector:x=>x,document:{querySelectorAll:s=>s==='[data-field]'?[]:controls}};
 vm.createContext(context);vm.runInContext(collector+'\nthis.result=collectRawInputs();',context);return context.result;
}
assert.equal(collect('181','').ast_u_l,'181');
assert.equal(Number(collect('181','').alt_ast_uln_multiple),181/Lab.read().astUln);
assert.equal(collect('181','bad').ast_u_l,'181');
assert.equal(collect('181','bad').alt_ast_uln_multiple,'NaN');
assert.equal(collect('181','999').ast_u_l,'181');
assert.equal(collect('181','999',true).ast_u_l,undefined);
const model={allPhases:[{id:'combination',components:[{id:'pembrolizumab',drug:'Pembrolizumab'},{id:'cisplatin',drug:'Cisplatin'},{id:'fluorouracil',drug:'Fluorouracil'}]},{id:'maintenance',components:[{id:'pembrolizumab',drug:'Pembrolizumab'}]}],doseLevels:[{componentId:'cisplatin',component:'Cisplatin',levels:[]}]};
const finding={actionType:'withhold',action:{type:'withhold',components:['whole_regimen']}};
assert.deepEqual(Dose.buildModificationModel({}, {inputs:{treatment_phase:'maintenance'},findings:[finding]},model).rows.map(x=>x.component),['Pembrolizumab']);
assert.equal(Dose.buildModificationModel({}, {inputs:{treatment_phase:'combination'},findings:[finding]},model).rows.length,3);
assert.equal(Dose.buildModificationModel({}, {inputs:{},findings:[finding]},model).rows.length,3);
console.log('v0.84.45 explicit ID migrations, single AST collector, and active-phase dose action checks passed');
const index=JSON.parse(fs.readFileSync(require.resolve('../protocols/index.json'))).protocols;
for(const code of ['00705','00706']){
 const p=JSON.parse(fs.readFileSync(require('path').join(__dirname,'..',index.find(x=>x.path.includes('/'+code+'-')).path)));
 assert.equal(p.input_definitions.ast_u_l.ui_derived_from,'alt_ast_uln_multiple');
 assert.equal(p.input_definitions.alt_ast_uln_multiple.derived_actual_fields.ast,'ast_u_l');
 assert.equal(p.input_definitions.bilirubin_umol_l.ui_derived_from,'bilirubin_uln_multiple');
 assert.equal(p.input_definitions.bilirubin_uln_multiple.derived_actual_field,'bilirubin_umol_l');
 const raw=Lab.calculate({...p.input_definitions.bilirubin_uln_multiple,id:'bilirubin_uln_multiple'},{bilirubin:'90'},{...Lab.read(),bilirubinUln:20});
 assert.equal(raw.ratio,4.5);assert.equal(raw.highestPart.actual,90);
 assert.equal(Lab.calculate({...p.input_definitions.bilirubin_uln_multiple,id:'bilirubin_uln_multiple'},{bilirubin:''}),null);
}
console.log('Both H&N combinations use one visible AST and bilirubin result; absolute/ULN binding and blank handling verified.');
