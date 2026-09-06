"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Engine=require("../js/assessment-engine.js");
const Validator=require("../js/protocol-validator.js");
const Hotfix=require("../js/source-reconciliation-v0701.js");

const ROOT=path.resolve(__dirname,"..");
const read=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),"utf8"));
const clone=value=>JSON.parse(JSON.stringify(value));
const ruleId=rule=>String(rule?.id||rule?.rule_id||"");

const FILES={
  "00382":"protocols/gastrointestinal/00382-trifluridine-tipiracil.json",
  "00525":"protocols/breast/00525-ribociclib-metastatic.json",
  "00892":"protocols/breast/00892-ribociclib-adjuvant.json",
  "00619":"protocols/breast/00619-abemaciclib-adjuvant.json"
};

function patched(code){
  const protocol=clone(read(FILES[code]));
  const originalStatus=protocol.status;
  const originalEncoding=protocol.metadata.sactcheck_encoding_version;
  Hotfix.apply(protocol);
  Hotfix.apply(protocol);
  assert.strictEqual(protocol.status,originalStatus,`${code}: lifecycle status must be preserved`);
  assert.strictEqual(protocol.metadata.sactcheck_encoding_version,originalEncoding,`${code}: historical encoding version must be preserved`);
  const ids=(protocol.rule_engine?.rules||[]).map(ruleId).filter(Boolean);
  assert.strictEqual(new Set(ids).size,ids.length,`${code}: hotfix must be idempotent`);
  if(code!=="00619"){
    assert.strictEqual(protocol.metadata.encoding_maturity.reconciled_release,"0.70.1");
    assert.strictEqual(protocol.metadata.validation.consultant_reviewed,false);
    assert.strictEqual(protocol.metadata.validation.oncology_pharmacy_reviewed,false);
    assert.strictEqual(protocol.metadata.validation.clinical_use_authorised,false);
  }
  const validation=Validator.validate(protocol,{strict:true});
  assert.ok(validation.valid,`${code}: patched protocol should validate: ${Validator.formatIssues(validation).join("; ")}`);
  return protocol;
}
function assess(protocol,values){ return Engine.assess(protocol,values,{profileId:"default"}); }
function has(result,id){ return (result.findings||[]).some(f=>f.ruleId===id); }

// NCCP 00382 Version 4 — context-specific blood thresholds.
const lonsurf=patched("00382");
assert.strictEqual(lonsurf.metadata.nccp_version,4);
assert.strictEqual(lonsurf.metadata.source_url,"https://healthservice.hse.ie/documents/6348/trifluridine_and_tipiracil_Lonsurf_therapy_382.pdf");
assert(lonsurf.input_definitions.assessment_context);

let r=assess(lonsurf,{assessment_context:"during_cycle",anc_x10e9_l:0.49});
assert.strictEqual(r.actionType,"withhold");
assert(has(r,"LONSURF_ANC_INTERRUPT"));
r=assess(lonsurf,{assessment_context:"during_cycle",anc_x10e9_l:0.50});
assert(!has(r,"LONSURF_ANC_INTERRUPT"));
r=assess(lonsurf,{assessment_context:"during_cycle",anc_x10e9_l:1.49});
assert(!has(r,"LONSURF_NEXT_CYCLE_ANC"),"During-cycle ANC 1.49 must not be treated as a next-cycle assessment");
r=assess(lonsurf,{assessment_context:"start_next_cycle",anc_x10e9_l:1.49});
assert.strictEqual(r.actionType,"withhold");
assert(has(r,"LONSURF_NEXT_CYCLE_ANC"));
r=assess(lonsurf,{assessment_context:"start_next_cycle",anc_x10e9_l:1.50});
assert(!has(r,"LONSURF_NEXT_CYCLE_ANC"));

r=assess(lonsurf,{assessment_context:"during_cycle",platelets_x10e9_l:49});
assert.strictEqual(r.actionType,"withhold");
assert(has(r,"LONSURF_PLT_INTERRUPT"));
r=assess(lonsurf,{assessment_context:"during_cycle",platelets_x10e9_l:50});
assert(!has(r,"LONSURF_PLT_INTERRUPT"));
r=assess(lonsurf,{assessment_context:"start_next_cycle",platelets_x10e9_l:74});
assert.strictEqual(r.actionType,"withhold");
r=assess(lonsurf,{assessment_context:"start_next_cycle",platelets_x10e9_l:75});
assert(!has(r,"LONSURF_NEXT_CYCLE_PLT"));

r=assess(lonsurf,{assessment_context:"start_next_cycle",anc_x10e9_l:0.49,next_cycle_delay_days:7});
assert(!has(r,"LONSURF_DELAY_REDUCE_ANC"),"Exactly 7 days is not more than one week");
r=assess(lonsurf,{assessment_context:"start_next_cycle",anc_x10e9_l:0.49,next_cycle_delay_days:8});
assert(has(r,"LONSURF_DELAY_REDUCE_ANC"));
r=assess(lonsurf,{assessment_context:"start_next_cycle",platelets_x10e9_l:24,next_cycle_delay_days:8});
assert(has(r,"LONSURF_DELAY_REDUCE_PLT"));
r=assess(lonsurf,{assessment_context:"start_next_cycle",platelets_x10e9_l:25,next_cycle_delay_days:8});
assert(!has(r,"LONSURF_DELAY_REDUCE_PLT"));

r=assess(lonsurf,{crcl_ml_min:"renal_0_14"});
assert(has(r,"LONSURF_RENAL_LT30"));
assert.notStrictEqual(r.actionType,"contraindicated","Non-dialysis CrCl <15 should use the v4 <30 severe-renal pathway, not the old contraindication");
r=assess(lonsurf,{crcl_ml_min:"dialysis"});
assert.strictEqual(r.actionType,"contraindicated");
assert(has(r,"LONSURF_DIALYSIS"));
r=assess(lonsurf,{hepatic_impairment:"moderate"});
assert.strictEqual(r.actionType,"contraindicated");
r=assess(lonsurf,{bilirubin_ratio_uln:2});
assert(!has(r,"LONSURF_HEPATIC_MOD_SEV"),"Bilirubin elevation alone must not recreate the removed v3 hepatic rule");

// Ribociclib metastatic v6.
const met=patched("00525");
assert.strictEqual(met.input_definitions.ast_alt_grade.visible,false);
assert.strictEqual(met.input_definitions.bilirubin_elevated.visible,false);
assert(met.input_definitions.alt_ast_uln_multiple);
assert(met.input_definitions.bilirubin_ratio_uln);
assert.strictEqual(met.input_definitions.alt_ast_uln_multiple.assessment_guidance.includes("automatic"),true);

r=assess(met,{alt_ast_uln_multiple:3.0,baseline_ast_alt_band:0,hepatotoxicity_grade2_recurrent:false});
assert(!has(r,"RIBO_HEP_G2_BASE_LT2"));
r=assess(met,{alt_ast_uln_multiple:3.01,baseline_ast_alt_band:0,hepatotoxicity_grade2_recurrent:false});
assert.strictEqual(r.actionType,"withhold");
assert(has(r,"RIBO_HEP_G2_BASE_LT2"));
r=assess(met,{alt_ast_uln_multiple:5.0,baseline_ast_alt_band:0,hepatotoxicity_grade2_recurrent:true});
assert.strictEqual(r.actionType,"withhold_then_reduce");
assert(has(r,"RIBO_HEP_G2_RECUR"));
r=assess(met,{alt_ast_uln_multiple:5.01,hepatotoxicity_grade3_recurrent:false});
assert.strictEqual(r.actionType,"withhold_then_reduce");
assert(has(r,"RIBO_HEP_G3"));
r=assess(met,{alt_ast_uln_multiple:20.0,hepatotoxicity_grade3_recurrent:true});
assert.strictEqual(r.actionType,"discontinue");
assert(has(r,"RIBO_HEP_G3_RECUR"));
r=assess(met,{alt_ast_uln_multiple:20.01});
assert.strictEqual(r.actionType,"discontinue");
assert(has(r,"RIBO_HEP_G4"));

r=assess(met,{alt_ast_uln_multiple:3.01,bilirubin_ratio_uln:2.0,cholestasis_present:false,baseline_ast_alt_band:0,hepatotoxicity_grade2_recurrent:false});
assert(!has(r,"RIBO_HEP_DILI"));
r=assess(met,{alt_ast_uln_multiple:3.01,bilirubin_ratio_uln:2.01,cholestasis_present:false,baseline_ast_alt_band:0,hepatotoxicity_grade2_recurrent:false});
assert.strictEqual(r.actionType,"discontinue");
assert(has(r,"RIBO_HEP_DILI"));

r=assess(met,{assessment_phase:"baseline",qtc_f:450});
assert.strictEqual(r.actionType,"contraindicated");
assert(has(r,"RIBO_BASELINE_QTC"));
r=assess(met,{assessment_phase:"baseline",ecog_status:2});
assert.strictEqual(r.actionType,"contraindicated");
assert(has(r,"RIBO_BASELINE_ECOG"));
r=assess(met,{qtc_f:481,qtc_recurrent_481_plus:false});
assert.strictEqual(r.actionType,"withhold");
r=assess(met,{qtc_f:481,qtc_recurrent_481_plus:true});
assert.strictEqual(r.actionType,"withhold_then_reduce");
r=assess(met,{qtc_f:501,qtc_gt500_confirmed_two_ecgs:true,qtc_recurrent_481_plus:false});
assert.strictEqual(r.actionType,"withhold_then_reduce");
assert(has(r,"RIBO_QT_GT500_MET"));
r=assess(met,{qtc_f:501,qtc_change_from_baseline_ms:61,serious_arrhythmia_with_qt_prolongation:true});
assert.strictEqual(r.actionType,"permanently_discontinue");
assert(has(r,"RIBO_QT_SERIOUS"));
r=assess(met,{ild_pneumonitis_severity:2});
assert.strictEqual(r.actionType,"withhold_then_reduce");
r=assess(met,{ild_pneumonitis_severity:3});
assert.strictEqual(r.actionType,"discontinue");

// Ribociclib adjuvant v2.
const adj=patched("00892");
assert(!(adj.rule_engine.rules||[]).some(rule=>ruleId(rule)==="CHILDPUGH_BC"),"Adjuvant Child-Pugh B/C dose-reduction rule must be removed");
r=assess(adj,{child_pugh:"B"});
assert.notStrictEqual(r.actionType,"dose_reduce","NCCP 00892 v2 states no hepatic dose adjustment is necessary in early breast cancer");
r=assess(adj,{renal_band:"severe"});
assert.strictEqual(r.actionType,"dose_reduce");
r=assess(adj,{qtc_f:501,qtc_gt500_recurrent:false,qtc_recurrent_481_plus:false});
assert.strictEqual(r.actionType,"withhold_then_reduce");
assert(has(r,"RIBO_QT_GT500_ADJ"));
r=assess(adj,{qtc_f:501,qtc_gt500_recurrent:true,qtc_recurrent_481_plus:true});
assert.strictEqual(r.actionType,"discontinue");
assert(has(r,"RIBO_QT_GT500_ADJ_RECUR"));
r=assess(adj,{alt_ast_uln_multiple:5.01,hepatotoxicity_grade3_recurrent:false});
assert.strictEqual(r.actionType,"withhold_then_reduce");

// Abemaciclib: current direct source retained, catalogue fallback added; clinical rules untouched.
const abema=patched("00619");
assert.strictEqual(abema.metadata.source_url,"https://healthservice.hse.ie/documents/6415/619_Abemaciclib.pdf");
assert(abema.metadata.source_catalogue_url.includes("breast-sact-regimens"));

console.log("v0.70.1 source-fidelity hotfix tests passed for Lonsurf v4, metastatic/adjuvant ribociclib and source-link fallback.");
