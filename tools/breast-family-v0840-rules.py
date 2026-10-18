"""Rule helpers for the sixteen breast / taxane protocols against the source tables audited for v0.84.0."""
import json, copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CODES=[]
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
    if k=='gfr_ml_min':d['input_definitions'][k]['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'Verified unindexed GFR is needed for carboplatin renal safety and the separately checked Calvert calculation.'}
    if k=='creatinine_percent_reference':d['input_definitions'][k]['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'The exact percentage relative to the isotope-GFR reference creatinine identifies whether repeat measurement is required; this is not an eGFR dose band.'}
def boolean(d,k,label):d['input_definitions'][k]={'label':label,'type':'boolean','demo_value':False,'required':False,'always_show':True,'input_role':'decision'}
def select(d,k,label,opts):d['input_definitions'][k]={'label':label,'type':'select','demo_value':opts[0][0],'required':False,'always_show':True,'input_role':'context','options':[{'value':v,'label':s} for v,s in opts]}
def grade(d,k,label):
    select(d,k,label,[(i,'Grade '+str(i)) for i in range(5)]);v=d['input_definitions'][k];v['input_role']='decision';v['unit']='CTCAE grade';v['ctcae_version']='5.0';v['ctcae_source_url']='https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
    v['ctcae_category']=('neuropathy' if 'neuro' in k else 'diarrhoea' if 'diarr' in k else 'pneumonitis' if ('pneumonitis' in k or 'ild' in k) else 'hepatic_alt_ast' if ('liver' in k or 'ast_alt' in k) else 'allergic_reaction' if 'hypersens' in k else 'ppe' if 'hand_foot' in k else 'cardiac' if 'heart_failure' in k else 'other_nonhaematological')
    for o in v['options']:
        o['ctcae_grade']=o['value'];o['description']='Grade '+str(o['value'])+' — use the linked CTCAE descriptor for this toxicity and assess functional impact.'
    v['assessment_guidance']='Assign the toxicity grade using the clinical descriptors; assess symptoms, baseline and functional impact. The source protocol action takes precedence over educational grading.'
def init(c,version=None):
    p,d=read(c);d['input_definitions']={};d['rule_engine']['rules']=[];d['required_inputs']=[];d.pop('assessment_profiles',None)
    if version:d['metadata']['nccp_version']=version
    d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation'
    d['metadata']['sactcheck_encoding_version']='0.84.0'
    d['metadata']['source_checked_date']='2026-10-17'
    d['metadata']['partial_assessment_supported']=True
    d['metadata']['validation'].update(source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
    d['metadata']['encoding_maturity']={'level':'source_reconciled_rule_encoding','label':'Source reconciled · independent clinical/pharmacy review pending','source_reconciled':True,'reconciled_release':'0.84.0','reconciled_date':'2026-10-17','consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}
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
