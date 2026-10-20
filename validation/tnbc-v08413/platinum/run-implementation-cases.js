const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='/workspace/scratch/aa44ad62d693/sactcheck-v08413';
const out='/workspace/scratch/aa44ad62d693/tnbc-v08413-research/platinum';
const E=require(root+'/js/assessment-engine'),D=require(root+'/js/protocol-dose-schedule');
const protocols={};
for(const code of ['00348','00734']) {const f=fs.readdirSync(root+'/protocols/breast').find(f=>f.startsWith(code+'-'));protocols[code]=JSON.parse(fs.readFileSync(root+'/protocols/breast/'+f));}
const cases=[];function add(id,code,inputs,expect){cases.push({id,code,inputs,expect});}
for(const code of ['00348','00734']) {
 const tax={treatment_phase:'taxane',assessment_stage:'ongoing',cycle_number:2,day_number:1};
 const ac={treatment_phase:'ac',assessment_stage:'ongoing',cycle_number:5,day_number:1};
 add(code+'-severe-hepatic-baseline',code,{treatment_phase:'taxane',assessment_stage:'baseline',severe_hepatic_impairment:true},'Taxane source severe hepatic exclusion / explicit review');
 add(code+'-crcl40-taxane',code,{...tax,crcl_ml_min:40},'Carboplatin CrCl<60 myelosuppression-risk review');
 add(code+'-gfr20-taxane',code,{...tax,gfr_ml_min:20},'contraindicated carboplatin');
 add(code+'-gfr20-ac',code,{...ac,gfr_ml_min:20},'No carboplatin rule; it is inactive');
 add(code+'-ddac-anc-equality',code,{...ac,anc_x10e9_l:1,platelets_x10e9_l:150},'consultant_review');
 add(code+'-ddac-plt-equality',code,{...ac,anc_x10e9_l:2,platelets_x10e9_l:100},'consultant_review');
 add(code+'-ddac-low',code,{...ac,anc_x10e9_l:.99,platelets_x10e9_l:99},'delay');
 add(code+'-hepatic-gap',code,{...tax,alt_uln_multiple:2,bilirubin_uln_multiple:1.255},'consultant_review');
 add(code+'-doxo-gap51',code,{...ac,bilirubin_umol_l:51},'consultant_review');
 add(code+'-cyclo-gap29_5',code,{...ac,crcl_ml_min:29.5},'consultant_review');
 add(code+'-neuropathy2',code,{...tax,neuropathy_grade:2},'consultant_review; no guessed dose');
 add(code+'-neuropathy3',code,{...tax,neuropathy_grade:3},'withhold and source overlap review');
 add(code+'-two-reductions-only',code,{...tax,paclitaxel_reduction_count:2,intolerant_after_reductions:false},'No intolerance discontinuation solely for count2');
 add(code+'-two-reductions-intolerant',code,{...tax,paclitaxel_reduction_count:2,intolerant_after_reductions:true},'discontinue');
 add(code+'-unknownphase-anc',code,{anc_x10e9_l:.5},'consultant_review phase context');
 add(code+'-unknownphase-severehepatic',code,{severe_hepatic_impairment:true},'Explicit phase context review; no implied normal severe hepatic domain');
 add(code+'-unknownphase-dialysis',code,{haemodialysis:true},'Explicit phase context review');
 add(code+'-taxane-lvef49',code,{...tax,lvef_percent:49},'Source cardiac exclusion may need review; doxorubicin absent from active visit should be identified as future phase');
}
for (const anc of [.49,.5,.99,1]) add('00734-weekly-anc-'+anc,'00734',{treatment_phase:'taxane',assessment_stage:'ongoing',anc_x10e9_l:anc},anc<.5?'delay_then_dose_reduce':anc<1?'delay':'No threshold restriction; partial only');
for (const plt of [49,50,74,75,99,100]) add('00734-weekly-plt-'+plt,'00734',{treatment_phase:'taxane',assessment_stage:'ongoing',platelets_x10e9_l:plt},plt<50?'delay_then_dose_reduce':plt<75?'delay':plt<100?'consultant_review':'No threshold restriction; partial only');
for (const day of [1,8,15]) add('00348-lowcounts-day'+day,'00348',{treatment_phase:'taxane',assessment_stage:'ongoing',cycle_number:2,day_number:day,anc_x10e9_l:.4,platelets_x10e9_l:40},day===1?'delay':'consultant_review; no borrowed omit cutoff');
for (const cyc of [1,5,0]) add('00348-outside-source-cycle'+cyc,'00348',{treatment_phase:'taxane',assessment_stage:'ongoing',cycle_number:cyc,day_number:1,anc_x10e9_l:.4,platelets_x10e9_l:40},'Explicit source scope/phase mismatch review');
add('00734-baseline-ANC1_5','00734',{treatment_phase:'taxane',assessment_stage:'baseline',anc_x10e9_l:1.5},'consultant_review');
add('00734-baseline-ANC1_49','00734',{treatment_phase:'taxane',assessment_stage:'baseline',anc_x10e9_l:1.49},'contraindicated');
add('00734-baseline-platelet100','00734',{treatment_phase:'taxane',assessment_stage:'baseline',platelets_x10e9_l:100},'consultant_review missing comparator');
const results=cases.map(c=>{const r=E.assess(protocols[c.code],c.inputs),m=D.buildModificationModel(protocols[c.code],r);return {...c,actual:{actionType:r.actionType,errors:r.errors,invalid:r.invalid,findings:r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||'')).map(f=>({id:f.ruleId,action:f.actionType,components:f.action.components,text:f.explanation})),domainFindings:r.findings.filter(f=>f.domainAssessment||/^PARTIAL_/.test(f.ruleId||'')).map(f=>({id:f.ruleId,action:f.actionType,text:f.explanation})),doseRows:m.rows.map(r=>({component:r.componentId,action:r.actionType,dose:r.protocolDose,rule:r.ruleId}))}}});
const hashes={};for(const f of ['tools/reconcile-tnbc-v08413.py','tools/build-tnbc-v08413-content.py','protocols/breast/00348-carbo-auc6-paclitaxel-ddac.json','protocols/breast/00734-weekly-carbo-paclitaxel-ddac.json'])hashes[f]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
fs.writeFileSync(out+'/implementation-cases.json',JSON.stringify({run_at:new Date().toISOString(),scope:'Targeted source-boundary and regression probes; not full clinical validation',hashes,results},null,2)+'\n');
for(const c of results)console.log(c.id+'\t'+c.actual.actionType+'\t'+c.actual.findings.map(f=>f.id+':'+f.components.join(',')).join(';'));
