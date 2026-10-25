"""Clinician evidence, preserving study populations, schedules and endpoint interpretation."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];O=R/'validation/breast-final-v08419'
def read(p):return json.loads(p.read_text())
d=read(R/'data/regimen-knowledge-base-v08419-addendum.json'); panels={}
def source(label,url):return dict(label=label,url=url)
def endpoint(kind,title,result,meaning,sources,**kw):return dict(endpoint=kind,metric=title,result_text=result,interpretation=meaning,sources=sources,analysis_status='Primary published study; source checked 2026-10-25',**kw)
for a in read(O/'oral/evidence.json')['regimens']:
 c=a['code'];s=[source(x['title'],x['url']) for x in a['sources']];e=dict(trial=a['trial'],population=a['population'],comparison=a['design'],sources=s,limitations=a['limitations'],endpoints=[])
 if c=='00605':
  for i,(kind,o) in enumerate(zip(['PFS','OS'],a['outcomes'])):e['endpoints'].append(endpoint(kind,o['endpoint']+': '+o['experimental']+' versus '+o['control'],'HR '+str(o['hazard_ratio'])+' (95% CI '+ '–'.join(map(str,o['ci95']))+'); P='+str(o['p']),o['interpretation'],[s[i]],hr=o['hazard_ratio'],ci='–'.join(map(str,o['ci95']))))
  e['applicability']='Exact breast monotherapy dose and biomarker setting; no prostate-combination or adjuvant extrapolation.'
 else:
  e['applicability']='The indication-matched analysis is a descriptive HR-positive / ≤1-year subgroup. NCCP requires initiation less than one year after trastuzumab.'
  for kind,title,result,meaning in [('iDFS','5-year iDFS: absolute difference 5.1 percentage points','HR 0.58 (95% CI 0.41–0.82)','Descriptive HR-positive / ≤1-year subgroup; not a 5.1% survival gain.'),('OS','8-year OS: numerical difference 2.1 percentage points','HR 0.79 (95% CI 0.55–1.13)','Same subgroup; confidence interval includes no effect.'),('OS','8-year OS, full population: 90.1% versus 90.2%','HR 0.95 (95% CI 0.75–1.21); P=0.6914; median follow-up 8.1 years','No demonstrated OS benefit in the full randomised population.')]:e['endpoints'].append(endpoint(kind,title,result,meaning,s))
  x=a['supportive_evidence'];e['qualitative_result']='CONTROL was a phase II, sequential, noncomparative tolerability study: grade ≥3 diarrhoea 13% with two-week dose escalation versus 31% in the loperamide cohort; discontinuation for diarrhoea 3% versus 20%. This is not a randomised comparison or efficacy evidence, and does not replace the NCCP 240 mg starting dose plus loperamide schedule.';e['sources'].append(source(x['source']['title'],x['source']['url']))
 panels[c]=e
for c in ['00688','00738']:
 a=read(O/'iv/evidence.json')[c];ss=a['studies'];s=[source(t['study'],x['url']) for t in ss for x in t['sources']];e=dict(trial='IMpassion130' if c=='00688' else 'E2100',population=ss[0]['population'],comparison=ss[0]['comparison'],sources=s,limitations=list(dict.fromkeys(x for t in ss for x in t.get('limitations',[]))),endpoints=[])
 if c=='00688':
  e['applicability']='Exact atezolizumab/nab-paclitaxel combination and SP142 immune-cell-positive population. The final subgroup OS analysis is exploratory because ITT OS was not significant.'
  outcomes=[('PFS','PD-L1 IC+ median PFS: 7.5 versus 5.0 months','HR 0.62 (95% CI 0.49–0.78); P<0.001','The subgroup PFS endpoint supports disease-control benefit.'),('OS','PD-L1 IC+ median OS: 25.4 versus 17.9 months','HR 0.67 (95% CI 0.53–0.86)','Exploratory; formal testing barred by the prespecified hierarchy.'),('OS','ITT median OS: 21.0 versus 18.7 months','HR 0.87 (95% CI 0.75–1.02); P=0.077','Not statistically significant in the overall randomised population.')]
 else:
  e['applicability']='E2100 tested paclitaxel 90 mg/m²; NCCP 00738 specifies 80 mg/m². This is not an exact-dose efficacy comparison or TNBC-only evidence.'
  outcomes=[('PFS','Median PFS: 11.8 versus 5.9 months','HR 0.60; P<0.001','Longer PFS; do not infer an OS advantage.'),('OS','Median OS: 26.7 versus 25.2 months','HR 0.88; P=0.16','No statistically significant OS improvement.'),('ORR','Objective response: 36.9% versus 21.2%','P<0.001','Trial-level tumour response; not an individual prediction.')]
 for kind,title,result,meaning in outcomes:e['endpoints'].append(endpoint(kind,title,result,meaning,s))
 e['harms']='; '.join(a.get('safety_priorities',[]));panels[c]=e
b=read(O/'bone/evidence.json');s=[source(t['study'],x['url']) for t in b['studies'] for x in t['sources']]
e=dict(trial='EBCTCG 2015 individual-patient meta-analysis; ABCSG-12 final analysis',population=b['studies'][0]['population'],comparison=b['studies'][0]['comparison'],sources=s,applicability='Class-level adjuvant bisphosphonate evidence in postmenopausal/endocrine-depleted settings; not a direct test of NCCP’s exact five-year zoledronic schedule.',limitations=[x for t in b['studies'] for x in t['limitations']],endpoints=[])
e['qualitative_result']='In the postmenopausal meta-analysis subgroup, 10-year bone recurrence was 6.6% versus 8.8% (rate ratio 0.72, 95% CI 0.60–0.86; P=0.0002), and breast-cancer mortality 14.7% versus 18.0% (rate ratio 0.82, 95% CI 0.73–0.93; P=0.002). These are bone recurrence and breast-cancer mortality endpoints, not overall survival. ABCSG-12 studied 1,803 women receiving ovarian suppression plus endocrine therapy, with or without six-monthly zoledronic acid for three years: final DFS HR 0.77 (P=0.042), OS HR 0.66 (P=0.064), median follow-up 94.4 months. Neither met that trial’s predefined final significance threshold.'
panels['00545']=e
for c,a in read(O/'retro/evidence.json').items():
 if c=='00485':
  ss=a['studies'];s=[source(x['name'],x['primary_url']) for x in ss];e=dict(trial=a['trial'],population='Separate historical adjuvant populations; CALGB9741 node-positive (2,005), E1199 node-positive or high-risk node-negative (4,950).',comparison='CALGB9741: every-two-week versus every-three-week scheduling. E1199: weekly versus three-weekly paclitaxel after three-weekly AC.',sources=s,applicability=a['applicability'],limitations=a['limitations']+[x['limitation'] for x in ss],endpoints=[])
  e['endpoints']=[endpoint('DFS','CALGB9741: 4-year DFS 82% versus 75%','Risk ratio 0.74; P=0.010','Pooled dose-density comparison; not weekly paclitaxel.',[s[0]]),endpoint('DFS','E1199: 5-year DFS 81.5% versus 76.9%','Weekly versus every-three-week paclitaxel after three-weekly AC','The anthracycline phase was not dose dense.',[s[1]]),endpoint('OS','E1199: 5-year OS 89.7% versus 86.5%','Weekly versus every-three-week paclitaxel','Separate component evidence; do not combine trial outcomes into an exact 00485 estimate.',[s[1]])];e['qualitative_result']='CALGB9741 also reported OS risk ratio 0.69 (P=0.013) for dose density.'
 else:
  s=[source(a['trial'],a['primary_url'])];e=dict(trial=a['trial'],population=a['population'],comparison=a['intervention']+' Comparator: '+a['comparator'],sources=s,applicability=a['applicability'],limitations=a['limitations'],endpoints=[])
  if c=='00743':e['qualitative_result']='In the 42-patient modified biweekly group, clinical benefit rate was 31.0% (13/42; 95% CI 17.6–47.1) and median time to treatment failure 81.5 days. These are CBR and TTF, not ORR or PFS. All participants started on day 1/8 every 21 days; conversion was tolerance-led.'
  else:
   for o in a['outcomes']:
    kind='ORR' if 'response' in o['endpoint'].lower() else 'OS' if 'overall survival' in o['endpoint'] else 'PFS' if 'progression-free' in o['endpoint'] else 'TTP'
    result=o['intervention']+(' versus '+o['comparator'] if o.get('comparator') else '');stats='; '.join(('HR '+str(o['hazard_ratio']) if 'hazard_ratio' in o else '', 'P='+o['p'] if 'p' in o else '')).strip('; ')
    meaning='Single-arm cohort outcome; no comparative treatment benefit established.' if c=='00736' else 'Study-level comparison; preserve the population and toxicity trade-offs.'
    if c=='00202' and kind=='ORR':meaning='Response difference was not statistically significant.'
    e['endpoints'].append(endpoint(kind,o['endpoint']+': '+result,stats,meaning,s))
 panels[c]=e
for k in d['regimen_profiles']:
 c=k['protocol_id'].split('-')[1];e=panels[c];e['checked']='2026-10-25';e.setdefault('harms','Balance benefit with drug-specific adverse effects, monitoring, treatment burden and individual priorities.');e['limitations'].append('Study-level outcomes are not a personalised prognosis; do not rank treatments across separate trials.');k['evidence_at_a_glance']=e;k['reference_links']+=e['sources']
(R/'data/regimen-knowledge-base-v08419-addendum.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('10 clinician evidence panels with schedule/endpoint limitations; no patient numerical prognosis.')
