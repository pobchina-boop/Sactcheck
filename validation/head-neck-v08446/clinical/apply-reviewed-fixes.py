"""Source-reconciled clinical fixes for the v46 HNSCC context release."""
from pathlib import Path
import json
R = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
sources = {x['code']: x for x in json.loads((HERE/'sources/index.json').read_text())}

def condition(field, operator, value=None):
    c = {'field': field, 'operator': operator}
    if operator != 'missing': c['value'] = value
    return c

def missing_or_false(field):
    return {'any': [condition(field, 'missing'), condition(field, '==', False)]}

def add_input(p, field, label, typ='boolean', **kwargs):
    p['input_definitions'][field] = dict(label=label, type=typ, required=False,
        demo_value='', input_role='decision', ui_section='clinical', **kwargs)

def add_rule(p, code, name, when, message, page, action='consultant_review', component='nivolumab'):
    rule = {'id': 'HN46_' + name, 'priority': 100 if action == 'permanently_discontinue' else 90 if action == 'withhold' else 70,
        'when': when, 'action': {'type': action, 'components': [component],
        'message': message, 'recommendation': message, 'show_in_dose_actions': True,
        'block_numeric_dose': True}, 'explanation': message,
        'source': {'document': f'NCCP {code} v' + str(p['metadata']['nccp_version']),
        'url': sources[code]['url'], 'page': page, 'checked_date': '2026-11-09'}}
    p['rule_engine']['rules'] = [r for r in p['rule_engine']['rules'] if r.get('id') != rule['id']] + [rule]

for code in ['00483', '00484']:
    file = R/sources[code]['path']
    p = json.loads(file.read_text())
    add_input(p, 'nivo_prior_permanent_stop', 'Prior event required permanent nivolumab discontinuation')
    add_input(p, 'nivo_consultant_restart_approved', 'Consultant has explicitly approved restart after reviewing source recovery criteria and history')
    restart = condition('restart_assessment_requested', '==', True)
    add_rule(p, code, 'NIVO_PRIOR_PERMANENT_STOP', condition('nivo_prior_permanent_stop', '==', True),
        'A documented prior event requiring permanent nivolumab discontinuation prevents routine restart even after current symptoms or grades improve.', '7–8', 'permanently_discontinue')
    add_rule(p, code, 'NIVO_RESTART_HISTORY_UNASSESSED', {'all': [restart, condition('nivo_prior_permanent_stop', 'missing')]},
        'Before considering restart, establish whether a previous event required permanent discontinuation. Current recovery does not erase the previous toxicity decision.', '6–8', 'withhold')
    add_rule(p, code, 'NIVO_RESTART_APPROVAL', {'all': [restart, missing_or_false('nivo_consultant_restart_approved')]},
        'Continue to withhold until the consultant has reviewed the event-specific recovery criteria, prior toxicity history and immunosuppression and approved restart. An improved grade alone does not authorise treatment.', '6–8', 'withhold')
    add_rule(p, code, 'NIVO_RESTART_MEDICINES_UNASSESSED', {'all': [restart, {'any': [condition('systemic_steroids_mg_pred', 'missing'), condition('other_immunosuppressive_treatment', 'missing')]}]},
        'Confirm the current systemic steroid dose and whether another immunosuppressive treatment is being received before restart. A blank medicine history is not evidence that immunosuppression has stopped.', 6, 'withhold')
    hn = condition('indication_id', '==', code + ('-source-d' if code == '00483' else '-source-e'))
    fields = {
        'adult_patient': 'Confirm adulthood for this HNSCC indication.',
        'hnscc_histology_sites_confirmed': 'Confirm histologically proven squamous carcinoma of the oral cavity, pharynx or larynx.',
        'hnscc_no_curative_local_option': 'Confirm recurrent/metastatic disease is not amenable to local treatment with curative intent.',
        'hnscc_progressed_after_platinum': 'Confirm progression or recurrence after platinum-based treatment in the source-listed setting.'}
    for field, text in fields.items():
        if field != 'adult_patient': add_input(p, field, text)
        add_rule(p, code, field.upper(), {'all': [hn, missing_or_false(field)]}, text + ' Missing or negative confirmation does not establish source eligibility.', 4)
    add_input(p, 'hnscc_months_platinum_to_progression', 'Months from last platinum dose to tumour progression or recurrence', 'number', min=0, step=0.01, unit='months')
    add_rule(p, code, 'HNSCC_INTERVAL_MISSING', {'all': [hn, condition('hnscc_months_platinum_to_progression', 'missing')]},
        'Record the interval from the last platinum dose to recurrence/progression; NCCP eligibility specifies within six months. This is not time from the last platinum dose to today.', 4)
    add_rule(p, code, 'HNSCC_INTERVAL_LATE', {'all': [hn, condition('hnscc_months_platinum_to_progression', '>', 6)]},
        'A progression/recurrence interval longer than six months is outside the explicit NCCP HNSCC eligibility criterion. Reconcile the treatment indication with the consultant.', 4)
    add_rule(p, code, 'HNSCC_INTERVAL_BOUNDARY', {'all': [hn, condition('hnscc_months_platinum_to_progression', '==', 6)]},
        'The source says within six months without defining an exact-date boundary. Confirm the actual dates and consultant interpretation; do not infer eligibility from a rounded six-month entry.', 4)
    if code == '00484':
        p['monitoring']['each_cycle'] = ['FBC, renal/liver profile, glucose and thyroid function tests before each cycle; symptom and medicine review']
        p['monitoring']['ongoing'] = ['Thyroid function tests additionally as clinically indicated; cortisol clinically indicated', 'NSCLC assess progression before cycle 4', 'Monitor immune effects at least 5 months after last dose']
    p['metadata']['clinical_audit_release'] = '0.84.46'
    p['metadata']['source_checked_date'] = '2026-11-09'
    file.write_text(json.dumps(p, ensure_ascii=False, indent=2) + '\n')

code = '00261'
file = R/sources[code]['path']
p = json.loads(file.read_text())
add_input(p, 'indication_id', 'Selected source indication', 'select',
    options=[{'value': i['indication_id'], 'label': i['description']} for i in p['indications']])
p['input_definitions']['indication_id']['input_role'] = 'context'
p['input_definitions']['indication_id']['ui_section'] = 'treatment_context'
hn = {'any': [condition('indication_id', '==', '00261-head-neck'), condition('disease_context', '==', 'head_neck')]}
for r in p['rule_engine']['rules']:
    if r.get('id') in ['CARBO00261_HN_AUC','CARBO00261_HN_RT','CARBO00261_HN_COURSE']:
        r['when']['all'][0] = hn
add_input(p, 'head_neck_cisplatin_unsuitable', 'Cisplatin is inappropriate for the selected head-and-neck chemoradiation indication')
add_rule(p, code, 'CARBO_HN_CISPLATIN_SUITABILITY', {'all': [hn, missing_or_false('head_neck_cisplatin_unsuitable')]},
    'Confirm why cisplatin is inappropriate: this NCCP head-and-neck indication is specifically a carboplatin alternative when cisplatin is not appropriate.', 1, component='carboplatin')
for field, label in [('target_auc','the actual prescribed AUC (source AUC 5)'), ('cycle_number','the cycle number (source three cycles)'), ('head_neck_radiotherapy_confirmed','the concurrent radiotherapy plan')]:
    add_rule(p, code, 'CARBO_HN_' + field.upper() + '_MISSING', {'all': [hn, condition(field, 'missing')]},
        'Confirm ' + label + ' before head-and-neck treatment. Missing information does not establish the source schedule.', '1–2', component='carboplatin')
add_rule(p, code, 'CARBO_HN_CONTEXT_CONFLICT', {'all': [condition('indication_id','==','00261-head-neck'), condition('disease_context','exists'), condition('disease_context','!=','head_neck')]},
    'The selected head-and-neck indication conflicts with the separately entered disease context. Reconcile them before assessing dose, radiotherapy and course length.', 1, component='carboplatin')
p['metadata']['clinical_audit_release'] = '0.84.46'
p['metadata']['source_checked_date'] = '2026-11-09'
file.write_text(json.dumps(p, ensure_ascii=False, indent=2) + '\n')
