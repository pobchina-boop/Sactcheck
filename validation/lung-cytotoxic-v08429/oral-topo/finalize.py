"""Shared final editorial/provenance pass for this bounded authoring package."""
import re


def finalize_proposal(p, code):
    m = p['metadata']
    m['review_date'] = '2026-11-02'  # Encoding audit, not the NCCP review deadline.
    dates = {'00311': ('2025-04-16', '2030-04-16'),
             '00587': ('2021-01-06', '2026-01-06'),
             '00319': ('2025-09-12', '2030-09-12')}
    if code in dates:
        m['date_last_reviewed'], m['source_review_date'] = dates[code]
    if code == '00587':
        m['source_review_status'] = 'Current NCCP catalogue-linked PDF checked 2026-11-02; printed next review date has passed.'
    if code == '00311':
        p['indications'] = [
            {'indication_id': '00311a', 'description': 'Metastatic ovarian carcinoma after failure of first-line or subsequent therapy.', 'tumour_groups': ['Gynaecology']},
            {'indication_id': '00311b', 'description': 'Relapsed small-cell lung cancer when first-line retreatment is not appropriate.', 'tumour_groups': ['Lung']},
            {'indication_id': '00311c', 'description': 'Metastatic fallopian tube carcinoma after prior therapy; unlicensed indication.', 'tumour_groups': ['Gynaecology']},
            {'indication_id': '00311d', 'description': 'Metastatic peritoneal carcinoma after prior therapy; unlicensed indication.', 'tumour_groups': ['Gynaecology']},
        ]
    p['clinical_governance']['disclaimer'] = (
        f"Decision-support encoding derived from NCCP {code} Version {m['nccp_version']}. "
        'It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement.')
    p['clinical_governance']['organ_function_rule_status'] = (
        'Source reconciled in SACTCheck v0.84.29; independent Consultant and oncology-pharmacy validation pending.')
    if code in ('00311', '00587'):
        oral = code == '00587'
        dose = 2.3 if oral else 1.5
        route = 'PO' if oral else 'IV infusion'
        summary = ('Topotecan capsules once daily' if oral else 'Topotecan infusion over 30 minutes') + (
            ' on Days 1–5, every 21 days, for up to 6 cycles or earlier progression/unacceptable toxicity.')
        note = ('Swallow whole; take with or without food. Refrigerate 2–8°C; do not freeze. No automatic replacement/double dose.' if oral else
                'Infuse over 30 minutes. A consultant may reduce the number of dosing days to 3 or 4 for toxicity/heavy pretreatment; confirm the actual prescription.')
        p['treatment'].update(schedule_summary=summary, maximum_cycles=6)
        p['treatment_phases'] = [{
            'phase_id': 'five_day_course', 'label': 'Five-day topotecan course', 'active_drugs': ['topotecan'],
            'cycle_length_days': 21, 'cycles': [1, 2, 3, 4, 5, 6],
            'duration_text': 'Up to 6 cycles; stop earlier for progression or unacceptable toxicity.',
            'schedule_summary': summary,
            'administration': [{'days': [1, 2, 3, 4, 5], 'order': 1, 'drug': 'topotecan',
                                'dose': {'value': dose, 'unit': 'mg/m²', 'frequency': 'once_daily'},
                                'route': route, 'note': note}],
        }]
        levels = (2.3, 1.9, 1.5) if oral else (1.5, 1.25, 1.0)
        p['dose_levels'] = [{'dose_level': -i, 'dose_mg_m2': value} for i, value in enumerate(levels)]
        if oral:
            p['input_definitions']['current_topotecan_dose_mg_m2'] = {
                'label': 'Documented current oral topotecan daily dose', 'type': 'number',
                'unit': 'mg/m²/day', 'min': 0, 'step': 0.01, 'required': False,
                'demo_value': '', 'input_role': 'decision',
                'assessment_guidance': 'Enter the documented protocol dose per day, not capsule count or the patient-specific milligram dose. Needed before applying the renal target quoted from a full 2.3 mg/m² starting dose.'}
            p['rule_engine']['rules'] = [r for r in p['rule_engine']['rules'] if r['rule_id'] != 'TOPO_ORAL_RENAL_DOSE_CONTEXT']
            p['rule_engine']['rules'].append({
                'rule_id': 'TOPO_ORAL_RENAL_DOSE_CONTEXT',
                'when': {'all': [
                    {'any': [
                        {'all': [{'field': 'topotecan_crcl_ml_min', 'operator': '>=', 'value': 30},
                                 {'field': 'topotecan_crcl_ml_min', 'operator': '<=', 'value': 49}]},
                        {'field': 'topotecan_oral_renal_band', 'operator': '==', 'value': '30_49'}]},
                    {'any': [{'field': 'current_topotecan_dose_mg_m2', 'operator': 'missing'},
                             {'field': 'current_topotecan_dose_mg_m2', 'operator': '!=', 'value': 2.3}]}]},
                'action': {'type': 'consultant_review', 'components': ['topotecan'],
                           'recommendation': 'The oral renal target of 1.9 mg/m²/day is quoted for a reduction from full 2.3 mg/m²/day. Confirm the documented current dose and earlier reductions; do not automatically increase an already reduced course.',
                           'message': 'Current dose is required before selecting the renal target; no automatic escalation of a reduced course.'},
                'source': {'document': 'NCCP 00587 v2', 'url': m['source_url'], 'page': 2, 'checked_date': '2026-11-02'},
                'explanation': 'NCCP renal-table footnote limits the quoted 1.9 mg/m² target to a reduction from full dose; prior dose reductions require individual review.'})
    elif code == '00388':
        m.update(dose_schedule_context_input='oral_schedule', dose_schedule_relationship='alternatives',
                 treatment_phase_selector_label='Alternative oral etoposide schedule')
        summary = ('Select ONE alternative oral etoposide schedule: 50 mg twice daily Days 1–7; '
                   '100 mg/m² twice daily Days 1–3; or 50 mg/m² once daily Days 1–21. '
                   'All source cycles are 21 days, until progression or unacceptable toxicity. These are not sequential phases.')
        p['treatment']['schedule_summary'] = summary
        p['treatment_phases'] = []
        for slug, end, value, unit, frequency in [
            ('schedule_7d', 7, 50, 'mg', 'twice_daily'),
            ('schedule_3d', 3, 100, 'mg/m²', 'twice_daily'),
            ('schedule_21d', 21, 50, 'mg/m²', 'once_daily')]:
            note = 'Alternative schedule, not an additional treatment phase. Take capsules on an empty stomach.'
            if end == 21:
                note += ' NCCP specifies Days 1–21 every 21 days without a rest week; the product describes a rest/recovery period. Prescriber/pharmacy must confirm stop/restart dates; do not insert or omit a break automatically.'
            p['treatment_phases'].append({
                'phase_id': slug, 'label': f'Alternative: Days 1–{end}, ' + frequency.replace('_', ' '),
                'active_drugs': ['etoposide'], 'cycle_length_days': 21, 'cycles': [],
                'duration_text': 'Until progression or unacceptable toxicity; no source-fixed total cycle count.',
                'schedule_summary': note,
                'administration': [{'days': list(range(1, end + 1)), 'order': 1, 'drug': 'etoposide',
                                    'dose': {'value': value, 'unit': unit, 'frequency': frequency},
                                    'route': 'PO', 'note': note}],
            })
    for rule in p['rule_engine']['rules']:
        action = rule['action']
        if action['type'] == 'consultant_review':
            action.update(dose_calculation='specialist_review', show_in_dose_actions=True, block_numeric_dose=True)
        if rule['rule_id'] in ('TOPO_IV_RENAL_20_39', 'OF590_00311_TOPO_IV_20_39'):
            action['dose_percent_of_original'] = 50
        elif rule['rule_id'] == 'TOPO_ORAL_RENAL_30_49':
            action['dose_mg_m2'] = 1.9  # Source rounded target, not 2.3 × 0.83.
        elif rule['rule_id'] in ('ETOP_RENAL_15_TO50', 'ETOP_HEPATIC_50'):
            action.update(dose_percent_of_original=75 if rule['rule_id'] == 'ETOP_RENAL_15_TO50' else 50,
                          dose_basis='documented_starting_dose')


def readable(v):
    if isinstance(v, dict):
        return {k: readable(t) for k, t in v.items()}
    if isinstance(v, list):
        return [readable(t) for t in v]
    if not isinstance(v, str) or v.startswith('http'):
        return v
    v = v.replace('CarboplatinDay', 'Carboplatin Day').replace('dailyDays', 'daily Days')
    for pattern, replacement in [
        (r'\b(Days?|every|to|then|least|ECOG|NCCP|Grade)(?=\d)', r'\1 '),
        (r'(?<=\d)(days|cycles|weeks|mg|mL|g/dL)', r' \1'),
    ]:
        v = re.sub(pattern, replacement, v)
    return v


def finalize_authored(out):
    for code, x in out.items():
        for z in [x, *x.get('patient_contexts', {}).values()]:
            d = z['patient']
            d['monitoring_schedule']['source_ids'] = ['nccp']
            for note in d.get('chronology_notes', []):
                note.setdefault('source_ids', ['nccp'])
            s = d['patient_summary']
            s['cycle_expectations'] = s['cycle_expectations'][-2:]
            s['monitoring'] = [r for r in s['monitoring'] if r['test'] != 'Hearing assessment']
            s['card_title'] = {'00311': 'Topotecan infusion', '00587': 'Topotecan capsules',
                               '00388': 'Oral etoposide', '00319': 'Carboplatin + oral etoposide'}[code]
            if code in ('00311', '00587'):
                s['phases'] = [
                    {'title': 'Treatment', 'text': ('Infusions on Days 1–5; repeat every 21 days.' if code == '00311'
                                                  else 'Capsules once daily on Days 1–5; repeat every 21 days.')},
                    {'title': 'Review', 'text': 'Up to 6 cycles; earlier changes if treatment stops helping or toxicity develops.'}]
            elif code == '00388':
                if '1–21' in d.get('context_label', ''):
                    s['card_schedule'] = 'Once daily Days 1–21; confirm the next start with your team.'
                    s['card_alert'] = 'Call oncology if unwell. Do not restart without team approval.'
                s['phases'] = [
                    {'title': 'My capsule schedule', 'text': s['card_schedule'] + '. Follow the exact prescription.'},
                    {'title': 'Review', 'text': 'Your team confirms each course and next start date; no fixed total cycle count.'}]
    return readable(out)
