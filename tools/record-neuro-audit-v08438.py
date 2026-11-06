"""Record reviewed clinical sources and exact protocol/input migration evidence."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];O=R/'validation/neuro-oncology-v08438'
scope=json.loads((O/'scope.json').read_text());base=json.loads((O/'baseline-v08437-file-hashes.json').read_text())
groups={'00334':'tmz-rt','00461':'tmz-rt','00342':'tmz-recurrent','00379':'pcv','00658':'pcv'}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
records={}
for code in scope['codes']:
 p=next((R/'protocols/neuro-oncology').glob(code+'-*.json'));d=json.loads(p.read_text());folder=O/(groups[code]+'-source-audit')
 results=folder/'source-case-results.json';report=json.loads(results.read_text())
 assert report['failed']==0 and report['passed']==len(report['cases']) and all(c['pass'] for c in report['cases'])
 source=next(f for f in (folder/'sources').glob('*.pdf') if sha(f)==d['metadata']['source_pdf_sha256'])
 before=next(f for f in folder.rglob('*.json') if 'before' in str(f.relative_to(folder)) and sha(f)==base[str(p.relative_to(R))])
 grades={k:v for k,v in d['input_definitions'].items() if v.get('type')=='select' and ('grade' in k or v.get('grading_source_label'))}
 renal={k:v for k,v in d['input_definitions'].items() if v.get('type')=='number' and ('crcl' in k or 'creatinine clearance' in v.get('label','').lower())}
 records[code]=dict(protocol_path=str(p.relative_to(R)),protocol_sha256=sha(p),baseline_path=str(before.relative_to(R)),baseline_sha256=sha(before),source_path=str(source.relative_to(R)),source_sha256=sha(source),source_url=d['metadata']['source_url'],source_version=d['metadata']['nccp_version'],case_path=str((folder/'source-cases.cjs').relative_to(R)),case_sha256=sha(folder/'source-cases.cjs'),result_path=str(results.relative_to(R)),rule_ids=[r.get('id',r.get('rule_id')) for r in d['rule_engine']['rules']],grading_fields=grades,numeric_renal_fields=renal)
(O/'clinical-migration.json').write_text(json.dumps(dict(release='0.84.38',codes=scope['codes'],records=records),ensure_ascii=False,indent=2)+'\n')
print('Recorded exact source/assessment migrations for five audited glioma protocols.')
