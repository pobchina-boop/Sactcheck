'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),path=require('node:path');
const GIST=require('./gist-inputs-v08461.cjs'),root=path.resolve(__dirname,'../..');
const contracts={
 '00325':{removed:['OF590_00325_SUNITINIB_CHILD_C'],required:['CHILD_C_SOURCE_CONFLICT','DIALYSIS_REVIEW','LIVER_LABS_REVIEW','HEPATIC_FAILURE']},
 '00335':{removed:['OF590_00335_IMATINIB_LFT_HOLD'],required:['HEPATIC_ACTIVE_HOLD','HEPATIC_RECOVERY_INCOMPLETE','HEPATIC_RECOVERED_REVIEW','CARDIORENAL_SYMPTOMS','ORGAN_IMPAIRMENT_REVIEW']},
 '00719':{removed:['OF590_00719_SUNITINIB_CHILD_C'],required:['CHILD_PUGH_C','DIALYSIS_REVIEW','HEPATIC_FAILURE_STOP']}
};
function validate(p){
 const code=p.metadata?.nccp_regimen_code,contract=contracts[code];if(!contract||!GIST.applies(p))return null;
 const record=GIST.validate(p);
 const before=JSON.parse(cp.execFileSync('git',['show','b9f502e43794579e732431354ceb5314981b78ad:'+record.path],{cwd:root}));
 assert.deepEqual(before.rule_engine.rules.map(r=>r.rule_id||r.id).filter(id=>id.startsWith('OF590_')),contract.removed,code+' exact superseded organ rules');
 assert.deepEqual(p.rule_engine.rules.filter(r=>(r.rule_id||r.id).startsWith('OF590_')),[],code+' no superseded organ rules retained');
 for(const id of contract.required){const rule=p.rule_engine.rules.find(r=>(r.rule_id||r.id)===id);assert(rule,code+' missing replacement '+id);assert(record.allowed_rule_source_urls.includes(rule.source.url));assert(rule.source.page||rule.source.section);assert(rule.action.block_numeric_dose===true||rule.action.dose_calculation==='specialist_review');}
 return {...contract,maturity:'source_reconciled_pending_independent_review',status:'locally_integrated_v08461_review_source_ambiguities_and_human_approval_pending',source_version:record.source_version};
}
module.exports={validate,contracts};
