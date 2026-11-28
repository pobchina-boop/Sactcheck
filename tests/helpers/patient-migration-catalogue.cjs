'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
let cached;
function getMigrations(){
 if(cached)return cached;
 const release=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
 const match=/^0\.84\.(\d+)$/.exec(release);assert(match,'Review the migration catalogue for a new release series');
 const last=Number(match[1]);
 const entries=fs.readdirSync(__dirname).map(name=>({name,match:/^retrospective-v084(\d+)\.cjs$/.exec(name)})).filter(x=>x.match&&Number(x.match[1])>=45&&Number(x.match[1])<=last).sort((a,b)=>Number(a.match[1])-Number(b.match[1]));
 assert(entries.some(x=>Number(x.match[1])===last),'Current release has no authenticated migration helper');
 cached=entries.map(({name,match})=>{const helper=require('./'+name),record=JSON.parse(fs.readFileSync(helper.RECORD));helper.createMigration(record);assert(Array.isArray(helper.NEW_ROUTES),name+' must declare its route additions');return{version:Number(match[1]),helper,record};});
 const gynaecology = require('./gynaecology-00862-00929.cjs');
 gynaecology.verify();
 cached.push({version: 63, helper: gynaecology, record: gynaecology.record});
 const sarcoma = require('./remaining-sarcoma-patient-files.cjs');
 sarcoma.verify();
 cached.push({version:64, helper:sarcoma, record:sarcoma.record});
 cached.sort((a,b) => a.version-b.version);
 return cached;
}
function assertCoverage(registry,manifest,migrations=getMigrations()){
 const routes=registry.codes.flatMap(code=>registry.bundleRoutes(code));
 assert.equal(new Set(routes).size,routes.length,'Duplicate canonical patient route');
 for(const route of routes){
  const fixture=manifest.assets[route.split('/')[0]]?.[[...route.split('/').slice(1),'index.html'].join('/')];
  if(fixture)continue;
  const matches=migrations.filter(({helper})=>helper.NEW_ROUTES.includes(route));
  assert.equal(matches.length,1,route+' must have exactly one reviewed route origin');
  for(const name of ['index.html','guide.pdf','passport.pdf'])assert(matches[0].record.files['patient/'+route+'/'+name],route+'/'+name+' missing recorded asset');
 }
 return routes;
}
function assertProfiles(names,checkRegistry){
 const registry=require('../../js/patient-asset-registry-v0810.js');
 const codes=names.map(name=>name.replace(/\.json$/,''));
 const contextual=registry.codes.filter(code=>!codes.includes(code));
 for(const code of contextual){
  const routes=registry.bundleRoutes(code);assert(routes.length,code+' has no authored context');
  for(const route of routes){
   assert(route.startsWith(code+'/'),code+' is missing its required generic profile');
   assert(getMigrations().some(({helper})=>helper.NEW_ROUTES.includes(route)),route+' has no reviewed context origin');
   const profile=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge-contexts',route+'.json')));
   assert.equal(profile.code,code);assert.equal(profile.patient_context,route.slice(code.length+1));
  }
 }
 checkRegistry([...codes,...contextual]);
}
function getInventoryMigrations(){const extra=require('./deployment-repair-v08461.cjs');extra.verify();return [...getMigrations(),extra.inventory(),require('./live-release-v08464.cjs').gynaecologyInventory(),require('./live-release-v08464.cjs').sarcomaInventory(),require('./live-release-v08464.cjs').gynae65Inventory(),require('./live-release-v08464.cjs').startupInventory(),require('./live-release-v08464.cjs').gynae66Inventory(),require('./live-release-v08464.cjs').flot67Inventory(),require('./live-release-v08464.cjs').gistPanelInventory(),require('./live-release-v08464.cjs').gynae68Inventory(),require('./live-release-v08464.cjs').gynae69Inventory(),require('./live-release-v08464.cjs').gynae70Inventory(),require('./live-release-v08464.cjs').gynae71Inventory(),require('./live-release-v08464.cjs').gynae72Inventory(),require('./live-release-v08464.cjs').gynae73Inventory(),require("./live-release-v08464.cjs").gynae74Inventory()];}
module.exports={getMigrations,getInventoryMigrations,assertCoverage,assertProfiles};
