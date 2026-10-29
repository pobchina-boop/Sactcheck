from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[3];O=Path(__file__).resolve().parent;DATE='2026-10-29';V='0.84.26'
def read(p):return json.loads(Path(p).read_text())
def write(p,x):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
paths={'00455':'protocols/shared/00455-pembrolizumab-200-mg-monotherapy.json','00558':'protocols/shared/00558-pembrolizumab-400mg-monotherapy.json'}
if not (O/'baseline-canonical.json').exists():write(O/'baseline-canonical.json',{c:read(R/p) for c,p in paths.items()})
base=read(O/'baseline-canonical.json'); manifest={'release':V,'base_release':'0.84.25','protocols':{}}
for c,path in paths.items():
 p=copy.deepcopy(base[c]);m=p['metadata'];m.update(sactcheck_encoding_version=V,source_checked_date=DATE,full_suite_release=V)
 m['encoding_maturity'].update(audit_release=V,audit_date=DATE,reconciled_release=V,reconciled_date=DATE)
 m['retrospective_audit_v08426']={'sources_unchanged':True,'source_bytes_retrieved':DATE,'change':'Explicit clinical attribution before immune hepatitis/nephritis actions; abnormal unclassified laboratory results require review, never automatic permanent stop.','supplemental_source':{'document':'EMA Keytruda IV SmPC','url':'https://www.ema.europa.eu/en/documents/product-information/keytruda-epar-product-information_en.pdf','section':'4.4 immune-mediated hepatitis and nephritis: exclude other causes'},'independent_clinical_approval':False}
 for obj in [m['validation'],m['encoding_maturity']]:
  for f in ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised']:obj[f]=False
 for f,label in [('pembro_immune_hepatitis_assessed','Liver abnormality clinically assessed as immune-mediated hepatitis?'),('pembro_immune_nephritis_assessed','Renal abnormality clinically assessed as immune-mediated nephritis?')]:
  p['input_definitions'][f]={'label':label,'type':'boolean','required':False,'demo_value':'','ui_section':'clinical','input_role':'decision','help':'Yes means the treating clinician has assessed immune-mediated toxicity and evaluated alternative causes; a raised laboratory result alone does not establish this. No or blank keeps an abnormal result in a clinical-review pathway. This does not require biopsy confirmation. EMA Keytruda IV SmPC §4.4; NCCP Table 1 applies to immune-related adverse reactions.'}
 p['input_definitions']['creatinine_ratio_baseline_or_uln']['label']='Creatinine (× ULN; immune-nephritis threshold assessment)'
 p['input_definitions']['creatinine_ratio_baseline_or_uln']['help']='ULN only, never fold-change from baseline. A raised result requires clinical assessment of immune causality and alternative causes before source hold/stop rules are applied. Stable chronic impairment remains a separate no-adjustment pathway.'
 for f in ['alt_ast_uln_multiple','bilirubin_uln_multiple']:
  p['input_definitions'][f]['help']=(p['input_definitions'][f].get('help','')+' A laboratory elevation alone does not diagnose immune hepatitis; record clinical attribution separately.').strip()
 conditions={}
 for r in p['rule_engine']['rules']:
  r['source']['checked_date']=DATE
  if r['rule_id'] in ['NEPHRITIS_G2','NEPHRITIS_G3_PLUS','HEPATITIS_WITHHOLD','HEPATITIS_PERMANENT','LIVER_METS_BASELINE_G2_STOP']:
   node={k:r.pop(k) for k in list(r) if k in ['all','any','field','operator','value','not']};conditions[r['rule_id']]=copy.deepcopy(node)
   field='pembro_immune_nephritis_assessed' if r['rule_id'].startswith('NEPHRITIS') else 'pembro_immune_hepatitis_assessed'
   r['all']=[{'field':field,'operator':'==','value':True},node]
   r['explanation']+=' This action requires clinician-assessed immune attribution after evaluation of alternative causes.'
   r['action']['recommendation']=r['explanation']
 for organ,field,node in [('LIVER','pembro_immune_hepatitis_assessed',{'any':[conditions['HEPATITIS_WITHHOLD'],conditions['HEPATITIS_PERMANENT'],conditions['LIVER_METS_BASELINE_G2_STOP']]}),('RENAL','pembro_immune_nephritis_assessed',{'any':[conditions['NEPHRITIS_G2'],conditions['NEPHRITIS_G3_PLUS']]})]:
  explanation=('Abnormal '+organ.lower()+' result crosses an immune-toxicity table threshold, but immune causality has not been established. Obtain prompt clinical assessment, investigate alternative causes and document the treatment decision. Do not administer automatically or apply permanent immune-toxicity discontinuation from an isolated laboratory result. No dose reduction is calculated.')
  source={'document':f'NCCP {c} v{m["nccp_version"]}; EMA Keytruda IV SmPC §4.4','url':m['source_url'],'page':5 if organ=='RENAL' else 6,'table':'Table 1: immune-related adverse reactions','checked_date':DATE,'supplemental_url':'https://www.ema.europa.eu/en/documents/product-information/keytruda-epar-product-information_en.pdf'}
  p['rule_engine']['rules'].append({'rule_id':organ+'_ATTRIBUTION_REVIEW','all':[node,{'any':[{'field':field,'operator':'missing'},{'field':field,'operator':'==','value':False}]}],'action':{'type':'consultant_review','components':['pembrolizumab'],'recommendation':explanation},'explanation':explanation,'source':source})
 p['required_inputs']=[]
 for d in p['input_definitions'].values():d['required']=False
 write(O/'proposed'/Path(path).name,p)
 manifest['protocols'][c]={'protocol_id':p['protocol_id'],'source_path':path,'proposed_path':str((O/'proposed'/Path(path).name).relative_to(R))}
write(O/'proposed/integration-manifest.json',manifest)
print('Two proposals with explicit immune attribution and independent abnormal-lab review.')
