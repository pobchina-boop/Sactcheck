"""Record exact baseline-to-release migrations and protect scoped patient assets."""
from pathlib import Path
import json,hashlib,subprocess
R=Path(__file__).resolve().parents[1];O=R/'validation/colorectal-v08432';scope=json.loads((O/'scope.json').read_text());codes=scope['new_codes']+scope['retrospective_codes'];routes=scope['presentation_routes'];patient_codes=sorted(set(x.split('/')[0] for x in routes));changes={};builders={};clinical=[]
def sha(b):return hashlib.sha256(b).hexdigest()
def save(f,x):f.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
for f in subprocess.check_output(['git','diff','--name-only','HEAD'],cwd=R,text=True).splitlines():
 p=R/f
 if not p.is_file():raise ValueError('Unexpected deletion '+f)
 before=subprocess.check_output(['git','show','HEAD:'+f],cwd=R);after=p.read_bytes()
 if f.startswith('tools/'):builders[f]={'before':sha(before),'after':sha(after)}
 if f.startswith(('patient/','docs/patient/','data/patient-knowledge/','data/patient-knowledge-contexts/','protocols/')):
  if f.startswith('protocols/') and f!='protocols/index.json':
   c=Path(f).name[:5];assert c in codes,('Out of scope protocol',f);clinical.append(f)
  elif not f.startswith('protocols/'):
   assert any(f.startswith(f'{b}/{c}/') or f==f'{b}/{c}.json' for b in ['patient','docs/patient','data/patient-knowledge','data/patient-knowledge-contexts'] for c in patient_codes),('Out of scope patient asset',f)
  changes[f]={'before':sha(before),'after':sha(after)}
save(O/'retrospective-hashes.json',{'release':'0.84.32','base_commit':scope['base_commit'],'codes':patient_codes,'clinical_codes':codes,'files':changes})
save(O/'shared-builder-revisions.json',builders)
save(O/'preservation-check.json',{'clinical_protocols_changed':clinical,'clinical_protocol_count':len(clinical),'presentation_routes':routes,'scoped_changed_files':len(changes),'unexpected_changes':[]})
p=json.loads((R/'data/protected-patient-assets-v0810.json').read_text())
for c in patient_codes:p['assets'][c]={str(f.relative_to(R/'patient'/c)):{'sha256':sha(f.read_bytes()),'bytes':f.stat().st_size} for f in sorted((R/'patient'/c).rglob('*')) if f.is_file() and f.suffix in ['.html','.pdf','.png']}
p.update(release='0.84.32',content_release='0.84.32',policy='Scoped colorectal clinical reconciliation and patient document identity/plan/contact improvements; exact migration hashes retained.')
save(R/'data/protected-patient-assets-v0810.json',p)
print('Protected',len(changes),'migrations;',len(clinical),'clinical protocols')
