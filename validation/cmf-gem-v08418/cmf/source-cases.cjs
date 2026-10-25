'use strict';
// Source-derived scenarios for NCCP 00377/00378/00381 v6, reviewed 25 October 2026.
// Default tests proposed copies. Pass integrated to test the production protocols; baseline records pre-change failures.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(root+'/js/assessment-engine'),D=require(root+'/js/protocol-dose-schedule'),Course=require(root+'/js/regimen-course-metadata');
const mode=process.argv[2]||'proposed',dir=mode==='integrated'?root+'/protocols/breast':path.join(__dirname,mode==='baseline'?'baseline':'proposed');
const codes=['00377','00378','00381'],results=[];
const ps=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(n=>n.startsWith(c+'-')))))]));
function check(code,name,input,type,pattern,component,absent=false){
 const row={code,name,input,source:ps[code].metadata.source_url};
 try{
  const r=E.assess(ps[code],input),f=r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||''));
  row.actual={action:r.actionType,findings:f.map(x=>({type:x.actionType,text:x.explanation,components:x.action?.components})),errors:r.errors,invalid:r.invalid};
  assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);
  if(type==='incomplete')assert.equal(r.actionType,'incomplete');
  else {const hits=f.filter(x=>(!type||x.actionType===type)&&(!pattern||new RegExp(pattern,'i').test(x.explanation))&&(!component||x.action?.components?.includes(component)));assert.equal(hits.length>0,!absent,name);}
  if(!absent&&type!=='incomplete'){assert(!['proceed','proceed_with_caution'].includes(r.actionType));const m=D.buildModificationModel(ps[code],r);assert(!m.rows.some(x=>/^\d+(\.\d+)?\s*mg/.test(x.protocolDose||'')),'Unresolved review generated a numeric prescribed dose');}
  row.pass=true;
 }catch(e){row.pass=false;row.error=e.message;}
 results.push(row);
}
function content(code,name,fn){let row={code,name,source:ps[code].metadata.source_url};try{fn(ps[code]);row.pass=true}catch(e){row.pass=false;row.error=e.message}results.push(row)}
for(const c of codes){
 check(c,'Blank assessment never clears',{},'incomplete');
 for(const n of [0,.99])check(c,'ANC delay '+n,{anc_x10e9_l:n},'delay','delay');
 for(const n of [1,1.49])check(c,'ANC75% '+n,{anc_x10e9_l:n},'dose_reduce','75%');
 for(const n of [1.495,1.5])check(c,'ANC source gap '+n,{anc_x10e9_l:n},'consultant_review','not assigned|boundary|gap');
 check(c,'Normal ANC does not promise full clearance',{anc_x10e9_l:2},null,'full dose|100%|cleared',null,true);
 for(const n of [0,69.99])check(c,'Platelet delay '+n,{platelets_x10e9_l:n},'delay','delay');
 for(const n of [70,89])check(c,'Platelet75% '+n,{platelets_x10e9_l:n},'dose_reduce','75%');
 for(const n of [89.5,90])check(c,'Platelet source gap '+n,{platelets_x10e9_l:n},'consultant_review','not assigned|boundary|gap');
 check(c,'Normal ANC cannot override platelets60',{anc_x10e9_l:3,platelets_x10e9_l:60},'delay','delay');
 check(c,'Normal platelets cannot override ANC0.5',{anc_x10e9_l:.5,platelets_x10e9_l:200},'delay','delay');
 check(c,'Count OR conflict surfaced',{anc_x10e9_l:1.2,platelets_x10e9_l:200},'consultant_review','discordant|conflicting');
 check(c,'Complete DPD exclusion',{dpd_status:'complete'},'contraindicated','do not|must not','fluorouracil');
 check(c,'Partial DPD no invented fraction',{dpd_status:'partial'},'consultant_review','reduced|reduction','fluorouracil');
 check(c,'Unknown DPD review',{dpd_status:'unknown'},'consultant_review','before first|before.*fluorouracil','fluorouracil');
 check(c,'Missing first-dose DPD is not normal',{assessment_stage:'baseline'},'consultant_review','DPD.*missing|DPD.*before','fluorouracil');
 for(const n of [0,10,19.99])check(c,'MTX CrCl under20 '+n,{crcl_ml_min:n},'consultant_review','not recommended','methotrexate');
 for(const n of [20,20.5,49.99])check(c,'MTX CrCl50% '+n,{crcl_ml_min:n},'dose_reduce','50%','methotrexate');
 check(c,'MTX CrCl50 overlap',{crcl_ml_min:50},'consultant_review','overlap','methotrexate');
 check(c,'MTX CrCl50.1 no reduction',{crcl_ml_min:50.1},'dose_reduce',null,'methotrexate',true);
 check(c,'Indexed eGFR does not enter CrCl table',{renal_measure_type:'egfr',crcl_ml_min:15},'consultant_review','CrCl|creatinine');
 check(c,'Indexed eGFR does not generate MTX percentage',{renal_measure_type:'egfr',crcl_ml_min:25},'dose_reduce','50%','methotrexate',true);
 check(c,'Bilirubin86 is not above86',{bilirubin_umol_l:86},'contraindicated',null,'methotrexate',true);
 check(c,'Bilirubin86.1 avoids MTX',{bilirubin_umol_l:86.1},'contraindicated','avoid','methotrexate');
 check(c,'Dialysis needs component review',{haemodialysis:true},'consultant_review','high.flux|dialysis');
 check(c,'Hepatic with renal impairment respects qualifier',{fluorouracil_hepatic_severity:'moderate',renal_impairment_present:true},'consultant_review','combined|absence of renal','fluorouracil');
 check(c,'Third-space fluid raises MTX exposure concern',{pleural_effusion_or_ascites:true},'consultant_review','third.space|retain|prolong','methotrexate');
 check(c,'New cardiac symptoms require urgent review',{clinically_significant_cardiac_symptoms:true},'withhold','urgent','fluorouracil');
 check(c,'Pregnancy/lactation excluded',{pregnancy_or_lactation:true},'contraindicated','pregnancy|breastfeeding');
 check(c,'Hypersensitivity excluded',{drug_hypersensitivity:true},'contraindicated','hypersensitivity');
 check(c,'ECOG3 outside eligibility',{ecog:3},'consultant_review','eligibility');
 check(c,'Acute FN not a future percentage',{febrile_neutropenia:true},'withhold','urgent');
 check(c,'Severe GI toxicity review not invented reduction',{severe_gastrointestinal_toxicity:true},'withhold','no universal|no.*percentage');
 check(c,'Unresolved tests review',{pretreatment_tests_unresolved:true},'consultant_review','FBC|renal');
 check(c,'Unrecognised DPD cannot clear',{dpd_status:'unrecognised'},'consultant_review','unrecognised');
 content(c,'Correct indications, page counts and governance',p=>{assert.deepEqual(p.metadata.treatment_setting,['adjuvant','metastatic']);assert.equal(p.metadata.source_document_pages,c==='00377'?5:6);assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.metadata.validation.consultant_reviewed,false);assert.equal(p.metadata.validation.oncology_pharmacy_reviewed,false)});
 content(c,'Exact schedule and indication-specific course',p=>{const ph=p.treatment_phases[0],a=ph.administration;assert.equal(ph.cycle_length_days,c==='00381'?21:28);for(const [drug,dose]of [['fluorouracil',600],['methotrexate',40]]){const x=a.find(x=>x.drug===drug);assert.equal(x.dose.value,dose);assert.deepEqual(x.days,c==='00381'?[1]:[1,8]);}const cy=a.find(x=>x.drug==='cyclophosphamide');assert.equal(cy.dose.value,c==='00377'?100:600);assert.deepEqual(cy.days,c==='00377'?Array.from({length:14},(_,i)=>i+1):c==='00381'?[1]:[1,8]);assert.match(ph.duration_text,new RegExp('Adjuvant: '+(c==='00381'?8:6)+' cycles'));assert.match(ph.duration_text,/Metastatic: until progression/);assert.equal(ph.cycles,undefined);const contexts=Course.deriveContexts(p);assert.equal(contexts.length,2);assert.equal(contexts.find(x=>x.indication_id===c+'a').duration.planned_cycles,c==='00381'?8:6);assert.equal(contexts.find(x=>x.indication_id===c+'b').duration.type,'until_progression_or_toxicity');assert(p.indications.every(x=>x.description&&x.description.length>5))});
}
for(const n of [0,9.99])check('00377','Oral cyclophosphamide50% '+n,{crcl_ml_min:n},'dose_reduce','50%','cyclophosphamide');
for(const n of [10,19.5,20])check('00377','Oral cyclophosphamide75% '+n,{crcl_ml_min:n},'dose_reduce','75%','cyclophosphamide');
for(const n of [20.1,29,30])check('00377','Oral >20 must not borrow IV reduction '+n,{crcl_ml_min:n},'dose_reduce',null,'cyclophosphamide',true);
check('00377','Oral severe hepatic is clinical decision',{cyclophosphamide_hepatic_severity:'severe'},'consultant_review','clinical decision','cyclophosphamide');
for(const c of ['00378','00381']){
 check(c,'IV CrCl9.9 not-recommended conditional option',{crcl_ml_min:9.9},'consultant_review','not recommended.*50%','cyclophosphamide');
 for(const n of [10,20,29])check(c,'IV CrCl consider75 '+n,{crcl_ml_min:n},'consultant_review','consider.*75%','cyclophosphamide');
 for(const n of [29.5,30])check(c,'IV CrCl gap '+n,{crcl_ml_min:n},'consultant_review','unassigned|gap','cyclophosphamide');
 check(c,'IV CrCl30.1 no cyclophosphamide reduction',{crcl_ml_min:30.1},null,'75%|50%|gap','cyclophosphamide',true);
 check(c,'IV severe hepatic not recommended',{cyclophosphamide_hepatic_severity:'severe'},'consultant_review','not recommended','cyclophosphamide');
}
check('00378','IV28 severe5FU is source gap, not borrowed contraindication',{fluorouracil_hepatic_severity:'severe'},'consultant_review','does not give|source.*gap|does not.*recommendation','fluorouracil');
check('00378','IV28 severe5FU no false source contraindication',{fluorouracil_hepatic_severity:'severe'},'contraindicated',null,'fluorouracil',true);
for(const c of ['00377','00381'])check(c,'Severe5FU source not-recommended restriction',{fluorouracil_hepatic_severity:'severe'},'contraindicated','not recommended','fluorouracil');
content('00381','No invented Day8 IV21 treatment',p=>{assert(p.treatment_phases[0].administration.every(x=>!x.days.includes(8)));assert(p.metadata.source_boundaries.some(x=>/Day 8/.test(x)))});
const report={mode,total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results};
fs.writeFileSync(path.join(__dirname,mode+'-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({mode,total:report.total,passed:report.passed,failed:report.failed,failures:results.filter(x=>!x.pass).map(x=>({code:x.code,name:x.name,error:x.error}))},null,2));
if(report.failed&&mode!=='baseline')process.exitCode=1;
