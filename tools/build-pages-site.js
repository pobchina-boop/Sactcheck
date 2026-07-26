#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "_site");

const topLevelFiles = [
  "index.html",
  "manifest.webmanifest",
  ".nojekyll"
];
const publicDirectories = ["assets", "css", "data", "docs", "icons", "js"];

function remove(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectory(source, destination) {
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (entry) => {
      const relative = path.relative(source, entry);
      if (!relative) return true;
      const segments = relative.split(path.sep);
      return !segments.some((segment) => [".git", ".github", "node_modules", "tests", "tools"].includes(segment));
    }
  });
}

function copyProtocolJson(sourceRoot, destinationRoot) {
  const stack = [sourceRoot];
  let count = 0;
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(sourceRoot, absolute);
      if (entry.isDirectory()) {
        if ([".git", ".github", "tests", "tools", "js", "protocols"].includes(entry.name)) continue;
        stack.push(absolute);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        copyFile(absolute, path.join(destinationRoot, relative));
        count += 1;
      }
    }
  }
  return count;
}

remove(out);
fs.mkdirSync(out, { recursive: true });

for (const file of topLevelFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    if (file === ".nojekyll") {
      fs.writeFileSync(path.join(out, file), "", "utf8");
      continue;
    }
    throw new Error(`Required public file is missing: ${file}`);
  }
  copyFile(source, path.join(out, file));
}

for (const directory of publicDirectories) {
  const source = path.join(root, directory);
  if (fs.existsSync(source)) copyDirectory(source, path.join(out, directory));
}

const protocolCount = copyProtocolJson(path.join(root, "protocols"), path.join(out, "protocols"));
if (!fs.existsSync(path.join(out, "protocols", "index.json"))) {
  throw new Error("Deployable site is missing protocols/index.json");
}

console.log(`Built deployable site at ${out}`);
console.log(`Copied ${protocolCount} protocol JSON files.`);
