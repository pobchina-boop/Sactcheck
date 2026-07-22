const fs=require("fs");const assert=require("assert");
const p=JSON.parse(fs.readFileSync("protocols/breast/00776-trastuzumab-deruxtecan.json","utf8"));
assert.equal(p.status,"encoded_prototype_pending_clinical_and_pharmacy_validation");
assert.equal(p.metadata.nccp_version,"3b");
assert.equal(p.supportive_care.emetogenic_risk,"high");
assert(fs.existsSync(p.supportive_care.supportive_medications_pdf_url));
for (const id of ["EX_ILD_HISTORY","ILD_G2PLUS","ANC_G3","ANC_G4","FEBRILE_NEUTROPENIA_383","LVEF_LT40","CHF"]) assert(p.rule_engine.rules.some(r=>r.rule_id===id),id);
console.log("v0.36.5 trastuzumab deruxtecan and supportive-care checks passed");
