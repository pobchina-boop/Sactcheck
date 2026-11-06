"""Record immutable current-source, baseline, engine-case and clinical input evidence."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];O=R/'validation/skin-melanoma-v08440'
scope=json.loads((O/'scope.json').read_text());base=json.loads((O/'baseline-v08439-file-hashes.json').read_text())
groups={'00236':'vismodegib','00415':'braf','00563':'braf','00431':'immune','00812':'immune',**{c:'retrospective' for c in scope['retrospective_codes']}}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
records={}
for code in scope['clinical_audits']:
 p=next((R/'protocols').glob('*/'+code+'-*.json'));d=json.loads(p.read_text());folder=O/(groups[code]+'-source-audit')
 results=folder/('source-case-results-candidate.json' if code in scope['retrospective_codes'] else 'current-results.json' if code in ['00431','00812'] else 'source-case-results.json')
 report=json.loads(results.read_text());cases=report.get('cases',report.get('results'));assert report['failed']==0 and report['passed']==len(cases) and all(c.get('pass',c.get('passed')) for c in cases),code
 source=next(f for f in (folder/'sources').glob('*.pdf') if sha(f)==d['metadata']['source_pdf_sha256'])
 before=next(f for f in folder.rglob('*.json') if 'before' in str(f.relative_to(folder)) and sha(f)==base[str(p.relative_to(R))])
 grades={k:v for k,v in d['input_definitions'].items() if v.get('type')=='select' and ('grade' in k or v.get('grading_source_label'))}
 renal={k:v for k,v in d['input_definitions'].items() if v.get('type')=='number' and ('crcl' in k or 'creatinine clearance' in v.get('label','').lower())}
 records[code]=dict(protocol_path=str(p.relative_to(R)),protocol_sha256=sha(p),baseline_path=str(before.relative_to(R)),baseline_sha256=sha(before),source_path=str(source.relative_to(R)),source_sha256=sha(source),source_url=d['metadata']['source_url'],source_version=d['metadata']['nccp_version'],case_path=str((folder/'source-cases.cjs').relative_to(R)),case_sha256=sha(folder/'source-cases.cjs'),result_path=str(results.relative_to(R)),input_result_path=str((folder/'current-outputs.json').relative_to(R)) if code in ['00431','00812'] else None,rule_ids=[r.get('id',r.get('rule_id')) for r in d['rule_engine']['rules']],grading_fields=grades,numeric_renal_fields=renal)
(O/'clinical-migration.json').write_text(json.dumps(dict(release='0.84.40',codes=scope['clinical_audits'],records=records),ensure_ascii=False,indent=2)+'\n')
print('Recorded exact source/assessment migrations for ten audited skin/shared protocols.')
