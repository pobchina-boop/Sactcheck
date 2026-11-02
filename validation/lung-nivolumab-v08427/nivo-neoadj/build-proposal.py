import json,copy,pathlib,hashlib
R=pathlib.Path(__file__).parent; root=R.parents[2]; read=lambda p:json.loads(pathlib.Path(p).read_text()); dump=lambda p,x:pathlib.Path(p).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
name='00849-nivolumab-360-mg-and-platinum-based-chemotherapy.json';P=read(root/'protocols/lung'/name);dump(R/'baseline-protocol.json',P)
U=P['metadata']['source_url'];S='https://www.ema.europa.eu/en/documents/product-information/opdivo-epar-product-information_en.pdf'; DATE='2026-10-29'
B={'00304':('paclitaxel','carboplatin',200,6,'8','https://healthservice.hse.ie/documents/6924/304_V8_CARBOplatinAUC_6_PACLitaxel_200.pdf',4),'00310':('gemcitabine','carboplatin',1000,5,'8','https://healthservice.hse.ie/documents/6713/310_GemCARBOAUC_5.pdf',4),'00281':('gemcitabine','cisplatin',1250,75,'7','https://healthservice.hse.ie/documents/6926/281_V7_GemCis75.pdf',3),'00318':('pemetrexed','carboplatin',500,5,'6','https://healthservice.hse.ie/documents/6921/318_V6_PEMEtrexed_and_CARBOplatin.pdf',4),'00317':('pemetrexed','cisplatin',500,75,'7','https://healthservice.hse.ie/documents/6922/317_V7_PEMEtrexed_and_CISplatin.pdf',3)}
sha=lambda f:hashlib.sha256((R/'research'/f).read_bytes()).hexdigest()
m=P['metadata'];m.update(review_date='2025-08-11',source_checked_date=DATE,source_document_pages=13,sactcheck_encoding_version='0.84.27',full_suite_release='0.84.27',source_pdf_sha256=sha('nccp.pdf'),source_text_snapshot_sha256=sha('nccp.txt'),source_title_exact='Nivolumab 360mg and Chemotherapy',drugs=['nivolumab','selected platinum chemotherapy backbone'],treatment_phase_selection_note='Five mutually exclusive chemotherapy backbones; select ONE. These are not sequential phases. Surgery/follow-up is not an adjuvant nivolumab phase.')
m['encoding_maturity'].update(level='source_reconciled_pending_independent_review',label='Source audited; independent clinical/pharmacy review pending',source_reconciled=True,audit_release='0.84.27',audit_date=DATE,scope_note='Nivolumab NCCP00849v2 and all five named companion regimens audited separately. No perioperative indication imported.')
for o in [m['validation'],m['encoding_maturity']]:
 for k in ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised']:o[k]=False
P['required_inputs']=[];D=P['input_definitions'];rules=[]
def c(f,op='==',v=None):return dict(field=f,operator=('>=' if op=='present' else op),**({} if op=='missing' else {'value':0 if op=='present' else v}))
def allc(*v):return {'all':list(v)}
def anyc(*v):return {'any':list(v)}
def phase(k):return c('treatment_phase','==','backbone_'+k)
def inp(f,label,typ='boolean',opts=None,unit=None):
 d={'label':label,'type':typ,'required':False,'demo_value':'','input_role':'decision'}
 if typ=='number':d.update(min=0,step=.01)
 if opts is not None:d['options']=[{'value':x,'label':str(y)} for x,y in opts]
 if unit:d['unit']=unit
 D[f]=d

def grade(f,label,immune=True):
 inp(f,label,'select',[(g,'Grade '+str(g)) for g in range(5)])
 D[f].update(grading_source_label='NCCP00849 Table6 CTCAE v4.0' if immune else 'Companion NCCP adverse-event table; edition unspecified',grading_source_url=U,source_grading_note='Select the exact clinician-assessed named event grade; this treatment-action table is not a complete grading table.',assessment_guidance='Confirm the exact event, severity, clinical findings and attribution; do not diagnose an immune event from an isolated test.')
 for o in D[f]['options']:o['description']='No event.' if o['value']==0 else f"Clinician-assessed Grade {o['value']} of the named event using the source grading framework; assess symptoms, investigations and functional impact."
def rule(id,w,typ,msg,components=['nivolumab'],page=8,code=None):
 src={'document':'NCCP '+(code or '00849')+' v'+(B[code][4] if code else '2'),'url':B[code][5] if code else U,'page':page,'checked_date':DATE}
 rules.append({'id':id,'priority':10 if typ in ['contraindicated','permanently_discontinue','discontinue','omit'] else 8,'when':w,'action':{'type':typ,'components':components,'message':msg,'recommendation':msg,'dose_calculation':'specialist_review','show_in_dose_actions':True},'explanation':msg,'source':src})
for f,d in D.items():
 d['required']=False;d['demo_value']=''
 if f.endswith('_grade'):
  for k in ['ctcae_version','ctcae_source_url']:d.pop(k,None)
  d.update(grading_source_label='NCCP00849 Table6 CTCAE v4.0',grading_source_url=U,source_grading_note='NCCP00849 explicitly cites CTCAE v4.0; assess the named event, not a generic grade.')
inp('treatment_phase','Select ONE prescribed backbone or surgery/follow-up','select',[("backbone_"+k,'Nivolumab + '+a+' + '+b+' (NCCP '+k+')') for k,(a,b,*_) in B.items()]+[('surgery_followup','Surgery / follow-up: no treatment under this regimen')])
for f,l in [('adult_patient','Adult aged 18 or older'),('neoadjuvant_eligibility_confirmed','Resectable high-risk stage II–IIIA (AJCC7), PD-L1 ≥1%, source histology wording and MDT neoadjuvant plan confirmed'),('egfr_or_alk_positive','Known EGFR mutation or ALK translocation'),('significant_autoimmune_disease','Clinically significant autoimmune disease'),('symptomatic_ild','Symptomatic interstitial lung disease'),('immunosuppression_condition','Medical condition requiring immunosuppressive systemic steroids >10 mg prednisolone-equivalent/day or other immunosuppression (not inhaled/topical or short prophylaxis)'),('prior_pd1_pdl1','Prior anti-PD-1/PD-L1 treatment'),('nivolumab_dose_reduction_planned','Nivolumab dose reduction or escalation proposed'),('febrile_neutropenia','Prior/current febrile neutropenia'),('platelet_bleeding','Bleeding with low platelets'),('haemodialysis','Haemodialysis'),('immune_event_steroid_nonresponse','Named immune pneumonitis/colitis/hepatitis/nephritis worsens or fails to improve despite corticosteroids'),('recurrent_grade3_immune','Recurrent Grade 3 immune event'),('persistent_grade2_3_immune','Persistent Grade 2/3 immune event despite treatment modification'),('cannot_taper_pred_to10','Unable to reduce therapeutic steroid to 10 mg/day prednisone equivalent'),('symptomatic_endocrine','Endocrine event is symptomatic'),('scar_confirmed','Confirmed SJS/TEN'),('scar_suspected','Suspected SJS/TEN'),('restart_requested','Restart after immune event requested'),('restart_resolved_and_steroid_complete','Event resolved/improved to source criteria and steroid management complete; specialist restart authorised')]:inp(f,l)
inp('cycle_number','Planned neoadjuvant cycle number','number');inp('treatment_day','Assessment treatment day','select',[(1,'Day 1'),(8,'Day 8 (gemcitabine only)')]);inp('bilirubin_micromol_l','Total bilirubin','number',unit='micromol/L')
inp('gfr_ml_min','Verified GFR for carboplatin Calvert dose','number',unit='mL/min');D['gfr_ml_min']['renal_input']={'mode':'exact_continuous','exact_value_required':True,'source_url':B['00304'][5],'reason':'Calvert uses the continuous verified GFR, capped at125.'}
inp('crcl_ml_min','Verified CrCl for companion source dose thresholds','number',unit='mL/min');D['crcl_ml_min']['renal_input']={'mode':'source_threshold_numeric','exact_value_required':False,'source_url':B['00317'][5],'reason':'Source-specific threshold rows; retain explicit fractional boundary gaps.'}
for f,l in [('immune_hepatitis_grade','Confirmed immune hepatitis grade'),('immune_nephritis_grade','Confirmed immune nephritis/renal dysfunction grade'),('thyroid_hypophysitis_grade','Immune thyroid disorder / hypophysitis grade'),('adrenal_insufficiency_grade','Immune adrenal insufficiency grade'),('diabetes_grade','Immune diabetes grade'),('myocarditis_grade','Immune myocarditis grade'),('other_immune_toxicity_grade','Other confirmed immune toxicity grade')]:grade(f,l)
for f,l in [('neuropathy_grade','Chemotherapy-related neuropathy grade'),('mucositis_grade','Chemotherapy mucositis grade')]:grade(f,l,False)
inp('infusion_reaction_culprit','Infusion reaction attributed medicine','select',[(x,x) for x in ['nivolumab','chemotherapy','unknown']])
for f,l in [('immune_hepatitis_attribution','Liver abnormality attribution'),('immune_nephritis_attribution','Creatinine abnormality attribution')]:inp(f,l,'select',[(x,x) for x in ['confirmed_immune','other_or_baseline','uncertain']])
for f in ['adult_patient','neoadjuvant_eligibility_confirmed']:rule(f.upper(),c(f,'==',False),'consultant_review','Source eligibility is not confirmed. Review adult, resectable stage II–IIIA AJCC7, ECOG0–1, PD-L1≥1%, EGFR/ALK and histology/MDT context.',page=6)
rule('ECOG',c('ecog','>',1),'consultant_review','ECOG0–1 is the NCCP00849 eligibility range.',page=6)
for f in ['hypersensitivity','pregnancy','breastfeeding','egfr_or_alk_positive']:rule(f.upper(),c(f,'==',True),'contraindicated','NCCP00849 exclusion present: '+f.replace('_',' ')+'. Review before treatment.',page=6)
for f in ['significant_autoimmune_disease','symptomatic_ild','immunosuppression_condition','prior_pd1_pdl1']:rule(f.upper(),c(f,'==',True),'consultant_review','Review source caution/prior-immunotherapy guidance: '+f.replace('_',' ')+'.',page=6)
rule('INFECTION',c('febrile_or_active_infection','==',True),'withhold','Urgent assessment of fever/infection; treat suspected sepsis promptly and review all components.',page=6)
rule('CYCLE_LIMIT',c('cycle_number','>',3),'withhold','Maximum THREE neoadjuvant 21-day cycles. Reassess with surgical MDT; no adjuvant nivolumab continuation is authorised by NCCP00849.',page=1)
rule('SURGERY_NO_AUTOMATIC_TREATMENT',c('treatment_phase','==','surgery_followup'),'consultant_review','No scheduled SACT under00849 during surgery/follow-up. Reassess fitness, imaging and surgical timing individually. Monitor delayed immune events at least five months; do not import perioperative adjuvant nivolumab.',page=1)
rule('NIVO_NO_REDUCTION',c('nivolumab_dose_reduction_planned','==',True),'consultant_review','No nivolumab dose reduction or escalation. Use event-specific withholding or permanent discontinuation.',page=7)
for f,lo,hi,stop in [('pneumonitis_grade',2,2,3),('diarrhoea_colitis_grade',2,3,4),('rash_grade',3,3,4),('immune_hepatitis_grade',2,2,3),('immune_nephritis_grade',2,3,4),('myocarditis_grade',2,2,3),('adrenal_insufficiency_grade',2,2,3),('diabetes_grade',3,3,4)]:
 rule(f.upper()+'_HOLD',allc(c(f,'>=',lo),c(f,'<=',hi)),'withhold','Withhold nivolumab. Apply named-event investigation, management and source recovery/steroid-completion criteria before specialist restart. Grade-based action assumes confirmed immune attribution.')
 rule(f.upper()+'_STOP',c(f,'>=',stop),'permanently_discontinue','Permanently discontinue nivolumab for this confirmed immune event severity; urgent specialist management.')
rule('THYROID_SYMPTOMATIC',allc(c('thyroid_hypophysitis_grade','>=',2),c('thyroid_hypophysitis_grade','<=',3),c('symptomatic_endocrine','==',True)),'withhold','Withhold until symptoms resolve and indicated steroid management is complete. Asymptomatic patients on appropriate replacement may continue after review.')
rule('THYROID_SYMPTOMS_MISSING',allc(c('thyroid_hypophysitis_grade','>=',2),c('thyroid_hypophysitis_grade','<=',3),c('symptomatic_endocrine','missing')),'consultant_review','Confirm symptoms and replacement status; grade alone does not establish the source symptomatic endocrine hold condition.')
rule('THYROID_G4',c('thyroid_hypophysitis_grade','==',4),'permanently_discontinue','Grade4 immune thyroid/hypophysitis: permanently discontinue nivolumab.')
rule('OTHER_IMMUNE_G3',c('other_immune_toxicity_grade','==',3),'withhold','First Grade3 other immune event: withhold nivolumab and manage by named event.',page=9)
rule('OTHER_IMMUNE_STOP',anyc(c('other_immune_toxicity_grade','==',4),*[c(f,'==',True) for f in ['recurrent_grade3_immune','persistent_grade2_3_immune','cannot_taper_pred_to10','immune_event_steroid_nonresponse']]),'permanently_discontinue','Permanent nivolumab discontinuation under NCCP Tables6/7. Recurrent Grade3, Grade4, persistent Grade2/3 despite modification, inability to taper prednisone to10mg/day, or specified steroid nonresponse requires specialist management.',page='9–11')
rule('SCAR_SUSPECTED',c('scar_suspected','==',True),'withhold','Suspected SJS/TEN: stop nivolumab and urgent specialist assessment.',page=11);rule('SCAR_CONFIRMED',c('scar_confirmed','==',True),'permanently_discontinue','Confirmed SJS/TEN: permanently discontinue nivolumab.',page=11)
for f,threshold,attr in [('alt_ast_uln_multiple',3,'immune_hepatitis_attribution'),('bilirubin_uln_multiple',1.5,'immune_hepatitis_attribution'),('creatinine_ratio_baseline_or_uln',1.5,'immune_nephritis_attribution')]:
 rule('LAB_CONTEXT_'+f,allc(c(f,'>',threshold),anyc(c(attr,'missing'),c(attr,'==','uncertain'),c(attr,'==','confirmed_immune'))),'consultant_review','Abnormal laboratory value requires assessment of cause, baseline and the named CTCAEv4 event grade. Ratio alone does not prove immune injury or mandate permanent discontinuation. Enter confirmed immune grade separately; baseline/chemotherapy rules remain independently assessed.',page='8–12')
for lo,hi,typ in [(1,2,'consultant_review'),(3,4,'permanently_discontinue')]:rule('INFUSION_'+str(lo),allc(c('infusion_reaction_grade','>=',lo),c('infusion_reaction_grade','<=',hi),c('infusion_reaction_culprit','==','nivolumab')),typ,'Nivolumab reaction: '+('close monitoring and premedication per local policy for mild/moderate reactions.' if lo==1 else 'severe/life-threatening reaction: discontinue nivolumab and manage urgently.'),page=11)
rule('INFUSION_CULPRIT_MISSING',allc(c('infusion_reaction_grade','>=',1),anyc(c('infusion_reaction_culprit','missing'),c('infusion_reaction_culprit','==','unknown'))),'withhold','Manage reaction immediately; identify culprit and apply component-specific restart/discontinuation advice. Do not assign permanent nivolumab discontinuation to an unrelated chemotherapy reaction.',page=11)
rule('RESTART_REVIEW',allc(c('restart_requested','==',True),anyc(c('restart_resolved_and_steroid_complete','missing'),c('restart_resolved_and_steroid_complete','==',False))),'withhold','Do not restart nivolumab until source event-specific recovery and corticosteroid management criteria are met and specialist review completed. Taper steroids at least one month after improvement; do not resume while receiving immunosuppressive doses.',page=7)
# Complete previously source-audited pemetrexed companion rules, freshly checked against current PDFs.
for k,fn in [('00317','00317-pemetrexed-cisplatin.json'),('00318','00318-pemetrexed-and-carboplatin-therapy.json')]:
 q=read(root/'protocols/lung'/fn)
 rename={'anc':'anc_x10e9_l','platelets':'platelets_x10e9_l'}
 def remap(o):
  if isinstance(o,dict):return {key:(rename.get(v,v) if key=='field' else remap(v)) for key,v in o.items()}
  if isinstance(o,list):return [remap(v) for v in o]
  return o
 for f,d in q['input_definitions'].items():
  f=rename.get(f,f)
  if f not in D and f not in ['indication_id','nivolumab_plan_assessed_separately']:D[f]=copy.deepcopy(d)
 for rr in q['rule_engine']['rules']:
  id=rr.get('rule_id',rr.get('id'))
  if id in ['ECOG_OUTSIDE_USUAL_RANGE','NSCLC_HISTOLOGY_SCOPE','NIVOLUMAB_SEPARATE_PLAN','NEOADJUVANT_THREE_CYCLES','PLATINUM_COURSE_REVIEW']:continue
  rr=remap(copy.deepcopy(rr));rr.pop('rule_id',None);rr['id']=k+'_'+id;rr['when']=allc(phase(k),rr['when']);rr['source']['checked_date']=DATE;rr['action']['show_in_dose_actions']=True;rules.append(rr)
# Non-pemetrexed companions: distinct source rows.
for k in ['00304','00310','00281']:
 a,b,_,_,_,url,pg=B[k];com=[a,b]
 def rr(id,w,t,msg,comp=None,page=pg):rule(k+'_'+id,allc(phase(k),w),t,msg,comp or com,page,k)
 if k=='00304':
  rr('LOW_COUNTS',anyc(allc(c('anc_x10e9_l','>=',.5),c('anc_x10e9_l','<',1)),allc(c('platelets_x10e9_l','>=',50),c('platelets_x10e9_l','<',100))),'delay','Delay chemotherapy until count recovery.')
  rr('SEVERE_COUNTS_FN',anyc(c('anc_x10e9_l','<',.5),c('platelets_x10e9_l','<',50),c('febrile_neutropenia','==',True)),'delay','Delay until recovery; CONSIDER reducing paclitaxel and carboplatin by25% in subsequent cycles. This is a consultant choice, not automatic multiplication.')
  rr('HEPATIC_CONTRA',anyc(c('alt_ast_uln_multiple','>=',10),c('bilirubin_uln_multiple','>',5)),'contraindicated','Paclitaxel contraindicated at transaminases≥10×ULN and/or bilirubin>5×ULN.',['paclitaxel'])
  for lo,hi,pct in [(1.26,2,75),(2.01,5,50)]:rr('HEPATIC_'+str(pct),allc(c('alt_ast_uln_multiple','<',10),c('bilirubin_uln_multiple','>=',lo),c('bilirubin_uln_multiple','<=',hi)),'dose_reduce',f'Paclitaxel {pct}% of ORIGINAL dose. Reconcile concurrent restrictions; do not stack reductions.',['paclitaxel'])
  rr('HEPATIC_CONTEXT',allc(c('bilirubin_uln_multiple','>',1.25),c('bilirubin_uln_multiple','<=',5),c('alt_ast_uln_multiple','missing')),'consultant_review','Paclitaxel hepatic row requires transaminases as well as bilirubin.',['paclitaxel'])
  rr('HEPATIC_FRACTIONAL_GAP',anyc(allc(c('bilirubin_uln_multiple','>',1.25),c('bilirubin_uln_multiple','<',1.26)),allc(c('bilirubin_uln_multiple','>',2),c('bilirubin_uln_multiple','<',2.01))),'consultant_review','Printed bilirubin ranges leave this fractional value unassigned. Do not round into a dose row.',['paclitaxel'])
  rr('NEUROPATHY_G2',c('neuropathy_grade','==',2),'consultant_review','Reduce paclitaxel by25%; if persistent reduce by50%. Establish persistence/prior dose before choosing.',['paclitaxel'],5)
  rr('NEUROPATHY_G3',c('neuropathy_grade','>=',3),'omit','Omit paclitaxel.',['paclitaxel'],5)
  rr('MUCOSITIS',c('mucositis_grade','>=',2),'withhold','Delay until Grade≤1. Grade2 occurrences1/2/3/4: no reduction/25%/50%/omit both; Grade≥3 occurrence1:50% reduction; occurrence2:omit. Confirm recurrence and prior dose; no automatic percentage.',page=5)
 else:
  rr('DAY_REQUIRED',allc(anyc(c('anc_x10e9_l','present'),c('platelets_x10e9_l','present')),c('treatment_day','missing')),'consultant_review','Gemcitabine count rules differ on Day1 and Day8. Select treatment day before applying a chemotherapy dose.')
  rr('DAY1_COUNTS',allc(c('treatment_day','==',1),anyc(c('anc_x10e9_l','<=',1),c('platelets_x10e9_l','<=',100))),'delay','Day1 requires ANC>1 and platelets>100. Equality does not meet the printed threshold.')
  rr('DAY8_OMIT',allc(c('treatment_day','==',8),anyc(c('anc_x10e9_l','<',.5),c('platelets_x10e9_l','<',50))),'omit','Omit Day8 gemcitabine. Source requires ANC>0.5 and platelets>50 before restarting.',['gemcitabine'])
  rr('DAY8_75',allc(c('treatment_day','==',8),anyc(allc(c('anc_x10e9_l','>=',.5),c('anc_x10e9_l','<=',1)),allc(c('platelets_x10e9_l','>=',50),c('platelets_x10e9_l','<=',100)))),'dose_reduce','Gemcitabine75% of cycle initiation dose. Any concurrent omit condition takes priority.',['gemcitabine'])
  for f,l in [('prolonged_severe_neutropenia','ANC<0.5 for>5days or<0.1 for>3days'),('cycle_delay_over_week','Cycle delayed>1week for toxicity')]:
   if f not in D:inp(f,l)
  rr('SUBSEQUENT75',anyc(c('prolonged_severe_neutropenia','==',True),c('febrile_neutropenia','==',True),c('platelets_x10e9_l','<',25),c('cycle_delay_over_week','==',True)),'consultant_review','Subsequent gemcitabine cycles75% of ORIGINAL cycle initiation dose. Confirm recovery and timing; do not automatically resume a currently omitted dose.',['gemcitabine'])
  rr('GEM_HEPATIC',c('bilirubin_micromol_l','>=',27),'consultant_review',('Gemcitabine: either80% ORIGINAL dose with escalation if tolerated OR full dose with active monitoring; consultant must select.' if k=='00310' else 'Gemcitabine800mg/m², increase to full dose if tolerated. Reconcile other dose constraints and prior reductions; not an automatic reset.'),['gemcitabine'])
  if k=='00281':
   rr('GEM_RENAL',c('crcl_ml_min','<',30),'consultant_review','Consider gemcitabine dose reduction; clinical decision. This source differs from00310v8.',['gemcitabine'])
   rr('GEM_RENAL_GAP',c('crcl_ml_min','==',30),'consultant_review','Gemcitabine source lists >30 and<30; exact30 is unassigned.',['gemcitabine'])
   rr('CIS_RENAL75',allc(c('crcl_ml_min','>=',45),c('crcl_ml_min','<=',59)),'consultant_review','Cisplatin75% under dose table, but source eligibility excludes CrCl<60. Resolve eligibility/treatment context before a prescription.',['cisplatin'])
   rr('CIS_RENAL_LOW',c('crcl_ml_min','<',45),'consultant_review','Consider carboplatin as clinical decision; do not silently substitute the backbone. Source baseline excludes cisplatin CrCl<60.',['cisplatin'])
   rr('CIS_RENAL_GAP',allc(c('crcl_ml_min','>',59),c('crcl_ml_min','<=',60)),'consultant_review','Cisplatin printed ranges45–59 and>60 leave >59 to60 unassigned; exact60 not in full-dose row.',['cisplatin'])
   rr('CIS_NEURO',c('neuropathy_grade','>=',2),'withhold','After recovery to Grade≤1, consultant chooses carboplatinAUC5 substitution OR cisplatin50% reduction; gemcitabine100%. No automatic backbone switch.',['cisplatin'])
  if 'gemcitabine_pneumonitis_suspected' not in D:inp('gemcitabine_pneumonitis_suspected','Gemcitabine-induced pneumonitis suspected')
  rr('GEM_PNEUMONITIS',c('gemcitabine_pneumonitis_suspected','==',True),'discontinue','Discontinue gemcitabine for suspected drug-induced pneumonitis; investigate immune, infection and other causes separately.',['gemcitabine'])
  rr('OTHER_NONHAEM',c('other_nonhaem_toxicity_grade','>=',3),'withhold','Withhold chemotherapy for Grade≥3 non-haematological toxicity excluding nausea/vomiting; recover toGrade≤1 and consultant decides reduction.')
 if b=='carboplatin':
  rr('CARBO_GFR20',c('gfr_ml_min','<=',20),'contraindicated','Do not administer carboplatin at GFR≤20mL/min.',['carboplatin'])
  rr('CARBO_GFR30',allc(c('gfr_ml_min','>',20),c('gfr_ml_min','<=',30)),'consultant_review','Carboplatin requires extreme caution at GFR>20 to≤30.',['carboplatin'])
  rr('CARBO_CAP',c('gfr_ml_min','>',125),'consultant_review','Cap GFR used in Calvert at125mL/min; verify renal method before dosing.',['carboplatin'])
# Missing backbone cannot imply normal chemotherapy clearance.
rule('BACKBONE_MISSING',allc(c('treatment_phase','missing'),anyc(*[c(f,'present') for f in ['anc_x10e9_l','platelets_x10e9_l','gfr_ml_min','crcl_ml_min','bilirubin_micromol_l','neuropathy_grade','mucositis_grade','other_nonhaem_toxicity_grade']])),'consultant_review','Choose one prescribed chemotherapy backbone. Companion count/organ/toxicity thresholds differ; no default chemotherapy dose can be selected.',[],page=1)
P['rule_engine']['rules']=rules;P['rule_engine']['missing_data_policy']='report_unassessed_coverage_gap'
for f,d in D.items():d['required']=False;d['demo_value']=''
P['treatment'].update(schedule_summary='Nivolumab360mg IV Day1 plus ONE listed chemotherapy backbone every21days, maximum3 neoadjuvant cycles; then surgical MDT reassessment. No adjuvant continuation in00849.',drugs=['nivolumab','one selected chemotherapy backbone'])
P['treatment_phases']=[]
for i,(k,(a,b,ad,bd,*_)) in enumerate(B.items(),1):
 P['treatment_phases'].append({'phase_id':'backbone_'+k,'label':f'Alternative {i}: nivolumab + {a} + {b} (choose ONE backbone)','cycle_length_days':21,'planned_cycles':3,'active_drugs':['nivolumab',a,b],'duration_text':'Mutually exclusive alternative, not a subsequent phase. Maximum3cycles before surgery reassessment. No automatic adjuvant nivolumab.','administration':[{'day':1,'order':1,'drug':'nivolumab','dose':{'value':360,'unit':'mg'},'route':'IV infusion','notes':'Over30minutes; before chemotherapy.'},{'day':[1,8] if a=='gemcitabine' else 1,'order':2,'drug':a,'dose':{'value':ad,'unit':'mg/m2'},'route':'IV infusion','notes':('Over3hours with prescribed reaction premedication.' if a=='paclitaxel' else 'Over10minutes; folate, B12 and rash prophylaxis.' if a=='pemetrexed' else 'Over30minutes. Day8 gemcitabine only after separate review.')},{'day':1,'order':3,'drug':b,'dose':{'value':bd,'unit':'AUC' if b=='carboplatin' else 'mg/m2'},'route':'IV infusion','notes':'Over30minutes; verified Calvert GFR capped125.' if b=='carboplatin' else 'Over60minutes; pre/posthydration and electrolyte plan.'}]})
P['eligibility']=['Adults, newly diagnosed resectable stageII–IIIA AJCC7 high-risk NSCLC, ECOG0–1, PD-L1≥1%; exclude knownEGFR/ALK.','Source includes predominantly non-squamous wording despite multiple listed backbones. Confirm MDT histology/backbone suitability; do not widen eligibility automatically.']
P['exclusions']=['KnownEGFRmutation/ALKtranslocation; component hypersensitivity; pregnancy/breastfeeding. Review specific chemotherapy exclusions.']
P['monitoring']={'baseline':['FBC, renal/liver, glucose, TFT, HBsAg/HBcoreAb and HCVRNA; PD-L1/EGFR/ALK; companion-specific renal/auditory/neuropathy checks.'],'regular':['FBC, renal/liver/glucose everycycle; TFT every3–6weeks; cortisol clinicallyindicated; gemcitabineDay8 bloodchecks.'],'after':['Continueimmune surveillanceatleast5monthsafterlastnivolumab; surgicalMDTdeterminesscans/fitness/timing.']}
P['dose_modifications']={'note':'Event-specific nivolumab rules and selected companion rules; no nivolumab dose reduction. Source conflicts require consultant/pharmacy reconciliation.'};P['supportive_care']={'note':'Backbone-specific NCIS antiemetics; cisplatin hydration, pemetrexed vitamins/rash steroids or paclitaxel reaction premedication only when that backbone is selected.'}
dump(R/'proposed'/name,P);dump(R/'backbones.json',B)
print(len(D),'inputs',len(rules),'rules')
