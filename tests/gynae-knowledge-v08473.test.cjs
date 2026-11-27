'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.resolve(__dirname, '..');
const json = file => JSON.parse(fs.readFileSync(path.join(repo, file), 'utf8'));
require('../js/protocol-id-migrations');
require('../js/patient-asset-registry-v0810');
const knowledge = require('../js/regimen-knowledge-base');
const evidence = require('../js/treatment-evidence-v08413');
const workflow = json('data/regimen-workflow-v0750.json');
const journeys = require('../js/treatment-journey-v0837');
const journeyData = json('data/breast-treatment-journeys-v0837.json');
require('../js/patient-anatomy-data-v08431');
globalThis.SACTCheckAnatomy = require('../js/patient-anatomy-v08431');
const patientSupport = require('../js/patient-support-v0750');
const sustainabilityUI = {document: {readyState:'loading', addEventListener() {}}};
vm.runInNewContext(fs.readFileSync(path.join(repo,'js/sustainability-module.js'),'utf8'), sustainabilityUI);
const sustainability = sustainabilityUI.SACTCheckSustainability;
const sustainabilityData = sustainability.mergeAddendum(json('data/sustainability-regimen-metadata-v0691.json'), json('data/sustainability-regimen-metadata-v08445-addendum.json'));
const protocolFiles = fs.readdirSync(path.join(repo,'protocols'), {recursive:true});
const cases = [
  ['00943','1','',/601 participants/,/0\.57/,['concurrent_day1','cisplatin_weekly','optional_c2d15','pembro_q3w','pembro_q6w']],
  ['00921','1','',/453 patients/,/16\.46/,['first_infusion','subsequent_infusion']],
  ['00279','8','cervical',/179 people/,/42\.9%/,['day1_platinum_etoposide','days23_iv_etoposide','days23_oral_etoposide','days23_fractionated_cisplatin']],
  ['00251','6','ovarian',/120 vulnerable/,/48%/,['day1']],
  ['00261','7','ovarian',/356 patients/,/5\.8 months/,['day1']]
];
async function check() {
  const savedFetch = global.fetch;
  global.fetch = async file => ({ok:true, json: async () => json(file)});
  let payload;
  try { payload = await knowledge.load(); } finally { global.fetch = savedFetch; }
  for (const [code, version, context, population, outcome, phaseIds] of cases) {
    const filenames = protocolFiles.filter(file => path.basename(file).startsWith(code+'-') && file.endsWith('.json'));
    assert.equal(filenames.length,1,code+' should resolve to one canonical protocol file');
    const protocol = json('protocols/'+filenames[0]);
    assert.equal(String(protocol.metadata.nccp_version),version);
    const selection = knowledge.regimenProfileForProtocol(protocol,payload);
    const profile = context ? selection.context_profiles.find(row => row.context_id === context) : selection;
    const patient = json(context ? `data/patient-knowledge-contexts/${code}/${context}.json` : `data/patient-knowledge/${code}.json`);
    const selector = context ? workflow.context_supportive_phase_selectors[code][context] : workflow.supportive_phase_selectors[code];
    assert.equal(profile.journey_key, context ? `${code}:${context}` : code);
    assert.match(profile.evidence_at_a_glance.population,population);
    assert.match(evidence.render(profile),outcome);
    assert.equal(patient.protocol_id,protocol.protocol_id);
    assert.equal(profile.protocol_id,protocol.protocol_id);
    assert.equal(selector.protocol_id,protocol.protocol_id);
    assert.equal(String(selector.source_version),version);
    const journey = journeys.definitions[profile.journey_key];
    assert.deepEqual(journey,journeyData[profile.journey_key]);
    assert.deepEqual(journey.milestones.map(row=>[row.why,row.action]),patient.monitoring_schedule.rows.map(row=>row.cells));
    assert.deepEqual(journey.stages.slice(1,-1),patient.phases.map(phase=>phase.label));
    assert.deepEqual(journey.lanes[0].cells.slice(1,-1),patient.phases.map(phase=>phase.detail));
    assert(journeys.renderForCode(profile.journey_key,'clinician').includes(patient.title));
    assert.deepEqual(globalThis.SACTCheckAnatomyData[profile.journey_key].anatomy,patient.anatomy);
    const map = patientSupport.bodyMapMarkup([],context ? {...protocol,patient_context:context} : protocol);
    assert(map.includes(patient.anatomy[0][1]),code+' selected anatomy');
    const environmental = sustainability.profileFor(sustainabilityData,{protocol:protocol.protocol_id,tumour:context||'gynaecology'});
    assert.equal(environmental.administration_frequency.value,patient.schedule_summary);
    assert.equal(environmental.planned_treatment_encounters.value,null);
    assert.equal(environmental.travel_model_inputs.value,null);
    if (context) {
      assert.equal(sustainability.profileFor(sustainabilityData,{protocol:protocol.protocol_id,tumour:'gynaecology'}).administration_frequency.value,patient.schedule_summary);
      const legacy = sustainability.profileFor(sustainabilityData,{protocol:protocol.protocol_id,tumour:code==='00279'?'lung':'breast'});
      assert.notEqual(legacy.administration_frequency.value,patient.schedule_summary);
      assert(patientSupport.bodyMapMarkup([],{...protocol,patient_context:'all'}).includes('/scope.html'));
    }
    assert.deepEqual(patient.phases.map(p => p.id),phaseIds);
    assert.deepEqual(selector.phases.map(p => p.id),phaseIds);
    assert.deepEqual(patient.prescription_phases.map(p => p.id),phaseIds);
    for (const [index,phase] of selector.phases.entries()) {
      const plan = workflow.antiemetic_plans[phase.plan_id];
      const script = patient.prescription_phases[index];
      assert.equal(script.emetogenic_risk,plan.risk_level);
      assert.deepEqual(script.active_medicines,phase.active_medicines);
      assert.deepEqual(script.medicines.map(m => m.name),[...plan.day1,...plan.subsequent].map(m => m.medicine));
      assert(patient.phase_support[phase.id].length>0);
    }
    if (code==='00921') {
      for (const phase of patient.prescription_phases) {
        assert.deepEqual(phase.medicines.map(m=>m.dose),['1 g PO','10 mg IV bolus','10 mg IV bolus','16 mg PO']);
        assert.match(phase.prescription_notes.join(' '),/grade ≥2 infusion reaction/);
      }
      assert.match(patient.monitoring_schedule.rows[2].cells[0],/every other cycle/);
      assert.match(patient.questions[0].a,/15 minutes/);
      assert.equal(patient.agents[0].consent_risks.length,4);
    }
    if (code==='00943') {
      assert.deepEqual(patient.prescription_phases.map(p => p.emetogenic_risk),['high','high','high','minimal','minimal']);
      assert.match(patient.schedule_summary,/cycles 6–20/i);
      assert.match(patient.questions[0].a,/separately decides/);
    }
    if (code==='00279') {
      assert.match(patient.consent_support,/off-label use/);
      assert.match(profile.clinical_summary,/Therapeutics Committee/);
      assert.match(profile.evidence_at_a_glance.limitations.join(' '),/four cycles/);
      assert.equal(patient.prescription_phases[2].emetogenic_risk,'oral_minimal_low');
      assert.match(patient.prescription_phases[3].prescription_notes.join(' '),/day 5/);
    }
    if (context==='ovarian') {
      const tests = JSON.stringify(patient.monitoring_schedule);
      assert.equal(patient.cycle_days, code==='00251' ? 28 : 21);
      assert.equal(tests.includes('13–15'),code==='00251');
      assert.match(profile.clinical_summary,/a–c adjuvant/);
      assert.match(profile.clinical_summary,/ANC ≥1 × 10⁹\/L AND platelets ≥100 × 10⁹\/L/);
      assert.match(profile.evidence_at_a_glance.limitations.join(' '),/do not compare 21-day with 28-day/);
    }
  }
  console.log('Five live knowledge, journey, anatomy and sustainability contexts and all 13 visit-specific supportive plans passed.');
}
check().catch(error=>{ console.error(error); process.exitCode=1; });
