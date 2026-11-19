"""Refresh scoped guides while proving unchanged staged wallet cards can be reused."""
from pathlib import Path
import argparse, importlib.util, json, sys
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('sarcoma61packs',R/'tools/render-sarcoma-packs-v08461.py')
b=importlib.util.module_from_spec(spec);sys.modules[spec.name]=b;spec.loader.exec_module(b)
p=argparse.ArgumentParser();p.add_argument('--routes',required=True);p.add_argument('--stage',required=True,type=Path);p.add_argument('--prior-report',required=True,type=Path);p.add_argument('--report',required=True,type=Path);a=p.parse_args()
routes=a.routes.split(',');assert len(set(routes))==len(routes) and set(routes)<=set(b.S['document_routes'])
prior=json.loads(a.prior_report.read_text());assert not prior['errors'];rows=[];reused=[]
for path,digest in prior['font_files'].items():assert b.h.SHA(Path(path).read_bytes())==digest,('Changed font',path)
for route in routes:
 card=next(row for row in prior['results'] if row['route']==route and row['name']=='sactcard')
 for path,digest in card['source_hashes'].items():assert b.h.SHA((R/path).read_bytes())==digest,('Changed wallet input',path)
 assert b.h.SHA((a.stage/route/'sactcard.pdf').read_bytes())==card['sha256'],('Changed staged wallet',route)
 rows.append(card);reused.append({'route':route,'document':'sactcard','sha256':card['sha256'],'all_recorded_inputs_unchanged':True})
 row=b.render((route,'guide',str(a.stage)));row['source_hashes'][str(Path(__file__).relative_to(R))]=b.h.SHA(Path(__file__).read_bytes());rows.append(row);print(route,'guide refreshed; unchanged wallet reused',flush=True)
report={'status':'rendered_requires_visual_and_content_verification','results':rows,'errors':[],'font_files':prior['font_files'],'reused_documents':reused,'prior_build_report_sha256':b.h.SHA(a.prior_report.read_bytes()),'refresh_driver_sha256':b.h.SHA(Path(__file__).read_bytes())}
a.report.write_text(json.dumps(report,indent=2)+'\n')
