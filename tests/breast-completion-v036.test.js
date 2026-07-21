const assert = require('assert');
const fs = require('fs');
const path = require('path');
const index = JSON.parse(fs.readFileSync(path.join(__dirname,'..','protocols','index.json'),'utf8'));
const breast = index.protocols.filter(p => p.tumour_group === 'Breast');
assert.strictEqual(index.protocol_count, 121);
assert.strictEqual(new Set(index.protocols.map(p=>p.id)).size,index.protocols.length);
assert.strictEqual(new Set(index.protocols.map(p=>p.path)).size,index.protocols.length);
for (const code of ['00253','00285','00659','00776','00794','00936']) {
  assert(index.protocols.some(p => p.id.includes(code)), `Missing ${code}`);
}
console.log('v0.36.0 breast completion tests passed');
