"use strict";
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const loader = fs.readFileSync("js/protocol-loader.js", "utf8");
const index = JSON.parse(fs.readFileSync("protocols/index.json", "utf8"));

const carboplatinEtoposideEntries = index.protocols.filter(item => item.id === "nccp-00271-v7");
assert.equal(carboplatinEtoposideEntries.length, 1, "NCCP 00271 must have one index entry.");
assert.equal(carboplatinEtoposideEntries[0].legacy_card_id, "openCarboEtop", "The JSON protocol must replace the existing catalogue card.");
assert.equal((html.match(/id="openCarboEtop"/g) || []).length, 1, "The legacy catalogue card must expose one integration target.");
assert(loader.includes("updateIntegratedCardMetadata"), "Integrated cards must be refreshed from current JSON metadata.");
assert(loader.includes("updateIntegratedCardMetadata(entry, protocol, card)"), "Metadata refresh must run during integration.");
assert(html.includes("js/protocol-loader.js?v=0.36.0"), "The loader cache key must be updated for the hotfix.");

console.log("v0.30.0 duplicate-card regression tests passed.");
