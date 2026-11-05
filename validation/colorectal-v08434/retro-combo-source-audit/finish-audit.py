from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[3];B=Path(__file__).resolve().parent
HPRA='https://assets.hpra.ie/products/Human/22106/Licence_PA0822-212-001_09012025155108.pdf'
def f(k,o,v=None):return {'field':k,'operator':o,**({'value':v} if v is not None else {})}
def a(*xs):return {'all':list(xs)}
def o(*xs):return {'any':list(xs)}
for c in ['00328','00330','00331']:
 file=next((R/'protocols/gastrointestinal').glob(c+'*.json'));p=json.loads(file.read_text());rs=p['rule_engine']['rules'];by={x['rule_id']:x for x in rs};components=['cetuximab','irinotecan']+(['folinic_acid','fluorouracil_bolus','fluorouracil_infusion'] if c=='00328' else [])
 def src(page,table=None):return {'document':f'NCCP {c} v{p["metadata"]["nccp_version"]}','page':page,'url':p['metadata']['source_url'],**({'table':table} if table else {}),'checked_date':'2026-11-05'}
 def add(id,condition,targets,text,source):
  rule={'rule_id':id,'when':condition,'action':{'type':'consultant_review','components':targets,'recommendation':text,'show_in_dose_actions':True,'dose_calculation':'specialist_review'},'explanation':text,'source':source}
  if id in by:rs[rs.index(by[id])]=rule
  else:rs.append(rule)
 def boolean(id,label):p['input_definitions'][id]={'type':'boolean','label':label,'required':False,'input_role':'decision','demo_value':False}
 by['SKIN_FAILED']['when']['any'][1]['all'][1]['operator']='>='
 by['SKIN_FAILED']['related_sources']=[src(5 if c=='00328' else 4,4)]
 add('SKIN_RESTART_CONTEXT',a(f('skin_occurrence','in',[1,2,3]),o(f('acneiform_rash_grade','missing'),f('skin_delay_weeks','missing'),f('skin_failed_recovery','missing'),f('skin_delay_weeks','==',0))),['cetuximab'],'A prior severe skin episode requires documented current recovery, interruption duration and recovery outcome before selecting a restart dose.',src(5 if c=='00328' else 4,4))
 add('SKIN_LATE_RECOVERY_REVIEW',a(f('skin_occurrence','in',[1,2,3]),f('acneiform_rash_grade','<=',2),f('skin_delay_weeks','>',2)),['cetuximab'],'Recovery occurred outside the maximum two-week interruption. Do not infer permission to restart; consultant/pharmacy review is required.',src(5 if c=='00328' else 4,4))
 for key,label in [('adequate_marrow_reserve','Adequate marrow reserve confirmed'),('adequate_renal_hepatic_function','Adequate renal and hepatic function confirmed')]:
  boolean(key,label);add('ELIGIBILITY_'+key.upper(),f(key,'==',False),components,'The source requires '+label.lower()+'. Confirm baseline eligibility clinically; no additional numerical cutoff is invented.',src(2 if c=='00328' else 1))
 boolean('alpha_gal_reaction_risk','Prior antibody reaction, red-meat allergy, tick bite or positive cetuximab IgE history')
 add('ANAPHYLAXIS_RISK',f('alpha_gal_reaction_risk','==',True),['cetuximab'],'Review the complete reaction/allergy history and benefit/risk before infusion; prepare the prescribed premedication, monitoring and emergency response.',src(2))
 if c=='00328':
  boolean('gilbert_syndrome','Known Gilbert syndrome');add('GILBERT_STARTING_DOSE_REVIEW',f('gilbert_syndrome','==',True),['irinotecan'],'Gilbert syndrome increases irinotecan toxicity risk; consider a reduced initial dose and enhanced monitoring with the consultant. No fixed reduction is specified.',src(8))
  boolean('renal_impairment_dpd_phenotype','Moderate/severe renal impairment with uracil-based DPD phenotyping')
  add('DPD_RENAL_PHENOTYPE_REVIEW',f('renal_impairment_dpd_phenotype','==',True),['fluorouracil_bolus','fluorouracil_infusion'],'Renal impairment can increase uracil and cause an incorrect DPD-deficiency interpretation. Consider genotype testing with specialist advice; do not automatically reverse a complete-deficiency contraindication.',src(2))
  p['monitoring'].append('Interpret uracil-based DPD phenotype cautiously in moderate/severe renal impairment; consider genotype testing.') if 'Interpret uracil-based DPD phenotype cautiously in moderate/severe renal impairment; consider genotype testing.' not in p['monitoring'] else None
 for rule in rs:
  s=rule.get('source',{})
  if s.get('url')=='https://backend-prod.medicines.ie/uploads/files/670e966b379ee.pdf':
   s.update(url=HPRA,document='CAMPTO HPRA SmPC dated 09 January 2025 (supplementary; latest medicines.ie revision not verified)',page=3 if s.get('section')=='4.3' else 2)
 p['metadata']['source_pdf_sha256']=hashlib.sha256((B/(c+'.pdf')).read_bytes()).hexdigest()
 file.write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print('Final scoped corrections applied')
