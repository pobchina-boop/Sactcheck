import json,hashlib,re
from pathlib import Path
D=Path(__file__).resolve().parent; R=D.parents[2]; old=R/'validation/lung-next-v08423/atezo'; fname='00689-atezolizumab-carboplatin-etoposide.json'; date='2026-10-29'; ema='https://www.ema.europa.eu/en/documents/product-information/tecentriq-epar-product-information_en.pdf'
def save(p,v): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
b= D/'baseline-protocol.json'
if not b.exists(): b.write_bytes((R/'protocols/lung'/fname).read_bytes())
p=json.loads(b.read_text());a=json.loads((old/'authoring.json').read_text())['regimens']['00689']
def update(o):
 if isinstance(o,dict):
  for k,v in o.items():
   if k in ['source_checked','source_checked_date','checked','checked_date','audit_date','reconciled_date'] and v=='2026-10-26':o[k]=date
   elif k in ['suite_release','full_suite_release','sactcheck_encoding_version','software_test_release','audit_release','reconciled_release'] and v=='0.84.23':o[k]='0.84.26'
   else:update(v)
 elif isinstance(o,list):
  for v in o:update(v)
update(p);update(a)
for ext,key in [('pdf','source_pdf_sha256'),('txt','source_text_snapshot_sha256')]:p['metadata'][key]=hashlib.sha256((D/'research'/('nccp.'+ext)).read_bytes()).hexdigest()
p['metadata']['supplemental_sources']=[{'document':'EMA Tecentriq product information, current 21 July 2026','url':ema,'checked_date':date,'pages':'14–15','scope':'Suspected cardiac immune toxicity, myositis steroid taper failure and overlap warning; separately attributed from NCCP v4.'}]
p['metadata']['encoding_maturity']['scope_note']='NCCP v4 retrospective audit, with separately cited current EMA cardiac suspicion and myositis recovery pathways. Independent consultant and oncology pharmacy review remains pending.'
new=[('myocarditis_suspected','Clinician suspects immune-mediated myocarditis','ICI_MYOCARDITIS_SUSPECTED','withhold','14','Withhold atezolizumab for suspected immune-mediated myocarditis and obtain prompt cardiology consultation, diagnostic work-up and clinical management. Symptoms alone do not establish a confirmed grade. Diagnosed Grade 2 or higher myocarditis requires permanent discontinuation.'),('pericardial_disorder_suspected','Suspected Grade 1 pericarditis or Grade 2 or higher pericardial disorder','ICI_PERICARDIAL_SUSPECTED','withhold','15','Withhold atezolizumab for suspected Grade 1 pericarditis or suspected Grade 2 or higher pericardial disorder; obtain prompt cardiology work-up and clinical management. Confirmed Grade 2 or higher pericardial disorder requires permanent discontinuation.'),('myositis_steroid_taper_failed_12_weeks','Confirmed immune myositis: unable to reduce prednisone-equivalent to 10 mg/day or less within 12 weeks after onset','ICI_MYOSITIS_STEROID_TAPER_FAILURE','permanently_discontinue','14','Permanently discontinue atezolizumab when confirmed immune-mediated myositis cannot be managed with corticosteroids reduced to 10 mg/day prednisone-equivalent or less within 12 weeks after onset. This is a clinician-confirmed myositis recovery criterion, not an isolated current steroid dose.')]
for field,label,id,action,page,msg in new:
 p['input_definitions'][field]={'label':label,'type':'boolean','required':False,'demo_value':'','input_role':'decision','ui_section':'clinical','assessment_guidance':msg}
 p['rule_engine']['rules'].append({'id':id,'priority':10,'when':{'field':field,'operator':'==','value':True},'action':{'type':action,'components':['atezolizumab'],'message':msg,'recommendation':msg},'source':{'document':'EMA Tecentriq SmPC section 4.4','page':page,'url':ema,'checked_date':date},'explanation':msg})
p['input_definitions']['myocarditis_grade']['label']='Clinician-confirmed immune-mediated myocarditis grade'
p['input_definitions']['myocarditis_grade']['assessment_guidance']='Grade a diagnosed event. For clinical suspicion before confirmation use the suspected myocarditis input; obtain urgent cardiology assessment.'
p['input_definitions']['pericardial_disorder_grade']['label']='Confirmed immune-mediated pericardial disorder grade'
for r in p['rule_engine']['rules']:
 if r['id']=='ICI_MYOCARDITIS_G2_PLUS':
  for k in ['message','recommendation']:r['action'][k]='Permanently discontinue atezolizumab for diagnosed Grade 2 or higher immune-mediated myocarditis. Obtain urgent cardiology management. Suspected myocarditis before confirmation uses the separate withhold pathway.'
  r['explanation']=r['action']['message']
# The etoposide value is a source threshold, whereas Calvert GFR is continuous.
p['input_definitions']['etoposide_crcl_exact_ml_min']['renal_input'].update(mode='source_threshold_numeric',exact_value_required=False,reason='Etoposide source thresholds are <10, 10–50 and >50 mL/min; this is distinct from continuous GFR for the carboplatin Calvert calculation.')
def prose(o):
 if isinstance(o,dict):return {k:(v if k in ['id','url','protocol_id','source_ids','script_id','source_title_exact'] else prose(v)) for k,v in o.items()}
 if isinstance(o,list):return [prose(v) for v in o]
 if isinstance(o,str):
  # Repair existing display prose only, preserving source and machine identifiers.
  for x,y in {'randomised201':'randomised 201','and202':'and 202','four21-day':'four 21-day','IVDay1':'IV Day 1','NCISV8':'NCIS V8','AUC5':'AUC 5','SC1875':'SC 1875','separate1680':'separate 1680','then100':'then 100','NCCP00593':'NCCP 00593','OS12.3':'OS 12.3','PFS5.2':'PFS 5.2','HR0.76':'HR 0.76','HR0.77':'HR 0.77','versus10.3':'versus 10.3','versus4.3':'versus 4.3','Published2021':'Published 2021','the2018':'the 2018','new2026':'new 2026','CI0.':'CI 0.','within48hours':'within 48 hours','every3–6weeks':'every 3–6 weeks'}.items():o=o.replace(x,y)
  o=re.sub(r'\b(Days?|Grade|Table|ECOG|atezolizumab|etoposide|Platelets)(?=\d)',r'\1 ',o)
  o=re.sub(r'(\d)(months|hours|weeks|mg|cm)\b',r'\1 \2',o)
  o=o.replace('follow-up22.9','follow-up 22.9').replace('follow-up13.9','follow-up 13.9').replace('1680 mgIV','1680 mg IV')
  return o
 return o
a=prose(a)
a['patient']['sources']=[dict(s,title='EMA Tecentriq current product information',url=ema) if s['id']=='smpc' else s for s in a['patient']['sources']]
trial={'label':'IMbrella A / IMpower133 exploratory long-term follow-up (2024)','url':'https://pubmed.ncbi.nlm.nih.gov/39306923/'}
a['patient']['sources'].append({'id':'trial-long-term','title':trial['label'],'url':trial['url']})
a['evidence']['endpoints'].append({'endpoint':'OS','metric':'Five-year overall survival (exploratory atezolizumab arm)','result_text':'Five-year OS 12% (95% CI 7–17) in the reported IMpower133/IMbrella A atezolizumab cohort.','interpretation':'No long-term control-arm data were available; this does not estimate a five-year comparative benefit or an individual prognosis.','analysis_status':'2024 exploratory publication; cutoff 16 March 2023; median follow-up 59.4 months. Eighteen of 26 eligible patients rolled over into IMbrella A; selection and incomplete long-term comparator follow-up limit interpretation.','sources':[trial]})
a['evidence']['sources'].append(trial);a['evidence']['limitations'].append('The 2024 IMbrella A extension is exploratory with selective rollover and no long-term control-arm data; its five-year result must not be presented as a randomised five-year comparison.')
warning='Myocarditis, myositis and myasthenia gravis can overlap. If one is suspected, assess for the other syndromes; apply the most stringent applicable event-specific action. Suspected myocarditis requires withholding and prompt cardiology work-up; diagnosed Grade 2 or higher requires permanent discontinuation.'
a['clinical']['key_points'].append(warning)
a['clinical']['ongoing'].append('For confirmed immune myositis, inability to reduce corticosteroids to 10 mg/day prednisone-equivalent or less within 12 weeks after onset requires permanent discontinuation under the current EMA SmPC; do not infer this from an unrelated steroid prescription.')
a['clinical']['rationale']['sources'].append({'label':'EMA Tecentriq SmPC section 4.4, pages 14–15','url':ema})
a['patient']['urgent_extra']+=' Report new muscle weakness, drooping eyelids or difficulty swallowing immediately, especially with chest symptoms or breathlessness; immune effects on muscles, nerves and the heart can occur together.'
a['patient']['urgent_source_ids']=list(dict.fromkeys(a['patient']['urgent_source_ids']+['smpc']))
a['patient']['consent_support']+=' Rare serious heart, muscle and nerve immune effects can overlap and need urgent assessment.'
a['journey']['clinical_notes'].append(warning) if isinstance(a['journey']['clinical_notes'],list) else None
a['protocol_metadata']={'source_checked_date':date,'full_suite_release':'0.84.26','sactcheck_encoding_version':'0.84.26','source_pdf_sha256':p['metadata']['source_pdf_sha256'],'source_text_snapshot_sha256':p['metadata']['source_text_snapshot_sha256']}
save(D/'proposed'/fname,p);save(D/'authoring.json',{'regimens':{'00689':a}})
