'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),codes=['00385','00387','00207','00705','00706','00455','00558','00328','00733','00456'];
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
function validate(p){
 const code=p.metadata?.nccp_regimen_code;if(!codes.includes(code))return null;
 const all=read('validation/head-neck-v08445/clinical-migration.json');assert.equal(all.release,'0.84.45');assert.deepEqual(all.codes,codes);const row=all.records[code];assert(row);
 assert.equal(sha(row.protocol_path),row.protocol_sha256,'Exact audited current protocol '+code);assert.deepEqual(p,read(row.protocol_path),'Test object differs from source-audited protocol');
 for(const [file,digest] of Object.entries(row.evidence_hashes))assert.equal(sha(file),digest,'Retained source evidence '+file);
 assert.equal(p.metadata.source_url,row.source_url);assert.equal(p.metadata.nccp_version,row.source_version);
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[flag],false);
 const report=read(row.result_path),cases=report.cases||report.results;assert(cases.length>=row.minimum_cases&&cases.every(x=>(x.pass??x.passed)===true));
 const old=read(row.baseline_path);assert.deepEqual(old.rule_engine.rules.filter(x=>String(x.rule_id||x.id).startsWith('OF590_')).map(x=>x.rule_id||x.id),row.old_legacy_organ_rule_ids);
 assert.deepEqual(p.rule_engine.rules.filter(x=>String(x.rule_id||x.id).startsWith('OF590_')).map(x=>x.rule_id||x.id),row.retained_legacy_organ_rule_ids);
 require('./head-neck-grading-v08445.cjs').validateProtocol(p,require('../../js/ctcae-descriptors.js'));
 return row;
}
module.exports={validate,codes};
