'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),records=require('../validation/neuroendocrine-v08437/organ-function-migrations.json').records;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.deepEqual(Object.keys(records).sort(),['00320','00327','00505','00642']);
function validate(code,p){
 const x=records[code];if(!x)return null;const m=p.metadata;
 assert.equal(m.clinical_audit_release,'0.84.37');assert.equal(m.validation.audit_release,'0.84.37');
 assert.equal(m.source_url,x.source_url);assert.equal(m.nccp_version,x.source_version);assert.equal(m.source_pdf_sha256,x.source_sha256);
 assert.equal(m.encoding_maturity.level,x.maturity);assert.equal(m.validation.rule_level_source_reconciliation_status,x.status);
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(m.validation[flag],false);
 for(const [file,hash]of [[x.protocol_path,x.protocol_sha256],[x.baseline_path,x.baseline_sha256],[x.source_pdf,x.source_sha256]])assert.equal(sha(fs.readFileSync(path.join(root,file))),hash,code+' retained evidence '+file);
 const old=JSON.parse(fs.readFileSync(path.join(root,x.baseline_path)));
 const legacy=q=>q.rule_engine.rules.map(r=>r.id||r.rule_id).filter(id=>id.startsWith('OF590_'));
 assert.deepEqual(legacy(old),x.original_legacy_rules);assert.deepEqual(legacy(p),x.retained_legacy_rules);
 assert.deepEqual(x.original_legacy_rules.filter(id=>!x.retained_legacy_rules.includes(id)),x.replaced_legacy_rules);
 for(const id of x.required_rules){const r=p.rule_engine.rules.find(r=>(r.id||r.rule_id)===id);assert(r,code+' replacement '+id);assert.deepEqual(r.source,x.required_rule_sources[id]);assert(r.source.url&&r.source.page);}
 for(const file of [x.source_case_path,x.agent_migration])assert(fs.existsSync(path.join(root,file)));
 const result=JSON.parse(fs.readFileSync(path.join(root,x.source_result_path)));assert.equal(result.failed,0);assert(result.passed>100);assert.equal(result.passed,result.total||result.cases.length);
 if(x.in_historical_v0590_scope){assert.equal(m.organ_function_reconciliation.release,x.reconciliation_release);assert.equal(m.organ_function_reconciliation.resolution,x.resolution);}
 return x;
}
module.exports={records,validate};
