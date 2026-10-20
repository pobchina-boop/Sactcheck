import json
from pathlib import Path
out=Path(__file__).parent
cases=[]
def add(code,phase,inputs,action,note,page,dose=None,**extra):
    e={'action':action,'note':note,'source_physical_page':page,'whole_regimen_clearance':False}
    if dose is not None:e['dose']=dose
    e.update(extra)
    cases.append({'id':f'{code}-{len(cases)+1:03d}','regimen':code,'phase':phase,'inputs':inputs,'expected':e})
for code in ['00348','00734']:
    # Same strict source ddAC inequalities; each row is a partial domain observation.
    for anc,platelets,action,note in [
        (1.01,101,'full_dose_haematology_domain','Both source thresholds strictly exceeded'),
        (1,101,'source_gap_review','ANC exactly1 is absent from the printed table'),
        (.99,101,'delay','Delay at least1week;100% after source count recovery'),
        (1.01,100,'source_gap_review','Platelets exactly100 absent from printed table'),
        (1.01,99,'delay','Delay at least1week; source platelet-delay row'),
        (1,100,'source_gap_review','Both exact-equality boundaries unlisted'),
        (.9,90,'delay_and_review','Both low; do not infer a dose from an unlisted combination'),
        (1.5,90,'delay','Must not use the copied75% or>90 threshold'),
        (1.2,120,'full_dose_haematology_domain','ActualddAC does not requireANC>=1.5')]:
        add(code,'dose_dense_ac',{'anc_x10e9_l':anc,'platelets_x10e9_l':platelets},action,note,5)
    add(code,'dose_dense_ac',{'platelets_x10e9_l':99},'delay','Single abnormal value sufficient; missingANC remainsunassessed',5)
    add(code,'dose_dense_ac',{'anc_x10e9_l':.9},'delay','Single abnormalANC sufficient; missingplatelets unassessed',5)
    add(code,'dose_dense_ac',{'platelets_x10e9_l':99,'haematological_delay_occurrence':2},'delay_then_75_percent','Source platelet-delay row; reduce after second delay and count recovery',5)
    add(code,'unknown',{'anc_x10e9_l':1.1,'platelets_x10e9_l':95},'phase_review','Cannot choose between weekly/platinum andddAC count rules; no definitive dose',None)
    add(code,'unknown',{'bilirubin_umol_l':40},'phase_review','Do not report doxorubicin50% unlessAC is active',None)
    add(code,'dose_dense_ac',{},'unassessed','No value supplied does not meanproceed',None)
    for gfr,action in [(19.9,'do_not_administer_carboplatin'),(20,'do_not_administer_carboplatin'),(20.01,'extreme_caution'),(30,'extreme_caution'),(30.01,'no_low_gfr_stop_trigger')]:
        add(code,'taxane_platinum',{'gfr_ml_min':gfr},action,'Carboplatin renal band only; not general clearance',5 if code=='00348' else 6)
    add(code,'taxane_platinum',{'gfr_ml_min':125},'calvert_target_check','Target must matchNCCP schedule',2,dose={'target_auc':6 if code=='00348' else 2,'calculated_mg':900 if code=='00348' else 300})
    add(code,'taxane_platinum',{'gfr_ml_min':140},'calvert_cap_check','GFR capped125 in this source; source dosing review applies',2,dose={'target_auc':6 if code=='00348' else 2,'gfr_cap_ml_min':125,'calculated_mg':900 if code=='00348' else 300})
    for alt,bili,action,dose in [(9.99,1.25,'paclitaxel_dose_domain',80),(9.99,1.26,'paclitaxel_dose_domain',60),(9.99,2,'paclitaxel_dose_domain',60),(9.99,2.01,'paclitaxel_dose_domain',40),(9.99,5,'paclitaxel_dose_domain',40),(10,1,'paclitaxel_not_recommended',None),(1,5.01,'paclitaxel_not_recommended',None),(1,1.255,'source_gap_review',None),(1,2.005,'source_gap_review',None)]:
        add(code,'taxane_platinum',{'alt_ratio_uln':alt,'bilirubin_ratio_uln':bili},action,'Source paclitaxel hepatic bands; do not apply toAC',5,dose={'mg_m2':dose} if dose is not None else None)
    add(code,'taxane_platinum',{'alt_ratio_uln':10},'paclitaxel_not_recommended','OR stop applies even withoutbilirubin',5)
    add(code,'taxane_platinum',{'bilirubin_ratio_uln':1},'partial_await_alt','Do not inferALT<10 frommissingALT',5)
    for bili,action,dose in [(20,'doxorubicin_dose_domain',50),(50,'doxorubicin_dose_domain',50),(50.5,'source_gap_review',None),(51,'source_gap_review',None),(51.01,'doxorubicin_dose_domain',25),(86,'doxorubicin_dose_domain',25),(86.01,'omit_doxorubicin' if code=='00348' else 'doxorubicin_not_recommended',None)]:
        add(code,'dose_dense_ac',{'bilirubin_umol_l':bili},action,'Preserve source >51 lowerbound and exact units',5 if code=='00348' else 6,dose={'percent':dose} if dose is not None else None)
    add(code,'dose_dense_ac',{'child_pugh_class':'C'},'omit_doxorubicin' if code=='00348' else 'doxorubicin_not_recommended','Independent source stop',5 if code=='00348' else 6)
    for crcl,action,dose in [(30,'cyclophosphamide_dose_domain',100),(29,'cyclophosphamide_dose_domain' if code=='00348' else 'consider_cyclophosphamide_dose',75),(10,'cyclophosphamide_dose_domain' if code=='00348' else 'consider_cyclophosphamide_dose',75),(9.99,'cyclophosphamide_not_recommended',None),(29.5,'source_gap_review',None)]:
        add(code,'dose_dense_ac',{'crcl_ml_min':crcl},action,'Do not silentlyround; <10 mayconsider50% onlyif unavoidable',5,dose={'percent':dose} if dose is not None else None)
    add(code,'dose_dense_ac',{'hepatic_impairment_severity':'severe'},'cyclophosphamide_not_recommended','Reduced efficacy concern; not a fabricatedbilirubin threshold',5)
    add(code,'dose_dense_ac',{'haemodialysis':True},'consider_doxorubicin_75_percent','Dialysis dose needsexplicitconsultantreview; no automaticfull-dose rule',5 if code=='00348' else 6)
    for vals,action,note in [
        ({'neuropathy_grade':2,'neuropathy_occurrence':1},'reduce_paclitaxel_10_mg_m2','Firstoccurrence'),
        ({'neuropathy_grade':2,'neuropathy_persistent_or_second_occurrence':True},'further_reduce_paclitaxel_10_mg_m2','Furtherrelative reduction'),
        ({'other_non_haematological_toxicity_grade':2},'hold_until_grade_le1_then_reduce_10_mg_m2','Othergrade2'),
        ({'paclitaxel_non_haematological_toxicity_grade':3},'discontinue_paclitaxel','Grade3reactionmust override reduction-only outcome'),
        ({'paclitaxel_dose_reduction_count':2,'intolerable_toxicity_after_reductions':True},'discontinue_paclitaxel','Source says cannot tolerate after2, notonly count>2'),
        ({'paclitaxel_dose_reduction_count':2,'intolerable_toxicity_after_reductions':False},'no_count_only_discontinuation','Count2 alone doesnot establishintolerance'),
        ({'paclitaxel_delay_days':14},'no_duration_only_discontinuation','Source says greaterthan2weeks'),
        ({'paclitaxel_delay_days':14.1},'discontinue_paclitaxel','Delay>2weeks')]:
        add(code,'taxane_platinum',vals,action,note,6)
    add(code,'dose_dense_ac',{'neuropathy_grade':2,'neuropathy_occurrence':1},'no_paclitaxel_dose_action','Paclitaxel not activeinAC; still assesssymptom clinically',6)
    add(code,'taxane_platinum',{'bilirubin_umol_l':40},'no_doxorubicin_dose_action','Doxorubicin not activeintaxanephase; bilirubin stillrelevant usingpaclitaxelULN context',5)

for anc,action in [(1,'full_anc_domain'),(.99,'delay'),(.5,'delay'),(.499,'delay_consider_25_percent_reduction')]:
    add('00734','taxane_platinum',{'anc_x10e9_l':anc},action,'IndependentANC band appliesbothdrugs everyweekly dose',4)
for pl,action in [(100,'full_platelet_domain'),(99.9,'clinician_discretion_if_well'),(75,'clinician_discretion_if_well'),(74.9,'delay'),(50,'delay'),(49.9,'delay_consider_25_percent_reduction')]:
    add('00734','taxane_platinum',{'platelets_x10e9_l':pl},action,'Independentplateletband; normalANC notassumed',4)
for day in [1,8,15]:
    add('00734','taxane_platinum',{'day_number':day,'anc_x10e9_l':.4},'delay_both_drugs_consider_25_percent_reduction','Notpaclitaxel-onlyomission',4)
add('00734','taxane_platinum',{'febrile_neutropenia':True},'delay_consider_25_percent_reduction','ClinicalacuteFNalso requiresurgentcare; thisonly representsdosemodification',4)
add('00734','taxane_platinum',{'haematological_delay_days':15},'delay_consider_50_percent_or_cease','Prolongedrecoverygreaterthan2weeks',4)
add('00734','taxane_platinum',{'haematological_delay_occurrence':3},'delay_consider_50_percent_or_cease','Thirdmyelosuppressiondelay',4)
add('00734','baseline',{'anc_x10e9_l':1.5},'source_gap_review','Eligibility>1.5butexclusion<1.5;exactboundaryneedsreview',3)
add('00734','dose_dense_ac',{'crcl_ml_min':10},'doxorubicin_source_gap_review','Source>10and<10 omitexact10; cyclophosphamide10bandseparatelyapplies',5)
for vals,action,note in [
    ({'cycle_number':2,'day_number':1,'anc_x10e9_l':1,'platelets_x10e9_l':90},'full_dose_haematology_domain','Exactinclusiveboundaries'),
    ({'cycle_number':2,'day_number':1,'anc_x10e9_l':.99,'platelets_x10e9_l':90},'delay','ANC<1'),
    ({'cycle_number':2,'day_number':1,'anc_x10e9_l':1,'platelets_x10e9_l':89},'delay_and_source_wording_review','Ambiguousprinted<70–90 cannotmeanproceed'),
    ({'cycle_number':1,'day_number':1,'anc_x10e9_l':1.1,'platelets_x10e9_l':100},'baseline_source_review','Table2labelledcycles2–4'),
    ({'cycle_number':2,'day_number':8,'anc_x10e9_l':.4},'source_specific_review','No00348D8counttable; removeimportedomitthreshold'),
    ({'cycle_number':2,'day_number':15,'platelets_x10e9_l':49},'source_specific_review','No00348D15counttable; notautomaticcopiedomission')]:
    add('00348','taxane_platinum',vals,action,note,4)
obj={'purpose':'Independent expectations, not executed tests. Source gaps deliberately yield review, not inventedproceed. Expectedaction names are semantic oracles, not exactengineidentifiers.','checked_date':'2026-10-20','units':{'anc_x10e9_l':'10^9/L','platelets_x10e9_l':'10^9/L','gfr_ml_min':'mL/min','crcl_ml_min':'mL/min','bilirubin_umol_l':'micromol/L'},'cases':cases}
(out/'boundary-expectations.json').write_text(json.dumps(obj,indent=2)+'\n')
print('Saved',len(cases),'source-derived boundary expectations.')
