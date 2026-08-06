const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const moduleApi = require(path.join(root, 'js', 'regimen-knowledge-base.js'));
const data = JSON.parse(read('data/regimen-knowledge-base-v0603.json'));
const integrity = JSON.parse(read('V0603_PROTOCOL_JSON_HASHES.json'));
const html = read('index.html');

assert.strictEqual(pkg.version, '0.60.3');
assert.strictEqual(moduleApi.version, '0.60.3');
assert.strictEqual(data.release, '0.60.3');
assert.strictEqual(data.regimen_profiles.length, 15, 'This release enriches evidence and must not add a new regimen profile.');
assert.strictEqual(data.evidence_records.length, 22, 'SUNLIGHT should increase the evidence record count from 21 to 22.');

const lonsurfProfile = data.regimen_profiles.find(item => item.protocol_id === 'nccp-00382-v3');
assert.ok(lonsurfProfile, 'Lonsurf regimen profile is missing.');
assert.ok(/SUNLIGHT/i.test(JSON.stringify(lonsurfProfile)), 'Lonsurf profile must flag the SUNLIGHT contextual evidence boundary.');
assert.ok(/monotherapy/i.test(lonsurfProfile.clinical_summary), 'The encoded NCCP monotherapy boundary must remain explicit.');

const sunlight = data.evidence_records.find(item => item.protocol_id === 'nccp-00382-v3' && item.trial_acronym === 'SUNLIGHT');
assert.ok(sunlight, 'SUNLIGHT evidence record is missing.');
assert.strictEqual(String(sunlight.pmid), '37133585');
assert.strictEqual(sunlight.doi, '10.1056/NEJMoa2214963');
assert.strictEqual(sunlight.publication_url, 'https://pubmed.ncbi.nlm.nih.gov/37133585/');
assert.strictEqual(sunlight.doi_url, 'https://doi.org/10.1056/NEJMoa2214963');
assert.ok(/492/.test(sunlight.trial_population));
assert.ok(/10\.8 months/.test(sunlight.key_findings[0]));
assert.ok(/7\.5 months/.test(sunlight.key_findings[0]));
assert.ok(/5\.6 months/.test(sunlight.key_findings[1]));
assert.ok(/2\.4 months/.test(sunlight.key_findings[1]));
assert.ok(/contextual combination evidence only/i.test(sunlight.limitations));
assert.ok(/does not infer/i.test(sunlight.limitations));
assert.ok(/combination differs/i.test(sunlight.match_type));
assert.ok(/consultant oncology/i.test(sunlight.review_status));
assert.ok(/oncology-pharmacy/i.test(sunlight.review_status));

const recourse = data.evidence_records.find(item => item.protocol_id === 'nccp-00382-v3' && item.trial_acronym === 'RECOURSE');
assert.ok(recourse, 'Existing RECOURSE evidence must be preserved alongside SUNLIGHT.');
assert.ok(html.includes('SACTCheck v0.60.3 — Hero Position Fix and SUNLIGHT Evidence'));
assert.ok(html.includes('v0.60.3 · What changed?'));
assert.ok(html.includes('js/regimen-knowledge-base.js?v=0.60.3'));

assert.strictEqual(integrity.baseline_release, '0.60.2');
assert.strictEqual(integrity.current_release, '0.60.3');
assert.strictEqual(integrity.protocol_json_count, 382);
assert.strictEqual(integrity.changed_from_v0602_count, 0);
for (const [relative, expected] of Object.entries(integrity.hashes)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'protocols', relative))).digest('hex');
  assert.strictEqual(actual, expected, `Protocol JSON changed unexpectedly: ${relative}`);
}

console.log('v0.60.3 SUNLIGHT evidence tests passed: contextual combination evidence added, RECOURSE retained and protocol JSON unchanged.');
