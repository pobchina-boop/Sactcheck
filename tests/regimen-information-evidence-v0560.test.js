const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const knowledge = require(path.join(root, 'js', 'regimen-knowledge-base.js'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'regimen-knowledge-base-v0561.json'), 'utf8'));

assert.ok(/^0\.(?:5[6-9]|[6-9]\d)\./.test(knowledge.version), `Unexpected current knowledge module version: ${knowledge.version}`);
assert.strictEqual(data.release, '0.56.1');
assert.ok(data.drug_profiles.length >= 20, 'Insufficient drug mechanism pilot coverage.');
assert.ok(data.evidence_records.length >= 15, 'Insufficient evidence pilot coverage.');

const protocolIds = new Set();
function walk(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (!entry.name.endsWith('.json')) return;
    try {
      const protocol = JSON.parse(fs.readFileSync(full, 'utf8'));
      if (protocol.protocol_id) protocolIds.add(protocol.protocol_id);
    } catch (_) {}
  });
}
walk(path.join(root, 'protocols'));

data.drug_profiles.forEach(profile => {
  assert.ok(profile.name && profile.drug_type && profile.drug_class && profile.mechanism, `Incomplete drug profile: ${profile.id}`);
  assert.ok(/review pending|draft/i.test(profile.review_status), `Review state missing for ${profile.id}`);
});

data.evidence_records.forEach(record => {
  assert.ok(protocolIds.has(record.protocol_id), `Evidence mapped to missing protocol: ${record.protocol_id}`);
  assert.ok(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(record.publication_url), `Non-stable PubMed URL: ${record.publication_url}`);
  assert.strictEqual(String(record.pmid), record.publication_url.match(/(\d+)/)[1]);
  assert.ok(record.publication_title && record.journal && record.year && record.study_design && record.relevance_summary && record.limitations && record.match_type);
  assert.ok(/review pending|draft/i.test(record.review_status), `Review state missing for ${record.trial_acronym}`);
  assert.ok(record.relevance_summary.split(/\s+/).length < 45, `Evidence summary is too long for ${record.trial_acronym}`);
});

const loader = fs.readFileSync(path.join(root, 'js', 'protocol-loader.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'js', 'generic-assessment-ui.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const moduleSource = fs.readFileSync(path.join(root, 'js', 'regimen-knowledge-base.js'), 'utf8');
assert.ok(loader.includes('data-regimen-info-protocol'));
assert.ok(loader.includes('Regimen info'));
assert.ok(ui.includes('jsonRegimenInfoButton'));
assert.ok(ui.includes('SACTCheckRegimenKnowledgeBase?.open'));
assert.ok(index.includes('css/regimen-knowledge-base.css?v=0.58.0'));
assert.ok(index.includes('js/regimen-knowledge-base.js?v=0.58.0'));
assert.ok(moduleSource.includes('Evidence supporting this regimen and indication'));
assert.ok(moduleSource.includes('The current NCCP protocol remains the operational source'));
assert.ok(moduleSource.includes('local clinical governance remain authoritative'));
assert.ok(!moduleSource.includes('AI-assisted'));
assert.ok(!JSON.stringify(data).includes('AI-assisted'));
assert.ok(!moduleSource.includes('changes the deterministic'));

console.log(`v0.56.1 regimen information compatibility tests passed: ${data.drug_profiles.length} drug profiles and ${data.evidence_records.length} evidence mappings.`);
