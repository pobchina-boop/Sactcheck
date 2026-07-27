const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const exists = file => fs.existsSync(path.join(root, file));

const pkg = JSON.parse(read("package.json"));
const index = read("index.html");
const loader = read("js/protocol-loader.js");
const css = read("css/stability-v0481.css");

assert.strictEqual(pkg.version, "0.48.1");
assert(index.includes("SACTCheck v0.48.1 — stable feasibility study release"));
assert(index.includes('css/stability-v0481.css?v=0.48.1'));
assert(index.includes('id="aboutSactcheckTitle"'));
assert(index.includes("What SACTCheck is, and why it is being developed"));
assert(index.includes("Why it was created"));
assert(index.includes("What is being evaluated"));
assert(index.includes("agreement with independently adjudicated protocol-based answers"));
assert(index.includes('id="mobileOpenNote" hidden'));
assert(read("js/study-release.js").includes("mobileNote.hidden"));
assert(css.includes(".about-sactcheck-grid"));
assert(css.includes(".protocol-loader-partial"));

assert(loader.includes("const LOAD_CONCURRENCY = 8"));
assert(loader.includes("const FETCH_ATTEMPTS = 4"));
assert(loader.includes("RETRYABLE_HTTP_STATUS"));
assert(loader.includes("mapWithConcurrency"));
assert(loader.includes("retryFailedProtocols"));
assert(loader.includes("temporarily unavailable"));
assert(loader.includes("The available library remains usable"));
assert(!loader.includes("await Promise.all(enabledEntries.map"), "All protocol files must not be fetched simultaneously");
assert(loader.includes('version: "0.48.1"'));
assert(exists("RELEASE_NOTES_v0.48.1.md"));
assert(exists("GITHUB_COMMIT_v0.48.1.txt"));

console.log("v0.48.1 stability tests passed: protocol loading is concurrency-limited, transient errors retry safely and the opening page explains the project.");
