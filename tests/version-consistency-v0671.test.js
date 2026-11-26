"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const readJson = rel => JSON.parse(read(rel));
const pkg = readJson("package.json");
const app = readJson("data/app-release.json");
const html = read("index.html");
assert.ok(pkg.version.localeCompare("0.67.1", undefined, { numeric: true }) >= 0);
assert.strictEqual(app.release, pkg.version);
const bootstrap = {};
vm.runInNewContext(read("js/sactcheck-release.js"), bootstrap);
assert.strictEqual(bootstrap.SACTCHECK_RELEASE, pkg.version, "Runtime bootstrap must match the published release; otherwise UI labels and clinical data caches revert");
assert.strictEqual(bootstrap.SACTCheckRelease.release, pkg.version);
assert.ok(html.includes(`<meta name="sactcheck-release" content="${pkg.version}">`));
assert.ok(html.includes(`SACTCheck v${pkg.version} · Feasibility evaluation build`), "Release remains visible in the footer after header simplification");
assert.ok(html.includes(`js/nccp-change-tracker.js?v=0.62.1&app=${pkg.version}`));
assert.ok(html.includes(`js/regimen-knowledge-base.js?v=${app.knowledge_module_release}&app=${pkg.version}`));
assert.ok(html.includes(`js/clinical-validation-workspace.js?v=${app.validation_module_release}&app=${pkg.version}`));
const trackerJs = read("js/nccp-change-tracker.js");
assert.ok(trackerJs.includes('version: "0.62.1"'));
assert.ok(trackerJs.includes('appVersion:'));
assert.strictEqual(readJson("data/nccp-change-tracker/change-feed.json").release, "0.62.1");
assert.strictEqual(readJson("data/regimen-knowledge-base-v0680.json").release, "0.68.0");
assert.strictEqual(readJson("data/clinical-validation-register-v0630.json").release, "0.68.0");
console.log("Cumulative public release and module version separation tests passed.");

// Exercise an upgrade with both an old release cache and stale unversioned JSON.
// Checking only the HTML label missed the 0.83.8 -> 0.83.7 runtime regression.
(async function verifyReleaseCacheUpgrade() {
  const origin = "https://sactcheck.com/";
  const protocolUrl = origin + "protocols/breast/example.json";
  const oldName = "sactcheck-runtime-previous";
  const priorRevisionName = `sactcheck-runtime-${pkg.version}`;
  const revisions = {"0.84.61":"ribo-20261119","0.84.62":"enhertu-20261123","0.84.63":"olaparib-20261124","0.84.64":"sarcoma-20261125","0.84.65":"gynae-20261125","0.84.66":"gynae-batch2-20261125","0.84.67":"flot-20261126","0.84.68":"gynae-batch3-20261126","0.84.69":"gynae-batch4-20261126"};
  const expectedRevision = revisions[pkg.version];
  assert(expectedRevision,"Review the cache revision for this release");
  const previousPublicCache = "sactcheck-runtime-0.84.61-" + revisions["0.84.61"];
  const previousContentCache = "sactcheck-runtime-0.84.62-durvalumab-20261123";
  const currentName = `${priorRevisionName}-${expectedRevision}`;
  const stores = new Map([[oldName, new Map()], [priorRevisionName, new Map([
    [protocolUrl+"?sact_release="+pkg.version, new Response(JSON.stringify({release: "stale-same-version"}))],
    [protocolUrl, new Response(JSON.stringify({release: "stale"}))]
  ])]]);
  if (pkg.version === "0.84.62") {
    stores.set(previousPublicCache, new Map());
    stores.set(previousContentCache, new Map([[protocolUrl+"?sact_release=0.84.62&sact_revision=durvalumab-20261123",new Response(JSON.stringify({release:"stale-same-release-enhertu-rules"}))]]));
  }
  const requests = [];
  const context = {
    URL, location: {href: origin},
    fetch: async url => { requests.push(String(url)); return new Response(JSON.stringify({release: pkg.version})); },
    caches: {
      keys: async () => [...stores.keys()],
      delete: async name => stores.delete(name),
      open: async name => {
        if (!stores.has(name)) stores.set(name, new Map());
        const entries = stores.get(name);
        return {match: async key => entries.get(key)?.clone(), put: async (key, value) => entries.set(key, value.clone())};
      }
    }
  };
  vm.runInNewContext(read("js/sactcheck-release.js"), context);
  vm.runInNewContext(read("js/runtime-performance-v0810.js"), context);
  const runtime = context.SACTCheckRuntimePerformanceV0810;
  assert.strictEqual(runtime.release, pkg.version);
  assert.strictEqual(runtime.cacheName, currentName);
  assert.strictEqual(context.SACTCHECK_DATA_REVISION,expectedRevision);
  assert.strictEqual(app.data_revision,expectedRevision,"Canonical release metadata records the active clinical-data revision");
  for(const file of ["js/sactcheck-release.js","js/runtime-performance-v0810.js","js/generic-assessment-ui.js","js/protocol-dose-schedule.js","js/regimen-knowledge-base.js","js/regimen-workflow-engine-v0750.js"]){
    const src=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]).find(src=>src.startsWith(file+"?"));
    assert(src,file+" is loaded");assert.strictEqual(new URL(src,origin).searchParams.get("review"),expectedRevision,file+" HTTP cache is revision scoped");
  }
  assert(html.indexOf('src="js/sactcheck-release.js?') < html.indexOf('src="js/runtime-performance-v0810.js?'),"Bootstrap revision loads before the cache supervisor");
  const first = await context.fetch(protocolUrl);
  assert.strictEqual((await first.json()).release, pkg.version, "Upgrade must not reuse stale unversioned JSON");
  assert.strictEqual(new URL(requests[0]).searchParams.get("sact_release"), pkg.version, "HTTP requests must carry the release, not just the CacheStorage name");
  assert.strictEqual(new URL(requests[0]).searchParams.get("sact_revision"),context.SACTCHECK_DATA_REVISION);
  const second = await context.fetch(protocolUrl);
  assert.strictEqual((await second.json()).release, pkg.version);
  assert.strictEqual(requests.length, 1, "Current-release cache reuse must still work");
  if (pkg.version === "0.84.62") assert.ok(!stores.has(previousPublicCache),"The superseded public cache should be pruned");
  assert.ok(!stores.has(oldName), "Previous runtime caches should be pruned");
  assert.ok(!stores.has(previousContentCache), "The earlier same-release clinical-data cache must be pruned");
  assert.strictEqual(new URL(runtime.canonicalUrl(origin + "patient/00722/guide.pdf")).search, "", "Patient PDF paths remain unchanged");
  console.log("Runtime release, stale-cache upgrade and current-release reuse checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
