from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];O=R/'validation/skin-melanoma-v08442';records={}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for code,group,result in [(c,'braf-source-audit','source-case-results-candidate.json') for c in ['00102','00237','00373']]+[(c,'immune-source-audit','current-results.json') for c in ['00105','00535','00551']]+[('00464','dacarbazine-source-audit','source-case-results.json')]:
 p=next((R/'protocols').rglob(code+'-*.json'));d=json.loads(p.read_text());q=O/group;src=q/(code+'.pdf');case=q/'source-cases.cjs';out=q/result;report=json.loads(out.read_text());assert report['failed']==0
 files=[p,src,case,out];baseline=q/('00464-before.json' if code=='00464' else 'protocol-before/'+code+'.json');files.append(baseline)
 records[code]={'protocol_path':str(p.relative_to(R)),'canonical_protocol_sha256':hashlib.sha256(json.dumps(d,separators=(',',':'),ensure_ascii=False).encode()).hexdigest(),'hashes':{str(f.relative_to(R)):sha(f) for f in files},'result_path':str(out.relative_to(R)),'source_path':str(src.relative_to(R)),'baseline_path':str(baseline.relative_to(R)),'source_version':d['metadata']['nccp_version'],'source_url':d['metadata']['source_url'],'rule_ids':[x.get('id',x.get('rule_id')) for x in d['rule_engine']['rules']],'grading_fields':{k:v for k,v in d['input_definitions'].items() if v['type']=='select' and ('grade' in k or v.get('grading_source_label'))},'numeric_renal_fields':{k:v for k,v in d['input_definitions'].items() if v['type']=='number' and ('crcl' in k or 'creatinine clearance' in v.get('label','').lower())}}
(O/'clinical-migration.json').write_text(json.dumps({'release':'0.84.42','records':records},ensure_ascii=False,indent=2)+'\n')
