"""Record the bounded v41 delta from the delivered v40 baseline."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[1];O=R/'validation/skin-melanoma-v08441'
scope=json.loads((O/'scope.json').read_text());baseline=json.loads((O/'baseline-v08440-file-hashes.json').read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
files={};builders={}
for folder in ['patient','docs/patient','data/patient-knowledge','data/patient-knowledge-contexts','protocols','tools']:
 for p in sorted((R/folder).rglob('*')):
  if not p.is_file() or '__pycache__' in p.parts:continue
  f=str(p.relative_to(R));before=baseline.get(f);after=sha(p.read_bytes())
  if before==after:continue
  target=builders if f.startswith('tools/') else files;target[f]={'before':before,'after':after}
save(O/'retrospective-hashes.json',dict(schema_version=1,release='0.84.41',base_release='0.84.40',base_commit=scope['verified_remote_main'],codes=scope['codes'],files=files))
save(O/'shared-builder-revisions.json',builders)
p=R/'data/protected-patient-assets-v0810.json';d=json.loads(p.read_text())
for c in scope['codes']+scope['retrospective_codes']:
 d['assets'][c]={str(f.relative_to(R/'patient'/c)):{'sha256':sha(f.read_bytes()),'bytes':f.stat().st_size} for f in sorted((R/'patient'/c).rglob('*')) if f.is_file() and f.suffix in ['.html','.pdf','.png']}
d.update(release='0.84.41',content_release='0.84.41');save(p,d)
print('Recorded',len(files),'clinical/patient changes and',len(builders),'builders; no publication.')
