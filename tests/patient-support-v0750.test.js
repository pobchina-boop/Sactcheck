const assert=require('assert');
const api=require('../js/patient-support-v0750.js');

assert.equal(api.release,'0.75.1');

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
console.log('patient-support-v0750: PASS');
