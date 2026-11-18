'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const registry=require('../js/patient-asset-registry-v0810.js');
const check=require('./helpers/head-neck-suite-registration-v08445.cjs').registry;
const prior=Object.keys(JSON.parse(fs.readFileSync(path.join(root,'data/protected-patient-assets-v0810.json'))).assets);
check(registry.codes,prior);
assert.equal(registry.codes.length,272);
for(const code of ['00453','00602','00807','00885','00894','00945','00500','00391','00392','00501','00511']) {
 assert.throws(()=>check(registry.codes.filter(x=>x!==code),prior),'Missing '+code+' must fail');
 const migration=JSON.parse(fs.readFileSync(path.join(root,'validation/'+(code==='00500'||code==='00391'||code==='00392'||code==='00501'||code==='00511'?'sarcoma-v08460':'gu-v08459')+'/asset-migrations.json')));
 for(const name of ['index.html','guide.pdf','passport.pdf'])assert(migration.files['patient/'+code+'/'+name],'Recorded asset '+code+'/'+name);
}
assert.throws(()=>check([...registry.codes,'99999'],prior),'Unknown route must fail');
assert.throws(()=>check([...registry.codes,registry.codes[0]],prior),'Duplicate route must fail');
const repair=require('./helpers/release-repair-v08460.cjs');repair.verify();
assert.throws(()=>repair.expected('tests/helpers/head-neck-suite-registration-v08445.cjs','0'.repeat(64),1));
assert.deepEqual(repair.expected('patient/00500/guide.pdf','protected',123),{sha256:'protected',bytes:123});
console.log('Registry repair: exact 272 routes, all 11 added routes and 33 recorded assets, missing/unknown/duplicate rejection, exact repair provenance pass.');
