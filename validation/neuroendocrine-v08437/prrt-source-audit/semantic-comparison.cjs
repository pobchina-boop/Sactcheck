'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine'));
const file='00642-lutetium-177-oxodotreotide-lutathera-therapy.json',old=JSON.parse(fs.readFileSync(path.join(__dirname,'protocol-before',file))),current=JSON.parse(fs.readFileSync(path.join(root,'protocols/gastrointestinal',file)));
const specs=[
 ['Exact CrCl below30',{crcl_ml_min:29.99},'contraindicated','NCCPp4'],
 ['Legacy CrCl30–39 is not a formal contraindication',{prrt_assessment_stage:'baseline',lutathera_renal_band:'30_39'},'consultant_review','NCCPp4'],
 ['CrCl30–39 at baseline',{prrt_assessment_stage:'baseline',crcl_ml_min:35},'consultant_review','NCCPp4'],
 ['CrCl30–39 during treatment',{prrt_assessment_stage:'on_treatment',crcl_ml_min:35},'withhold','NCCPp5'],
 ['Creatinine rises40% despite CrCl80',{prrt_assessment_stage:'on_treatment',baseline_creatinine_umol_l:100,creatinine_umol_l:140,crcl_ml_min:80},'withhold','NCCPp5'],
 ['CrCl falls40% but remains60',{prrt_assessment_stage:'on_treatment',baseline_crcl_ml_min:100,crcl_ml_min:60},'withhold','NCCPp5'],
 ['Platelets50',{platelets_x10e9_l:50},'withhold','NCCPp3'],
 ['Platelets exactly75 source disagreement',{platelets_x10e9_l:75},'consultant_review','NCCPp3/EMAp4'],
 ['ANC0.8',{anc_x10e9_l:.8},'withhold','NCCPpp3–4'],
 ['Hb7.9 retained hold',{haemoglobin_g_dl:7.9},'withhold','NCCPp4'],
 ['Baseline bilirubin3.1',{prrt_assessment_stage:'baseline',bilirubin_ratio_uln:3.1},'consultant_review','NCCPpp4–5'],
 ['On-treatment bilirubin3.1',{prrt_assessment_stage:'on_treatment',bilirubin_ratio_uln:3.1},'withhold','NCCPp5'],
 ['Albumin29 AND INR1.6',{prrt_assessment_stage:'on_treatment',albumin_g_l:29,inr:1.6},'withhold','NCCPp5'],
 ['Recurrent renal toxicity despite recovery',{renal_toxicity_episode_count:2,renal_toxicity_recovery:'recovered',crcl_ml_min:80},'permanently_discontinue','NCCPp5'],
 ['Recurrent platelet event despite current count150',{platelet_toxicity_episode_count:2,platelet_toxicity_recovery:'recovered',platelets_x10e9_l:150},'permanently_discontinue','NCCPp3'],
 ['Toxicity interval beyond16weeks',{anaemia_toxicity_episode_count:1,weeks_since_last_prrt:16.01},'permanently_discontinue','EMAp4'],
 ['Exactly16weeks conflict',{anaemia_toxicity_episode_count:1,weeks_since_last_prrt:16},'consultant_review','NCCPp4/EMAp4'],
 ['Long-acting SSA29days',{days_since_long_acting_ssa:29},'withhold','NCCPp6'],
 ['Short-acting SSA23hours',{hours_since_short_acting_ssa:23},'withhold','NCCPp6'],
 ['Amino-acid protection not confirmed',{amino_acid_protection_confirmed:false},'withhold','NCCPp6'],
 ['Potassium not checked/corrected',{potassium_checked_and_corrected:false},'withhold','EMAp11'],
 ['Major surgery11weeks',{recent_major_surgery:true,weeks_since_major_surgery:11},'withhold','EMAp5'],
 ['Legacy severe hepatic category retained',{lutathera_hepatic_band:'severe'},'consultant_review','NCCPp4'],
 ['Legacy contraindicated renal category retained',{lutathera_renal_band:'lt30'},'contraindicated','NCCPp4']
];
const cases=specs.map(([name,input,expected,source])=>{const b=E.assess(old,input),a=E.assess(current,input);return {name,input,source,expected,previous_action:b.actionType,current_action:a.actionType,before_matches:b.actionType===expected,after_matches:a.actionType===expected}});
const out={kind:'Action-level comparison independent of rule identifiers',total:cases.length,before_matching:cases.filter(x=>x.before_matches).length,after_matching:cases.filter(x=>x.after_matches).length,cases};fs.writeFileSync(path.join(__dirname,'semantic-action-comparison.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({total:out.total,before_matching:out.before_matching,after_matching:out.after_matching}));assert(cases.every(x=>x.after_matches));
