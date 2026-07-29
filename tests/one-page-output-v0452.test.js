const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const read = relativePath => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const readJson = relativePath => JSON.parse(read(relativePath));

const sandbox = { console, Date, Intl };
sandbox.globalThis = sandbox;
vm.runInNewContext(read("js/rule-engine.js"), sandbox, { filename: "rule-engine.js" });
vm.runInNewContext(read("js/assessment-engine.js"), sandbox, { filename: "assessment-engine.js" });

const CourseMetadata = require(path.join(ROOT, "js/regimen-course-metadata.js"));
global.SACTCheckRegimenCourseMetadata = CourseMetadata;
delete require.cache[require.resolve(path.join(ROOT, "js/assessment-output.js"))];
const Output = require(path.join(ROOT, "js/assessment-output.js"));

assert.strictEqual(Output.version, "0.48.0");
assert.match(Output.disclaimer, /does not constitute treatment clearance/i);
assert.match(Output.disclaimer, /responsible oncology clinician retains responsibility/i);

const protocol = readJson("protocols/breast/00722-tchp-docetaxel-carboplatin-trastuzumab-pertuzumab.json");
const result = sandbox.SACTCheckAssessmentEngine.assess(protocol, { anc: "0.8" });
assert(result.findings.length > 0, "Fixture must produce an encoded assessment finding");

const model = Output.buildModel({
  result,
  protocol,
  assessmentId: "OUTPUT-TEST-001",
  tumourGroup: "Breast",
  clinicianDecision: "hold",
  clinicianNote: "Counts below the encoded threshold; repeat FBC and review.",
  appVersion: "0.48.0"
});

assert.strictEqual(model.assessmentId, "OUTPUT-TEST-001");
assert.strictEqual(model.tumourGroup, "Breast");
assert.strictEqual(model.clinicianDecision, "Hold or defer");
assert(model.rows.some(row => /ANC/i.test(row.label)), "One-page output must contain the entered ANC value");
assert(model.rows.some(row => /criterion not met|review\/hold pathway/i.test(row.outcome)), "Restrictive finding must remain visible");
assert.match(model.unassessed, /Platelet|domain|more|Not assessed|None/i);
assert.doesNotMatch(model.outcome.title, /safe to treat|treatment approved|cleared/i);

const html = Output.renderHtml(model);
assert(html.includes("assessment-print-sheet"));
assert(html.includes("Entered values and encoded criteria"));
assert(html.includes("Clinician decision"));
assert(html.includes("Clinical decision support - not treatment clearance"));
assert(html.includes("Hold or defer"));
assert(!html.includes("Safe to treat"));

const text = Output.toText(model);
assert.match(text, /Encoded criteria result:/);
assert.match(text, /Disclaimer:/);
assert.match(text, /Hold or defer/);

const ui = read("js/generic-assessment-ui.js");
assert(ui.includes('id="jsonOnePageSection"'));
assert(ui.includes('id="jsonClinicianDecision"'));
assert(ui.includes('id="jsonClinicianNote"'));
assert(ui.includes('id="jsonGeneratePdf"'));
assert(ui.includes("AssessmentOutput.buildModel"));
assert(ui.includes('id="jsonScreenDisclaimer"'));
assert(ui.includes('Final treatment suitability remains the responsibility'));
assert(ui.includes('version: "0.48.0"'));

const css = read("css/assessment-output.css");
assert(css.includes("@page{size:A4 portrait"));
assert(css.includes("max-height:275mm"));
assert(css.includes(".print-sheet-footer"));

const index = read("index.html");
assert(index.includes("v0.50.3 · What changed?"));
assert(index.includes("css/assessment-output.css?v=0.48.4"));
assert(index.includes("js/assessment-output.js?v=0.48.4"));
assert(index.indexOf("js/assessment-output.js") < index.indexOf("js/generic-assessment-ui.js"));

console.log(`v0.45.2 one-page clinical output tests passed (${model.rows.length} printable rows; ${result.unassessed.length} unassessed domains).`);
