"""Source-based candidate protocols. Writes only this audit folder; owner integrates."""
import copy,json,pathlib
O=pathlib.Path(__file__).resolve().parent;R=O.parents[2];CODES=['00350','00775','00258','00722','00731'];H=['pertuzumab','trastuzumab']
def load(c):return json.loads(next((R/'protocols/breast').glob(c+'*.json')).read_text())
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def F(k,op,v=None):return dict(field=k,operator=op,**({} if op in ['missing','present'] else {'value':v}))
def A(*x):return {'all':list(x)}
def Q(*x):return {'any':list(x)}
def b(k):return F(k,'==',True)
def n(k,l,unit='',role='decision'):return dict(label=l,type='number',required=False,min=0,step=.01,unit=unit,input_role=role)
def boolean(l):return dict(label=l,type='boolean',required=False,input_role='decision')
def select(l,opts):return dict(label=l,type='select',required=False,input_role='context',options=[dict(value=v,label=t) for v,t in opts])
def source(p,page):return dict(document=f'NCCP {p["metadata"]["nccp_regimen_code"]} v{p["metadata"]["nccp_version"]}',url=p['metadata']['source_url'],page=page)
def rule(p,id,when,typ,parts,text,page=1):
 a=dict(type=typ,components=parts,recommendation=text)
 if typ=='consultant_review':a.update(dose_calculation='specialist_review',show_in_dose_actions=True)
 return dict(rule_id=id,when=when,action=a,explanation=text,source=source(p,page))
def txt(r,text):r['action']['recommendation']=r['explanation']=text
stage0=Q(F('assessment_stage','missing'),F('assessment_stage','==','baseline'))
chemo=Q(F('treatment_phase','missing'),F('treatment_phase','!=','continuation'))
base90=load('00790');candidates={}
for c in CODES:save(O/'baseline'/f'{c}.json',load(c))
# 00775 shares the verified chemo schedule/table with 00790, but IV antibodies are separate medicines.
p=load('00775');p['input_definitions']=copy.deepcopy(base90['input_definitions']);p['rule_engine']=copy.deepcopy(base90['rule_engine']);rules=[]
drop={'RENAL_SEVERE','SUSPECTED_HF','BRONCHOSPASM_ARDS','PHESGO_INJECTION_REACTION','PHESGO_REACTION_G1_G2','PHESGO_REACTION_G3','DIARRHOEA_REVIEW'}
for r in p['rule_engine']['rules']:
 if r['rule_id'] in drop:continue
 r=json.loads(json.dumps(r).replace('00790','00775').replace('Phesgo','IV pertuzumab and trastuzumab').replace('PHESGO','HER2').replace('phesgo_hypersensitivity_grade','her2_hypersensitivity_grade'))
 r['source']=source(p,{1:1,4:4,5:3,6:3,7:5,8:5,9:6,10:7,11:8}.get(r['source']['page'],r['source']['page']))
 if r['rule_id']=='HER2_RELOAD':txt(r,'Gap ≥6 weeks: re-administer pertuzumab840mg IV over60min and trastuzumab8mg/kg IV over90min; then420mg and6mg/kg q21days. Confirm administration history, current cardiac assessment and observation before prescribing.')
 if r['rule_id']=='HER2_MAINTENANCE':txt(r,'Gap <6 weeks: pertuzumab420mg and trastuzumab6mg/kg IV as soon as clinically appropriate, then original planned schedule. Confirm due date and safety; this does not authorise an early dose.')
 if r['rule_id']=='HER2_G4':r['action']['type']='discontinue';txt(r,'Grade4 HER2-antibody hypersensitivity: discontinue implicated treatment and manage urgently.')
 if r['rule_id']=='PAC_HEP_STOP':txt(r,'Paclitaxel contraindicated when transaminases are ≥10×ULN and/or bilirubin>5×ULN (NCCP00775 table4).')
 if r['rule_id']=='CONTINUATION_REGIMEN_REQUIRED':txt(r,'Surgery and pathology determine the separately selected adjuvant HER2 regimen, such as trastuzumab or T-DM1. Open that regimen for assessment, doses, monitoring and supportive medicines; this card does not automatically prescribe continuation.')
 rules.append(r)
p['rule_engine']['rules']=rules
for k in ['severe_renal_impairment','suspected_heart_failure','bronchospasm_or_ards','significant_injection_reaction','diarrhoea_grade']:p['input_definitions'].pop(k,None)
p['input_definitions']['her2_hypersensitivity_grade']=p['input_definitions'].pop('phesgo_hypersensitivity_grade');p['input_definitions']['her2_hypersensitivity_grade']['label']='Current HER2-antibody hypersensitivity grade'
p['input_definitions']['treatment_phase']['options'][0]['label']='Paclitaxel / carboplatin + IV HER2 antibodies'
p['input_definitions']['platelets_x10e9_l']['demo_value']=150
p['input_definitions']['trastuzumab_discontinued']=boolean('Trastuzumab permanently discontinued')
p['rule_engine']['rules'].append(rule(p,'STOP_PERTUZUMAB_WITH_H',b('trastuzumab_discontinued'),'discontinue',['pertuzumab'],'If trastuzumab is discontinued, discontinue pertuzumab.',4))
p['input_definitions']['days_since_last_antibody']['label']='Days since last IV dual-HER2 infusion'
p['required_inputs']=[];candidates['00775']=p
# 00350 is a framework: retain antibody safety, never invent companion chemotherapy rules.
p=load('00350');inp={};keep=['assessment_stage','baseline_lvef_percent','lvef_percent','lvef_drop_points','anthracycline_completed','ecog','hypersensitivity','pregnancy','breastfeeding','her2_positive','indication_eligible','symptomatic_heart_failure','significant_cardiac_disease','severe_dyspnoea_at_rest','cardiac_monitoring_overdue','days_since_last_antibody']
for k in keep:inp[k]=copy.deepcopy(base90['input_definitions'][k])
inp.update(treatment_setting=select('Treatment setting',[('neoadjuvant','Before surgery'),('adjuvant','After surgery')]),companion_regimen_confirmed=boolean('Companion chemotherapy NCCP regimen selected and separately assessed'),concurrent_anthracycline=boolean('Anthracycline is being given concurrently'),trastuzumab_discontinued=boolean('Trastuzumab permanently discontinued'),her2_hypersensitivity_grade=select('Current HER2-antibody reaction grade',[(i,'Grade '+str(i)) for i in range(5)]),significant_infusion_reaction=boolean('Significant current infusion reaction'),bronchospasm_or_ards=boolean('Reaction-associated bronchospasm or ARDS'),severe_persistent_diarrhoea=boolean('Severe or prolonged diarrhoea not improving'),severe_renal_impairment=boolean('Severe renal impairment'),hepatic_impairment=boolean('Hepatic impairment'),age_years=n('age_years','Age','years'))
inp['days_since_last_antibody']['label']='Days since last IV dual-HER2 infusion'
p['input_definitions']=inp;p['rule_engine']=copy.deepcopy(base90['rule_engine']);p['rule_engine']['rules']=[]
keep_rules=['BASELINE_LVEF_LOW','BASELINE_LVEF_50_55','BASELINE_HISTORY_MISSING','BASELINE_CURRENT_LVEF_LOW','BASELINE_CURRENT_LVEF_50_55','BASELINE_CURRENT_HISTORY_MISSING','LVEF_STAGE_MISSING','ONGOING_BASELINE_HISTORY_REVIEW','LVEF_HOLD','LVEF_CHANGE_MISSING','LVEF_CURRENT_MISSING','INVALID_ASSESSMENT_STAGE','ECHO_MISSING','HER2_REQUIRED','INDICATION','ECOG']
for r in base90['rule_engine']['rules']:
 if r['rule_id'] not in keep_rules:continue
 r=copy.deepcopy(r);r['source']=source(p,4 if r['rule_id'].startswith('LVEF_') and r['rule_id']!='LVEF_STAGE_MISSING' else 3 if r['rule_id']=='ECHO_MISSING' else 2)
 r=json.loads(json.dumps(r).replace('Phesgo','pertuzumab and trastuzumab'));p['rule_engine']['rules'].append(r)
def add(id,w,typ,parts,t,pg):p['rule_engine']['rules'].append(rule(p,id,w,typ,parts,t,pg))
for field,id,text in [('hypersensitivity','ALLERGY','Relevant antibody/excipient hypersensitivity excludes treatment.'),('pregnancy','PREGNANCY','Pregnancy is an NCCP exclusion; urgent specialist treatment review.'),('breastfeeding','BREASTFEEDING','Breastfeeding is an NCCP exclusion; specialist advice required.'),('significant_cardiac_disease','CARDIAC_DISEASE','Clinically significant cardiac disease requires specialist review before HER2 therapy.')]:add(id,b(field),'contraindicated',H,text,2)
add('DYSPNOEA_REST',b('severe_dyspnoea_at_rest'),'withhold',H,'Rest dyspnoea requires urgent assessment before treatment; NCCP flags elevated fatal infusion-reaction risk.',2)
add('HEART_FAILURE',b('symptomatic_heart_failure'),'discontinue',H,'Symptomatic heart failure: discontinue HER2 antibodies and refer urgently.',4)
add('HER2_REACTION_G4',F('her2_hypersensitivity_grade','==',4),'discontinue',H,'Grade4 hypersensitivity: discontinue implicated antibody and manage urgently.',4)
add('INFUSION_REACTION',Q(F('her2_hypersensitivity_grade','in',[1,2,3]),b('significant_infusion_reaction')),'withhold',H,'Interrupt or slow the infusion, assess and treat the reaction and observe to resolution. Serious reactions require urgent supportive treatment. Re-exposure is a treating-team decision.',5)
add('PERTUZUMAB_SEVERE_REACTION',b('bronchospasm_or_ards'),'permanently_discontinue',['pertuzumab'],'Reaction-associated bronchospasm or ARDS: permanently discontinue pertuzumab and manage urgently.',5)
add('DIARRHOEA',b('severe_persistent_diarrhoea'),'withhold',['pertuzumab'],'Severe/prolonged diarrhoea without improvement: consider interruption until controlled; assess hydration/electrolytes and infection urgently.',5)
add('STOP_PERTUZUMAB_WITH_H',b('trastuzumab_discontinued'),'discontinue',['pertuzumab'],'Discontinue pertuzumab if trastuzumab is discontinued.',3)
add('ANTHRACYCLINE_CONCURRENT',b('concurrent_anthracycline'),'withhold',H,'Complete the entire anthracycline component before starting these antibodies. Do not administer concurrent anthracycline/HER2 therapy under this source.',1)
add('COMPANION_REGIMEN_REQUIRED',Q(F('companion_regimen_confirmed','missing'),F('companion_regimen_confirmed','==',False)),'consultant_review',H,'This antibody framework requires a separately selected chemotherapy regimen. Its count, renal/hepatic, dose and supportive-care rules must be assessed there; no docetaxel or carboplatin dose is inferred here.',1)
add('SETTING_REQUIRED',F('treatment_setting','missing'),'consultant_review',H,'Confirm neoadjuvant versus adjuvant setting; treatment duration, surgery sequence and Irish access differ.',1)
add('SETTING_INVALID',F('treatment_setting','not_in',['neoadjuvant','adjuvant']),'consultant_review',H,'Select one of the two source settings. This is not a metastatic maintenance protocol.',1)
add('ADJUVANT_ACCESS',F('treatment_setting','==','adjuvant'),'consultant_review',H,'NCCP00350b records pertuzumab reimbursement not approved. Verify current Irish access separately and document the selected pathway; clinical evidence is not funding authorisation.',1)
add('ADULT_ELIGIBILITY',F('age_years','<',18),'consultant_review',H,'The source indication is for adults; a paediatric plan is not established by this card.',1)
add('RENAL_SEVERE',b('severe_renal_impairment'),'consultant_review',['pertuzumab'],'No source dose recommendation for severe renal impairment because data are limited. Specialist review; no invented percentage reduction.',4)
add('HEPATIC_CONTEXT',b('hepatic_impairment'),'consultant_review',H,'Limited dedicated hepatic data for the antibodies; no specific pertuzumab dose recommendation. Assess the chosen chemotherapy separately.',4)
for codeid,op,v,text in [('HER2_RELOAD','>=',42,'Gap≥6weeks: pertuzumab840mg IV over60min and trastuzumab8mg/kg IV over90min, then420mg and6mg/kg q21days; verify history and safety.'),('HER2_MAINTENANCE','<',42,'Gap<6weeks: usual pertuzumab420mg and trastuzumab6mg/kg IV as soon as appropriate; revert to planned schedule. This does not authorise early dosing.')]:add(codeid,F('days_since_last_antibody',op,v),'consultant_review',H,text,3)
p['required_inputs']=[];p['metadata']['indication']='NCCP00350a: adult high-risk HER2-positive neoadjuvant treatment with separately selected chemotherapy. NCCP00350b: adjuvant high-risk HER2-positive treatment; source records pertuzumab reimbursement not approved. Verify access separately.';p['metadata']['regimen_reimbursement_codes']=['00350a','00350b'];p['output_templates']['proceed']='Antibody safety domains only. The companion chemotherapy requires its own NCCP assessment; this result is not whole-regimen clearance.';candidates['00350']=p
# Retrospective corrections preserving established input keys and IDs.
for c in ['00258','00731','00722']:
 p=load(c);parts=['trastuzumab'] if c=='00258' else H;rules=p['rule_engine']['rules'];inp=p['input_definitions'];anc='anc' if c=='00722' else 'anc_x10e9_l';plt='platelets' if c=='00722' else 'platelets_x10e9_l';bp=4 if c=='00258' else 3
 inp['treatment_phase']=copy.deepcopy(base90['input_definitions']['treatment_phase']);inp['treatment_phase']['options'][0]['label']='Chemotherapy + HER2 therapy';inp['treatment_phase']['options'][1]['label']='After chemotherapy: confirm selected HER2 regimen'
 if c=='00722':
  for k in ['baseline_lvef_percent','cardiac_monitoring_overdue','gfr_method','creatinine_result_age_hours','creatinine_percent_reference','hepatic_delay_days','hepatic_not_recovered','febrile_neutropenia']:
   inp[k]=copy.deepcopy(load('00258')['input_definitions'][k])
  # Normalise old top-level conditions and guard chemotherapy dose actions during continuation.
  for r in rules:
   if 'when' not in r:
    keys=[k for k in ['field','operator','value','all','any'] if k in r];r['when']={k:r.pop(k) for k in keys}
   if any(x in r['action']['components'] for x in ['docetaxel','carboplatin']):r['when']=A(chemo,r['when'])
  rr=next(r for r in rules if r['rule_id']=='BASELINE_LVEF_BELOW55');txt(rr,'Baseline LVEF must be at least55% under NCCP00722; no post-anthracycline50% exception is printed. Review with oncology/cardiology before initiation.')
  rules.append(rule(p,'HISTORIC_BASELINE_LVEF_LOW',A(stage0,F('baseline_lvef_percent','<',55)),'withhold',parts,'Baseline LVEF<55% is outside the source initiation threshold.',bp))
 else:
  for r in rules:
   if r['rule_id'] in ['HER2_BASELINE_LOW','HER2_BASELINE_BORDERLINE']:r['when']=A(stage0,r['when'])
   # Correct > thresholds, including FN recovery. Never silently include exact boundary.
   def strict(v):
    if isinstance(v,dict):
     if v.get('field') in [anc,plt] and v.get('operator')=='>=' and ((v['field']==anc and v.get('value')==1.5) or (v['field']==plt and v.get('value')==100)):v['operator']='>'
     for x in v.values():strict(x)
    elif isinstance(v,list):
     for x in v:strict(x)
   for r in rules:
    if r['rule_id'].startswith('TCH_'):strict(r['when']);txt(r,r['action']['recommendation'].replace('ANC ≥1.5','ANC >1.5').replace('platelets ≥100','platelets >100'))
  rules.append(rule(p,'CURRENT_BASELINE_LVEF_LOW',A(F('assessment_stage','==','baseline'),F('lvef_percent','<',50 if c=='00258' else 55)),'withhold',parts,'Current pretreatment LVEF is below the source initiation threshold; specialist assessment before starting.',bp))
  if c=='00258':rules.append(rule(p,'CURRENT_BASELINE_LVEF_BORDERLINE',A(F('assessment_stage','==','baseline'),F('lvef_percent','>=',50),F('lvef_percent','<=',55)),'consultant_review',parts,'Source specifies >55%; LVEF50–55% requires clinical judgement, not automatic eligibility.',4))
 for id,w,t,pg in [('INVALID_ASSESSMENT_STAGE',F('assessment_stage','not_in',['baseline','ongoing']),'Unrecognised stage: select Before starting or During treatment. Independent safety findings still apply.',1),('INVALID_TREATMENT_PHASE',F('treatment_phase','not_in',['combination','continuation']),'Unrecognised phase: identify active medicines before applying dosing rules.',1),('CONTINUATION_REGIMEN_REQUIRED',F('treatment_phase','==','continuation'),'Chemotherapy is complete or a postoperative phase is proposed. Confirm the separately selected HER2 regimen for its own assessment, monitoring and support; do not carry chemotherapy dose actions forward.',1),('ONGOING_BASELINE_HISTORY_REVIEW',A(F('assessment_stage','==','ongoing'),F('baseline_lvef_percent','<',55 if c!='00258' else 50)),'Review the historical initiation measurement without treating it as the current on-treatment LVEF. Current LVEF, change and symptoms determine ongoing actions.',bp),('LVEF_STAGE_MISSING',A(F('assessment_stage','missing'),F('lvef_percent','<' if c!='00258' else '<=',55)),'Confirm whether this is baseline or ongoing LVEF: the initiation threshold differs from on-treatment hold criteria. Missing context is not clearance.',bp),('LVEF_CURRENT_MISSING',A(F('lvef_percent','missing'),F('lvef_drop_points','>=',10)),'Obtain current LVEF to interpret the decline. The source ongoing hold requires both LVEF<50% and decline≥10points.',7),('LVEF_CHANGE_MISSING',A(F('lvef_percent','<',50),F('lvef_drop_points','missing')),'Obtain change from baseline and review symptoms; missing change cannot establish the exact on-treatment criterion.',7),('COUNT_EXACT_BOUNDARY',A(chemo,Q(F(anc,'==',1.5),F(plt,'==',100))),'Printed count table uses strict >1.5 and >100. Exact boundary requires source/consultant clarification rather than automatic full-dose clearance.',5),('BASELINE_COUNT_CONTEXT',A(chemo,F('assessment_stage','missing'),F(anc,'>=',1),F(anc,'<',1.5)),'Clarify baseline versus ongoing: initiation excludes ANC<1.5, while later treatment has a source-specific strategy.',4),('BASELINE_NEURO_CONTEXT',A(chemo,F('assessment_stage','missing'),F('neuropathy_grade','==',2)),'Clarify baseline versus ongoing neuropathy. Source baseline '+('caution' if c=='00258' else 'exclusion')+' and later modification thresholds differ.',4)]:rules.append(rule(p,id,w,'consultant_review',parts if 'LVEF' in id or 'CONTINUATION' in id else ['docetaxel','carboplatin'],t,pg))
 # Missing renal method/age can otherwise fall through.
 for id in ['CARBO_CREATININE_AGE_MISSING','CARBO_METHOD_MISSING']:
  r=copy.deepcopy(next(x for x in base90['rule_engine']['rules'] if x['rule_id']==id));r['source']=source(p,5 if c=='00258' else 6);rules.append(r)
 if c=='00722':
  for id in ['CARBO_OLD_CREATININE','CARBO_CREATININE_RISE','CARBO_MYEO_RISK','CARBO_CAP']:
   r=copy.deepcopy(next(x for x in base90['rule_engine']['rules'] if x['rule_id']==id));r['source']=source(p,6);rules.append(r)
  rules.append(rule(p,'HEPATIC_NO_RECOVERY',A(chemo,F('hepatic_delay_days','>=',14),b('hepatic_not_recovered')),'discontinue',['docetaxel','carboplatin'],'No recovery after maximum two-week hepatic delay: discontinue chemotherapy and separately review HER2 continuation.',6))
  rules.append(rule(p,'ACUTE_FN',A(chemo,b('febrile_neutropenia')),'withhold',['docetaxel','carboplatin'],'Current febrile neutropenia: urgent assessment/treatment; historic event-number restart rules do not authorise treatment during active FN.',8))
  rules.append(rule(p,'ECHO_MISSING',b('cardiac_monitoring_overdue'),'consultant_review',parts,'Required echo/MUGA missing or overdue: arrange assessment and a documented clinical decision; do not infer normal function.',4))
 else:
  rules.append(rule(p,'DOC_HEP_COMPANION_REVIEW',A(chemo,Q(F('bilirubin_uln_multiple','>',1),A(Q(F('alt_uln_multiple','>',5),F('ast_uln_multiple','>',5)),F('alp_uln_multiple','>',5)))),'consultant_review',parts,'When docetaxel is delayed for hepatic toxicity, source generally delays companion drugs too. Its bilirubin paragraph permits trastuzumab continuation after review; document each antibody decision explicitly.',6))
  for r in rules:
   if r['rule_id']=='BASELINE_ANC':r['action']['components']=['docetaxel','carboplatin']
 p['rule_engine']['rules']=rules;p['required_inputs']=[];candidates[c]=p
for c,p in candidates.items():
 p['metadata']['sactcheck_encoding_version']='0.84.16';p['metadata']['source_version_verified_date']='2026-10-21';p['metadata']['validation'].update(source_document_checked=True,rule_level_source_reconciliation_status='source_reconciled_v08416_independent_clinical_and_pharmacy_review_pending',consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 p['metadata']['encoding_maturity']=dict(level='source_reconciled_pending_independent_review',label='Source reconciled · independent clinical/pharmacy review pending',source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,audit_release='0.84.16',audit_date='2026-10-21',scope_note='Source/software review does not establish clinical authorisation.')
 save(O/'candidates'/f'{c}.json',p)
print('Wrote five scoped candidate protocols.')
