from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[3];H=Path(__file__).resolve().parent
V='0.84.28';DATE='2026-11-02'
def cond(f,o,v=None):return dict(field=f,operator=o,**({'value':v} if v is not None else {}))
def BOTH(*c):return {'all':list(c)}
def EITHER(*c):return {'any':list(c)}
def add(p,id,w,t,txt,page,components=None):
 p['rule_engine']['rules'].append(dict(rule_id=id,when=w,action=dict(type=t,components=components or ['paclitaxel','carboplatin'],recommendation=txt,**({'block_numeric_dose':True,'dose_calculation':'specialist_review'} if t in ['consultant_review','withhold'] else {})),explanation=txt,source=dict(document='NCCP '+p['metadata']['nccp_regimen_code']+' v'+p['metadata']['nccp_version'],url=p['metadata']['source_url'],page=page)))
def inp(label,typ='boolean',**extra):return dict(dict(label=label,type=typ,required=False,demo_value='',ui_section='clinical',input_role='decision'),**extra)
for c in ['00304','00621']:
 src=next((R/'protocols').glob('*/'+c+'-*.json'));p=json.loads(src.read_text());m=p['metadata'];rules=p['rule_engine']['rules'];I=p['input_definitions'];m.update(source_checked_date=DATE,sactcheck_encoding_version=V,source_retrieval_method='Fresh official PDF downloaded with download=1 query; text extracted and dose tables visually inspected',source_pdf_sha256=hashlib.sha256((H/'sources'/f'{c}.pdf').read_bytes()).hexdigest(),source_text_snapshot_sha256=hashlib.sha256((H/'sources'/f'{c}.txt').read_bytes()).hexdigest(),full_suite_release=V)
 m['encoding_maturity']=dict(level='source_reconciled_rule_encoding',label='Source reconciled · independent clinical/pharmacy review pending',source_reconciled=True,reconciled_release=V,reconciled_date=DATE,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 for d in I.values():
  d['required']=False;d['demo_value']=''
  if 'ctcae_version' in d:
   d.pop('ctcae_version',None);d['grading_source_label']='NCCP toxicity grades; edition unspecified in regimen';d['source_grading_note']='Use clinical grading review; this source does not specify a CTCAE edition.'
 p['required_inputs']=[]
 for r in rules:r['source']=dict(document=f'NCCP {c} v{m["nccp_version"]}',url=m['source_url'],page=r.get('source',{}).get('page',1))
 if c=='00304':
  p['rule_engine']['rules']=[r for r in rules if r['rule_id']!='PROCEED_IF_NO_RESTRICTIVE_RULE']
  I['assessment_type']['options']=[dict(value='baseline',label='Before first treatment'),dict(value='pre_treatment',label='During treatment')]
  I['ecog']=inp('ECOG performance status','select',options=[dict(value=n,label=str(n)) for n in range(5)])
  I['off_label_consent_confirmed']=inp('Off-label indication discussed and local approval/consent confirmed')
  I['baseline_anc']=inp('Baseline ANC before starting','number',min=0,max=50,unit='×10⁹/L',step=.01,ui_section='labs')
  I['renal_measurement_current']=inp('Renal measurement and creatinine timing verified for carboplatin')
  I['current_mucositis_grade']=copy.deepcopy(I['mucositis_grade']);I['current_mucositis_grade']['label']='Current mucositis grade at assessment'
  I['mucositis_grade']['label']='Highest mucositis grade in this episode'
  I['mucositis_occurrence']['visible_when']={'any':[cond('mucositis_grade','>=',2),cond('current_mucositis_grade','>=',2)]}
  I['neuropathy_persistent'].pop('visible_when',None)
  for r in p['rule_engine']['rules']:
   id=r['rule_id'];a=r['action']
   if id=='PACLITAXEL_HEPATIC_75':r['all'][1]=cond('bilirubin_uln_multiple','>=',1.26)
   if id=='PACLITAXEL_HEPATIC_50':r['all'][1]=cond('bilirubin_uln_multiple','>=',2.01)
   if id=='ACTIVE_INFECTION':r['source']['basis']='Conservative clinical safety overlay; not a separately enumerated NCCP00304 exclusion';r['explanation']='Clinically significant infection requires safety review; this is an explicitly labelled local safety overlay.'
   if id=='EXCLUSION_HYPERSENSITIVITY':a['recommendation']='Do not administer before consultant review. Prior mild carboplatin allergy may exceptionally be considered for a controlled desensitisation pathway with immunology advice; this tool does not authorise rechallenge.'
   if id=='SEVERE_HYPERSENSITIVITY':a['type']='permanently_discontinue';a['recommendation']='Stop paclitaxel immediately, treat the severe reaction and do not rechallenge with paclitaxel; consultant review of alternatives.'
   if id.startswith('MUCOSITIS') and id not in ['MUCOSITIS_G2_FOURTH','MUCOSITIS_G3_SECOND']:
    a['recommendation']+=' Confirm current recovery and actual dose history; do not automatically calculate a restart dose.';a['block_numeric_dose']=True
   if id.startswith('PACLITAXEL_HEPATIC_') and id!='PACLITAXEL_HEPATIC_CONTRAINDICATED':
    a['recommendation']+=' This is a percentage of the original dose; reconcile previous reductions and do not automatically re-escalate.';a['block_numeric_dose']=True
   if id in ['NEUROPATHY_G2_INITIAL','NEUROPATHY_G2_PERSISTENT']:
    a['recommendation']+=' Consultant must reconcile the original and actual dose and concurrent toxicity reductions.';a['block_numeric_dose']=True
  add(p,'BASELINE_ANC_EXCLUSION',EITHER(cond('baseline_anc','<',1.5),BOTH(cond('assessment_type','==','baseline'),cond('anc','<',1.5))),'contraindicated','Baseline ANC below1.5 is an exclusion; distinguish this from the subsequent-cycle table.',3)
  add(p,'BASELINE_STAGE_MISSING',BOTH(cond('anc','>=',1),cond('anc','<',1.5),cond('assessment_type','missing')),'consultant_review','Clarify whether this is baseline: starting ANC must be at least1.5; ongoing thresholds differ.',3)
  add(p,'ECOG_ADJUVANT',BOTH(cond('indication_id','==','adjuvant_nsclc'),cond('ecog','>',1)),'consultant_review','Adjuvant source population is ECOG0–1; review fitness and indication.',3)
  add(p,'ECOG_ADVANCED',BOTH(cond('indication_id','==','advanced_nsclc'),cond('ecog','>',2)),'consultant_review','Advanced source population is ECOG0–2; review fitness and indication.',3)
  add(p,'ECOG_UNKNOWN_CONTEXT',BOTH(cond('ecog','>',1),cond('indication_id','missing')),'consultant_review','Confirm indication before interpreting performance status; adjuvant and advanced limits differ.',3)
  add(p,'OFF_LABEL_REVIEW',BOTH(cond('off_label_consent_confirmed','==',False),EITHER(cond('indication_id','==','adjuvant_nsclc'),cond('indication_id','==','advanced_nsclc'))),'consultant_review','Standalone00304a/b indications are off-label in Ireland; confirm local approval and informed consent.',8)
  add(p,'NEOADJUVANT_COMPANION_REQUIRED',cond('indication_id','==','neoadjuvant_nsclc_nivolumab'),'consultant_review','Use NCCP00849 with the selected00304 backbone for the complete nivolumab combination, eligibility and three-cycle maximum. This standalone assessment cannot assess nivolumab.',1)
  add(p,'STANDALONE_CYCLE_LIMIT',BOTH(cond('cycle_number','>',4),EITHER(cond('indication_id','==','adjuvant_nsclc'),cond('indication_id','==','advanced_nsclc'))),'consultant_review','The source standalone course is four21-day cycles; reconcile any proposed additional treatment.',1)
  add(p,'RENAL_RISK_LT60',cond('gfr_ml_min','<',60),'consultant_review','Renal impairment below60mL/min increases myelosuppression risk; independently verify Calvert dosing and monitoring. GFR≤20 prohibition remains controlling.',4,['carboplatin'])
  add(p,'GFR_CAP',cond('gfr_ml_min','>',125),'consultant_review','Do not use GFR above125mL/min in the source Calvert calculation; verify measurement and dosing with pharmacy.',2,['carboplatin'])
  add(p,'RENAL_MEASUREMENT_REVIEW',cond('renal_measurement_current','==',False),'consultant_review','Verify creatinine within48hours when using an estimating formula; after isotopeGFR reassess if creatinine exceeds110% of its original value. No automatic dose based on a stale measurement.',4,['carboplatin'])
  for lo,hi in [(1.25,1.26),(2,2.01)]:add(p,'HEPATIC_GAP_'+str(lo),BOTH(cond('bilirubin_uln_multiple','>',lo),cond('bilirubin_uln_multiple','<',hi)),'consultant_review','Bilirubin falls between the printed source bands. Do not round or infer a definitive dose; obtain specialist review.',4,['paclitaxel'])
  add(p,'HEPATIC_CONTEXT_MISSING',BOTH(cond('bilirubin_uln_multiple','>',1.25),cond('transaminases_uln_multiple','missing')),'consultant_review','Transaminase context is missing for this hepatic dose band. Do not infer a dose from bilirubin alone.',4,['paclitaxel'])
  add(p,'NEUROPATHY_G2_MISSING_HISTORY',BOTH(cond('neuropathy_grade','==',2),cond('neuropathy_persistent','missing')),'consultant_review','Grade2 neuropathy requires reduction; establish whether it persists after an initial reduction before selecting the source25% or50% instruction.',5,['paclitaxel'])
  add(p,'MUCOSITIS_G2_FIRST',BOTH(cond('mucositis_grade','==',2),cond('mucositis_occurrence','==',1)),'withhold','Delay until current mucositis has resolved to grade≤1; first grade2 episode does not require dose reduction under this table. Confirm recovery before restart.',5)
  add(p,'MUCOSITIS_UNKNOWN_OCCURRENCE',BOTH(cond('mucositis_grade','>=',2),cond('mucositis_occurrence','missing')),'withhold','Hold and establish current recovery and occurrence number before interpreting the mucositis dose table.',5)
  add(p,'CURRENT_MUCOSITIS_HOLD',cond('current_mucositis_grade','>=',2),'withhold','Current grade≥2 mucositis requires delay until≤grade1 even if historical grade was entered differently; reconcile the episode before restart.',5)
  p['treatment_phases'][0]['cycles']=[1,2,3,4];p['treatment_phases'][0]['administration'][1]['duration_minutes']=30
  p['treatment_phases'][0]['notes']='Standalone00304a/b: four21-day cycles.00304c uses the separate00849 combination and maximumthreecycles; not this four-cycle course.'
  p['supportive_care'].update(emetogenic_risk='high',script_id='nccp-v8-carboplatin-v08420',summary='High-risk carboplatin antiemetics plus paclitaxel allergy premedication; reconcile dexamethasone/aprepitant into one prescription.')
 else:
  m.update(published_date='2020-12-18',review_date='2030-06-13')
  for r in rules:
   w=r.get('when',{})
   if 'all' in w and len(w['all'])==2 and 'continuation' in json.dumps(w['all'][0]):r['when']=w['all'][1]
   if r['rule_id'] in ['BASELINE_ANC','PAC_ANC_LOW','PAC_PLT_LOW','PAC_PLT_90_OVERLAP','PAC_SEVERE_COUNTS','PAC_FN','PAC_PROLONGED_HISTORY']:r['source']['page']=2
   if r['rule_id'] in ['PAC_NEURO_G2','PAC_NEURO_G3','PAC_OTHER_G2','PAC_OTHER_G3','PAC_INTOLERANCE','PAC_NAMED_G2','PAC_NAMED_G3']:r['source']['page']=3
   if r['rule_id']=='SEVERE_HEPATIC_EXCLUSION':r['action']['recommendation']='Severe hepatic impairment is a source paclitaxel exclusion. Do not administer before specialist review.';r['explanation']=r['action']['recommendation']
  I['treatment_phase']['label']='Paclitaxel monotherapy';I['treatment_phase']['options'][0]['label']='Paclitaxel Days1,8,15 of28'
  I['indication_id']=inp('NCCP indication','select',always_show=True,input_role='context',ui_section='treatment_context',options=[dict(value=x['indication_id'],label=x['code']+' · '+x['description']) for x in p['indications']])
  I['off_label_consent_confirmed']=inp('Off-label indication discussed and local approval/consent confirmed')
  add(p,'OFF_LABEL_REVIEW',cond('off_label_consent_confirmed','==',False),'consultant_review','NCCP00621 indications are outside the licence in Ireland; confirm local approval and informed consent.',5,['paclitaxel'])
  add(p,'PAC_ANC_DECIMAL_GAP',BOTH(cond('anc_x10e9_l','>',.99),cond('anc_x10e9_l','<',1)),'consultant_review','ANC lies between printed0.99 and1.0 bands; do not round into full-dose eligibility. Existing hold remains controlling.',2,['paclitaxel'])
  m['contextual_service_suites']=dict(shared='Existing source-defined shared patient content preserved',lung='patient/00621/lung/; relapsed/refractorySCLC00621d only')
 (H/'proposed'/src.name).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print('Two scoped proposals prepared')
