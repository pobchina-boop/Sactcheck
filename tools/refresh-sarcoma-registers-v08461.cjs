'use strict';
// Update only the four reviewed GIST records; retain all previous review evidence.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),write=(f,j)=>fs.writeFileSync(path.join(root,f),JSON.stringify(j,null,2)+'\n');
const prefix='validation/sarcoma-v08461/',scope=read(prefix+'scope.json'),handoff=read(prefix+'clinical/application-handoff.json');
const reports=['clinical/imatinib-sunitinib42-draft-test-results.json','clinical/sunitinib21-regorafenib-draft-tests.json'];
const author=reports.flatMap(f=>read(prefix+f).cases),independent=read(prefix+'independent-review/current-results.json');
assert.equal(author.length,310);assert.equal(author.filter(x=>x.passed).length,310);assert.equal(independent.passed,119);assert.equal(independent.failed,0);
const file='data/clinical-validation-register-v0630.json',register=read(file),previous=structuredClone(register);
const kb=read('data/regimen-knowledge-base-v08461-addendum.json');
for(const item of handoff.protocols){
 const p=read(item.path),m=p.metadata,row=register.protocols.find(r=>r.nccp_code===item.code);assert(row);
 assert.equal(p.protocol_id,row.protocol_id,'Source identities are unchanged in this integration');
 Object.assign(row,{nccp_version:String(m.nccp_version),title:m.title,short_title:m.short_title,indication:m.indication,source_url:m.source_url,encoding_version:m.sactcheck_encoding_version,rule_count:p.rule_engine.rules.length,input_count:Object.keys(p.input_definitions).length,
  knowledge_base_profile:[...(kb.regimen_profiles||[]),...(kb.context_regimen_profiles||[])].some(x=>x.protocol_id===p.protocol_id),
  source_document_checked:true,software_tests_completed:false,formal_consultant_reviewed:false,formal_pharmacy_reviewed:false,
  source_checked_date:'2026-11-18',source_verification_method:'Current official HSE/NCCP listing and complete extracted text; original binary PDF bytes unavailable; source table visual layout unverified.',original_source_pdf_sha256:null,source_visual_table_verification:'unverified_no_viewable_pixels',
  scoped_software_validation:{release:'0.84.61',passed:author.filter(c=>c.code===item.code).length,failed:0,reports:reports.map(f=>prefix+f),replay:'node tools/check-sarcoma-clinical-v08461.cjs',full_historical_ci:'blocked_missing_git_objects',browser_acceptance:'blocked_socket_restrictions'},
  scoped_independent_software_validation:{release:'0.84.61',passed:independent.results.filter(c=>c.code===item.code).length,failed:0,report:prefix+'independent-review/current-results.json',replay:'node tools/check-sarcoma-independent-v08461.cjs',independent_clinical_approval:false},
  source_ambiguity_status:'Explicit source conflicts and unsupported dose inferences remain hold/review branches; human clinical/pharmacy acceptance pending.'
 });
}
register.content_update_release='0.84.61';register.generated_date='2026-11-18';
for(const row of previous.protocols)if(!scope.changed_clinical_codes.includes(row.nccp_code))assert.deepEqual(register.protocols.find(r=>r.nccp_code===row.nccp_code),row,'Unrelated register row changed');
write(file,register);console.log('Updated four GIST clinical register rows; retained all unrelated review rows and human approval boundaries.');
