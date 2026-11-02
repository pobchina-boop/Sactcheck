"""Record the explicit patient migration and preserve every unrelated bundle."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];O=R/'validation/lung-cytotoxic-v08429'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
base=read('validation/lung-cytotoxic-v08429/baseline-hashes.json');scope=read('validation/lung-cytotoxic-v08429/scope.json');codes=scope['new_codes']+scope['retrospective_codes'];changes={};preserved=0
for p,h in base['files'].items():
 if not p.startswith(('patient/','docs/patient/','data/patient-knowledge/','data/patient-knowledge-contexts/')):continue
 selected=any(p.startswith(f'{b}/{c}/') or p==f'{b}/{c}.json' for c in codes for b in ['patient','docs/patient','data/patient-knowledge','data/patient-knowledge-contexts'])
 after=digest(p)
 if after!=h:
  assert selected,('Outside-scope patient change',p)
  if any('/'+c+'/' in p or p.endswith('/'+c+'.json') for c in ['00203','00232','00259']):assert '/lung/' in p or p.endswith('/lung.json'),('Shared canonical patient content changed',p)
  changes[p]=dict(before=h,after=after)
 else:preserved+=1
write('validation/lung-cytotoxic-v08429/retrospective-hashes.json',dict(release='0.84.29',scope=scope,codes=codes,files=changes))
write('validation/lung-cytotoxic-v08429/preservation-check.json',dict(base_release='0.84.28',unchanged_existing_patient_files=preserved,scoped_changed_files=len(changes),unexpected_changes=[]))
protected=read('data/protected-patient-assets-v0810.json');protected.update(release='0.84.29',content_release='0.84.29',policy='Scoped v29 cytotoxic review and three-page patient-pack migration; shared canonical breast bundles preserved.')
for c in codes:protected['assets'][c]={str(p.relative_to(R/'patient'/c)):dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/'patient'/c).rglob('*')) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
write('data/protected-patient-assets-v0810.json',protected)
write('validation/lung-cytotoxic-v08429/shared-builder-revisions.json',{p:dict(before=h,after=digest(p)) for p,h in base['files'].items() if p.startswith('tools/') and (R/p).exists() and digest(p)!=h})
inventory=read('validation/lung-backbones-v08428/retrospective-inventory.json')
for c in scope['new_codes']:
 d=read(f'data/patient-knowledge/{c}.json');inventory['rows'].append(dict(code=c,title=d['title'],authored_release='0.84.29',review_release='0.84.29',family='Lung cytotoxic',longitudinal_map_present=True,clinical_approval='not_established_by_this_inventory',new_rationale_evidence_status='reviewed_v08429_clinical_approval_pending',patient_numeric_evidence_present=False,next_action='Independent clinical/pharmacy and patient/PPI review.'))
for row in inventory['rows']:
 if row['code'] in scope['retrospective_codes']:row.update(review_release='0.84.29',new_rationale_evidence_status='reviewed_v08429_clinical_approval_pending')
inventory['rows'].sort(key=lambda x:x['code']);assert len(inventory['rows'])==154
inventory.update(release='0.84.29',authored_suites=154,complete_canonical_bundles=152,selector_only_records=2,separate_context_suites=14,authored_context_suites=166,reviewed_cumulative=154,new_suites=5,retrospective_revised=5,new_indication_contexts=3,reviewed_this_release=10,remaining_review_queue=0,scope_note='154 canonical records include two selectors.152 complete canonical bundles plus14 distinct context bundles=166 complete bundles. This inventory does not establish clinical approval.')
write('validation/lung-cytotoxic-v08429/retrospective-inventory.json',inventory)
lung=read('validation/lung-backbones-v08428/lung-coverage.json');lung['release']='0.84.29'
for row in lung['rows']:
 if row['code'] in scope['new_codes']:row['authored_suite']=True
lung['authored']=sum(r['authored_suite'] for r in lung['rows']);lung['remaining']=[r for r in lung['rows'] if not r['authored_suite']]
write('validation/lung-cytotoxic-v08429/lung-coverage.json',lung)
print(f'{len(changes)} scoped changes;{preserved} unchanged patient files; lung {lung["authored"]}/{lung["total"]}.')
