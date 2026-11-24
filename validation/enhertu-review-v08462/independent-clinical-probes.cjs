'use strict';
// Independent source-first review: NCCP00776 v3b pp2–4 and EMA §§4.2–4.4.
// Clinical reviewer authored these examples after reading sources; no application mutation.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const repo = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../..');
const sourcePath = path.join(repo, 'protocols/breast/00776-trastuzumab-deruxtecan.json');
const sourceBytes = fs.readFileSync(sourcePath);
const protocol = JSON.parse(sourceBytes);
const engine = require(path.join(repo, 'js/assessment-engine'));
const dose = require(path.join(repo, 'js/protocol-dose-schedule'));
const cases = [];
const core = { assessment_stage: 'ongoing', baseline_lvef_percent: 55, lvef_percent: 43 };
function probe(name, input, expected, opts = {}) {
  const result = engine.assess(protocol, input);
  const model = dose.buildModificationModel(protocol, result);
  const item = {name, input, expected, actual:result.actionType,
    derived_decrease:result.inputs.lvef_drop_points,
    invalid:result.invalid, errors:result.errors,
    findings:result.findings.filter(f=>!f.domainAssessment && !/^PARTIAL_/.test(f.ruleId||'')).map(f=>({id:f.ruleId,action:f.actionType,text:f.explanation})),
    dose_rows:model.rows.map(r=>({dose:r.protocolDose,action:r.actionType}))};
  try {
    assert((Array.isArray(expected) ? expected : [expected]).includes(result.actionType));
    if ('delta' in opts) assert.equal(result.inputs.lvef_drop_points,opts.delta);
    if (opts.noNumericDose) assert(!model.rows.some(r=>/^\s*\d/.test(String(r.protocolDose))));
    if (opts.numericDose) assert(model.rows.some(r=>r.protocolDose===opts.numericDose));
    if (!opts.allowInvalid) { assert.deepEqual(result.invalid,[]); assert.deepEqual(result.errors,[]); }
    item.pass=true;
  } catch(e) { item.pass=false; item.failure=e.message; }
  cases.push(item);
}
probe('55 to 43: blank manual fall requires interruption',core,'withhold',{delta:12});
probe('55 to 43: falsely reassuring manual 4 cannot clear',{...core,lvef_drop_points:4},'withhold',{delta:12});
probe('55 to 43: manually entered 12 remains measured 12',{...core,lvef_drop_points:12},'withhold',{delta:12});
probe('55 to 43: stale negative manual fall cannot clear',{...core,lvef_drop_points:-3},'withhold',{delta:12});
probe('55 to 43: misleading recovery label maintains interruption',{...core,lvef_40_45_recheck:'recovered'},'withhold',{delta:12});
probe('55 to 43: verified failure of qualifying repeat requires permanent stop',{...core,lvef_40_45_recheck:'not_recovered'},'permanently_discontinue',{noNumericDose:true});
probe('55 to 45: initial exact ten-point fall requires interruption',{...core,lvef_percent:45},'withhold',{delta:10});
probe('55 to 45: qualifying recovered repeat at exactly ten allows review of resumption',{...core,lvef_percent:45,lvef_40_45_recheck:'recovered'},'proceed_with_caution',{delta:10});
probe('55 to 45: contradictory non-recovered flag cannot cause automatic permanent stop',{...core,lvef_percent:45,lvef_40_45_recheck:'not_recovered'},'withhold',{delta:10});
probe('55 to 45.1: below ten-point fall does not trigger ten-point interruption',{...core,lvef_percent:45.1},['partial','partial_assessment','incomplete','proceed_with_caution'],{delta:9.9});
probe('65 to 45: exact twenty falls in intermediate interruption branch',{...core,baseline_lvef_percent:65,lvef_percent:45},'withhold',{delta:20});
probe('65.1 to 45: greater than twenty requires interruption',{...core,baseline_lvef_percent:65.1,lvef_percent:45},'withhold',{delta:20.1});
probe('98 to 77: normal-looking current value does not hide greater-than-twenty fall',{...core,baseline_lvef_percent:98,lvef_percent:77},'withhold',{delta:21});
probe('50 to 40: exact lower LVEF and ten-point boundaries interrupt',{...core,baseline_lvef_percent:50,lvef_percent:40},'withhold',{delta:10});
probe('49 to 40 ongoing: historical starting eligibility needs separate review',{...core,baseline_lvef_percent:49,lvef_percent:40},'consultant_review',{delta:9,noNumericDose:true});
probe('Below forty independently interrupts without baseline',{assessment_stage:'ongoing',lvef_percent:39.9},'withhold');
probe('Current 43 without baseline cannot clear',{assessment_stage:'ongoing',lvef_percent:43},'consultant_review',{noNumericDose:true});
probe('Current 70 without baseline cannot exclude a major fall',{assessment_stage:'ongoing',lvef_percent:70},'consultant_review',{noNumericDose:true});
probe('Manual fall alone is unassessed',{lvef_drop_points:12},'incomplete',{delta:null,noNumericDose:true});
probe('Recovery label alone is unassessed',{lvef_40_45_recheck:'recovered'},'consultant_review',{noNumericDose:true});
probe('Non-recovery label alone is unassessed, not automatic permanent stop',{lvef_40_45_recheck:'not_recovered'},'consultant_review',{noNumericDose:true});
probe('First dose with LVEF49 fails starting eligibility',{assessment_stage:'baseline',lvef_percent:49},'withhold');
probe('Recovered cardiac value cannot override symptomatic heart failure',{...core,lvef_percent:46,lvef_40_45_recheck:'recovered',symptomatic_chf:true},'permanently_discontinue',{noNumericDose:true});
probe('Recovered cardiac value cannot override symptomatic lung toxicity',{...core,lvef_percent:46,lvef_40_45_recheck:'recovered',ild_pneumonitis_grade:2},'permanently_discontinue',{noNumericDose:true});
probe('Confirmed severe repeat stops even with a recovery label',{...core,confirmed_severe_lvef_recheck:true,lvef_40_45_recheck:'recovered'},'permanently_discontinue',{noNumericDose:true});
probe('ANC0.49 requires interruption and one reduction',{anc:0.49},'withhold_then_reduce',{noNumericDose:true});
probe('ANC0.5 requires interruption at current dose level',{anc:0.5},'withhold');
probe('ANC0.99 remains interruption',{anc:0.99},'withhold');
probe('Resolved grade1 lung toxicity at28days retains dose',{ild_pneumonitis_grade:0,ild_grade1_resolution_days:28},'proceed_with_caution');
probe('Resolved grade1 lung toxicity at29days requires one reduction',{ild_pneumonitis_grade:0,ild_grade1_resolution_days:29},'dose_reduce_one_level',{noNumericDose:true});
probe('Previous symptomatic lung toxicity cannot be erased by currentgrade0',{previous_symptomatic_ild:true,ild_pneumonitis_grade:0},'permanently_discontinue',{noNumericDose:true});
probe('Suspected lung toxicity independently interrupts',{suspected_ild_pneumonitis:true},'withhold');
probe('CrCl29.9 reconciles national and EMA disagreement',{crcl_ml_min:29.9},'consultant_review',{noNumericDose:true});
probe('CrCl30 follows moderate-renal closer surveillance branch',{crcl_ml_min:30},'proceed_with_caution');
probe('Bilirubin1.51 reconciles limited EMA dosing evidence',{bilirubin_ratio_uln:1.51},'consultant_review',{noNumericDose:true});
probe('Severe liver impairment remains not recommended',{hepatic_impairment:'severe'},'contraindicated',{noNumericDose:true});
probe('Mixed grade4 ANC and cardiac hold suppress future numeric dose',{...core,anc:0.4,dose_reduction_level:0},'withhold_then_reduce',{noNumericDose:true});
probe('Mixed grade4 ANC and suspected lung toxicity suppress future numeric dose',{anc:0.4,dose_reduction_level:0,suspected_ild_pneumonitis:true},'withhold_then_reduce',{noNumericDose:true});
probe('Mixed grade4 ANC and active grade1 lung toxicity suppress future numeric dose',{anc:0.4,dose_reduction_level:0,ild_pneumonitis_grade:1},'withhold_then_reduce',{noNumericDose:true});
probe('Mixed grade4 ANC and missing cardiac baseline suppress future numeric dose',{anc:0.4,dose_reduction_level:0,assessment_stage:'ongoing',lvef_percent:43},'withhold_then_reduce',{noNumericDose:true});
probe('Mixed grade4 ANC and severe renal evidence gap suppress future numeric dose',{anc:0.4,dose_reduction_level:0,crcl_ml_min:20},'withhold_then_reduce',{noNumericDose:true});
probe('Mixed grade4 ANC and hepatic evidence gap suppress future numeric dose',{anc:0.4,dose_reduction_level:0,bilirubin_ratio_uln:2},'withhold_then_reduce',{noNumericDose:true});
probe('Mixed grade4 ANC and an infusion reaction hold suppress future numeric dose',{anc:0.4,dose_reduction_level:0,mild_moderate_infusion_reaction:true},'withhold_then_reduce',{noNumericDose:true});
probe('Mixed grade4 ANC and permanent lung stop suppress every numeric dose',{anc:0.4,dose_reduction_level:0,ild_pneumonitis_grade:2},'permanently_discontinue',{noNumericDose:true});
probe('Single grade4 ANC preserves conditional next reduction at known level',{anc:0.4,dose_reduction_level:0},'withhold_then_reduce',{numericDose:'4.4 mg/kg'});
probe('Verified cardiac recovery adds no active hold to isolated ANC reduction',{...core,lvef_percent:46,lvef_40_45_recheck:'recovered',anc:0.4,dose_reduction_level:0},'withhold_then_reduce',{numericDose:'4.4 mg/kg'});
const out={checked_at:new Date().toISOString(),scope:'Independent targeted source-first probes; not exhaustive verification or clinical authorisation',protocol_sha256:crypto.createHash('sha256').update(sourceBytes).digest('hex'),total:cases.length,passed:cases.filter(x=>x.pass).length,failed:cases.filter(x=>!x.pass).length,cases};
fs.writeFileSync(path.join(__dirname,'independent-clinical-probes-results.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({total:out.total,passed:out.passed,failed:out.failed,failures:cases.filter(x=>!x.pass)},null,2));
process.exitCode=out.failed?1:0;
