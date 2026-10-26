'use strict';
// The form must run and export without a manual assessment-ID DOM element.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const Engine = require('../js/assessment-engine');
const Output = require('../js/assessment-output');
const Pdf = require('../js/assessment-pdf');
const protocol = require('../protocols/lung/00568-pembrolizumab-pemetrexed-and-carboplatin-auc5-therapy.json');
const source = fs.readFileSync(path.join(__dirname, '../js/generic-assessment-ui.js'), 'utf8');
const instrumented = source.replace('root.SACTCheckGenericAssessment = Object.freeze({', `
  root.testAssessment = {
    run: runAssessment,
    model: currentOutputModel,
    definitions: presentationInputDefinitions,
    prepare(protocol, inputs) {
      activeProtocol = protocol;
      activeProfileId = Engine.getProfiles(protocol)[0]?.id || 'default';
      collectRawInputs = () => inputs;
      renderResult = () => {};
    }
  };
  root.SACTCheckGenericAssessment = Object.freeze({`);
for (const browserCrypto of [crypto.webcrypto, undefined]) {
  const context = {
    crypto: browserCrypto,
    document: {
      readyState: 'loading', addEventListener() {},
      getElementById(id) {
        assert.notEqual(id, 'jsonAssessmentId', 'Removed manual ID must not be accessed');
        return null;
      }
    },
    SACTCHECK_RELEASE: require('../package.json').version,
    SACTCheckAssessmentEngine: Engine,
    SACTCheckAssessmentOutput: Output,
    SACTCheckAssessmentPdf: Pdf
  };
  vm.runInNewContext(instrumented, context);
  const api = context.testAssessment;
  api.prepare(protocol, {anc_x10e9_l: 0.3});
  api.run();
  const first = api.model();
  assert.ok(first.assessmentId && first.assessmentId !== 'Not entered');
  assert.match(Output.toText(first), /hold|delay|withhold/i);
  assert.ok(Output.toText(first).includes(first.assessmentId));
  assert.ok(Pdf.buildPdfBytes(first).length > 1000);
  assert.equal(api.model().assessmentId, first.assessmentId, 'Exports for one result retain its reference');
  api.run();
  assert.notEqual(api.model().assessmentId, first.assessmentId, 'A new assessment gets a new reference');
}
console.log('Assessment runs without manual ID; partial-input decisions and PDF/text output preserve generated references with and without browser crypto.');

// Exercise the production presentation filter across every canonical protocol.
const context = {
  document: {readyState: 'loading', addEventListener() {}},
  SACTCheckAssessmentEngine: Engine,
  SACTCheckAssessmentOutput: Output,
  SACTCheckAssessmentPdf: Pdf
};
vm.runInNewContext(instrumented, context);
let profiles = 0, removed = 0, retainedOutsideImmunotherapy = 0;
for (const row of require('../protocols/index.json').protocols) {
  const p = JSON.parse(fs.readFileSync(path.join(__dirname, '..', row.path), 'utf8'));
  for (const profile of Engine.getProfiles(p)) {
    const original = Engine.getInputDefinitions(p, profile.id);
    const presented = context.testAssessment.definitions(p, profile.id);
    for (const definition of original) {
      const extra = ['glucose_mmol_l', 'ketones_mmol_l'].includes(definition.id);
      const derived = Boolean(definition.ui_derived_from);
      if (derived) {
        const source = original.find(d => d.id === definition.ui_derived_from);
        if(definition.derived_value){
          assert(['difference','ratio'].includes(definition.derived_value.operation));
          assert.equal(definition.derived_value.fields.length,2);
          for(const field of definition.derived_value.fields)assert(presented.some(d=>d.id===field&&d.type==='number'),'Calculated field requires visible numeric operands');
          assert.equal(Engine.assess(p,{[definition.id]:99}).inputs[definition.id],null,'Supplied calculated values cannot replace missing operands');
        }else assert.equal(source?.derived_actual_field, definition.id, 'Hidden absolute input must have an explicit visible source');
        assert(presented.some(d => d.id === source.id));
      }
      const removedHere = derived || (extra && definition.ui_section === 'immunotherapy_bloods');
      assert.equal(presented.some(d => d.id === definition.id), !removedHere, row.id + '/' + definition.id);
      if (removedHere && extra) removed++;
      if (extra && !removedHere) retainedOutsideImmunotherapy++;
    }
    profiles++;
  }
}
assert.ok(removed > 0);
const pembro = require('../protocols/shared/00455-pembrolizumab-200-mg-monotherapy.json');
const partial = Engine.assess(pembro, {cortisol_nmol_l: 400, cortisol_sample_time: '09:00'});
// v0.84.22 uses NCCP's diagnosed type-1 ketoacidosis pathway; a ketone
// number alone no longer supplies an invented treatment-action threshold.
for (const id of ['glucose_mmol_l', 'type1_diabetes_ketoacidosis']) {
  assert.ok(partial.unassessed.some(d => d.id === id), id + ' must remain unassessed');
}
assert.equal(partial.complete, false);
console.log(`${profiles} protocol profiles checked: ${removed} routine immunotherapy fields removed; ${retainedOutsideImmunotherapy} glucose/ketone fields outside that section retained; omitted safety domains remain unassessed.`);
