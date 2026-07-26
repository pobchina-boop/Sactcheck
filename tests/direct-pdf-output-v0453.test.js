const assert = require("assert");
const fs = require("fs");
const os = require("os");
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
const Pdf = require(path.join(ROOT, "js/assessment-pdf.js"));

assert.strictEqual(Pdf.version, "0.45.3");
assert.strictEqual(Output.version, "0.45.3");

const protocol = readJson("protocols/breast/00722-tchp-docetaxel-carboplatin-trastuzumab-pertuzumab.json");
const result = sandbox.SACTCheckAssessmentEngine.assess(protocol, {
  anc: "0.8",
  platelets: "140",
  egfr: "75"
});
const model = Output.buildModel({
  result,
  protocol,
  assessmentId: "PDF-TEST-001",
  tumourGroup: "Breast",
  clinicianDecision: "hold",
  clinicianNote: "Repeat FBC and review before treatment.",
  appVersion: "0.45.3"
});

assert(model.allRows.length >= model.rows.length, "The direct PDF model must retain every entered printable row");
assert.strictEqual(Pdf.estimatePageCount(model), 1, "A routine assessment should default to one A4 page");

const bytes = Pdf.buildPdfBytes(model);
const content = Buffer.from(bytes).toString("latin1");
assert(content.startsWith("%PDF-1.4"), "The generated document must be a standard PDF");
assert.match(content, /\/Type \/Pages \/Count 1/);
assert.match(content, /Clinical decision support - not treatment clearance/i);
assert.match(content, /PDF-TEST-001/);
assert.match(content, /Repeat FBC and review before treatment/);

const exhaustive = {
  ...model,
  assessmentId: "PDF-EXHAUSTIVE-001",
  allRows: Array.from({ length: 42 }, (_, index) => ({
    label: `Clinical domain ${String(index + 1).padStart(2, "0")}`,
    actual: `${index + 1} entered units with additional contextual wording`,
    criterion: `Encoded criterion ${index + 1} requiring a longer explanatory comparison`,
    outcome: index % 5 === 0 ? "Criterion not met - review/hold pathway" : "Criterion met",
    outcomeKey: index % 5 === 0 ? "hold" : "met"
  })),
  rows: [],
  unassessed: "None among the domains selected for this exhaustive PDF pagination test.",
  clinicianNote: "A deliberately longer decision rationale is included to verify that the generated clinical document expands safely rather than clipping content or forcing the browser print dialogue."
};
const exhaustivePages = Pdf.estimatePageCount(exhaustive);
assert(exhaustivePages >= 2, "Exhaustive input should expand onto additional pages");
const exhaustiveBytes = Pdf.buildPdfBytes(exhaustive);
const exhaustiveContent = Buffer.from(exhaustiveBytes).toString("latin1");
assert.match(exhaustiveContent, new RegExp(`/Type /Pages /Count ${exhaustivePages}`));
assert.match(exhaustiveContent, /Clinical domain 42/);
assert.match(exhaustiveContent, new RegExp(`Page ${exhaustivePages} of ${exhaustivePages}`));

const tempPdf = path.join(os.tmpdir(), "sactcheck-v0453-direct-pdf-test.pdf");
fs.writeFileSync(tempPdf, Buffer.from(bytes));
assert(fs.statSync(tempPdf).size > 3000, "Generated PDF is unexpectedly small");

const ui = read("js/generic-assessment-ui.js");
assert(ui.includes('id="jsonGeneratePdf"'));
assert(ui.includes("AssessmentPdf.download"));
assert(ui.includes("AssessmentPdf.estimatePageCount"));
assert(!ui.includes("window.print()"), "The JSON output action must not use the browser print dialogue");
assert(!ui.includes('id="jsonPrintOnePage"'));

const index = read("index.html");
assert(index.includes("Version 0.46.0 · complete Head and Neck library"));
assert(index.includes("js/assessment-pdf.js?v=0.46.0"));
assert(index.indexOf("js/assessment-output.js") < index.indexOf("js/assessment-pdf.js"));
assert(index.indexOf("js/assessment-pdf.js") < index.indexOf("js/generic-assessment-ui.js"));

console.log(`v0.45.3 direct PDF tests passed (routine ${Pdf.estimatePageCount(model)} page; exhaustive ${exhaustivePages} pages).`);
