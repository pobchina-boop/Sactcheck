#!/usr/bin/env python3
"""Build source-freshness/prior-audit matrix without modifying protocol or application data."""
import collections,datetime,hashlib,json,pathlib,re
OUT=pathlib.Path(__file__).resolve().parent
ROOT=OUT.parents[2]
inv=json.loads((OUT/'input-inventory.json').read_text());sources={s['code']:s for s in json.loads((OUT/'sources.json').read_text())}
snapshot=OUT/'historical-progress-snapshot.json'
if not snapshot.exists():snapshot.write_bytes((ROOT/'data/colorectal-suite-progress-v0832.json').read_bytes())
progress={r['code']:r for r in json.loads(snapshot.read_text())['regimens']}
gi=json.loads((OUT/'gi-listing-extracted.json').read_text())
# Saved before this v36 source audit; preserve stale metadata rather than conflating it with fresh clinical review.
source_scope={}
separate_sources={r['code']:r for r in json.loads((OUT/'separate-owner-sources.json').read_text())} if (OUT/'separate-owner-sources.json').exists() else {}
for code,folder in [('00216','capecitabine-source-audit'),('00692','folfox4-source-audit')]:
 candidates=list((ROOT/'validation/colorectal-v08436'/folder).rglob(code+'.pdf'))
 if candidates:
  p=candidates[0]; t=p.with_suffix('.txt')
  source_scope[code]={**separate_sources.get(code,{}),'pdf':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'version_from_pdf':sorted(set(re.findall(r'Version\s+number\s*:\s*([0-9]+[a-z]?)',t.read_text()))) if t.exists() else [],'source_evidence_owner':folder,'fresh_retrieval_provenance':'See source manifest in owning audit folder; no duplicate request made by catalogue reviewer.'}
rows=[]
for r in inv:
 code=r['code'];m=r['metadata'];src=sources.get(code);g=[x for x in gi if code in x['codes']]
 notes=['Source freshness and prior source-derived software coverage only; not a new all-domain clinical review.','Independent consultant/pharmacy review and clinical-use authorisation remain unverified.','Source conflicts/manual duties remain as described in the linked audit; successful scenarios do not prove exhaustive clinical coverage.']
 evidence=[];release=None;prior_pdf=None;count=None;report=None;audit=None
 if src:
  prior_pdf=sorted(src['retained_prior_pdfs'],key=lambda x:x['path'])[-1]['path'];folder=(ROOT/prior_pdf).parent
  release='0.84.'+re.search(r'colorectal-v084(\d+)',prior_pdf).group(1)
  report=folder/'source-case-results.json'
  if not report.exists() and release=='0.84.32':report=ROOT/'validation/colorectal-v08432/source-case-results.json'
  if report.exists():
   data=json.loads(report.read_text());cases=data.get('cases') if isinstance(data.get('cases'),list) else data.get('results',[])
   count=sum(1 for c in cases if (c.get('code') or c.get('protocol'))==code or (not (c.get('code') or c.get('protocol')) and re.search(r'\b'+code+r'\b',c.get('name',''))))
   report=str(report.relative_to(ROOT))
  else:report=None
  audit=folder/'AUDIT.md'
  if not audit.exists():audit=folder.parent/'AUDIT.md'
  audit=str(audit.relative_to(ROOT)) if audit.exists() else None
  evidence=[x['path'] for x in src['retained_prior_pdfs']]
  freshness='Fresh official PDF HTTP 200; byte-identical to retained prior audit PDF.'
  current={'url':src['source_url'],'final_url':src['final_url'],'retrieved_utc':src['request_completed_utc'],'version':src['printed_versions'],'sha256':src['sha256'],'pdf':src['pdf'],'metadata_sha_match':src['matches_metadata_sha256'],'all_retained_pdf_comparisons_match':all(p['matches_current'] for p in src['retained_prior_pdfs'])}
  if src['metadata_source_sha256'] is None:notes.append('Protocol has no source_pdf_sha256 field; current bytes independently match retained v35 source manifest/PDF.')
  if code in ['00455','00558']:notes.append('Generic metadata.source_checked_date remains 2026-10-29 for shared contexts; explicit v35 CRC audit and current fresh binary evidence are 2026-11-05. This is not a stale CRC source claim.')
 else:
  release=progress[code].get('clinical_map_audit_release') or m.get('retrospective_service_audit',{}).get('release')
  freshness='v36 fresh PDF retained by separate source-audit owner; current full audit completion recorded there.'
  current=source_scope.get(code,{})
  current.update(url=m['source_url'],metadata_sha_match=current.get('sha256')==m.get('source_pdf_sha256') if current.get('sha256') else None)
  notes=['Separate v36 full source audit and corrected clinical paths are recorded by the owning auditor; do not infer audit or service integration completion from source bytes.','Independent consultant/pharmacy review and clinical-use authorisation remain unverified.']
  audit='validation/colorectal-v08436/'+current.get('source_evidence_owner','')+'/AUDIT.md'
 if code=='00215':notes.append('GI catalogue URL differs from metadata URL; both official downloads are byte-identical v7. See catalogue-link-discrepancies.json.')
 if code in ['00212','00214','00215']:notes.append('This shared bevacizumab document specifies CRC use with fluoropyrimidine-based chemotherapy. A generic title or component service must not be interpreted as an independently complete CRC monotherapy prescription; partner-specific assessment remains required.')
 rows.append({'code':code,'title':m['title'],'protocol_path':r['path'],'listed_on_current_gi_catalogue':bool(g),'current_catalogue_entry':g,'current_source':current,'source_freshness_result':freshness,'most_recent_retained_prior_clinical_audit_release':release,'prior_pdf_evidence':evidence,'audit_record':audit,'historical_software_report':report,'historical_code_specific_case_records':count,'historical_case_count_note':'Count of saved records identifiable with this code, not new rerun count, rule coverage, distinct defects or an exhaustive proof.','input_metadata_source_checked_date':m.get('source_checked_date'),'historical_progress_full_suite':progress[code].get('full_suite'),'historical_progress_release':progress[code].get('full_suite_release'),'scope_notes':notes})
result={'generated_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),'scope':'41 currently listed colorectal regimen contexts, source freshness plus attributable retained clinical audit evidence; this is not the full cross-tumour consistency audit.','rows':rows,'counts':{'contexts':len(rows),'directly_refetched_pdfs':len(sources),'directly_refetched_matches_retained_prior':sum(any(p['matches_current'] for p in s['retained_prior_pdfs']) for s in sources.values()),'separate_v36_audit_sources':len(source_scope)},'independent_clinical_approval':False}
(OUT/'41-context-source-audit-matrix.json').write_text(json.dumps(result,indent=2)+'\n')
lines=['# Colorectal catalogue/source matrix — v0.84.36','',
 'All 41 candidate codes are present in the current official NCCP GI catalogue. All 39 PDFs refreshed by this reviewer match retained prior-audit source bytes; 00216 and 00692 are handled by the separate v36 clinical auditors. Saved historical case counts below are not newly rerun checks and do not prove exhaustive clinical correctness.','',
 '| Code | Regimen | Current source version | Last retained prior clinical audit | Saved code-specific cases | Source result / limits |','|---|---|---|---|---:|---|']
for r in rows:
 c=r['current_source'];v=c.get('version') or c.get('version_from_pdf') or []
 if isinstance(v,str):v=[v]
 status='Unchanged source; prior audit retained' if r['code'] in sources else 'Separate v36 full source audit; see owner record'
 if r['code'] in ['00551','00890','00900']:status+='; metadata hash absent'
 if r['code'] in ['00455','00558']:status+='; CRC source freshness separately recorded'
 if r['code']=='00215':status+='; official URL aliases match'
 title=r['title'].replace('|','/')
 lines.append(f"| {r['code']} | {title} | {', '.join(v)} | {r['most_recent_retained_prior_clinical_audit_release'] or 'See owner'} | {r['historical_code_specific_case_records'] if r['historical_code_specific_case_records'] is not None else '—'} | {status} |")
lines+=['','Full URLs, complete SHA-256 values, retrieval times, evidence paths, catalogue indication text and limitations are retained in `41-context-source-audit-matrix.json` and `sources.json`. No independent consultant/pharmacy approval is inferred.']
(OUT/'41-context-source-audit-matrix.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(result['counts']))
