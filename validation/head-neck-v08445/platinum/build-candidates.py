"""Reproducible proposals; reads the selected checkout and writes only this audit folder."""
import copy
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PATHS = {
    '00385': 'protocols/gynaecology/00385-cisplatin-40-mg-m-weekly-with-radiotherapy.json',
    '00387': 'protocols/head-neck/00387-cisplatin-100-mg-m-with-radiotherapy.json',
}
def cond(field, op, value=None):
    return dict(field=field, operator=op, **({} if value is None else {'value':value}))
def allof(*xs): return {'all':list(xs)}
def anyof(*xs): return {'any':list(xs)}
def number(label, demo, **kwargs):
    return dict(label=label,type='number',required=False,input_role='decision',min=0,step='any',demo_value=demo,**kwargs)
def boolean(label,demo=False):
    return dict(label=label,type='boolean',required=False,input_role='decision',demo_value=demo)

for code,rel in PATHS.items():
    p=json.loads((ROOT/rel).read_text())
    weekly=code=='00385'; meta=p['metadata']; url=meta['source_url']
    countpage=3 if weekly else 2; renalpage=4 if weekly else 2; neuropage=4 if weekly else 3; entrypage=2 if weekly else 1
    meta.update(source_document_pages=7 if weekly else 4,source_checked_date='2026-11-07',sactcheck_encoding_version='0.84.45')
    meta['encoding_maturity'].update(level='source_reconciled_pending_independent_review',label='Source reconciled · independent clinical/pharmacy review pending',source_reconciled=True,audit_release='0.84.45',audit_date='2026-11-07',scope_note='NCCP version 5 reconciled to executable thresholds, eligibility, monitoring, RT coordination and explicit local safety guards; independent clinical/pharmacy approval remains pending.')
    meta['validation']['rule_level_source_reconciliation_status']='source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation'
    manifest=json.loads((HERE/'sources/manifest.json').read_text())
    retrieved=next(x for x in manifest['sources'] if x['code']==code)
    meta['source_audit']={'release':'0.84.45','checked_date':'2026-11-07','source_pdf_url':url,'source_pdf_sha256':retrieved['sha256'],'retrieved_utc':retrieved['retrieved_utc'],'review_date':'25/10/2029' if weekly else '05/12/2030','version_date':'25/10/2024' if weekly else '05/12/2025','source_manifest':'validation/head-neck-v08445/platinum/sources/manifest.json','independent_clinical_and_pharmacy_review':'pending'}
    p['clinical_governance']['dose_modification_note']='Discuss all changes with the Consultant. The output states source percentages, not a prescription; do not multiply independent reductions, infer a restart dose, substitute eGFR for CrCl, or apply another cisplatin regimen’s thresholds.'
    p['eligibility']=['Indication matches the current NCCP regimen','ECOG 0–2','Adequate hepatic, renal and bone-marrow function; reconcile pretreatment suitability separately from treatment-related impairment']
    p['exclusions']=['Known cisplatin/excipient hypersensitivity','Significant hearing impairment or tinnitus','Pregnancy','Breastfeeding']+(['Pre-existing renal impairment'] if weekly else [])
    p['monitoring']={'baseline':['FBC','Renal profile','Liver profile','Audiology and creatinine clearance if clinically indicated'],'before_each_cycle':['FBC','Renal profile','Liver profile']+(['Audiology if clinically indicated'] if weekly else ['History of ototoxicity and sensory neural symptoms']), 'disease_monitoring':'Individual Consultant treatment plan; source does not prescribe a universal scan or tumour-marker schedule.', 'source_pages':[countpage]}
    p['treatment'].update(schedule_summary='Cisplatin 40 mg/m² every 7 days during RT: 5 cycles for cervical cancer (extension only by Consultant); 6 cycles for bladder, nasopharyngeal and head-and-neck disease.' if weekly else 'Cisplatin 100 mg/m² every 21 days with RT for 3 cycles unless progression or unacceptable toxicity.',rt_coordination='Give cisplatin before RT on the same day. If RT is cancelled, postpone cisplatin until RT resumes.',infusion_duration_minutes=60 if weekly else 120)
    if weekly:
        indications=[('00385a','Gynaecology','Definitive chemoradiation for locally advanced cervical squamous, adenosquamous or adenocarcinoma, stage IIB–IVA; selected IB3/IIA only after MDT discussion.'),('00385b','Genitourinary','Chemoradiation for locally advanced bladder cancer.'),('00385c','Head and Neck','Chemoradiation for locally advanced nasopharyngeal carcinoma.'),('00385d','Head and Neck','Chemoradiation for locally advanced unresectable head-and-neck squamous carcinoma when three-weekly cisplatin cannot be tolerated.'),('00385e','Gynaecology','Postoperative adjuvant chemoradiation for cervical squamous, adenosquamous or adenocarcinoma with unexpected pathological node positivity.')]
        p['indications']=[dict(indication_id=i,code=i,description=d,tumour_groups=[g]) for i,g,d in indications]
        meta['indication']='Concurrent chemoradiation for NCCP-listed cervical, bladder, nasopharyngeal and unresectable head-and-neck indications; select the exact indication.'
        meta['head_neck_subgroups']=['squamous_cell','nasopharyngeal']
        meta['treatment_context']=list(dict.fromkeys(meta['treatment_context']+['head_neck_nasopharyngeal']))
        meta['regimen_card']['contexts']=[dict(id=i,indication_id=i,intent='curative',cycle_length_days=7,planned_cycles=5 if i in ['00385a','00385e'] else 6,duration_text='5 weekly doses with RT; additional concurrent doses only at Consultant discretion' if i in ['00385a','00385e'] else '6 weekly doses with RT',provenance='official_nccp_source_reconciled') for i,_,_ in indications]
    defs=p['input_definitions']
    legacyband='cisplatin_renal_band' if weekly else 'cisplatin_crcl_band'
    legacyneuro='hearing_or_neuropathy_grade' if weekly else 'cisplatin_neuro_hearing_grade'
    for key in [legacyband,legacyneuro]:
        defs[key].update(visible=False,input_role='context',legacy_compatibility=True)
    defs['crcl_ml_min']=number('Creatinine clearance (CrCl; mL/min, not indexed eGFR)',80,unit='mL/min',help='Enter the verified absolute CrCl. NCCP Table 2 prints 40–49 and 50–59; fractional results between these printed bands require Consultant/pharmacy interpretation.')
    defs['haemodialysis']=boolean('Receiving haemodialysis')
    defs['peripheral_neuropathy_grade']=copy.deepcopy(defs[legacyneuro]);defs['peripheral_neuropathy_grade'].update(label='Peripheral neuropathy grade (separate from hearing/tinnitus)',visible=True,input_role='decision',assessment_guidance='Grade peripheral neuropathy only; hearing/tinnitus is assessed separately.');defs['peripheral_neuropathy_grade'].pop('legacy_compatibility',None)
    defs['hypersensitivity']=boolean('Known hypersensitivity to cisplatin or excipients')
    defs['pregnancy']=boolean('Pregnant')
    defs['breastfeeding']=boolean('Breastfeeding')
    defs['significant_hearing_impairment_or_tinnitus']=boolean('Significant hearing impairment or tinnitus')
    defs['new_or_worsening_hearing_symptoms']=boolean('New or worsening hearing symptoms or tinnitus needing assessment')
    defs['pre_existing_renal_impairment']=boolean('Renal impairment present before treatment started')
    defs['radiotherapy_cancelled_today']=boolean('Radiotherapy cancelled on planned cisplatin day')
    defs['required_tests_missing']=boolean('Required FBC, renal/liver tests or indicated audiology/CrCl unavailable')
    defs['dose_history_unverified']=boolean('Actual current cisplatin dose or previous reductions/omissions unverified')
    defs['restarting_after_toxicity']=boolean('Restarting after toxicity, delay or omission')
    defs['toxicity_recovered']=boolean('Toxicity responsible for the interruption has recovered',True)
    defs['current_cisplatin_dose_percent']=number('Current prescribed cisplatin dose (% of original)',100,max=100,unit='%');defs['current_cisplatin_dose_percent']['input_role']='context'
    defs['previous_cisplatin_omitted_for_neuropathy']=boolean('Cisplatin previously omitted for Grade 3–4 neuropathy')
    defs['indication_confirmed']=boolean('Exact NCCP indication and RT plan confirmed',True)
    defs['concurrent_dose_modifications']=boolean('More than one toxicity/organ-function dose adjustment applies')
    if not weekly:defs['progression_or_unacceptable_toxicity']=boolean('Disease progression or unacceptable toxicity')
    rules=[]
    def add(id,when,action,msg,page,table=None,basis='direct_NCCP_source',percent=None):
        source=dict(document=f'NCCP {code} version 5',url=url,page=page,basis=basis)
        if table:source['table']=table
        a=dict(type=action,components=['cisplatin'],message=msg)
        if percent is not None:a['dose_percent_of_original']=percent
        rules.append(dict(id=id,priority=10,when=when,action=a,source=source,explanation=msg))
    add('ECOG_3',cond('ecog','>=',3),'consultant_review','ECOG 3–4 lies outside the source ECOG 0–2 eligibility; Consultant review is required.',entrypage)
    for field,id,msg in [('hypersensitivity','HYPERSENSITIVITY','Known cisplatin or excipient hypersensitivity is a source exclusion.'),('pregnancy','PREGNANCY','Pregnancy is a source exclusion.'),('breastfeeding','BREASTFEEDING','Breastfeeding is a source exclusion.'),('significant_hearing_impairment_or_tinnitus','SIGNIFICANT_HEARING','Significant hearing impairment or tinnitus is a source exclusion; assess hearing separately from peripheral neuropathy.')]:
        add(id,cond(field,'==',True),'contraindicated',msg,entrypage)
    add('RT_CANCELLED',cond('radiotherapy_cancelled_today','==',True),'withhold','Do not give cisplatin when same-day radiotherapy is cancelled. Postpone cisplatin until RT resumes; coordinate with radiation oncology.',entrypage)
    add('INDICATION_UNCONFIRMED',cond('indication_confirmed','==',False),'consultant_review','Confirm the exact NCCP indication and concurrent RT plan before treatment.',1,basis='source_eligibility_with_local_guardrail')
    if weekly:
        add('BASELINE_RENAL_EXCLUSION',allof(cond('pre_existing_renal_impairment','==',True),cond('assessment_phase','==','pre_treatment')),'contraindicated','Pre-existing renal impairment is listed as an exclusion in weekly cisplatin 00385. Reconcile baseline eligibility with the Consultant; do not treat the dose-modification table as automatic eligibility.',2)
        add('BASELINE_RENAL_PHASE_UNCLEAR',allof(cond('pre_existing_renal_impairment','==',True),cond('assessment_phase','missing')),'consultant_review','Pre-existing renal impairment is a weekly-regimen exclusion. Establish assessment phase and Consultant eligibility decision before applying the treatment dose table.',2,basis='source_exclusion_with_local_guardrail')
    else:
        add('BASELINE_RENAL_CAUTION',cond('pre_existing_renal_impairment','==',True),'consultant_review','Pre-existing renal impairment is a caution in 00387, not the weekly regimen’s baseline exclusion; assess using its renal table and Consultant judgement.',2)
        add('PROGRESSION_OR_UNACCEPTABLE',cond('progression_or_unacceptable_toxicity','==',True),'discontinue','The planned three-cycle course stops for disease progression or unacceptable toxicity; confirm the next plan with the Consultant.',1)
    add('ANC_LT1',cond('anc','<',1),'delay','ANC below 1 ×10⁹/L: delay chemotherapy until recovery.' if weekly else 'ANC below 1 ×10⁹/L: source says delay chemoradiation until recovery; coordinate any RT decision with radiation oncology.',countpage,1)
    if weekly:
        add('PLT_LT100',cond('platelets','<',100),'delay','Platelets below 100 ×10⁹/L: delay chemotherapy until recovery. The 75 ×10⁹/L threshold belongs to a different regimen.',3,1)
    else:
        add('ANC_1_149',allof(cond('anc','>=',1),cond('anc','<=',1.49)),'dose_reduce','ANC 1–1.49 ×10⁹/L: source table specifies cisplatin 75%; discuss all modifications with the Consultant.',2,1,percent=75)
        add('ANC_PRINTED_GAP',allof(cond('anc','>',1.49),cond('anc','<',1.5)),'consultant_review','ANC lies between the printed 1–1.49 and ≥1.5 rows. Do not silently round; confirm the laboratory value and table interpretation.',2,1,basis='source_boundary_with_local_guardrail')
        add('PLT_LT75',cond('platelets','<',75),'delay','Platelets below 75 ×10⁹/L: source says delay chemoradiation until recovery; coordinate any RT decision with radiation oncology.',2,1)
        add('PLT_75_99',allof(cond('platelets','>=',75),cond('platelets','<=',99)),'dose_reduce','Platelets 75–99 ×10⁹/L: source table specifies cisplatin 75%; discuss all modifications with the Consultant.',2,1,percent=75)
        add('PLT_PRINTED_GAP',allof(cond('platelets','>',99),cond('platelets','<',100)),'consultant_review','Platelets lie between the printed 75–99 and ≥100 rows. Confirm the laboratory result and Consultant interpretation without silent rounding.',2,1,basis='source_boundary_with_local_guardrail')
    no_hd=anyof(cond('haemodialysis','==',False),cond('haemodialysis','missing'))
    no_legacy_hd=anyof(cond(legacyband,'!=','dialysis'),cond(legacyband,'missing'))
    renal_gate=allof(no_hd,no_legacy_hd)
    for suffix,lo,hi,pct in [('40_49',40,49,50),('50_59',50,59,75)]:
        add('CRCL_'+suffix,allof(renal_gate,cond('crcl_ml_min','>=',lo),cond('crcl_ml_min','<=',hi)),'dose_reduce',f'CrCl {lo}–{hi} mL/min: cisplatin {pct}% of the ORIGINAL dose. This is not a percentage of an already reduced dose; Consultant review is required.',renalpage,2,percent=pct)
        add('LEGACY_CRCL_'+suffix,allof(renal_gate,cond('crcl_ml_min','missing'),cond(legacyband,'==',suffix)),'dose_reduce',f'Legacy CrCl band {lo}–{hi} mL/min: source specifies {pct}% of original cisplatin dose; verify the exact CrCl.',renalpage,2,percent=pct)
    add('CRCL_LT40',allof(renal_gate,cond('crcl_ml_min','<',40)),'contraindicated','CrCl below 40 mL/min: cisplatin is not recommended. This does not determine the separate RT plan.',renalpage,2)
    add('LEGACY_CRCL_LT40',allof(renal_gate,cond('crcl_ml_min','missing'),cond(legacyband,'==','lt40')),'contraindicated','CrCl below 40 mL/min: cisplatin is not recommended.',renalpage,2)
    add('CRCL_PRINTED_GAP',allof(renal_gate,anyof(allof(cond('crcl_ml_min','>',49),cond('crcl_ml_min','<',50)),allof(cond('crcl_ml_min','>',59),cond('crcl_ml_min','<',60)))),'consultant_review','CrCl falls between the printed whole-number bands. Confirm exact clearance and Consultant/pharmacy interpretation; do not invent an automatic percentage.',renalpage,2,basis='source_boundary_with_local_guardrail')
    add('HAEMODIALYSIS',anyof(cond('haemodialysis','==',True),cond(legacyband,'==','dialysis')),'consultant_review','Haemodialysis: 50% of original cisplatin dose MAY be considered. This is a specialist decision, not a blanket contraindication or automatic dose instruction.',renalpage,2)
    if not weekly:add('LEGACY_AMBIGUOUS_RENAL',cond(legacyband,'in',['45_59','lt45']),'consultant_review','This legacy renal band crosses NCCP v5 dose boundaries. Enter verified CrCl and dialysis status; do not use a 45 mL/min cutoff or a single dose for 45–59.',2,2,basis='legacy_input_guardrail')
    for band,predicate in [('lt40',cond('crcl_ml_min','>=',40)),('40_49',anyof(cond('crcl_ml_min','<',40),cond('crcl_ml_min','>',49))),('50_59',anyof(cond('crcl_ml_min','<',50),cond('crcl_ml_min','>',59))),('ge60',cond('crcl_ml_min','<',60))]:
        add('RENAL_CONFLICT_'+band,allof(cond(legacyband,'exists'),cond(legacyband,'==',band),predicate),'consultant_review','Entered exact CrCl and legacy band disagree. Reconcile values before prescribing; any independently identified hold still applies.',renalpage,2,basis='conflicting_input_guardrail')
    add('DIALYSIS_CONFLICT',allof(cond('haemodialysis','==',False),cond(legacyband,'==','dialysis')),'consultant_review','Dialysis status conflicts with the legacy renal band. Confirm the actual renal replacement status before dosing.',renalpage,2,basis='conflicting_input_guardrail')
    add('NEURO_G2',cond('peripheral_neuropathy_grade','==',2),'dose_reduce','Peripheral neuropathy Grade 2: reduce cisplatin by 25%. Confirm the current dose and prior changes with the Consultant; do not apply this rule to hearing toxicity.',neuropage,3)
    add('NEURO_G3_4',cond('peripheral_neuropathy_grade','in',[3,4]),'omit','Peripheral neuropathy Grade 3–4: omit cisplatin. The source does not provide an automatic later restart or re-escalation rule.',neuropage,3)
    add('LEGACY_NEURO_HEARING',cond(legacyneuro,'>=',1),'consultant_review','The legacy combined hearing/neuropathy field cannot select the source-specific pathway. Assess peripheral neuropathy and hearing/tinnitus separately.',neuropage,3,basis='legacy_input_guardrail')
    add('NEW_HEARING',cond('new_or_worsening_hearing_symptoms','==',True),'withhold','Assess new or worsening hearing/tinnitus before further cisplatin; obtain indicated audiology and Consultant review. No percentage hearing-toxicity rule is supplied by this regimen.',countpage if weekly else 3,basis='monitoring_with_local_safety_guardrail')
    add('TESTS_MISSING',cond('required_tests_missing','==',True),'withhold','Obtain required FBC, renal/liver results and clinically indicated audiology/CrCl before authorising cisplatin.',countpage,basis='source_monitoring_with_local_guardrail')
    hydration='magnesium_low_or_unreplaced' if weekly else 'electrolytes_hydration_not_corrected'
    add('CIS_HYDRATION',cond(hydration,'==',True),'withhold','Complete the local hydration/electrolyte plan before cisplatin. The NCCP regimen requires pre/post hydration; it supplies no universal electrolyte numeric threshold.',entrypage,basis='source_hydration_with_local_guardrail')
    add('FN',cond('febrile_neutropenia','==',True),'withhold','Urgently assess and manage fever/neutropenic infection; withhold pending clinical review. This source does not specify a blanket subsequent reduction or routine G-CSF rule.',countpage if weekly else 3,basis='local_acute_safety_guardrail_no_source_reduction')
    add('NONHAEM_G3',cond('non_haematological_toxicity_grade','>=',3),'withhold','Severe other toxicity requires urgent clinical review before further cisplatin; use the specific diagnosis/current SmPC. NCCP does not supply a generic Grade 3 dose-reduction formula.',neuropage,basis='local_acute_safety_guardrail_no_source_reduction')
    if weekly:add('HSR_REACTION',cond('hypersensitivity_grade','>=',1),'withhold','An infusion reaction requires clinical assessment before further cisplatin; establish hypersensitivity and manage according to severity/current SmPC. The regimen lists known hypersensitivity as an exclusion, without a graded rechallenge algorithm.',2,basis='source_exclusion_with_local_safety_guardrail')
    add('DOSE_HISTORY',cond('dose_history_unverified','==',True),'consultant_review','Verify the actual prescribed dose, earlier reductions, delays and omissions. Renal percentages refer to original dose; the source does not define repeated reductions or re-escalation.',renalpage,2,basis='source_dose_basis_with_local_guardrail')
    add('COMBINED_MODIFICATIONS',cond('concurrent_dose_modifications','==',True),'consultant_review','Multiple adjustment pathways apply. Do not multiply independent reductions or automatically select a restart dose; Consultant/pharmacy reconciliation is required.',renalpage,2,basis='local_combination_guardrail')
    renal_reduction=anyof(allof(cond('crcl_ml_min','>=',40),cond('crcl_ml_min','<=',59)),cond(legacyband,'in',['40_49','50_59']))
    neuro_reduction=cond('peripheral_neuropathy_grade','==',2)
    add('RENAL_NEURO_COMBINATION',allof(renal_reduction,neuro_reduction),'consultant_review','Renal and peripheral neuropathy dose adjustments both apply. The source gives separate rows, not a combined formula: reconcile with the Consultant/pharmacist and do not multiply reductions.',renalpage,2,basis='local_combination_guardrail')
    add('PRIOR_REDUCED_DOSE',allof(cond('current_cisplatin_dose_percent','<',100),anyof(renal_reduction,neuro_reduction)),'consultant_review','Cisplatin is already below its original dose. Confirm the existing prescription and toxicity history before applying another reduction; do not automatically re-escalate to a renal-table percentage.',renalpage,2,basis='local_dose_history_guardrail')
    if not weekly:
        counts_reduction=anyof(allof(cond('anc','>=',1),cond('anc','<=',1.49)),allof(cond('platelets','>=',75),cond('platelets','<=',99)))
        add('COUNTS_ORGAN_COMBINATION',allof(counts_reduction,anyof(renal_reduction,neuro_reduction)),'consultant_review','Blood-count and renal/neuropathy modifications both apply. The source supplies no combined percentage: reconcile the actual dose with the Consultant/pharmacist.',2,1,basis='local_combination_guardrail')
    add('PREVIOUS_NEURO_OMISSION',cond('previous_cisplatin_omitted_for_neuropathy','==',True),'consultant_review','Previous omission for Grade 3–4 neuropathy requires an explicit Consultant plan before reuse. A lower current grade alone does not authorise restart.',neuropage,3,basis='source_omission_with_local_restart_guardrail')
    add('RESTART_REVIEW',cond('restarting_after_toxicity','==',True),'consultant_review','Confirm recovery, original/current dose, prior omissions, remaining planned cycles and ongoing RT. The source does not specify an automatic post-toxicity restart dose.',countpage,basis='source_recovery_with_local_restart_guardrail')
    add('RESTART_NOT_RECOVERED',allof(cond('restarting_after_toxicity','==',True),anyof(cond('toxicity_recovered','==',False),cond('toxicity_recovered','missing'))),'withhold','Maintain the interruption until the responsible toxicity has recovered and the Consultant confirms the restart plan; missing recovery evidence is not normal recovery.',countpage,basis='source_recovery_with_local_restart_guardrail')
    add('RESTART_HISTORY_MISSING',allof(cond('restarting_after_toxicity','==',True),anyof(cond('dose_history_unverified','==',True),cond('dose_history_unverified','missing'),cond('current_cisplatin_dose_percent','missing'))),'withhold','Do not calculate or authorise a restart while dose history or actual prescribed dose is unknown. Obtain Consultant/pharmacy reconciliation.',renalpage,basis='local_restart_safety_guardrail')
    p['rule_engine']['rules']=rules
    p['supportive_care'].update(hydration='Pre- and post-cisplatin hydration with electrolyte supplementation according to the current NCCP regimen and local policy; no routine furosemide unless fluid overload.',source_pages=[entrypage,neuropage])
    if not weekly:p['supportive_care'].update(pre_treatment_referrals=['Dentistry','Nutrition Services'],oral_hydration='Encourage oral hydration for 24 hours, individualised to clinical status.')
    out=HERE/'candidates'/Path(rel).name;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
    print(code,len(rules),'rules',out)
