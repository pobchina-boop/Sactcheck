"""Apply the recorded source-reference corrections, without altering clinical rules."""
from pathlib import Path
import json,copy,os,subprocess
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
fixes=read('validation/lung-completion-v08430/closeout/proposed-fixes.json')['fixes']
auth=read('data/lung-cytotoxic-v08429-authoring.json');archived=read('validation/lung-cytotoxic-v08429/gem-vino/authoring.json');kb=read('data/regimen-knowledge-base-v08429-addendum.json');journeys=read('data/breast-treatment-journeys-v0837.json')
for fix in fixes:
 if 'patient_sources_replace' not in fix:continue
 c=fix['code'];trial=fix['patient_evidence_source_ids_replace'][0];bad=fix['clinical_rationale_sources_remove_url']
 def clean(v):
  if isinstance(v,list):return [clean(q) for q in v if not(isinstance(q,dict) and q.get('url')==bad)]
  if isinstance(v,dict):return {k:([trial if t=='trial' else t for t in a] if k.endswith('source_ids') else trial if k=='id' and a=='trial' else clean(a)) for k,a in v.items()}
  return v
 for source in [auth,archived]:
  x=clean(source['regimens'][c]);x['patient']['sources']=copy.deepcopy(fix['patient_sources_replace']);source['regimens'][c]=x
 d=clean(read(f'data/patient-knowledge/{c}.json'));d['sources']=copy.deepcopy(fix['patient_sources_replace']);save(f'data/patient-knowledge/{c}.json',d)
 journeys[c]=clean(journeys[c]);journeys[c]['sources']=[dict(q,id=c if q['id']=='nccp' else q['id']) for q in d['sources']]
 for i,k in enumerate(kb['regimen_profiles']):
  if c in k['protocol_id']:
   k=clean(k)
   if not any(q.get('url')==fix['patient_sources_replace'][-1]['url'] for q in k['reference_links']):k['reference_links'].append(dict(label=fix['patient_sources_replace'][-1]['title'],url=fix['patient_sources_replace'][-1]['url']))
   kb['regimen_profiles'][i]=k
for fix in fixes:
 if 'set_timeline_source_ids' not in fix:continue
 d=read(fix['patient_json']);d['timeline_source_ids']=fix['set_timeline_source_ids'];save(fix['patient_json'],d)
save('data/lung-cytotoxic-v08429-authoring.json',auth);save('validation/lung-cytotoxic-v08429/gem-vino/authoring.json',archived)
save('data/regimen-knowledge-base-v08429-addendum.json',kb);save('data/breast-treatment-journeys-v0837.json',journeys)
# Keep the prior authoring generator from reintroducing the copied trial reference.
p=R/'validation/lung-cytotoxic-v08429/gem-vino/build-authoring.py';s=p.read_text()
marker='# v30 provenance correction: each treatment retains its own primary trial.'
if marker not in s:
 block="""# v30 provenance correction: each treatment retains its own primary trial.
for _c,_trial in [('00284','ricci-2000'),('00614','obrien-2004')]:
 _x=OUT[_c];_sources=[z for z in _x['patient']['sources'] if z['url']!='https://pubmed.ncbi.nlm.nih.gov/12928123/']
 for _z in _sources:
  if _z['id']=='trial':_z['id']=_trial
 _sources.append(dict(id='ncis',title='NCCP Antiemetic Medicines for inclusion in NCIS (Medical Oncology) v8',url='https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'))
 _x['patient']['sources']=_sources;_x['patient']['evidence']['source_ids']=[_trial]
 _x['clinical']['rationale']['sources']=[z for z in _x['clinical']['rationale']['sources'] if z['url']!='https://pubmed.ncbi.nlm.nih.gov/12928123/']
"""
 s=s.replace('OUT=readable(OUT)',block+'OUT=readable(OUT)');p.write_text(s)
subprocess.run(['node','tools/build-breast-journeys.cjs'],cwd=R,check=True)
routes=[('00281,00284,00304,00310,00614','')]+[('00849',s) for s in ['backbone_00304','backbone_00310','backbone_00281','backbone_00318','backbone_00317']]
for codes,context in routes:subprocess.run(['node','tools/build-patient-knowledge.cjs'],cwd=R,env=dict(os.environ,SACT_SUITE_CODES=codes,SACT_SUITE_CONTEXT=context),check=True)
subprocess.run(['node','tools/build-complete-pathways.cjs'],cwd=R,env=dict(os.environ,SACT_SUITE_CODES='00284,00614',SACT_SUITE_CONTEXT=''),check=True)
print('Corrected two source lists and eight timeline citation sets; regenerated scoped pages.')
