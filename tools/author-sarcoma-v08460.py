#!/usr/bin/env python3
"""Source-content reconciliation of five sarcoma protocols; no publication.

Evidence is current official NCCP web-extracted PDF text. Screenshot requests
returned text markers without inspectable pixels; table visual review is unverified. Original PDF binaries were blocked (HTTP 403); hashes in the
manifest identify extracted text only. Independent clinical review is pending.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-11-18'
RELEASE = '0.84.60'
VERSIONS = {'00500': '3', '00391': '5', '00392': '5', '00501': '4', '00511': '2'}
PAGES = {'00500': 4, '00391': 6, '00392': 6, '00501': 6, '00511': 3}

def c(field, operator, value=None):
    return dict(field=field, operator=operator, **({} if value is None else {'value': value}))

def allof(*xs): return {'all': list(xs)}
def anyof(*xs): return {'any': list(xs)}
def between(f, lo, hi): return allof(c(f, '>=', lo), c(f, '<=', hi))
def absent_or_false(f): return anyof(c(f, 'missing'), c(f, '==', False))

def number(label, unit='', demo=0):
    return dict(label=label, type='number', required=False, min=0, step=.01,
                unit=unit, demo_value=demo, input_role='decision')

def boolean(label):
    return dict(label=label, type='boolean', required=False, demo_value=False, input_role='decision')

def select(label, options, demo=None):
    return dict(label=label, type='select', required=False, input_role='decision',
                options=[dict(value=v, label=t) for v, t in options],
                demo_value=options[0][0] if demo is None else demo)

def grade(label, category='other_nonhaematological'):
    return {**select(label + ' (clinician-assessed CTCAE grade)', [(i, str(i)) for i in range(5)]),
            'ctcae_version': '5.0', 'ctcae_category': category,
            'ctcae_source_url': 'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf',
            'assessment_guidance': 'Grade the named adverse event using its own CTCAE criteria; a generic symptom score is not a CTCAE grade.'}

class Protocol:
    def __init__(self, code):
        self.code = code
        self.path = next((ROOT / 'protocols/sarcoma').glob(code + '-*.json'))
        self.p = json.loads(self.path.read_text())
        self.url = self.p['metadata']['source_url']
        self.drugs = [x for x in self.p['treatment']['drugs'] if x != 'mesna']
        self.rules = []
        self.notes = []
        self.inputs = {
            'assessment_phase': select('Assessment stage', [('baseline', 'Before first treatment'), ('day1', 'New cycle / Day 1'), ('on_treatment', 'During treatment'), ('recovery', 'Recovery / next-dose review')]),
            'ecog': select('ECOG performance status', [(i, str(i)) for i in range(5)]),
            'anc': number('Absolute neutrophil count', '×10⁹/L', 3),
            'platelets': number('Platelet count', '×10⁹/L', 200),
            'crcl_ml_min': {**number('Creatinine clearance (do not substitute eGFR automatically)', 'mL/min', 80), 'renal_input': {'mode': 'exact_continuous', 'exact_value_required': True}},
            'haemodialysis': boolean('Receiving haemodialysis'),
            'bilirubin_umol_l': number('Total bilirubin — absolute concentration', 'µmol/L', 12),
            'hepatic_impairment_severity': select('Clinically assessed hepatic impairment', [('none', 'None'), ('mild', 'Mild'), ('moderate', 'Moderate'), ('severe', 'Severe')]),
            'hypersensitivity': boolean('Known hypersensitivity to a regimen medicine or excipient'),
            'pregnancy': boolean('Pregnancy'), 'breastfeeding': boolean('Breastfeeding'),
            'active_infection': boolean('Current infection requiring clinical assessment'),
        }

    def rule(self, id, when, type, message, components=None, page=2, section='Dose modifications', precaution=False):
        action = dict(type=type, components=components or self.drugs, message=message,
                      show_in_dose_actions=True, block_numeric_dose=True, dose_calculation='specialist_review')
        source = dict(document=f'NCCP {self.code} v{VERSIONS[self.code]}', url=self.url,
                      page=page, section=section, checked_date=DATE,
                      evidence_kind='current_official_web_pdf_extracted_text')
        if precaution:
            source['interpretation_note'] = 'Conservative review safeguard; this is not a verbatim source dose or an invented numerical threshold.'
        self.rules.append(dict(rule_id=id, when=when, action=action, explanation=message, source=source))

    def common(self, ecog=2, page=1):
        self.rule('STAGE_REQUIRED', c('assessment_phase', 'missing'), 'consultant_review', 'Choose the assessment stage. Baseline suitability, treatment-day counts and recovery are distinct; omitted domains are not assumed normal.', page=page, section='Eligibility / monitoring / dose modifications', precaution=True)
        self.rule('ECOG_REVIEW', c('ecog', '>', ecog), 'consultant_review', f'ECOG above {ecog} is outside the source eligibility range; reassess suitability.', page=page, section='Eligibility')
        for f in ['hypersensitivity', 'pregnancy', 'breastfeeding']:
            self.rule(f.upper() + '_EXCLUSION', c(f, '==', True), 'contraindicated', self.inputs[f]['label'] + ': source exclusion; specialist review before treatment.', page=page, section='Exclusions')
        self.rule('CURRENT_INFECTION_REVIEW', c('active_infection', '==', True), 'withhold', 'Current infection requires clinical assessment before the next dose; assess urgently if febrile or systemically unwell. Prior-cycle dose reductions do not authorise treatment through an active infection.', page=page, section='Monitoring / serious adverse effects', precaution=True)

    def finish(self, schedule, duration, monitoring, support, eligibility, exclusions):
        p, m = self.p, self.p['metadata']
        p['input_definitions'], p['required_inputs'] = self.inputs, []
        p['rule_engine']['rules'] = self.rules
        m.update(source_checked_date=DATE, source_document_pages=PAGES[self.code],
                 sactcheck_encoding_version=RELEASE, clinical_audit_release=RELEASE)
        m['encoding_maturity'] = dict(level='source_reconciled_pending_independent_review',
            label='Source-content reconciliation draft; independent review pending',
            source_reconciled=True, consultant_reviewed=False, oncology_pharmacy_reviewed=False,
            clinical_use_authorised=False, audit_release=RELEASE, source_checked_date=DATE,
            scope_note='Complete current catalogue-linked NCCP PDF extracted text checked. Visual table-layout inspection is unverified: screenshot requests returned text markers without inspectable pixels. Original PDF binary retrieval returned HTTP 403; extracted-text hashes are not PDF hashes. Source ambiguities remain explicit review boundaries.')
        m['validation'].update(rule_level_source_reconciliation_status='source_content_reconciled_pending_independent_clinical_and_oncology_pharmacy_review',
                               consultant_reviewed=False, oncology_pharmacy_reviewed=False, clinical_use_authorised=False)
        m['source_boundary_notes'] = self.notes
        m['source_evidence'] = dict(manifest='validation/sarcoma-v08460/clinical/source-manifest.json',
                                    original_pdf_sha256=None, binary_retrieval_status='blocked_http_403',
                                    visual_table_layout_inspection='unverified_screenshot_text_marker_only_no_inspectable_pixels',
                                    extracted_text='validation/sarcoma-v08460/clinical/sources/' + self.code + '-web.txt')
        p['clinical_governance']['dose_modification_note'] = 'Use the most restrictive applicable component action. Source percentages and dose levels are review instructions, not automatic prescriptions. Confirm dose history, recovery, organ function and the current official source.'
        p['clinical_governance']['organ_function_rule_status'] = 'Current source content reconciled in v 0.84.60; source ambiguities and independent clinical/pharmacy approval remain unresolved.'
        p['treatment'].update(cycle_length_days=21, schedule_summary=schedule, **duration)
        p['eligibility'], p['exclusions'], p['monitoring'] = eligibility, exclusions, monitoring
        p['dose_modifications'] = ['Source-specific count, renal, hepatic, toxicity and dose-history branches are encoded as component review actions.'] + self.notes
        p['supportive_care']['additional_supportive_care'] = support
        p['supportive_care']['regimen_source_url'] = self.url
        p['supportive_care']['regimen_source_checked_date'] = DATE
        self.path.write_text(json.dumps(p, ensure_ascii=False, indent=2) + '\n')
        return dict(code=self.code, protocol_id=p['protocol_id'], rules=len(self.rules), inputs=len(self.inputs), path=str(self.path.relative_to(ROOT)))

def doxorubicin(x, combo=False):
    page = 3 if combo else 2
    schedule_page = 2 if x.code == '00392' else 1
    x.inputs.update({
        'child_pugh_c': boolean('Child–Pugh C hepatic impairment'),
        'lvef_percent': number('Left ventricular ejection fraction', '%', 60),
        'significant_cardiac_disease': boolean('Congestive heart failure or other significant cardiac disease'),
        'symptomatic_cardiac_dysfunction': boolean('New symptoms/signs of cardiac dysfunction'),
        'planned_lifetime_doxorubicin_mg_m2': number('Lifetime doxorubicin exposure INCLUDING the planned cycle (review other anthracyclines separately)', 'mg/m²', 75),
        'other_anthracycline_or_cardiac_risk': boolean('Other anthracycline exposure, prior chest radiation or additional cardiac risk requiring individual limit'),
    })
    for id, cond, message in [
        ('DOX_BILI_20_50', between('bilirubin_umol_l', 20, 50), 'Bilirubin 20–50 µmol/L: source specifies 50% of the original doxorubicin dose; review the original/current dose and all other restrictions.'),
        ('DOX_BILI_51_86', between('bilirubin_umol_l', 51, 86), 'Bilirubin 51–86 µmol/L: source specifies 25% of the original doxorubicin dose; review the original/current dose and all other restrictions.'),
        ('DOX_BILI_DECIMAL_GAP', allof(c('bilirubin_umol_l', '>', 50), c('bilirubin_umol_l', '<', 51)), 'The printed bilirubin rows end at 50 and restart at 51 µmol/L. This decimal interval is not allocated; do not round or substitute a multiple of ULN.'),
        ('DOX_CRCL_EXACT10', c('crcl_ml_min', '==', 10), 'The doxorubicin renal table prints > 10 and < 10 mL/min, leaving exactly 10 unallocated; confirm with oncology pharmacy.'),
        ('DOX_HAEMODIALYSIS', c('haemodialysis', '==', True), 'On haemodialysis, 75% of the original doxorubicin dose may be considered; specialist prescription and timing review are required.'),
    ]:
        x.rule(id, cond, 'consultant_review', message, ['doxorubicin'], page, 'Renal and hepatic impairment table')
    x.rule('DOX_HEPATIC_NOT_RECOMMENDED', anyof(c('bilirubin_umol_l', '>', 86), c('child_pugh_c', '==', True)), 'withhold', 'Doxorubicin is not recommended when bilirubin is > 86 µmol/L or Child–Pugh C; specialist review of alternatives.', ['doxorubicin'], page, 'Renal and hepatic impairment table')
    x.rule('BASELINE_LVEF', allof(c('assessment_phase', '==', 'baseline'), c('lvef_percent', '<=' if combo else '<', 50)), 'withhold', 'Before treatment, the source requires LVEF ' + ('>50%' if combo else '≥50%') + '; obtain cardiac and treatment-suitability review.', ['doxorubicin'], 2, 'Baseline monitoring / exclusions')
    x.rule('CARDIAC_DISEASE_REVIEW', anyof(c('significant_cardiac_disease', '==', True), c('symptomatic_cardiac_dysfunction', '==', True)), 'withhold', 'Significant or symptomatic cardiac disease requires assessment before further doxorubicin. Review ECG, cardiac imaging and lifetime exposure.', ['doxorubicin'], 2 if combo else 1, 'Cardiac safety / monitoring', precaution=combo)
    x.rule('DOX_CUMULATIVE_LIMIT', c('planned_lifetime_doxorubicin_mg_m2', '>', 450), 'withhold', 'The planned dose would exceed the source lifetime cumulative doxorubicin limit of 450 mg/m². Review previous anthracyclines, cardiac risk and the treatment plan before prescribing.', ['doxorubicin'], schedule_page, 'Treatment schedule footnote')
    x.rule('DOX_CUMULATIVE_RISK_REVIEW', anyof(c('planned_lifetime_doxorubicin_mg_m2', '==', 450), c('other_anthracycline_or_cardiac_risk', '==', True)), 'consultant_review', 'Confirm cumulative anthracycline exposure and the individual cardiac-risk limit. Reaching 450 mg/m² is not permission for a further cycle.', ['doxorubicin'], schedule_page, 'Cumulative exposure', precaution=True)
    x.notes += ['Doxorubicin hepatic decisions use absolute bilirubin in µmol/L, not an assumed ULN of 20.', 'Bilirubin > 50 to < 51 µmol/L and CrCl exactly 10 mL/min are unallocated printed boundaries and require review.']

def mono():
    x=Protocol('00500'); x.common(); doxorubicin(x)
    x.inputs.update({
        'age_years': number('Age', 'years', 60),
        'treatment_delay_days': number('Delay due to haematological toxicity', 'days'),
        'febrile_neutropenia_occurrences': select('Prior febrile-neutropenia occurrences', [(0,'None'),(1,'First'),(2,'Second or later')]),
        'lvef_reduction_gt20_source_confirmed': boolean('Clinician confirms the source criterion “> 20% reduction in baseline LVEF” is met (definition reviewed)'),
        'other_nonhaem_toxicity_grade': grade('Current relevant non-haematological toxicity'),
        'prior_nonhaem_grade3_or4': boolean('This toxicity reached grade 3–4 during the preceding treatment'),
    })
    x.rule('COUNTS_DELAY', anyof(c('anc','<',1),c('platelets','<',100)), 'delay', 'ANC < 1 or platelets < 100 ×10⁹/L: delay one week or until recovery. Both counts are required to assess recovery.', page=2,section='Table 2')
    x.rule('DELAY_GT14', c('treatment_delay_days','>',14), 'consultant_review', 'Delay exceeding two weeks: consider one dose-level reduction or discontinuation; review the reason, recovery and current dose.', page=2,section='Table 2')
    x.rule('FN_FIRST', c('febrile_neutropenia_occurrences','==',1), 'consultant_review', 'After the first febrile-neutropenia occurrence, consider G-CSF for subsequent cycles; confirm infection and count recovery.', page=2,section='Table 2')
    x.rule('FN_SECOND', c('febrile_neutropenia_occurrences','>=',2), 'consultant_review', 'After the second occurrence, reduce one dose level. Source levels are 75 → 60 → 50 mg/m², then discontinue; confirm the current level.', page=2,section='Tables 1–2')
    x.rule('AGE_GT70', c('age_years','>',70), 'consultant_review', 'For patients over 70 years the source advises considering doxorubicin 60 mg/m²; individual suitability and current dose require review.', page=1,section='Treatment table footnote')
    x.rule('ON_TREATMENT_LVEF_LT45', allof(anyof(c('assessment_phase','==','on_treatment'),c('assessment_phase','==','day1'),c('assessment_phase','==','recovery')),c('lvef_percent','<',45)), 'permanently_discontinue', 'During treatment, absolute LVEF < 45% meets the source discontinuation criterion for doxorubicin.', page=3,section='Table 4')
    x.rule('LVEF_DROP_CONFIRMED', c('lvef_reduction_gt20_source_confirmed','==',True), 'permanently_discontinue', 'The source criterion “> 20% reduction in baseline LVEF” has been clinically confirmed: discontinue doxorubicin. The wording does not specify relative percentage versus percentage points; this system does not calculate an assumed conversion.', page=3,section='Table 4')
    x.rule('NONHAEM_ACTIVE', c('other_nonhaem_toxicity_grade','>=',3), 'withhold', 'Grade 3–4 non-haematological toxicity: withhold until grade ≤ 1, then consider one dose-level reduction or discontinuation.', page=3,section='Table 4')
    x.rule('NONHAEM_NOT_RECOVERED', allof(c('prior_nonhaem_grade3_or4','==',True), c('other_nonhaem_toxicity_grade','>',1)), 'withhold', 'Previous grade 3–4 toxicity has not recovered to grade ≤ 1; continue withholding.', page=3,section='Table 4')
    x.rule('NONHAEM_RECOVERED', allof(c('prior_nonhaem_grade3_or4','==',True),c('other_nonhaem_toxicity_grade','<=',1)), 'consultant_review', 'Following recovery to grade ≤ 1, consider one dose-level reduction or discontinuation. Confirm current dose level; no automatic restart.', page=3,section='Tables 1 and 4')
    x.notes += ['LVEF < 50% is a baseline exclusion; the on-treatment discontinuation table uses < 45%.', 'The source’s > 20% reduction in baseline LVEF wording requires clinical definition; no automatic percentage-point conversion is encoded.', 'Dose levels: 75, 60, 50 mg/m², then discontinue; this is not repeated multiplication of the current dose.']
    return x.finish('Doxorubicin 75 mg/m² IV bolus on Day 1 every 21 days, for 3–6 cycles.', {'minimum_cycles':3,'maximum_cycles':6},
      ['Baseline full blood count, renal/liver profile, ECG and oral/pharyngeal assessment.', 'ECHO/MUGA if age > 65 or clinically indicated; source baseline LVEF ≥ 50%.', 'Full blood count and renal/liver profile before each cycle; oral and cardiac assessment as indicated; review lifetime anthracycline exposure.'],
      ['High emetogenic risk: antiemetics according to current local/NCCP guidance.', 'No usual regimen-specific premedication. Mouth-care advice.', 'Consider G-CSF after the first febrile-neutropenia episode, with review of recovery and subsequent dose levels.'],
      ['Locally advanced unresectable or metastatic soft-tissue sarcoma.', 'ECOG 0–2; adequate hepatic, renal and bone-marrow function.'],
      ['Hypersensitivity to doxorubicin or excipients.', 'Congestive heart failure (LVEF < 50%) or other significant heart disease.', 'Pregnancy or breastfeeding.'])

def combo(code):
    x=Protocol(code); x.common(1,2); doxorubicin(x,True)
    x.inputs.update({
      'prior_anc_nadir': number('Lowest neutrophil count during the previous cycle','×10⁹/L',2),
      'prior_neutropenic_fever': boolean('Neutropenic fever occurred during that previous-cycle nadir'),
      'ast_u_l': number('AST — absolute result','U/L',20),
      'mucositis_grade': grade('Mucositis','mucositis'),
      'neurotoxicity_grade': grade('Ifosfamide-associated neurotoxicity','neurological'),
      'suspected_ifosfamide_encephalopathy': boolean('Suspected ifosfamide encephalopathy or new cognitive change'),
      'haematuria': boolean('Haematuria or suspected urotoxicity'),
      'mesna_plan_confirmed': boolean('Mesna prescription, timing and post-ifosfamide coverage confirmed'),
      'hydration_plan_confirmed': boolean('Hydration and fluid-balance prescription confirmed'),
      'gcsf_prophylaxis_planned': boolean('Required G-CSF prophylaxis arranged'),
      'ppi_prophylaxis_planned': boolean('Proton-pump inhibitor prophylaxis arranged'),
      'urine_output_ml_hour': number('Urine output','mL/hour',100),
      'aprepitant_planned': boolean('Aprepitant included in the antiemetic plan'),
    })
    countpage=2 if code=='00391' else 3
    x.rule('COUNTS_DELAY',anyof(c('anc','<',1),c('platelets','<',70)),'delay','ANC < 1 or platelets < 70 ×10⁹/L: delay treatment and reassess. The intermediate-dose row does not override a low second count.',page=countpage,section='Table 1')
    op='<=' if code=='00391' else '<'
    x.rule('COUNTS_80_REVIEW',anyof(allof(c('anc','>=',1),c('anc',op,1.5)),allof(c('platelets','>=',70),c('platelets',op,100))), 'consultant_review', 'The source intermediate count row specifies 80% doxorubicin and ifosfamide. ' + ('ANC 1–1.5 or platelets 70–100 are inclusive; full-dose boundaries are strictly > 1.5 and > 100.' if code=='00391' else 'ANC 1–< 1.5 or platelets 70–< 100; full-dose boundaries are ≥ 1.5 and ≥ 100.') + ' Confirm both counts and dose history; any delay criterion takes precedence.',page=countpage,section='Table 1')
    x.rule('PRIOR_FN_80_REVIEW',allof(c('prior_anc_nadir','<',.5),c('prior_neutropenic_fever','==',True)), 'consultant_review','Previous ANC nadir < 0.5 ×10⁹/L WITH neutropenic fever: source specifies 80% doxorubicin and ifosfamide. Confirm current recovery and dose history; this history is distinct from current ANC or active infection.',page=countpage,section='Table 1')
    x.rule('IFO_RENAL_LT50',c('crcl_ml_min','<',50),'withhold','Ifosfamide is not recommended at CrCl < 50 mL/min; specialist review of alternatives.', ['ifosfamide'],3,'Table 2')
    x.rule('IFO_RENAL_EXACT50',c('crcl_ml_min','==',50),'consultant_review','The ifosfamide renal table prints > 50 and < 50 mL/min; exactly 50 is unallocated. Do not round into automatic dosing.',['ifosfamide'],3,'Table 2')
    x.rule('IFO_HAEMODIALYSIS',c('haemodialysis','==',True),'withhold','Ifosfamide is not recommended on haemodialysis. Doxorubicin has a separate dialysis review branch.',['ifosfamide'],3,'Table 2')
    x.rule('IFO_SEVERE_HEPATIC',c('hepatic_impairment_severity','==','severe'),'withhold','Ifosfamide is not recommended in severe hepatic impairment because efficacy may be reduced.',['ifosfamide'],3,'Table 2')
    x.rule('IFO_AST_BILI_CLINICAL_CHOICE',anyof(c('ast_u_l','>',300),c('bilirubin_umol_l','>',51.3)),'consultant_review','Some clinicians consider a 25% ifosfamide reduction if AST > 300 U/L or bilirubin > 51.3 µmol/L. This is an individual clinical decision; severe hepatic impairment remains not recommended.',['ifosfamide'],3,'Table 2')
    adversepage=3 if code=='00391' else 4
    x.rule('MUCOSITIS_80_REVIEW',c('mucositis_grade','>=',3),'consultant_review','Grade ≥ 3 mucositis: reduce doxorubicin and ifosfamide to 80% according to the source. Confirm current toxicity, recovery and prescription; the source does not supply a numerical recovery grade for this row.',page=adversepage,section='Table 3')
    x.rule('IFO_NEUROTOXICITY_STOP',c('neurotoxicity_grade','>=',3),'permanently_discontinue','Grade ≥ 3 neurotoxicity: discontinue ifosfamide. This does not automatically discontinue doxorubicin.',['ifosfamide'],adversepage,'Table 3')
    x.rule('IFO_ENCEPHALOPATHY_REVIEW',c('suspected_ifosfamide_encephalopathy','==',True),'withhold','Withhold further ifosfamide and assess urgently for encephalopathy; grade the event and review contributing medicines/organ function.',['ifosfamide'],4,'Ifosfamide encephalopathy',True)
    x.rule('IFO_HAEMATURIA',c('haematuria','==',True),'withhold','Haematuria requires urotoxicity assessment before further ifosfamide and review of mesna, hydration and urine monitoring.',['ifosfamide'],5,'Renal and urotoxicity',True)
    for f,label in [('mesna_plan_confirmed','mesna'),('hydration_plan_confirmed','hydration'),('gcsf_prophylaxis_planned','G-CSF'),('ppi_prophylaxis_planned','proton-pump inhibitor')]:
        x.rule(f.upper()+'_REVIEW',c(f,'==',False),'consultant_review',f'The source includes {label} support. Confirm the prescribed regimen and timing before treatment; no product or dose is inferred where the source gives none.',components=['ifosfamide'] if f in ['mesna_plan_confirmed','hydration_plan_confirmed'] else x.drugs,page=(2 if code=='00392' else 1) if f in ['mesna_plan_confirmed','hydration_plan_confirmed'] else 4,section='Treatment / supportive care')
    x.rule('IFO_URINE_OUTPUT',c('urine_output_ml_hour','<',100),'consultant_review','Source target urine output is at least 100 mL/hour. Assess fluid balance, renal function and the prescribed hydration plan; do not give an automatic fluid or diuretic dose.',['ifosfamide'],2 if code=='00392' else 1,'Hydration footnote')
    x.rule('APREPITANT_INTERACTION',c('aprepitant_planned','==',True),'consultant_review','Aprepitant may increase ifosfamide neurotoxicity/encephalopathy risk; review the antiemetic prescription and monitoring with oncology pharmacy.',['ifosfamide'],4,'Antiemetics / drug interactions')
    x.notes += ['CrCl exactly 50 mL/min is not assigned an ifosfamide dose by the printed table.', 'Current treatment-day counts and previous-cycle nadir with neutropenic fever are assessed separately.', 'Mucositis affects both cytotoxic components; grade ≥ 3 neurotoxicity stops ifosfamide only.', 'Source full-dose count thresholds differ between 00391 (> 1.5/> 100) and 00392 (≥ 1.5/≥ 100); do not copy one table to the other.']
    dose=20 if code=='00391' else 25
    setting='Advanced unresectable or metastatic soft-tissue sarcoma.' if code=='00391' else 'Neoadjuvant treatment of high-risk soft-tissue sarcoma, or advanced unresectable/metastatic soft-tissue sarcoma.'
    return x.finish(f'Doxorubicin {dose} mg/m²/day IV bolus and ifosfamide 3000 mg/m²/day IV over 3 hours on Days 1–3, every 21 days for up to 6 cycles; mesna and hydration are integral.',{'maximum_cycles':6},
      ['Baseline full blood count, renal/liver profile and ECG; ECHO/MUGA if age > 65 or clinically indicated; source baseline LVEF > 50%.', 'Full blood count and renal/liver profile before each cycle.', 'Neurological assessment before each ifosfamide dose. Check for haematuria before each dose and every 8 hours on treatment days.', 'Monitor urine output, fluid balance and weight; target urine output ≥ 100 mL/hour. Review cardiac function/lifetime anthracycline exposure as indicated.'],
      ['G-CSF is required; prescribe the product, dose and timing using local policy.', 'Proton-pump inhibitor prophylaxis is specified; confirm the local prescription.', 'Mesna: 900 mg/m² IV before the first ifosfamide dose on Day 1, then 3000 mg/m² by continuous 24-hour infusion on Days 1–3. Confirm coverage continuing for 24 hours after ifosfamide is completed, as stated in source prose.', 'Hydration source example: 1000 mL sodium chloride 0.9% every 6 hours from before first ifosfamide until 24 hours after completion. Individualise for fluid status and renal/cardiac function.', 'Ifosfamide high and doxorubicin moderate emetogenic risk; review antiemetics and the aprepitant–ifosfamide encephalopathy interaction. No usual separate premedication.'],
      [setting,'ECOG 0–1; adequate hepatic, renal and bone-marrow function.'],['Hypersensitivity to regimen medicines/excipients.','Pregnancy or breastfeeding.'])

def gemdoc():
    x=Protocol('00501');x.common()
    x.inputs['assessment_phase']=select('Treatment-day / review stage',[('baseline','Before first treatment'),('day1','Day 1'),('day8','Planned Day 8'),('delayed_day8','Delayed Day-8 dose review'),('recovery','Toxicity / recovery review')])
    x.inputs.update({
      'cycle_day':number('Current day of this cycle','day',1),
      'febrile_neutropenia_this_cycle':boolean('Febrile neutropenia occurred during the current cycle'),
      'prior_fn_occurrences':select('Febrile-neutropenia occurrences in earlier completed cycles',[(0,'None'),(1,'First'),(2,'Second or later')]),
      'neuropathy_grade':grade('Peripheral neuropathy','peripheral_neuropathy'),
      'grade2_neuropathy_occurrence':select('Grade-2 neuropathy occurrence',[(0,'Not established'),(1,'First'),(2,'Second'),(3,'Third or later')]),
      'other_nonhaem_toxicity_grade':grade('Other current non-haematological toxicity; assess neuropathy separately'),
      'prior_nonhaem_grade3_or4':boolean('A relevant non-haematological toxicity, including neuropathy, previously reached grade 3–4'),
      'severe_cutaneous_reaction':boolean('Severe cutaneous reaction: SJS, TEN, DRESS or AGEP'),
      'suspected_drug_induced_pneumonitis':boolean('Suspected gemcitabine-induced pneumonitis'),
      'severe_docetaxel_hypersensitivity':boolean('Severe docetaxel hypersensitivity during or before this assessment'),
      'docetaxel_premed_doses_taken':number('Dexamethasone doses taken before docetaxel','doses',3),
      'dexamethasone_contraindicated':boolean('Dexamethasone contraindicated or alternative premedication required'),
      'off_label_consent_confirmed':boolean('Off-label sarcoma use discussed and consented under hospital policy'),
    })
    for field,label in [('bilirubin_uln_multiple','Bilirubin'),('ast_uln_multiple','AST'),('alt_uln_multiple','ALT'),('alp_uln_multiple','ALP')]:
        x.inputs[field]=number(label+' relative to the local laboratory upper limit of normal','×ULN',1)
    # One entered absolute bilirubin result feeds the gemcitabine concentration
    # threshold and, with the actual local ULN, docetaxel's distinct ratio table.
    x.inputs['bilirubin_uln_multiple']['derived_actual_fields']={'bilirubin':'bilirubin_umol_l'}
    x.inputs['bilirubin_umol_l'].update(ui_derived_from='bilirubin_uln_multiple',visible=False)
    day1=anyof(c('assessment_phase','==','day1'),c('assessment_phase','==','baseline'))
    day8=anyof(c('assessment_phase','==','day8'),c('assessment_phase','==','delayed_day8'))
    # Both possible treatment days require at least these counts. A recovery or
    # missing-stage selection cannot suppress an independently actionable hold.
    x.rule('MINIMUM_COUNTS_DELAY',anyof(c('anc','<',1),c('platelets','<',75)),'delay','ANC <1 or platelets <75 ×10⁹/L are below the minimum for either Day 1 or Day 8. Delay treatment and assess recovery; an unspecified day or recovery-review stage does not remove this restriction.',page=2,section='Table 2')
    x.rule('RECOVERY_DAY_CONTEXT_REQUIRED',c('assessment_phase','==','recovery'),'consultant_review','A recovery review is not a treatment-day prescription. Confirm whether the next intended dose is Day 1, planned Day 8 or a delayed Day-8 dose; the platelet thresholds and timing differ.',page=2,section='Table 2',precaution=True)
    x.rule('COUNT_DAY_CONTEXT_REQUIRED',allof(anyof(c('assessment_phase','missing'),c('assessment_phase','==','recovery')),c('platelets','>=',75),c('platelets','<',100)),'consultant_review','Platelets 75–<100 ×10⁹/L may satisfy the Day-8 count criterion but do not satisfy Day 1. Confirm the intended treatment day; do not infer clearance from this count alone.',page=2,section='Table 2')
    x.rule('PLANNED_DAY_MISMATCH_REVIEW',anyof(allof(c('assessment_phase','==','day1'),c('cycle_day','!=',1)),allof(c('assessment_phase','==','day8'),c('cycle_day','!=',8)),allof(c('assessment_phase','==','delayed_day8'),c('cycle_day','<=',8))),'consultant_review','The selected treatment-day pathway and entered cycle day do not agree. Reconcile the actual cycle calendar and any delayed-dose plan before prescribing; no catch-up dose is inferred.',page=2,section='Treatment schedule and Table 2',precaution=True)
    x.rule('DAY1_COUNTS_DELAY',allof(day1,anyof(c('anc','<',1),c('platelets','<',100))),'delay','Day 1 ANC < 1 or platelets < 100 ×10⁹/L: delay one week or until recovery. Day-8 thresholds must not be used to start a cycle.',page=2,section='Table 2')
    x.rule('DAY8_COUNTS_DELAY',allof(day8,anyof(c('anc','<',1),c('platelets','<',75))),'delay','Day 8 ANC < 1 or platelets < 75 ×10⁹/L: delay one week. If sufficient recovery by Day 15, gemcitabine/docetaxel may be given, with a dose-level reduction for subsequent cycles.',page=2,section='Table 2')
    x.rule('DELAYED_DAY8_REVIEW',c('assessment_phase','==','delayed_day8'),'consultant_review','This is review of a delayed Day-8 dose, not an additional routine Day-15 dose. Confirm recovery of both counts, cycle day, toxicities and the subsequent-cycle dose-level reduction.',page=2,section='Table 2')
    x.rule('DELAYED_DAY8_AFTER15',allof(day8,c('cycle_day','>',15)),'withhold','The source delayed Day-8 pathway only describes sufficient recovery by Day 15. Beyond that point, obtain a new specialist plan, including when the form still says planned Day 8; do not automatically administer the missed dose.',page=2,section='Table 2',precaution=True)
    x.rule('FN_CURRENT_CYCLE',c('febrile_neutropenia_this_cycle','==',True),'withhold','After febrile neutropenia, hold the remainder of the current cycle; consider G-CSF for subsequent cycles and confirm recovery.',page=2,section='Table 2')
    x.rule('FN_PRIOR_FIRST',c('prior_fn_occurrences','==',1),'consultant_review','Prior first febrile-neutropenia occurrence: consider G-CSF in subsequent cycles. A completed earlier cycle does not itself trigger an indefinite current-cycle hold.',page=2,section='Table 2')
    x.rule('FN_PRIOR_SECOND',c('prior_fn_occurrences','>=',2),'consultant_review','After the second occurrence, consider one dose-level reduction. Confirm recovery and current dose levels: gemcitabine 675→540→450 mg/m²; docetaxel 75→60→50 mg/m²; then discontinue.',page=2,section='Tables 1–2')
    x.rule('GEM_BILIRUBIN_GE27',c('bilirubin_umol_l','>=',27),'consultant_review','Gemcitabine at bilirubin ≥ 27 µmol/L: consider starting at 80% of the original dose and escalating if tolerated, OR full dose with active monitoring. This regimen starts at 675 mg/m²; an 800 mg/m² starting dose is not this source pathway. Consultant/pharmacy must choose the approach.',['gemcitabine'],3,'Table 3')
    x.rule('GEM_CRCL_EXACT30',c('crcl_ml_min','==',30),'consultant_review','The gemcitabine table prints CrCl > 30 and < 30 mL/min without an exact 30 row; obtain source-boundary review.',['gemcitabine'],3,'Table 3')
    x.rule('GEM_HAEMODIALYSIS',c('haemodialysis','==',True),'consultant_review','No gemcitabine dose adjustment is expected in the source haemodialysis row, with dialysis 6–12 hours after administration. Confirm the individual renal prescription and timing.',['gemcitabine'],3,'Table 3')
    abnormal=anyof(*(c(f,'>',1) for f in ['bilirubin_uln_multiple','ast_uln_multiple','alt_uln_multiple','alp_uln_multiple']))
    x.rule('DOC_HEPATIC_PATTERN_REVIEW',abnormal,'consultant_review','Review all bilirubin, AST, ALT and ALP results together for docetaxel. The source hepatic table contains an ambiguous bilirubin range and AND/OR grouping, so no automatic numeric docetaxel dose is emitted. Confirm the actual table pattern and obtain oncology-pharmacy clarification.',['docetaxel'],3,'Table 3')
    firstrow=allof(c('bilirubin_uln_multiple','<=',1), c('ast_uln_multiple','<=',5), c('alt_uln_multiple','<=',5), anyof(c('ast_uln_multiple','>',1.5),c('alt_uln_multiple','>',1.5)),c('alp_uln_multiple','>',2.5),c('alp_uln_multiple','<=',5))
    x.rule('DOC_HEPATIC_FIRST_ROW_REVIEW',firstrow,'consultant_review','The complete first hepatic pattern (normal bilirubin, AST and/or ALT > 1.5 to 5×ULN, ALP > 2.5 to 5×ULN) permits consideration of 75% of the original docetaxel dose. Confirm the source pattern and prescription; no numeric dose is calculated. The separate ambiguous second row is not inferred from this rule.',['docetaxel'],3,'Table 3')
    x.rule('DOC_HEPATIC_HIGH_REVIEW',anyof(c('bilirubin_uln_multiple','>',1.5),c('ast_uln_multiple','>',10),c('alt_uln_multiple','>',10),c('alp_uln_multiple','>',6)),'withhold','High liver-test values intersect the source not-recommended region. Withhold docetaxel pending specialist review of the combined pattern; the ambiguous AND/OR row is not converted into an invented independent numerical contraindication.',['docetaxel'],3,'Table 3',True)
    x.rule('DOC_ALP_EXACT6',c('alp_uln_multiple','==',6),'consultant_review','The source prints ALP < 6 in one hepatic row and > 6 in another; exactly 6×ULN is unallocated. No automatic numeric docetaxel dose.',['docetaxel'],3,'Table 3')
    x.rule('NEUROPATHY_G2_LEVEL',allof(c('neuropathy_grade','==',2),anyof(c('grade2_neuropathy_occurrence','==',1),c('grade2_neuropathy_occurrence','==',2))),'consultant_review','First and second grade-2 peripheral-neuropathy occurrences each require one dose-level reduction of BOTH gemcitabine and docetaxel. Confirm prior reductions and the current dose level.',page=3,section='Table 4')
    x.rule('NEUROPATHY_G2_HISTORY',allof(c('neuropathy_grade','==',2),anyof(c('grade2_neuropathy_occurrence','missing'),c('grade2_neuropathy_occurrence','==',0),c('grade2_neuropathy_occurrence','>=',3))),'consultant_review','Grade-2 neuropathy requires occurrence and dose-history review. The source explicitly lists first and second occurrences; do not invent a later recurrence algorithm.',page=3,section='Table 4')
    x.rule('NONHAEM_ACTIVE',anyof(c('other_nonhaem_toxicity_grade','>=',3),c('neuropathy_grade','>=',3)),'withhold','Grade ≥ 3 non-haematological toxicity: hold until grade ≤ 1, then reduce by one dose level. Identify and grade the event; component-specific permanent-stop rules take precedence.',page=3,section='Table 4')
    x.rule('NONHAEM_NOT_RECOVERED',allof(c('prior_nonhaem_grade3_or4','==',True),anyof(c('other_nonhaem_toxicity_grade','>',1),c('neuropathy_grade','>',1))),'withhold','After a previous grade 3–4 non-haematological event, neuropathy or another relevant toxicity remains above grade 1. Continue withholding and reconcile the event history; normal other-toxicity grading does not establish neuropathy recovery.',page=3,section='Table 4')
    x.rule('NONHAEM_RECOVERY_UNKNOWN',allof(c('prior_nonhaem_grade3_or4','==',True),anyof(c('other_nonhaem_toxicity_grade','missing'),c('neuropathy_grade','missing'))),'withhold','Recovery from the previous severe non-haematological event is not documented across the relevant domains. Assess neuropathy and other current toxicity explicitly; an omitted grade is not grade 0 or recovery.',page=3,section='Table 4',precaution=True)
    x.rule('NONHAEM_RECOVERED',allof(c('prior_nonhaem_grade3_or4','==',True),c('other_nonhaem_toxicity_grade','<=',1),c('neuropathy_grade','<=',1)),'consultant_review','Neuropathy and other relevant non-haematological toxicity are both documented at grade ≤1. Review the previous event and one dose-level reduction, then confirm the prescription; no automatic restart.',page=3,section='Tables 1 and 4')
    x.rule('GEM_SCAR_STOP',c('severe_cutaneous_reaction','==',True),'permanently_discontinue','SJS, TEN, DRESS or AGEP: discontinue gemcitabine and obtain urgent clinical assessment.',['gemcitabine'],3,'Table 4')
    x.rule('GEM_PNEUMONITIS_STOP',c('suspected_drug_induced_pneumonitis','==',True),'permanently_discontinue','Suspected drug-induced pneumonitis: discontinue gemcitabine and assess urgently.',['gemcitabine'],4,'Gemcitabine pulmonary toxicity')
    x.rule('DOC_SEVERE_HYPERSENSITIVITY_STOP',c('severe_docetaxel_hypersensitivity','==',True),'permanently_discontinue','Severe hypersensitivity: stop docetaxel immediately and do not rechallenge; provide urgent clinical treatment.',['docetaxel'],5,'Docetaxel hypersensitivity')
    x.rule('DOC_PREMED_REVIEW',anyof(c('docetaxel_premed_doses_taken','<',3),c('dexamethasone_contraindicated','==',True)),'consultant_review','Source dexamethasone 8 mg orally twice daily for 3 days begins the day before docetaxel (Day 7); at least 3 doses before docetaxel unless contraindicated. Review incomplete dosing or an alternative plan with the prescriber before infusion.',['docetaxel'],4,'Premedication')
    x.rule('OFF_LABEL_CONSENT',allof(c('assessment_phase','==','baseline'),absent_or_false('off_label_consent_confirmed')),'consultant_review','Gemcitabine/docetaxel for sarcoma is off-label in this source. Discuss and document consent and local hospital/DTC arrangements before starting.',page=6,section='Disclaimer / off-label use')
    x.notes += ['Day 1 requires ANC ≥ 1 and platelets ≥ 100; Day 8 requires ANC ≥ 1 and platelets ≥ 75 ×10⁹/L. A delayed Day 8 dose by Day 15 is not a routine third dose.', 'Docetaxel Table 3 has a printed bilirubin range < 1–1.5×ULN with mixed AND/OR wording; ALP=6 is unallocated. No numeric docetaxel dose is calculated from these rows.', 'Gemcitabine hepatic options at bilirubin ≥ 27 µmol/L are 80% of the original 675 mg/m² dose with possible escalation, or full dose with active monitoring; no imported 800 mg/m² dose.', 'Grade 2 neuropathy first/second occurrences modify BOTH medicines. SCAR and suspected pneumonitis stop gemcitabine; severe docetaxel hypersensitivity stops docetaxel with no rechallenge.']
    return x.finish('Gemcitabine 675 mg/m² IV over 90 minutes on Days 1 and 8; docetaxel 75 mg/m² IV over 60 minutes on Day 8. Repeat every 21 days for up to 6 cycles.',{'maximum_cycles':6},
      ['Baseline full blood count, renal/liver and bone profiles.', 'Full blood count and renal/liver profile before each cycle; confirm separate Day 1/Day 8 count thresholds before dosing.', 'Assess neuropathy, skin reactions, pulmonary symptoms, fluid retention, infection, renal function and liver tests; review docetaxel premedication before Day 8.'],
      ['Dexamethasone 8 mg orally twice daily for 3 days starting Day 7 (the day before docetaxel); minimum 3 pretreatment doses unless contraindicated. Confirm the prescription and report missed doses.', 'G-CSF may be used according to local policy; this source does not mandate it for every cycle.', 'Both medicines are low emetogenic risk; use the current prescribed antiemetic plan.'],
      ['Locally advanced unresectable or metastatic soft-tissue sarcoma; off-label use requires discussion and documented consent under hospital policy.', 'ECOG 0–2; adequate marrow, renal and hepatic function.'],['Hypersensitivity to regimen medicines/excipients.','Pregnancy or breastfeeding.'])

def dtic():
    x=Protocol('00511');x.common()
    x.inputs.update({
      'baseline_leukopenia_or_thrombocytopenia':boolean('Baseline leukopenia or thrombocytopenia (source exclusion)'),
      'severe_renal_disease':boolean('Severe kidney disease (clinically assessed source exclusion)'),
      'prior_neutropenic_sepsis_admission':boolean('Admitted with neutropenic sepsis during the previous interval'),
    })
    x.rule('BASELINE_CYTOPENIA_EXCLUSION',allof(c('assessment_phase','==','baseline'),c('baseline_leukopenia_or_thrombocytopenia','==',True)),'contraindicated','Leukopenia or thrombocytopenia is listed as an exclusion. The source does not provide numerical baseline eligibility thresholds; do not borrow the on-treatment 80% row to establish eligibility.',page=1,section='Exclusions')
    x.rule('SEVERE_ORGAN_EXCLUSION',anyof(c('severe_renal_disease','==',True),c('hepatic_impairment_severity','==','severe')),'contraindicated','Severe liver or kidney disease is a source exclusion. Reconcile the treatment choice with the organ-function table before prescribing.',page=1,section='Exclusions')
    x.rule('COUNTS_DELAY',anyof(c('anc','<',1),c('platelets','<',70)),'delay','ANC < 1 or platelets < 70×10⁹/L: delay one week and reassess. Baseline suitability must also be assessed separately.',page=2,section='Table1')
    intermediate=anyof(allof(c('anc','>=',1),c('anc','<',1.5)),allof(c('platelets','>=',70),c('platelets','<',100)))
    x.rule('COUNTS_80_REVIEW',allof(anyof(c('assessment_phase','==','day1'),c('assessment_phase','==','on_treatment'),c('assessment_phase','==','recovery')),intermediate),'consultant_review','On-treatment ANC 1–< 1.5 or platelets 70–< 100×10⁹/L: source specifies 80% dose. Check both counts; any delay row takes precedence. Confirm current dose history.',page=2,section='Table1')
    x.rule('BASELINE_COUNTS_REVIEW',allof(c('assessment_phase','==','baseline'),intermediate),'consultant_review','Baseline leukopenia/thrombocytopenia is excluded in the source without numerical definitions. These counts require suitability review; the on-treatment 80% row is not baseline clearance.',page=1,section='Exclusions versus Table1')
    x.rule('PRIOR_SEPSIS_80_PREVIOUS',c('prior_neutropenic_sepsis_admission','==',True),'consultant_review','After admission with neutropenic sepsis in the previous interval, reduce to 80% of the PREVIOUS dose. This is distinct from 80% of the original dose and from uncomplicated fever alone; confirm recovery and dose history.',page=2,section='Table1')
    nohd=c('haemodialysis','==',False)
    for id,cond,msg in [
      ('DTIC_RENAL_45_60',allof(c('crcl_ml_min','>',45),c('crcl_ml_min','<=',60)),'CrCl > 45–60 mL/min: source 45–60 row specifies 80% dose; confirm suitability and current prescription.'),
      ('DTIC_RENAL_30_45',allof(c('crcl_ml_min','>=',30),c('crcl_ml_min','<',45)),'CrCl 30–< 45 mL/min: source 30–45 row specifies 75% dose; confirm suitability and current prescription.'),
      ('DTIC_RENAL_LT30',c('crcl_ml_min','<',30),'CrCl < 30 mL/min: source table lists 70%, but severe kidney disease is also excluded. Reconcile eligibility and severity with consultant/pharmacy; no automatic dose or treatment clearance.'),
      ('DTIC_RENAL_EXACT45',c('crcl_ml_min','==',45),'CrCl exactly 45 mL/min appears in both printed 45–60 (80%) and 30–45 (75%) rows. Obtain clarification; do not choose an automatic percentage.'),
    ]:
        x.rule(id,allof(nohd,cond),'consultant_review',msg,page=2,section='Table2')
    x.rule('DTIC_DIALYSIS_STATUS_MISSING',allof(c('haemodialysis','missing'),c('crcl_ml_min','<=',60)),'consultant_review','Confirm dialysis status before applying the dacarbazine renal table. No haemodialysis dose is provided by this source.',page=2,section='Table2')
    x.rule('DTIC_HAEMODIALYSIS',c('haemodialysis','==',True),'consultant_review','The source does not give a haemodialysis dose or timing. Do not extend the CrCl < 30 (70%) row to dialysis; obtain a specialist renal prescription.',page=2,section='Table2')
    x.rule('DTIC_HEPATIC_REVIEW',anyof(c('hepatic_impairment_severity','==','mild'),c('hepatic_impairment_severity','==','moderate')),'consultant_review','Dacarbazine can be hepatotoxic; the source advises considering dose reduction without specifying a percentage. Confirm severity and current liver results.',page=2,section='Table2')
    x.notes += ['Source title/treatment table specify 1.2 g/m²; a header prints 1.2 mg/m². Use the treatment table, retain the discrepancy for independent review.', 'Source indication is metastatic soft-tissue sarcoma, but the printed ICD codeC 43 is inconsistent with this description; no unsupported ICD recoding.', 'CrCl 45 mL/min overlaps two renal rows; haemodialysis has no source dose. The < 30 row does not override the severe-kidney-disease exclusion.', 'Current catalogue-linked v 2 was reviewed 10 March 2021 and lists review due 10 March 2026, already elapsed at retrieval; current listing is not proof of a new review.']
    return x.finish('Dacarbazine 1.2 g/m² IV over 1 hour on Day 1 every 21 days, for 4 cycles or until disease progression or unacceptable toxicity. Protect the infusion from light.',{'planned_cycles':4},
      ['Full blood count and renal/liver profile at baseline and before each treatment.', 'Assess infection, marrow suppression and hepatic/renal toxicity; review prescribed dose after any neutropenic-sepsis admission.'],
      ['High emetogenic risk: prescribed prophylactic and breakthrough antiemetics.', 'No usual regimen-specific premedication or other specific supportive medicine is listed.', 'Protect dacarbazine solution from light during administration. Avoid alcohol and review hepatotoxic medicines and phenytoin interactions.'],
      ['Metastatic soft-tissue sarcoma.','ECOG0–2.'],['Hypersensitivity to dacarbazine/excipients.','Pregnancy or breastfeeding.','Leukopenia, thrombocytopenia, or severe liver/kidney disease.'])

if __name__ == '__main__':
    report=[mono(),combo('00391'),combo('00392'),gemdoc(),dtic()]
    print(json.dumps({'release':RELEASE,'protocols':report,'status':'source_content_draft_pending_independent_review'},indent=2))
