'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),catalogue=require('./helpers/patient-migration-catalogue.cjs');
const registry=require('../js/patient-asset-registry-v0810.js'),manifest=require('../data/protected-patient-assets-v0810.json');
const migrations=catalogue.getMigrations(),routes=catalogue.assertCoverage(registry,manifest,migrations);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const current=migrations.at(-1);assert(current.helper.NEW_ROUTES.length,'Current sarcoma release must declare patient routes');
assert.throws(()=>catalogue.assertCoverage(registry,manifest,migrations.slice(0,-1)),/reviewed route origin/,'Omitting the current batch must block release');
assert.throws(()=>catalogue.assertCoverage(registry,manifest,[...migrations,current]),/reviewed route origin/,'Duplicate batch registrations must block release');
assert.throws(()=>catalogue.assertCoverage({codes:['99999'],bundleRoutes:c=>[c]},manifest,migrations),/reviewed route origin/);
let checked=0;
for(const route of current.helper.NEW_ROUTES){
 assert(routes.includes(route),route+' must reach the canonical registry');
 for(const name of ['index.html','guide.pdf','passport.pdf']){
  const file='patient/'+route+'/'+name,bytes=fs.readFileSync(path.join(root,file));
  const expected=current.helper.expectedHash(file,null),size=current.helper.expectedBytes(file,null,null);
  assert.equal(sha(bytes),expected,file+' exact reviewed bytes');assert.equal(bytes.length,size,file+' exact reviewed size');
  assert.notEqual(sha(Buffer.concat([bytes,Buffer.from('tampered')])),expected,'Changed asset must not pass');
  if(name.endsWith('.pdf'))assert.equal(sha(fs.readFileSync(path.join(root,'docs',file))),expected,file+' compatibility mirror');
  checked++;
 }
}
for(const file of ['tests/v0810-architecture-consolidation.test.js','tools/system-health-audit-v0810.js','tools/validate-pages-site.js','tests/ui-asset-migration.test.cjs','tests/patient-design-migration-v08443.test.cjs','tests/patient-design-migration-v08444.test.cjs'])assert(fs.readFileSync(path.join(root,file),'utf8').includes('patient-migration-catalogue.cjs'),file+' must consume the shared catalogue');
console.log('Route-registration preflight passed: '+routes.length+' canonical routes; '+checked+' current-batch assets; missing, duplicate, unknown and altered-content rejection.');

const profileNames=fs.readdirSync(path.join(root,'data/patient-knowledge')).filter(n=>n.endsWith('.json'));
const checkProfiles=codes=>assert.deepEqual([...codes].sort(),[...registry.codes].sort());
catalogue.assertProfiles(profileNames,checkProfiles);
assert.throws(()=>catalogue.assertProfiles(profileNames.filter(n=>n!=='00335.json'),checkProfiles),/missing its required generic profile/);
assert.throws(()=>catalogue.assertProfiles([...profileNames,'99999.json'],checkProfiles));
console.log('Generic and context-only profile coverage, missing generic profile and unknown profile rejection passed.');

for(const code of registry.codes){assert(fs.existsSync(path.join(root,'patient',code,'index.html')),code+' canonical root');const redirect=fs.readFileSync(path.join(root,'docs/patient',code,'index.html'),'utf8');const canonical=fs.readFileSync(path.join(root,'patient',code,'index.html'),'utf8');const mirroredSelector=redirect===canonical&&registry.bundleRoutes(code).every(route=>route.startsWith(code+'/')&&redirect.includes('href=\"'+route.slice(code.length+1)+'/\"'));assert(redirect.includes('https://sactcheck.com/patient/'+code+'/')||mirroredSelector,code+' compatibility root');}
console.log('All canonical and compatibility root entry points verified.');
