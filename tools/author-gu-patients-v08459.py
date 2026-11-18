#!/usr/bin/env python3
"""Build explicit GU profiles with route-specific monitoring, consent and support."""
import copy,importlib.util,json,pathlib,re
R=pathlib.Path(__file__).resolve().parents[1]
def module(name,file):
 s=importlib.util.spec_from_file_location(name,R/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
h=module('patients58','tools/author-gu-patients-v08458.py');f=module('facts59','tools/gu-v08459-facts.py')
h.VERSION='0.84.59';h.SOURCE={x['code']:x for x in h.read('validation/gu-v08459/clinical/new-and-repeat-sources.json')}
FACTS=f.facts(h.agent_from)
def prose(s):
 if not isinstance(s,str):return s
 s=re.sub(r'(\d)(mg|minutes|hours|weeks|months|days|years|cycles|weeks|months)\b',r'\1 \2',s)
 s=re.sub(r'\b(day|days|week|weeks|month|months|option|Option|NCCP|grade|Grade|versus|of|for|was|with|only|at|through|until|after|before|below|over|per|every)(?=\d)',r'\1 ',s)
 return re.sub(r'(?<=[.;,])(?=[A-Za-z])',' ',s)
def clean(v,key=''):
 if isinstance(v,dict):return {k:clean(x,k)for k,x in v.items()}
 if isinstance(v,list):return [clean(x,key)for x in v]
 return v if key in ['id','url','trial_url','code','protocol_id','source_ids'] else prose(v)
FACTS=clean(FACTS)
def save(p,o):h.save(p,o)
def support(code,d,f,w,phase):
 rows=[];selector=dict(protocol_id=d['protocol_id'],source_version=d['protocol_version'],source_url=d['sources'][0]['url'],source_checked=h.DATE,source_pages=list(range(1,h.SOURCE[code]['pages']+1)),phases=[])
 for id,label,agents,risk in f['phases']:
  pid='gu59_'+code+'_'+id
  if code=='00945':
   plan=copy.deepcopy(w['antiemetic_plans']['low']);plan['warnings']=list(dict.fromkeys(plan.get('warnings',[])+[f['support'],'Reconcile the current CUH prescription and any stomach protection; do not combine competing antiemetic prescriptions.']))
   medicines=[dict(name=m['medicine'],dose=' '.join([m['dose'],m['route'],m['frequency']]),timing=m['timing'],note='Reference for the selected infusion day; pharmacy confirms the actual prescription.')for k in ['day1','subsequent']for m in plan[k]]
  else:
   plan=dict(label=label,risk=risk,day1=[],subsequent=[],warnings=[f['support']],source_url=d['sources'][0]['url'],source_checked=h.DATE)
   medicines=[]
   if code=='00453':medicines=[dict(name='Transplant supportive medicines',dose='Individual specialist prescription',timing='Conditioning, infusion and recovery phases',note=f['support'])]
   elif code=='00602':medicines=[dict(name='Mesna',dose='400 mg/m² IV per dose',timing='Each day 1–5: immediately before ifosfamide, then 4 and 8 hours after its infusion finishes',note='Trained team confirms the full uroprotection prescription.'),dict(name='G-CSF',dose='5 micrograms/kg SC; round to whole syringe under local policy',timing='Start day 6; continue until neutrophil recovery',note='Confirm the prescribed product and duration.'),dict(name='Multi-day antiemetics, hydration and paclitaxel premedication',dose='Individual prescribed schedule',timing='Days 1–5 and the required delayed-support period',note=f['support'])]
   elif code=='00894':medicines=[dict(name='Sodium bicarbonate',dose='1200 mg PO',timing='Night before and 1 hour before instillation',note='Source premedication; confirm the prescription and patient suitability.'),dict(name='Symptom medicines',dose='Prescribed individually',timing='Only as directed',note='Ondansetron4 mg PO may be considered after nausea with a prior instillation. Pain/spasm options require urology review; mirabegron is a beta3 agonist, not an anticholinergic.')]
   elif code=='00807':medicines=[dict(name='Routine premedication',dose='None usually required',timing='Confirm product-specific plan',note='No automatic steroid or systemic chemotherapy antiemetic regimen.')]
   elif code=='00885':medicines=[dict(name='Phosphate binder and symptom support',dose='Only if prescribed after review',timing='Based on phosphate and symptoms',note='Binders are taken with food as prescribed; confirm monitoring and diet. Do not automatically add vitaminD.')]
  plan.update(label=label,source_url=d['sources'][0]['url'],source_checked=h.DATE);w['antiemetic_plans'][pid]=plan
  selector['phases'].append(dict(id=id,label=label,active_medicines=agents,plan_id=pid,notes=[f['schedule'],f['support']]))
  rows.append(dict(id=id,label=label,active_medicines=agents,active_drugs=agents,emetogenic_risk=risk,medicines=medicines,additional_support=[f['prep'],f['support'],f['access']],source_page='Treatment and supportive-care sections',source_checked=h.DATE,source_url=d['sources'][0]['url'],guidance=dict(label='Current NCCP regimen; prescribed local plan',url=d['sources'][0]['url'])))
 w['supportive_phase_selectors'][code]=selector;phase['regimens'][code]=rows
def main():
 w=h.read('data/regimen-workflow-v0750.json');ph=h.read('data/phase-support-v0838.json');j=h.read('data/breast-treatment-journeys-v0837.json');presentation=h.read('data/patient-presentation-v08431.json');kb=[]
 for code,f in FACTS.items():
  d,p=h.build_profile(code,f)
  d['sources']=[s for s in d['sources']if s['id']!='ncis']
  for product in (['balversa']if code=='00885'else['padcev','keytruda']if code=='00945'else[]):d['sources'].append(dict(id=product,title=product.title()+' product information',url='https://www.ema.europa.eu/en/documents/product-information/'+product+'-epar-product-information_en.pdf'))
  if code=='00807':d['sources'].append(dict(id='bcg-medac',title='HPRA BCG-medac product information: verify prescribed brand',url=f['trial_url']))
  for key in ['timeline_source_ids','support_source_ids','urgent_source_ids']:d[key]=['nccp']
  d['administration_route']='intravesical'if code in ['00807','00894']else'oral'if code=='00885'else'intravenous'
  d['monitoring_test_details']=[dict(label='Before treatment',purpose='Confirm diagnosis, suitability and the required safety checks.',timing=f['baseline'],kind='blood'if code not in ['00807','00894']else'procedure',scope='routine',source_ids=['nccp']),dict(label='During treatment and follow-up',purpose='Detect toxicity and assess response with the appropriate tests.',timing=f['monitoring'],kind='review',scope='routine',source_ids=['nccp'])]
  if code in ['00807','00894']:
   d['monitoring_schedule']['rows'][0]['label']='Bladder checks and symptoms'
   d['support'][2]['text']='Discuss pregnancy prevention, breastfeeding, fertility concerns and product-specific sexual precautions. Your urology team confirms the written plan.'
   d['chapters'][2]['items'][2]['text']=d['support'][2]['text']
   d['chapters'][3]['items'][1]=dict(title='During catheter treatment',text='Tell the nurse immediately about severe pain, bleeding, catheter difficulty or an allergic reaction. The team may postpone instillation.',source_ids=['nccp'])
   d['patient_summary']['card_record_unit']='administration';d['patient_summary']['card_cycle_count']=6;d['patient_summary']['card_record_note']='Induction only; record maintenance separately.'
   for group in d['day_groups']:
    if group['title']=='Between scheduled chemotherapy doses':group['title']='Between instillations';group['body']='Follow the prescribed urine, symptom and contact plan. Report fever, severe pain, bleeding or difficulty passing urine promptly. The next visit depends on safety review.'
   d['urgent_extra']='Contact your urology or oncology treatment team immediately for fever, chills, sudden illness, severe bladder pain, persistent bleeding or inability to pass urine. Severe breathing difficulty, collapse or chest pain: call112/999.'
   if code=='00807':
    d['support'].append(dict(title='BCG precautions after treatment',text='For BCG-medac, sit to pass urine after the agreed dwell time and wash hands and genital skin carefully. Follow the unit’s written toilet-disinfection instructions. Use a condom for one week after each treatment. Carry the product alert card; tell clinicians about BCG even years later if unexplained fever or illness occurs.',source_ids=['bcg-medac']))
    d['chapters'][3]['items'].append(dict(title='Delayed BCG infection',text=d['support'][-1]['text'],source_ids=['bcg-medac']))
  if code=='00453':
   d['day_groups']=[dict(start=-5,end=-3,title='High-dose chemotherapy',body=f['schedule'],action='Follow the transplant-team plan.'),dict(start=-2,end=-1,title='Between conditioning and rescue',body='Continue prescribed support and daily tests. This is not a period free of treatment risks.',action='Report symptoms to the transplant team.'),dict(start=0,end=0,title='Your stored stem cells are infused',body='The transplant service gives the infusion and monitors you.',action='Tell staff immediately about any reaction.'),dict(start=1,end=8,title='Blood-count recovery',body='Growth factor starts on day+1. Recovery may extend beyond this illustrated interval.',action='Daily monitoring and infection precautions continue until the team changes the plan.')]
   d['relative_day_origin']=-5;d['patient_summary']['card_record_unit']='review';d['patient_summary']['card_alert']='Autologous stem-cell pathway: irradiated cellular blood components required. Carry the transplant-team contact plan.'
  if code=='00602':d['patient_summary']['card_cycle_count']=4
  if code=='00885':
   d['patient_summary']['monitoring']=[dict(stage='Before',test='Bloods, ECG and eyes',when='Baseline blood count, kidney/liver profile, phosphate/electrolytes, ECG and eye examination.',basis='NCCP'),dict(stage='Early',test='Phosphate and toxicity',when='Days14–21 before any dose escalation.',basis='NCCP'),dict(stage='Ongoing',test='Bloods / eye examinations',when='Phosphate monthly; eyes monthly for4months then every3months. New visual symptoms need prompt review.',basis='NCCP')]
  if code=='00945':
   d['patient_summary']['card_schedule']='EV days1/8 each21-day block; pembro200 mg q21 OR400 mg q42. Confirm option.'
   d['patient_summary']['phases']=[dict(title='Choose one prescribed schedule',text='200 mg pembrolizumab every21 days OR400 mg every42 days; enfortumab days1/8 in each21-day block.')]
   d['patient_summary']['cycle_blocks']=[dict(label='21-day option',text='EV days1/8 + pembro200 mg day1; repeat at day22.'),dict(label='42-day option',text='EV days1/8/22/29 + pembro400 mg day1 only.'),dict(label='Safety review',text='Confirm the selected option and blood-test plan before each visit.')]
  d['chronology_notes']=[dict(title='Schedule scope',text=f['scope']),dict(title='Symptoms',text='Symptoms can occur on any day; a gap between doses is not a guaranteed safe period.')]
  d=clean(d);save('data/patient-knowledge/'+code+'.json',d);presentation['routes'][code]='data/patient-knowledge/'+code+'.json'
  support(code,d,f,w,ph);entry=h.knowledge(code,f,d,p);entry['administration']['route_and_duration']=[f['administration']];kb.append(entry)
  j[code]=dict(code=code,title=f['title']+': treatment and checks',release=h.VERSION,checked=h.DATE,status=h.STATUS,schedule_type='relative-educational',has_patient_dates=False,setting=f['context'],summary=f['schedule'],stages=d['monitoring_schedule']['columns'],lanes=[dict(**row,kind='monitoring',source_ids=['nccp'],note=d['monitoring_schedule']['note'])for row in d['monitoring_schedule']['rows']],milestones=[dict(title='Treatment review',when=f['label'],why=f['purpose'],clinical=f['schedule'],action=d['urgent_extra'],source_ids=['nccp'])],sources=d['sources'])
  if code not in j.get('codes',[]):j.setdefault('codes',[]).append(code)
  p['supportive_care'].update(premedication=[f['prep']],other_support=[f['support']],source_url=d['sources'][0]['url'],phase_specific_plan='patient/'+code+'/supportive-care.html');save(next(e['path']for e in h.INDEX if '/'+code+'-'in e['path']),p)
 for file,obj in [('data/regimen-workflow-v0750.json',w),('data/phase-support-v0838.json',ph),('data/breast-treatment-journeys-v0837.json',j),('data/patient-presentation-v08431.json',presentation)]:save(file,obj)
 save('data/regimen-knowledge-base-v08459-addendum.json',dict(schema_version='1.0',release=h.VERSION,regimen_profiles=kb));save('validation/gu-v08459/clinical/authored-patient-facts.json',FACTS)
 print('Six route-specific patient profiles, clinician knowledge and support plans written.')
if __name__=='__main__':main()
