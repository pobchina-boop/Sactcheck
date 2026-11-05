#!/usr/bin/env python3
"""Offline provenance and scope checks. Never infers clinical correctness from hashes."""
import datetime,hashlib,json,pathlib,re
import fitz
OUT=pathlib.Path(__file__).resolve().parent
ROOT=OUT.parents[2]
checks=[]
def check(name,condition):
 checks.append({'name':name,'pass':bool(condition)})
 if not condition:print('FAIL',name)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
rows=json.loads((OUT/'sources.json').read_text())
check('39 directly refreshed unique sources',len(rows)==39 and len({r['code'] for r in rows})==39)
for r in rows:
 p=ROOT/r['pdf'];doc=fitz.open(p);t='\n'.join(page.get_text() for page in doc)
 check(r['code']+' successful HTTPS retrieval',r['http_status']==200 and r['exit_code']==0 and r['source_url'].startswith('https://healthservice.hse.ie/') and r['final_url'].startswith('https://'))
 check(r['code']+' retained current PDF SHA',sha(p)==r['sha256'])
 check(r['code']+' correct printed NCCP code',bool(re.search(r'NCCP\s+Regimen\s+Code\s*:\s*'+r['code'],t,re.I)))
 check(r['code']+' current version matches metadata',r['printed_versions']==[r['metadata_version']])
 check(r['code']+' at least one matching prior audit PDF',bool(r['retained_prior_pdfs']))
 for prev in r['retained_prior_pdfs']:
  check(r['code']+' prior PDF hash '+prev['path'],sha(ROOT/prev['path'])==r['sha256']==prev['sha256'])
check('36 protocol metadata hashes match, 3 absent (not mismatched)',sum(r['matches_metadata_sha256'] is True for r in rows)==36 and sum(r['matches_metadata_sha256'] is None for r in rows)==3)
for c in json.loads((OUT/'catalogue-sources.json').read_text()):check(c['name']+' retained catalogue SHA',sha(ROOT/c['html'])==c['sha256'])
rec=json.loads((OUT/'catalogue-reconciliation.json').read_text())
check('41 candidates match explicit official GI list',len(rec['gi_explicit_colorectal_codes'])==41 and rec['gi_explicit_colorectal_codes']==rec['all_candidate_codes'])
check('no missing oral CRC code',not rec['official_oral_crc_not_in_candidates'])
check(str(rec['encoded_protocol_count'])+'-encoding scan finds no additional explicit CRC code',not rec['encoded_crc_not_in_candidates'] and rec['encoded_crc_candidate_count']==41)
for name,coverage in rec['parser_coverage'].items():check(name+' all page regimen codes included by parser',not coverage['unparsed_codes'])
check('mixed-markup parser includes Lonsurf',any('00382' in r['codes'] and r['structure']=='heading block' for r in json.loads((OUT/'gi-listing-extracted.json').read_text())))
alias=json.loads((OUT/'catalogue-link-discrepancies.json').read_text())[0]
check('00215 official URL aliases have identical v7 bytes',sha(OUT/'00215-catalogue-link.pdf')==alias['sha256']==next(r['sha256'] for r in rows if r['code']=='00215'))
matrix=json.loads((OUT/'41-context-source-audit-matrix.json').read_text())
check('41-row matrix has every candidate once',sorted(r['code'] for r in matrix['rows'])==rec['all_candidate_codes'])
for r in matrix['rows']:
 if r['code'] in ['00216','00692']:
  check(r['code']+' separately retained source SHA',sha(ROOT/r['current_source']['pdf'])==r['current_source']['sha256'])
  manifest=ROOT/r['current_source']['owner_source_manifest']
  data=json.loads(manifest.read_text());entries=data if isinstance(data,list) else data['sources']
  check(r['code']+' source owner manifest matches current bytes',any(x.get('sha256')==r['current_source']['sha256'] for x in entries))
 else:
  check(r['code']+' historical audit evidence linked',bool(r['audit_record']) and (ROOT/r['audit_record']).exists() and bool(r['historical_software_report']) and (ROOT/r['historical_software_report']).exists())
result={'checked_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),'scope':'Offline evidence integrity/source provenance; not new clinical, UI, PDF visual or deployment validation.','passed':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),'checks':checks}
(OUT/'evidence-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(f"Evidence checks: {result['passed']} passed; {result['failed']} failed")
raise SystemExit(1 if result['failed'] else 0)
