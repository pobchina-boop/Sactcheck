"use strict";
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const loader = fs.readFileSync("js/protocol-loader.js", "utf8");
const index = JSON.parse(fs.readFileSync("protocols/index.json", "utf8"));

const entries = index.protocols.filter(item => item.id === "nccp-00655-v3a");
assert.equal(entries.length, 1, "NCCP 00655 must have one index entry.");
assert.equal(entries[0].legacy_card_id, "openDurvalumab", "The JSON protocol must replace the existing durvalumab catalogue card.");
assert.equal((html.match(/id="openDurvalumab"/g) || []).length, 1, "The legacy durvalumab card must expose one integration target.");
assert(loader.includes("integrateExistingCard"), "JSON protocols must integrate with an existing card when configured.");
assert(html.includes("js/protocol-loader.js?v=0.30.0"), "The loader cache key must be updated for the hotfix.");

console.log("v0.30.0 durvalumab duplicate-card regression tests passed.");
