from pathlib import Path
import json,subprocess,hashlib
R=Path(__file__).resolve().parents[1];O=R/'validation/patient-rollout-v08431'
def read(p):return json.loads((R/p).read_text())
def write(p,x):(R/p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
proposals={}
for family in ['breast','lung']:
 for c,v in read(f'validation/patient-rollout-v08431/{family}/proposals.json').items():proposals[c]=v.get('patient_summary',v)
for change in read('validation/patient-rollout-v08431/breast/corrections.json')['changes']:
 d=read(change['file']);parts=change['pointer'].strip('/').split('/');node=d
 for k in parts[:-1]:node=node[int(k)] if isinstance(node,list) else node[k]
 k=int(parts[-1]) if isinstance(node,list) else parts[-1]
 assert node[k] in [change['before'],change['after']],change
 node[k]=change['after'];write(change['file'],d)
for c,s in proposals.items():
 d=read(f'data/patient-knowledge/{c}.json');d['patient_summary']=s;d['patient_layout_release']='0.84.31';write(f'data/patient-knowledge/{c}.json',d)
write('validation/patient-rollout-v08431/scope.json',{'release':'0.84.31','base_release':'0.84.30','codes':sorted(proposals),'clinical_rule_revalidation':'Not performed; focused patient schedule and monitoring source review','anatomy_ui_scope':'Reuse existing canonical authored anatomy in in-app patient overlay; no new toxicity assertions'})
# Authored anatomical data supplies the same numbered organs and symptoms to the app.
maps={}
for f in sorted((R/'data/patient-knowledge').glob('*.json')):
 d=json.loads(f.read_text())
 if d.get('anatomy') and not d.get('patient_context_selector'):maps[d['code']]={'code':d['code'],'anatomy':d['anatomy']}
(R/'js/patient-anatomy-data-v08431.js').write_text('globalThis.SACTCheckAnatomyData='+json.dumps(maps,ensure_ascii=False,separators=(',',':'))+';\n')
subprocess.run(['node','tools/render-patient-rollout-v08431.cjs'],cwd=R,check=True)
for f in ['index.html','about.html','404.html']:
 p=R/f;p.write_text(p.read_text().replace('0.84.30','0.84.31'))
p=read('package.json');p['version']='0.84.31';write('package.json',p)
p=read('data/app-release.json')
for k,v in p.items():
 if isinstance(v,str):p[k]=v.replace('0.84.30','0.84.31')
write('data/app-release.json',p)
# Each cut-out QR opens the full existing OncoWiki, not the distilled portal.
import qrcode
for c in proposals:
 qrcode.make(f'https://sactcheck.com/patient/{c}/knowledge.html').save(R/f'patient/{c}/oncowiki-qr.png')
 p=R/f'patient/{c}/knowledge.html';html=p.read_text()
 if 'oncowiki-progressive-v08431.js' not in html:
  html=html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/oncowiki-progressive-v08431.css"></head>').replace('</body>','<script src="../../assets/patient/oncowiki-progressive-v08431.js"></script></body>');p.write_text(html)
print('Rendered',len(proposals),'selected packs; authored app anatomy records:',len(maps))
