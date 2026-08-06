const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const moduleApi = require(path.join(root, 'js', 'regimen-knowledge-base.js'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'regimen-knowledge-base-v0600.json'), 'utf8'));
const integrity = JSON.parse(fs.readFileSync(path.join(root, 'V0600_PROTOCOL_JSON_HASHES.json'), 'utf8'));

assert.strictEqual(moduleApi.version, '0.60.0');
assert.strictEqual(data.schema_version, '1.2');
assert.strictEqual(data.release, '0.60.0');
assert.strictEqual(data.regimen_profiles.length, 15, 'The cumulative knowledge base must contain fifteen detailed regimen profiles.');
assert.strictEqual(data.drug_profiles.length, 25, 'The knowledge base must contain 25 drug profiles.');
assert.strictEqual(data.evidence_records.length, 21, 'The knowledge base must contain 21 evidence records.');
assert.ok(!/AI-assisted|AI-generated/i.test(JSON.stringify(data)), 'User-facing knowledge data must not display an AI-origin label.');

const expected = new Map([
  ['nccp-00227-v9', ['V303', '10744089', 'https://healthservice.hse.ie/documents/6563/227_v9_FOLFIRI.pdf']],
  ['nccp-00303-v6', ['GOG-158', '12860964', 'https://healthservice.hse.ie/documents/6709/303_V6_CARBOplatin_AUC5-7.5_PACLitaxel_175.pdf']],
  ['nccp-00579-v5a', ['KEYNOTE-407', '30280635', 'https://healthservice.hse.ie/documents/6887/579_V5a_pembrolizumab_carboplatin_paclitaxel.pdf']],
  ['nccp-00794-vcurrent', ['ASCENT', '33882206', 'https://healthservice.hse.ie/documents/6417/794_v3_Sacituzumab_Govitecan_Therapy.pdf']],
  ['nccp-00897-v3', ['TOPAZ-1', '38319896', 'https://healthservice.hse.ie/documents/6652/897_v3_Durvalumab_Gem_Cis.pdf']]
]);

const protocolMap = new Map();
const protocolHashes = {};
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.json')) {
      const raw = fs.readFileSync(full);
      const payload = JSON.parse(raw.toString('utf8'));
      if (payload.protocol_id) protocolMap.set(payload.protocol_id, payload);
      protocolHashes[path.relative(path.join(root, 'protocols'), full).replaceAll('\\', '/')] = crypto.createHash('sha256').update(raw).digest('hex');
    }
  }
})(path.join(root, 'protocols'));

const moduleRequirements = {
  patient_selection: ['treatment_intent', 'disease_and_biomarker_context', 'eligibility_orientation', 'important_cautions'],
  supportive_care: ['emetogenic_risk', 'premedication_and_prophylaxis', 'patient_education', 'special_support'],
  monitoring_and_toxicity: ['baseline', 'before_each_cycle', 'priority_toxicities', 'urgent_review_signals'],
  administration: ['cycle_and_sequence', 'route_and_duration', 'practical_workflow', 'observation_and_access']
};

for (const [protocolId, [trial, pmid, officialPdf]] of expected) {
  const protocol = protocolMap.get(protocolId);
  assert.ok(protocol, `Knowledge profile maps to missing protocol: ${protocolId}`);
  assert.strictEqual(protocol.metadata?.source_url, officialPdf, `Unexpected official source URL for ${protocolId}`);

  const profile = data.regimen_profiles.find(item => item.protocol_id === protocolId);
  assert.ok(profile, `Missing v0.60.0 profile: ${protocolId}`);
  for (const field of ['regimen_role', 'clinical_summary', 'treatment_setting', 'component_rationale', 'schedule_context', 'review_status', 'source_checked_date']) {
    assert.ok(profile[field], `Missing ${field} for ${protocolId}`);
  }
  assert.ok(Array.isArray(profile.key_points) && profile.key_points.length >= 4, `Insufficient key points for ${protocolId}`);
  assert.ok(/consultant/i.test(profile.review_status) && /pharmacy/i.test(profile.review_status), `Review boundary missing for ${protocolId}`);
  for (const [moduleName, fields] of Object.entries(moduleRequirements)) {
    assert.ok(profile[moduleName], `Missing ${moduleName} module for ${protocolId}`);
    for (const field of fields) {
      const value = profile[moduleName][field];
      assert.ok(Array.isArray(value) ? value.length >= 2 : String(value || '').length >= 20, `Incomplete ${moduleName}.${field} for ${protocolId}`);
    }
  }

  const record = data.evidence_records.find(item => item.protocol_id === protocolId && item.trial_acronym === trial);
  assert.ok(record, `Missing evidence record for ${protocolId}`);
  assert.strictEqual(String(record.pmid), pmid);
  for (const field of ['trial_population', 'intervention', 'comparator', 'primary_endpoint', 'relevance_summary', 'limitations', 'match_type', 'doi_url', 'source_checked_date']) {
    assert.ok(record[field], `Missing evidence ${field} for ${protocolId}`);
  }
  assert.ok(Array.isArray(record.key_findings) && record.key_findings.length >= 2, `Insufficient evidence findings for ${protocolId}`);
  assert.ok(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(record.publication_url), `Invalid PubMed URL for ${protocolId}`);
  assert.ok(/^https:\/\/doi\.org\//.test(record.doi_url), `Invalid DOI URL for ${protocolId}`);
}

const sacituzumab = data.drug_profiles.find(item => item.id === 'sacituzumab_govitecan');
assert.ok(sacituzumab, 'Missing sacituzumab govitecan drug profile.');
assert.ok(/Trop-2/i.test(sacituzumab.drug_class));
assert.ok(/topoisomerase I/i.test(sacituzumab.mechanism));

assert.strictEqual(integrity.baseline_release, '0.59.0');
assert.strictEqual(integrity.current_release, '0.60.0');
assert.strictEqual(integrity.protocol_json_count, 382);
assert.strictEqual(integrity.changed_from_v0590_count, 0);
assert.deepStrictEqual(protocolHashes, integrity.hashes, 'Protocol JSON files must remain byte-for-byte unchanged from v0.59.0.');

const source = fs.readFileSync(path.join(root, 'js', 'regimen-knowledge-base.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.strictEqual(pkg.version, '0.60.0');
assert.ok(source.includes('const VERSION = "0.60.0"'));
assert.ok(source.includes('data/regimen-knowledge-base-v0600.json'));
assert.ok(indexHtml.includes('SACTCheck v0.60.0 — Fifteen-Regimen Knowledge Base'));
assert.ok(indexHtml.includes('v0.60.0 · What changed?'));
assert.ok(indexHtml.includes('css/regimen-knowledge-base.css?v=0.60.0'));
assert.ok(indexHtml.includes('js/regimen-knowledge-base.js?v=0.60.0'));
assert.ok(indexHtml.includes('sacituzumab govitecan'));
assert.ok(indexHtml.includes('durvalumab–gemcitabine–cisplatin'));

console.log('v0.60.0 five-regimen knowledge-base expansion tests passed.');
