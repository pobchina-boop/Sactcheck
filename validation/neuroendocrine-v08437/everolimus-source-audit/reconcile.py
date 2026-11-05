import copy, hashlib, json
from pathlib import Path
root=Path(__file__).resolve().parents[3]
audit=Path(__file__).resolve().parent
p=json.loads((audit/'protocol-before/00320-everolimus-monotherapy.json').read_text())
url='https://healthservice.hse.ie/documents/6718/320_Everolimus.pdf'
ema='https://www.ema.europa.eu/en/documents/product-information/afinitor-epar-product-information_en.pdf'
def c(f,o,v=None): return {'field':f,'operator':o,**({'value':v} if v is not None else {})}
def all_(*v): return {'all':list(v)}
def any_(*v): return {'any':list(v)}
def eq(f,v): return c(f,'==',v)
def missing(f): return c(f,'missing')
def src(page,table=None,secondary=False):
 return {'document':'EMA Afinitor SmPC, retrieved 05 November 2026' if secondary else 'NCCP 00320 Everolimus Monotherapy v6 (24 February 2026)', 'page':str(page),**({'table':str(table)} if table else {}),'url':ema if secondary else url}
rules=[]
def rule(id,when,action,message,page=3,table=3,dose=None,secondary=False):
 a={'type':action,'components':['everolimus'],'message':message,'recommendation':message}
 if action=='consultant_review':a.update(dose_calculation='specialist_review',show_in_dose_actions=True,block_numeric_dose=True)
 if dose is not None:a['component_changes']={'everolimus':{'total_daily_dose_mg':dose}}
 rules.append({'id':id,'priority':20,'when':when,'action':a,'source':src(page,table,secondary),'explanation':message})
def number(label,unit=None,max=None):return {'label':label,'type':'number','required':False,'min':0,'step':0.01,'input_role':'decision',**({'unit':unit} if unit else {}),**({'max':max} if max is not None else {})}
def select(label,options,guidance=None):return {'label':label,'type':'select','required':False,'input_role':'decision','options':[{'value':v,'label':l} for v,l in options],**({'assessment_guidance':guidance} if guidance else {})}
def boolean(label,guidance=None):return {'label':label,'type':'boolean','required':False,'input_role':'decision',**({'assessment_guidance':guidance} if guidance else {})}
def grade(label):return select(label,[(i,'Grade '+str(i)) for i in range(5)],'Enter the clinician-verified source grade. NCCP 00320 v6 Table 3 does not identify a CTCAE edition; the corresponding EMA SmPC Table 1 is explicitly based on CTCAE v3.0. Do not automatically convert a modern laboratory threshold to this source grade.')
d=p['input_definitions']
d['assessment_type']=select('Assessment timing',[('baseline','Before first everolimus dose'),('on_treatment','During continuous treatment'),('restart','Considering restart after interruption')],'Table 1 concerns treatment toxicity, not an invented baseline blood-count eligibility threshold. A 28-day interval is a review period; tablets are taken continuously.')
d['everolimus_previous_dose_mg']=select('Documented daily everolimus dose before this interruption/change',[(2.5,'2.5 mg daily'),(5,'5 mg daily'),(7.5,'7.5 mg daily'),(10,'10 mg daily'),('other','Other individualised dose — specialist review')],'Do not substitute the standard 10 mg for a missing prescribed dose. Numeric toxicity restart requires an explicitly documented dose and no hepatic impairment; combined hepatic/toxicity adjustments need specialist review.')
d['hepatic_c_benefit_risk_approved']=boolean('Child–Pugh C: specialist benefit–risk decision supports treatment')
d['renal_impairment']=boolean('Renal impairment present','NCCP Table 2: no routine renal dose adjustment; this does not clear acute kidney injury or other toxicity.')
d['acute_kidney_injury']=boolean('Acute kidney injury or clinically important worsening renal function')
d['anc_x10e9_l']=number('Current absolute neutrophil count','×10⁹/L')
d['platelets_x10e9_l']=number('Current platelet count','×10⁹/L')
d['lowest_anc_episode']=number('Lowest neutrophil count in this same interrupted episode','×10⁹/L')
d['lowest_platelets_episode']=number('Lowest platelet count in this same interrupted episode','×10⁹/L')
d['febrile_neutropenia_episode_grade']=select('Highest febrile neutropenia grade in this episode',[(0,'No febrile neutropenia'),(3,'Grade 3'),(4,'Grade 4')],'Grade 3 requires ANC recovery ≥1.25×10⁹/L AND no fever. Grade 4 requires discontinuation. Source grades are not calculated from a single temperature or count.')
d['fever_present']=boolean('Fever currently present')
d['infection_status']=select('Infection status',[('none','No current infection'),('preexisting_unresolved','Pre-existing infection not fully resolved'),('active','Infection diagnosed during treatment'),('invasive_systemic_fungal','Invasive systemic fungal infection diagnosed')])
d['hbv_screen_positive']=boolean('HBsAg or HBcoreAb positive','Requires the local HBV/hepatology and antiviral management plan; positivity is not an automatic exclusion.')
d['significant_lung_compromise']=boolean('Significant pre-existing lung compromise')
d['interaction_status']=select('Everolimus medicine/food interaction review',[('none','No relevant interaction identified'),('potent_inhibitor','Potent CYP3A4/P-gp inhibitor'),('moderate_inhibitor','Moderate CYP3A4/P-gp inhibitor'),('inducer','CYP3A4/P-gp inducer'),('other_or_unreviewed','Other relevant interaction or review incomplete')],'EMA SmPC 4.5: avoid interacting combinations where possible. Inhibitor/inducer adjustments and washout are specialist decisions; do not combine automatically with hepatic/toxicity dose tables.')
d['perioperative_or_radiotherapy_concern']=boolean('Peri-operative wound-healing, recent/concurrent radiotherapy or radiation-recall concern')
for field in ['alt_ast_uln_multiple','bilirubin_uln_multiple']:
 d[field]['input_role']='context'
 d[field]['always_show']=True
 d[field]['ui_section']='labs'
 d[field]['assessment_guidance']='Retained clinical context. NCCP 00320 v6 does not specify an isolated ALT/AST or bilirubin ×ULN dose cutoff. Assess Child–Pugh class, treatment-related toxicity and the complete clinical picture; no unsupported numeric LFT hold is calculated.'
d['hypersensitivity']['label']='Hypersensitivity to everolimus, another rapamycin derivative or an excipient'
d['oral_toxicity_grade']['label']='Current other non-haematological toxicity grade (excluding stomatitis, pneumonitis and metabolic events)'
for field in ['oral_toxicity_grade','stomatitis_grade','noninfectious_pneumonitis_grade']:
 d[field]['assessment_guidance']+=' NCCP 00320 v6 Table 3 supplies the action, but does not state the CTCAE edition. The related EMA Table 1 uses CTCAE v3.0. The existing CTCAE v5 descriptors shown here are supplementary orientation only; confirm the source-grade interpretation clinically and do not assume the editions are interchangeable.'
for pre,current in [('stomatitis','stomatitis_grade'),('other_nonhaem','oral_toxicity_grade'),('pneumonitis','noninfectious_pneumonitis_grade')]:
 d[pre+'_highest_grade']=grade('Highest '+pre.replace('_',' ')+' grade in this same episode')
 d[pre+'_occurrence']=select(pre.replace('_',' ').capitalize()+' episode occurrence',[(1,'First occurrence'),(2,'Second occurrence / first recurrence'),(3,'Third or later — further specialist review')])
d['other_nonhaem_tolerable']=boolean('Current grade 2 other non-haematological toxicity is tolerable')
d['pneumonitis_unrecovered_weeks']=number('Completed weeks without recovery of grade 2 pneumonitis','weeks')
d['pneumonitis_recovered_within_4_weeks']=boolean('Grade 2 pneumonitis recovered to grade ≤1 within four weeks')
for pre,label in [('hyperglycaemia','Hyperglycaemia'),('dyslipidaemia','Dyslipidaemia')]:
 d[pre+'_grade']=grade('Current '+label.lower()+' source grade')
 d[pre+'_highest_grade']=grade('Highest '+label.lower()+' source grade in this same episode')
 d[pre+'_recovery_approved']=boolean(label+': consultant confirms sufficient clinical recovery for restart','NCCP/EMA specifies temporary interruption for grade 3, but no numeric recovery grade/biochemical target. This records an individual consultant decision; it is not an invented source recovery threshold.')
# Demo values are deliberate examples, not form defaults or clinical assumptions.
for field,definition in d.items():
 if 'demo_value' not in definition:
  definition['demo_value']=False if definition['type']=='boolean' else definition['options'][0]['value'] if definition['type']=='select' else 0
for field,value in {'anc_x10e9_l':4,'platelets_x10e9_l':200,'lowest_anc_episode':4,'lowest_platelets_episode':200,'everolimus_previous_dose_mg':10,'assessment_type':'on_treatment','pneumonitis_recovered_within_4_weeks':True}.items():d[field]['demo_value']=value
# Preserve RCC and both distinct NET indication records verbatim.
rule('ECOG_OUTSIDE_USUAL_SOURCE_RANGE',c('ecog','>',2),'consultant_review','ECOG is outside NCCP eligibility 0–2; confirm individual suitability.',1,None)
rule('HYPERSENSITIVITY_EXCLUSION',eq('hypersensitivity',True),'contraindicated','Hypersensitivity to everolimus, other rapamycin derivatives or excipients is an exclusion.',1,None)
rule('PREGNANCY_OR_BREASTFEEDING',any_(eq('pregnancy',True),eq('breastfeeding',True)),'contraindicated','Pregnancy or breastfeeding is excluded by NCCP 00320.',1,None)
rule('BASELINE_LUNG_CAUTION',eq('significant_lung_compromise',True),'consultant_review','Significant pre-existing lung compromise warrants caution and specialist assessment, not automatic exclusion.',1,None)
# Separate baseline and treatment-related marrow decisions. EMA supplies continuous half-open boundaries where NCCP prints rounded bands.
low=any_(c('anc_x10e9_l','<',1),c('platelets_x10e9_l','<',75))
rule('BASELINE_COUNTS_REVIEW',all_(eq('assessment_type','baseline'),low),'consultant_review','Low baseline counts require consultant assessment. NCCP Table 1 describes treatment-toxicity modifications and does not establish a separate baseline minimum.',2,1)
rule('COUNTS_TIMING_MISSING',all_(missing('assessment_type'),low),'consultant_review','Confirm baseline versus on-treatment timing before applying the treatment-toxicity count table; low entered counts are not cleared.',2,1)
rule('CURRENT_LOW_COUNTS_HOLD',all_(c('assessment_type','in',['on_treatment','restart']),low),'withhold','During treatment, interrupt if ANC <1×10⁹/L or platelets <75×10⁹/L. NCCP printed bands 0.5–0.99/50–74.9 are clarified by EMA Table 1 (<1/<75). Restart depends on same-episode nadirs, recovery, fever and previous dose.',2,1)
# Common gate prevents numeric toxicity-dose re-escalation and unsupported hepatic/toxicity combinations.
prior_ok=c('everolimus_previous_dose_mg','in',[5,7.5,10])
safe_toxic=all_(eq('assessment_type','restart'),eq('child_pugh_class','none'),prior_ok)
unsafe_prior=any_(missing('everolimus_previous_dose_mg'),c('everolimus_previous_dose_mg','in',[2.5,'other']),missing('child_pugh_class'),c('child_pugh_class','in',['A','B','C']))
def reduced_restart(id,condition,message,page=3,table=3):
 rule(id,all_(condition,safe_toxic),'dose_reduce',message+' The documented dose was at least 5 mg/day and no hepatic impairment is recorded; this is a protocol target, subject to complete consultant assessment.',page,table,dose=5)
 rule(id+'_DOSE_REVIEW',all_(condition,any_(unsafe_prior,missing('assessment_type'),c('assessment_type','!=','restart'))),'consultant_review',message+' No numeric restart is issued: confirm restart timing, the actual previous dose and hepatic status. Do not re-escalate a lower dose. EMA 4.4 states no clinical safety/efficacy data support adverse-event dose adjustments in hepatic impairment.',page,table)
recover=all_(c('anc_x10e9_l','>=',1),c('platelets_x10e9_l','>=',75),eq('febrile_neutropenia_episode_grade',0),eq('fever_present',False))
moderate=all_(c('lowest_anc_episode','>=',.5),c('lowest_platelets_episode','>=',50),any_(c('lowest_anc_episode','<',1),c('lowest_platelets_episode','<',75)))
severe=all_(c('lowest_anc_episode','exists'),c('lowest_platelets_episode','exists'),any_(c('lowest_anc_episode','<',.5),c('lowest_platelets_episode','<',50)))
rule('COUNT_SAME_DOSE_RECOVERY',all_(recover,moderate),'consultant_review','After moderate count toxicity and recovery of both entered counts, NCCP Table 1 permits the same documented dose. Verify actual previous dose, episode nadirs and the full treatment plan; this does not mean reset to 10 mg.',2,1)
reduced_restart('COUNT_SEVERE_RECOVERY',all_(recover,severe),'After ANC nadir <0.5 or platelet nadir <50 and recovery, NCCP Table 1 specifies 5 mg once daily.',2,1)
rule('FN_G4_STOP',eq('febrile_neutropenia_episode_grade',4),'discontinue','Grade 4 febrile neutropenia: discontinue everolimus, including when the counts or fever have subsequently improved.',2,1)
fn_recovered=all_(eq('febrile_neutropenia_episode_grade',3),c('anc_x10e9_l','>=',1.25),c('platelets_x10e9_l','>=',75),eq('fever_present',False))
rule('FN_G3_NOT_RECOVERED',all_(eq('febrile_neutropenia_episode_grade',3),any_(c('anc_x10e9_l','<',1.25),eq('fever_present',True),c('platelets_x10e9_l','<',75),missing('anc_x10e9_l'),missing('fever_present'),missing('platelets_x10e9_l'))),'withhold','Grade 3 febrile neutropenia: interrupt until ANC ≥1.25×10⁹/L AND no fever; do not restart with an unresolved platelet hold or unconfirmed recovery.',2,1)
reduced_restart('FN_G3_RECOVERY',fn_recovered,'After grade 3 febrile neutropenia, ANC ≥1.25 and no fever, NCCP specifies 5 mg once daily.',2,1)
# Stomatitis
rule('STOMATITIS_G4_STOP',any_(eq('stomatitis_grade',4),eq('stomatitis_highest_grade',4)),'discontinue','Grade 4 stomatitis: discontinue, even if the current grade has improved.')
rule('EVEROLIMUS_STOMATITIS_G2',c('stomatitis_grade','in',[2,3]),'withhold','Grade 2 or 3 stomatitis: interrupt until recovery to grade ≤1. Restart differs for first versus second grade 2 occurrence and grade 3.')
stoma_rec=all_(c('stomatitis_grade','<=',1),c('stomatitis_highest_grade','in',[2,3]))
rule('STOMATITIS_G2_FIRST_RECOVERY',all_(stoma_rec,eq('stomatitis_highest_grade',2),eq('stomatitis_occurrence',1)),'consultant_review','First grade 2 stomatitis, recovered to grade ≤1: NCCP permits the same documented dose. Confirm previous dose; do not default to 10 mg.')
reduced_restart('STOMATITIS_REDUCED_RECOVERY',all_(stoma_rec,any_(all_(eq('stomatitis_highest_grade',2),eq('stomatitis_occurrence',2)),all_(eq('stomatitis_highest_grade',3),c('stomatitis_occurrence','in',[1,2])))),'Recovered second grade 2 or grade 3 stomatitis: NCCP specifies 5 mg once daily.')
rule('STOMATITIS_RECURRENCE_REVIEW',all_(stoma_rec,any_(missing('stomatitis_occurrence'),eq('stomatitis_occurrence',3))),'consultant_review','Confirm stomatitis occurrence and previous reductions. NCCP explicitly describes first/second grade 2 events; further recurrence needs individual review.')
# Pneumonitis retains "consider" wording and four-week rule.
rule('PNEUMONITIS_G4_STOP',any_(eq('noninfectious_pneumonitis_grade',4),eq('pneumonitis_highest_grade',4)),'discontinue','Grade 4 non-infectious pneumonitis: discontinue, even if the current grade has improved.')
rule('EVEROLIMUS_PNEUMONITIS_G2',eq('noninfectious_pneumonitis_grade',2),'consultant_review','Grade 2 non-infectious pneumonitis: consider interruption until grade ≤1. Exclude infection including PJP, tumour and other causes. Failure to recover within four weeks requires discontinuation; confirm elapsed time.')
rule('PNEUMONITIS_G3_HOLD',eq('noninfectious_pneumonitis_grade',3),'withhold','Grade 3 pneumonitis: interrupt until grade ≤1; restart is a consultant consideration, not automatic.')
rule('PNEUMONITIS_FOUR_WEEK_STOP',any_(all_(eq('noninfectious_pneumonitis_grade',2),any_(missing('pneumonitis_highest_grade'),c('pneumonitis_highest_grade','<=',2)),c('pneumonitis_unrecovered_weeks','>=',4)),all_(eq('pneumonitis_highest_grade',2),eq('pneumonitis_recovered_within_4_weeks',False))),'discontinue','Grade 2 pneumonitis failed to recover to grade ≤1 within four weeks: discontinue. This also applies if recovery was delayed beyond that period.')
reduced_restart('PNEUMONITIS_G2_RECOVERY',all_(c('noninfectious_pneumonitis_grade','<=',1),eq('pneumonitis_highest_grade',2),eq('pneumonitis_recovered_within_4_weeks',True),eq('pneumonitis_occurrence',1)),'Grade 2 pneumonitis recovered to grade ≤1 within four weeks: NCCP specifies 5 mg once daily.')
rule('PNEUMONITIS_RECOVERY_REVIEW',all_(c('noninfectious_pneumonitis_grade','<=',1),eq('pneumonitis_highest_grade',2),any_(missing('pneumonitis_recovered_within_4_weeks'),missing('pneumonitis_occurrence'),c('pneumonitis_occurrence','>=',2))),'consultant_review','Confirm timely pneumonitis recovery, occurrence and previous dose before restarting. Recurrent disease needs an individual specialist decision.')
rule('PNEUMONITIS_G3_RECOVERY_REVIEW',all_(c('noninfectious_pneumonitis_grade','<=',1),eq('pneumonitis_highest_grade',3)),'consultant_review','After grade 3 pneumonitis recovers to grade ≤1, consider restarting at the source 5 mg/day only after consultant review. If grade 3 recurs, consider discontinuation; a numeric restart is not automatic.')
rule('PNEUMONITIS_G3_RECURRENT_REVIEW',all_(any_(eq('noninfectious_pneumonitis_grade',3),eq('pneumonitis_highest_grade',3)),c('pneumonitis_occurrence','>=',2)),'consultant_review','Recurrent grade 3 pneumonitis: consider discontinuation. NCCP does not mandate an automatic permanent stop for every recurrence.')
rule('PNEUMONITIS_PRIOR_G3_NOT_RECOVERED',all_(eq('pneumonitis_highest_grade',3),eq('noninfectious_pneumonitis_grade',2)),'withhold','Grade 3 pneumonitis has improved only to grade 2: interruption continues until grade ≤1; do not substitute the first grade 2 pathway.')
# Other non-haematological (not metabolic, pneumonitis or stomatitis).
rule('OTHER_NONHAEM_G4_STOP',any_(eq('oral_toxicity_grade',4),eq('other_nonhaem_highest_grade',4)),'discontinue','Grade 4 other non-haematological toxicity: discontinue, even after improvement.')
rule('ORAL_TARGETED_G3_TOXICITY',eq('oral_toxicity_grade',3),'withhold','Grade 3 other non-haematological toxicity: interrupt until grade ≤1. First-event restart is a consultant consideration; recurrence prompts consideration of discontinuation.')
rule('OTHER_NONHAEM_G2_HOLD',all_(eq('oral_toxicity_grade',2),any_(eq('other_nonhaem_tolerable',False),c('other_nonhaem_occurrence','>=',2))),'withhold','Intolerable first grade 2, or recurrent grade 2 other non-haematological toxicity: interrupt until grade ≤1.')
rule('OTHER_NONHAEM_G2_TOLERABLE',all_(eq('oral_toxicity_grade',2),eq('other_nonhaem_tolerable',True),eq('other_nonhaem_occurrence',1)),'proceed_with_caution','First grade 2 other non-haematological toxicity is tolerable: no adjustment for this assessed toxicity. This is not complete treatment clearance.')
rule('OTHER_NONHAEM_G2_CONTEXT_REVIEW',all_(eq('oral_toxicity_grade',2),any_(missing('other_nonhaem_tolerable'),missing('other_nonhaem_occurrence'))),'consultant_review','For grade 2 other non-haematological toxicity, establish tolerability and occurrence before deciding between unchanged dose, interruption and reduced restart.')
other_rec=all_(c('oral_toxicity_grade','<=',1),c('other_nonhaem_highest_grade','in',[2,3]))
rule('OTHER_NONHAEM_G2_FIRST_RECOVERY',all_(other_rec,eq('other_nonhaem_highest_grade',2),eq('other_nonhaem_occurrence',1)),'consultant_review','First intolerable grade 2 other non-haematological toxicity recovered to grade ≤1: NCCP permits the same documented dose after clinical review.')
reduced_restart('OTHER_NONHAEM_G2_SECOND_RECOVERY',all_(other_rec,eq('other_nonhaem_highest_grade',2),eq('other_nonhaem_occurrence',2)),'Second grade 2 other non-haematological toxicity recovered to grade ≤1: NCCP specifies 5 mg once daily.')
rule('OTHER_NONHAEM_G3_RECOVERY_REVIEW',all_(other_rec,eq('other_nonhaem_highest_grade',3)),'consultant_review','After first grade 3 other non-haematological toxicity recovers to grade ≤1, consider 5 mg/day after consultant assessment; if grade 3 recurs, consider discontinuation. Do not automatically calculate a restart.')
rule('OTHER_NONHAEM_G3_RECURRENT_REVIEW',all_(any_(eq('oral_toxicity_grade',3),eq('other_nonhaem_highest_grade',3)),c('other_nonhaem_occurrence','>=',2)),'consultant_review','Recurrent grade 3 other non-haematological toxicity: consider discontinuation, with specialist decision preserved.')
rule('OTHER_NONHAEM_RECURRENCE_REVIEW',all_(other_rec,any_(missing('other_nonhaem_occurrence'),eq('other_nonhaem_occurrence',3))),'consultant_review','Confirm occurrence, recovery and previous reductions; further recurrence is not covered by an invented automatic restart dose.')
rule('OTHER_NONHAEM_PRIOR_G3_NOT_RECOVERED',all_(eq('other_nonhaem_highest_grade',3),eq('oral_toxicity_grade',2)),'withhold','Grade 3 other non-haematological toxicity has improved only to grade 2: interruption continues until grade ≤1, even if the current grade 2 symptoms are tolerable.')
# Separate metabolic domains; no imported numerical biochemical CTCAE cutoffs.
for pre,label in [('hyperglycaemia','Hyperglycaemia'),('dyslipidaemia','Dyslipidaemia')]:
 rule(pre.upper()+'_G4_STOP',any_(eq(pre+'_grade',4),eq(pre+'_highest_grade',4)),'discontinue',label+' grade 4: discontinue, including if the current abnormality has improved.')
 rule(pre.upper()+'_G3_HOLD',eq(pre+'_grade',3),'withhold',label+' grade 3: temporarily interrupt everolimus and treat the metabolic abnormality. NCCP supplies no numeric recovery target.')
 rule(pre.upper()+'_G2_NO_ADJUSTMENT',eq(pre+'_grade',2),'proceed_with_caution',label+' grade 2: no dose adjustment for this metabolic domain; manage and monitor the abnormality.')
 rec=all_(c(pre+'_grade','<=',2),eq(pre+'_highest_grade',3))
 reduced_restart(pre.upper()+'_RECOVERY',all_(rec,eq(pre+'_recovery_approved',True)),label+' after grade 3 interruption: NCCP specifies 5 mg once daily following the consultant-confirmed individual recovery decision. No fixed biochemical recovery cutoff is invented.')
 rule(pre.upper()+'_RECOVERY_UNCONFIRMED',all_(rec,any_(missing(pre+'_recovery_approved'),eq(pre+'_recovery_approved',False))),'consultant_review',label+' improved after grade 3, but NCCP does not specify a recovery grade or numeric target. Consultant must confirm sufficient recovery before restart.')
# Renal/hepatic. Exact source targets are 7.5/5/2.5 mg from standard 10 mg; never apply percentages to an already reduced dose.
rule('EVEROLIMUS_RENAL_NO_ADJUSTMENT',eq('renal_impairment',True),'proceed_with_caution','NCCP Table 2: no routine renal dose adjustment. Continue renal/BUN/urinary protein monitoring and assess acute deterioration separately.',3,2)
rule('ACUTE_RENAL_REVIEW',eq('acute_kidney_injury',True),'consultant_review','Acute kidney injury requires prompt clinical assessment; routine no-adjustment guidance does not clear active renal toxicity. Grade the event and apply the applicable toxicity pathway.',6,'4.4',secondary=True)
for cls,dose in [('A',7.5),('B',5),('C',2.5)]:
 dose_ok=any_(all_(eq('assessment_type','baseline'),missing('everolimus_previous_dose_mg')),c('everolimus_previous_dose_mg','in',[v for v in [2.5,5,7.5,10] if v>=dose]))
 extra=eq('hepatic_c_benefit_risk_approved',True) if cls=='C' else {'all':[]}
 condition=all_(eq('child_pugh_class',cls),dose_ok,extra)
 text=f'Child–Pugh {cls}: NCCP Table 2 specifies {int(dose*10)}% of the original standard 10 mg dose ({dose:g} mg once daily), not a further percentage of an already reduced dose.'
 if cls=='C':text+=' EMA 4.2: only if benefit outweighs risk; do not exceed 2.5 mg/day.'
 rule('OF590_00320_EVEROLIMUS_CHILD_'+cls,condition,'dose_reduce',text,3,2,dose=dose)
 unsafe=any_(all_(missing('everolimus_previous_dose_mg'),any_(missing('assessment_type'),c('assessment_type','!=','baseline'))),eq('everolimus_previous_dose_mg','other'),c('everolimus_previous_dose_mg','in',[v for v in [2.5,5,7.5,10] if v<dose]),*( [missing('hepatic_c_benefit_risk_approved'),eq('hepatic_c_benefit_risk_approved',False)] if cls=='C' else []))
 rule('HEPATIC_'+cls+'_CONTEXT_REVIEW',all_(eq('child_pugh_class',cls),unsafe),'consultant_review',text+' Confirm baseline versus subsequent change, previous reductions and (for class C) specialist benefit–risk approval; do not automatically increase the current dose.',3,2)
toxic_fields=['stomatitis_grade','stomatitis_highest_grade','oral_toxicity_grade','other_nonhaem_highest_grade','noninfectious_pneumonitis_grade','pneumonitis_highest_grade','hyperglycaemia_grade','hyperglycaemia_highest_grade','dyslipidaemia_grade','dyslipidaemia_highest_grade']
rule('HEPATIC_WITH_TOXICITY_REVIEW',all_(c('child_pugh_class','in',['A','B','C']),any_(*[c(f,'>=',2) for f in toxic_fields],c('lowest_anc_episode','<',1),c('lowest_platelets_episode','<',75),c('febrile_neutropenia_episode_grade','>=',3))),'consultant_review','Concurrent hepatic impairment and a toxicity dose-modification pathway require an individual consultant/pharmacy decision. EMA 4.4 states no clinical safety or efficacy data support dose-adjustment recommendations for adverse reactions in hepatic impairment; do not combine the tables automatically.',8,'4.4',secondary=True)
# Source cautions are not invented laboratory thresholds.
rule('FEVER_REQUIRES_INFECTION_REVIEW',eq('fever_present',True),'consultant_review','Fever requires prompt assessment for infection in an immunosuppressed patient. Assess for febrile neutropenia and treat infection promptly; this field does not invent a numeric fever or ANC definition.',5,None)
rule('PREEXISTING_INFECTION_HOLD',eq('infection_status','preexisting_unresolved'),'withhold','Treat pre-existing infection appropriately and allow it to resolve fully before starting everolimus.',5,None)
rule('ACTIVE_INFECTION_REVIEW',eq('infection_status','active'),'consultant_review','Treat diagnosed on-treatment infection promptly and consider interruption or discontinuation; grade and review the infection rather than apply an invented universal dose threshold.',5,None)
rule('INVASIVE_SYSTEMIC_FUNGAL_STOP',eq('infection_status','invasive_systemic_fungal'),'discontinue','Invasive systemic fungal infection: promptly and permanently discontinue everolimus and institute appropriate antifungal treatment.',6,'4.4',secondary=True)
rule('HBV_POSITIVE_REVIEW',eq('hbv_screen_positive',True),'consultant_review','HBsAg or HBcoreAb positivity requires the local antiviral/hepatology plan because of reactivation risk; do not treat positivity as an automatic contraindication.',5,None)
rule('INTERACTION_SPECIALIST_REVIEW',c('interaction_status','in',['potent_inhibitor','moderate_inhibitor','inducer','other_or_unreviewed']),'consultant_review','Review the current EMA SmPC 4.5 interaction table with pharmacy. Potent inhibitors and inducers should be avoided where possible; conditional inhibitor/inducer doses and washout are individual specialist decisions and must not be combined automatically with toxicity or hepatic doses.',9,'2; section 4.5',secondary=True)
rule('SURGERY_RADIATION_REVIEW',eq('perioperative_or_radiotherapy_concern',True),'consultant_review','Review wound healing and temporal relationship to radiotherapy; severe radiation reactions and recall are reported. For radiation recall, consider interruption or stopping. No fixed universal washout interval is specified.',8,'4.4',secondary=True)
# Explicitly block contradictory histories while preserving independent urgent holds/stops.
for pre,current in [('stomatitis','stomatitis_grade'),('other_nonhaem','oral_toxicity_grade'),('pneumonitis','noninfectious_pneumonitis_grade'),('hyperglycaemia','hyperglycaemia_grade'),('dyslipidaemia','dyslipidaemia_grade')]:
 for highest in range(4):
  rule(pre.upper()+'_HISTORY_CONTRADICTION_'+str(highest),all_(eq(pre+'_highest_grade',highest),c(current,'>',highest)),'consultant_review','Current grade exceeds the recorded highest grade for this same episode. Resolve contradictory history; independent current hold/stop findings still apply.')
p['rule_engine']['rules']=rules
p['treatment'].update(schedule_summary='Everolimus 10 mg orally once daily continuously. A 28-day interval is an administrative review period, not a tablet-free cycle.',duration_text='Continue while clinical benefit persists and toxicity remains acceptable, according to the consultant treatment plan.',schedule_interval_label='Continuous daily treatment; review every 4 weeks',components=[{'drug':'everolimus','dose':'10 mg once daily','route':'PO','days':['Continuous'],'note':'Same time every day, consistently with or without food. Swallow whole with a glass of water; do not chew/crush. Missed dose: no additional dose; take next prescribed dose as usual.'}])
p['monitoring']=['Baseline: FBC, renal and liver profile; BUN and urinary protein; total cholesterol and triglycerides; fasting serum glucose; HBsAg and HBcoreAb (NCCP p2).','During treatment: FBC, renal and liver profile every 4 weeks. Check cholesterol/triglycerides regularly and fasting glucose as clinically indicated; no universal lipid/glucose interval is specified (NCCP p2).','Disease assessment, imaging and tumour markers follow the individual consultant plan; no fixed scan or chromogranin-A interval is mandated by NCCP 00320.','Monitor infection, new respiratory symptoms, oral ulcers, metabolic abnormalities, renal deterioration and interactions. Consider PJP prophylaxis if corticosteroids/immunosuppressants are required; no universal prophylaxis prescription is implied.']
p['dose_modifications']=['NCCP 00320 v6 Tables 1–3 are encoded by toxicity, recovery, recurrence and documented previous dose; all modifications require consultant discussion.','No independent ALT/AST >5×ULN or bilirubin >3×ULN interruption threshold is present in this regimen source. Use Child–Pugh class and a clinically graded treatment-related toxicity assessment.','NCCP rounded ANC/platelet bands are clarified using EMA Table 1 (<1/<75) without leaving decimal gaps. Baseline low counts are reviewed separately from on-treatment toxicity.','Numeric toxicity restart is suppressed with missing or lower previous dose, hepatic impairment, unresolved recovery, source-discretionary restart or contradictory history. Same-dose restarts require the documented actual dose; never reset automatically to standard 10 mg.','EMA Table 1 uses CTCAE v3.0; NCCP does not specify an edition. Existing CTCAE v5 orientation descriptors are labelled supplementary. Metabolic recovery targets, third/later recurrences and simultaneous hepatic/toxicity adjustments remain individual decisions.']
p['eligibility']=['Adults with an indication matching NCCP 00320a (post-VEGF advanced RCC), 00320b (progressive pancreatic NET), or 00320c (progressive non-functional G1/G2 GI NET). See the preserved indication records for exact differentiation and stage.','ECOG performance status 0–2; significant pre-existing lung compromise requires caution.']
p['exclusions']=['Hypersensitivity to everolimus, another rapamycin derivative or excipients.','Pregnancy or breastfeeding.']
p['supportive_care']['regimen_specific_notes']=['No required premedication (NCCP p4).','Minimal-to-low emetic risk; follow local antiemetic policy.','Alcohol-free prophylactic/therapeutic mouthwash may be required per local policy. Do not present dexamethasone mouthwash as mandatory for every NET patient.','Promptly report new/worsening respiratory symptoms, fever/infection and mouth ulcers. Steroid/PJP prophylaxis and HBV antiviral plans require clinical assessment.']
m=p['metadata'];m['indication']='00320a: advanced RCC after VEGF-targeted therapy; 00320b: progressive unresectable/metastatic well/moderately differentiated pancreatic NET; 00320c: progressive unresectable/metastatic well-differentiated G1/G2 non-functional GI NET.';m.update(source_document_pages=6,source_checked_date='2026-11-05',sactcheck_encoding_version='0.84.37')
m.update(clinical_audit_release='0.84.37',source_pdf_sha256=hashlib.sha256((audit/'sources/00320.pdf').read_bytes()).hexdigest(),review_date='2031-02-24',source_version_date='2026-02-24')
m['validation'].update(audit_release='0.84.37',source_document_checked=True,software_tests_completed=True,rule_level_source_reconciliation_status='fresh_NCCP00320_v6_and_EMA_Afinitor_audit_v08437')
m['encoding_maturity'].update(label='Source-reconciled full everolimus pathway · independent clinical/pharmacy review pending')
m['organ_function_reconciliation'].update(release='0.84.37',checked_date='2026-11-05',note='NCCP Table2 hepatic doses preserved as standard-dose targets with baseline/prior-dose/ChildC benefit-risk guards. EMA explicitly leaves adverse-event dose modification in hepatic impairment without supporting clinical data; specialist review prevents unsafe automatic table combination.')
m['source_audit_v08437']={'checked_date':'2026-11-05','nccp_version':'6','nccp_version_date':'2026-02-24','nccp_review_date':'2031-02-24','nccp_sha256':hashlib.sha256((audit/'sources/00320.pdf').read_bytes()).hexdigest(),'ema_url':ema,'ema_sha256':hashlib.sha256((audit/'sources/afinitor-ema.pdf').read_bytes()).hexdigest(),'evidence_directory':'validation/neuroendocrine-v08437/everolimus-source-audit','clinical_use_authorised':False}
(root/'protocols/shared/00320-everolimus-monotherapy.json').write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'rules':len(rules),'inputs':len(d),'source_hashes':m['source_audit_v08437']},indent=2))
