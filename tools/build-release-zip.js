#!/usr/bin/env node
"use strict";
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const out = path.join(path.dirname(root), `SACTCheck_v${pkg.version}_Technical_Consolidation.zip`);
const exclusions = [
  '.git/*', 'node_modules/*', 'protocols/protocols/*',
  'INSTALL_v0.*', 'DROP_IN_FILE_LIST_v0.*', 'VALIDATION_v0.*',
  'GITHUB_COMMIT_v0.*', '*.zip'
];
if (fs.existsSync(out)) fs.unlinkSync(out);
const args = ['-qr', out, path.basename(root), ...exclusions.flatMap(x => ['-x', `${path.basename(root)}/${x}`])];
execFileSync('zip', args, { cwd: path.dirname(root), stdio: 'inherit' });
console.log(`Created ${out}`);
