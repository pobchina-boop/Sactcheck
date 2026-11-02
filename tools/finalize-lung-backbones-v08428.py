from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];O=R/'validation/lung-backbones-v08428'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
base=read('validation/lung-backbones-v08428/baseline-hashes.json');scope=read('validation/lung-backbones-v08428/scope.json');codes=scope['new_codes']+scope['retrospective_codes']+scope['portal_pilot_codes']+scope['correction_codes'];changes={};preserved=0
for p,h in base['files'].items():
 if not p.startswith(('patient/','docs/patient/','data/patient-knowledge/','data/patient-knowledge-contexts/')):continue
 selected=any(p.startswith(f'{b}/{c}/') or p==f'{b}/{c}.json' for c in codes for b in ['patient','docs/patient','data/patient-knowledge','data/patient-knowledge-contexts'])
 after=digest(p)
 if after!=h:
  assert selected,('Outside-scope patient change',p)
  if '/00849/' in p:assert any('/'+slug+'/' in p or '/'+slug+'.json' in p for slug in ['backbone_00304','backbone_00310','backbone_00318']),p
  changes[p]=dict(before=h,after=after)
 else:preserved+=1
write('validation/lung-backbones-v08428/retrospective-hashes.json',dict(release='0.84.28',scope=scope,codes=codes,files=changes))
write('validation/lung-backbones-v08428/preservation-check.json',dict(baseline_commit=base['commit'],unchanged_existing_patient_files=preserved,scoped_changed_files=len(changes),unexpected_changes=[]))
protected=read('data/protected-patient-assets-v0810.json');protected.update(release='0.84.28',content_release='0.84.28',policy='Scoped v28 source and summary-first patient migrations; other existing files preserved.')
for c in codes:protected['assets'][c]={str(p.relative_to(R/'patient'/c)):dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/'patient'/c).rglob('*')) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
write('data/protected-patient-assets-v0810.json',protected)
write('validation/lung-backbones-v08428/shared-builder-revisions.json',{p:dict(before=h,after=digest(p)) for p,h in base['files'].items() if p.startswith('tools/') and (R/p).exists() and digest(p)!=h})
inventory=read('validation/lung-nivolumab-v08427/retrospective-inventory.json')
for c in scope['new_codes']:
 d=read(f'data/patient-knowledge/{c}.json');inventory['rows'].append(dict(code=c,title=d['title'],authored_release='0.84.28',review_release='0.84.28',family='Lung chemotherapy',longitudinal_map_present=True,clinical_approval='not_established_by_this_inventory',new_rationale_evidence_status='reviewed_v08428_clinical_approval_pending',patient_numeric_evidence_present=False,next_action='Independent clinical/pharmacy and patient/PPI review.'))
for row in inventory['rows']:
 if row['code'] in scope['retrospective_codes']:row.update(review_release='0.84.28',new_rationale_evidence_status='reviewed_v08428_clinical_approval_pending')
inventory['rows'].sort(key=lambda x:x['code']);assert len(inventory['rows'])==149
inventory.update(release='0.84.28',authored_suites=149,complete_canonical_bundles=148,selector_only_records=1,separate_context_suites=11,authored_context_suites=159,reviewed_cumulative=149,new_suites=5,retrospective_revised=5,new_indication_contexts=1,reviewed_this_release=10,remaining_review_queue=0,scope_note='149 canonical records include one selector.148 complete canonical bundles plus11 distinct context bundles=159 complete bundles. Includes shared contexts; not all lung indications or clinical approval.')
write('validation/lung-backbones-v08428/retrospective-inventory.json',inventory)
print(f'{len(changes)} scoped migrations; {preserved} existing patient files unchanged;149 records /159 complete bundles.')
