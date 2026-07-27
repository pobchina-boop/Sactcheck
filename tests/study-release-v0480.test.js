const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const exists = file => fs.existsSync(path.join(root, file));
const index = read("index.html");
const pkg = JSON.parse(read("package.json"));
const protocolIndex = JSON.parse(read("protocols/index.json"));

assert(pkg.version.localeCompare("0.48.0", undefined, { numeric: true }) >= 0);
assert.strictEqual(protocolIndex.protocol_count, 361);
assert(index.includes("SACTCheck v0.48.2 — CTCAE haematology education update"));
assert(index.includes('class="app-header"'));
assert(index.includes('assets/branding/sactcheck-mark.svg'));
assert(index.includes('class="study-hero library-only"'));
assert(index.includes('id="studyWelcomeModal"'));
assert(index.includes('data-open-study-info'));
assert(index.includes('docs/STUDY_QUICK_START_v0.48.0.html'));
assert(index.includes('css/study-release-v0480.css?v=0.48.2'));
assert(index.includes('js/study-release.js?v=0.48.2'));
assert(!index.includes("Demonstration prototype only."));
assert(index.includes("Use hypothetical, non-identifiable scenarios only."));

for (const file of [
  "assets/branding/sactcheck-mark.svg",
  "assets/branding/sactcheck-logo.svg",
  "assets/branding/sactcheck-logo.png",
  "icons/favicon-32.png",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "manifest.webmanifest",
  "docs/STUDY_QUICK_START_v0.48.0.html",
  "docs/FEASIBILITY_FEEDBACK_FORM_v0.48.0.md",
  "docs/STUDY_INVITATION_v0.48.0.txt",
  "RELEASE_NOTES_v0.48.0.md",
  "GITHUB_COMMIT_v0.48.0.txt"
]) assert(exists(file), `${file} is missing`);

const manifest = JSON.parse(read("manifest.webmanifest"));
assert.strictEqual(manifest.name, "SACTCheck");
assert.strictEqual(manifest.display, "standalone");
assert.strictEqual(manifest.icons.length, 2);
const studyJs = read("js/study-release.js");
assert(studyJs.includes('const VERSION = "0.48.2"'));
assert(studyJs.includes("sactcheck:hide-study-welcome:v1"));
assert(read("TODO.md").includes("Feasibility study release follow-up — explainer video"));
console.log("v0.48.0 study-release tests passed: branded header, onboarding, installable icons and tester support pack are present.");
