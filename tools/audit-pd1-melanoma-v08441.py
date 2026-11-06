"""Add source-specific melanoma eligibility safeguards without changing toxicity rules."""
from pathlib import Path
import copy,json,hashlib
R=Path(__file__).resolve().parents[1];O=R/'validation/skin-melanoma-v08441';(O/'protocol-before').mkdir(exist_ok=True)
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for code in ['00455','00558']:
 p=next((R/'protocols').rglob(code+'-*.json'));d=json.loads(p.read_text());before=O/'protocol-before'/p.name
 if not before.exists():before.write_bytes(p.read_bytes())
 f=d['input_definitions'];rules=d['rule_engine']['rules'];rules[:]=[r for r in rules if not r.get('rule_id','').startswith('MEL41_')]
 url=d['rule_engine']['rules'][0]['source']['url'];v=d['metadata']['nccp_version']
 def field(k,label,typ,**extra):f[k]={'label':label,'type':typ,'required':False,'ui_section':'treatment_context','input_role':'decision','help':'Melanoma source eligibility only. Record the actual situation; blank is unassessed.','demo_value':'',**extra}
 field('melanoma_adult','Adult melanoma indication confirmed','boolean')
 field('melanoma_ipilimumab_refractory','Ipilimumab-refractory disease confirmed for the selected refractory indication','boolean')
 field('melanoma_prior_advanced_systemic_lines','Previous systemic treatments for advanced melanoma (exclude current treatment)','number',min=0,max=99,step=1)
 field('melanoma_plan','Melanoma treatment setting / current phase','select',options=[{'value':x,'label':y} for x,y in [('advanced','Advanced disease'),('postoperative','Adjuvant after complete surgery')]+([('perioperative_before','Stage IIIB perioperative: before surgery'),('perioperative_after','Stage IIIB perioperative: after surgery')] if code=='00455' else [])])
 field('melanoma_starting_adjuvant','Starting the postoperative adjuvant course now','boolean')
 field('melanoma_weeks_since_surgery','Weeks since surgery at adjuvant initiation','number',min=0,max=520,step=.01,unit='weeks')
 field('melanoma_stage_iib_iic_ajcc8_confirmed','New stage IIB/IIC cutaneous melanoma confirmed (AJCC8)','boolean')
 field('melanoma_stage_iii_criteria_confirmed','Stage III source indication and node/resection criteria reconciled','boolean')
 if code=='00455':
  field('melanoma_stage_iiib_perioperative_eligible','Stage IIIB eligible for the adjuvant indication; consultant selected source perioperative plan','boolean')
  field('melanoma_phase_dose_number','Planned dose number within the current perioperative phase','number',min=1,max=99,step=1)
 ids=lambda letters:[o['value'] for o in f['indication_id']['options'] if any(o['value'] in [code+l,code+l+'-skin'] for l in letters)]
 advanced=ids('bc');stage3=ids('g');stage2=ids('l');adjuvant=stage3+stage2;allids=advanced+adjuvant
 cond=lambda k,op,val:{'field':k,'operator':op,'value':val}
 def rule(id,conditions,text,page=3,action='consultant_review'):
  rules.append({'rule_id':'MEL41_'+id,'all':conditions,'action':{'type':action,'components':['pembrolizumab'],'recommendation':text},'explanation':text,'source':{'document':f'NCCP {code} v{v}','url':url,'page':page,'table':'Eligibility / treatment setting','checked_date':'2026-11-06'}})
 def gate(ids,k,good,text):
  for suffix,op,val in [('UNASSESSED','missing',None),('NOT_MET','==',not good)]:rule(k.upper()+'_'+suffix,[cond('indication_id','in',ids),cond(k,op,val)],text)
 gate(allids,'melanoma_adult',True,'Confirm the adult melanoma indication; this regimen does not establish paediatric eligibility.')
 gate(ids('c'),'melanoma_ipilimumab_refractory',True,'The selected melanoma indication is ipilimumab-refractory disease. Confirm that history or select the appropriate alternative indication.')
 rule('PREVIOUS_ADVANCED_LIMIT',[cond('indication_id','in',advanced),cond('melanoma_prior_advanced_systemic_lines','>',1)],'Advanced melanoma eligibility permits no more than one previous systemic treatment for advanced disease. Confirm the history and reconcile the source indication before prescribing.')
 rule('PREVIOUS_ADVANCED_UNASSESSED',[cond('indication_id','in',advanced),cond('melanoma_prior_advanced_systemic_lines','missing',None)],'Record the number of previous systemic treatments for advanced melanoma; the source limit is no more than one. Missing history does not establish eligibility.')
 gate(stage2,'melanoma_stage_iib_iic_ajcc8_confirmed',True,'Confirm a new stage IIB/IIC cutaneous melanoma diagnosis by AJCC8. The source adjuvant indication requires complete resection, ECOG 0–1 and initiation within 12 weeks of surgery.')
 gate(stage3,'melanoma_stage_iii_criteria_confirmed',True,'Confirm the exact stage III melanoma indication and lymph-node/resection criteria from the current NCCP source. Clarify any indication/eligibility wording difference with the treating consultant.')
 rule('PLAN_UNASSESSED',[cond('indication_id','in',adjuvant),cond('melanoma_plan','missing',None)],'Confirm postoperative adjuvant treatment, or the explicitly selected 200 mg stage IIIB perioperative phase, before interpreting surgery and cycle counts.')
 for value in ['postoperative']+(['perioperative_after'] if code=='00455' else []):
  for suffix,op,val in [('INCOMPLETE','==',False),('UNASSESSED','missing',None)]:rule('RESECTION_'+value.upper()+'_'+suffix,[cond('indication_id','in',adjuvant),cond('melanoma_plan','==',value),cond('complete_resection',op,val)],'Postoperative melanoma treatment requires complete resection under the source indication. Reconcile the surgery/pathology result before proceeding.')
 rule('START_UNASSESSED',[cond('indication_id','in',stage2),cond('melanoma_starting_adjuvant','missing',None)],'Confirm whether this is initiation of the stage IIB/IIC adjuvant course. The within-12-weeks surgery criterion applies at initiation, not at every later dose.')
 for suffix,op,val in [('LATE','>',12),('UNASSESSED','missing',None)]:rule('SURGERY_WINDOW_'+suffix,[cond('indication_id','in',stage2),cond('melanoma_starting_adjuvant','==',True),cond('melanoma_weeks_since_surgery',op,val)],'Stage IIB/IIC adjuvant pembrolizumab should start within 12 weeks of surgery. Confirm the interval and specialist plan; do not apply this initiation limit to later cycles.')
 rule('ADVANCED_PLAN_CONFLICT',[cond('indication_id','in',advanced),cond('melanoma_plan','in',['postoperative']+(['perioperative_before','perioperative_after'] if code=='00455' else []))],'Advanced and perioperative/adjuvant melanoma are different treatment settings. Reconcile the selected indication and phase.')
 rule('ADJUVANT_PLAN_CONFLICT',[cond('indication_id','in',adjuvant),cond('melanoma_plan','==','advanced')],'The selected indication is adjuvant melanoma but the phase is advanced disease. Reconcile the treatment setting.')
 if code=='00455':
  for phase,maxdose in [('perioperative_before',3),('perioperative_after',15)]:
   rule('PERIO_STAGE_'+phase.upper(),[cond('indication_id','in',stage2),cond('melanoma_plan','==',phase)],'The source discretionary 3-before/15-after perioperative schedule is specified for eligible stage IIIB melanoma, not the stage IIB/IIC indication.',2)
   for suffix,op,val in [('NOT_CONFIRMED','==',False),('UNASSESSED','missing',None)]:rule('PERIO_ELIGIBILITY_'+phase.upper()+'_'+suffix,[cond('melanoma_plan','==',phase),cond('melanoma_stage_iiib_perioperative_eligible',op,val)],'Confirm stage IIIB, eligibility for the adjuvant indication and the treating clinician’s selection of the perioperative option. Do not infer eligibility from the planned dose count.',2)
   rule('PHASE_LIMIT_'+phase.upper(),[cond('melanoma_plan','==',phase),cond('melanoma_phase_dose_number','>',maxdose)],f'The source phase limit is {maxdose} doses for this perioperative phase. Withhold automatic continuation and reconcile doses already received, missed doses and the next treatment phase.',2,'withhold')
   rule('PHASE_COUNT_'+phase.upper(),[cond('melanoma_plan','==',phase),cond('melanoma_phase_dose_number','missing',None)],f'Record the planned dose number within this phase; its limit is {maxdose}. A missed appointment is not a dose received.',2)
 d['eligibility'] += [x for x in ['Advanced melanoma: no more than one previous systemic treatment for advanced disease; ECOG 0–1.','Adjuvant melanoma: apply the exact stage/resection criteria; stage IIB/IIC cutaneous melanoma (AJCC8) should start within 12 weeks of surgery, ECOG 0–1.'] if x not in d['eligibility']]
 d.setdefault('clinical_governance',{})['melanoma_audit_release']='0.84.41'
 save(p,d)
print('Added melanoma-specific eligibility and perioperative safeguards to 00455 / 00558.')
