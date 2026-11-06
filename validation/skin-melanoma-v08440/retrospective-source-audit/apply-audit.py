import json,hashlib,re
from pathlib import Path
R=Path(__file__).resolve().parent
STAGE=R.parent
sources={x['code']:x for x in json.loads((R/'sources.json').read_text()) if 'code' in x}
F=lambda f,o,v=None:dict(field=f,operator=o,**({} if v is None else {'value':v}))
ALL=lambda *x:{'all':list(x)}
ANY=lambda *x:{'any':list(x)}
def boolean(label,help=''):
 return dict(label=label,type='boolean',required=False,demo_value='',input_role='decision',ui_section='clinical',help=help)
def rule(j,rid,pred,action,message,page,table=None):
 s=sources[j['metadata']['nccp_code']] if 'nccp_code' in j['metadata'] else current
 source=dict(document=f'NCCP {s["code"]} v{j["metadata"]["nccp_version"]}',url=s['url'],page=page,checked_date='2026-11-06')
 if table:source['table']=table
 return dict(rule_id=rid,priority=20,when=pred,action=dict(type=action,components=['pembrolizumab'] if s['code'] in ['00455','00558'] else ['nivolumab','ipilimumab'] if s['code']=='00551' else ['nivolumab'],recommendation=message,message=message),explanation=message,source=source)
changes=[]
for c,current in sources.items():
 p=R/'protocol-before'/Path(current['protocol_path']).name;j=json.loads(p.read_text());defs=j['input_definitions'];rules=j['rule_engine']['rules'];finding=[]
 if c in ['00455','00558']:
  defs['pembro_restart_requested']=boolean('Assess restarting pembrolizumab after an immune-related treatment hold')
  defs['pembro_source_recovery_complete']=boolean('Source-specific recovery criteria met for the prior immune event','Usually grade 0–1. Use the Table 1 endocrine exception when applicable: prior grade 3–4 endocrinopathy improved to grade 2 or lower and controlled with hormone replacement. This is not a global treatment clearance.')
  defs['pembro_steroid_management_complete']=boolean('Required corticosteroid management/taper completed or not needed','Confirm against the specific toxicity and Table 1 endocrine exception. The existing 12-week failure/taper stop rules remain applicable; do not infer a new universal restart dose threshold.')
  defs['pembro_consultant_restart_approved']=boolean('Consultant has confirmed the post-toxicity restart plan')
  unmet=ANY(*[ANY(F(k,'missing'),F(k,'==',False)) for k in ['pembro_source_recovery_complete','pembro_steroid_management_complete','pembro_consultant_restart_approved']])
  rules.append(rule(j,'PEMBRO_RESTART_UNCONFIRMED',ALL(F('pembro_restart_requested','==',True),unmet),'withhold','Do not restart while source-specific recovery, required steroid management/taper or consultant confirmation is incomplete or unassessed. Apply the specific endocrine continuation exception where appropriate. A permanent-stop criterion overrides any restart plan.', '5–6','Table 1 and dose modifications'))
  finding=['Structured restart assessment lacked recovery, required taper/management and consultant-confirmation gates. Added one explicit requested-restart hold; source endocrine exceptions and all existing numerical, recurrence and 12-week stop thresholds remain unchanged.']
 elif c in ['00483','00484']:
  defs['endocrine_symptoms']=boolean('Current symptoms from the assessed thyroid or pituitary immune event','For grade 2–3 hypothyroidism, hyperthyroidism or hypophysitis, distinguish symptoms from asymptomatic hormone replacement. Grade 4 stop rules remain applicable.')
  for f in ['hypothyroidism_grade','hyperthyroidism_grade','hypophysitis_grade']:
   defs[f]['label']=defs[f]['label'].replace('Symptomatic immune','Immune')
   for o in defs[f]['options']:
    if o['value'] in [2,3]:o['description']='Withhold when symptomatic; confirm symptom status and source recovery. Controlled hormone replacement without symptoms does not itself require withholding. Source CTCAE v4 grading.'
   rid=f.upper()+'_HOLD'; rr=next(x for x in rules if x.get('id',x.get('rule_id'))==rid)
   rr['when']=ALL(rr['when'],F('endocrine_symptoms','==',True));rr['source']['checked_date']='2026-11-06';rr['source']['page']=7
   unknown=ALL(F(f,'in',[2,3]),F('endocrine_symptoms','missing'),ANY(F('endocrine_controlled_asymptomatic','missing'),F('endocrine_controlled_asymptomatic','==',False)))
   rules.append(rule(j,f.upper()+'_CONTEXT',unknown,'consultant_review','Confirm current endocrine symptoms and whether hormone replacement has achieved control. Missing symptom status is not evidence of asymptomatic recovery; do not automatically withhold from grade 2–3 alone.',7,'Table 3'))
  defs['other_immunosuppressive_treatment']=boolean('Receiving another systemic immunosuppressive treatment','Relevant to restart after immune toxicity. Physiological hormone replacement alone is not immunosuppressive treatment.')
  rules.append(rule(j,'RESTART_OTHER_IMMUNOSUPPRESSION',ALL(F('restart_assessment_requested','==',True),F('other_immunosuppressive_treatment','==',True)),'withhold','Do not resume nivolumab while another immunosuppressive treatment is being given. Confirm the event-specific recovery and consultant plan; hormone replacement alone is a separate circumstance.',6,'Dose modifications'))
  finding=['Grade 2–3 thyroid/pituitary hold rules ignored symptom status, including the existing controlled/asymptomatic field. Added explicit symptom gating and missing-context review; grade 4 stops unchanged.','Restart check covered systemic corticosteroid dose but omitted another immunosuppressive treatment. Added the explicit source guard.']
 else:
  defs['sjs_ten_suspected']=boolean('Symptoms or signs suggest SJS/TEN, not yet confirmed','Stop treatment and obtain urgent specialist assessment; confirmed SJS/TEN retains the permanent discontinuation rule.')
  rules.append(rule(j,'SJS_TEN_SUSPECTED',F('sjs_ten_suspected','==',True),'discontinue','Symptoms or signs of SJS/TEN: discontinue treatment and refer urgently to a specialised unit for assessment and treatment. Do not await confirmation before stopping; confirmed SJS/TEN requires permanent discontinuation.',9,'Table 3 skin adverse reactions'))
  defs['maintenance_schedule_switch']=dict(label='Switching established nivolumab maintenance interval',type='select',required=False,demo_value='',input_role='decision',ui_section='clinical',options=[dict(value='none',label='No maintenance interval switch'),dict(value='q14_to_q28',label='Every 14 days to every 28 days'),dict(value='q28_to_q14',label='Every 28 days to every 14 days')],help='Applies only to established nivolumab monotherapy maintenance. The first dose after combination treatment has separate 21/42-day rules; formulation and indication restrictions still apply.')
  defs['days_since_last_maintenance_dose']=dict(label='Days since last nivolumab maintenance dose',type='number',required=False,demo_value='',min=0,step=1,unit='days',input_role='decision',ui_section='clinical')
  for choice,days in [('q14_to_q28',14),('q28_to_q14',28)]:
   rules.append(rule(j,'MAINTENANCE_SWITCH_'+choice.upper(),ALL(F('maintenance_schedule_switch','==',choice),F('days_since_last_maintenance_dose','<',days)),'withhold',f'Withhold an early maintenance interval switch: the first new-schedule dose is due {days} days after the last maintenance dose on the previous schedule. Confirm indication and formulation; this does not authorise a schedule excluded for that indication.',2,'Switching monotherapy dosing schedule'))
  rules.append(rule(j,'MAINTENANCE_SWITCH_CONTEXT',ALL(F('maintenance_schedule_switch','in',['q14_to_q28','q28_to_q14']),F('days_since_last_maintenance_dose','missing')),'consultant_review','Confirm the previous maintenance dose date before switching: 14 days after the last 14-day dose, or 28 days after the last 28-day dose. Missing timing cannot establish that the switch is due.',2,'Switching monotherapy dosing schedule'))
  finding=['Suspected SJS/TEN had no executable cessation/referral pathway before confirmation; added discontinue/referral, retaining confirmed permanent stop.','Maintenance switch interval text was not executable: added source 14/28-day early-dose guards and missing-timing review; first-maintenance and indication-specific formulation rules unchanged.']
 previous_audit_metadata={k:j['metadata'].get(k) for k in ['clinical_audit_release','validation','source_pdf_sha256','source_sha256','source_checked_date']}
 previous_hash=j['metadata'].get('source_pdf_sha256',j['metadata'].get('source_sha256'))
 j['metadata']['clinical_audit_release']='0.84.40'
 j['metadata']['source_pdf_sha256']=current['sha256']
 j['metadata']['validation']=dict(j['metadata'].get('validation',{}),audit_release='0.84.40',rule_level_source_reconciliation_status='source_reconciled_v08440_independent_review_pending',source_document_checked=True,official_catalogue_and_source_link_checked=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 if 'software_test_release' in j['metadata']['validation']:j['metadata']['validation']['software_test_release']='0.84.40'
 if 'software_test_release' in j['metadata']:j['metadata']['software_test_release']='0.84.40'
 if not j['metadata'].get('review_date'):
  from datetime import datetime
  j['metadata']['review_date']=datetime.strptime(current['review_date'],'%d/%m/%Y').date().isoformat()
 j['metadata']['retrospective_audit_v08440']={'source_retrieved':'2026-11-06','source_pdf_sha256':current['sha256'],'source_version':j['metadata']['nccp_version'],'source_bytes_unchanged':current['sha256']==previous_hash if previous_hash else None,'scope':'Bounded repeat audit of existing shared ICI assessment; does not establish new melanoma service completion. Current NCCP thresholds, recovery, recurrence and phase/schedule boundaries checked.','findings':finding,'clinical_use_authorised':False,'independent_clinical_approval':False,'previous_audit_metadata':previous_audit_metadata}
 out=STAGE/current['protocol_path'];out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(j,indent=2,ensure_ascii=False)+'\n')
 changes.append({'code':c,'protocol_path':current['protocol_path'],'before_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'after_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'findings':finding,'rules_before':len(json.loads(p.read_text())['rule_engine']['rules']),'rules_after':len(rules),'independent_clinical_approval':False})
(R/'changes.json').write_text(json.dumps(changes,indent=2)+'\n')
print(json.dumps(changes,indent=2))
