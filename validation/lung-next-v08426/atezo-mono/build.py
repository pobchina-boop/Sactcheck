import json,copy,hashlib,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[3]; OUT=pathlib.Path(__file__).parent
load=lambda p:json.loads((ROOT/p).read_text())
save=lambda p,d:p.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
combo=load('protocols/lung/00689-atezolizumab-carboplatin-etoposide.json')
settings={'00544':('lung/00544-atezolizumab-1200-mg-monotherapy-21-day.json','14',1200,21,'https://healthservice.hse.ie/documents/6644/544_v14_Atezolizumab_21_Day_Monotherapy.pdf'),'00592':('shared/00592-atezolizumab-840-mg-monotherapy-14-day.json','3',840,14,'https://healthservice.hse.ie/documents/6398/592_v3_Atezolizumab_840mg_Monotherapy_14_Day.pdf'),'00593':('lung/00593-atezolizumab-maintenance.json','10a',1680,28,'https://healthservice.hse.ie/documents/6399/593_v10a_Atezolizumab_1680mg_Monotherapy.pdf')}
smpc='https://www.ema.europa.eu/en/documents/product-information/tecentriq-epar-product-information_en.pdf'
def cond(f,op,v):return {'field':f,'operator':op,'value':v}
def fields(o):
 if isinstance(o,dict):
  if 'field'in o:yield o['field']
  for v in o.values():yield from fields(v)
 elif isinstance(o,list):
  for v in o:yield from fields(v)
def rule(id,w,t,msg,url,page='4–7'):
 return {'id':id,'priority':20,'when':w,'action':{'type':t,'components':['atezolizumab'],'message':msg,'recommendation':msg},'source':{'document':'Source-specific atezolizumab monotherapy','page':page,'url':url,'checked_date':'2026-10-29'},'explanation':msg}
def inp(label,typ='boolean',**kw):return dict(label=label,type=typ,required=False,demo_value=None,ui_section='clinical',input_role='decision',**kw)
for code,(file,ver,dose,days,url) in settings.items():
 p=load('protocols/'+file);save(OUT/'research'/('baseline-'+code+'.json'),p)
 rs=copy.deepcopy([r for r in combo['rule_engine']['rules'] if r['action'].get('components')==['atezolizumab']])
 for r in rs:
  r['source']={'document':f'NCCP {code} v{ver}','page':'4–7','url':url,'checked_date':'2026-10-29'}
  if r['id'].startswith('ICI_INFUSION_REACTION'):
   r['when']={'all':[cond('infusion_reaction_grade','>=',1 if 'G1_G2'in r['id'] else 3),cond('infusion_reaction_grade','<=',2 if 'G1_G2'in r['id'] else 4)]}
  if r['id']=='MISSED_ATEZO_DOSE':
   for k in ['message','recommendation']:r['action'][k]=f'Give the missed dose as soon as possible after clinical review; reset the next dose to {days} days after administration. Do not double a dose.'
   r['explanation']=r['action']['message']
 for f in set(fields(rs)):
  p['input_definitions'][f]=copy.deepcopy(combo['input_definitions'][f])
 defs=p['input_definitions']
 boolean={'active_infection_requiring_therapy':'Clinically significant active infection requiring therapy','adult_patient':'Adult patient','symptomatic_cns_metastases':'Symptomatic CNS metastases','symptomatic_ild':'Symptomatic interstitial lung disease','clinically_significant_autoimmune_disease':'Clinically significant autoimmune disease','medical_condition_requires_immunosuppression':'Medical condition requires systemic immunosuppression exceeding 10 mg/day prednisolone equivalent (exclude inhaled/topical)','prior_pd1_pdl1_treatment':'Previous PD-1/PD-L1 treatment','myocarditis_suspected':'Suspected immune myocarditis (urgent assessment before grade confirmed)','haemodialysis':'Receiving haemodialysis','adjuvant_source_criteria_met':'Adjuvant source criteria confirmed: resected stage II–IIIA AJCC7, predominantly non-squamous, PD-L1 ≥50%, EGFR/ALK negative, platinum timing and no progression','first_line_source_criteria_met':'First-line metastatic NSCLC criteria confirmed: high PD-L1, EGFR/ALK negative, no previous systemic stage IV treatment; perioperative chemotherapy interval ≥6 months if applicable','post_chemo_source_criteria_met':'Post-chemotherapy NSCLC: prior platinum doublet and prior targeted therapy for EGFR/ALK if applicable','sclc_induction_completed':'ES-SCLC combination induction completed before maintenance','uc_post_platinum_criteria_met':'Urothelial post-platinum source eligibility confirmed','uc_cisplatin_ineligible_pdl1_criteria_met':'Urothelial cisplatin-ineligible and PD-L1 ≥5% confirmed'}
 for f,label in boolean.items():defs[f]=inp(label)
 defs['ecog']=inp('ECOG performance status','number',min=0,max=4,step=1)
 defs['crcl_ml_min_exact']=inp('Stable creatinine clearance (not immune nephritis ratio)','number',min=0,max=250,step=.1,unit='mL/min',renal_input={'mode':'source_threshold_numeric','exact_value_required':False,'source_url':url,'reason':'Source table boundary at 30 mL/min; stable impairment is distinct from immune nephritis.'})
 defs['hepatic_impairment']=inp('Stable hepatic impairment category','select',options=[{'value':v,'label':v.capitalize()} for v in ['none','mild','moderate','severe']])
 for f,id,t,msg,pos in [
 ('adult_patient','ADULT_ELIGIBILITY','consultant_review','NCCP adult regimen; verify specialist eligibility before treatment.',False),('hypersensitivity','ICI_EXCLUSION_HYPERSENSITIVITY','contraindicated','Relevant hypersensitivity is an exclusion; do not administer atezolizumab.',True),('active_infection_requiring_therapy','ICI_ACTIVE_INFECTION_REQUIRING_THERAPY','consultant_review','Clinically significant active infection is a source exclusion; assess and treat before treatment.',True),('symptomatic_cns_metastases','SYMPTOMATIC_CNS','consultant_review','Symptomatic CNS metastases are a source exclusion; specialist review before treatment.',True),('symptomatic_ild','SYMPTOMATIC_ILD','consultant_review',('Symptomatic ILD is a source caution; individual specialist assessment.' if code=='00592' else 'Symptomatic ILD is a source exclusion; specialist review before treatment.'),True),('medical_condition_requires_immunosuppression','IMMUNOSUPPRESSION_EXCLUSION','consultant_review',('Systemic immunosuppression >10 mg/day prednisolone equivalent is a source caution; inhaled/topical steroids excluded.' if code=='00592' else 'Medical conditions requiring systemic immunosuppression >10 mg/day prednisolone equivalent are a source exclusion; inhaled/topical steroids excluded.'),True),('clinically_significant_autoimmune_disease','AUTOIMMUNE_CAUTION','consultant_review','Autoimmune disease requires individual risk/benefit assessment, not an automatic dose reduction.',True),('prior_pd1_pdl1_treatment','PRIOR_PD1_PDL1_REVIEW','consultant_review','Check current NCCP advice for sequential checkpoint treatment; do not assume eligibility.',True),('myocarditis_suspected','SUSPECTED_MYOCARDITIS','withhold','Withhold atezolizumab and obtain urgent cardiology evaluation for suspected myocarditis. Assess overlap with myositis and myasthenia. Confirmed Grade ≥2 requires permanent discontinuation.',True)]:rs.append(rule(id,cond(f,'==',pos),t,msg,smpc if f=='myocarditis_suspected' else url,'14–15' if f=='myocarditis_suspected' else '2–3'))
 rs.append(rule('ECOG_ELIGIBILITY',cond('ecog','>',1),'consultant_review','NCCP eligibility is ECOG 0–1; ECOG >1 needs specialist eligibility review.',url,'2–3'))
 rs.append(rule('ICI_PREGNANCY_OR_BREASTFEEDING_REVIEW',{'any':[cond('pregnancy','==',True),cond('breastfeeding','==',True)]},'consultant_review','Urgent specialist discussion of pregnancy/breastfeeding risk before treatment. Effective contraception during treatment and for 5 months after the last dose.',smpc,'4.6'))
 rs.append(rule('RENAL_LIMITED_DATA',{'any':[cond('crcl_ml_min_exact','<',30),cond('haemodialysis','==',True)]},'consultant_review','NCCP expects no adjustment in severe stable renal impairment/dialysis; SmPC severe renal evidence is limited. Individual review; no invented reduction. Distinguish immune nephritis.',url,'7'))
 if code!='00544':rs.append(rule('RENAL_30_SOURCE_GAP',cond('crcl_ml_min_exact','==',30),'consultant_review','The source table prints >30 and <30 mL/min and does not allocate exactly 30. Confirm with pharmacy; do not invent a reduction.',url,'7'))
 rs.append(rule('HEPATIC_SEVERE_LIMITED_DATA',cond('hepatic_impairment','==','severe'),'consultant_review','NCCP expects no adjustment for stable severe hepatic impairment; SmPC states this population has not been studied. Specialist review; do not diagnose immune hepatitis from stable impairment.',url,'7'))
 desc=['Locally advanced/metastatic NSCLC after prior chemotherapy; EGFR/ALK-positive disease requires prior appropriate targeted therapy.','Locally advanced/metastatic urothelial carcinoma after prior platinum chemotherapy.','Cisplatin-ineligible locally advanced/metastatic urothelial carcinoma with PD-L1 ≥5%.','First-line metastatic NSCLC: PD-L1 ≥50% tumour cells OR ≥10% immune cells; no EGFR/ALK alteration.']
 adj='Adjuvant after complete resection and platinum chemotherapy: high-risk stage II–IIIA (AJCC7), predominantly non-squamous NSCLC, PD-L1 ≥50%, no EGFR/ALK alteration; maximum 12 months.'
 maint='ES-SCLC maintenance after completed combination induction; not de novo monotherapy.'
 desc+=([maint,adj] if code=='00593' else [adj,maint])
 oldinds=copy.deepcopy(p['indications']);p['indications']=[{'indication_id':code+x,'code':code+x,'description':d} for x,d in zip('abcdef',desc)]
 for old in oldinds:
  old['indication_id']=old.get('indication_id',old.get('id',old.get('code')))
  if old['indication_id'] not in [i['indication_id'] for i in p['indications']]:
   old['description']='Legacy '+('urothelial carcinoma' if 'gu'in old['indication_id'] else 'lung cancer')+' context alias; select the specific current NCCP indication before confirming eligibility.';old['code']=code+' (legacy alias; not an NCCP indication letter)';p['indications'].append(old)
 defs.setdefault('indication_id',inp('Indication','select'))['options']=[{'value':i['indication_id'],'label':i['description']} for i in p['indications']]
 criteria={'a':'post_chemo_source_criteria_met','b':'uc_post_platinum_criteria_met','c':'uc_cisplatin_ineligible_pdl1_criteria_met','d':'first_line_source_criteria_met',('f' if code=='00593' else 'e'):'adjuvant_source_criteria_met',('e' if code=='00593' else 'f'):'sclc_induction_completed'}
 for letter,f in criteria.items():
  for value,suffix,msg in [(False,'NOT_MET','Source eligibility criterion is not met; do not proceed without consultant review.'),(None,'UNASSESSED','Source eligibility is unassessed; confirm the indication-specific criteria before prescribing.')]:
   w={'all':[cond('indication_id','==',code+letter),cond(f,'==' if value is False else 'missing',value)]};rs.append(rule('INDICATION_'+letter.upper()+'_'+suffix,w,'consultant_review',msg+' '+defs[f]['label'],url,'1–3'))
 for old in p['indications'][6:]:rs.append(rule('LEGACY_'+re.sub(r'\W','_',old['indication_id']).upper(),cond('indication_id','==',old['indication_id']),'consultant_review',old['description'],url,'1'))
 for f,d in defs.items():
  d['required']=False;d['demo_value']=None;d.pop('visible_when',None)
  if f.endswith('_grade'):
   for k in ['ctcae_version','ctcae_source_url']:d.pop(k,None)
   d['grading_source_label']=('NCI-CTCAE, current edition unspecified in NCCP source' if code=='00544' else 'NCI-CTCAE version 4.0 stated in NCCP source');d['grading_source_url']=url;d['source_grading_note']='The source provides treatment-action bands, not a complete grading table. Confirm the named event and source grading before selection.';d['assessment_guidance']=d['source_grading_note']
   for opt in d.get('options',[]):opt['description']=f"Source Grade {opt['value']} for the named event; confirm event-specific criteria. This option is not an independent grading diagnosis."
 p['required_inputs']=[];p['rule_engine']['rules']=rs
 iv=f'{dose} mg IV on Day 1 every {days} days; first infusion over 60 minutes, subsequent infusions over 30 minutes if tolerated.'
 row={'day':1,'order':1,'drug':'atezolizumab','dose':{'value':dose,'unit':'mg'},'route':'IV','notes':iv+' Dilute in 250 mL sodium chloride 0.9%.'}
 if code=='00544':row=copy.deepcopy(combo['treatment_phases'][1]['administration'][0])
 duration='Adjuvant: maximum 12 months. Advanced NSCLC/urothelial and ES-SCLC maintenance: until progression or unacceptable toxicity. ES-SCLC requires completed induction; this suite contains no induction chemotherapy.'
 p['treatment_phases']=[{'phase_id':'atezolizumab','label':'Atezolizumab monotherapy','cycle_length_days':days,'cycles':[],'planned_cycles':None,'active_drugs':['atezolizumab'],'duration_text':duration,'administration':[row]}]
 m=p['metadata'];m.update(source_checked_date='2026-10-29',sactcheck_encoding_version='0.84.26',source_document_pages=9 if code=='00592' else 10,indication=' '.join(desc),source_url=url,source_pdf_sha256=hashlib.sha256((OUT/'research'/(code+'.pdf')).read_bytes()).hexdigest(),source_text_snapshot_sha256=hashlib.sha256((OUT/'research'/(code+'.txt')).read_bytes()).hexdigest())
 m['regimen_card']={'contexts':[{'id':i['indication_id'],'indication_id':i['indication_id'],'cycle_length_days':days,'intent':'adjuvant' if 'Adjuvant'in i['description'] else 'disease_control','duration_text':duration} for i in p['indications'][:6]],'provenance':{'source':url,'reviewed':False}}
 for key in ['validation','encoding_maturity']:
  m.setdefault(key,{}).update(consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,software_test_release='0.84.26')
 m['review_date']='2029-02-19' if code=='00592' else '2026-09-09'
 m['safety_note']='Source-reconciled prototype, not clinically authorised. Omitted inputs remain unassessed. Stable impairment is distinct from immune toxicity; attribution and setting-specific eligibility are required.'
 save(OUT/'proposed'/pathlib.Path(file).name,p)
