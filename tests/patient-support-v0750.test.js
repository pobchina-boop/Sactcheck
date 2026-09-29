const assert=require('assert');
const api=require('../js/patient-support-v0750.js');

assert.equal(api.release,'0.78.0');

const scheduleProtocol={
  protocol_id:'demo',
  treatment_phases:[
    {name:'Induction',cycle_length_days:21,frequency:'Every 3 weeks',administration:[
      {drug:'Drug A',route:'IV',days:'1-3'},
      {drug:'Drug B',route:'IV',day:1}
    ]},
    {name:'Maintenance',cycle_length_days:21,frequency:'Every 3 weeks',administration:[
      {drug:'Drug C',route:'IV',day:1}
    ]}
  ]
};
const rows=api.scheduleRows(scheduleProtocol);
assert.equal(rows.length,2);
assert.ok(rows[0].phase.startsWith('Induction'));
assert.deepEqual(rows[0].days.map(x=>x.day),['Day 1','Day 2','Day 3']);
assert.equal(rows[0].frequency,'Every 3 weeks');
assert.ok(rows[1].phase.startsWith('Maintenance'));

const risk={agent_profiles:{
  trastuzumab:{display_name:'Trastuzumab',aliases:['Herceptin'],risks:[{id:'cardiac',label:'Cardiac dysfunction'}]},
  trastuzumab_deruxtecan:{display_name:'Trastuzumab deruxtecan',aliases:['Enhertu','T-DXd'],risks:[{id:'ild',label:'Interstitial lung disease'}]}
}};
const tdxd={protocol_id:'tdxd',treatment_phases:[{administration:[{drug:'Trastuzumab deruxtecan',day:1}]}]};
const matches=api.profileMatches(tdxd,risk);
assert.equal(matches.length,1);
assert.equal(matches[0].key,'trastuzumab_deruxtecan');
assert.ok(!matches.some(x=>x.key==='trastuzumab'));

const link=api.regimenLink({protocol_id:'nccp-123'});
assert.equal(link,'https://sactcheck.com/?patientSupport=nccp-123');
assert.ok(!/localhost|file:/i.test(link));

// The two extra bevacizumab risks must be attributed to that medicine only,
// while the patient's label leads with a recognisable symptom or description.
const fs=require('fs'),path=require('path');
const hcc=JSON.parse(fs.readFileSync(path.join(__dirname,'../protocols/gastrointestinal/00831-atezolizumab-bevacizumab-hcc.json')));
const actualRisk=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/consent-content-v0710.json')));
const hccRows=api.buildRiskRows(hcc,actualRisk).rows;
for(const id of ['jaw_osteonecrosis','pres']){
  const row=hccRows.find(x=>x.id===id);
  assert.ok(row,`${id} must be present`);
  assert.equal(row.agent,'Bevacizumab');
  assert.ok(row.label.includes('('));
}
assert.equal(hccRows.find(x=>x.id==='pres').action,'urgent');
assert.ok(hccRows.find(x=>x.id==='thrombosis').label.startsWith('Clots'));
assert.equal(api.regimenLink(hcc),'https://sactcheck.com/patient/00831/');
const onlyImmune={protocol_id:'test-atezo',treatment_phases:[{administration:[{drug:'Atezolizumab',day:1}]}]};
assert.ok(!api.buildRiskRows(onlyImmune,actualRisk).rows.some(x=>['pres','jaw_osteonecrosis'].includes(x.id)));
let printable='';
global.location={href:'https://sactcheck.com/'};
global.open=()=>({document:{open(){},write(value){printable+=value;},close(){}}});
api.openPrintablePassport(hcc,actualRisk);
assert.ok(printable.includes('anatomy-hcc-v0762.png'));
assert.ok(printable.includes('A picture of side effects'));
assert.ok(printable.includes('Chest pain, palpitations'));
assert.equal((printable.match(/<article class=\"hcc-organ-card /g)||[]).length,9);
assert.ok(printable.includes('data-hcc-pin="bowel"'));
assert.ok(printable.includes('BEVACIZUMAB · VESSELS / HEALING'));
assert.ok(printable.includes('hcc-connectors-v0763.js'));
assert.ok(printable.includes('Jaw-bone damage (osteonecrosis of the jaw)'));
assert.ok(printable.includes('Rare brain condition (PRES)'));
assert.ok(printable.includes('https://sactcheck.com/patient/00831/'));
console.log('patient-support-v0750: PASS');
