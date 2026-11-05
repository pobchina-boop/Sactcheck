"""Author only the two scoped profiles, KB addendum and staged phase support.

The retained before files make the change reproducible without duplicating additions.
Shared support and generated assets are integrated by the release owner.
"""
from pathlib import Path
import copy
import json

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
DATE = '2026-11-05'
RELEASE = '0.84.36'


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def paragraph(title, text, sources):
    return {'title': title, 'text': text, 'source_ids': sources}


profiles = {n: read(HERE / 'before' / f'{n}.json') for n in ('00216', '00692')}
kb = {n: read(HERE / 'before' / f'{n}-kb.json') for n in profiles}
support = read(HERE / 'before' / 'phase-support.json')['regimens']
for n, p in profiles.items():
    p.update(content_version=RELEASE, suite_release=RELEASE,
             patient_layout_release=RELEASE, source_checked=DATE)
    p['review_status'] = 'Source reconciled; independent clinical, pharmacy and patient/PPI review pending'
    for source in p['sources']:
        if source['id'] == 'hse':
            source['title'] = 'HSE: if you have side effects of cancer treatment'
            source['url'] = 'https://www.hse.ie/conditions/cancer/if-you-have-side-effects/'

# 00216 remains a shared breast / gastrointestinal service. No fixed-cycle count
# is imposed on the advanced-disease route or used to approve a treatment dose.
p = profiles['00216']
p['port_pump'] = False
p['sources'][2] = {
    'id': 'smpc', 'title': 'EMA: Xeloda product information and patient leaflet',
    'url': 'https://www.ema.europa.eu/en/documents/product-information/xeloda-epar-product-information_en.pdf'
}
p['sources'].append({
    'id': 'createx', 'title': 'CREATE-X: residual invasive breast cancer after neoadjuvant chemotherapy',
    'url': 'https://pubmed.ncbi.nlm.nih.gov/28564564/'
})
p['chapters'][0]['items'].append(paragraph(
    'Evidence depends on the cancer setting',
    'The X-ACT comparison concerns stage III colon cancer after surgery. A separate study, CREATE-X, tested adding capecitabine after surgery for HER2-negative breast cancer with residual invasive disease after chemotherapy, including a triple-negative subgroup. These studies address different situations and cannot give one benefit estimate for every person taking capecitabine.',
    ['trial', 'createx']))
p['chapters'][2]['items'].append(paragraph(
    'Extra checks when needed',
    'Scans and tumour-marker tests follow your cancer-specific plan; there is no single timetable for everyone taking these tablets. If you take warfarin or another vitamin K antagonist, confirm who will check your INR and how often. Dehydration can worsen kidney function, so new diarrhoea, vomiting or poor drinking may require earlier blood tests.',
    ['nccp', 'smpc']))
p['chapters'][3]['items'].append(paragraph(
    'After a treatment hold',
    'Do not replace doses missed because of side effects. A planned rest week does not by itself mean it is safe to restart. The team checks recovery, hydration, blood results and your previous dose before giving new tablet instructions.',
    ['nccp', 'smpc']))
p['chapters'][3]['items'].append(paragraph(
    'Diarrhoea during the night',
    'Stop capecitabine and contact your treatment team if diarrhoea wakes you during the night. Do not wait for the next clinic or decide the grade yourself. Follow your written bowel-treatment and fluid plan while obtaining advice.',
    ['smpc']))
p['consent_support'] += ' Distinguish the eight-cycle adjuvant colon/residual triple-negative breast plan from ongoing treatment for advanced disease. Explain that a cycle stamp records treatment, not permission to restart tablets.'
p['consent_support'] += ' NCCP identifies stage II colon, completely resected metastatic colorectal and residual triple-negative breast indications as unlicensed in Ireland; explain this and follow local off-label consent policy.'
p['chapters'][0]['items'].append(paragraph(
    'When treatment is outside the medicine licence',
    'NCCP identifies some uses of capecitabine as outside its licence in Ireland: stage II colon cancer, colorectal cancer that has spread but has then been completely removed, and residual triple-negative breast cancer after chemotherapy. If one applies to you, your team should explain this, the evidence and alternatives as part of consent.',
    ['nccp']))
p['monitoring_schedule']['rows'][3]['cells'][0] = 'Review heart history. The team may arrange an ECG or other tests if clinically indicated; NCCP does not mandate a routine ECG or serial echocardiogram schedule.'
p['patient_summary'].update({
    'template_version': RELEASE,
    'purpose': 'Tablet chemotherapy for breast or colorectal cancer; confirm your cancer setting and treatment aim.',
    'schedule': 'Twice daily on Days 1–14, then seven days off; each cycle is 21 days. Adjuvant colon or residual triple-negative breast treatment is eight cycles (about six months). Advanced-disease treatment continues while helping and tolerated.',
    'cycle_expectations': [
        'Stop tablets and call for significant diarrhoea, painful mouth or hand-foot symptoms, vomiting that prevents drinking, fever or sudden illness.',
        'Symptoms can continue in the rest week. Chest pain needs emergency assessment.'
    ],
    'preparation': ['Swallow tablets whole with water and food or within 30 minutes afterwards. Never double a missed dose or restart after a toxicity hold without instructions.'],
    'card_alert': 'Show this card when seeking care. A stamp records treatment; it does not approve the next dose.',
    'card_record_note': 'Confirm the intended total: eight cycles for the adjuvant colon/residual triple-negative breast plan; a rolling record for advanced disease.',
    'summary_checked': DATE
})
p['patient_summary']['monitoring'][2]['when'] = 'Scans, tumour markers and follow-up follow the cancer-specific plan; report persistent symptoms.'
p['evidence']['population'] = 'X-ACT: stage III colon cancer after surgery. Breast cancer and advanced colorectal cancer require their own evidence.'

# 00692: keep the original eight anatomical anchors and complete patient text.
# The printed NCCP table lists folinic acid on Day 1 only; do not silently add D2.
p = profiles['00692']
p['sources'].append({'id': 'dpd-renal', 'title': 'EMA: 5-fluorouracil DPD phenotyping and renal impairment (2024 safety communication)', 'url': 'https://www.ema.europa.eu/en/medicines/dhpc/5-fluorouracil'})
schedule = ('Cetuximab on Day 1 and Day 8. FOLFOX4 starts on Day 1: oxaliplatin, folinic acid and fluorouracil bolus, followed by a 22-hour fluorouracil infusion. Day 2 brings another fluorouracil bolus and a second 22-hour infusion; finish around Day 3. Your team confirms the full Day 2 prescription. Repeat every 14 days while beneficial and tolerable.')
p['schedule_summary'] = schedule
p['phases'][0]['detail'] = schedule
p['logistics']['intro'] = schedule
p['logistics']['steps'][1]['text'] += ' Allow at least one hour of monitoring after each cetuximab infusion; chemotherapy starts no earlier than one hour after cetuximab finishes. Your team confirms the final visit and observation plan.'
p['logistics']['steps'][2]['text'] = 'Return on Day 2 for another fluorouracil bolus and renewal of the second 22-hour infusion. The team confirms any other Day 2 medicines. Final disconnection is planned around Day 3. This FOLFOX4 plan is not a single 46-hour infusion.'
p['logistics']['source_ids'] = ['nccp', 'smpc']
p['administration_text'] = p['logistics']['steps'][1]['text'] + ' ' + p['logistics']['steps'][2]['text']
p['chapters'][0]['items'][1]['text'] = 'Discuss how treatment may control the cancer or relieve symptoms, and whether the multidisciplinary team has a separate local-treatment goal. Your preferences and priorities matter. This regimen is for metastatic disease; it is not a routine postoperative recurrence-prevention course.'
p['chapters'][1]['items'][0]['source_ids'] = ['nccp', 'dpd-renal']
p['urgent_extra'] = 'For sudden chest pain, collapse or serious breathing difficulty, call 112/999 or seek emergency care immediately. Contact oncology urgently for severe diarrhoea, inability to drink or sudden illness. Report eye pain, blurred vision, blistering or infected skin promptly. Call for line pain, swelling, leakage or unexpected pump progress.'
p['chapters'][2]['items'][0]['text'] = p['urgent_extra']
p['chapters'][1]['items'].append(paragraph(
    'The infusion visit',
    'An antihistamine and a steroid are given before every cetuximab infusion, including the Day 8 visit. Allow at least an hour of monitoring after each infusion and at least an hour before chemotherapy starts. The first cetuximab infusion takes longer than later ones; your total appointment also includes checks and preparation.',
    ['nccp', 'smpc']))
p['chapters'][4]['items'][0]['text'] += ' Your team confirms the complete Day 2 prescription before treatment.'
p['chapters'][5]['items'].append(paragraph(
    'Changes to one part of treatment',
    'Cetuximab and the chemotherapy may be held or changed separately. Ask exactly which medicines and appointments remain, including the Day 8 visit, pump care and blood checks. A cycle stamp records what was given; it does not authorise the next treatment.',
    ['nccp']))
p['agents'][0]['source_ids'] = ['nccp', 'smpc']
p['agents'][3]['explanation'] = 'Fluorouracil interferes with the production and use of DNA and RNA, the instructions cells need to grow. This FOLFOX4 schedule gives a bolus followed by a 22-hour infusion on Day 1 and repeats that fluorouracil sequence on Day 2.'
p['support'][5]['source_ids'] = ['nccp', 'smpc', 'ncis']
p['consent_support'] += ' Distinguish Day 1 combination treatment, Day 2 fluorouracil renewal and Day 8 antibody-only treatment. Explain that components may be delayed separately and allow post-cetuximab monitoring at every visit.'
p['monitoring_schedule']['rows'].insert(4, {
    'label': 'Heart history and new symptoms',
    'cells': ['Review heart history; ECG if cardiac function is compromised',
              'Report chest pain or new breathlessness immediately',
              'Review new symptoms before further treatment',
              'Further heart tests when clinically indicated',
              'Follow any heart problem; no routine serial echo timetable']
})
p['patient_summary'] = {
    'template_version': RELEASE,
    'purpose': 'To control selected RAS-wild-type bowel cancer that has spread and help with symptoms.',
    'schedule': 'A 14-day cycle with weekly cetuximab. Chemotherapy starts on Day 1 and continues on Day 2 through two separate 22-hour fluorouracil infusions. There is no fixed total number of cycles.',
    'phases': [
        {'title': 'Day 1 · combination', 'text': 'Cetuximab, then oxaliplatin/folinic acid, fluorouracil bolus and first 22-hour infusion.'},
        {'title': 'Day 2–3 · fluorouracil', 'text': 'Day 2 bolus and second 22-hour infusion; finish around Day 3. Team confirms other Day 2 medicines.'},
        {'title': 'Day 8 · cetuximab', 'text': 'Antibody-only visit, including premedicines and observation. Next cycle after review.'}
    ],
    'monitoring': [
        {'stage': 'Before', 'test': 'Bloods, RAS and DPD', 'when': 'Blood count, kidneys/liver, minerals, RAS selection and DPD before first fluorouracil; ECG if heart function is compromised.', 'basis': 'Regimen / suitability'},
        {'stage': 'During', 'test': 'Bloods, nerves and symptoms', 'when': 'Blood count, kidneys/liver each cycle; mineral and skin checks; formal nerve review every two cycles.', 'basis': 'Required by regimen'},
        {'stage': 'After', 'test': 'Minerals and recovery', 'when': 'Monthly electrolytes, magnesium and calcium for two months after the last cetuximab; follow persistent symptoms.', 'basis': 'Required by regimen'},
        {'stage': 'Review', 'test': 'Response and treatment aim', 'when': 'Scans and tumour markers follow the consultant plan; there is no universal fixed interval.', 'basis': 'Individual plan'}
    ],
    'cycle_expectations': [
        'Cold sensitivity, bowel or mouth symptoms, tiredness and skin changes vary. Avoid cold exposure and ice chips; report persistent numbness.',
        'Call 112/999 for chest pain, collapse or serious breathing difficulty. Contact oncology urgently for fever, severe diarrhoea or a line/pump problem.'
    ],
    'preparation': ['Confirm Day 2 renewal, Day 3 disconnection and Day 8 attendance. Allow observation after every cetuximab dose; tell the team about all new symptoms.'],
    'card_title': 'Weekly cetuximab + FOLFOX4',
    'card_schedule': '14-day cycle: D1 combination; D2 second 22-hour 5-FU infusion; D8 cetuximab.',
    'card_alert': 'Show this card when seeking care. A stamp records treatment; it does not approve the next dose.',
    'card_cycle_count': None,
    'card_record_note': 'Rolling record: number of cycles depends on benefit and side effects. Components may change separately.',
    'summary_checked': DATE
}

# Stage the two phase-specific supportive-care arrays. The owner merges these.
staged = {n: copy.deepcopy(support[n]) for n in profiles}
for phases in staged.values():
    for phase in phases:
        phase['source_checked'] = DATE
staged['00216'][0]['additional_support'].extend([
    'Swallow capecitabine whole with water and food or within 30 minutes afterwards. Do not crush or cut tablets; missed toxicity doses are not replaced.',
    'Interrupt immediately for moderate/severe toxicity and obtain oncology advice. Grade 2 or worse dehydration requires interruption until rehydrated and the cause is controlled; do not restart automatically after the planned break.',
    'Record previous dose reductions before prescribing the next cycle. A table percentage must not automatically re-escalate a toxicity-reduced dose. Partial-DPD starting-dose titration is a separate specialist pathway.',
    'Confirm blood count, renal and liver profile before every cycle; DPD testing precedes first treatment unless already tested. Plan INR checks if a vitamin K antagonist is used.'
])
staged['00692'][1]['label'] = 'Day 2 · FOLFOX4 fluorouracil; confirm complete prescription'
staged['00692'][1]['active_medicines'] = ['Fluorouracil']
staged['00692'][1]['additional_support'][0] = 'NCCP 00692 v2 p1 lists fluorouracil bolus and a separate 22-hour infusion on Day 2, but lists folinic acid on Day 1 only. Confirm the intended Day 2 folinic-acid prescription with the consultant and oncology pharmacy; do not infer or silently add a Day 2 dose from a generic FOLFOX4 schedule.'
observation = 'NCCP 00692 v2 p1 permits omitting observation after two tolerated cetuximab doses, whereas current EMA Erbitux SmPC sections 4.2/4.4 require monitoring during and for at least one hour after every infusion. Reconcile this conflict with oncology pharmacy/local policy; do not automatically waive monitoring. Chemotherapy must start no earlier than one hour after cetuximab ends.'
for index in (0, 2):
    staged['00692'][index]['additional_support'].append(observation)
staged['00692'][0]['additional_support'].extend([
    'FOLFOX4 uses two separate 22-hour fluorouracil infusions on Days 1 and 2, with a second treatment visit; never substitute a single 46-hour modified-FOLFOX6 pump schedule.',
    'Cetuximab and FOLFOX may be delayed independently. Reconcile actual treatment days, component-specific recovery and previous dose changes before updating support prescriptions.',
    'Intolerable cetuximab skin reactions require interruption even when graded below 3 under the EMA product information; review infection and supportive skin care promptly.'
])

# Carry the complete existing clinician profiles forward with exact source fixes.
for n, k in kb.items():
    p = profiles[n]
    k.update(full_suite_release=RELEASE, clinical_audit_release=RELEASE,
             source_checked_date=DATE, review_status=p['review_status'])
    k['clinical_summary'] = p['purpose']
    k['schedule_context'] = p['schedule_summary']
    k['component_rationale'] = ' '.join(a['name'] + ': ' + a['explanation'] for a in p['agents'])
    k['administration']['cycle_and_sequence'] = p['schedule_summary']
    k['administration']['route_and_duration'] = [p['administration_text']]
    if 'steps' in p['logistics']:
        k['administration']['practical_workflow'] = [s['text'] for s in p['logistics']['steps']]
    k['monitoring_and_toxicity']['longitudinal_schedule'] = copy.deepcopy(p['monitoring_schedule'])
    k['monitoring_and_toxicity']['urgent_review_signals'] = [p['urgent_extra']]
    k['evidence_at_a_glance']['checked'] = DATE
    k['supportive_care']['patient_education'] = [s['text'] for s in p['support']]
    k['supportive_care']['emetogenic_risk'] = '; '.join(phase['label'] + ': ' + phase['emetogenic_risk'] for phase in staged[n])
    k['supportive_care']['special_support'] = [s for phase in staged[n] for s in phase['additional_support']]
    k['reference_links'] = [{'label': s['title'], 'url': s['url']} for s in p['sources']] + [
        {'label': 'Full patient reference', 'url': f'patient/{n}/knowledge.html'},
        {'label': 'Three-page companion', 'url': f'patient/{n}/guide.pdf'},
        {'label': 'Complete printable handbook', 'url': f'patient/{n}/handbook.pdf'},
        {'label': 'Treatment card', 'url': f'patient/{n}/sactcard.pdf'},
        {'label': 'Consent aid', 'url': f'patient/{n}/consent-form.html'},
        {'label': 'Phase support', 'url': f'patient/{n}/supportive-care.html'},
        {'label': 'Treatment and monitoring map', 'url': f'patient/{n}/treatment-journey.html'},
        {'label': 'Patient passport', 'url': f'patient/{n}/passport.pdf'},
        {'label': 'Practical plan', 'url': f'patient/{n}/logistics.html'}
    ]

k = kb['00216']
k['key_points'].extend([
    'NCCP 00216 remains shared between breast and gastrointestinal indications; colorectal completion does not replace the existing breast service.',
    'Adjuvant colon and residual triple-negative breast schedules: eight 21-day cycles, approximately six months. Metastatic treatment continues until progression or unacceptable toxicity.',
    'Separate baseline count cautions, on-treatment interruption, recovery, recurrence and previous dose reduction; an isolated favourable laboratory result does not clear all treatment criteria.'
])
k['treatment_rationale']['setting'] = 'Shared breast and colorectal NCCP indications. Reference schedule: 1250 mg/m² twice daily on Days 1–14 every 21 days; starting and subsequent doses are prescribed individually. Adjuvant colon/residual TNBC: eight cycles; metastatic: until progression or unacceptable toxicity.'
k['evidence_at_a_glance']['harms'] = 'Capecitabine can cause diarrhoea/dehydration, hand-foot syndrome, mucositis, cytopenias, cardiotoxicity and severe fluoropyrimidine toxicity; oral administration does not remove the need for monitoring.'
k['evidence_audit']['remaining_uncertainties'].extend([
    'The X-ACT figures are for stage III colon cancer only; do not export them to stage II, resected metastatic disease, active metastatic colorectal disease or breast indications.',
    'NCCP renal Table 2 prints 51–80 and 30–50 mL/min bands, leaving fractional values between 50 and 51 and values above 80 unlisted. Reconcile these source gaps and the EMA starting-dose distinction rather than inventing a table cell.',
    'The diarrhoea table places nocturnal stools in overlapping descriptions; symptoms and the clinician assessment take priority over automatic grade assignment.'
])
k['treatment_rationale']['limitations'].append('For residual triple-negative breast cancer, CREATE-X provides a separate breast-specific comparison; it does not validate the colon X-ACT estimates for breast disease.')
k['treatment_rationale']['sources'].append({'label': 'CREATE-X primary report', 'url': 'https://pubmed.ncbi.nlm.nih.gov/28564564/'})
k['patient_selection']['important_cautions'].extend([
    'NCCP describes caution when starting with ANC below 1.5 × 10⁹/L or platelets below 100 × 10⁹/L, while the EMA product information says not to treat at those baseline values. Reconcile the distinction before initiation; the subsequent recovery threshold of platelets at least 75 × 10⁹/L is not baseline clearance.',
    'For haematological restart percentages, document both episode nadirs, current recovery, recurrence and the previous actual dose; current counts alone do not identify the correct row.',
    'Dose percentages refer to the documented original starting dose, not repeated multiplication of the current reduced dose. A toxicity reduction must not be re-escalated; cautious titration of an initial partial-DPD dose is a distinct specialist exception.',
    'At CrCl 30–50 mL/min, NCCP gives 75% of the original dose; EMA specifies that reduction for a 1250 mg/m² starting dose and no starting reduction for 1000 mg/m². Reconcile the documented starting regimen with oncology pharmacy before dosing.',
    'Grade 3 hand-foot syndrome requires a subsequent reduction but the NCCP HFS text does not quantify it. Do not invent a universal percentage.',
    'Stop for suspected serious skin reactions such as Stevens–Johnson syndrome/toxic epidermal necrolysis and obtain urgent specialist assessment; confirmed severe reactions require permanent discontinuation.'
])
k['monitoring_and_toxicity']['baseline'][2] = profiles['00216']['monitoring_schedule']['rows'][3]['cells'][0]
k['evidence_by_context'] = [{
    'context': 'Residual invasive breast cancer after neoadjuvant chemotherapy',
    'trial': 'CREATE-X',
    'population': '910 patients with HER2-negative residual invasive breast cancer after anthracycline and/or taxane chemotherapy; trial conducted in Japan and South Korea.',
    'comparison': 'Standard postsurgical treatment with versus without capecitabine.',
    'interpretation': 'Disease-free and overall survival improved in the trial; the triple-negative subgroup also favoured capecitabine.',
    'limitations': ['Separate population and comparator from X-ACT; no colorectal benefit estimate can be inferred.', 'The trial stopped early after its prespecified interim analysis. It does not supply a universal benefit estimate for every breast indication or patient.'],
    'sources': [{'label': 'CREATE-X primary report (Masuda et al., 2017)', 'url': 'https://pubmed.ncbi.nlm.nih.gov/28564564/'}],
    'checked': DATE
}]

k = kb['00692']
k['key_points'][0] = schedule
k['key_points'].extend([
    'NCCP 00692 v2 p1 prints folinic acid on Day 1 only. A Day 2 folinic-acid dose is a prescription clarification, not an automatically inferred component.',
    observation,
    'Cetuximab and FOLFOX holds can be independent; assess all component-specific toxicity and prior-dose requirements before issuing a new treatment plan.'
])
k['administration']['observation_and_access'][2] = observation
k['administration']['observation_and_access'][3] = 'Initial weekly cetuximab: 400 mg/m² over 120 minutes, maximum 5 mg/min. Subsequent weekly doses: 250 mg/m² over 60 minutes, maximum 10 mg/min. These are infusion times, not total appointment duration.'
k['monitoring_and_toxicity']['ongoing'][2] = 'NCCP 00692 v2 requires monthly electrolytes, magnesium and calcium for two months after the last cetuximab. Current EMA Erbitux specifies baseline and periodic mineral testing during therapy.'
k['patient_selection']['important_cautions'].append('Current EMA Erbitux requires interruption for intolerable skin reactions even below grade 3; recurrent toxicity and previous cetuximab dose reductions require specialist reconciliation.')
k['patient_selection']['important_cautions'].extend([
    'Cetuximab skin restart requires recovery to grade 2 or less within the two-week maximum. Recurrence reference doses are 250, 200 and 150 mg/m² for the first, second and third episodes; the fourth severe episode or failed recovery requires discontinuation. Record the actual previous maintenance dose and do not automatically reload or escalate.',
    'If ANC is below 1.5 × 10⁹/L or platelets below 75 × 10⁹/L, hold FOLFOX and check counts weekly; assess cetuximab separately. Subsequent chemotherapy decisions require recovery, duration of delay, the delayed-week nadir and actual component doses. At the four-week boundary with low counts, hold and clarify; persistent low counts beyond four weeks require discontinuation under the source.',
    'Folinic acid is held or omitted when the fluorouracil bolus is held or omitted. Grade 4 diarrhoea gives an oxaliplatin reference of 65 mg/m² but no quantified fluorouracil reduction or recovery interval; consultant review is required, and an existing lower oxaliplatin dose must not be increased to that reference.',
    'Neuropathy decisions use the actual dose level and function: grade 2 at the next cycle or first/second grade 3 episodes require a one-level reduction; persistent grade 3 or grade 4 requires stopping oxaliplatin. Rechallenge is only a specialist consideration after good recovery from grade 3, at one level below the dose at onset; it is not a grade 4 restart pathway.',
    'For CrCl below 30 mL/min or dialysis, NCCP says to consider 50% of the original oxaliplatin dose, with haemodialysis within 90 minutes after administration. This requires specialist planning, not an automatic recommendation.',
    'The fluorouracil liver table contraindicates treatment for bilirubin above 85 micromol/L or AST above 180 units/L; exact boundary values require clarification. Partial DPD deficiency requires an individual reduction, not a fixed universal percentage.'
])
k['supportive_care']['premedication_and_prophylaxis'] = [
    'Give an antihistamine and a corticosteroid before every cetuximab infusion, including Day 8. NCCP suggested regimen: chlorphenamine 10 mg IV and dexamethasone 8 mg IV 60 minutes before cetuximab.',
    'Day 1 oxaliplatin has moderate emetic risk; Day 2 fluorouracil and Day 8 cetuximab have low treatment-day risk. Reconcile the multi-day antiemetic prescription and avoid duplicate corticosteroid doses.',
    'No routine G-CSF schedule is mandated by NCCP 00692; assess individual risk and previous complications.',
    'Avoid cold exposure and ice chips because oxaliplatin can provoke acute neurotoxicity. Maintain skin care, electrolyte replacement when indicated, written bowel advice and line/pump support.'
]
k['evidence_audit']['remaining_uncertainties'].extend([
    'Day 2 folinic-acid timing is not specified in the NCCP printed table and requires prescriber/pharmacy clarification.',
    'NCCP post-cetuximab observation waiver conflicts with the current EMA requirement; retain explicit reconciliation and at least one-hour post-infusion planning.',
    'OPUS extended-RAS findings are from a small retrospective subgroup of a first-line phase II trial; response is not cure, and PFS/OS differences were not statistically established.'
])

for n, p in profiles.items():
    assert p['anatomy'] == read(HERE / 'before' / f'{n}.json')['anatomy']
    write(ROOT / 'data' / 'patient-knowledge' / f'{n}.json', p)
write(ROOT / 'data' / 'regimen-knowledge-base-v08436-addendum.json', {
    'schema_version': 1, 'release': RELEASE, 'source_checked_date': DATE,
    'governance': 'Source reconciled; independent clinical, pharmacy and patient/PPI review pending',
    'regimen_profiles': list(kb.values()), 'drug_profiles': [], 'evidence_records': []
})
write(HERE / 'phase-support-updates.json', {'release': RELEASE, 'source_checked': DATE, 'regimens': staged})
print('Authored two patient profiles, two complete KB profiles and staged support; original anatomy preserved exactly.')
