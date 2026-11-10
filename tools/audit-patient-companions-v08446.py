"""Inventory scoped companion text before rendering; exact matching, no fuzzy deletion.

Generates a candidate requiring explicit review. All unmatched clinical units are
retained in full by the handbook pipeline. A reviewer may supply narrow reviewed
equivalences in --decisions; unmatched table cells fail rather than lose context.
"""
from pathlib import Path
import argparse, collections, copy, gzip, importlib.util, json, re
from lxml import html as LH
R=Path(__file__).resolve().parents[1]
s=importlib.util.spec_from_file_location('book44audit',R/'tools/build-patient-documents-v08444.py');b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
NAMES=['treatment-journey.html','logistics.html','port-pump.html']
UI={'On a small screen, swipe the map sideways. The checks below give the same timing in words.':'Browser-only sideways swipe instruction.'}
def cell_text(e):
 cell=copy.deepcopy(e)
 if e.tag=='th':
  for source in list(cell.xpath('.//small[a[@href]]')):
   if re.fullmatch(r'(?:nccp(?:\d{5})?|smpc)+',b.norm(b.visible_text(source))):source.drop_tree()
 return b.norm(b.visible_text(cell))
def heading(e):
 for parent in [e,*e.iterancestors()]:
  hs=parent.xpath('./h2|./h3')
  if hs:return b.visible_text(hs[0])
 return ''
def main():
 p=argparse.ArgumentParser();p.add_argument('--routes',required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--decisions',type=Path);p.add_argument('--reviewed',action='store_true');a=p.parse_args()
 old=json.loads(gzip.decompress((R/'validation/head-neck-v08445/companion-content-retention.json.gz').read_bytes()))
 prior={(u['route'],Path(u['source_file']).name,u['source_sha256']):u for u in old['units']}
 decisions=json.loads(a.decisions.read_text()) if a.decisions else {}
 rows=[];files=[];tables=[];errors=[]
 for route in a.routes.split(','):
  base=R/'patient'/route
  profilepath=R/('data/patient-knowledge-contexts/'+route+'.json' if '/' in route else 'data/patient-knowledge/'+route+'.json')
  profile=json.loads(profilepath.read_text())
  knowledge,_=b.tree_for(route,'knowledge.html',profile)
  b.clean_browser_markup(knowledge,[]);b.deduplicate_monitoring(knowledge,[])
  body=b.norm(b.visible_text(knowledge))
  desttables=knowledge.xpath('//main//table')
  for name in NAMES:
   f=base/name
   if not f.exists():continue
   path=str(f.relative_to(R));tree=LH.fromstring(f.read_text());raw=b.core_units(tree,path)
   unique={}
   for u in raw:
    key=u['sha256'];e=tree.xpath(u['xpath'])[0]
    if key in unique:unique[key]['source_xpaths'].append(u['xpath']);continue
    row=dict(route=route,source_file=path,source_xpath=u['xpath'],source_xpaths=[u['xpath']],source_heading=heading(e),source_text=u['text'],source_sha256=key,status='missing',missing_clauses=[u['text']],destination_texts=[],reason='Retain this complete source statement because no exact counterpart is present in the current reference.',hashes={'source_file_sha256':b.HASH(f.read_bytes())})
    previous=prior.get((route,name,key))
    if b.norm(u['text']) in body:row.update(status='exact',missing_clauses=[],reason='The complete source statement occurs in current consolidated narrative under approved acronym normalization.')
    elif u['text'] in UI:row.update(status='excluded_ui_or_metadata',missing_clauses=[],reason=UI[u['text']])
    elif previous and previous['status'] in ['equivalent','excluded_ui_or_metadata']:
     # Preserve only prior explicit decisions whose retained counterparts are still present.
     ds=previous.get('destination_texts',[])
     if previous['status']=='excluded_ui_or_metadata' or (ds and all(b.norm(d['text']) in body for d in ds)):
      row.update({k:copy.deepcopy(previous[k]) for k in ['status','missing_clauses','destination_texts','reason']})
    if key in decisions:
     d=decisions[key]
     if d['source_text']!=u['text']:raise ValueError('Stale reviewed decision')
     row.update({k:v for k,v in d.items() if k!='source_text'})
    if e.tag in ['td','th']:
     table=e.xpath('ancestor::table')[0];row['table_context']={'column_headers':[b.visible_text(x) for x in table.xpath('.//thead//th')], 'row_headers':[b.visible_text(x) for x in e.getparent().xpath('./th')]}
     if row['status']=='missing':errors.append({'route':route,'file':name,'error':'Unmatched clinical table cell requires context-preserving review','text':u['text']})
    unique[key]=row
   rows.extend(unique.values());files.append({'file':path,'sha256':b.HASH(f.read_bytes()),'route':route,'raw_units':len(raw),'unique_units':len(unique)})
   for table in tree.xpath('//main//table'):
    cells=[b.norm(b.visible_text(c)) for c in table.xpath('.//td')]
    heads=[b.norm(b.visible_text(c)) for c in table.xpath('.//thead//th')][1:]
    source_rows=[[cell_text(c) for c in row.xpath('./th|./td')] for row in table.xpath('.//tbody/tr')]
    def retains_table(target):
     if heads != [b.norm(b.visible_text(c)) for c in target.xpath('.//thead//th')][1:]:return False
     target_rows=[[cell_text(c) for c in row.xpath('./th|./td')] for row in target.xpath('.//tbody/tr')]
     # Consolidation can combine a monitoring table with an authored treatment
     # row. Every complete source row and timing column must remain together.
     return any(source_rows==target_rows[i:i+len(source_rows)] for i in range(len(target_rows)-len(source_rows)+1))
    matched=any(retains_table(target) for target in desttables)
    tables.append({'route':route,'source':path,'xpath':tree.getroottree().getpath(table),'status':'complete_rows_and_timing_headers_retained' if matched else 'unmatched'})
    if not matched:errors.append({'route':route,'file':name,'error':'Table contents/timing headers not exactly retained'})
 report={'schema_version':1,'release':'0.84.46','status':'reviewed' if a.reviewed and not errors else 'candidate','normalization':old['normalization'],'extraction_policy':{**old['extraction_policy'],'scope':a.routes.split(',')},'source_files':files,'units':rows,'errors':errors,'table_context_check':{'records':tables,'unmatched':[r for r in tables if r['status']=='unmatched']},'summary':dict(collections.Counter(x['status'] for x in rows)),'review_evidence':{'policy':'Every unmatched unit retained in full; no automated semantic equivalence. Explicit prior equivalences reused only with current exact counterparts.','reviewed':a.reviewed}}
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'summary':report['summary'],'errors':errors,'status':report['status']}))
if __name__=='__main__':main()
