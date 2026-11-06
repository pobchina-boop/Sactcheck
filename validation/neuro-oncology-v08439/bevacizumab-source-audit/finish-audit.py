"""Readable source-specific guidance and final guard refinements for the staged audit."""
import json, runpy
from pathlib import Path
O=Path(__file__).resolve().parent
runpy.run_path(str(O/'apply-audit.py'))
p=O.parents[2]/'protocols/neuro-oncology/00813-bevacizumab-5-mg-kg-monotherapy-14-day.json'
d=json.loads(p.read_text());x=d['input_definitions'];rules=d['rule_engine']['rules'];by={r['id']:r for r in rules}
# All clinical text is explicitly authored, not produced by automated word segmentation.
messages={
'INDICATION':'This regimen is for recurrent malignant glioblastoma. Confirm diagnosis, intent and the off-label consent/local governance plan; its eligibility does not extend to every glioma.',
'ECOG_GT2':'ECOG above 2 is outside NCCP 00813 routine eligibility.',
'ORGAN_ADEQUACY':'Adequate haematological, renal and hepatic function requires clinical confirmation. NCCP provides no numerical ANC or platelet starting thresholds for this monotherapy; none are inferred.',
'EXCLUSION_HYPERSENSITIVITY':'Hypersensitivity to bevacizumab, excipients, CHO cell products or recombinant human/humanised antibodies is an exclusion.',
'PREGNANCY_REVIEW':'Pregnancy is an exclusion.',
'BREASTFEEDING':'Breastfeeding is an NCCP exclusion. EMA advises no breastfeeding during treatment and for at least six months after the last dose.',
'RECENT_ICH':'Recent intracranial haemorrhage is an NCCP exclusion. The source does not define a numerical interval for recent.',
'MINIMAL_ENHANCEMENT':'No/minimal contrast enhancement or evidence of gliomatosis cerebri is an exclusion in this NCCP protocol.',
'RECENT_STROKE_MI':'Stroke or myocardial infarction less than one year ago is an NCCP exclusion.',
'UNHEALED_WOUND_OR_RECENT_SURGERY':'Do not start within 28 days of major surgery or before the wound is fully healed. Hold for wound-healing complications until healed. Passing 28 days alone does not establish eligibility.',
'SURGERY_HEALING_CONFIRMATION':'At least 28 days have elapsed, but wound healing is not documented. Confirm complete healing and the individual surgical plan before treatment.',
'PLANNED_MAJOR_SURGERY':'Withhold for elective surgery. Agree preoperative and postoperative timing with the oncology and surgical teams; these sources do not specify a fixed preoperative interval.',
'UNCONTROLLED_HYPERTENSION':'Withhold bevacizumab for uncontrolled or symptomatic hypertension on Day 1; start or adjust antihypertensive therapy.',
'HYPERTENSION_G2_G3':'Start or adjust antihypertensive therapy and consider interruption until controlled. An isolated grade 3 finding does not establish persisting grade 3 hypertension or require automatic discontinuation.',
'PERSISTENT_G3_OR_G4_HYPERTENSION':'Discontinue bevacizumab for grade 4 hypertension or persisting grade 3 hypertension. Confirm persistence explicitly; it cannot be assumed from one grade 3 entry.',
'SEVERE_UNCONTROLLED_BP':'Severe blood pressure concern requires urgent assessment and withholding. The legacy >200/110 label is not a standalone NCCP 00813 discontinuation threshold. Assess crisis, persistence and response to therapy.',
'BP_SOURCE_THRESHOLD':'NCCP defines uncontrolled blood pressure for initiation as sustained >150/100 mmHg while receiving antihypertensives, without specifying AND/OR between the two components. Review the repeated readings and confirm uncontrolled/symptomatic status; no additional automatic stop threshold is inferred.',
'BP_SINGLE_READING':'Confirm repeat blood pressure, symptoms and antihypertensive treatment. A single measurement cannot establish the source-defined sustained uncontrolled state or grade 3 persistence.',
'HTN_UNCONTROLLABLE_DESPITE_TREATMENT':'EMA: permanently discontinue for medically significant hypertension that cannot be adequately controlled with antihypertensive therapy.',
'HYPERTENSIVE_CRISIS_PRES':'Permanently discontinue for hypertensive crisis or hypertensive encephalopathy and manage urgently.',
'PROTEIN_LOW_SCREEN':'Negative/1+ dipstick or urine protein concentration <1 g/L meets the screening row only. Confirm that there is no outstanding quantitative follow-up, previous discontinuation or other treatment restriction.',
'PROTEIN_DIPSTICK_2_3':'For a new 2+/3+ dipstick or urine protein concentration ≥1 g/L, NCCP allows the scheduled dose while arranging 24-hour total protein collection within three days before the NEXT administration. Repeat dosing without the required quantification is not established by this row.',
'PROTEIN_SCREEN_LAB_ONLY':'Urine protein concentration ≥1 g/L requires 24-hour total protein collection within three days before the next dose. The screening row allows the scheduled dose, subject to other restrictions. g/L and g/24 h are different measurements.',
'PROTEIN_CONTEXT_REQUIRED':'Confirm whether this is an initial/routine screen, the next dose after an abnormal screen, or reassessment after a hold. Previous significant proteinuria requires valid quantitative follow-up; dipstick improvement alone does not establish restart.',
'PROTEIN_DIPSTICK_4':'Withhold for a 4+ dipstick at baseline or during treatment and collect 24-hour urine. If a concurrent quantitative result conflicts, confirm sequence, timing and validity before clearance.',
'PROTEIN_2_TO_4':'Hold for 24-hour total protein >2 to 4 g/24 h. Recheck every two weeks and consider resuming only when ≤2 g/24 h, provided no previous discontinuation or other restriction applies.',
'PROTEIN_OVER_4':'Discontinue for 24-hour total protein >4 g/24 h. Subsequent improvement does not automatically erase this stop decision.',
'PROTEIN_QUANTIFIED_LOW':'A valid current 24-hour result ≤2 g/24 h meets the proteinuria table threshold when no previous discontinuation is reported. Confirm any previous hold reason and all other domains; this is not overall treatment clearance.',
'PROTEIN_VALIDITY_REVIEW':'Confirm collection completeness, timing and units before treating the 24-hour result as current. A spot concentration in g/L or protein/creatinine ratio must not be entered as g/24 h.',
'PROTEIN_COLLECTION_STALE':'After a 2+/3+ screening result, the 24-hour collection should be within three days before the next administration. Recheck the timing and plan.',
'NEPHROTIC_SYNDROME':'Permanently discontinue for nephrotic syndrome (EMA source grade 4 proteinuria), regardless of a single lower urine protein result.',
'TE_FISTULA':'Permanently discontinue for a tracheoesophageal fistula at any grade.',
'ARTERIAL_THROMBOEMBOLIC_EVENT':'Permanently discontinue for a new arterial thromboembolic event during treatment. Historical vascular risk and exclusions are assessed separately.',
'GI_PERFORATION':'Permanently discontinue for gastrointestinal perforation and manage urgently.',
'NECROTISING_FASCIITIS':'Discontinue and promptly treat necrotising fasciitis.',
'PRES':'Discontinue for confirmed PRES and treat specific symptoms, including hypertension. MRI is preferred for confirmation; safety of restarting after PRES is unknown.',
'INTRACRANIAL_BLEEDING':'Discontinue for intracranial bleeding during treatment and manage urgently.',
'GRADE4_FISTULA':'Permanently discontinue for any grade 4 fistula. Tracheoesophageal fistula requires permanent stopping at any grade.',
'OTHER_FISTULA_REVIEW':'Consider discontinuation for other internal fistulae; information about continuation is limited. Assessment is required before an event reaches grade 4.',
'THROMBOEMBOLIC_G4':'Discontinue for life-threatening grade 4 venous thromboembolism, including pulmonary embolism.',
'VTE_LOWER_GRADE':'Closely monitor venous thromboembolism of grade 3 or lower and confirm the anticoagulation and continuation plan. A new arterial event requires permanent discontinuation irrespective of this grade.',
'HAEMORRHAGE_G3PLUS':'Permanently discontinue for grade 3 or 4 bleeding during therapy.',
'HAEMORRHAGE_LOWER_GRADE':'Assess bleeding site, severity and trend. Intracranial bleeding has a separate stop instruction and is not cleared by a low generic grade.',
'HAEMOPTYSIS':'EMA: patients with recent haemoptysis >2.5 mL of red blood should not be treated. Assess urgently and confirm the source-specific risk; a universal numerical stop threshold for trace blood is not inferred.',
'PRES_SUSPECTED':'New neurological or visual symptoms require urgent assessment for PRES, intracranial bleeding, seizure or other causes. Hold pending assessment; do not assume all new symptoms represent tumour progression.',
'INFUSION_REACTION':'Stop the infusion and give appropriate medical treatment for an infusion or hypersensitivity reaction. This acute infusion stop does not itself define future rechallenge.',
'PREVIOUS_PERMANENT_STOP':'A previous permanent-stop reason remains applicable even if current measurements improve. No automatic restart or dose reduction is offered.',
'PREVIOUS_DISCONTINUATION':'Retain the source-directed previous discontinuation. A current normal result does not authorise restart; reinitiation after PRES has unknown safety.',
'CARDIOVASCULAR_CAUTION':'Review cardiovascular disease and consider echocardiography after prior anthracycline or chest-wall radiotherapy. NCCP does not make echocardiography mandatory for every patient.',
'RENAL_CAUTION':'Renal disease and proteinuria increase concern. Table 1 expects no renal or dialysis dose adjustment, but this does not override eligibility or proteinuria hold/stop rules.',
'HEPATIC_CAUTION':'Table 1 expects no hepatic dose adjustment. Assess clinical adequacy and other restrictions; no generic bilirubin-based percentage reduction is supplied.',
'BLEED_CLOT_HISTORY':'Review bleeding/clotting disorders, prior venous thromboembolism and anticoagulation risks before treatment.',
'PERFORATION_RISK':'Prior pelvic radiotherapy, surgery or underlying conditions may increase fistula/perforation risk. Review before treatment.',
'RECENT_ATE_CAUTION':'Recent arterial events require specialist caution. Stroke/MI less than one year ago is a separate NCCP exclusion. Distinguish historical risk from a new event during treatment.',
'WARFARIN_MONITORING':'For warfarin, check INR weekly until a stable warfarin dose is established, then before each cycle. Anticoagulation alone is not an automatic discontinuation criterion.',
'MONITORING_MISSING':'Confirm FBC, renal/liver profile, urine protein and blood pressure. Blood pressure is required before each cycle AND after treatment; add indicated INR/cardiac assessment. MRI intervals are individualised.',
'ANEURYSM_RISK':'Review aneurysm/dissection risk, especially hypertension or aneurysm history, before VEGF-inhibitor treatment.',
'DENTAL_ONJ_RISK':'Review osteonecrosis of the jaw risk, especially prior/concurrent IV bisphosphonates. Consider dental assessment and preventive dentistry; coordinate invasive procedures.',
'INTERACTION_REVIEW':'Review the current SmPC and interactions. Bevacizumab with sunitinib has been associated with microangiopathic haemolytic anaemia. Safety and efficacy of concomitant radiotherapy are not established.',
'FERTILITY_CONTRACEPTION':'Discuss fertility and effective contraception during treatment and up to six months after bevacizumab for women of childbearing potential. Avoid breastfeeding during treatment and for at least six months after the last dose.'}
assert set(messages)==set(by),(set(by)-set(messages),set(messages)-set(by))
for k,msg in messages.items():by[k]['action']['message']=msg;by[k]['explanation']=msg
labels={'persistent_grade3_hypertension':'Persisting grade 3 hypertension confirmed clinically','bp_sustained_on_antihypertensives':'Raised blood pressure is sustained while receiving antihypertensive medication','severe_bp_uncontrolled':'Severe blood pressure concern requiring urgent assessment','nephrotic_syndrome':'Nephrotic syndrome confirmed (source grade 4 proteinuria)','suspected_pres_or_new_neurological_symptoms':'New seizure, headache, visual change or altered mental state raising an acute concern','prior_pelvic_rt_or_fistula_perforation_risk':'Prior pelvic radiotherapy, surgery or condition raising fistula/perforation risk','monitoring_missing':'Required bloods, urine, blood pressure or indicated INR/cardiac assessment missing','bisphosphonate_or_dental_risk':'IV bisphosphonate exposure or planned invasive dental procedure','prior_bevacizumab_stop_reason':'Previous bevacizumab discontinuation reason','thromboembolic_event_grade':'Venous thromboembolic event grade','arterial_thromboembolic_event':'New arterial thromboembolic event during treatment'}
for k,v in labels.items():x[k]['label']=v
x['urine_protein_g_24h']['assessment_guidance']='Total protein from a 24-hour collection, in g/24 h. A single urine concentration (g/L) or protein/creatinine ratio is a different measurement.'
x['urine_protein_concentration_g_l']['assessment_guidance']='Laboratory urine protein concentration in g/L; do not enter the total from a 24-hour collection here.'
x['assessment_stage']['input_role']='context'
x['indication_eligible']['demo_value']=True;x['organ_function_adequacy_confirmed']['demo_value']=True
options={'first_screen':'Initial/routine screen with no outstanding quantitative follow-up','next_dose':'Next dose after a previous abnormal screen requiring quantification','after_hold':'Reassessment after a proteinuria hold','none':'No previous discontinuation','protein_over4':'Previous 24-hour protein >4 g','nephrotic':'Nephrotic syndrome','persistent_g3_htn':'Persisting grade 3 hypertension','g4_htn':'Grade 4 hypertension','gi_perforation':'Gastrointestinal perforation','arterial_event':'Arterial event during treatment','te_or_g4_fistula':'Tracheoesophageal or grade 4 fistula','g3_4_bleed':'Grade 3–4 bleeding','g4_vte':'Grade 4 venous thromboembolism','pres':'PRES','necrotising_fasciitis':'Necrotising fasciitis'}
for f in ['proteinuria_assessment_context','prior_bevacizumab_stop_reason']:
 for op in x[f]['options']:op['label']=options[op['value']]
for f in ['hypertension_grade','fistula_grade','thromboembolic_event_grade','haemorrhage_grade']:
 x[f]['grading_source_label']='NCCP 00813 Table 3; EMA Avastin source grading (NCI-CTCAE v3 where specified)'
 x[f]['source_grading_note']='Confirm the named event and applicable source grade. EMA safety text cites NCI-CTCAE v3; do not automatically convert to CTCAE v5 or grade from a single measurement.'
 x[f]['assessment_guidance']=x[f]['source_grading_note'];x[f]['options'][0]['label']='No event'
# Treatment stage controls the numerical initiation threshold; toxicity rules remain independently actionable.
x['assessment_stage']['input_role']='decision'
# A confirmed sustained elevation of both components meets either reading of the source threshold.
rules.append(dict(id='BP_CONFIRMED_INITIATION_THRESHOLD',priority=10,when={'all':[{'field':'assessment_stage','operator':'==','value':'starting'},{'field':'bp_sustained_on_antihypertensives','operator':'==','value':True},{'field':'systolic_bp','operator':'>','value':150},{'field':'diastolic_bp','operator':'>','value':100}]},action=dict(type='withhold',components=['bevacizumab'],message='Before initiation, sustained blood pressure above both 150 systolic and 100 diastolic while on antihypertensives meets the NCCP uncontrolled threshold. Withhold and start or adjust treatment; confirm symptoms and the wider clinical situation.',dose_calculation='specialist_review',block_numeric_dose=True),source=by['BP_SOURCE_THRESHOLD']['source'].copy(),explanation='Both components exceed the source initiation threshold, so the AND/OR ambiguity does not change this result.'))
# NCCP says discontinue for grade 4 hypertension; retain that exact instruction in history.
by['PREVIOUS_PERMANENT_STOP']['when']['value'].remove('g4_htn');by['PREVIOUS_DISCONTINUATION']['when']['value'].append('g4_htn')
# Include every independent safety stop in subsequent-history assessment.
for value,label in [('uncontrollable_htn','Medically significant hypertension uncontrolled despite therapy'),('hypertensive_crisis','Hypertensive crisis or encephalopathy'),('g4_proteinuria','Source grade 4 proteinuria'),('intracranial_bleeding','Intracranial bleeding during treatment')]:
 x['prior_bevacizumab_stop_reason']['options'].append({'value':value,'label':label})
by['PREVIOUS_PERMANENT_STOP']['when']['value'].extend(['uncontrollable_htn','hypertensive_crisis'])
by['PREVIOUS_DISCONTINUATION']['when']['value'].extend(['g4_proteinuria','intracranial_bleeding'])
# Numeric source-defined stopping and safety concerns remain actionable even if collection validity is unknown.
# A permissive quantified finding additionally requires any supplied follow-up timing to be within three days.
c=lambda f,o,v=None:dict(field=f,operator=o,**({} if v is None else {'value':v}))
by['PROTEIN_QUANTIFIED_LOW']['when']['all'].append({'any':[c('days_from_collection_to_next_dose','missing'),c('days_from_collection_to_next_dose','<=',3)]})
# Source Table 3 also names grade 4 proteinuria; do not depend solely on a synonym being ticked.
x['grade4_proteinuria']=dict(label='Grade 4 proteinuria confirmed using the source grading system',type='boolean',required=False,demo_value=False,input_role='decision',assessment_guidance='NCCP Table 3 directs discontinuation for grade 4 proteinuria. EMA describes nephrotic syndrome as NCI-CTCAE v3 grade 4; this field is a clinician-confirmed source grade, not an inferred CTCAE v5 conversion.')
rules.append(dict(id='PROTEINURIA_GRADE4',priority=12,when=c('grade4_proteinuria','==',True),action=dict(type='discontinue',components=['bevacizumab'],message='Discontinue for clinician-confirmed source grade 4 proteinuria, regardless of the numerical value entered separately.',dose_calculation='specialist_review',block_numeric_dose=True),source=by['PROTEIN_OVER_4']['source'].copy(),explanation='NCCP Table 3 independently directs discontinuation for grade 4 proteinuria.'))
rules[-1]['source']['section']='Table 3: grade 4 proteinuria'
# Ensure source provenance names are human readable.
sections={'Table3':'Table 3','Table2':'Table 2','Table1':'Table 1','Indication;offlabelp6':'Indication; off-label consent on page 6','NCCPexclusions;EMAp6woundhealing':'NCCP exclusions; EMA page 6 wound healing','4.4Woundhealing':'4.4 Wound healing','Table3;legacyinputinterpretation':'Table 3; interpretation of the legacy input','Table3footnote':'Table 3 footnote','4.4Hypertension':'4.4 Hypertension','4.4Proteinuria':'4.4 Proteinuria','EMA4.4':'4.4 Safety precautions','4.4Fistulae':'4.4 Fistulae','4.4Venousthromboembolism':'4.4 Venous thromboembolism','4.4Haemorrhage':'4.4 Haemorrhage','4.4Pulmonaryhaemorrhage':'4.4 Pulmonary haemorrhage','4.4PRES;urgenttriage':'4.4 PRES; urgent clinical assessment','4.4Infusionreactions':'4.4 Infusion reactions','4.4;historypreservation':'4.4; previous stop instructions retained','Tables2–3andEMAsafetyhistory':'Tables 2–3 and previous EMA safety events','Cautionsandbaselinetests':'Cautions and baseline tests','Table1andp2cautions':'Table 1 and page 2 cautions','Cautionsandexclusions':'Cautions and exclusions','Baseline/regularINR':'Baseline and regular INR','Regulartests':'Regular tests','4.4Aneurysms':'4.4 Aneurysms','4.4ONJ':'4.4 Osteonecrosis of the jaw','4.5Interactions':'4.5 Interactions','Supportivecare':'Supportive care','CompletePDF':'Complete PDF','EMA4.2–4.6':'EMA sections 4.2–4.6'}
def clean_source(obj):
 if isinstance(obj,dict):
  if 'document'in obj and 'sha256'in obj:
   if obj['document'].startswith('NCCP'):obj['document']='NCCP 00813 Bevacizumab 5 mg/kg every 14 days, v2, 24 July 2024'
   obj['section']=sections.get(obj['section'],obj['section'])
  for v in obj.values():clean_source(v)
 elif isinstance(obj,list):
  for v in obj:clean_source(v)
clean_source(d)
d['metadata']['encoding_maturity']['scope_note']='Fresh NCCP 00813 v2 and EMA reviewed. Timing, persistent toxicity and previous discontinuation are assessed separately. No numeric adverse-event dose reductions are inferred. Independent clinical/pharmacy approval remains pending.'
d['treatment']['duration_text']='Continue every 14 days until progression or unacceptable toxicity.'
d['treatment']['components'][0]['note']='Dilute in 100 mL sodium chloride 0.9%. First infusion over 90 minutes; second over 60 minutes only if the first is tolerated; subsequent infusions over 30 minutes only if 60 minutes is tolerated. Flush with sodium chloride before and after; do not mix with glucose or give IV push/bolus. Rapid infusion requires a separate off-label consent and local governance process.'
d['supportive_care']['mapping_basis']='NCCP 00813 page 5: minimal emetogenic risk; no routine premedication unless previous hypersensitivity. Apply local policy and individual symptom needs.'
d['source_audit']['uncertainties']=[
'NCCP initiation blood pressure >150/100 does not specify AND/OR between components. Numerical readings trigger review; clinician-confirmed uncontrolled status is assessed separately.',
'NCCP uses recent intracranial haemorrhage without a numerical interval; no number of days is inferred.',
'Grade 2–3 hypertension prompts antihypertensive therapy and consideration of interruption. Persisting grade 3 requires explicit clinical confirmation.',
'Source event grading is not automatically converted from NCI-CTCAE v3 to CTCAE v5.',
'Previous proteinuria >4 g/24 h or another source-directed discontinuation is not erased by a subsequent normal result.',
'NCCP expects no renal/hepatic dose adjustment, while EMA notes these populations have not been studied. Eligibility, monitoring and toxicity assessment remain required.',
'Concurrent discordant dipstick and quantitative results require confirmation of timing and collection validity; a current 4+ screening result is not silently overridden.'
]
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');print('Final staged candidate:',len(x),'inputs,',len(rules),'rules')
