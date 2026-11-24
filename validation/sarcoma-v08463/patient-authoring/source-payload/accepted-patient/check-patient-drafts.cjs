'use strict';
// Read-only use of actual application rendering modules. No browser/PDF claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=path.resolve(process.argv[2]||'../Sactcheck'),here=__dirname;
const evidence=require(path.join(repo,'js/treatment-evidence-v08413.js'));
const consent=require(path.join(repo,'tools/consent-core-v08455.cjs'));
const read=p=>JSON.parse(fs.readFileSync(path.join(here,'overlay',p),'utf8'));
const kb=read('data/regimen-knowledge-base-v08463-addendum.DRAFT.json').regimen_profiles;
let checks=0;const result=[];
function ok(condition,description){assert.ok(condition,description);checks++;}
for(const entry of kb){
 const code=entry.patient_route,d=read(`data/patient-knowledge/${code}.json`),html=evidence.render(entry),consentHtml=consent.render(d);
 ok(html.includes('data-clinician-evidence="true"'),`${code} evidence section renders`);
 ok((html.match(/class="evidence-outcome evidence-/g)||[]).length===entry.evidence_at_a_glance.endpoints.length,`${code} every endpoint renders`);
 for(const e of entry.evidence_at_a_glance.endpoints){
  const card=evidence.outcome(e);
  ok(card.length>100,`${code} supported endpoint ${e.endpoint}`);
  ok(card.includes(e.metric),`${code} metric retained`);
  if(Number.isFinite(e.intervention_value)){ok(card.includes(String(e.intervention_value)),`${code} intervention shown`);ok(card.includes(String(e.comparator_value)),`${code} comparator shown`);}
  else ok(card.includes(e.result_text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')),`${code} numeric result text shown`);
  ok(card.includes(e.sources[0].url),`${code} endpoint source shown`);
 }
 ok(d.patient_summary&&d.patient_summary.phases.length>0&&d.chapters.length>=5,`${code} summary/full handbook sources present`);
 ok(d.agents.every(a=>a.mechanism&&a.explanation&&a.risks.length>=5),`${code} mechanisms and material risks present`);
 ok(d.monitoring_test_details.length>=6,`${code} individual test cards present`);
 ok(new Set(d.monitoring_test_details.map(t=>t.timing)).size===d.monitoring_test_details.length,`${code} no repeated test timing boilerplate`);
 if(code==='00100'){
  ok(!consent.classify(d).includes('immunotherapy'),'mifamurtide not classified as checkpoint immunotherapy');
  ok(!consentHtml.includes('data-consent-module="immune-supplement"'),'mifamurtide no checkpoint risk supplement');
  ok(d.long_course_schedule.total_doses===48&&d.long_course_schedule.total_weeks===36,'mifamurtide full course');
  ok(d.long_course_schedule.minimum_gap_days===3,'mifamurtide minimum initial gap');
  ok(d.independent_clinical_approval===false,'profile does not assert clinical approval');
 }else ok(consentHtml.includes('data-consent-module="chemotherapy"'),`${code} generic chemotherapy consent renderer included`);
 if(code==='00463'){
  ok(d.long_course_schedule.postoperative_methotrexate_weeks.join(',')==='15,16,20,21,24,25,28,29','MAP postoperative methotrexate calendar');
  ok(d.long_course_schedule.preoperative_methotrexate_weeks.join(',')==='4,5,9,10','MAP preoperative methotrexate calendar');
  ok(d.long_course_schedule.fixed_discharge_date===false&&d.long_course_schedule.rescue_dose_calculator===false,'MAP no invented rescue/discharge automation');
 }
 if(code==='00596')ok(d.consent_licensing_note.includes('unlicensed indication in Ireland')&&d.consent_licensing_note.includes('Drugs and Therapeutics Committee'),'IE Irish off-label discussion and governance retained');
 result.push({code,evidence_cards:entry.evidence_at_a_glance.endpoints.length,actual_evidence_renderer_pass:true,actual_consent_classifier:consent.classify(d),test_cards:d.monitoring_test_details.length});
}
const report={status:'External source and actual module checks passed',checks,profiles:result,scope:'Actual existing evidence renderer and consent classification executed in Node; no browser, visual, PDF or clinical approval.',limits:['Mifamurtide authored innate-immune generic text must be inserted into final printable consent alongside its agent risks.','Long-course schedule labels must replace the builders hardcoded release fallback before rendering.']};
fs.writeFileSync(path.join(here,'actual-renderer-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
