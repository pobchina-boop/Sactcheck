const gynae74 = require('./helpers/retrospective-v08474.cjs').inventory;
const gynae73 = require('./helpers/retrospective-v08473.cjs').inventory;
const gynae72 = require('./helpers/retrospective-v08472.cjs').inventory;
const gynae71 = require('./helpers/retrospective-v08471.cjs').inventory;
const gynae70 = require('./helpers/retrospective-v08470.cjs').inventory;
const gynae69 = require('./helpers/retrospective-v08469.cjs').inventory;
const gynae68 = require('./helpers/retrospective-v08468.cjs').inventory;
const flot67 = require('./helpers/retrospective-v08467.cjs').inventory;
const gynae66 = require('./helpers/retrospective-v08466.cjs').inventory;
'use strict';
const gynae65 = require('./helpers/retrospective-v08465.cjs').inventory;
const gynaecologyCounts = require('./helpers/gynaecology-00862-00929.cjs').inventory;
const sarcomaCounts = require('./helpers/retrospective-v08464.cjs').inventory;
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const registry=require('../js/patient-asset-registry-v0810.js');
const check=require('./helpers/head-neck-suite-registration-v08445.cjs').registry;
const prior=Object.keys(JSON.parse(fs.readFileSync(path.join(root,'data/protected-patient-assets-v0810.json'))).assets);
check(registry.codes,prior);
const release=require('../package.json').version;
assert.equal(registry.codes.length,release==='0.84.74'?gynae74.codes:release==='0.84.73'?gynae73.codes:release==='0.84.72'?gynae72.codes:release==='0.84.71'?gynae71.codes:release==='0.84.70'?gynae70.codes:release==='0.84.69'?gynae69.codes:release==='0.84.68'?gynae68.codes:release==='0.84.67'?flot67.codes:release==='0.84.66'?gynae66.codes:release==='0.84.65'?gynae65.codes:release==='0.84.64'?sarcomaCounts.codes:release==='0.84.63'?gynaecologyCounts.codes:275 + require('./helpers/retrospective-v08462.cjs').NEW_ROUTES.length);
if(['0.84.63','0.84.64','0.84.65','0.84.66','0.84.67','0.84.68','0.84.69','0.84.70','0.84.71','0.84.72','0.84.73','0.84.74'].includes(release)){
 const liveCounts = release==='0.84.74'?gynae74:release==='0.84.73'?gynae73:release==='0.84.72'?gynae72:release==='0.84.71'?gynae71:release==='0.84.70'?gynae70:release==='0.84.69'?gynae69:release==='0.84.68'?gynae68:release==='0.84.67'?flot67:release==='0.84.66'?gynae66:release==='0.84.65'?gynae65:release==='0.84.64'?sarcomaCounts:gynaecologyCounts;
 assert.equal(registry.codes.flatMap(code=>registry.bundleRoutes(code)).length,liveCounts.routes);
 assert.equal(require('../tools/apply-patient-visual-standard-v08443.cjs').discoverRoutes(root).length,liveCounts.visualRoutes);
}
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
console.log('Registry repair: historic registry and explicit durvalumab/olaparib routes, all 11 added routes and 33 recorded assets, missing/unknown/duplicate rejection, exact repair provenance pass.');

// Exercise the missing route-list coverage separately from full historical Git checks.
const crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const releases=[['gu-v08458',['00282','00622','00628','00450','00759','00333','00337','00338','00583','00846']],['gu-v08459',['00453','00602','00807','00885','00894','00945']],['sarcoma-v08460',['00500','00391','00392','00501','00511']]];
const records=releases.map(([dir])=>JSON.parse(fs.readFileSync(path.join(root,'validation',dir,'asset-migrations.json'))));
for(const tool of ['tools/system-health-audit-v0810.js','tools/validate-pages-site.js','tests/v0810-architecture-consolidation.test.js']){
 const src=fs.readFileSync(path.join(root,tool),'utf8');
 assert(src.includes('patient-migration-catalogue.cjs'),tool+' uses the shared reviewed migration catalogue');
 for(const version of (release==='0.84.74'?[58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74]:release==='0.84.73'?[58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73]:release==='0.84.72'?[58,59,60,61,62,63,64,65,66,67,68,69,70,71,72]:release==='0.84.71'?[58,59,60,61,62,63,64,65,66,67,68,69,70,71]:release==='0.84.70'?[58,59,60,61,62,63,64,65,66,67,68,69,70]:release==='0.84.69'?[58,59,60,61,62,63,64,65,66,67,68,69]:release==='0.84.68'?[58,59,60,61,62,63,64,65,66,67,68]:release==='0.84.67'?[58,59,60,61,62,63,64,65,66,67]:release==='0.84.66'?[58,59,60,61,62,63,64,65,66]:release==='0.84.65'?[58,59,60,61,62,63,64,65]:release==='0.84.64'?[58,59,60,61,62,63,64]:release==='0.84.63'?[58,59,60,61,62,63]:[58,59,60,61,62]))assert(require('./helpers/patient-migration-catalogue.cjs').getMigrations().some(x=>x.version===version),tool+' covers '+version);
}
let assets=0;
for(let i=0;i<releases.length;i++)for(const code of releases[i][1])for(const name of ['index.html','guide.pdf','passport.pdf']){
 const rel='patient/'+code+'/'+name;let expected=null;
 for(let j=i;j<records.length;j++){const transition=records[j].files[rel];if(transition){assert.equal(transition.before,expected,rel+' transition continuity');expected=transition.after;}}
 assert(expected,rel+' exact recorded hash');assert.equal(hash(fs.readFileSync(path.join(root,rel))),expected,rel+' bytes');assets++;
}
assert.equal(assets,63);console.log('All three route-list consumers cover v58-v60; all 63 affected assets match their continuous recorded transitions. Full historical audit remains a separate required check.');

const model=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge/00453.json')));
const timeline=require('../tools/gu-chronology-v08459.cjs').render(model);
const labels=[...timeline.matchAll(/<span class="wiki-cycle-day">([^<]+)<\/span>/g)].map(m=>m[1]);
assert.deepEqual(labels,Array.from({length:14},(_,i)=>(i>5?'+':'')+(i-5)));
for(const marker of ['data-cycle-track="conditioning"','data-cycle-track="rescue"','wiki-cycle-key','wiki-cycle-evidence','wiki-cycle-warning','There are no guaranteed'])assert(timeline.includes(marker),marker+' retained');
assert.throws(()=>require('../tools/gu-chronology-v08459.cjs').render({...model,relative_day_origin:1}));
const wiki=fs.readFileSync(path.join(root,'patient/00453/knowledge.html'),'utf8');
assert.deepEqual([...wiki.matchAll(/<span class="wiki-cycle-day">([^<]+)<\/span>/g)].map(m=>m[1]),labels);assert(!wiki.includes('Day 1 → Day 14: a general pattern'));
console.log('00453 signed transplant axis, source-bound origin, authored tracks and safety warnings verified.');

const journeys=require('../js/treatment-journey-v0837.js');
const authored=JSON.parse(fs.readFileSync(path.join(root,'data/breast-treatment-journeys-v0837.json')));
assert.deepEqual(journeys.definitions,authored,'Every authored journey reaches the runtime');
for(const code of ['00500','00391','00392','00501','00511']){
 assert(journeys.renderForCode(code).includes('data-treatment-journey="'+code+'"'));
 for(const name of ['knowledge.html','treatment-journey.html'])assert(fs.readFileSync(path.join(root,'patient',code,name),'utf8').includes('data-treatment-journey="'+code+'"'));
}
for(const code of ['00333','00338']){
 const guide=fs.readFileSync(path.join(root,'patient',code,'guide.html'),'utf8');
 assert.equal((guide.match(/id="gu58-mvac-monitoring-columns"/g)||[]).length,1);
}
console.log('Authored journey/runtime parity, five sarcoma journey pages and single MVAC print style verified.');
