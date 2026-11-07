'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const visual = require('../tools/patient-visual-language-v08444.cjs');
const {applyEditorial} = require('../tools/patient-editorial-v08444.cjs');

const shell = fragment => '<!doctype html><html><head><title>BP source title</title></head><body>' + fragment + '</body></html>';
const options = {route:'00738'};
const icons = html => [...html.matchAll(/data-sc44-icon="([^"]+)"/g)].map(match => match[1]);

const cases = [
  ['monitoring row heading', '<section id="monitoring-schedule"><table><tr><th scope="row" data-original="BP / urine / wounds" class=\'authored\'>BP / urine / wounds</th><td>Before treatment; follow the written plan.</td></tr></table></section>', ['urine'], ['vitals','urine']],
  ['generic investigation heading', '<article class="pk-card" data-label="BP"><h3 id=\'exact-heading\' data-note="Keep &amp; preserve">BP / urine / wounds</h3><p>The MRI is separate from this check.</p></article>', ['urine'], ['vitals','urine']],
  ['access-step heading', '<article class="access-step" data-label="BP"><svg class="old-calendar" viewBox="0 0 24 24"><path d="M1 1h10"/></svg><h3>BP / urine / wounds</h3><p>Do not infer MRI from this explanatory body.</p></article>', ['urine'], ['vitals','urine']],
  ['milestone summary heading', '<details class=\'journey-milestone\' open data-note="BP"><summary id="exact-summary"><span class="journey-number">2</span><span>BP / urine / wounds</span><small>MRI only if the team requests it.</small></summary><p>The authored review interval remains unchanged.</p></details>', ['urine'], ['vitals','urine']],
  ['scan table cell', '<section id="treatment-journey"><table><tr><th scope="row">Heart</th><td data-original=\'ECHO\'><strong>ECHO</strong> before starting; repeat only as planned.</td></tr></table></section>', ['echo'], ['echo','ultrasound']]
];

for (const [name, fragment, beforeKinds, afterKinds] of cases) {
  test(name + ': approved expansion refreshes owned icons to fresh-transform bytes', () => {
    const source = shell(fragment);
    const oldVisuals = visual.upgradeVisualLanguage(source, options);
    assert.deepEqual(icons(oldVisuals), beforeKinds);
    const expandedExisting = applyEditorial(oldVisuals);
    const updated = visual.upgradeVisualLanguage(expandedExisting, options);
    const fresh = visual.upgradeVisualLanguage(applyEditorial(source), options);
    assert.deepEqual(icons(updated), afterKinds);
    assert.equal(updated, fresh, 'Existing decoration and fresh generation converge byte for byte');
    assert.equal(visual.upgradeVisualLanguage(updated, options), updated, 'Correct output stays idempotent');
    assert.equal(applyEditorial(updated), updated, 'Icon refresh does not undo approved prose');
    assert.equal((updated.match(/class="sc44-icon-group"/g) || []).length, 1, 'Only one owned group remains');
  });
}

test('refresh preserves authored attributes, foreign graphics, raw blocks and molecular objects', () => {
  const molecule = '<article class="pk-card amino-acids" data-agent="amino-acids"><h3>Lysine / arginine amino acids</h3>' + visual.renderAminoAcids() + '</article>';
  const foreign = '<span class="authored-symbol" data-note="BP"><svg class="authored-graphic" viewBox="0 0 10 10"><path d="M1 1h4"/></svg></span>';
  const raw = '<script type="application/json">{"label":"BP","molecule":"L-lysine","dose":25}</script><style>.test:before{content:"BP / ECHO"}</style>';
  const fragment = '<article class=\'test-card\' data-source="https://example.test/BP?x=1&amp;y=2"><h3 data-raw=\'BP &amp; ECHO\'>BP / urine / wounds ' + foreign + '</h3><p>Exact authored wording: day 1, then every 28 days.</p></article>' + molecule + raw;
  const source = shell(fragment);
  const updated = visual.upgradeVisualLanguage(applyEditorial(visual.upgradeVisualLanguage(source, options)), options);
  assert.equal(updated, visual.upgradeVisualLanguage(applyEditorial(source), options));
  for (const unchanged of [molecule, foreign, raw, 'data-source="https://example.test/BP?x=1&amp;y=2"', "data-raw='BP &amp; ECHO'", 'Exact authored wording: day 1, then every 28 days.']) {
    assert(updated.includes(unchanged), 'Preserved exact authored or molecular bytes: ' + unchanged.slice(0,100));
  }
  assert.equal(visual.upgradeVisualLanguage(updated, options), updated);
});

test('a reserved-class span with authored contents is not removed as an owned icon group', () => {
  const foreign = '<span class="sc44-icon-group" data-authored="true"><svg viewBox="0 0 12 12"><path d="M1 1h7"/></svg><em>Authored key</em></span>';
  const source = shell('<article class="test-card"><h3>BP / urine / wounds ' + foreign + '</h3></article>');
  const updated = visual.upgradeVisualLanguage(applyEditorial(visual.upgradeVisualLanguage(source, options)), options);
  assert(updated.includes(foreign), 'Only groups composed exclusively of owned SVGs may be replaced');
  assert.equal(updated, visual.upgradeVisualLanguage(applyEditorial(source), options));
  assert.equal(visual.upgradeVisualLanguage(updated, options), updated);
});
