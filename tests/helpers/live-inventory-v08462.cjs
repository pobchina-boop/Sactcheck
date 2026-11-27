'use strict';

// Replay the original clinical-ID transitions, then check every v0.84.72 catalogue row.
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {BASE_COMMIT, ROOT} = require('./retrospective-v08462.cjs');
const legacy = JSON.parse(execFileSync('git',['show',BASE_COMMIT+':protocols/index.json'],{cwd:ROOT,maxBuffer:4*1024*1024})).protocols;
const current = require('../../protocols/index.json').protocols;
assert.equal(legacy.length,377);
const priorId='nccp-00897-v3', updatedId='nccp-00897-v4', addedId='nccp-00953-v1a';
assert.equal(legacy.filter(r=>r.id===priorId).length,1);
assert(!legacy.some(r=>r.id===updatedId || r.id===addedId));
const revisedIds = new Map([[priorId, updatedId], ['nccp-00374-v4','nccp-00374-v4a'], ['nccp-00554-v2','nccp-00554-v3'], ['nccp-00811-v2','nccp-00811-v3'], ['nccp-00817-v2','nccp-00817-v3'], ['nccp-00375-v6','nccp-00375-v6a'], ['nccp-00247-v4','nccp-00247-v5'], ['nccp-00248-v4','nccp-00248-v5'], ['nccp-00249-v3','nccp-00249-v4'], ['nccp-00264-v3b','nccp-00264-v4'], ['nccp-00266-v4','nccp-00266-v5'], ['nccp-00267-v4','nccp-00267-v5'], ['nccp-00904-v1','nccp-00904-v2']]);
for (const id of revisedIds.keys()) assert.equal(legacy.filter(row => row.id === id).length, 1);
const newProtocols=[
  ['nccp-00921-v1','protocols/gynaecology/00921-mirvetuximab-soravtansine-therapy.json'],
  ['nccp-00943-v1','protocols/gynaecology/00943-pembrolizumab-cisplatin-chemoradiotherapy.json']
];
const expected=legacy.map(r=>revisedIds.get(r.id) || r.id).concat(addedId, newProtocols.map(([id])=>id)).sort();
assert.deepEqual(current.map(r=>r.id).sort(),expected);
const added=current.find(r=>r.id===addedId);
assert.equal(added.path,'protocols/gynaecology/00953-durvalumab-carboplatin-paclitaxel.json');
assert.equal(added.tumour_group,'Gynaecology');
// This is the v0.84.72 release tree. Verify paths, tissue groups, enabled flags and order,
// including the previous cervical changes. Only the two new single-tissue rows may be inserted.
const previousTree='0e5d5cd7452a38584c3fcf304ccd043cb40227a4';
const previous=JSON.parse(execFileSync('git',['show',previousTree+':protocols/index.json'],{cwd:ROOT})).protocols;
assert.equal(previous.length,378);
const newIds=new Set(newProtocols.map(([id])=>id));
assert.deepEqual(current.filter(row=>!newIds.has(row.id)),previous);
for (const [id,path] of newProtocols) {
  assert(!previous.some(row=>row.id===id || row.path===path));
  assert.deepEqual(current.find(row=>row.id===id),{id,tumour_group:'Gynaecology',path,enabled:true,mode:'live_json'});
}
module.exports={total:expected.length,solid:363+newProtocols.length,tissueContexts:459+newProtocols.length};
