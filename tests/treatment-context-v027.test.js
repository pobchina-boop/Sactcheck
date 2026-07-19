"use strict";
const assert = require("assert");
const fs = require("fs");
const Engine = require("../js/assessment-engine.js");

const carbo = JSON.parse(fs.readFileSync("protocols/lung/00271-carboplatin-etoposide.json", "utf8"));
const atezo = JSON.parse(fs.readFileSync("protocols/lung/00593-atezolizumab-maintenance.json", "utf8"));

let definitions = Engine.getInputDefinitions(carbo, "default");
const ids = definitions.map(definition => definition.id);
assert(ids.includes("indication_id"), "carboplatin/etoposide must expose indication");
assert(ids.includes("etoposide_schedule"), "carboplatin/etoposide must expose etoposide schedule");
assert.equal(definitions.find(definition => definition.id === "indication_id").ui_section, "treatment_context");
assert.equal(definitions.find(definition => definition.id === "etoposide_schedule").ui_section, "treatment_context");

const inputs = Object.fromEntries(definitions.map(definition => [definition.id, definition.demo_value]));
let result = Engine.assess(carbo, inputs, { profileId: "default" });
assert.equal(result.context.indicationId, "00271a");
assert(result.context.indicationLabel.includes("small-cell lung cancer"));
assert.equal(result.context.schedule, "iv_days_1_to_3");
let summary = Engine.documentationSummary(result, "TEST-CONTEXT");
assert(summary.includes("Indication:"), "copyable summary must include indication");

const atezoDefinitions = Engine.getInputDefinitions(atezo, "default");
const indication = atezoDefinitions.find(definition => definition.id === "indication_id");
assert(indication, "multi-indication ICI must expose an indication dropdown");
assert.equal(indication.options.length, 6, "current atezolizumab v10a indications must be selectable");

const ui = fs.readFileSync("js/generic-assessment-ui.js", "utf8");
assert(ui.includes("Protocol and treatment context"));
assert(ui.includes("jsonTreatmentContextGrid"));
assert(ui.includes("isTreatmentContext"));
assert(ui.includes("jsonOfficialPdf"));

console.log("v0.27 protocol and treatment-context tests passed.");
