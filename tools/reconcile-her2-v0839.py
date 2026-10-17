"""Reconcile the five HER2 family protocols against the source tables audited for v0.83.9."""
import json, copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CODES=['00200','00201','00272','00285','00206']
def read(c):
    p=next((ROOT/'protocols/breast').glob(c+'-*.json'))
    return p,json.loads(p.read_text())
def atom(f,op,v=None):
    op='exists' if op=='present' else op
    return dict(field=f,operator=op,**({} if op in ['missing','exists'] else {'value':v}))
def allof(*xs):return {'all':list(xs)}
def anyof(*xs):return {'any':list(xs)}
def band(f,lo,hi):return allof(atom(f,'>=',lo),atom(f,'<=',hi))
def num(d,k,label,unit='',maxval=None):
    d['input_definitions'][k]={'label':label,'type':'number','demo_value':2,'required':False,'min':0,'step':0.01,'unit':unit,'always_show':True,'input_role':'decision',**({'max':maxval} if maxval is not None else {})}
    if k=='crcl_ml_min':d['input_definitions'][k]['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'Retain exact measured creatinine clearance so decimal gaps between the source bands are surfaced for review rather than rounded into a dose band.'}
def boolean(d,k,label):d['input_definitions'][k]={'label':label,'type':'boolean','demo_value':False,'required':False,'always_show':True,'input_role':'decision'}
def select(d,k,label,opts):d['input_definitions'][k]={'label':label,'type':'select','demo_value':opts[0][0],'required':False,'always_show':True,'input_role':'context','options':[{'value':v,'label':s} for v,s in opts]}
def grade(d,k,label):
    select(d,k,label,[(i,'Grade '+str(i)) for i in range(5)]);v=d['input_definitions'][k];v['input_role']='decision';v['unit']='CTCAE grade';v['ctcae_version']='5.0';v['ctcae_source_url']='https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
    v['ctcae_category']=('neuropathy' if 'neuro' in k else 'diarrhoea' if 'diarr' in k else 'pneumonitis' if ('pneumonitis' in k or 'ild' in k) else 'hepatic_alt_ast' if ('liver' in k or 'ast_alt' in k) else 'allergic_reaction' if 'hypersens' in k else 'ppe' if 'hand_foot' in k else 'cardiac' if 'heart_failure' in k else 'other_nonhaematological')
    for o in v['options']:o['ctcae_grade']=o['value']
    v['assessment_guidance']='Assign the toxicity grade using the clinical descriptors; assess symptoms, baseline and functional impact. The source protocol action takes precedence over educational grading.'
def init(c,version=None):
    p,d=read(c);d['input_definitions']={};d['rule_engine']['rules']=[];d['required_inputs']=[];d.pop('assessment_profiles',None)
    if version:d['metadata']['nccp_version']=version
    d['status']='source_reconciled_rule_encoding_pending_independent_validation'
    d['metadata']['sactcheck_encoding_version']='0.83.9'
    d['metadata']['source_checked_date']='2026-10-17'
    d['metadata']['partial_assessment_supported']=True
    d['metadata']['validation'].update(source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
    d['metadata']['encoding_maturity']={'level':'source_reconciled_rule_encoding','label':'Source reconciled · independent clinical/pharmacy review pending','source_reconciled':True,'reconciled_release':'0.83.9','reconciled_date':'2026-10-17','consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}
    d['rule_engine']['missing_data_policy']='Evaluate supplied values independently. Missing values remain unassessed; never infer normality or phase.'
    select(d,'assessment_stage','Assessment stage',[('baseline','Before starting'),('ongoing','During treatment')])
    num(d,'ecog','ECOG performance status',maxval=4)
    for k,l in [('hypersensitivity','Relevant drug/excipient hypersensitivity'),('pregnancy','Pregnant'),('breastfeeding','Breastfeeding')]:boolean(d,k,l)
    return p,d
def rule(d,id,cond,action,components,text,page,**extra):
    if isinstance(components,str):components=[components]
    a={'type':action,'components':components,'recommendation':text,**extra}
    if action=='consultant_review':a.update(dose_calculation='specialist_review',show_in_dose_actions=True)
    d['rule_engine']['rules'].append({'rule_id':id,'when':cond,'action':a,'explanation':text,'source':{'document':f"NCCP {d['metadata']['nccp_regimen_code']} v{d['metadata']['nccp_version']}",'url':d['metadata']['source_url'],'page':page}})
def save(p,d):
    priority=['anc_x10e9_l','anc','platelets_x10e9_l','platelets','treatment_phase','assessment_stage']
    fields=d['input_definitions']; d['input_definitions']={k:fields[k] for k in priority if k in fields}|{k:v for k,v in fields.items() if k not in priority}
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def phase(d,components,days,ident,label,administration):
    return {'phase_id':ident,'name':label,'label':label,'cycle_length_days':days,'administration':administration}
def med(drug,dose,unit,day=1,route='IV infusion',**kw):return {'drug':drug,'dose':{'value':dose,'unit':unit},'day':day,'route':route,**kw}
EMA='https://www.ema.europa.eu/en/documents/product-information/'
def ema(d,product,section):
 d['rule_engine']['rules'][-1]['source'].update(document=product+' EMA SmPC',url=EMA+product+'-epar-product-information_en.pdf',section=section)
def common(d,drug,ecog):
 rule(d,'ALLERGY',atom('hypersensitivity','==',True),'contraindicated',drug,'Relevant drug / excipient allergy: do not administer. SC trastuzumab also contains hyaluronidase.',2)
 rule(d,'PREGNANCY_REVIEW',atom('pregnancy','==',True),'withhold',drug,'Do not proceed without urgent oncology / obstetric risk-benefit review. Pregnancy is not labelled an absolute SmPC contraindication; fetal harm is possible.',2);ema(d,'kadcyla' if drug!='trastuzumab' else 'herceptin','4.6')
 rule(d,'LACTATION_REVIEW',atom('breastfeeding','==',True),'consultant_review',drug,'Breastfeeding must be stopped during treatment and for 7 months after the final dose; discuss the individual plan before treatment.',2);ema(d,'kadcyla' if drug!='trastuzumab' else 'herceptin','4.6')
 rule(d,'ECOG_REVIEW',atom('ecog','>',ecog),'consultant_review',drug,'Outside the NCCP performance-status population: consultant review required.',2)
 for k,l in [('her2_positive','Validated HER2-positive tumour'),('indication_eligible','Full NCCP indication / prior-treatment eligibility confirmed'),('significant_cardiac_disease','Clinically significant cardiac disease'),('cardiac_monitoring_overdue','Required echo / MUGA result overdue or unavailable')]:boolean(d,k,l)
 grade(d,'hypersensitivity_grade','Hypersensitivity reaction')
 for k,l,u in [('baseline_lvef_percent','Baseline LVEF','%'),('lvef_percent','Current LVEF','%'),('lvef_drop_points','Fall from baseline LVEF','percentage points')]:num(d,k,l,u,100)
 rule(d,'HER2_REQUIRED',atom('her2_positive','==',False),'consultant_review',drug,'The source requires validated HER2-positive disease. Reconcile tumour testing before selecting this regimen.',1)
 rule(d,'INDICATION_REVIEW',atom('indication_eligible','==',False),'consultant_review',drug,'The full source indication / prior treatment criteria have not been confirmed. Review the regimen choice.',1)
 rule(d,'CARDIAC_DISEASE',atom('significant_cardiac_disease','==',True),'contraindicated',drug,'Clinically significant cardiac disease is an NCCP exclusion; do not administer without specialist reassessment of the treatment plan.',2)
 rule(d,'ECHO_UNAVAILABLE',atom('cardiac_monitoring_overdue','==',True),'consultant_review',drug,'Required cardiac monitoring is unavailable. Arrange the result and documented consultant decision before the next administration; do not assume normal function.',2)
 rule(d,'REACTION_G4',atom('hypersensitivity_grade','==',4),'discontinue',drug,'Grade 4 hypersensitivity: discontinue and manage the reaction urgently.',4 if drug!='trastuzumab' else 3)
for code in CODES[:4]:
 p,d=init(code);common(d,'trastuzumab',2 if code=='00200' else 3)
 sc=code in ['00272','00285'];weekly=code=='00201';page=4 if code=='00200' else 3
 select(d,'treatment_setting','Treatment setting',[('early','Early breast cancer'),('metastatic','Metastatic breast cancer')])
 for k,l in [('symptomatic_heart_failure','Symptomatic heart failure'),('severe_dyspnoea_at_rest','Severe dyspnoea at rest from advanced malignancy / comorbidity'),('concurrent_anthracycline','Concurrent anthracycline planned'),('fbc_clinical_concern','Blood-count abnormality requiring clinical review')]:boolean(d,k,l)
 num(d,'days_overdue','Days late for planned trastuzumab dose','days')
 if sc:num(d,'days_since_last_dose','Days since the last SC trastuzumab administration','days')
 if code!='00200':rule(d,'SETTING_MISMATCH',atom('treatment_setting','==','early' if code in ['00201','00272'] else 'metastatic'),'consultant_review','trastuzumab','This NCCP card covers '+('metastatic' if code in ['00201','00272'] else 'early')+' breast cancer. Use the setting-specific regimen; do not transfer duration or partner-drug rules.',1)
 early=atom('treatment_setting','==','early') if code=='00200' else atom('baseline_lvef_percent','exists') if code=='00285' else None
 if early:
  rule(d,'EBC_BASELINE_LOW',allof(early,atom('baseline_lvef_percent','<',50)),'withhold','trastuzumab','Baseline LVEF below 50% is outside the source early-breast initiation population. Obtain oncology / cardiology review before starting.',2)
  rule(d,'EBC_BASELINE_BORDERLINE',allof(early,band('baseline_lvef_percent',50,55)),'consultant_review','trastuzumab','The early-breast source specifies LVEF >55%; 50–55% requires clinical judgement. Confirm the cardiac plan before initiation.',2)
 if code=='00200':rule(d,'BASELINE_SETTING_MISSING',allof(atom('baseline_lvef_percent','<=',55),atom('treatment_setting','missing')),'consultant_review','trastuzumab','Select early versus metastatic setting to interpret baseline cardiac eligibility; do not assume the early-breast criteria apply to both.',2)
 if code in ['00200','00201','00272']:
  cond=allof(atom('treatment_setting','==','metastatic'),atom('baseline_lvef_percent','<',50)) if code=='00200' else atom('baseline_lvef_percent','<',50)
  rule(d,'MBC_BASELINE_CARDIAC_REVIEW',cond,'consultant_review','trastuzumab','Reduced baseline LVEF requires individual cardiac risk-benefit assessment. The metastatic source does not assign the early-breast >55% threshold.',2)
 rule(d,'LVEF_HOLD',allof(atom('lvef_percent','<',50),atom('lvef_drop_points','>=',10)),'withhold','trastuzumab','Hold for LVEF <50% AND fall ≥10 percentage points. Repeat after 3 weeks; consider discontinuation if not improved / further decline and refer to cardiology.',page)
 rule(d,'LVEF_CHANGE_MISSING',allof(atom('lvef_percent','<',50),atom('lvef_drop_points','missing')),'consultant_review','trastuzumab','Current LVEF is below 50%. Obtain the baseline change to interpret the combined hold rule; do not infer a small fall.',page)
 rule(d,'HF',atom('symptomatic_heart_failure','==',True),'discontinue' if weekly else 'withhold','trastuzumab','Discontinue and refer urgently for cardiology review.' if weekly else 'Withhold for urgent assessment. NCCP says consider discontinuation for symptomatic heart failure; the final decision requires oncology / cardiology review.',page)
 rule(d,'DYSPNOEA_REST',atom('severe_dyspnoea_at_rest','==',True),'contraindicated','trastuzumab','Severe dyspnoea at rest from advanced malignancy / comorbidity is a product contraindication. Urgent clinical review.',page);ema(d,'herceptin','4.3')
 rule(d,'ANTHRACYCLINE_OVERLAP',atom('concurrent_anthracycline','==',True),'withhold','trastuzumab','Do not give concurrently with an anthracycline under this card. Review the complete source-specific regimen and cardiac risk before administration.',page+1)
 rule(d,'FBC_REVIEW',atom('fbc_clinical_concern','==',True),'consultant_review','trastuzumab','Reversible chemotherapy-induced myelosuppression does not itself mandate a trastuzumab dose reduction. Review complications and any companion chemotherapy separately.',page)
 if sc:
  rule(d,'SC_LATE',atom('days_overdue','>',0),'consultant_review','trastuzumab','Give the missed SC 600 mg dose as soon as clinically appropriate. No loading dose; reset appointments to preserve at least 3 weeks between SC administrations.',2)
  rule(d,'SC_INTERVAL_TOO_SHORT',atom('days_since_last_dose','<',21),'withhold','trastuzumab','The interval between SC trastuzumab administrations must be at least 3 weeks. Do not use an IV loading or catch-up dose.',2)
 else:
  dose,load=(2,4) if weekly else (6,8)
  rule(d,'IV_LATE_WITHIN_WEEK',allof(atom('days_overdue','>',0),atom('days_overdue','<=',7)),'consultant_review','trastuzumab',f'One week or less late: give maintenance {dose} mg/kg as soon as clinically appropriate, then resume the previous schedule. Verify prior dose and cardiac review.',2 if weekly else 3)
  rule(d,'IV_LATE_OVER_WEEK',atom('days_overdue','>',7),'consultant_review','trastuzumab',f'More than one week late: source describes {load} mg/kg re-loading at clinician discretion, followed by {dose} mg/kg '+('weekly.' if weekly else 'every 3 weeks.')+' Confirm the actual history; no automatic restart dose is issued.',2 if weekly else 3)
 dose=600 if sc else 2 if weekly else 6;days=7 if weekly else 21
 note='SC fixed dose; no loading. Companion drugs require their own regimen rules.' if sc else f'Initial loading {4 if weekly else 8} mg/kg; omit loading when continuing from a trastuzumab-containing regimen. Review missed-dose history separately.'
 d['treatment_phases']=[phase(d,[],days,'trastuzumab','Trastuzumab component',[med('trastuzumab',dose,'mg' if sc else 'mg/kg',route='SC injection' if sc else 'IV infusion',notes=note)])]
 d['metadata']['schedule_summary']=note
 d['metadata']['audit_limitations']=['Other cancer medicines in combination indications require the complete combination protocol; this card encodes trastuzumab only.','Independent clinical and pharmacy validation pending.']
 save(p,d)
# Metastatic T-DM1 uses its own toxicity table, NOT the early-breast 00659 table.
p,d=init('00206');drug='trastuzumab emtansine';common(d,drug,2)
for k,l,u in [('platelets','Platelets','×10⁹/L'),('ast_uln_multiple','AST / ULN','×ULN'),('alt_uln_multiple','ALT / ULN','×ULN'),('bilirubin_uln_multiple','Bilirubin / ULN','×ULN')]:num(d,k,l,u)
for k,l in [('symptomatic_chf','Symptomatic congestive heart failure'),('lvef_repeat_below40','Repeat LVEF within 3 weeks confirms below 40%'),('lvef_repeat_not_recovered','After 40–45% hold, repeat LVEF has not recovered to within 10 points of baseline'),('pulmonary_toxicity','Diagnosed treatment-related ILD / pneumonitis'),('nodular_regenerative_hyperplasia','Confirmed nodular regenerative hyperplasia'),('dili_no_alternative_cause','No other likely cause for combined transaminase / bilirubin elevation'),('prior_platelet_hold','Currently held for platelets below 50'),('further_reduction_required','Another dose reduction is required'),('severe_renal_impairment','Severe renal impairment'),('severe_hepatic_impairment','Severe hepatic impairment')]:boolean(d,k,l)
grade(d,'peripheral_neuropathy_grade','Peripheral neuropathy');select(d,'dose_reduction_level','Current dose level',[(0,'3.6 mg/kg'),(1,'3 mg/kg'),(2,'2.4 mg/kg')])
rule(d,'BASELINE_LVEF',atom('baseline_lvef_percent','<',50),'withhold',drug,'Baseline LVEF must be ≥50% in the NCCP inclusion criteria. Obtain specialist review before initiation.',2)
for id,cond,txt in [('PLT_LT25',atom('platelets','<',25),'Hold until platelets ≥75, then reduce one dose level.'),('PLT_25_50',allof(atom('platelets','>=',25),atom('platelets','<',50)),'Hold until platelets ≥75, then resume at the same dose level.'),('PLT_RECOVERY',allof(atom('prior_platelet_hold','==',True),allof(atom('platelets','>=',50),atom('platelets','<',75))),'A prior platelet hold has not recovered to ≥75. Continue holding; do not treat 50–74 as recovery.')]:rule(d,id,cond,'withhold',drug,txt+' Restart requires review of the actual current dose and all other toxicities.',3)
for field in ['ast_uln_multiple','alt_uln_multiple']:
 rule(d,field+'_G3',allof(atom(field,'>',5),atom(field,'<=',20)),'withhold',drug,'Hold for transaminases >5–20 ×ULN until grade ≤2, then reduce one dose level. Grade 2 alone does not trigger the metastatic table hold.',3)
 rule(d,field+'_G4',atom(field,'>',20),'discontinue',drug,'Transaminases >20 ×ULN: discontinue.',3)
for id,lo,hi,txt in [('G2',1.5,3,'same dose level'),('G3',3,10,'one lower dose level')]:rule(d,'BILI_'+id,allof(atom('bilirubin_uln_multiple','>',lo),atom('bilirubin_uln_multiple','<=',hi)),'withhold',drug,'Hold bilirubin until grade ≤1, then consider '+txt+' after clinical review.',3)
rule(d,'BILI_SOURCE_CONFLICT',allof(atom('bilirubin_uln_multiple','>',10),atom('bilirubin_uln_multiple','<=',20)),'withhold',drug,'SOURCE DISCREPANCY: NCCP Table 5 prints grade 4 >20 ×ULN, leaving 10–20 unassigned; current EMA SmPC defines grade 4 >10 and says discontinue. Do not administer; urgent consultant/pharmacy reconciliation with the SmPC is required.',3)
d['rule_engine']['rules'][-1]['source']['corroborating_source']={'url':EMA+'kadcyla-epar-product-information_en.pdf','section':'4.2, MBC Table 2, page 6'}
rule(d,'BILI_G4',atom('bilirubin_uln_multiple','>',20),'discontinue',drug,'Bilirubin >20 ×ULN: discontinue under both the printed NCCP band and the current EMA SmPC.',3)
dili=allof(anyof(atom('ast_uln_multiple','>',3),atom('alt_uln_multiple','>',3)),atom('bilirubin_uln_multiple','>',2))
rule(d,'DILI_CONFIRMED',allof(dili,atom('dili_no_alternative_cause','==',True)),'permanently_discontinue',drug,'Transaminases >3 and bilirubin >2 ×ULN without another likely cause: permanently discontinue.',3)
rule(d,'DILI_CAUSE_UNRESOLVED',allof(dili,atom('dili_no_alternative_cause','missing')),'withhold',drug,'Combined hepatic thresholds require urgent causal assessment. If no other likely cause, permanently discontinue; do not assume an alternative cause.',3)
rule(d,'LVEF_LT40',atom('lvef_percent','<',40),'withhold',drug,'Hold and repeat LVEF within 3 weeks; discontinue if below 40% is confirmed.',4)
rule(d,'LVEF_40_45_HOLD',allof(band('lvef_percent',40,45),atom('lvef_drop_points','>=',10)),'withhold',drug,'Hold and repeat LVEF within 3 weeks. If not recovered to within 10 points of baseline, discontinue.',4)
rule(d,'LVEF_40_45_REPEAT',allof(band('lvef_percent',40,45),atom('lvef_drop_points','<',10)),'proceed_with_caution',drug,'Metastatic table permits continuation with repeat LVEF within 3 weeks; review all other risks. This differs from early-breast T-DM1.',4)
rule(d,'LVEF_CHANGE_MISSING',allof(band('lvef_percent',40,45),atom('lvef_drop_points','missing')),'consultant_review',drug,'The baseline LVEF change is required in the metastatic 40–45% branch. Do not infer a small fall.',4)
for id,field,txt in [('HF','symptomatic_chf','Symptomatic CHF: discontinue.'),('LVEF_REPEAT_LT40','lvef_repeat_below40','Persistent LVEF below 40% on the required repeat: discontinue.'),('LVEF_REPEAT_NO_RECOVERY','lvef_repeat_not_recovered','Failure to recover after the 40–45% / ≥10-point decline hold: discontinue.')]:rule(d,id,atom(field,'==',True),'discontinue',drug,txt,4)
for id,field,txt in [('ILD','pulmonary_toxicity','Diagnosed ILD / pneumonitis, any grade: permanently discontinue.'),('NRH','nodular_regenerative_hyperplasia','Confirmed NRH: permanently discontinue.')]:rule(d,id,atom(field,'==',True),'permanently_discontinue',drug,txt,4)
rule(d,'NEUROPATHY',atom('peripheral_neuropathy_grade','>=',3),'withhold',drug,'Hold neuropathy until grade ≤2. A reduction may be considered at retreatment after review.',4)
rule(d,'DOSE_FLOOR',allof(atom('dose_reduction_level','==',2),atom('further_reduction_required','==',True)),'discontinue',drug,'Further reduction below 2.4 mg/kg: discontinue. Never re-escalate after a dose reduction.',2)
for f in ['severe_renal_impairment','severe_hepatic_impairment']:rule(d,f.upper(),atom(f,'==',True),'consultant_review',drug,'Severe organ impairment has insufficient dosing data. Obtain specialist review and close monitoring; do not invent a percentage reduction.',3)
d['treatment_phases']=[phase(d,[],21,'metastatic_tdm1','Metastatic T-DM1 until progression / unacceptable toxicity',[med(drug,3.6,'mg/kg',notes='Not the 14-cycle early-breast course. Subsequent levels 3 and 2.4 mg/kg; never re-escalate.')])]
d['dose_levels']={'trastuzumab emtansine':{'0':'3.6 mg/kg','-1':'3 mg/kg','-2':'2.4 mg/kg','-3':'discontinue'}}
d['metadata']['audit_limitations']=['NCCP bilirubin Table 5 leaves >10–20 ×ULN unassigned; EMA SmPC says discontinue above 10. Encoded hold plus urgent source reconciliation, not silent normality.','Independent clinical and pharmacy review pending.']
save(p,d)
print('Reconciled five HER2 protocols with separate indication / formulation rules.')
