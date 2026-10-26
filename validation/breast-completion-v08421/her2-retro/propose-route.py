import json,copy
from pathlib import Path
O=Path(__file__).parent;R=O.parents[2];f=next((R/'protocols/breast').glob('00936-*.json'));p=json.loads(f.read_text());rules=p['rule_engine']['rules']
p['input_definitions']['trastuzumab_formulation']={'label':'Trastuzumab formulation','type':'select','required':False,'always_show':True,'input_role':'context','demo_value':'iv','options':[{'value':'iv','label':'Intravenous trastuzumab'},{'value':'sc','label':'Locally approved subcutaneous trastuzumab'}]}
p['input_definitions']['days_overdue_trastuzumab']['label']='Days overdue for trastuzumab (confirm formulation)'
x=next(x for x in rules if x['rule_id']=='HER2_RELOAD');x['when']={'all':[{'field':'trastuzumab_formulation','operator':'==','value':'iv'},x['when']]}
x['action']['recommendation']='IV trastuzumab more than one week overdue: the NCCP source specifies reloading with 8 mg/kg, then 6 mg/kg every three weeks. Confirm the individual prescription and the new administration date. This is not the SC missed-dose rule.';x['explanation']=x['action']['recommendation']
def rule(ident,when,msg,page=4):
 return dict(rule_id=ident,when=when,action=dict(type='consultant_review',components=['trastuzumab'],recommendation=msg,dose_calculation='specialist_review',show_in_dose_actions=True),explanation=msg,source=dict(document='NCCP 00936 v1',url=p['metadata']['source_url'],page=page))
rules += [rule('HER2_FORMULATION_NEEDED',{'all':[{'field':'trastuzumab_formulation','operator':'missing'},{'field':'days_overdue_trastuzumab','operator':'>','value':0}]},'Confirm IV versus locally approved SC trastuzumab before missed-dose advice. IV reloading must not be applied to the fixed 600 mg SC formulation.'),
rule('HER2_SC_PRESCRIPTION',{'field':'trastuzumab_formulation','operator':'==','value':'sc'},'Locally approved SC trastuzumab is an alternative fixed 600 mg injection every 21 days with no loading dose. Confirm the formulation-specific prescription; do not calculate a weight-based IV dose for this route.',3),
rule('HER2_SC_MISSED',{'all':[{'field':'trastuzumab_formulation','operator':'==','value':'sc'},{'field':'days_overdue_trastuzumab','operator':'>','value':0}]},'Missed SC trastuzumab: rearrange the 600 mg dose as soon as possible; keep at least three weeks between consecutive SC doses. There is no SC reloading dose.')]
for a in p['treatment_phases'][0]['administration']:
 if a['drug']=='trastuzumab':a['notes']='This row is the IV schedule: 8 mg/kg loading initially, then 6 mg/kg. NCCP also permits locally approved SC trastuzumab 600 mg every 21 days without loading, as an alternative rather than an additional medicine. Confirm formulation; the SC selection suppresses the IV numeric suggestion.'
p['metadata']['validation'].update(consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
p['metadata']['source_checked_date']='2026-10-25'
(O/'proposed').mkdir(exist_ok=True);(O/'proposed'/f.name).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
(O/'proposed-changes.json').write_text(json.dumps(dict(code='00936',kind='formulation_safety',source_pages=[2,3,4],clinical_use_authorised=False,changes=['New explicit IV/SC formulation input','Gate IV reload advice to IV route','Require formulation when missed-dose history is entered without route','Suppress IV numerical calculation for SC and state fixed-dose alternative','Add SC-specific missed-dose advice; no loading dose'],limitations=['SC remains a pharmacy-verified prescription in this proposal; no generic numeric override is introduced into the shared dose engine.','No new ANC, DPD, renal, hepatic or ILD threshold is proposed.']),indent=2)+'\n')
print('Wrote isolated 00936 formulation proposal')
