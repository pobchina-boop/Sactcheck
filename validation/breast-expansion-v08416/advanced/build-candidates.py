from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[3]; O=Path(__file__).resolve().parent
for folder in ['baseline','proposed']:(O/folder).mkdir(exist_ok=True)
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def C(f,o,v=None):return dict(field=f,operator=o,**({'value':v} if v is not None else {}))
def A(*x):return {'all':list(x)}
def Y(*x):return {'any':list(x)}
def rule(id,when,action,text,comp,page,url,doc):return dict(rule_id=id,when=when,action=dict(type=action,components=comp,recommendation=text,dose_calculation='specialist_review',show_in_dose_actions=True),explanation=text,source=dict(document=doc,page=page,url=url))
def num(label,max=100,step=1):return dict(label=label,type='number',min=0,max=max,step=step,required=False,input_role='decision')
def boolean(label):return dict(label=label,type='boolean',required=False,input_role='decision')
def select(label,options):return dict(label=label,type='select',required=False,input_role='decision',options=[dict(value=v,label=l) for v,l in options])
changes=[]
for code in ['00217','00204','00507']:
 p=next((R/'protocols/breast').glob(code+'-*.json'));d=json.loads((O/'baseline'/p.name).read_text() if (O/'baseline'/p.name).exists() else p.read_text());base=copy.deepcopy(d);write(O/'baseline'/p.name,base);url=d['metadata']['source_url'];doc='NCCP '+code+' v'+str(d['metadata']['nccp_version']);rs=d['rule_engine']['rules'];ins=d['input_definitions']
 def add(id,w,a,t,co,page):rs.append(rule(id,w,a,t,co,page,url,doc))
 if code in ['00204','00507']:
  h=['trastuzumab','pertuzumab'];both=h+(['docetaxel'] if code=='00204' else ['paclitaxel'])
  existing={x['rule_id']:x for x in rs}
  existing['HER2_BASELINE_LOW']['when']=A(C('assessment_stage','==','baseline'),C('baseline_lvef_percent','<',50))
  existing['HER2_BASELINE_LOW']['explanation']=existing['HER2_BASELINE_LOW']['action']['recommendation']='At treatment initiation, baseline LVEF below50% does not meet eligibility; withhold pending cardiac/specialist review. Historical baseline must not be substituted for the ongoing current measurement.'
  add('HER2_BASELINE_CURRENT_LOW',A(C('assessment_stage','==','baseline'),C('lvef_percent','<',50)),'withhold','At treatment initiation current LVEF below50% does not meet eligibility. Withhold antibodies and obtain cardiac/specialist review before starting.',h,2)
  add('STAGE_INVALID',C('assessment_stage','not_in',['baseline','ongoing']),'consultant_review','Unrecognised assessment stage: select baseline or ongoing. Independent safety findings still apply; do not infer a valid stage.',both,2)
  add('PHASE_INVALID',C('treatment_phase','not_in',['combination','continuation']),'consultant_review','Unrecognised treatment phase: confirm combination treatment or antibody-only continuation. Do not select a chemotherapy dose from an invalid phase.',both,1)
  add('HISTORICAL_BASELINE_CONTEXT',A(C('baseline_lvef_percent','<',50),C('assessment_stage','missing')),'consultant_review','Establish whether this low baseline value is an initiation result or historical. Obtain the current LVEF and treatment stage; no automatic ongoing hold can be based on an old result alone.',h,2)
  if code=='00204':
   existing['HER2_LVEF_HOLD']['action']['recommendation']=existing['HER2_LVEF_HOLD']['explanation']='Hold pertuzumab and trastuzumab for current LVEF<50% AND fall≥10percentage points from baseline. Repeat LVEF within3weeks; no improvement or further decline requires consultant/cardiology review and consideration of discontinuation. This NCCP00204 criterion differs from00507; do not substitute another regimen threshold.'
  else:
   existing['PAC_ANC_LOW']['action']['recommendation']=existing['PAC_ANC_LOW']['explanation']='Delay paclitaxel for ANC<1.0. For0.5–0.99 consider dose reduction at a subsequent cycle. ANC<0.5 requires duration: if≥7days, reduce one source level after recovery. Review current dose and recovery before restarting.'
   existing['PAC_PLT_LOW']['action']['recommendation']=existing['PAC_PLT_LOW']['explanation']='Delay paclitaxel for platelets<90. In70–90 range consider reduction at a subsequent cycle; <70 requires one-level reduction after recovery. Exactly90 overlaps printed rows and requires clarification.'
  ins['current_infusion_reaction']=boolean('Current infusion reaction requiring assessment')
  add('CURRENT_INFUSION_REACTION',C('current_infusion_reaction','==',True),'withhold','Interrupt the implicated infusion and assess/manage the reaction under the local emergency policy. Confirm culprit medicine and severity before any restart; a prior resolved reaction is not the same as a current reaction.',both,4 if code=='00204' else 5)
  # Explicit active reaction grades1/2 were previously left unassessed.
  add('HER2_REACTION_G1_2',C('trastuzumab_hypersensitivity_grade','in',[1,2]),'withhold','Current antibody infusion reaction: interrupt or slow and assess according to severity/local policy; treat symptoms and monitor. Consultant decides whether and how to restart after recovery.',h,4 if code=='00204' else 5)
  d['supportive_care']['mapping_basis']='Taxane-containing combination low emetic risk; antibody-only continuation minimal. Select support for the medicines currently active.'
 else:
  d['metadata']['source_document_pages']=8
  remove={'QT_LONG','LVEF_LOW','ANC_LOW','PLT_LOW','DIARR_G3','HFS_G3','HEP_G3','BILI_G3','CRCL_LT30','CRCL_30_50','CRCL_DIALYSIS'}
  rs[:]=[r for r in rs if r['rule_id'] not in remove]
  # Correct all retained source references.
  for x in rs:x['source']=dict(document=doc,url=url,page=2 if x['rule_id'].startswith('EXCL_') else 7)
  both=['capecitabine','lapatinib'];cape=['capecitabine'];lap=['lapatinib']
  ins.update({
   'indication_eligible':boolean('Full HER2/previous-treatment indication confirmed'),'her2_positive':boolean('Validated HER2-positive disease'),'ecog':num('ECOG performance status',5),
   'dpd_status':select('DPD assessment',[('normal','No deficiency identified'),('partial','Partial deficiency'),('complete','Complete deficiency'),('unknown','Not tested/result unavailable')]),
   'recent_brivudine':boolean('Recent or concomitant brivudine'),'prior_severe_fluoropyrimidine_reaction':boolean('Previous severe/unexpected fluoropyrimidine reaction'),'significant_cardiac_disease':boolean('Clinically significant cardiac disease'),
   'assessment_stage':select('Assessment stage',[('baseline','Before starting'),('ongoing','During treatment')]),
   'treatment_point':select('Point in current cycle',[('cycle_start','Starting next cycle'),('within_cycle','Within current cycle')]),
   'alt_uln_multiple':num('ALT',100,.01),'ast_uln_multiple':num('AST',100,.01),'bilirubin_uln_multiple':num('Bilirubin',100,.01),
   'treatment_related_hepatotoxicity':boolean('Liver abnormality judged treatment-related'),'severe_lapatinib_hepatotoxicity':boolean('Severe liver toxicity attributed to lapatinib'),
   'child_pugh_class':select('Child-Pugh class',[('A','A'),('B','B'),('C','C')]),
   'crcl_ml_min':num('Creatinine clearance (mL/min)',300,.1),'renal_measure_type':select('Renal result used',[('crcl','Creatinine clearance, mL/min'),('egfr','Indexed eGFR (not directly interchangeable)'),('unknown','Method/unit unconfirmed')]),
   'lvef_below_local_lln':boolean('Current LVEF below institutional lower limit of normal'),'cardiac_toxicity_grade':select('Symptoms related to decreased LVEF',[(x,'Grade '+str(x)) for x in range(5)]),
   'qtc_prolonged':boolean('QTc prolongation confirmed on clinical review'),'electrolyte_abnormality':boolean('Hypokalaemia or hypomagnesaemia'),'ecg_check_overdue':boolean('Baseline or week1–2 ECG missing/overdue'),
   'diarrhoea_complicating_features':boolean('Diarrhoea with dehydration, fever/sepsis, bleeding, neutropenia, marked cramps or other complicating features'),
   'pulmonary_toxicity_grade':select('Pulmonary toxicity grade',[(x,'Grade '+str(x)) for x in range(5)]),
   'toxicity_delay_days':num('Treatment delay due to toxicity (days)',365),
   'toxicity_delayed_component':select('Medicine delayed by toxicity',[('capecitabine','Capecitabine'),('lapatinib','Lapatinib'),('both','Both medicines')]),
   'acid_suppressing_medicine':boolean('Antacid, H2 blocker or proton-pump inhibitor'),'active_gi_disease':boolean('Active significant gastrointestinal disease'),
   'disease_progression':boolean('Progression on this treatment')})
  # Exact measured liver values replace grade proxies. Legacy imports receive review, never false clearance.
  for field in ['alt_grade','bilirubin_grade']:ins[field]['input_role']='context';ins[field]['legacy_input']=True;ins[field]['label']='Legacy '+ins[field]['label']+' (use measured result)'
  ins['hand_foot_grade']['options']=[x for x in ins['hand_foot_grade']['options'] if x['value']<=3]
  ins['hand_foot_grade']['assessment_guidance']+=' This toxicity has grades0–3; no grade4 HFS option.'
  ins['crcl_band']=select('Creatinine clearance band',[('gte_51','CrCl≥51mL/min'),('30_50','CrCl30–50mL/min'),('lt_30','CrCl<30mL/min'),('dialysis','Haemodialysis')]);ins['crcl_band']['ui_section']='labs'
  for f,l in [('haematological_occurrence','Count-toxicity occurrence'),('diarrhoea_occurrence','Diarrhoea occurrence'),('hand_foot_occurrence','Hand-foot toxicity occurrence'),('other_toxicity_occurrence','Other toxicity occurrence')]:ins[f]=select(l,[(i,str(i)+(' or later' if i==4 else '')) for i in [1,2,3,4]])
  for f in ['diarrhoea_grade','other_toxicity_grade']:
   ins[f]['source_grading_note']='NCCP tables use CTCAE4.0. Confirm the named source toxicity grade; do not substitute stool-count cutoffs from a different CTCAE edition.'
  for id,f,t,co in [('INDICATION','indication_eligible','Full indication and prior treatment are not confirmed; review selection before starting.',both),('HER2','her2_positive','Validated HER2 positivity required; reconcile regimen choice.',both)]:add(id,C(f,'==',False),'consultant_review',t,co,1)
  add('ECOG',C('ecog','>',2),'consultant_review','ECOG is outside the source0–2 population; consultant selection review required.',both,1)
  for id,f,t,co in [('DPD_COMPLETE','dpd_status','Known complete DPD deficiency: capecitabine is contraindicated.',cape),('BRIVUDINE','recent_brivudine','Recent/concomitant brivudine is a source exclusion; do not give capecitabine. Confirm an adequate washout with pharmacy.',cape),('PRIOR_FLUORO_REACTION','prior_severe_fluoropyrimidine_reaction','Prior severe unexpected fluoropyrimidine reaction is an explicit exclusion; do not administer before specialist review.',cape),('CARDIAC_DISEASE','significant_cardiac_disease','Clinically significant cardiac disease is an NCCP exclusion; obtain specialist review of an alternative plan.',both)]:add(id,C(f,'==','complete' if id=='DPD_COMPLETE' else True),'contraindicated',t,co,2)
  add('DPD_PARTIAL',C('dpd_status','==','partial'),'consultant_review','Partial DPD deficiency: consider reduced capecitabine starting dose; exact reduction is individual and not specified by this source. Subsequent escalation only with careful monitoring and prescribing review.',cape,3)
  add('DPD_UNKNOWN',C('dpd_status','==','unknown'),'withhold','Do not start capecitabine until prior DPD testing/result is established. Renal impairment can confound uracil phenotyping; consider genotype assessment.',cape,2)
  add('DPD_BASELINE_MISSING',A(C('assessment_stage','==','baseline'),C('dpd_status','missing')),'consultant_review','At initiation verify DPD testing/result before capecitabine. A missing result is unassessed, never assumed normal.',cape,2)
  for f,allowed in [('assessment_stage',['baseline','ongoing']),('treatment_point',['cycle_start','within_cycle']),('dpd_status',['normal','partial','complete','unknown']),('child_pugh_class',['A','B','C']),('crcl_band',['gte_51','30_50','lt_30','dialysis']),('renal_measure_type',['crcl','egfr','unknown']),('toxicity_delayed_component',['capecitabine','lapatinib','both'])]:add('INVALID_'+f.upper(),C(f,'not_in',allowed),'consultant_review','Unrecognised '+f.replace('_',' ')+': clarify the supplied context. Independent safety findings still apply.',both,3)
  low=Y(C('anc','<',1.5),C('platelets','<',75))
  add('CAPE_COUNTS_LOW',low,'delay','Delay capecitabine until ANC≥1.5 AND platelets≥75. Establish the event number and worst count band before the restart dose. At cycle start delay both medicines until all restart requirements are met.',cape,3)
  bands=[(Y(A(C('anc','>=',1),C('anc','<',1.5)),A(C('platelets','>=',50),C('platelets','<',75))),['100%','75%','50%','stop']),
         (Y(A(C('anc','>=',.5),C('anc','<',1)),A(C('platelets','>=',25),C('platelets','<',50))),['75%','50%','stop','stop']),
         (Y(C('anc','<',.5),C('platelets','<',25)),['stop_or_50','stop','stop','stop'])]
  for n,(w,doses) in enumerate(bands):
   for event,dose in enumerate(doses,1):
    t='Use the most restrictive applicable count band. '
    if dose=='stop':a='permanently_discontinue';t+='This count-toxicity band and recurrence require permanent capecitabine discontinuation.'
    elif dose=='stop_or_50':a='withhold';t+='First severe count event: discontinue capecitabine OR, only after consultant decision, delay until recovery then50% of starting dose. Do not automatically restart.'
    else:a='delay' if dose=='100%' else 'delay_then_dose_reduce';t+='Delay capecitabine until ANC≥1.5 AND platelets≥75; source permits '+dose+' of starting dose after this occurrence. Reconcile prior reductions and the other count; no automatic dose increase.'
    add(f'CAPE_COUNTS_B{n}_E{event}',A(w,C('haematological_occurrence','==',event)),a,t,cape,3)
  for f,cut,op in [('alt_uln_multiple',2.5,'>'),('ast_uln_multiple',2.5,'>'),('bilirubin_uln_multiple',3,'>')]:
   add('CAPE_HEP_'+f.upper(),C(f,op,cut),'withhold','Result exceeds the source treatment-related hepatic threshold. Withhold capecitabine while establishing attribution; restart only once bilirubin≤3×ULN and the affected ALT/AST≤2.5×ULN, with clinical/pharmacy review. At a new cycle delay both medicines until restart requirements are met.',cape,5)
  for f in ['alt_grade','bilirubin_grade']:add('LEGACY_'+f.upper(),C(f,'exists'),'consultant_review','A legacy liver grade cannot apply the exact NCCP thresholds. Enter measured ALT/AST/bilirubin with laboratory ULN; do not infer normality or clearance from the grade.',both,5)
  add('LAP_SEVERE_LIVER',C('severe_lapatinib_hepatotoxicity','==',True),'permanently_discontinue','Severe lapatinib-associated liver toxicity: discontinue lapatinib and do not retreat. Obtain urgent specialist assessment.',lap,7)
  add('LAP_CHILD_C',C('child_pugh_class','==','C'),'consultant_review','Severe hepatic impairment needs consultant/pharmacy dose selection. NCCP table lists750mg daily for HER2-positive metastatic disease and1000mg for hormone-receptor/HER2-positive disease; the table spans other lapatinib combinations. Do not choose by HR status alone or automatically apply another combination dose.',lap,3)
  # Numeric CrCl supported without requiring a second field; eGFR must not be relabelled.
  add('RENAL_METHOD',C('renal_measure_type','in',['egfr','unknown']),'consultant_review','Confirm creatinine clearance in mL/min for the NCCP renal bands. Indexed eGFR must not be directly substituted; do not calculate a capecitabine dose from an unconfirmed result.',cape,3)
  crcl_method=Y(C('renal_measure_type','missing'),C('renal_measure_type','==','crcl'))
  add('CAPE_RENAL_LT30',Y(C('crcl_band','==','lt_30'),A(crcl_method,C('crcl_ml_min','<',30))),'contraindicated','Capecitabine is not recommended at CrCl<30mL/min. Lapatinib has no expected renal adjustment but the combined regimen must be reconsidered; no automatic monotherapy.',cape,3)
  add('CAPE_DIALYSIS',C('crcl_band','==','dialysis'),'contraindicated','Capecitabine is not recommended on haemodialysis. Specialist review of an alternative plan is required.',cape,3)
  add('CAPE_RENAL_30_50',Y(C('crcl_band','==','30_50'),A(crcl_method,C('crcl_ml_min','>=',30),C('crcl_ml_min','<=',50))),'consultant_review','NCCP00217 specifies75% of original capecitabine dose for CrCl30–50mL/min, including this1000mg/m²twice-daily regimen. Verify creatinine clearance method, actual prescription and other reductions; do not substitute a generic capecitabine rule.',cape,3)
  add('CAPE_RENAL_GAP',A(crcl_method,C('crcl_ml_min','>',50),C('crcl_ml_min','<',51)),'consultant_review','CrCl lies between the printed30–50 and51–80 bands. Do not silently round; resolve the renal band with oncology/pharmacy.',cape,3)
  add('RENAL_CONFLICT',Y(A(C('crcl_band','==','gte_51'),C('crcl_ml_min','<',51)),A(C('crcl_band','==','30_50'),Y(C('crcl_ml_min','<',30),C('crcl_ml_min','>',50))),A(C('crcl_band','==','lt_30'),C('crcl_ml_min','>=',30))),'consultant_review','Numeric creatinine clearance and chosen band disagree; reconcile before dose selection. Independent severe renal restriction still applies.',cape,3)
  add('LAP_CARDIAC',Y(C('lvef_below_local_lln','==',True),C('cardiac_toxicity_grade','>=',3)),'withhold','Stop lapatinib for at least2weeks for symptomatic decreased LVEF grade≥3 or LVEF below institutional lower limit. May restart at1000mg/day with capecitabine only if LVEF normalises and patient asymptomatic after specialist review. Not an automatic restart.',lap,6)
  rs[-1]['source']['additional']='EMA Tyverb SmPC4.2 explicitly adds institutional lower-limit criterion.'
  add('LAP_LVEF_CONTEXT',A(C('lvef_percent','exists'),C('lvef_below_local_lln','missing')),'consultant_review','Interpret current LVEF against the institutional lower limit and symptoms; this source does not establish a universal50% cutoff. Confirm whether below local normal before deciding. Baseline LVEF required for all patients under NCCP cardiac-complications section.',lap,7)
  add('LAP_QTC',Y(C('qtc_prolonged','==',True),A(C('qtc_seconds','exists'),C('qtc_prolonged','missing'))),'consultant_review','Review QTc using the ECG report, correction method, clinical risk and interacting medicines. NCCP/SmPC do not specify a450ms contraindication for lapatinib. Obtain baseline and week1–2 ECG (EMA SmPC), correct potassium/magnesium and agree any interruption.',lap,7)
  add('LAP_ELECTROLYTES',C('electrolyte_abnormality','==',True),'withhold','Correct hypokalaemia or hypomagnesaemia before lapatinib and reassess QT risk/ECG; review the cause and interacting drugs.',lap,7);rs[-1]['source']['additional']='EMA Tyverb SmPC4.4 p5.'
  add('LAP_ECG_OVERDUE',C('ecg_check_overdue','==',True),'consultant_review','Baseline or week1–2 ECG is missing/overdue. Arrange ECG/QT review and document the treatment decision; never assume a normal result.',lap,7);rs[-1]['source']['additional']='EMA Tyverb SmPC4.4 p5.'
  add('LAP_PULMONARY',C('pulmonary_toxicity_grade','>=',3),'discontinue','Grade≥3 pulmonary symptoms: discontinue lapatinib and urgently assess suspected pneumonitis/ILD and alternative causes.',lap,6)
  add('LAP_DIARR_COMPLICATED',A(C('diarrhoea_grade','in',[1,2]),C('diarrhoea_complicating_features','==',True)),'withhold_then_reduce','Interrupt lapatinib for grade1–2 diarrhoea with complicating features. Treat dehydration/infection/electrolytes as indicated; after recovery to≤grade1, consultant may restart1000mg/day rather than1250mg/day.',lap,6)
  add('LAP_DIARR3',C('diarrhoea_grade','==',3),'withhold_then_reduce','Interrupt lapatinib for any grade3 diarrhoea; recover to≤grade1 before consultant-selected restart at1000mg/day. Manage hydration/electrolytes and investigate cause.',lap,6)
  add('LAP_DIARR4',C('diarrhoea_grade','==',4),'permanently_discontinue','Grade4 diarrhoea requires permanent lapatinib discontinuation and urgent management. Capecitabine has its own occurrence-specific decision.',lap,6)
  for f,occ,maxg,page in [('diarrhoea_grade','diarrhoea_occurrence',4,5),('hand_foot_grade','hand_foot_occurrence',3,5),('other_toxicity_grade','other_toxicity_occurrence',4,4)]:
   add('CAPE_'+f.upper()+'_HOLD',C(f,'>=',2),'withhold','Interrupt capecitabine for grade≥2 toxicity until grade0–1. Record recurrence number and exact named toxicity before the restart decision. At cycle start delay both medicines until all restart requirements are met.',cape,page)
   for grade in range(2,maxg+1):
    doses={2:['100%','75%','50%','stop'],3:['75%','stop_or_50' if f=='hand_foot_grade' else '50%','stop','stop'],4:['stop_or_50','stop','stop','stop']}[grade]
    for event,dose in enumerate(doses,1):
     if dose=='stop':action='permanently_discontinue';t='This grade/recurrence requires permanent capecitabine discontinuation.'
     elif dose=='stop_or_50':action='withhold';t='Source permits discontinuation OR, only if consultant judges continuation appropriate, interrupt until grade0–1 then50% of starting capecitabine dose. No automatic restart.'
     else:action='withhold';t='Interrupt capecitabine until grade0–1; source next-dose level for this grade/occurrence is'+dose+' of starting dose. Reconcile actual prescription and any earlier reductions before restart.'
     add(f'CAPE_{f.upper()}_G{grade}_E{event}',A(C(f,'==',grade),C(occ,'==',event)),action,t,cape,page)
  add('LAP_OTHER',C('other_toxicity_grade','>=',2),'consultant_review','For other grade≥2 lapatinib toxicity consider interruption/discontinuation until≤grade1. First occurrence may restart1250mg/day; second occurrence1000mg/day. Specific cardiac/pulmonary/diarrhoea/liver rules override this general advice.',lap,6)
  for f,allowed in [('diarrhoea_grade',list(range(5))),('hand_foot_grade',list(range(4))),('other_toxicity_grade',list(range(5))),('cardiac_toxicity_grade',list(range(5))),('pulmonary_toxicity_grade',list(range(5)))]+[(f,[1,2,3,4]) for f in ['haematological_occurrence','diarrhoea_occurrence','hand_foot_occurrence','other_toxicity_occurrence']]:add('INVALID_'+f.upper(),C(f,'not_in',allowed),'consultant_review','Invalid source toxicity grade/occurrence supplied. Reassess with the appropriate descriptor before dose selection; independent safety findings still apply.',both,4)
  for comp in ['capecitabine','lapatinib','both']:
   add('TOX_DELAY_'+comp.upper(),A(C('toxicity_delay_days','>',14),C('toxicity_delayed_component','==',comp)),'permanently_discontinue','Delay due to toxicity exceeds2weeks: permanently discontinue the implicated medicine(s) under NCCP. Confirm cause and consultant plan; this is not an automatic rule for administrative/appointment delays.',both if comp=='both' else [comp],3)
  add('TOX_DELAY_UNKNOWN',A(C('toxicity_delay_days','>',14),C('toxicity_delayed_component','missing')),'consultant_review','Toxicity delay>2weeks meets NCCP discontinuation rule for the involved medicine. Identify the implicated medicine(s) and document the consultant decision; do not restart automatically.',both,3)
  add('ACID_SUPPRESSION',C('acid_suppressing_medicine','==',True),'consultant_review','Pharmacy review needed: current Tyverb SmPC advises avoiding drugs that raise gastric pH. NCCP2hour separation instruction does not establish that a PPI interaction is resolved; review alternatives before dosing.',lap,1);rs[-1]['source']['additional']='EMA Tyverb SmPC4.4–4.5.'
  add('GI_DISEASE',C('active_gi_disease','==',True),'consultant_review','Assess significant GI disease, absorption, diarrhoea risk and oral-treatment suitability before proceeding.',both,7)
  add('PROGRESSION',C('disease_progression','==',True),'consultant_review','Treatment duration is until progression or unacceptable toxicity. Progression requires review of the treatment plan before further cycles.',both,1)
  d['treatment_phases']=[dict(phase_id='combination',name='Continuous lapatinib with14days capecitabine',label='21-day oral combination',cycle_length_days=21,administration=[dict(drug='lapatinib',dose=dict(value=1250,unit='mg'),day=list(range(1,22)),route='oral',notes='Once daily continuously; meal timing consistent, at least1h before/after food. No split dose.'),dict(drug='capecitabine',dose=dict(value=1000,unit='mg/m2'),day=list(range(1,15)),route='oral',notes='Per dose, TWICE daily12hours apart with/within30min of food. No capecitabine Days15–21. Review DPD and renal modifications.')])]
  d['output_templates']['proceed']='No encoded restriction was triggered by the entered values. All omitted domains, source eligibility and prescribing/pharmacy checks remain outstanding.'
  d['supportive_care']['summary']=['Both agents minimal-to-low emetic risk; individual PRN antiemetic and QT/interaction review.','No routine infusion premedication. Provide diarrhoea and hand-foot instructions and oral treatment calendar.','Baseline and week1–2 ECG/QT review from current EMA Tyverb SmPC; echo every12weeks per NCCP.']
 d['metadata'].update(sactcheck_encoding_version='0.84.16',source_checked_date='2026-10-21',source_version_verified_date='2026-10-21')
 d['metadata']['encoding_maturity'].update(source_reconciled=True,level='source_reconciled_pending_independent_validation',label='Source reconciled; independent clinical/pharmacy review pending',audit_release='0.84.16',audit_date='2026-10-21',scope_note='Source audit and scenario cases in validation/breast-expansion-v08416/advanced. Not clinical approval.')
 import re
 def tidy(v,key=''):
  if isinstance(v,list):return [tidy(x,key) for x in v]
  if isinstance(v,dict):return {k:tidy(x,k) for k,x in v.items()}
  if isinstance(v,str) and key in ['recommendation','explanation','label','notes','note','summary']:
   v=re.sub(r'(?<=[a-z])(?=\d)', ' ', v)
   v=re.sub(r'(?<=\d)(?=[a-zA-Z])', ' ', v)
   v=v.replace('of starting','of starting').replace('mg/m 2','mg/m²').replace('source 0–2','source 0–2')
  return v
 d=tidy(d)
 write(O/'proposed'/p.name,d)
 changes.append(dict(code=code,baseline_sha256=hashlib.sha256((O/'baseline'/p.name).read_bytes()).hexdigest(),candidate='proposed/'+p.name,source_url=url,source_version=d['metadata']['nccp_version'],status='Candidate only; independent review pending'))
write(O/'proposed-changes.json',dict(checked='2026-10-21',proposals=changes))
print('Prepared3candidate protocols')
