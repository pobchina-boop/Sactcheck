from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[3];B=Path(__file__).parent;V='0.84.29';DATE='2026-11-02'
def c(f,op,v=None):return dict(field=f,operator=op,**({} if op in ['missing','exists'] else {'value':v}))
def ac(*x):return {'all':list(x)}
def oc(*x):return {'any':list(x)}
def load(code):
 snap=json.loads((B/'baseline-protocols.json').read_text())[code];return Path(snap['filename']),copy.deepcopy(snap['protocol'])
def write(code,p):
 f,_=load(code);m=p['metadata'];m.update(source_checked_date=DATE,full_suite_release=V,sactcheck_encoding_version=V,source_retrieval_method='Current official PDF text retrieved through web; direct byte fetch HTTP403. No fresh PDF byte hash claimed.')
 m['source_pdf_sha256']=hashlib.sha256((B/'sources'/f'{code}.pdf').read_bytes()).hexdigest();m['source_text_snapshot_sha256']=hashlib.sha256((B/'sources'/f'{code}.txt').read_bytes()).hexdigest();m['source_retrieval_method']='Fresh official NCCP PDF downloaded with download=1; text extracted; key dose tables visually inspected.'
 m.setdefault('validation',{}).update(clinical_use_authorised=False,source_document_checked=True,rule_level_source_reconciliation_status='source_reconciled_v08429_independent_review_pending')
 m.setdefault('encoding_maturity',{}).update(level='source_reconciled_pending_independent_review',source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 p.setdefault('clinical_governance',{})['clinical_use_authorised']=False
 p['required_inputs']=[]
 for x in p['input_definitions'].values():x.update(required=False,demo_value='');x.setdefault('input_role','decision')
 m['source_document_pages']={'00284':5,'00614':8,'00232':4,'00259':7}[code]
 if code=='00284':
  m['indication']='Adjuvant pancreatic adenocarcinoma OR elderly/ECOG2 locally advanced/metastatic NSCLC; choose the exact setting.'
  m['treatment_context']=['gastrointestinal','pancreatic','lung','nsclc']
  m['dose_schedule_context_input']='indication_id'
  p['indications']=[dict(indication_id='00284a',code='00284a',description='Adjuvant pancreatic adenocarcinoma after complete macroscopic resection.',tumour_groups=['Gastrointestinal']),dict(indication_id='00284b',code='00284b',description='Locally advanced or metastatic NSCLC in elderly patients or patients with ECOG 2.',tumour_groups=['Lung'])]
  administration=[dict(drug='gemcitabine',dose=dict(value=1000,unit='mg/m2'),days=[1,8,15],route='IV',order=1,notes='Infuse in 250 mL sodium chloride 0.9% over 30 minutes on each treatment day. No dose on the other days. Starting dose may be reduced by the prescriber.')]
  p['treatment_phases']=[
   dict(phase_id='00284a',label='00284a: adjuvant pancreas — six-cycle plan',indication_ids=['00284a'],alternative_group='indication',cycle_length_days=28,cycles=6,active_drugs=['gemcitabine'],duration_text='Six 28-day cycles, or earlier disease progression or unacceptable toxicity.',schedule_summary='Gemcitabine 1000 mg/m² IV on Days 1, 8 and 15. This finite plan applies to the pancreatic adjuvant indication only.',administration=copy.deepcopy(administration)),
   dict(phase_id='00284b',label='00284b: advanced NSCLC — no fixed cycle total',indication_ids=['00284b'],alternative_group='indication',cycle_length_days=28,cycles=None,active_drugs=['gemcitabine'],duration_text='Repeat every 28 days until disease progression or unacceptable toxicity; no source-fixed total number of cycles.',schedule_summary='Gemcitabine 1000 mg/m² IV on Days 1, 8 and 15. Do not apply the pancreatic six-cycle limit to this lung indication.',administration=copy.deepcopy(administration))]

  p['treatment']['schedule_summary']='Gemcitabine1000mg/m² IV Days1,8,15 every28days; pancreatic adjuvant6cycles, lung until progression/unacceptable toxicity.'
  p['eligibility']=['Exact indication; ECOG0-2. Baseline ANC>1.5 and platelets>100; creatinine≤1.5ULN, transaminases≤3ULN.','Macroscopic complete resection belongs to the adjuvant pancreatic pathway; do not impose it on advanced NSCLC.']
  p['exclusions']=['Gemcitabine hypersensitivity','Breastfeeding; pregnancy requires specialist risk assessment']
  p['monitoring']=['Baseline FBC, renal and liver profile; audiometry and creatinine clearance if clinically indicated.','FBC before every dose; renal/liver profile before each cycle.','Response imaging, tumour markers where useful and post-treatment follow-up follow the consultant plan; no universal interval specified.']
  p['dose_modifications']=['Day1, within-cycle and baseline count thresholds differ. Prior severe marrow events use75% original cycle-initiation dose after review.','CrCl exactly30 is an unassigned source boundary. Bilirubin≥27:800mg/m², increase if tolerated.','Printed >3/>4 nonhaem rows conflict with usual Grade3/4 product guidance: hold severe toxicity and resolve with consultant; no inferred numeric reduction or permanent stop.']
 if code=='00614':
  m['dose_schedule_context_input']='vinorelbine_route'
  carboplatin=dict(drug='carboplatin',dose=dict(dose_auc=5),days=[1],route='IV',order=2,notes='Infuse in 500 mL glucose 5% over 30 minutes on Day 1 only. Verify the prescribed AUC and renal function separately; this view does not calculate a patient-specific dose.')
  p['treatment_phases']=[
   dict(phase_id='iv',label='Prescribed IV vinorelbine alternative',alternative_group='vinorelbine_route',indication_ids=['00614a'],cycle_length_days=21,cycles=4,active_drugs=['vinorelbine','carboplatin'],duration_text='Four 21-day cycles, or earlier disease progression or unacceptable toxicity. Select one vinorelbine route only.',schedule_summary='IV vinorelbine on Days 1 and 8 plus carboplatin on Day 1. Do not add oral vinorelbine to this alternative.',administration=[dict(drug='vinorelbine',dose=dict(value=25,unit='mg/m2'),days=[1,8],route='IV',order=1,notes='NCCP starting dose 25 mg/m²; the treating physician may initiate or increase to 35 mg/m². Neither escalation nor reduction is automatic: verify the currently prescribed dose. Infuse in 50 mL sodium chloride 0.9% over 15 minutes, then flush with 250 mL sodium chloride 0.9%; pharmacy must reconcile the actual product administration policy.'),copy.deepcopy(carboplatin)]),
   dict(phase_id='oral',label='Prescribed oral vinorelbine alternative — starting dose shown',alternative_group='vinorelbine_route',indication_ids=['00614a'],cycle_length_days=21,cycles=4,active_drugs=['vinorelbine','carboplatin'],duration_text='Four 21-day cycles, or earlier disease progression or unacceptable toxicity. Select one vinorelbine route only.',schedule_summary='Oral vinorelbine on Days 1 and 8 plus IV carboplatin on Day 1. Oral 60 mg/m² is the source starting dose, not a presumed current prescription.',administration=[dict(drug='vinorelbine',dose=dict(value=60,unit='mg/m2'),days=[1,8],route='oral',order=1,max_dose_mg=120,notes='Starting dose 60 mg/m² (maximum 120 mg per administration). Only if well tolerated and prescribed, consider 80 mg/m² from cycle 2 or 3 (source capsule table maximum 160 mg). Confirm the currently prescribed dose before any dose-reduction calculation; do not automatically escalate or convert from IV. Swallow whole with water and some food; do not repeat a dose after vomiting.'),copy.deepcopy(carboplatin)])]
  p['treatment']['schedule_summary']='CarboplatinAUC5 Day1 plus IVvinorelbine25mg/m² Days1,8 every21days for4cycles; explicit oral alternative60mg/m², consider80mg/m² from cycle2or3 if tolerated.'
  p['eligibility']=['NSCLC locally advanced, recurrent or metastatic; cisplatin unsuitable. ECOG0-2 and adequate haematologic, renal and hepatic function.']
  p['exclusions']=['Hypersensitivity, pregnancy, breastfeeding, long-term oxygen therapy.','Significant absorption disease or gastric/small-bowel surgery requires caution for oral dosing.']
  p['monitoring']=['Baseline FBC, renal/liver profile, peripheral neuropathy assessment and measured GFR(preferred) or verified estimate.','FBC, renal/liver and neuropathy before each cycle; product information adds FBC before each vinorelbine administration.','Calculated carboplatin GFR uses creatinine within48hours; isotope-GFR re-evaluation if creatinine>110% baseline.','Response imaging and follow-up are individually planned; no mandatory universal tumour-marker interval.']
 (B/'proposed'/f.name).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
def setup(code):
 f,p=load(code);p['rule_engine']['rules']=[];D=p['input_definitions'];D.clear();m=p['metadata'];url=m['source_url'];ver=m['nccp_version'];com=['gemcitabine'] if code=='00284' else ['carboplatin','vinorelbine']
 def inp(k,label,t='boolean',options=None,section='clinical'):
  D[k]=dict(label=label,type=t,required=False,demo_value='',input_role='decision',ui_section=section)
  if t=='number':D[k].update(min=0,max=10000,step=.01)
  if options:D[k]['options']=[dict(value=a,label=b) for a,b in options]
 def add(id,cond,kind,msg,components=None,page=1,source_url=None):
  p['rule_engine']['rules'].append(dict(rule_id=id,when=cond,priority=10 if kind in ['withhold','omit','contraindicated','permanently_discontinue','discontinue'] else 8,action=dict(type=kind,components=components or com,recommendation=msg,message=msg,show_in_dose_actions=True),explanation=msg,source=dict(document=f'NCCP {code} v{ver}' if not source_url else 'Manufacturer product information; explicit source reconciliation',url=source_url or url,page=page,checked_date=DATE)))
 inp('ecog','ECOG performance status','select',[(i,str(i)) for i in range(5)])
 inp('hypersensitivity','Known hypersensitivity to treatment component');inp('pregnancy','Pregnant or pregnancy suspected');inp('breastfeeding','Breastfeeding');inp('febrile_or_active_infection','Fever or current infection')
 inp('anc_x10e9_l','Absolute neutrophil count','number',section='labs');D['anc_x10e9_l']['unit']='x10^9/L';inp('platelets_x10e9_l','Platelet count','number',section='labs');D['platelets_x10e9_l']['unit']='x10^9/L'
 inp('cycle_number','Current treatment cycle','number',section='treatment_context');D['cycle_number']['step']=1
 add('ECOG_OUTSIDE_SOURCE_RANGE',c('ecog','>',2),'consultant_review','Review clinical fitness: the source eligibility range is ECOG 0-2.')
 add('HYPERSENSITIVITY',c('hypersensitivity','==',True),'contraindicated','Do not administer routinely after hypersensitivity. Any carboplatin rechallenge requires a separate specialist desensitisation decision and facilities.' if code=='00614' else 'Do not administer gemcitabine with known hypersensitivity.')
 add('BREASTFEEDING',c('breastfeeding','==',True),'contraindicated','Breastfeeding is an NCCP exclusion; urgent specialist review is required.')
 add('PREGNANCY',c('pregnancy','==',True),'contraindicated' if code=='00614' else 'consultant_review','Do not administer pending specialist pregnancy assessment; discuss maternal and fetal risks.')
 add('FEVER_OR_INFECTION',c('febrile_or_active_infection','==',True),'withhold','Urgent clinical assessment of fever/infection is required before treatment.')
 return p,D,inp,add
# Gemcitabine monotherapy: day and indication are essential, because GI duration differs.
p,D,inp,add=setup('00284');gem='https://www.medicines.org.uk/emc/product/3119/smpc'
inp('indication_id','NCCP treatment setting','select',[('00284b','00284b: elderly or ECOG 2 locally advanced/metastatic NSCLC'),('00284a','00284a: adjuvant pancreatic adenocarcinoma'),('other','Other / unresolved')],section='treatment_context')
inp('assessment_stage','Assessment stage','select',[('baseline','Before first treatment'),('on_treatment','On treatment')],section='treatment_context')
inp('treatment_day','Treatment day','select',[('day1','Day 1'),('day8','Day 8'),('day15','Day 15')],section='treatment_context')
for k in ['indication_id','assessment_stage','treatment_day']:D[k].update(always_show=True,input_role='context')
inp('creatinine_uln_multiple','Creatinine / local ULN','number',section='labs');inp('alt_ast_uln_multiple','Highest AST or ALT / corresponding ULN','number',section='labs');inp('crcl_ml_min','Verified creatinine clearance (mL/min)','number',section='labs');D['crcl_ml_min']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,reason='Preserve source gap at exactly30',source_url=p['metadata']['source_url'])
inp('bilirubin_micromol_l','Bilirubin (micromol/L)','number',section='labs');inp('other_nonhaem_toxicity_grade','Other non-haematological toxicity (excluding nausea/vomiting)','select',[(i,str(i)) for i in range(5)])
inp('prior_haematologic_event','Previous cycle event','select',[(x,y) for x,y in [('none','None'),('anc_lt05_gt5d','ANC <0.5 for >5 days'),('anc_lt01_gt3d','ANC <0.1 for >3 days'),('febrile_neutropenia','Febrile neutropenia'),('platelets_lt25','Platelets <25'),('delay_gt1week','Toxicity delay >1 week')]])
inp('restart_after_omission','Restart of an omitted within-cycle dose being considered');inp('drug_pneumonitis_suspected','Gemcitabine pneumonitis suspected');inp('scar_suspected','Suspected severe cutaneous adverse reaction');inp('scar_confirmed','Confirmed severe cutaneous adverse reaction');inp('hus_suspected','Suspected haemolytic uraemic syndrome');inp('pres_suspected','Suspected posterior reversible encephalopathy syndrome');inp('concurrent_radiotherapy','Radiotherapy planned concurrently or within7days');inp('resection_status_confirmed','For adjuvant pancreas: complete macroscopic resection confirmed')
add('INDICATION_UNRESOLVED',c('indication_id','==','other'),'consultant_review','Confirm one of the source indications. The patient guide in this release covers lung cancer only.')
add('PANCREAS_SEPARATE_CONTEXT',c('indication_id','==','00284a'),'consultant_review','Pancreatic adjuvant treatment has a six-cycle plan after macroscopic complete resection. Do not use the lung patient guide or indefinite lung stopping rule.')
add('PANCREAS_RESECTION_UNRESOLVED',ac(c('indication_id','==','00284a'),c('resection_status_confirmed','==',False)),'withhold','Confirm the macroscopic complete resection requirement before adjuvant pancreatic treatment.')
add('PANCREAS_CYCLE_LIMIT',ac(c('indication_id','==','00284a'),c('cycle_number','>',6)),'consultant_review','The adjuvant pancreatic source specifies six cycles. Reassess any plan beyond six.')
add('BASELINE_COUNTS',ac(c('assessment_stage','==','baseline'),oc(c('anc_x10e9_l','<=',1.5),c('platelets_x10e9_l','<=',100))),'withhold','Initiation requires ANC>1.5 and platelets>100; these are not the within-cycle thresholds.')
add('BASELINE_ORGAN_FUNCTION',ac(c('assessment_stage','==','baseline'),oc(c('creatinine_uln_multiple','>',1.5),c('alt_ast_uln_multiple','>',3))),'withhold','Baseline eligibility requires creatinine≤1.5xULN and transaminases≤3xULN; reconcile eligibility with any dose-modification proposal.')
add('DAY_REQUIRED',ac(c('treatment_day','missing'),oc(c('anc_x10e9_l','exists'),c('platelets_x10e9_l','exists'))),'consultant_review','Select Day1,8 or15 before applying count thresholds.',page=2)
add('DAY1_COUNTS',ac(c('treatment_day','==','day1'),oc(c('anc_x10e9_l','<=',1),c('platelets_x10e9_l','<=',100))),'withhold','New-cycle NCCP threshold is ANC>1 and platelets>100.',page=2)
add('DAY1_SMPC_CONFLICT',ac(c('treatment_day','==','day1'),c('anc_x10e9_l','>',1),c('anc_x10e9_l','<',1.5)),'withhold','NCCP subsequent-cycle table allows ANC>1, while product information requires at least1.5 at cycle initiation. Do not automatically clear this conflict; consultant/pharmacy reconciliation required.',page='4.2',source_url=gem)
within=c('treatment_day','in',['day8','day15'])
add('WITHIN_CYCLE_OMIT',ac(within,oc(c('anc_x10e9_l','<',.5),c('platelets_x10e9_l','<',50))),'omit','Omit the within-cycle dose; source restart requires ANC>0.5 AND platelets>50.',page=2)
add('WITHIN_CYCLE_75',ac(within,oc(ac(c('anc_x10e9_l','>=',.5),c('anc_x10e9_l','<=',1)),ac(c('platelets_x10e9_l','>=',50),c('platelets_x10e9_l','<=',100)))),'dose_reduce','Source within-cycle row recommends75%; any simultaneous omission criterion takes precedence. Confirm both counts and prior dose.',page=2)
add('RESTART_COUNTS',ac(c('restart_after_omission','==',True),oc(c('anc_x10e9_l','<=',.5),c('platelets_x10e9_l','<=',50))),'omit','Do not restart an omitted dose until ANC>0.5 and platelets>50; equality does not meet restart wording.',page=2)
add('PRIOR_EVENT_75',c('prior_haematologic_event','in',['anc_lt05_gt5d','anc_lt01_gt3d','febrile_neutropenia','platelets_lt25','delay_gt1week']),'consultant_review','For later cycles use75% of the ORIGINAL cycle-initiation dose after the selected severe event, after recovery and consultant confirmation.',page=2)
add('RENAL_LT30',c('crcl_ml_min','<',30),'consultant_review','Consider a gemcitabine reduction below30mL/min; the source supplies no fixed reduced dose.',page=2)
add('RENAL_EXACT30_GAP',c('crcl_ml_min','==',30),'consultant_review','The source lists >30 and <30. Exactly30 is unassigned; do not round into a dose band.',page=2)
add('BILIRUBIN_GE27',c('bilirubin_micromol_l','>=',27),'dose_reduce','Source starting recommendation is800mg/m² when bilirubin≥27micromol/L; increase only if tolerated and prescribed.',page=2)
add('NONHAEM_AMBIGUOUS',c('other_nonhaem_toxicity_grade','>=',3),'withhold','Severe nonhaematological toxicity excluding nausea/vomiting: hold and obtain consultant review. NCCP v5 prints >3 and >4, while product information addresses Grade3/4. The tool does not silently convert these symbols or mandate an automatic50% reduction/permanent stop.',page=3)
for k,id,msg in [('drug_pneumonitis_suspected','PNEUMONITIS','Stop gemcitabine when drug-induced pneumonitis is suspected; urgently investigate alternative causes.'),('scar_confirmed','SCAR_CONFIRMED','Discontinue gemcitabine for confirmed severe cutaneous adverse reaction.')]:add(id,c(k,'==',True),'discontinue',msg,page=3)
add('SCAR_SUSPECTED',c('scar_suspected','==',True),'withhold','Stop dosing pending urgent assessment of suspected severe skin reaction.',page=3)
for k,id,msg in [('hus_suspected','HUS','Stop gemcitabine and urgently assess suspected haemolytic uraemic syndrome.'),('pres_suspected','PRES','Urgently stop and assess suspected posterior reversible encephalopathy syndrome.'),('concurrent_radiotherapy','RADIOTHERAPY','Do not combine with radiotherapy casually: concurrent or≤7day timing requires specialist risk and protocol review.')]:add(id,c(k,'==',True),'withhold',msg,page='4.4',source_url=gem)
write('00284',p)
# Carboplatin/vinorelbine: its own table; never reuse oral-monotherapy hepatic cutoffs.
p,D,inp,add=setup('00614');vino='https://www.medicines.org.uk/emc/product/3912/smpc'
inp('treatment_day','Treatment day','select',[('day1','Day 1: both agents'),('day8','Day 8: vinorelbine only')],section='treatment_context');inp('vinorelbine_route','Prescribed vinorelbine route','select',[('iv','Intravenous'),('oral','Oral alternative')],section='treatment_context')
for k in ['treatment_day','vinorelbine_route']:D[k].update(always_show=True,input_role='context')
for k,label in [('long_term_oxygen','Long-term oxygen therapy required'),('absorption_impairment','Disease or surgery significantly affecting oral absorption'),('febrile_neutropenia_prior','Previous febrile neutropenia'),('neuropathy_persistent','Grade2 neuropathy persists despite prior reduction'),('calculated_gfr_creatinine_stale','Calculated GFR uses creatinine older than48hours'),('suspected_extravasation','Infusion-site pain, swelling or suspected extravasation'),('aprepitant_interaction_unresolved','Aprepitant/vinorelbine interaction plan unresolved')]:inp(k,label)
for k,label in [('gfr_crcl_ml_min','Verified GFR / creatinine clearance (mL/min)'),('isotope_creatinine_percent','Creatinine as percent of isotope-GFR baseline'),('myelosuppression_delay_weeks','Delay from myelosuppression (weeks)'),('myelosuppression_delay_count','Number of myelosuppression delays'),('mucositis_occurrence','Number of occurrences at this severity'),('planned_oral_total_mg','Prescribed oral vinorelbine total mg'),('oral_dose_mg_m2','Prescribed oral vinorelbine mg/m²')]:inp(k,label,'number',section='labs' if k in ['gfr_crcl_ml_min','isotope_creatinine_percent'] else 'clinical')
D['gfr_crcl_ml_min']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,reason='Preserve source cutoff and independently verify Calvert dosing',source_url=p['metadata']['source_url'])
inp('hepatic_impairment','Assessed hepatic impairment','select',[('none','None'),('mild','Mild'),('moderate','Moderate'),('severe','Severe'),('unresolved','Unresolved')])
for k,label in [('neuropathy_grade','Peripheral neuropathy grade'),('mucositis_grade','Mucositis / stomatitis grade'),('constipation_grade','Constipation grade')]:inp(k,label,'select',[(i,str(i)) for i in range(5)])
add('COURSE_LIMIT',c('cycle_number','>',4),'consultant_review','The source specifies four21day cycles or earlier progression/toxicity; reassess extension.',page=1)
add('OXYGEN_EXCLUSION',c('long_term_oxygen','==',True),'contraindicated','Long-term oxygen therapy is an NCCP exclusion.',page=4)
add('ORAL_ABSORPTION',ac(c('vinorelbine_route','==','oral'),c('absorption_impairment','==',True)),'consultant_review','Confirm oral absorption after significant gastric/small-bowel disease or surgery before using capsules.',['vinorelbine'],4)
add('DAY_ROUTE_REQUIRED',oc(c('treatment_day','missing'),c('vinorelbine_route','missing')),'consultant_review','Select treatment day and prescribed route. Day8 contains no carboplatin and oral/IV vinorelbine support differs.',page=1)
add('LOW_ANC',ac(c('anc_x10e9_l','>=',.5),c('anc_x10e9_l','<',1)),'withhold','Delay until recovery for ANC0.5 to<1.',page=5)
add('ANC_LT05',c('anc_x10e9_l','<',.5),'withhold','Delay until recovery and reduce BOTH agents by25% for subsequent cycles.',page=5)
add('LOW_PLATELETS',ac(c('platelets_x10e9_l','>=',50),c('platelets_x10e9_l','<',100)),'withhold','Delay until recovery for platelets50 to<100.',page=5)
add('PLATELETS_LT50',c('platelets_x10e9_l','<',50),'withhold','Delay until recovery and reduce BOTH agents by25% for subsequent cycles.',page=5)
add('PRIOR_FN',c('febrile_neutropenia_prior','==',True),'withhold','After febrile neutropenia delay until recovery and reduce both agents by25% for later cycles.',page=5)
add('PROLONGED_MARROW_DELAY',oc(c('myelosuppression_delay_weeks','>',2),c('myelosuppression_delay_count','>=',3)),'withhold','After recovery discuss50% reduction of both agents OR ceasing treatment; no automatic dose selection.',page=5)
add('VINORELBINE_SMPC_COUNT_CONFLICT',ac(c('anc_x10e9_l','>=',1),c('anc_x10e9_l','<',1.5)),'withhold','NCCP combo table starts delay below1, but vinorelbine product information delays below1.5. Reconcile with consultant/pharmacy; no automatic clearance.',['vinorelbine'],'4.4',vino)
add('CARBO_GFR_20_OR_LESS',c('gfr_crcl_ml_min','<=',20),'contraindicated','Do not administer carboplatin with GFR≤20.',['carboplatin'],5)
add('CARBO_MARROW_RISK',c('gfr_crcl_ml_min','<',60),'consultant_review','CrCl<60 increases carboplatin myelosuppression risk; review counts and renal dosing.',['carboplatin'],5)
add('CARBO_GFR_CAP',c('gfr_crcl_ml_min','>',125),'consultant_review','Calvert GFR input must not exceed125mL/min; verify renal method and dose.',['carboplatin'],3)
add('CARBO_STALE_CREATININE',c('calculated_gfr_creatinine_stale','==',True),'consultant_review','For calculated GFR use creatinine obtained within48hours before carboplatin.',['carboplatin'],6)
add('CARBO_ISOTOPE_RECHECK',c('isotope_creatinine_percent','>',110),'consultant_review','Reassess GFR when creatinine exceeds110% of the value at isotope measurement.',['carboplatin'],6)
add('VIN_HEPATIC_SEVERE',c('hepatic_impairment','==','severe'),'consultant_review','Source considers66% of original vinorelbine dose in severe hepatic impairment; no numeric liver cutoffs are defined. Confirm classification, original dose and route; carboplatin has no hepatic reduction in this table.',['vinorelbine'],5)
add('VIN_HEPATIC_UNRESOLVED',c('hepatic_impairment','==','unresolved'),'consultant_review','Clarify hepatic impairment category; do not import oral-monotherapy bilirubin rules into00614.',['vinorelbine'],5)
add('VIN_NEURO_G2',ac(c('neuropathy_grade','==',2),c('neuropathy_persistent','!=',True)),'consultant_review','For Grade2 at start of next cycle reduce vinorelbine by25%; confirm timing and prior reduction.',['vinorelbine'],6)
add('VIN_NEURO_G2_PERSISTENT',ac(c('neuropathy_grade','==',2),c('neuropathy_persistent','==',True)),'consultant_review','Persistent Grade2: source recommends vinorelbine50% reduction; confirm original/current dose.',['vinorelbine'],6)
add('VIN_NEURO_G34',c('neuropathy_grade','>=',3),'omit','Omit vinorelbine for Grade3/4 neuropathy; carboplatin decision is independent.',['vinorelbine'],6)
add('MUCOSITIS_WITHHOLD',c('mucositis_grade','>=',2),'withhold','Delay treatment until mucositis/stomatitis resolves to Grade≤1; then use severity and occurrence count for subsequent-cycle plan.',page=6)
add('MUCOSITIS_OCCURRENCE_REQUIRED',ac(c('mucositis_grade','>=',2),c('mucositis_occurrence','missing')),'consultant_review','Record occurrence count at this severity before selecting the recurrence-based reduction.',page=6)
for grade,counts in [(2,[(1,'No reduction on first Grade2 episode after recovery.'),(2,'Second Grade2 episode: reduce both agents25% after recovery.'),(3,'Third Grade2 episode: reduce both agents50% after recovery.'),(4,'Fourth Grade2 episode: omit both agents.')]),(3,[(1,'First Grade3/4 episode: reduce both agents50% after recovery.'),(2,'Second Grade3/4 episode: omit both agents.')])]:
 for count,msg in counts:add(f'MUCOSITIS_G{grade}_N{count}',ac(c('mucositis_grade','==' if grade==2 else '>=',grade),c('mucositis_occurrence','==' if count<max(x[0] for x in counts) else '>=',count)),'omit' if msg.endswith('omit both agents.') else 'consultant_review',msg,page=6)
add('CONSTIPATION_SEVERE',c('constipation_grade','>=',3),'withhold','Assess severe constipation/possible ileus urgently before further vinorelbine; use an individual bowel plan.',['vinorelbine'],7)
add('EXTRAVASATION',ac(c('vinorelbine_route','==','iv'),c('suspected_extravasation','==',True)),'withhold','Stop infusion and activate the local extravasation pathway immediately.',['vinorelbine'],'4.2',vino)
add('NK1_INTERACTION',c('aprepitant_interaction_unresolved','==',True),'consultant_review','Reconcile aprepitant CYP3A4 inhibition and increased vinca-alkaloid adverse effects with pharmacy before issuing the support plan.',['vinorelbine'],7)
add('ORAL_DOSE_CAP_60',ac(c('vinorelbine_route','==','oral'),c('oral_dose_mg_m2','==',60),c('planned_oral_total_mg','>',120)),'consultant_review','The60mg/m² oral starting schedule has a120mg cap. Verify prescribed capsules; no automatic recalculation.',['vinorelbine'],2)
add('ORAL_DOSE_CAP_80',ac(c('vinorelbine_route','==','oral'),c('oral_dose_mg_m2','==',80),c('planned_oral_total_mg','>',160)),'consultant_review','Printed80mg/m² capsule table caps at160mg. Verify prescribed dose and any intentional reduction.',['vinorelbine'],2)
add('ORAL_EARLY_ESCALATION',ac(c('vinorelbine_route','==','oral'),c('cycle_number','<',2),c('oral_dose_mg_m2','>',60)),'consultant_review','Source considers oral increase to80mg/m² from cycle2 or3 if tolerated; confirm any higher cycle1 prescription.',['vinorelbine'],2)
# Variable prescribed vinorelbine doses must not inherit a numeric reduction from
# the displayed source starting dose. Only the hepatic row specifies original.
for rule in p['rule_engine']['rules']:
 action=rule['action']
 if 'vinorelbine' in action['components'] and '%' in action['recommendation']:
  action['dose_basis']='documented_starting_dose'
  if rule['rule_id']=='VIN_HEPATIC_SEVERE':
   action['dose_percent_of_original']=66
  else:
   action['dose_calculation']='specialist_review'
   action['dose_calculation_blocked']=True
p['supportive_care']=dict(emetogenic_risk='phase_dependent',script_id=None,phase_specific_plan='patient/00614/supportive-care.html',phase_profiles={'day1':{'level':'high','script_id':'nccp-v8-carboplatin-v08420'},'day8_iv':{'level':'minimal','script_id':'nccp-minimal-no-routine'},'day8_oral':{'level':'oral_moderate_high','script_id':'nccp-oral-vinorelbine-v08420'}},mapping_basis='Select day and vinorelbine route: carboplatin Day1 high, Day8 IV minimal or oral route-specific prophylaxis. No default when unresolved.')
write('00614',p)
# Preserve audited monotherapy rules. Add explicit missing-day/result readiness.
for code in ['00232','00259']:
 _,p=load(code);D=p['input_definitions'];url=p['metadata']['source_url']
 D['pre_dose_fbc_available']=dict(label='Blood count reviewed for this administration',type='boolean',required=False,demo_value='',input_role='decision',ui_section='clinical')
 msg='Do not release this dose until the required blood count has been reviewed. Oral treatment at home still needs pre-dose clearance.' if code=='00259' else 'Blood count is required on the day of each new administration in the vinorelbine product information, including Day8; a previous cycle-start result alone is not clearance.'
 p['rule_engine']['rules'].append(dict(rule_id='PRE_DOSE_FBC_NOT_REVIEWED',when=c('pre_dose_fbc_available','==',False),action=dict(type='withhold',components=['vinorelbine'],recommendation=msg,message=msg),explanation=msg,source=dict(document='NCCP00259 tests' if code=='00259' else 'Navelbine IV SmPC4.4',url=url if code=='00259' else vino,page=3 if code=='00259' else '4.4',checked_date=DATE)))
 write(code,p)
print('Four proposed protocols created')
