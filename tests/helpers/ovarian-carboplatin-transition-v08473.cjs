'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'../..');
const base = '16f504405ecf1333c2e7dbcac2c2a8ebab7ab3b1';
const protocols = {
  '00251': ['protocols/breast/00251-carboplatin-q28d.json','381f45f7145fedbfff0cb325cb5e2483cff07ffc60868a31683a7dcdc2faf185','fe95fffbddf664b6ec0ee0cf34e15f547425b9e08e79b2fe63d9e8efed0b8dc3'],
  '00261': ['protocols/breast/00261-carboplatin-q21d.json','fd4aed96c7a601738e4487e70f56fbfffa5d446985f2a90625aeadccfbe82c64','49b99cfda7bc94df618fbe9539336d0a9b95597fab8f9533a1999a7e731a0baa']
};
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function verify(code) {
  const [file,previousSha,currentSha]=protocols[code];
  const before=execFileSync('git',['show',base+':'+file],{cwd:root});
  const after=fs.readFileSync(path.join(root,file));
  assert.equal(digest(before),previousSha);
  assert.equal(digest(after),currentSha);
  const previous=JSON.parse(before), current=JSON.parse(after);
  const comparable=structuredClone(current);
  const conflict='CARBO'+code+'_INDICATION_CONTEXT_CONFLICT';
  const remaining=current.rule_engine.rules.filter(rule=>rule.id!==conflict);
  assert.equal(remaining.length,current.rule_engine.rules.length-1);
  const removed=code==='00251'?['CARBO00251_EXACT_ANC','CARBO00251_EXACT_PLATELETS']:[];
  assert.deepEqual(remaining,previous.rule_engine.rules.filter(rule=>!removed.includes(rule.id)));
  comparable.rule_engine.rules=previous.rule_engine.rules;
  comparable.monitoring.baseline=previous.monitoring.baseline;
  comparable.monitoring.regular=previous.monitoring.regular;
  if(code==='00251') {
    assert(!previous.input_definitions.indication_id);
    delete comparable.input_definitions.indication_id;
    comparable.metadata.audit_limitations=previous.metadata.audit_limitations;
  }
  assert.deepEqual(comparable,previous);
  return {file,previousSha,before};
}
module.exports={verify};
