'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const review=require('./helpers/enhertu-review-v08462.cjs');
const successor=require('./helpers/retrospective-v08463.cjs');
assert(successor.verifyPriorEnhertu(review));
const record=review.load();
const clinical=JSON.parse(fs.readFileSync(path.join(review.ROOT,'protocols/breast/00776-trastuzumab-deruxtecan.json')));
assert.equal(review.historicalRuleCount(clinical),42,'Retain the authenticated historical42-rule source record');
assert.equal(clinical.rule_engine.rules.length,47,'The reviewed current schema contains47 source-linked rules');
const alteredClinical=structuredClone(clinical);alteredClinical.rule_engine.rules.pop();
assert.throws(()=>review.historicalRuleCount(alteredClinical),/exact reviewed protocol/,'A supplied altered protocol cannot borrow the historical compatibility branch');
assert.throws(()=>review.historicalRuleCount({metadata:{nccp_regimen_code:'00353'}}),/scoped to00776/);
const registerPath='data/clinical-validation-register-v0630.json';
const oldRegister=JSON.parse(cp.execFileSync('git',['show',review.BASE_COMMIT+':'+registerPath],{cwd:review.ROOT,maxBuffer:8*1024*1024}));
const currentRegister=JSON.parse(fs.readFileSync(path.join(review.ROOT,registerPath)));
const reviewedRegister=structuredClone(oldRegister),enhertuRegister=reviewedRegister.protocols.find(row=>row.nccp_code==='00776');
enhertuRegister.rule_count=clinical.rule_engine.rules.length;enhertuRegister.input_count=Object.keys(clinical.input_definitions).length;
const inheritedRegister=successor.baselineJson(registerPath);
assert.deepEqual(inheritedRegister,reviewedRegister,'The inherited Enhertu register changed only reviewed00776 rule/input counts; all other rows and approval flags remained unchanged');
assert.equal(currentRegister.protocols.length,inheritedRegister.protocols.length);
const sarcomaRegister = JSON.parse(require('node:child_process').execFileSync('git',
 ['show','5b063b3f390cfe9a5a324c4615a3fba3a6eb8878:'+registerPath],{cwd:review.ROOT,maxBuffer:32*1024*1024}));
for(const row of currentRegister.protocols){
 const old=inheritedRegister.protocols.find(item=>item.nccp_code===row.nccp_code);assert(old);
 if(['00862','00929'].includes(row.nccp_code)) {
  const file = fs.readdirSync(path.join(review.ROOT,'protocols/gynaecology')).find(name => name.startsWith(row.nccp_code+'-'));
  const protocol = JSON.parse(fs.readFileSync(path.join(review.ROOT,'protocols/gynaecology',file)));
  assert.equal(row.rule_count,protocol.rule_engine.rules.length);
  assert.equal(row.input_count,Object.keys(protocol.input_definitions).length);
  assert.equal(row.formal_consultant_reviewed,false);
  assert.equal(row.formal_pharmacy_reviewed,false);
 } else if(row.nccp_code==='00205') {
   const p=JSON.parse(fs.readFileSync(path.join(review.ROOT,row.path)));
   const prior=sarcomaRegister.protocols.find(entry=>entry.nccp_code==='00205');
   assert.deepEqual(row,{...prior,rule_count:p.rule_engine.rules.length,input_count:Object.keys(p.input_definitions).length});
 } else if(['00374','00391','00392','00462','00554',...require('./helpers/remaining-sarcoma-patient-files.cjs').NEW_ROUTES].includes(row.nccp_code)) {
   assert.deepEqual(row,sarcomaRegister.protocols.find(entry=>entry.nccp_code===row.nccp_code),'Reviewed sarcoma register '+row.nccp_code);
 } else if(!successor.CODES.includes(row.nccp_code))assert.deepEqual(row,old,'Unrelated clinical register row remains unchanged: '+row.nccp_code);
 else{
  const protocol=JSON.parse(fs.readFileSync(path.join(review.ROOT,successor.PROTOCOLS[row.nccp_code])));successor.validateProtocol(protocol);
  assert.equal(row.rule_count,protocol.rule_engine.rules.length);assert.equal(row.input_count,Object.keys(protocol.input_definitions).length);
  assert.equal(row.protocol_id,protocol.protocol_id);assert.equal(row.source_url,protocol.metadata.source_url);
  assert.equal(row.formal_consultant_reviewed,false);assert.equal(row.formal_pharmacy_reviewed,false);
 }
}
const registerSummary=value=>Object.fromEntries(Object.entries(value).filter(([key])=>!['protocols','content_update_release','generated_date'].includes(key)));
assert.deepEqual(registerSummary(currentRegister),registerSummary(inheritedRegister),'Unrelated register totals and governance stay unchanged');
for(const[f,entry]of Object.entries(record.files)){
 const actual=review.expected(f,entry.before,entry.before_bytes);assert.equal(actual.sha256,entry.after);assert.equal(actual.bytes,entry.after_bytes);
 assert.throws(()=>review.expected(f,'0'.repeat(64)),/unexpected Enhertu transition origin/);
 assert.throws(()=>review.expected(f,entry.after,entry.after_bytes+1),/mismatched Enhertu origin size/);
}
for(const f of ['../outside.txt','/tmp/outside','protocols/lung/00353-osimertinib-monotherapy.json','patient/00525/index.html','assets/media/osimertinib-00353-irish.mp4'])assert.equal(review.approvedPath(f),false,'00776 review cannot authorise '+f);
const changes=[...cp.execFileSync('git',['diff','--name-only','-z',review.BASE_COMMIT],{cwd:review.ROOT}).toString().split('\0'),...cp.execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:review.ROOT}).toString().split('\0')].filter(Boolean);
const capivasertibReview = require('./helpers/capivasertib-review.cjs');
capivasertibReview.verify();
for(const f of new Set(changes))assert([review.RECORD_PATH,review.HELPER_PATH,successor.RECORD_PATH,successor.HELPER_PATH].includes(f)||record.files[f]||successor.load().files[f]||capivasertibReview.owns(f),'Changed file missing from exact reviewed assembly or authenticated successor: '+f);
const prior=JSON.parse(cp.execFileSync('git',['show',review.BASE_COMMIT+':data/breast-completion-v08421-authoring.json'],{cwd:review.ROOT,maxBuffer:8*1024*1024}));
const now=JSON.parse(fs.readFileSync(path.join(review.ROOT,'data/breast-completion-v08421-authoring.json')));
for(const[code,entry]of Object.entries(prior.regimens))if(code!=='00776')assert.deepEqual(now.regimens[code],entry,'Unrelated authoring record unchanged: '+code);
console.log(`${Object.keys(record.files).length} authenticated Enhertu transition files and negative provenance/scope guards passed.`);
