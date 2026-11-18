from pathlib import Path
from html.parser import HTMLParser
import json,hashlib,datetime,re,os
home=Path(__file__).parent
root=Path(os.environ.get('SACTCHECK_ROOT',home.parent/'Sactcheck'))
codes=['00500','00391','00392','00501','00511']
class Extract(HTMLParser):
 def __init__(self):super().__init__();self.skip=0;self.chunks=[]
 def handle_starttag(self,t,a):
  if t in ('style','script'):self.skip+=1
 def handle_endtag(self,t):
  if t in ('style','script'):self.skip-=1
 def handle_data(self,s):
  if not self.skip:self.chunks.append(s)
def norm(s):return ' '.join(s.split())
def content(p):
 x=Extract();x.feed(p.read_text());return norm(' '.join(x.chunks))
checks=[];files={}
def read(rel):
 p=root/rel;files[rel]=hashlib.sha256(p.read_bytes()).hexdigest();return content(p)
def check(code,name,ok):checks.append({'code':code,'name':name,'status':'passed' if ok else 'failed'})
for c in codes:
 rel=f'data/patient-knowledge/{c}.json';p=json.loads((root/rel).read_text());files[rel]=hashlib.sha256((root/rel).read_bytes()).hexdigest()
 consent=read(f'patient/{c}/consent-form.html')
 check(c,'Generic chemotherapy section precedes agent-specific risks',consent.index('General chemotherapy risks')<consent.index('Regimen / agent-specific material risks'))
 for term in ['sepsis','Heart problems','Lung problems','Liver problems','neuropathy','Hearing loss','electrolyte imbalance','thrombosis','fertility','withdrawn','fatal']:
  check(c,'Generic consent retains '+term,term in consent)
 for agent in p['agents']:
  for risk in agent['risks']:check(c,'Agent-risk propagation: '+agent['id']+' / '+risk,norm(risk) in consent)
 check(c,'Consent schedule matches reviewed regimen',norm(p['schedule_summary']) in consent)
 check(c,'Consent identifies prototype/governance boundary','GOVERNANCE REVIEW REQUIRED' in consent and 'clinical use' in consent)
 check(c,'Profile has source status and does not claim independent approval',p['independent_clinical_approval'] is False and 'pending' in p['review_status'])
 if c in ('00391','00392'):
  support=read(f'patient/{c}/support-days1to3.html')
  for term in ['900 mg/m²','3000 mg/m²','24 hours after','1000 mL','every 6 hours','Required supportive treatment','Proton-pump inhibitor','aprepitant may increase','not a home drinking target']:
   check(c,'Support preserves '+term,term in support)
  check(c,'No automatic multi-day aprepitant prescription','automatic single-day aprepitant course is not supplied' in support)
 if c=='00501':
  support=read(f'patient/{c}/support-day8.html')
  for term in ['8 mg by mouth twice daily','Days 7, 8 and 9','at least 3 doses','not a universal mandatory course','report missed or vomited doses']:
   check(c,'Day8 support preserves '+term,term in support)
  check(c,'Off-label discussion survives in final consent','off-label' in consent and 'documented discussion and consent' in consent)
 if c=='00511':check(c,'Expired printed review date is disclosed','March 2026' in consent and 'confirm the current local protocol' in consent)
report={'checked_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':codes,'method':'Source-reviewed profile and emitted HTML content checks only; no browser/PDF layout claim. All individual risk strings were reviewed against the source-backed authored profile, then checked for propagation into consent.','files_sha256':files,'total':len(checks),'passed':sum(x['status']=='passed' for x in checks),'failed':sum(x['status']=='failed' for x in checks),'checks':checks}
(home/'patient-consistency-results.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['total','passed','failed']}));print(json.dumps([x for x in checks if x['status']=='failed']))
raise SystemExit(bool(report['failed']))
