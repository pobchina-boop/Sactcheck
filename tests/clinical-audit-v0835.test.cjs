'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule');
const root=path.resolve(__dirname,'..'),out=[],ps=Object.fromEntries(['00225','00447','00448'].map(c=>[c,require('../protocols/gastrointestinal/'+fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(c)))]));
function test(c,name,inputs,expected,check=()=>{}){const p=ps[c],r=E.assess(p,inputs),d=D.buildModificationModel(p,r);assert.equal(r.actionType,expected,`${c} ${name}`);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);check(r,d);out.push({code:c,case:name,inputs,expected,actual:r.actionType,partial:r.partialAssessment,pass:true,findings:r.findings.filter(f=>!f.domainAssessment).map(f=>({id:f.ruleId,source:f.sourceText,explanation:f.explanation})),components:d.rows.map(x=>({component:x.component,action:x.actionLabel,dose:x.protocolDose}))});return {r,d};}
const onlyPani=(r,d)=>assert(d.rows.every(x=>x.component==='Panitumumab'));
for(const c of Object.keys(ps)){
 const rash=c==='00225'?'acneiform_rash_grade':'rash_grade';test(c,'Blank remains incomplete',{},'incomplete');
 for(const status of ['mutant','unknown'])test(c,`RAS ${status}`,{ras_status:status},'contraindicated',onlyPani);
 for(const grade of [3,4])test(c,`Skin current grade ${grade}`,{[rash]:grade},'withhold',onlyPani);
 for(const occurrence of [1,2,3])for(const withheld of [1,2])for(const grade of [0,1,2])test(c,`Skin recovery grade ${grade}, episode ${occurrence}, withheld ${withheld}`,{[rash]:grade,skin_occurrence:occurrence,skin_doses_withheld:withheld,skin_failed_recovery:false},occurrence===1?'consultant_review':'dose_reduce',(r,d)=>{onlyPani(r,d);if(occurrence>1)assert(d.rows.some(x=>x.protocolDose===`${occurrence===2?4.8:3.6} mg/kg`));});
 test(c,'Fourth severe episode',{skin_occurrence:4},'discontinue',onlyPani);test(c,'No recovery after withholding',{skin_failed_recovery:true},'discontinue',onlyPani);
 for(const inputs of [{[rash]:1,skin_occurrence:2},{[rash]:1,skin_occurrence:2,skin_doses_withheld:0,skin_failed_recovery:false}]){const r=E.assess(ps[c],inputs);assert(!r.findings.some(f=>/^SKIN_RECOVERED/.test(f.ruleId)));out.push({code:c,case:'No restart without confirmed withholding/recovery context',inputs,actual:r.actionType,pass:true});}
 for(const g of [1,2,3,4])test(c,`Infusion grade ${g}`,{infusion_reaction_grade:g},g<3?'consultant_review':'permanently_discontinue',onlyPani);
 test(c,'Eye symptoms',{ocular_symptoms:true},'consultant_review',onlyPani);test(c,'Ulcerative keratitis',{ulcerative_keratitis:true},'withhold',onlyPani);test(c,'New respiratory symptoms',{unexplained_respiratory_symptoms:true},'withhold');test(c,'Confirmed ILD',{interstitial_lung_disease:true},'permanently_discontinue');test(c,'Electrolyte correction',{electrolyte_abnormality:true},'consultant_review',onlyPani);test(c,'No invented magnesium hold cutoff',{magnesium_mmol_l:.2},'partial_context_required');test(c,'Severe infected or blistered skin',{severe_skin_complication:true},'withhold',onlyPani);
 test(c,'Outside ECOG range',{ecog:3},'consultant_review');test(c,'Organ impairment source context',{renal_impairment:true},c==='00225'?'proceed_with_caution':'consultant_review');
 assert(ps[c].rule_engine.rules.every(r=>r.source.url&&r.source.page));assert.equal(ps[c].metadata.validation.clinical_use_authorised,false);
}
for(const c of ['00447','00448']){
 const delay=c==='00447'?'delay_weeks':'toxicity_delay_weeks',fu=c==='00447'?'bolus_5fu':'fluorouracil_bolus';
 for(const val of [.49,.5,.999,1,1.499])test(c,`ANC-only ${val}`,{anc_x10e9_l:val},'withhold',(r,d)=>assert(d.rows.every(x=>x.component!=='Panitumumab')));
 for(const val of [9.9,10,49.9,50,74.99])test(c,`Platelet-only ${val}`,{platelets_x10e9_l:val},'withhold');
 for(const [field,limit] of [['bilirubin_umol_l',85],['ast_u_l',180]]){test(c,`${field} exact source gap`,{[field]:limit},'consultant_review');test(c,`${field} above CI`,{[field]:limit+.01},'contraindicated');const r=E.assess(ps[c],{[field]:limit-.01});assert(!r.findings.some(f=>f.ruleId==='FIVEFU_HEPATIC_CI'));}
 for(const sev of ['moderate','severe'])test(c,`Hepatic ${sev} source conflict`,{hepatic_impairment_category:sev},'consultant_review',(r,d)=>assert(!d.rows.some(x=>/^\d.*mg/.test(x.protocolDose))));
 test(c,'Unknown DPD',{dpd_status:'unknown',assessment_type:'baseline'},c==='00447'?'consultant_review':'withhold');test(c,'Complete DPD',{dpd_status:'complete'},'contraindicated');
 test(c,'No current dose level inferred',{[c==='00447'?'neuropathy_grade':'stomatitis_highest_grade']:3,...(c==='00447'?{neuropathy_pattern:'first'}:{stomatitis_current_grade:0,toxicity_delay_weeks:1})},'dose_reduce',(r,d)=>assert(d.rows.some(x=>x.protocolDose.includes('current component dose level'))));
 test(c,'Separate antibody stop and chemo hold',{infusion_reaction_grade:3,anc_x10e9_l:1.4},'permanently_discontinue',(r,d)=>{assert.equal(d.rows.find(x=>x.component==='Panitumumab').protocolDose,'Not to be administered');assert(d.rows.filter(x=>x.component!=='Panitumumab').every(x=>x.protocolDose==='No dose now'));});
 test(c,'Low counts after source time limit',{anc_x10e9_l:1.4,[delay]:4},'discontinue');
}
for(const [v,a] of [[29.99,'contraindicated'],[30,'proceed_with_caution'],[60,'proceed_with_caution']])test('00447',`CrCl ${v}`,{crcl_ml_min:v},a);
test('00447','Dialysis has no copied 50% rule',{crcl_ml_min:'dialysis'},'consultant_review',(r,d)=>assert(!JSON.stringify(d).includes('42.5')));
for(const [grade,pattern,a] of [[2,'first','dose_reduce'],[3,'first','dose_reduce'],[3,'second','dose_reduce'],[3,'persistent','discontinue'],[4,'first','discontinue']])test('00447',`Neuropathy ${grade}/${pattern}`,{neuropathy_grade:grade,neuropathy_pattern:pattern,current_oxaliplatin_level:-1},a,(r,d)=>{if(a==='dose_reduce')assert(d.rows.some(x=>x.protocolDose.includes('50 mg/m')));});
test('00447','Neuropathy history needed',{neuropathy_grade:3},'consultant_review');test('00447','Stomatitis hold has no inherited two-week stop',{stomatitis_current_grade:2,stomatitis_duration_weeks:3},'withhold');
for(const [anc,step] of [[.999,1],[.5,1],[.499,2]])test('00448',`FOLFIRI ANC nadir ${anc}`,{anc_x10e9_l:1.5,platelets_x10e9_l:75,lowest_anc_during_delay_x10e9_l:anc,toxicity_delay_weeks:1,current_irinotecan_level:0,current_fluorouracil_bolus_level:0,current_fluorouracil_infusion_level:0},'dose_reduce',(r,d)=>assert(d.rows.find(x=>x.component==='Irinotecan').protocolDose.includes(step===1?'150':'120')));
for(const [field,v] of [['anc_x10e9_l',1.99],['platelets_x10e9_l',99.99]])test('00448',`Baseline exclusion ${field}`,{assessment_type:'baseline',[field]:v},'contraindicated');
test('00448','ANC two-to-four-week discrepancy',{anc_x10e9_l:1.4,toxicity_delay_weeks:3},'withhold',r=>assert(r.findings.some(f=>f.ruleId==='ANC_SOURCE_INTERVAL')));
test('00448','Residual diarrhoea holds irinotecan',{diarrhoea_current_grade:1},'withhold',(r,d)=>assert.deepEqual(d.rows.map(x=>x.component),['Irinotecan']));
test('00448','Source has no CrCl<10 percentage',{crcl_ml_min:9,renal_impairment:true},'consultant_review',(r,d)=>assert(!JSON.stringify(d).includes('50–66')));
for(const code of ['00225','00447'])for(const field of ['pregnancy','breastfeeding'])test(code,field+' requires review',{[field]:true},'consultant_review');
test('00447','Dose reduction beyond final level stops oxaliplatin',{neuropathy_grade:2,current_oxaliplatin_level:-2},'dose_reduce',(r,d)=>assert.match(d.rows[0].protocolDose,/discontinue/i));
if(process.env.SACT_WRITE_VALIDATION){fs.mkdirSync(path.join(root,'validation/colorectal-v0835'),{recursive:true});fs.writeFileSync(path.join(root,'validation/colorectal-v0835/engine-cases.json'),JSON.stringify(out,null,2)+'\n');}
console.log(`${out.length} source-derived panitumumab boundary, recurrence and component cases passed.`);
