"""Focused clinical-content regressions for the endocrine retrospective proposals."""
from pathlib import Path
import json, re

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
A=json.loads((HERE/'authoring.json').read_text())
R=A['regimens']; CHECKS=[]
def check(label, condition):
    CHECKS.append({'check':label,'passed':bool(condition)})
def body(code, part='patient'): return json.dumps(R[code][part],ensure_ascii=False)
check('Scope exactly the five assigned retrospectives',set(R)=={'00322','00414','00525','00619','00892'})
check('Governance remains unauthorised',A['clinical_use_authorised'] is False)
required={'patient','clinical','evidence','journey','selector','support_plans','route','risk'}
for code,x in R.items():
    p=x['patient'];m=p['monitoring_schedule'];j=x['journey'];sourceids={s['id'] for s in p['sources']}
    check(code+' authoring structure complete',required<=set(x))
    check(code+' qualitative patient metrics',p['evidence']['metrics']==[])
    check(code+' no numerical efficacy in patient content',not re.search(r'\b\d+(?:\.\d+)?%|\bHR\s*[=0-9]|hazard ratio|63\.9|77\.4|88\.5|83\.6|24\.8|53\.9',body(code)))
    check(code+' patient source date',p['source_checked']=='2026-10-25')
    check(code+' evidence source date',x['evidence']['checked']=='2026-10-25')
    check(code+' complete monitoring cells',len(m['rows'])>=6 and all(len(z['cells'])==len(m['columns']) for z in m['rows']))
    check(code+' complete journey cells',all(len(z['cells'])==len(j['stages']) for z in j['lanes']))
    check(code+' evidence references resolve',set(p['evidence']['source_ids'])<=sourceids)
    check(code+' separate supportive plan',len(x['support_plans'])>0 and all(z['medicines']==[] and z['additional_support'] and z['source_checked']=='2026-10-25' for z in x['support_plans']))
    check(code+' distinct baseline and ongoing checks',bool(x['clinical']['baseline']) and bool(x['clinical']['ongoing']))
    check(code+' all agents retain specific risks',all(a.get('risks') and a.get('explanation') for a in p['agents']))
    check(code+' clinician endpoints have interpretation and analysis status',all(z.get('analysis_status') and z.get('interpretation') and z.get('limitations') and z.get('sources') for z in x['evidence']['endpoints']))
    check(code+' governance false',x['clinical_use_authorised'] is False)
check('Everolimus continuous without invented rest week','no planned rest week' in R['00322']['patient']['schedule_summary'])
check('Everolimus baseline urine protein and lipids','urinary protein' in body('00322','clinical') and 'triglycerides' in body('00322','clinical'))
check('Everolimus PFS not conflated with significant OS','not statistically significant' in R['00322']['evidence']['qualitative_result'])
check('Palbociclib D1/D15 monitoring and conditional relaxation','Day 1 and Day 15 of cycles 1–2' in body('00414','clinical') and 'first six cycles' in body('00414','clinical') and 'every three months' in body('00414','clinical'))
check('Palbociclib formulation-specific food advice','capsules' in body('00414') and 'tablets can be taken with or without food' in body('00414'))
check('PALOMA-2 final OS retains one-sided P .34','one-sided P=.34' in body('00414','evidence'))
check('PALOMA-3 exploratory follow-up separated','Exploratory follow-up' in body('00414','evidence') and 'two-sided P=.09' in body('00414','evidence'))
check('Metastatic ribociclib has 600 mg schedule','600 mg' in R['00525']['patient']['schedule_summary'])
check('Adjuvant ribociclib has 400 mg schedule','400 mg' in R['00892']['patient']['schedule_summary'])
check('Metastatic ribociclib has no fixed three-year stop','no fixed three-year stop' in body('00525'))
check('Adjuvant ribociclib three-year limit','up to three years' in R['00892']['patient']['schedule_summary'])
check('Ribociclib monitoring C1D14 plus six-cycle electrolytes',all('Day 14' in body(c,'clinical') and 'first six cycles' in body(c,'clinical') for c in ['00525','00892']))
check('All oral CDK4/6 moderate-high support classifications correct',all(R[c]['support_plans'][0]['emetogenic_risk']=='Oral moderate–high' and R[c]['risk']['level']=='oral_moderate_high' for c in ['00525','00619','00892']))
check('Everolimus and palbociclib minimal-low classification',all(R[c]['risk']['level']=='oral_minimal_low' for c in ['00322','00414']))
check('Adjuvant ribociclib endocrine partner has no fulvestrant risk','fulvestrant' not in json.dumps(R['00892']['patient']['agents']).lower())
check('Adjuvant ribociclib no abemaciclib practical advice','abemaciclib' not in json.dumps(R['00892']['patient']['logistics']).lower())
check('Metastatic ribociclib no abemaciclib practical advice','abemaciclib' not in json.dumps(R['00525']['patient']['logistics']).lower())
check('Abemaciclib no ribociclib practical advice','ribociclib' not in json.dumps(R['00619']['patient']['logistics']).lower())
check('Abemaciclib two-year continuous plan','twice daily continuously for up to two years' in R['00619']['patient']['schedule_summary'])
check('Abemaciclib early blood timing retained','every two weeks for the first two months, monthly for the next two months' in body('00619','clinical'))
check('Abemaciclib first loose stool support','first loose stool' in json.dumps(R['00619']['support_plans']))
check('Abemaciclib clinical eligibility matches NCCP','four or more positive' in body('00619','clinical') and '16 months' in body('00619','clinical') and '12 weeks' in body('00619','clinical'))
check('monarchE primary OS significance boundary explicit','prespecified significance boundary' in body('00619','evidence'))
check('monarchE iDFS and OS differences separated','1.8 percentage points' in body('00619','evidence') and '6.5 percentage points' in body('00619','evidence'))
check('NATALEE latest primary source date explicit','23 October 2026' in body('00892','evidence'))
check('NATALEE OS descriptive and nominal qualifications','descriptive' in body('00892','evidence') and 'nominal one-sided P=.019' in body('00892','evidence') and 'do not claim a new confirmatory' in body('00892','evidence'))
check('NATALEE correct six-year primary estimates','91.86% versus 89.73%' in body('00892','evidence') and '83.23% versus 77.92%' in body('00892','evidence'))
check('NATALEE primary article rather than sponsor-only evidence',all('novartis.com/news' not in s['url'] for s in R['00892']['evidence']['sources']))
check('Adjuvant/metastatic selectors separated',all(R[c]['selector']['settings']==['advanced'] for c in ['00322','00414','00525']) and all(R[c]['selector']['settings']==['adjuvant'] for c in ['00619','00892']))
check('Existing assessment source conflicts preserved',all(any(r['rule_id']==rid for r in json.loads(next((ROOT/'protocols/breast').glob(c+'-*.json')).read_text())['rule_engine']['rules']) for c,rid in [('00525','SOURCE_ELIGIBILITY_CONFLICT'),('00892','NODE_NEGATIVE_CONFLICT')]))
report={'scope':'Endocrine retrospective authoring content; not a prescribing-rule validation or clinical sign-off','checked':'2026-10-25','total':len(CHECKS),'passed':sum(x['passed'] for x in CHECKS),'failed':[x for x in CHECKS if not x['passed']],'checks':CHECKS}
(HERE/'content-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f"{report['passed']}/{report['total']} endocrine retrospective content checks passed")
for x in report['failed']: print('FAIL:',x['check'])
raise SystemExit(bool(report['failed']))
