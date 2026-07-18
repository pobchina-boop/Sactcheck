const assert = require("assert");
const fs = require("fs");
const Engine = require("../js/assessment-engine.js");
const Validator = require("../js/protocol-validator.js");

const protocol = JSON.parse(fs.readFileSync("protocols/gastrointestinal/00321-xelox-capox.json", "utf8"));
const validation = Validator.validate(protocol, { strict: true });
assert.strictEqual(validation.valid, true, Validator.formatIssues(validation).join("\n"));
assert.strictEqual(protocol.metadata.migration.mode, "live_json");
assert.strictEqual(protocol.metadata.migration.switch_to_generic_assessment, true);
assert.strictEqual(protocol.metadata.migration.legacy_card_id, "openXelox");
assert.ok(protocol.metadata.source_url.endsWith("321_v9_XELOX_.pdf"));

function assess(inputs) { return Engine.assess(protocol, inputs); }

let result = assess({ anc_x10e9_l: 1.1, platelets_x10e9_l: 180, delay_weeks: 0 });
assert.strictEqual(result.actionType, "withhold", "ANC below 1.2 on Day 1 should hold treatment.");

result = assess({ anc_x10e9_l: 2, platelets_x10e9_l: 70, delay_weeks: 0 });
assert.strictEqual(result.actionType, "withhold", "Platelets below 75 on Day 1 should hold treatment.");

result = assess({ crcl_ml_min: 42 });
assert.strictEqual(result.actionType, "dose_reduce", "CrCl 30–50 should trigger capecitabine dose reduction.");

result = assess({ crcl_ml_min: 25, haemodialysis: false });
assert.strictEqual(result.actionType, "consultant_review", "CrCl below 30 should trigger Consultant review.");

result = assess({ diarrhoea_current_grade: 2, toxicity_delay_weeks: 0 });
assert.strictEqual(result.actionType, "withhold", "Current grade 2 diarrhoea should hold treatment.");

result = assess({ hand_foot_current_grade: 0, hand_foot_highest_grade: 3 });
assert.strictEqual(result.actionType, "dose_reduce", "Recovered grade 3 hand-foot syndrome should reduce capecitabine.");

result = assess({ neuropathy_pattern: "grade3_persistent_to_next_cycle" });
assert.strictEqual(result.actionType, "dose_reduce", "Persistent grade 3 neuropathy should discontinue oxaliplatin through a component modification.");

result = assess({ dpd_status: "complete" });
assert.strictEqual(result.actionType, "contraindicated", "Complete DPD deficiency should contraindicate treatment.");

console.log("XELOX / CAPOX live JSON tests passed.");
