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

// Remove the reviewed resolver and its two entry-point calls. Every remaining
// engine byte must match the archived predecessor used by the sarcoma replay.
function verifyAliasTransition(previous, current) {
  assert.equal(digest(previous), '70313c70157b05cfc35d423fe706921c5f0a10acefd92123063da24c3444f115');
  assert.equal(digest(current), '78a8390a1b6d0f2ebe063a3e40748b707be27837fbc315b8dfc4f6e9bd53ac7d');
  let source = current.toString('utf8');
  const start = source.indexOf('  // External callers may supply the NCCP indication code');
  const end = source.indexOf('  function protocolForIndication(', start);
  assert.ok(start >= 0 && end > start, 'Indication resolver block is missing');
  assert.equal(digest(source.slice(start, end)), 'ecc5bc227b116d90f8155f25c9dd0edb8c6d50234fc30b0035af776dac8c7dc1');
  source = source.slice(0, start) + source.slice(end);
  const call = '    rawInputs = resolveIndicationInput(protocol, rawInputs);\n';
  for (const entry of ['getInputDefinitions(protocol, profileId, rawInputs = {})', 'assess(protocol, rawInputs, options = {})']) {
    const header = '  function ' + entry + ' {\n';
    assert.ok(source.includes(header + call), 'Missing alias resolution in ' + entry);
    source = source.replace(header + call, header);
  }
  assert.deepEqual(Buffer.from(source), previous, 'Unreviewed assessment-engine change');
}

// The callers compare every retained clinical result and input.
function publishedEngineHash(root, retained) {
  const archived = revision => execFileSync('git', ['show', revision+':'+engine], {cwd:root});
  assert.equal(digest(archived(historical)), retained, 'Unexpected archived sarcoma engine');
  const released = archived(published);
  assert.equal(digest(released), 'd433a6adf0a8f5b4ecefb8e8832206425754bba0d01ebbaa6a6d1bda54262657');
  const candidate = archived('9049a163d44c9de14639e431f1cd8e6c11b9a0b4');
  const updated=fs.readFileSync(path.join(root,engine));
  assert.equal(digest(candidate),'aa67339da5bed5fa296192a086e26d7fda36f9a4cd75a3663c696607bfdba9f3');
  verifyAliasTransition(archived('1cea3d6140defcbc8a4fc29aca463b3b130e538f'), updated);
  return digest(updated);
}
module.exports = {publishedEngineHash};
