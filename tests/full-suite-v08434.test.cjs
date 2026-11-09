'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const scope=json('validation/colorectal-v08434/scope.json'),registry=require('../js/patient-asset-registry-v0810.js'),presentation=json('data/patient-presentation-v08431.json'),index=json('protocols/index.json').protocols;
assert.equal(scope.new_codes.length,5);assert.equal(scope.retrospective_codes.length,5);assert.equal(new Set(scope.presentation_routes).size,10);
for(const route of scope.presentation_routes){
 const code=route.split('/')[0],d=json(presentation.routes[route]),p=json(index.find(x=>x.path.includes('/'+code+'-')).path);
 assert.equal(d.protocol_id,p.protocol_id,route+' canonical ID');assert.equal(d.patient_summary.template_version,['00207','00328'].includes(code)?'0.84.45':'0.84.34');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version));if(['00207','00328'].includes(code))require('./helpers/head-neck-inputs-v08445.cjs').validate(p);else assert.equal(p.metadata.clinical_audit_release,'0.84.34');
 assert.ok(d.anatomy.length>=6);assert.ok(d.monitoring_schedule.rows.length>=3);assert.ok(d.patient_summary.monitoring.length>=3);
 const sources=new Set(d.sources.map(s=>s.id));const walk=x=>{if(!x||typeof x!=='object')return;if(x.source_ids)for(const id of x.source_ids)assert.ok(sources.has(id),route+' missing source '+id);for(const v of Object.values(x))walk(v);};walk(d);
 for(const f of ['index.html','guide.html','knowledge.html','consent-form.html','passport.html','sactcard.html','supportive-care.html','treatment-journey.html'])assert.ok(fs.existsSync(path.join(root,'patient',route,f)),route+'/'+f);
 for(const f of ['guide.pdf','sactcard.pdf','knowledge.pdf','handbook.pdf','passport.pdf','consent-form.pdf','supportive-care.pdf','treatment-journey.pdf']){
  const actual=fs.readFileSync(path.join(root,'patient',route,f));assert.equal(actual.subarray(0,4).toString(),'%PDF');assert.deepEqual(actual,fs.readFileSync(path.join(root,'docs/patient',route,f)),route+' mirrored '+f);
 }
 const guide=read('patient/'+route+'/guide.html');assert.match(guide,/Full-body anatomical illustration/);assert.match(guide,/EXAMPLE ONLY/);
 const reference=read('patient/'+route+'/knowledge.html');assert.equal((reference.match(/data-authored-map/g)||[]).length,1,route+' full reference retains anatomical map');assert.match(reference,/Full-body anatomical illustration/);
 if(['00328','00330'].includes(code)){const portal=read('patient/'+route+'/index.html');assert.match(portal,/Day 8/);assert.match(portal,/Cetuximab-only visit/);}
 if(route.endsWith('/colorectal')){
  assert.equal(registry.relativePath(code,'guide','gastrointestinal'),'patient/'+route+'/guide.pdf');assert.equal(registry.relativePath(code,'guide','colorectal'),'patient/'+route+'/guide.pdf');assert.match(registry.relativePath(code,'guide','ovary'),/scope.html/);assert.match(d.scope_notice,/component|partner/i);assert.doesNotMatch(d.schedule_summary,/platinum|six cycles|6 cycles|NSCLC/i);
 }
}
assert.equal(registry.relativePath('00212','guide','breast'),'patient/00212/guide.pdf');assert.equal(registry.relativePath('00214','guide','lung'),'patient/00214/guide.pdf');assert.equal(registry.relativePath('00215','guide','lung'),'patient/00215/lung/guide.pdf');
for(const c of ['00330','00331'])assert.equal(json('data/patient-knowledge/'+c+'.json').port_pump,false);
assert.equal(json('data/patient-knowledge/00328.json').port_pump,true);
const oral=json('data/patient-knowledge/00244.json');assert.deepEqual(oral.anatomy.find(a=>a[0]==='liver').slice(4),[44,34]);assert.deepEqual(oral.anatomy.find(a=>a[0]==='heart').slice(4),[52.5,28.3]);
const lonsurf=json(index.find(x=>x.path.includes('/00382-')).path),reconcile=require('../js/source-reconciliation-v0701.js');const before=JSON.stringify(lonsurf);reconcile.apply(lonsurf);assert.equal(JSON.stringify(lonsurf),before,'Legacy Lonsurf reconciliation must not overwrite audited current rules');
console.log('v0.84.34 ten complete context assets, source identity, independent routing, anatomy, oral safeguard and mirrored PDFs pass.');
