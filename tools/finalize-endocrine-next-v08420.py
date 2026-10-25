"""Record scoped v0.84.20 migrations against the delivered v0.84.19 package."""
from pathlib import Path
import json,hashlib,csv
R=Path(__file__).resolve().parents[1];O='validation/endocrine-next-v08420/';V='0.84.20'
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
idx=read('data/endocrine-next-v08420-source-index.json');codes=idx['codes'];base=read(O+'baseline-hashes.json');files={};unexpected=[];checked=0
for p,before in base['files'].items():
 if not p.startswith(('patient/','docs/patient/','data/patient-knowledge/')):continue
 scoped=any(p.startswith(f'{b}/{c}/') for c in codes for b in ['patient','docs/patient']) or p in [f'data/patient-knowledge/{c}.json' for c in codes]
 after=digest(p)
 if scoped and before!=after:files[p]=dict(before=before,after=after)
 if not scoped:
  checked+=1
  if before!=after:unexpected.append(p)
assert not unexpected,unexpected
write(O+'retrospective-hashes.json',dict(release=V,baseline='v0.84.19 delivered archive',codes=codes,files=files))
p='tools/build-complete-pathways.cjs';write(O+'builder-revision.json',dict(path=p,before=base['files'][p],after=digest(p),reason='Five new suites and five endocrine retrospective revisions; all other patient bundles preserved.'))
write(O+'shared-builder-revisions.json',{p:dict(before=h,after=digest(p)) for p,h in base['files'].items() if p.startswith('tools/')})
write(O+'preservation-check.json',dict(baseline_release='0.84.19',baseline_archive_sha256=base['v19_archive_sha256'],outside_scope_files_checked=checked,unexpected_changes=unexpected))
d=read('data/protected-patient-assets-v0810.json');d.update(release=V,content_release=V,policy='Five new and five reviewed endocrine service suites; preserve other patient assets against the delivered v0.84.19 package. Independent clinical/pharmacy approval pending.')
for c in codes:d['assets'][c]={p.name:dict(sha256=digest(str(p.relative_to(R))),bytes=p.stat().st_size) for p in sorted((R/'patient'/c).iterdir()) if p.is_file() and p.suffix in ['.html','.pdf','.png']}
write('data/protected-patient-assets-v0810.json',d)
d=read('validation/breast-final-v08419/retrospective-inventory.json')
for c in idx['new_codes']:
 p=read(f'data/patient-knowledge/{c}.json');d['rows'].append(dict(code=c,title=p['title'],authored_release=V,family='Current breast catalogue and shared regimens',longitudinal_map_present=True,clinical_approval='not_established_by_this_inventory'))
for row in d['rows']:
 if row['code'] in codes:row.update(new_rationale_evidence_status='reviewed_v08420_clinical_approval_pending',patient_numeric_evidence_present=False,review_release=V,next_action='Independent clinical/pharmacy and patient/PPI review; maintain source surveillance.')
d['rows'].sort(key=lambda r:r['code']);assert len({r['code'] for r in d['rows']})==104
reviewed=sum(r.get('new_rationale_evidence_status','').startswith(('reviewed_','completed_in_')) for r in d['rows'])
d.update(release=V,authored_suites=104,previous_authored_suites=99,reviewed_this_release=10,new_suites=5,retrospective_revised=5,reviewed_cumulative=reviewed,remaining_review_queue=104-reviewed)
write(O+'retrospective-inventory.json',d)
with (R/O/'retrospective-inventory.csv').open('w') as f:
 fields=list(dict.fromkeys(k for row in d['rows'] for k in row));w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(d['rows'])
breast=[]
for entry in read('protocols/index.json')['protocols']:
 if entry.get('tumour_group')=='Breast' and entry.get('enabled'):
  q=read(entry['path']);c=q['metadata']['nccp_regimen_code'];breast.append(dict(code=c,protocol_id=q['protocol_id'],authored=(R/f'data/patient-knowledge/{c}.json').exists()))
cat=read(O+'catalogue-reconciliation.json');official=sorted({c for row in cat['sources'] for c in row['codes']});missing=[c for c in official if not (R/f'data/patient-knowledge/{c}.json').exists()]
write(O+'breast-coverage.json',dict(definition='Local exact Breast count excludes shared entries. Current official-page count includes shared regimens listed on either of two breast catalogue pages. Authored is not clinically approved.',local_exact_breast=dict(total=len(breast),authored=sum(r['authored'] for r in breast),rows=breast),current_official_pages=dict(total=len(official),authored=len(official)-len(missing),remaining=missing),retrospective_breast_remaining=[r['code'] for r in d['rows'] if r['code'] in [b['code'] for b in breast] and not r.get('new_rationale_evidence_status','').startswith(('reviewed_','completed_in_'))]))
print(f'{len(files)} explicit migrations; {checked} outside-scope files preserved; {reviewed} reviewed; {104-reviewed} platform retrospective reviews remain; current breast pages {len(official)-len(missing)}/{len(official)} authored.')
