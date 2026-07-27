const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function loadContextModule() {
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, "js/protocol-context.js"), "utf8"),
    sandbox,
    { filename: "protocol-context.js" }
  );
  return sandbox.SACTCheckProtocolContext;
}

const Context = loadContextModule();
assert(Context, "Protocol context resolver must load");
assert.strictEqual(Context.version, "0.48.0");

const avelumab = readJson("protocols/genitourinary/00535-avelumab-monotherapy.json");
const cemiplimab = readJson("protocols/gynaecology/00812-cemiplimab-therapy.json");
const nivoIpi = readJson("protocols/shared/00551-nivolumab-3-mg-kg-with-ipilimumab-1-mg-kg-therapy.json");

const avelumabGu = Context.descriptionForTissue(avelumab, "Genitourinary", { scope: "card" });
const avelumabSkin = Context.descriptionForTissue(avelumab, "Skin/Melanoma", { scope: "card" });
assert.match(avelumabGu, /urothelial carcinoma/i);
assert.doesNotMatch(avelumabGu, /Merkel/i);
assert.match(avelumabSkin, /Merkel cell carcinoma/i);
assert.doesNotMatch(avelumabSkin, /urothelial/i);
assert.strictEqual(Context.preferredIndicationId(avelumab, "Skin/Melanoma"), "00535a");
assert.strictEqual(Context.preferredIndicationId(avelumab, "Genitourinary"), "00535-gu");

const cemiplimabGyn = Context.descriptionForTissue(cemiplimab, "Gynaecology", { scope: "card" });
const cemiplimabSkin = Context.descriptionForTissue(cemiplimab, "Skin/Melanoma", { scope: "card" });
assert.match(cemiplimabGyn, /cervical cancer/i);
assert.doesNotMatch(cemiplimabGyn, /cutaneous squamous/i);
assert.match(cemiplimabSkin, /cutaneous squamous-cell carcinoma/i);
assert.doesNotMatch(cemiplimabSkin, /cervical cancer/i);
assert.strictEqual(Context.preferredIndicationId(cemiplimab, "Skin/Melanoma"), "00812b");

assert.match(Context.descriptionForTissue(nivoIpi, "Gastrointestinal"), /colorectal cancer/i);
assert.match(Context.descriptionForTissue(nivoIpi, "Genitourinary"), /renal-cell carcinoma/i);
assert.match(Context.descriptionForTissue(nivoIpi, "Skin/Melanoma"), /advanced melanoma/i);
assert.strictEqual(Context.preferredIndicationId(nivoIpi, "Skin/Melanoma"), "00551b-skin");

const allDescription = Context.descriptionForTissue(avelumab, "all");
assert.match(allDescription, /Shared regimen/i);
assert.match(allDescription, /Select a tumour site/i);
assert.doesNotMatch(allDescription, /^First-line maintenance/i);

for (const [protocol, expectedGroup] of [
  [avelumab, "Skin/Melanoma"],
  [cemiplimab, "Skin/Melanoma"],
  [nivoIpi, "Skin/Melanoma"]
]) {
  const relevant = Context.indicationsForTissue(protocol, expectedGroup);
  assert(relevant.length >= 1, `${protocol.protocol_id} must have a skin-context indication`);
  relevant.forEach(indication => {
    assert(Context.indicationGroups(indication, protocol).includes(expectedGroup));
  });
}

const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
assert(indexHtml.includes("js/protocol-context.js?v=0.48.2"));
assert(indexHtml.indexOf("js/protocol-context.js") < indexHtml.indexOf("js/assessment-engine.js"));

const tissueUi = fs.readFileSync(path.join(ROOT, "js/tissue-ui.js"), "utf8");
assert(tissueUi.includes("descriptionForTissue"), "Tissue UI must refresh card descriptions on filter changes");

const genericUi = fs.readFileSync(path.join(ROOT, "js/generic-assessment-ui.js"), "utf8");
assert(genericUi.includes("preferredIndicationId"), "Assessment UI must preselect the tissue-context indication");
assert(genericUi.includes("shared protocol"), "Assessment UI must display the active shared-protocol context");

const protocolIndex = readJson("protocols/index.json");
let contextualised = 0;
let unresolved = 0;
for (const entry of protocolIndex.protocols) {
  const groups = Array.isArray(entry.tumour_group) ? entry.tumour_group : [entry.tumour_group];
  if (groups.filter(Boolean).length <= 1) continue;
  const protocol = readJson(entry.path);
  for (const indication of protocol.indications || []) {
    if (!indication || !indication.description) continue;
    const mapped = Context.indicationGroups(indication, protocol);
    if (mapped.length) contextualised += 1;
    else unresolved += 1;
  }
}
assert(contextualised >= 130, `Expected at least 130 tissue-contextualised indications, found ${contextualised}`);
assert(unresolved <= 3, `Expected no more than 3 source/index mismatches, found ${unresolved}`);

console.log(`v0.45.1 contextual shared-indication tests passed (${contextualised} mapped; ${unresolved} source/index mismatches flagged).`);
