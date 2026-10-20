'use strict';
/* Source expectations: NCCP00322 v4 pp1–4 and EU Afinitor SmPC §§4.2–4.5.
   Synthetic values only. This is software/source verification, not clinical authorisation. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=process.env.SACT_REPO||path.resolve(__dirname,'../..'),P=JSON.parse(fs.readFileSync(path.join(R,'protocols/breast/00322-everolimus-exemestane.json'))),E=require(path.join(R,'js/assessment-engine')),D=require(path.join(R,'js/protocol-dose-schedule')),V=require(path.join(R,'js/protocol-validator'));
require(path.join(R,'js/ctcae-descriptors'));
const CT=globalThis.SACTCheckCTCAE;
const cases=[],seen=new Set();let failed=0;
function run(name,input,expect,rx,extra){const row={name,input,source: 'NCCP00322 v4 / source-linked finding'};try{const r=E.assess(P,input),m=D.buildModificationModel(P,r),f=r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||''));assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);f.forEach(x=>seen.add(x.ruleId));if(expect)assert(f.some(x=>x.actionType===expect),`Expected ${expect}; got ${r.actionType}: ${f.map(x=>x.explanation).join(' ')}`);if(rx)assert(f.some(x=>rx.test(x.explanation)));if(extra)extra(r,m,f);row.actual=r.actionType;row.findings=f.map(x=>({id:x.ruleId,action:x.actionType,components:x.action.components,explanation:x.explanation}));row.displayed_doses=m.rows.map(x=>({dose:x.protocolDose,quantified:x.quantified}));row.pass=true;}catch(e){row.pass=false;row.error=e.message;failed++;}cases.push(row);}
function structural(name,fn){try{fn();cases.push({name,pass:true});}catch(e){failed++;cases.push({name,pass:false,error:e.message});}}
function noNumeric(r,m){assert(!m.rows.some(x=>x.quantified&&/^\s*\d/.test(x.protocolDose)),'No numeric dose during hold/review');}
run('Empty stays unassessed',{},null,null,r=>assert.equal(r.actionType,'incomplete'));
run('Hb monitoring does not clear treatment',{hb_g_dl:8},null,null,r=>assert.equal(r.actionType,'incomplete'));
for(const [field,bands]of [['anc_x10e9_l',[0,0.49,0.5,0.99,1,1.01,2]],['platelets_x10e9_l',[0,49.99,50,74.99,75,75.01,200]]])for(const v of bands){const lower=field.startsWith('anc')?.5:50,cutoff=field.startsWith('anc')?1:75;run(`${field}=${v}`,{[field]:v},v<lower?'withhold_then_reduce':v<cutoff?'withhold':'proceed_with_caution',v<lower?/5\s*mg/:null,(r,m,f)=>{assert(f.every(x=>JSON.stringify(x.action.components)==='["everolimus"]'));if(v<cutoff)noNumeric(r,m);});}
run('Severe thrombocytopenia overrides normal ANC',{anc_x10e9_l:2,platelets_x10e9_l:49},'withhold_then_reduce',/5\s*mg/,noNumeric);
run('Both moderate counts hold without auto-restart',{anc_x10e9_l:.9,platelets_x10e9_l:60},'withhold',/same dose/,noNumeric);
for(const grade of [3,4])run(`FN grade${grade}`,{febrile_neutropenia_grade:grade},grade===3?'withhold_then_reduce':'discontinue',grade===3?/1.25/:/discontinue/i,noNumeric);
run('Ungraded febrile neutropenia',{febrile_neutropenia:true},'withhold',/sepsis/,noNumeric);
for(const [c,d]of [['A',7.5],['B',5],['C',2.5]])run(`ChildPugh ${c}`,{child_pugh_class:c},c==='C'?'consultant_review':'dose_reduce',new RegExp(String(d)),(r,m)=>{if(c==='C')noNumeric(r,m);else assert(m.rows.some(x=>String(x.protocolDose).includes(String(d))));assert(!m.rows.some(x=>/exemestane/i.test(x.component||'')&&x.quantified));});
run('Hepatic impairment plus pneumonitis does not auto-restart',{child_pugh_class:'A',pneumonitis_grade:3},'withhold',/interrupt/i,noNumeric);
for(const crcl of [0,15,30,50,90])run(`Renal${crcl}`,{crcl_ml_min:crcl},'proceed_with_caution',/no routine renal/i);
run('Dialysis',{haemodialysis:true},'proceed_with_caution',/haemodialysis/);
for(const k of ['pregnancy','breastfeeding','hypersensitivity']){run(k,{[k]:true},'contraindicated',/exclusion/,noNumeric);run(k+' absent',{[k]:false},null,null,r=>assert.notEqual(r.actionType,'proceed'));}
for(const [k,vals]of [['hormone_receptor_status',['negative','unknown']],['her2_status',['positive','unknown']],['menopausal_status',['premenopausal','uncertain']],['treatment_setting',['adjuvant','neoadjuvant']],['ecog',[3,4]],['prior_nonsteroidal_ai_progression',[false]],['symptomatic_visceral_disease',[true]]])for(const v of vals)run(k+' '+v,{[k]:v},'consultant_review',null,noNumeric);
run('Correct indication alone does not imply complete clearance',{hormone_receptor_status:'positive',her2_status:'negative',menopausal_status:'postmenopausal',treatment_setting:'advanced',ecog:2,prior_nonsteroidal_ai_progression:true,symptomatic_visceral_disease:false},null,null,r=>assert.notEqual(r.actionType,'proceed'));
for(const occ of [undefined,1,2])run('Grade2 stomatitis occurrence '+occ,{stomatitis_grade:2,...(occ?{stomatitis_occurrence:occ}:{})},occ===2?'withhold_then_reduce':'withhold',occ===1?/same dose/:occ===2?/5\s*mg/:/Confirm whether/,noNumeric);
for(const g of [3,4])run('Stomatitis '+g,{stomatitis_grade:g},g===3?'withhold_then_reduce':'discontinue',null,noNumeric);
run('Pneumonitis1',{pneumonitis_grade:1},'proceed_with_caution',/Asymptomatic/);
run('Pneumonitis2 consider hold',{pneumonitis_grade:2},'consultant_review',/consider interruption/,noNumeric);
run('Pneumonitis2 failure by four weeks',{pneumonitis_grade:2,pneumonitis_not_recovered_within_4_weeks:true},'discontinue',/four weeks/,noNumeric);
run('Pneumonitis3',{pneumonitis_grade:3},'withhold',/Consider restart/,noNumeric);
run('Pneumonitis3 recurrence',{pneumonitis_grade:3,pneumonitis_occurrence:2},'withhold',/Recurrent Grade\s*3/,noNumeric);
run('Pneumonitis4',{pneumonitis_grade:4},'discontinue',/emergency/,noNumeric);
for(const g of [2,3,4])run('Metabolic grade'+g,{metabolic_toxicity_grade:g},g===2?'proceed_with_caution':g===3?'withhold_then_reduce':'discontinue',g===2?/no everolimus dose adjustment/:null,g===2?null:noNumeric);
for(const field of ['other_non_haematological_toxicity_grade','diarrhoea_grade','alt_grade','ast_grade']){
 const occurrence=field==='other_non_haematological_toxicity_grade'?'other_toxicity_occurrence':field.replace('_grade','_toxicity_occurrence'),intolerable=field==='other_non_haematological_toxicity_grade'?'other_toxicity_intolerable':field.replace('_grade','_toxicity_intolerable');
 run(field+' grade2 missing context',{[field]:2},'consultant_review',/establish tolerability/i,noNumeric);
 run(field+' first tolerable',{[field]:2,[intolerable]:false,[occurrence]:1},'proceed_with_caution',/no everolimus adjustment/i);
 run(field+' first intolerable',{[field]:2,[intolerable]:true,[occurrence]:1},'withhold',/same dose/,noNumeric);
 run(field+' recurrent grade2',{[field]:2,[intolerable]:true,[occurrence]:2},'withhold_then_reduce',/5\s*mg/,noNumeric);
 run(field+' grade3',{[field]:3},'withhold',/consider restart/i,noNumeric);
 run(field+' recurrent grade3',{[field]:3,[occurrence]:2},'withhold',/consider discontinuation/i,noNumeric);
 run(field+' grade4',{[field]:4},'discontinue',null,noNumeric);
}
for(const field of ['preexisting_lung_compromise','new_respiratory_symptoms','active_infection','strong_cyp3a4_inhibitor','moderate_cyp3a4_inhibitor','strong_cyp3a4_inducer','planned_or_recent_radiotherapy','radiation_recall_suspected','planned_surgery_or_unhealed_wound','acute_kidney_injury'])run(field,{[field]:true},'consultant_review',null,noNumeric);
run('Invasive fungal infection stops everolimus',{invasive_systemic_fungal_infection:true},'permanently_discontinue',/permanently discontinue/,noNumeric);
run('Contradictory FN boolean and zero grade still requires hold',{febrile_neutropenia:true,febrile_neutropenia_grade:0},'withhold',/sepsis/,noNumeric);
run('Recurrence of diarrhoea does not mark separate ALT toxicity recurrent',{diarrhoea_grade:2,diarrhoea_toxicity_occurrence:2,diarrhoea_toxicity_intolerable:true,alt_grade:3},'withhold_then_reduce',null,(r,m,f)=>{assert(!f.some(x=>x.ruleId==='EVE_ALT_GRADE_G3_REPEAT'));noNumeric(r,m);});
structural('Protocol validates and every input is optional',()=>{let v=V.validate(P,{strict:true});assert(v.valid,V.formatIssues(v).join(';'));assert.deepEqual(P.required_inputs,[]);assert(Object.values(P.input_definitions).every(d=>d.required===false));assert.equal(P.metadata.validation.clinical_use_authorised,false);assert.equal(P.metadata.source_document_pages,5);});
structural('Both continuous component doses and no scheduled week off',()=>{let m=D.buildModel(P);assert.equal(m.phases.length,1);assert.equal(m.phases[0].components.length,2);assert(m.phases[0].components.every(c=>c.days.includes('Continuous')));assert.equal(P.treatment_phases[0].cycle_length_days,null);});
structural('All source rules covered without legacy rules',()=>{for(const r of P.rule_engine.rules){assert(seen.has(r.id),'Uncovered '+r.id);assert(r.source.url&&r.source.page);assert(!/Legacy/.test(r.source.document));assert(r.action.components.length>0);}});

for(const key of ['stomatitis_grade','pneumonitis_grade','metabolic_toxicity_grade','other_non_haematological_toxicity_grade','diarrhoea_grade','alt_grade','ast_grade','febrile_neutropenia_grade'])structural(key+' source-specific v3 descriptors',()=>{
 const d=P.input_definitions[key],g=CT.guide(d);assert.equal(g.sourceSpecific,true);assert.match(g.version,/CTCAE v3\.0/);assert.match(g.sourceUrl,/ctcae-v3\.pdf$/);assert.equal(g.calculable,false);assert.equal(g.comparison,null);assert.deepEqual(g.related,[]);assert.equal(g.grades.length,d.options.length);for(const o of d.options)assert.equal(CT.descriptor(d,o),o.description);
});
structural('ALT grade 2 starts above 2.5 ULN under v3, not v5 3 ULN',()=>{const g=CT.guide(P.input_definitions.alt_grade);assert.match(g.grades.find(x=>x.grade===2).description,/above 2\.5/);});
structural('Numeric count inputs preserve NCCP bands without automatic v6 regrading',()=>{for(const key of ['anc_x10e9_l','platelets_x10e9_l']){const d=P.input_definitions[key],g=CT.guide(d);assert(g.sourceSpecific);assert.equal(g.calculable,false);assert.equal(CT.gradeForValue(d,.2),null);assert.match(g.guidance,/NCCP Table 1/);}});
structural('Patient suite preserves machine receptor token and continuous schedule',()=>{const c=JSON.parse(fs.readFileSync(path.join(__dirname,'everolimus-suite-config.json')));assert.deepEqual(c.receptors,['hrpos-her2neg']);assert.equal(c.cycle_days,null);assert.equal(c.agents.length,2);assert(c.monitoring_rows.every(x=>x.cells.length===5));});

structural('Renal input stays numeric without invented dosing bands',()=>{const d=P.input_definitions.crcl_ml_min;assert.equal(d.type,'number');assert.equal(d.min,0);assert.equal(d.renal_input.mode,'no_routine_adjustment_numeric');assert.equal(d.renal_input.source_url,P.metadata.source_url);assert.equal(P.rule_engine.rules.find(r=>r.id==='EVE_RENAL').when.operator,'exists');});
const out={checked_at:new Date().toISOString(),total:cases.length,passed:cases.length-failed,failed,covered_rules:seen.size,cases};fs.writeFileSync(path.join(__dirname,'everolimus-source-cases-results.json'),JSON.stringify(out,null,2)+'\n');console.log(`Everolimus source audit ${out.passed}/${out.total}, ${seen.size} rules covered`);for(const c of cases.filter(x=>!x.pass))console.error(c.name+': '+c.error);process.exitCode=failed?1:0;
