#!/usr/bin/env python3
"""Bind the one approved offline-navigation exclusion to actual source hashes.

No clinical phrase, approximate match, source heading or metadata is excluded.
The normal companion audit must still retain/check every other source unit.
"""
from pathlib import Path
import argparse, hashlib, json
R=Path(__file__).resolve().parents[1]
TEXT='Open practical treatment guide · Printable practical guide'
REASON='Exact browser/download navigation label excluded from the offline handbook under the user handbook instruction and parent-specific authorization. All practical-care instructions and its source heading remain; no clinical phrase is excluded.'
SHA=lambda b:hashlib.sha256(b).hexdigest()

def main():
 p=argparse.ArgumentParser();p.add_argument('--candidate',required=True,type=Path);p.add_argument('--decisions',required=True,type=Path);p.add_argument('--report',required=True,type=Path);a=p.parse_args()
 scope=json.loads((R/'validation/sarcoma-v08464/scope.json').read_text());routes=set(scope['document_routes']);audit=json.loads(a.candidate.read_text());decisions={};records=[]
 assert not audit['errors'], 'Resolve clinical table/context errors before reviewing navigation'
 assert set(audit['extraction_policy']['scope'])==routes, 'Review all five routes'
 for row in audit['units']:
  if row['source_text']!=TEXT:continue
  assert row['route'] in routes and row['source_file']=='patient/'+row['route']+'/logistics.html'
  source=R/row['source_file'];assert SHA(source.read_bytes())==row['hashes']['source_file_sha256'],'Stale navigation source'
  key=row['source_file']+'#'+row['source_sha256']
  assert key not in decisions
  decisions[key]={'source_text':TEXT,'status':'excluded_ui_or_metadata','missing_clauses':[],'destination_texts':[],'reason':REASON}
  records.append({'route':row['route'],'source_file':row['source_file'],'source_file_sha256':SHA(source.read_bytes()),'source_unit_sha256':row['source_sha256'],'source_xpath':row['source_xpath'],'source_heading_retained':row['source_heading'],'exact_excluded_text':TEXT})
 assert {r['route'] for r in records}==routes and len(records)==len(routes),'Expected one exact navigation-only unit per route; review a changed source explicitly'
 a.decisions.parent.mkdir(parents=True,exist_ok=True);a.decisions.write_text(json.dumps(decisions,indent=2,ensure_ascii=False)+'\n')
 a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps({'status':'exact_navigation_only_classified','release':'0.84.64','candidate_sha256':SHA(a.candidate.read_bytes()),'decisions_sha256':SHA(a.decisions.read_bytes()),'classifier_sha256':SHA(Path(__file__).read_bytes()),'clinical_units_excluded':0,'records':records,'remaining_gate':'Run reviewed companion audit and independent staged/published book retention checks.'},indent=2,ensure_ascii=False)+'\n')
 print('Five exact, source-bound navigation exclusions recorded; no clinical phrase excluded')

if __name__=='__main__':main()
