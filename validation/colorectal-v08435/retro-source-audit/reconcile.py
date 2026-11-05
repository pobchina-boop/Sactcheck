"""One-time source reconciliation. Reads retained before snapshots, not an idempotent generator."""
from pathlib import Path
import json,copy
R=Path(__file__).resolve().parents[3];O=Path(__file__).parent;C=['00732','00585','00733','00447','00448']
def load(c):return json.loads(next((R/'protocols').rglob(c+'-*.json')).read_text())
T=load('00331');P=load('00225')
def cond(f,op,v=None):return dict(field=f,operator=op,**({} if op=='missing' else {'value':v}))
def all_(*v):return {'all':list(v)}
def any_(*v):return {'any':list(v)}
for c in C:
 file=next((R/'protocols').rglob(c+'-*.json'));d=json.loads((O/'protocol-before'/file.name).read_text());rs=d['rule_engine']['rules'];defs=d['input_definitions'];url=d['metadata']['source_url'];version=d['metadata']['nccp_version'];rules={r['rule_id']:r for r in rs};cet=c in ['00732','00585','00733'];drug='cetuximab' if cet else 'panitumumab';skinpage={'00732':3,'00585':5,'00733':5,'00447':4,'00448':5}[c]
 def source(page):return dict(document=f'NCCP {c} v{version}',page=page,url=url,checked_date='2026-11-05')
 def add(id,when,type,components,text,page,**kw):
  row=dict(rule_id=id,when=when,action=dict(type=type,components=components,recommendation=text,**kw),explanation=text,source=source(page));rs.append(row);rules[id]=row;return row
 def boolean(key,label):defs[key]=dict(label=label,type='boolean',required=False,input_role='decision',demo_value=False)
 # Own-source skin table matches current sibling restart rows exactly. Retain own rash key and provenance.
 model=T if cet else P
 selected=[r for r in model['rule_engine']['rules'] if r['rule_id'].startswith('SKIN') and r['rule_id'] not in ['SKIN_INTOLERABLE','SKIN_COMPLICATION']]
 new=[]
 for r in selected:
  r=copy.deepcopy(r)
  if not cet:r=json.loads(json.dumps(r).replace('acneiform_rash_grade','rash_grade'))
  r['source']=source(skinpage);new.append(r)
 rs[:]=[r for r in rs if not(r['rule_id'].startswith('SKIN') and r['rule_id']!='SKIN_COMPLICATION')]+new;rules={r['rule_id']:r for r in rs}
 key='previous_cetuximab_dose_mg_m2' if cet else 'previous_panitumumab_dose_mg_kg';defs[key]=copy.deepcopy(model['input_definitions'][key])
 if cet:
  boolean('alpha_gal_reaction_risk','Red-meat allergy, tick-bite reaction or alpha-gal / cetuximab IgE risk')
  add('ANAPHYLAXIS_RISK',cond('alpha_gal_reaction_risk','==',True),'consultant_review',[drug],'Assess red-meat/tick-bite/IgE history before cetuximab; enhanced specialist risk assessment, premedication and monitoring are required.',2,show_in_dose_actions=True,dose_calculation='specialist_review')
  for key,label in [('adequate_marrow_reserve','Adequate marrow reserve confirmed'),('adequate_renal_hepatic_function','Adequate renal and liver status confirmed')]:
   boolean(key,label);add('ELIGIBILITY_'+key.upper(),cond(key,'==',False),'consultant_review',[drug] if c=='00732' else rules['ECOG_ELIGIBILITY']['action']['components'], 'Source eligibility is not established; consultant must reconcile overall suitability and component-specific organ advice.',1 if c=='00732' else 2,show_in_dose_actions=True,dose_calculation='specialist_review')
  # Add all treatment components to combination eligibility review.
  if c!='00732':
   comps=rules['ECOG_ELIGIBILITY']['action']['components']
   for key in ['adequate_marrow_reserve','adequate_renal_hepatic_function']:rules['ELIGIBILITY_'+key.upper()]['action']['components']=comps
 if c!='00732':
  boolean('renal_impairment_dpd_phenotype','Renal impairment may affect uracil-based DPD phenotype interpretation')
  fu=['bolus_5fu','infusional_5fu'] if c=='00447' else ['fluorouracil_bolus','fluorouracil_infusion']
  add('DPD_RENAL_PHENOTYPE_REVIEW',cond('renal_impairment_dpd_phenotype','==',True),'consultant_review',fu,'Renal impairment may raise uracil and cause erroneous DPD phenotyping. Consider genotype testing and reconcile the result before selecting fluorouracil dosing.',2 if c!='00448' else 3,show_in_dose_actions=True,dose_calculation='specialist_review')
 if c=='00585':
  chemo=['irinotecan','folinic_acid','fluorouracil_bolus','fluorouracil_infusion']
  add('DIARRHOEA_COMBINATION_HOLD',cond('diarrhoea_grade','>=',2),'withhold',chemo,'Current grade 2 or worse diarrhoea: hold the FOLFIRI component, including folinic acid. Irinotecan additionally requires complete resolution; review cetuximab timing separately.',6)
  for symptom,key in [('DIARRHOEA','diarrhoea'),('MUCOSITIS','mucositis')]:
   add(symptom+'_RESTART_CONTEXT',all_(cond(key+'_highest_grade','>=',3),any_(cond(key+'_grade','missing'),cond('toxicity_delay_weeks','missing'),cond('toxicity_delay_weeks','>',2))),'consultant_review',chemo,'A previous severe episode requires documented current recovery and the source two-week interval before dose selection. Unknown or late recovery requires individual review.',6,show_in_dose_actions=True,dose_calculation='specialist_review')
 if c=='00733':
  rules['RESPIRATORY']['action']['components']=['cetuximab','oxaliplatin'];rules['RESPIRATORY']['action']['recommendation']='Withhold cetuximab and oxaliplatin and urgently investigate unexplained respiratory symptoms; exclude interstitial lung disease or pulmonary fibrosis before considering oxaliplatin continuation.';rules['RESPIRATORY']['source']=source(5)
  for key,label in [('diarrhoea_grade','DIARRHOEA')]:
   add(label+'_RESTART_CONTEXT',all_(cond('diarrhoea_highest_grade','>=',3),any_(cond(key,'missing'),cond('toxicity_delay_weeks','missing'),cond('toxicity_delay_weeks','>',4))),'consultant_review',['oxaliplatin','folinic_acid','fluorouracil_bolus','fluorouracil_infusion'],'Previous severe diarrhoea requires documented recovery below grade 2 within the four-week restart window; unknown or later recovery requires consultant review.',6,show_in_dose_actions=True,dose_calculation='specialist_review')
 if c=='00447':
  rules['RENAL_LT30']['when']=cond('crcl_ml_min','<',30)
  for id in ['DIARRHOEA_RECOVERED_GRADE3','DIARRHOEA_RECOVERED_GRADE4']:rules[id]['when']=all_(rules[id]['when'],cond('diarrhoea_duration_weeks','<=',4))
  add('DIARRHOEA_RESTART_CONTEXT',all_(cond('diarrhoea_highest_grade','>=',3),any_(cond('diarrhoea_current_grade','missing'),cond('diarrhoea_duration_weeks','missing'),cond('diarrhoea_duration_weeks','>',4))),'consultant_review',['oxaliplatin','folinic_acid','bolus_5fu','infusional_5fu'],'Prior severe diarrhoea requires documented recovery below grade 2 within four weeks before selecting a restart dose. Unknown or later recovery requires consultant review.',5,show_in_dose_actions=True,dose_calculation='specialist_review')
 # Folinic acid follows omission/hold of bolus fluorouracil per source table footnote.
 if c!='00732':
  for rule in rs:
   act=rule['action'];comps=act.get('components',[])
   if act['type'] in ['withhold','contraindicated','discontinue','permanently_discontinue'] and any(x in comps for x in ['bolus_5fu','fluorouracil_bolus']) and 'folinic_acid' not in comps:comps.append('folinic_acid')
 # Preserve table-specific legacy diarrhoea grading; explicitly separate generic descriptor aid from source attribution.
 for key,x in defs.items():
  if x.get('ctcae_version')=='5.0' and not (not cet and key=='rash_grade'):
   x['ui_reference_ctcae_version']='5.0';x['ui_reference_ctcae_source_url']=x.get('ctcae_source_url');x['ctcae_version']='NCCP source grading; edition not specified';x['ctcae_source_url']=url;x['assessment_guidance']=(x.get('assessment_guidance','')+' NCCP does not specify CTCAE edition for this row; displayed v5 descriptors are orientation only, not a source-edition conversion.').strip()
  x.setdefault('input_role','decision');x.setdefault('demo_value',False if x.get('type')=='boolean' else 0)
 for rule in rs:
  if rule.get('source',{}).get('url')==url:rule['source']['checked_date']='2026-11-05'
 d['metadata']['clinical_audit_release']='0.84.35';d['metadata']['source_checked_date']='2026-11-05';d['metadata'].setdefault('validation',{}).update(audit_release='0.84.35',audit_date='2026-11-05',clinical_use_authorised=False)
 file.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 print(c,len(rs))
