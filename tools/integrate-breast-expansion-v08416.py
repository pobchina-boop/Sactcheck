from pathlib import Path
import json,re,copy,qrcode
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/breast-expansion-v08416-source-index.json');codes=idx['codes']
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
for c in codes:
 d=read(f'data/patient-knowledge/{c}.json');entry=json.dumps(dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True),ensure_ascii=False)
 pat=r"    '"+c+r"':\{[^\n]*\},?"
 if re.search(pat,s):s=re.sub(pat,"    '"+c+"':"+entry+",",s)
 else:s=s.replace("    '00790':", "    '"+c+"':"+entry+",\n    '00790':")
 if c in idx['new_codes']:
  folder=R/'patient'/c;folder.mkdir(parents=True,exist_ok=True);qrcode.make('https://sactcheck.com/patient/'+c+'/').save(folder/'qr.png')
p.write_text(s)
# Clinical rationale and endpoints are loaded only by the clinician knowledge base.
e=read('validation/breast-expansion-v08416/evidence/evidence-audit.json')['profiles'];kb=read('data/regimen-knowledge-base-v08416-addendum.json');support=read('data/phase-support-v0838.json')['regimens']
for k in kb['regimen_profiles']:
 c=next(c for c in codes if read(f'data/patient-knowledge/{c}.json')['protocol_id']==k['protocol_id']);k.update(copy.deepcopy(e[c]));k['evidence_audit']=dict(status='Source reconciled; independent clinical/pharmacy review pending',checked='2026-10-21',indications_reviewed=[k['treatment_rationale']['setting']],coverage_summary=k['evidence_at_a_glance']['applicability'],remaining_uncertainties=[k['treatment_rationale']['limitations'],'Current Irish access, sequencing and individual suitability require clinical confirmation.'])
 k['supportive_care']['premedication_and_prophylaxis']=[x for p in support[c] for x in p['additional_support']]
 k['supportive_care']['emetogenic_risk']='; '.join(p['label']+': '+p['emetogenic_risk'] for p in support[c])
save('data/regimen-knowledge-base-v08416-addendum.json',kb)
# Operational information is descriptive; no unmeasured environmental savings are asserted.
su=read('data/sustainability-regimen-metadata-v0691.json')
for c in codes:
 d=read(f'data/patient-knowledge/{c}.json');proto=json.loads(next((R/'protocols/breast').glob(c+'-*')).read_text());pid=proto['protocol_id']
 profile=copy.deepcopy(su['profiles'].get(pid,su['profiles']['nccp-00204-v11']))
 for val in profile.values():
  if isinstance(val,dict) and val.get('source'):val['source']=f'NCCP {c} v{d["protocol_version"]}; checked 2026-10-21; {d["sources"][0]["url"]}'
 profile['route_classification'].update(status='source_verified',value='oral_only' if c=='00217' else 'mixed_oral_parenteral' if c in ['00526','00798'] else 'parenteral_only');
 if c in ['00526','00798']:profile['route_classification'].update(status='requires_selection',value=None,note='Vinorelbine IV or oral (selected alternative); HER2 therapy parenteral. Confirm the route before operational comparison.')
 profile['administration_frequency']['value']=d['schedule_summary'];profile['administration_time']['value']=' '.join(x['text'] for x in d['logistics']['steps'])+' Full appointment duration and environmental effects have not been measured here.'
 su['profiles'][pid]=profile
save('data/sustainability-regimen-metadata-v0691.json',su)
p=R/'data/app-release.json';d=read('data/app-release.json');d['summary']='Five new breast suites and five retrospective upgrades: source-correct assessments, rationale, clinician evidence and route-specific monitoring/support';save('data/app-release.json',d)
p=R/'index.html';s=p.read_text();s=re.sub(r'<strong>Five complete Phesgo treatment suites</strong><p>.*?</p>', '<strong>Five new breast suites, five retrospective upgrades</strong><p>Source-reconciled assessments connect treatment rationale, clinician evidence, patient information, consent and supportive care. New routes and schedules include oral vinorelbine, continuous lapatinib with capecitabine breaks, and phase-specific heart monitoring. Independent clinical and pharmacy review remains pending.</p>',s);p.write_text(s)
print('Integrated routing, clinician evidence, descriptive operational metadata and release summary.')
