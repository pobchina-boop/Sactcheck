'use strict';
// Scope metadata can be prepared before PDFs and clinical evidence are frozen.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const m=require('../tests/helpers/retrospective-v08463.cjs');
const file=path.join(m.ROOT,'validation/olaparib-v08463/scope.json');
const scope={
 schema_version:1,release:'0.84.63',base_release:'0.84.62',base_commit:m.BASE_COMMIT,base_tree:m.BASE_TREE,production_base_commit:m.PRODUCTION_BASE_COMMIT,
 inherited_enhertu_review_status:'unmerged_pending_validation',
 codes:m.CODES,new_protocol_codes:[],new_service_codes:['00746'],reviewed_routes:m.ROUTES,new_routes:m.NEW_ROUTES,
 retained_route_origins:{'00588':'original targeted-breast suite','00588/prostate':'0.84.57'},
 source_ownership:m.SOURCE_OWNERSHIP,shared_integration_paths:m.SHARED_PATHS,
 clinical_use_authorised:false,independent_clinical_pharmacy_review:'pending',
 patient_video_change:'none_requested_voice_clone_pending',
 routing_safety:{unknown_00588_context:'explicit selector',ambiguous_gynaecology:'explicit selector',combination_00746:'separate dedicated route',all_document_types:'retain confirmed context'},
 delivery:'manual review package; no commit, push or deployment'
};
const bytes=Buffer.from(JSON.stringify(scope,null,2)+'\n');
if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
else assert(fs.existsSync(file)&&fs.readFileSync(file).equals(bytes),'Olaparib scope differs; review the explicit scope then run with --write');
console.log('Olaparib scope: two existing protocols, six reviewed suites, four new route origins; earlier breast/prostate origins preserved.');
