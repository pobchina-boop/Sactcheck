"""Record the six-suite migration against committed v0.84.22, preserving all other bundles."""
from pathlib import Path
import json,hashlib,csv
R=Path(__file__).resolve().parents[1];O='validation/lung-next-v08423/';V='0.84.23'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
idx=read('data/lung-next-v08423-source-index.json');codes=idx['codes'];base=read(O+'baseline-hashes.json');scope=read(O+'scope.json');files={};unexpected=[];checked=0
assert set(codes)==set(scope['new_codes']+scope['retrospective_codes'])
for p,before in base['files'].items():
 if not p.startswith(('patient/','docs/patient/','data/patient-knowledge/')):continue
 scoped=any(p.startswith(f'{b}/{c}/') for c in codes for b in ['patient','docs/patient']) or p in [f'data/patient-knowledge/{c}.json' for c in codes]
 after=digest(p)
 if scoped and before!=after:files[p]=dict(before=before,after=after)
 if not scoped:
  checked+=1
  if before!=after:unexpected.append(p)
assert not unexpected,unexpected
write(O+'retrospective-hashes.json',dict(release=V,baseline='committed v0.84.22',baseline_commit=base['commit'],codes=codes,scope=scope,files=files))
p='tools/build-complete-pathways.cjs';write(O+'builder-revision.json',dict(path=p,before=base['files'][p],after=digest(p),reason='Six explicit lung suite opt-ins; exact agent count, day-visit note, qualitative evidence and scope headings.'))
write(O+'shared-builder-revisions.json',{p:dict(before=h,after=digest(p)) for p,h in base['files'].items() if p.startswith('tools/')})
write(O+'preservation-check.json',dict(baseline_release='0.84.22',baseline_commit=base['commit'],outside_scope_files_checked=checked,unexpected_changes=unexpected))
d=read('data/protected-patient-assets-v0810.json');d.update(release=V,content_release=V,policy='Five new small-cell lung portals and one upgraded legacy pemetrexed suite; scoped changes in validation/lung-next-v08423. Independent clinical/pharmacy approval pending.')
for c in codes:d['assets'][c]={p.name:dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/'patient'/c).iterdir()) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
write('data/protected-patient-assets-v0810.json',d)
d=read('validation/lung-core-v08422/retrospective-inventory.json')
for c in codes:
 p=read(f'data/patient-knowledge/{c}.json');assert not any(row['code']==c for row in d['rows'])
 d['rows'].append(dict(code=c,title=p['title'],authored_release=V,family='Lung: small-cell chemotherapy / immunotherapy and pemetrexed monotherapy',longitudinal_map_present=True,clinical_approval='not_established_by_this_inventory',new_rationale_evidence_status='reviewed_v08423_clinical_approval_pending',patient_numeric_evidence_present=False,review_release=V,next_action='Independent clinical/pharmacy and patient/PPI review; maintain source surveillance.'))
d['rows'].sort(key=lambda r:r['code']);assert len({r['code'] for r in d['rows']})==122
reviewed=sum(r.get('new_rationale_evidence_status','').startswith(('reviewed_','completed_in_')) for r in d['rows'])
d.update(release=V,authored_suites=122,previous_authored_suites=116,reviewed_this_release=6,new_suites=5,legacy_portals_upgraded=1,retrospective_revised=1,reviewed_cumulative=reviewed,remaining_review_queue=122-reviewed,scope_note='Counts concern authored records and development review. They do not establish all-indication coverage or independent clinical approval.')
write(O+'retrospective-inventory.json',d)
with (R/O/'retrospective-inventory.csv').open('w') as f:
 fields=list(dict.fromkeys(k for row in d['rows'] for k in row));w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(d['rows'])
print(f'{len(files)} explicit migrations; {checked} outside-scope files preserved; {reviewed}/122 authored suites development-reviewed; independent approval pending.')
