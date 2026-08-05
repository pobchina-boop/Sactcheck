const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const moduleApi = require(path.join(root, 'js', 'regimen-knowledge-base.js'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'regimen-knowledge-base-v0561.json'), 'utf8'));

assert.ok(/^0\.(?:5[6-9]|[6-9]\d)\./.test(moduleApi.version), `Unexpected current knowledge module version: ${moduleApi.version}`);
assert.strictEqual(data.release, '0.56.1');
assert.strictEqual(data.regimen_profiles.length, 5, 'Pilot must contain exactly five enhanced regimen profiles.');
assert.ok(!JSON.stringify(data).includes('AI-assisted'), 'Current user-facing knowledge data must not display an AI-origin label.');

const expected = new Map([
  ['nccp-00382-v3', ['RECOURSE', '25970050']],
  ['nccp-00568-v5', ['KEYNOTE-189', '29658856']],
  ['nccp-00655-v3a', ['PACIFIC', '28885881']],
  ['nccp-00857-v3', ['KEYNOTE-522', '32101663']],
  ['nccp-00624-v3', ['CALYPSO', '20498395']]
]);

const protocolIds = new Set();
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.json')) {
      try {
        const payload = JSON.parse(fs.readFileSync(full, 'utf8'));
        if (payload.protocol_id) protocolIds.add(payload.protocol_id);
      } catch (_) {}
    }
  }
})(path.join(root, 'protocols'));

for (const profile of data.regimen_profiles) {
  assert.ok(expected.has(profile.protocol_id), `Unexpected pilot profile: ${profile.protocol_id}`);
  assert.ok(protocolIds.has(profile.protocol_id), `Pilot profile maps to missing protocol: ${profile.protocol_id}`);
  ['regimen_role','clinical_summary','treatment_setting','component_rationale','schedule_context','review_status'].forEach(field => {
    assert.ok(profile[field], `Missing ${field} for ${profile.protocol_id}`);
  });
  assert.ok(Array.isArray(profile.key_points) && profile.key_points.length >= 3, `Insufficient key points for ${profile.protocol_id}`);
}

for (const [protocolId, [acronym, pmid]] of expected) {
  const record = data.evidence_records.find(item => item.protocol_id === protocolId);
  assert.ok(record, `Missing evidence record for ${protocolId}`);
  assert.strictEqual(record.trial_acronym, acronym);
  assert.strictEqual(String(record.pmid), pmid);
  ['trial_population','intervention','comparator','primary_endpoint','limitations','match_type','doi_url'].forEach(field => {
    assert.ok(record[field], `Missing ${field} for ${protocolId}`);
  });
  assert.ok(Array.isArray(record.key_findings) && record.key_findings.length >= 2, `Insufficient findings for ${protocolId}`);
  assert.ok(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(record.publication_url));
  for (const followUp of record.supporting_publications || []) {
    assert.ok(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(followUp.url), `Invalid follow-up PubMed URL: ${followUp.url}`);
    assert.ok(followUp.title && followUp.label && followUp.doi_url);
  }
}

const source = fs.readFileSync(path.join(root, 'js', 'regimen-knowledge-base.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'regimen-knowledge-base.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(source.includes('Regimen at a glance'));
assert.ok(source.includes('How the components work together'));
assert.ok(source.includes('Key findings'));
assert.ok(source.includes('Additional trial publications'));
assert.ok(source.includes('Important limitations'));
assert.ok(css.includes('.regimen-overview-grid'));
assert.ok(css.includes('.regimen-follow-up-publications'));
assert.ok(index.includes('SACTCheck v0.56.1 — Five-Regimen Knowledge Base Pilot'), 'Historical pilot label should remain available for regression traceability.');
assert.ok(index.includes('css/regimen-knowledge-base.css?v=0.58.0'));
assert.ok(index.includes('js/regimen-knowledge-base.js?v=0.58.0'));

console.log('v0.56.1 five-regimen knowledge-base pilot tests passed.');
