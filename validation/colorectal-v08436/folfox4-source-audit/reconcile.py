"""00692-only reconciliation from retained pre-audit JSON; never a shared generator."""
from pathlib import Path
import json, copy
O=Path(__file__).resolve().parent; R=O.parents[2]
name='00692-cetuximab-and-folfox-4-therapy.json'; file=R/'protocols/gastrointestinal'/name
d=json.loads((O/'protocol-before'/name).read_text()); defs=d['input_definitions']; rs=d['rule_engine']['rules']; rules={r['rule_id']:r for r in rs}
url=d['metadata']['source_url']; ema='https://www.ema.europa.eu/en/documents/product-information/erbitux-epar-product-information_en.pdf'
chemo=['oxaliplatin','folinic_acid','fluorouracil_bolus','fluorouracil_infusion']; fu=['fluorouracil_bolus','fluorouracil_infusion']; allc=['cetuximab']+chemo
def c(f,o,v=None):return dict(field=f,operator=o,**({} if o=='missing' else {'value':v}))
def all_(*x):return {'all':list(x)}
def any_(*x):return {'any':list(x)}
def source(page,extra=False):return dict(document='Erbitux EMA product information (supplementary)' if extra else 'NCCP 00692 v2',page=page,url=ema if extra else url,checked_date='2026-11-05')
def add(id,when,type,components,text,page,extra=False,**kw):
 r=dict(rule_id=id,when=when,action=dict(type=type,components=components,recommendation=text,**kw),explanation=text,source=source(page,extra));rs.append(r);rules[id]=r;return r
def review(id,when,components,text,page,extra=False):return add(id,when,'consultant_review',components,text,page,extra,show_in_dose_actions=True,dose_calculation='specialist_review')
def boolean(key,label):defs[key]=dict(label=label,type='boolean',required=False,input_role='decision',demo_value=False)
def text(id,s):rules[id]['action']['recommendation']=s;rules[id]['explanation']=s

# NCCP weekly cetuximab doses, with actual dose history preventing an automatic escalation.
defs['previous_cetuximab_dose_mg_m2']=dict(label='Previous actual weekly maintenance cetuximab dose (not the loading dose)',type='number',required=False,min=0,step=0.01,unit='mg/m²',input_role='decision',demo_value=250)
for occ,target in [(1,250),(2,200),(3,150)]:
 id=f'SKIN_RESTART_{occ}';r=rules[id];base=copy.deepcopy(r['when'])
 r['when']=all_(base,c('previous_cetuximab_dose_mg_m2','>=',target))
 review(id+'_DOSE_HISTORY_REVIEW',all_(base,any_(c('previous_cetuximab_dose_mg_m2','missing'),c('previous_cetuximab_dose_mg_m2','<',target))),['cetuximab'],f'The weekly source reference after severe skin episode {occ} is {target} mg/m², but the previous maintenance dose is missing or lower. Do not escalate or reload automatically; confirm the individual restart dose with oncology/pharmacy.',5)
 text(id,f'After skin recovery to grade ≤2 within the maximum two-week interruption, the weekly source reference for episode {occ} is {target} mg/m². Previous maintenance dose is documented at or above this value; confirm the individual prescription. This is not a loading dose.')
rules['SKIN_FAILED']['when']=any_(c('skin_failed_recovery','==',True),all_(c('acneiform_rash_grade','>=',3),c('skin_delay_weeks','>=',2)))
text('SKIN_FAILED','Severe skin toxicity still present at the maximum two-week interruption, or documented failure to recover: discontinue cetuximab and obtain specialist confirmation; do not automatically restart.')
rules['SKIN_FAILED']['source']=source(5);rules['SKIN_FAILED']['source']['supplementary_url']=ema
review('SKIN_RESTART_CONTEXT',all_(c('skin_occurrence','in',[1,2,3]),any_(c('acneiform_rash_grade','missing'),c('skin_delay_weeks','missing'),c('skin_delay_weeks','<=',0),c('skin_delay_weeks','>',2),c('skin_failed_recovery','missing'))),['cetuximab'],'A prior severe skin episode needs current grade, documented interruption and recovery history before dose selection. Unknown, zero or late interruption must not imply restart permission.',5)
boolean('intolerable_skin_toxicity','Skin toxicity is intolerable, irrespective of numerical grade')
add('SKIN_INTOLERABLE',c('intolerable_skin_toxicity','==',True),'withhold',['cetuximab'],'Interrupt cetuximab for intolerable skin toxicity even below grade 3; assess and manage before considering further treatment.', '4.4 (PDF page 6)',True)
boolean('severe_skin_complication','Skin necrosis, extensive infection, blistering or other severe skin complication')
add('SKIN_COMPLICATION',c('severe_skin_complication','==',True),'withhold',['cetuximab'],'Urgently assess severe skin complications, including infection, necrosis or blistering; interrupt cetuximab and manage the complication before any restart decision.','4.4 (PDF page 6)',True)

# Table 2 explicitly distinguishes recovery within four weeks from failure after four weeks.
for key in ['anc_x10e9_l','platelets_x10e9_l']:
 rules['COUNT_STOP_'+key]['when']['all'][1]['operator']='>'
 text('COUNT_STOP_'+key,'Counts remain below the source treatment threshold after four weeks: discontinue FOLFOX-4 and obtain consultant review. Cetuximab timing requires separate review.')
review('COUNT_FOUR_WEEK_BOUNDARY',all_(c('delay_weeks','==',4),any_(c('anc_x10e9_l','<',1.5),c('platelets_x10e9_l','<',75))),chemo,'At exactly four weeks with counts still low, continue the count-related hold and obtain consultant clarification. NCCP permits recovery within four weeks but says discontinue if still low after four weeks; do not calculate a restart dose at this boundary.',3)
review('COUNT_RECOVERY_CONTEXT',all_(any_(c('lowest_anc','<',1),c('lowest_platelets','<',50)),any_(c('anc_x10e9_l','missing'),c('platelets_x10e9_l','missing'),c('delay_weeks','missing'))),chemo,'Previous severe count toxicity requires current ANC and platelets plus the recovery interval before selecting the table-2 restart. Missing current counts are not recovery.',3)
for id in ['ANC_G3','ANC_G4','PLT_G3','PLT_G4']:
 text(id,rules[id]['action']['recommendation']+' Table 2 uses the lowest result during delayed weeks; the current component dose level must be documented. At the last level, a further reduction reaches discontinuation, not a repeated 50 mg/m² dose.')

# Individual eligibility/caution domains stay optional and independently actionable.
for key,label in [('adequate_marrow_reserve','Adequate haematological status confirmed'),('adequate_renal_hepatic_function','Adequate renal and liver status confirmed')]:
 boolean(key,label);defs[key]['demo_value']=True
 review('ELIGIBILITY_'+key.upper(),c(key,'==',False),allc,'NCCP eligibility is not established; consultant review must reconcile overall suitability with the component-specific organ-function table.',2)
for key,label,id,msg in [
 ('alpha_gal_reaction_risk','Red-meat allergy, tick-bite reaction or alpha-gal / cetuximab IgE risk','ANAPHYLAXIS_RISK','Review red-meat allergy, tick-bite reactions, previous antibody reactions and cetuximab IgE history before cetuximab; plan specialist precautions and monitoring.'),
 ('previous_pelvic_radiotherapy','Previous pelvic radiotherapy','PREVIOUS_PELVIC_RT_CAUTION','Previous pelvic radiotherapy is an NCCP caution; assess marrow and gastrointestinal tolerance before the next prescription.'),
 ('cardiac_caution','Recent MI or uncontrolled angina, hypertension, arrhythmia or heart failure','CARDIAC_CAUTION','Recent MI or uncontrolled cardiovascular disease requires consultant assessment; obtain baseline ECG if cardiac function is compromised and consider fluoropyrimidine cardiac risk.'),
 ('baseline_frequent_loose_stools_without_stoma','Baseline more than 3 loose bowel movements per day without a stoma','BASELINE_BOWEL_CAUTION','Baseline more than three loose bowel movements daily without a colostomy/ileostomy is a source caution. Confirm baseline, hydration and a treatment plan; do not substitute an ostomy threshold.'),
 ('symptomatic_peripheral_neuropathy','Symptomatic peripheral neuropathy requiring baseline suitability review','SYMPTOMATIC_NEUROPATHY_CAUTION','Symptomatic neuropathy is an NCCP caution. Functional impairment before the first cycle is a separate exclusion; reconcile grade and timing before selecting oxaliplatin.')]:
 boolean(key,label);review(id,c(key,'==',True),['cetuximab'] if key=='alpha_gal_reaction_risk' else chemo,msg,2)
defs['neuropathy_grade']['label']='Peripheral neuropathy grade (grade 2 assessed at start of cycle)'
boolean('oxaliplatin_neuropathy_rechallenge_requested','Oxaliplatin rechallenge after a previous grade 3 or 4 neuropathy episode is being considered')
review('NEUROPATHY_RECHALLENGE_REVIEW',c('oxaliplatin_neuropathy_rechallenge_requested','==',True),['oxaliplatin'],'Only good recovery from previous grade 3 (not grade 4) neuropathy may support consultant-led rechallenge, one level below the actual dose at onset. Current grade alone does not establish that history or authorise rechallenge.',5)
boolean('oxaliplatin_anaphylaxis','Anaphylactic reaction to oxaliplatin')
add('OX_ANAPHYLAXIS',c('oxaliplatin_anaphylaxis','==',True),'contraindicated',['oxaliplatin'],'Interrupt oxaliplatin immediately, treat anaphylaxis and contraindicate further oxaliplatin.',7)

# Severe diarrhoea is a source-specific review, not a copied mFOLFOX6 restart ladder.
text('G4_DIARRHOEA_RESTART','A previous grade-4 diarrhoea episode requires documented recovery and consultant review. Table 5 gives oxaliplatin 65 mg/m² plus any necessary fluorouracil reductions, but does not quantify the 5-FU reduction or a recovery interval. If already receiving 50 mg/m², do not escalate to 65 mg/m². No numeric restart dose is calculated.')
review('G4_DIARRHOEA_RECOVERY_CONTEXT',all_(c('diarrhoea_highest_grade','==',4),any_(c('diarrhoea_grade','missing'),c('diarrhoea_grade','>=',2),c('current_oxaliplatin_level','missing'))),chemo,'Grade-4 diarrhoea history needs the current diarrhoea grade, documented clinical recovery and actual previous oxaliplatin dose. Unknown recovery or active significant diarrhoea does not establish a restart dose.',5)
text('DIARRHOEA_REVIEW','Current clinically significant diarrhoea needs assessment and chemotherapy deferral pending review. Grade ≥2 is a conservative implementation review trigger, not a numeric FOLFOX-4 restart table in NCCP. The source gives a grade-4 oxaliplatin reference but no quantified 5-FU restart reduction.')
rules['DIARRHOEA_REVIEW']['source']['implementation_note']='Conservative review trigger; source gives close diarrhoea monitoring (page 7) and grade-4 modification (table 5), not a general grade-2 dose ladder.'
review('FEBRILE_NEUTROPENIA_REVIEW',c('febrile_neutropenia','==',True),chemo,'Febrile neutropenia needs urgent assessment and consultant review of current infection, count recovery, prior dose and future supportive care. NCCP 00692 does not provide a standalone numerical febrile-neutropenia dose ladder or mandate routine G-CSF.',6)
defs['febrile_neutropenia']['label']='Previous febrile-neutropenia episode (enter active fever/infection separately)'
text('FEBRILE_NEUTROPENIA_REVIEW','A previous febrile-neutropenia episode needs consultant review of count recovery, actual prior dose and future supportive care. Enter any active fever/infection separately for urgent assessment and the chemotherapy hold. NCCP 00692 does not provide a standalone numerical febrile-neutropenia ladder or mandate routine G-CSF.')
review('OTHER_NONHAEM_REVIEW',c('other_nonhaem_toxicity_grade','>=',2),allc,'Identify and clinically review the specific non-haematological adverse event; use its source-specific rule. The general grade alone cannot supply a regimen-wide dose reduction.', '5–8')
review('RENAL_CATEGORY_REVIEW',any_(c('severe_renal_impairment','==',True),all_(c('renal_impairment','==',True),c('crcl_ml_min','missing'))),['oxaliplatin'],'Reconcile measured/estimated creatinine clearance and dialysis status before prescribing. Do not infer a numerical dose or import another FOLFOX regimen’s renal contraindication.',4)

# Previously unencoded source drug interactions and objective suspected-HUS pattern.
boolean('concurrent_brivudin_sorivudin_or_analogue','Concurrent brivudin, sorivudin or related potent DPD inhibitor')
add('FU_DPD_INHIBITOR_CONTRAINDICATION',c('concurrent_brivudin_sorivudin_or_analogue','==',True),'contraindicated',fu.copy(),'Fluorouracil is contraindicated with brivudin, sorivudin or analogues because of potent DPD inhibition; obtain urgent medication reconciliation.',8)
boolean('fluorouracil_interaction_review_needed','Warfarin, phenytoin or another interaction requiring 5-FU review')
review('FU_INTERACTION_REVIEW',c('fluorouracil_interaction_review_needed','==',True),fu.copy(),'Review current interaction resources: fluorouracil may increase INR/prothrombin time with warfarin and phenytoin concentrations; consider other medicines affecting DPD. Confirm monitoring and the prescription.',8)
for key,label,unit in [('haematocrit_percent','Haematocrit when HUS is suspected','%'),('creatinine_umol_l','Creatinine when HUS is suspected','µmol/L')]:
 defs[key]=dict(label=label,type='number',required=False,min=0,step=0.01,unit=unit,input_role='decision',demo_value=40 if key=='haematocrit_percent' else 80)
add('HUS_LAB_PATTERN',all_(c('haematocrit_percent','<',25),c('platelets_x10e9_l','<',100),c('creatinine_umol_l','>=',135)),'withhold',['oxaliplatin'],'The NCCP suspected-HUS pattern is haematocrit <25%, platelets <100 ×10⁹/L and creatinine ≥135 µmol/L. Interrupt oxaliplatin and investigate urgently; this pattern is not a diagnosis. Confirmed HUS requires permanent discontinuation.',7)

# Bolus 5-FU omission/delay also delays/omits folinic acid (table 1 footnote).
for r in rs:
 a=r['action']
 if a['type'] in ['withhold','contraindicated','discontinue','permanently_discontinue'] and 'fluorouracil_bolus' in a.get('components',[]) and 'folinic_acid' not in a['components']:a['components'].append('folinic_acid')
 if r.get('source',{}).get('url')==url:r['source']['checked_date']='2026-11-05'
# The NCCP toxicity tables do not name an edition; do not present v5 UI descriptors as NCCP attribution.
for key,x in defs.items():
 if x.get('ctcae_version')=='5.0':
  x['ui_reference_ctcae_version']='5.0';x['ui_reference_ctcae_source_url']=x.get('ctcae_source_url');x['ctcae_version']='NCCP source grading; edition not specified';x['ctcae_source_url']=url
  x['assessment_guidance']=(x.get('assessment_guidance','')+' NCCP does not specify a CTCAE edition for this row; displayed v5 descriptors are orientation only, not an automatic source-edition conversion.').strip()
  loc='table 4 (page 5)' if key in ['acneiform_rash_grade','infusion_reaction_grade'] else 'named toxicity review (pages 5–8)' if key=='other_nonhaem_toxicity_grade' else 'table 5 (page 5)'
  x['grading_source_label']=f'NCCP 00692 v2 · {loc}; CTCAE v5 UI aid';x['grading_source_url']=url
  x['source_grading_note']='NCCP 00692 v2 does not specify the CTCAE edition for this treatment-modification row. The retained v5 descriptions are orientation only, not NCCP-authored grading definitions or an automatic source-edition conversion. Select the clinician-confirmed named toxicity grade and apply the cited source-specific modification.'
  if key=='other_nonhaem_toxicity_grade':x['source_grading_note']+=' The general grade does not define a universal NCCP dose-reduction ladder.'

d['eligibility']=['00692a: RAS wild-type metastatic colorectal cancer, validated tumour testing','ECOG 0–2','Adequate haematological, renal and liver status; reconcile component-specific advice with consultant']
d['exclusions']=['Hypersensitivity to any regimen medicine or excipient','Mutant or unknown RAS in metastatic colorectal cancer','Functional peripheral neuropathy before the first cycle','Complete DPD deficiency (fluorouracil)','Pregnancy or lactation']
d['monitoring']=['Baseline FBC, renal and liver profile; DPD testing before first fluorouracil unless already tested; ECG if compromised cardiac function.','Baseline antibody-reaction, red-meat allergy, tick-bite and cetuximab-IgE history.','FBC, renal and liver profile prior to each chemotherapy cycle; evaluate neuropathy every two cycles and reassess symptoms before treatment.','Monitor and correct electrolytes during cetuximab; monthly electrolytes, magnesium and calcium for two months after the last dose.','Disease monitoring, imaging and tumour markers according to the supervising consultant’s treatment plan; no universal interval is specified here.','NCCP allows observation/vitals to stop after two reaction-free cetuximab doses, whereas current EMA requires monitoring during and at least one hour after each infusion. Reconcile locally with oncology/pharmacy; do not automatically waive observation. Chemotherapy starts at least one hour after cetuximab per EMA.']
m=d['metadata'];m['clinical_audit_release']='0.84.36';m['sactcheck_encoding_version']='0.84.36';m['source_checked_date']='2026-11-05';m['source_binary_retrieved']=True
m['schedule_summary']='Weekly cetuximab on Days 1 and 8 (400 mg/m² first dose, then 250 mg/m²). FOLFOX-4 starts on Day 1 with oxaliplatin, source-listed folinic acid, bolus fluorouracil and a 22-hour infusion. Day 2 has a second bolus and separate 22-hour infusion, finishing around Day 3. The NCCP table lists folinic acid on Day 1 only: confirm any Day 2 folinic prescription with pharmacy. Repeat chemotherapy every 14 days while beneficial and tolerable.'
m['validation'].update(audit_release='0.84.36',audit_date='2026-11-05',software_validation_record='validation/colorectal-v08436/folfox4-source-audit/source-case-results.json',clinical_use_authorised=False,software_tests_completed=False)
m['encoding_maturity'].update(audit_release='0.84.36',audit_date='2026-11-05',reconciled_release='0.84.36',reconciled_date='2026-11-05',scope_note='Current catalogue-linked NCCP v2 binary and current EMA Erbitux information retrieved and reconciled; source ambiguities remain explicit. Independent consultant and oncology-pharmacy validation remains pending.')
m['organ_function_reconciliation'].update(release='0.84.36',checked_date='2026-11-05')
d['clinical_governance']['disclaimer']='NCCP 00692 v2 source mapping, SACTCheck v0.84.36. Independent consultant/pharmacy validation and clinical authorisation remain pending. Resolve declared source conflicts; missing inputs are unassessed.'
d['clinical_governance']['organ_function_rule_status']='NCCP 00692 v2 renal and hepatic table reconciled in v0.84.36; independent consultant/oncology-pharmacy validation pending.'
d['supportive_care']['premedication']='Antihistamine plus corticosteroid before cetuximab, including subsequent infusions: NCCP suggests chlorphenamine 10 mg IV and dexamethasone 8 mg IV 60 minutes beforehand. Confirm the local prescription and account for steroid overlap with antiemetics.'
d['supportive_care']['other_supportive_care']=['Local EGFR skin-care and antidiarrhoeal plans; assess intolerable or infected skin promptly.','Monitor electrolytes during cetuximab; monthly electrolytes, magnesium and calcium for two months after the last dose.','Confirm DPD result, line/pump care and fluorouracil cardiac warning symptoms.','Cold precautions with oxaliplatin; do not use ice chips during bolus fluorouracil in this regimen.','Routine primary G-CSF is not mandated by NCCP 00692; individual risk and previous febrile neutropenia require consultant review.']
file.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(f'00692: {len(rs)} source-linked rules; {len(defs)} optional inputs')
