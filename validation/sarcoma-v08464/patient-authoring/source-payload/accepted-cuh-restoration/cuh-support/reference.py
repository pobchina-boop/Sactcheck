"""Complete supplied reference rows, separate from an individual prescription."""
import copy
import hashlib
import json
import re

LOPERAMIDE = 'Source clarification: the supplied CUH reference gives both four-times-daily as-needed and after-each-episode dosing. Oncology/pharmacy must confirm one schedule before use. Follow the individual prescription; 16 mg/day is a maximum, not a target.'


def display(value):
    for old, new in [('PO', 'by mouth'), ('OD', 'once daily'), ('TDS', 'three times daily'),
                     ('QDS', 'four times daily'), ('PRN', 'as required'), ('STAT', 'once initially')]:
        value = re.sub(r'\b' + old + r'\b', new, value)
    return value


def attach(phase, code, release, directory):
    templates = json.loads((directory / 'templates.json').read_text())
    mapping = json.loads((directory / 'mapping.json').read_text())
    selected = [x for x in mapping['mappings'] if (x['release'], x['code'], x['phase']) == (release, code, phase['id'])]
    assert len(selected) == 1, (release, code, phase['id'])
    selected = selected[0]
    template = templates['templates'][selected['template_id']]
    reference = dict(label=template['source']['label'], source_id=template['source_id'],
                     template_id=selected['template_id'], display_only_reference=True,
                     requires_individual_prescription=True, automatic_prescription=False,
                     note=' '.join([mapping['common_reference_note'], selected['phase_note'], template['local_adjunct_note']]),
                     source_scope=template['source']['scope'], source_policy_currently_verified=False,
                     items=copy.deepcopy(template['items']))
    reference['archived_template_warnings'] = copy.deepcopy(template['warnings'])
    safety_notes = []
    for warning in template['warnings']:
        if 'mifamurtide_steroid' in selected['special_review'] and 'Dexamethasone may be modified or omitted' in warning:
            safety_notes.append('The archived generic steroid-adjustment advice is not applicable to routine mifamurtide support; follow its source-specific corticosteroid exclusion shown beside the retained dexamethasone row.')
        else:
            safety_notes.append(display(warning).replace('SACT', 'systemic anticancer therapy').replace('EMA/Irish', 'European/Irish'))
    reference['note'] += ' Inherited reference safety notes: ' + ' '.join(safety_notes)
    for item in reference['items']:
        original = copy.deepcopy(item)
        notes = []
        name = item['medicine']
        if name == 'Loperamide' and item['frequency'] == 'QDS PRN' and 'after each further episode' in item['directions']:
            notes.append(LOPERAMIDE)
        reviews = selected['special_review']
        if name == 'Omeprazole' and 'high_dose_methotrexate_ppi' in reviews:
            notes.append('Do not carry this routine proton-pump-inhibitor row into high-dose methotrexate treatment. The reviewed product information warns that proton-pump inhibitors may prolong methotrexate/metabolite concentrations; oncology/pharmacy must specify a separate medicine and clearance plan. The historical row is retained for reference only.')
            item['excluded_from_default_prescription'] = True
        if name == 'Omeprazole' and 'upcoming_methotrexate_ppi_review' in reviews:
            notes.append('Coordinate any proton-pump inhibitor with the complete surgery-linked course and upcoming high-dose methotrexate. Pharmacy must review the interaction and actual start/stop plan; do not copy this historical course automatically.')
        if name == 'Dexamethasone' and 'mifamurtide_steroid' in reviews:
            notes.append('Not routine support for mifamurtide: the national source advises avoiding corticosteroids, including dexamethasone, and avoiding chronic/routine steroids. An emergency medical decision is separate. Retaining this historical row does not authorise its use with mifamurtide.')
            item['excluded_from_default_prescription'] = True
        if name == 'Aprepitant' and ('ifosfamide_aprepitant' in reviews or 'vinca_aprepitant' in reviews):
            agents = 'ifosfamide and/or vinca alkaloids' if 'ifosfamide_aprepitant' in reviews and 'vinca_aprepitant' in reviews else 'ifosfamide' if 'ifosfamide_aprepitant' in reviews else 'vinca alkaloids'
            notes.append('The national source flags an interaction between aprepitant and ' + agents + '. Pharmacy must reconcile the individual anti-sickness plan and neurotoxicity risk; this archived row must not be applied automatically.')
        if name == 'Loperamide' and 'irinotecan_diarrhoea' in reviews:
            notes.append('This generic CUH row must not replace the regimen-specific prescribed irinotecan delayed-diarrhoea plan. Retain its onset/timing, escalation and ileus precautions and urgent-contact instructions. On a vincristine-only visit, ongoing delayed-diarrhoea support remains relevant without starting a new irinotecan course.')
            item['excluded_from_default_prescription'] = True
        if notes:
            item['source_clarification'] = ' '.join(notes)
        item['display_fields'] = {k: display(item[k]) for k in ['dose', 'route', 'frequency', 'timing', 'directions']}
        item['reference_only'] = True
        assert all(item[k] == value for k, value in original.items()), 'Original CUH row changed'
    phase['local_reference'] = reference
    return dict(code=code, phase=phase['id'], template_id=selected['template_id'],
                complete_rows=len(reference['items']), original_row_fields_unchanged=True,
                template_rows_sha256=hashlib.sha256(json.dumps(template['items'], ensure_ascii=False, sort_keys=True).encode()).hexdigest(),
                active_risk_label_unchanged=phase['emetogenic_risk'], display_only=True)
