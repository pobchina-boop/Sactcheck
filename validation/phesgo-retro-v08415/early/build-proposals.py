import json
from pathlib import Path
root=Path(__file__).resolve().parents[3]
out=Path(__file__).parent
f=lambda name,op,value=None: dict(field=name,operator=op,**({} if value is None else {'value':value}))
AND=lambda *x:{'all':list(x)}
OR=lambda *x:{'any':list(x)}
chemo=OR(f('treatment_phase','missing'),f('treatment_phase','!=','continuation'))
patches={}
for code in ['00789','00790']:
 p=json.loads(next((root/'protocols/breast').glob(code+'*.json')).read_text()); old={x['rule_id']:x for x in p['rule_engine']['rules']}; patch={'replace_rules':{},'add_rules':[],'input_definitions':{}}
 def add(id,cond,rec,page,components=['pertuzumab','trastuzumab']):
  patch['add_rules'].append({'rule_id':id,'when':cond,'action':{'type':'consultant_review','components':components,'recommendation':rec,'dose_calculation':'specialist_review','show_in_dose_actions':True},'explanation':rec,'source':{'document':f'NCCP {code} v3','url':p['metadata']['source_url'],'page':page},'encoding_note':'Context clarification; no invented numeric restart dose.'})
 for name in ['BASELINE_LVEF_LOW','BASELINE_LVEF_50_55','BASELINE_HISTORY_MISSING']:
  r=json.loads(json.dumps(old[name]));r['when']=AND(OR(f('assessment_stage','missing'),f('assessment_stage','==','baseline')),r['when']);patch['replace_rules'][name]=r
 add('INVALID_ASSESSMENT_STAGE',f('assessment_stage','not_in',['baseline','ongoing']), 'Choose Before starting or During treatment. The entered assessment stage is unrecognised; it must not bypass initiation eligibility or be treated as a completed assessment.',1)
 add('INVALID_TREATMENT_PHASE',f('treatment_phase','not_in',['combination','continuation']), 'Choose the active combination phase or postoperative transition. The entered treatment phase is unrecognised; confirm the active medicines and source regimen before a dosing decision.',1)
 basepage=3 if code=='00789' else 5;cardpage=7 if code=='00789' else 10;renalpage=6 if code=='00789' else 9
 add('ONGOING_BASELINE_HISTORY_REVIEW',AND(f('assessment_stage','==','ongoing'),OR(f('baseline_lvef_percent','<',50),AND(f('baseline_lvef_percent','<',55),OR(f('anthracycline_completed','==',False),f('anthracycline_completed','missing'))))), 'The recorded baseline LVEF needs review against initiation eligibility. During treatment, use the current LVEF, change from baseline, symptoms and cardiac plan; the historic baseline alone must not create a new automatic hold.',basepage)
 add('LVEF_CURRENT_MISSING',AND(f('lvef_drop_points','>=',10),f('lvef_percent','missing')), 'Obtain the current LVEF before applying the early-breast cardiac hold criteria; a fall alone does not establish both required values. Assess cardiac symptoms urgently.',cardpage)
 add('CARBO_CREATININE_AGE_MISSING',AND(chemo,f('gfr_method','==','estimated'),f('creatinine_result_age_hours','missing')), 'Confirm the creatinine result was obtained within 48 hours before carboplatin when using an estimated GFR. A missing timestamp is not a fresh result.',renalpage,['carboplatin'])
 add('CARBO_METHOD_MISSING',AND(chemo,f('gfr_method','missing'),OR(f('creatinine_result_age_hours','>',48),f('creatinine_percent_reference','>',110))), 'Confirm measured isotope versus estimated GFR before interpreting this renal context. Estimated dosing needs creatinine within 48 hours; a rise above 110% of isotope-reference creatinine requires consideration of repeat or estimated GFR.',renalpage,['carboplatin'])
 add('CONTINUATION_REGIMEN_REQUIRED',f('treatment_phase','==','continuation'), 'This source covers neoadjuvant combination treatment. Surgery and pathology determine the separate postoperative regimen; open that regimen for its assessment, doses and support. Do not assume Phesgo continuation or the metastatic 00785 code.',1)
 if code=='00789':
  add('BASELINE_NEURO_CONTEXT',AND(chemo,f('assessment_stage','missing'),f('neuropathy_grade','==',2)), 'Clarify before-starting versus during-treatment assessment. Grade 2 neuropathy excludes starting NCCP 00789; the ongoing docetaxel modification row uses grade greater than 2.',4,['docetaxel','carboplatin'])
  r=json.loads(json.dumps(old['DOC_BILIRUBIN_DELAY'])); r['action']['components']=['pertuzumab','trastuzumab','docetaxel','carboplatin'];r['action']['recommendation']='Abnormal bilirubin: delay the next cycle for up to 2 weeks. The source directs companion drugs to be delayed while docetaxel is delayed for hepatic toxicity. If recovery fails and chemotherapy is stopped, HER2 therapy may continue only after consultant review.';r['explanation']=r['action']['recommendation'];patch['replace_rules']['DOC_BILIRUBIN_DELAY']=r
 else:
  add('INVALID_CYCLE_DAY',f('cycle_day','not_in',[1,8]), 'NCCP 00790 schedules treatment on Days 1 and 8 only. The entered day is outside this schedule; confirm the visit and do not invent Day 15 paclitaxel.',1,['paclitaxel','carboplatin'])
  patch['input_definitions']['age_years']={'label':'Age','type':'number','unit':'years','min':0,'max':120,'step':1,'required':False,'always_show':True,'input_role':'decision','demo_value':50}
  add('ADULT_ELIGIBILITY',f('age_years','<',18),'NCCP 00790 requires age at least 18 years. This source does not establish a paediatric treatment plan; specialist review is required.',5,['pertuzumab','trastuzumab','paclitaxel','carboplatin'])
 # Shared live SmPC reaction handling independently checked against sections 4.2/4.4.
 advanced=json.loads((root/'validation/phesgo-retro-v08415/advanced/proposed-changes.json').read_text())['proposals'][0]
 for k in ['phesgo_hypersensitivity_grade','significant_injection_reaction']:
  patch['input_definitions'][k]=advanced['input_definitions_upsert'][k]
 for r in advanced['rules_append']:
  if r['rule_id'] in ['PHESGO_REACTION_G1_G2','PHESGO_REACTION_G3','PHESGO_INJECTION_REACTION']:patch['add_rules'].append(r)
 # A pre-start current LVEF is also an initiation value, even if the separate baseline box is blank.
 for oldid,newid in [('BASELINE_LVEF_LOW','BASELINE_CURRENT_LVEF_LOW'),('BASELINE_LVEF_50_55','BASELINE_CURRENT_LVEF_50_55'),('BASELINE_HISTORY_MISSING','BASELINE_CURRENT_HISTORY_MISSING')]:
  r=json.loads(json.dumps(old[oldid]).replace('baseline_lvef_percent','lvef_percent'));r['rule_id']=newid;r['when']=AND(f('assessment_stage','==','baseline'),r['when']);patch['add_rules'].append(r)
 add('LVEF_STAGE_MISSING',AND(f('assessment_stage','missing'),f('lvef_percent','<',55)), 'Clarify whether this current LVEF is a pretreatment or on-treatment measurement. Early-breast initiation requires at least 55%, or at least 50% after completed anthracyclines. On-treatment criteria differ; independent cardiac holds still apply.',basepage)
 patches[code]=patch
(out/'proposed-corrections.json').write_text(json.dumps(patches,indent=2)+'\n')
print('Wrote proposals only; app files unchanged.')
