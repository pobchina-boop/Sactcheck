from pathlib import Path
import json,copy
from finalize import finalize_proposal
B=Path(__file__).parent;R=B.parents[2];DATE='2026-11-02';V='0.84.29';S={s['code']:s for s in json.loads((B/'sources.json').read_text())}
def c(f,op,v=None):return dict(field=f,operator=op,**({} if op=='missing' else dict(value=v)))
def all_(*x):return {'all':list(x)}
def any_(*x):return {'any':list(x)}
for code in ['00311','00587','00388','00319']:
 f=next((R/'protocols').glob('*/'+code+'-*'));p=json.loads(f.read_text());D=p['input_definitions'];m=p['metadata'];ver='4' if code in ['00311','00388'] else '2' if code=='00587' else '5';url=S[code]['url'];comp=['carboplatin','etoposide'] if code=='00319' else ['etoposide'] if code=='00388' else ['topotecan']
 m.update(nccp_version=ver,source_url=url,source_document_pages=3 if code=='00388' else 6 if code=='00319' else 4,source_checked_date=DATE,sactcheck_encoding_version=V,full_suite_release=V,source_pdf_sha256=S[code]['sha256'],source_text_snapshot_sha256=S[code]['text_sha256'],source_retrieval_method='Current official PDF downloaded with browser User-Agent; complete text and original dose tables visually inspected')
 m.setdefault('encoding_maturity',{}).update(level='source_reconciled_pending_independent_review',source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,audit_release=V,audit_date=DATE)
 m.setdefault('validation',{}).update(source_document_checked=True,clinical_use_authorised=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,rule_level_source_reconciliation_status='source_reconciled_v08429_independent_review_pending')
 p.setdefault('clinical_governance',{}).update(clinical_use_authorised=False,dose_modification_note='Confirm source-specific route, selected schedule, stage, recovery and consultant decision. Never multiply overlapping dose percentages or convert oral and IV doses automatically.')
 if code=='00388':m.update(source_title_exact='Oral Etoposide Therapy',date_last_reviewed='2026-08-21',review_policy='As required from 2026-08-21');m['canonical_protocol_id']=p['protocol_id'] # preserve stable canonical id
 def inp(key,label,typ='boolean',options=None,unit=None):
  D[key]=dict(label=label,type=typ,required=False,demo_value='',input_role='decision')
  if typ=='number':D[key].update(min=0,step=.01)
  if options is not None:D[key]['options']=[dict(value=v,label=t) for v,t in options]
  if unit:D[key]['unit']=unit
 def rule(id,w,typ,msg,pg=2,components=None):return dict(rule_id=id,when=w,action=dict(type=typ,components=components or comp,recommendation=msg,message=msg),source=dict(document=f'NCCP {code} v{ver}',url=url,page=pg,checked_date=DATE),explanation=msg)
 rules=[r for r in copy.deepcopy(p['rule_engine']['rules']) if r['rule_id'] not in ['ANC_EXACT1_GAP','PLATELETS_EXACT100_GAP']] if code=='00319' else []
 def add(*a,**kw):rules.append(rule(*a,**kw))
 if code=='00319':
  add('ANC_EXACT1_GAP',c('anc_x10e9_l','==',1),'consultant_review','Table 1 full-dose row is ANC >1.0, not ≥1.0. Exact 1.0 is unassigned between rows; confirm with consultant/pharmacy. Do not assume full dose.',3)
  add('PLATELETS_EXACT100_GAP',c('platelets_x10e9_l','==',100),'consultant_review','Table 1 full-dose row is platelets >100, not ≥100. Exact 100 is unassigned between rows; confirm with consultant/pharmacy.',3)
  D['bilirubin_uln_multiple']['derived_actual_field']='bilirubin_micromol_l';D['bilirubin_micromol_l']['ui_derived_from']='bilirubin_uln_multiple'
 else:
  add('ECOG_OUTSIDE_USUAL_RANGE',c('ecog','>',3 if code=='00388' else 2),'consultant_review','Performance status is outside the source eligibility range; confirm appropriateness.',1)
  add('HYPERSENSITIVITY',c('hypersensitivity','==',True),'contraindicated','Do not administer with known drug or excipient hypersensitivity.',1)
  add('BREASTFEEDING',c('breastfeeding','==',True),'contraindicated','Breastfeeding is an exclusion; do not administer until specialist review.',1)
  add('PREGNANCY',c('pregnancy','==',True),'contraindicated' if code=='00388' else 'consultant_review','Pregnancy requires urgent specialist assessment before treatment; avoid fetal exposure.',1)
  add('INFECTION',c('febrile_or_active_infection','==',True),'withhold','Withhold and urgently assess fever or active infection; a combined infection input does not establish febrile neutropenia.',3)
  inp('assessment_stage','Treatment assessment stage','select',[('baseline','Before first course'),('subsequent','Subsequent course')]);D['assessment_stage']['input_role']='context'
  inp('cycle_number','Cycle number','number');inp('progression_or_unacceptable_toxicity','Progression or unacceptable toxicity')
  add('COURSE_REVIEW',c('progression_or_unacceptable_toxicity','==',True),'withhold','Review benefit, toxicity and the next plan before continuing.',1)
  if code in ['00311','00587']:
   inp('haemoglobin_g_dl','Haemoglobin','number',unit='g/dL');inp('topotecan_crcl_ml_min','Verified creatinine clearance','number',unit='mL/min');D['topotecan_crcl_ml_min']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=url,reason='Route-specific NCCP renal bands; exact decimal gaps remain unresolved.')
   inp('febrile_neutropenia','Confirmed febrile neutropenia in prior cycle');inp('neutropenia_with_infection','Neutropenia with infection in prior cycle');inp('severe_neutropenia_7days','ANC <0.5 for at least 7 days in prior cycle');inp('prior_platelets_lt25','Platelets <25 in prior cycle');inp('ild_confirmed','New interstitial lung disease confirmed');inp('ild_suspected','Possible interstitial lung disease needing assessment')
   add('BASELINE_ANC',all_(c('assessment_stage','==','baseline'),c('anc_x10e9_l','<=',1.5)),'withhold','NCCP baseline eligibility states ANC >1.5. EMA states ≥1.5; exact 1.5 requires source reconciliation before starting.',1)
   add('ANC_STAGE_REQUIRED',all_(c('assessment_stage','missing'),c('anc_x10e9_l','>=',1),c('anc_x10e9_l','<=',1.5)),'consultant_review','Confirm baseline versus subsequent course: the initial ANC requirement differs from the subsequent ≥1 threshold.',1)
   add('LOW_ANC',c('anc_x10e9_l','<',1),'withhold','Do not restart while ANC <1. For IV ANC 0.5–0.99 the table delays until recovery; severe values need urgent review. For oral treatment the table delays one week then reassesses recovery.')
   add('LOW_PLATELETS',c('platelets_x10e9_l','<',100),'withhold','Do not restart until platelets are at least100; review the route-specific dose history.')
   add('LOW_HAEMOGLOBIN',c('haemoglobin_g_dl','<',9),'withhold','Do not restart until haemoglobin is at least9g/dL, after transfusion if required. For oral NCCP the delay row omits Hb but the full-dose criterion and EMA require recovery.')
   inc='0.25' if code=='00311' else '0.4';levels='1.25 then1.0' if code=='00311' else '1.9 then1.5'
   add('PRIOR_SEVERE_MARROW',any_(c('febrile_neutropenia','==',True),c('neutropenia_with_infection','==',True),c('severe_neutropenia_7days','==',True),c('prior_platelets_lt25','==',True)),'consultant_review',f'After recovery, G-CSF support or dose reduction requires consultant choice. Source reduction is {inc}mg/m²/day to {levels}mg/m²/day; confirm current level. Never restart solely from this prior-event input.')
   add('ILD_CONFIRMED',c('ild_confirmed','==',True),'discontinue','Discontinue topotecan for confirmed new interstitial lung disease.',3)
   add('ILD_SUSPECTED',c('ild_suspected','==',True),'withhold','Withhold and urgently investigate possible lung inflammation, infection and other causes; symptoms alone do not confirm ILD.',3)
   add('SIX_CYCLE_LIMIT',c('cycle_number','>',6),'consultant_review','NCCP course specifies6cycles or earlier progression/unacceptable toxicity. Review any proposed extension; this is not an indefinite automatic schedule.',1)
   if code=='00311':
    D['other_nonhaem_toxicity_grade']['label']='Other non-haematological toxicity grade (excluding nausea)'
    add('SEVERE_NONHAEM',c('other_nonhaem_toxicity_grade','>=',3),'consultant_review','Grade≥3 adverse event EXCEPT nausea: reduce by0.25mg/m²/day per source after clinical assessment; do not assign a generic percentage.',3)
    inp('previous_neutropenia_delay','Previous course delayed because of neutropenia')
    add('POST_NEUTROPENIA_REDUCTION',c('previous_neutropenia_delay','==',True),'consultant_review','Following recovery from neutropenia, source reduces by0.25mg/m²/day to1.25 then1.0 if necessary; G-CSF/dose strategy and restart require consultant review.')
    add('TOPO_IV_RENAL_20_39',all_(c('topotecan_crcl_ml_min','>=',20),c('topotecan_crcl_ml_min','<=',39)),'dose_reduce','IV topotecan:50% of original dose at CrCl20–39. Confirm other toxicity restrictions; do not combine reductions automatically.')
    add('TOPO_IV_RENAL_GAP',all_(c('topotecan_crcl_ml_min','>',39),c('topotecan_crcl_ml_min','<',40)),'consultant_review','IV table leaves CrCl>39and<40 unassigned; do not round to a dose band.')
    add('TOPO_IV_RENAL_LT20',any_(c('topotecan_crcl_ml_min','<',20),c('topotecan_renal_band','in',['lt20','dialysis'])),'consultant_review','IV topotecan is not recommended at CrCl<20 or haemodialysis; if unavoidable NCCP says consider25% of original dose with specialist review. This is not routine authorisation.')
    add('OF590_00311_TOPO_IV_20_39',c('topotecan_renal_band','==','20_39'),'dose_reduce','IV topotecan:50% original dose at source band20–39; confirm a verified CrCl.')
    inp('bilirubin_micromol_l','Total bilirubin','number',unit='µmol/L')
    add('TOPO_IV_BILI_GT171',any_(c('bilirubin_micromol_l','>',171),c('topotecan_bilirubin_band','==','gt171')),'consultant_review','IV topotecan is not recommended at bilirubin>171µmol/L; specialist review required.')
   else:
    inp('wbc_x10e9_l','White cell count','number',unit='×10⁹/L');inp('absorption_problem','Gastrointestinal condition or medicine affecting absorption');inp('oral_dose_confirmed','Capsule dose and Days1–5 schedule confirmed');inp('missed_or_vomited_dose','Missed or vomited oral dose');inp('diarrhoea_grade','Diarrhoea grade','select',[(n,'Grade '+str(n)) for n in range(5)])
    add('LOW_WBC',c('wbc_x10e9_l','<',3),'withhold','Oral NCCP table requires WBC≥3. Delay one week and reassess recovery; this is additional to ANC, platelets and Hb.')
    add('ABSORPTION_EXCLUSION',c('absorption_problem','==',True),'contraindicated','Oral source excludes conditions or medicines affecting gastrointestinal absorption; obtain an alternative specialist plan.',1)
    add('ORAL_DOSE_UNCONFIRMED',c('oral_dose_confirmed','==',False),'withhold','Confirm capsule strengths, total prescribed dose, once-daily Days1–5 schedule and storage before starting.',1)
    add('ORAL_MISSED_VOMITED',c('missed_or_vomited_dose','==',True),'consultant_review','No double or replacement dose after missed/vomited capsule. Confirm next scheduled dose with team; do not extend the five-day course.',1)
    add('DIARRHOEA_G3PLUS',c('diarrhoea_grade','>=',3),'withhold','Interrupt and manage severe diarrhoea/fluids; source decreases oral topotecan by0.4mg/m²/day for subsequent courses. Confirm recovery and current dose.',3)
    add('DIARRHOEA_G2',c('diarrhoea_grade','==',2),'consultant_review','Grade2 diarrhoea may require the same0.4mg/m²/day reduction; consultant decision, not automatic.',3)
    add('SEVERE_NONHAEM',c('other_nonhaem_toxicity_grade','>=',3),'consultant_review','Identify the adverse event and assess urgently. The oral source gives a specific diarrhoea rule, not the IV generic0.25mg/m² reduction.',3)
    add('TOPO_ORAL_RENAL_30_49',any_(all_(c('topotecan_crcl_ml_min','>=',30),c('topotecan_crcl_ml_min','<=',49)),c('topotecan_oral_renal_band','==','30_49')),'dose_reduce','ORAL topotecan:83% of full dose,1.9mg/m²/day at CrCl30–49; if tolerated consultant may increase later. Never apply IV50% to capsules.')
    add('TOPO_ORAL_RENAL_GAP',all_(c('topotecan_crcl_ml_min','>',49),c('topotecan_crcl_ml_min','<',50)),'consultant_review','Oral NCCP table leaves CrCl>49and<50 unassigned; do not round to a dose band.')
    add('TOPO_ORAL_RENAL_LT30',any_(c('topotecan_crcl_ml_min','<',30),c('topotecan_oral_renal_band','in',['lt30','dialysis'])),'consultant_review','Insufficient oral topotecan data at CrCl<30 or dialysis; no routine dose supplied.')
    add('ORAL_LEGACY_IV_BAND',c('topotecan_renal_band','in',['ge40','20_39','lt20','dialysis']),'consultant_review','Legacy IV renal category cannot establish an oral dose; enter verified CrCl or route-specific oral category. No IV percentage is applied.')
    add('OF590_00587_TOPO_ORAL_HEPATIC',c('hepatic_impairment_evidence','==','impaired'),'consultant_review','Insufficient oral topotecan hepatic-dose data; specialist review, not an IV bilirubin rule.')
  else:
   inp('oral_schedule','Prescribed oral etoposide schedule','select',[('schedule_7d','50mg twice daily Days1–7'),('schedule_3d','100mg/m² twice daily Days1–3'),('schedule_21d','50mg/m² daily Days1–21')]);D['oral_schedule']['input_role']='context'
   inp('oral_schedule_confirmed','Prescriber/pharmacy confirmed exact schedule and next-cycle start');inp('live_vaccine','Yellow fever or other live vaccine');inp('extensive_sclc_iv_combination_unsuitable','Extensive SCLC and unsuitable for IV or combination chemotherapy');inp('etoposide_crcl_ml_min','Verified creatinine clearance','number',unit='mL/min');inp('bilirubin_micromol_l','Bilirubin absolute result','number',unit='µmol/L');inp('ast_u_l','AST absolute result','number',unit='U/L')
   D['etoposide_crcl_ml_min']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=url,reason='NCCP00388 uses15–50 renal band; do not substitute00319table.')
   D['bilirubin_uln_multiple']['derived_actual_field']='bilirubin_micromol_l';D['bilirubin_micromol_l']['ui_derived_from']='bilirubin_uln_multiple'
   add('SOURCE_SCOPE',c('extensive_sclc_iv_combination_unsuitable','==',False),'consultant_review','This source is for extensive SCLC unsuitable for IV or combination chemotherapy.',1)
   add('LIVE_VACCINE',c('live_vaccine','==',True),'contraindicated','Yellow fever or other live vaccination is excluded by this NCCP regimen.',1)
   add('SCHEDULE_MISSING',c('oral_schedule','missing'),'consultant_review','Select exactly one of three alternative oral etoposide schedules. They are alternatives, not treatment phases.',1)
   add('SCHEDULE_UNCONFIRMED',c('oral_schedule_confirmed','==',False),'withhold','Verify dose, dosing days and next-cycle start before dispensing or administration.',1)
   add('CONTINUOUS_SOURCE_CONFLICT',c('oral_schedule','==','schedule_21d'),'consultant_review','NCCP lists50mg/m²dailyDays1–21 every21days without a rest week. Vepesid SmPC describes2–3weeks then a one-week rest/recovery. Prescriber/pharmacy must explicitly confirm planned stop/restart dates; never insert or remove a rest week automatically.',1)
   add('LOW_ANC',c('anc_x10e9_l','<',1),'delay','Delay for ANC<1; reassess recovery.')
   add('LOW_PLATELETS',c('platelets_x10e9_l','<',75),'delay','Delay for platelets<75; reassess recovery.')
   add('COUNTS_75_PERCENT',any_(all_(c('anc_x10e9_l','>=',1),c('anc_x10e9_l','<=',1.49)),all_(c('platelets_x10e9_l','>=',75),c('platelets_x10e9_l','<=',99))),'consultant_review','NCCP table lists75% at ANC1–1.49 OR platelets75–99. SmPC baseline/new-cycle marrow requirements differ; confirm stage, recovery and consultant plan before dose selection.')
   add('COUNTS_DECIMAL_GAP',any_(all_(c('anc_x10e9_l','>',1.49),c('anc_x10e9_l','<',1.5)),all_(c('platelets_x10e9_l','>',99),c('platelets_x10e9_l','<',100))),'consultant_review','Printed count bands leave this decimal interval unassigned. Do not round; confirm with prescriber/pharmacy.')
   add('ETOP_RENAL_15_TO50',all_(c('etoposide_crcl_ml_min','>=',15),c('etoposide_crcl_ml_min','<=',50)),'dose_reduce','NCCP00388:75% etoposide at CrCl15–50 inclusive. Subsequent dosing depends on tolerance/effect.')
   add('ETOP_RENAL_LT15',c('etoposide_crcl_ml_min','<',15),'consultant_review','Data lacking at CrCl<15; further reduction should be considered by specialist, without an automated percentage.')
   add('ETOP_RENAL_LEGACY',c('etoposide_renal_band','in',['ge50','15_49','lt15','dialysis']),'consultant_review','Confirm current CrCl: legacy≥50 includes exact50 which needs75%, and dialysis requires individual review. Do not silently assume full dose.')
   add('ETOP_HEPATIC_50',any_(all_(c('bilirubin_micromol_l','>=',26),c('bilirubin_micromol_l','<=',51)),all_(c('ast_u_l','>=',60),c('ast_u_l','<=',180))),'dose_reduce','NCCP00388:50% at bilirubin26–51µmol/L OR AST60–180U/L. If either exceeds the upper boundary, specialist clinical decision takes precedence.')
   add('ETOP_HEPATIC_HIGH',any_(c('bilirubin_micromol_l','>',51),c('ast_u_l','>',180)),'consultant_review','Bilirubin>51µmol/L OR AST>180U/L: clinical decision, not a fixed dose. Do not substitute00319bilirubin/albumin table.')
   add('ETOP_RATIO_NEEDS_ABSOLUTE',all_(c('bilirubin_uln_multiple','>=',0),c('bilirubin_micromol_l','missing')),'consultant_review','NCCP00388 uses absolute bilirubin and AST. Ratio alone cannot select these doses.')
   add('SEVERE_NONHAEM',c('other_nonhaem_toxicity_grade','>=',3),'consultant_review','Assess severe toxicity urgently. NCCP00388 gives no generic non-haematological dose percentage; use specialist/SmPC review.',3)
 for key,d in D.items():
  d['required']=False;d.setdefault('demo_value','');d.setdefault('input_role','decision')
  if key.endswith('_grade'):
   d.pop('ctcae_version',None);d.pop('ctcae_source_url',None);d.update(grading_source_label=f'NCCP {code} adverse-event table; grading edition unspecified',grading_source_url=url,source_grading_note='Source action table does not specify grading edition. Confirm named event and grade using local verified grading policy.',assessment_guidance=d.get('assessment_guidance','Confirm named event and grade; do not infer grade from a single nonspecific symptom.'))
 p['required_inputs']=[];p['rule_engine']['rules']=rules
 finalize_proposal(p,code)
 (B/'proposed'/f.name).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
print('Four protocol proposals written')
