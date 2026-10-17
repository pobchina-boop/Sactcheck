"""Reconcile the five breast protocols against the source tables audited for v0.83.8."""
import json, copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CODES=['00485','00815','00659','00892','00936']
def read(c):
    p=next((ROOT/'protocols/breast').glob(c+'-*.json'))
    return p,json.loads(p.read_text())
def atom(f,op,v=None):
    op='exists' if op=='present' else op
    return dict(field=f,operator=op,**({} if op in ['missing','exists'] else {'value':v}))
def allof(*xs):return {'all':list(xs)}
def anyof(*xs):return {'any':list(xs)}
def band(f,lo,hi):return allof(atom(f,'>=',lo),atom(f,'<=',hi))
def num(d,k,label,unit='',maxval=None):
    d['input_definitions'][k]={'label':label,'type':'number','demo_value':2,'required':False,'min':0,'step':0.01,'unit':unit,'always_show':True,'input_role':'decision',**({'max':maxval} if maxval is not None else {})}
    if k=='crcl_ml_min':d['input_definitions'][k]['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'Retain exact measured creatinine clearance so decimal gaps between the source bands are surfaced for review rather than rounded into a dose band.'}
def boolean(d,k,label):d['input_definitions'][k]={'label':label,'type':'boolean','demo_value':False,'required':False,'always_show':True,'input_role':'decision'}
def select(d,k,label,opts):d['input_definitions'][k]={'label':label,'type':'select','demo_value':opts[0][0],'required':False,'always_show':True,'input_role':'context','options':[{'value':v,'label':s} for v,s in opts]}
def grade(d,k,label):
    select(d,k,label,[(i,'Grade '+str(i)) for i in range(5)]);v=d['input_definitions'][k];v['input_role']='decision';v['unit']='CTCAE grade';v['ctcae_version']='5.0';v['ctcae_source_url']='https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
    v['ctcae_category']=('neuropathy' if 'neuro' in k else 'diarrhoea' if 'diarr' in k else 'pneumonitis' if ('pneumonitis' in k or 'ild' in k) else 'hepatic_alt_ast' if ('liver' in k or 'ast_alt' in k) else 'allergic_reaction' if 'hypersens' in k else 'ppe' if 'hand_foot' in k else 'cardiac' if 'heart_failure' in k else 'other_nonhaematological')
    for o in v['options']:o['ctcae_grade']=o['value']
    v['assessment_guidance']='Assign the toxicity grade using the clinical descriptors; assess symptoms, baseline and functional impact. The source protocol action takes precedence over educational grading.'
def init(c,version=None):
    p,d=read(c);d['input_definitions']={};d['rule_engine']['rules']=[];d['required_inputs']=[];d.pop('assessment_profiles',None)
    if version:d['metadata']['nccp_version']=version
    d['status']='source_reconciled_rule_encoding_pending_independent_validation'
    d['metadata']['sactcheck_encoding_version']='0.83.8'
    d['metadata']['source_checked_date']='2026-10-17'
    d['metadata']['partial_assessment_supported']=True
    d['metadata']['validation'].update(source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
    d['metadata']['encoding_maturity']={'level':'source_reconciled_rule_encoding','label':'Source reconciled · independent clinical/pharmacy review pending','source_reconciled':True,'reconciled_release':'0.83.8','reconciled_date':'2026-10-17','consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}
    d['rule_engine']['missing_data_policy']='Evaluate supplied values independently. Missing values remain unassessed; never infer normality or phase.'
    select(d,'assessment_stage','Assessment stage',[('baseline','Before starting'),('ongoing','During treatment')])
    num(d,'ecog','ECOG performance status',maxval=4)
    for k,l in [('hypersensitivity','Relevant drug/excipient hypersensitivity'),('pregnancy','Pregnant'),('breastfeeding','Breastfeeding')]:boolean(d,k,l)
    return p,d
def rule(d,id,cond,action,components,text,page,**extra):
    if isinstance(components,str):components=[components]
    a={'type':action,'components':components,'recommendation':text,**extra}
    if action=='consultant_review':a.update(dose_calculation='specialist_review',show_in_dose_actions=True)
    d['rule_engine']['rules'].append({'rule_id':id,'when':cond,'action':a,'explanation':text,'source':{'document':f"NCCP {d['metadata']['nccp_regimen_code']} v{d['metadata']['nccp_version']}",'url':d['metadata']['source_url'],'page':page}})
def standard(d,components,page=2,ecog=1):
    rule(d,'HYPERSENSITIVITY',atom('hypersensitivity','==',True),'contraindicated',components,'Relevant hypersensitivity: do not administer; review the responsible component.',page)
    rule(d,'PREGNANCY_LACTATION',anyof(atom('pregnancy','==',True),atom('breastfeeding','==',True)),'contraindicated',components,'Pregnancy/breastfeeding requires treatment exclusion and specialist review.',page)
    rule(d,'ECOG_REVIEW',atom('ecog','>',ecog),'consultant_review',components,'Outside the published performance-status population; consultant assessment required.',page)
def save(p,d):
    priority=['anc_x10e9_l','anc','platelets_x10e9_l','platelets','treatment_phase','assessment_stage']
    fields=d['input_definitions']; d['input_definitions']={k:fields[k] for k in priority if k in fields}|{k:v for k,v in fields.items() if k not in priority}
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def phase(d,components,days,ident,label,administration):
    return {'phase_id':ident,'name':label,'cycle_length_days':days,'administration':administration}
def med(drug,dose,unit,day=1,route='IV infusion',**kw):return {'drug':drug,'dose':{'value':dose,'unit':unit},'day':day,'route':route,**kw}
def pac_rules(d,gate,page,hep_page):
    def r(id,c,a,t,pg=page,**kw):rule(d,id,allof(gate,c),a,'paclitaxel',t,pg,**kw)
    r('PAC_ANC_LOW',atom('anc_x10e9_l','<',1),'delay','Delay paclitaxel for ANC below 1.0. Establish duration, recovery and the need for dose reduction.')
    r('PAC_PLT_LOW',allof(atom('platelets_x10e9_l','>=',70),atom('platelets_x10e9_l','<',90)),'delay','Delay paclitaxel for platelets below 90. Below 70 requires one dose-level reduction after recovery.')
    r('PAC_PLT_90_OVERLAP',atom('platelets_x10e9_l','==',90),'consultant_review','The source includes platelets 90 in both the full-dose and delay bands. Resolve the overlap with oncology/pharmacy before treatment.')
    r('PAC_PROLONGED_NEUTROPENIA',atom('anc_below_0_5_ge7_days','==',True),'delay_then_dose_reduce','Delay; after recovery reduce one level (80, 65, 50 mg/m²). Consider G-CSF; confirm the actual current dose.')
    r('PAC_SEVERE_THROMBOCYTOPENIA',atom('platelets_x10e9_l','<',70),'delay_then_dose_reduce','Delay; after recovery reduce one paclitaxel level. Confirm the current level before any restart.')
    r('PAC_NEURO_G2',atom('neuropathy_grade','==',2),'dose_reduce','Grade 2 neuropathy: decrease paclitaxel by 10 mg/m² from the actual current dose.',absolute_reduction={'value':10,'unit':'mg/m2'},dose_calculation='specialist_review')
    r('PAC_OTHER_G2',atom('other_nonhaem_toxicity_grade','==',2),'withhold','Hold until grade ≤1, then reduce subsequent doses by 10 mg/m² from the actual dose.')
    r('PAC_G3',anyof(atom('neuropathy_grade','>=',3),atom('other_nonhaem_toxicity_grade','>=',3)),'discontinue','Grade ≥3 paclitaxel non-haematological toxicity: discontinue per the source table.')
    r('PAC_HEP_STOP',anyof(atom('alt_uln_multiple','>=',10),atom('bilirubin_uln_multiple','>',5)),'contraindicated','Paclitaxel is not recommended at this hepatic threshold.',hep_page)
    for lo,hi,dose in [(1.26,2,60),(2.01,5,40)]:
        r('PAC_HEP_'+str(dose),allof(atom('alt_uln_multiple','<',10),band('bilirubin_uln_multiple',lo,hi)),'dose_reduce',f'Source hepatic band corresponds to {dose} mg/m² paclitaxel (from an 80 mg/m² original dose). Reconcile prior reductions.',hep_page,dose={'value':dose,'unit':'mg/m2'})
    for lo,hi in [(1.25,1.26),(2,2.01)]:r('PAC_HEP_GAP_'+str(lo),allof(atom('bilirubin_uln_multiple','>',lo),atom('bilirubin_uln_multiple','<',hi)),'consultant_review','This decimal value falls between the published hepatic bands. Do not round it into a dosing band.',hep_page)
    r('PAC_HEP_CONTEXT',allof(atom('bilirubin_uln_multiple','>',1.25),atom('alt_uln_multiple','missing')),'consultant_review','ALT is required to interpret this paclitaxel hepatic band; do not assume normal ALT.',hep_page)
def pac_inputs(d):
    for k,l,u in [('anc_x10e9_l','ANC','×10⁹/L'),('platelets_x10e9_l','Platelets','×10⁹/L'),('alt_uln_multiple','ALT / ULN','×ULN'),('bilirubin_uln_multiple','Bilirubin / ULN','×ULN')]:num(d,k,l,u)
    boolean(d,'anc_below_0_5_ge7_days','ANC below 0.5 for at least 7 days')
    boolean(d,'febrile_neutropenia','Febrile neutropenia')
    grade(d,'neuropathy_grade','Peripheral neuropathy')
    grade(d,'other_nonhaem_toxicity_grade','Other non-haematological toxicity')
    num(d,'current_paclitaxel_mg_m2','Actual current paclitaxel dose','mg/m²')

# 00485: distinct AC and taxane phases, without an invented trastuzumab phase.
p,d=init('00485');standard(d,['doxorubicin','cyclophosphamide','paclitaxel'],ecog=2);pac_inputs(d)
select(d,'treatment_phase','Current treatment phase',[('anthracycline','AC: four 14-day cycles'),('paclitaxel','Paclitaxel: 12 weekly doses')])
for k,l,u in [('bilirubin_umol_l','Bilirubin','µmol/L'),('crcl_ml_min','Creatinine clearance','mL/min'),('lvef_percent','LVEF','%'),('ac_delay_count','Prior AC haematological delays',''),('lifetime_doxorubicin_mg_m2','Cumulative doxorubicin before proposed dose','mg/m²')]:num(d,k,l,u)
for k,l in [('haemodialysis','Haemodialysis'),('severe_hepatic_impairment','Severe hepatic impairment'),('significant_heart_disease','Significant heart disease')]:boolean(d,k,l)
ac=atom('treatment_phase','==','anthracycline');tax=atom('treatment_phase','==','paclitaxel')
rule(d,'PHASE_REQUIRED_FOR_COUNTS',allof(atom('treatment_phase','missing'),anyof(atom('anc_x10e9_l','present'),atom('platelets_x10e9_l','present'))),'consultant_review','whole_regimen','AC and paclitaxel have different count thresholds. The supplied value is retained; select the current phase to resolve the component-specific rule.',3)
rule(d,'PHASE_REQUIRED_FOR_ORGANS',allof(atom('treatment_phase','missing'),anyof(atom('bilirubin_umol_l','exists'),atom('bilirubin_uln_multiple','exists'),atom('alt_uln_multiple','exists'),atom('neuropathy_grade','exists'),atom('crcl_ml_min','exists'))),'consultant_review','whole_regimen','Select the active AC or paclitaxel phase before applying its organ-function or toxicity rules.',3)
rule(d,'LOW_COUNTS_ANY_PHASE',allof(atom('treatment_phase','missing'),anyof(atom('anc_x10e9_l','<',1),atom('platelets_x10e9_l','<',90))),'delay','whole_regimen','This value is below the minimum count threshold in either chemotherapy phase. Delay and establish the active phase and recovery plan.',3)
rule(d,'AC_COUNTS_DELAY',allof(ac,anyof(atom('anc_x10e9_l','<',1),atom('platelets_x10e9_l','<',100))),'delay',['doxorubicin','cyclophosphamide'],'Delay AC for at least one week until recovery. A second delay requires consideration of 75% dosing; check exact source recovery wording.',3)
rule(d,'AC_SECOND_DELAY',allof(ac,atom('ac_delay_count','>=',2)),'consultant_review',['doxorubicin','cyclophosphamide'],'After a second count-related delay the source specifies 75% dosing. Confirm both counts have recovered before calculating a restart dose.',3)
rule(d,'AC_FN',allof(ac,atom('febrile_neutropenia','==',True)),'consultant_review',['doxorubicin','cyclophosphamide'],'Source specifies 75% for current/subsequent AC cycles after febrile neutropenia. Treat the acute event and confirm recovery before restarting.',3)
rule(d,'BASELINE_ANC',allof(atom('assessment_stage','==','baseline'),atom('anc_x10e9_l','<',1.5)),'contraindicated','whole_regimen','Baseline ANC below 1.5 is an exclusion; this differs from the on-treatment AC threshold.',2)
rule(d,'CARDIAC_EXCLUSION',anyof(atom('significant_heart_disease','==',True),allof(ac,atom('lvef_percent','<',50))),'contraindicated','doxorubicin','Do not administer doxorubicin with the source cardiac exclusion; obtain specialist review.',2)
rule(d,'LVEF_50_GAP',allof(ac,atom('lvef_percent','==',50)),'consultant_review','doxorubicin','The source excludes LVEF <50 but separately requires >50 to administer doxorubicin. Resolve exact LVEF 50 before treatment.',2)
rule(d,'LIFETIME_DOXO',allof(ac,atom('lifetime_doxorubicin_mg_m2','>=',450)),'contraindicated','doxorubicin','The published lifetime cumulative doxorubicin ceiling has been reached. Review all prior anthracycline exposure and cardiac risk.',1)
for lo,hi,pct in [(20,50,50),(51,86,25)]:rule(d,'DOXO_BILI_'+str(pct),allof(ac,band('bilirubin_umol_l',lo,hi)),'dose_reduce','doxorubicin',f'Source bilirubin band: {pct}% of the original doxorubicin dose.',3,dose_percent=pct)
rule(d,'DOXO_BILI_GAP',allof(ac,atom('bilirubin_umol_l','>',50),atom('bilirubin_umol_l','<',51)),'consultant_review','doxorubicin','Decimal bilirubin between 50 and 51 is not assigned by the source; do not round.',3)
rule(d,'DOXO_BILI_OMIT',allof(ac,atom('bilirubin_umol_l','>',86)),'omit','doxorubicin','Bilirubin above 86 µmol/L: omit doxorubicin.',3)
rule(d,'CYCLO_RENAL_75',allof(ac,band('crcl_ml_min',10,29)),'dose_reduce','cyclophosphamide','CrCl 10–29: 75% of original cyclophosphamide dose.',3,dose_percent=75)
rule(d,'CYCLO_RENAL_GAP',allof(ac,atom('crcl_ml_min','>',29),atom('crcl_ml_min','<',30)),'consultant_review','cyclophosphamide','CrCl between the published whole-number bands needs review.',3)
rule(d,'CYCLO_RENAL_OMIT',allof(ac,atom('crcl_ml_min','<',10)),'omit','cyclophosphamide','CrCl below 10: omit cyclophosphamide; specialist renal review.',3)
rule(d,'DOXO_DIALYSIS',allof(ac,atom('haemodialysis','==',True)),'consultant_review','doxorubicin','The source allows considering 75% original doxorubicin in haemodialysis. Verify the individual dialysis plan.',3)
rule(d,'CYCLO_SEVERE_HEPATIC',allof(ac,atom('severe_hepatic_impairment','==',True)),'contraindicated','cyclophosphamide','Cyclophosphamide is not recommended in severe hepatic impairment because efficacy may be reduced.',3)
pac_rules(d,tax,3,4)
rule(d,'PAC_FN',allof(tax,atom('febrile_neutropenia','==',True)),'consultant_review','paclitaxel','Review febrile neutropenia, G-CSF and the weekly paclitaxel recovery/dose plan.',3)
d['treatment_phases']=[phase(d,[],14,'anthracycline','AC: cycles 1–4',[med('doxorubicin',60,'mg/m2'),med('cyclophosphamide',600,'mg/m2')]),phase(d,[],21,'paclitaxel','Weekly paclitaxel: four three-week blocks',[med('paclitaxel',80,'mg/m2',[1,8,15])])]
d['treatment_phases'][0]['cycles']=[1,2,3,4];d['treatment_phases'][1]['cycles']=[5,6,7,8]
d['treatment_phases'][1]['transition_note']='Begin 14 days after the final AC dose, subject to review.'
save(p,d)

# 00892: early-breast dosing is 400 -> 200 mg, with its own organ rules.
p,d=init('00892','2');standard(d,'ribociclib',page=2)
for k,l,u in [('anc','ANC','×10⁹/L'),('qtc_f','QTcF','ms'),('qtc_change_ms','QTcF increase from baseline','ms'),('alt_ast_uln_multiple','Highest ALT or AST / ULN','×ULN'),('bilirubin_uln_multiple','Bilirubin / ULN','×ULN')]:num(d,k,l,u)
for k,l in [('febrile_neutropenia','Febrile neutropenia'),('recurrent_grade3','Recurrent grade 3 neutropenia'),('qtc_over480_recurrent','Recurrent QTcF >480 ms'),('qtc_over500_recurrent','Recurrent QTcF >500 ms'),('qtc_serious_arrhythmia','Torsade, polymorphic VT or serious arrhythmia symptoms'),('cholestasis_absent','Cholestasis excluded'),('recurrent_liver_grade3','Recurrent grade 3 liver toxicity'),('recurrent_liver_grade2','Recurrent grade 2 liver toxicity'),('long_qt_or_significant_cardiac_risk','Long QT or significant cardiac risk'),('electrolyte_abnormality','Uncorrected electrolyte abnormality'),('strong_cyp3a_or_qt_drug','Potential CYP3A or QT-prolonging interaction'),('node_negative','Node-negative disease'),('prior_cdk46','Previous CDK4/6 inhibitor'),('further_reduction_required','Further dose reduction required')]:boolean(d,k,l)
for k,l in [('baseline_liver_grade','Baseline ALT/AST grade'),('ast_alt_grade','Current ALT/AST grade if numerical result unavailable'),('ild_grade','ILD / pneumonitis grade'),('nonhaem_toxicity_grade','Other non-haematological toxicity')]:grade(d,k,l)
select(d,'dose_level','Current adjuvant ribociclib dose',[(400,'400 mg daily'),(200,'200 mg daily')])
select(d,'renal_band','Renal category',[('mild_moderate','Mild/moderate'),('severe','Severe'),('dialysis','Dialysis')])
select(d,'child_pugh','Child-Pugh class',[('A','A'),('B','B'),('C','C')])
select(d,'her2_status','HER2 status',[('negative','Negative'),('positive','Positive'),('unknown','Unknown')])
select(d,'hr_status','Hormone receptors',[('positive','Positive'),('negative','Negative'),('unknown','Unknown')])
R=lambda id,c,a,t,pg,**kw:rule(d,id,c,a,'ribociclib',t,pg,**kw)
R('ANC_HOLD',atom('anc','<',1),'withhold','Interrupt until ANC recovers to ≥1.0. First uncomplicated grade 3 can resume at the same dose; recurrence, grade 4 or febrile neutropenia requires the lower level after recovery.',4)
R('FEBRILE',atom('febrile_neutropenia','==',True),'withhold','Treat febrile neutropenia urgently; resume only after recovery at a lower level, or discontinue if reduction below 200 mg would be needed.',4)
R('RENAL_SEVERE',atom('renal_band','==','severe'),'consultant_review','The adjuvant source recommends a starting dose of 200 mg in severe renal impairment. Confirm the current dose and clinical context; do not calculate a percentage of the metastatic starting dose.',4)
R('RENAL_DIALYSIS',atom('renal_band','==','dialysis'),'consultant_review','The adjuvant source does not provide a separate dialysis dosing schedule. Obtain specialist oncology/pharmacy review.',4)
R('HEPATIC_BASELINE',anyof(atom('child_pugh','==','A'),atom('child_pugh','==','B'),atom('child_pugh','==','C')),'proceed_with_caution','The early-breast source requires no starting dose adjustment solely for hepatic impairment. Treatment-emergent liver toxicity is assessed separately.',4)
R('QT_BASELINE',allof(atom('assessment_stage','==','baseline'),atom('qtc_f','>=',450)),'withhold','Before starting, QTcF must be <450 ms. Correct reversible causes and review interacting medicines.',2)
R('QT_CONTEXT',allof(atom('assessment_stage','missing'),atom('qtc_f','>=',450),atom('qtc_f','<=',480)),'consultant_review','Confirm baseline versus ongoing ECG; the initiation and interruption thresholds differ.',2)
R('QT_480_500',allof(atom('qtc_f','>',480),atom('qtc_f','<=',500)),'withhold','Interrupt until QTcF <481 ms. First event: same dose after review; recurrence: next lower level. No restart dose is authorised by this abnormal result.',5)
R('QT_500',atom('qtc_f','>',500),'withhold','Interrupt until QTcF <481 ms, then the next lower level only after review. Recurrent >500 ms requires discontinuation.',5)
R('QT_RECURRENT_500',atom('qtc_over500_recurrent','==',True),'discontinue','Recurrent QTcF >500 ms: discontinue ribociclib.',5)
R('QT_ARRHYTHMIA',allof(atom('qtc_serious_arrhythmia','==',True),anyof(atom('qtc_f','>',500),atom('qtc_change_ms','>',60))),'permanently_discontinue','The source QT change with serious arrhythmia requires permanent discontinuation and urgent cardiac care.',5)
R('QT_RISK',anyof(atom('long_qt_or_significant_cardiac_risk','==',True),atom('electrolyte_abnormality','==',True)),'withhold','Correct/review QT risk and electrolyte abnormalities before treatment; specialist assessment required.',6)
g2=anyof(allof(atom('alt_ast_uln_multiple','>',3),atom('alt_ast_uln_multiple','<=',5)),atom('ast_alt_grade','==',2))
g3=anyof(allof(atom('alt_ast_uln_multiple','>',5),atom('alt_ast_uln_multiple','<=',20)),atom('ast_alt_grade','==',3))
R('LIVER_G2_CONTEXT',allof(g2,atom('baseline_liver_grade','missing')),'consultant_review','Baseline liver grade is needed. The source treats baseline grade 2 differently; do not assume normal baseline.',4)
R('LIVER_G2_HOLD',allof(g2,atom('baseline_liver_grade','<',2)),'withhold','Interrupt until baseline grade recovers. Resume same level after a first event, lower after recurrence.',4)
R('LIVER_G2_BASELINE2',allof(g2,atom('baseline_liver_grade','==',2)),'proceed_with_caution','The isolated grade 2 branch with baseline grade 2 does not require interruption. Assess bilirubin and other hepatic findings separately.',4)
R('LIVER_G3',g3,'withhold','Interrupt until recovery to baseline or lower, then reduce one level. Recurrent grade 3 requires discontinuation.',4)
R('LIVER_G3_RECURRENT',allof(g3,atom('recurrent_liver_grade3','==',True)),'discontinue','Recurrent grade 3 liver toxicity: discontinue.',4)
R('LIVER_G4',anyof(atom('alt_ast_uln_multiple','>',20),atom('ast_alt_grade','==',4)),'discontinue','Grade 4 liver toxicity: discontinue.',4)
combined=allof(atom('alt_ast_uln_multiple','>',3),atom('bilirubin_uln_multiple','>',2))
R('DILI_STOP',allof(combined,atom('cholestasis_absent','==',True)),'discontinue','ALT/AST >3×ULN with bilirubin >2×ULN without cholestasis: discontinue.',5)
R('DILI_REVIEW',allof(combined,atom('cholestasis_absent','missing')),'withhold','Combined liver abnormalities require holding treatment and urgent assessment including cholestasis before a restart decision.',5)
R('ILD_G2',atom('ild_grade','==',2),'withhold','Interrupt and assess ILD. The source describes grade 2 as asymptomatic and recovery <1; reconcile this wording with current SmPC before any lower-dose restart.',5)
R('ILD_G3_4',atom('ild_grade','>=',3),'discontinue','Severe grade 3–4 ILD: discontinue.',5)
R('OTHER_G3',atom('nonhaem_toxicity_grade','==',3),'withhold','Interrupt until grade ≤1. First occurrence resumes at the same dose; recurrence at the lower dose after review.',6)
R('OTHER_G4',atom('nonhaem_toxicity_grade','==',4),'discontinue','Other grade 4 toxicity: discontinue.',6)
R('LOWEST_DOSE',allof(atom('dose_level','==',200),atom('further_reduction_required','==',True)),'discontinue','Further reduction below 200 mg/day is not permitted.',3)
R('NODE_NEGATIVE_CONFLICT',atom('node_negative','==',True),'consultant_review','The source eligibility includes selected node-negative stage IIA disease, but its exclusion list says node-negative disease. Reconcile this internal conflict before selection.',2)
R('RECEPTOR_CONTEXT',anyof(atom('her2_status','==','positive'),atom('hr_status','==','negative'),atom('prior_cdk46','==',True)),'consultant_review','Outside the HR-positive/HER2-negative adjuvant source context or prior CDK4/6 exposure: verify eligibility.',2)
R('INTERACTIONS',atom('strong_cyp3a_or_qt_drug','==',True),'consultant_review','Review CYP3A and QT interactions against current product information and the actual adjuvant dose.',7)
d['treatment_phases']=[phase(d,[],28,'adjuvant_ribociclib','Adjuvant ribociclib with endocrine treatment',[med('ribociclib',400,'mg daily',list(range(1,22)),'oral',notes='Days 22–28 off ribociclib; endocrine partner continues on its own schedule. Up to three years.')])]
d['dose_levels']={'ribociclib':{'0':{'dose_mg':400},'-1':{'dose_mg':200}}}
save(p,d)

# 00936: separate each component and baseline, mid-cycle and recurrence contexts.
p,d=init('00936');standard(d,['tucatinib','capecitabine','trastuzumab'],page=3)
select(d,'assessment_stage','Assessment stage',[('baseline','Before first dose'),('ongoing','Planned next cycle'),('midcycle','Unscheduled bloods during cycle')])
for k,l,u in [('anc','ANC','×10⁹/L'),('platelets','Platelets','×10⁹/L'),('crcl_ml_min','Creatinine clearance','mL/min'),('alt_uln_multiple','ALT / ULN','×ULN'),('ast_uln_multiple','AST / ULN','×ULN'),('bilirubin_uln_multiple','Bilirubin / ULN','×ULN'),('lvef_percent','Current LVEF','%'),('lvef_drop_points','LVEF fall from baseline','percentage points'),('days_overdue_trastuzumab','Days overdue for IV trastuzumab','')]:num(d,k,l,u)
for k,l in [('symptomatic_chf','Symptomatic heart failure'),('severe_hepatic_impairment','Severe hepatic impairment'),('haemodialysis','Haemodialysis'),('strong_cyp3a_inducer','Strong CYP3A inducer'),('strong_cyp2c8_inhibitor','Strong CYP2C8 inhibitor'),('brivudine_recent','Recent/concomitant brivudine'),('previous_severe_fluoropyrimidine_reaction','Previous severe unexpected fluoropyrimidine reaction'),('antidiarrhoeal_already_used','Antidiarrhoeal treatment already used for this episode'),('further_tucatinib_reduction_required','Further tucatinib dose reduction required')]:boolean(d,k,l)
select(d,'dpd_status','DPD status',[('normal','No deficiency detected'),('partial','Partial deficiency'),('complete','Complete deficiency'),('untested','Not yet tested / unknown')])
select(d,'haem_event_number','Occurrence of this capecitabine blood-count toxicity',[(i,str(i)) for i in range(1,5)])
select(d,'toxicity_event_number','Occurrence of this capecitabine non-haematological toxicity',[(i,str(i)) for i in range(1,5)])
select(d,'tucatinib_dose_mg','Current tucatinib dose per administration',[(i,str(i)+' mg twice daily') for i in [300,250,200,150]])
for k,l in [('diarrhoea_grade','Diarrhoea'),('hand_foot_grade','Hand-foot syndrome'),('other_toxicity_grade','Other non-haematological toxicity'),('hypersensitivity_grade','Trastuzumab hypersensitivity')]:grade(d,k,l)
R=lambda id,c,a,comp,t,pg,**kw:rule(d,id,c,a,comp,t,pg,**kw)
R('DPD_COMPLETE',atom('dpd_status','==','complete'),'contraindicated','capecitabine','Complete DPD deficiency: do not administer capecitabine.',4)
R('DPD_PARTIAL',atom('dpd_status','==','partial'),'consultant_review','capecitabine','Partial DPD deficiency requires an individually reduced starting dose and monitoring. The source exclusion wording and partial-deficiency section need reconciliation.',4)
R('DPD_UNTESTED',atom('dpd_status','==','untested'),'withhold','capecitabine','Confirm pretreatment DPD testing and review the result before first capecitabine exposure.',3)
R('BRIVUDINE',atom('brivudine_recent','==',True),'contraindicated','capecitabine','Recent/concomitant brivudine is an exclusion; verify the required washout with pharmacy.',3)
R('PREVIOUS_FP_REACTION',atom('previous_severe_fluoropyrimidine_reaction','==',True),'contraindicated','capecitabine','Previous severe unexpected fluoropyrimidine reaction is a source exclusion.',3)
R('BASELINE_COUNTS',allof(atom('assessment_stage','==','baseline'),anyof(atom('anc','<',1.5),atom('platelets','<',100))),'consultant_review','capecitabine','Baseline counts below ANC 1.5 or platelets 100 require source-defined caution and review, distinct from ongoing thresholds.',5)
low=anyof(atom('anc','<',1.5),atom('platelets','<',75))
R('COUNTS_HOLD',low,'withhold','capecitabine','Hold capecitabine and review severity/occurrence. Recovery requires ANC ≥1.5 and platelets ≥75 before a restart decision.',5)
R('MIDCYCLE_COUNTS',allof(atom('assessment_stage','==','midcycle'),anyof(atom('anc','<',1),atom('platelets','<',75))),'withhold','capecitabine','Unscheduled mid-cycle counts below ANC 1 or platelets 75 require interruption.',5)
R('COUNTS_STAGE_UNKNOWN',allof(atom('assessment_stage','missing'),band('platelets',75,99.99)),'consultant_review','capecitabine','Confirm baseline versus ongoing treatment: the source starting-count caution differs from its ongoing platelet threshold.',5)
for id,cond,percentages in [('G2',anyof(band('anc',1,1.49),band('platelets',50,74.9)),[100,75,50,None]),('G3',anyof(band('anc',0.5,0.99),band('platelets',25,49.9)),[75,50,None,None]),('G4',anyof(atom('anc','<',0.5),atom('platelets','<',25)),['review',None,None,None])]:
    for n,pct in enumerate(percentages,1):
        msg=('Permanently discontinue capecitabine for this severity and recurrence.' if pct is None else 'First severe blood toxicity: discontinue or, if the consultant chooses continuation, hold until recovery then 50% of starting dose.' if pct=='review' else f'Hold until recovery of both counts. Source recurrence branch specifies {pct}% of starting capecitabine dose for the next cycle; reconcile existing reductions.')
        R('HAEM_'+id+'_'+str(n),allof(cond,atom('haem_event_number','==',n)),'discontinue' if pct is None else 'withhold','capecitabine',msg,5)
R('RENAL_LT30',anyof(atom('crcl_ml_min','<',30),atom('haemodialysis','==',True)),'contraindicated','capecitabine','Capecitabine is not recommended below CrCl 30 or with haemodialysis. Review the combination; do not automatically discontinue the other components.',6)
R('RENAL_30_50',band('crcl_ml_min',30,50),'dose_reduce','capecitabine','CrCl 30–50: 75% of original capecitabine dose under this regimen.',6,dose_percent=75)
R('RENAL_GAP',allof(atom('crcl_ml_min','>',50),atom('crcl_ml_min','<',51)),'consultant_review','capecitabine','The source has a decimal gap between CrCl 50 and 51; do not round to clear treatment.',6)
R('SEV_HEP_SOURCE_CONFLICT',atom('severe_hepatic_impairment','==',True),'consultant_review','whole_regimen','Severe hepatic impairment appears in exclusions, while the tucatinib table specifies 66% in Child-Pugh C. Resolve the conflict and tablet-strength rounding before treatment.',3)
R('CAPECITABINE_LIVER',anyof(atom('bilirubin_uln_multiple','>',3),atom('alt_uln_multiple','>',2.5),atom('ast_uln_multiple','>',2.5)),'withhold','capecitabine','Hold capecitabine for treatment-related bilirubin >3×ULN or ALT/AST >2.5×ULN until the relevant abnormality recovers. Review both values if both are abnormal.',7)
for f in ['alt_uln_multiple','ast_uln_multiple']:
    R('TUC_'+f+'_G3',allof(atom(f,'>',5),atom(f,'<=',20)),'withhold','tucatinib','Interrupt until grade ≤1, then reduce one tucatinib dose level.',7)
    R('TUC_'+f+'_G4',atom(f,'>',20),'permanently_discontinue','tucatinib','Grade 4 transaminase elevation: permanently discontinue tucatinib.',7)
R('TUC_BILI_G2',allof(atom('bilirubin_uln_multiple','>',1.5),atom('bilirubin_uln_multiple','<=',3)),'withhold','tucatinib','Interrupt until bilirubin grade ≤1, then resume the same dose after review.',7)
R('TUC_BILI_G3',allof(atom('bilirubin_uln_multiple','>',3),atom('bilirubin_uln_multiple','<=',10)),'withhold','tucatinib','Interrupt until grade ≤1, then reduce one dose level.',7)
R('TUC_BILI_G4',atom('bilirubin_uln_multiple','>',10),'permanently_discontinue','tucatinib','Grade 4 bilirubin elevation: permanently discontinue tucatinib.',7)
R('TUC_DILI',allof(anyof(atom('alt_uln_multiple','>',3),atom('ast_uln_multiple','>',3)),atom('bilirubin_uln_multiple','>',2)),'permanently_discontinue','tucatinib','ALT/AST >3×ULN together with bilirubin >2×ULN: permanently discontinue tucatinib.',7)
R('TUC_DIARR_G3',atom('diarrhoea_grade','==',3),'withhold','tucatinib','Treat diarrhoea and interrupt until grade ≤1. Without prior antidiarrhoeal treatment: same dose after recovery; with it: next lower level. Confirm this history.',7)
R('TUC_DIARR_G4',atom('diarrhoea_grade','==',4),'permanently_discontinue','tucatinib','Grade 4 diarrhoea: permanently discontinue tucatinib.',7)
R('TUC_OTHER_G3',atom('other_toxicity_grade','==',3),'withhold','tucatinib','Other grade 3 toxicity: interrupt until grade ≤1, then next lower level.',7)
R('TUC_OTHER_G4',atom('other_toxicity_grade','==',4),'permanently_discontinue','tucatinib','Other grade 4 toxicity: permanently discontinue tucatinib.',7)
for f in ['diarrhoea_grade','hand_foot_grade','other_toxicity_grade']:
    R('CAPE_'+f+'_HOLD',atom(f,'>=',2),'withhold','capecitabine','Grade ≥2 toxicity requires holding capecitabine until grade 0–1. Record occurrence and review the source restart percentage; do not restart automatically.',8)
    R('CAPE_'+f+'_G2_RECUR4',allof(atom(f,'==',2),atom('toxicity_event_number','>=',4)),'permanently_discontinue','capecitabine','Fourth grade 2 occurrence: permanently discontinue capecitabine.',8)
    R('CAPE_'+f+'_G3_RECUR3',allof(atom(f,'==',3),atom('toxicity_event_number','>=',3)),'permanently_discontinue','capecitabine','Third grade 3 occurrence: permanently discontinue capecitabine.',8)
    R('CAPE_'+f+'_G4',atom(f,'==',4),'permanently_discontinue','capecitabine','Grade 4: source default is permanent discontinuation; exceptional continuation requires consultant decision after recovery at 50%. A repeat grade 4 event requires discontinuation.',8)
    R('CAPE_'+f+'_G4_RECUR',allof(atom(f,'==',4),atom('toxicity_event_number','>=',2)),'permanently_discontinue','capecitabine','Repeated grade 4 toxicity: permanently discontinue.',8)
R('HER2_LVEF',allof(atom('lvef_percent','<',50),atom('lvef_drop_points','>=',10)),'withhold','trastuzumab','Withhold trastuzumab; repeat LVEF after 3 weeks and seek consultant/cardiology review.',9)
R('HER2_LVEF_CONTEXT',allof(atom('lvef_percent','<',50),atom('lvef_drop_points','missing')),'consultant_review','trastuzumab','The fall from baseline is needed for the source cardiac branch. Do not infer it from the current LVEF alone.',9)
R('HER2_HF',atom('symptomatic_chf','==',True),'consultant_review','trastuzumab','Symptomatic heart failure: urgent consultant/cardiology review and consideration of discontinuation.',9)
R('HER2_HSR',atom('hypersensitivity_grade','==',4),'discontinue','trastuzumab','Grade 4 trastuzumab hypersensitivity: discontinue.',9)
R('HER2_RELOAD',atom('days_overdue_trastuzumab','>',7),'consultant_review','trastuzumab','IV trastuzumab more than one week overdue may require 8 mg/kg reloading, then 6 mg/kg every three weeks. Confirm the individual prescription.',4)
R('TUC_LOWEST',allof(atom('tucatinib_dose_mg','==',150),atom('further_tucatinib_reduction_required','==',True)),'permanently_discontinue','tucatinib','Unable to tolerate 150 mg twice daily: permanently discontinue tucatinib.',5)
R('INTERACTIONS',anyof(atom('strong_cyp3a_inducer','==',True),atom('strong_cyp2c8_inhibitor','==',True)),'consultant_review','tucatinib','Avoid or reconcile these exposure-changing interactions with oncology pharmacy and current SmPC.',11)
d['treatment_phases']=[phase(d,[],21,'combination','Concurrent oral and HER2 treatment',[med('tucatinib',300,'mg twice daily',list(range(1,22)),'oral'),med('capecitabine',1000,'mg/m2 twice daily',list(range(1,15)),'oral'),med('trastuzumab',6,'mg/kg',notes='IV 8 mg/kg loading dose initially; use verified formulation-specific prescription.')])]
d['dose_levels']={'tucatinib':{'0':{'dose_mg':300},'-1':{'dose_mg':250},'-2':{'dose_mg':200},'-3':{'dose_mg':150}}}
save(p,d)

# 00815: taxane phase and subsequent antibody continuation must remain distinct.
p,d=init('00815');standard(d,['paclitaxel','trastuzumab'],page=3);pac_inputs(d)
select(d,'treatment_phase','Current treatment phase',[('combination','Weekly paclitaxel with trastuzumab'),('trastuzumab_maintenance','Trastuzumab continuation after paclitaxel')])
for k,l in [('baseline_lvef_percent','Baseline LVEF'),('current_lvef_percent','Current LVEF'),('lvef_drop_points_from_baseline','LVEF fall from baseline in percentage points'),('days_overdue_trastuzumab','Days since scheduled trastuzumab dose was missed')]:num(d,k,l)
for k,l in [('symptomatic_heart_failure','Symptomatic heart failure'),('prior_anthracycline','Previous anthracycline treatment')]:boolean(d,k,l)
grade(d,'hypersensitivity_grade','Trastuzumab hypersensitivity reaction')
select(d,'trastuzumab_route','Trastuzumab formulation',[('iv','Intravenous'),('sc','Subcutaneous')])
pac_rules(d,atom('treatment_phase','==','combination'),5,5)
rule(d,'PHASE_CONTEXT',allof(atom('treatment_phase','missing'),anyof(atom('anc_x10e9_l','present'),atom('platelets_x10e9_l','present'),atom('neuropathy_grade','present'),atom('alt_uln_multiple','present'))),'consultant_review','paclitaxel','Confirm whether paclitaxel is still prescribed. Its toxicity/dose rules do not automatically apply during trastuzumab-only continuation.',5)
rule(d,'LOW_COUNTS_PHASE_UNKNOWN',allof(atom('treatment_phase','missing'),anyof(atom('anc_x10e9_l','<',1),atom('platelets_x10e9_l','<',90))),'delay','paclitaxel','These counts require delaying paclitaxel if still prescribed. Trastuzumab may continue during reversible chemotherapy myelosuppression after review.',5)
rule(d,'BASELINE_LVEF_LT50',atom('baseline_lvef_percent','<',50),'contraindicated','trastuzumab','Pretreatment LVEF below 50% is outside source eligibility.',3)
rule(d,'BASELINE_LVEF_50_54',allof(atom('baseline_lvef_percent','>=',50),atom('baseline_lvef_percent','<',55)),'consultant_review','trastuzumab','Baseline LVEF 50–54% requires clinical judgement.',3)
rule(d,'LVEF_WITHHOLD',allof(atom('current_lvef_percent','<',50),atom('lvef_drop_points_from_baseline','>=',10)),'withhold','trastuzumab','Withhold trastuzumab and repeat LVEF after 3 weeks. If no improvement or further decline, consultant/cardiology review.',6)
rule(d,'LVEF_MISSING_CHANGE',allof(atom('current_lvef_percent','<',50),atom('lvef_drop_points_from_baseline','missing')),'consultant_review','trastuzumab','The LVEF fall from baseline is needed to apply the on-treatment hold rule.',6)
rule(d,'HEART_FAILURE',atom('symptomatic_heart_failure','==',True),'consultant_review','trastuzumab','Symptomatic heart failure: urgent consultant/cardiology review and consideration of discontinuation; no automatic treatment clearance.',6)
rule(d,'HSR_G4',atom('hypersensitivity_grade','>=',4),'discontinue','trastuzumab','Grade 4 trastuzumab hypersensitivity: discontinue.',6)
rule(d,'MISSED_TRASTUZUMAB',atom('days_overdue_trastuzumab','>',0),'consultant_review','trastuzumab','Verify IV versus SC formulation and time overdue. IV >7 days overdue may need reloading; the source mistakenly says weekly after reloading despite its 21-day regimen. Reconcile with current SmPC. SC doses must remain at least 3 weeks apart.',4)
d['treatment_phases']=[phase(d,[],21,'combination','Paclitaxel plus trastuzumab',[med('paclitaxel',80,'mg/m2',[1,8,15]),med('trastuzumab',6,'mg/kg',notes='IV 8 mg/kg loading dose first; SC 600 mg is a formulation alternative, not an additional dose.')]),phase(d,[],21,'trastuzumab_maintenance','Trastuzumab continuation',[med('trastuzumab',6,'mg/kg',notes='Complete the prescribed one-year HER2 course; verify route and loading requirements.')])]
save(p,d)

# 00659: early-breast-specific thrombocytopenia, liver and cardiac rules.
p,d=init('00659');standard(d,'trastuzumab emtansine',page=2)
for k,l,u in [('platelets','Platelets','×10⁹/L'),('lvef_percent','Current LVEF','%'),('lvef_drop_points','LVEF fall from baseline','percentage points'),('alt_uln_multiple','ALT / ULN','×ULN'),('ast_uln_multiple','AST / ULN','×ULN'),('bilirubin_uln_multiple','Bilirubin / ULN','×ULN'),('platelet_delay_count','Prior thrombocytopenia delays','')]:num(d,k,l,u)
for k,l in [('symptomatic_chf','Symptomatic heart failure'),('nodular_regenerative_hyperplasia','Nodular regenerative hyperplasia'),('pulmonary_toxicity','Confirmed drug-related ILD/pneumonitis'),('rt_pneumonitis_not_resolving','Radiotherapy pneumonitis not resolving with standard treatment'),('lvef_repeat_confirms','Repeat LVEF confirms persistent source stopping criterion'),('further_reduction_required','Further dose reduction is required'),('her2_residual_invasive','HER2-positive residual invasive disease after neoadjuvant therapy')]:boolean(d,k,l)
for k,l in [('peripheral_neuropathy_grade','Peripheral neuropathy'),('rt_pneumonitis_grade','Radiotherapy-related pneumonitis'),('heart_failure_grade','Heart failure / LV systolic dysfunction')]:grade(d,k,l)
select(d,'dose_reduction_level','Current T-DM1 dose level',[(0,'3.6 mg/kg'),(1,'3 mg/kg'),(2,'2.4 mg/kg')])
select(d,'child_pugh','Child-Pugh class',[('A','A'),('B','B'),('C','C')])
R=lambda id,c,a,t,pg,**kw:rule(d,id,c,a,'trastuzumab emtansine',t,pg,**kw)
R('PLT_LT25',atom('platelets','<',25),'withhold','Hold until platelets ≥75, then reduce one level. Do not calculate a restart dose while thrombocytopenic.',3)
R('PLT_25_74',allof(atom('platelets','>=',25),atom('platelets','<',75)),'withhold','Hold until platelets ≥75, then use the same level; consider a reduction after two platelet-related delays.',3)
R('REPEATED_PLT_DELAYS',atom('platelet_delay_count','>=',2),'consultant_review','After two thrombocytopenia delays, consider one dose-level reduction after recovery.',3)
R('LVEF_LT45',atom('lvef_percent','<',45),'withhold','Hold and repeat LVEF within 3 weeks. Discontinue if LVEF <45% is confirmed.',4)
R('LVEF_45_49_DROP',allof(atom('lvef_percent','>=',45),atom('lvef_percent','<',50),atom('lvef_drop_points','>=',10)),'withhold','Hold and repeat LVEF within 3 weeks; discontinue if the source persistent decline criterion is confirmed.',4)
R('LVEF_45_49_SMALL_DROP',allof(atom('lvef_percent','>=',45),atom('lvef_percent','<',50),atom('lvef_drop_points','<',10)),'proceed_with_caution','This cardiac branch permits continuation with repeat LVEF within 3 weeks. Other domains remain separately assessed.',4)
R('LVEF_CONTEXT',allof(atom('lvef_percent','>=',45),atom('lvef_percent','<',50),atom('lvef_drop_points','missing')),'consultant_review','Baseline LVEF change is needed for the 45–<50% branch.',4)
R('LVEF_CONFIRMED',atom('lvef_repeat_confirms','==',True),'discontinue','Confirmed persistent cardiac stopping criterion: discontinue T-DM1.',4)
R('HEART_FAILURE',anyof(atom('symptomatic_chf','==',True),atom('heart_failure_grade','>=',3),allof(atom('heart_failure_grade','==',2),atom('lvef_percent','<',45))),'discontinue','Source symptomatic or specified graded heart failure: discontinue T-DM1.',5)
for f in ['alt_uln_multiple','ast_uln_multiple']:
    R(f+'_G2',allof(atom(f,'>',3),atom(f,'<=',5)),'withhold',('Hold until grade ≤1, then reduce one level.' if f.startswith('alt') else 'Hold until grade ≤1, then restart at the same dose.'),4)
    R(f+'_G3',allof(atom(f,'>',5),atom(f,'<=',20)),'withhold','Hold until grade ≤1, then reduce one level.',4)
    R(f+'_G4',atom(f,'>',20),'discontinue','Grade 4 transaminase elevation: discontinue T-DM1.',4)
R('BILI_HOLD',allof(atom('bilirubin_uln_multiple','>',1),atom('bilirubin_uln_multiple','<=',2)),'withhold','Hold until bilirubin ≤1×ULN, then reduce one dose level.',4)
R('BILI_STOP',atom('bilirubin_uln_multiple','>',2),'discontinue','Bilirubin >2×ULN: discontinue under the early-breast source table; assess cause.',4)
R('CHILDPUGH_C',atom('child_pugh','==','C'),'contraindicated','T-DM1 is not recommended in Child-Pugh C.',3)
R('NEUROPATHY',atom('peripheral_neuropathy_grade','>=',3),'withhold','Hold until neuropathy resolves to grade ≤2.',5)
R('BASELINE_NEURO',allof(atom('assessment_stage','==','baseline'),atom('peripheral_neuropathy_grade','>=',2)),'contraindicated','Baseline neuropathy grade ≥2 is an exclusion, distinct from the ongoing hold threshold.',2)
R('BASELINE_LVEF',allof(atom('assessment_stage','==','baseline'),atom('lvef_percent','<',50)),'contraindicated','Early-breast starting eligibility requires LVEF ≥50%.',1)
R('RESIDUAL_DISEASE_CONTEXT',atom('her2_residual_invasive','==',False),'consultant_review','This adjuvant regimen is for HER2-positive residual invasive disease after neoadjuvant taxane/HER2 treatment. Confirm the postoperative pathway.',1)
for k in ['pulmonary_toxicity','nodular_regenerative_hyperplasia']:R(k.upper(),atom(k,'==',True),'permanently_discontinue','Confirmed '+('drug-related ILD/pneumonitis' if k=='pulmonary_toxicity' else 'nodular regenerative hyperplasia')+': permanently discontinue.',5)
R('RT_PNEUMONITIS_STOP',anyof(atom('rt_pneumonitis_grade','>=',3),allof(atom('rt_pneumonitis_grade','==',2),atom('rt_pneumonitis_not_resolving','==',True))),'discontinue','Radiotherapy pneumonitis grade ≥3, or grade 2 not resolving with standard treatment: discontinue T-DM1.',5)
R('RT_PNEUMONITIS_REVIEW',atom('rt_pneumonitis_grade','==',2),'consultant_review','Grade 2 radiotherapy pneumonitis needs review of response to standard treatment and distinction from drug-related ILD.',5)
R('BELOW_LOWEST_DOSE',allof(atom('dose_reduction_level','==',2),atom('further_reduction_required','==',True)),'discontinue','A further reduction below 2.4 mg/kg is not permitted. Do not re-escalate reduced doses.',3)
d['treatment_phases']=[phase(d,[],21,'adjuvant_tdm1','Postoperative T-DM1: 14 cycles',[med('trastuzumab emtansine',3.6,'mg/kg')])];d['treatment_phases'][0]['cycles']=list(range(1,15))
d['dose_levels']={'trastuzumab emtansine':{'0':{'dose_mg_kg':3.6},'-1':{'dose_mg_kg':3},'-2':{'dose_mg_kg':2.4}}}
save(p,d)
