"""Reconcile only the three owned protocols against current official PDFs.
No inferred source gaps, no implicit normal values, no automatic re-escalation.
"""
import sys
if "--rebuild-from-audit-snapshots" not in sys.argv:
 raise SystemExit("Historical one-time audit builder: refusing to overwrite integrated files without --rebuild-from-audit-snapshots. Run source-cases.cjs for validation.")
from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[3]; A=Path(__file__).resolve().parent
S=json.loads((A/'sources.json').read_text())
def a(f,o,v=None):return dict(field=f,operator=o,value=v)
def all_(*x):return {'all':list(x)}
def any_(*x):return {'any':list(x)}
def sel(label,values):return dict(label=label,type='select',required=False,demo_value='',input_role='decision',options=[dict(value=v,label=l) for v,l in values])
def num(label,max=1000):return dict(label=label,type='number',min=0,max=max,step=.01,required=False,demo_value='',input_role='decision')
def boo(label):return dict(label=label,type='boolean',required=False,demo_value='',input_role='decision')
for c in ['00555','00783','00691']:
 f=next((R/'protocols/gastrointestinal').glob(c+'-*.json')); p=json.loads((A/(c+'-existing.json')).read_text()); m=p['metadata']; rect=c=='00691'; bev=c=='00783'; v='7' if c=='00555' else '2a' if bev else '4'; hp=4 if c!='00555' else 3; op=5 if c!='00555' else 4; tp=6 if c!='00555' else 5
 defs={}; rules=[]; p['input_definitions']=defs
 chemo=['irinotecan','oxaliplatin','fluorouracil_infusion']; allcomp=chemo+(['bevacizumab'] if bev else [])
 def phase(cond,which='induction'):return all_(a('treatment_phase','==',which),cond) if rect else cond
 def add(i,cond,typ,msg,page,comps=None,changes=None,gated=True):
  ac=dict(type=typ,components=comps or ['whole_regimen'],message=msg,recommendation=msg)
  if changes:ac['component_changes']=changes
  if typ=='consultant_review':ac.update(dose_calculation='specialist_review',show_in_dose_actions=True,block_numeric_dose=True)
  rules.append(dict(id=i,priority={'contraindicated':100,'discontinue':95,'withhold':80,'consultant_review':50,'dose_reduce':40,'proceed':10}.get(typ,50),when=phase(cond) if gated else cond,action=ac,explanation=msg,source=dict(document='NCCP '+c+' v'+v,page=page,url=S[c]['url'])))
 def field(k,t,label,values=None,max=1000):defs[k]=sel(label,values) if t=='select' else boo(label) if t=='boolean' else num(label,max)
 def reviewflag(k,msg,page=2,comps=None,gated=False):field(k,'boolean',msg);add(k.upper(),a(k,'==',True),'consultant_review',msg,page,comps,gated=gated)
 def stopflag(k,msg,page=2,comps=None,gated=False):field(k,'boolean',msg);add(k.upper(),a(k,'==',True),'contraindicated',msg,page,comps,gated=gated)
 def target(i,cond,targets,msg,page,relative=None,which='induction'):
  """Reference targets require current component history + explicit recovery before numeric actions.
  Reference row is always review-only. Numeric paths never exceed documented current doses.
  """
  comps=list(targets);relative=relative or {}
  add(i,cond,'consultant_review',msg+' Confirm recovery and all prior component reductions; no automatic re-escalation.',page,comps,{k:{'dose_calculation':'specialist_review','source_reference_dose_mg_m2':val} for k,val in targets.items()},gated=which=='induction')
  rules[-1]['action']['block_numeric_dose']=False
  if which!='induction':rules[-1]['when']=phase(cond,which)
  for comp,val in targets.items():
   if comp in relative:continue
   key='current_'+comp+'_dose_mg_m2';defs[key]=num('Current prescribed '+comp.replace('_',' ')+' dose (mg/m² per administration)',10000)
   co=all_(cond,a('toxicity_recovered_and_dose_history_checked','==',True),a(key,'>=',val))
   if which=='induction':co=all_(co,a('anc_x10e9_l','>=',anc),a('platelets_x10e9_l','>=',plt))
   add(i+'_'+comp.upper()+'_CONFIRMED',co,'dose_reduce',msg+' Verified current component dose is no lower than this source target; do not combine reductions by addition.',page,[comp],{comp:{'dose_mg_m2':val}},gated=which=='induction')
   if which!='induction':rules[-1]['when']=phase(co,which)
   add(i+'_'+comp.upper()+'_PRIOR_LOWER',all_(cond,a(key,'<',val)),'consultant_review','Current '+comp+' dose is already below the table reference target. Do not re-escalate; consultant/pharmacy must reconcile dose history.',page,[comp],gated=which=='induction')
   if which!='induction':rules[-1]['when']=phase(all_(cond,a(key,'<',val)),which)
 anc=1 if c=='00555' else 1.5;plt=100 if rect else 75
 if rect:
  field('treatment_phase','select','Current treatment phase',[('induction','FOLFIRINOX induction — 6 cycles'),('chemoradiation','Capecitabine with radiotherapy — 5 weeks')]);defs['treatment_phase'].update(always_show=True,input_role='context',required=True)
  add('PHASE_REQUIRED',any_(a('treatment_phase','missing'),a('treatment_phase','not_in',['induction','chemoradiation'])),'consultant_review','Select the current phase before applying chemotherapy or capecitabine-specific rules; missing phase is not induction.',1,gated=False)
 field('ecog','select','ECOG performance status',[(i,str(i)) for i in range(5)])
 if rect:add('ECOG_OUTSIDE_ELIGIBILITY',a('ecog','>',1),'consultant_review','ECOG 0–1 is the source eligibility range; review outside this range.',2,gated=False)
 else:
  field('age_years','number','Age in years',max=120)
  add('ECOG_YOUNGER',all_(a('age_years','<',70),a('ecog','>',2)),'consultant_review','For adults under 70 the source requires ECOG ≤2.',2,gated=False)
  add('ECOG_OLDER',all_(a('age_years','between',[71,75]),a('ecog','>=',1)),'consultant_review','For ages 71–75 the source requires ECOG <1.',2,gated=False)
  add('AGE_SOURCE_GAP',any_(all_(a('age_years','>=',70),a('age_years','<',71)),a('age_years','>',75),a('age_years','<',18)),'consultant_review','Source eligibility specifies adults under 70 and ages 71–75. Age 70 (or outside the adult stated bands) requires explicit consultant assessment; do not infer eligibility.',2,gated=False)
  add('ECOG_WITHOUT_AGE',all_(a('ecog','exists'),a('age_years','missing')),'consultant_review','Age is needed to interpret the source-specific ECOG bands.',2,gated=False)
 for k,msg in [('hypersensitivity','Hypersensitivity to an active drug or its excipients is an NCCP exclusion.'),('pregnancy','Pregnancy is an NCCP exclusion.'),('breastfeeding','Breastfeeding is an NCCP exclusion.')]:stopflag(k,msg)
 for k,msg in [('cardiac_risk','Recent MI or uncontrolled angina, hypertension, arrhythmia or CHF requires review; ECG if compromised cardiac function.'),('previous_pelvic_radiotherapy','Previous pelvic radiotherapy requires toxicity-risk review.'),('baseline_loose_bm_gt3','Baseline >3 loose stools daily without a stoma requires bowel/toxicity review.'),('symptomatic_neuropathy','Symptomatic peripheral neuropathy is a source caution.')]:reviewflag(k,msg)
 for k,msg in [('bowel_obstruction_or_chronic_inflammatory_bowel_disease','Chronic bowel disease or bowel obstruction'),('cns_metastases','CNS metastases')]:
  (reviewflag if rect else stopflag)(k,msg+(' is a source caution; consultant review.' if rect else ' is a source exclusion.'))
 if not rect:stopflag('severe_bone_marrow_failure','Severe bone marrow failure is an NCCP exclusion.')
 if rect:
  stopflag('severe_unexpected_fluoropyrimidine_reaction','Previous severe unexpected reaction to fluoropyrimidines is an NCCP exclusion.',comps=['fluorouracil_infusion','capecitabine'])
  stopflag('recent_or_concomitant_brivudine','Recent/concomitant brivudine is excluded; confirm product-information washout with pharmacy.',comps=['fluorouracil_infusion','capecitabine'])
 field('baseline_anc_x10e9_l','number','Pretreatment baseline ANC (×10⁹/L)',max=100);field('baseline_platelets_x10e9_l','number','Pretreatment baseline platelets (×10⁹/L)',max=2000)
 add('BASELINE_ANC_EXCLUSION',a('baseline_anc_x10e9_l','<',2 if c=='00555' else 1.5),'contraindicated','Baseline ANC below the source eligibility threshold ('+str(2 if c=='00555' else 1.5)+' ×10⁹/L).',2,gated=False)
 add('BASELINE_PLATELET_EXCLUSION',a('baseline_platelets_x10e9_l','<',100),'contraindicated','Baseline platelets <100 ×10⁹/L is an exclusion; distinguish pretreatment baseline from later cycle criteria.',2,gated=False)
 field('dpd_status','select','DPD test status',[('normal','No deficiency detected'),('partial','Partial deficiency'),('complete','Complete deficiency'),('unknown','Not tested / unknown')])
 fp=['fluorouracil_infusion','capecitabine'] if rect else ['fluorouracil_infusion']
 add('DPD_COMPLETE',a('dpd_status','==','complete'),'contraindicated','Known complete DPD deficiency: do not administer fluoropyrimidines.',2,fp,gated=False)
 add('DPD_PARTIAL',a('dpd_status','==','partial'),'consultant_review','Consider an individually reduced initial fluoropyrimidine dose. No fixed percentage is specified. Subsequent escalation only with careful monitoring and specialist decision.',3,fp,gated=False)
 add('DPD_UNKNOWN',a('dpd_status','==','unknown'),'consultant_review','Verify DPD phenotype and/or genotype before first fluoropyrimidine treatment; unknown is not normal.',3 if c!='00555' else 2,fp,gated=False)
 reviewflag('renal_impairment_dpd_phenotype','Moderate/severe renal impairment can falsely elevate uracil used for DPD phenotype; consider genotype testing.',3 if c!='00555' else 2,fp)
 field('bilirubin_uln_multiple','number','Bilirubin (×ULN)',max=100)
 add('BILIRUBIN_EXCLUSION',a('bilirubin_uln_multiple','>',3),'contraindicated','Bilirubin >3×ULN is a source exclusion; irinotecan contraindicated.',2,['irinotecan'])
 if rect:add('BILIRUBIN_CAPE_PHASE_REVIEW',phase(a('bilirubin_uln_multiple','>',3),'chemoradiation'),'consultant_review','Source eligibility excludes bilirubin >3×ULN, while the capecitabine organ table says no hepatic adjustment. Consultant/pharmacy must reconcile before capecitabine; do not import irinotecan dosing.',2,['capecitabine'],gated=False)
 reviewflag('ugt1a1_homozygous_or_gilbert','Known UGT1A1*28 homozygosity / Gilbert syndrome: consider a reduced irinotecan starting dose; source gives no percentage.',2 if c!='00555' else 7,['irinotecan'],True)
 for k,label,maxv in [('anc_x10e9_l','Current ANC (×10⁹/L)',100),('platelets_x10e9_l','Current platelets (×10⁹/L)',2000),('toxicity_delay_weeks','Weeks delayed for low counts',12),('crcl_ml_min','Creatinine clearance (mL/min)',250)]:field(k,'number',label,max=maxv)
 field('haemodialysis','boolean','Receiving haemodialysis')
 low=any_(a('anc_x10e9_l','<',anc),a('platelets_x10e9_l','<',plt))
 add('ANC_BELOW_CYCLE_THRESHOLD',a('anc_x10e9_l','<',anc),'withhold',f'Delay chemotherapy while ANC <{anc} ×10⁹/L; recovery and occurrence history guide subsequent dosing.',hp,allcomp)
 add('PLATELETS_BELOW_CYCLE_THRESHOLD',a('platelets_x10e9_l','<',plt),'withhold',f'Delay chemotherapy while platelets <{plt} ×10⁹/L.',hp,allcomp)
 add('COUNTS_NOT_RECOVERED_TWO_WEEKS',all_(low,a('toxicity_delay_weeks','>=',2)),'consultant_review','No recovery after two weeks: consider discontinuing treatment with the consultant. This is not an automatic discontinuation rule.',hp)
 field('febrile_or_active_infection','boolean','Current fever or active infection');add('CURRENT_INFECTION',a('febrile_or_active_infection','==',True),'withhold','Assess fever/infection urgently and do not administer chemotherapy pending clinical assessment.',hp,allcomp)
 field('toxicity_recovered_and_dose_history_checked','boolean','Affected toxicity recovered, current dose history and prescription reconciled by clinical team')
 for name,label in [('anc_delay','Prior Day-1 ANC below cycle threshold'),('platelet_delay','Prior Day-1 platelets below cycle threshold'),('platelet_nadir','Prior platelet nadir <50 ×10⁹/L')]:
  field(name+'_episode','boolean',label);field(name+'_occurrence','select',label+' occurrence',[(i,str(i)) for i in [1,2,3]])
  add(name.upper()+'_OCCURRENCE_NEEDED',all_(a(name+'_episode','==',True),a(name+'_occurrence','missing')),'consultant_review','Confirm the occurrence number for '+label.lower()+'; do not assume a first episode.',hp)
 # Source matrices remain event-specific, with no invented unified percentage ladder.
 for name in ['anc_delay','platelet_delay','platelet_nadir']:
  for occ in [1,2,3]:
   cond=all_(a(name+'_episode','==',True),a(name+'_occurrence','==',occ));rid=name.upper()+'_O'+str(occ)
   if occ==3:
    stop=['irinotecan'] if rect and name=='anc_delay' else ['oxaliplatin'] if rect and name=='platelet_delay' else allcomp
    add(rid,cond,'discontinue','Third '+name.replace('_',' ')+' occurrence: discontinue '+', '.join(stop)+'. Source dashes do not instruct stopping other components.',hp,stop);continue
   targets={};relative={}
   if name=='anc_delay':
    targets={'irinotecan':150}
    if occ==2:targets['oxaliplatin']=60
    if not rect:targets['fluorouracil_infusion']=2400 if occ==1 else 1600
   else:
    targets={'oxaliplatin':60}
    if occ==2:targets['irinotecan']=150
    if not rect:targets['fluorouracil_infusion']=2400 if name=='platelet_delay' or occ==1 else 1600
    elif (name=='platelet_delay' and occ==1) or (name=='platelet_nadir' and occ==2):targets['fluorouracil_infusion']='25% reduction';relative['fluorouracil_infusion']=True
   text=f'{name.replace("_"," ").capitalize()}, occurrence {occ}: '+', '.join(k+' '+str(val)+(' mg/m²' if isinstance(val,(int,float)) else ' from current prescribed dose; source does not say 75% of original') for k,val in targets.items())+'. Components described as maintained or “–” are not automatically reset to full dose.'
   target(rid,cond,targets,text,hp,relative)
 if rect:
  field('prior_febrile_neutropenia','boolean','Previous febrile neutropenia');field('nadir_anc_x10e9_l','number','Previous nadir ANC (×10⁹/L)',max=100);field('nadir_anc_duration_days','number','Days with ANC <0.5',max=100);field('infection_during_nadir','boolean','Infection accompanying recorded nadir ANC');field('neutropenic_event_occurrence','select','Severe neutropenic event occurrence',[(i,str(i)) for i in [1,2,3]])
  event=any_(a('prior_febrile_neutropenia','==',True),all_(a('nadir_anc_x10e9_l','<',.5),a('nadir_anc_duration_days','>',7)),all_(a('infection_during_nadir','==',True),a('nadir_anc_x10e9_l','<',1)))
  for occ in [1,2,3]:
   cond=all_(event,a('neutropenic_event_occurrence','==',occ))
   if occ==3:add('SEVERE_NEUTROPENIC_O3',cond,'discontinue','Third qualifying febrile/prolonged/infected neutropenic event: discontinue chemotherapy.',hp,allcomp)
   else:target('SEVERE_NEUTROPENIC_O'+str(occ),cond,{'irinotecan':150,**({'oxaliplatin':60,'fluorouracil_infusion':2000} if occ==2 else {})},'Table3 qualifying neutropenic event: '+('irinotecan150; maintain other components.' if occ==1 else 'irinotecan150, oxaliplatin60, 5-FU infusion2000 mg/m².'),hp)
  add('SEVERE_NEUTROPENIC_CONTEXT',event,'consultant_review','Qualifying Table3 neutropenic event: confirm occurrence and recovery before subsequent dosing.',hp)
  field('second_anc_below1_episode','boolean','Second episode ANC <1 ×10⁹/L');add('GCSF_REVIEW',any_(a('prior_febrile_neutropenia','==',True),a('second_anc_below1_episode','==',True)),'consultant_review','Consider G-CSF prophylaxis in subsequent cycles for any febrile neutropenia or a second ANC <1 episode.',hp)
 else:
  field('prior_febrile_neutropenia','boolean','Prior febrile neutropenia');add('PRIOR_FN_REVIEW',a('prior_febrile_neutropenia','==',True),'consultant_review','Review prior febrile neutropenia, recovery and supportive care. Source Table3 only supplies platelet-nadir rows; no imported FOLFIRINOX FN dose matrix.',hp,allcomp)
 add('IRINOTECAN_RENAL_LT10',a('crcl_ml_min','<',10),'consultant_review','CrCl <10: irinotecan initial 50–66% of original, increase if tolerated; consultant selects dose within the source range.',op,['irinotecan'])
 add('IRINOTECAN_DIALYSIS',a('haemodialysis','==',True),'consultant_review','Haemodialysis: irinotecan initial 50–66% of original, increase if tolerated. No single calculated percentage.',op,['irinotecan'])
 add('OXALIPLATIN_RENAL_LT30',a('crcl_ml_min','<',30),'consultant_review','CrCl <30: consider 50% original oxaliplatin dose. This is a consultant choice, not an automatic contraindication.',op,['oxaliplatin'])
 add('OXALIPLATIN_DIALYSIS',a('haemodialysis','==',True),'consultant_review','Haemodialysis: consider 50% original oxaliplatin and haemodialysis within 90 minutes after administration.',op,['oxaliplatin'])
 if c=='00555':
  for x,comp in [(10,'irinotecan'),(30,'oxaliplatin')]:add('RENAL_EXACT_'+str(x),a('crcl_ml_min','==',x),'consultant_review',f'Current v7 uses strict greater/less than {x} mL/min. Exactly {x} is unassigned; consultant/pharmacy review without rounding.',op,[comp])
 field('fluorouracil_hepatic_impairment','select','Clinical hepatic impairment',[('none','None'),('mild','Mild'),('moderate','Moderate'),('severe','Severe')]);field('renal_impairment_present','boolean','Concurrent clinically significant renal impairment')
 if c=='00555':
  add('FIVEFU_SEVERE_HEPATIC',a('fluorouracil_hepatic_impairment','==','severe'),'contraindicated','Current v7 does not recommend 5-FU in severe hepatic impairment.',op,['fluorouracil_infusion'])
  add('FIVEFU_COMBINED_ORGAN_REVIEW',all_(a('fluorouracil_hepatic_impairment','in',['mild','moderate']),any_(a('renal_impairment_present','==',True),a('renal_impairment_present','missing'))),'consultant_review','5-FU mild/moderate hepatic no-adjustment advice applies without concurrent renal impairment. Confirm renal status/combined-organ prescription.',op,['fluorouracil_infusion'])
 else:
  field('fluorouracil_bilirubin_umol_l','number','Absolute bilirubin (µmol/L)',max=1000);field('fluorouracil_ast_u_l','number','Absolute AST (U/L)',max=10000)
  add('FIVEFU_ABSOLUTE_HEPATIC_CONTRA',any_(a('fluorouracil_bilirubin_umol_l','>',85),a('fluorouracil_ast_u_l','>',180)),'contraindicated','5-FU contraindicated when bilirubin >85 µmol/L OR AST >180 U/L; either value is independently actionable.',op,['fluorouracil_infusion'])
  add('FIVEFU_EXACT_HEPATIC_BOUNDARY',any_(a('fluorouracil_bilirubin_umol_l','==',85),a('fluorouracil_ast_u_l','==',180)),'consultant_review','Exactly bilirubin85 µmol/L or AST180 U/L is unassigned by the strict source inequalities; no automatic full dose.',op,['fluorouracil_infusion'])
  for sev,txt in [('moderate','reduce initial dose by one third'),('severe','reduce initial dose by one half')]:add('FIVEFU_HEPATIC_'+sev.upper(),a('fluorouracil_hepatic_impairment','==',sev),'consultant_review','Clinical decision: '+txt+'; increase if no toxicity. The absolute bilirubin/AST contraindication takes precedence.',op,['fluorouracil_infusion'])
 if rect:
  add('IRINOTECAN_BILI_27_50',a('fluorouracil_bilirubin_umol_l','between',[27,50]),'consultant_review','Investigate raised bilirubin and, if medically indicated, reduce irinotecan to50% at next cycle. Source Table7 is absolute µmol/L, not ULN multiples; reconcile prior dose.',6,['irinotecan'])
  add('IRINOTECAN_BILI_GT50',a('fluorouracil_bilirubin_umol_l','>',50),'discontinue','Bilirubin >50 µmol/L: stop irinotecan (Table7), investigate cause; this is not a whole-regimen stop.',6,['irinotecan'])
 # Non-haematological events distinguish current safety, worst episode, occurrence and recovery.
 for k,label in [('diarrhoea_grade','Current diarrhoea grade'),('diarrhoea_worst_grade','Worst diarrhoea grade in episode'),('mucositis_grade','Current mucositis grade'),('mucositis_worst_grade','Worst mucositis grade'),('hand_foot_grade','Current hand-foot syndrome grade'),('hand_foot_worst_grade','Worst hand-foot syndrome grade'),('neuropathy_grade','Oxaliplatin neuropathy grade'),('other_nonhaem_toxicity_grade','Other toxicity grade (excluding anaemia/alopecia)')]:field(k,'select',label,[(i,str(i)) for i in range(5)])
 field('diarrhoea_with_fever_or_severe_neutropenia','boolean','Diarrhoea episode with fever and/or ANC <1 ×10⁹/L (grade3–4 neutropenia)');field('diarrhoea_occurrence','select','Qualifying diarrhoea episode occurrence',[(i,str(i)) for i in [1,2,3]])
 dcond=any_(a('diarrhoea_worst_grade','>=',3),a('diarrhoea_with_fever_or_severe_neutropenia','==',True))
 add('SEVERE_DIARRHOEA_CURRENT',a('diarrhoea_grade','>=',3),'withhold','Severe current diarrhoea requires urgent assessment, treatment interruption and fluid/electrolyte support; subsequent dose table applies after recovery.',tp,allcomp)
 add('COMPLICATED_DIARRHOEA_REVIEW',a('diarrhoea_with_fever_or_severe_neutropenia','==',True),'consultant_review','Complicated diarrhoea qualifies for the recurrence pathway. Confirm this describes a recovered episode; current fever or neutropenia needs urgent assessment.',tp,allcomp)
 add('DIARRHOEA_OCCURRENCE_NEEDED',all_(dcond,a('diarrhoea_occurrence','missing')),'consultant_review','Confirm qualifying diarrhoea occurrence number and current recovery; no default first occurrence.',tp,chemo)
 for occ in [1,2,3]:
  co=all_(dcond,a('diarrhoea_occurrence','==',occ))
  if occ==3:add('DIARRHOEA_O3',co,'discontinue','Third qualifying diarrhoea occurrence: discontinue '+('irinotecan only; other components require separate review.' if rect else 'treatment.'),tp,['irinotecan'] if rect else allcomp)
  else:
   tg={'irinotecan':150};rel={}
   if occ==2:tg['oxaliplatin']=60
   if not rect:tg['fluorouracil_infusion']=2400 if occ==1 else 1600
   elif occ==2:tg['fluorouracil_infusion']='25% reduction';rel['fluorouracil_infusion']=True
   target('DIARRHOEA_O'+str(occ),co,tg,'Qualifying diarrhoea occurrence'+str(occ)+': '+', '.join(k+' '+str(v) for k,v in tg.items())+'.',tp,rel)
 for tox in ['mucositis','hand_foot']:
  add(tox.upper()+'_CURRENT',a(tox+'_grade','>=',3),'withhold','Severe '+tox.replace('_',' ')+' requires interruption and recovery assessment before subsequent 5-FU.',tp,['fluorouracil_infusion'])
  target(tox.upper()+'_REDUCTION',a(tox+'_worst_grade','>=',3),{'fluorouracil_infusion':'25% reduction' if rect else 2400},'Grade3–4 '+tox.replace('_',' ')+': '+('reduce infusion by25% from current prescribed dose for subsequent cycles.' if rect else '5-FU infusion75% of original (2400 mg/m²).'),tp,{'fluorouracil_infusion':True} if rect else {})
 if not rect:add('OTHER_TOXICITY_REVIEW',a('other_nonhaem_toxicity_grade','>=',2),'consultant_review','Other grade≥2 toxicity except alopecia/anaemia: consider irinotecan reduction; source provides no fixed percentage.',tp,['irinotecan'])
 field('neuropathy_persistent','boolean','Neuropathy persists at start of next cycle');field('neuropathy_duration_days','number','Duration of transient neuropathy (days)',max=1000)
 add('NEUROPATHY_G4',a('neuropathy_grade','>=',4),'discontinue','Grade4 neurotoxicity: discontinue oxaliplatin; other drugs are not automatically discontinued.',tp,['oxaliplatin'])
 add('NEUROPATHY_PERSISTENT_G3',all_(a('neuropathy_grade','==',3),a('neuropathy_persistent','==',True)),'discontinue','Persistent grade3 neuropathy: discontinue oxaliplatin; irinotecan and 5-FU can continue subject to their own assessment.',tp,['oxaliplatin'])
 add('NEUROPATHY_CONTEXT_REQUIRED',all_(a('neuropathy_grade','in',[2,3]),a('neuropathy_persistent','missing')),'consultant_review','Grade2–3 neuropathy requires persistence/duration assessment before oxaliplatin dose selection.',tp,['oxaliplatin'])
 if rect:
  add('NEUROPATHY_PERSISTENT_G2',all_(a('neuropathy_grade','==',2),a('neuropathy_persistent','==',True)),'consultant_review','Persistent grade2: reduce oxaliplatin by one dose level. Source does not define a unified ladder linking65-neurology and60-haematology targets; confirm current level and consultant prescription.',6,['oxaliplatin'])
  target('NEUROPATHY_TRANSIENT_G3',all_(a('neuropathy_grade','==',3),a('neuropathy_persistent','==',False)),{'oxaliplatin':65},'Transient grade3 neuropathy: oxaliplatin65 mg/m² (Table5), regardless of1–7 or>7 days.',6)
  field('diarrhoea_persistent_over48h_despite_loperamide','boolean','Diarrhoea >48h despite prescribed high-dose loperamide');add('PERSISTENT_DIARRHOEA_REVIEW',a('diarrhoea_persistent_over48h_despite_loperamide','==',True),'consultant_review','Urgent clinical review of persistent diarrhoea. After recovery no automatic reduction solely for >48h persistence unless grade3–4 or diarrhoea with fever/severe neutropenia criteria apply.',6,chemo)
 else:add('TRANSIENT_NEUROPATHY_REDUCTION',any_(all_(a('neuropathy_grade','==',3),a('neuropathy_persistent','==',False)),all_(a('neuropathy_grade','==',2),a('neuropathy_duration_days','>',7),a('neuropathy_persistent','==',False))),'consultant_review','Transient grade3 or transient grade2 lasting>7days: decrease oxaliplatin by25% from its current dose; verify dose history. Persistent grade2 has no explicit row and needs review.',tp,['oxaliplatin'])
 if not rect:add('PERSISTENT_G2_SOURCE_GAP',all_(a('neuropathy_grade','==',2),a('neuropathy_persistent','==',True)),'consultant_review','Persistent grade2 neuropathy is not assigned a numeric dose in this source table; consultant/pharmacy assessment.',tp,['oxaliplatin'])
 reviewflag('laryngopharyngeal_dysaesthesia','Laryngopharyngeal dysaesthesia: maintain oxaliplatin dose and extend infusion from2to6hours; distinguish from anaphylaxis.',tp,['oxaliplatin'],True)
 reviewflag('acute_cholinergic_syndrome','Acute cholinergic syndrome: atropine250micrograms SC unless contraindicated; assess asthma/glaucoma and arrange subsequent prophylaxis.',8 if rect else 10 if bev else 7,['irinotecan'],True)
 reviewflag('glaucoma','Glaucoma: do not use source atropine premedication; pharmacy/consultant must select a suitable plan.',7 if rect or bev else 5,['irinotecan'],True)
 if not rect:
  for k,msg in [('oxaliplatin_anaphylaxis','Oxaliplatin anaphylaxis: stop infusion, treat urgently, no oxaliplatin rechallenge.'),('hus_confirmed','Confirmed haemolytic uraemic syndrome: permanently discontinue oxaliplatin.')]:field(k,'boolean',msg);add(k.upper(),a(k,'==',True),'discontinue',msg,10 if bev else 7,['oxaliplatin'])
  field('hus_suspected','boolean','Suspected haemolytic uraemic syndrome');add('HUS_SUSPECTED',a('hus_suspected','==',True),'withhold','Interrupt oxaliplatin and urgently evaluate suspected HUS; confirmed HUS requires permanent discontinuation.',10 if bev else 7,['oxaliplatin'])
 if rect:
  def cape(i,cond,typ,msg,page=7,changes=None):add(i,phase(cond,'chemoradiation'),typ,msg,page,['capecitabine'],changes,gated=False)
  cape('CAPE_RENAL_30_50',a('crcl_ml_min','between',[30,50]),'consultant_review','CrCl30–50: capecitabine75% of prescribed starting dose; confirm800vs825mg/m²BID plan, prior reductions and tablet banding.',5)
  cape('CAPE_RENAL_LT30',a('crcl_ml_min','<',30),'contraindicated','CrCl<30: capecitabine not recommended.',5)
  cape('CAPE_DIALYSIS',a('haemodialysis','==',True),'contraindicated','Capecitabine is not recommended in haemodialysis.',5)
  cape('CAPE_RENAL_50_51_GAP',all_(a('crcl_ml_min','>',50),a('crcl_ml_min','<',51)),'consultant_review','CrCl>50and<51 lies between the source30–50 and51–80 bands; do not round for dosing.',5)
  field('capecitabine_current_grade','select','Current capecitabine toxicity grade',[(i,str(i)) for i in range(5)]);field('capecitabine_worst_grade','select','Worst capecitabine toxicity grade in episode',[(i,str(i)) for i in range(5)]);field('capecitabine_occurrence','select','Occurrence of this grade of capecitabine toxicity',[(i,str(i)) for i in [1,2,3,4]])
  cape('CAPE_CURRENT_G2_PLUS',a('capecitabine_current_grade','>=',2),'withhold','Interrupt capecitabine for moderate/severe toxicity; hold until grade0–1. Omitted doses are not replaced; never increase a toxicity-reduced dose.',3)
  cape('CAPE_G4_CHOICE',any_(a('capecitabine_worst_grade','==',4),a('capecitabine_current_grade','==',4)),'consultant_review','Grade4: definitive discontinuation OR hold until grade0–1 at consultant discretion; no automatic restart dose is supplied.')
  cape('CAPE_G2_3_CONTEXT',a('capecitabine_worst_grade','in',[2,3]),'consultant_review','Confirm capecitabine recovery, grade-specific occurrence and current dose. Grade3 uses grade2 sequence.')
  for occ,dose in [(1,600),(2,400)]:
   co=all_(a('capecitabine_worst_grade','in',[2,3]),a('capecitabine_current_grade','<=',1),a('capecitabine_occurrence','==',occ));target('CAPE_TOXICITY_O'+str(occ),co,{'capecitabine':dose},f'After recovery to grade0–1, first/second grade2–3 episode source target is {dose}mg/m² twice daily on prescribed radiation days. Never re-escalate.',7,which='chemoradiation')
  cape('CAPE_THIRD_OCCURRENCE_GAP',all_(a('capecitabine_worst_grade','in',[2,3]),a('capecitabine_occurrence','>=',3)),'consultant_review','Third grade2 episode: hold until grade0–1, but the source dose cell is blank. Grade3 follows grade2. Consultant must choose subsequent treatment; do not infer400mg/m² or import another capecitabine matrix.')
  field('capecitabine_angina_or_infarction','boolean','Angina or infarction during capecitabine');cape('CAPE_CARDIAC_STOP',a('capecitabine_angina_or_infarction','==',True),'discontinue','Angina or infarction: definitively discontinue capecitabine; urgent cardiac assessment.')
 if bev:
  stopflag('cho_or_recombinant_antibody_hypersensitivity','Hypersensitivity to CHO cell products or recombinant/humanised antibodies excludes bevacizumab.',2,['bevacizumab'])
  for k,label in [('systolic_bp_mmhg','Systolic BP (mmHg)'),('diastolic_bp_mmhg','Diastolic BP (mmHg)'),('urine_protein_g_l','Urine protein concentration (g/L)'),('urine_protein_24h_g','24-hour urine protein (g/24h)'),('days_since_major_surgery','Days since major surgery'),('days_until_major_surgery','Days until planned major surgery'),('days_until_minor_surgery','Days until planned minor surgery')]:field(k,'number',label,max=10000)
  field('urine_dipstick','select','Urine protein dipstick',[(i,'Negative' if i==0 else str(i)+'+') for i in range(5)])
  field('hypertension_grade','select','Hypertension grade',[(i,str(i)) for i in range(5)]);field('proteinuria_grade','select','Proteinuria toxicity grade',[(i,str(i)) for i in range(5)])
  for k in ['bp_sustained_on_antihypertensives','uncontrolled_or_symptomatic_hypertension','persistent_grade3_hypertension','hypertensive_crisis_or_encephalopathy','wound_fully_healed','pres_confirmed','arterial_thromboembolism','gi_perforation','tracheoesophageal_fistula','necrotising_fasciitis']:field(k,'boolean',k.replace('_',' ').capitalize())
  for k in ['thromboembolism_grade','haemorrhage_grade','fistula_grade']:field(k,'select',k.replace('_',' ').capitalize(),[(i,str(i)) for i in range(5)])
  add('BEV_PROTEIN_DIP_2_3',any_(a('urine_dipstick','in',[2,3]),a('urine_protein_g_l','>=',1)),'consultant_review','Dipstick2+/3+ or protein≥1g/L: source permits scheduled bevacizumab while arranging24-hour urine within3days before NEXT dose. This does not override a known>2g/24h,4+dipstick or grade4 proteinuria hold/stop.',6,['bevacizumab'])
  add('BEV_PROTEIN_DIP4',a('urine_dipstick','==',4),'withhold','Dipstick4+: withhold bevacizumab and collect24-hour urine.',6,['bevacizumab'])
  add('BEV_PROTEIN_GT2_TO4',all_(a('urine_protein_24h_g','>',2),a('urine_protein_24h_g','<=',4)),'withhold','24-hour protein>2to4g: withhold bevacizumab, recheck every2weeks, resume only at≤2g/24h after review.',6,['bevacizumab'])
  add('BEV_PROTEIN_GT4',a('urine_protein_24h_g','>',4),'discontinue','24-hour protein>4g: discontinue bevacizumab.',6,['bevacizumab'])
  add('BEV_PROTEIN_GRADE_CONTEXT',a('proteinuria_grade','in',[2,3]),'consultant_review','Grade2/3 label alone does not determine the source urine pathway. Enter dipstick and/or quantitative24-hour protein; do not automatically hold for grade2.',6,['bevacizumab'])
  add('BEV_BP_SINGLE_VALUE',any_(a('systolic_bp_mmhg','>',150),a('diastolic_bp_mmhg','>',100)),'consultant_review','BP above source150/100 threshold needs repeat/clinical assessment and antihypertensive initiation or adjustment. Confirm persistence, symptoms and treatment; a single reading is not a new CTCAE grade.',8,['bevacizumab'])
  add('BEV_BP_WITHHOLD',any_(a('uncontrolled_or_symptomatic_hypertension','==',True),all_(a('bp_sustained_on_antihypertensives','==',True),any_(a('systolic_bp_mmhg','>',150),a('diastolic_bp_mmhg','>',100)))),'withhold','Uncontrolled or symptomatic Day1 hypertension: withhold bevacizumab and start/adjust antihypertensives.',7,['bevacizumab'])
  add('BEV_BP_G2_3',a('hypertension_grade','in',[2,3]),'consultant_review','Grade2–3 hypertension: antihypertensives and consider interruption until controlled.',7,['bevacizumab'])
  for rid,cond,msg,page in [('BP_STOP',any_(a('hypertension_grade','==',4),a('persistent_grade3_hypertension','==',True),a('hypertensive_crisis_or_encephalopathy','==',True)),'Grade4, persistent grade3, hypertensive crisis/encephalopathy: discontinue bevacizumab.',7),('PROTEIN_G4',a('proteinuria_grade','==',4),'Grade4 proteinuria: discontinue bevacizumab.',7),('FISTULA_STOP',any_(a('tracheoesophageal_fistula','==',True),a('fistula_grade','==',4)),'TE fistula or any grade4 fistula: discontinue bevacizumab.',7),('THROMBOEMBOLISM_STOP',any_(a('arterial_thromboembolism','==',True),a('thromboembolism_grade','==',4)),'Any arterial thromboembolic event or grade4 venous event: discontinue bevacizumab.',9),('BLEEDING_STOP',a('haemorrhage_grade','>=',3),'Grade≥3 haemorrhage: discontinue bevacizumab.',7),('GI_PERFORATION_STOP',a('gi_perforation','==',True),'GI perforation: permanently discontinue bevacizumab.',8),('PRES_STOP',a('pres_confirmed','==',True),'Confirmed PRES: discontinue bevacizumab; safety of restart is unknown.',9),('NECROTISING_FASCIITIS_STOP',a('necrotising_fasciitis','==',True),'Necrotising fasciitis: discontinue bevacizumab and treat promptly.',8)]:add('BEV_'+rid,cond,'discontinue',msg,page,['bevacizumab'])
  add('BEV_SURGERY_HOLD',any_(a('days_since_major_surgery','<',28),a('days_until_major_surgery','<=',28),a('days_until_minor_surgery','<=',7),a('wound_fully_healed','==',False)),'withhold','Withhold bevacizumab: ≥28days after major surgery AND fully healed before starting; withhold28days before major elective or7days before minor surgery, or per consultant.',8,['bevacizumab'])
  add('BEV_SURGERY_HEALING_UNKNOWN',all_(a('days_since_major_surgery','exists'),a('wound_fully_healed','missing')),'consultant_review','Confirm surgical wound is fully healed; elapsed days alone do not authorise bevacizumab restart.',8,['bevacizumab'])
 # Exact schedules, reference dose tables, no invented universal dose levels.
 ir=180 if rect else 165;fu=2400 if rect else 3200;fa=400 if rect else 200;hours=46 if rect else 48
 admin=[dict(day=1,drug=k,dose=dict(value=val,unit='mg/m2'+(' continuous IV over '+str(hours)+' hours' if k=='fluorouracil_infusion' else ' IV'))) for k,val in [('oxaliplatin',85),('folinic_acid',fa),('irinotecan',ir),('fluorouracil_infusion',fu)]]
 if not rect:admin=[admin[2],admin[0],admin[1],admin[3]]
 if bev:admin.insert(0,dict(day=1,drug='bevacizumab',dose=dict(value=5,unit='mg/kg IV')))
 p['treatment_phases']=[dict(phase_id='induction' if rect else 'main_cycle',name='FOLFIRINOX induction' if rect else 'Bevacizumab + FOLFOXIRI' if bev else 'FOLFOXIRI',cycle_length_days=14,**({'cycles':list(range(1,7))} if rect else {}),administration=admin,notes='No5-FU bolus. '+('Folinic acid200mg/m² may be considered.' if rect else 'Repeat until progression or unacceptable toxicity; consultant plans maintenance separately.'))]
 if rect:p['treatment_phases'].append(dict(phase_id='chemoradiation',name='Capecitabine with radiotherapy',cycle_length_days=7,cycles=list(range(1,6)),administration=[dict(day='1-5',drug='capecitabine',dose=dict(value=800,unit='mg/m2 PO twice daily'))],notes='After6 induction cycles;5weeks concurrent radiotherapy.825mg/m²BID alternative only at consultant discretion (NCCP00586).'))
 p['dose_levels']={'irinotecan':{'0':str(ir)+' mg/m²','-1':'150 mg/m²'},'oxaliplatin':{'0':'85 mg/m²','-1':('Source-specific:65 mg/m² transient grade3 neuropathy;60 mg/m² haematology/diarrhoea. No unified one-level ladder.' if rect else '60 mg/m² (haematology/diarrhoea); neuropathy uses25% reduction from current dose.')},'fluorouracil_infusion':{'0':str(fu)+' mg/m²','-1':('Table3 second neutropenic event2000 mg/m²; other source rows reduce CURRENT infusion by25%.' if rect else '2400 mg/m² (75% original)'),'-2':('No unified second reduction level: consultant review.' if rect else '1600 mg/m² (50% original)')}}
 if rect:p['dose_levels']['capecitabine']={'0':'800 mg/m² twice daily (825 alternative consultant-selected)','-1':'600 mg/m² twice daily','-2':'400 mg/m² twice daily','-3':'Third episode dose cell blank: consultant decision'}
 if bev:p['dose_levels']['bevacizumab']={'0':'5 mg/kg; hold or discontinue when indicated; no dose-reduction ladder'}
 p.setdefault('treatment',{}).update(cycle_length_days=14,schedule_summary=('FOLFIRINOX every14days×6, then capecitabine twice daily Days1–5 of each7-day cycle×5 with radiotherapy.' if rect else ('Bevacizumab5mg/kg plus ' if bev else '')+'FOLFOXIRI every14days until progression or unacceptable toxicity;5-FU pump48hours.'),drugs=[x['drug'] for ph in p['treatment_phases'] for x in ph['administration']])
 p['rule_engine']=dict(conflict_policy='Use the most restrictive applicable action per component; do not sum reductions. Consultant review/source gaps must not produce automatic numeric doses. Prior reduced doses must never be re-escalated by a reference table.',missing_data_policy='Do not infer missing values, occurrence numbers, recovery, phase or current doses.',rules=rules)
 # Remove stale legacy top-level domains/field requirements while retaining useful nonclinical display data.
 for key in ['required_inputs','assessment_profiles','decision_fields']:
  if key in p:del p[key]
 if 'profiles' in p:del p['profiles']
 m.update(nccp_version=v,source_url=S[c]['url'],source_document_pages=9 if not bev else 12,source_pdf_sha256=S[c]['pdf_sha256'],source_text_snapshot_sha256=hashlib.sha256((A/(c+'.txt')).read_bytes()).hexdigest(),source_checked_date='2026-11-04',sactcheck_encoding_version='0.84.33',clinical_audit_release='0.84.33',full_suite_release='0.84.33',partial_assessment_supported=True,current_source_id='nccp-'+c+'-v'+v)
 if c=='00555':m['previous_source_version']='6b'
 if rect:m.update(dose_schedule_context_input='treatment_phase',dose_schedule_context_kind='phase')
 m['drugs']=p['treatment']['drugs'];m.setdefault('validation',{}).update(source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,rule_level_source_reconciliation_status='source_reconciled_v08433_independent_review_pending')
 m.setdefault('encoding_maturity',{}).update(level='source_reconciled_pending_independent_validation',label='Source reconciled · independent clinical/pharmacy validation pending',source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,audit_release='0.84.33',audit_date='2026-11-04',reconciled_release='0.84.33',reconciled_date='2026-11-04',scope_note='Current official source reconciled including clinical thresholds, component actions, phase and missing-data safeguards; independent clinical/pharmacy sign-off remains pending.')
 p['clinical_governance']['disclaimer']='Decision support derived from NCCP '+c+' v'+v+'. Current official regimen, prescribing review and independent clinical/pharmacy validation remain authoritative.'
 if 'supportive_care' in p:p['supportive_care'].update(emetogenic_risk='high',mapping_source='NCCP '+c+' v'+v,mapping_source_url=S[c]['url'],mapping_basis='Source explicitly classifies the triplet regimen overall as HIGH emetic risk; '+('capecitabine chemoradiation phase separately minimal-to-low.' if rect else 'do not infer overall risk from individual drug grades.'),mapping_confidence='high')
 p['monitoring']=['Baseline FBC, renal/liver profile and DPD phenotype/genotype before first fluoropyrimidine (unless previously tested).','FBC, renal/liver profile before every cycle; assess peripheral neuropathy before proceeding.','ECG if compromised cardiac function / clinically relevant.','Disease assessment, imaging and tumour markers follow the consultant treatment plan; source does not mandate a universal scan interval.']+(['Baseline BP/cardiac history/exam and urine dipstick; each cycle urine protein and BP before and after treatment.','Consider ECHO after chest wall radiotherapy or prior anthracycline. INR if indicated; warfarin INR weekly until stable then before each cycle.'] if bev else [])
 p['eligibility']=['Source-listed indication; adequate haematological, renal and liver status.', 'ECOG0–1.' if rect else 'ECOG≤2 for adults under70; ECOG<1 for71–75; age70 is unassigned and needs review.']
 p['dose_modifications']=['Use the source table for the specific event and treatment phase. Do not infer a unified ladder, add reductions, reset prior reduced components to full dose, or treat a blank source cell as a dose.','Every entered clinical value is assessed independently; missing phase, occurrence, recovery and current dose history remain unassessed or trigger review.']
 p['source_audit_v08433']=dict(date='2026-11-04',folder=str(A.relative_to(R)),boundaries_require_review=([10,30] if c=='00555' else ['bilirubin85','AST180'])+(['capecitabineCrCl50to51','capecitabineThirdEpisodeBlank','oxaliplatinOneLevelUndefined'] if rect else []),all_independent_review_flags_false=True)
 import re
 prose_keys={'message','recommendation','explanation','label','notes','schedule_summary','mapping_basis','scope_note','dose_modification_note'}
 def readable(obj):
  if isinstance(obj,dict):
   for k,vv in obj.items():
    if k in prose_keys and isinstance(vv,str):
     vv=re.sub(r'(?<=[A-Za-z²])(?=[0-9])|(?<=[0-9])(?=[A-Za-z])',' ',vv);vv=re.sub(r'(?<=[,;])(?=[A-Za-z0-9])',' ',vv);obj[k]=vv
    else:readable(vv)
  elif isinstance(obj,list):
   for vv in obj:readable(vv)
 readable(p)
 f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');print(c,len(defs),'inputs',len(rules),'rules')
