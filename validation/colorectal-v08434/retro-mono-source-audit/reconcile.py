from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[3]; HERE=Path(__file__).parent; DATE='2026-11-05'
def pred(f,o,v=None):return dict(field=f,operator=o,**({} if v is None else {'value':v}))
def all_(*p):return {'all':list(p)}
def any_(*p):return {'any':list(p)}
for c,agent in [('00207','cetuximab'),('00225','panitumumab')]:
 p=next((R/'protocols').glob('*/'+c+'-*.json')); d=json.loads((HERE/(c+'-before.json')).read_text()); rules=d['rule_engine']['rules']; by={r['rule_id']:r for r in rules}; m=d['metadata']; inputs=d['input_definitions']
 def src(page,ema=False):return dict(document=('Erbitux' if c=='00207' else 'Vectibix')+' EMA product information (supplementary)' if ema else 'NCCP '+c+' v6',page=page,url=('https://www.ema.europa.eu/en/documents/product-information/'+('erbitux' if c=='00207' else 'vectibix')+'-epar-product-information_en.pdf') if ema else m['source_url'],checked_date=DATE)
 def boolean(k,label):inputs[k]=dict(label=label,type='boolean',required=False,input_role='decision',demo_value='')
 def add(id,when,action,text,page,ema=False):
  row=dict(rule_id=id,when=when,action=dict(type=action,components=[agent],recommendation=text),explanation=text,source=src(page,ema))
  if action=='consultant_review':row['action'].update(show_in_dose_actions=True,dose_calculation='specialist_review')
  rules.append(row);by[id]=row
 for k,id,label in [('adequate_marrow_reserve','MARROW_ELIGIBILITY','Adequate marrow reserve confirmed'),('adequate_renal_hepatic_function','ORGAN_ELIGIBILITY','Adequate renal and hepatic function for treatment confirmed')]:
  boolean(k,label);add(id,pred(k,'==',False),'consultant_review','NCCP requires '+label.lower()+'. Review eligibility; the source gives no numerical exclusion threshold and no automatic dose reduction.',2 if c=='00207' else 1)
 boolean('intolerable_skin_toxicity','Skin reaction clinically intolerable regardless of numerical grade');add('SKIN_INTOLERABLE',pred('intolerable_skin_toxicity','==',True),'withhold','Withhold '+agent+' for intolerable skin toxicity and obtain specialist review; recovery, recurrence and prior dose must be assessed before restart.','4.4',True)
 interval='skin_delay_weeks' if c=='00207' else 'skin_doses_withheld'; restart='SKIN_RESTART_' if c=='00207' else 'SKIN_RECOVERED_'; previous='previous_'+agent+'_dose_'+('mg_m2' if c=='00207' else 'mg_kg')
 inputs[previous]=dict(label='Actual previous '+agent+' maintenance dose (not loading dose)' if c=='00207' else 'Actual previous panitumumab dose',type='number',required=False,input_role='decision',min=0,step=0.01,unit='mg/m²' if c=='00207' else 'mg/kg',demo_value='')
 for n,target in enumerate([250,200,150] if c=='00207' else [6,4.8,3.6],1):
  old=by[restart+str(n)]; base=copy.deepcopy(old['when']);old['when']['all'].append(pred(previous,'>=',target))
  add('SKIN_DOSE_HISTORY_'+str(n),all_(base,any_(pred(previous,'missing'),pred(previous,'<',target))),'consultant_review','Recovery and recurrence criteria meet the source restart row, but actual previous dose is missing or below that row. Do not re-escalate or calculate a replacement dose; consultant must reconcile all prior individual reductions.',3 if c=='00207' else 2)
  old['action']['recommendation']+=' Displayed source dose requires a documented previous dose at least this high; do not re-escalate a lower individual dose.'
  old['explanation']=old['action']['recommendation']
 ctx=any_(pred('acneiform_rash_grade','missing'),pred('skin_failed_recovery','missing'),pred(interval,'missing'),pred(interval,'==',0))
 add('SKIN_RESTART_CONTEXT',all_(pred('skin_occurrence','in',[1,2,3]),ctx),'consultant_review','A previous severe skin episode is recorded. Enter current grade, actual withholding interval and recovery assessment before any restart; missing data cannot establish recovery.',3 if c=='00207' else 2)
 if c=='00207':
  by['SKIN_FAILED']['when']['any'][1]['all'][1]['operator']='>='
  by['SKIN_FAILED']['source']=dict(src('4.4',True),supplementary_basis='NCCP00207 p3 Table2 maximum two-week interruption')
  add('SKIN_LATE_RECOVERY_REVIEW',all_(pred(interval,'>',2),pred('acneiform_rash_grade','<=',2),pred('skin_occurrence','in',[1,2,3])),'consultant_review','Recovery occurred after the NCCP maximum two-week interruption. Do not apply the routine restart table; consultant must establish timing and disposition.',3)
  boolean('egfr_expression_confirmed','For colorectal monotherapy: EGFR expression confirmed');add('CRC_EGFR_ELIGIBILITY',all_(pred('indication_id','==','00207a'),pred('egfr_expression_confirmed','==',False)),'consultant_review','NCCP00207a requires EGFR-expressing RAS wild-type metastatic colorectal cancer with the stated prior-treatment conditions; confirm eligibility.',1)
  boolean('alpha_gal_reaction_risk','Red-meat allergy, tick bites or previous antibody reaction/IgE result raises anaphylaxis risk');add('ANAPHYLAXIS_RISK',pred('alpha_gal_reaction_risk','==',True),'consultant_review','Review red-meat allergy, tick bites, previous antibody reactions and IgE results before infusion. Specialist benefit/risk assessment and anaphylaxis preparedness are required.','4.4',True)
  boolean('ulcerative_keratitis','Confirmed ulcerative keratitis');add('ULCERATIVE_KERATITIS',pred('ulcerative_keratitis','==',True),'withhold','Interrupt cetuximab and obtain ophthalmology/consultant review; the SmPC permits interruption or discontinuation.','4.4',True)
 else:
  for k,id,label,text in [('adult_patient','ADULT_ELIGIBILITY','Adult patient','NCCP00225c is an adult indication. Confirm age and consultant treatment plan.'),('colorectal_prior_therapy_criteria_met','CRC_PRIOR_TREATMENT','Failed fluoropyrimidine, oxaliplatin and irinotecan containing regimens','NCCP00225c monotherapy requires failure of fluoropyrimidine, oxaliplatin and irinotecan containing chemotherapy. Confirm the exact history; RAS wild-type alone does not establish eligibility.')]:boolean(k,label);add(id,pred(k,'==',False),'consultant_review',text,1)
  by['SKIN_FAILED_RECOVERY']['when']=any_(pred('skin_failed_recovery','==',True),all_(pred('acneiform_rash_grade','>=',3),pred(interval,'>=',2)))
  by['ORGAN_FUNCTION']['when']['any'].append(pred('severe_renal_impairment','==',True))
  boolean('pulmonary_fibrosis','Pulmonary fibrosis');add('PULMONARY_FIBROSIS_EXCLUSION',pred('pulmonary_fibrosis','==',True),'contraindicated','Pulmonary fibrosis is an NCCP exclusion; do not administer panitumumab.',1)
  boolean('severe_diarrhoea_or_dehydration','Severe diarrhoea or dehydration');add('DIARRHOEA_DEHYDRATION',pred('severe_diarrhoea_or_dehydration','==',True),'consultant_review','Urgently assess hydration, renal function and clinical severity. Panitumumab-associated severe diarrhoea/dehydration can cause acute renal failure; no numerical dose threshold is specified.',4)
 for row in rules:
  if 'NCCP '+c in row.get('source',{}).get('document',''):row['source']['checked_date']=DATE
 m.update(source_checked_date=DATE,source_pdf_sha256=hashlib.sha256((HERE/(c+'.pdf')).read_bytes()).hexdigest(),sactcheck_encoding_version='0.84.34')
 m['validation'].update(audit_release='0.84.34',audit_date=DATE,software_tests_completed=False,software_validation_record='validation/colorectal-v08434/retro-mono-source-audit/source-case-results.json',consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 
 for row in rules:
  row['source']['checked_date']=DATE;row['source']['checked']=DATE
 m['encoding_maturity'].update(audit_release='0.84.34',audit_date=DATE,reconciled_release='0.84.34',reconciled_date=DATE,source_document_checked=True,scope_note='Fresh official NCCP binary PDF and current EMA product information retrieved and checked. Criterion matrix, source citations, actual-engine boundary and dose-history tests retained. Manual clinical domains and source ambiguities remain explicit; independent clinical and oncology-pharmacy review are pending.')
 m['organ_function_reconciliation'].update(checked_date=DATE,source_version=str(m['nccp_version']),source_url=m['source_url'])
 p.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
