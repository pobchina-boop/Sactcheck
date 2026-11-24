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
    assert.equal(selected, indication === sarcoma ? protocol.assessment_by_indication[sarcoma] : protocol);
    const result = Engine.assess(protocol, inputs);
    const model = Dose.buildModificationModel(protocol, result);
    assert.deepEqual(model, Dose.buildModificationModel(selected, result), 'Dose display uses assessed indication');
    const args = { result, protocol, assessmentId: 'batch1-test' };
    assert.deepEqual(Output.buildModel(args), Output.buildModel({...args,protocol:selected}), 'Export uses assessed indication');
    if (indication === sarcoma) {
      assert.equal(result.actionType, 'consultant_review');
      assert(!model.rows.some(row => row.protocolDose === breastDose));
    } else {
      assert.equal(result.actionType, 'dose_reduce');
      assert(model.rows.some(row => row.protocolDose === breastDose));
    }
  }
}
console.log('Shared sarcoma, breast, gynaecology and legacy selections retain their expected assessment, displayed dose and export.');
