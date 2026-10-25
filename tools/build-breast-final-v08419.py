"""Author ten reviewed suites; source audit files remain separate from public content."""
from pathlib import Path
import json,copy
R=Path(__file__).resolve().parents[1];V='0.84.19';DATE='2026-10-25';O='validation/breast-final-v08419/'
NEW=['00545','00605','00688','00720','00738'];RETRO=['00202','00230','00736','00743','00485'];CODES=NEW+RETRO
STATUS='Source reconciled; independent clinical, pharmacy and patient/PPI review pending'
def read(p):return json.loads((R/p).read_text())
def save(p,d):
 f=R/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def item(t,x,ids=None):return dict(title=t,text=x,source_ids=ids or ['nccp'])
def link(t,u):return dict(label=t,url=u)
def row(i,l,a,b,t,s='variable'):return dict(id=i,label=l,start=a,end=b,text=t,style=s)
def med(n,d,t,note=''):return dict(name=n,dose=d,timing=t,note=note)
# Source-specific content is editable independently of the generators.
CFG=read('data/breast-final-v08419-authoring.json')
BASE=read('data/patient-knowledge/00749.json');TARGET=read('data/patient-knowledge/00588.json')
AG={a['id']:copy.deepcopy(a) for c in ['00202','00230','00743','00485','00623'] for a in read('data/patient-knowledge/'+c+'.json')['agents']}
AG.update(CFG['agents'])
S=read('data/phase-support-v0838.json');J=read('data/breast-treatment-journeys-v0837.json');B=read('data/breast-library-contexts-v0837.json');profiles=[]
EARLY='After early-breast treatment, breast imaging and clinical review follow the agreed plan. Routine CT/PET scans or blood tumour markers are not used to search for distant recurrence in someone without symptoms or clinical concerns.'
MET='Agree the scan type and review interval for the known disease sites. Review response, symptoms and toxicity together; new or worsening symptoms may need an earlier assessment.'
BONE='Bone-health assessment follows endocrine therapy, ovarian suppression, menopause and other fracture risks. It has its own monitoring plan.'
for c in CODES:
 cfg=CFG['regimens'][c];p=json.loads(next((R/'protocols/breast').glob(c+'-*')).read_text());m=p['metadata'];new=c in NEW;target=c in ['00545','00605','00720'];early=cfg['setting_kind']=='early'
 d=copy.deepcopy(TARGET if target else BASE if new else read(O+f'baseline/patient-knowledge/{c}.json'))
 for k in ['scope_note','port_pump','trial','chronology_alternatives']:d.pop(k,None)
 ids=cfg['agents'];title=cfg['title'];schedule=cfg['schedule'];setting=cfg['setting'];days=cfg['days'];why=cfg['why'];imaging=EARLY if early else MET;imaging_ids=['early'] if early else ['metastatic','markers']
 d.update(content_version=V,suite_release=V,source_checked=DATE,review_status=STATUS,protocol_id=p['protocol_id'],code=c,protocol_version=m['nccp_version'],title=title,context_label=setting,cycle_days=days,schedule_summary=schedule,purpose=cfg['purpose'],cycle_display='reference-chronology',longitudinal_mapping=True,medicines_title='Your medicines and what they do',phases_title='Treatment and review',phases_note=cfg.get('phases_note','Your team confirms the active medicines, treatment days, dose changes and next review.'),hide_evidence_navigation=True)
 if not target:d.pop('service_kind',None)
 d['sources']=[copy.deepcopy(s) for s in BASE['sources'] if s['id'] not in ['trial','smpc']]
 d['sources'][0]=dict(id='nccp',title=f'NCCP {c} v{m["nccp_version"]} · official regimen',url=m['source_url'])
 d['sources']+=cfg.get('sources',[])
 d['agents']=[copy.deepcopy(AG[i]) for i in ids]
 for a in d['agents']:a['source_ids']=['nccp'];a['risks']=list(dict.fromkeys(a['risks']))
 d['evidence']=dict(title='Why this treatment may be chosen',intro=why,population=setting,combination_label='',comparison_label='',metrics=[],interpretation='Discuss how this evidence and the available alternatives apply to your own situation.',limitations='Discuss your own expected benefit, alternatives and uncertainty with the treating team.',source_ids=['nccp'],url=m['source_url'])
 if new:d['anatomy']=cfg['anatomy'];d.pop('anatomy_phases',None)
 else:
  for point in d['anatomy']:
   if point[2]=='Chemotherapy phase':point[2]=' / '.join(a['name'] for a in d['agents'])
 d['anatomy_note']='Selected medicine-specific effects; this is not a complete list. Report new or persistent symptoms even after treatment stops.'
 d['urgent_extra']=cfg['urgent'];d['consent_support']=cfg['consent'];d['teachback']='Which medicines and doses are prescribed, when are they due, which checks are needed, and what would make you call the team today?'
 d['support']=[item(x[0],x[1]) for x in cfg['patient_support']]
 d['questions']=[dict(q='Why was this treatment chosen for me?',a=why),dict(q='What happens if a dose is delayed or missed?',a=cfg['missed']),dict(q='Who arranges the checks and explains the results?',a='Agree the due window, booking team, result reviewer and contact route if a test or appointment is missing. This page does not record completed checks.'),dict(q='Can I take other medicines or supplements?',a=cfg['interactions'])]
 blood=cfg['blood'];other=cfg['other_checks'];d['monitoring_summary']=blood+' '+other
 d['chapters']=[dict(id='why-this-treatment',title='Why this treatment?',intro=why,items=[item('Your treatment setting',setting),item('Your exact schedule',schedule),item('Alternatives',cfg['alternatives'])]),dict(id='checks',title='Checks across treatment',intro='Your team arranges tests and reviews the results before treatment decisions.',items=[item('Blood and organ checks',blood),item('Other treatment-specific checks',other,cfg.get('monitor_sources',['nccp'])),item('Cancer review and follow-up',imaging,imaging_ids),item('Bone health',BONE,['bone'])]),dict(id='whole-pathway',title='The wider treatment plan',intro=cfg['pathway'],items=[item('Treatment changes',cfg['missed']),item('Medicines review',cfg['interactions']),item('After treatment',cfg['after'],cfg.get('monitor_sources',['nccp']))])]
 d['support_source_ids']=['nccp']+(['oral-antiemetic'] if c in ['00605','00720'] else ['antiemetic']);d['urgent_source_ids']=['nccp','hse'];d['timeline_source_ids']=['nccp']
 if target:
  d.update(service_kind='targeted',therapy_label=cfg['therapy_label'],schedule_kind='intermittent_infusion' if c=='00545' else 'continuous_oral',schedule_label=cfg['schedule_label'],indication_text=setting,administration_text=cfg['administration'])
  d['endocrine_timeline']=cfg['milestone_timeline'];d['logistics']=dict(sections=[dict(title=x[0],text=x[1]) for x in cfg['logistics']])
  for k in ['phases','phase_cycles','timeline','day_groups','passport_groups']:d.pop(k,None)
 else:
  if new:
   d['phases']=cfg['patient_phases'];d['timeline']=[row('visit'+str(n),'Treatment visit · Day '+str(n),n,n,text,'treatment') for n,text in cfg['visits']]
   d['timeline'] += [row('blood','Blood / infection',1,days,'Fever or sudden illness: seek advice'),row('nerves','Numbness / tingling',1,days,'Report changes before the next dose'),row('fatigue','Fatigue',1,days,'May build across treatment')]
   if c=='00688':d['timeline'].append(row('immune','Immune symptoms',1,days,'Can arise at any time, including after treatment','immune'))
   else:d['timeline'].append(row('vascular','Bleeding / blood pressure',1,days,'Report bleeding, headache or new swelling'))
   d['phase_cycles']=[dict(label=title+f' · {days}-day reference',cycle_days=days,schedule_summary=schedule,timeline=copy.deepcopy(d['timeline']))]
   d['passport_groups']=[dict(title='Treatment review · confirm active medicines',agents=ids) for _ in range(4)]
  d['day_groups']=[dict(start=1,end=days,title='Reference cycle',body=schedule,action='Follow your written appointment and medicine plan. A calendar does not authorise a dose.')]
  d['chronology_notes']=[item('Timing varies','Symptoms can occur on any day, including days without treatment. The bands are orientation, not predicted symptom-free periods.'),item('Treatment-day changes',cfg['missed'])]
  if 'patient_phases' in cfg:d['phases']=cfg['patient_phases']
  d['logistics']=dict(nav_label='Visits and practical planning',title='Your treatment and access plan',intro=schedule,steps=[dict(icon=icon,title=t,text=x) for icon,t,x in cfg['logistics_steps']],details=[dict(title=t,text=x,source_ids=['nccp']) for t,x in cfg['logistics_details']],source_ids=['nccp','port','picc'])
 stages=cfg.get('stages',['Before starting','First treatment','During treatment','Change / completion','Follow-up'])
 monitorrows=[dict(label=t,cells=cells) for t,cells in cfg['monitor_rows']]
 d['monitoring_schedule']=dict(title='When checks happen',columns=stages,rows=monitorrows,note='Relative milestones, not equal time intervals. Your team books tests and reviews results; this map does not confirm completion.',source_ids=list(dict.fromkeys(['nccp','bone']+imaging_ids+cfg.get('monitor_sources',[]))))
 save('data/patient-knowledge/'+c+'.json',d)
 lanes=[dict(label='Treatment plan',cells=cfg['treatment_cells'],kind='treatment',source_ids=[c],note=schedule)]
 for x in monitorrows:
  source=[c]+(cfg.get('monitor_sources',[]) if any(w in x['label'] for w in ['Heart','Other']) else [])
  lanes.append(dict(label=x['label'],cells=x['cells'],kind='monitoring',source_ids=list(dict.fromkeys(c if s=='nccp' else s for s in source)),note=blood if x['label'].startswith('Blood') else other))
 lanes.append(dict(label='Cancer review',cells=['Confirm setting','Agree review plan','Response / symptom review' if not early else 'Follow the early-breast plan','Next treatment / completion','Agreed surveillance'],kind='local',source_ids=imaging_ids,note=imaging))
 milestones=[dict(title=t,when=w,why=x,clinical=x,action=a,source_ids=refs) for t,w,x,a,refs in [('Before treatment','Before the first dose',setting+'. '+blood,'Confirm eligibility, test results and medicine list.',[c]),('Other checks','At the specified review points',other,'Confirm who arranges and reviews each check.',[c]+[s for s in cfg.get('monitor_sources',[]) if s!='nccp']),('Support and practical plan','At each treatment or phase change',cfg['support_summary'],'Choose the matching support plan; confirm active medicines.',[c]),('Response and follow-up','Agreed review points',imaging+' '+cfg['after'],'Review symptoms, results and patient priorities.',imaging_ids)]]
 J[c]=dict(code=c,release=V,checked=DATE,status=STATUS,schedule_type='relative-educational',has_patient_dates=False,title=title+': treatment and checks',setting=setting,summary=schedule,stages=stages,lanes=lanes,milestones=milestones,clinical_notes=[cfg['pathway'],blood,other,imaging],sources=[dict(id=c if s['id']=='nccp' else s['id'],title=s['title'],url=s['url']) for s in d['sources']])
 B['regimens'][c]=dict(code=c,protocol_id=p['protocol_id'],settings=list(dict.fromkeys({'locally_advanced':'advanced','metastatic':'advanced','extended_adjuvant':'adjuvant'}.get(x,x) for x in m.get('treatment_setting',[]))),receptors=cfg['receptors'],longitudinal=True,source_url=m['source_url'],basis='Source indication; individual suitability requires clinical interpretation.')
 S['regimens'][c]=copy.deepcopy(cfg['support_plans'])
 for s in S['regimens'][c]:s.update(source_checked=DATE);s['additional_support']=list(dict.fromkeys(s['additional_support']))
 rationale=dict(summary=why,setting=setting,line=cfg['line'],factors=cfg['selection_factors'],alternatives=[cfg['alternatives']],limitations=cfg['limitations'],sources=[link(d['sources'][0]['title'],m['source_url'])])
 profiles.append(dict(protocol_id=p['protocol_id'],regimen_role=setting,clinical_summary=why,treatment_setting=setting,component_rationale=' '.join(a['name']+': '+a['explanation'] for a in d['agents']),schedule_context=schedule,key_points=[schedule,blood,other],treatment_rationale=rationale,patient_selection=dict(treatment_intent=cfg['purpose'],disease_and_biomarker_context=[setting],eligibility_orientation=cfg['selection_factors'],important_cautions=cfg['clinical_cautions']),supportive_care=dict(emetogenic_risk='; '.join(s['label']+': '+s['emetogenic_risk'] for s in S['regimens'][c]),premedication_and_prophylaxis=list(dict.fromkeys(x for s in S['regimens'][c] for x in s['additional_support'])),patient_education=[x['text'] for x in d['support']],special_support=[cfg['support_summary']]),monitoring_and_toxicity=dict(baseline=[blood,other],before_each_cycle=[blood,other],priority_toxicities=list(dict.fromkeys(x for a in d['agents'] for x in a['risks'])),urgent_review_signals=[cfg['urgent']],longitudinal_schedule=d['monitoring_schedule']),administration=dict(cycle_and_sequence=schedule,route_and_duration=[cfg.get('administration',schedule)],practical_workflow=[x['text'] for x in d['logistics'].get('steps',d['logistics'].get('sections',[]))],observation_and_access=cfg.get('logistics_details',[])),full_suite_release=V,source_checked_date=DATE,review_status=STATUS,reference_links=[link(s['title'],s['url']) for s in d['sources']]+[link(t,f'patient/{c}/{f}') for t,f in [('Whole-treatment map','treatment-journey.html'),('Patient knowledge','knowledge.html'),('Consent generator','consent.html'),('Separate support plans','supportive-care.html')]]))
S['release']=V;B.update(release=V,checked=DATE)
save('data/phase-support-v0838.json',S);save('data/breast-treatment-journeys-v0837.json',J);save('data/breast-library-contexts-v0837.json',B)
save('data/regimen-knowledge-base-v08419-addendum.json',dict(schema_version='1.0',release=V,source_checked_date=DATE,governance=STATUS,regimen_profiles=profiles,evidence_records=[],drug_profiles=[]))
save('data/breast-final-v08419-source-index.json',dict(release=V,date=DATE,codes=CODES,new_codes=NEW,retrospective_codes=RETRO,status=STATUS,sources=[dict(code=c,url=read(f'data/patient-knowledge/{c}.json')['sources'][0]['url']) for c in CODES],regimens={c:dict(rule_count=json.loads(next((R/'protocols/breast').glob(c+'-*')).read_text())['rule_engine']['rules'].__len__()) for c in CODES}))
print('Authored ten scoped patient suites, monitoring maps, support plans and clinician profiles.')
