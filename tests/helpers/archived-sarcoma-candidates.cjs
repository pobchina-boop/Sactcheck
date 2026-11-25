'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const revision = 'd805cae5b329c0acd16b64a4a782f073878f494a';
function archived(file) {
  return execFileSync('git', ['show', revision + ':' + file], {cwd: root, maxBuffer: 32 * 1024 * 1024});
}
function candidates(codes) {
  const records = new Map();
  for (const code of codes) {
    const names = fs.readdirSync(path.join(root, 'protocols/sarcoma')).filter(f => f.startsWith(code + '-'));
    require('node:assert/strict').equal(names.length, 1);
    const file = 'protocols/sarcoma/' + names[0];
    const after_sha256 = crypto.createHash('sha256').update(archived(file)).digest('hex');
    records.set(code, {path: file, after_sha256});
  }
  return {records};
}
module.exports = {archived, candidates};
