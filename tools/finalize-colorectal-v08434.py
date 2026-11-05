"""Snapshot explicit reviewed migrations for subsequent provenance/regression checks."""
from pathlib import Path
import json,hashlib,subprocess
R=Path(__file__).resolve().parents[1];O=R/'validation/colorectal-v08434';scope=json.loads((O/'scope.json').read_text());base=scope['base_commit'];codes=sorted(scope['new_codes']+scope['retrospective_codes'])
def sha(b):return hashlib.sha256(b).hexdigest()
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
paths=set(subprocess.check_output(['git','diff','--name-only',base],cwd=R,text=True).splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=R,text=True).splitlines());files={};builders={}
for f in sorted(paths):
 p=R/f
 if not p.is_file():raise ValueError('Unexpected deletion '+f)
 prior=subprocess.run(['git','show',base+':'+f],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
 before=sha(prior.stdout) if prior.returncode==0 else None;after=sha(p.read_bytes())
 if before==after:continue
 if f.startswith('tools/'):builders[f]={'before':before,'after':after}
 if f.startswith(('patient/','docs/patient/','data/patient-knowledge/','data/patient-knowledge-contexts/','protocols/')):files[f]={'before':before,'after':after}
save(O/'retrospective-hashes.json',dict(schema_version=1,release='0.84.34',base_commit=base,codes=codes,files=files))
save(O/'shared-builder-revisions.json',builders)
subprocess.run(['node','-e',"const m=require('./tests/helpers/retrospective-v08434.cjs');m.createMigration(require('./validation/colorectal-v08434/retrospective-hashes.json'));console.log('Strict migration scope accepted')"],cwd=R,check=True)
p=R/'data/protected-patient-assets-v0810.json';d=json.loads(p.read_text())
for c in codes:
 d['assets'][c]={str(f.relative_to(R/'patient'/c)):{'sha256':sha(f.read_bytes()),'bytes':f.stat().st_size} for f in sorted((R/'patient'/c).rglob('*')) if f.is_file() and f.suffix in ['.html','.pdf','.png']}
d.update(release='0.84.34',content_release='0.84.34');save(p,d)
print('Recorded',len(files),'scoped assets; no publication performed.')
