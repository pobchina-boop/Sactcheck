"""Record explicit .13 to .14 asset migrations without weakening historical fixtures."""
from pathlib import Path
import json,hashlib,subprocess,csv
R=Path(__file__).resolve().parents[1]; codes=['00200','00201','00206','00659','00726'];out=R/'validation/her2-retro-v08414'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(b):return hashlib.sha256(b).hexdigest()
def baseline(p):return subprocess.check_output(['git','show','HEAD:'+p],cwd=R)
files={}
tracked=subprocess.check_output(['git','ls-files'],cwd=R,text=True).splitlines()
for p in tracked:
 if any(p.startswith(f'{base}/{c}/') for c in codes for base in ['patient','docs/patient']) or p in [f'data/patient-knowledge/{c}.json' for c in codes]:
  a,b=digest(baseline(p)),digest((R/p).read_bytes())
  if a!=b:files[p]={'before':a,'after':b}
write('validation/her2-retro-v08414/retrospective-hashes.json',{'release':'0.84.14','base_commit':'b96d39271fa8d179554f69fa29b85092849d7762','codes':codes,'files':files})
p='tools/build-complete-pathways.cjs';write('validation/her2-retro-v08414/builder-revision.json',{'path':p,'before':digest(baseline(p)),'after':digest((R/p).read_bytes()),'reason':'Five scoped HER2 retrospective suites and print layout; other authored patient bundles preserved.'})
d=read('data/protected-patient-assets-v0810.json');d.update(release='0.84.14',content_release='0.84.14',policy='Authorised retrospective revision of 00200, 00201, 00206, 00659 and 00726. Other patient assets preserved against v0.84.13. Clinical/pharmacy approval pending.')
for c in codes:
 for name in d['assets'][c]:
  f=R/f'patient/{c}/{name}';d['assets'][c][name]={'sha256':digest(f.read_bytes()),'bytes':f.stat().st_size}
write('data/protected-patient-assets-v0810.json',d)
d=read('validation/tnbc-v08413/retrospective-inventory.json');d.update(release='0.84.14',previous_authored_suites=79,reviewed_this_release=5,new_suites=0,retrospective_revised=5,reviewed_cumulative=11,remaining_review_queue=68)
for row in d['rows']:
 if row['code'] in codes:row.update(new_rationale_evidence_status='reviewed_v08414_clinical_approval_pending',patient_numeric_evidence_present=False,review_release='0.84.14',next_action='Independent clinical/pharmacy and patient/PPI review; maintain source surveillance.')
write('validation/her2-retro-v08414/retrospective-inventory.json',d)
with (out/'retrospective-inventory.csv').open('w') as f:
 fields=list(dict.fromkeys(k for row in d['rows'] for k in row));w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(d['rows'])
changed=[];checked=0
for p in tracked:
 if (p.startswith('patient/') or p.startswith('docs/patient/') or p.startswith('data/patient-knowledge/')) and not any(p.startswith(f'{base}/{c}/') for c in codes for base in ['patient','docs/patient']) and p not in [f'data/patient-knowledge/{c}.json' for c in codes]:
  checked+=1
  if baseline(p)!=(R/p).read_bytes():changed.append(p)
assert not changed,changed
write('validation/her2-retro-v08414/preservation-check.json',{'baseline':'b96d39271fa8d179554f69fa29b85092849d7762','outside_scope_files_checked':checked,'unexpected_changes':changed})
print(len(files),'explicit migrations;',checked,'outside-scope assets unchanged; 68 suites remain in retrospective queue.')
