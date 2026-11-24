'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const m=require('./helpers/retrospective-v08463.cjs');
const read=file=>fs.readFileSync(path.join(m.ROOT,file));
const record=m.load();assert(m.verify());
assert.deepEqual(m.NEW_ROUTES,['00588/ovarian_first_line','00588/ovarian_relapsed','00588/pancreatic','00746']);
assert(!m.NEW_ROUTES.includes('00588/prostate'),'The reviewed v57 prostate route keeps its original origin');
assert.equal(record.inherited_enhertu_review_status,'unmerged_pending_validation');
assert.equal(record.clinical_use_authorised,false);assert.equal(record.independent_clinical_pharmacy_review,'pending');
const catalogue=require('./helpers/patient-migration-catalogue.cjs').getMigrations();
assert.deepEqual(catalogue.filter(item=>item.helper.NEW_ROUTES.includes('00588/prostate')).map(item=>item.version),[57]);
for(const route of m.NEW_ROUTES)assert.deepEqual(catalogue.filter(item=>item.helper.NEW_ROUTES.includes(route)).map(item=>item.version),[63]);
for(const [file,change]of Object.entries(record.files)){
 const current=m.expected(file,change.before,change.before_bytes);assert.equal(current.sha256,change.after);assert.equal(current.bytes,change.after_bytes);
 const latest=require('./helpers/capivasertib-review.cjs').expected(file,current.sha256,current.bytes);
 assert.equal(m.sha(read(file)),latest.sha256);assert.equal(read(file).length,latest.bytes);
 assert.throws(()=>m.expected(file,'0'.repeat(64)),/unexpected olaparib transition origin/);
 assert.throws(()=>m.expected(file,change.after,change.after_bytes+1),/mismatched olaparib origin size/);
}
const tampered=structuredClone(record),clinicalFile=m.PROTOCOLS['00588'];tampered.files[clinicalFile].after='0'.repeat(64);
assert.throws(()=>m.createMigration(tampered),/Immutable reviewed olaparib transition/);
for(const file of ['../outside.txt','/tmp/outside','patient/00353/guide.pdf','patient/00588/unreviewed/guide.pdf','patient/00588/prostate/scope.html','data/patient-knowledge-contexts/00746/prostate.json','assets/media/olaparib.mp4','validation/prostate-v08457/asset-migrations.json','tests/helpers/enhertu-review-v08462.cjs'])assert.equal(m.approvedPath(file),false,file+' lies outside this review');
for(const code of m.CODES){
 const current=JSON.parse(read(m.PROTOCOLS[code])),old=m.historicalProtocol(current);
 assert.equal(old.metadata.nccp_regimen_code,code);assert.equal(m.sha(m.baselineBytes(m.PROTOCOLS[code])),record.files[m.PROTOCOLS[code]].before);
 const altered=structuredClone(current);altered.rule_engine.rules.pop();assert.throws(()=>m.validateProtocol(altered),/exact reviewed current olaparib protocol/);
 const alteredApproval=structuredClone(current);alteredApproval.metadata.validation.clinical_use_authorised=true;assert.throws(()=>m.validateProtocol(alteredApproval),/exact reviewed current olaparib protocol/);
}
assert.throws(()=>m.validateProtocol({metadata:{nccp_regimen_code:'00353'}}),/scoped to00588\/00746/);
const p=JSON.parse(read(m.PROTOCOLS['00588']));
const oldCount=require('./helpers/prostate-inputs-v08457.cjs').retainedBreastRuleCount(p);
assert.equal(oldCount,JSON.parse(read('data/targeted-breast-v0849-source-index.json')).regimens['00588'].rule_count,'Retain the original authenticated breast source count');
const prior=require('./helpers/enhertu-review-v08462.cjs');
assert.equal(m.sha(read(prior.HELPER_PATH)),m.sha(m.baselineBytes(prior.HELPER_PATH)));
assert.equal(m.sha(read(prior.RECORD_PATH)),m.sha(m.baselineBytes(prior.RECORD_PATH)));
console.log('Olaparib transition: exact inherited Enhertu state, original prostate route origin, six current suites, clinical governance, authenticated successors and tamper guards passed.');
