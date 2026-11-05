from pathlib import Path
import json
R=Path(__file__).resolve().parents[3]
def a(f,o,v):return dict(field=f,operator=o,value=v)
for c in ['00555','00783']:
 f=next((R/'protocols/gastrointestinal').glob(c+'-*.json'));p=json.loads(f.read_text());defs=p['input_definitions'];rules=p['rule_engine']['rules']
 def add(i,co,typ,msg,page,comps):
  rules[:]=[r for r in rules if r['id']!=i];rules.append(dict(id=i,priority=95 if typ=='discontinue' else 80,when=co,action=dict(type=typ,components=comps,message=msg,recommendation=msg),explanation=msg,source=dict(document='NCCP '+c+' v'+p['metadata']['nccp_version'],page=page,url=p['metadata']['source_url'])))
 for name,label,maxv in [('haematocrit_percent','Haematocrit (%)',100),('creatinine_umol_l','Creatinine (µmol/L)',3000)]:defs[name]=dict(label=label,type='number',min=0,max=maxv,step=.1,required=False,demo_value='',input_role='decision')
 add('HUS_LAB_PATTERN',dict(all=[a('haematocrit_percent','<',25),a('platelets_x10e9_l','<',100),a('creatinine_umol_l','>=',135)]),'withhold','Source HUS warning pattern: haematocrit <25%, platelets <100 ×10⁹/L and creatinine ≥135 µmol/L. Interrupt oxaliplatin and urgently investigate suspected HUS; this is not a definitive diagnosis.',10 if c=='00783' else 7,['oxaliplatin'])
 if c=='00783':add('BEV_SEVERE_BP_UNCONTROLLED_STOP',dict(all=[a('bp_sustained_on_antihypertensives','==',True),dict(any=[a('systolic_bp_mmhg','>',200),a('diastolic_bp_mmhg','>',110)])]),'discontinue','Severe hypertension above 200/110 mmHg sustained despite medication: discontinue bevacizumab (source complication guidance). Urgent clinical assessment; do not infer control from an omitted reading.',9,['bevacizumab'])
 p['metadata']['validation']['software_tests_completed']=True
 f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
f=next((R/'protocols/gastrointestinal').glob('00691-*.json'));p=json.loads(f.read_text());p['metadata']['validation']['software_tests_completed']=True;f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
