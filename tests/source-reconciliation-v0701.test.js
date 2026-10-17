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
    assert.strictEqual((protocol.metadata.encoding_maturity.reconciled_release||protocol.metadata.encoding_maturity.audit_release),code==="00525"?"0.83.7":code==="00892"?"0.83.8":"0.70.1");
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

// Newer audited JSON must survive the historical runtime repair byte-for-byte.
for(const code of ["00525","00892"]){
 const original=read(FILES[code]);const modern=patched(code);
 assert.deepStrictEqual(modern,original,`${code}: historical hotfix must not overwrite newer rules`);
}
// Source boundary and phase tests exercise the modern rules directly.
require('./clinical-audit-v0837.test.cjs');
require('./clinical-audit-v0838.test.cjs');

// Abemaciclib: current direct source retained, catalogue fallback added; clinical rules untouched.
const abema=patched("00619");
assert.strictEqual(abema.metadata.source_url,"https://healthservice.hse.ie/documents/6415/619_Abemaciclib.pdf");
assert(abema.metadata.source_catalogue_url.includes("breast-sact-regimens"));

console.log("v0.70.1 source-fidelity hotfix tests passed for Lonsurf v4, metastatic/adjuvant ribociclib and source-link fallback.");
