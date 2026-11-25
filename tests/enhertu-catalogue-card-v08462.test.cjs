'use strict';
// Source-based catalogue acceptance for the two existing NCCP00776 contexts.
// The real sidecar loader and renderer run in a minimal DOM fixture; this is
// software verification, not a substitute for the blocked browser acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const base = 'f3b923b247b5663b2bd90b2ffb352fccc5a347ea';
const id = 'nccp-00776-v3b';
const sourceSha = '822e5b568e1b8b2b618b7fa93cacdd485192fef3c5bfdff6005f1b22570b7c6a';
const read = f => fs.readFileSync(path.join(root, f));
const json = f => JSON.parse(read(f));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const old = f => cp.execFileSync('git', ['show', base + ':' + f], {cwd: root, maxBuffer: 8 * 1024 * 1024});
const Metadata = require('../js/regimen-course-metadata.js');
const Title = require('../js/regimen-display-title.js');
const schema = json('protocols/breast/00776-trastuzumab-deruxtecan.json');
const sidecarPath = 'data/regimen-card-metadata.json';
const overridesPath = 'data/regimen-card-overrides.json';
const reportPath = 'REGIMEN_CARD_METADATA_REVIEW.csv';
const sidecar = json(sidecarPath);
const originalSidecar = JSON.parse(old(sidecarPath));
const overrides = json(overridesPath);
const originalOverrides = JSON.parse(old(overridesPath));
const item = sidecar.protocols.find(p => p.id === id);
const override = overrides.protocols[id];
// The v63 successor is limited to the two source-reviewed olaparib records.
// Authenticate its actual bytes before reading the inherited Enhertu state;
// the original 377-record preservation assertions still run against that state.
const olaparib = ['0.84.63','0.84.64','0.84.65'].includes(json('package.json').version) ? require('./helpers/retrospective-v08463.cjs') : null;
const inheritedSidecar = olaparib ? olaparib.baselineJson(sidecarPath) : sidecar;
const inheritedOverrides = olaparib ? olaparib.baselineJson(overridesPath) : overrides;
const inheritedReport = olaparib ? olaparib.baselineBytes(reportPath) : read(reportPath);
if (olaparib) olaparib.assertCurrent(reportPath, sha(inheritedReport), inheritedReport.length);

assert.equal(sha(read('validation/enhertu-review-v08462/sources/nccp-00776-v3b.pdf')), sourceSha);
assert.equal(item.path, 'protocols/breast/00776-trastuzumab-deruxtecan.json');
assert.equal(item.nccp_code, '00776');
assert.equal(item.tumour_group, 'Breast');
assert.equal(Title.forProtocol(schema), 'Trastuzumab deruxtecan');
assert.match(schema.metadata.title, /5\.4 mg\/kg.*Enhertu/);
assert.deepEqual(schema.metadata.treatment_class, ['her2_targeted_therapy', 'antibody_drug_conjugate']);
assert.match(schema.metadata.indication, /monotherapy.*unresectable or metastatic.*HER2-positive or HER2-low/i);
assert.deepEqual(schema.indications.map(c => c.code), ['00776a', '00776b']);
for (const c of schema.indications) assert.match(c.description, /^Unresectable\/metastatic/);

assert.equal(override.provenance.source_sha256, sourceSha);
assert.equal(override.provenance.source_version, '3b');
assert.equal(override.provenance.source_page, 1);
assert.equal(override.provenance.reviewed, false, 'Source mapping does not imply human clinical approval');
assert.deepEqual(override.contexts.map(c => c.id), ['00776a', '00776b']);
for (const c of override.contexts) {
  assert.equal(c.indication_id, c.id);
  assert.equal(c.intent, 'advanced_disease');
  assert.equal(c.cycle_length_days, 21);
  assert.equal(c.duration_type, 'until_progression_or_toxicity');
  assert.equal(c.duration_text, 'Until disease progression or unacceptable toxicity');
  assert.equal(c.planned_cycles, undefined);
  assert.equal(c.maximum_cycles, undefined);
}
const runtimeProtocol = {protocol_id: item.id, metadata: {nccp_regimen_code: item.nccp_code, regimen_card: item.regimen_card}};
const summary = Metadata.summarise(runtimeProtocol);
assert.deepEqual(schema.metadata.regimen_card, item.regimen_card, 'The raw-protocol fallback carries the exact canonical card metadata');
assert.deepEqual(Metadata.summarise(schema).tokens, summary.tokens, 'Raw-protocol fallback must not re-infer prior adjuvant therapy as current intent');
const overrideSummary = Metadata.summarise({...schema, metadata: {...schema.metadata, regimen_card: override}});
assert.deepEqual(overrideSummary.tokens, summary.tokens, 'Authoring override, embedded metadata and sidecar agree');
assert.equal(summary.intent, 'Advanced disease');
assert.equal(summary.duration, 'Until progression/toxicity');
assert.equal(summary.interval, 'q21d');
assert.equal(summary.complete, true);
assert.deepEqual(summary.unresolved, []);
assert.equal(item.regimen_card.provenance.reviewed, false);
assert.equal(summary.contexts.length, 2);
for (const c of summary.contexts) {
  assert.equal(c.intent_label, 'Advanced disease');
  assert.equal(c.duration.type, 'until_progression_or_toxicity');
  assert.equal(c.duration.label, 'Until progression/toxicity');
  assert.equal(c.duration.planned_cycles, undefined);
  assert.equal(c.duration.maximum_cycles, undefined);
}

const withoutTarget = value => ({...value, protocols: value.protocols.filter(p => p.id !== id)});
assert.deepEqual(withoutTarget(inheritedSidecar), withoutTarget(originalSidecar), 'All 377 other sidecar entries and container metadata are unchanged in the authenticated Enhertu state');
const otherOverrides = structuredClone(inheritedOverrides);
delete otherOverrides.protocols[id];
assert.deepEqual(otherOverrides, originalOverrides, 'Only the 00776 override was added');
const withoutTargetRow = bytes => bytes.toString().split('\n').filter(line => !line.includes(',' + id + ','));
assert.deepEqual(withoutTargetRow(inheritedReport), withoutTargetRow(old(reportPath)), 'All other CSV rows remain byte-identical in the authenticated Enhertu state');
if (olaparib) {
  const successors = new Set(['nccp-00588-v5b', 'nccp-00746-v2', 'nccp-00862-v2', 'nccp-00929-v1']);
  const withoutOlaparib = value => ({...value, protocols: value.protocols.filter(p => !successors.has(p.id))});
  assert.deepEqual(withoutOlaparib(require('./helpers/live-release-v08464.cjs').approvedJson(sidecarPath)), withoutOlaparib(inheritedSidecar), 'Only the two authenticated olaparib sidecar records may succeed the Enhertu state; all other 376 records remain exact');
  const withoutOlaparibOverrides = value => {
    const copy = structuredClone(value);
    for (const successor of successors) delete copy.protocols[successor];
    return copy;
  };
  assert.deepEqual(withoutOlaparibOverrides(require('./helpers/live-release-v08464.cjs').approvedJson(overridesPath)), withoutOlaparibOverrides(inheritedOverrides), 'Only the two named olaparib overrides may be added after Enhertu');
  const withoutOlaparibRows = bytes => bytes.toString().split('\n').filter(line => ![...successors].some(successor => line.includes(',' + successor + ',')));
  assert.deepEqual(withoutOlaparibRows((require('./helpers/live-release-v08464.cjs').verifyFile(reportPath), cp.execFileSync('git',['show','68063d01357a61bf5ec9dffcb7e6ccdc0145d2a7:'+reportPath],{cwd:root}))), withoutOlaparibRows(inheritedReport), 'All 374 unrelated CSV rows, including Enhertu, remain byte-identical after olaparib');
  for (const file of ['protocols/shared/00588-olaparib-tablet-monotherapy.json', 'protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json']) olaparib.validateProtocol(json(file));
}
for (const f of ['js/regimen-course-metadata.js', 'js/regimen-card-metadata.js', 'tools/add-regimen-card-metadata.js']) {
  assert(read(f).equals(old(f)), 'The generic metadata logic and renderer remain unchanged: ' + f);
}

class Element {
  constructor(tag) { this.tagName = tag; this.dataset = {}; this.children = []; this.attributes = {}; this.className = ''; this.textContent = ''; }
  setAttribute(k, v) { this.attributes[k] = v; }
  replaceChildren() { this.children = []; }
  appendChild(child) { this.children.push(child); return child; }
  querySelector(selector) { return selector.includes('data-sactcheck-course-meta') ? this.children.find(c => c.dataset.sactcheckCourseMeta === 'true') || null : null; }
  closest(selector) { return selector === '.regimen-card' ? this : null; }
}

(async () => {
  const card = new Element('article');
  card.dataset.protocolId = id;
  card.dataset.name = 'trastuzumab deruxtecan Enhertu NCCP 00776 Breast';
  const events = [];
  const requests = [];
  const document = {
    readyState: 'loading', body: null, addEventListener() {},
    createElement: tag => new Element(tag), getElementById: () => null,
    querySelectorAll: () => [card], dispatchEvent: e => events.push(e)
  };
  const context = {document, console, SACTCheckRegimenCourseMetadata: Metadata,
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    fetch: async (url, options) => { requests.push({url, options}); assert.equal(url, sidecarPath); return {ok: true, json: async () => sidecar}; }
  };
  vm.createContext(context);
  vm.runInContext(read('js/drug-aliases.js').toString(), context);
  assert.deepEqual(Array.from(context.SACTCheckDrugAliases.forProtocol(schema)), ['Enhertu'], 'Actual alias resolver keeps the correct brand and suppresses trastuzumab-only brands');
  vm.runInContext(read('js/regimen-card-metadata.js').toString(), context);
  const api = context.SACTCheckRegimenCardMetadata;
  await api.loadLibrary();
  assert.equal(api.renderAll(), 1, 'Actual sidecar-to-card matching renders only the requested fixture');
  const row = card.children[0];
  assert.deepEqual(row.children.map(c => ({field: c.dataset.courseField, text: c.textContent})), [
    {field: 'intent', text: 'Advanced disease'},
    {field: 'duration', text: 'Until progression/toxicity'},
    {field: 'interval', text: 'q21d'}
  ]);
  assert.equal(row.attributes['aria-label'], 'Treatment course: Advanced disease, Until progression/toxicity, q21d');
  assert.equal(row.title, 'Advanced disease · Until progression/toxicity · q21d');
  assert(!/adjuvant/i.test(row.attributes['aria-label'] + row.title));
  assert.equal(card.dataset.courseMetadata, 'complete');
  assert.equal(row.dataset.metadataComplete, 'true');
  assert.match(card.dataset.name, /advanced disease until progression\/toxicity q21d/);
  assert.equal(requests.length, 1, 'Production loader uses the canonical sidecar');
  assert.equal(events[0].detail.available, 378);
  assert.equal(api.renderAll(), 1);
  assert.equal(card.children.length, 1, 'Re-render does not duplicate the metadata strip');

  // Exercise the actual compatibility loader when the preferred asset fails.
  // Every protocol comes from the real local catalogue; there is no network.
  for (const failure of ['404', 'invalid-schema']) {
    const fallbackCard = new Element('article');
    fallbackCard.dataset.protocolId = id;
    fallbackCard.dataset.name = 'Enhertu NCCP 00776 Breast';
    const fallbackRequests = [];
    const fallbackDocument = {...document, querySelectorAll: () => [fallbackCard]};
    const fallbackContext = {...context, document: fallbackDocument,
      fetch: async url => {
        fallbackRequests.push(url);
        if (url === sidecarPath) return failure === '404'
          ? {ok: false, status: 404}
          : {ok: true, json: async () => ({schema_version: 'invalid', protocols: []})};
        assert(url === 'protocols/index.json' || url.startsWith('protocols/'));
        return {ok: true, json: async () => json(url)};
      }
    };
    vm.createContext(fallbackContext);
    vm.runInContext(read('js/regimen-card-metadata.js').toString(), fallbackContext);
    const fallback = fallbackContext.SACTCheckRegimenCardMetadata;
    await fallback.loadLibrary();
    assert.equal(fallback.renderAll(), 1, failure + ': only the 00776 card fixture is matched');
    const fallbackRow = fallbackCard.children[0];
    assert.deepEqual(fallbackRow.children.map(c => c.textContent), summary.tokens, failure + ': fallback displays all correct source tokens');
    assert.equal(fallbackRow.title, row.title);
    assert.equal(fallbackRow.attributes['aria-label'], row.attributes['aria-label']);
    assert.equal(fallbackCard.dataset.courseMetadata, 'complete');
    assert(fallbackRequests.includes('protocols/breast/00776-trastuzumab-deruxtecan.json'));
    assert.equal(fallbackRequests.length, 380, failure + ': preferred sidecar, catalogue and all 378 protocol fallback loads exercised');
  }

  const before = new Map([sidecarPath, reportPath].map(f => [f, read(f)]));
  cp.execFileSync(process.execPath, ['tools/add-regimen-card-metadata.js'], {cwd: root, stdio: 'pipe'});
  for (const [f, bytes] of before) assert(read(f).equals(bytes), 'Canonical card generator is byte-idempotent: ' + f);
  console.log('Enhertu catalogue source, two advanced-disease contexts, indefinite duration, actual sidecar renderer and both unavailable/invalid-sidecar fallback paths, brand/code/tissue/route identity and generator idempotence passed. ' + (olaparib ? 'The original 377-record preservation check passed against the authenticated Enhertu state; 376 current records remain exact after only the two authenticated olaparib successors.' : 'All 377 unrelated records remain unchanged.') + ' Browser acceptance remains separate.');
})().catch(error => { console.error(error); process.exitCode = 1; });
