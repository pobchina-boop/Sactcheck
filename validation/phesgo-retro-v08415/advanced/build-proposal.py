"""Produce reviewable audit proposals in this folder only; never edit the app."""
from pathlib import Path
import copy,hashlib,json
here=Path(__file__).resolve().parent
codes=['00785','00796','00797']
ema='https://www.ema.europa.eu/en/documents/product-information/phesgo-epar-product-information_en.pdf'
(here/'proposed').mkdir(exist_ok=True)
def cond(field,operator,value=None):
 d={'field':field,'operator':operator}
 if value is not None:d['value']=value
 return d
def rule(i,when,text,source,action='consultant_review'):
 a={'type':action,'components':['pertuzumab','trastuzumab'],'recommendation':text}
 if action=='consultant_review':a.update(dose_calculation='specialist_review',show_in_dose_actions=True)
 return dict(rule_id=i,when=when,action=a,explanation=text,source=source)
def boolean(label):return dict(label=label,type='boolean',required=False,always_show=True,input_role='decision',demo_value=False)
def rec(r,text):r['action']['recommendation']=text;r['explanation']=text
proposals=[]
for c in codes:
 f=next((here/'baseline').glob(c+'*'));p=json.loads(f.read_text());old=copy.deepcopy(p);rules=p['rule_engine']['rules'];by={r['rule_id']:r for r in rules};url=p['metadata']['source_url'];nccp=dict(document='NCCP '+c+' v'+str(p['metadata']['nccp_version']),url=url,page=2);smpc=dict(document='Phesgo SmPC sections 4.2 and 4.4',url=ema,page=7)
 rules.append(rule('ASSESSMENT_STAGE_INVALID',cond('assessment_stage','not_in',['baseline','ongoing']),'Select a valid assessment stage: before starting or during treatment. An unrecognised value cannot select pretreatment versus ongoing criteria; independent safety findings still apply.',nccp))
 # Explicit historical pretreatment LVEF is not a current on-treatment result.
 by['BASELINE_LVEF_LOW']['when']={'all':[{'any':[cond('assessment_stage','==','baseline'),cond('assessment_stage','missing')]},cond('baseline_lvef_percent','<',50)]}
 rec(by['BASELINE_LVEF_LOW'],'Before initiation, metastatic LVEF must be at least 50%; obtain specialist review if lower. A historical baseline value alone is not an on-treatment withholding criterion.')
 rules.append(rule('BASELINE_CURRENT_LVEF_LOW',{'all':[cond('assessment_stage','==','baseline'),cond('lvef_percent','<',50)]},'The entered current LVEF is below the 50% pretreatment requirement. Obtain oncology/cardiology review before starting; on-treatment thresholds differ.',nccp,'withhold'))
 rules.append(rule('LVEF_STAGE_MISSING',{'all':[cond('assessment_stage','missing'),cond('lvef_percent','<',50)]},'Clarify whether this is the pretreatment result or an on-treatment measurement: initiation requires LVEF at least 50%; the ongoing hold threshold also uses the change from pretreatment. Independent urgent cardiac findings still apply.',nccp))
 p['input_definitions']['significant_injection_reaction']=boolean('Current significant Phesgo injection-related reaction')
 p['input_definitions']['phesgo_hypersensitivity_grade']['label']='Current Phesgo hypersensitivity reaction'
 rules.append(rule('PHESGO_REACTION_G1_G2',{'all':[cond('phesgo_hypersensitivity_grade','>=',1),cond('phesgo_hypersensitivity_grade','<=',2)]},'Pause or slow the Phesgo injection, assess and treat the reaction, and observe until signs and symptoms resolve. Resumption requires the treating team\'s decision; this is not an automatic permanent stop.',smpc,'withhold'))
 rules.append(rule('PHESGO_REACTION_G3',cond('phesgo_hypersensitivity_grade','==',3),'Stop the injection and urgently manage the serious reaction. Specialist review is required before any re-exposure; consider permanent discontinuation according to severity and response. Grade 4, bronchospasm or ARDS require permanent discontinuation.',smpc,'withhold'))
 rules.append(rule('PHESGO_INJECTION_REACTION',cond('significant_injection_reaction','==',True),'Pause or slow the Phesgo injection and provide appropriate treatment. Monitor to complete resolution; severe injection reactions require specialist review and consideration of permanent discontinuation.',smpc,'withhold'))
 p['input_definitions']['disease_progression']=boolean('Disease progression on the current treatment')
 rules.append(rule('PROGRESSION_REVIEW',cond('disease_progression','==',True),'Progression requires reassessment of the treatment strategy. Do not automatically continue this Phesgo plan.',dict(nccp,page=1)))
 rec(by['ALLERGY'],'Relevant drug/excipient allergy is an NCCP exclusion. Identify the responsible agent and obtain specialist advice before any re-exposure.')
 rec(by['DIARRHOEA_REVIEW'],'Assess dehydration, infection and severity promptly; consider fluids/electrolytes and early antidiarrhoeal treatment. Consider interrupting Phesgo if severe or prolonged diarrhoea does not improve; restart only when controlled after clinical review. Do not reduce the fixed Phesgo dose by a percentage.')
 by['DIARRHOEA_REVIEW']['source']={'document':'Phesgo SmPC section 4.4', 'url':ema, 'page':8}
 if c=='00785':
  p['input_definitions']['chemotherapy_component_completed']=boolean('Chemotherapy component completed or stopped by the treating team')
  rules.append(rule('CHEMOTHERAPY_COMPLETION_REVIEW',cond('chemotherapy_component_completed','==',False),'This maintenance card is for antibody-only continuation after the chemotherapy component is complete. Review the active combination protocol if chemotherapy is still intended.',dict(nccp,page=1)))
 if c=='00796':
  rec(by['LVEF_HOLD'],'Withhold Phesgo for LVEF <40%, or 40–45% with decline at least 10 percentage points. NCCP specifies repeat LVEF within 3 weeks. The SmPC specifies withholding for at least 3 weeks and resumption only after recovery to >45%, or 40–45% with decline <10 points. No improvement/further decline requires consultant/cardiology review.')
  by['LVEF_HOLD']['supporting_source']={'document':'Phesgo SmPC section 4.2','url':ema,'page':4}
 if c=='00797':
  rec(by['PAC_NEURO_G2'],'Grade 2 peripheral neuropathy: decrease paclitaxel by 10 mg/m² from the actual current dose after review. Verify previous reductions; this differs from the haematological 80→65→50 mg/m² ladder.')
  rec(by['PAC_ANC_LOW'],'Delay paclitaxel for low ANC; establish duration and recovery. ANC 0.5–0.99: consider reduction at a subsequent cycle; ANC <0.5 for at least 7 days requires a one-level reduction after recovery. Without duration, do not invent a restart dose.')
  rec(by['PAC_PLT_LOW'],'Delay paclitaxel for platelets below 90. For 70–90, consider reduction at a subsequent cycle; below 70 requires a one-level reduction after recovery. Exactly 90 overlaps printed source bands and requires review.')
  rec(by['ACUTE_FN'],by['ACUTE_FN']['action']['recommendation']+' NCCP also advises considering addition of G-CSF after febrile neutropenia.')
 if c!='00785':
  # Existing phase controls correctly exclude old cytotoxic actions; keep them.
  for phase in p['treatment_phases']:
   if phase['phase_id']=='continuation':
    for admin in phase['administration']:admin['notes']=admin['notes'].replace(' Complete observation before chemotherapy.','')
 changed={k:v for k,v in p['input_definitions'].items() if old['input_definitions'].get(k)!=v}
 oldrules={r['rule_id']:r for r in old['rule_engine']['rules']}
 replacements=[r for r in rules if r['rule_id'] in oldrules and r!=oldrules[r['rule_id']]]
 additions=[r for r in rules if r['rule_id'] not in oldrules]
 proposal={'code':c,'baseline_sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'input_definitions_upsert':changed,'rules_replace_by_id':replacements,'rules_append':additions}
 if p['treatment_phases']!=old['treatment_phases']:proposal['treatment_phases_replace']=p['treatment_phases']
 proposals.append(proposal);(here/'proposed'/f.name).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
(here/'proposed-changes.json').write_text(json.dumps({'status':'source/software proposal; independent clinical and pharmacy review pending','proposals':proposals},indent=2,ensure_ascii=False)+'\n')
print('Prepared proposals only in audit folder')
