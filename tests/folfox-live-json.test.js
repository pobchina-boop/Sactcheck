const assert = require("assert");
const fs = require("fs");
const Engine = require("../js/assessment-engine.js");
const Validator = require("../js/protocol-validator.js");

const protocol = JSON.parse(fs.readFileSync("protocols/gastrointestinal/00209-modified-folfox6.json", "utf8"));
const validation = Validator.validate(protocol, { strict: true });
assert.strictEqual(validation.valid, true, Validator.formatIssues(validation).join("\n"));
assert.strictEqual(protocol.metadata.migration.mode, "live_json");
assert.strictEqual(protocol.metadata.migration.switch_to_generic_assessment, true);
assert.ok(protocol.metadata.source_url.endsWith("209_v10a_FOLFOX_6_Modified.pdf"));

function assess(inputs) { return Engine.assess(protocol, inputs); }

let result = assess({ anc_x10e9_l: 1.4, platelets_x10e9_l: 200, delay_weeks: 0 });
assert.strictEqual(result.actionType, "withhold", "ANC below 1.5 on Day 1 should hold treatment.");

result = assess({ platelets_x10e9_l: 70, anc_x10e9_l: 2, delay_weeks: 0 });
assert.strictEqual(result.actionType, "withhold", "Platelets below 75 on Day 1 should hold treatment.");

result = assess({ crcl_ml_min: 25, haemodialysis: false });
assert.ok(["consultant_review", "dose_reduce"].includes(result.actionType), "CrCl below 30 should trigger the encoded oxaliplatin modification pathway.");

result = assess({ diarrhoea_current_grade: 2, diarrhoea_duration_weeks: 0 });
assert.strictEqual(result.actionType, "withhold", "Current grade 2 diarrhoea should hold treatment.");

result = assess({ stomatitis_current_grade: 2, stomatitis_duration_weeks: 0 });
assert.strictEqual(result.actionType, "withhold", "Current grade 2 stomatitis should hold treatment.");

result = assess({ neuropathy_grade: 4 });
assert.ok(["discontinue", "dose_reduce"].includes(result.actionType), "Grade 4 neuropathy should trigger oxaliplatin discontinuation.");

console.log("Modified FOLFOX-6 live JSON tests passed.");
