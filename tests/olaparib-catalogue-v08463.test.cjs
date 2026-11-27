'use strict';
const {total: liveProtocolCount} = require('./helpers/live-inventory-v08462.cjs');
const release = require('./helpers/live-release-v08464.cjs');
// Actual catalogue loader/renderer and source-specific card contracts. The DOM
// fixture verifies software behaviour; real browser acceptance is separate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const Migration = require('./helpers/retrospective-v08463.cjs');
const Metadata = require('../js/regimen-course-metadata.js');
const read = file => fs.readFileSync(path.join(root, file));
const json = file => JSON.parse(read(file));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sidecarPath = 'data/regimen-card-metadata.json';
const overridesPath = 'data/regimen-card-overrides.json';
const reportPath = 'REGIMEN_CARD_METADATA_REVIEW.csv';
const sidecar = json(sidecarPath), overrides = json(overridesPath);
const files = {
  '00588': 'protocols/shared/00588-olaparib-tablet-monotherapy.json',
  '00746': 'protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json'
};
const protocols = Object.fromEntries(Object.entries(files).map(([code, file]) => [code, json(file)]));
const expectedIds = {
  '00588': ['first_line_advanced_ovarian_maintenance', 'platinum_sensitive_relapsed_ovarian_maintenance', 'mcrpc_brca_monotherapy', 'adjuvant_high_risk_early_breast', 'pancreatic_maintenance'],
  '00746': ['00746-gyn']
};
const expectedIntents = ['maintenance', 'maintenance', 'advanced_disease', 'adjuvant', 'maintenance'];
const summaries = {};
assert.equal(sidecar.schema_version, '1.0.0');
assert.equal(sidecar.protocol_count, liveProtocolCount);
assert.equal(sidecar.protocols.length, liveProtocolCount);

for (const code of Object.keys(files)) {
  const protocol = protocols[code], id = protocol.protocol_id;
  const card = protocol.metadata.regimen_card, override = overrides.protocols[id];
  const entry = sidecar.protocols.find(item => item.id === id);
  assert(entry && card && override, code + ' must exist in override, sidecar and raw-protocol fallback');
  assert.equal(entry.path, files[code]);
  assert.equal(entry.nccp_code, code);
  assert.deepEqual(card, entry.regimen_card, code + ' raw fallback is the exact canonical sidecar card');
  assert.deepEqual(card.contexts.map(context => context.id), expectedIds[code]);
  assert.deepEqual(card.contexts.map(context => context.indication_id), expectedIds[code]);
  assert.deepEqual(override.contexts.map(context => context.indication_id), expectedIds[code]);
  assert.equal(card.provenance.reviewed, false, 'Source reconciliation is not independent clinical authorisation');
  assert.equal(override.provenance.reviewed, false);
  assert.equal(card.provenance.source, protocol.metadata.source_url);
  assert.equal(card.provenance.source_version, code === '00588' ? '6' : '2');
  assert.equal(card.provenance.checked_date, '2026-11-24');
  const normalized = Metadata.serialisableRegimenCard({...protocol, metadata: {...protocol.metadata, regimen_card: override}});
  normalized.provenance = {...normalized.provenance, ...override.provenance};
  assert.deepEqual(normalized, card, code + ' source override serializes to the published card without losing duration conditions');
  const summary = Metadata.summarise(protocol);
  summaries[code] = summary;
  assert.equal(summary.complete, true);
  assert.equal(entry.complete, true);
  assert.deepEqual(summary.unresolved, []);
  assert.deepEqual(entry.unresolved, []);
  for (const context of summary.contexts) {
    assert.equal(context.duration.planned_cycles, undefined, code + ' must not invent a fixed cycle count');
    assert.equal(context.duration.maximum_cycles, undefined, code + ' must not convert calendar duration into cycles');
    const indication = protocol.indications.find(item => item.indication_id === context.indication_id);
    assert(indication, code + ' card uses an existing exact clinical indication');
    assert.deepEqual(card.provenance.context_reimbursement_codes[context.indication_id], indication.reimbursement_codes, code + ' context retains its correct reimbursement codes');
  }
}

const mono = protocols['00588'].metadata.regimen_card;
assert.deepEqual(mono.contexts.map(context => context.intent), expectedIntents);
assert.deepEqual(Object.values(mono.provenance.context_reimbursement_codes).flat(), Array.from('abcdefghi', suffix => '00588' + suffix));
assert.equal(summaries['00588'].duration, 'Indication-dependent', 'The catalogue cannot present the prostate duration as a universal olaparib course');
assert.equal(summaries['00588'].intent, 'Maintenance / Advanced disease / Adjuvant');
assert.equal(summaries['00588'].interval, 'Continuous tablets twice daily');
for (const context of mono.contexts) {
  assert.equal(context.cycle_length_days, undefined, 'A 28-day reference/monitoring window is not a tablet treatment cycle');
  assert.equal(context.source_schedule_interval_label, 'Continuous tablets twice daily');
  assert(!/q28|28.day|rest|bevacizumab/i.test(JSON.stringify(context)), 'No planned rest cycle or combination drug in a monotherapy card');
  assert(!/^00588-(?:gu|gi|gyn)$/.test(context.id), 'Legacy tissue aliases cannot replace the five current settings');
}
const first = mono.contexts[0], breast = mono.contexts[3];
assert.equal(first.duration_type, 'fixed_duration');
assert.match(first.duration_text, /stop at 2 years if no radiological disease/i);
assert.match(first.duration_text, /beyond 2 years only for residual disease with clinical benefit/i);
assert.match(first.duration_text, /stop earlier for progression\/toxicity/i);
assert.equal(protocols['00588'].indications[0].duration.maximum_years_if_no_radiological_evidence_of_disease, 2);
assert.equal(protocols['00588'].indications[0].duration.beyond_two_years_allowed_if_residual_disease_and_clinical_benefit, true);
assert.equal(breast.duration_type, 'fixed_duration');
assert.match(breast.duration_text, /^Up to 1 year; stop earlier for recurrence or unacceptable toxicity$/);
assert.equal(protocols['00588'].indications[3].duration.maximum_years, 1);
for (const id of ['platinum_sensitive_relapsed_ovarian_maintenance', 'mcrpc_brca_monotherapy', 'pancreatic_maintenance']) {
  const context = mono.contexts.find(item => item.id === id);
  assert.equal(context.duration_type, 'until_progression_or_toxicity');
  assert.equal(context.duration_text, 'Until progression/toxicity');
  assert(!/year|month|cycle|\d/.test(context.duration_text), id + ' must not inherit the breast or first-line ovarian stopping rule');
  const duration = protocols['00588'].indications.find(item => item.indication_id === id).duration;
  assert.equal(duration.maximum_years, undefined);
  assert.equal(duration.maximum_years_if_no_radiological_evidence_of_disease, undefined);
}
const retained = mono.provenance.retained_source;
assert.equal(retained.status, 'historical_retained_original');
assert.equal(retained.checked_date, '2026-11-16');
assert.equal(sha(read(retained.path)), retained.sha256, 'Retained source is authenticated without claiming a fresh original download');
assert.match(mono.provenance.source_verification, /HSE original PDF retrieved/);

const combo = protocols['00746'].metadata.regimen_card, combination = combo.contexts[0];
assert.equal(combination.intent, 'maintenance');
assert.equal(combination.cycle_length_days, 21, 'The explicit interval belongs to bevacizumab infusion/review');
assert.equal(combination.source_schedule_interval_label, 'Olaparib continuously twice daily + bevacizumab every 21 days');
assert.equal(combo.provenance.duration_model, 'component_specific');
assert.match(combination.duration_text, /Olaparib: stop at 2 years if no radiological disease; longer only for residual disease with clinical benefit/);
assert.match(combination.duration_text, /Bevacizumab: up to 15 months total including prior chemotherapy/);
assert.match(combination.duration_text, /Stop earlier for progression\/toxicity/);
assert(!/1 year|one year|adjuvant|prostate|pancreatic|relapsed/i.test(combination.duration_text));
assert(!['Indication-dependent', 'Continuous', 'Until progression/toxicity'].includes(summaries['00746'].duration), 'The combination card must expose both distinct component clocks');
assert.equal(protocols['00746'].indications[0].duration.bevacizumab.maximum_total_months_including_chemotherapy, 15);
assert.equal(protocols['00746'].indications[0].duration.olaparib.maximum_years_if_no_radiological_evidence_of_disease, 2);
assert.equal(protocols['00746'].indications[0].duration.olaparib.beyond_two_years_allowed_if_residual_disease_and_clinical_benefit, true);
for (const [code,card] of [['00588',mono],['00746',combo]]) assert.equal(card.provenance.source_sha256, sha(read('validation/olaparib-source-20261124/'+code+'.pdf')));
assert.match(combo.provenance.source_verification, /HSE original PDF retrieved/);

// Preserve all inherited cards outside the four source-reconciled successors.
const successors = new Set(Object.values(protocols).map(protocol => protocol.protocol_id));
for (const [id, interval, duration] of [
  ['nccp-00862-v2', 'Continuous tablets once daily', 'Until progression/toxicity'],
  ['nccp-00929-v1', 'Combination every 21 days; first maintenance dose 3 weeks after cycle 6, then every 42 days', 'Six combination cycles followed by dostarlimab maintenance for up to 3 years, stopping earlier for progression or unacceptable toxicity']
]) {
  const contexts = overrides.protocols[id].contexts;
  assert.equal(contexts.length, id === 'nccp-00862-v2' ? 2 : 1);
  for (const context of contexts) {
    assert.equal(context.source_schedule_interval_label, interval);
    assert.equal(context.duration_text, duration);
  }
  const entry = sidecar.protocols.find(row => row.id === id);
  assert(entry.complete);
  assert.deepEqual(entry.regimen_card.contexts, contexts.map(c => ({...c, intent_label: c.intent === 'maintenance' ? 'Maintenance' : 'Advanced disease'})));
  successors.add(id);
}
const withoutTargets = value => ({...value, protocols: value.protocols.filter(item => !successors.has(item.id))});
assert.deepEqual(withoutTargets(release.astraJson(sidecarPath)), withoutTargets(JSON.parse(Migration.baselineBytes(sidecarPath))));
const withoutTargetOverrides = value => {
  const copy = structuredClone(value);
  for (const id of successors) delete copy.protocols[id];
  return copy;
};
assert.deepEqual(withoutTargetOverrides(release.astraJson(overridesPath)), withoutTargetOverrides(JSON.parse(Migration.baselineBytes(overridesPath))));
const withoutTargetRows = bytes => bytes.toString().split('\n').filter(line => ![...successors].some(id => line.includes(',' + id + ',')));
assert.deepEqual(withoutTargetRows(release.astraBytes(reportPath)), withoutTargetRows(Migration.baselineBytes(reportPath)));
for (const file of ['js/regimen-course-metadata.js', 'js/regimen-card-metadata.js', 'tools/add-regimen-card-metadata.js']) assert(release.beforeStartupBytes(file).equals(Migration.baselineBytes(file)), 'Shared metadata baseline is preserved through the authenticated startup change: ' + file);

class Element {
  constructor(tag) { this.tagName = tag; this.dataset = {}; this.children = []; this.attributes = {}; this.className = ''; this.textContent = ''; }
  setAttribute(key, value) { this.attributes[key] = value; }
  replaceChildren() { this.children = []; }
  appendChild(child) { this.children.push(child); return child; }
  querySelector(selector) { return selector.includes('data-sactcheck-course-meta') ? this.children.find(child => child.dataset.sactcheckCourseMeta === 'true') || null : null; }
  closest(selector) { return selector === '.regimen-card' ? this : null; }
}

(async () => {
  const renderedTitles = {};
  for (const availability of ['sidecar', '404', 'invalid-schema']) {
    const cards = Object.entries(protocols).map(([code, protocol]) => {
      const card = new Element('article'); card.dataset.protocolId = protocol.protocol_id; card.dataset.name = 'Lynparza olaparib NCCP ' + code; return card;
    });
    const requests = [], events = [];
    const document = {readyState: 'loading', body: null, addEventListener() {}, createElement: tag => new Element(tag), getElementById: () => null, querySelectorAll: () => cards, dispatchEvent: event => events.push(event)};
    const context = {document, console, SACTCheckRegimenCourseMetadata: Metadata,
      CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
      fetch: async url => {
        requests.push(url);
        if (url === sidecarPath) return availability === '404' ? {ok: false, status: 404} : {ok: true, json: async () => availability === 'invalid-schema' ? {schema_version: 'invalid', protocols: []} : sidecar};
        assert(url === 'protocols/index.json' || url.startsWith('protocols/'));
        return {ok: true, json: async () => json(url)};
      }
    };
    vm.createContext(context);
    vm.runInContext(read('js/regimen-card-metadata.js').toString(), context);
    const api = context.SACTCheckRegimenCardMetadata;
    await api.loadLibrary();
    assert.equal(api.renderAll(), 2, availability + ': only the two requested catalogue cards are matched');
    Object.keys(protocols).forEach((code, index) => {
      const card = cards[index], row = card.children[0], tokens = summaries[code].tokens;
      assert.deepEqual(row.children.map(child => child.textContent), tokens, availability + ': source tokens survive the real loader and renderer');
      assert.equal(row.attributes['aria-label'], 'Treatment course: ' + tokens.join(', '));
      if (code === '00588') {
        assert.equal(row.title.split('\n').length, 4, 'The tooltip retains four distinct source course labels; the two identical uncapped maintenance labels are deduplicated');
        assert.match(row.title, /Maintenance · Stop at 2 years if no radiological disease/);
        assert.match(row.title, /Maintenance · Until progression\/toxicity · Continuous tablets twice daily/);
        assert.match(row.title, /Advanced disease · Until progression\/toxicity · Continuous tablets twice daily/);
        assert.match(row.title, /Adjuvant · Up to 1 year; stop earlier for recurrence or unacceptable toxicity/);
      } else assert.equal(row.title, tokens.join(' · '));
      if (availability === 'sidecar') renderedTitles[code] = row.title;
      else assert.equal(row.title, renderedTitles[code], 'Fallback retains every source-specific tooltip condition');
      assert.equal(card.dataset.courseMetadata, 'complete');
      assert.equal(row.dataset.metadataComplete, 'true');
      assert(!/q28d/.test(row.title + row.attributes['aria-label']));
    });
    assert.equal(events[0].detail.available, liveProtocolCount);
    assert.equal(requests.length, availability === 'sidecar' ? 1 : 2 + liveProtocolCount);
    if (availability !== 'sidecar') for (const file of Object.values(files)) assert(requests.includes(file));
    assert.equal(api.renderAll(), 2);
    for (const card of cards) assert.equal(card.children.length, 1, 'Re-render does not duplicate the metadata strip');
  }
  const generatedBefore = new Map([sidecarPath, reportPath].map(file => [file, read(file)]));
  const protocolBefore = new Map(json('protocols/index.json').protocols.filter(entry => entry.enabled !== false && entry.path).map(entry => [entry.path, sha(read(entry.path))]));
  cp.execFileSync(process.execPath, ['tools/add-regimen-card-metadata.js'], {cwd: root, stdio: 'pipe'});
  for (const [file, bytes] of generatedBefore) assert(read(file).equals(bytes), 'Standard card generation is byte-idempotent: ' + file);
  for (const [file, hash] of protocolBefore) assert.equal(sha(read(file)), hash, 'Default card generation cannot rewrite clinical protocols: ' + file);
  console.log('Olaparib catalogue passed: five exact monotherapy settings, conditional 1/2-year and uncapped courses, independent combination clocks, continuous tablets, sidecar and both actual fallback paths, 374 unrelated entries preserved and both named gynaecology successors checked, source provenance and byte-idempotent standard generation. Browser acceptance remains separate.');
})().catch(error => { console.error(error); process.exitCode = 1; });
