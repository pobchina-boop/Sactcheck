const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const moduleApi = require(path.join(root, 'js', 'regimen-knowledge-base.js'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'regimen-knowledge-base-v0580.json'), 'utf8'));
const integrity = JSON.parse(fs.readFileSync(path.join(root, 'V0590_PROTOCOL_JSON_HASHES.json'), 'utf8'));

assert.ok(Number(moduleApi.version.split('.').slice(0, 2).join('.')) >= 0.58, 'Current knowledge module must remain compatible with v0.58.0 data.');
assert.strictEqual(data.schema_version, '1.2');
assert.strictEqual(data.release, '0.58.0');
assert.strictEqual(data.regimen_profiles.length, 10, 'The cumulative knowledge base must contain ten detailed regimen profiles.');
assert.ok(!JSON.stringify(data).includes('AI-assisted'), 'User-facing knowledge data must not display an AI-origin label.');

const expected = new Map([
  ['nccp-00209-v10a', ['MOSAIC', '15175436']],
  ['nccp-00515-v7', ['PRODIGE 24 / CCTG PA.6', '30575490']],
  ['nccp-00722-v2', ['TRYPHAENA', '23704196']],
  ['nccp-00619-vcurrent', ['monarchE', '32954927']],
  ['nccp-00831-v2a', ['IMbrave150', '32402160']]
]);

const protocolIds = new Set();
const protocolHashes = {};
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.json')) {
      const raw = fs.readFileSync(full);
      const payload = JSON.parse(raw.toString('utf8'));
      if (payload.protocol_id) protocolIds.add(payload.protocol_id);
      protocolHashes[path.relative(path.join(root, 'protocols'), full).replaceAll('\\', '/')] = crypto.createHash('sha256').update(raw).digest('hex');
    }
  }
})(path.join(root, 'protocols'));

for (const [protocolId, [trial, pmid]] of expected) {
  assert.ok(protocolIds.has(protocolId), `Knowledge profile maps to missing protocol: ${protocolId}`);
  const profile = data.regimen_profiles.find(item => item.protocol_id === protocolId);
  assert.ok(profile, `Missing v0.58.0 profile: ${protocolId}`);
  for (const field of ['regimen_role', 'clinical_summary', 'treatment_setting', 'component_rationale', 'schedule_context', 'review_status', 'source_checked_date']) {
    assert.ok(profile[field], `Missing ${field} for ${protocolId}`);
  }
  assert.ok(Array.isArray(profile.key_points) && profile.key_points.length >= 4, `Insufficient key points for ${protocolId}`);

  const moduleRequirements = {
    patient_selection: ['treatment_intent', 'disease_and_biomarker_context', 'eligibility_orientation', 'important_cautions'],
    supportive_care: ['emetogenic_risk', 'premedication_and_prophylaxis', 'patient_education', 'special_support'],
    monitoring_and_toxicity: ['baseline', 'before_each_cycle', 'priority_toxicities', 'urgent_review_signals'],
    administration: ['cycle_and_sequence', 'route_and_duration', 'practical_workflow', 'observation_and_access']
  };
  for (const [moduleName, fields] of Object.entries(moduleRequirements)) {
    assert.ok(profile[moduleName], `Missing ${moduleName} module for ${protocolId}`);
    for (const field of fields) {
      const value = profile[moduleName][field];
      assert.ok(Array.isArray(value) ? value.length >= 2 : String(value || '').length >= 20, `Incomplete ${moduleName}.${field} for ${protocolId}`);
    }
  }

  const record = data.evidence_records.find(item => item.protocol_id === protocolId);
  assert.ok(record, `Missing evidence record for ${protocolId}`);
  assert.strictEqual(record.trial_acronym, trial);
  assert.strictEqual(String(record.pmid), pmid);
  for (const field of ['trial_population', 'intervention', 'comparator', 'primary_endpoint', 'limitations', 'match_type', 'doi_url', 'source_checked_date']) {
    assert.ok(record[field], `Missing evidence ${field} for ${protocolId}`);
  }
  assert.ok(Array.isArray(record.key_findings) && record.key_findings.length >= 2, `Insufficient evidence findings for ${protocolId}`);
  assert.ok(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(record.publication_url), `Invalid primary PubMed URL for ${protocolId}`);
  assert.ok(/^https:\/\/doi\.org\//.test(record.doi_url), `Invalid DOI URL for ${protocolId}`);
}

assert.strictEqual(integrity.protocol_json_count, 382);
assert.strictEqual(integrity.current_release, '0.59.0');
assert.strictEqual(integrity.changed_from_v0581_count, 74);
assert.deepStrictEqual(protocolHashes, integrity.hashes, 'Current protocol JSON hashes do not match the v0.59.0 integrity register.');

const source = fs.readFileSync(path.join(root, 'js', 'regimen-knowledge-base.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'regimen-knowledge-base.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(/data\/regimen-knowledge-base-v0(?:580|600|603)\.json/.test(source));
assert.ok(source.includes('Treatment intent and patient selection'));
assert.ok(source.includes('Supportive care'));
assert.ok(source.includes('Monitoring and toxicity'));
assert.ok(source.includes('Administration and practical workflow'));
assert.ok(css.includes('.regimen-module-grid'));
assert.ok(css.includes('.regimen-module-alert'));
assert.ok(index.includes('SACTCheck v0.58.0 — Ten-Regimen Knowledge Base'));
assert.ok(index.includes('css/regimen-knowledge-base.css?v=0.58.0'));
assert.ok(index.includes('js/regimen-knowledge-base.js?v=0.58.0'));
assert.ok(index.includes('modified FOLFOX-6'));
assert.ok(index.includes('atezolizumab plus bevacizumab for HCC'));

console.log('v0.58.0 five-regimen knowledge-base expansion tests passed.');
