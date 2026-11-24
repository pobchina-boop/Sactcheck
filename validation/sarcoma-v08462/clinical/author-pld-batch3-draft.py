#!/usr/bin/env python3
"""External review drafts for NCCP 00205/00462; never writes application files.

The source tables were reconciled against current extracted web text. PDF binary
retrieval and visual table inspection are unverified. Common PLD statements are
reused only after separate confirmation in each source; count tables stay separate.
"""
import copy
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent / 'Sactcheck'
SOURCES = HERE.parent / 'sarcoma-batch3-sources-20261118'
OUT = HERE / 'pld-protocols'
OUT.mkdir(exist_ok=True)
DATE = '2026-11-18'
EMA = 'https://www.ema.europa.eu/en/documents/product-information/caelyx-pegylated-liposomal-epar-product-information_en.pdf'
COMP = 'pegylated_liposomal_doxorubicin'
PATHS = {'00205': 'protocols/breast/00205-pegylated-liposomal-doxorubicin.json',
         '00462': 'protocols/sarcoma/00462-pegylated-liposomal-doxorubicin-20-mg-m2-21-day.json'}
base = {c: json.loads((ROOT / p).read_text()) for c, p in PATHS.items()}
draft = copy.deepcopy(base)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
def f(field, op, value=None):
    x = {'field': field, 'operator': op}
    if op not in ('missing', 'exists'): x['value'] = value
    return x
def allof(*xs): return {'all': list(xs)}
def anyof(*xs): return {'any': list(xs)}
def between(field, lo, hi): return allof(f(field, '>=', lo), f(field, '<=', hi))
def boolean(label, demo=False):
    return {'label': label, 'type': 'boolean', 'required': False, 'demo_value': demo, 'input_role': 'decision'}
def number(label, unit='', demo=0):
    return {'label': label, 'type': 'number', 'required': False, 'min': 0, 'step': 0.01, 'unit': unit, 'demo_value': demo, 'input_role': 'decision'}
def source(code, page, ema=False):
    return {'document': 'EMA Caelyx pegylated liposomal SmPC' if ema else f'NCCP {code} Version {base[code]["metadata"]["nccp_version"]}',
            'url': EMA if ema else base[code]['metadata']['source_url'], 'page': page,
            'checked_date': DATE, 'evidence_kind': 'current_official_extracted_text; visual_table_inspection_unverified'}
def rule(code, rid, cond, kind, message, page, ema=False):
    return {'id': rid, 'priority': 40 if kind in ('discontinue', 'contraindicated') else 20,
            'when': cond, 'action': {'type': kind, 'components': [COMP], 'message': message,
            'recommendation': message, 'block_numeric_dose': True, 'dose_calculation': 'specialist_review', 'show_in_dose_actions': True},
            'source': source(code, page, ema), 'explanation': message}
def band(lo, hi, name):
    # A selected band may support a partial assessment, but contradictory data
    # never select a dose. Most restrictive evident restriction remains visible.
    return anyof(allof(between('bilirubin_umol_l', lo, hi), anyof(f('pld_bilirubin_band','missing'), f('pld_bilirubin_band','==',name))),
                 allof(f('bilirubin_umol_l','missing'), f('pld_bilirubin_band','==',name)))

# 00462: preserve its original identity and indication object, but replace its
# seventeen generic rules. These common rules were independently reconciled to
# 00462 pp1-4, not inferred from the 50mg/m2 regimen's dose or count criteria.
p = draft['00462']
exclude = {'PLD_ANC_SEVERE','PLD_PLATELETS_SEVERE','PLD_ANC_LOW','PLD_PLATELETS_LOW',
           'PLD_PAST_SEVERE_COUNTS','PLD_ECOG3_SARCOMA','PLD_ECOG3_CONTEXT',
           'PLD_HEP_CONCURRENT_20_50','PLD_HEP_CONCURRENT_51_86',
           'PLD_HEP_CURRENT_LOWER_20_50','PLD_HEP_CURRENT_LOWER_51_86',
           'OF590_00205_PLD_BILI_20_50','OF590_00205_PLD_BILI_51_86'}
p['input_definitions'] = copy.deepcopy(base['00205']['input_definitions'])
for key in ('indication_context', 'previous_severe_cytopenia'):
    p['input_definitions'].pop(key)
p['input_definitions']['current_pld_mg_m2']['demo_value'] = 20
p['input_definitions']['current_pld_mg_m2']['label'] = 'Current prescribed pegylated liposomal doxorubicin dose (mg/m²)'
p['input_definitions']['toxicity_delay_weeks']['options'][0]['label'] = '0: due day 1 of the prescribed 21 day cycle (14 days only if selected)'
p['rule_engine']['rules'] = [copy.deepcopy(r) for r in base['00205']['rule_engine']['rules'] if r['id'] not in exclude]
for r in p['rule_engine']['rules']:
    if r['source'].get('url') != EMA:
        r['source'] = source('00462', r['source'].get('page', '1–4'))
    if r['id'] == 'PLD_ECOG4':
        r['action']['message'] = 'ECOG above 3 is outside NCCP 00462 eligibility (0–3); Consultant review of the Kaposi indication is required.'
    # Source p1, not the p2 eligibility location of 00205.
    if r['id'] in ('PLD_ECOG4','PLD_HYPERSENSITIVITY'):
        r['source'] = source('00462','1 eligibility/exclusions; EMA SmPC 4.3 for peanut/soya' if r['id']=='PLD_HYPERSENSITIVITY' else '1 eligibility')
p['indications'][0].update({'code': '00462a', 'reimbursement_codes': ['00462a'],
    'description': 'AIDS-related Kaposi sarcoma with CD4 <200 cells/mm³ and extensive mucocutaneous or visceral disease.',
    'ecog_range': [0,3], 'source_indication_id': '00462a'})
p['metadata']['indication'] = p['indications'][0]['description']
p['treatment'].update({'starting_dose_mg_m2': 20, 'days': [1], 'duration': 'Maximum 6 cycles, or earlier progression or unacceptable toxicity',
    'schedule_summary': 'Pegylated liposomal doxorubicin 20 mg/m² IV on day 1 every 21 days, maximum 6 cycles. A 14 day interval is a separately selected Consultant option for some patients.',
    'alternative_cycle_intervals': [{'cycle_length_days': 14, 'selection_required': True, 'note': 'NCCP p1: a 14 day cycle may be more appropriate in some patients; not concurrent with the 21 day calendar.'}]})
p['treatment_phases'] = [{'phase_id':'monotherapy', 'label':'Pegylated liposomal doxorubicin for AIDS-related Kaposi sarcoma',
    'name':'Pegylated liposomal doxorubicin', 'cycle_length_days':21, 'number_of_cycles':'Maximum 6',
    'administration':[{'drug':COMP,'dose':{'value':20,'unit':'mg/m2'},'day':1,'route':'IV infusion',
    'notes':'NCCP: first infusion 1 mg/min; later 60 minutes only if no reaction. Glucose 5% 250 mL, or 500 mL for total dose ≥90 mg; no in-line filter. Prior reaction pathway requires supervision: 5% over 15 min, double rate next 15 min if tolerated, remainder over 1 hour. Current EMA AIDS-KS section describes 30 min: reconcile this NCCP/SmPC difference locally before administration. A selected 14 day cycle is an alternative schedule; it does not add doses to this 21 day calendar.'}]}]
p['eligibility'] = ['AIDS-related Kaposi sarcoma with CD4 <200 cells/mm³ and extensive mucocutaneous or visceral disease (NCCP p1).', 'ECOG 0–3 (NCCP p1).']
p['exclusions'] = ['Hypersensitivity to pegylated liposomal doxorubicin or excipients (NCCP p1); EMA SmPC 4.3 specifically includes peanut/soya.',
    'EMA SmPC 4.3: not for AIDS-related Kaposi sarcoma effectively treatable with local therapy or systemic alfa-interferon. This is a product-specific restriction, distinct from NCCP eligibility.',
    'Do not substitute Myocet/non-pegylated or conventional doxorubicin for the pegylated liposomal formulation.']
p['monitoring'] = ['Baseline FBC, renal and liver profile, LDH, ECG and ECHO/MUGA LVEF (NCCP p2).',
    'Before each cycle: FBC, renal and liver profile; ECG monitoring. LDH, ECHO/MUGA and PPE assessment as clinically indicated (NCCP p2).',
    'LVEF assessment is mandatory before each additional administration exceeding lifetime cumulative anthracycline 450 mg/m²; this is not an automatic treatment stop (NCCP p4).',
    'Response assessment follows the Consultant plan. No universal CT interval or LDH threshold is specified. Review HIV treatment and opportunistic-infection care with the treating service.']
p['dose_modifications'] = ['NCCP Table 1: ANC ≥1 AND platelets ≥75 allow 100% from this domain. ANC 0.5–0.99 OR platelets 50–74 select the 50% row; ANC <0.5 OR platelets <50 delay. Fractional gaps (ANC >0.99 to <1; platelets >74 to <75) require interpretation.',
    'NCCP Table 2: renal/haemodialysis adjustment is not expected; bilirubin 20–50 µmol/L selects 75% of original dose; 51–86 selects 50% of original; >86 not recommended. The gap >50 to <51 is not interpolated.',
    'NCCP Table 3: PPE/stomatitis decisions depend jointly on current grade, prior grade 3–4 toxicity and 0/1/2 weeks delay. Grade 3–4 at two weeks leads to discontinuation; a later recovered grade must not erase that decision. Original/current dose and concurrent reasons require Consultant/pharmacy reconciliation; no automatic restart dose.']
p['supportive_care'].update({'mapping_source_url': p['metadata']['source_url'], 'source_url':p['metadata']['source_url'],
    'validation_status':'current_extracted_text_reconciled_pending_independent_review', 'premedication':'None usually required (NCCP p4); individualise after an infusion reaction.',
    'additional_supportive_care':['Low emetogenic potential; follow current NCCP/local antiemetic policy.',
    'PPE prevention for 4–7 days after treatment: cool hands/feet, avoid excessive heat/hot water and tight gloves, socks or shoes, following local advice.',
    'Anaphylaxis facilities are required. Prior reaction infusion changes require supervision and resolution of the active reaction.',
    'Coordinate HIV/antiretroviral and opportunistic-infection care with the treating team; this regimen does not specify universal primary G-CSF or antimicrobial prophylaxis.']})
p['input_definitions'].update({'cd4_cells_mm3':number('CD4 count for AIDS-related Kaposi indication','cells/mm³',100),
    'extensive_mucocutaneous_or_visceral_ks':boolean('Extensive mucocutaneous or visceral Kaposi sarcoma',True),
    'ks_effectively_treatable_local_or_interferon':boolean('AIDS-related Kaposi sarcoma effectively treatable with local therapy or systemic alfa-interferon'),
    'prior_count_related_dose_reduction':boolean('Previous PLD dose reduction for blood-count toxicity'),
    'completed_cycles':number('Completed cycles of this 00462 course','cycles',0),
    'selected_cycle_interval_days':{'label':'Prescribed cycle interval','type':'select','required':False,'options':[{'value':21,'label':'21 days (standard NCCP schedule)'},{'value':14,'label':'14 days (individually selected alternative)'}],'demo_value':21,'input_role':'decision'},
    'administration_source_reconciled':boolean('NCCP / current SmPC Kaposi infusion instructions reconciled by local oncology/pharmacy team')})
p['rule_engine']['rules'] += [
    rule('00462','KS_COUNTS_DELAY',anyof(f('anc_x10e9_l','<',.5),f('platelets_x10e9_l','<',50)),'delay','ANC <0.5 or platelets <50 ×10⁹/L: delay PLD under NCCP 00462 Table 1. A simultaneous intermediate value must not override this delay.','2 Table 1'),
    rule('00462','KS_COUNTS_50_REVIEW',anyof(between('anc_x10e9_l',.5,.99),between('platelets_x10e9_l',50,74)),'consultant_review','NCCP 00462 Table 1 selects 50% for ANC 0.5–0.99 or platelets 50–74. A lower second count still delays; unknown/gap values are not normal. Confirm the prescribed dose basis and previous reductions before calculating a dose.','2 Table 1'),
    rule('00462','KS_ANC_FRACTION_GAP',allof(f('anc_x10e9_l','>',.99),f('anc_x10e9_l','<',1)),'consultant_review','ANC >0.99 to <1 ×10⁹/L is between printed Table 1 bands. Do not round into the 50% or 100% row; obtain source interpretation.','2 Table 1'),
    rule('00462','KS_COUNTS_BOTH_RECOVERED',allof(f('anc_x10e9_l','>=',1),f('platelets_x10e9_l','>=',75)),'proceed_with_caution','Both counts meet the NCCP 00462 100% row. This is a count-domain result only: it does not authorise reversal of previous dose reductions or clear other unassessed domains.','2 Table 1'),
    rule('00462','KS_PRIOR_COUNT_REDUCTION',f('prior_count_related_dose_reduction','==',True),'consultant_review','A previous count-related reduction remains part of the prescription history after recovery. Confirm the intended current dose; the printed 100% row is not automatic re-escalation authority.','2 Table 1; prescription-history reconciliation'),
    rule('00462','KS_CD4_OUTSIDE_INDICATION',f('cd4_cells_mm3','>=',200),'consultant_review','CD4 ≥200 cells/mm³ is outside the <200 wording of the NCCP 00462 indication. Review the indication; do not infer eligibility from the regimen title alone.','1 indication'),
    rule('00462','KS_DISEASE_EXTENT',f('extensive_mucocutaneous_or_visceral_ks','==',False),'consultant_review','NCCP 00462 specifies extensive mucocutaneous or visceral AIDS-related Kaposi sarcoma. Confirm the indication and alternatives.','1 indication'),
    rule('00462','KS_LOCAL_THERAPY_RESTRICTION',f('ks_effectively_treatable_local_or_interferon','==',True),'contraindicated','EMA SmPC states Caelyx must not be used for AIDS-related Kaposi sarcoma effectively treatable with local therapy or systemic alfa-interferon; specialist review is required.','4.3',True),
    rule('00462','KS_COURSE_MAX6',f('completed_cycles','>=',6),'withhold','Six cycles have already been completed. NCCP 00462 specifies a maximum of six; do not automatically schedule a seventh cycle. Consultant review of any alternative plan is required.','1 treatment'),
    rule('00462','KS_SELECTED14',f('selected_cycle_interval_days','==',14),'consultant_review','A 14 day interval is an explicitly selected NCCP option for some patients. Confirm the alternative prescription and calendar; the standard dose display remains the 21 day reference, not an additional concurrent schedule.','1 treatment footnote'),
    rule('00462','KS_INFUSION_SOURCE_CONFLICT',allof(f('assessment_stage','exists'),anyof(f('administration_source_reconciled','missing'),f('administration_source_reconciled','==',False))),'consultant_review','NCCP 00462 uses first infusion 1 mg/min and later 60 minutes if tolerated; current EMA SmPC 4.2 specifies 30 minutes for AIDS-related Kaposi sarcoma. Oncology/pharmacy must reconcile the local administration plan; do not silently substitute either instruction.','1 administration; EMA SmPC 4.2')]

for code, p in draft.items():
    inp = p['input_definitions']; rules = p['rule_engine']['rules']
    inp['bilirubin_uln_multiple'].update({'label':'Bilirubin result (enter actual µmol/L; local ×ULN is derived separately)',
        'derived_actual_fields':{'bilirubin':'bilirubin_umol_l'},
        'assessment_guidance':'The NCCP dose table uses the entered absolute µmol/L value. A local ULN is used only for the separately displayed ratio; never assume ULN 20.'})
    inp['bilirubin_umol_l'].update({'ui_derived_from':'bilirubin_uln_multiple','visible':False})
    inp['crcl_ml_min']['renal_input']={'mode':'source_threshold_numeric','exact_value_required':False,
        'reason':'NCCP Table 2 expects no renal dose adjustment. This optional numerical entry supports renal review; the source does not provide a reduction threshold. Renal profile monitoring is still required.',
        'source_url':p['metadata']['source_url']}
    inp.update({'pld_discontinued_previously':boolean('PLD previously discontinued because of toxicity'),
        'grade3_4_toxicity_at_two_week_review':boolean('PPE or stomatitis was still grade 3–4 at the two-week delay review'),
        'restart_after_toxicity':boolean('Restart after a treatment delay or toxicity-related dose change is being considered'),
        'original_pld_mg_m2':number('Original prescribed PLD dose (confirm against prescription)','mg/m²',50 if code=='00205' else 20),
        'correct_pegylated_formulation':boolean('Correct pegylated liposomal doxorubicin formulation confirmed',True)})
    rules += [rule(code,'PLD_PRIOR_DISCONTINUATION',anyof(f('pld_discontinued_previously','==',True),f('grade3_4_toxicity_at_two_week_review','==',True)),'discontinue',
        'PLD has already met a discontinuation criterion or was discontinued. Later improvement to grade 0–2 must not erase that history or authorise automatic restart. Retain the discontinuation decision pending specialist reassessment.','3 Table 3; retained treatment history'),
        rule(code,'PLD_RESTART_HISTORY_REVIEW',f('restart_after_toxicity','==',True),'consultant_review',
        'Before any restart, reconcile the reason for delay, worst grade, grade at the two-week review, previous discontinuation, original/current dose, and all concurrent modifications. Grade 0 alone has no new numerical restart row in NCCP Table 3. A previous stop must remain visible.','2–3 Tables 1–3; restart history'),
        rule(code,'PLD_WRONG_FORMULATION',f('correct_pegylated_formulation','==',False),'withhold',
        'Do not administer until the pegylated liposomal formulation is confirmed. Myocet/non-pegylated and conventional doxorubicin are not interchangeable with this regimen.','1 formulation warning')]
    reference_dose=50 if code=='00205' else 20
    rules.append(rule(code,'PLD_ABOVE_SOURCE_DOSE',anyof(f('current_pld_mg_m2','>',reference_dose),f('original_pld_mg_m2','>',reference_dose)),'consultant_review',f'The entered PLD dose exceeds this regimen reference of {reference_dose} mg/m². Confirm indication, formulation, units and prescription; do not silently transfer another PLD regimen dose or calculate a replacement.','1 treatment; prescription reconciliation'))
    rules.append(rule(code,'PLD_SEVERE_TOXICITY_TIMING_UNKNOWN',allof(anyof(f('ppe_grade','>=',3),f('stomatitis_grade','>=',3),f('mucositis_grade','>=',3)),anyof(f('toxicity_delay_weeks','missing'),f('toxicity_delay_weeks','>',2))),'withhold','Current grade3–4 PPE/stomatitis requires delay or discontinuation in every supported source timing branch. Missing or out-of-table duration requires withholding and assessment; do not invent a permanent-stop date.','3 Table 3'))
    if code=='00205':
        rules.append(rule(code,'PLD_PRIOR_SEVERE_RECOVERY_HOLD',allof(f('previous_severe_cytopenia','==',True),anyof(f('anc_x10e9_l','missing'),f('anc_x10e9_l','<',1.5),f('platelets_x10e9_l','missing'),f('platelets_x10e9_l','<',75))),'withhold','After severe cytopenia, both ANC≥1.5 and platelets≥75 are required for the source recovery pathway. Missing counts or platelets74.5 do not demonstrate recovery, regardless of printed current-band gaps or restart intent.','2 Table 1'))
    # Replace the old inferred numeric hepatic recommendation. Percentages are
    # retained as source information, not multiplied onto an unknown prescription.
    for lo, hi, percent in [(20,50,75),(51,86,50)]:
        name = f'{lo}_{hi}'
        rid = f'OF590_00205_PLD_BILI_{name}' if code=='00205' else f'KS_PLD_BILI_{name}'
        new = rule(code,rid,band(lo,hi,name),'consultant_review',
            f'Bilirubin {lo}–{hi} µmol/L: NCCP Table 2 specifies {percent}% of the ORIGINAL PLD dose. Confirm the original and current prescription, prior reductions and all concurrent toxicity reasons. Do not calculate from the standard regimen dose, compound percentages, or automatically re-escalate a reduced dose.','3 Table 2')
        if code=='00205':
            rules[:] = [new if r['id']==rid else r for r in rules]
        else:
            rules.append(new)
            reference = 20*percent/100
            rules.append(rule(code,f'PLD_HEP_CURRENT_LOWER_{name}',allof(band(lo,hi,name),f('current_pld_mg_m2','<',reference)),
                'consultant_review',f'The current dose is below the {reference:g} mg/m² reference obtained from {percent}% of the standard 20 mg/m² dose. This reference is not a prescription: retain the reduced-dose history and do not automatically increase treatment.','3 Table 2; prescription history'))
    if code=='00205':
        rules.append(rule(code,'PLD_ANC_ABOVE_PRINTED_ROW',f('anc_x10e9_l','>',1.9),'consultant_review',
            'NCCP 00205 Table 1 prints ANC 1.5–1.9 for its 100% row and does not allocate ANC >1.9 explicitly. A higher ANC is not described here as pathological and is not a dose-reduction indication; confirm source interpretation without extrapolating the printed row.','2 Table 1'))
    # All specialist choices remain qualitative. Also prevent the dose renderer
    # from deriving doses by parsing a percentage embedded in a clinical message.
    for r in rules:
        r['source']['checked_date']=DATE
        r['source']['evidence_kind']='current_official_extracted_text; visual_table_inspection_unverified'
        r['action'].update({'block_numeric_dose':True,'dose_calculation':'specialist_review','show_in_dose_actions':True})
        r['action'].pop('component_changes',None)
        r['action']['recommendation']=r['action']['message']
        r['explanation']=r['action']['message']
    p['required_inputs']=[]
    m=p['metadata']
    # Preserve an older binary hash as historical evidence, never relabel it as a
    # hash obtained for this current text-only source check.
    if m.get('source_sha256'):
        m.setdefault('historical_source_provenance',[]).append({'sha256':m.pop('source_sha256'),'checked_date':m.get('source_checked_date'),'note':'Inherited historical source hash; original PDF bytes not available for this 2026-11-18 review.'})
    m.update({'source_checked_date':DATE,'review_date':DATE,'source_document_pages':5,'audited_rule_count':len(rules),
        'source_document_revision_date':'2025-07-23' if code=='00205' else '2025-04-09',
        'source_document_next_review_date':'2030-07-23' if code=='00205' else '2030-04-09',
        'source_text_sha256':sha(SOURCES/f'{code}-web.txt'),
        'source_evidence':{'kind':'complete_current_official_extracted_text','binary_pdf_verified':False,'binary_pdf_sha256':None,'visual_table_inspection_verified':False,
          'limitation':'Original PDF bytes were unavailable and screenshot tool responses did not contain inspectable table pixels. All ambiguous printed boundaries remain review-only.'},
        'draft_scope':'External batch 3 clinical draft; application not changed; independent clinical/pharmacy review pending.'})
    m['validation'].update({'rule_level_source_reconciliation_status':'current_complete_extracted_text_reconciled_external_draft_visual_review_unverified',
        'software_tests_completed':False,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False})
    m.setdefault('audit_limitations',[]).extend(['Current audit uses complete extracted official text; original PDF bytes and visual table inspection are unverified.',
        'Prior discontinuation and dose-reduction history must survive current toxicity recovery; a missing history value is not a confirmed absence.',
        'Every numerical modified dose remains a Consultant/pharmacy prescription decision; no automatic calculation from an unknown original/current dose.'])
    if code=='00462':
        m['audit_limitations'].extend(['NCCP 00462 infusion timing differs from current EMA AIDS-KS instructions; local oncology/pharmacy reconciliation is required.',
            'The standard calendar is 21 days; the source allows a separately selected 14 day alternative, not two concurrent phases.',
            'NCCP 00462 count rules must not inherit 00205 recovery or growth-factor choices.'])
    p['clinical_governance']['organ_function_rule_status']='Current extracted text reconciled in external batch 3 draft; visual table review and independent Consultant/pharmacy validation remain pending.'
    p['clinical_governance']['dose_modification_note']='All dose changes require Consultant discussion and pharmacy verification of original/current prescription, prior toxicity and concurrent modifications. This tool does not authorise treatment.'
    for phase in p.get('treatment_phases',[]):
        phase['duration_text']=phase['number_of_cycles']
        phase['schedule_summary']=p['treatment']['schedule_summary']
    (OUT/Path(PATHS[code]).name).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')

manifest={'status':'external_draft_not_integrated','source_checked_date':DATE,'codes':{},
          'application_written':False,'independent_clinical_approval':False,
          'id_migration_plan':'No protocol ID migration: existing and current source IDs are nccp-00205-v8 and nccp-00462-v4. Preserve 00462 legacy indication_id while adding source code 00462a.'}
for code in PATHS:
    path=OUT/Path(PATHS[code]).name
    manifest['codes'][code]={'repository_relative_path':PATHS[code],'baseline_sha256':sha(ROOT/PATHS[code]),'draft_path':str(path),'draft_sha256':sha(path),
        'protocol_id_before':base[code]['protocol_id'],'protocol_id_after':draft[code]['protocol_id'],'source_version':draft[code]['metadata']['nccp_version'],
        'source_text_sha256':sha(SOURCES/f'{code}-web.txt'),'source_url':draft[code]['metadata']['source_url'],
        'source_pdf_binary_sha256':None,'visual_table_inspection_verified':False,'rule_count':len(draft[code]['rule_engine']['rules'])}
(HERE/'pld-draft-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'written':list(manifest['codes']), 'rule_counts':{c:v['rule_count'] for c,v in manifest['codes'].items()},'application_written':False}))
