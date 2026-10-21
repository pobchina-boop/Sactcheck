'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const renderer = require(path.join(root, 'js/treatment-evidence-v08413.js'));
const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'evidence-audit.json')));
const expected = ['00785','00796','00797','00789','00790'];
assert.deepEqual(Object.keys(audit.profiles), expected);
const checks = [];
for (const code of expected) {
  const profile = audit.profiles[code], r = profile.treatment_rationale, e = profile.evidence_at_a_glance;
  for (const key of ['summary','setting','line','limitations']) assert.ok(typeof r[key] === 'string' && r[key]);
  for (const key of ['trial','population','comparison','applicability','checked','harms']) assert.ok(typeof e[key] === 'string' && e[key]);
  assert.equal(e.checked, '2026-10-21');
  const allSources = [...r.sources, ...e.sources];
  for (const endpoint of e.endpoints) {
    assert.ok(renderer.endpoints[endpoint.endpoint], `Unsupported endpoint ${endpoint.endpoint}`);
    assert.ok(endpoint.analysis_status && endpoint.definition && endpoint.interpretation && endpoint.limitations);
    const paired = Number.isFinite(endpoint.intervention_value) && Number.isFinite(endpoint.comparator_value);
    assert.ok(paired || endpoint.result_text);
    if (endpoint.hr) assert.ok(endpoint.ci, 'Hazard ratio needs uncertainty');
    allSources.push(...endpoint.sources);
  }
  for (const s of allSources) {
    assert.ok(s.label);
    const url = new URL(s.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(['healthservice.hse.ie','pubmed.ncbi.nlm.nih.gov','pmc.ncbi.nlm.nih.gov','jamanetwork.com'].includes(url.hostname));
  }
  const html = renderer.render(profile);
  assert.ok(html.includes('data-clinician-evidence="true"'));
  assert.ok(!/undefined|NaN|Infinity/.test(html));
  assert.equal((html.match(/class="evidence-outcome /g)||[]).length,e.endpoints.length);
  assert.ok(html.indexOf('evidence-applicability') < html.indexOf('evidence-outcome-grid'));
  assert.ok(html.includes('evidence-harms'));
  fs.writeFileSync(path.join(__dirname, `${code}-rendered.html`), html+'\n');
  checks.push({code, status:'pass', endpoint_count:e.endpoints.length, source_count:allSources.length, applicability_before_outcomes:true});
}
const p = audit.profiles;
assert.match(p['00785'].evidence_at_a_glance.applicability, /did not randomize.*chemotherapy stopped/);
assert.ok(p['00797'].evidence_at_a_glance.endpoints.every(x=>x.intervention_value === undefined && x.comparator_value === undefined));
assert.match(p['00797'].treatment_rationale.factors.join(' '), /unlicensed in Ireland/);
assert.match(p['00789'].evidence_at_a_glance.endpoints[0].definition, /does not require node negativity/);
assert.ok(p['00789'].evidence_at_a_glance.endpoints.every(x=>!['OS','PFS','EFS'].includes(x.endpoint)));
assert.match(p['00790'].evidence_at_a_glance.applicability, /six cycles.*nine/);
assert.match(p['00790'].evidence_at_a_glance.endpoints[1].interpretation, /not powered.*equivalence/);
const result={checked:'2026-10-21',status:'pass',method:'Executed existing clinician renderer against all five profiles; checked schema, sources, visible applicability and trial-specific safeguards.',checks};
fs.writeFileSync(path.join(__dirname,'renderer-checks.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
