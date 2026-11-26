const gynae66 = require('./helpers/retrospective-v08466.cjs').inventory;
'use strict';
const gynae65 = require('./helpers/retrospective-v08465.cjs').inventory;
const gskRoots = require('./helpers/gynaecology-00862-00929.cjs').NEW_ROUTES.length;
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const A=require('../js/patient-asset-registry-v0810.js'),K=require('../js/regimen-knowledge-base.js'),IDs=require('../js/protocol-id-migrations.js'),pack=require('../tools/patient-pack-sarcoma-v08463.cjs');
const referenceCourse=require('../tools/reference-course-v08463.cjs');
const codes=['00420','00463','00100','00596','00680'],index=json('protocols/index.json').protocols;
const release=json('package.json').version,counts={'0.84.63':[283,316],'0.84.66':[gynae66.codes,gynae66.routes],'0.84.65':[gynae65.codes,gynae65.routes],'0.84.64':[(292+gskRoots),(328+gskRoots)]};assert(counts[release]);assert.equal(A.release,release);assert.equal(A.codes.length,counts[release][0]);assert.equal(A.codes.flatMap(c=>A.bundleRoutes(c)).length,counts[release][1]);
const script=read('404.html').match(/<script>([\s\S]*?)<\/script>/)[1];
for(const code of codes){
 const entry=index.find(x=>x.path.includes('/'+code+'-'));assert(entry);const p=json(entry.path),d=json('data/patient-knowledge/'+code+'.json');
 assert.equal(IDs.canonicalId(p.protocol_id),p.protocol_id,'No new national-ID alias is inferred');assert.deepEqual(A.bundleRoutes(code),[code]);
 assert.equal(A.relativePath(p,'guide'),`patient/${code}/guide.pdf`);assert.equal(A.relativePath(p,'knowledge'),`patient/${code}/knowledge.html`);assert.equal(d.patient_route,code);assert.equal(d.patient_context||'','');assert(pack.applies(d));assert(!pack.applies({...d,suite_release:'0.84.62'}));assert(!pack.applies({...d,patient_context:'gist'}));
 for(const [tail,target]of [['guide.html','guide.pdf'],['','']]){let destination;vm.runInNewContext(script,{location:{pathname:`/docs/patient/${code}/${tail}`,replace:x=>destination=x}});assert.equal(destination,`/patient/${code}/${target}`);}
 const portal=read(`patient/${code}/index.html`),knowledge=read(`patient/${code}/knowledge.html`);for(const file of ['guide.pdf','sactcard.pdf'])assert(portal.includes(file),code+' stable portal download '+file);for(const file of ['knowledge.pdf','handbook.pdf'])assert(knowledge.includes(file),code+' stable reference download '+file);
 if(['00463','00100'].includes(code)){
  assert(referenceCourse.applies(d));for(const patch of [{suite_release:'0.84.62'},{patient_context:'gist'},{patient_route:'wrong'},{cycle_days:d.cycle_days+1},{schedule_kind:'cycle'},{long_course_schedule:{...d.long_course_schedule,actual_dates_required:false}},{patient_summary:{...d.patient_summary,card_cycle_count:6}}])assert(!referenceCourse.applies({...d,...patch}),'Reference-course guard rejects unsupported scope or schedule');
  assert.equal(d.schedule_kind,'reference-course');assert.equal(d.patient_summary.card_cycle_count,null);assert.equal(d.patient_summary.card_record_unit,code==='00463'?'treatment visit':'infusion');assert.equal(d.course_weeks,code==='00463'?29:36);
  for(const file of ['index','guide','passport','consent-form','knowledge','sactcard']){const html=read(`patient/${code}/${file}.html`);assert(!html.includes(d.cycle_days+'-day cycle'),code+'/'+file+' must not repeat the whole reference course');}
  const passport=read(`patient/${code}/passport.html`);assert(!passport.includes('Cycle number:'));assert(!passport.includes('one cycle, one page'));assert(passport.includes(code==='00463'?'Treatment visit number:':'Infusion number:'));
 }
}
async function main(){const oldFetch=globalThis.fetch;globalThis.fetch=async url=>({ok:true,json:async()=>json(url)});try{const payload=await K.load(),added=json('data/regimen-knowledge-sarcoma-v08463.json');assert.equal(added.regimen_profiles.length,5);for(const profile of added.regimen_profiles){const p=json(index.find(x=>x.path.includes('/'+profile.protocol_id.match(/nccp-(\d{5})-/)[1]+'-')).path);assert.deepEqual(payload.regimen_profiles.find(x=>x.protocol_id===p.protocol_id),profile);const selected=K.regimenProfileForProtocol(p,payload);assert(selected);assert.equal(selected.protocol_id,p.protocol_id);}}finally{globalThis.fetch=oldFetch;}console.log('v63 five exact base routes, source IDs, complete downloads and MAP/mifamurtide reference-course labels passed.');}
main().catch(error=>{console.error(error);process.exitCode=1;});
