"""Synchronise source-specific administration and review metadata for six GU codes."""
import hashlib,json,pathlib,re,subprocess
R=pathlib.Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
S=read('validation/gu-v08459/scope.json');I=read('protocols/index.json');sources={x['code']:x for x in read('validation/gu-v08459/clinical/new-and-repeat-sources.json')}
def row(drug,dose,days,note,route='IV'):return dict(drug=drug,dose_text=dose,route=route,days=days,note=note)
admins={
 '00453':[row('carboplatin','AUC7',[-5,-4,-3],'Over30 minutes. Source Calvert formula, GFR cap125 mL/min; specialist transplant prescription.'),row('etoposide','750 mg/m²',[-5,-4,-3],'Over2 hours. Autologous stem cells day0; G-CSF from day+1 until ANC>1 on2 consecutive days.')],
 '00602':[row('paclitaxel','175 mg/m²',[1],'Over3 hours with prescribed allergy premedication.'),row('cisplatin','20 mg/m²',[1,2,3,4,5],'Over1 hour with hydration/electrolytes.'),row('ifosfamide','1200 mg/m²',[1,2,3,4,5],'Over2 hours; mesna400 mg/m² before and4/8 hours AFTER completion. G-CSF from day6.')],
 '00807':[row('bacillus Calmette-Guérin intravesical','One prescribed vial',[1],'Weekly induction×6; risk-specific maintenance. NCCP dwell1–2hours; confirm product-specific instructions.','Intravesical')],
 '00885':[row('erdafitinib','8 mg once daily',['Continuous'],'Possible9 mg escalation only after day14–21 phosphate/toxicity review; swallow whole.','PO')],
 '00894':[row('gemcitabine intravesical','1000 mg',[1],'50 mL in syringe; dwell60 minutes, then drain. Source permits988 mg with38 mg/mL vial.','Intravesical'),row('docetaxel intravesical','40 mg',[1],'After draining gemcitabine;50 mL in syringe; dwell60 minutes.90-minute dwells may be used.','Intravesical')],
 '00945':[row('enfortumab vedotin','1.25 mg/kg (cap125 mg)',[1,8],'Over30 minutes, before pembrolizumab. Alternative42-day schedule: days1,8,22,29.'),row('pembrolizumab','200 mg',[1],'Over30 minutes q21 days; alternative400 mg day1 q42. No dose reduction.')]
}
def tidy(s):
 s=re.sub(r'(\d)(mg|minutes|hours|weeks|months|days|years|cycles)\b',r'\1 \2',s)
 return re.sub(r'\b(day|days|month|months|grade|Grade|cap|over|Over|before|after|from|with|until|NCCP)(?=\d)',r'\1 ',s)
def strings(v):
 if isinstance(v,str):return tidy(v)
 if isinstance(v,list):return [strings(x)for x in v]
 if isinstance(v,dict):return {k:(x if k in ['url','source_url','protocol_id','rule_id','field','value','file_name']else strings(x))for k,x in v.items()}
 return v
records={}
for code in S['new_service_codes']:
 e=next(e for e in I['protocols']if '/'+code+'-'in e['path']);p=read(e['path']);m=p['metadata'];t=p['treatment'];m['canonical_protocol_id']=p['protocol_id'];m['source_reconciliation_supersedes']=['0.70.0','0.70.1']
 m['validation']=dict(official_catalogue_and_source_link_checked=True,source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,rule_level_source_reconciliation_status='source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation')
 t['administration']=admins[code]
 if code=='00945':t['schedule_options']=[dict(id='q21',cycle_length_days=21,ev_days=[1,8],pembrolizumab_mg=200,pembrolizumab_days=[1]),dict(id='q42',cycle_length_days=42,ev_days=[1,8,22,29],pembrolizumab_mg=400,pembrolizumab_days=[1])]
 if code=='00453':t.update(calendar_origin='autologous_stem_cell_infusion_day0',not_automatic_repeating_cycle=True)
 intent='curative'if code in ['00453','00602','00807','00894']else'advanced_disease'
 m['regimen_card']=dict(contexts=[dict(id=p['indications'][0]['indication_id'],intent=intent,cycle_length_days=t['cycle_length_days'],duration_type=t['duration_type'],duration_text=t['duration_text'],provenance='official_nccp_source_reconciled',**({'planned_cycles':4}if code=='00602'else{}))],provenance=dict(source=m['source_url'],source_checked='2026-11-17',reviewed=False))
 fields=set()
 def visit(v):
  if isinstance(v,dict):
   if 'field'in v:fields.add(v['field'])
   for a in v.values():visit(a)
  elif isinstance(v,list):
   for a in v:visit(a)
 for rule in p['rule_engine']['rules']:visit(rule['when'])
 for field,d in p['input_definitions'].items():
  d['input_role']='decision'if field in fields else'context'
  if field in ['crcl_ml_min','gfr_ml_min']:d['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=m['source_url'],reason='Retain source units and exact boundaries. GFR for Calvert dosing and CrCl for toxicity tables are not interchangeable without clinical confirmation.')
  if d.get('type')=='select'and'grade'in field:
   edition='4.0'if code=='00945'and(field.startswith('immune')or field in ['other_immune_grade','adrenal_insufficiency_grade','hypophysitis_grade','hyperthyroidism_grade','infusion_reaction_grade'])else'5.0'if code in ['00945','00885']else None
   d.update(grading_source_url=m['source_url'],grading_source_label='NCCP '+code+': clinician-confirmed toxicity grade',source_grading_note=('CTCAE '+edition+'. 'if edition else'Table does not specify an edition. ')+'Use event-specific clinical criteria; the tool does not derive a grade from an isolated value.',assessment_guidance='Confirm the event, attribution, severity, recurrence and recovery before selecting a grade.')
   if edition:d['ctcae_version']=edition
   for opt in d['options']:opt.update(label='Grade '+str(opt['value'])+' — clinician confirmed',description='Confirm the named event using its applicable clinical grading criteria.')
 p=strings(p);save(e['path'],p)
 for k in ['title','short_title','nccp_version','source_url']:
  if k in e:e[k]=p['metadata'][k]
 e['id']=p['protocol_id'];b=(R/e['path']).read_bytes();records[code]=dict(path=e['path'],sha256=hashlib.sha256(b).hexdigest(),source_pdf='validation/gu-v08459/clinical/sources/'+code+'.pdf',source_sha256=sources[code]['sha256'],source_version=p['metadata']['nccp_version'])
save('protocols/index.json',I);save('validation/gu-v08459/clinical/clinical-migration.json',dict(release='0.84.59',base_commit=S['base_commit'],records=records))
subprocess.run(['node','tools/add-regimen-card-metadata.js'],cwd=R,check=True)
p=R/'js/protocol-id-migrations.js';s=p.read_text();pairs=','.join(repr(x['from'])+':'+repr(x['to'])for x in read('validation/gu-v08459/clinical/id-migrations.json')if repr(x['from'])+':'not in s)
if pairs:p.write_text(s.replace('Object.freeze({','Object.freeze({'+pairs+',',1))
p=R/'404.html';s=p.read_text();p.write_text(s.replace('(00104|','('+'|'.join(S['new_service_codes'])+'|00104|',1))
print('Six administration tables and source review records synchronised.')
