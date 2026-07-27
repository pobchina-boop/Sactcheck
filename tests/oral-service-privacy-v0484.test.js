const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const oral = require(path.join(root, "js", "oral-medicine.js"));
const search = require(path.join(root, "js", "regimen-search.js"));

function load(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

assert.strictEqual(oral.version, "0.48.4");
assert.strictEqual(search.version, "0.48.4");
assert(oral.classify(load("protocols/breast/00414-palbociclib.json")).hasOral, "Palbociclib must be included in the oral-medicine category.");
assert(oral.classify(load("protocols/shared/00588-olaparib-tablet-monotherapy.json")).hasOral, "Olaparib must be included in the oral-medicine category.");
assert(oral.classify(load("protocols/gastrointestinal/00321-xelox-capox.json")).hasOral, "XELOX must be included because it contains capecitabine.");
assert(!oral.classify(load("protocols/genitourinary/00546-docetaxel-prednisolone.json")).hasOral, "An IV regimen must not be included solely because oral prednisolone is present.");

assert(search.matchesText("Palbociclib Ibrance oral anti-cancer medicine", "palbo"));
assert(search.matchesText("Olaparib Lynparza oral anti-cancer medicine", "oacm"));
assert(search.matchesText("Osimertinib oral anti-cancer medicine", "Tagrisso"));

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const loader = fs.readFileSync(path.join(root, "js", "protocol-loader.js"), "utf8");
const tissue = fs.readFileSync(path.join(root, "js", "tissue-ui.js"), "utf8");
assert(index.includes('value="oral_anti_cancer_medicines">Oral anti-cancer medicines</option>'));
assert(index.includes('No patient-identifiable information required'));
assert(!index.includes('Patient-agnostic'));
assert(!index.toLowerCase().includes('hypothetical'));
assert(index.includes('js/oral-medicine.js?v=0.48.4'));
assert(index.includes('treatment==="oral_anti_cancer_medicines"?oralMedicine:section===treatment'));
assert(loader.includes('card.dataset.oralMedicine = oral.hasOral ? "true" : "false"'));
assert(loader.includes('oralMedicineChipMarkup(protocol)'));
assert(tissue.includes('Oral anti-cancer medicines'));
console.log("v0.48.4 oral-service and privacy wording tests passed.");
