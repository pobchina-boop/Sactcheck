"""Record preservation and context coverage; development checks are not clinical approval."""
from pathlib import Path
import csv,hashlib,json
R=Path(__file__).resolve().parents[1];O='validation/targeted-lung-v08425/';V='0.84.25'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
idx=read('data/targeted-lung-v08425-source-index.json');base=read(O+'baseline-hashes.json');scope=read(O+'scope.json')
assert set(idx['codes'])==set(scope['new_codes']+scope['retrospective_codes'])
changed=[];checked=0
for p,before in base['files'].items():
 if not p.startswith(('patient/','docs/patient/','data/patient-knowledge/')):continue
 checked+=1
 if digest(p)!=before:changed.append(p)
assert not changed,('Existing patient content must be preserved',changed)
write(O+'retrospective-hashes.json',dict(release=V,baseline='committed v0.84.24',baseline_commit=base['commit'],codes=idx['codes'],scope=scope,files={}))
write(O+'preservation-check.json',dict(baseline_release='0.84.24',baseline_commit=base['commit'],existing_patient_files_checked=checked,unexpected_changes=[]))
p='tools/build-complete-pathways.cjs';write(O+'builder-revision.json',dict(path=p,before=base['files'][p],after=digest(p),reason='Five targeted suites and explicit context-aware generation; existing breast and other patient bundle bytes preserved.'))
write(O+'shared-builder-revisions.json',{p:dict(before=h,after=digest(p)) for p,h in base['files'].items() if p.startswith('tools/')})
d=read('data/protected-patient-assets-v0810.json');d.update(release=V,content_release=V,policy='Five new targeted lung portals and five separate lung contexts. Existing patient bundles preserved; independent clinical/pharmacy approval pending.')
for c in idx['new_codes']:d['assets'][c]={p.name:dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/'patient'/c).iterdir()) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
for c in idx['retrospective_codes']:
 d['assets'][c]['scope.html']=dict(sha256=digest(f'patient/{c}/scope.html'),bytes=(R/f'patient/{c}/scope.html').stat().st_size)
 d.setdefault('context_assets',{}).setdefault(c,{})['lung']={p.name:dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/f'patient/{c}/lung').iterdir()) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
write('data/protected-patient-assets-v0810.json',d)
d=read('validation/targeted-lung-v08424/retrospective-inventory.json')
for c in idx['new_codes']:
 p=read(f'data/patient-knowledge/{c}.json');assert not any(row['code']==c for row in d['rows'])
 d['rows'].append(dict(code=c,title=p['title'],authored_release=V,family='Targeted lung',longitudinal_map_present=True,clinical_approval='not_established_by_this_inventory',new_rationale_evidence_status='reviewed_v08425_clinical_approval_pending',patient_numeric_evidence_present=False,review_release=V,next_action='Independent clinical/pharmacy and patient/PPI review; maintain source surveillance.'))
for c in idx['retrospective_codes']:
 row=next(x for x in d['rows'] if x['code']==c);row.update(additional_contexts=['lung'],additional_context_review_release=V)
d['rows'].sort(key=lambda r:r['code']);assert len({r['code'] for r in d['rows']})==134
d.update(release=V,authored_suites=134,authored_context_suites=139,previous_authored_suites=129,reviewed_this_release=10,new_suites=5,legacy_portals_upgraded=0,new_indication_contexts=5,retrospective_revised=5,reviewed_cumulative=134,remaining_review_queue=0,scope_note='134 canonical authored records plus five separate lung contexts. These are development-review counts, not all-indication coverage or independent clinical approval.')
write(O+'retrospective-inventory.json',d)
with (R/O/'retrospective-inventory.csv').open('w') as f:
 fields=list(dict.fromkeys(k for row in d['rows'] for k in row));w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(d['rows'])
print(f'{checked} existing patient files preserved; five new records and five separate lung contexts; independent approval pending.')
