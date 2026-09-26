const assert=require('assert');
const fs=require('fs');
const path=require('path');
const engine=require('../js/regimen-workflow-engine-v0750.js');
const pdf=require('../js/supportive-care-pdf-v0750.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/regimen-workflow-v0750.json'),'utf8'));

assert.equal(engine.release,'0.75.1');
assert.equal(data.release,'0.75.1');

const carboplatinProtocol={
  protocol_id:'00689',metadata:{short_title:'Atezolizumab + Carboplatin + Etoposide',nccp_regimen_code:'00689',nccp_version:'4'},
  treatment_phases:[{administration:[
    {drug:'Atezolizumab',route:'IV',day:1},
    {drug:'Carboplatin',route:'IV',day:1,dose:'AUC 5'},
    {drug:'Etoposide',route:'IV',days:'1-3'}
  ]}]
};
const plan=engine.chooseAntiemeticPlan(carboplatinProtocol,data,{level:'high'});
assert.equal(plan.planId,'high_carboplatin');
assert.ok(/carboplatin/i.test(plan.label));
assert.ok(!/trastuzumab/i.test(plan.label));
assert.equal(plan.local_prescription_items.length,9);
for(const med of ['Omeprazole','Nystatin','Chlorhexidine mouthwash','Cyclizine','Metoclopramide','Loperamide']){
  assert.ok(plan.local_prescription_items.some(x=>x.medicine===med),`missing ${med}`);
}

const tdxdProtocol={protocol_id:'tdxd',metadata:{short_title:'Trastuzumab deruxtecan'},treatment_phases:[{administration:[{drug:'Trastuzumab deruxtecan',route:'IV',day:1}]}]};
const tdxdPlan=engine.chooseAntiemeticPlan(tdxdProtocol,data,{level:'high'});
assert.equal(tdxdPlan.planId,'high_tdxd');
assert.ok(/trastuzumab deruxtecan/i.test(tdxdPlan.label));

const manifest=engine.buildManifest(carboplatinProtocol,data,{level:'high'});
const bytes=pdf.buildPdf({manifest});
fs.writeFileSync('/mnt/data/sact_resume/v0750/tests/SACTCheck_v0750_supportive_test.pdf',Buffer.from(bytes));
const raw=Buffer.from(bytes).toString('latin1');
for(const term of ['Omeprazole','Nystatin','Chlorhexidine mouthwash','Cyclizine','Metoclopramide','Loperamide']) assert.ok(raw.includes(term),`PDF missing ${term}`);
assert.ok(!raw.includes('carboplatin AUC >=4 / trastuzumab deruxtecan'));
console.log('regimen-workflow-v0750: PASS');
