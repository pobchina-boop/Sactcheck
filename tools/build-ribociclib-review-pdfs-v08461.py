"""Render only the two reviewed ribociclib routes; preserve every source clause."""
from pathlib import Path
import importlib.util,json,argparse,shutil,re
from lxml import html as LH
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pdf61',R/'tools/build-sarcoma-v08461-pdfs.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def main():
 p=argparse.ArgumentParser();p.add_argument('--stage',type=Path,required=True);p.add_argument('--report',type=Path,required=True);p.add_argument('--publish',action='store_true');a=p.parse_args();rows=[]
 for route in ['00525','00892']:
  for name in ['passport','consent-form','logistics','treatment-journey','support-treatment','supportive-care']:
   if name in ['passport','consent-form']:
    source=R/'patient'/route/(name+'.html');text=source.read_text();data=m.HTML(string=text,base_url=str(source)).write_pdf();info=m.inspect(data,route+'/'+name)
    expected_pages=5 if name=='passport' else 2
    if info['pages']!=expected_pages:raise ValueError((route,name,'Unexpected pagination',info['pages']))
    tree=LH.fromstring(text);main=tree.xpath('//main')[0];retained=m.norm(info['text'])
    missing=[m.norm(el.text_content()) for el in main.xpath('.//p|.//li|.//td|.//th|.//h1|.//h2|.//h3') if m.norm(el.text_content()) not in retained]
    if missing:raise ValueError((route,name,'Missing PDF source clauses',missing))
    dest=a.stage/route/(name+'.pdf');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    row={'route':route,'document':name,'pages':info['pages'],'bounds_pass':True,'all_source_clauses_retained':True,'source_sha256':m.hashlib.sha256(source.read_bytes()).hexdigest(),'sha256':m.hashlib.sha256(data).hexdigest()}
   else:row=m.render(route,name,'supportive-care-overview' if name=='supportive-care' else name,a.stage)
   rows.append(row);print(route,name,row['pages'],flush=True)
 a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(rows,indent=2)+'\n')
 if a.publish:
  for row in rows:
   for base in ['patient','docs/patient']:
    shutil.copyfile(a.stage/row['route']/(row['document']+'.pdf'),R/base/row['route']/(row['document']+'.pdf'))
if __name__=='__main__':main()
