"""Record only authorised .14 to .15 patient-asset migrations."""
from pathlib import Path
import json,hashlib,csv
R=Path(__file__).resolve().parents[1];codes=['00785','00796','00797','00789','00790'];out=R/'validation/phesgo-retro-v08415'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
base=read('validation/phesgo-retro-v08415/baseline-hashes.json');files={};unexpected=[];checked=0
for p,before in base['files'].items():
 if not (p.startswith('patient/') or p.startswith('docs/patient/') or p.startswith('data/patient-knowledge/')):continue
 scoped=any(p.startswith(f'{b}/{c}/') for c in codes for b in ['patient','docs/patient']) or p in [f'data/patient-knowledge/{c}.json' for c in codes]
 after=digest(p)
 if scoped and before!=after:files[p]=dict(before=before,after=after)
 if not scoped:
  checked+=1
  if before!=after:unexpected.append(p)
assert not unexpected,unexpected
write('validation/phesgo-retro-v08415/retrospective-hashes.json',dict(release='0.84.15',baseline=base['baseline'],codes=codes,files=files))
p='tools/build-complete-pathways.cjs';write('validation/phesgo-retro-v08415/builder-revision.json',dict(path=p,before=base['files'][p],after=digest(p),reason='Explicit scoped Phesgo retrospective support; other patient bundles preserved.'))
write('validation/phesgo-retro-v08415/preservation-check.json',dict(baseline=base['baseline'],outside_scope_files_checked=checked,unexpected_changes=unexpected))
d=read('data/protected-patient-assets-v0810.json');d.update(release='0.84.15',content_release='0.84.15',policy='Authorised retrospective revision of 00785, 00796, 00797, 00789 and 00790. Other patient assets preserved against cumulative v0.84.14. Clinical/pharmacy approval pending.')
for c in codes:
 for name in d['assets'][c]:
  p=f'patient/{c}/{name}';d['assets'][c][name]=dict(sha256=digest(p),bytes=(R/p).stat().st_size)
write('data/protected-patient-assets-v0810.json',d)
d=read('validation/her2-retro-v08414/retrospective-inventory.json');d.update(release='0.84.15',previous_authored_suites=79,reviewed_this_release=5,new_suites=0,retrospective_revised=5,reviewed_cumulative=16,remaining_review_queue=63)
for row in d['rows']:
 if row['code'] in codes:row.update(new_rationale_evidence_status='reviewed_v08415_clinical_approval_pending',patient_numeric_evidence_present=False,review_release='0.84.15',next_action='Independent clinical/pharmacy and patient/PPI review; maintain source surveillance.')
write('validation/phesgo-retro-v08415/retrospective-inventory.json',d)
with (out/'retrospective-inventory.csv').open('w') as f:
 fields=list(dict.fromkeys(k for row in d['rows'] for k in row));w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(d['rows'])
print(len(files),'explicit migrations;',checked,'outside-scope files preserved; 63 suites remain.')
