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
assert.ok(html.includes(`<span class="header-version">v${pkg.version}</span>`));
assert.ok(html.includes(`SACTCheck v${pkg.version} · Feasibility evaluation build`));
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
  const currentName = `sactcheck-runtime-${pkg.version}`;
  const stores = new Map([[oldName, new Map()], [currentName, new Map([
    [protocolUrl, new Response(JSON.stringify({release: "stale"}))]
  ])]]);
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
  const first = await context.fetch(protocolUrl);
  assert.strictEqual((await first.json()).release, pkg.version, "Upgrade must not reuse stale unversioned JSON");
  assert.strictEqual(new URL(requests[0]).searchParams.get("sact_release"), pkg.version, "HTTP requests must carry the release, not just the CacheStorage name");
  const second = await context.fetch(protocolUrl);
  assert.strictEqual((await second.json()).release, pkg.version);
  assert.strictEqual(requests.length, 1, "Current-release cache reuse must still work");
  assert.ok(!stores.has(oldName), "Previous runtime caches should be pruned");
  assert.strictEqual(new URL(runtime.canonicalUrl(origin + "patient/00722/guide.pdf")).search, "", "Patient PDF paths remain unchanged");
  console.log("Runtime release, stale-cache upgrade and current-release reuse checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
