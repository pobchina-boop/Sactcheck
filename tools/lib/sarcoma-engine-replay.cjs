'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const engine = 'js/assessment-engine.js';
const historical = 'fe7f52c95cb2d00d220625a45683180d2a3565bd';
const published = '0dd8f23fbdf18895fc1ca2aeb45e5cfa6ac380aa';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

// Authenticate the historical engine and the exact olaparib-era successor
// already on main. The callers still compare every clinical result and input.
function publishedEngineHash(root, retained) {
  const archived = revision => execFileSync('git', ['show', revision+':'+engine], {cwd:root});
  assert.equal(digest(archived(historical)), retained, 'Unexpected archived sarcoma engine');
  const released = archived(published);
  assert.equal(digest(released), 'd433a6adf0a8f5b4ecefb8e8832206425754bba0d01ebbaa6a6d1bda54262657');
  const candidate = archived('9049a163d44c9de14639e431f1cd8e6c11b9a0b4');
  const updated=fs.readFileSync(path.join(root,engine));
  assert.equal(digest(candidate),'aa67339da5bed5fa296192a086e26d7fda36f9a4cd75a3663c696607bfdba9f3');
  assert.equal(digest(updated),'70313c70157b05cfc35d423fe706921c5f0a10acefd92123063da24c3444f115','Exact assessment engine with raw input dependencies');
  return digest(updated);
}
module.exports = {publishedEngineHash};
