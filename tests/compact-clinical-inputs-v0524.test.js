const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const uiSource = fs.readFileSync(path.join(root, "js", "generic-assessment-ui.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "protocol-dose-schedule.css"), "utf8");
const Titles = require(path.join(root, "js", "regimen-display-title.js"));

assert.strictEqual(pkg.version, "0.56.1");
assert(html.includes("SACTCheck v0.56.1 — Five-Regimen Knowledge Base Pilot"));
assert(html.includes("js/regimen-display-title.js?v=0.55.0"));
assert(html.includes("js/generic-assessment-ui.js?v=0.56.1"));
assert(html.includes("css/protocol-dose-schedule.css?v=0.55.0"));

assert(!uiSource.includes('placeholder="Not assessed"'), "Empty inputs must not display Not assessed.");
assert(!uiSource.includes('<option value="">Not assessed</option>'), "Blank selectors must not display Not assessed.");
assert(uiSource.includes('placeholder="Enter value"'));
assert(uiSource.includes('<option value="">Select…</option>'));
assert(uiSource.includes('laboratory-domains-grid'));
assert(uiSource.includes('laboratory-domain-chip'));
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'));
assert(css.includes('.laboratory-domain{display:contents}'));
assert(css.includes('.compact-input-state.hidden{display:none!important}'));
assert(uiSource.includes('ctcae-calculated-grade hidden'));
assert(!uiSource.includes('Enter a value to calculate the educational CTCAE grade.</div>'));

const cases = {
  "00260": "Weekly paclitaxel (post AC)",
  "00278": "Paclitaxel q14d (post dose-dense AC)",
  "00316": "Paclitaxel q14d + trastuzumab (post dose-dense AC)",
  "00432": "Weekly paclitaxel + trastuzumab (post AC)",
  "00433": "Weekly paclitaxel + trastuzumab (post dose-dense AC)",
  "00485": "Weekly paclitaxel (post dose-dense AC)",
  "00745": "Weekly paclitaxel + trastuzumab q21d (post dose-dense AC)",
  "00348": "Dose-dense AC (post carboplatin + weekly paclitaxel)",
  "00734": "Dose-dense AC (post weekly carboplatin + paclitaxel)"
};
for (const [code, expected] of Object.entries(cases)) {
  assert.strictEqual(Titles.forProtocol({ metadata: { nccp_regimen_code: code, short_title: "legacy" } }), expected);
}
assert.strictEqual(Titles.forProtocol({ metadata: { nccp_regimen_code: "00226", short_title: "Weekly paclitaxel" } }), "Weekly paclitaxel");

const ac = require(path.join(root, "protocols", "breast", "00260-ac-followed-by-weekly-paclitaxel.json"));
assert.strictEqual(Titles.forProtocol(ac), "Weekly paclitaxel (post AC)");
const acTh = require(path.join(root, "protocols", "breast", "00432-ac-weekly-paclitaxel-trastuzumab.json"));
assert.strictEqual(Titles.forProtocol(acTh), "Weekly paclitaxel + trastuzumab (post AC)");

console.log("v0.55.0 compact clinical-input and phase-first title tests passed.");
