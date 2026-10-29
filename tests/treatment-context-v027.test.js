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
Object.assign(inputs, { indication_id: "00271a", etoposide_schedule: "iv_days_1_to_3" });
let result = Engine.assess(carbo, inputs, { profileId: "default" });
assert.equal(result.context.indicationId, "00271a");
assert(/small-cell lung cancer/i.test(result.context.indicationLabel));
assert.equal(result.context.schedule, "iv_days_1_to_3");
let summary = Engine.documentationSummary(result, "TEST-CONTEXT");
assert(summary.includes("Indication:"), "copyable summary must include indication");

const atezoDefinitions = Engine.getInputDefinitions(atezo, "default");
const indication = atezoDefinitions.find(definition => definition.id === "indication_id");
assert(indication, "multi-indication ICI must expose an indication dropdown");
assert.equal(atezo.indications.length,6,"Six source indications remain distinct from legacy aliases");
for(const source of atezo.indications)assert(indication.options.some(o=>o.value===(source.indication_id||source.id)),"Every current source indication is selectable");
const legacy=indication.options.filter(o=>!atezo.indications.some(i=>(i.indication_id||i.id)===o.value));
assert.equal(legacy.length,2);assert(legacy.every(o=>/Legacy.*select the specific/i.test(o.label)),"Legacy saved contexts must visibly require a specific current indication");

const ui = fs.readFileSync("js/generic-assessment-ui.js", "utf8");
assert(ui.includes("Protocol and treatment context"));
assert(ui.includes("jsonTreatmentContextGrid"));
assert(ui.includes("isTreatmentContext"));
assert(ui.includes("jsonOfficialPdf"));

console.log("v0.27 protocol and treatment-context tests passed.");

// Blank input must never match an id-only legacy record; support every declared identifier.
const pembro=JSON.parse(fs.readFileSync('protocols/shared/00455-pembrolizumab-200-mg-monotherapy.json','utf8'));
for(const indication_id of [undefined,null,''])assert.equal(Engine.assess(pembro,{indication_id},{profileId:'default'}).context.indicationLabel,pembro.metadata.indication);
for(const indication_id of ['00455-lung','00455a'])assert.match(Engine.assess(pembro,{indication_id},{profileId:'default'}).context.indicationLabel,/First-line metastatic NSCLC/);
assert.match(Engine.assess(pembro,{indication_id:'00455-gu'},{profileId:'default'}).context.indicationLabel,/Legacy genitourinary/);
