#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const site = path.join(root, "_site");
const forbiddenTopLevel = [".git", ".github", "tests", "tools", "node_modules", "package.json", "SECURITY.md"];
const required = ["index.html", "manifest.webmanifest", "js", "css", "protocols/index.json"];
const problems = [];

if (!fs.existsSync(site)) problems.push("_site directory does not exist");
for (const item of required) {
  if (!fs.existsSync(path.join(site, item))) problems.push(`missing required public item: ${item}`);
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
