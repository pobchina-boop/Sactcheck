'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule');
const results=[];
for(const code of ['00525','00892']){
 const p=require('../protocols/breast/'+fs.readdirSync(path.join(__dirname,'../protocols/breast')).find(f=>f.startsWith(code)));
 function check(name,input,expected,forbidden){const r=E.assess(p,input);assert.deepEqual(r.errors,[],name);assert.deepEqual(r.invalid,[],name);if(expected)assert.equal(r.actionType,expected,code+' '+name);if(forbidden)assert(!r.findings.some(f=>forbidden.includes(f.ruleId)),name);results.push({code,name,input,action:r.actionType,rules:r.findings.filter(f=>!f.domainAssessment).map(f=>f.ruleId)});return r;}
 check('Missing values are not normal',{},'incomplete');
 for(const n of [.49,.5,.99])check('ANC interruption '+n,{anc:n},'withhold');
 check('ANC recovery boundary',{anc:1},null,['ANC_G4','ANC_G3_FIRST','ANC_G3_RECUR']);
 for(const n of [449.99,450,450.01])check('Baseline QT boundary '+n,{assessment_stage:'baseline',qtc_f:n},n>=450?'withhold':null);
 check('Ongoing QT 480 boundary',{assessment_stage:'ongoing',qtc_f:480},null,['QT_480','QT_480_500']);
 for(const n of [480.01,500,500.01])check('QT interruption '+n,{assessment_stage:'ongoing',qtc_f:n},'withhold');
 check('Serious arrhythmia with delta',{qtc_change_ms:60.01,qtc_serious_arrhythmia:true},'permanently_discontinue');
 for(const [n,action] of [[3.01,'withhold'],[5,'withhold'],[5.01,'withhold'],[20,'withhold'],[20.01,'discontinue']])check('Liver boundary '+n,{alt_ast_uln_multiple:n,baseline_liver_grade:0},action);
 check('DILI strict thresholds',{alt_ast_uln_multiple:3.01,bilirubin_uln_multiple:2.01,cholestasis_absent:true},'discontinue');
 check('No DILI at equality',{alt_ast_uln_multiple:3,bilirubin_uln_multiple:2,cholestasis_absent:true},null,['LIVER_DILI']);
 check('Dose floor for any required toxicity reduction',{dose_level:200,further_reduction_required:true},'discontinue');
 check('Dose floor does not stop a tolerated 200 mg dose',{dose_level:200,further_reduction_required:false},null,['BELOW200','DOSE_FLOOR']);
 check('Interaction requires review',{strong_cyp3a_or_qt_drug:true},'consultant_review');
 check('Severe toxicity overrides interaction review',{strong_cyp3a_or_qt_drug:true,ild_grade:3},'discontinue');
 for(const grade of [2,3,4])check('ILD grade '+grade,{ild_grade:grade},grade===2?'withhold':'discontinue');
 const r=check('Held patient has no calculated restart dose',{anc:.4,qtc_f:501},'withhold');const dose=D.buildModificationModel(p,r);assert(!dose.rows.some(x=>/^\d+[.,]?\d*\s*mg/.test(x.protocolDose)));
 assert.equal(p.metadata.validation.clinical_use_authorised,false);
 const portal=fs.readFileSync(path.join(__dirname,'../patient',code,'index.html'),'utf8');assert(portal.includes('href="passport.pdf"'));assert(portal.includes('id="ribociclib-safety"'));assert.equal((portal.match(/href="[^"]*ribociclib-review-v08461.css"/g)||[]).length,1);
 assert(!fs.readFileSync(path.join(__dirname,'../docs/patient',code,'index.html'),'utf8').includes('ribociclib-review-v08461.css')); 
 const html=fs.readFileSync(path.join(__dirname,'../patient',code,'knowledge.html'),'utf8');assert(html.includes('Kisqali'));assert(html.includes('ribociclib-interactions'));assert(html.includes('ribo-practical'));assert(html.includes('hot flushes')||html.includes('Hot flushes'));
}
// Exercise the real click function with a DOM harness; no browser-network claim.
let clicked=[],opened=[],route='patient/00525/consent-form.html';const root={document:{createElement(){return{click(){clicked.push([this.href,this.download]);},remove(){}}},body:{appendChild(){}}},SACTCheckPatientAssets:{runtimeUrl(){return route}},open(url){opened.push(url);return{};}};
const document=root.document;delete root.document;root.window=root;const context={window:root,globalThis:root,module:{exports:{}},console};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/regimen-workflow-engine-v0750.js'),'utf8'),context);
root.document=document;const api=context.module.exports;api.openConsentSupport({metadata:{nccp_regimen_code:'00525'}});assert.equal(clicked.length,1);assert.equal(clicked[0][0],'patient/00525/consent-form.pdf');assert.equal(opened.length,0);
route='patient/00207/scope.html?asset=consent-draft';api.openConsentSupport({});assert.equal(clicked.length,1);assert.equal(opened[0],route);
if(process.env.SACT_WRITE_RIBO_REVIEW)fs.writeFileSync(path.join(__dirname,'../validation/ribociclib-review-v08461/clinical-audit.json'),JSON.stringify({status:'software_cases_passed_independent_clinical_review_pending',source_urls:['https://healthservice.hse.ie/documents/6629/525_v6_Ribociclib_Metastatic_hghzyyD.pdf','https://healthservice.hse.ie/documents/6649/892_Ribociclib_Adjuvant.pdf','https://www.ema.europa.eu/en/documents/product-information/kisqali-epar-product-information_en.pdf'],cases:results,browser_verification:'blocked: local Chromium SIGABRT; shared browser cannot access workspace'},null,2)+'\n');
console.log(results.length+' ribociclib source boundary/mixed-risk cases and direct PDF/scope-selector checks passed');
