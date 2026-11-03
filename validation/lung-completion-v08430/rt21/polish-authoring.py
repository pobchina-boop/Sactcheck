from pathlib import Path
import json,re
B=Path(__file__).parent;p=B/'authoring.json';a=json.loads(p.read_text())
# Tight visible-text substitutions only. IDs, routes and URLs remain unchanged.
visible={'title','text','body','action','why','clinical','label','short','detail','note','summary','purpose','schedule','card_schedule','card_alert','card_title','introduction','intro','interpretation','context_label','indication_text','schedule_summary','administration_text','monitoring_summary','urgent_extra','consent_support','timeline_note','safety_note','passport_visit_note','treatment_scope_notice','phases_note','anatomy_note','teachback','explanation','watch','mechanism','dose','timing','population','comparison','applicability','metric','result_text','analysis_status','qualitative_result','source_page','mapping_basis','setting','line','treatment_intent'}
def polish(s):
 s=re.sub(r'\b(NCCP|Day|Days|Grade|Cycle|cycle|Week|week|Table|table|AUC|ECOG|CrCl|GFR|ALT|AST|ANC)(?=\d)',r'\1 ',s)
 s=re.sub(r'\b(before|after|every|four|seven|two|for|to)(?=\d)',r'\1 ',s)
 s=re.sub(r'(?<=\d)(?=(?:mg|mL|mmol|micromol|ULN|hours|minutes|days|weeks|cycles|months|fractions|Gy)\b)',r' ',s)
 s=re.sub(r'\b(IV|q)(?=21|28)',r'\1 ',s)
 s=re.sub(r'\b(indication|regimen|version|Table|NCCP|phase)(?=00\d)',r'\1 ',s)
 s=re.sub(r'(?<=\d)(?=Day|Grade|cycle|weekly|micrometre)',r' ',s)
 s=re.sub(r'\bphaseII\b','phase II',s);s=re.sub(r'\bStageIII\b','Stage III',s);s=re.sub(r'\bNSCLC\b','NSCLC',s)
 return s
def walk(v,key=''):
 if isinstance(v,dict):return {k:walk(x,k) for k,x in v.items()}
 if isinstance(v,list):return [walk(x,key) for x in v]
 if isinstance(v,str) and key in visible and not v.startswith('http'):return polish(v)
 return v
a=walk(a)
for code,x in a['regimens'].items():
 d=x['patient'];s=d['patient_summary']
 for agent in d['agents']:
  agent['symptoms']={'cisplatin':['Urinary symptoms','Hearing changes','Numbness / tingling'],'etoposide':['Mouth soreness / ulcers','Nausea','Fatigue'],'paclitaxel':['Numbness / tingling','Fatigue','Muscle / joint pain'],'carboplatin':['Nausea','Bleeding / bruising','Fatigue']}[agent['id']]
 s['preparation']=['Confirm your prescription, radiation appointments and blood tests.','Bring your medicine list and daytime / overnight contact numbers.']
 if code=='00279':
  s['purpose']='Chemotherapy and radiation work together to treat limited-stage small-cell lung cancer. Your team explains your treatment aim and choices.'
  s['schedule']='Reference IV plan: four 21-day cycles. Day 1: cisplatin + etoposide. Days 2–3: etoposide. Radiation follows its own appointments. Capsules, split cisplatin, carboplatin substitution or 28-day cycles require a different personalised prescription.'
  s['phases']=[dict(title='Four chemotherapy cycles',text='Three treatment days per reference cycle, then recovery. Your team confirms each cycle after safety checks.'),dict(title='Radiotherapy alongside chemotherapy',text='Usually starts with cycle 1. Radiation oncology sets the dose and visits; chemotherapy delays need separate coordination.'),dict(title='Recovery and response review',text='Report persistent or new symptoms. Your team agrees recovery checks, scans and any useful markers; there is no universal timetable.')]
  s['cycle_expectations']=['Follow the prescribed anti-sickness course and fluid advice; call early if eating or drinking becomes difficult.','Fever, new breathlessness, uncontrolled vomiting or inability to drink needs urgent advice, including after treatment ends.']
  s['monitoring']=[dict(stage='Before',test='Blood count, kidneys and liver',when='Before treatment',basis='Required by regimen'),dict(stage='Before',test='Audiology / creatinine clearance',when='When clinically indicated',basis='If clinically indicated'),dict(stage='During',test='Bloods; hearing and nerve symptoms',when='Before every chemotherapy cycle',basis='Required by regimen'),dict(stage='After / review',test='Recovery, scans and useful markers',when='Team-agreed timing; no universal interval',basis='Team-agreed plan')]
  d['treatment_scope_notice']='Lung indication 00279a only. This is the IV 21-day reference schedule. Oral, split, platinum-substitution and 28-day alternatives need a personalised prescription and patient information. Small-cell cervix / other sites need separate material.'
 else:
  s['purpose']='Chemotherapy and radiation treat stage III non-small-cell lung cancer when cisplatin is unsuitable. Your team explains your treatment aim and options.'
  s['schedule']='Paclitaxel then carboplatin by drip once every 7 days for seven weeks, alongside separately scheduled radiotherapy. Test results or side effects may change treatment. Any treatment after this course needs a separate decision and prescription.'
  s['phases']=[dict(title='Seven weekly chemotherapy treatments',text='Both drugs at each weekly visit, after blood tests, symptom review and premedicines.'),dict(title='Radiotherapy alongside chemotherapy',text='The radiation team sets the dose and appointments. A chemotherapy delay does not automatically stop radiation.'),dict(title='After chemoradiation',text='Review recovery and response. Further treatment, including possible separate consolidation chemotherapy, is a new consultant decision.')]
  s['cycle_expectations']=['Use the prescribed anti-sickness medicines; report numbness, swallowing pain, fatigue or muscle and joint symptoms before treatment.','Fever, new breathlessness, uncontrolled vomiting or inability to drink needs urgent advice, including after the course ends.']
  s['monitoring']=[dict(stage='Before',test='Blood count, kidneys, liver and GFR',when='Measured GFR preferred; otherwise verified estimate',basis='Required by regimen'),dict(stage='Before / during',test='Hearing / nerves',when='When clinically indicated',basis='If clinically indicated'),dict(stage='During',test='Blood count, kidneys and liver',when='Weekly; creatinine within 48 hours for calculated GFR',basis='Required by regimen'),dict(stage='After / review',test='Recovery, scans and useful markers',when='Team-agreed timing; no universal interval',basis='Team-agreed plan')]
 s['template_version']='0.84.30'
p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
print('Condensed patient summaries and normalised visible spacing / passport symptom prompts')
