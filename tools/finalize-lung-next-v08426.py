"""Record exact v26 migrations from the delivered v25 overlay; preserve other suites."""
from pathlib import Path
import json,hashlib,csv
R=Path(__file__).resolve().parents[1];O=R/'validation/lung-next-v08426';V='0.84.26'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
idx=read('data/lung-next-v08426-source-index.json');base=read('validation/lung-next-v08426/baseline-hashes.json');scope=read('validation/lung-next-v08426/scope.json');files={};checked=0
assert set(idx['codes'])==set(scope['new_codes']+scope['retrospective_codes'])
for p,before in base['files'].items():
 if not p.startswith(('patient/','docs/patient/','data/patient-knowledge/','data/patient-knowledge-contexts/')):continue
 selected=any(p.startswith(f'{b}/{c}/') for c in idx['codes'] for b in ['patient','docs/patient']) or p in [f'data/patient-knowledge/{c}.json' for c in idx['codes']]
 after=digest(p)
 if selected:
  if after!=before:files[p]=dict(before=before,after=after)
 else:
  assert after==before,('Outside-scope patient asset changed',p);checked+=1
write('validation/lung-next-v08426/retrospective-hashes.json',dict(release=V,baseline_release='0.84.25',baseline_overlay_sha256=base['overlay_sha256'],codes=idx['codes'],scope=scope,files=files))
write('validation/lung-next-v08426/preservation-check.json',dict(baseline_release='0.84.25',outside_scope_files_checked=checked,unexpected_changes=[]))
p='tools/build-complete-pathways.cjs';write('validation/lung-next-v08426/builder-revision.json',dict(path=p,before=base['files'][p],after=digest(p),reason='Five new lung suite opt-ins and five explicitly scoped retrospective updates; older patient bundles preserved.'))
write('validation/lung-next-v08426/shared-builder-revisions.json',{p:dict(before=h,after=digest(p)) for p,h in base['files'].items() if p.startswith('tools/')})
d=read('data/protected-patient-assets-v0810.json');d.update(release=V,content_release=V,policy='Five new lung portals and five audited immunotherapy suites. All changes scoped to v26 migration register; independent clinical/pharmacy approval pending.')
for c in idx['codes']:d['assets'][c]={p.name:dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/'patient'/c).iterdir()) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
write('data/protected-patient-assets-v0810.json',d)
d=read('validation/targeted-lung-v08425/retrospective-inventory.json')
for c in idx['new_codes']:
 p=read(f'data/patient-knowledge/{c}.json');assert not any(r['code']==c for r in d['rows'])
 d['rows'].append(dict(code=c,title=p['title'],authored_release=V,family='Lung EGFR and immunotherapy',longitudinal_map_present=True,clinical_approval='not_established_by_this_inventory',new_rationale_evidence_status='reviewed_v08426_clinical_approval_pending',patient_numeric_evidence_present=False,review_release=V,next_action='Independent clinical/pharmacy and patient/PPI review; maintain source surveillance.'))
for c in idx['retrospective_codes']:
 row=next(r for r in d['rows'] if r['code']==c);row.update(review_release=V,new_rationale_evidence_status='reviewed_v08426_clinical_approval_pending')
d['rows'].sort(key=lambda r:r['code']);assert len({r['code'] for r in d['rows']})==139
d.update(release=V,authored_suites=139,authored_context_suites=144,previous_authored_suites=134,reviewed_this_release=10,new_suites=5,legacy_portals_upgraded=0,new_indication_contexts=0,retrospective_revised=5,reviewed_cumulative=139,remaining_review_queue=0,scope_note='139 canonical authored records plus five separate lung contexts. Development-review counts do not establish all-indication coverage or independent clinical approval.')
write('validation/lung-next-v08426/retrospective-inventory.json',d)
with (O/'retrospective-inventory.csv').open('w') as f:
 fields=list(dict.fromkeys(k for row in d['rows'] for k in row));w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(d['rows'])
print(f'{len(files)} scoped patient migrations; {checked} outside-scope patient files preserved; 139 authored records /144 context suites.')
