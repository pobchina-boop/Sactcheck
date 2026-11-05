'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),E=require('../../../js/assessment-engine'),D=require('../../../js/protocol-dose-schedule');
const root=path.resolve(__dirname,'../../..'),before=process.argv.includes('--before'),codes=['00732','00585','00733','00447','00448'],results=[];
const protocols=Object.fromEntries(codes.map(c=>{const dir=before?path.join(__dirname,'protocol-before'):path.join(root,'protocols/gastrointestinal');return[c,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.startsWith(c+'-')))))];}));
const has=(a,id)=>assert(a.findings.some(f=>f.ruleId===id),'Expected '+id),not=(a,id)=>assert(!a.findings.some(f=>f.ruleId===id),'Unexpected '+id),noNum=rows=>assert(!rows.some(r=>/^\d+(\.\d+)?\s*mg/.test(r.protocolDose)),'Unexpected numeric dose');
function test(c,name,input,check,page){let a,rows;try{a=E.assess(protocols[c],input);rows=D.buildModificationModel(protocols[c],a).rows;assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[]);check(a,rows);results.push({code:c,name,input,page,pass:true,action:a.actionType,invalid:a.invalid,triggered_rules:a.findings.filter(f=>!f.domainAssessment).map(f=>f.ruleId),components:rows.map(r=>({component:r.component,action:r.actionLabel,dose:r.protocolDose}))});}catch(e){results.push({code:c,name,input,page,pass:false,error:e.message,rules:a?.findings.map(f=>f.ruleId)});}}
for(const c of codes){const cet=['00732','00585','00733'].includes(c),grade=cet?'acneiform_rash_grade':'rash_grade',interval=cet?'skin_delay_weeks':'skin_doses_withheld',prev=cet?'previous_cetuximab_dose_mg_m2':'previous_panitumumab_dose_mg_kg',page={'00732':3,'00585':5,'00733':5,'00447':4,'00448':5}[c];
 test(c,'Blank input never authorises treatment',{},(a,r)=>{assert.equal(a.actionType,'incomplete');noNum(r)},'all');
 for(const n of [0,1,2,3,4])test(c,'Current skin grade '+n,{[grade]:n},a=>n>=3?has(a,cet?'SKIN_HOLD':'SKIN_CURRENT_HOLD'):not(a,cet?'SKIN_HOLD':'SKIN_CURRENT_HOLD'),page);
 for(const n of cet?[1.99,2,2.01]:[1,2])test(c,'Unrecovered skin at interruption '+n,{[grade]:3,[interval]:n},a=>n>=2?has(a,cet?'SKIN_FAILED':'SKIN_FAILED_RECOVERY'):not(a,cet?'SKIN_FAILED':'SKIN_FAILED_RECOVERY'),page);
 for(const occ of [1,2,3])for(const g of [0,1,2])for(const delay of [1,2])for(const dose of [undefined,(cet?[500,400,300]:[6,4.8,3.6])[occ-1]-.01,(cet?[500,400,300]:[6,4.8,3.6])[occ-1]]){
  const target=(cet?[500,400,300]:[6,4.8,3.6])[occ-1],id=(cet?'SKIN_RESTART_':'SKIN_RECOVERED_')+occ,review=cet?id+'_DOSE_HISTORY_REVIEW':'SKIN_DOSE_HISTORY_'+occ;
  test(c,'Skin restart '+[occ,g,delay,dose].join('/'),{[grade]:g,skin_occurrence:occ,[interval]:delay,skin_failed_recovery:false,[prev]:dose},(a,r)=>{if(dose===target){has(a,id);if(cet)assert(r.some(x=>x.component==='Cetuximab'&&x.protocolDose===target+' mg/m²'));}else{not(a,id);has(a,review);noNum(r)}},page);
 }
 const recovery={[grade]:2,skin_occurrence:2,[interval]:1,skin_failed_recovery:false,[prev]:cet?500:6};
 for(const f of [grade,interval,'skin_failed_recovery']){const input={...recovery};delete input[f];test(c,'Missing restart context '+f,input,(a,r)=>{has(a,'SKIN_RESTART_CONTEXT');noNum(r)},page)}
 for(const f of ['skin_failed_recovery','interstitial_lung_disease'])test(c,'Stop dominates restart '+f,{...recovery,[f]:true},(a,r)=>noNum(r),page);
 for(const g of [0,1,2,3,4])test(c,'Infusion grade '+g,{infusion_reaction_grade:g},a=>g>=3?has(a,cet?'INFUSION_G34':'INFUSION_SEVERE'):not(a,cet?'INFUSION_G34':'INFUSION_SEVERE'),page);
 for(const ras of ['wild_type','mutant','unknown'])test(c,'Validated RAS '+ras,{ras_status:ras},a=>ras==='wild_type'?not(a,'RAS_EXCLUSION'):has(a,'RAS_EXCLUSION'),2);
 if(cet)for(const f of ['adequate_marrow_reserve','adequate_renal_hepatic_function'])for(const v of [false,true])test(c,f+' '+v,{[f]:v},a=>v?not(a,'ELIGIBILITY_'+f.toUpperCase()):has(a,'ELIGIBILITY_'+f.toUpperCase()),c==='00732'?1:2);
 if(cet)for(const v of [false,true])test(c,'Alpha-gal risk '+v,{alpha_gal_reaction_risk:v},a=>v?has(a,'ANAPHYLAXIS_RISK'):not(a,'ANAPHYLAXIS_RISK'),2);
 if(c!=='00732'){
 const fuB=cet?'fluorouracil_bilirubin_umol_l':'bilirubin_umol_l',fuA=cet?'fluorouracil_ast_u_l':'ast_u_l',ci=cet?'FU_HEPATIC_CI':'FIVEFU_HEPATIC_CI',eq=cet?'FU_HEPATIC_EQUALITY':'FIVEFU_BOUNDARY';
 for(const [f,b]of [[fuB,85],[fuA,180]])for(const n of [b-.01,b,b+.01])test(c,'5FU absolute hepatic '+f+'/'+n,{[f]:n},a=>n>b?has(a,ci):n===b?has(a,eq):not(a,ci),4);
 for(const v of [false,true])test(c,'DPD uracil renal caveat '+v,{renal_impairment_dpd_phenotype:v},a=>v?has(a,'DPD_RENAL_PHENOTYPE_REVIEW'):not(a,'DPD_RENAL_PHENOTYPE_REVIEW'),2);
 for(const n of [1.49,1.5,1.51])test(c,'ANC day1 '+n,{assessment_type:cet?'subsequent_cycle':'current',anc_x10e9_l:n},a=>{const id=cet?'ANC_HOLD':c==='00447'?'HAEM_COUNTS_LOW_WITHIN_FOUR_WEEKS':'ANC_DAY1_HOLD';n<1.5?has(a,id):not(a,id)},3);
 for(const n of [74.99,75,75.01])test(c,'Platelets day1 '+n,{assessment_type:cet?'subsequent_cycle':'current',platelets_x10e9_l:n},a=>{const id=cet?'PLATELETS_HOLD':c==='00447'?'HAEM_COUNTS_LOW_WITHIN_FOUR_WEEKS':'PLATELETS_DAY1_HOLD';n<75?has(a,id):not(a,id)},3);
 }
}
for(const c of ['00585','00448']){
 const grade=c==='00585'?'diarrhoea_grade':'diarrhoea_current_grade';
 for(const g of [0,1,2,3,4])test(c,'Current diarrhoea component hold '+g,{[grade]:g},(a,rows)=>{if(g>0)has(a,c==='00585'?'DIARRHOEA_NOT_RESOLVED':g===1?'IRINOTECAN_DIARRHOEA_NOT_RESOLVED':'DIARRHOEA_CURRENT_G2_HOLD');if(g>=2)for(const n of ['Irinotecan','Bolus 5-FU','Infusional 5-FU','Folinic acid'])assert(rows.some(r=>r.component===n&&r.protocolDose==='No dose now'),n)},c==='00585'?6:5);
 for(const n of [2.99,3,3.01])test(c,'Irinotecan bilirubinULN '+n,{[c==='00585'?'bilirubin_uln_multiple':'bilirubin_ratio_uln']:n},a=>n>3?has(a,c==='00585'?'BILI_CI':'IRINOTECAN_BILI_GT3ULN'):not(a,c==='00585'?'BILI_CI':'IRINOTECAN_BILI_GT3ULN'),4);
}
for(const c of ['00733','00447']){
 for(const n of [29.99,30,30.01])for(const dialysis of [false,true])test(c,'Distinct oxaliplatin renal policy '+n+'/'+dialysis,{crcl_ml_min:n,haemodialysis:dialysis},(a,r)=>{if(c==='00447')n<30?has(a,'RENAL_LT30'):not(a,'RENAL_LT30');else{(n<30||dialysis)?has(a,'OX_RENAL_REDUCTION'):not(a,'OX_RENAL_REDUCTION');noNum(r)}},4);
 if(c==='00733')test(c,'Respiratory hold includes both agents',{unexplained_respiratory_symptoms:true},(a,r)=>{has(a,'RESPIRATORY');for(const n of ['Cetuximab','Oxaliplatin'])assert(r.some(x=>x.component===n&&x.protocolDose==='No dose now'))},5);
 for(const t of [undefined,4,4.01])test(c,'Diarrhoea recovery window '+t,{[c==='00733'?'diarrhoea_grade':'diarrhoea_current_grade']:1,diarrhoea_highest_grade:3,[c==='00733'?'toxicity_delay_weeks':'diarrhoea_duration_weeks']:t,current_fluorouracil_bolus_level:0,current_fluorouracil_infusion_level:0,current_bolus_5fu_level:0,current_infusional_5fu_level:0},(a,r)=>t===4?not(a,'DIARRHOEA_RESTART_CONTEXT'):has(a,'DIARRHOEA_RESTART_CONTEXT'),c==='00733'?6:5);
}

for(const c of ['00447','00448'])for(const v of [true,false])test(c,'Intolerable skin '+v,{intolerable_skin_toxicity:v,rash_grade:1},(a,r)=>{if(v){has(a,'SKIN_INTOLERABLE');assert(r.some(x=>x.component==='Panitumumab'&&x.protocolDose==='No dose now'))}else not(a,'SKIN_INTOLERABLE')},'EMA 4.4');
for(const c of ['00585','00448','00733','00447'])for(const v of [true,false]){
 test(c,'Potent DPD inhibitor '+v,{concurrent_brivudin_sorivudin_or_analogue:v},(a,r)=>{if(v){has(a,'FU_DPD_INHIBITOR_CONTRAINDICATION');for(const name of ['Bolus 5-FU','Infusional 5-FU','Folinic acid'])assert(r.some(x=>x.component===name&&x.protocolDose==='Not to be administered'));noNum(r)}else not(a,'FU_DPD_INHIBITOR_CONTRAINDICATION')},c==='00585'?9:8);
 test(c,'5FU interaction review '+v,{fluorouracil_interaction_review_needed:v},(a,r)=>{v?has(a,'FU_INTERACTION_REVIEW'):not(a,'FU_INTERACTION_REVIEW');noNum(r)},c==='00585'?9:8);
 if(['00585','00448'].includes(c))for(const [field,id] of [['gilbert_syndrome','GILBERT_REVIEW'],['irinotecan_interaction_review_needed','IRINOTECAN_INTERACTION_REVIEW']])test(c,field+'/'+v,{[field]:v},(a,r)=>{v?has(a,id):not(a,id);noNum(r)},8);
}
for(const c of codes)for(const field of Object.keys(JSON.parse(fs.readFileSync(path.join(root,'protocols/gastrointestinal',fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(c+'-'))))).input_definitions))for(const value of ['',null])test(c,'Blank field '+field+'/'+JSON.stringify(value),{[field]:value},(a,r)=>{noNum(r);assert.notEqual(a.actionType,'proceed');},'all');
const report={release:'0.84.35',mode:before?'before':'current',total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,clinical_use_authorised:false,cases:results};fs.writeFileSync(path.join(__dirname,before?'source-case-before-results.json':'source-case-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed}));for(const r of results.filter(x=>!x.pass))console.error(r.code,r.name,r.error);if(report.failed)process.exitCode=1;
