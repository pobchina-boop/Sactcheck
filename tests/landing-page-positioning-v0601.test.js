const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const css = read('css/landing-page-v0602.css');
const integrity = JSON.parse(read('V0601_PROTOCOL_JSON_HASHES.json'));

assert.ok(pkg.version.localeCompare('0.60.1', undefined, { numeric: true }) >= 0);
assert.ok(read('CHANGELOG.MD').includes('v0.60.1 — Mission-Led Landing Page'), 'Historical release label should remain in the changelog trace.');
assert.ok(/css\/landing-page-v0602\.css\?v=0\.(?:60\.[123]|61\.0)/.test(html));
assert.ok(html.includes('From national treatment guidance to usable information at every step.'));
assert.ok(html.includes('Our purpose:'));
assert.ok(html.includes('One regimen. One connected information pathway.'));
assert.ok(html.includes('Turn complex cancer-treatment information into a connected, usable pathway for clinicians and patients.'));
assert.ok(html.includes('class="study-modal landing-modal"'));
assert.ok(html.includes('See the three-step quick start'));
assert.strictEqual((html.match(/Launch SACTCheck Engine/g) || []).length, 0, 'Legacy launch gate should be removed in the current direct-open homepage.');
assert.ok(html.includes('What SACTCheck is, and why it is being developed'));
assert.ok(html.includes('Why it was created'));
assert.ok(html.includes('What is being evaluated'));
assert.ok(html.includes('agreement with independently adjudicated protocol-based answers'));
assert.ok(css.includes('.mission-hero'));
assert.ok(css.includes('.mission-visual'));
assert.ok(css.includes('.landing-benefit-grid'));
assert.ok(css.includes('.landing-modal-actions'));
assert.ok(css.includes('@media(max-width:620px)'));
assert.strictEqual(integrity.baseline_release, '0.60.0');
assert.strictEqual(integrity.current_release, '0.60.1');
assert.strictEqual(integrity.protocol_json_count, 382);
assert.strictEqual(integrity.changed_from_v0600_count, 0);
if (pkg.version.localeCompare('0.63.1', undefined, { numeric: true }) < 0) {
for (const [relative, expected] of Object.entries(integrity.hashes)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'protocols', relative))).digest('hex');
  assert.strictEqual(actual, expected, `Protocol JSON changed unexpectedly: ${relative}`);
}
}
console.log('Landing-page regression tests passed: mission-led direct-open product introduction, responsive UI and unchanged protocol JSON verified.');
