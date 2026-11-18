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

// Exercise the missing route-list coverage separately from full historical Git checks.
const crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const releases=[['gu-v08458',['00282','00622','00628','00450','00759','00333','00337','00338','00583','00846']],['gu-v08459',['00453','00602','00807','00885','00894','00945']],['sarcoma-v08460',['00500','00391','00392','00501','00511']]];
const records=releases.map(([dir])=>JSON.parse(fs.readFileSync(path.join(root,'validation',dir,'asset-migrations.json'))));
for(const tool of ['tools/system-health-audit-v0810.js','tools/validate-pages-site.js','tests/v0810-architecture-consolidation.test.js']){
 const src=fs.readFileSync(path.join(root,tool),'utf8');
 for(const version of ['08458','08459','08460'])assert(src.includes('retrospective-v'+version+'.cjs'),tool+' covers '+version);
}
let assets=0;
for(let i=0;i<releases.length;i++)for(const code of releases[i][1])for(const name of ['index.html','guide.pdf','passport.pdf']){
 const rel='patient/'+code+'/'+name;let expected=null;
 for(let j=i;j<records.length;j++){const transition=records[j].files[rel];if(transition){assert.equal(transition.before,expected,rel+' transition continuity');expected=transition.after;}}
 assert(expected,rel+' exact recorded hash');assert.equal(hash(fs.readFileSync(path.join(root,rel))),expected,rel+' bytes');assets++;
}
assert.equal(assets,63);console.log('All three route-list consumers cover v58-v60; all 63 affected assets match their continuous recorded transitions. Full historical audit remains a separate required check.');
