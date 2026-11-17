"""Synchronise authored protocol administration, cards and source input metadata."""
import json,pathlib,subprocess,hashlib
R=pathlib.Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
S=read('validation/gu-v08458/scope.json');I=read('protocols/index.json');sources={r['code']:r for r in read('validation/gu-v08458/clinical/new-and-repeat-sources.json')}
def row(drug,dose,days,note='',route='IV'):return dict(drug=drug,dose_text=dose,route=route,days=days,note=note)
admins={
 '00282':[row('gemcitabine','1000 mg/m²',[1,8,15],'Over 30 minutes.'),row('cisplatin','70 mg/m²',[1],'After gemcitabine; source also permits day 2. Over 60 minutes with prescribed hydration.')],
 '00622':[row('gemcitabine','1000 mg/m²',[1,8],'Over 30 minutes.'),row('cisplatin','35 mg/m²',[1,8],'Over 60 minutes with hydration on both treatment days.')],
 '00628':[row('gemcitabine','1000 mg/m²',[1,8],'Over 30 minutes.'),row('cisplatin','70 mg/m²',[1],'Over 60 minutes with hydration. Four adjuvant cycles.')],
 '00450':[row('mitomycin','12 mg/m²',[1],'One IV bolus dose via a fast-running sodium chloride 0.9% infusion; verify access.'),row('fluorouracil','500 mg/m²/day',['1–5','22–26'],'Each pump: 2500 mg/m² total over 120 hours. Concurrent prescribed radiotherapy; not a repeating 28-day cycle.')],
 '00759':[row('gemcitabine','100 mg/m²',[1,8,15,22],'Over 30 minutes, 2–4 hours before radiotherapy. One course only.')],
 '00333':[row('methotrexate','30 mg/m²',[1]),row('vinblastine','3 mg/m²',[2],'Intravenous only; fatal if given intrathecally.'),row('doxorubicin','30 mg/m²',[2],'Confirm cardiac function and cumulative lifetime dose.'),row('cisplatin','70 mg/m²',[2],'Over 60 minutes with hydration. Prescribed G-CSF days 3–7 is required support.')],
 '00337':[row('methotrexate','30 mg/m²',[1,8],'Folinic acid 15 mg PO/IV every six hours for four doses, starting 24 hours after each methotrexate dose (days 2 and 9).'),row('vinblastine','4 mg/m²',[1,8],'Intravenous only; fatal if given intrathecally.'),row('cisplatin','100 mg/m²',[2],'Over 120 minutes with hydration. Body schedule q21 days; erroneous q14-day footer requires reconciliation.')],
 '00338':[row('methotrexate','30 mg/m²',[1,15,22]),row('vinblastine','3 mg/m²',[2,15,22],'Intravenous only; fatal if given intrathecally.'),row('doxorubicin','30 mg/m²',[2],'Confirm cardiac function and cumulative lifetime dose.'),row('cisplatin','70 mg/m²',[2],'Over 60 minutes with hydration.')],
 '00583':[row('pembrolizumab','200 mg',[1],'Over 30 minutes every 21 days. Never dose-reduce.'),row('axitinib','5 mg twice daily',['Continuous'],'About 12 hours apart, with or without food; dose changes require source-specific review. Do not replace a missed/vomited dose.','PO')],
 '00846':[row('enfortumab vedotin','1.25 mg/kg',[1,8,15],'Over 30 minutes; cap 125 mg. Reduction levels 1.0, 0.75, 0.5 mg/kg with caps 100, 75, 50 mg. Confirm prior level; no automatic extra reduction.')]
}
intent={'00282':'advanced_disease','00622':'advanced_disease','00628':'adjuvant','00450':'curative','00759':'curative','00333':'advanced_disease','00337':'neoadjuvant','00338':'mixed','00583':'advanced_disease','00846':'advanced_disease'}
records={}
for code,admin in admins.items():
 e=next(e for e in I['protocols'] if '/'+code+'-' in e['path']);p=read(e['path']);m=p['metadata'];t=p['treatment'];m['canonical_protocol_id']=p['protocol_id'];m['treatment_context']=intent[code]
 m['source_reconciliation_supersedes']=['0.70.0','0.70.1']
 m['validation']=dict(official_catalogue_and_source_link_checked=True,source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,rule_level_source_reconciliation_status='source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation')
 m['drugs']=[a['drug']for a in admin];t['administration']=admin
 contexts=[dict(id=p['indications'][0]['indication_id'],intent=intent[code],cycle_length_days=t['cycle_length_days'],duration_type=t['duration_type'],duration_text=t['duration_text'],provenance='official_nccp_source_reconciled')]
 if 'planned_cycles' in t:contexts[0]['planned_cycles']=t['planned_cycles']
 if code=='00338':
  contexts=[dict(contexts[0],id='00338-'+i,intent=i,planned_cycles=n,duration_text=str(n)+(' cycles' if i!='advanced_disease' else ' cycles maximum'))for i,n in [('neoadjuvant',3),('adjuvant',4),('advanced_disease',6)]]
 m['regimen_card']=dict(contexts=contexts,provenance=dict(source=m['source_url'],source_checked='2026-11-17',reviewed=False))
 fields=set()
 def visit(x):
  if isinstance(x,dict):
   if 'field'in x:fields.add(x['field'])
   for v in x.values():visit(v)
  elif isinstance(x,list):
   for v in x:visit(v)
 for rule in p['rule_engine']['rules']:visit(rule.get('when',{}))
 for field,d in p['input_definitions'].items():
  d['input_role']='decision' if field in fields else 'context'
  if d.get('renal_input') and field=='crcl_ml_min':d['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=m['source_url'],reason='Use the measured/estimated creatinine clearance appropriate to this NCCP table; retain exact source boundaries and do not substitute or round an eGFR automatically.')
  if d.get('type')=='select' and 'grade' in field and not d.get('source_grading_note'):
   edition='4.0' if code=='00583' and (field.startswith('immune') or field.startswith('other_immune') or field in ['adrenal_insufficiency_grade','hypophysitis_grade','hyperthyroidism_grade','infusion_reaction_grade']) else '5.0' if code=='00846' else None
   d.update(grading_source_url=m['source_url'],grading_source_label='NCCP '+code+' v'+str(m['nccp_version'])+': clinician-confirmed toxicity grade',source_grading_note=('The NCCP table specifies CTCAE '+edition+'. ' if edition else 'The relevant NCCP table does not identify a CTCAE edition. ')+'Use event-specific clinical criteria; this table gives treatment actions, not an automatic grading calculation.',assessment_guidance='Confirm the named event, clinical severity, attribution, recovery and recurrence. A grade is not inferred from an isolated laboratory result.')
   if edition:d['ctcae_version']=edition
   for opt in d['options']:
    opt['label']='Grade '+str(opt['value'])+' — clinician confirmed';opt['description']='No named event reported.' if str(opt['value'])=='0' else 'Clinician-confirmed grade '+str(opt['value'])+' for the named adverse event. Use the applicable event-specific criteria before selecting this grade.'
  if field=='ecog':
   for opt,desc in zip(d['options'],['Fully active.','Restricted strenuous activity but ambulatory.','Ambulatory and capable of self-care; up more than half of waking hours.','Limited self-care; bed/chair more than half of waking hours.','Completely disabled; confined to bed/chair.']):opt['description']=desc
 save(e['path'],p);e['id']=p['protocol_id']
 for k in ['title','short_title','nccp_version','source_url']:
  if k in e:e[k]=m[k]
 raw=(R/e['path']).read_bytes();before=subprocess.check_output(['git','show','HEAD:'+e['path']],cwd=R)
 records[code]=dict(path=e['path'],sha256=hashlib.sha256(raw).hexdigest(),before_sha256=hashlib.sha256(before).hexdigest(),source_pdf='validation/gu-v08458/clinical/sources/'+code+'.pdf',source_sha256=sources[code]['sha256'],source_url=m['source_url'],source_version=m['nccp_version'],grading_fields={k:v for k,v in p['input_definitions'].items()if 'grade'in k and v.get('type')=='select'})
save('protocols/index.json',I)
# Use the canonical normalizer; raw authoring contexts are not the sidecar schema.
subprocess.run(['node','tools/add-regimen-card-metadata.js'],cwd=R,check=True)
save('validation/gu-v08458/clinical/clinical-migration.json',dict(release='0.84.58',base_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),records=records))
f=R/'js/protocol-id-migrations.js';s=f.read_text();new=read('validation/gu-v08458/clinical/id-migrations.json');pairs=','.join(repr(x['from'])+':'+repr(x['to']) for x in new if repr(x['from'])+':' not in s)
if pairs:s=s.replace('Object.freeze({','Object.freeze({'+pairs+',',1);f.write_text(s)
f=R/'404.html';s=f.read_text();prefix='|'.join(admins)+'|';s=s if '('+prefix+'00104|' in s else s.replace('(00104|','('+prefix+'00104|');f.write_text(s)
print('Synchronized',len(records),'source records and explicit administration schedules')
