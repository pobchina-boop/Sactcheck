'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

require('../js/protocol-id-migrations.js');
require('../js/patient-asset-registry-v0810.js');
const knowledge = require('../js/regimen-knowledge-base.js');
const evidence = require('../js/treatment-evidence-v08413.js');
const workflows = json('data/regimen-workflow-v0750.json');

const cases = [
  ['00385', '5', 'a', 'cervical_definitive', 'weekly_rt', 'cisplatin', 'high', /stage IIB–IVA/i, /0\.61/, '10202165'],
  ['00385', '5', 'e', 'cervical_postoperative', 'weekly_rt', 'cisplatin', 'high', /unexpected pathological node/i, /postoperative/i, '10764420'],
  ['00419', '6', 'b', 'cervical', 'weekly_rt', 'carboplatin', 'moderate', /cisplatin contraindication/i, /0\.53/, '29996970'],
  ['00812', '3a', 'a', 'cervical', 'cemiplimab', 'cemiplimab', 'minimal', /progressed on or after platinum/i, /11\.7/, '39798514'],
  ['00455', '16', 'j', 'cervical_maintenance', 'maintenance', 'pembrolizumab', 'minimal', /CPS\) ≥1/, /28\.6/, '37910822'],
  ['00558', '13', 'j', 'cervical_maintenance', 'maintenance', 'pembrolizumab', 'minimal', /CPS\) ≥1/, /28\.6/, '37910822'],
];
const oldChoices = {
  '00385': ['head_neck','nasopharyngeal'],
  '00419': ['head_neck'],
  '00812': ['skin/melanoma'],
  '00455': ['lung','gastrointestinal','head_neck','melanoma_adjuvant','melanoma_advanced','melanoma_perioperative'],
  '00558': ['lung','gastrointestinal','head_neck','melanoma_adjuvant','melanoma_advanced'],
};
async function run() {
  // Exercise the same addendum order as the application, including older shared-code profiles.
  const originalFetch = global.fetch;
  global.fetch = async file => ({ok:true, json: async () => json(file)});
  let payload;
  try { payload = await knowledge.load(); } finally { global.fetch = originalFetch; }
  for (const [code,version,letter,context,phase,drug,risk,population,result,pmid] of cases) {
    const route = code + '/' + context;
    const patient = json('data/patient-knowledge-contexts/' + route + '.json');
    const protocol = {protocol_id:'nccp-' + code + '-v' + version, metadata:{nccp_regimen_code:code}};
    const options = knowledge.regimenProfileForProtocol(protocol, payload).context_profiles;
    for (const name of oldChoices[code]) {
      assert(options.some(profile => profile.context_id === name), code + ' lost ' + name);
      assert.equal(knowledge.contextIdForProtocol(protocol,name),name);
    }
    assert.equal(knowledge.contextIdForProtocol({...protocol,selected_indication_id:code+letter}), context);
    assert.equal(knowledge.contextIdForProtocol(protocol,context), context);
    const profile = options.find(row => row.context_id === context);
    assert(profile, route + ' missing from client loader');
    assert.equal(profile.journey_key, code + ':' + context);
    assert.equal(profile.patient_resources.portal, 'patient/' + route + '/');
    assert.match(profile.evidence_at_a_glance.population, population);
    assert(profile.reference_links.some(x => x.url === 'https://pubmed.ncbi.nlm.nih.gov/' + pmid + '/'));
    const html = evidence.render(profile);
    assert.match(html, result);
    assert(!html.includes('undefined'), route + ' incomplete data in rendered clinician evidence');

    const selector = workflows.context_supportive_phase_selectors[code][context];
    assert.equal(selector.protocol_id,protocol.protocol_id);
    assert.deepEqual(selector.phases.map(p => p.id), [phase]);
    const plan = workflows.antiemetic_plans[selector.phases[0].plan_id];
    const prescription = patient.prescription_phases[0];
    assert.equal(plan.risk_level, risk);
    assert.equal(prescription.emetogenic_risk, risk);
    assert.equal(prescription.id, phase);
    assert.deepEqual(selector.phases[0].active_medicines, [drug]);
    assert.deepEqual(prescription.active_medicines, [drug]);
    assert.deepEqual(prescription.medicines.map(x => x.name), [...plan.day1,...plan.subsequent].map(x=>x.medicine));
    assert.equal(patient.indication_code,code+letter);
    if (code === '00385') assert.match(profile.administration.schedule, /five planned cycles/i);
    if (code === '00419') assert.match(profile.administration.schedule, /six cycles/i);
    if (code === '00812') {
      assert.match(profile.clinical_summary, /intolerance/);
      assert.match(profile.patient_selection.disease_and_biomarker_context,/no PD-L1 threshold/);
      assert.match(profile.administration.route_and_duration,/350 mg/);
    }
    if (context === 'cervical_maintenance') {
      assert.match(profile.evidence_at_a_glance.limitations.join(' '), /did not isolate the maintenance benefit/);
      assert.match(profile.clinical_summary, /bevacizumab/);
      assert.match(profile.administration.route_and_duration, code === '00455' ? /200 mg/ : /400 mg/);
      assert.match(profile.administration.schedule, code === '00455' ? /21 days/ : /42 days/);
    }
    assert.equal(knowledge.contextIdForProtocol(protocol), '', code+' should not invent a cervical indication');
  }
  console.log('Six cervical knowledge contexts passed population, evidence, schedule, prescription and preserved-indication checks.');
}
run().catch(error => { console.error(error); process.exitCode=1; });
