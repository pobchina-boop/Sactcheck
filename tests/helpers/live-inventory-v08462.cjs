'use strict';

// Keep every pre-existing index row and identify the two source-confirmed changes.
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {BASE_COMMIT, ROOT} = require('./retrospective-v08462.cjs');
const legacy = JSON.parse(execFileSync('git',['show',BASE_COMMIT+':protocols/index.json'],{cwd:ROOT,maxBuffer:4*1024*1024})).protocols;
const current = require('../../protocols/index.json').protocols;
assert.equal(legacy.length,377);
const priorId='nccp-00897-v3', updatedId='nccp-00897-v4', addedId='nccp-00953-v1a';
assert.equal(legacy.filter(r=>r.id===priorId).length,1);
assert(!legacy.some(r=>r.id===updatedId || r.id===addedId));
const expected=legacy.map(r=>r.id===priorId ? updatedId : r.id).concat(addedId).sort();
assert.deepEqual(current.map(r=>r.id).sort(),expected);
const added=current.find(r=>r.id===addedId);
assert.equal(added.path,'protocols/gynaecology/00953-durvalumab-carboplatin-paclitaxel.json');
assert.equal(added.tumour_group,'Gynaecology');
module.exports={total:expected.length,solid:362+1,tissueContexts:458+1};
