"""Record the ten authorised migrations against the verified v0.84.16 baseline."""
from pathlib import Path
import json,hashlib,csv
R=Path(__file__).resolve().parents[1];O='validation/anthracycline-v08417/'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
idx=read('data/anthracycline-v08417-source-index.json');codes=idx['codes'];base=read(O+'baseline-hashes.json');files={};unexpected=[];checked=0
for p,before in base['files'].items():
 if not p.startswith(('patient/','docs/patient/','data/patient-knowledge/')):continue
 scoped=any(p.startswith(f'{b}/{c}/') for c in codes for b in ['patient','docs/patient']) or p in [f'data/patient-knowledge/{c}.json' for c in codes]
 after=digest(p)
 if scoped and before!=after:files[p]=dict(before=before,after=after)
 if not scoped:
  checked+=1
  if before!=after:unexpected.append(p)
assert not unexpected,unexpected
write(O+'retrospective-hashes.json',dict(release='0.84.17',baseline=base['baseline'],codes=codes,files=files))
p='tools/build-complete-pathways.cjs';write(O+'builder-revision.json',dict(path=p,before=base['files'][p],after=digest(p),reason='Scoped five new suites and five retrospective migrations; all other patient bundles preserved.'))
write(O+'preservation-check.json',dict(baseline=base['baseline'],outside_scope_files_checked=checked,unexpected_changes=unexpected))
d=read('data/protected-patient-assets-v0810.json');d.update(release='0.84.17',content_release='0.84.17',policy='Five new breast suites and five authorised retrospective revisions. All other patient assets preserved against verified v0.84.16. Independent clinical/pharmacy approval pending.')
for c in codes:d['assets'][c]={p.name:dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/'patient'/c).iterdir()) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
write('data/protected-patient-assets-v0810.json',d)
d=read('validation/breast-expansion-v08416/retrospective-inventory.json')
for c in idx['new_codes']:
 p=read(f'data/patient-knowledge/{c}.json');d['rows'].append(dict(code=c,title=p['title'],authored_release='0.84.17',family='Anthracycline / cyclophosphamide / taxane breast',longitudinal_map_present=True,clinical_approval='not_established_by_this_inventory'))
for row in d['rows']:
 if row['code'] in codes:row.update(new_rationale_evidence_status='reviewed_v08417_clinical_approval_pending',patient_numeric_evidence_present=False,review_release='0.84.17',next_action='Independent clinical/pharmacy and patient/PPI review; maintain source surveillance.')
d['rows'].sort(key=lambda r:r['code']);assert len({r['code'] for r in d['rows']})==89
reviewed=sum(r.get('new_rationale_evidence_status','').startswith(('reviewed_','completed_in_')) for r in d['rows'])
d.update(release='0.84.17',authored_suites=89,previous_authored_suites=84,reviewed_this_release=10,new_suites=5,retrospective_revised=5,reviewed_cumulative=reviewed,remaining_review_queue=89-reviewed)
write(O+'retrospective-inventory.json',d)
with (R/O/'retrospective-inventory.csv').open('w') as f:
 fields=list(dict.fromkeys(k for row in d['rows'] for k in row));w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(d['rows'])
breast=[]
for entry in read('protocols/index.json')['protocols']:
 if entry.get('tumour_group')=='Breast' and entry.get('enabled'):
  q=read(entry['path']);c=q['metadata']['nccp_regimen_code'];breast.append(dict(code=c,protocol_id=q['protocol_id'],authored=(R/f'data/patient-knowledge/{c}.json').exists()))
write(O+'breast-coverage.json',dict(definition='Enabled catalogue entries with tumour_group exactly Breast; shared/multi-tissue entries are excluded. Authored does not mean clinically approved.',total=len(breast),authored=sum(r['authored'] for r in breast),remaining=[r['code'] for r in breast if not r['authored']],rows=breast))
print(len(files),'explicit migrations;',checked,'outside-scope files preserved;',reviewed,'reviewed;',89-reviewed,'remain in retrospective queue; breast',sum(r['authored'] for r in breast),'/',len(breast))
