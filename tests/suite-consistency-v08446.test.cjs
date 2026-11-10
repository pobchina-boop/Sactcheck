'use strict';
// Current service contract: clinician and patient surfaces must expose the same
// authored timing, context, consent risks and support. PDF/layout QA is separate.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const json = f => JSON.parse(read(f));
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const normal = text => String(text).replace(/&#(?:039|39);/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace('granulocyte colony-stimulating factor (white-cell growth support) (G-CSF)', 'G-CSF').replace(/\s+/g, ' ').trim();
const codes = ['00261','00455','00483','00484','00558'];
const allRoutes = [...codes, ...codes.map(c => c + '/head_neck'), ...['00483','00484'].flatMap(c => [c+'/melanoma_adjuvant', c+'/melanoma_advanced'])];
const KB = json('data/regimen-knowledge-base-v08446-addendum.json');
const phases = json('data/phase-support-contexts-v08446.json');
const journeys = json('data/breast-treatment-journeys-v0837.json');
const registry = require('../js/patient-asset-registry-v0810.js');
const evidence = require('../js/treatment-evidence-v08413.js');
const journey = require('../js/treatment-journey-v0837.js');
const index = json('protocols/index.json').protocols;
let activeContext = '', checks = 0;
function ok(value, message) { assert(value, message); checks++; }
function equal(a, b, message) { assert.deepEqual(a, b, message); checks++; }
const target = {innerHTML: '', querySelector() { return null; }};
const overlay = {classList: {add(){}, remove(){}}, querySelector(s) { return s === '[data-regimen-info-content]' ? target : null; }};
const sandbox = {
  module: {exports: {}}, console,
  document: {readyState:'loading', addEventListener(){}, getElementById(){return overlay;}, body:{classList:{add(){}, remove(){}}}},
  fetch: async f => ({ok: true, json: async () => json(f)}),
  SACTCheckProtocolContext: {activeTumourGroup: () => activeContext},
  SACTCheckTreatmentEvidence: evidence,
  SACTCheckTreatmentJourney: journey
};
vm.runInNewContext(read('js/regimen-knowledge-base.js'), sandbox, {filename:'regimen-knowledge-base.js'});
const api = sandbox.module.exports;
(async () => {
  await api.load();
  for (const route of allRoutes) {
    const [code, context] = route.split('/');
    const d = json((context ? 'data/patient-knowledge-contexts/' : 'data/patient-knowledge/') + route + '.json');
    const p = json(index.find(x => x.path.includes('/' + code + '-')).path);
    const parent = KB.regimen_profiles.find(x => x.protocol_id === p.protocol_id);
    const selected = context || (code === '00261' ? 'breast' : 'lung');
    const profile = parent.context_profiles.find(x => x.context_id === selected);
    ok(profile, route + ' explicit clinician context');
    equal(profile.protocol_id, d.protocol_id, route + ' canonical identity');
    equal(profile.monitoring_and_toxicity.longitudinal_schedule, d.monitoring_schedule, route + ' clinician/patient monitoring matrix');
    if (!context) equal(parent.monitoring_and_toxicity.longitudinal_schedule, d.monitoring_schedule, route + ' root monitoring matrix');
    activeContext = selected;
    ok(api.open(p), route + ' clinician page opens');
    await Promise.resolve();
    const rendered = target.innerHTML;
    ok(!/could not be loaded|undefined|\[object Object\]/.test(rendered), route + ' clinician page renders');
    for (const row of d.monitoring_schedule.rows) for (const cell of row.cells) ok(rendered.includes(esc(cell)), route + ' rendered monitoring: ' + row.label);
    const consent = normal(read('patient/' + route + '/consent-form.html'));
    ok(consent.includes(normal(d.consent_support)), route + ' complete authored consent discussion');
    for (const agent of d.agents) for (const risk of agent.risks) ok(consent.includes(normal(risk)), route + ' consent risk retained: ' + risk);
    if (context !== 'head_neck') continue;
    ok(!profile.context_profiles, route + ' no inherited nested indication profiles');
    ok(parent.context_profiles.every(x => x.protocol_id === p.protocol_id), route + ' selectable contexts belong to same protocol');
    for (const key of ['before_each_cycle','ongoing','priority_toxicities','urgent_review_signals']) ok(profile.monitoring_and_toxicity[key]?.length, route + ' renderer-supported ' + key);
    for (const field of ['during_treatment','toxicity_priorities','longitudinal_monitoring']) ok(!Object.hasOwn(profile.monitoring_and_toxicity, field), route + ' no invisible unsupported field ' + field);
    equal(profile.monitoring_and_toxicity.before_each_cycle, [d.patient_summary.monitoring[1].when], route + ' cycle tests');
    equal(profile.monitoring_and_toxicity.urgent_review_signals, [d.patient_summary.card_alert], route + ' urgent action');
    ok(rendered.includes(esc(d.consent_support)), route + ' consent boundaries visible to clinician');
    ok(consent.includes(normal(d.schedule_summary)), route + ' complete consent schedule');
    equal(registry.relativePath(code, 'consent-draft', context), 'patient/' + route + '/consent-form.html', route + ' consent routing');
    equal(registry.relativePath(code, 'supportive-care-selector', context), 'patient/' + route + '/supportive-care.html', route + ' support routing');
    const j = journeys[code + ':head_neck'];
    equal(journey.definitions[code + ':head_neck'], j, route + ' live journey matches authored JSON');
    equal(j.summary, d.schedule_summary, route + ' journey schedule');
    equal(j.lanes.map(x => ({label:x.label, cells:x.cells})), d.monitoring_schedule.rows, route + ' journey monitoring');
    const plans = phases.regimens[code].head_neck;
    equal(plans.map(x => x.id), d.phases.filter(x => x.agents.length).map(x => x.id), route + ' exact current active-treatment support phases');
    for (const plan of plans) {
      const support = normal(read('patient/' + route + '/support-' + plan.id + '.html'));
      equal(plan.source_url, d.sources.find(x => x.id === 'nccp').url, route + ' support source');
      ok(support.includes('not an issued patient prescription'), route + ' unissued draft remains explicit');
      for (const text of plan.additional_support) ok(support.includes(normal(text)), route + ' support clause retained');
      for (const medicine of plan.medicines) for (const key of ['name','dose','timing','note']) ok(support.includes(normal(medicine[key])), route + ' prescription detail retained: ' + medicine.name + ' ' + key);
      if (code !== '00261') equal(plan.medicines, [], route + ' no invented immune prophylactic prescription');
      else {
        const reviewed = json('data/phase-support-v0838.json').regimens['00261'][0];
        equal(plan.medicines, reviewed.medicines, route + ' same reviewed dedicated NCIS AUC >=4 row');
        equal(plan.medicines.map(x => x.name.split(' · ')[0]), ['Aprepitant','Ondansetron','Dexamethasone','Metoclopramide'], route + ' exact dedicated carboplatin components');
        equal(plan.guidance.url, reviewed.guidance.url, route + ' exact antiemetic source');
        ok(/duration.*prescription|prescription.*duration/i.test(plan.medicines[3].name), route + ' metoclopramide duration remains explicit');
        ok(/does not specify an end day/.test(plan.medicines[3].timing), route + ' no invented end day');
        ok(/individual.*review|review.*individual/i.test(support), route + ' individual prescription review');
      }
    }
    const ep = evidence.render(profile);
    for (const endpoint of profile.evidence_at_a_glance.endpoints) ok(ep.includes(endpoint.result_text), route + ' evidence endpoint visible');
  }
  console.log(JSON.stringify({status:'passed', release:'0.84.46', routes:allRoutes.length, checks, limitations:['Visual rendering, PDFs and independent clinical review remain separate checks.']}));
})().catch(error => {console.error(error); process.exitCode=1;});
