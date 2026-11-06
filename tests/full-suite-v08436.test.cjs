'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const scope=json('validation/colorectal-v08436/scope.json'),presentation=json('data/patient-presentation-v08431.json'),index=json('protocols/index.json').protocols;
const sourceMatrix=json('validation/colorectal-v08436/catalogue-source-review/41-context-source-audit-matrix.json');
assert.equal(json('data/colorectal-suite-progress-v0832.json').completed_software_packages.length,41);assert.equal(scope.presentation_routes.length,41);assert.equal(new Set(scope.consistency_codes).size,41);
assert.deepEqual(sourceMatrix.rows.map(r=>r.code).sort(),[...scope.consistency_codes].sort());
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const route of scope.presentation_routes){
 const code=route.split('/')[0],d=json(presentation.routes[route]),p=json(index.find(x=>x.path.includes('/'+code+'-')).path);
 assert.equal(d.protocol_id,p.protocol_id,route+' identity');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version),route+' source version');
 assert.ok(d.anatomy.length>=6,route+' detailed anatomy');assert.ok(d.monitoring_schedule?.rows.length>=3,route+' authored monitoring');
 for(const f of ['index.html','guide.html','knowledge.html','consent-form.html','passport.html','sactcard.html','supportive-care.html','treatment-journey.html'])assert.ok(fs.existsSync(path.join(root,'patient',route,f)),route+'/'+f);
 for(const f of ['guide.pdf','sactcard.pdf','knowledge.pdf','handbook.pdf','passport.pdf','consent-form.pdf','supportive-care.pdf','treatment-journey.pdf']){
  const b=fs.readFileSync(path.join(root,'patient',route,f));assert.equal(b.subarray(0,4).toString(),'%PDF');assert.deepEqual(b,fs.readFileSync(path.join(root,'docs/patient',route,f)),route+' mirror '+f);
 }
 const h=read('patient/'+route+'/knowledge.html');assert.equal((h.match(/data-authored-map/g)||[]).length,1,route+' one complete reference map');assert.match(h,/Full-body anatomical illustration/);
 for(const [,label,,advice]of d.anatomy){assert(h.includes(label.replaceAll('&','&amp;')),route+' anatomy label '+label);assert(h.includes(advice.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')),route+' full anatomy explanation');}
 const row=sourceMatrix.rows.find(r=>r.code===code);assert.equal(row.listed_on_current_gi_catalogue,true);
 if(row.current_source?.pdf)assert.equal(sha(fs.readFileSync(path.join(root,row.current_source.pdf))),row.current_source.sha256,route+' fresh source bytes');
}
for(const code of ['00216','00692']){
 const d=json('data/patient-knowledge/'+code+'.json'),p=json(index.find(x=>x.path.includes('/'+code+'-')).path);
 assert.equal(d.patient_summary.template_version,'0.84.36');assert.equal(p.metadata.clinical_audit_release,'0.84.36');
 assert.ok(json('data/regimen-knowledge-base-v08436-addendum.json').regimen_profiles.some(x=>x.protocol_id===p.protocol_id));
}
for(const code of ['00421','00555','00783']){
 for(const name of ['port-pump','knowledge'])assert.doesNotMatch(read('patient/'+code+'/'+name+'.html'),/Treatment continues for about 46 hours/);
}
assert.match(read('patient/00421/port-pump.html'),/seven days a week/);
for(const code of ['00555','00783'])assert.match(read('patient/'+code+'/port-pump.html'),/48 hours/);
const folfiri=json('data/patient-knowledge/00227.json').anatomy;
assert.equal(new Set(folfiri.map(x=>x[0])).size,folfiri.length);assert.equal(new Set(folfiri.map(x=>x.slice(4).join(','))).size,folfiri.length);
assert.doesNotMatch(json('data/patient-knowledge/00586.json').patient_summary.card_schedule,/or tabl$/);
const allCodes=require('../js/patient-asset-registry-v0810.js').codes;
require('./helpers/net-suite-registration-v08437.cjs').registry(allCodes); // Exact historical registry plus bounded audited additions.
console.log('v0.84.36 all 41 colorectal contexts: identity, source freshness, full reference anatomy, required assets, mirrors and targeted consistency repairs pass.');
