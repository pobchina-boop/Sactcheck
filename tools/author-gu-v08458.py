#!/usr/bin/env python3
"""Reproducible, scoped source reconciliation for the v0.84.58 GU review batch.

Source PDFs and hashes live in validation/gu-v08458/clinical. This is an
encoding aid, not independent clinical approval. It never publishes the site.
"""
import copy
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATE = '2026-11-17'
RELEASE = '0.84.58'
SCOPE = ROOT / 'validation/gu-v08458'

def read(path):
    return json.loads((ROOT / path).read_text())

def save(path, obj):
    path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')

def c(field, op, value=None):
    return dict(field=field, operator=op, **({} if value is None else {'value': value}))

def allof(*conditions):
    return {'all': list(conditions)}

def anyof(*conditions):
    return {'any': list(conditions)}

def between(field, lo, hi, inclusive=True):
    return allof(c(field, '>=' if inclusive else '>', lo), c(field, '<=' if inclusive else '<', hi))

def number(label, unit='', demo=0):
    return dict(label=label, type='number', required=False, min=0, step=0.01,
                unit=unit, demo_value=demo, input_role='decision')

def boolean(label):
    return dict(label=label, type='boolean', required=False, demo_value=False, input_role='decision')

def select(label, options, demo=None):
    return dict(label=label, type='select', required=False, input_role='decision',
                options=[{'value': v, 'label': t} for v, t in options],
                demo_value=demo if demo is not None else options[0][0])

def grade(label):
    return select(label + ' (clinician-assessed grade)', [(str(i), str(i)) for i in range(5)])

SOURCE = {x['code']: x for x in read('validation/gu-v08458/clinical/new-and-repeat-sources.json')}
INDEX = read('protocols/index.json')
MIGRATIONS = read('validation/gu-v08458/clinical/id-migrations.json') if (SCOPE / 'clinical/id-migrations.json').exists() else []

class Protocol:
    def __init__(self, code, version, keep=False):
        self.code, self.version = code, version
        self.entry = next(x for x in INDEX['protocols'] if '/' + code + '-' in x['path'])
        self.path = self.entry['path']
        self.p = read(self.path)
        self.old_id = self.p['protocol_id']
        self.url = SOURCE[code]['catalogue_url']
        self.inputs = self.p['input_definitions'] if keep else {}
        self.rules = self.p['rule_engine']['rules'] if keep else []
        if not keep:
            self.inputs.update({
                'assessment_phase': select('Assessment stage', [('baseline', 'Before first treatment'), ('day1', 'New cycle / Day 1'), ('intracycle', 'Within a cycle'), ('toxicity_review', 'Toxicity / recovery review')]),
                'ecog': select('ECOG performance status', [(str(i), str(i)) for i in range(5)]),
                'anc': number('Neutrophil count', '×10⁹/L', 3),
                'platelets': number('Platelet count', '×10⁹/L', 200),
                'crcl_ml_min': {**number('Creatinine clearance', 'mL/min', 80), 'renal_input': {'mode': 'exact_continuous', 'exact_value_required': True, 'reason': 'Source-specific continuous boundaries; do not round or substitute an eGFR automatically.'}},
                'bilirubin_umol_l': number('Bilirubin', 'µmol/L', 12),
                'nonhaem_except_nv_grade': grade('Non-haematological toxicity excluding nausea/vomiting'),
                'neuropathy_grade': grade('Peripheral neuropathy'),
                'hypersensitivity': boolean('Known hypersensitivity to a regimen medicine / excipient'),
                'pregnancy': boolean('Pregnancy'), 'breastfeeding': boolean('Breastfeeding'),
                'febrile_neutropenia': boolean('Febrile neutropenia during the preceding cycle'),
                'acute_severe_reaction': boolean('Current severe infusion/allergic reaction'),
            })
        self.drugs = [x for x in self.p['treatment']['drugs'] if x != 'radiotherapy']

    def rule(self, id, condition, action, text, components=None, page=3, section='Dose modifications', dose=None):
        a = dict(type=action, components=components or self.drugs, message=text,
                 show_in_dose_actions=True, block_numeric_dose=True, dose_calculation='specialist_review')
        if dose:
            a.update(block_numeric_dose=False, dose_calculation='source_confirmed', dose=dose)
        self.rules.append(dict(rule_id=id, when=condition, action=a, explanation=text,
                               source=dict(document=f'NCCP {self.code} v{self.version}', url=self.url,
                                           page=page, section=section, checked_date=DATE)))

    def common(self, ecog=2, eligibility_page=1):
        self.rule('ECOG_REVIEW', c('ecog', '>', ecog), 'consultant_review', 'Performance status is outside the listed NCCP eligibility range; review treatment suitability.', page=eligibility_page, section='Eligibility')
        for f in ['hypersensitivity', 'pregnancy', 'breastfeeding']:
            self.rule(f.upper() + '_EXCLUSION', c(f, '==', True), 'contraindicated', f'{self.inputs[f]["label"]}: source exclusion requires specialist review before treatment.', page=eligibility_page, section='Exclusions')
        self.rule('ACUTE_REACTION', c('acute_severe_reaction', '==', True), 'withhold', 'Stop the infusion and obtain urgent clinical assessment. Identify the responsible medicine and agree any future treatment; this flag does not automatically permanently discontinue every component.', page=eligibility_page, section='Hypersensitivity / urgent safety assessment')

    def finish(self, title, setting, schedule, duration, notes):
        p, m = self.p, self.p['metadata']
        p['input_definitions'] = self.inputs
        p['required_inputs'] = []
        p['rule_engine']['rules'] = self.rules
        p['protocol_id'] = 'nccp-' + self.code + '-v' + self.version
        m.update(nccp_version=self.version, title=title, short_title=title, indication=setting,
                 source_url=self.url, source_checked_date=DATE,
                 source_document_pages=SOURCE[self.code]['pages'], sactcheck_encoding_version=RELEASE,
                 clinical_audit_release=RELEASE)
        m['encoding_maturity'] = dict(level='source_reconciled_pending_independent_review',
            label='Source reconciliation draft; independent clinical approval pending',
            source_reconciled=True, consultant_reviewed=False, oncology_pharmacy_reviewed=False,
            clinical_use_authorised=False, audit_release=RELEASE, source_checked_date=DATE,
            scope_note=' '.join(notes))
        m['source_boundary_notes'] = notes
        p['treatment'].update(schedule_summary=schedule, **duration)
        p['eligibility'] = [setting, 'Verify the current source eligibility and exclusions, treatment intent, prior treatment, blood counts and organ function.']
        # Retain the existing indication schema, updating the indication text rather
        # than creating a generic indication with invented reimbursement criteria.
        if isinstance(p.get('indications'), list):
            for row in p['indications']:
                if isinstance(row, dict):
                    for key in ['description', 'label', 'name', 'indication']:
                        if key in row:
                            row[key] = setting
        save(self.path, p)
        self.entry['id'] = p['protocol_id']
        if self.old_id != p['protocol_id']:
            row = {'code': self.code, 'from': self.old_id, 'to': p['protocol_id'], 'path': self.path}
            if row not in MIGRATIONS: MIGRATIONS.append(row)


def gemcis(code):
    versions = {'00282': '6', '00622': '3', '00628': '3'}
    x = Protocol(code, versions[code])
    x.common(ecog=1 if code == '00628' else 2, eligibility_page=1)
    x.inputs.update({
        'hearing_problem': boolean('Significant hearing impairment or tinnitus'),
        'magnesium_low_or_unreplaced': boolean('Low or unreplaced magnesium / electrolyte disturbance'),
        'pneumonitis_grade': grade('Pneumonitis'),
        'severe_cutaneous_reaction': boolean('Severe cutaneous reaction (SJS, TEN, DRESS or AGEP)'),
        'prior_platelet_nadir': number('Lowest platelets in the preceding cycle', '×10⁹/L', 150),
        'days_anc_below_05': number('Days with ANC below 0.5', 'days'),
        'days_anc_below_01': number('Days with ANC below 0.1', 'days'),
        'toxicity_delay_days': number('Cycle delay due to toxicity', 'days'),
        'fn_required_antibiotics': boolean('Febrile neutropenia required antibiotics'),
        'restarting_omitted_gemcitabine': boolean('Considering restart after omitted intracycle gemcitabine'),
    })
    baseline = c('assessment_phase', '==', 'baseline')
    day1 = c('assessment_phase', '==', 'day1')
    intra = c('assessment_phase', '==', 'intracycle')
    x.rule('STAGE_REQUIRED', c('assessment_phase', 'missing'), 'consultant_review', 'Choose baseline, new-cycle Day 1 or intracycle assessment: their count thresholds are different. No stage is inferred.', page=2, section='Eligibility and treatment-day counts')
    for field, threshold in [('anc', 1.5), ('platelets', 100)]:
        x.rule('BASELINE_' + field.upper(), allof(baseline, c(field, '<=', threshold)), 'withhold', f'Baseline eligibility requires {field} >{threshold} ×10⁹/L; do not substitute the lower on-treatment threshold.', page=1, section='Eligibility')
    for field, threshold in [('anc', 1), ('platelets', 100)]:
        x.rule('DAY1_' + field.upper(), allof(day1, c(field, '<=', threshold)), 'withhold', f'Day 1 requires ANC >1 and platelets >100 ×10⁹/L before a new cycle.', page=2 if code == '00622' else 3)
    x.rule('BASELINE_RENAL_EXCLUSION', allof(baseline, c('crcl_ml_min', '<', 60)), 'consultant_review', 'The exclusion section lists CrCl <60 mL/min. Reconcile eligibility with the on-treatment renal table before choosing a cisplatin dose; no automatic baseline clearance.', ['cisplatin'], 2, 'Exclusions and renal table')
    x.rule('BASELINE_NEURO_EXCLUSION', allof(baseline, c('neuropathy_grade', '>=', 2)), 'consultant_review', 'Pre-existing neuropathy grade ≥2 is a cisplatin exclusion; review the treatment choice.', ['cisplatin'], 2, 'Exclusions')
    x.rule('HEARING_REVIEW', c('hearing_problem', '==', True), 'consultant_review', 'Significant hearing impairment or tinnitus requires cisplatin suitability review and hearing assessment.', ['cisplatin'], 2, 'Exclusions / monitoring')
    x.rule('ELECTROLYTE_REVIEW', c('magnesium_low_or_unreplaced', '==', True), 'consultant_review', 'Review and replace electrolytes and confirm the prescribed hydration plan before cisplatin.', ['cisplatin'], 4, 'Supportive care')
    x.rule('INTRACYCLE_OMIT', allof(intra, anyof(c('anc', '<', .5 if code != '00622' else 1), c('platelets', '<', 50))), 'omit', 'Omit intracycle gemcitabine. ' + ('Reduce one dose level in subsequent cycles.' if code == '00628' else 'Reassess recovery before any further dose.'), ['gemcitabine'], 2 if code == '00622' else 3, 'Table 1')
    if code == '00282':
        x.rule('INTRACYCLE_75_REVIEW', allof(intra, anyof(between('anc', .5, 1), between('platelets', 50, 100))), 'consultant_review', 'The intracycle table specifies 75% gemcitabine for ANC 0.5–1 or platelets 50–100. First exclude the omission row using both counts; confirm the current prescription before calculation.', ['gemcitabine'], 3, 'Table 1')
        x.rule('RESTART_COUNTS', allof(c('restarting_omitted_gemcitabine', '==', True), anyof(c('anc', '<=', .5), c('platelets', '<=', 50))), 'withhold', 'After an omitted intracycle dose, do not restart until ANC >0.5 AND platelets >50 ×10⁹/L.', ['gemcitabine'], 3, 'Table 1')
        history = anyof(c('days_anc_below_05', '>', 5), c('days_anc_below_01', '>', 3), c('febrile_neutropenia', '==', True), c('prior_platelet_nadir', '<', 25), c('toxicity_delay_days', '>', 7))
    elif code == '00622':
        x.rule('INTRACYCLE_75_REVIEW', allof(intra, c('anc', '>=', 1), between('platelets', 50, 75)), 'consultant_review', 'Day 8 gemcitabine is 75% when ANC ≥1 and platelets 50–75. This table is labelled for gemcitabine; separately review day-8 cisplatin, renal function and toxicity.', ['gemcitabine'], 2, 'Table 1')
        history = anyof(c('fn_required_antibiotics', '==', True), c('prior_platelet_nadir', '<', 25))
        x.rule('RENAL_INDICATION_CONFLICT', baseline, 'consultant_review', 'Source inconsistency: the indication describes impaired renal function, while the exclusion section lists CrCl <60. Consultant and pharmacy must reconcile the indication, current CrCl and dose before treatment.', ['cisplatin'], 1, 'Indication versus exclusions on page 2')
    else:
        x.inputs['adjuvant_upper_tract_criteria_confirmed'] = boolean('Upper-tract urothelial adjuvant setting and source surgical/pathology criteria confirmed')
        x.rule('ADJUVANT_CONTEXT', allof(baseline, anyof(c('adjuvant_upper_tract_criteria_confirmed', 'missing'), c('adjuvant_upper_tract_criteria_confirmed', '==', False))), 'consultant_review', 'NCCP 00628 is four adjuvant cycles after upper-tract surgery, not a generic advanced-bladder GemCis entry. Confirm muscle-invasive and/or node-positive M0 predominantly transitional-cell disease, fitness within 90 days of surgery and ECOG 0–1.', page=1, section='Indication and eligibility')
        x.rule('INTRACYCLE_BOUNDARY', allof(intra, anyof(c('anc', '==', 1), c('platelets', '==', 75))), 'consultant_review', 'The printed full-dose and 75% rows overlap at ANC exactly 1 and platelets exactly 75. Obtain source-boundary clarification rather than assigning an automatic percentage.', ['gemcitabine'], 3, 'Table 1')
        x.rule('INTRACYCLE_75_REVIEW', allof(intra, anyof(allof(c('anc', '>=', .5), c('anc', '<', 1)), allof(c('platelets', '>=', 50), c('platelets', '<', 75)))), 'consultant_review', 'The intracycle table specifies 75% gemcitabine in this intermediate count range. Exclude the omission row using both counts; confirm the prescription and dose level.', ['gemcitabine'], 3, 'Table 1')
        history = None
    if history:
        x.rule('HISTORY_75_ORIGINAL', history, 'consultant_review', 'For subsequent cycles the source specifies 75% of the original cycle-initiation dose following this prior-cycle event. Confirm recovery, original dose and affected components; do not repeatedly multiply a previously reduced dose.', ['gemcitabine'], 3 if code == '00282' else 2, 'Table 1')
    x.rule('CISPLATIN_RENAL_45_59', between('crcl_ml_min', 45, 59), 'consultant_review', 'Cisplatin renal table: CrCl 45–59 mL/min, 75% dose. Reconcile baseline exclusion and other domains before prescribing.', ['cisplatin'], 3, 'Table 2')
    x.rule('CISPLATIN_RENAL_59_60_GAP', between('crcl_ml_min', 59, 60, False), 'consultant_review', 'The source prints 45–59 and ≥60 mL/min. It does not allocate a decimal value between 59 and 60; do not round into an automatic full dose.', ['cisplatin'], 3, 'Table 2')
    x.rule('CISPLATIN_RENAL_LT45', c('crcl_ml_min', '<', 45), 'consultant_review', 'CrCl <45 mL/min: consider carboplatin as a clinical decision. This is a regimen change, not an automatically calculated cisplatin or carboplatin dose.', ['cisplatin'], 3, 'Table 2')
    x.rule('GEM_RENAL_LT30', c('crcl_ml_min', '<', 30), 'consultant_review', 'Gemcitabine: CrCl <30 mL/min, consider dose reduction as a clinical decision.', ['gemcitabine'], 3, 'Table 2')
    x.rule('GEM_RENAL_EQ30', c('crcl_ml_min', '==', 30), 'consultant_review', 'The gemcitabine table gives >30 and <30 mL/min, leaving exactly 30 unallocated; obtain review.', ['gemcitabine'], 3, 'Table 2')
    x.rule('GEM_BILIRUBIN', c('bilirubin_umol_l', '>' if code == '00628' else '>=', 27), 'consultant_review', 'Gemcitabine hepatic table: use an initial 800 mg/m² when bilirubin ' + ('>27' if code == '00628' else '≥27') + ' µmol/L; reconcile current dose and other toxicities before prescribing. ' + ('Dose escalation requires tolerability review.' if code != '00628' else 'The threshold is strictly >27 in this source.'), ['gemcitabine'], 3, 'Table 2')
    adverse_page = 4 if code == '00282' else 3
    if code == '00628':
        x.rule('NONHAEM_G3', c('nonhaem_except_nv_grade', '==', 3), 'consultant_review', 'Grade 3 non-haematological toxicity excluding nausea/vomiting: reduce cisplatin one level OR withhold; reduce gemcitabine one level. Confirm current level (gemcitabine 1000→750→500; cisplatin initial dose→85%→75%).', page=3, section='Table 3')
        x.rule('NONHAEM_G4_CIS', c('nonhaem_except_nv_grade', '>=', 4), 'withhold', 'Grade 4: withhold cisplatin.', ['cisplatin'], 3, 'Table 3')
        x.rule('NONHAEM_G4_GEM', c('nonhaem_except_nv_grade', '>=', 4), 'consultant_review', 'Grade 4: withhold gemcitabine OR reduce one dose level; consultant decision, not automatic administration.', ['gemcitabine'], 3, 'Table 3')
    else:
        x.rule('NONHAEM_HOLD', c('nonhaem_except_nv_grade', '>=', 3), 'withhold', 'Grade ≥3 non-haematological toxicity excluding nausea/vomiting: withhold until grade ≤1; any reduced restart is at consultant discretion.', page=adverse_page, section='Table 3')
    x.rule('NEUROPATHY', c('neuropathy_grade', '>=', 3 if code == '00628' else 2), 'consultant_review', {'00282': 'Grade ≥2 neuropathy: substitute carboplatin AUC 5 OR reduce cisplatin by 50% after recovery to grade ≤1. Gemcitabine remains 100% for this toxicity alone; no automatic substitution or restart.', '00622': 'Grade ≥2 neuropathy: omit cisplatin or consider replacing it with carboplatin; gemcitabine remains 100% for this toxicity alone.', '00628': 'Grade ≥3 neurotoxicity: discontinue cisplatin or consider carboplatin; gemcitabine remains 100% for this toxicity alone.'}[code], ['cisplatin'], adverse_page, 'Table 3')
    x.rule('GEM_PNEUMONITIS_STOP', c('pneumonitis_grade', '>=', 2), 'discontinue', 'Grade ≥2 pneumonitis: discontinue gemcitabine and urgently assess respiratory symptoms.', ['gemcitabine'], adverse_page, 'Table 3')
    x.rule('GEM_SCAR_STOP', c('severe_cutaneous_reaction', '==', True), 'discontinue', 'Severe cutaneous adverse reaction including SJS, TEN, DRESS or AGEP: discontinue gemcitabine and obtain urgent specialist care.', ['gemcitabine'], adverse_page, 'Table 3')
    days = 28 if code == '00282' else 21
    title = {'00282': 'Gemcitabine and cisplatin 70 mg/m² — 28-day', '00622': 'Gemcitabine and split-dose cisplatin 35 mg/m² — 21-day', '00628': 'Adjuvant gemcitabine and cisplatin 70 mg/m² — upper-tract urothelial cancer'}[code]
    setting = 'Adjuvant treatment of muscle-invasive and/or node-positive, non-metastatic predominantly transitional-cell upper-tract urothelial carcinoma after surgery.' if code == '00628' else 'Advanced or metastatic urothelial carcinoma' + (' in patients with impaired renal function; reconcile conflicting source renal eligibility before treatment.' if code == '00622' else '.')
    schedule = {'00282': 'Gemcitabine 1000 mg/m² IV on days 1, 8 and 15; cisplatin 70 mg/m² IV after gemcitabine on day 1 (source body also permits day 2); every 28 days for 4–6 cycles.', '00622': 'Gemcitabine 1000 mg/m² and cisplatin 35 mg/m² IV on both days 1 and 8; every 21 days for 4–6 cycles.', '00628': 'Gemcitabine 1000 mg/m² IV on days 1 and 8 and cisplatin 70 mg/m² IV on day 1; every 21 days for four adjuvant cycles.'}[code]
    duration = dict(cycle_length_days=days, duration_type='fixed_cycles', duration_text='Four adjuvant cycles' if code == '00628' else 'Four to six cycles according to response and tolerability')
    if code == '00628': duration['planned_cycles'] = 4
    x.finish(title, setting, schedule, duration, ['Baseline and day-1 eligibility use strict count inequalities; intracycle criteria are separately selected.', 'No dose percentage is computed without adequate dose history and review of all relevant domains.', 'Printed gaps, overlaps and source disagreements remain visible review findings.'])


def gemrt():
    x = Protocol('00759', '1'); x.common()
    x.inputs.update({'pneumonitis_grade': grade('Pneumonitis'), 'prior_platelet_nadir': number('Lowest platelets in prior treatment', '×10⁹/L', 150), 'days_anc_below_05': number('Days ANC below 0.5', 'days'), 'days_anc_below_01': number('Days ANC below 0.1', 'days'), 'toxicity_delay_days': number('Delay due to toxicity', 'days'), 'restarting_omitted_gemcitabine': boolean('Restart after an omitted dose')})
    start = c('assessment_phase', 'in', ['baseline', 'day1']); intra=c('assessment_phase', '==', 'intracycle')
    x.rule('STAGE_REQUIRED', c('assessment_phase', 'missing'), 'consultant_review', 'Select course initiation or intracycle treatment: count thresholds differ.', page=2)
    x.rule('START_COUNTS', allof(start, anyof(c('anc', '<', 1.5), c('platelets', '<', 100))), 'withhold', 'Course initiation requires ANC ≥1.5 and platelets ≥100 ×10⁹/L.', page=2)
    x.rule('INTRACYCLE_OMIT', allof(intra, anyof(c('anc', '<', .5), c('platelets', '<', 50))), 'omit', 'Omit this gemcitabine dose; do not restart until ANC ≥0.5 and platelets ≥50 ×10⁹/L.', page=2, section='Table 1')
    x.rule('INTRACYCLE_BOUNDARY', allof(intra, anyof(c('anc', '==', 1), c('platelets', '==', 100))), 'consultant_review', 'The printed full-dose and 75% rows overlap at ANC 1 and platelets 100. Clarify the boundary instead of assigning an automatic percentage.', page=2, section='Table 1')
    x.rule('INTRACYCLE_75', allof(intra, anyof(allof(c('anc', '>=', .5), c('anc', '<', 1)), allof(c('platelets', '>=', 50), c('platelets', '<', 100)))), 'consultant_review', 'Intermediate intracycle counts: source specifies 75% gemcitabine. First exclude omission using both counts and confirm the prescription.', page=2, section='Table 1')
    x.rule('RESTART_COUNTS', allof(c('restarting_omitted_gemcitabine', '==', True), anyof(c('anc', '<', .5), c('platelets', '<', 50))), 'withhold', 'Recovery after omission requires ANC ≥0.5 and platelets ≥50.', page=2, section='Table 1')
    x.rule('HISTORY_75', anyof(c('days_anc_below_05', '>=', 5), c('days_anc_below_01', '>=', 3), c('febrile_neutropenia', '==', True), c('prior_platelet_nadir', '<', 25), c('toxicity_delay_days', '>', 7)), 'consultant_review', 'The table describes 75% of the original initiation dose for subsequent cycles after this event. The scheduled radiotherapy course is one four-dose cycle; this row does not authorise extra cycles.', page=2, section='Table 1')
    x.rule('RENAL_LT30_REVIEW', c('crcl_ml_min', '<', 30), 'consultant_review', 'For this 100 mg/m² radiosensitising regimen, the source says no renal adjustment is expected below 30 mL/min. This is not the higher-dose GemCis renal table; confirm clinical suitability.', page=3, section='Table 2')
    x.rule('BILIRUBIN_GE27', c('bilirubin_umol_l', '>=', 27), 'consultant_review', 'Bilirubin ≥27 µmol/L: consider 80% of the 100 mg/m² starting dose OR full dose with active monitoring. Consultant decision; do not import an 800 mg/m² dose from a 1000 mg/m² regimen.', page=3, section='Table 2')
    x.rule('PNEUMONITIS_STOP', c('pneumonitis_grade', '>=', 2), 'discontinue', 'Grade ≥2 pneumonitis: discontinue gemcitabine and assess urgently.', page=3, section='Table 3')
    x.rule('NONHAEM_HOLD', c('nonhaem_except_nv_grade', '>=', 3), 'withhold', 'Grade ≥3 non-haematological toxicity excluding nausea/vomiting: withhold until grade ≤1, then consider a 50% reduction or stopping. The separate printed “Grade >4” discontinuation row is unresolved; do not reinterpret it silently.', page=3, section='Table 3')
    x.finish('Gemcitabine 100 mg/m² with bladder radiotherapy', 'Bladder cancer treated with concurrent gemcitabine and radiotherapy.', 'Gemcitabine 100 mg/m² IV on days 1, 8, 15 and 22, 2–4 hours before radiotherapy; one four-dose course.', dict(cycle_length_days=28, duration_type='fixed_cycles', planned_cycles=1, duration_text='One 28-day reference course with four weekly doses'), ['Source table has overlapping intracycle count boundaries and a printed Grade >4 row.', 'Latest listed source is v1; review date has passed. Current listing is recorded, not an assertion of renewed source approval.'])


def mitofurt():
    x=Protocol('00450','5',keep=True)
    x.rules = [r for r in x.rules if r.get('rule_id') not in ['DPD_NOT_RECORDED', 'FLUOROURACIL_CHEST_PAIN']]
    # Preserve the independently traceable v4c renal/hepatic and DPD encodings,
    # whose thresholds remain in v5, then reconcile the generic FN rule.
    for r in x.rules:
        r['source'].update(document='NCCP 00450 v5', url=x.url, checked_date=DATE)
        rid=r.get('id',r.get('rule_id'))
        if rid=='FN':
            r['action'].update(type='delay_then_dose_reduce', components=['fluorouracil'], message='Febrile neutropenia: delay treatment until recovery and consider reducing subsequent fluorouracil by 25%; manage the acute infection urgently.', block_numeric_dose=True, dose_calculation='specialist_review')
            r['explanation']=r['action']['message'];r['source'].update(page=2,section='Table 1')
        elif rid=='NONHAEM_G3':
            r['action'].update(message='Severe non-haematological toxicity requires clinical assessment. Use the event-specific diarrhoea/mucositis rules; this generic alert does not define an additional dose percentage.', block_numeric_dose=True, dose_calculation='specialist_review')
            r['explanation']=r['action']['message']
    x.rule('DPD_NOT_RECORDED', c('dpd_status','missing'), 'consultant_review', 'Confirm a DPD genotype/phenotype result before first fluorouracil unless previously tested. Do not treat an absent result as normal. Renal impairment can confound uracil phenotyping.', ['fluorouracil'], 2, 'Baseline tests and DPD assessment')
    x.inputs['acute_chest_pain']=boolean('New chest pain during fluorouracil treatment')
    x.rule('FLUOROURACIL_CHEST_PAIN', c('acute_chest_pain','==',True), 'withhold', 'Stop fluorouracil and obtain urgent assessment for cardiac ischaemia; no unsupervised restart.', ['fluorouracil'], 4, 'Cardiotoxicity')
    x.finish('Mitomycin and five-day fluorouracil with bladder radiotherapy', 'Concurrent chemoradiation for bladder cancer.', 'Mitomycin 12 mg/m² IV on day 1 only; fluorouracil 500 mg/m²/day as a continuous 120-hour infusion on days 1–5 and 22–26 (2500 mg/m² per pump), with radiotherapy fractions 1–5 and 16–20.', dict(cycle_length_days=28,duration_type='fixed_cycles',planned_cycles=1,duration_text='One chemoradiation course; the 28-day display is a reference calendar, not a prescribed repeat interval.'), ['The previous 42-day cycle label was not specified in the source and is replaced by an explicitly labelled reference chronology.', 'DPD, absolute bilirubin/AST thresholds and exact renal/hepatic gaps are retained and rechecked against v5.', 'Radiotherapy dates and fractionation remain the radiation oncology prescription.'])


def mvac_cmv(code):
    cmv=code=='00337'; dd=code=='00333'
    x=Protocol(code,'5a' if dd else '5'); x.common(ecog=1 if cmv or dd else 2,eligibility_page=1 if dd else 2)
    x.inputs.update({
        'haemodialysis':boolean('Receiving haemodialysis'),
        'child_pugh_class':select('Child-Pugh class',[('none','No diagnosed hepatic impairment'),('A','A'),('B','B'),('C','C')]),
        'significant_heart_disease':boolean('Heart failure or other significant heart disease'),
        'lvef_percent':number('Measured left ventricular ejection fraction','%',60),
        'doxorubicin_lifetime_mg_m2':number('Cumulative lifetime doxorubicin including the proposed dose','mg/m²',0),
        'preexisting_renal_impairment':boolean('Pre-existing renal impairment'),
        'hearing_problem':boolean('Significant hearing impairment or tinnitus'),
        'days_anc_below_05':number('Duration of prior ANC <0.5 ×10⁹/L','days'),
        'prior_anc_nadir':number('Lowest prior-cycle neutrophil count','×10⁹/L',3),
        'prior_platelet_nadir':number('Lowest prior-cycle platelet count','×10⁹/L',200),
        'thrombocytopenic_bleeding':boolean('Thrombocytopenic bleeding in the preceding cycle'),
        'third_space_fluid':boolean('Ascites, pleural effusion or other third-space fluid'),
        'methotrexate_interaction':boolean('Potential methotrexate clearance/toxicity interaction identified'),
        'vinca_cyp3a_interaction':boolean('Potential vinblastine CYP3A interaction, including aprepitant, requires reconciliation'),
        'severe_constipation_or_ileus':boolean('Severe constipation or suspected bowel obstruction/ileus'),
        'treatment_intent':select('Treatment intent',[('unknown','Not confirmed'),('neoadjuvant','Before definitive local treatment'),('adjuvant','After surgery'),('advanced','Locally advanced / metastatic')]),
    })
    baseline=c('assessment_phase','==','baseline'); newcycle=c('assessment_phase','in',['baseline','day1'])
    page=2 if cmv or dd else 3
    x.rule('ANC_LOW',c('anc','<',1.5),'withhold','Do not administer with ANC <1.5 ×10⁹/L. New-cycle recovery requires ANC ≥1.5 and platelets ≥100.',page=page,section='Table 1')
    x.rule('PLATELETS_LOW',c('platelets','<',100),'withhold','Do not administer with platelets <100 ×10⁹/L. New-cycle recovery requires ANC ≥1.5 and platelets ≥100.',page=page,section='Table 1')
    event=anyof(c('febrile_neutropenia','==',True),c('prior_anc_nadir','<',.5),c('prior_platelet_nadir','<',50)) if cmv else anyof(c('febrile_neutropenia','==',True),between('days_anc_below_05',5,7),c('thrombocytopenic_bleeding','==',True),c('prior_platelet_nadir','<',25))
    x.rule('HAEM_HISTORY_75',event,'withhold_then_reduce','Hold until ANC ≥1.5 and platelets ≥100, then use 75% of the previous dose after consultant review. Confirm the actual previous prescription; this is not 75% of an assumed original full dose.',page=page,section='Table 1')
    if not cmv:x.rule('NEUTROPENIA_DURATION_OUTSIDE_ROW',c('days_anc_below_05','>',7),'consultant_review','The history row specifies ANC <0.5 for 5–7 days. A longer episode requires individual review; it is not evidence for an unmodified next dose.',page=page,section='Table 1')
    x.rule('BASELINE_RENAL',allof(baseline,c('preexisting_renal_impairment','==',True)),'consultant_review','Pre-existing renal impairment is an exclusion in this source. Reconcile suitability with component-specific renal modifications; do not infer baseline clearance from a reduced-dose table.',page=2,section='Exclusions')
    x.rule('BASELINE_NEURO',allof(baseline,c('neuropathy_grade','>=',2)),'consultant_review','Pre-existing neuropathy grade ≥2 is a source exclusion; review the proposed regimen.',page=2,section='Exclusions')
    x.rule('HEARING_REVIEW',c('hearing_problem','==',True),'consultant_review','Significant hearing impairment or tinnitus requires review of cisplatin suitability.', ['cisplatin'],2,'Exclusions')
    x.rule('MTX_RENAL_20_50',allof(c('crcl_ml_min','>=',20),c('crcl_ml_min','<',50)),'consultant_review','Methotrexate renal table: 50% of original dose for CrCl 20–50. Exactly 50 overlaps with the no-adjustment row and has a separate review finding.', ['methotrexate'],3,'Table 2')
    x.rule('MTX_RENAL_EQ50',c('crcl_ml_min','==',50),'consultant_review','At CrCl exactly 50, methotrexate rows ≥50 and 20–50 overlap. Resolve with consultant/pharmacy before selecting a dose.', ['methotrexate'],3,'Table 2')
    x.rule('MTX_RENAL_LT20',c('crcl_ml_min','<',20),'withhold','Methotrexate is not recommended at CrCl <20. An unavoidable-use/dialysis exception needs specialist planning and must not be automatically calculated.', ['methotrexate'],3,'Table 2')
    x.rule('MTX_DIALYSIS',c('haemodialysis','==',True),'consultant_review','Methotrexate during haemodialysis is not recommended. If unavoidable, the source describes 50% of original dose and daily high-flux dialysis; renal/oncology pharmacy planning is mandatory.', ['methotrexate'],3,'Table 2')
    x.rule('MTX_BILIRUBIN_GT86',c('bilirubin_umol_l','>',86),'contraindicated','Avoid methotrexate when bilirubin >86 µmol/L.', ['methotrexate'],3,'Table 2')
    x.rule('VBL_BILIRUBIN_GT51',c('bilirubin_umol_l','>',51),'consultant_review','Vinblastine: bilirubin >51 µmol/L, use 50% of the original dose after reconciling current dose and all toxicities.', ['vinblastine'],3,'Table 2')
    for lo,hi,percent in [(50,59,75),(40,49,50)]:
        x.rule('CIS_RENAL_'+str(lo)+'_'+str(hi),between('crcl_ml_min',lo,hi),'consultant_review',f'Cisplatin: CrCl {lo}–{hi} mL/min, {percent}% of the original dose. Confirm eligibility and the prescription.', ['cisplatin'],3,'Table 2')
    x.rule('CIS_RENAL_GAPS',anyof(between('crcl_ml_min',49,50,False),between('crcl_ml_min',59,60,False)),'consultant_review','Printed integer renal bands do not explicitly allocate decimal gaps. Do not round into an automatic cisplatin dose.', ['cisplatin'],3,'Table 2')
    x.rule('CIS_RENAL_LT40',c('crcl_ml_min','<',40),'withhold','Cisplatin is not recommended below CrCl 40 mL/min. Review alternatives; dialysis has a separate specialist exception.', ['cisplatin'],3,'Table 2')
    x.rule('CIS_DIALYSIS',c('haemodialysis','==',True),'consultant_review','On haemodialysis, the source says 50% of the original cisplatin dose may be considered. This requires an explicit specialist plan, including dialysis timing.', ['cisplatin'],3,'Table 2')
    x.rule('NEURO_G2_NEXT_CYCLE',allof(c('assessment_phase','==','day1'),c('neuropathy_grade','==',2)),'consultant_review','Grade 2 neurotoxicity at the start of the next cycle: reduce cisplatin and vinblastine by 25%. Confirm actual current doses and other domains.', ['cisplatin','vinblastine'],3 if cmv else 4,'Table 3')
    x.rule('NEURO_G2_REVIEW',allof(c('neuropathy_grade','==',2),anyof(c('assessment_phase','missing'),c('assessment_phase','in',['intracycle','toxicity_review']))),'consultant_review','The source dose-reduction row is for grade 2 neurotoxicity at the next cycle. Review this event and treatment stage before any dose.', ['cisplatin','vinblastine'],3 if cmv else 4,'Table 3')
    x.rule('NEURO_G3_STOP',c('neuropathy_grade','==',3),'discontinue','Grade 3 neurotoxicity: discontinue cisplatin and vinblastine. Do not automatically discontinue the other components for this toxicity alone.', ['cisplatin','vinblastine'],3 if cmv else 4,'Table 3')
    x.rule('NEURO_G4_HOLD',c('neuropathy_grade','==',4),'withhold','Severe grade 4 neurological toxicity needs urgent assessment and no further cisplatin/vinblastine pending specialist review. The printed table specifies grade 3 discontinuation but does not explicitly allocate grade 4.', ['cisplatin','vinblastine'],3 if cmv else 4,'Table 3 / unresolved severity boundary')
    x.rule('THIRD_SPACE_MTX',c('third_space_fluid','==',True),'consultant_review','Methotrexate may accumulate in third-space fluid and clear slowly. Review effusions/ascites and the treatment plan before dosing.', ['methotrexate'],4 if cmv else 5,'Adverse effects / precautions')
    x.rule('MTX_INTERACTION',c('methotrexate_interaction','==',True),'consultant_review','Reconcile medicines that can alter methotrexate clearance or toxicity before prescribing; do not independently stop long-term medicines without an agreed plan.', ['methotrexate'],4 if cmv else 5,'Interactions')
    x.rule('VBL_INTERACTION',c('vinca_cyp3a_interaction','==',True),'consultant_review','Check CYP3A interactions with vinblastine, including aprepitant from the cisplatin antiemetic plan. Pharmacy must reconcile the support prescription.', ['vinblastine'],4 if cmv else 5,'Interactions')
    x.rule('ILEUS_REVIEW',c('severe_constipation_or_ileus','==',True),'withhold','Withhold vinblastine pending urgent assessment of severe constipation or suspected ileus/obstruction.', ['vinblastine'],4 if cmv else 5,'Adverse effects')
    if not cmv:
        x.rule('CARDIAC_EXCLUSION',c('significant_heart_disease','==',True),'consultant_review','Heart failure or significant heart disease is a source exclusion; review anthracycline suitability.', ['doxorubicin'],2,'Exclusions')
        x.rule('LVEF_BELOW50',c('lvef_percent','<',50),'contraindicated','LVEF <50% is the stated heart-failure exclusion for this doxorubicin-containing regimen.', ['doxorubicin'],2,'Exclusions')
        x.rule('LVEF_EQ50',c('lvef_percent','==',50),'consultant_review','Exactly 50% does not meet the baseline test instruction LVEF >50% for doxorubicin, although the exclusion uses <50%. Obtain cardiac/oncology review.', ['doxorubicin'],2,'Tests / exclusions boundary')
        x.rule('DOXO_LIFETIME_REVIEW',c('doxorubicin_lifetime_mg_m2','>=',450),'consultant_review','The source lifetime doxorubicin limit is 450 mg/m², modified by individual cardiac risk and prior exposure. Confirm cumulative exposure including the proposed dose before treatment.', ['doxorubicin'],1,'Treatment footnote')
        for lo,hi,percent in [(20,50,50),(51,86,25)]:
            x.rule('DOXO_BILI_'+str(lo)+'_'+str(hi),between('bilirubin_umol_l',lo,hi),'consultant_review',f'Doxorubicin: bilirubin {lo}–{hi} µmol/L, {percent}% of original dose. Confirm the prescription and other hepatic/cardiac factors.', ['doxorubicin'],3,'Table 2')
        x.rule('DOXO_BILI_GAP',between('bilirubin_umol_l',50,51,False),'consultant_review','The doxorubicin table prints 20–50 and 51–86 µmol/L; a decimal value between 50 and 51 needs clarification, not rounding.', ['doxorubicin'],3,'Table 2')
        x.rule('DOXO_HEPATIC_STOP',anyof(c('bilirubin_umol_l','>',86),c('child_pugh_class','==','C')),'contraindicated','Doxorubicin is not recommended with bilirubin >86 µmol/L or Child-Pugh C.', ['doxorubicin'],3,'Table 2')
        x.rule('DOXO_RENAL_EQ10',c('crcl_ml_min','==',10),'consultant_review','The source distinguishes >10 and <10 mL/min for doxorubicin, leaving exactly 10 unallocated. Review; the <10 row says no adjustment is expected.', ['doxorubicin'],3,'Table 2')
        x.rule('DOXO_DIALYSIS',c('haemodialysis','==',True),'consultant_review','Doxorubicin on haemodialysis: 75% of the original dose may be considered. Confirm an individual specialist plan.', ['doxorubicin'],3,'Table 2')
    if dd:
        x.inputs['gcsf_plan_confirmed']=boolean('G-CSF support on days 3–7 is prescribed and confirmed')
        x.rule('GCSF_REQUIRED',anyof(c('gcsf_plan_confirmed','missing'),c('gcsf_plan_confirmed','==',False)),'consultant_review','Dose-dense MVAC requires the source G-CSF support on days 3–7. Confirm product, dose, administration and access before starting the cycle.',page=4,section='Supportive care')
        x.rule('DDMVAC_SETTING',allof(baseline,c('treatment_intent','in',['neoadjuvant','adjuvant','unknown'])),'consultant_review','NCCP 00333 lists locally advanced/metastatic disease. Do not automatically transfer a perioperative MVAC indication or fixed cycle count into this source pathway.',page=1,section='Indication')
    if cmv:
        x.inputs['folinic_rescue_confirmed']=boolean('Folinic acid rescue prescribed after each methotrexate dose')
        x.rule('FOLINIC_RESCUE',anyof(c('folinic_rescue_confirmed','missing'),c('folinic_rescue_confirmed','==',False)),'consultant_review','Confirm folinic acid 15 mg orally or IV every six hours for four doses, beginning 24 hours after each methotrexate dose (days 2 and 9). Rescue must not be omitted or replaced with folic acid.', ['methotrexate'],1,'Treatment table')
        x.rule('CMV_SCHEDULE_CONFLICT',baseline,'consultant_review','CMV source body and treatment table specify every 21 days for up to three neoadjuvant cycles; the footer says 14 days. Follow an explicitly confirmed consultant prescription and record the discrepancy.',page=1,section='Treatment table / footer conflict')
    if code=='00338':
        x.rule('MVAC_INTENT_REQUIRED',anyof(c('treatment_intent','missing'),c('treatment_intent','==','unknown')),'consultant_review','Select the intent before planning duration: neoadjuvant three cycles, adjuvant four, advanced/metastatic up to six. These are different source indications.',page=1,section='Treatment duration')
    title={'00333':'Dose-dense MVAC — 14-day','00337':'CMV before definitive treatment — 21-day','00338':'MVAC — 28-day'}[code]
    setting={'00333':'Locally advanced or metastatic transitional-cell carcinoma of the urothelium.','00337':'Neoadjuvant treatment of muscle-invasive transitional-cell carcinoma of the urothelium.','00338':'Neoadjuvant or adjuvant muscle-invasive transitional-cell carcinoma, or locally advanced/metastatic urothelial transitional-cell carcinoma; select the specific treatment intent.'}[code]
    schedule={'00333':'Methotrexate 30 mg/m² day 1; vinblastine 3 mg/m², doxorubicin 30 mg/m² and cisplatin 70 mg/m² day 2; every 14 days with G-CSF days 3–7 until progression or unacceptable toxicity.','00337':'Methotrexate 30 mg/m² and vinblastine 4 mg/m² days 1 and 8; cisplatin 100 mg/m² day 2; folinic acid 15 mg every six hours for four doses starting 24 hours after each methotrexate dose. Every 21 days for up to three neoadjuvant cycles.','00338':'Methotrexate 30 mg/m² days 1, 15 and 22; vinblastine 3 mg/m² days 2, 15 and 22; doxorubicin 30 mg/m² and cisplatin 70 mg/m² day 2. Every 28 days: neoadjuvant three, adjuvant four, advanced/metastatic up to six cycles.'}[code]
    duration=dict(cycle_length_days=14 if dd else 21 if cmv else 28,duration_type='until_progression_or_toxicity' if dd else 'fixed_cycles',duration_text='Until progression or unacceptable toxicity' if dd else 'Up to three neoadjuvant cycles' if cmv else 'Three neoadjuvant, four adjuvant, or up to six advanced/metastatic cycles')
    if cmv:duration['planned_cycles']=3
    x.finish(title,setting,schedule,duration,['Component-specific organ and neurological rules are retained; methotrexate CrCl 50 and printed decimal gaps require review.','Original-dose versus previous-dose modification and supportive rescue/G-CSF plans are explicitly distinguished.','CMV 21-day body/14-day footer discrepancy is visible.' if cmv else 'Treatment intent and source-specific course length must be confirmed.'])


def enfortumab():
    x=Protocol('00846','3b');x.common()
    x.inputs.update({
        'blood_glucose_mmol_l':number('Blood glucose','mmol/L',5),
        'skin_grade':grade('Skin reaction (CTCAE v5)'),
        'pneumonitis_grade':grade('Pneumonitis / interstitial lung disease (CTCAE v5)'),
        'skin_worsening_or_fever':boolean('Grade 2 skin reaction is worsening or associated with fever'),
        'recurrent_grade3_skin':boolean('Recurrent grade 3 skin reaction'),
        'suspected_sjs_ten_or_bullous':boolean('Suspected SJS/TEN or bullous skin lesions'),
        'confirmed_sjs_ten':boolean('Confirmed Stevens-Johnson syndrome / toxic epidermal necrolysis'),
        'recurrent_grade2_neuropathy':boolean('Recurrent grade 2 neuropathy'),
        'hepatic_impairment':select('Clinically established hepatic impairment',[('none','None'),('mild','Mild'),('moderate','Moderate'),('severe','Severe'),('unknown','Not established')]),
        'haemodialysis':boolean('Receiving haemodialysis'),
        'prior_platinum_and_pd1_pdl1':boolean('Previously received BOTH platinum chemotherapy and a PD-1/PD-L1 inhibitor'),
        'active_cns_metastases':boolean('Active central nervous system metastases'),
        'uncontrolled_diabetes':boolean('Uncontrolled diabetes'),
        'active_keratitis_or_corneal_ulcer':boolean('Active keratitis or corneal ulcer'),
        'eye_symptoms':boolean('New eye pain, blurred vision, marked dryness or redness'),
        'body_weight_kg':number('Current body weight','kg',70),
        'current_ev_dose_mg_kg':select('Current enfortumab dose level',[('unknown','Not confirmed'),('1.25','1.25 mg/kg (cap 125 mg)'),('1','1.0 mg/kg (cap 100 mg)'),('0.75','0.75 mg/kg (cap 75 mg)'),('0.5','0.5 mg/kg (cap 50 mg)')]),
        'previous_infusion_reaction':boolean('Previous infusion-related reaction'),
        'premedication_plan_confirmed':boolean('Required premedication plan after a prior infusion reaction is confirmed'),
    })
    baseline=c('assessment_phase','==','baseline')
    x.rule('PRIOR_THERAPY',allof(baseline,anyof(c('prior_platinum_and_pd1_pdl1','missing'),c('prior_platinum_and_pd1_pdl1','==',False))),'consultant_review','This monotherapy source requires prior platinum chemotherapy AND a PD-1/PD-L1 inhibitor. Do not substitute the first-line enfortumab/pembrolizumab indication.',page=1,section='Indication')
    for f in ['active_cns_metastases','uncontrolled_diabetes','active_keratitis_or_corneal_ulcer']:
        x.rule('BASELINE_'+f.upper(),allof(baseline,c(f,'==',True)),'consultant_review','Baseline source caution: '+x.inputs[f]['label']+'. Review suitability and the management plan before treatment.',page=1,section='Cautions')
    x.rule('BASELINE_NEUROPATHY',allof(baseline,c('neuropathy_grade','>=',2)),'consultant_review','Pre-existing grade ≥2 sensory or motor neuropathy is a source caution; review before starting.',page=1,section='Cautions')
    x.rule('PLATELETS_50_75_HOLD',allof(c('platelets','>=',50),c('platelets','<',75)),'withhold','Platelets 50–74 in the source: withhold until platelets ≥75 or return to baseline, then resume at the same dose level. A satisfactory ANC does not override this exception.',page=3,section='Table 2')
    x.rule('COUNTS_INTERMEDIATE',anyof(allof(c('anc','>=',.5),c('anc','<',1)),allof(c('platelets','>=',25),c('platelets','<',50))),'withhold','Withhold until ANC ≥1.5 and platelets ≥75 or return to baseline; then resume at the same dose OR consider one dose-level reduction. Confirm both counts and the prior dose.',page=3,section='Table 2')
    x.rule('COUNTS_SEVERE',anyof(c('anc','<',.5),c('platelets','<',25)),'withhold_then_reduce','Withhold until ANC ≥1.5 and platelets ≥75 or return to baseline, then reduce by one dose level OR consider discontinuation. Severe anaemia also requires explicit consideration of discontinuation; transfusion/growth factors follow local policy.',page=3,section='Table 2')
    x.rule('RENAL_DATA_LIMIT',anyof(c('crcl_ml_min','<',15),c('haemodialysis','==',True)),'consultant_review','NCCP says no renal adjustment is expected below CrCl 15 or on dialysis; evidence and product-information limitations require pharmacy review. This is not proof of studied safety or automatic clearance.',page=3,section='Table 3')
    x.rule('HEPATIC_MOD_SEVERE',c('hepatic_impairment','in',['moderate','severe']),'contraindicated','Enfortumab vedotin is not recommended in moderate or severe hepatic impairment in the NCCP table. Confirm the clinical classification; do not infer it from an isolated laboratory value.',page=3,section='Table 3')
    x.rule('SKIN_SUSPECTED_SCAR',c('suspected_sjs_ten_or_bullous','==',True),'withhold','Immediately withhold for suspected SJS/TEN or bullous lesions and refer urgently for specialist care.',page=4,section='Table 4')
    x.rule('SKIN_PERMANENT_STOP',anyof(c('confirmed_sjs_ten','==',True),c('skin_grade','==',4),c('recurrent_grade3_skin','==',True)),'permanently_discontinue','Confirmed SJS/TEN, grade 4 skin reaction or recurrent grade 3 skin reaction: permanently discontinue enfortumab.',page=4,section='Table 4')
    x.rule('SKIN_HOLD',anyof(c('skin_grade','==',3),allof(c('skin_grade','==',2),c('skin_worsening_or_fever','==',True))),'withhold','Withhold until skin toxicity is grade ≤1; consider specialist review. Resume at the same dose or one level lower only after review. Recurrent grade 3 has a permanent-stop rule.',page=4,section='Table 4')
    x.rule('GLUCOSE_GT13_9',c('blood_glucose_mmol_l','>',13.9),'withhold','Blood glucose >13.9 mmol/L: withhold until ≤13.9, then resume at the same dose level after assessment. Suspected ketoacidosis is an emergency.',page=4,section='Table 4')
    x.rule('LUNG_G2',c('pneumonitis_grade','==',2),'withhold','Grade 2 pneumonitis/ILD: withhold until grade ≤1, then same dose or one level lower after review.',page=4,section='Table 4')
    x.rule('LUNG_G3_PLUS',c('pneumonitis_grade','>=',3),'permanently_discontinue','Grade ≥3 pneumonitis/ILD: permanently discontinue enfortumab.',page=4,section='Table 4')
    x.rule('NEURO_G2',c('neuropathy_grade','==',2),'withhold','Grade 2 neuropathy: withhold until grade ≤1. First occurrence resumes at the same level; recurrence requires a one-level reduction. Confirm history and the previous dose.',page=4,section='Table 4')
    x.rule('NEURO_G3_PLUS',c('neuropathy_grade','>=',3),'permanently_discontinue','Grade ≥3 peripheral neuropathy: permanently discontinue enfortumab.',page=4,section='Table 4')
    x.rule('EYE_REVIEW',c('eye_symptoms','==',True),'consultant_review','Assess new ocular symptoms promptly and arrange ophthalmology when indicated. The source supports artificial tears; suspected corneal injury needs specialist management.',page=4,section='Supportive care / ocular toxicity')
    x.rule('WEIGHT_CAP',c('body_weight_kg','>=',100),'consultant_review','Dose calculation uses a maximum weight of 100 kg. Dose-level caps are 125, 100, 75 and 50 mg for 1.25, 1.0, 0.75 and 0.5 mg/kg respectively. Confirm the current prescribed level; do not extrapolate above the cap.',page=1,section='Treatment and table 1 on page 2')
    x.rule('PREVIOUS_REACTION_PREMED',allof(c('previous_infusion_reaction','==',True),anyof(c('premedication_plan_confirmed','missing'),c('premedication_plan_confirmed','==',False))),'consultant_review','After a previous infusion reaction, confirm antipyretic, antihistamine and IV corticosteroid premedication 30 minutes before later infusions as specified in the source. This is not routine premedication for everyone.',page=4,section='Supportive care')
    x.finish('Enfortumab vedotin monotherapy','Locally advanced or metastatic urothelial cancer after both platinum chemotherapy and a PD-1/PD-L1 inhibitor.','Enfortumab vedotin 1.25 mg/kg (maximum 125 mg) IV over 30 minutes on days 1, 8 and 15 of each 28-day cycle until progression or unacceptable toxicity.',dict(cycle_length_days=28,duration_type='until_progression_or_toxicity',duration_text='Until disease progression or unacceptable toxicity'),['This is enfortumab monotherapy, not the first-line enfortumab/pembrolizumab combination.','The platelet exception, glucose >13.9 threshold, skin recurrence, neuropathy and pneumonitis stopping rules are source-specific.','Dose reductions require the previous level and retain the 100 kg weight cap; no unsupported fourth reduction is inferred.'])


def pembrolizumab_axitinib():
    x=Protocol('00583','4');x.common()
    for f in ['alt_ast_uln_multiple','bilirubin_uln_multiple']:
        x.inputs[f]=copy.deepcopy(x.p['input_definitions'][f])
    x.inputs.update({
        'systolic_bp':number('Systolic blood pressure','mmHg',120),'diastolic_bp':number('Diastolic blood pressure','mmHg',80),
        'creatinine_uln_multiple':number('Creatinine divided by its upper limit of normal','×ULN',1),
        'blood_glucose_mmol_l':number('Blood glucose','mmol/L',5),
        'protein_g_24h':number('Quantified urine protein','g/24 hours',0),
        'source_upc_ge3_confirmed':boolean('Clinician confirmed urine protein:creatinine ratio ≥3 in the NCCP source convention after checking laboratory units'),
        'maximal_antihypertensives':boolean('Already receiving maximal tolerated antihypertensive therapy'),
        'hypertensive_crisis_or_neuro_deficit':boolean('Hypertensive crisis or neurological deficit related to uncontrolled blood pressure'),
        'severe_persistent_htn_despite_reduction':boolean('Severe persistent hypertension despite medication and axitinib dose reduction'),
        'persistent_proteinuria_on_2mg':boolean('Proteinuria cannot fall below 3 g/day despite axitinib 2 mg twice daily'),
        'current_axitinib_mg_bd':select('Current axitinib dose twice daily',[('unknown','Not confirmed'),('2','2 mg'),('3','3 mg'),('5','5 mg'),('7','7 mg'),('10','10 mg')]),
        'child_pugh_class':select('Child-Pugh class',[('none','No diagnosed hepatic impairment'),('A','A'),('B','B'),('C','C')]),
        'immune_pneumonitis_grade':grade('Immune pneumonitis (NCCP CTCAE v4)'),
        'immune_colitis_grade':grade('Immune colitis (NCCP CTCAE v4)'),
        'immune_nephritis_grade':grade('Immune nephritis (NCCP CTCAE v4)'),
        'immune_skin_grade':grade('Immune skin reaction (NCCP CTCAE v4)'),
        'other_immune_grade':grade('Other immune toxicity excluding separately assessed endocrine events'),
        'immune_cardiac_neuro_grade':grade('Immune myocarditis, encephalitis or Guillain-Barré syndrome'),
        'infusion_reaction_grade':grade('Pembrolizumab infusion reaction'),
        'adrenal_insufficiency_grade':grade('Adrenal insufficiency'),
        'hypophysitis_grade':grade('Hypophysitis'),
        'symptomatic_hypophysitis':boolean('Symptomatic hypophysitis'),
        'hyperthyroidism_grade':grade('Hyperthyroidism'),
        'type1_diabetes':boolean('Immune-mediated type 1 diabetes'),
        'ketoacidosis':boolean('Ketoacidosis'),
        'controlled_endocrine_restart_considered':boolean('Considering restart after endocrine toxicity controlled by hormone replacement'),
        'recurrent_grade2_pneumonitis':boolean('Recurrent grade 2 immune pneumonitis'),
        'recurrent_grade3_immune_event':boolean('Recurrent grade 3 immune event other than a separately assessed endocrine exception'),
        'suspected_sjs_ten':boolean('Suspected Stevens-Johnson syndrome / toxic epidermal necrolysis'),
        'confirmed_sjs_ten':boolean('Confirmed Stevens-Johnson syndrome / toxic epidermal necrolysis'),
        'days_since_last_pembrolizumab':number('Days since last pembrolizumab','days',0),
        'immune_toxicity_resolved_grade01':boolean('Immune toxicity has resolved to grade 0–1'),
        'prednisolone_equivalent_mg_day':number('Current prednisolone-equivalent steroid dose','mg/day',0),
        'axitinib_diarrhoea_grade':grade('Diarrhoea clinically attributed to axitinib'),
        'toxicity_attribution_uncertain':boolean('Cause of diarrhoea, organ or other toxicity remains uncertain'),
        'axitinib_renal_toxicity_grade':grade('Axitinib-attributed renal failure / nephritis'),
        'axitinib_nonimmune_grade':grade('Other axitinib-attributed non-immune toxicity'),
        'axitinib_bleeding_grade':grade('Bleeding on axitinib'),
        'haemoptysis':boolean('Coughing blood'),
        'pulmonary_or_gi_bleed_nonhaemorrhoidal':boolean('Pulmonary or gastrointestinal bleeding other than haemorrhoids'),
        'axitinib_lifethreatening_or_recurrent_severe':boolean('Life-threatening or recurrent severe / grade 3 axitinib-related toxicity'),
        'pres_or_arterial_ischaemia':boolean('PRES/RPLS or arterial thrombosis/ischaemia'),
        'strong_cyp3a_inhibitor':boolean('Strong CYP3A4/5 inhibitor'),
        'strong_cyp3a_inducer':boolean('Strong CYP3A4/5 inducer'),
        'dose_escalation_considered':boolean('Considering axitinib dose escalation'),
        'prior_advanced_systemic_therapy':boolean('Prior systemic therapy for advanced disease or conflicting prior-treatment history'),
    })
    axi=['axitinib']; pembro=['pembrolizumab'];both=['pembrolizumab','axitinib'];base=c('assessment_phase','==','baseline')
    x.rule('BASELINE_PRIOR_THERAPY',allof(base,c('prior_advanced_systemic_therapy','==',True)),'consultant_review','This source is first-line advanced clear-cell-component RCC. Confirm prior VEGF/VEGFR/mTOR and immunotherapy history and any adjuvant exception under the current NCCP indication.',both,2,'Eligibility / exclusions')
    x.rule('BASELINE_BP',allof(base,anyof(c('systolic_bp','>=',150),c('diastolic_bp','>=',90))),'consultant_review','Baseline poorly controlled blood pressure is defined as SBP ≥150 or DBP ≥90 in the exclusion section. Confirm control before starting; on-treatment thresholds are different.',axi,2,'Exclusions')
    for f,n in [('anc',1),('platelets',75)]:x.rule('AXI_LOW_'+f.upper(),c(f,'<',n),'withhold','Axitinib: delay with ANC <1 or platelets <75 ×10⁹/L. This count rule does not automatically assign a pembrolizumab dose reduction.',axi,4,'Table 3')
    x.rule('AXI_HEPATIC_B',c('child_pugh_class','==','B'),'consultant_review','Axitinib: Child-Pugh B, 50% of original dose per NCCP. Reconcile achievable tablet dose with the current product information and prior dose; no automatic rounding.',axi,4,'Table 4')
    x.rule('AXI_HEPATIC_C',c('child_pugh_class','==','C'),'contraindicated','Axitinib is not recommended in Child-Pugh C; this is also a baseline exclusion.',axi,4,'Table 4 / exclusions')
    x.rule('ICI_LUNG_HOLD',c('immune_pneumonitis_grade','==',2),'withhold','Grade 2 immune pneumonitis: withhold pembrolizumab until recovery to grade 0–1. Recurrent grade 2 requires permanent discontinuation.',pembro,4,'Table 5')
    x.rule('ICI_LUNG_STOP',anyof(c('immune_pneumonitis_grade','>=',3),c('recurrent_grade2_pneumonitis','==',True)),'permanently_discontinue','Grade 3–4 or recurrent grade 2 immune pneumonitis: permanently discontinue pembrolizumab.',pembro,4,'Table 5')
    x.rule('ICI_COLITIS_HOLD',c('immune_colitis_grade','in',['2','3']),'withhold','Grade 2–3 immune colitis: withhold pembrolizumab until grade 0–1; grade 4 or recurrent grade 3 requires permanent discontinuation.',pembro,4,'Table 5')
    x.rule('ICI_COLITIS_STOP',c('immune_colitis_grade','==',4),'permanently_discontinue','Grade 4 immune colitis: permanently discontinue pembrolizumab.',pembro,4,'Table 5')
    x.rule('ICI_NEPHRITIS_HOLD',allof(c('immune_nephritis_grade','==',2),c('creatinine_uln_multiple','>',1.5),c('creatinine_uln_multiple','<=',3)),'withhold','Grade 2 immune nephritis with creatinine >1.5 to ≤3 ×ULN: withhold pembrolizumab.',pembro,5,'Table 5')
    x.rule('ICI_NEPHRITIS_STOP',allof(c('immune_nephritis_grade','>=',3),c('creatinine_uln_multiple','>',3)),'permanently_discontinue','Grade ≥3 immune nephritis with creatinine >3 ×ULN: permanently discontinue pembrolizumab.',pembro,5,'Table 5')
    x.rule('ICI_RENAL_CONTEXT',anyof(c('immune_nephritis_grade','>=',2),c('creatinine_uln_multiple','>',1.5)),'consultant_review','Interpret clinical nephritis grade together with the creatinine/ULN ratio; the source requires both for its hold/stop rows. Missing or discordant data cannot clear treatment.',pembro,5,'Table 5')
    x.rule('ICI_ENDOCRINE_HOLD',anyof(c('adrenal_insufficiency_grade','>=',2),c('hypophysitis_grade','>=',2),c('symptomatic_hypophysitis','==',True),c('hyperthyroidism_grade','>=',3),allof(c('type1_diabetes','==',True),c('blood_glucose_mmol_l','>',13.9)),c('ketoacidosis','==',True)),'withhold','Withhold pembrolizumab for the specified adrenal, pituitary, thyroid or diabetes toxicity and treat urgently as indicated. Controlled endocrinopathy may permit continuation/restart after hormone replacement and steroid taper; it is not an automatic permanent grade-4 stop.',pembro,5,'Table 5')
    x.rule('ENDOCRINE_RESTART',c('controlled_endocrine_restart_considered','==',True),'consultant_review','For prior grade 3–4 endocrinopathy improved to grade ≤2 and controlled on replacement, continuation may be considered after any needed corticosteroid taper. Otherwise the source advises discontinuation. Record current control and specialist agreement.',pembro,5,'Table 5')
    x.rule('ICI_SKIN_HOLD',anyof(c('immune_skin_grade','==',3),c('suspected_sjs_ten','==',True)),'withhold','Grade 3 skin reaction or suspected SJS/TEN: withhold pembrolizumab and obtain specialist assessment.',pembro,5,'Table 5')
    x.rule('ICI_SKIN_STOP',anyof(c('immune_skin_grade','==',4),c('confirmed_sjs_ten','==',True)),'permanently_discontinue','Grade 4 skin reaction or confirmed SJS/TEN: permanently discontinue pembrolizumab.',pembro,5,'Table 5')
    x.rule('ICI_OTHER_HOLD',anyof(c('other_immune_grade','in',['2','3']),c('immune_cardiac_neuro_grade','==',2)),'withhold','Other grade 2–3 immune toxicity requires withholding and event-specific specialist care. Suspected myocarditis or neurological toxicity needs urgent assessment.',pembro,5,'Table 5')
    x.rule('ICI_OTHER_STOP',anyof(c('other_immune_grade','==',4),c('immune_cardiac_neuro_grade','>=',3),c('recurrent_grade3_immune_event','==',True),c('infusion_reaction_grade','>=',3)),'permanently_discontinue','Permanently discontinue pembrolizumab for the source permanent-stop criteria: other grade 4 or recurrent grade 3 immune events, grade 3–4 myocarditis/encephalitis/Guillain-Barré syndrome, or grade 3–4 infusion reaction. Separately assessed controlled endocrine exceptions are not included in this field.',pembro,5,'Table 5')
    x.rule('ICI_12_WEEK_STOP',allof(c('days_since_last_pembrolizumab','>',84),anyof(c('immune_toxicity_resolved_grade01','==',False),c('prednisolone_equivalent_mg_day','>',10))),'permanently_discontinue','If toxicity has not resolved to grade 0–1 or steroid dose cannot fall to ≤10 mg prednisolone-equivalent daily within 12 weeks after the last pembrolizumab, permanently discontinue. Review specific endocrine exceptions and the exact date.',pembro,5,'Table 5 footnote')
    x.rule('ICI_12_WEEK_REVIEW',c('days_since_last_pembrolizumab','==',84),'consultant_review','At the 12-week boundary, confirm exact treatment date, recovery and steroid dose against the source stopping rule; do not automatically restart.',pembro,5,'Table 5 footnote')
    x.rule('AXI_BP_HOLD',anyof(c('systolic_bp','>',160),c('diastolic_bp','>',105)),'withhold','Axitinib: SBP >160 or DBP >105, hold until BP <150/100 and adjust antihypertensives, then restart one dose level lower. Monitor for hypotension after interruption.',axi,6,'Table 6')
    x.rule('AXI_BP_EXACT_GAP',anyof(c('systolic_bp','==',160),c('diastolic_bp','==',105)),'consultant_review','The printed BP bands omit SBP exactly 160 and DBP exactly 105. Obtain clinical review; do not treat equality as automatic permission to continue.',axi,6,'Table 6')
    x.rule('AXI_BP_INTERMEDIATE',anyof(between('systolic_bp',150,160,False),between('diastolic_bp',100,105,False)),'consultant_review','Intermediate BP elevation: institute or increase antihypertensive treatment; if already maximal, reduce axitinib one dose level. Apply the more restrictive finding when systolic and diastolic values differ.',axi,6,'Table 6')
    x.rule('AXI_BP_STOP',anyof(c('hypertensive_crisis_or_neuro_deficit','==',True),c('severe_persistent_htn_despite_reduction','==',True)),'permanently_discontinue','Permanently discontinue axitinib for hypertensive crisis/related neurological deficit or severe persistent hypertension despite treatment and dose reduction.',axi,6,'Table 6')
    x.rule('AXI_PROTEIN_HOLD',anyof(c('protein_g_24h','>=',3),c('source_upc_ge3_confirmed','==',True)),'withhold','Urine protein ≥3 g/24 h or source-convention UPC ≥3: hold until protein <3 g/24 h, then one level lower. Confirm units; do not compare a laboratory mg/mmol result directly with the source ratio.',axi,6,'Table 6')
    x.rule('AXI_PROTEIN_STOP',c('persistent_proteinuria_on_2mg','==',True),'permanently_discontinue','Proteinuria cannot fall below 3 g/24 h despite axitinib 2 mg twice daily: permanently discontinue.',axi,6,'Table 6')
    x.rule('ATTRIBUTION_REVIEW',c('toxicity_attribution_uncertain','==',True),'consultant_review','Axitinib toxicity and immune toxicity can overlap. Determine attribution and review both medicines; do not use the more permissive axitinib diarrhoea row for possible immune colitis.',both,6,'Tables 5–7')
    x.rule('AXI_DIARRHOEA_G3',c('axitinib_diarrhoea_grade','==',3),'consultant_review','Grade 3 diarrhoea attributed to axitinib: source allows continuation one dose level lower. First exclude immune colitis/infection, assess hydration and confirm the current dose.',axi,6,'Table 6')
    x.rule('AXI_DIARRHOEA_G4',c('axitinib_diarrhoea_grade','==',4),'withhold','Grade 4 axitinib diarrhoea follows the severe non-haematological pathway: hold and urgently assess; life-threatening toxicity has a permanent-stop rule.',axi,6,'Table 6')
    x.rule('AXI_HAEMOPTYSIS',c('haemoptysis','==',True),'withhold','Even grade 1 haemoptysis requires interrupting axitinib and investigating the cause.',axi,6,'Table 6')
    x.rule('AXI_BLEED_G2',c('axitinib_bleeding_grade','==',2),'withhold','Grade 2 bleeding: interrupt axitinib until grade ≤1 then one level lower, except pulmonary or non-haemorrhoidal gastrointestinal bleeding, which requires permanent discontinuation.',axi,6,'Table 6')
    x.rule('AXI_BLEED_STOP',anyof(c('axitinib_bleeding_grade','>=',3),allof(c('axitinib_bleeding_grade','==',2),c('pulmonary_or_gi_bleed_nonhaemorrhoidal','==',True))),'permanently_discontinue','Grade 3–4 bleeding, or grade 2 pulmonary/non-haemorrhoidal gastrointestinal bleeding: permanently discontinue axitinib.',axi,6,'Table 6')
    x.rule('AXI_RENAL_HOLD',c('axitinib_renal_toxicity_grade','>=',3),'withhold','Grade 3–4 axitinib renal failure/nephritis: hold until grade <2, then restart one dose level lower after review.',axi,7,'Table 6')
    x.rule('AXI_OTHER_G3',c('axitinib_nonimmune_grade','==',3),'consultant_review','For other grade 3 axitinib toxicity, continuation at the same dose may be considered if controlled with symptom medicines or asymptomatic non-LFT biochemistry; otherwise one-level reduction may be used. Confirm attribution and clinical significance.',axi,7,'Table 6')
    x.rule('AXI_OTHER_G4',c('axitinib_nonimmune_grade','==',4),'withhold','Other grade 4 axitinib toxicity: hold until grade <2 then one level lower. The source exception for asymptomatic non-LFT laboratory findings requires explicit specialist assessment; no automatic continuation.',axi,7,'Table 6')
    x.rule('AXI_PERMANENT_STOP',anyof(c('axitinib_lifethreatening_or_recurrent_severe','==',True),c('pres_or_arterial_ischaemia','==',True)),'permanently_discontinue','Permanently discontinue axitinib for life-threatening or recurrent severe/grade 3 drug-related toxicity, PRES/RPLS or arterial thrombosis/ischaemia.',axi,7,'Table 6')
    x.rule('COMBINATION_LIVER_HOLD',allof(c('alt_ast_uln_multiple','>=',3),c('alt_ast_uln_multiple','<',10),c('bilirubin_uln_multiple','<',2)),'withhold','ALT/AST ≥3 but <10 ×ULN with bilirubin <2 ×ULN: withhold both medicines until grade 0–1. Consider corticosteroids; any single-agent/sequential rechallenge requires specialist review.',both,7,'Table 7')
    x.rule('COMBINATION_LIVER_STOP',anyof(c('alt_ast_uln_multiple','>=',10),allof(c('alt_ast_uln_multiple','>',3),c('bilirubin_uln_multiple','>=',2))),'permanently_discontinue','ALT/AST ≥10 ×ULN, or >3 ×ULN with bilirubin ≥2 ×ULN: permanently discontinue pembrolizumab and axitinib; consider corticosteroid treatment.',both,7,'Table 7')
    x.rule('COMBINATION_LIVER_GAP',allof(c('alt_ast_uln_multiple','==',3),c('bilirubin_uln_multiple','>=',2)),'withhold','The source does not allocate ALT/AST exactly 3 ×ULN with bilirubin ≥2: its stop row uses >3. Hold both and obtain urgent specialist clarification; do not silently convert this to a permanent-stop threshold.',both,7,'Table 7 boundary')
    x.rule('COMBINATION_LIVER_BILI_MISSING',allof(c('alt_ast_uln_multiple','>=',3),c('alt_ast_uln_multiple','<',10),c('bilirubin_uln_multiple','missing')),'withhold','ALT/AST ≥3 requires bilirubin to distinguish the combined hold and permanent-stop rows. Hold pending the missing result and clinical review.',both,7,'Table 7')
    x.rule('ISOLATED_BILIRUBIN_REVIEW',allof(c('bilirubin_uln_multiple','>=',2),anyof(c('alt_ast_uln_multiple','missing'),c('alt_ast_uln_multiple','<',3))),'consultant_review','Elevated bilirubin without the source combined enzyme criteria needs clinical assessment; the combination table does not provide an automatic dose decision for this pattern.',both,7,'Table 7 coverage')
    for field in ['strong_cyp3a_inhibitor','strong_cyp3a_inducer']:
        x.rule(field.upper(),c(field,'==',True),'consultant_review','Avoid strong CYP3A4/5 inhibitors/inducers where possible. If unavoidable, reconcile an individual axitinib adjustment with pharmacy (the inhibitor example is approximately half, 5→2 mg twice daily); pembrolizumab is never dose-reduced by this rule.',axi,8,'Table 8')
    x.rule('AXI_ESCALATION',c('dose_escalation_considered','==',True),'consultant_review','Axitinib escalation 5→7→10 mg twice daily requires two consecutive weeks without toxicity >grade 2, BP not >150/90 and no antihypertensive treatment. Confirm dose and all criteria; no automatic escalation.',axi,3,'Table 1')
    x.finish('Pembrolizumab 200 mg with axitinib','First-line advanced renal cell carcinoma with a clear-cell component, with or without sarcomatoid features, meeting current NCCP prior-treatment criteria.','Pembrolizumab 200 mg IV every 21 days with axitinib 5 mg orally twice daily, continuously, approximately 12 hours apart, with or without food. Continue according to response, tolerability and the consultant plan.',dict(cycle_length_days=21,duration_type='until_progression_or_toxicity',duration_text='Until disease progression or unacceptable toxicity; no trial cycle cap is inserted into the NCCP prescription'),['Immune and axitinib toxicity pathways remain component-specific; uncertain attribution requires review.','Combined liver rules use actual laboratory/ULN calculations and preserve the printed >3 versus ≥3 distinction.','Pembrolizumab is held or stopped, never dose-reduced. Axitinib changes require the current dose and source-specific recovery.','BP exact 160/105 and 12-week recovery boundaries are explicit review points; controlled endocrine toxicity has a separate continuation exception.'])


def main():
    for code in ['00282','00622','00628']: gemcis(code)
    mitofurt(); gemrt()
    for code in ['00333','00337','00338']:mvac_cmv(code)
    pembrolizumab_axitinib();enfortumab()
    save('protocols/index.json',INDEX)
    save('validation/gu-v08458/clinical/id-migrations.json',MIGRATIONS)

if __name__ == '__main__': main()
