"""Prepare data-only, exact-protocol-bound clinician support selectors."""
from pathlib import Path
import json,copy

ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
old=json.loads((ROOT/'data/regimen-workflow-v0750.json').read_text())
DATE='2026-11-10'
def item(medicine,dose,route,frequency,timing):
    return dict(medicine=medicine,dose=dose,route=route,frequency=frequency,timing=timing)
def clone(key,label):
    p=copy.deepcopy(old['antiemetic_plans'][key]);p['label']=label
    for k in ['local_prescription_source_id','local_prescription_items','local_adjunct_note']:
        p.pop(k,None)
    p['source_checked']=DATE;p['clinical_review_status']='Draft for clinician/pharmacy completion and authorisation'
    return p

plans={}
plans['hn47_cisplatin_four_day']={
  'risk_level':'high','label':'Four-day cisplatin / fluorouracil · complete the individual multiday prescription',
  'risk_range':'High emetogenic risk','colour':'red',
  'day1':[item('Four-day high-risk antiemetic prescription','Clinician/pharmacist to complete','As prescribed','As prescribed','Before SACT on Days 1–4 and delayed cover through the two days after the final SACT day')],
  'subsequent':[],
  'warnings':[
    'NCCP 00314 gives cisplatin on all four treatment days. A single-day aprepitant/ondansetron/steroid course is not a complete regimen-specific prescription.',
    'NCIS v8 p5 requires coverage for the emetic risk on each treatment day and two days afterwards. Its separate aprepitant instruction concerns five-day cisplatin, not this four-day schedule.',
    'Write the complete prevention/rescue medicine schedule, doses, routes and end days, plus the separate individual hydration/electrolyte prescription before authorisation.'
  ],
  'evidence_update':'NCCP 00314 v4b pp1–3; NCIS v8 pp4–5. Deliberately unfilled because the retrieved sources do not specify a complete four-day drug-by-drug course.',
  'source_checked':DATE,'clinical_review_status':'Incomplete source-linked draft; no administration authority'
}

for c,base in [('00417','high_standard'),('00418','high_carboplatin')]:
    key='hn47_'+c+'_day1';p=clone(base,'Day 1 cetuximab / '+('cisplatin' if c=='00417' else 'carboplatin')+' / fluorouracil')
    for m in p['day1']:
        if m['medicine']=='Dexamethasone':
            m['dose']='NCIS antiemetic reference 12 mg; confirm one reconciled total steroid dose'
            m['timing']='At least one hour before cetuximab if used to fulfil the infusion steroid requirement; prescriber confirms route/dose'
    p['day1'].append(item('Cetuximab antihistamine premedication','Prescriber to specify agent and dose','Prescriber to specify','Single pre-infusion dose','At least one hour before cetuximab'))
    p['warnings'] += [
      'The cetuximab regimen also requires corticosteroid premedication. Reconcile it with the antiemetic dexamethasone into one total prescription; do not add a second steroid course automatically.',
      'This plan applies to the Day 1 platinum visit. Days 8/15 receive cetuximab-only support; do not repeat the full platinum antiemetic course.',
      'Fluorouracil continues through Days 1–4. Review daily emetic risk and delayed cover using the NCIS multiday guidance; confirm rescue duration.',
      'Chemotherapy starts at least one hour after cetuximab ends. Confirm observation under the current SmPC and local policy.'
    ]
    if c=='00417':p['warnings'].append('Cisplatin requires a separate individual pre-/post-hydration and electrolyte prescription.')
    p['evidence_update']=f'NCCP {c} v7 treatment/supportive-care sections; NCIS v8 pp4–5. '+('General high-risk row includes olanzapine.' if c=='00417' else 'Dedicated carboplatin AUC≥4 row excludes routine olanzapine.')
    plans[key]=p

p=clone('low','Weekly cetuximab-only visit · no platinum antiemetic course')
p['day1']=[item('Antihistamine premedication','Confirm agent and dose','As prescribed','Single pre-infusion dose','At least one hour before cetuximab'),item('Corticosteroid premedication','Confirm agent and dose','As prescribed','Single pre-infusion dose','At least one hour before cetuximab')]
p['warnings'] += ['Infusion premedication remains required at weekly visits. Account for its corticosteroid when considering low-risk antiemetics; do not add a second steroid automatically.','No platinum hydration or four-day chemotherapy antiemetic course is carried forward to this visit.','For 00417 maintenance, a separate clinician-agreed 00207 monotherapy prescription is required. This selector does not initiate maintenance.']
p['evidence_update']='NCCP 00417/00418 v7: antihistamine and corticosteroid at least one hour before every cetuximab infusion; source does not specify the individual premedication dose.'
plans['hn47_cetuximab_weekly']=p

p=clone('low','00696 Days 1 and 15 · cetuximab and paclitaxel')
p['day1']=[item('Chlorphenamine','10 mg','IV','Once','60 minutes before cetuximab'),item('Dexamethasone','8 mg','IV','Once','60 minutes before cetuximab'),item('Famotidine','20 mg','IV','Once','30 minutes before paclitaxel; omission only under consultant guidance')]
p['warnings'] += ['NCCP 00696 v2 Table 6: the cetuximab steroid and antihistamine also cover paclitaxel on these combined-treatment days. Do not repeat either drug before paclitaxel.','NCCP Table 7 supplies the H2-antagonist component. Its omission requires consultant review; source uncertainty about reaction risk must remain visible.','Both medicines are low emetic risk. This plan does not include a moderate-risk delayed dexamethasone course.','The first two NCCP cetuximab infusions have specified observation; current Erbitux SmPC requires at least one hour after every infusion. Confirm the governed observation plan.']
p['evidence_update']='NCCP 00696 v2 pp5–6, Tables 6–7; NCIS v8 low-risk guidance. Low-risk prophylaxis accounts for the mandatory corticosteroid already given.'
plans['hn47_cetux_taxol_days1_15']=p

p=clone('low','00696 Day 8 · paclitaxel only')
p['day1']=[item('Chlorphenamine','10 mg','IV','Once','30 minutes before paclitaxel'),item('Famotidine','20 mg','IV','Once','30 minutes before paclitaxel; omission only under consultant guidance'),item('Ondansetron','8 mg','PO','Once if selected','Before the Day 8 treatment; low-risk NCIS reference')]
p['warnings'] += ['No routine Day 8 dexamethasone appears in NCCP 00696 Table 7. Add a steroid only for increased risk or previous reaction according to consultant guidance.','The antihistamine and H2-antagonist are infusion premedication, not a higher emetogenic-risk classification.','Any previous reaction or rechallenge requires its own reviewed plan; do not automatically use the Day 1/15 cetuximab steroid schedule.']
p['evidence_update']='NCCP 00696 v2 Table 7: Day 8 antihistamine/H2 antagonist, with steroid conditional; NCIS v8 low-risk reference.'
plans['hn47_taxol_day8']=p

p=clone('high_carboplatin','00552 adjuvant carboplatin / fluorouracil')
p['warnings'] += ['This is the adjuvant post-chemoradiotherapy nasopharyngeal regimen: up to three 28-day cycles, not ongoing metastatic treatment.','Carboplatin is on Day 1 and fluorouracil on Days 1–4. Review daily risk and delayed cover in the actual pump prescription.','No routine olanzapine is included in the dedicated NCIS carboplatin AUC≥4 row.']
plans['hn47_carbo_fu_adjuvant']=p

def phase(id,label,active,plan,notes):
    return dict(id=id,label=label,active_medicines=active,plan_id=plan,notes=notes)
selectors={}
for c in ['00314','00552','00417','00418','00696']:
    protocol=json.loads(next((ROOT/'protocols/head-neck').glob(c+'-*.json')).read_text())
    selectors[c]={'protocol_id':protocol['protocol_id'],'source_version':protocol['metadata']['nccp_version'],'source_url':protocol['metadata']['source_url'],'source_checked':DATE,'source_pages':{'00314':[1,3],'00552':[1,3,4,5],'00417':[1,2,3,6],'00418':[1,3,4,6],'00696':[1,2,5,6]}[c],'phases':[]}
selectors['00314']['phases']=[phase('treatment','Days 1–4 · four-day cisplatin / fluorouracil',['cisplatin','fluorouracil'],'hn47_cisplatin_four_day',['A complete multiday prescription must be written before use; the blank fields are intentional.','Cisplatin is 25 mg/m² each day on Days 1–4, not a single Day 1 dose.'])]
selectors['00552']['phases']=[phase('adjuvant','Adjuvant carboplatin / fluorouracil after chemoradiotherapy',['carboplatin','fluorouracil'],'hn47_carbo_fu_adjuvant',['Confirm recovery from the preceding chemoradiotherapy and the planned start at four weeks.','The course is up to three cycles; other regimens with similar drug names have different purposes and schedules.'])]
for c,platinum in [('00417','cisplatin'),('00418','carboplatin')]:
    selectors[c]['phases']=[phase('combination','Day 1 · cetuximab / '+platinum+' / fluorouracil',['cetuximab',platinum,'fluorouracil'],'hn47_'+c+'_day1',['Reconcile the total corticosteroid with cetuximab premedication; no duplicate steroid prescription.','The fluorouracil infusion continues over Days 1–4; prescribe its actual support and pump calendar.']),phase('cetuximab_only','Days 8 and 15 · cetuximab only within the same combination cycle',['cetuximab'],'hn47_cetuximab_weekly',['This is a weekly visit in the same cycle, not a new maintenance phase.','Do not repeat Day 1 platinum antiemetics or hydration.'])]
selectors['00417']['phases'].append(phase('maintenance','Cetuximab maintenance only if separately prescribed',['cetuximab'],'hn47_cetuximab_weekly',['NCCP 00417 permits consideration of 00207 maintenance after combination treatment. Confirm that separate prescription and dose history; selecting this option does not authorise starting it.','Do not direct this maintenance patient to the radiotherapy-only 00207/head_neck patient route.']))
selectors['00696']['phases']=[phase('combination','Days 1 and 15 · cetuximab / paclitaxel',['cetuximab','paclitaxel'],'hn47_cetux_taxol_days1_15',['Cetuximab chlorphenamine/dexamethasone premedication covers both drugs; do not duplicate it.','Famotidine is assessed separately using Table 7; confirm the actual prescription.']),phase('paclitaxel_only','Day 8 · paclitaxel only',['paclitaxel'],'hn47_taxol_day8',['No routine dexamethasone on Day 8; add only for the source-specified risk/reaction indications under consultant guidance.'])]

proposal={'release':'0.84.47','supportive_phase_selectors':selectors,'antiemetic_plans':plans,
 'emetogenic_risk_protocol_updates':{'00696':{'level':'low','script_id':'nccp-parenteral-low','mapping_basis':'Current NCCP 00696 v2 p5 explicitly classifies both paclitaxel and cetuximab as low; select visit-specific infusion premedication separately.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','source_checked_date':DATE,'source_url':selectors['00696']['source_url']}},
 'integration_notes':[
  'Merge only these exact keys; preserve all existing plans/selectors and generic rules.',
  'The existing engine binds selectors to exact protocol ID and NCCP version. Without a selected visit its current phase gate prevents an unqualified single-plan prescription.',
  'The existing selected-phase branch clears legacy local adjunct prescription items, avoiding automatic nystatin/chlorhexidine or unrelated local proformas.',
  '00696 base risk remains low; the clinician selector distinguishes premedication by visit without relabelling its emetogenic classification as moderate.',
  'The four-day cisplatin plan has intentionally unfilled drug doses. Its available status means the explanatory template exists, not that an executable prescription is complete.',
  'The current panel heading says Day 1 CINV prophylaxis even for later-day selected plans. A narrow neutral heading change to Selected-visit medicines would prevent misleading labelling while leaving data/behaviour unchanged.'
 ],'status':'Data proposals; root must integrate and validate dynamic manifest behaviour'}
(OUT/'workflow-proposals.json').write_text(json.dumps(proposal,ensure_ascii=False,indent=2)+'\n')
print('Prepared five exact-bound selectors, seven source-specific plans and the 00696 low-risk correction.')
