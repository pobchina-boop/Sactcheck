from pathlib import Path
import json,re
B=Path(__file__).parent;f=next((B/'proposed').glob('00849-*.json'));p=json.loads(f.read_text());D=p['input_definitions'];rules=p['rule_engine']['rules'];back=json.loads((B/'backbones.json').read_text())
def c(f,o,v):return dict(field=f,operator=o,value=v)
def add(k,id,w,msg,typ='consultant_review',comp=None,page=4):rules.append(dict(id=k+'_'+id,priority=8,when={'all':[c('treatment_phase','==','backbone_'+k),w]},action=dict(type=typ,components=comp or [back[k][0],back[k][1]],message=msg,recommendation=msg,show_in_dose_actions=True,dose_calculation='specialist_review'),source=dict(document='NCCP '+k+' v'+back[k][4],url=back[k][5],page=page,checked_date='2026-10-29'),explanation=msg))
def inp(k,label,typ='boolean'):D.setdefault(k,dict(label=label,type=typ,required=False,demo_value='',input_role='decision'))
for k in ['00304','00310']:
 inp('serum_creatinine_percent_isotope_baseline','Current creatinine as percent of isotope-GFR baseline','number');inp('carboplatin_creatinine_within48h','For estimated Calvert GFR, creatinine measured within 48 hours')
 add(k,'CRCL60',c('crcl_ml_min','<',60),'CrCl below 60 mL/min increases carboplatin myelosuppression risk; review the dose method and counts.',comp=['carboplatin'])
 add(k,'GFR_STALE',c('carboplatin_creatinine_within48h','==',False),'When estimating GFR, obtain creatinine within 48 hours of carboplatin administration.',comp=['carboplatin'])
 add(k,'ISOTOPE_REVIEW',c('serum_creatinine_percent_isotope_baseline','>',110),'Current creatinine exceeds 110% of the isotope-GFR baseline; consider remeasurement or verified recalculation before carboplatin.',comp=['carboplatin'])
for k in ['00310','00281']:
 add(k,'GEM_SCAR',c('scar_confirmed','==',True),'Discontinue gemcitabine for confirmed severe cutaneous adverse reaction, including SJS/TEN; apply nivolumab rule independently.','discontinue',['gemcitabine'],5 if k=='00310'else 3)
for r in rules:
 if r['id']=='00281_GEM_PNEUMONITIS':
  r['action'].update(type='withhold',message='Suspected gemcitabine lung toxicity: withhold and urgently assess attribution and severity. Source permanent discontinuation is specified for Grade ≥2 gemcitabine pneumonitis.',recommendation='Suspected gemcitabine lung toxicity: withhold and urgently assess attribution and severity. Source permanent discontinuation is specified for Grade ≥2 gemcitabine pneumonitis.')
inp('gemcitabine_pneumonitis_grade','Confirmed gemcitabine pneumonitis grade','select');D['gemcitabine_pneumonitis_grade']['options']=[dict(value=i,label='Grade '+str(i))for i in range(5)];D['gemcitabine_pneumonitis_grade'].update(grading_source_label='NCCP companion adverse-event table; edition unspecified',grading_source_url=back['00281'][5],source_grading_note='Clinician assesses named event and attribution.',assessment_guidance='Differentiate immune, gemcitabine, infection and other causes.')
add('00281','GEM_PNEUMONITIS_G2',c('gemcitabine_pneumonitis_grade','>=',2),'Discontinue gemcitabine for Grade ≥2 confirmed gemcitabine pneumonitis.','discontinue',['gemcitabine'],3)
p['metadata']['validation']['software_tests_completed']=False;p['clinical_governance']['clinical_use_authorised']=False
# Improve source encoding readability without changing any threshold or identifier.
def readable(x,key=''):
 if isinstance(x,dict):return {k:readable(v,k) for k,v in x.items()}
 if isinstance(x,list):return [readable(v,key)for v in x]
 if isinstance(x,str)and key not in ['id','field','value','protocol_id','phase_id','drug','url','source_url']:
  x=re.sub(r'(?<=[a-zA-Z])(?=\d)', ' ',x);x=re.sub(r'(?<=\d)(?=[a-zA-Z])',' ',x)
  for a,b in [('everycycle','every cycle'),('clinicallyindicated','clinically indicated'),('Continueimmune surveillanceatleast','Continue immune surveillance at least '),('monthsafterlastnivolumab','months after last nivolumab'),('surgicalMDTdeterminesscans/fitness/timing','surgical MDT determines scans, fitness and timing'),('knownEGFR','known EGFR'),('prednisone to10','prednisone to 10')]:x=x.replace(a,b)
 return x
# Only prose-bearing top-level structures; never process input units/source identifiers.
for k in ['eligibility','exclusions','monitoring','dose_modifications','supportive_care']:p[k]=readable(p[k])
f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');print(len(D),len(rules))
