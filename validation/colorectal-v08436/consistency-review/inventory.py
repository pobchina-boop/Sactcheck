from pathlib import Path
import json,re,hashlib,os
import pymupdf as fitz
from lxml import html as lxmlhtml
R=Path(__file__).resolve().parents[3];O=Path(__file__).parent
read=lambda p:json.loads((R/p).read_text())
index=read('protocols/index.json')['protocols']; progress=read('data/colorectal-suite-progress-v0832.json'); routes=read('data/patient-presentation-v08431.json')['routes'];support=read('data/phase-support-v0838.json')['regimens']
kb={}; kbfiles=[]
for f in re.findall(r'data/regimen-knowledge-base[^"\s]+\.json',(R/'js/regimen-knowledge-base.js').read_text()):
 if f in kbfiles:continue
 kbfiles.append(f)
 for p in read(f).get('regimen_profiles',[]):kb[p['protocol_id']]={'file':f,'profile':p}
rows=[]
for entry in progress['regimens']:
 c=entry['code']; route=c+'/colorectal' if c+'/colorectal' in routes else c; profile_path=routes.get(route,'data/patient-knowledge/'+c+'.json'); d=read(profile_path); pp=next(x['path'] for x in index if '/'+c+'-' in x['path']);p=read(pp);m=p['metadata']; loc=R/'patient'/route
 k=kb.get(p['protocol_id']); selected=k['profile'] if k else None
 if selected and selected.get('context_profiles'):selected=next((z for z in selected['context_profiles'] if z['context_id'] in ['gastrointestinal','colorectal']),None)
 row=dict(code=c,route=route,profile_path=profile_path,profile_sha256=hashlib.sha256((R/profile_path).read_bytes()).hexdigest(),protocol_path=pp,stable_id=p['protocol_id'],source_version=m.get('nccp_version'),profile_version=d.get('protocol_version'),source_checked=m.get('source_checked_date'),profile_checked=d.get('source_checked'),template=d.get('patient_summary',{}).get('template_version'),suite_release=d.get('suite_release'),anatomy_cards=len(d.get('anatomy',[])),anatomy=d.get('anatomy',[]),patient_summary=bool(d.get('patient_summary')),monitoring_rows=len(d.get('monitoring_schedule',{}).get('rows',[])),kb_file=k['file'] if k else None,kb_context=selected.get('context_id') if selected else None,kb_available=bool(selected),support_phases=[z['id'] for z in support.get(c,[])],files={},html_checks={},issues=[])
 for f in ['index.html','guide.html','sactcard.html','knowledge.html','passport.html','consent-form.html','supportive-care.html','treatment-journey.html','logistics.html','guide.pdf','sactcard.pdf','knowledge.pdf','handbook.pdf','passport.pdf','consent-form.pdf','supportive-care.pdf','treatment-journey.pdf','logistics.pdf','qr.png','oncowiki-qr.png']:
  q=loc/f; doc={'exists':q.is_file()}
  if q.is_file():
   doc.update(bytes=q.stat().st_size,sha256=hashlib.sha256(q.read_bytes()).hexdigest())
   if q.suffix=='.pdf':
    pdf=fitz.open(q);doc['pages']=len(pdf);doc['outline']=[x[1] for x in pdf.get_toc()];doc['first_page_excerpt']=pdf[0].get_text()[:200]
    mirror=R/'docs/patient'/route/f;doc['mirror_equal']=mirror.is_file() and mirror.read_bytes()==q.read_bytes()
   elif q.suffix=='.html' and f in ['guide.html','knowledge.html','sactcard.html','index.html','consent-form.html']:
    h=q.read_text();soup=lxmlhtml.fromstring(h);row['html_checks'][f]={'authored_maps':h.count('data-authored-map'),'anatomy_markers':h.count('data-hcc-target='),'has_full_body':bool(re.search('Full-body anatomical illustration',h)),'has_example_contacts':'EXAMPLE ONLY' in h,'guide_pages':len(soup.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-page ")]')),'missing_local_targets':[]}
    for a in soup.xpath('//*[@src] | //a[@href]'):
     target=a.get('src') or a.get('href')
     if not target or target.startswith(('#','http:','https:','data:','tel:','mailto:','javascript:')):continue
     target=target.split('?')[0].split('#')[0]
     if target and not (q.parent/target).exists():row['html_checks'][f]['missing_local_targets'].append(target)
  row['files'][f]=doc
 if not selected:row['issues'].append('No merged clinician KB profile for colorectal context')
 if str(m.get('nccp_version'))!=str(d.get('protocol_version')):row['issues'].append('Protocol/profile source-version mismatch')
 for f,v in row['files'].items():
  if not v['exists']:row['issues'].append('Missing '+f)
  elif f.endswith('.pdf') and not v.get('mirror_equal'):row['issues'].append('Mirror mismatch '+f)
 if row['files']['guide.pdf'].get('pages')!=3:row['issues'].append('Guide not three pages')
 if row['files']['sactcard.pdf'].get('pages')!=1:row['issues'].append('Wallet sheet not one page')
 if not row['patient_summary']:row['issues'].append('No distilled patient summary profile')
 if row['files']['handbook.pdf'].get('exists') and len(row['files']['handbook.pdf']['outline'])!=7:row['issues'].append('Handbook outline not seven sections')
 for f,checks in row['html_checks'].items():
  if checks['missing_local_targets']:row['issues'].append('Broken local link in '+f+': '+repr(checks['missing_local_targets']))
 rows.append(row)
(O/os.environ.get('CONSISTENCY_INVENTORY_OUTPUT','baseline-inventory.json')).write_text(json.dumps({'review':'Static whole-colorectal layer/identity/geometry inventory; not a new clinical audit or browser certification','contexts':rows},indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'contexts':len(rows),'issues':{x['code']:x['issues'] for x in rows if x['issues']},'templates':{x['code']:x['template'] for x in rows}},indent=2))
