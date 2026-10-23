'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../../..');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence-audit.json')));
const renderer=require(path.join(root,'js/treatment-evidence-v08413.js'));
const expected=['00217','00350','00526','00775','00798','00204','00507','00258','00722','00731'];
assert.deepStrictEqual(Object.keys(data.profiles).sort(),expected.sort());
let cards=0;
for(const [code,p] of Object.entries(data.profiles)){
 for(const key of ['summary','setting','line','limitations'])assert(p.treatment_rationale[key],`${code} missing rationale ${key}`);
 const ev=p.evidence_at_a_glance;
 for(const key of ['trial','population','comparison','applicability','harms','checked'])assert(ev[key],`${code} missing evidence ${key}`);
 for(const e of ev.endpoints){
  assert(renderer.endpoints[e.endpoint],`${code} unsupported endpoint ${e.endpoint}`);
  assert(e.definition&&e.interpretation&&e.analysis_status&&e.limitations,`${code} incomplete endpoint context`);
  assert((Number.isFinite(e.intervention_value)&&Number.isFinite(e.comparator_value))||e.result_text,`${code} missing results`);
  assert(e.sources.length&&e.sources.every(s=>/^https:\/\//.test(s.url)),`${code} missing source`);
  assert(renderer.outcome(e).includes('data-endpoint='),`${code} hidden endpoint`);
  cards++;
 }
 assert(renderer.render(p).includes('data-clinician-evidence="true"'));
}
assert.equal(cards,19);
assert.equal(data.profiles['00217'].evidence_at_a_glance.endpoints[0].endpoint,'TTP');
assert(/not statistically significant/.test(data.profiles['00217'].evidence_at_a_glance.endpoints[1].result_text));
assert(/six cycles.*nine/.test(data.profiles['00775'].evidence_at_a_glance.applicability));
for(const c of ['00526','00798'])assert(/14.3/.test(data.profiles[c].evidence_at_a_glance.endpoints[1].result_text));
assert(/without trastuzumab/.test(data.profiles['00258'].evidence_at_a_glance.endpoints[0].comparator_label));
assert(/HannaH/.test(data.profiles['00731'].evidence_at_a_glance.qualitative_result));
console.log('10 evidence profiles / 19 endpoint cards validated, including TTP, comparator, trial-schedule and formulation boundaries.');
