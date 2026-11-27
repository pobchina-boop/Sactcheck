'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const migration=require('./helpers/retrospective-v08462.cjs');
const inventory=require('./helpers/live-inventory-v08462.cjs');
const record=JSON.parse(fs.readFileSync(migration.RECORD,'utf8'));
migration.createMigration(record);
assert.deepEqual(inventory,{total:380,solid:365,tissueContexts:461});
const sidecar=require('../data/regimen-card-metadata.json');
const catalogue=require('../protocols/index.json');
assert.equal(sidecar.protocol_count,inventory.total);
assert.deepEqual(sidecar.protocols.map(card=>card.id).sort(),catalogue.protocols.map(row=>row.id).sort());
for(const code of ['00921','00943']) {
  const id='nccp-'+code+'-v1';
  const card=sidecar.protocols.find(row=>row.id===id);
  assert.equal(card.path,catalogue.protocols.find(row=>row.id===id).path);
  assert.equal(card.complete,true,code+' should have a source-grounded intent, interval and duration');
  assert.deepEqual(card.unresolved,[]);
  assert.deepEqual(card.regimen_card.contexts.map(ctx=>ctx.indication_id),[code+'a']);
}

assert.deepEqual(migration.NEW_ROUTES,['00897','00926','00953']);
const newProtocol='protocols/gynaecology/00953-durvalumab-carboplatin-paclitaxel.json';
assert.equal(record.files[newProtocol].before,null);
assert(migration.isAddition(newProtocol));
assert(!migration.isAddition('protocols/index.json'));
assert(!migration.approvedPath('patient/00102/knowledge.html'));
assert(!migration.approvedPath('../unsafe'));
const altered=JSON.parse(JSON.stringify(record));
altered.files[newProtocol].after='0'.repeat(64);
assert.throws(()=>migration.createMigration(altered),/Immutable reviewed/);
assert.throws(()=>migration.expected('protocols/index.json','0'.repeat(64)),/origin/);
assert(migration.verify());
console.log('Durvalumab release transition, new routes, clinical source IDs, inherited files and tamper checks passed.');
