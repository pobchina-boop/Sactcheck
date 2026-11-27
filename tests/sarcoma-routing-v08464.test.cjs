const gynae70 = require('./helpers/retrospective-v08470.cjs').inventory;
const gynae66 = require('./helpers/retrospective-v08466.cjs').inventory;
'use strict';
const gynae65 = require('./helpers/retrospective-v08465.cjs').inventory;
const gskRoots = require('./helpers/gynaecology-00862-00929.cjs').NEW_ROUTES.length;
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const A=require('../js/patient-asset-registry-v0810.js'),K=require('../js/regimen-knowledge-base.js'),IDs=require('../js/protocol-id-migrations.js'),pack=require('../tools/patient-pack-v08464.cjs');
const referenceCourse=require('../tools/reference-course-v08463.cjs');
const codes=['00675','00747','00504','00754','00757'],index=json('protocols/index.json').protocols;
assert.equal(A.release,'0.84.70');assert.equal(A.codes.length,gynae70.codes);assert.equal(A.codes.flatMap(c=>A.bundleRoutes(c)).length,gynae70.routes);
const script=read('404.html').match(/<script>([\s\S]*?)<\/script>/)[1];
for(const code of codes){
 const entry=index.find(x=>x.path.includes('/'+code+'-'));assert(entry);const p=json(entry.path),d=json('data/patient-knowledge/'+code+'.json');
 assert.equal(IDs.canonicalId(p.protocol_id),p.protocol_id,'No new national-ID alias is inferred');assert.deepEqual(A.bundleRoutes(code),[code]);
 assert.equal(A.relativePath(p,'guide'),`patient/${code}/guide.pdf`);assert.equal(A.relativePath(p,'knowledge'),`patient/${code}/knowledge.html`);assert.equal(d.patient_route,code);assert.equal(d.patient_context||'','');assert(pack.applies(d));assert(!pack.applies({...d,suite_release:'0.84.63'}));assert(!pack.applies({...d,patient_context:'gist'}));
 for(const [tail,target]of [['guide.html','guide.pdf'],['','']]){let destination;vm.runInNewContext(script,{location:{pathname:`/docs/patient/${code}/${tail}`,replace:x=>destination=x}});assert.equal(destination,`/patient/${code}/${target}`);}
 const portal=read(`patient/${code}/index.html`),knowledge=read(`patient/${code}/knowledge.html`);for(const file of ['guide.pdf','sactcard.pdf'])assert(portal.includes(file),code+' stable portal download '+file);for(const file of ['knowledge.pdf','handbook.pdf'])assert(knowledge.includes(file),code+' stable reference download '+file);
 assert(!referenceCourse.applies(d),'The new five suites must not use the two old long-course exception');

}
for(const code of ['00463','00100']){const d=json('data/patient-knowledge/'+code+'.json');assert(referenceCourse.applies(d));assert.equal(d.patient_summary.card_cycle_count,null);assert.equal(d.course_weeks,code==='00463'?29:36);}
async function main(){const oldFetch=globalThis.fetch;globalThis.fetch=async url=>({ok:true,json:async()=>json(url)});try{const payload=await K.load(),added=json('data/regimen-knowledge-base-v08464-addendum.json');assert.equal(added.regimen_profiles.length,5);for(const profile of added.regimen_profiles){const p=json(index.find(x=>x.path.includes('/'+profile.protocol_id.match(/nccp-(\d{5})-/)[1]+'-')).path);assert.deepEqual(payload.regimen_profiles.find(x=>x.protocol_id===p.protocol_id),profile);const selected=K.regimenProfileForProtocol(p,payload);assert(selected);assert.equal(selected.protocol_id,p.protocol_id);}
 // A retained whole-regimen script ID must never bypass unresolved phase selection.
 require('../js/emetogenic-risk.js');await globalThis.SACTCheckEmetogenicRisk.load();const risk=globalThis.SACTCheckEmetogenicRisk;
 const expected={'00504':{irinotecan_temozolomide_days_1_to_5:'moderate',rest_days:'minimal'},'00754':{ivado_cycles1_2:'high',ivado_cycles3_4:'high',iva_cycles5_9:'high'},'00757':{irinotecan_temozolomide_phase:'moderate',vincristine_only_phase:'minimal'}};
 for(const [code,phases] of Object.entries(expected)){const p=json(index.find(x=>x.path.includes('/'+code+'-')).path);for(const selected of [undefined,'unrecognised-phase']){const result=risk.get(p,{treatmentPhase:selected});assert.equal(result.phaseResolved,false);assert.equal(result.level,'phase_dependent');assert.equal(result.scriptId,null,code+' unresolved phase cannot inherit whole-regimen high script');}for(const [phase,level]of Object.entries(phases)){const result=risk.get(p,{treatmentPhase:phase});assert.equal(result.phaseResolved,true,code+' explicit phase');assert.equal(result.level,level);assert.equal(result.scriptId,level==='high'?'nccp-parenteral-high':level==='moderate'?'nccp-parenteral-moderate':'nccp-minimal-no-routine-prophylaxis');}}
 }finally{globalThis.fetch=oldFetch;}console.log('v64 five exact base routes, source IDs, complete predeclared downloads and separate alternating schedules passed.');}
main().catch(error=>{console.error(error);process.exitCode=1;});
