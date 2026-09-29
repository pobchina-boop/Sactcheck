#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const site = path.join(root, "_site");
const forbiddenTopLevel = [".git", ".github", "tests", "tools", "node_modules", "package.json", "SECURITY.md"];
const required = [
  "index.html",
  "sustainability.html",
  "manifest.webmanifest",
  "js",
  "js/sustainability-module.js",
  "css",
  "data/sustainability-regimen-metadata-v0691.json",
  "protocols/index.json",
  // These public pages are encoded in printed regimen QR codes.
  "docs/patient/00831/index.html",
  "docs/patient/00831/guide.pdf",
  "docs/patient/00831/passport.pdf",
  "docs/patient/00831/contact-card.pdf",
  "docs/patient/assets/anatomy-hcc-v0762.png",
  "docs/patient/assets/toxicity-icons.svg"
];
const problems = [];

if (!fs.existsSync(site)) problems.push("_site directory does not exist");
for (const item of required) {
  if (!fs.existsSync(path.join(site, item))) problems.push(`missing required public item: ${item}`);
}
// Do not ship a QR pointing to a route absent from the same deployment.
const patientRoutes = ["00831"];
const supportModule = path.join(site, "js", "patient-support-v0750.js");
if (fs.existsSync(supportModule)) {
  const content = fs.readFileSync(supportModule, "utf8");
  for (const code of patientRoutes) {
    if (!content.includes(`code===\"${code}\"`)) {
      problems.push(`patient QR route ${code} missing from patient-support-v0750.js`);
    }
  }
} else {
  problems.push("missing patient QR routing module: js/patient-support-v0750.js");
}
for (const code of patientRoutes) {
  const page = path.join(site, "docs", "patient", code, "index.html");
  if (fs.existsSync(page) && !fs.readFileSync(page, "utf8").includes(`https://sactcheck.com/docs/patient/${code}/`)) {
    problems.push(`patient page ${code} does not identify its public QR destination`);
  }
}
for (const item of forbiddenTopLevel) {
  if (fs.existsSync(path.join(site, item))) problems.push(`forbidden development item exposed: ${item}`);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(site, absolute).replaceAll(path.sep, "/");
    if (entry.isDirectory()) walk(absolute);
    else if (/\.(?:pem|p12|pfx|key)$/i.test(entry.name) || /^\.env/i.test(entry.name)) {
      problems.push(`credential-like file in public artefact: ${relative}`);
    }
  }
}
walk(site);

if (problems.length) {
  console.error("Deployable-site validation failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("Deployable-site validation passed.");
