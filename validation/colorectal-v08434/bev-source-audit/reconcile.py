from pathlib import Path
import json,copy,hashlib
HERE=Path(__file__).parent;R=HERE.parents[2];DATE='2026-11-05'
def pred(f,o,v):return dict(field=f,operator=o,value=v)
base=json.loads((HERE/'00214-before.json').read_text());templates={r['rule_id']:r for r in base['rule_engine']['rules']}
for c in ['00212','00214','00215']:
 p=next((R/'protocols').glob('*/'+c+'-*.json'));d=json.loads((HERE/(c+'-before.json')).read_text()); m=d['metadata'];rules=d['rule_engine']['rules'];by={r['rule_id']:r for r in rules}
 def src(page):return dict(document='NCCP '+c+' version '+str(m['nccp_version']),url=m['source_url'],page=page,checked_date=DATE,checked=DATE)
 def add(id,when,text,page):
  row=dict(rule_id=id,when=when,action=dict(type='consultant_review',components=['bevacizumab'],recommendation=text),explanation=text,source=src(page));rules.append(row);by[id]=row;return row
 add('AGE_OVER65_ATE_CAUTION',pred('age_years','>',65),'Age over65 increases arterial thromboembolism risk with bevacizumab plus chemotherapy. Review vascular risk and treatment suitability; age alone is not an exclusion.',6 if c!='00215' else 7)
 for id in ['BP_NUMERIC_REVIEW','RADIOTHERAPY_REVIEW']:
  if id not in by:
   row=copy.deepcopy(templates[id]);row['source']=src(6 if c=='00212' else 7)
   if id=='RADIOTHERAPY_REVIEW' and c=='00212':row['source']=dict(templates[id]['source'],document='Supplementary current NCCP00214 v8 (not in00212 v7)',checked_date=DATE,checked=DATE)
   rules.append(row);by[id]=row
  for k in (['systolic_bp_mmhg','diastolic_bp_mmhg'] if id=='BP_NUMERIC_REVIEW' else ['concurrent_radiotherapy']):
   if k not in d['input_definitions']:d['input_definitions'][k]=copy.deepcopy(base['input_definitions'][k])
 row=by['EGFR_ANTIBODY_INTERACTION'];text='Do not administer panitumumab or cetuximab with bevacizumab-containing chemotherapy for metastatic colorectal cancer. Review and correct the entire combination with the consultant; this component assessment does not independently prescribe the partner regimen.';row['action'].update(type='withhold',recommendation=text);row['explanation']=text
 if c=='00212':
  row['source']=dict(templates['EGFR_ANTIBODY_INTERACTION']['source'],document='Supplementary current NCCP00214 v8 (interaction text absent from00212 v7)',page=6,checked_date=DATE,checked=DATE)
  by['SUNITINIB_INTERACTION']['source']=dict(row['source'])
 d['input_definitions']['high_risk_history']['help']+=' Specifically assess history of aneurysm or arterial dissection and intra-abdominal inflammation.'
 text=by['HIGH_RISK_HISTORY']['action']['recommendation']+' Include aneurysm/dissection history and intra-abdominal inflammation.';by['HIGH_RISK_HISTORY']['action']['recommendation']=text;by['HIGH_RISK_HISTORY']['explanation']=text
 if c=='00215':
  for id,ind,label in [('NSCLC_COMBINATION_LIMIT','nonsquamous_nsclc_platinum','NSCLC platinum'),('OVARIAN_COMBINATION_LIMIT','ovarian_frontline_or_continuation','frontline ovarian carboplatin/paclitaxel')]:
   add(id,{'all':[pred('indication_id','==',ind),pred('treatment_context','==','combination'),pred('cycle_number','>',6)]},'The '+label+' combination phase is up to six cycles. Review the active phase and companion treatment before extending. Bevacizumab continuation is a separate consultant-approved phase.',2)
 for row in rules:
  if row.get('source',{}).get('url')==m['source_url']:row['source']['checked_date']=DATE;row['source']['checked']=DATE
 m.update(source_checked_date=DATE,source_pdf_sha256=hashlib.sha256((HERE/(c+'.pdf')).read_bytes()).hexdigest(),sactcheck_encoding_version='0.84.34')
 m['validation'].update(audit_release='0.84.34',audit_date=DATE,software_tests_completed=False,software_validation_record='validation/colorectal-v08434/bev-source-audit/source-case-results.json',consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 
 for row in rules:
  row['source']['checked_date']=DATE;row['source']['checked']=DATE
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
