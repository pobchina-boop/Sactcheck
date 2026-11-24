'use strict';
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const original = 'cfb827caf6e12cfaa0ee941696468ee96595ac3a';
const integrated = 'b373bf45522a1fec556eabf657daf3f72ab485c4';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const cache = new Map();
function verifiedSuccessor(file, previousHash) {
  if (!cache.has(file)) {
    const fromGit = commit => digest(execFileSync('git', ['show', commit + ':' + file], {cwd: root, maxBuffer: 16 * 1024 * 1024}));
    cache.set(file, [fromGit(original), fromGit(integrated)]);
  }
  const [before, after] = cache.get(file);
  assert.equal(previousHash, before, 'Archived input must match the GIST baseline for ' + file);
  assert.equal(digest(fs.readFileSync(path.join(root, file))), after, 'Installed input must match the cumulative AstraZeneca baseline for ' + file);
  return after;
}
function currentReport(report) {
  const result = {...report};
  for (const [field, file] of Object.entries({
    engine_sha256: 'js/assessment-engine.js',
    dose_model_sha256: 'js/protocol-dose-schedule.js',
    ui_sha256: 'js/generic-assessment-ui.js'
  })) {
    if (Object.hasOwn(result, field)) result[field] = verifiedSuccessor(file, result[field]);
  }
  if (result.runtime) result.runtime = result.runtime.map(row => ({
    ...row, sha256: verifiedSuccessor(row.path, row.sha256)
  }));
  return result;
}
function stageRuntimePins(directory) {
  for (const relative of ['input-manifest.json','delegated-00100-00680/input-manifest.json']) {
    const file = path.join(directory, relative);
    const manifest = JSON.parse(fs.readFileSync(file));
    const rows = manifest.runtime || manifest.files.filter(row => row.kind === 'actual_runtime');
    for (const row of rows) {
      const name = path.basename(row.path);
      row.sha256 = verifiedSuccessor('js/' + name, row.sha256);
      assert.equal(digest(fs.readFileSync(path.join(path.dirname(file),row.path))),row.sha256);
    }
    fs.writeFileSync(file, JSON.stringify(manifest,null,2) + '\n');
  }
}
module.exports = {verifiedSuccessor, currentReport, stageRuntimePins};
