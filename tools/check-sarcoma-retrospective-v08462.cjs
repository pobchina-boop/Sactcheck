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
  assert.equal(actual.passed,52);
  assert.equal(actual.failed,0);
  const pair=require('../tests/helpers/ifosfamide-pair-v08462.cjs');
  for(const entry of expected.protocols.filter(p=>['00391','00392'].includes(p.code))){
    const current=JSON.parse(fs.readFileSync(path.join(ROOT,entry.path)));
    const migration=pair.validate(current);
    assert.equal(entry.sha256,migration.released_v61_sha256);
    entry.sha256=migration.after_sha256;
  }
  // Each live case already asserted its protocol-specific clinical contract.
  // Compare every retained input, label, outcome and unrelated observation.
  for(let i=0;i<actual.results.length;i++){
    const row=actual.results[i],prior=expected.results[i];
    if(['00391','00392'].includes(row.code)){
      assert(row.passed && !row.error);
      const preserved=row.observed.findings.filter(f=>!f.rule.startsWith('IFO_PRODUCT_') && !f.rule.startsWith('IFO_CNS_'));
      assert.deepEqual(preserved,prior.observed.findings.filter(f=>!f.rule.startsWith('IFO_CNS_')));
      assert.deepEqual(row.observed.invalid,prior.observed.invalid);
      assert.deepEqual(row.observed.components.filter(c=>c.id!=='ifosfamide'),prior.observed.components.filter(c=>c.id!=='ifosfamide'));
      expected.results[i]={...prior,observed:row.observed};
    }
  }
  assert.deepEqual(actual,expected,'Retrospective case results or input fingerprints changed');
  console.log('All 52 cross-risk contracts passed on the current clinical files, including the reviewed ifosfamide overlays.');
} finally {
  fs.rmSync(temporary,{recursive:true,force:true});
}
