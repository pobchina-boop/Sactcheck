import json,copy,pathlib,subprocess
R=pathlib.Path(__file__).resolve().parents[3];B=pathlib.Path(__file__).parent;DATE='2026-11-02';V='0.84.28'
def c(f,op,v=None):return dict(field=f,operator=op,**({} if op=='missing' else dict(value=v)))
def ac(*x):return {'all':list(x)}
def oc(*x):return {'any':list(x)}
for code in ['00281','00310']:
 f=next((R/'protocols').glob('*/'+code+'-*'));p=json.loads(subprocess.check_output(['git','show','HEAD:'+f.relative_to(R).as_posix()],cwd=R,text=True));D=p['input_definitions'];m=p['metadata'];version='7' if code=='00281' else '8';url='https://healthservice.hse.ie/documents/6926/281_V7_GemCis75.pdf' if code=='00281' else 'https://assets.hse.ie/media/documents/310_GemCARBOAUC_5.pdf';page=3 if code=='00281' else 4;com=['gemcitabine','cisplatin' if code=='00281' else 'carboplatin']
 m.update(nccp_version=version,source_url=url,source_document_pages=6 if code=='00281' else 8,source_checked_date=DATE,sactcheck_encoding_version=V,full_suite_release=V,source_retrieval_method='Fresh primary PDF web text and table screenshot; direct byte download HTTP403; no new byte hash claimed')
 m['encoding_maturity'].update(level='source_reconciled_pending_independent_review',source_reconciled=True,label='Source audited; independent clinical/pharmacy review pending',audit_release=V,audit_date=DATE,scope_note='Standalone chemotherapy source and companion routing reviewed; clinical-use authorisation remains false.')
 if code=='00310':m.update(date_last_reviewed='2021-11-18',review_policy='As required from 2026-08-19');m.pop('review_date',None)
 p['clinical_governance']['clinical_use_authorised']=False
 def inp(f,label,typ='boolean',opts=None):
  D[f]=dict(label=label,type=typ,required=False,demo_value='',input_role='decision',ui_section='clinical')
  if typ=='number':D[f].update(min=0,max=250,step=.01)
  if opts is not None:D[f]['options']=[dict(value=v,label=t) for v,t in opts]
 def rule(id,w,typ,msg,components=None,pg=page):return dict(rule_id=id,when=w,priority=10 if typ in ['contraindicated','omit','discontinue','permanently_discontinue'] else 8,action=dict(type=typ,components=components or com,recommendation=msg,message=msg,show_in_dose_actions=True),explanation=msg,source=dict(document=f'NCCP {code} v{version}',url=url,page=pg,checked_date=DATE))
 rules=[]
 for old in p['rule_engine']['rules']:
  id=old['rule_id']
  if id=='PROCEED_IF_NO_RESTRICTIVE_RULE':continue
  w=old.get('when') or {k:copy.deepcopy(old[k]) for k in ['field','operator','value','all','any'] if k in old};a=old['action'];msg=a['recommendation'];comp=a['components'];typ=a['type'];pg=page
  if id=='PRIOR_HAEM_EVENT_REDUCE':comp=['gemcitabine'];typ='consultant_review';msg='For subsequent cycles reduce GEMCITABINE to 75% of the ORIGINAL cycle-initiation dose after the selected severe haematologic event or toxicity delay >1 week. This gemcitabine table does not mandate the same reduction for platinum. Confirm recovery and prior doses; do not automatically resume an omitted dose.'
  if id=='NONHAEM_G3PLUS':msg='For Grade ≥3 non-haematological toxicity EXCLUDING nausea/vomiting, withhold chemotherapy until Grade ≤1; the consultant may resume with a selected dose reduction. Grade the named event separately.'
  if id=='CISPLATIN_CRCL_45_TO_59':typ='consultant_review';msg='Cisplatin dose table states 75% at CrCl45–59, but baseline eligibility excludes CrCl<60. Reconcile baseline/on-treatment status and consultant decision before prescribing; do not automatically authorise dosing.'
  if id=='CISPLATIN_CRCL_LT45':msg='Source suggests considering carboplatin below CrCl45 as a clinical decision; baseline cisplatin exclusion is CrCl<60. Do not automatically substitute a different regimen.'
  if id=='NEUROPATHY_G2PLUS':typ='withhold';msg='Withhold cisplatin pending recovery to neuropathy Grade ≤1; consultant chooses carboplatin AUC5 substitution OR 50% cisplatin reduction. Source lists 100% gemcitabine, subject to its independent restrictions. Do not change regimen automatically.'
  if id in ['SCAR_CONFIRMED','SCAR_SUSPECTED','PNEUMONITIS_G2PLUS','NONHAEM_G3PLUS','NEUROPATHY_G2PLUS']:pg=page if code=='00281' else 5
  if id in ['EXCLUSION_HYPERSENSITIVITY','PREGNANCY_LACTATION','BASELINE_CISPLATIN_NEUROPATHY_EXCLUSION','HEARING_IMPAIRMENT_REVIEW']:pg=2 if code=='00281' else 3
  if id=='PREGNANCY_LACTATION' and code=='00281':typ='consultant_review';msg='Breastfeeding is an NCCP exclusion; pregnancy needs urgent specialist assessment of maternal/fetal risk. Do not administer until specialist review. The combined legacy input cannot distinguish these situations.'
  if id=='EXCLUSION_HYPERSENSITIVITY' and code=='00310':msg='Do not administer the routine regimen. A prior mild carboplatin reaction may exceptionally be considered for a separate controlled desensitisation pathway only with immunology advice, prescribed premedication, resuscitation facilities and senior supervision; this tool does not authorise rechallenge.'
  rules.append(rule(id,w,typ,msg,comp,pg))
 def add(*a,**kw):rules.append(rule(*a,**kw))
 inp('assessment_stage','Assessment stage','select',[('baseline','Before first treatment'),('on_treatment','On treatment / pre-dose')]);D['assessment_stage'].update(ui_section='treatment_context',always_show=True,input_role='context')
 inp('ecog','ECOG performance status','select',[(i,str(i)) for i in range(5)])
 add('ECOG_SOURCE_RANGE',c('ecog','>',2),'consultant_review','Source eligibility is ECOG0–2; review fitness and appropriateness.',pg=2)
 add('BASELINE_MARROW',ac(c('assessment_stage','==','baseline'),oc(c('anc','<=',1.5),c('platelets','<=',100))),'withhold','Baseline eligibility requires ANC>1.5 and platelets>100. This is distinct from subsequent Day1 ANC>1 threshold.',pg=2)
 add('BASELINE_STAGE_REQUIRED',ac(c('assessment_stage','missing'),c('anc','>',1),c('anc','<=',1.5)),'consultant_review','Confirm baseline versus subsequent-cycle assessment: ANC>1.5 is required at initiation, whereas cycle Day1 threshold is >1.',pg=2)
 add('TREATMENT_DAY_REQUIRED',ac(c('treatment_day','missing'),oc(c('anc','>=',0),c('platelets','>=',0))),'consultant_review','Select Day1 or Day8 before using count-based chemotherapy dose rules; Day8 contains gemcitabine only.')
 inp('gemcitabine_pneumonitis_suspected','Gemcitabine-induced pneumonitis suspected')
 add('GEM_PNEUMONITIS_SUSPECTED',c('gemcitabine_pneumonitis_suspected','==',True),'discontinue','Discontinue gemcitabine if drug-induced pneumonitis is suspected; assess promptly and investigate infection and other causes. An isolated symptom is not a confirmed diagnosis.',['gemcitabine'],4 if code=='00281' else 6)
 inp('day8_restart_after_omission','Restart of previously omitted Day8 gemcitabine requested')
 add('DAY8_RESTART_NOT_RECOVERED',ac(c('day8_restart_after_omission','==',True),oc(c('anc','<=',.5),c('platelets','<=',50))),'omit','Do not restart the previously omitted gemcitabine until ANC>0.5 AND platelets>50. Equality may fit the initial 75% row but does not meet the printed restart criterion.',['gemcitabine'])
 neoid='neoadjuvant_nsclc_nivolumab';ids=[x['value'] for x in D['indication_id']['options']];print(code,ids)
 neo=next((v for v in ids if 'neo' in v),neoid)
 add('NIVOLUMAB_SEPARATE_PLAN',c('indication_id','==',neo),'consultant_review','This is the chemotherapy companion only. Open NCCP00849 and its selected backbone for nivolumab eligibility, immune-toxicity assessment and the three-cycle neoadjuvant plan. Do not use the standalone 4–6-cycle guide.')
 add('NEOADJUVANT_CYCLE_LIMIT',ac(c('indication_id','==',neo),c('cycle_number','>',3)),'withhold','Maximum3 neoadjuvant cycles with nivolumab; refer to00849 and surgical MDT. Standalone4–6-cycle duration does not apply.',pg=1)
 add('STANDALONE_COURSE_REVIEW',ac(c('cycle_number','>',6),c('indication_id','!=',neo)),'consultant_review','Standalone source describes4–6 cycles or earlier progression/unacceptable toxicity. Reassess continuation; do not continue indefinitely by default.',pg=1)
 if code=='00281':
  old=copy.deepcopy(D['crcl_ml_min']);inp('crcl_ml_min','Verified creatinine clearance (mL/min)','number');D['crcl_ml_min'].update(unit='mL/min',ui_section='labs',renal_input=dict(mode='source_threshold_numeric',exact_value_required=False),legacy_input_note='Former renal bands discarded only when user re-enters an exact verified result; do not infer a precise value from a saved category.')
  add('BASELINE_CISPLATIN_RENAL_EXCLUSION',ac(c('assessment_stage','==','baseline'),c('crcl_ml_min','<',60)),'contraindicated','Baseline cisplatin exclusion is CrCl<60; reconcile the separate dose-modification table before any treatment.',['cisplatin'],2)
  add('CISPLATIN_RENAL_BOUNDARY_GAP',ac(c('crcl_ml_min','>',59),c('crcl_ml_min','<=',60)),'consultant_review','Cisplatin table lists45–59 and>60. Values>59 through60 are not assigned; do not round to a dose band.',['cisplatin'])
  add('GEMCITABINE_RENAL_BOUNDARY_GAP',c('crcl_ml_min','==',30),'consultant_review','Gemcitabine table lists<30 and>30; exact30 is unassigned. Consultant/pharmacy reconciliation required.',['gemcitabine'])
  add('NEUROPATHY_STAGE_REQUIRED',ac(c('assessment_stage','missing'),c('neuropathy_grade','>=',2)),'withhold','Confirm baseline versus on-treatment neuropathy. Baseline Grade≥2 excludes cisplatin; treatment-emergent Grade≥2 requires recovery and a consultant-selected platinum plan.',['cisplatin'])
 else:
  D['haemodialysis'].pop('visible_when',None)
  add('CARBOPLATIN_GFR_CAP',c('gfr_ml_min','>',125),'consultant_review','GFR used in Calvert dosing must not exceed125mL/min. Verify renal method; do not automatically use the uncapped result.',['carboplatin'],1)
  add('CARBOPLATIN_MYELORISK',c('gfr_ml_min','<',60),'consultant_review','CrCl<60 is associated with increased myelosuppression risk; review blood counts and the renal dosing plan. More restrictive GFR≤30 rules remain independent.',['carboplatin'])
  inp('creatinine_within48h','For calculated GFR: creatinine obtained within48 hours')
  inp('isotope_creatinine_percent_baseline','Current creatinine as percent of isotope-GFR baseline','number')
  add('CALCULATED_GFR_STALE',c('creatinine_within48h','==',False),'consultant_review','Obtain a creatinine within48 hours when calculating carboplatin dose using Cockcroft–Gault or Wright.',['carboplatin'])
  add('ISOTOPE_GFR_REASSESS',c('isotope_creatinine_percent_baseline','>',110),'consultant_review','Creatinine exceeds110% of value at isotope measurement; consider remeasurement or a new verified estimate before reusing the old carboplatin dose.',['carboplatin'])
 D['nonhaem_toxicity_grade']['label']='Other non-haematological toxicity grade (excluding nausea/vomiting)'
 D['nonhaem_toxicity_grade']['assessment_guidance']='Name the event and exclude nausea/vomiting from this generic source dose row; assess those separately. Severe vomiting still needs urgent clinical assessment.'
 for key,d in D.items():
  d['required']=False;d['demo_value']=''
  if key.endswith('_grade'):
   d.pop('ctcae_version',None);d.pop('ctcae_source_url',None);d['grading_source_label']=f'NCCP {code} adverse-event table (edition unspecified)';d['source_grading_note']='Source action table does not specify a CTCAE edition; use the locally agreed named-event grading system and confirm clinical attribution.'
 p['rule_engine']['rules']=rules;p['required_inputs']=[]
 p['supportive_care']['phase_day_profiles']={'day1':{'active_drugs':com,'emetogenic_risk':'high'},'day8':{'active_drugs':['gemcitabine'],'emetogenic_risk':'low'}}
 (B/'proposed'/f.name).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
for f in (B/'proposed').glob('*.json'):
 p=json.loads(f.read_text());code=p['metadata']['nccp_regimen_code'];p['supportive_care'].pop('phase_day_profiles',None)
 p['supportive_care'].update(emetogenic_risk='phase_dependent',script_id=None,treatment_day_profiles={'day1':'day1','day8':'day8'},phase_profiles={'day1':{'level':'high','script_id':'nccp-v8-high-v08420' if code=='00281' else 'nccp-v8-carboplatin-v08420'},'day8':{'level':'low','script_id':'nccp-parenteral-low'}},mapping_basis='Day1 platinum/gemcitabine high risk; Day8 gemcitabine alone low risk. Select treatment day; missing day remains unresolved.',phase_specific_plan=f'patient/{code}/supportive-care.html')
 f.write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
