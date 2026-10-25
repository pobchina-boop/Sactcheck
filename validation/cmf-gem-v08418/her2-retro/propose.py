"""Build review copies only. Parent reviews and applies; production is untouched."""
import copy, json, subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[3]
O=Path(__file__).resolve().parent
BASE='e6bd944ac3132d517959aa9c227d6bac74a6a9b7'
CODES=['00316','00433','00745','00512','00815']
def c(f,op,v=None):
 d={'field':f,'operator':op}
 if v is not None:d['value']=v
 return d
def all_(*x):return {'all':list(x)}
def any_(*x):return {'any':list(x)}
def settext(r,t):r['action']['recommendation']=t;r['explanation']=t
def boolean(label):return dict(label=label,type='boolean',required=False,always_show=True,input_role='decision')
def num(label,unit='',maximum=None):
 d=dict(label=label,type='number',min=0,step=0.01,unit=unit,required=False,always_show=True,input_role='decision')
 if maximum is not None:d['max']=maximum
 return d
for code in CODES:
 f=next((R/'protocols/breast').glob(code+'-*'))
 raw=subprocess.check_output(['git','show',BASE+':'+str(f.relative_to(R))],cwd=R,text=True)
 p=json.loads(raw)
 (O/'baseline').mkdir(parents=True,exist_ok=True);(O/'baseline'/f.name).write_text(raw)
 rules=p['rule_engine']['rules'];I=p['input_definitions'];by={r['rule_id']:r for r in rules}
 def add(id,cond,typ,components,text,page,source=None):
  a=dict(type=typ,components=components,recommendation=text)
  if typ=='consultant_review':a.update(dose_calculation='specialist_review',show_in_dose_actions=True,block_numeric_dose=True)
  rr=dict(rule_id=id,when=cond,action=a,explanation=text,source=source or dict(document=f'NCCP {code} v{p["metadata"]["nccp_version"]}',url=p['metadata']['source_url'],page=page))
  rules.append(rr);by[id]=rr
 cont='trastuzumab_maintenance' if code=='00815' else 'continuation'
 chemo=any_(c('treatment_phase','missing'),c('treatment_phase','!=',cont))
 add('BASELINE_STAGE_CONTEXT',all_(chemo,c('assessment_stage','missing'),c('anc_x10e9_l','>=',1),c('anc_x10e9_l','<',1.5)),'consultant_review',['paclitaxel'] if code in ['00512','00815'] else ['doxorubicin','cyclophosphamide','paclitaxel'],'Confirm whether this is baseline initiation or an ongoing dose. ANC below 1.5 excludes starting this source regimen; ongoing count tables are different. Do not infer the assessment stage.',3 if code=='00815' else 2)
 if code=='00433':
  by['PREVIOUS_FN']['when']=all_(c('treatment_phase','==','ac'),c('prior_febrile_neutropenia','==',True))
  by['PREVIOUS_FN']['action']['components']=['doxorubicin','cyclophosphamide']
  settext(by['PREVIOUS_FN'],'The AC table describes 75% dosing after prior febrile neutropenia once recovered. Confirm original/current doses and recovery; this AC instruction does not assign a paclitaxel or trastuzumab reduction.')
  add('PREVIOUS_FN_TAXANE',all_(c('treatment_phase','==','paclitaxel'),c('prior_febrile_neutropenia','==',True)),'consultant_review',['paclitaxel'],'Review prior febrile neutropenia and consider G-CSF. The weekly paclitaxel table does not assign the AC 75% rule for FN alone; use the actual count nadir, duration, recovery and current dose.',4)
  add('PREVIOUS_FN_PHASE_UNKNOWN',all_(c('treatment_phase','missing'),c('prior_febrile_neutropenia','==',True)),'consultant_review',['doxorubicin','cyclophosphamide','paclitaxel'],'Confirm AC versus weekly paclitaxel before planning after prior febrile neutropenia. Their dose-modification tables differ; no automatic percentage is assigned without the phase.',3)
 if code=='00512':
  by['PAC_FN']['action']['type']='withhold'
  settext(by['PAC_FN'],'Withhold paclitaxel and assess febrile neutropenia urgently. Consider G-CSF after recovery. FN alone does not assign an automatic one-level reduction in this source; apply any separate count/duration criteria and review the actual dose.')
  add('HER2_SCHEDULE_MISMATCH',all_(c('treatment_phase','==','combination'),c('trastuzumab_schedule','==','q21')),'consultant_review',['trastuzumab'],'NCCP 00512 uses weekly trastuzumab during the 12-week paclitaxel combination. A 21-day antibody schedule is permitted for continuation; confirm the actual phase or select regimen 00815 for the 21-day combination.',1)
  for rid in ['H_LATE_q21False','H_LATE_q21True']:
   by[rid]['when']=all_(any_(c('treatment_phase','missing'),c('treatment_phase','==','continuation')),by[rid]['when'])
 if code=='00815':
  by['ECOG_REVIEW']['when']=c('ecog','>',2)
  settext(by['ECOG_REVIEW'],'ECOG above 2 is outside NCCP 00815 eligibility; consultant review of fitness and regimen choice is required.')
  for field,label in [('her2_positive','Validated HER2-positive cancer'),('indication_eligible','Adjuvant, node-negative breast cancer with tumour size at most 3 cm'),('severe_hepatic_impairment','Severe hepatic impairment'),('significant_cardiac_disease','Clinically significant cardiac disease'),('cardiac_monitoring_overdue','Required cardiac assessment unavailable or overdue'),('current_infusion_reaction','Current suspected infusion or administration reaction'),('sc_trastuzumab_locally_approved','SC trastuzumab substitution approved locally')]:I[field]=boolean(label)
  I['days_since_last_sc_trastuzumab']=num('Days since last SC trastuzumab dose','days')
  I['trastuzumab_route']['label']='Trastuzumab formulation (select to interpret dose and late-dose advice)'
  add('BASELINE_ANC',all_(chemo,c('assessment_stage','==','baseline'),c('anc_x10e9_l','<',1.5)),'contraindicated',['paclitaxel'],'Baseline ANC below 1.5 is an exclusion in NCCP 00815. Do not start paclitaxel; this is separate from ongoing treatment count thresholds.',3)
  add('HER2_STATUS',c('her2_positive','==',False),'consultant_review',['trastuzumab'],'Validated HER2 overexpression or amplification is required. Reconcile the pathology and regimen selection before treatment.',3)
  add('INDICATION_REVIEW',c('indication_eligible','==',False),'consultant_review',['paclitaxel','trastuzumab'],'This source is for adjuvant, HER2-positive, node-negative breast cancer with tumour size at most 3 cm. Confirm indication or choose the appropriate regimen.',1)
  add('SEVERE_HEPATIC_EXCLUSION',all_(chemo,c('severe_hepatic_impairment','==',True)),'contraindicated',['paclitaxel'],'Severe hepatic impairment is a source chemotherapy exclusion. Do not administer paclitaxel; consider trastuzumab-only treatment separately with the specialist.',3)
  add('CARDIAC_EXCLUSION',c('significant_cardiac_disease','==',True),'withhold',['trastuzumab'],'Clinically significant cardiac disease is a source exclusion. Withhold planned trastuzumab pending consultant/cardiology assessment; normal isolated bloods do not remove this exclusion.',3)
  add('CARDIAC_MONITORING_REQUIRED',c('cardiac_monitoring_overdue','==',True),'consultant_review',['trastuzumab'],'Obtain and review the required baseline or follow-up cardiac assessment before the next trastuzumab decision. NCCP requests cardiac function every 12 weeks, sooner if impairment is suspected.',4)
  add('CURRENT_REACTION',c('current_infusion_reaction','==',True),'withhold',['paclitaxel','trastuzumab'],'Stop the current administration and assess a suspected infusion or administration reaction immediately under local emergency policy; identify the responsible medicine before any restart.',6)
  add('CURRENT_FN',all_(chemo,c('febrile_neutropenia','==',True)),'withhold',['paclitaxel'],'Withhold paclitaxel and assess suspected febrile neutropenia urgently. Consider G-CSF after recovery. FN alone does not assign an automatic one-level reduction; use the source count/duration criteria and consultant plan.',5)
  add('FN_CONTINUATION',all_(c('treatment_phase','==',cont),c('febrile_neutropenia','==',True)),'consultant_review',['trastuzumab'],'Suspected febrile neutropenia requires urgent assessment even after paclitaxel stops. Review the acute illness before planned treatment; no paclitaxel dose or automatic antibody reduction is generated during continuation.',6)
  # Preserve percentage-of-original instructions; a fixed60/40 can re-escalate an already reduced dose.
  for rid,percent,standard in [('PAC_HEP_60',75,60),('PAC_HEP_40',50,40)]:
   rr=by[rid];rr['action'].pop('dose',None);rr['action'].update(type='consultant_review',dose_calculation='specialist_review',show_in_dose_actions=True,block_numeric_dose=True)
   settext(rr,f'This hepatic band specifies {percent}% of the ORIGINAL prescribed paclitaxel dose ({standard} mg/m² only for an 80 mg/m² starting dose). Review the documented original/current doses and prior reductions; do not automatically re-escalate.')
  for rid in ['PAC_ANC_LOW','PAC_PLT_LOW','PAC_PLT_90_OVERLAP','PAC_PROLONGED_NEUTROPENIA','PAC_SEVERE_THROMBOCYTOPENIA','PAC_NEURO_G2','PAC_OTHER_G2','PAC_G3','PAC_HEP_STOP','PAC_HEP_60','PAC_HEP_40','PAC_HEP_GAP_1.25','PAC_HEP_GAP_2','PAC_HEP_CONTEXT']:
   # These remain phase-specific. Missing phase invokes the explicit context rule below.
   pass
  by['PHASE_CONTEXT']['when']=all_(c('treatment_phase','missing'),any_(*[c(k,'exists') for k in ['anc_x10e9_l','platelets_x10e9_l','neuropathy_grade','alt_uln_multiple','bilirubin_uln_multiple','other_nonhaem_toxicity_grade','severe_hepatic_impairment','anc_below_0_5_ge7_days','febrile_neutropenia']]))
  add('SEVERE_HEPATIC_PHASE_UNKNOWN',all_(c('treatment_phase','missing'),any_(c('alt_uln_multiple','>=',10),c('bilirubin_uln_multiple','>',5))),'contraindicated',['paclitaxel'],'This value crosses the paclitaxel hepatic contraindication threshold if chemotherapy is still prescribed. Establish the active phase; do not assume trastuzumab-only continuation.',5)
  add('LVEF_CHANGE_REVIEW',all_(c('lvef_drop_points_from_baseline','>=',10),c('current_lvef_percent','missing')),'consultant_review',['trastuzumab'],'Obtain current LVEF to apply the source combined criterion: a fall of at least 10 percentage points AND LVEF below 50%. A missing current result is not normal.',6)
  add('LVEF_LOW_REVIEW',all_(c('current_lvef_percent','<',50),c('lvef_drop_points_from_baseline','<',10)),'consultant_review',['trastuzumab'],'Current LVEF below 50% warrants consultant/cardiology review even though the supplied fall is less than 10 points. This does not meet the complete printed automatic hold criterion and is not treatment clearance.',6)
  rules.remove(by['MISSED_TRASTUZUMAB'])
  add('MISSED_TRASTUZUMAB',all_(c('days_overdue_trastuzumab','>',0),c('trastuzumab_route','missing')),'consultant_review',['trastuzumab'],'Select IV versus SC formulation and verify time overdue before using late-dose advice. IV loading and SC600mg scheduling are different.',4)
  smpc=dict(document='EMA Herceptin SmPC section4.2; resolves NCCP00815 p4 schedule discrepancy',url='https://www.ema.europa.eu/en/documents/product-information/herceptin-epar-product-information_en.pdf',page=5)
  add('H_LATE_IV_SHORT',all_(c('trastuzumab_route','==','iv'),c('days_overdue_trastuzumab','>',0),c('days_overdue_trastuzumab','<=',7)),'consultant_review',['trastuzumab'],'IV dose up to one week overdue: usual maintenance6mg/kg as soon as possible after review; next maintenance21days later per EMA. Confirm actual history and cardiac assessment; not an automatic restart order.',4,smpc)
  add('H_LATE_IV_RELOAD',all_(c('trastuzumab_route','==','iv'),c('days_overdue_trastuzumab','>',7)),'consultant_review',['trastuzumab'],'IV dose more than one week overdue: clinician-directed reload8mg/kg over about90minutes, then6mg/kg21days later per EMA. NCCP00815 p4 contains conflicting weekly wording; reconcile with oncology/pharmacy and do not administer6mg/kg weekly.',4,smpc)
  add('H_LATE_SC',all_(c('trastuzumab_route','==','sc'),c('days_overdue_trastuzumab','>',0)),'consultant_review',['trastuzumab'],'SC dose missed: review giving the next600mg dose as soon as possible. Keep at least21days between SC administrations. No IV weight-based loading dose applies to SC treatment.',4)
  add('SC_INTERVAL_SHORT',all_(c('trastuzumab_route','==','sc'),c('days_since_last_sc_trastuzumab','<',21)),'withhold',['trastuzumab'],'Do not administer the next SC trastuzumab dose at an interval shorter than21days. Verify the actual administration history and reschedule under the prescribing team.',4)
  add('SC_LOCAL_APPROVAL',all_(c('trastuzumab_route','==','sc'),any_(c('sc_trastuzumab_locally_approved','missing'),c('sc_trastuzumab_locally_approved','==',False))),'consultant_review',['trastuzumab'],'SC substitution is permitted in NCCP00815 only where approved locally. Confirm that approval and the prescribed formulation before selecting the600mg schedule.',1)
  p['metadata']['dose_schedule_variant_input']='trastuzumab_route'
  p['metadata']['dose_schedule_variants']={'combination':{'iv':'combination','sc':'combination_sc'},cont:{'iv':cont,'sc':cont+'_sc'}}
  p['metadata']['schedule_summary']='Adjuvant node-negative HER2-positive disease, tumour size at most3cm: paclitaxel80mg/m² weekly for12doses across four21-day cycles; trastuzumab IV8mg/kg loading then6mg/kg every21days, or locally approved SC600mg every21days without loading. Continue trastuzumab alone to complete one total year, not a new year after chemotherapy.'
  for ph in list(p['treatment_phases']):
   if ph['phase_id']=='combination':ph['cycles']=[1,2,3,4]
   sc=copy.deepcopy(ph);sc['phase_id']+='_sc';sc['name']+=' (SC trastuzumab alternative)';sc['label']=sc['name']
   for a in sc['administration']:
    if a['drug']=='trastuzumab':a.update(dose={'value':600,'unit':'mg'},route='SC injection',notes='Locally approved alternative to IV, not additional treatment. No loading dose; every21days. Observe30minutes after first injection and15minutes after subsequent injections unless local policy differs.')
   p['treatment_phases'].append(sc)
 # Separate pre-treatment eligibility from historical LVEF at ongoing review.
 current='current_lvef_percent' if code=='00815' else 'lvef_percent'
 baseline_ids=['BASELINE_LVEF_LT50','BASELINE_LVEF_50_54'] if code=='00815' else ['HER2_BASELINE_LOW','HER2_BASELINE_BORDERLINE']
 for rid in baseline_ids:
  if rid in by: by[rid]['when']=all_(c('assessment_stage','==','baseline'),by[rid]['when'])
 cut=55 if code in ['00433','00512','00815'] else 50
 op='<=' if code in ['00433','00512','00745'] else '<'
 add('BASELINE_LVEF_STAGE_CONTEXT',all_(c('assessment_stage','missing'),c('baseline_lvef_percent',op,cut)),'consultant_review',['trastuzumab'],'Confirm whether the recorded LVEF is a current pre-treatment result or historical baseline. Apply initiation eligibility only at baseline; ongoing cardiac decisions need the current LVEF, change from baseline and symptoms.',3 if code=='00815' else 2)
 add('HISTORICAL_LVEF_CURRENT_MISSING',all_(c('assessment_stage','==','ongoing'),c('baseline_lvef_percent',op,cut),c(current,'missing')),'consultant_review',['trastuzumab'],'A previously low or borderline baseline LVEF does not establish current cardiac function. Obtain the current result and review symptoms and change from baseline before the next trastuzumab decision; no automatic current contraindication is inferred from history alone.',4 if code=='00815' else 2)
 add('BASELINE_CURRENT_LVEF_LOW',all_(c('assessment_stage','==','baseline'),c('baseline_lvef_percent','missing'),c(current,'<',50)),'withhold',['trastuzumab'],'Current LVEF below 50% at initiation is outside the source eligibility. Withhold planned trastuzumab and obtain specialist cardiac assessment; do not require a historical LVEF fall to identify low starting function.',3 if code=='00815' else 2)
 if code in ['00433','00512','00815']:
  add('BASELINE_CURRENT_LVEF_BORDERLINE',all_(c('assessment_stage','==','baseline'),c('baseline_lvef_percent','missing'),c(current,'>=',50),c(current,op,55)),'consultant_review',['trastuzumab'],'The current pre-treatment LVEF lies in the source range requiring clinical judgement. Confirm cardiology/oncology advice before starting; this initiation threshold is separate from the ongoing fall-plus-current-LVEF rule.',3 if code=='00815' else 2)
 if code=='00745':
  add('BASELINE_LVEF_50_REVIEW',all_(c('assessment_stage','==','baseline'),any_(c('baseline_lvef_percent','==',50),all_(c('baseline_lvef_percent','missing'),c(current,'==',50)))),'consultant_review',['trastuzumab'],'NCCP 00745 specifies LVEF above 50% before doxorubicin/trastuzumab, while its exclusion is below 50%. Resolve exactly 50% with the consultant; do not infer eligibility from the gap.',2)
 # Mark source reconciliation but never imply completed independent clinical review.
 p['metadata']['sactcheck_encoding_version']='0.84.18';p['metadata']['source_checked_date']='2026-10-25'
 p['metadata']['source_document_pages']={'00316':7,'00433':8,'00745':8,'00512':6,'00815':8}[code]
 p['metadata']['validation'].update(source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 (O/'proposed').mkdir(parents=True,exist_ok=True);(O/'proposed'/f.name).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print('Five source-review copies written; production unchanged.')
