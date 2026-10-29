from pathlib import Path
import json,copy,hashlib,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2];DATE='2026-10-29';V='0.84.25'
paths={'00203':'protocols/breast/00203-docetaxel-75-21-day.json','00226':'protocols/shared/00226-paclitaxel-monotherapy-weekly.json'}
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def F(k,op,v=None):return dict(field=k,operator=op,**({} if v is None else {'value':v}))
def ALL(*x):return {'all':list(x)}
def ANY(*x):return {'any':list(x)}
def inp(label,typ='boolean',**k):return dict(dict(label=label,type=typ,required=False,demo_value='',input_role='decision'),**k)
for c,path in paths.items():
 p=json.loads(subprocess.check_output(['git','show','a3f8a2744c5753413f230004118056ce8b20baf9:'+path],cwd=R));m=p['metadata'];drug='docetaxel' if c=='00203' else 'paclitaxel';u=m['source_url'];rules=p['rule_engine']['rules'];by={q['rule_id']:q for q in rules}
 m.update(source_checked_date=DATE,sactcheck_encoding_version=V,source_pdf_sha256=hashlib.sha256((H/'research'/f'{c}.pdf').read_bytes()).hexdigest(),source_text_snapshot_sha256=hashlib.sha256((H/'research'/f'{c}.txt').read_bytes()).hexdigest(),source_retrieval_method='Fresh official PDF download; source dose tables visually inspected')
 m.setdefault('validation',{}).update(source_document_checked=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,rule_level_source_reconciliation_status='source_reconciled_v08425_independent_review_pending')
 m.setdefault('encoding_maturity',{}).update(source_reconciled=True,reconciled_release=V,reconciled_date=DATE,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 for key,d in p['input_definitions'].items():
  d['demo_value']='';d['required']=False;d.setdefault('input_role','decision')
  if 'grade' in key:
   d['grading_source_label']=f'NCCP {c} v{m["nccp_version"]}, toxicity grade table; edition unspecified'
   d['grading_source_url']=u;d['source_grading_note']='The NCCP table does not identify a grading edition. Confirm the named adverse event and the locally adopted grading criteria; do not infer a CTCAE edition from this software.'
   d['assessment_guidance']=d['source_grading_note']
   d['unit']='Source toxicity grade'
   for x in list(d):
    if x.startswith('ctcae_'):d.pop(x)
   for o in d.get('options',[]):
    o.pop('ctcae_grade',None)
    n=o['value'];o['description']=['No toxicity reported for the named event.','Mild event: confirm the exact symptom and local grading criteria.','Moderate event: assess interference with usual activities and the named event criteria.','Severe event: assess self-care limitation, need for admission and the named event criteria.','Potentially life-threatening event: urgent clinical assessment and named event criteria.'][n]
 for q in rules:
  q['source'].update(url=u,document=f'NCCP {c} v{m["nccp_version"]}')
  if c=='00226' and q['rule_id'] in ['ANC_LT_0_5_IMMEDIATE_HOLD','PLATELETS_LT_70_IMMEDIATE_HOLD']:q['source'].update(page=2,table=2);q['source'].pop('pages',None)
 def add(id,when,typ,msg,page=3,**action):
  rules.append(dict(rule_id=id,when=when,action=dict(type=typ,components=[drug],recommendation=msg,**action),explanation=msg,source=dict(document=f'NCCP {c} v{m["nccp_version"]}',url=u,page=page)))
 if c=='00203':
  # Pregnancy/lactation are product-information supplements, not listed NCCP dose-table rows.
  for rid in ['PREGNANCY_REVIEW','LACTATION_REVIEW']:
   by[rid]['source']={'document':'EMA Taxotere SmPC section 4.6; current product-information supplement','url':'https://www.ema.europa.eu/en/documents/product-information/taxotere-epar-product-information_en.pdf','page':12}
  by['LACTATION_REVIEW']['action']['recommendation']='Do not administer while breast-feeding. The Taxotere SmPC requires breast-feeding to stop during treatment; confirm a specialist feeding and treatment plan.'
  by['LACTATION_REVIEW']['explanation']=by['LACTATION_REVIEW']['action']['recommendation']
  # Current source is monotherapy; retain legacy field but remove unrelated continuation suppressors.
  for q in rules:
   w=q.get('when',{});a=w.get('all',[])
   if len(a)==2 and 'any' in a[0] and any(t.get('field')=='treatment_phase' for t in a[0]['any']):q['when']=a[1]
  p['input_definitions']['treatment_phase']['options']=[{'value':'combination','label':'Docetaxel monotherapy (legacy phase identifier)'}]
  p['input_definitions']['crcl_ml_min']['input_role']='monitoring';p['input_definitions']['crcl_ml_min']['renal_input']={'mode':'source_threshold_numeric','exact_value_required':False,'source_url':u,'reason':'The NCCP source expects no renal dose adjustment, including haemodialysis. This optional value records renal monitoring and is not a Calvert calculation.'}
  p['input_definitions']['platelets_x10e9_l']['input_role']='monitoring';p['input_definitions']['platelets_x10e9_l']['assessment_guidance']='NCCP 00203 does not specify a platelet dose threshold. Review the full blood count clinically; no platelet-based dose is calculated here.'
  p['input_definitions']['indication_id']=inp('NCCP indication','select',input_role='context',options=[{'value':f'00203{x}','label':f'00203{x} · '+n} for x,n in zip('abcdefgh',['Previously treated NSCLC','High-risk nonmetastatic castration-sensitive prostate cancer','Metastatic castration-sensitive prostate cancer','Previously treated advanced gastric / gastro-oesophageal cancer','Relapsed primary peritoneal cancer','Relapsed ovarian cancer','Relapsed fallopian-tube cancer','Advanced breast cancer'])])
  p['input_definitions']['planned_cycle_number']=inp('Planned cycle number','number',min=1,step=1)
  add('DOC_NSCLC_COURSE_REVIEW',ALL(F('indication_id','==','00203a'),F('planned_cycle_number','>',6)),'consultant_review','NCCP 00203a limits NSCLC treatment to a maximum of six 21-day cycles, or earlier progression/unacceptable toxicity. Review any proposed seventh or later cycle; this cap does not apply to 00203h breast treatment.',page=1,dose_calculation='specialist_review',show_in_dose_actions=True)
  add('DOC_SKIN_75',ALL(F('skin_grade','==',3),F('current_docetaxel_mg_m2','==',75)),'dose_reduce','Grade 3 skin toxicity at 75 mg/m²: after clinical assessment, reduce docetaxel to 60 mg/m².',dose={'value':60,'unit':'mg/m2'})
  # Source row says G3 skin only, while serious G4 needs review without fabricated reduction.
  p['input_definitions']['premedication_completed']=inp('Prescribed dexamethasone premedication completed / approved alternative confirmed')
  add('DOC_PREMED_REVIEW',F('premedication_completed','==',False),'withhold','Do not begin infusion until the team has reconciled missed/contraindicated dexamethasone premedication. The 20 mg IV alternative is a consultant choice, not an automatic substitute.')
  p['input_definitions']['acute_severe_hypersensitivity']=inp('Severe acute infusion hypersensitivity')
  add('DOC_ACUTE_HSR',F('acute_severe_hypersensitivity','==',True),'permanently_discontinue','Stop docetaxel immediately and treat the severe reaction. The NCCP source advises no rechallenge after a severe hypersensitivity reaction.',page=4)
  m['source_conflicts']=['NCCP v7 hepatic table (Giraud-based) differs from Taxotere SmPC hepatic advice. Existing NCCP overlap/gap review remains; no automatic dose is inferred from a mixed pattern.','Taxotere SmPC advises no use unless strictly indicated with bilirubin above ULN, or marked combined transaminase/ALP elevation. Discuss the exact product and NCCP table with pharmacy.']
  m['contextual_service_suites']={'breast':{'indication_ids':['00203h'],'path':'patient/00203/'},'lung':{'indication_ids':['00203a'],'path':'patient/00203/lung/','release':V}}
 else:
  by['HEPATIC_75_PERCENT']['all'][1]=F('bilirubin_ratio_uln','>=',1.26)
  by['HEPATIC_50_PERCENT']['all'][1]=F('bilirubin_ratio_uln','>=',2.01)
  by['COUNTS_PROCEED']['all'][1]=F('platelets_x10e9_l','>',90)
  # The printed intermediate ANC upper bound is .99, not every decimal below 1.
  by['COUNTS_INTERMEDIATE_DELAY']['any'][0]['all'][1]=F('anc_x10e9_l','<=',.99)
  add('PLATELET_90_OVERLAP',F('platelets_x10e9_l','==',90),'consultant_review','Platelets exactly 90 ×10⁹/L appear in both the printed 100% and delay rows. Resolve this overlap with the treating consultant/pharmacist before dosing; no automatic full dose is supplied.',page=2,dose_calculation='specialist_review',show_in_dose_actions=True)
  add('ANC_DECIMAL_GAP',ALL(F('anc_x10e9_l','>',.99),F('anc_x10e9_l','<',1)),'consultant_review','ANC lies between the printed 0.99 and 1.0 boundaries. Do not round into a dose row; confirm the source interpretation.',page=2,dose_calculation='specialist_review',show_in_dose_actions=True)
  add('HEPATIC_DECIMAL_GAP',ANY(ALL(F('bilirubin_ratio_uln','>',1.25),F('bilirubin_ratio_uln','<',1.26)),ALL(F('bilirubin_ratio_uln','>',2),F('bilirubin_ratio_uln','<',2.01))),'consultant_review','Bilirubin lies in a decimal gap between the printed hepatic dose bands. No rounded 75% or 50% dose is calculated; obtain consultant/pharmacy interpretation.',dose_calculation='specialist_review',show_in_dose_actions=True)
  add('FN_MISSING_DOSE_HOLD',ALL(F('febrile_neutropenia','==',True),F('current_dose_mg_m2','missing')),'withhold','Febrile neutropenia independently requires delay and a one-level reduction after recovery. Confirm the actual current dose before selecting 65 or 50 mg/m²; consider G-CSF.',page=2)
  add('NEUROPATHY_G2_MISSING_HISTORY',ALL(F('neuropathy_grade','==',2),F('previous_dose_reductions','missing')),'consultant_review','Grade 2 neuropathy requires a 10 mg/m² reduction, but prior reductions must be checked before selecting the next dose. After two reductions, continuation needs consultant discussion.',dose_calculation='specialist_review',show_in_dose_actions=True)
  add('OTHER_G2_MISSING_CONTEXT',ALL(F('other_nonhaematological_highest_grade','==',2),ANY(F('other_nonhaematological_current_grade','missing'),F('previous_dose_reductions','missing'))),'withhold','Hold after grade 2 non-haematological toxicity until recovery to grade 1 or lower is confirmed. Establish current grade and previous reductions before selecting the subsequent 10 mg/m² reduction or consultant pathway.')
  # Independent current-grade rules must have a visible input even when the historical peak is 0, 1, 3 or 4.
  current=p['input_definitions']['other_nonhaematological_current_grade']
  current.pop('visible_when',None);current.pop('required_when',None)
  current.update(label='Current other non-haematological toxicity grade',always_show=True,help='Record the current grade as well as the highest grade since the previous dose. Select grade 0 only when no current other toxicity is present. If the current grade exceeds the recorded highest grade, reconcile the entries; the current adverse finding still determines the hold or stop review.')
  add('OTHER_CURRENT_G2_HOLD',F('other_nonhaematological_current_grade','==',2),'withhold','Current grade 2 non-haematological toxicity independently requires withholding until grade 1 or lower, including after two previous reductions. A lower historical-grade entry does not override the current finding.')
  add('OTHER_CURRENT_G3_STOP',F('other_nonhaematological_current_grade','>=',3),'discontinue','Current grade 3 or higher non-haematological toxicity meets the source discontinuation rule even if a discordant lower previous maximum was entered.')
  p['input_definitions']['off_label_consent_confirmed']=inp('Weekly off-label use discussed and hospital approval/consent confirmed',always_show=True,help='NCCP 00226 v9 flags all four listed weekly indications, including metastatic breast cancer, as outside the Irish licence. Confirm informed consent and hospital acknowledgement under local policy; this is not limited to the SCLC context. A blank answer is not confirmation.')
  add('OFF_LABEL_REVIEW',F('off_label_consent_confirmed','==',False),'consultant_review','NCCP flags the listed weekly indications, including 00226d SCLC, as outside the Irish licence. Complete the hospital off-label approval and consent process before treatment.',page=5,dose_calculation='specialist_review',show_in_dose_actions=True)
  p['input_definitions']['ecog']=inp('ECOG performance status','number',min=0,max=4,step=1,always_show=True,help='NCCP 00226 eligibility specifies ECOG 0–2 for every listed indication. Record the assessed value; a blank answer does not establish eligibility.')
  add('ECOG_SOURCE_REVIEW',F('ecog','>',2),'consultant_review','ECOG is outside the source 0–2 eligibility population. Reassess the benefit, toxicity and treatment choice.',page=1,dose_calculation='specialist_review',show_in_dose_actions=True)
  m['source_conflicts']=['Printed platelets 90 belongs to both the 100% and intermediate rows; explicit review replaces automatic clearance.','Printed ANC .99–1 and bilirubin 1.25–1.26 / 2–2.01 gaps are surfaced without rounding.','Conventional paclitaxel SmPC generic retreatment, toxicity and premedication differs from NCCP weekly regimen. Retain source-specific pathways and reconcile the actual product/local policy; no automatic generic substitution.']
  m['contextual_service_suites']={'breast':{'indication_ids':['00226a_metastatic_breast'],'path':'patient/00226/'},'lung':{'indication_ids':['00226d_small_cell_lung'],'path':'patient/00226/lung/','release':V}}
 if c=='00203':
  ambiguous=ANY(F('bilirubin_uln_multiple','>',1),F('alt_uln_multiple','>',1.5),F('ast_uln_multiple','>',1.5),F('alp_uln_multiple','>',2.5))
  reduction=ANY(F('neuropathy_grade','>',2),F('stomatitis_grade','>=',3),F('skin_grade','==',3))
 else:
  ambiguous=ANY(F('platelets_x10e9_l','==',90),ALL(F('anc_x10e9_l','>',.99),F('anc_x10e9_l','<',1)),ALL(F('bilirubin_ratio_uln','>',1.25),F('bilirubin_ratio_uln','<',1.26)),ALL(F('bilirubin_ratio_uln','>',2),F('bilirubin_ratio_uln','<',2.01)))
  reduction=ANY(F('neuropathy_grade','==',2),F('other_nonhaematological_highest_grade','==',2),ALL(F('alt_ratio_uln','<',10),F('bilirubin_ratio_uln','>=',1.26),F('bilirubin_ratio_uln','<=',5)))
 add('CONCURRENT_SOURCE_AMBIGUITY_HOLD',ALL(ambiguous,reduction),'withhold','A source-table ambiguity coexists with a separate dose-reduction trigger. Withhold dose selection until consultant/pharmacy reconciliation; do not present a definitive combined or multiplied dose. This is a conservative software safety guard, not an additional NCCP numeric dose row.')
 rules[-1]['source']['document']='Conservative source-reconciliation guard using NCCP '+c+' dose tables; independent review pending'
 save(H/'proposed'/Path(path).name,p)
print('Two proposed protocols written')
