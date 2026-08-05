const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const loader = fs.readFileSync(path.join(root, "js", "protocol-loader.js"), "utf8");
const ui = fs.readFileSync(path.join(root, "js", "generic-assessment-ui.js"), "utf8");
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "protocols", "index.json"), "utf8"));
const rows = Array.isArray(catalogue) ? catalogue : catalogue.protocols;
const haemRows = rows.filter(row => row.enabled !== false && /protocols\/haemato-oncology\/plasma-cell\//.test(row.path));

assert.strictEqual(pkg.version, "0.56.0");
assert(index.includes("SACTCheck v0.56.0 — Clinical scenario interpreter and regimen information"));
assert.strictEqual(haemRows.length, 15, "Expected 15 active Haematology protocols");

for (const row of haemRows) {
  const protocol = JSON.parse(fs.readFileSync(path.join(root, row.path), "utf8"));
  const url = protocol.metadata && protocol.metadata.source_url;
  assert(/^https:\/\/healthservice\.hse\.ie\/documents\/[^\s]+\.pdf$/i.test(url), `${row.id} does not have a direct official HSE PDF URL`);
}

assert(!loader.includes('link.target = "_blank"'), "Generated protocol card links must not force a new tab");
assert(!loader.includes('aria-label="Open the official NCCP protocol PDF in a new tab"'));
assert(loader.includes('link.referrerPolicy = "no-referrer"'));
assert(loader.includes('referrerpolicy="no-referrer" aria-label="Open the official NCCP protocol PDF"'));
assert(!ui.includes('id="jsonOfficialPdf" target="_blank"'));
assert(!ui.includes('id="jsonResultOfficialPdf" target="_blank"'));
assert(ui.includes('id="jsonOfficialPdf" rel="external" referrerpolicy="no-referrer"'));
assert(ui.includes('id="jsonResultOfficialPdf" rel="external" referrerpolicy="no-referrer"'));

console.log("v0.51.0 Haematology NCCP link reliability tests passed: 15 direct official PDF links, same tab navigation enabled.");
