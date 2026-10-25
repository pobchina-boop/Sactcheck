from pathlib import Path
import copy,json,difflib
H=Path(__file__).resolve().parent;R=H.parents[2];DATE='2026-10-25';V='0.84.19';NCCP='https://healthservice.hse.ie/documents/6381/545_Zoledronic_acid.pdf';EMA='https://www.ema.europa.eu/en/documents/product-information/zoledronic-acid-accord-epar-product-information_en.pdf'
def save(path,x):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
def C(f,o,v=None):return dict(field=f,operator=o,**({'value':v} if v is not None else {}))
def A(*x):return dict(all=list(x))
def Y(*x):return dict(any=list(x))
def N(label,unit='',min=0,max=2000,step=.01,demo=80,**kw):return dict(label=label,type='number',required=False,min=min,max=max,step=step,unit=unit,demo_value=demo,ui_section='labs',input_role='decision',always_show=True,**kw)
def B(label,demo=False,**kw):return dict(label=label,type='boolean',required=False,demo_value=demo,ui_section='clinical',input_role='decision',always_show=True,**kw)
def S(label,opts,demo=None,**kw):return dict(label=label,type='select',required=False,options=[dict(value=a,label=b) for a,b in opts],demo_value=demo if demo is not None else opts[0][0],ui_section='treatment_context',input_role='context',always_show=True,**kw)
f=next((H.parent/'baseline').glob('00545-*'));d=json.loads(f.read_text());m=d['metadata'];m.update(nccp_version=3,source_document_pages=4,source_checked_date=DATE,source_version_date='2026-04-01',source_review_due='2031-04-01',sactcheck_encoding_version=V,short_title='Zoledronic acid · adjuvant · every 6 months')
m['source_supplements']=[dict(title='EMA Zoledronic Acid Accord SmPC',url=EMA,scope='Supplementary safety and renal method; NCCP controls the adjuvant schedule')]
m['validation'].update(source_document_checked=True,software_tests_completed=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,rule_level_source_reconciliation_status='source_reconciled_v08419_pending_independent_clinical_and_pharmacy_validation')
m['encoding_maturity'].update(level='source_reconciled_pending_validation',label='Source reconciled · independent clinical/pharmacy review pending',source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,reconciled_release=V,scope_note='NCCP 00545 v3 reviewed with separately identified EMA safety guidance; source gaps require consultant review.')
m['course_summary']='IV infusion every 6 months for up to 5 years, or earlier for progression or unacceptable toxicity; confirm the individual adjuvant plan.'
d['clinical_governance']['off_label_note']='NCCP p4 identifies adjuvant use as off-label in Ireland. Explain this, obtain consent under local policy, and confirm Drugs and Therapeutics Committee or equivalent acknowledgement.'
d['treatment_phases']=[dict(phase_id='adjuvant',label='Adjuvant zoledronic acid',cycle_length_days=182,cycle_length_months=6,duration_text='Every 6 calendar months for up to 5 years, stopping earlier for disease progression or unacceptable toxicity. The day count is a display approximation, not an appointment interval.',administration=[dict(day=1,days=[1],order=1,drug='zoledronic acid',dose=dict(value=4,unit='mg'),route='IV infusion',notes='Renal-adjusted if required; 100 mL sodium chloride 0.9% over at least 15 minutes. Every 6 months, not every 3–4 weeks or once yearly. Confirm hydration and avoid fluid overload.')])]
i=d['input_definitions'];i['cycle_number']['max']=12;i['cycle_number']['assessment_guidance']='Record the actual infusion number; calendar-month timing is confirmed by the treatment plan, not calculated from this number.'
i['crcl']=N('Creatinine clearance (Cockcroft–Gault; not indexed eGFR)','mL/min',max=300,demo=80,renal_input=dict(mode='source_threshold_numeric',source_url=NCCP,exact_value_required=False,reason='Exact values preserve >60 and expose the printed 39–40 and 49–50 gaps without silently rounding a calculated creatinine clearance.'),assessment_guidance='Use verified Cockcroft–Gault CrCl in mL/min. Do not substitute indexed eGFR or round across source gaps.')
i['baseline_creatinine']=N('Baseline creatinine','µmol/L',min=.01,demo=80,assessment_guidance='Use the treatment baseline. Change and recovery ratio are calculated from this and the current result; baseline exactly 124 is an unresolved source boundary.')
i['current_creatinine']=N('Current creatinine','µmol/L',min=.01,demo=80,assessment_guidance='Enter the current verified value in µmol/L; no manual delta or recovery percentage is needed.')
i['creatinine_increase_umol_l']=N('Calculated creatinine rise from baseline','µmol/L',min=-2000,max=2000,demo=0,ui_derived_from='current_creatinine',derived_value=dict(operation='difference',fields=['current_creatinine','baseline_creatinine']))
i['creatinine_ratio_baseline']=N('Calculated current / baseline creatinine','ratio',min=0,max=200000,demo=1,ui_derived_from='current_creatinine',derived_value=dict(operation='ratio',fields=['current_creatinine','baseline_creatinine']))
i.update(assessment_stage=S('Assessment stage',[('baseline','Before first dose'),('ongoing','Ongoing dose'),('restart','Review after an interruption')]),treatment_setting=S('Treatment setting',[('adjuvant','Adjuvant breast treatment'),('other','Other indication / setting')]),endocrine_depletion_status=S('Endocrine depletion',[('postmenopausal','Postmenopausal'),('ovarian_suppression','Premenopausal with confirmed ovarian suppression'),('not_depleted','Premenopausal without confirmed depletion'),('unknown','Not established')]),renal_measure_type=S('Kidney-function estimate used',[('crcl','Cockcroft–Gault CrCl, mL/min'),('egfr','Indexed eGFR, mL/min/1.73 m²'),('unknown','Not established')]),previous_renal_hold=B('Previously withheld for renal deterioration'),renal_deterioration_clinically_present=B('Clinical renal deterioration / acute kidney injury'),hepatic_impairment=B('Hepatic impairment requiring review'),unhealed_oral_lesion=B('Unhealed open soft-tissue lesion in the mouth'),invasive_dental_procedure_planned=B('Invasive dental procedure planned or recently performed'),dental_risk_assessment_unresolved=B('Dental risk assessment or indicated preventive dentistry unresolved'),off_label_governance_confirmed=B('Adjuvant off-label discussion, consent and local governance confirmed',True),pretreatment_tests_unresolved=B('Required pre-dose blood tests or results unresolved'),hypercalcaemia=B('Hypercalcaemia present'),calcium_vitamin_d_plan_unresolved=B('Calcium / vitamin D replacement plan unresolved'),dehydration=B('Dehydration present'),fluid_overload_risk=B('Risk of fluid overload / cardiac failure'),concurrent_other_bisphosphonate=B('Concurrent other bisphosphonate / duplicate zoledronic acid'),interaction_review_unresolved=B('Renal, calcium-lowering or antiangiogenic medicine interaction unresolved'),severe_hypocalcaemia_symptoms=B('Tetany, seizures, arrhythmia or other severe hypocalcaemia symptoms'),new_thigh_hip_groin_pain=B('New thigh, hip or groin pain'),persistent_ear_symptoms=B('Persistent ear pain, discharge or infection'),new_eye_pain_or_vision_change=B('New eye pain or visual disturbance'),severe_systemic_reaction=B('Severe acute systemic reaction / suddenly unwell'))
i['hypocalcaemia']['assessment_guidance']='Confirm interpretation using the reporting laboratory and clinical context; corrected or ionised calcium may be appropriate. This source gives no universal numerical calcium threshold.'
rs=[]
def add(id,when,type,text,page=2,url=NCCP,origin='Source-derived decision rule'):
 rs.append(dict(rule_id='ZOL_'+id,when=when,action=dict(type=type,components=['zoledronic acid'],recommendation=text),source=dict(url=url,page=page,document='NCCP 00545 v3' if url==NCCP else 'EMA Zoledronic Acid Accord SmPC',interpretation=origin),explanation=text))
add('HYPERSENSITIVITY',C('relevant_drug_hypersensitivity','==',True),'contraindicated','Do not administer zoledronic acid with relevant bisphosphonate or excipient hypersensitivity.',1)
add('PREGNANCY_BREASTFEEDING',Y(C('pregnancy','==',True),C('breastfeeding','==',True)),'contraindicated','Pregnancy or breastfeeding excludes this regimen.',1)
add('ELECTROLYTES',Y(C('hypocalcaemia','==',True),C('hypomagnesaemia','==',True),C('hypophosphataemia','==',True)),'withhold','Correct the identified calcium, magnesium or phosphate abnormality before treatment; establish the replacement and repeat-test plan.',1)
renal=Y(C('renal_measure_type','missing'),C('renal_measure_type','==','crcl'))
not_restart=Y(C('previous_renal_hold','missing'),C('previous_renal_hold','==',False))
add('CRCL_UNDER30',A(renal,C('crcl','<',30)),'contraindicated','CrCl below 30 mL/min: zoledronic acid is not recommended; severe renal impairment is an NCCP exclusion.',2)
for low,high,dose in [(30,39,'3'),(40,49,'3.3'),(50,60,'3.5')]:
 add('CRCL_'+str(low)+'_'+str(high),A(renal,not_restart,C('crcl','>=',low),C('crcl','<=',high)),'dose_reduce',f'CrCl {low}–{high} mL/min: source dose is {dose} mg zoledronic acid. Consultant/pharmacy verification remains required; this does not override renal deterioration, electrolyte or dental holds.')
for low,high in [(39,40),(49,50)]:add('CRCL_GAP_'+str(low),A(renal,C('crcl','>',low),C('crcl','<',high)),'consultant_review',f'CrCl between {low} and {high} mL/min is unassigned by the printed whole-number rows. Do not round into a dose; resolve the source gap with the consultant/pharmacist.')
add('RENAL_MEASURE',C('renal_measure_type','in',['egfr','unknown']),'consultant_review','Verify Cockcroft–Gault creatinine clearance before applying this dose table; indexed eGFR is not interchangeable.',3,EMA)
add('CREATININE_BASELINE124',C('baseline_creatinine','==',124),'consultant_review','Baseline creatinine exactly 124 µmol/L is unassigned between the printed <124 and >124 deterioration categories. Resolve the boundary; neither threshold is automatically selected.')
for suffix,op,rise in [('NORMAL','<',44),('ABNORMAL','>',88)]:
 add('RENAL_DETERIORATION_'+suffix,A(C('baseline_creatinine',op,124),C('creatinine_increase_umol_l','>=',rise)),'withhold',f'Withhold for renal deterioration: the current creatinine rise reaches at least {rise} µmol/L in the applicable baseline category. Review the cause, repeat renal tests and reassess before any restart.',origin='The source increase-of threshold is interpreted monotonically as at least that rise, using verified baseline/current values.')
add('RENAL_CLINICAL',C('renal_deterioration_clinically_present','==',True),'withhold','Withhold and clinically assess renal deterioration or acute kidney injury even if a numerical trigger is not established.')
add('TREND_INCOMPLETE',Y(A(C('baseline_creatinine','exists'),C('current_creatinine','missing')),A(C('current_creatinine','exists'),C('baseline_creatinine','missing'))),'consultant_review','Both baseline and current creatinine are needed to assess renal deterioration and recovery. A lone value cannot establish a safe trend.')
add('RESTART_NOT_RECOVERED',A(C('previous_renal_hold','==',True),C('creatinine_ratio_baseline','>',1.1)),'withhold','Continue withholding after renal deterioration: current creatinine remains more than 10% above baseline. Review recovery before considering another infusion.')
add('RESTART_CONSIDER',A(C('previous_renal_hold','==',True),C('creatinine_ratio_baseline','<=',1.1)),'consultant_review','Creatinine is at or below 110% of baseline. The source permits consideration of resumption after recovery, at the same dose used before interruption; confirm that dose, current renal status and all other requirements. Do not recalculate a new starting dose automatically.',origin='Recovery from a rise is interpreted as no more than 10% above baseline; resumption remains a consultant decision.')
add('RESTART_INCOMPLETE',A(C('previous_renal_hold','==',True),C('creatinine_ratio_baseline','missing')),'consultant_review','Renal-hold restart requires both baseline/current creatinine and verification of the pre-interruption dose; no restart clearance or new dose is calculated.')
add('HEPATIC',C('hepatic_impairment','==',True),'consultant_review','Hepatic-impairment data are limited and no specific adjustment is supplied. Obtain individual consultant/pharmacy advice rather than an invented dose.')
add('ONJ',C('dental_onj_concern','==',True),'withhold','Withhold pending dental/oral-surgery and oncology review for suspected osteonecrosis of the jaw or a significant dental concern; subsequent interruption and treatment are individualised.',5,EMA,origin='Temporary withholding pending assessment is a safety interpretation; SmPC advises considering interruption for established ONJ.')
add('ORAL_LESION_START',A(C('unhealed_oral_lesion','==',True),C('assessment_stage','in',['baseline','restart'])),'delay','Delay starting a new treatment course until unhealed open oral soft-tissue lesions have been assessed and healed; resolve the dental plan.',5,EMA)
add('ORAL_LESION_OTHER',A(C('unhealed_oral_lesion','==',True),Y(C('assessment_stage','missing'),C('assessment_stage','==','ongoing'))),'consultant_review','Unhealed oral lesions need prompt dental and oncology review before the next infusion; confirm treatment stage and whether a hold is required.',5,EMA)
add('DENTAL_PROCEDURE',C('invasive_dental_procedure_planned','==',True),'consultant_review','Coordinate invasive dental work with dentistry and oncology. Avoid close proximity to zoledronic acid where possible; evidence does not define a universal drug-holiday interval or prove that stopping eliminates ONJ risk.',5,EMA)
add('DENTAL_RISK',C('dental_risk_assessment_unresolved','==',True),'consultant_review','Complete the indicated dental assessment, preventive care and individual benefit-risk review before treatment.',3)
add('SETTING',C('treatment_setting','==','other'),'consultant_review','This is the adjuvant breast regimen. Metastatic bone disease, tumour-induced hypercalcaemia and osteoporosis require their own indication and schedule; do not substitute them here.',1)
add('ENDOCRINE_STATUS',C('endocrine_depletion_status','in',['not_depleted','unknown']),'consultant_review','Confirm endocrine depletion for this adjuvant indication. Premenopausal status alone does not establish eligibility without an appropriate suppression/depletion plan.',1)
add('OFF_LABEL',C('off_label_governance_confirmed','==',False),'consultant_review','Adjuvant zoledronic acid is off-label in Ireland under this source. Complete the patient discussion/consent and local Drugs and Therapeutics Committee or equivalent process.',4)
add('OFF_LABEL_BASELINE',A(C('assessment_stage','==','baseline'),C('off_label_governance_confirmed','missing')),'consultant_review','Confirm the adjuvant off-label discussion, consent and local governance before first treatment.',4)
add('TESTS',C('pretreatment_tests_unresolved','==',True),'consultant_review','Resolve required renal, calcium, phosphate and magnesium results before the infusion. Baseline also includes FBC and liver profile; vitamin D and dental assessment are as clinically indicated.')
add('SUPPLEMENT_EXCEPTION',C('hypercalcaemia','==',True),'consultant_review','Hypercalcaemia is an exception to routine calcium/vitamin D supplementation in this adjuvant source. Review the cause and supplementation; it does not convert this assessment into a hypercalcaemia-treatment regimen.',1)
add('SUPPLEMENT_PLAN',C('calcium_vitamin_d_plan_unresolved','==',True),'consultant_review','Confirm the prescribed calcium/vitamin D plan and whether hypercalcaemia alters it. NCCP specifies daily supplementation of at least 500 mg calcium and at least 400 IU vitamin D.',1)
add('DEHYDRATION',C('dehydration','==',True),'withhold','Correct dehydration and reassess renal function before infusion; tailor fluids to the clinical situation.',4,EMA,origin='Clinical safety interpretation of the hydration requirement and renal toxicity warning')
add('FLUID_RISK',C('fluid_overload_risk','==',True),'consultant_review','Individualise hydration and avoid overhydration with cardiac failure or fluid-overload risk; no routine echo schedule is specified for this regimen.',1)
add('DUPLICATE_BISPHOSPHONATE',C('concurrent_other_bisphosphonate','==',True),'withhold','Reconcile duplicate therapy before dosing: do not give another bisphosphonate or additional zoledronic-acid product concurrently.',4,EMA)
add('INTERACTION',C('interaction_review_unresolved','==',True),'consultant_review','Review potentially nephrotoxic or calcium-lowering medicines and antiangiogenic therapy; these may increase renal, electrolyte or jaw-osteonecrosis risk.',7,EMA)
add('CALCIUM_SYMPTOMS',C('severe_hypocalcaemia_symptoms','==',True),'withhold','Withhold and arrange urgent assessment for possible severe hypocalcaemia, including tetany, seizure or arrhythmia; do not wait for a routine repeat infusion.',6,EMA)
add('THIGH_PAIN',C('new_thigh_hip_groin_pain','==',True),'consultant_review','Evaluate new thigh, hip or groin pain for an incomplete atypical femoral fracture and consider interruption while assessed; use the individual benefit-risk decision.',6,EMA)
add('EAR',C('persistent_ear_symptoms','==',True),'consultant_review','Investigate persistent ear symptoms, including possible external-auditory-canal osteonecrosis; no fixed dose reduction is specified.',6,EMA)
add('EYE',C('new_eye_pain_or_vision_change','==',True),'consultant_review','Arrange prompt clinical/ophthalmic assessment of new eye pain or visual change; ocular inflammation is a recognised adverse effect.',8,EMA,origin='Clinical safety interpretation of ocular adverse effects')
add('SYSTEMIC',C('severe_systemic_reaction','==',True),'withhold','Withhold and urgently assess severe systemic illness or a suspected serious infusion/allergic reaction. Do not assume fever or sudden illness is only an expected post-dose reaction.',7,EMA,origin='Clinical safety interpretation of acute-reaction and anaphylaxis risks')
for key,vals in [('assessment_stage',['baseline','ongoing','restart']),('treatment_setting',['adjuvant','other']),('endocrine_depletion_status',['postmenopausal','ovarian_suppression','not_depleted','unknown']),('renal_measure_type',['crcl','egfr','unknown'])]:add('INVALID_'+key.upper(),C(key,'not_in',vals),'consultant_review','Unrecognised '+key.replace('_',' ')+': confirm the entered context before treatment.',origin='Input safeguard')
d['rule_engine']=dict(evaluation_mode='highest_priority_triggered',rules=rs)
d['output_templates'].update(withhold='Withhold pending review and correction of the identified problem; this does not authorise a later dose.',contraindicated='A source exclusion or not-recommended pathway applies; confirm an alternative clinical plan.',consultant_review='Consultant/pharmacy review is required before the treatment plan is confirmed.')
d['supportive_care'].update(emetogenic_risk='minimal',script_id='nccp-minimal-no-routine-prophylaxis',summary=['No routine premedication is required by NCCP 00545.','Daily oral calcium at least 500 mg and vitamin D at least 400 IU unless hypercalcaemic; confirm the prescribed preparation.','Individualise hydration, avoiding fluid overload; assess renal and electrolyte results before every infusion.','Dental risk assessment, preventive care and the patient reminder card form part of treatment preparation.'],mapping_source='NCCP 00545 v3 pp1–3',mapping_source_url=NCCP,mapping_basis='Source states no routine premedication; v3 removed the emetogenic-potential section. Minimal is the service classification, not a claimed NCCP v3 table category.',source_url=NCCP,source_checked_date=DATE,validation_status='source_reconciled_pending_oncology_pharmacy_review')
save(H/'proposed'/f.name,d)
# Isolated patch proposal only: root reviews/applies to shared engine.
original=(R/'js/assessment-engine.js').read_text();patched=original
needle='''        [definition.visible_when, definition.required_when].forEach(condition => {'''
replacement='''        // Opt-in arithmetic operands belong to the form even if no rule names them directly.
        asArray(definition.derived_value?.fields).forEach(dependency => {
          if (!fields.includes(dependency) && explicitDefinitions.has(dependency)) {
            fields.push(dependency);
            expanded = true;
          }
        });
        [definition.visible_when, definition.required_when].forEach(condition => {'''
assert needle in patched;patched=patched.replace(needle,replacement)
needle='''    return inputs;
  }

  function buildDisplayInputs'''
replacement='''    // Derived results are recomputed from validated direct numeric operands.
    // Do not trust supplied deltas/ratios, support chains or infer a missing value as zero.
    const definitionById = new Map(definitions.map(definition => [definition.id, definition]));
    definitions.filter(definition => definition.derived_value).forEach(definition => {
      inputs[definition.id] = null;
      const config = definition.derived_value;
      if (!config || !["difference", "ratio"].includes(config.operation) ||
          !Array.isArray(config.fields) || config.fields.length !== 2) return;
      const operands = config.fields.map(field => {
        const operand = definitionById.get(field);
        const value = inputs[field];
        if (!operand || operand.type !== "number" || operand.derived_value ||
            value === null || value === undefined || !Number.isFinite(value) ||
            (operand.min !== undefined && value < Number(operand.min)) ||
            (operand.max !== undefined && value > Number(operand.max))) return null;
        return value;
      });
      if (operands.some(value => value === null)) return;
      if (config.operation === "ratio" && operands[1] <= 0) return;
      const result = config.operation === "difference" ? operands[0] - operands[1] : operands[0] / operands[1];
      // Remove floating-point representation noise without clinical rounding to a dose band.
      if (Number.isFinite(result)) inputs[definition.id] = Number(result.toPrecision(15));
    });

    return inputs;
  }

  function buildDisplayInputs'''
assert needle in patched;patched=patched.replace(needle,replacement)
(H/'assessment-engine.proposed.js').write_text(patched)
(H/'assessment-engine.patch').write_text(''.join(difflib.unified_diff(original.splitlines(True),patched.splitlines(True),fromfile='a/js/assessment-engine.js',tofile='b/js/assessment-engine.js')))
print('Wrote isolated 00545 proposal and shared-engine patch proposal; production untouched.')
