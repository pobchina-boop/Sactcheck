import json,pathlib,hashlib,copy
R=pathlib.Path(__file__).resolve().parents[3]; B=pathlib.Path(__file__).parent
old=R/'validation/lung-core-v08422/nivo-combo'
a=json.loads((old/'authoring.json').read_text()); manifest={'protocols':{}}
EMA='https://www.ema.europa.eu/en/documents/product-information/opdivo-epar-product-information_en.pdf'
def leaf(f,op,v=None):return dict(field=f,operator=op,**({'value':v} if v is not None else {}))
def refresh(x):
 if isinstance(x,dict):return {k:refresh(v) for k,v in x.items()}
 if isinstance(x,list):return [refresh(v) for v in x]
 if isinstance(x,str):return x.replace('0.84.22','0.84.27').replace('2026-10-26','2026-10-29').replace('\\u2013','–')
 return x
for c in ['00713','00714']:
 src=next(R.glob('protocols/*/'+c+'-*'));p=refresh(json.loads(src.read_text()));m=p['metadata'];rules=p['rule_engine']['rules'];defs=p['input_definitions']
 m['validation']['software_tests_completed']=False;m['validation']['software_validation_record']='validation/lung-nivolumab-v08427/nivo-retro/AUDIT.md'
 for part in ['hepatitis','nephritis']:
  f='nivo_immune_'+part+'_assessed'
  defs[f]={'label':'Clinician has assessed the abnormal results as immune-mediated '+part,'type':'boolean','required':False,'demo_value':'','input_role':'decision','assessment_guidance':'Confirm aetiology and exclude alternative disease, infection and medicine-related causes. Blank or No does not imply normal results or clearance; unexplained abnormalities require prompt review.'}
 for r in rules:
  if r['id'] in ['ICI_HEPATITIS_WITHHOLD','ICI_HEPATITIS_STOP','ICI_BILI_WITHHOLD','ICI_BILI_STOP','ICI_RENAL_NUMERIC_HOLD','ICI_RENAL_ULN_G4']:
   part='nephritis' if 'RENAL' in r['id'] else 'hepatitis'
   r['when']={'all':[leaf('nivo_immune_'+part+'_assessed','==',True),r['when']]}
   text='For clinician-assessed immune-mediated '+part+': '+r['action']['message']
   r['action']['message']=r['action']['recommendation']=r['explanation']=text
 source={'document':'NCCP '+c+' v4','url':m['source_url'],'page':'11,13' if c=='00713' else '10,12'}
 def add(id,when,typ,text,source=source):
  rules.append({'id':id,'priority':8,'when':when,'action':{'type':typ,'components':['nivolumab','ipilimumab'],'message':text,'recommendation':text,'dose_calculation':'specialist_review','show_in_dose_actions':True},'explanation':text,'source':source})
 for part,conds in [('hepatitis',[leaf('alt_ast_uln_multiple','>',3),leaf('bilirubin_uln_multiple','>',1.5)]),('nephritis',[leaf('creatinine_uln_multiple','>',1.5),leaf('creatinine_baseline_multiple','>',1.5)])]:
  f='nivo_immune_'+part+'_assessed'
  add('ICI_'+part.upper()+'_ATTRIBUTION_REVIEW',{'all':[{'any':conds},{'any':[leaf(f,'missing'),leaf(f,'==',False)]}]},'consultant_review','Abnormal '+part+'-related laboratory results require prompt clinical assessment before further treatment. Establish cause, severity, trajectory and baseline; assess infection, disease and other medicines. Do not infer immune causality or a permanent immune-drug stop from an isolated result. Independent chemotherapy restrictions still apply.')
 defs['suspected_myotoxicity_or_myocarditis']={'label':'Suspected myocarditis or myotoxicity (including new cardiac symptoms or weakness)','type':'boolean','required':False,'demo_value':'','input_role':'decision'}
 smpc={'document':'EMA Opdivo SmPC, current PDF retrieved 2026-10-29; supplemental source','url':EMA,'page':'13,19, sections 4.2 and 4.4'}
 add('ICI_SUSPECTED_MYOTOXICITY_REVIEW',leaf('suspected_myotoxicity_or_myocarditis','==',True),'consultant_review','Urgent specialist assessment without delay for suspected myocarditis/myotoxicity. Suspected myocarditis requires prompt cardiology workup and clinician-directed corticosteroid treatment. Determine interruption or discontinuation from the assessed event and severity; do not wait for a routine visit.',smpc)
 defs['immune_overlap_syndrome_grade']={'label':'Assessed myocarditis–myositis–myasthenia gravis overlap syndrome: highest individual component grade','type':'select','required':False,'demo_value':'','input_role':'decision','options':[{'value':i,'label':'Grade '+str(i),'description':'Clinician-assessed highest grade of the individual overlapping conditions; requires at least two of myocarditis, myositis or myasthenia gravis.'} for i in range(5)],'ctcae_version':'4.0','grading_source_label':'EMA Opdivo SmPC CTCAE v4.0 overlap syndrome table','grading_source_url':EMA,'source_grading_note':'Source specifies CTCAE v4.0. Use the worst grade of the individual overlapping conditions. This table does not define each diagnostic grade.','assessment_guidance':'Confirm the overlap diagnosis and grade each individual condition using the current source; urgent specialist review.'}
 add('ICI_OVERLAP_G2',leaf('immune_overlap_syndrome_grade','==',2),'withhold','Assessed grade 2 overlap syndrome: withhold both immune medicines; specialist management and corticosteroids as clinically indicated. Resumption only after improvement and steroid taper under consultant direction.',smpc)
 add('ICI_OVERLAP_G3_G4',leaf('immune_overlap_syndrome_grade','>=',3),'permanently_discontinue','Assessed grade 3 or 4 overlap syndrome: permanently discontinue both immune medicines and arrange urgent specialist management.',smpc)
 m['source_pdf_sha256']=hashlib.sha256((B/'research'/f'{c}.pdf').read_bytes()).hexdigest();m['source_text_snapshot_sha256']=hashlib.sha256((B/'research'/f'{c}.txt').read_bytes()).hexdigest()
 out=B/'proposed'/src.name;out.write_text(json.dumps(p,indent=2)+'\n');manifest['protocols'][c]={'source_path':str(src.relative_to(R)),'proposed_path':str(out.relative_to(R))}
 x=refresh(a['regimens'][c]);x['protocol_metadata']={k:m[k] for k in ['source_pdf_sha256','source_text_snapshot_sha256','source_checked_date']};x['protocol_metadata']['source_page_count']=m['source_document_pages']
 x['clinical']['key_points'].append('Numeric immune hepatitis/nephritis actions require explicit clinician-assessed immune causality. Unexplained liver or creatinine abnormalities prompt assessment; separate chemotherapy organ-function restrictions remain active. New cardiac symptoms or weakness require urgent assessment for myocarditis/myotoxicity and overlap syndrome.')
 x['clinical']['ongoing'].append('Assess suspected myocarditis, myositis or myasthenia gravis promptly. For an established overlap syndrome use the worst individual component grade: grade 2 withholds both immune drugs; grade 3–4 permanently stops both (current EMA SmPC supplement).')
 x['patient']['sources'].append({'id':'opdivo-current-v27','title':'EMA Opdivo current product information (checked 29 October 2026)','url':EMA})
 x['patient']['agents'][0]['source_ids'].append('opdivo-current-v27')
 x['patient']['agents'][0]['watch']+=' Seek urgent help for new chest pain, severe muscle weakness, drooping eyelids or difficulty swallowing or breathing.'
 a['regimens'][c]=x
(B/'authoring.json').write_text(json.dumps(a,indent=2)+'\n');(B/'proposed/integration-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
