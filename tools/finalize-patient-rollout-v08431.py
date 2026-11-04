from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];D='validation/patient-rollout-v08431/'
def read(p):return json.loads((R/p).read_text())
def write(p,x):(R/p).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
def sha(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
b=read(D+'baseline-hashes.json')['files'];routes=read('data/patient-presentation-v08431.json')['routes'];codes=sorted(set(x.split('/')[0] for x in routes));changes={};same=0
for f,h in b.items():
 if f.startswith('protocols/'):assert sha(f)==h,('Clinical protocol changed',f)
 if not f.startswith(('patient/','docs/patient/','data/patient-knowledge/','data/patient-knowledge-contexts/')):continue
 now=sha(f)
 if now==h:same+=1;continue
 assert any(f.startswith(f'{base}/{c}/') or f==f'{base}/{c}.json' for base in ['patient','docs/patient','data/patient-knowledge','data/patient-knowledge-contexts'] for c in codes),f
 changes[f]={'before':h,'after':now}
write(D+'retrospective-hashes.json',{'release':'0.84.31','codes':codes,'files':changes})
write(D+'preservation-check.json',{'unchanged_existing_patient_files':same,'scoped_changed_files':len(changes),'clinical_protocols_unchanged':True,'unexpected_changes':[]})
write(D+'shared-builder-revisions.json',{f:{'before':h,'after':sha(f)} for f,h in b.items() if f.startswith('tools/') and (R/f).exists() and sha(f)!=h})
p=read('data/protected-patient-assets-v0810.json')
for c in codes:p['assets'][c]={str(f.relative_to(R/'patient'/c)):{'sha256':sha(str(f.relative_to(R))),'bytes':f.stat().st_size} for f in sorted((R/'patient'/c).rglob('*')) if f.is_file() and f.suffix in ['.html','.pdf','.png']}
p['release']='0.84.31';write('data/protected-patient-assets-v0810.json',p)
print('Protected',same,'unchanged patient files;',len(changes),'scoped changes; clinical protocols unchanged')
