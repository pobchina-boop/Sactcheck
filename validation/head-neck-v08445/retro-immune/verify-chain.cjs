'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const here=__dirname,repo=process.env.SACTCHECK_REPO||path.resolve(here,'../../..'),mode=process.argv.includes('--integrated')?'integrated':'candidate';
const json=f=>JSON.parse(fs.readFileSync(path.isAbsolute(f)?f:path.join(repo,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.isAbsolute(f)?f:path.join(repo,f))).digest('hex');
const chain=json(path.join(here,'clinical-chain.json')),m40=json('validation/skin-melanoma-v08440/clinical-migration.json'),m41=json('validation/skin-melanoma-v08441/clinical-migration.json');
const checked=[];
for(const [f,h]of Object.entries(chain.immutable_files)){assert.equal(sha(f),h,'Historical immutable '+f);checked.push(f);}
let retained=0;
for(const code of ['00455','00558']){
 const rec=chain.records[code],base=json(rec.baseline_path),current=json(mode==='integrated'?rec.protocol_path:path.join(here,code+'-candidate.json'));
 assert.equal(sha(rec.baseline_path),rec.baseline_sha256);assert.equal(sha(path.join(here,code+'-candidate.json')),rec.candidate_sha256);
 assert.equal(sha(rec.baseline_path),m41.records[code].hashes[rec.protocol_path],'v44 baseline exactly retains v41 audited output bytes');
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex'),m41.records[code].canonical_protocol_sha256,'v41 canonical output equals retained v44 baseline');
 const before41='validation/skin-melanoma-v08441/protocol-before/'+path.basename(rec.protocol_path),v40=json(before41),before40=json(m40.records[code].baseline_path);
 assert.equal(sha(before41),m40.records[code].protocol_sha256,'v40 outcome exactly equals immutable v41 input');
 assert.equal(sha(before41),m41.records[code].hashes[before41],'v41 source-chain input verified');
 assert.equal(sha(m40.records[code].source_path),m40.records[code].source_sha256);
 assert.equal(sha('validation/skin-melanoma-v08441/sources/'+code+'.pdf'),m41.records[code].hashes['validation/skin-melanoma-v08441/sources/'+code+'.pdf']);
 assert.equal(sha(path.join(here,code+'-current.pdf')),m40.records[code].source_sha256,'Fresh source bytes match immutable prior audit');
 for(const r of before40.rule_engine.rules)assert.deepEqual(v40.rule_engine.rules.find(x=>x.rule_id===r.rule_id),r,'v40 retained source rule '+r.rule_id);
 for(const r of v40.rule_engine.rules)assert.deepEqual(base.rule_engine.rules.find(x=>x.rule_id===r.rule_id),r,'v41 and v44 retained source rule '+r.rule_id);
 assert.equal(base.rule_engine.rules.length,rec.baseline_rule_count);
 for(const old of base.rule_engine.rules){const actual=current.rule_engine.rules.find(x=>x.rule_id===old.rule_id);assert(actual,'Missing old rule '+old.rule_id);
  if(code==='00558'&&old.rule_id==='MEL41_PLAN_UNASSESSED'){
   const expected=structuredClone(old),candidate=json(path.join(here,code+'-candidate.json')).rule_engine.rules.find(x=>x.rule_id===old.rule_id);expected.action.recommendation=candidate.action.recommendation;expected.explanation=candidate.explanation;assert.deepEqual(actual,expected,'Only documented 400mg melanoma wording correction allowed');assert.match(actual.action.recommendation,/not a 400 mg schedule/);
  }else assert.deepEqual(actual,old,'Retained old rule '+code+'/'+old.rule_id);retained++;
 }
 for(const id of rec.new_rule_ids)assert(current.rule_engine.rules.some(x=>x.rule_id===id));
 assert.equal(current.protocol_id,rec.new_protocol_id);assert.equal(current.metadata.validation.clinical_use_authorised,false);
 assert.equal(current.metadata.validation.consultant_reviewed,false);assert.equal(current.metadata.validation.oncology_pharmacy_reviewed,false);
}
assert.equal(retained,162);
const report={release:'0.84.45',mode,immutable_files_verified:checked.length,prior_rules_retained:retained,unchanged_rule_predicates_actions:162,wording_only_corrections:1,baseline_git_sha:chain.baseline_git_sha,clinical_use_authorised:false,passed:true};
fs.writeFileSync(path.join(here,`chain-results-${mode}.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
