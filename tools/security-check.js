#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const excludedDirectories = new Set([".git", "node_modules", "_site"]);
const forbiddenNames = [
  /^\.env(?:\.|$)/i,
  /^id_rsa(?:\.|$)/i,
  /^id_ed25519(?:\.|$)/i,
  /\.pem$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /credentials?\.json$/i,
  /service[-_]?account.*\.json$/i
];
const secretPatterns = [
  { name: "private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ }
];
const textExtensions = new Set([".html", ".js", ".css", ".json", ".md", ".txt", ".yml", ".yaml", ".xml", ".webmanifest"]);
const problems = [];
let scanned = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!entry.isFile()) continue;

    if (forbiddenNames.some((pattern) => pattern.test(entry.name))) {
      problems.push(`${relative}: forbidden credential/key filename`);
    }
    const stat = fs.statSync(absolute);
    if (stat.size > 20 * 1024 * 1024) {
      problems.push(`${relative}: file exceeds 20 MB`);
    }
    if (!textExtensions.has(path.extname(entry.name).toLowerCase()) && entry.name !== ".nojekyll") continue;
    if (stat.size > 5 * 1024 * 1024) continue;

    const text = fs.readFileSync(absolute, "utf8");
    scanned += 1;
    for (const pattern of secretPatterns) {
      if (pattern.regex.test(text)) problems.push(`${relative}: possible ${pattern.name}`);
    }
  }
}

walk(root);

if (problems.length) {
  console.error("Repository security check failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`Repository security check passed (${scanned} text files scanned).`);
