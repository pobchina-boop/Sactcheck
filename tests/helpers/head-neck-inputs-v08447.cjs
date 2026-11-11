'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),codes=['00207','00314','00385','00387','00417','00418','00552','00696','00705','00706'];
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
function validate(p){
 const current48=require('./head-neck-inputs-v08448.cjs').validate(p);if(current48)return current48;
 const code=p.metadata?.nccp_regimen_code;if(!codes.includes(code))return null;
 const all=read('validation/head-neck-v08447/clinical-migration.json');assert.equal(all.release,'0.84.47');assert.equal(all.baseline_commit,'a47e75b2765fdb10f5795152c0866f016aceb14e');
 const row=all.records.find(x=>x.code===code);assert(row,code+' current audit');
 assert.equal(sha(row.path),row.after_sha256,code+' exact source-audited encoding');assert.deepEqual(p,read(row.path),code+' actual audited input');
 const frozen=require('./retrospective-v08447.cjs').readFrozen(row.path);assert.equal(crypto.createHash('sha256').update(frozen).digest('hex'),row.before_sha256,code+' exact Git46 baseline');
 assert.equal(sha(row.source_path),row.source_sha256);assert.equal(sha(row.source_path.replace(/\.pdf$/,'.txt')),row.source_text_sha256);assert.equal(p.metadata.source_url,row.source_url);assert.equal(p.metadata.nccp_version,row.source_version);
 for(const [file,h]of [[row.audit,row.audit_sha256],[row.test,row.test_sha256],[row.results,row.results_sha256]])assert.equal(sha(file),h,'Unchanged independent audit evidence '+file);
 const results=read(row.results);assert.equal(results.total,row.total);assert.equal(results.passed,row.passed);assert.equal(results.total,results.passed);assert.equal(results.failed,0);assert(results.cases.length===results.total&&results.cases.every(x=>x.pass));assert(results.cases.some(x=>x.code===code));
 const ids=x=>x.rule_engine.rules.map(r=>r.id||r.rule_id),prior=ids(JSON.parse(frozen)),current=ids(p);assert.deepEqual(current.filter(x=>!prior.includes(x)).sort(),row.added_rule_ids);assert.deepEqual(prior.filter(x=>!current.includes(x)).sort(),row.removed_rule_ids);
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[flag],false,code+' independent approval pending');
 assert.equal(p.metadata.encoding_maturity.level,row.maturity);assert.equal(p.metadata.validation.rule_level_source_reconciliation_status,row.status);assert.deepEqual(current.filter(x=>x.startsWith('OF590_')),row.retained_legacy_organ_rule_ids);
 return {...row,result_path:row.results};
}
// Preserve source-audited exact renal inputs and distinguish creatinine ratios
// from clearance values; the historical band-only UI contract is superseded.
function numericRenal(p,field,d){
 if(require('./head-neck-inputs-v08448.cjs').numericRenal(p,field,d))return true;
 const expected={'00314':{gfr_or_crcl_ml_min:'mL/min'},'00417':{crcl_ml_min:'mL/min'},'00418':{baseline_creatinine:'µmol/L',creatinine_isotope_ratio:'ratio'},'00552':{creatinine_percent_isotope_baseline:'%'}};
 const unit=expected[p.metadata?.nccp_regimen_code]?.[field];if(!unit)return false;
 const row=validate(p);assert(row);assert.deepEqual(d,p.input_definitions[field]);assert.equal(d.type,'number');assert.equal(d.required,false);assert.equal(d.unit,unit);
 if(unit==='mL/min'){assert.equal(d.min,0);assert(d.step<=0.01,'Fractional source-boundary assessment is retained');}
 const results=read(row.results);assert(results.cases.some(c=>c.code===row.code&&Object.hasOwn(c.input||{},field)&&c.pass===true),field+' independently executed source evidence');
 return true;
}
module.exports={validate,codes,numericRenal};
