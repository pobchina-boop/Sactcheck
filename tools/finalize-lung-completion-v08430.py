"""Record explicit migrations and the completed lung catalogue without approval claims."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];V='0.84.30';D='validation/lung-completion-v08430/'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
base=read(D+'baseline-hashes.json');scope=read(D+'scope.json');codes=scope['new_codes']+scope['retrospective_codes'];changes={};preserved=0
for p,h in base['files'].items():
 if not p.startswith(('patient/','docs/patient/','data/patient-knowledge/','data/patient-knowledge-contexts/')):continue
 selected=any(p.startswith(f'{b}/{c}/') or p==f'{b}/{c}.json' for c in codes for b in ['patient','docs/patient','data/patient-knowledge','data/patient-knowledge-contexts'])
 after=digest(p)
 if after!=h:
  assert selected,('Outside-scope patient change',p)
  changes[p]=dict(before=h,after=after)
 else:preserved+=1
write(D+'retrospective-hashes.json',dict(release=V,scope=scope,codes=codes,files=changes))
write(D+'preservation-check.json',dict(base_release='0.84.29',base_commit=base['commit'],unchanged_existing_patient_files=preserved,scoped_changed_files=len(changes),unexpected_changes=[]))
protected=read('data/protected-patient-assets-v0810.json');protected.update(release=V,content_release=V,policy='Scoped lung completion; earlier patient bundles retained except explicitly audited corrections.')
for c in codes:protected['assets'][c]={str(p.relative_to(R/'patient'/c)):dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/'patient'/c).rglob('*')) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
write('data/protected-patient-assets-v0810.json',protected)
write(D+'shared-builder-revisions.json',{p:dict(before=h,after=digest(p)) for p,h in base['files'].items() if p.startswith('tools/') and (R/p).exists() and digest(p)!=h})
inventory=read('validation/lung-cytotoxic-v08429/retrospective-inventory.json')
for c in scope['new_codes']:
 d=read(f'data/patient-knowledge/{c}.json');inventory['rows'].append(dict(code=c,title=d['title'],authored_release=V,review_release=V,family='Lung completion',longitudinal_map_present=True,clinical_approval='not_established_by_this_inventory',new_rationale_evidence_status='reviewed_v08430_clinical_approval_pending',patient_numeric_evidence_present=False,next_action='Independent clinical/pharmacy and patient/PPI review.'))
for row in inventory['rows']:
 if row['code'] in scope['retrospective_codes']:row.update(review_release=V,new_rationale_evidence_status='reviewed_v08430_clinical_approval_pending')
inventory['rows'].sort(key=lambda x:x['code']);assert len(inventory['rows'])==160
selectors=sum(bool(read(f'data/patient-knowledge/{r["code"]}.json').get('patient_context_selector')) for r in inventory['rows'])
contexts=len(list((R/'data/patient-knowledge-contexts').glob('*/*.json')))
inventory.update(previous_authored_suites=154,release=V,authored_suites=160,complete_canonical_bundles=160-selectors,selector_only_records=selectors,separate_context_suites=contexts,authored_context_suites=160-selectors+contexts,reviewed_cumulative=160,new_suites=6,retrospective_revised=len(scope['retrospective_codes']),reviewed_this_release=6+len(scope['retrospective_codes']),remaining_review_queue=0,scope_note=f'160 canonical records include {selectors} selectors; {160-selectors} complete canonical bundles plus {contexts} context bundles. This inventory does not establish clinical approval. Lung-wide closeout audit is recorded separately.')
write(D+'retrospective-inventory.json',inventory)
lung=read('validation/lung-cytotoxic-v08429/lung-coverage.json');lung['release']=V
for row in lung['rows']:
 if row['code'] in scope['new_codes']:row['authored_suite']=True
lung['authored']=sum(r['authored_suite'] for r in lung['rows']);lung['remaining']=[r for r in lung['rows'] if not r['authored_suite']]
assert lung['authored']==lung['total']==59 and not lung['remaining']
write(D+'lung-coverage.json',lung)
print(f'{len(changes)} scoped changes; {preserved} unchanged patient files; lung {lung["authored"]}/{lung["total"]}.')
