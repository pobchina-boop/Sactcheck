'use strict';

// Replay the original v61 cross-risk cases without rewriting their report or
// case script. The original script locates its clinical inputs three levels up.
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {ROOT, currentReplayHash, sha} = require('../tests/helpers/retrospective-v08462.cjs');

const directory = 'validation/sarcoma-v08461/retrospective';
const archive = path.join(ROOT, directory);
const script = 'cross-risk-cases.cjs';
const result = 'cross-risk-results.json';
const retained = JSON.parse(fs.readFileSync(path.join(archive,result)));
assert.equal(sha(fs.readFileSync(path.join(archive,script))), retained.script_sha256);
assert.equal(retained.total,52);
assert.equal(retained.passed,52);
assert.equal(retained.failed,0);

const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-retrospective-v08461-'));
try {
  const replay = path.join(temporary,directory);
  fs.mkdirSync(replay,{recursive:true});
  for (const name of ['js','protocols']) fs.symlinkSync(path.join(ROOT,name),path.join(temporary,name),'dir');
  const replayScript = path.join(replay,script);
  fs.copyFileSync(path.join(archive,script),replayScript);
  cp.execFileSync(process.execPath,[replayScript,'--record'],{cwd:temporary});
  const actual = JSON.parse(fs.readFileSync(path.join(replay,result)));
  const expected = structuredClone(retained);
  expected.engine_sha256 = require('./lib/sarcoma-engine-replay.cjs').publishedEngineHash(ROOT,expected.engine_sha256);
  expected.dose_model_sha256 = currentReplayHash('js/protocol-dose-schedule.js',retained.dose_model_sha256);
  assert.deepEqual(actual,expected,'Retrospective case results or input fingerprints changed');
  console.log('All 52 archived cross-risk findings and input identities passed with the reviewed dose-model transition.');
} finally {
  fs.rmSync(temporary,{recursive:true,force:true});
}
