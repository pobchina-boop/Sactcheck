"""Source-specific clinical encoding. Ambiguous source rows remain review actions."""
import runpy,json,copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
globals().update({k:v for k,v in runpy.run_path(str(ROOT/'tools/breast-family-v0840-rules.py')).items() if not k.startswith('__')})
cfg=runpy.run_path(str(ROOT/'tools/breast-family-v0840-config.py'))['CONFIG']
A=json.loads((ROOT/'validation/breast-family-v0840/ac-audit.json').read_text())['regimens']
T=json.loads((ROOT/'validation/breast-family-v0840/taxane-audit.json').read_text())['regimens']
H=json.loads((ROOT/'validation/breast-family-v0840/her2-audit.json').read_text())['regimens']
def always():return anyof(atom('treatment_phase','missing'),atom('treatment_phase','exists'))
def active(name):return atom('treatment_phase','==',name)
def notmaintenance():return anyof(atom('treatment_phase','missing'),atom('treatment_phase','!=','continuation'))
def r(d,id,c,a,drugs,text,page=3,gate=None,**kw):rule(d,id,allof(gate,c) if gate else c,a,drugs,text,page,**kw)
def pageof(x,part,default=3):return next((t['page'] for t in x.get('dose_tables',[]) if part in t['name']),default)
def add_inputs(d,her2=False):
 for k,l,u in [('anc_x10e9_l','ANC','×10⁹/L'),('platelets_x10e9_l','Platelets','×10⁹/L'),('alt_uln_multiple','ALT / ULN','×ULN'),('ast_uln_multiple','AST / ULN','×ULN'),('alp_uln_multiple','ALP / ULN','×ULN'),('bilirubin_uln_multiple','Bilirubin / ULN','×ULN'),('crcl_ml_min','Creatinine clearance (not indexed eGFR)','mL/min'),('anc_below_0_5_days','Duration of ANC below 0.5','days')]:num(d,k,l,u)
 for k,l in [('febrile_neutropenia','Febrile neutropenia'),('haemodialysis','Haemodialysis'),('severe_hepatic_impairment','Severe hepatic impairment'),('indication_eligible','Full NCCP indication / prior-treatment criteria confirmed')]:boolean(d,k,l)
 for k,l in [('neuropathy_grade','Peripheral neuropathy grade'),('other_nonhaem_toxicity_grade','Other non-haematological toxicity'),('stomatitis_grade','Stomatitis'),('skin_grade','Skin toxicity')]:grade(d,k,l)
 if her2:
  for k,l,u in [('baseline_lvef_percent','Baseline LVEF','%'),('lvef_percent','Current LVEF','%'),('lvef_drop_points','Fall from baseline LVEF','percentage points'),('days_overdue_trastuzumab','Days late after the planned trastuzumab dose','days')]:num(d,k,l,u,100 if 'lvef' in k else None)
  for k,l in [('her2_positive','HER2-positive tumour confirmed'),('symptomatic_heart_failure','Symptomatic heart failure'),('significant_cardiac_disease','Clinically significant cardiac disease'),('cardiac_monitoring_overdue','Required cardiac assessment unavailable / overdue'),('severe_dyspnoea_at_rest','Severe dyspnoea at rest / requiring oxygen')]:boolean(d,k,l)
  grade(d,'trastuzumab_hypersensitivity_grade','HER2-treatment hypersensitivity')
def common(d,code,drugs,ecog=2):
 r(d,'ALLERGY',atom('hypersensitivity','==',True),'contraindicated',drugs,'Relevant drug / excipient allergy: do not administer; identify the responsible drug.',2)
 r(d,'INDICATION',atom('indication_eligible','==',False),'consultant_review',drugs,'Full NCCP indication or prior-treatment criteria are not confirmed. Review regimen selection.',1)
 r(d,'ECOG',atom('ecog','>',ecog),'consultant_review',drugs,'Outside the source performance-status population; consultant review required.',2)
 # Pregnancy/lactation are never silently inferred absent. The action is review unless the source explicitly excludes.
 r(d,'PREGNANCY_REVIEW',atom('pregnancy','==',True),'consultant_review',drugs,'Pregnancy requires urgent specialist risk-benefit review before administration; the source-specific exclusions and medicine information must be checked.',1)
 d['rule_engine']['rules'][-1]['source']['document']='Clinical safety review prompt; not an encoded NCCP pregnancy dose table'
 r(d,'LACTATION_REVIEW',atom('breastfeeding','==',True),'consultant_review',drugs,'Breastfeeding requires specialist medicine review before treatment; follow regimen exclusions and product information.',1)
def pac(d,gate,page,hep,code,fortnight=False,counts=True):
 num(d,'current_paclitaxel_mg_m2','Actual current paclitaxel dose','mg/m²');num(d,'prior_paclitaxel_reductions','Previous paclitaxel dose reductions');num(d,'paclitaxel_delay_days','Paclitaxel toxicity delay','days');boolean(d,'intolerant_after_reductions','Still intolerant after previous dose reductions')
 if counts:
  r(d,'PAC_ANC_LOW',atom('anc_x10e9_l','<',1),'delay','paclitaxel','Hold low-ANC paclitaxel now; establish duration and recovery before deciding reduction.',page,gate)
  r(d,'PAC_PLT_LOW',atom('platelets_x10e9_l','<',90),'delay','paclitaxel','Delay paclitaxel for platelets below 90; below 70 requires reduction after recovery.',page,gate)
  r(d,'PAC_PLT_90_OVERLAP',atom('platelets_x10e9_l','==',90),'consultant_review','paclitaxel','Platelets 90 appears in both the full-dose and delay rows. Resolve the source overlap before treatment.',page,gate)
  r(d,'PAC_SEVERE_COUNTS',anyof(atom('platelets_x10e9_l','<',70),allof(atom('anc_x10e9_l','<',0.5),atom('anc_below_0_5_days','>=',7))),'delay_then_dose_reduce','paclitaxel','Delay until recovery, then reduce one source level (80 →65 →50 mg/m²); consider G-CSF. The actual current dose and recovery must be reviewed before restart.',page,gate)
  fnreduce=code in ['00512','00621']
  r(d,'PAC_FN',atom('febrile_neutropenia','==',True),'delay_then_dose_reduce' if fnreduce else 'withhold','paclitaxel',('Delay and treat febrile neutropenia urgently; reduce one level after recovery and consider G-CSF.' if fnreduce else 'Treat febrile neutropenia urgently and withhold pending assessment. Source advises considering G-CSF; it does not assign an automatic 65 / 50 mg/m² dose for FN alone.'),page,gate)
 trans=['alt_uln_multiple','ast_uln_multiple'] if code=='00621' else ['alt_uln_multiple']
 r(d,'PAC_HEP_STOP',anyof(*[atom(f,'>=',10) for f in trans],atom('bilirubin_uln_multiple','>',5)),'contraindicated','paclitaxel','Paclitaxel is not recommended / contraindicated at this hepatic threshold.',hep,gate)
 low=allof(*[atom(f,'<',10) for f in trans])
 for lo,hi,dose in [(1.26,2,135 if fortnight else 60),(2.01,5,90 if fortnight else 40)]:r(d,'PAC_HEP_'+str(dose),allof(low,band('bilirubin_uln_multiple',lo,hi)),'dose_reduce','paclitaxel',f'Source hepatic dose {dose} mg/m². Reconcile previous reductions and the current dose; do not re-escalate automatically.',hep,gate,dose={'value':dose,'unit':'mg/m2'})
 for lo,hi in [(1.25,1.26),(2,2.01)]:r(d,'PAC_HEP_GAP_'+str(lo),allof(atom('bilirubin_uln_multiple','>',lo),atom('bilirubin_uln_multiple','<',hi)),'consultant_review','paclitaxel','Decimal bilirubin lies between printed source bands; do not silently round into a dose band.',hep,gate)
 r(d,'PAC_HEP_MISSING',allof(atom('bilirubin_uln_multiple','>',1.25),anyof(*[atom(f,'missing') for f in trans])),'consultant_review','paclitaxel','Obtain the required transaminase context before interpreting this hepatic dose band.',hep,gate)
 if code=='00507':
  r(d,'PAC_NEURO_CONFLICT',atom('neuropathy_grade','>',2),'withhold','paclitaxel','SOURCE CONFLICT: neuropathy >2 has a 10 mg/m² reduction instruction, while a broad ≥grade 3 reaction row says discontinue. Hold and obtain consultant/pharmacy clarification; do not automatically choose either dose.',5,gate)
  r(d,'PAC_NEURO_G2_REVIEW',atom('neuropathy_grade','==',2),'consultant_review','paclitaxel','Review neuropathy before the next dose. This source says >grade 2 for its reduction row; do not import the grade-2 10 mg/m² rule from another weekly regimen.',5,gate)
 else:
  r(d,'PAC_NEURO_G2',atom('neuropathy_grade','==',2),'consultant_review' if fortnight or code=='00745' else 'dose_reduce','paclitaxel','Grade 2 neuropathy may require dose reduction or delay; consultant review determines the source-specific adjustment.' if fortnight or code=='00745' else 'Grade 2 neuropathy: reduce 10 mg/m² from the actual current paclitaxel dose, distinct from the haematological dose ladder.',pageof(A.get(code,{}),'Paclitaxel adverse',4),gate,**({} if fortnight or code=='00745' else {'absolute_reduction':{'value':10,'unit':'mg/m2'},'dose_calculation':'specialist_review'}))
  r(d,'PAC_NEURO_G3',atom('neuropathy_grade','>=',3),'discontinue','paclitaxel','Grade ≥3 reaction / non-haematological toxicity: discontinue paclitaxel under the source table; assess urgently.',pageof(A.get(code,{}),'Paclitaxel adverse',4),gate)
 if code not in ['00278','00745']:
  r(d,'PAC_OTHER_G2',atom('other_nonhaem_toxicity_grade','==',2),'withhold','paclitaxel','Hold until grade ≤1, then consider a 10 mg/m² reduction from the actual current dose. Review the source dose-level / adverse-event instructions.',pageof(A.get(code,{}),'Paclitaxel adverse',5 if code=='00507' else 4),gate)
  r(d,'PAC_OTHER_G3',atom('other_nonhaem_toxicity_grade','>=',3),'withhold' if code=='00507' else 'discontinue','paclitaxel','Review the source ≥grade 3 reaction instruction urgently; the reaction scope is ambiguous in 00507.' if code=='00507' else 'Grade ≥3 non-haematological reaction: discontinue paclitaxel per the source table.',pageof(A.get(code,{}),'Paclitaxel adverse',5 if code=='00507' else 4),gate)
 intoler=allof(atom('prior_paclitaxel_reductions','>=',2),atom('intolerant_after_reductions','==',True))
 stop=code in ['00433','00507']
 r(d,'PAC_INTOLERANCE',anyof(intoler,atom('paclitaxel_delay_days','>',14)) if stop else intoler,'discontinue' if stop else 'consultant_review','paclitaxel','Stop paclitaxel for intolerance after two reductions or a toxicity delay longer than two weeks.' if stop else 'Intolerance after two reductions requires treating-clinician discussion about continuation.',pageof(A.get(code,{}),'Paclitaxel adverse',5 if code=='00507' else 4),gate)
def cardiac(d,code,components,page,gate=None):
 if code=='00316':hold=atom('lvef_drop_points','>=',10);txt='This NCCP source holds trastuzumab for a fall ≥10 points alone, unlike the combined <50% rule in related regimens. Repeat LVEF in about 3 weeks; cardiology / consultant review if not improved.'
 elif code=='00507':hold=anyof(atom('lvef_percent','<',40),allof(band('lvef_percent',40,45),atom('lvef_drop_points','>=',10)));txt='Hold both antibodies for LVEF <40 or 40–45 with a fall ≥10 points; repeat within 3 weeks. Resume only after specialist review of recovery.'
 else:hold=allof(atom('lvef_percent','<',50),atom('lvef_drop_points','>=',10));txt='Hold for LVEF <50% AND a fall ≥10 percentage points. Repeat within about 3 weeks; no improvement / further decline requires consultant and cardiology review.'
 r(d,'HER2_LVEF_HOLD',hold,'withhold',components,txt,page,gate)
 r(d,'HER2_LVEF_REVIEW',anyof(atom('lvef_percent','<',50),atom('lvef_drop_points','>=',10)),'consultant_review',components,'Review the measured LVEF and baseline change using this regimen’s exact hold criterion. Missing context is unassessed; an isolated concerning result is not clearance.',page,gate)
 r(d,'HER2_HF',atom('symptomatic_heart_failure','==',True),'discontinue' if code in ['00731','00204','00507'] else 'withhold',components,'Symptomatic heart failure: discontinue and refer for urgent cardiac assessment.' if code in ['00731','00204','00507'] else 'Symptomatic heart failure: hold and obtain urgent cardiology / oncology review; source says consider discontinuation, not an automatic permanent-stop rule.',page,gate)
 r(d,'HER2_REACTION_G4',atom('trastuzumab_hypersensitivity_grade','==',4),'discontinue',components,'Grade 4 hypersensitivity: discontinue the implicated treatment and manage urgently.',page,gate)
 r(d,'HER2_REACTION_G3',atom('trastuzumab_hypersensitivity_grade','==',3),'withhold',components,'Interrupt and urgently assess a severe infusion reaction; the source grade-4 discontinuation rule must not be relabelled grade 3.',page,gate)
 r(d,'HER2_MONITORING',atom('cardiac_monitoring_overdue','==',True),'consultant_review',components,'Required cardiac results are missing or overdue. Arrange assessment and a documented treatment decision; never assume normal function.',page,gate)
 r(d,'HER2_STATUS',atom('her2_positive','==',False),'consultant_review',components,'Validated HER2 positivity is required. Reconcile testing and regimen choice.',1)
def dochep(d,gate,code,page):
 high=anyof(atom('bilirubin_uln_multiple','>',1.5),atom('alt_uln_multiple','>',10),atom('ast_uln_multiple','>',10),atom('alp_uln_multiple','>',6))
 r(d,'DOC_HEP_STOP',high,'contraindicated','docetaxel','Source hepatic threshold: docetaxel not recommended. No other liver value is needed to recognise this independent severe threshold.',page,gate)
 # The 50% row overlaps the 75% row when read literally. Never choose a percentage automatically.
 abnormal=anyof(atom('bilirubin_uln_multiple','>',1),atom('alt_uln_multiple','>',1.5),atom('ast_uln_multiple','>',1.5),atom('alp_uln_multiple','>',2.5))
 r(d,'DOC_HEP_AMBIGUITY',abnormal,'consultant_review','docetaxel','SOURCE AMBIGUITY: normal bilirubin with AST/ALT >1.5–5 and ALP >2.5–5 suggests considering 75% of ORIGINAL dose; the printed 50% row overlaps / leaves gaps. Consultant/pharmacy must resolve the pattern, including ALP exactly 6. No automatic 50% / 75% dose is calculated.',page,gate)
def doctoxic(d,gate,code,page):
 num(d,'current_docetaxel_mg_m2','Actual current docetaxel dose','mg/m²');boolean(d,'toxicity_persists_at_reduced_dose','This toxicity persists / recurs at the reduced dose')
 for label,cond in [('NEURO',atom('neuropathy_grade','>',2)),('MOUTH',atom('stomatitis_grade','>=',3))]:
  txt='Neuropathy >2: reduce to 60 mg/m²; if persistent at 60, discontinue docetaxel.' if label=='NEURO' else 'Stomatitis ≥3: reduce to 60 mg/m²; check the exact source before a further reduction.'
  if code=='00202':txt='Source ladder for neuropathy is 100 →75 →60 mg/m²; stomatitis grade 3/4 reduces to 60 mg/m².'
  if not (code=='00202' and label=='MOUTH'):r(d,'DOC_'+label,cond,'consultant_review','docetaxel',txt,page,gate)
  if code=='00202' and label=='NEURO':
   for current,target in [(100,75),(75,60)]:r(d,'DOC_NEURO_'+str(current),allof(cond,atom('current_docetaxel_mg_m2','==',current)),'dose_reduce','docetaxel',f'Reduce docetaxel from {current} to {target} mg/m² for this toxicity after clinical review.',page,gate,dose={'value':target,'unit':'mg/m2'})
  elif label=='MOUTH' and code in ['00258','00731']:
   for current,target in [(75,60),(60,50)]:r(d,'DOC_MOUTH_'+str(current),allof(cond,atom('current_docetaxel_mg_m2','==',current)),'dose_reduce','docetaxel',f'Stomatitis pathway: {current} →{target} mg/m²; no further planned reduction beyond 50.',page,gate,dose={'value':target,'unit':'mg/m2'})
  elif code not in ['00202']:
   r(d,'DOC_'+label+'_75',allof(cond,atom('current_docetaxel_mg_m2','==',75)),'dose_reduce','docetaxel','Reduce docetaxel to 60 mg/m² after assessment of this toxicity.',page,gate,dose={'value':60,'unit':'mg/m2'})
  if label=='NEURO' or code in ['00203','00250']:r(d,'DOC_'+label+'_PERSISTENT',allof(cond,atom('current_docetaxel_mg_m2','==',60),atom('toxicity_persists_at_reduced_dose','==',True)),'discontinue','docetaxel','This toxicity persists at 60 mg/m²: discontinue docetaxel.',page,gate)
  if label=='MOUTH' and code=='00202':r(d,'DOC_MOUTH_60',cond,'dose_reduce','docetaxel','Grade 3/4 stomatitis: docetaxel 60 mg/m² in the source table; review current dose and recovery.',page,gate,dose={'value':60,'unit':'mg/m2'})
 r(d,'DOC_SKIN',atom('skin_grade','>=',3),'consultant_review','docetaxel','Severe skin toxicity requires source-specific review. Grade-3 source rows and current dose determine reduction; do not extrapolate an unqualified grade-4 percentage.',page,gate)
for code,c in cfg.items():
 x=A.get(code) or T.get(code) or H.get(code);src=x.get('source',{});version=src.get('version',x.get('source_version'));p,d=init(code,str(version));d.pop('dose_levels',None);d.pop('treatment',None);add_inputs(d,bool(c['her2']));common(d,code,c['agents'],1 if code in ['00250','00731','00507'] else 2)
 d['metadata']['source_url']=src.get('url',x.get('source_url'));d['metadata']['source_document_pages']=src.get('pages',5 if code in ['00202','00203','00621'] else 6);d['metadata']['source_version_verified_date']='2026-10-17'
 d['metadata']['audit_limitations']=A[code]['ambiguities'] if code in A else ['Source hepatic / boundary ambiguities are explicit review actions.','Independent clinical and pharmacy validation pending.'];d['metadata']['audited_eligibility']=[str(v) for v in x.get('eligibility',[])] if isinstance(x.get('eligibility'),list) else [str(k)+': '+str(v) for k,v in x.get('eligibility',{}).items()]
 d['metadata']['source_monitoring']=x.get('monitoring',{})
 d['metadata']['support_source_page']=next((i for i in []),0)
 # Source URL is set after helper initialization: all subsequent rules cite current source.
 for rr in d['rule_engine']['rules']:rr['source']['url']=d['metadata']['source_url']
 options=([('ac','AC chemotherapy'),('paclitaxel','Taxane phase')]+([('continuation','HER2-only continuation')] if c['her2'] else [])) if c['ac'] and c['tax'] else [('combination','Chemotherapy / combination')]+([('continuation','HER2-only continuation')] if c['her2'] and code!='00731' else [])
 select(d,'treatment_phase','Current phase',options);gate=notmaintenance()
 if code!='00252':r(d,'BASELINE_ANC',allof(atom('assessment_stage','==','baseline'),atom('anc_x10e9_l','<',1 if code=='00204' else 1.5)),'contraindicated',c['agents'],'Below the source baseline ANC inclusion / exclusion threshold. Ongoing count rules are separate.',2)
 if c['ac']:
  ac=active('ac') if c['tax'] else always();tax=active('paclitaxel')
  if c['tax']:
   r(d,'PHASE_MISSING',allof(atom('treatment_phase','missing'),anyof(*[atom(f,'exists') for f in ['anc_x10e9_l','platelets_x10e9_l','bilirubin_umol_l','bilirubin_uln_multiple','alt_uln_multiple','ast_uln_multiple','crcl_ml_min','neuropathy_grade']])),'consultant_review',['doxorubicin','cyclophosphamide','paclitaxel'],'Select AC versus taxane phase to interpret the supplied value. Missing phase never defaults to AC or trastuzumab continuation.',3)
   r(d,'LOW_COUNTS_NO_PHASE',allof(atom('treatment_phase','missing'),anyof(atom('anc_x10e9_l','<',1),atom('platelets_x10e9_l','<',70))),'delay',['doxorubicin','cyclophosphamide','paclitaxel'],'Below the minimum count threshold of either chemotherapy phase; hold chemotherapy and establish the active phase. This does not automatically withhold trastuzumab.',3)
  for k,l,u in [('bilirubin_umol_l','Bilirubin (absolute)','µmol/L'),('lifetime_doxorubicin_mg_m2','Prior cumulative doxorubicin exposure','mg/m²'),('proposed_doxorubicin_mg_m2','Proposed additional doxorubicin dose','mg/m²'),('lvef_percent','Current LVEF','%'),('platelet_delay_count','Previous thrombocytopenia-related delays','')]:num(d,k,l,u)
  for k,l in [('significant_heart_disease','Clinically significant heart disease'),('child_pugh_c','Child-Pugh C'),('proposed_dose_crosses_anthracycline_limit','Proposed dose would exceed lifetime anthracycline limit'),('restarting_after_count_delay','Restart after a count-related delay')]:boolean(d,k,l)
  cp=pageof(x,'haematology');low70=code in ['00252','00260'];comps=['doxorubicin','cyclophosphamide']
  r(d,'AC_LOW_COUNTS',anyof(atom('anc_x10e9_l','<',1),atom('platelets_x10e9_l','<',70 if low70 else 100)),'delay',comps,'Delay AC and review recovery. '+('Source minimum platelets is 70 for the hold band.' if low70 else 'Delay at least one week; source recovery requires ANC >1 and platelets at least 100, with some strict-boundary wording requiring review.'),cp,ac)
  if low70:
   r(d,'AC_INTERMEDIATE',anyof(band('anc_x10e9_l',1,1.49),band('platelets_x10e9_l',70,90)),'consultant_review',comps,'Source intermediate row describes 75% AC, with G-CSF an alternative for neutrophil support. Review both domains and the source row; a single abnormal value must not disappear.',cp,ac)
   r(d,'AC_ANC_GAP',allof(atom('anc_x10e9_l','>',1.49),atom('anc_x10e9_l','<',1.5)),'consultant_review',comps,'ANC lies between printed bands; confirm interpretation rather than silently rounding.',cp,ac)
  if code in ['00278','00316','00745']:r(d,'COUNT_100_BOUNDARY',atom('platelets_x10e9_l','==',100),'consultant_review',comps if code not in ['00278','00316','00745'] else ['doxorubicin','cyclophosphamide','paclitaxel'],'Routine full-dose >100 and recovery wording differ; exact platelets 100 needs source-boundary review.',cp,gate)
  r(d,'AC_RESTART_BOUNDARY',allof(atom('restarting_after_count_delay','==',True),anyof(atom('anc_x10e9_l','<=',1),atom('platelets_x10e9_l','<=',100))),'consultant_review',comps,'Recovery thresholds differ from routine full-dose rows. Confirm ANC >1 and the exact platelet recovery condition before restarting.',cp,ac)
  r(d,'AC_SECOND_PLT_DELAY',atom('platelet_delay_count','>=',2),'consultant_review',comps,'After a second thrombocytopenia-related delay, source describes 75% dosing after recovery. This is not a general rule for every cause of delay.',cp,ac)
  if code not in ['00252','00260','00432']:r(d,'AC_FN',atom('febrile_neutropenia','==',True),'withhold',comps,'Treat febrile neutropenia urgently; source describes 75% current / subsequent cytotoxic doses after recovery and clinical review.',cp,ac)
  r(d,'AC_CARDIAC',anyof(atom('lvef_percent','<',50),atom('significant_heart_disease','==',True)),'consultant_review' if code=='00432' else 'contraindicated','doxorubicin','Source cardiac caution / exclusion: do not administer without specialist assessment of the anthracycline plan.',2,ac)
  r(d,'AC_LVEF_50',atom('lvef_percent','==',50),'consultant_review','doxorubicin','Source requires LVEF >50 for doxorubicin while some exclusion lists say <50. Resolve exactly 50 before treatment.',2,ac)
  r(d,'DOXO_CUMULATIVE',anyof(atom('lifetime_doxorubicin_mg_m2','>=',450),atom('proposed_dose_crosses_anthracycline_limit','==',True)),'contraindicated','doxorubicin','The 450 mg/m² source lifetime limit is reached or would be exceeded. Reconcile all prior anthracyclines, planned dose and cardiac risk.',1,ac)
  r(d,'DOXO_PRIOR_EXPOSURE',atom('lifetime_doxorubicin_mg_m2','>',0),'consultant_review','doxorubicin','Reconcile prior exposure plus the proposed dose against the lifetime limit before administration; a prior value below 450 alone does not establish remaining eligibility.',1,ac)
  hp=pageof(x,'Renal/hepatic:doxorubicin');old=code in ['00252','00278']
  for lo,hi,pct in [(20,50 if not old else 50.999999,50),(51 if not old else 51.000001,86 if not old else 85,25)]:r(d,'DOXO_BILI_'+str(pct),band('bilirubin_umol_l',lo,hi),'dose_reduce','doxorubicin',f'Source bilirubin band: {pct}% of original doxorubicin dose; reconcile competing reductions.',hp,ac,dose_percent=pct)
  r(d,'DOXO_BILI_BOUNDARY',atom('bilirubin_umol_l','==',51) if old else allof(atom('bilirubin_umol_l','>',50),atom('bilirubin_umol_l','<',51)),'consultant_review','doxorubicin','Overlapping / unassigned bilirubin boundary in the printed source. Do not infer a dose by rounding.',hp,ac)
  r(d,'DOXO_BILI_OMIT',anyof(atom('bilirubin_umol_l','>',85 if old else 86),atom('child_pugh_c','==',True)) if not old else atom('bilirubin_umol_l','>',85),'omit','doxorubicin','Doxorubicin not recommended / omit at this source hepatic threshold.',hp,ac)
  if old:
   for id,cond,pct in [('AST_2_3',band('ast_uln_multiple',2,3),75),('AST_GT3',atom('ast_uln_multiple','>',3),50)]:r(d,'DOXO_'+id,cond,'dose_reduce','doxorubicin',f'Source AST row: {pct}% original dose. Do not multiply with bilirubin reductions; resolve combined abnormalities with pharmacy.',hp,ac,dose_percent=pct)
  else:r(d,'DOXO_HD',atom('haemodialysis','==',True),'consultant_review','doxorubicin','Consider 75% original doxorubicin in haemodialysis under an individual specialist plan.',hp,ac)
  renal20=code in ['00252','00278','00433'];rp=pageof(x,'Renal/hepatic:cyclophosphamide')
  r(d,'CYCLO_RENAL_75',band('crcl_ml_min',10,20 if renal20 else 29),'dose_reduce','cyclophosphamide','Source renal band: consider 75% of original cyclophosphamide; verify renal method and clinical context.',rp,ac,dose_percent=75)
  if not renal20:r(d,'CYCLO_RENAL_GAP',allof(atom('crcl_ml_min','>',29),atom('crcl_ml_min','<',30)),'consultant_review','cyclophosphamide','CrCl lies between the printed whole-number bands; no silent rounding.',rp,ac)
  r(d,'CYCLO_RENAL_LT10',atom('crcl_ml_min','<',10),'dose_reduce' if old else 'omit','cyclophosphamide','Source specifies 50% original dose below CrCl 10.' if old else 'Omit / not recommended below CrCl 10. Any unavoidable 50% exception requires specialist approval; it is not the default.',rp,ac,**({'dose_percent':50} if old else {}))
  r(d,'CYCLO_HEPATIC',atom('severe_hepatic_impairment','==',True),'consultant_review' if old else 'contraindicated','cyclophosphamide','Severe hepatic impairment requires a clinical decision.' if old else 'Cyclophosphamide is not recommended in severe hepatic impairment because efficacy may be reduced.',rp,ac)
  if c['tax']:
   general=code in ['00278','00316','00745']
   if general:
    r(d,'TAX_LOW_COUNTS',anyof(atom('anc_x10e9_l','<',1),atom('platelets_x10e9_l','<',100)),'delay','paclitaxel','Source cytotoxic table: delay until recovery; platelet recovery wording and prior thrombocytopenia delays must be reviewed.',cp,tax)
    r(d,'TAX_FN',atom('febrile_neutropenia','==',True),'withhold','paclitaxel','Urgently assess FN; source cytotoxic table describes 75% dosing after recovery. Do not reduce trastuzumab automatically.',cp,tax)
   pac(d,tax,pageof(x,'Paclitaxel haematology'),pageof(x,'Paclitaxel hepatic'),code,c['tax']==14,not general)
  phases=[]
  for ph in x['phases']:
   if ph['id']=='ac':meds=[med(z['name'],z['dose'],z['unit'],route=z['route']) for z in ph['drugs']];pid='ac'
   elif ph['id']=='paclitaxel':
    meds=[med('paclitaxel',ph['dose'],'mg/m2',ph['days'],notes=ph['start_note'])];pid='paclitaxel'
    if ph.get('concurrent_trastuzumab'):
     z=ph['concurrent_trastuzumab'];meds.append(med('trastuzumab',z['maintenance_mg_kg'],'mg/kg',z['days'],notes=f'Initial loading {z["loading_mg_kg"]} mg/kg; starts with taxane, never with AC.'))
   else:pid='continuation';meds=[med('trastuzumab',6,'mg/kg',notes=ph['duration'])]
   q=phase(d,[],ph['cycle_days'],pid,'AC chemotherapy' if pid=='ac' else 'Taxane phase' if pid=='paclitaxel' else 'HER2 continuation',meds);q['cycles']=list(range(1,ph.get('cycles',0)+1));phases.append(q)
  d['treatment_phases']=phases
 else:
  if 'paclitaxel' in c['agents']:pac(d,gate,3,4 if code=='00507' else 3,code)
  if code in ['00202','00203','00250','00204']:dochep(d,gate,code,4 if code=='00204' else 3);doctoxic(d,gate,code,4 if code=='00204' else 3)
  if code in ['00202','00203']:
   r(d,'DOC_ANC_LOW',atom('anc_x10e9_l','<',1.5),'delay','docetaxel','Delay docetaxel for ANC below 1.5. Very low ANC requires immediate review; duration determines the subsequent reduction.',2,gate)
   cond=anyof(atom('febrile_neutropenia','==',True),allof(atom('anc_x10e9_l','<',0.5),atom('anc_below_0_5_days','>',7)))
   r(d,'DOC_FN_REDUCTION',cond,'withhold','docetaxel','Treat the acute event and confirm recovery. Subsequent source ladder is '+('100 →75 →60 mg/m².' if code=='00202' else '75 →60 mg/m²; discontinue if recurrence at the lower dose.'),2,gate)
   if code=='00203':r(d,'DOC_FN_RECURRENCE',allof(cond,atom('current_docetaxel_mg_m2','==',60),atom('toxicity_persists_at_reduced_dose','==',True)),'discontinue','docetaxel','Recurrent qualifying event at 60 mg/m²: discontinue docetaxel.',2,gate)
  if code=='00250':
   num(d,'fn_episode_count','Febrile-neutropenia episode number');boolean(d,'restarting_after_fn','Restart assessment after FN')
   for id,cond,txt in [('ANC',atom('anc_x10e9_l','<',1),'ANC below 1: delay at least one week; recovery ANC >1 and platelets ≥100.'),('PLT',atom('platelets_x10e9_l','<',100),'Platelets below 100: delay at least one week; source specifies 75% after recovery ANC >1 and platelets ≥100.')]:r(d,'TC_'+id,cond,'delay',['docetaxel','cyclophosphamide'],txt,2,gate)
   r(d,'TC_FN',atom('febrile_neutropenia','==',True),'withhold',['docetaxel','cyclophosphamide'],'Treat FN urgently. After recovery: first episode 75% PREVIOUS dose, second 50% ORIGINAL dose, third discontinue. Confirm episode count and both recovery counts before restart.',2,gate)
   r(d,'TC_FN_THIRD',atom('fn_episode_count','>=',3),'discontinue',['docetaxel','cyclophosphamide'],'Third FN episode: discontinue under the source table.',2,gate)
   for n,txt in [(1,'75% previous dose'),(2,'50% original dose')]:r(d,'TC_FN_EPISODE_'+str(n),atom('fn_episode_count','==',n),'consultant_review',['docetaxel','cyclophosphamide'],f'After FN episode {n}, source specifies {txt}, only after recovery. Source FN restart requires ANC >1 and platelets >100; exact boundary values need review.',2,gate)
   r(d,'TC_CYCLO_RENAL',band('crcl_ml_min',10,29),'dose_reduce','cyclophosphamide','Consider 75% original cyclophosphamide at CrCl 10–29.',3,gate,dose_percent=75)
   r(d,'TC_CYCLO_RENAL_LOW',anyof(atom('crcl_ml_min','<',10),atom('haemodialysis','==',True)),'omit','cyclophosphamide','Not recommended below CrCl 10 or on haemodialysis; unavoidable 50% dosing requires specialist review.',3,gate)
   r(d,'TC_CYCLO_RENAL_GAP',allof(atom('crcl_ml_min','>',29),atom('crcl_ml_min','<',30)),'consultant_review','cyclophosphamide','CrCl lies between printed bands; confirm source interpretation.',3,gate)
   r(d,'TC_CYCLO_HEP',atom('severe_hepatic_impairment','==',True),'contraindicated','cyclophosphamide','Severe hepatic impairment: cyclophosphamide not recommended due to reduced efficacy.',3,gate)
   r(d,'TC_BASELINE_NEURO',allof(atom('assessment_stage','==','baseline'),atom('neuropathy_grade','>=',2)),'contraindicated',c['agents'],'Baseline neuropathy grade ≥2 is an exclusion in this TC source.',2)
   r(d,'TC_NEURO_CONTEXT',allof(atom('assessment_stage','missing'),atom('neuropathy_grade','>=',2)),'consultant_review',c['agents'],'Clarify baseline versus treatment-emergent neuropathy; baseline grade ≥2 is excluded, ongoing actions differ.',2)
  if code=='00204':r(d,'COUNTS_NO_ONGOING_TABLE',anyof(atom('anc_x10e9_l','exists'),atom('platelets_x10e9_l','exists')),'consultant_review','docetaxel','NCCP gives baseline ANC exclusion but no ongoing blood-count modification table for this regimen. Review current counts under the local protocol; do not infer clearance or import TCH platelet thresholds.',3,gate)
  # Explicit schedule below; no old single-drug day-22 fields survive.
  meds=[]
  if c['her2']:meds.append(med('trastuzumab',600 if c.get('sc') else 2 if code=='00512' else 6,'mg' if c.get('sc') else 'mg/kg',route='SC injection' if c.get('sc') else 'IV infusion',notes='No loading dose.' if c.get('sc') else 'Initial loading '+('4' if code=='00512' else '8')+' mg/kg; verify prior treatment / missed doses.'))
  if 'pertuzumab' in c['agents']:meds.insert(0,med('pertuzumab',420,'mg',notes='Initial loading 840 mg IV; subsequent 420 mg IV every 21 days.'))
  if 'docetaxel' in c['agents']:meds.append(med('docetaxel',100 if code=='00202' else 75,'mg/m2',notes='00204: escalation to 100 mg/m² can be considered if first dose well tolerated.' if code=='00204' else ''))
  if 'paclitaxel' in c['agents']:meds.append(med('paclitaxel',80,'mg/m2',[1,8,15] if code in ['00507','00621'] else 1,notes='No Day 22 dose in this 28-day regimen.' if code=='00621' else ''))
  if 'cyclophosphamide' in c['agents']:meds.append(med('cyclophosphamide',600,'mg/m2'))
  if 'carboplatin' in c['agents']:meds.append(med('carboplatin',6,'AUC',notes='Calvert dose requires the protocol-specific verified renal method; no automatic creatinine substitution.'))
  days=7 if code=='00512' else 28 if code=='00621' else 21
  d['treatment_phases']=[phase(d,[],days,'combination',c['title'],meds)]
  if c['her2'] and code!='00731':d['treatment_phases'].append(phase(d,[],21,'continuation','HER2-only continuation',[m for m in copy.deepcopy(meds) if m['drug'] in ['trastuzumab','pertuzumab']]))
  if code=='00512':d['treatment_phases'][1]['administration'][0].update(dose={'value':6,'unit':'mg/kg'},notes='Continue weekly 2 mg/kg OR q21-day 6 mg/kg under the agreed plan, to complete one year total. Retain adjuvant context.')
 if c['her2']:
  comps=['trastuzumab']+(['pertuzumab'] if 'pertuzumab' in c['agents'] else [])
  cardiac(d,code,comps,pageof(x,'Trastuzumab adverse',7 if code=='00731' else 6 if code=='00258' else 5 if code in ['00204','00507'] else 4))
  threshold=55 if code=='00731' else 50
  r(d,'HER2_BASELINE_LOW',atom('baseline_lvef_percent','<',threshold),'withhold',comps,'Below the source baseline LVEF eligibility; specialist cardiac assessment before starting.',2)
  if code in ['00433','00512','00258']:r(d,'HER2_BASELINE_BORDERLINE',band('baseline_lvef_percent',50,55),'consultant_review',comps,'Source specifies baseline LVEF >55%; the 50–55% trial range requires clinical judgement, not automatic eligibility.',2)
  r(d,'HER2_CARDIAC_DISEASE',atom('significant_cardiac_disease','==',True),'consultant_review' if code in ['00432','00204'] else 'contraindicated',comps,'Clinically significant cardiac disease is a source caution / exclusion. Reconcile the individual cardiac plan before administration.',2)
  r(d,'HER2_DYSPNOEA',atom('severe_dyspnoea_at_rest','==',True),'contraindicated',comps,'Severe dyspnoea at rest requires urgent review and is a trastuzumab product contraindication.',2)
  d['rule_engine']['rules'][-1]['source'].update(document='EMA Herceptin SmPC section 4.3',url='https://www.ema.europa.eu/en/documents/product-information/herceptin-epar-product-information_en.pdf')
  if 'pertuzumab' in c['agents']:
   num(d,'days_since_last_antibody','Days since last antibody administration','days');boolean(d,'trastuzumab_discontinued','Trastuzumab has been discontinued')
   r(d,'STOP_PERTUZUMAB_WITH_H',atom('trastuzumab_discontinued','==',True),'discontinue','pertuzumab','Stop pertuzumab if trastuzumab is discontinued.',5 if code=='00731' else 3)
   r(d,'ANTIBODY_RELOAD',atom('days_since_last_antibody','>=',42),'consultant_review',comps,'Interval ≥6 weeks: reload pertuzumab 840 mg IV; '+('trastuzumab remains 600 mg SC with no loading dose.' if c.get('sc') else 'IV trastuzumab reload 8 mg/kg, then 6 mg/kg every 21 days.')+' Confirm history, current cardiac review and observation. Do not reset prior chemotherapy reductions.',4 if code=='00731' else 3)
   r(d,'ANTIBODY_WITHIN6',allof(atom('days_since_last_antibody','>',21),atom('days_since_last_antibody','<',42)),'consultant_review',comps,'Less than six weeks between administrations: usual maintenance antibody doses as soon as clinically appropriate; check source schedule and reset appointments with the team.',4 if code=='00731' else 3)
  else:
   select(d,'trastuzumab_schedule','Actual trastuzumab schedule',[('weekly','Weekly IV'),('q21','Every 21 days IV')]+([('sc','Every 21 days SC')] if code=='00258' else []))
   for s,load,usual in [('weekly',4,2),('q21',8,6)]:
    for late in [False,True]:r(d,'H_LATE_'+s+str(late),allof(atom('trastuzumab_schedule','==',s),atom('days_overdue_trastuzumab','>',7) if late else allof(atom('days_overdue_trastuzumab','>',0),atom('days_overdue_trastuzumab','<=',7))),'consultant_review','trastuzumab',f'{"More than one week late: clinician-directed reload "+str(load) if late else "Up to one week late: usual maintenance "+str(usual)} mg/kg, then the source schedule. Confirm actual history and cardiac assessment; no automatic restart authorisation.',3)
   r(d,'H_LATE_SCHEDULE_MISSING',allof(atom('days_overdue_trastuzumab','>',0),atom('trastuzumab_schedule','missing')),'consultant_review','trastuzumab','Confirm weekly IV, q21 IV or permitted SC schedule before interpreting a late dose. Loading and intervals differ.',3)
  if c.get('sc') or code=='00258':
   num(d,'days_since_last_sc_trastuzumab','Days since last SC trastuzumab','days');scgate=atom('trastuzumab_schedule','==','sc') if code=='00258' else None
   r(d,'SC_MIN_INTERVAL',atom('days_since_last_sc_trastuzumab','<',21),'withhold','trastuzumab','SC trastuzumab requires at least 21 days between injections. Fixed 600 mg, no loading dose.',3,scgate)
   r(d,'SC_LATE',atom('days_overdue_trastuzumab','>',0),'consultant_review','trastuzumab','Give missed SC 600 mg as soon as clinically appropriate, then preserve a minimum 21-day interval. No IV reloading dose applies.',3,scgate)
 # Detailed platinum / docetaxel tables retain strategy and component boundaries.
 if code in ['00258','00731']:
  chemo=['docetaxel','carboplatin'];bp=5 if code=='00258' else 6;hp=6 if code=='00258' else 7
  for k,l,u in [('gfr_ml_min','Verified GFR for carboplatin (unindexed)','mL/min'),('fn_episode_count','FN episode number',''),('hepatic_delay_days','Duration of hepatic delay','days'),('creatinine_result_age_hours','Age of creatinine result','hours'),('creatinine_percent_reference','Creatinine as % of isotope-GFR reference','%')]:num(d,k,l,u)
  select(d,'count_strategy','Source count-management strategy',[('dose_reduction','Dose-reduction strategy'),('gcsf','G-CSF strategy')]);select(d,'gfr_method','Renal measurement used',[('estimated','Estimated GFR'),('isotope','Isotope measured GFR')]);boolean(d,'hepatic_not_recovered','Liver abnormality has not recovered')
  r(d,'TCH_COUNTS_LOW',anyof(atom('anc_x10e9_l','<',1),atom('platelets_x10e9_l','<',100)),'delay',chemo,'Delay chemotherapy until ANC ≥1.5 and platelets ≥100. Then source strategy determines 75% dosing versus 100% with G-CSF. This does not automatically reduce trastuzumab.',bp,gate)
  r(d,'TCH_INTERMEDIATE_CONTEXT',band('anc_x10e9_l',1,1.49),'consultant_review',chemo,'ANC 1–1.49 requires platelets ≥100 and an explicitly selected dose-reduction versus G-CSF strategy; do not assume the missing strategy.',bp,gate)
  r(d,'TCH_INTERMEDIATE_75',allof(band('anc_x10e9_l',1,1.49),atom('platelets_x10e9_l','>=',100),atom('count_strategy','==','dose_reduction')),'dose_reduce',chemo,'Source dose-reduction strategy: 75% chemotherapy; confirm recovery / prior events.',bp,gate,dose_percent=75)
  r(d,'TCH_INTERMEDIATE_GCSF',allof(band('anc_x10e9_l',1,1.49),atom('platelets_x10e9_l','>=',100),atom('count_strategy','==','gcsf')),'consultant_review',chemo,'Source G-CSF strategy permits 100% chemotherapy with confirmed growth-factor support; verify all other safety domains.',bp,gate)
  r(d,'TCH_ANC_GAP',allof(atom('anc_x10e9_l','>',1.49),atom('anc_x10e9_l','<',1.5)),'consultant_review',chemo,'ANC lies between the printed decimal bands; confirm interpretation.',bp,gate)
  r(d,'TCH_FN',atom('febrile_neutropenia','==',True),'withhold',chemo,'Treat FN urgently; recovery and episode / strategy determine the subsequent dose. First: 75% previous or full with G-CSF; second: 50% original or 75% with G-CSF; third: stop / switch strategy, or 50% within G-CSF strategy.',bp,gate)
  r(d,'TCH_FN_CONTEXT',atom('fn_episode_count','>=',1),'consultant_review',chemo,'Review source FN episode table, chosen strategy and recovery ANC ≥1.5 / platelets ≥100. A historic episode number alone never authorises restart.',bp,gate)
  r(d,'CARBO_GFR_STOP',atom('gfr_ml_min','<=',20),'contraindicated','carboplatin','Do not administer carboplatin at GFR ≤20 mL/min.',bp,gate)
  r(d,'CARBO_GFR_CAUTION',allof(atom('gfr_ml_min','>',20),atom('gfr_ml_min','<=',30)),'consultant_review','carboplatin','GFR >20–30: extreme caution and oncology / pharmacy review.',bp,gate)
  r(d,'CARBO_CRCL_RISK',atom('crcl_ml_min','<',60),'consultant_review','carboplatin','CrCl <60 increases myelosuppression risk; verify renal method, dose and monitoring.',bp,gate)
  r(d,'CARBO_OLD_CREATININE',allof(atom('gfr_method','==','estimated'),atom('creatinine_result_age_hours','>',48)),'consultant_review','carboplatin','Estimated-GFR dosing requires a creatinine result within 48 hours; obtain current renal assessment.',4 if code=='00258' else 5,gate)
  r(d,'CARBO_CREATININE_RISE',allof(atom('gfr_method','==','isotope'),atom('creatinine_percent_reference','>',110)),'consultant_review','carboplatin','Creatinine >110% of isotope-GFR reference: reassess renal dose calculation.',4 if code=='00258' else 5,gate)
  r(d,'TCH_BILIRUBIN',atom('bilirubin_uln_multiple','>',1),'delay',chemo,'Abnormal bilirubin: delay chemotherapy up to two weeks; if no recovery, stop chemotherapy. Trastuzumab continuation needs a separate clinical decision.',bp,gate)
  hi=anyof(atom('ast_uln_multiple','>',5),atom('alt_uln_multiple','>',5));r(d,'TCH_LIVER_DELAY',allof(hi,atom('alp_uln_multiple','>',5)),'delay',chemo,'Both transaminases and ALP above 5: delay up to two weeks, stop chemotherapy if not recovered. Coordinate accompanying drugs; do not automatically clear antibodies.',hp,gate)
  r(d,'TCH_LIVER_UNMAPPED',anyof(hi,atom('alp_uln_multiple','>',5)),'consultant_review',chemo,'High single liver axis may be unassigned by this matrix. Resolve with the full table; do not infer normal dosing.',hp,gate)
  moderate=anyof(allof(anyof(allof(atom('alt_uln_multiple','>',2.5),atom('alt_uln_multiple','<=',5)),allof(atom('ast_uln_multiple','>',2.5),atom('ast_uln_multiple','<=',5))),atom('alp_uln_multiple','<=',2.5)),allof(anyof(allof(atom('alt_uln_multiple','>',1.5),atom('alt_uln_multiple','<=',5)),allof(atom('ast_uln_multiple','>',1.5),atom('ast_uln_multiple','<=',5))),atom('alp_uln_multiple','>',2.5),atom('alp_uln_multiple','<=',5)))
  r(d,'TCH_DOC_LIVER_60',allof(moderate,atom('alt_uln_multiple','<=',5),atom('ast_uln_multiple','<=',5),atom('bilirubin_uln_multiple','<=',1)),'consultant_review','docetaxel','Source liver matrix: 75 →60 mg/m². Confirm current dose, both transaminases and accompanying-drug delay instructions. Stable abnormalities do not trigger repeated reductions; recovery may permit source-directed re-escalation.',hp,gate)
  r(d,'TCH_LIVER_PERSISTENT',allof(atom('hepatic_delay_days','>=',14),atom('hepatic_not_recovered','==',True)),'discontinue',chemo,'No recovery after the source maximum two-week hepatic delay: stop chemotherapy; reassess HER2 plan separately.',hp,gate)
  doctoxic(d,gate,code,hp)
  r(d,'BASELINE_NEUROPATHY',allof(atom('assessment_stage','==','baseline'),atom('neuropathy_grade','>=',2)),'contraindicated' if code=='00731' else 'consultant_review',c['agents'],'Baseline grade ≥2 neuropathy is an exclusion in 00731.' if code=='00731' else 'Grade ≥2 neuropathy is a caution in 00258, requiring clinical review.',4 if code=='00731' else 3)
  if code=='00731':
   boolean(d,'uncontrolled_hypertension','Uncontrolled hypertension');r(d,'HYPERTENSION',atom('uncontrolled_hypertension','==',True),'contraindicated',c['agents'],'Uncontrolled hypertension is a source exclusion; review before initiation.',4)
   d['indications']=json.loads(json.dumps(d['indications']).replace('00722a','00731a'));d['metadata']['regimen_reimbursement_code']='00731a'
  if code=='00258':d['metadata']['schedule_alternatives']=['Default: IV trastuzumab 8→6 mg/kg every 21 days.','Weekly IV alternative: 4→2 mg/kg weekly with q21 chemotherapy; switch to q21 after source-defined transition.','SC alternative: 600 mg every 21 days, no loading; six combination cycles then trastuzumab to one year total.']
 # Source-review corrections shared only where independently checked.
 rules=d['rule_engine']['rules']
 if code=='00250':rules[:]=[z for z in rules if z['rule_id']!='BASELINE_ANC']
 for z in rules:
  if z['rule_id']=='BASELINE_ANC':z['when']=allof(notmaintenance(),z['when'])
  if z['rule_id'] in ['PREGNANCY_REVIEW','LACTATION_REVIEW']:
   explicit=(code in H or code=='00250' or (z['rule_id']=='LACTATION_REVIEW' and code!='00252') or (code=='00745'))
   if explicit:z['action'].update(type='contraindicated',recommendation='This is an explicit NCCP exclusion. Do not administer before specialist review of an alternative treatment plan.');z['explanation']=z['action']['recommendation'];z['source'].update(document=f'NCCP {code} v{version}',page=4 if code=='00731' else 2)
  if z['rule_id'].startswith('PAC_HEP_') and z['action'].get('dose'):
   original=z['action']['dose']['value'];z['action'].pop('dose');z['action'].update(type='consultant_review',dose_calculation='specialist_review',show_in_dose_actions=True,block_numeric_dose=True)
   z['action']['recommendation']=('Source hepatic band is '+('75%' if original==60 else '50%')+' of the ORIGINAL prescribed dose; ' if code in ['00512','00621','00507'] else f'Source hepatic reference is {original} mg/m²; ')+f'{original} mg/m² applies to the standard starting schedule only. Reconcile the documented original and actual current dose; no automatic re-escalation after a prior reduction.';z['explanation']=z['action']['recommendation']
  if z['rule_id']=='PAC_NEURO_G2' and z['action']['type']=='dose_reduce':z['action'].pop('absolute_reduction',None);z['action'].update(type='consultant_review',dose_calculation='specialist_review',show_in_dose_actions=True,block_numeric_dose=True)
  if z['rule_id']=='DOC_NEURO_PERSISTENT' and code=='00202':z['action'].update(type='consultant_review',dose_calculation='specialist_review',show_in_dose_actions=True);z['action']['recommendation']='Persistent neuropathy at 60 mg/m²: source supplies no further numeric reduction / cessation row here. Obtain consultant review; do not borrow another regimen’s stop rule.';z['explanation']=z['action']['recommendation']
  if z['action']['type'] in ['withhold_then_reduce','delay_then_dose_reduce']:z['action']['dose_calculation']='specialist_review'
 if code in ['00252','00260']:rules[:]=[z for z in rules if z['rule_id'] not in ['AC_SECOND_PLT_DELAY','AC_RESTART_BOUNDARY']]
 if c['ac']:
  ag=active('ac') if c['tax'] else always()
  if code in ['00252','00260','00432']:
   r(d,'AC_ACUTE_FN',atom('febrile_neutropenia','==',True),'withhold',['doxorubicin','cyclophosphamide'],'Acute febrile neutropenia needs urgent assessment and treatment interruption. This safety action does not assign an unsourced percentage reduction; determine recovery and G-CSF with the treating team.',pageof(x,'haematology'),ag)
   d['rule_engine']['rules'][-1]['source']['document']='Clinical safety hold for acute FN; NCCP source provides chemotherapy / support context'
  if code in ['00278','00316','00745']:
   r(d,'TAX_SECOND_PLT_DELAY',atom('platelet_delay_count','>=',2),'consultant_review','paclitaxel','Second thrombocytopenia-related delay: source cytotoxic table describes 75% after recovery; verify the exact recovery boundaries.',pageof(x,'haematology'),active('paclitaxel'))
  if code in ['00278','00745']:r(d,'PAC_OTHER_G3_SOURCE',anyof(atom('other_nonhaem_toxicity_grade','>=',3),atom('stomatitis_grade','>=',3),atom('skin_grade','>=',3)),'discontinue','paclitaxel','Source ≥grade 3 non-haematological reaction row: discontinue paclitaxel and assess urgently.',pageof(x,'Paclitaxel adverse'),active('paclitaxel'))
  if code in ['00252','00278']:
   r(d,'DOXO_COMBINED_HEPATIC',allof(atom('bilirubin_umol_l','>=',20),atom('ast_uln_multiple','>=',2)),'consultant_review','doxorubicin','Both bilirubin and AST reductions apply, but the source does not define their combination. Consultant/pharmacy reconciliation is required; no numeric dose is selected.',pageof(x,'Renal/hepatic:doxorubicin'),ag,block_numeric_dose=True)
   # Retain continuous boundaries without epsilon approximations.
   next(z for z in rules if z['rule_id']=='DOXO_BILI_50')['when']=allof(ag,atom('bilirubin_umol_l','>=',20),atom('bilirubin_umol_l','<',51))
   next(z for z in rules if z['rule_id']=='DOXO_BILI_25')['when']=allof(ag,atom('bilirubin_umol_l','>',51),atom('bilirubin_umol_l','<=',85))
  if code=='00745':r(d,'CYCLO_HD',atom('haemodialysis','==',True),'omit','cyclophosphamide','Haemodialysis: cyclophosphamide not recommended. Any unavoidable 50% exception requires specialist review.',4,ag)
 if 'paclitaxel' in c['agents']:
  pg=active('paclitaxel') if c['ac'] else gate
  if code not in ['00278','00745']:
   r(d,'PAC_NAMED_G2',anyof(atom('stomatitis_grade','==',2),atom('skin_grade','==',2)),'withhold','paclitaxel','Other grade 2 non-haematological toxicity: hold until ≤grade 1, then source-specific dose review.',pageof(A.get(code,{}),'Paclitaxel adverse',5 if code=='00507' else 4),pg)
   r(d,'PAC_NAMED_G3',anyof(atom('stomatitis_grade','>=',3),atom('skin_grade','>=',3)),'withhold' if code=='00507' else 'discontinue','paclitaxel','Grade ≥3 non-haematological reaction needs urgent source-specific assessment; 00507 wording is ambiguous.' if code=='00507' else 'Grade ≥3 non-haematological reaction: discontinue paclitaxel per source table.',pageof(A.get(code,{}),'Paclitaxel adverse',5 if code=='00507' else 4),pg)
 if code in ['00202','00203','00260','00278','00433','00745','00512','00621','00507','00258','00731','00204']:
  r(d,'SEVERE_HEPATIC_EXCLUSION',atom('severe_hepatic_impairment','==',True),'contraindicated',[a for a in c['agents'] if a not in ['trastuzumab','pertuzumab']],'Severe hepatic impairment / significant hepatic dysfunction is a source chemotherapy exclusion. Do not administer affected chemotherapy; review the exact component and any HER2-only plan separately.',4 if code=='00731' else 2,gate)
 if code=='00204':r(d,'DOC_ACUTE_FN',atom('febrile_neutropenia','==',True),'withhold','docetaxel','Acute FN requires urgent assessment and withholding chemotherapy. This source has no ongoing FN dose table; do not import a numeric reduction from another regimen.',3,gate)
 if code=='00745':
  d['input_definitions']['trastuzumab_schedule']['options']=[{'value':'q21','label':'Every 21 days IV'}]
  rules[:]=[z for z in rules if not z['rule_id'].startswith('H_LATE_weekly')]
 if code in H:d['indications']=[{'code':H[code]['indication_code'],'description':H[code]['indication'],'tumour_groups':['Breast']}]
 if code in A:
  d['indications']=[{'code':ic,'description':('Neoadjuvant / adjuvant ' if len(A[code]['indications']['settings'])>1 else 'Adjuvant ')+A[code]['indications']['disease'],'tumour_groups':['Breast']} for ic in A[code]['indications']['codes']]
 if code=='00203':
  descriptions=[('a','Locally advanced or metastatic NSCLC after prior chemotherapy','Lung'),('b','First-line high-risk nonmetastatic castration-sensitive prostate cancer','Genitourinary'),('c','First-line metastatic castration-sensitive prostate cancer','Genitourinary'),('d','Advanced gastric / gastro-oesophageal junction adenocarcinoma progressing during or within 6 months of platinum / fluoropyrimidine','Gastrointestinal'),('e','Relapsed / progressing primary peritoneal carcinoma','Gynaecology'),('f','Relapsed / progressing ovarian carcinoma','Gynaecology'),('g','Relapsed / progressing fallopian tube carcinoma','Gynaecology'),('h','Advanced breast cancer','Breast')]
  d['indications']=[{'code':code+s,'description':desc,'tumour_groups':[t]} for s,desc,t in descriptions]
 if code=='00621':
  descriptions=[('a','Second-line advanced / recurrent gastric cancer','Gastrointestinal'),('b','Metastatic breast cancer after failure of or unsuitability for anthracycline-containing treatment','Breast'),('c','Second-line metastatic ovarian cancer after platinum treatment','Gynaecology'),('d','Relapsed / refractory small-cell lung cancer','Lung'),('e','Second-line metastatic bladder cancer','Genitourinary')]
  d['indications']=[{'code':code+s,'description':desc+'; off-label indication in Ireland, local consent / D&T process applies','tumour_groups':[t]} for s,desc,t in descriptions]
 d['output_templates']={'proceed':'No encoded action was triggered by the supplied values. Unassessed domains and the full prescribing review remain outstanding.','coverage_gap':'Only entered values were assessed. Missing phase, history or results are not assumed normal.','consultant_review':'Review the component-specific findings and source uncertainty before treatment.','contraindicated':'Do not administer the affected component(s); review the findings and exact regimen context.','discontinue':'Discontinue the affected component(s) identified below and obtain treating-clinician review.','withhold':'Withhold the affected component(s) and assess the reported problem.','delay':'Delay the affected component(s) pending source-defined recovery and review.','dose_reduce':'A component-specific dose modification applies; verify the original and current doses before prescribing.'}
 d['metadata']['indication']=c['setting'];d['metadata']['treatment_setting']=c['settings']
 if code in ['00203','00621']:d['metadata']['audited_eligibility'] += [i['code']+': '+i['description'] for i in d['indications']]
 if code in ['00203','00250']:
  r(d,'DOC_SKIN_AT60',allof(atom('skin_grade','==',3),atom('current_docetaxel_mg_m2','==',60),atom('toxicity_persists_at_reduced_dose','==',True)),'discontinue','docetaxel','Persistent grade 3 skin toxicity at 60 mg/m²: discontinue docetaxel.',3,gate)
 if code=='00432':r(d,'SEVERE_HEPATIC_CAUTION',atom('severe_hepatic_impairment','==',True),'consultant_review',['doxorubicin','cyclophosphamide','paclitaxel'],'Severe hepatic impairment is a source caution. Review the current phase and organ-specific dose tables before chemotherapy.',2,gate)
 if code in ['00278','00745']:
  for z in rules:
   if z['rule_id']=='PAC_INTOLERANCE':z['source']['document']='Clinical review prompt; this source does not specify a two-reduction rule';z['explanation']=z['action']['recommendation']='Persistent intolerance requires clinical review; no source-specific automatic two-reduction stopping instruction is assigned here.'
 if c['ac'] and c['her2']:
  hgate=anyof(active('paclitaxel'),active('continuation'),atom('treatment_phase','missing'))
  for z in rules:
   if z['rule_id'].startswith('HER2_') and z['rule_id'] not in ['HER2_STATUS','HER2_BASELINE_LOW','HER2_BASELINE_BORDERLINE']:z['when']=allof(hgate,z['when'])
   if z['rule_id'].startswith('H_LATE_q21') and code in ['00316','00432','00433']:
    z['when']=allof(active('continuation'),z['when']);hmd=read('00200')[1]['metadata'];z['source'].update(document='NCCP 00200 v'+str(hmd['nccp_version'])+' · q21-day trastuzumab continuation',url=hmd['source_url'],page=3)
   if z['rule_id'].startswith('H_LATE_weekly'):z['when']=allof(active('paclitaxel'),z['when'])
  r(d,'HER2_FUTURE_CARDIAC',allof(active('ac'),anyof(atom('lvef_percent','<',50),atom('lvef_drop_points','>=',10))),'consultant_review','doxorubicin','Cardiac concern during AC: reassess the anthracycline plan and future HER2 eligibility. Trastuzumab has not yet started in this phase.',2,block_numeric_dose=True)
  mismatch=anyof(allof(active('continuation'),atom('trastuzumab_schedule','==','weekly')),allof(active('paclitaxel'),atom('trastuzumab_schedule','==','q21'))) if c['her2']==7 else atom('trastuzumab_schedule','!=','q21')
  r(d,'HER2_SCHEDULE_MISMATCH',mismatch,'consultant_review','trastuzumab','The selected antibody schedule does not match this phase of the NCCP regimen. Confirm the actual phase / regimen before choosing a loading or maintenance dose.',3,block_numeric_dose=True)
 if code in ['00258','00731']:
  bp=5;recovered=allof(atom('anc_x10e9_l','>=',1.5),atom('platelets_x10e9_l','>=',100))
  for strategy,values in [('dose_reduction',['75% of the PREVIOUS chemotherapy dose','50% of the ORIGINAL chemotherapy dose','stop chemotherapy or switch to the confirmed G-CSF strategy']),('gcsf',['100% chemotherapy with G-CSF','75% chemotherapy with G-CSF','50% chemotherapy with G-CSF'])]:
   for n,txt in enumerate(values,1):r(d,f'TCH_FN_{strategy}_{n}',allof(recovered,atom('fn_episode_count','==',n),atom('count_strategy','==',strategy)),'consultant_review',['docetaxel','carboplatin'],f'After FN episode {n}, recovered counts and the selected {strategy.replace("_"," ")} pathway: {txt}. Verify acute illness has resolved and the actual previous/original doses; this is a conditional restart plan.',bp,gate,block_numeric_dose=True)
  for z in rules:
   rid=z['rule_id']
   if rid.startswith('TCH_') and ('COUNTS' in rid or 'INTERMEDIATE' in rid or 'ANC_GAP' in rid or 'FN' in rid):z['source']['page']=5
   if rid=='TCH_BILIRUBIN':z['source']['page']=6
   if rid.startswith('CARBO_OLD') or rid.startswith('CARBO_CREATININE'):z['source']['page']=6
   if rid in ['BASELINE_ANC','ALLERGY','PREGNANCY_REVIEW','LACTATION_REVIEW','BASELINE_NEUROPATHY','HER2_CARDIAC_DISEASE']:z['source']['page']=4
   if rid.startswith('HER2_BASELINE'):z['source']['page']=3 if code=='00731' else 4
   if rid in ['HER2_LVEF_HOLD','HER2_LVEF_REVIEW','HER2_HF','HER2_REACTION_G4','HER2_REACTION_G3']:z['source']['page']=7
   if code=='00258' and (rid.startswith('H_LATE') or rid.startswith('SC_')):z['source']['page']=6
   if code=='00731' and rid.startswith('ANTIBODY_'):z['source']['page']=5
  d['treatment_phases'][0]['cycles']=[1,2,3,4,5,6]
 if code=='00731':
  boolean(d,'severe_persistent_diarrhoea','Severe / prolonged diarrhoea not improving with treatment');boolean(d,'pertuzumab_anaphylaxis_bronchospasm_ards','Pertuzumab-associated anaphylaxis, bronchospasm or ARDS')
  r(d,'PERTUZUMAB_DIARRHOEA',atom('severe_persistent_diarrhoea','==',True),'withhold','pertuzumab','Severe / prolonged diarrhoea not improving: consider interruption until controlled, with urgent fluids / electrolyte / symptom assessment. Restart only after treating-team review.',9)
  r(d,'PERTUZUMAB_SEVERE_REACTION',atom('pertuzumab_anaphylaxis_bronchospasm_ards','==',True),'permanently_discontinue','pertuzumab','Permanently discontinue pertuzumab for anaphylaxis, bronchospasm or ARDS; manage urgently.',7)
 if code=='00507':
  d['treatment_phases'][0]['cycles']=list(range(1,9));d['treatment_phases'][0]['duration_text']='Up to eight 21-day cycles; earlier change for toxicity / progression.'
  for z in rules:
   if z['rule_id'].startswith(('PAC_ANC','PAC_PLT','PAC_SEVERE_COUNTS','PAC_FN')):z['source']['page']=4
 if code=='00204':
  d['treatment_phases'][0]['duration_text']='Source minimum six cycles if tolerated; review after six–eight cycles or earlier for toxicity. Antibodies can continue separately.'
  for z in rules:
   if z['rule_id'] in ['HER2_LVEF_HOLD','HER2_LVEF_REVIEW','HER2_HF','HER2_REACTION_G4','HER2_REACTION_G3']:z['source']['page']=4
 if code=='00258':
  # Explicitly represent all source-authorised formulations in the dose model.
  for kind in ['weekly','sc']:
   for original in list(d['treatment_phases'][:2]):
    ph=copy.deepcopy(original);ph['phase_id']=original['phase_id']+'_'+kind;ph['name']=ph['label']=original['label']+' · '+('weekly IV trastuzumab' if kind=='weekly' else 'SC trastuzumab')
    h=next(z for z in ph['administration'] if z['drug']=='trastuzumab');h.update(dose={'value':2 if kind=='weekly' else 600,'unit':'mg/kg' if kind=='weekly' else 'mg'},day=[1,8,15] if kind=='weekly' else 1,route='IV infusion' if kind=='weekly' else 'SC injection',notes='Weekly 4 mg/kg loading then 2 mg/kg; switch to q21 continuation three weeks after last chemotherapy, per source.' if kind=='weekly' else '600 mg fixed dose, no loading; minimum 21-day interval.')
    if original['phase_id']=='continuation' and kind=='weekly':continue
    d['treatment_phases'].append(ph)
  d['metadata']['dose_schedule_variants']={'combination':{'q21':'combination','weekly':'combination_weekly','sc':'combination_sc'},'continuation':{'q21':'continuation','sc':'continuation_sc'}}
  r(d,'TCH_CONTINUATION_WEEKLY',allof(active('continuation'),atom('trastuzumab_schedule','==','weekly')),'consultant_review','trastuzumab','The source weekly option transitions to q21 IV three weeks after the final chemotherapy. Confirm the transitional visit and ongoing schedule; do not assume indefinite weekly continuation.',2,block_numeric_dose=True)
 if code=='00512':
  ph=copy.deepcopy(d['treatment_phases'][1]);ph.update(phase_id='continuation_weekly',name='Weekly adjuvant trastuzumab continuation',label='Weekly adjuvant trastuzumab continuation',cycle_length_days=7);ph['administration'][0].update(dose={'value':2,'unit':'mg/kg'},notes='Weekly continuation to complete one total year of trastuzumab.');d['treatment_phases'].append(ph)
  d['metadata']['dose_schedule_variants']={'combination':{'weekly':'combination'},'continuation':{'weekly':'continuation_weekly','q21':'continuation'}}
 if code=='00252':
  for z in rules:
   if z['rule_id'] in ['ALLERGY','ECOG','AC_CARDIAC','AC_LVEF_50']:z['source']['page']=1
 # Correct semantic ordering for source follow-on reductions; retain the hold now.
 d['rule_engine']['actions_ranked_most_to_least_restrictive']=['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','delay_then_dose_reduce','withhold','delay','dose_reduce_two_levels','dose_reduce_one_level','dose_reduce','consultant_review','proceed_with_caution','proceed']
 ranked=d['rule_engine']['actions_ranked_most_to_least_restrictive']
 for action in ['delay_then_dose_reduce','withhold_then_reduce']:
  if action not in ranked:ranked.insert(ranked.index('withhold') if 'withhold' in ranked else 0,action)
 if c['ac']:
  boolean(d,'prior_febrile_neutropenia','Previous FN episode; acute illness resolved')
  r(d,'PREVIOUS_FN',atom('prior_febrile_neutropenia','==',True),'consultant_review',['doxorubicin','cyclophosphamide','paclitaxel'] if c['tax'] else ['doxorubicin','cyclophosphamide'],'Source cytotoxic table describes 75% dosing after FN once recovered. Verify current phase, original / current dose and recovery; antibody dosing is not automatically reduced.' if code in ['00278','00316','00433','00745'] else 'Review previous FN and recovery, G-CSF and the phase-specific source. No universal 75% rule is assigned by this source.',pageof(x,'haematology'),notmaintenance(),block_numeric_dose=True)
  if c['tax']:r(d,'FN_PHASE_UNKNOWN',allof(atom('treatment_phase','missing'),atom('febrile_neutropenia','==',True)),'withhold',['doxorubicin','cyclophosphamide','paclitaxel'],'Acute febrile neutropenia requires urgent assessment and holding chemotherapy even before the active phase is established. Confirm the phase to determine the subsequent source-specific plan.',pageof(x,'haematology'))
  if code in ['00278','00316','00745']:r(d,'TAX_RESTART_BOUNDARY',allof(active('paclitaxel'),atom('restarting_after_count_delay','==',True),anyof(atom('anc_x10e9_l','<=',1),atom('platelets_x10e9_l','<=',100))),'consultant_review','paclitaxel','After a count delay, recovery ANC must be >1; platelet recovery wording is source-specific. Routine-dose thresholds do not automatically authorise restart at the boundary.',pageof(x,'haematology'),block_numeric_dose=True)
 if code in ['00202','00203']:
  r(d,'DOC_PROLONGED_HISTORY',atom('anc_below_0_5_days','>',7),'consultant_review','docetaxel','A documented ANC <0.5 episode lasting more than one week affects the subsequent dose even after counts recover: source ladder '+('100 →75 →60 mg/m².' if code=='00202' else '75 →60 mg/m²; recurrence at the lower dose requires discontinuation.')+' Confirm recovery and actual dose before restarting.',2,gate,block_numeric_dose=True)
 if 'paclitaxel' in c['agents'] and code not in ['00278','00316','00745']:
  r(d,'PAC_PROLONGED_HISTORY',atom('anc_below_0_5_days','>=',7),'consultant_review','paclitaxel','A documented ANC <0.5 episode lasting at least seven days requires one dose-level reduction after recovery (80 →65 →50 mg/m²), even if current ANC has recovered. Verify actual dose and recovery before restarting.',4 if code=='00507' else 3,active('paclitaxel') if c['ac'] else gate,block_numeric_dose=True)
 if 'docetaxel' in c['agents']:
  r(d,'DOC_CURRENT_DOSE_RECONCILE',allof(atom('current_docetaxel_mg_m2','<',60),anyof(atom('stomatitis_grade','>=',3),atom('neuropathy_grade','>',2),atom('skin_grade','>=',3))),'consultant_review','docetaxel','The actual current docetaxel dose is already below the source reference dose. Do not re-escalate automatically; reconcile previous reductions and the next action with oncology / pharmacy.',3,gate,block_numeric_dose=True)
 if code=='00507':d['indications']=[{'code':'00507a','description':'First-line treatment of adults with HER2-positive metastatic or locally recurrent unresectable breast cancer who have not received previous anti-HER2 therapy or chemotherapy for metastatic disease, where docetaxel is unsuitable, not tolerated or has caused significant toxicity.','tumour_groups':['Breast']}]
 d['metadata']['schedule_summary']=c['schedule'];d['metadata']['audit_limitations'].append('Educational / software source reconciliation is not consultant, pharmacy or clinical-use authorisation.')
 # Ensure retained legacy narratives cannot contradict the rebuilt rules / phases.
 riskmap=json.loads((ROOT/'data/emetogenic-risk-map.json').read_text())
 primary='high' if c['ac'] or 'carboplatin' in c['agents'] else 'moderate' if code=='00250' else 'low'
 profiles={}
 if c['ac'] and c['tax']:profiles={'ac':'high','paclitaxel':'low'}
 elif c['her2'] and code!='00731':profiles={'combination':primary}
 if c['her2'] and code!='00731':profiles['continuation']='minimal'
 sc={'emetogenic_risk':'phase_dependent' if profiles else primary,'mapping_source':'NCCP regimen and antiemetic classification; phase-specific source review v0.84.0','mapping_source_url':riskmap['source']['url'],'mapping_basis':'AC: high; taxane: low; TC: moderate; carboplatin AUC 6 combination: high; HER2-only continuation: minimal. Use only the active phase.','mapping_confidence':'high','validation_status':'source_mapped_pending_local_oncology_pharmacy_validation','breakthrough_profile_id':'nccp-breakthrough-general','summary':'See the phase-specific drafts in patient/'+code+'/supportive-care.html','source_url':d['metadata']['source_url']}
 if profiles:
  sc['script_id']=None;sc['phase_profiles']={k:{'level':v,'script_id':'nccp-parenteral-'+v} for k,v in profiles.items()}
  if code=='00258':sc['phase_aliases']={'combination_weekly':'combination','combination_sc':'combination','continuation_sc':'continuation'}
 else:
  sc['script_id']='nccp-parenteral-'+primary;sc['supportive_medications_pdf_url']=riskmap['source']['medical_oncology_antiemetic_guidance_url'];sc['supportive_medications_label']=riskmap['scripts'][sc['script_id']]['label']
 d['supportive_care']=sc
 if code in ['00202','00250','00512']:d['indications']=[{'code':i['id'],'description':i['description'],'tumour_groups':['Breast']} for i in T[code]['indications']]
 for indication in d['indications']:
  indication['indication_id']=indication['code'];indication['reimbursement_codes']=[indication['code']]
  if code=='00203' and indication['code'] in ['00203b','00203c']:indication['icd10']=['C61']
 if code=='00202':d['input_definitions']['platelets_x10e9_l']['input_role']='monitoring'
 if code in ['00260','00432','00433','00512','00621','00507']:
  d['dose_levels']={'paclitaxel':{'0':80,'-1':65,'-2':50}}
  d['metadata']['dose_level_context']='Paclitaxel source reduction ladder 80 / 65 / 50 mg/m². The toxicity-specific action determines whether it applies; neuropathy and hepatic instructions differ.'
  for ph in d['treatment_phases']:
   for drug in ph['administration']:
    if drug['drug']=='paclitaxel':drug['note']=(drug.get('note','')+' '+d['metadata']['dose_level_context']).strip()
 save(p,d)
print('Reconciled all sixteen protocols; source ambiguities remain explicit review actions.')
