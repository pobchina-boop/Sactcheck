'use strict';
const fs=require('fs');const idx=require('../protocols/index.json').protocols;
const file=c=>idx.find(x=>x.path.includes('/'+c+'-')).path,read=f=>JSON.parse(fs.readFileSync(f)),save=(f,x)=>fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n');
const p=read(file('00660'));
for(const [component,label]of [['bolus','bolus'],['infusion','46-hour infusion']]){
 const field='current_fluorouracil_'+component+'_level';
 p.input_definitions[field]={label:'Current 5-FU '+label+' dose level',type:'select',required:false,input_role:'decision',always_show:true,demo_value:'',options:[{value:0,label:'Level 0 — starting dose'},{value:-1,label:'Level -1'},{value:-2,label:'Level -2'}],help_text:'Required before calculating a further reduction. Check the last administered component dose; never assume the starting level.'};
 for(const r of p.rule_engine.rules){const x=r.action?.component_changes?.['fluorouracil_'+component];if(x?.dose_level_change!==undefined){x.relative_to_current_dose_level=true;x.current_dose_level_field=field;}}
}
for(const r of p.rule_engine.rules)if(r.action?.component_changes){r.action.recommendation+=' Confirm each current component dose level. Further reduction below level -2 means discontinue; do not re-escalate a previously reduced dose.';if(r.action.message)r.action.message=r.action.recommendation;}
save(file('00660'),p);
const cap=read(file('00321')).input_definitions.hand_foot_current_grade;
for(const c of ['00427','00428','00486']){let p=read(file(c));for(const key of ['hand_foot_grade','hand_foot_worst_grade']){p.input_definitions[key]={...structuredClone(cap),...p.input_definitions[key],options:structuredClone(cap.options),ctcae_category:cap.ctcae_category,ctcae_version:cap.ctcae_version,ctcae_source_url:cap.ctcae_source_url,assessment_guidance:cap.assessment_guidance};}save(file(c),p);}
const kfile='data/regimen-knowledge-base-v08432-addendum.json',k=read(kfile);
const details={
 '00660':['NCCP source rationale','Adjuvant or advanced colorectal cancer; verify individual indication','No single comparative effect estimate is assigned to this exact 14-day schedule'],
 '00421':['NCCP chemoradiation rationale','Locally advanced rectal cancer','Continuous fluorouracil as a radiosensitiser with a separately prescribed radiation plan'],
 '00427':['NSABP C-03','1,081 patients with resected Dukes B/C colon cancer','Weekly leucovorin/5-FU versus historical MOF chemotherapy'],
 '00428':['QUASAR','3,239 patients after colorectal resection; 91% stage II','Adjuvant fluorouracil/folinic acid versus observation'],
 '00486':['NSABP C-07','Resected stage II/III colon cancer','FLOX versus weekly fluorouracil/leucovorin']
};
for(const q of k.regimen_profiles){const code=q.protocol_id.split('-')[1];if(!details[code])continue;const e=q.evidence_at_a_glance;[e.trial,e.population,e.comparison]=details[code];e.checked='2026-11-04';e.qualitative_result=e.summary;e.applicability=e.limitations.join(' ');e.endpoints=[];delete e.metrics;delete e.title;delete e.summary;
 if(code==='00427')e.endpoints=[{endpoint:'DFS',metric:'Three-year disease-free survival in the historical trial',intervention_label:'Leucovorin + 5-FU',intervention_value:73,comparator_label:'MOF',comparator_value:64,unit:'%',timepoint:'3 years',interpretation:'Improved DFS against a historical comparator; not a comparison with current doublets or observation.',analysis_status:'1993 primary report',followup:'Mean time on study 47.6 months',sources:e.sources.slice(-1),limitations:'The modified NCCP folinic-acid schedule is not identical to every historical study schedule.'}];
 if(code==='00428')e.endpoints=[{endpoint:'OS',metric:'All-cause mortality',result_text:'Relative risk of death 0.82 (95% CI 0.70–0.95; p=0.008).',interpretation:'Modest population-level benefit; not an individual survival prediction.',analysis_status:'2007 primary report',followup:'Median follow-up 5.5 years',sources:e.sources.slice(-1),limitations:'Included weekly and five-day schedules. The often-quoted 3.6 percentage-point survival estimate assumes 20% five-year mortality without treatment; it is not a universal observed benefit.'}];
 if(code==='00486'){
 const first=e.sources.slice(-1);const update={label:'NSABP C-07 updated survival report',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3188282/'};if(!e.sources.some(x=>x.url===update.url))e.sources.push(update);
 e.endpoints=[{endpoint:'DFS',metric:'Three-year disease-free survival',intervention_label:'FLOX',intervention_value:76.1,comparator_label:'FULV',comparator_value:71.8,unit:'%',timepoint:'3 years',hr:'0.80',ci:'0.69–0.93',interpretation:'FLOX improved DFS; DFS is not overall survival.',analysis_status:'2007 primary report',followup:'Median follow-up 42.5 months',sources:first},{endpoint:'OS',metric:'Updated overall survival',result_text:'HR 0.88 (95% CI 0.75–1.02; p=0.08).',interpretation:'Overall survival improvement was not statistically established in the whole trial population.',analysis_status:'2011 updated analysis',followup:'Median follow-up 8 years',sources:[update],limitations:'Age subgroup analyses were unplanned; do not use them as an automatic patient-level treatment rule.'}];e.harms='Primary report: grade 3 neurosensory toxicity 8.2% with FLOX versus 0.7% with FULV; diarrhoea with bowel-wall thickening requiring hospitalisation 5.5% versus 3.0%.';
 }
}
save(kfile,k);
console.log('Dose history and evidence display reconciled.');
