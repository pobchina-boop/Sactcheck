'use strict';
const assert = require('node:assert/strict');
const Engine = require('../js/assessment-engine');
const Dose = require('../js/protocol-dose-schedule');
const Output = require('../js/assessment-output');
const cases = [
  {
    protocol: require('../protocols/breast/00228-eribulin-monotherapy.json'),
    sarcoma: '00228b',
    input: { febrile_neutropenia: true, current_eribulin_dose_level: '0.97', toxicity_recurred_at_reduced_dose: true },
    breastDose: '0.62 mg/m²'
  },
  {
    protocol: require('../protocols/breast/00205-pegylated-liposomal-doxorubicin.json'),
    sarcoma: '00205c',
    input: { bilirubin_umol_l: 51 },
    breastDose: '25 mg/m²'
  }
];
for (const { protocol, sarcoma, input, breastDose } of cases) {
  for (const indication of [undefined, ...protocol.indications.map(item => item.code)]) {
    const inputs = indication ? { ...input, indication_id: indication } : input;
    const selected = Engine.protocolForIndication(protocol, inputs);
    assert.equal(selected, protocol.assessment_by_indication[indication || protocol.default_assessment_indication] || protocol);
    const result = Engine.assess(protocol, inputs);
    const model = Dose.buildModificationModel(protocol, result);
    assert.deepEqual(model, Dose.buildModificationModel(selected, result), 'Dose display uses assessed indication');
    const args = { result, protocol, assessmentId: 'batch1-test' };
    assert.deepEqual(Output.buildModel(args), Output.buildModel({...args,protocol:selected}), 'Export uses assessed indication');
    if (indication === sarcoma || selected === protocol.assessment_by_indication['00205a']) {
      assert.equal(result.actionType, 'consultant_review');
      assert(!model.rows.some(row => row.protocolDose === breastDose));
    } else {
      assert.equal(result.actionType, 'dose_reduce');
      assert(model.rows.some(row => row.protocolDose === breastDose));
    }
  }
}
console.log('Shared sarcoma, breast, gynaecology and legacy selections retain their expected assessment, displayed dose and export.');

const pld = cases[1].protocol;
for (const indication_id of ['00205a', undefined]) {
  for (const [bilirubin_umol_l, original_pld_mg_m2, current_pld_mg_m2, dose] of [
    [20,40,40,30], [50,40,30,30], [51,40,40,20], [86,40,20,20],
    [51,50,50,25], [20,50,50,37.5], [51,40,19,null], [50,40,29,null],
    [51,undefined,40,null], [20,0,40,null], [51,40,undefined,20], [50.5,40,40,null], [87,40,40,null]
  ]) {
    const inputs = {indication_id, bilirubin_umol_l, original_pld_mg_m2, current_pld_mg_m2};
    const result = Engine.assess(pld,inputs);
    const rows = Dose.buildModificationModel(pld,result).rows;
    const exported = Output.buildModel({protocol:pld,result,assessmentId:'00205-test'});
    assert.equal(exported.protocolActions.length, rows.length);
    assert(rows.length, JSON.stringify(inputs));
    if (dose === null) {
      assert(rows.every(row=>!/^\d+(?:\.\d+)? mg\/m²$/.test(row.protocolDose)));
    } else {
      assert.equal(result.actionType,'dose_reduce');
      assert.equal(rows[0].protocolDose,dose+' mg/m²');
      assert.equal(exported.protocolActions[0].dose, rows[0].protocolDose);
      assert.equal(rows[0].startingDose,original_pld_mg_m2+' mg/m²');
      assert(Output.toText(exported).includes(dose+' mg/m²'));
    }
  }
}
console.log('00205 breast Table 2 checks passed for both source bands, missing original doses, lower current prescriptions, boundaries and exports.');
