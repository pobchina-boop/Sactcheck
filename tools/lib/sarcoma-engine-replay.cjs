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
  assert(fs.readFileSync(path.join(root,engine)).equals(released), 'Current engine differs from its reviewed published successor');
  return digest(released);
}
module.exports = {publishedEngineHash};
