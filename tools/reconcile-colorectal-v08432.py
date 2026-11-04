"""Source-specific corrections; never infer omitted clinical inputs or resolve source gaps by rounding."""
from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[1]
NEW=['00660','00421','00427','00428','00486'];RETRO=['00209','00321','00227','00586','00623']
def save(p,d):
 p=R/p;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def atom(f,o,v):return dict(field=f,operator=o,value=v)
def both(*x):return {'all':list(x)}
def either(*x):return {'any':list(x)}
def select(label,values):return dict(label=label,type='select',required=False,demo_value='',input_role='decision',options=[dict(value=v,label=t) for v,t in values])
def boolean(label):return dict(label=label,type='boolean',required=False,demo_value='',input_role='decision')
def number(label,max=1000):return dict(label=label,type='number',required=False,min=0,max=max,step=.1,demo_value='',input_role='decision')
for c in NEW+RETRO:
 f=next((R/'protocols').glob('*/'+c+'-*'));p=json.loads(f.read_text());old=copy.deepcopy(p);defs=p['input_definitions'];rules=p['rule_engine']['rules'];m=p['metadata']
 def ident(r):return r.get('id',r.get('rule_id'))
 def remove(*ids):rules[:]=[r for r in rules if ident(r) not in ids]
 def get(i):return next(r for r in rules if ident(r)==i)
 def add(i,cond,typ,msg,page,components=None,changes=None):
  remove(i);a=dict(type=typ,components=components or ['whole_regimen'],message=msg,recommendation=msg)
  if changes:a['component_changes']=changes
  rules.append(dict(id=i,priority=30,when=cond,action=a,explanation=msg,source=dict(document='NCCP '+c+' v'+str(m['nccp_version']),page=page,url=m['source_url'])))
 if c in NEW:
  findings=json.loads((R/'validation/colorectal-v08432/new-source-audit/findings.json').read_text())['sources'][c]
  m['nccp_version']=findings['current_version'];m['source_pdf_sha256']=findings['pdf_sha256'];m['source_text_snapshot_sha256']=findings['text_sha256']
  # Stable protocol identifiers retain saved links; source version lives in metadata and sources.
  if c=='00421':m['previous_source_version']='4';m['current_source_id']='nccp-00421-v6'
  if c=='00660':
   for name in ['hypersensitivity','pregnancy','breastfeeding','recent_or_concomitant_brivudine','grade4_neutropenia_with_grade2_fever','bilirubin_umol_l','ast_u_l']:defs[name]['input_role']='decision'
   defs['toxicity_delay_weeks']['max']=12
   defs['fluorouracil_renal_impairment']=select('Clinical renal impairment (5-FU)',[('none_mild_moderate','None, mild or moderate'),('severe','Severe')])
   defs['ecog']=select('ECOG performance status',[(i,str(i)) for i in range(5)])
   defs['cardiac_risk']=boolean('Recent MI or uncontrolled cardiac disease')
   defs['baseline_loose_bm_gt3']=boolean('Baseline >3 loose stools/day, without a stoma')
   add('ECOG_REVIEW',atom('ecog','>',2),'consultant_review','ECOG outside the source 0-2 eligibility range; consultant review.',1)
   add('CARDIAC_RISK_REVIEW',atom('cardiac_risk','==',True),'consultant_review','Recent MI, uncontrolled angina, hypertension, arrhythmia or CHF requires review; ECG if compromised cardiac function.',2)
   add('BASELINE_BOWEL_REVIEW',atom('baseline_loose_bm_gt3','==',True),'consultant_review','Baseline >3 loose bowel movements/day without stoma is a source caution; assess before treatment.',2)
   for key in ['hypersensitivity','pregnancy','breastfeeding']:add('EXCLUDE_'+key.upper(),atom(key,'==',True),'contraindicated','NCCP exclusion: '+key+'. Do not administer pending specialist assessment.',2)
   add('DPD_UNKNOWN',atom('dpd_status','==','unknown'),'consultant_review','Verify DPD testing before first fluorouracil; an unknown result cannot be assumed normal.',2,['fluorouracil'])
   remove('LOW_NADIR_PLT','STOMATITIS_G3_4')
   get('PLT_PERSISTENT')['all'][1]['value']=4;get('PLT_PERSISTENT')['explanation']='Platelets remain <75 at the four-week review; source says discontinue after 4 weeks.'
   add('PLT_DELAY_SOURCE_GAP',both(atom('toxicity_delay_weeks','>',2),atom('toxicity_delay_weeks','<',4)),'consultant_review','Platelet table specifies recovery within 2 weeks but discontinuation after 4 weeks. Resolve the intervening interval with the consultant; do not infer restart from recovered platelets alone.',3)
   add('PLT_NADIR_MAINTAIN',atom('lowest_platelets_during_delay_x10e9_l','<',75),'consultant_review','All platelet-nadir bands in Table 2 maintain the 5-FU dose level. Hold while current platelets <75; confirm recovery and delay duration. No platelet-only automatic reduction.',3,['fluorouracil_bolus','fluorouracil_infusion'])
   for name in ['LOW_NADIR_ANC','DIARRHOEA_G3_4']:
    r=get(name);cond={k:r.pop(k) for k in ['field','operator','value']};cur='anc_x10e9_l' if name=='LOW_NADIR_ANC' else 'diarrhoea_current_grade';r['when']=both(cond,atom(cur,'>=' if name=='LOW_NADIR_ANC' else '<',1 if name=='LOW_NADIR_ANC' else 2));r['action']['component_changes']={k:{'dose_level_change':-1} for k in ['fluorouracil_bolus','fluorouracil_infusion']}
   for g,levels in [(3,1),(4,2)]:add('STOMATITIS_G'+str(g),both(atom('stomatitis_highest_grade','==',g),atom('stomatitis_current_grade','<',2)),'dose_reduce',f'After recovery below grade 2, reduce both 5-FU components by {levels} dose level(s). Folinic acid stays 400 mg/m²; omit/delay with bolus 5-FU.',5,['fluorouracil_bolus','fluorouracil_infusion'],{k:{'dose_level_change':-levels} for k in ['fluorouracil_bolus','fluorouracil_infusion']})
   for tox in ['diarrhoea','stomatitis']:add(tox.upper()+'_PERSISTENT',both(atom(tox+'_current_grade','>=',2),atom('toxicity_delay_weeks','>=',2)),'discontinue','Grade 2 or worse '+tox+' persists at the two-week review: source discontinuation pathway.',4)
   add('PRIOR_FEBRILE_NEUTROPENIA',atom('grade4_neutropenia_with_grade2_fever','==',True),'consultant_review','Prior grade 4 neutropenia with ≥grade 2 fever requires one-level 5-FU reduction after recovery. Confirm current counts, resolution of infection and current dose levels; this does not authorise treatment during fever.',3,['fluorouracil_bolus','fluorouracil_infusion'])
   add('RENAL_SEVERE',atom('fluorouracil_renal_impairment','==','severe'),'consultant_review','Severe renal impairment: consider 5-FU reduction. Uracil-based DPD phenotyping may be unreliable; consider genotype.',4,['fluorouracil'])
   add('HEPATIC_ABSOLUTE',either(atom('bilirubin_umol_l','>',85),atom('ast_u_l','>',180)),'contraindicated','5-FU contraindicated in source table when bilirubin >85 µmol/L or AST >180 U/L.',4,['fluorouracil'])
   bili,ast='bilirubin_umol_l','ast_u_l'
  else:
   bili,ast='fluorouracil_bilirubin_umol_l','fluorouracil_ast_u_l'
   if c!='00486':get('PLATELETS_BELOW_SAFE_TREATMENT_RANGE')['when']['value']=100;get('PLATELETS_BELOW_SAFE_TREATMENT_RANGE')['action']['message']='Platelets <100 ×10⁹/L: delay until recovery (source haematological table).'
   defs['prior_febrile_neutropenia']=boolean('Febrile neutropenia in previous treatment interval')
   components=['fluorouracil','oxaliplatin'] if c=='00486' else ['fluorouracil']
   add('SEVERE_COUNTS_REDUCTION_REVIEW',either(atom('anc_x10e9_l','<',.5),atom('platelets_x10e9_l','<',50)),'withhold','Delay until recovery; consider a 25% reduction of '+ ' and '.join(components)+' for subsequent treatment. Confirm the consultant decision; do not automatically calculate a dose.',3 if c!='00421' else 2,components)
   add('PREVIOUS_FN_REVIEW',atom('prior_febrile_neutropenia','==',True),'consultant_review','Review prior febrile neutropenia and recovery. '+('Source advises considering 25% reduction of '+ ' and '.join(components)+'.' if c!='00421' else 'The source has no separate FN percentage row; consultant determines subsequent dosing.'),3 if c!='00421' else 2,components)
   if c=='00421':
    for rid in ['DIARRHOEA_GRADE_2_PLUS','MUCOSITIS_GRADE_2_PLUS','SEVERE_OTHER_TOXICITY']:
     r=get(rid);r['source']['document']='Clinical safety review; NCCP 00421 does not specify a graded non-haematological reduction matrix';r['action']['message']='Withhold pending clinical review of significant toxicity. NCCP 00421 has no occurrence-based reduction table; do not import bolus 5-FU percentages.';r['explanation']=r['action']['message']
   if c in ['00427','00428']:
    remove('OF590_'+c+'_5FU_HEP_SEV')
    add('SEVERE_LIVER_EXCLUSION_CONFLICT',atom('fluorouracil_hepatic_impairment','==','severe'),'contraindicated','Severe liver impairment is excluded on page 2, although the dose table lists a half-dose option. Do not automatically prescribe 50%; consultant/pharmacy must resolve this source conflict.',2,['fluorouracil'])
   if c=='00486':
    remove('OXALIPLATIN_SEVERE_RENAL','OXALIPLATIN_DIALYSIS','OF590_00486_OXALI_LT30','OF590_00486_OXALI_DIALYSIS','OF590_00486_5FU_RENAL_SEVERE','OXALIPLATIN_NEUROPATHY_G2')
    defs['oxaliplatin_renal_band']['options']=[dict(value=v,label=t) for v,t in [('gt30','CrCl >30 mL/min'),('eq30','CrCl exactly 30 mL/min'),('lt30','CrCl <30 mL/min'),('dialysis','Haemodialysis')]]
    defs['oxaliplatin_renal_band']['demo_value']='';defs['neuropathy_persistent']=boolean('Grade 2 neuropathy persists at start of cycle')
    add('PLATELETS_75_TO_100_CHOICE',both(atom('platelets_x10e9_l','>=',75),atom('platelets_x10e9_l','<',100)),'consultant_review','Default table delays below 100; footnote permits clinician choice to proceed at 75-100. Confirm explicit decision; no automatic clearance.',3)
    add('OXALI_RENAL_EXACT30',atom('oxaliplatin_renal_band','==','eq30'),'consultant_review','Source uses >30 and <30 mL/min; exactly 30 is unassigned. Resolve with consultant/pharmacy without rounding.',4,['oxaliplatin'])
    add('OXALI_RENAL_LT30',atom('oxaliplatin_renal_band','==','lt30'),'consultant_review','CrCl <30: consider 50% of original oxaliplatin dose; requires consultant/pharmacy choice.',4,['oxaliplatin'])
    add('OXALI_RENAL_DIALYSIS',atom('oxaliplatin_renal_band','==','dialysis'),'consultant_review','Haemodialysis: consider 50% oxaliplatin with haemodialysis within 1.5 hours after administration. Confirm specialist prescription and timing.',4,['oxaliplatin'])
    add('OXALI_RENAL_LEGACY_BAND',atom('oxaliplatin_renal_band','==','ge30'),'consultant_review','Previously saved ≥30 renal band cannot distinguish exactly 30. Re-enter the source-specific renal category.',4,['oxaliplatin'])
    add('FIVEFU_RENAL_SOURCE',atom('fluorouracil_renal_impairment','==','severe'),'consultant_review','FLOX v8 expects no 5-FU renal dose adjustment, including haemodialysis. Assess other risks and reliability of uracil DPD phenotyping; oxaliplatin has separate rules.',4,['fluorouracil'])
    add('NEUROPATHY_G2',atom('neuropathy_grade','==',2),'consultant_review','Grade 2 at cycle start: assess persistence; source advises reducing oxaliplatin by 25% if persistent and considering omission. Do not change other drugs on this basis.',5,['oxaliplatin'])
    add('NEUROPATHY_G3_4',atom('neuropathy_grade','>=',3),'discontinue','Discontinue oxaliplatin for grade 3-4 neuropathy. This is not an instruction to discontinue all components.',5,['oxaliplatin'])
    # Source explicitly excludes breastfeeding; pregnancy requires specialist risk assessment.
    remove('PREGNANCY_OR_BREASTFEEDING');add('BREASTFEEDING_EXCLUSION',atom('breastfeeding','==',True),'contraindicated','Breastfeeding is an NCCP exclusion.',2)
    add('PREGNANCY_REVIEW',atom('pregnancy','==',True),'withhold','Pregnancy requires urgent oncology/obstetric and pharmacy assessment before chemotherapy. This safety review is not an additional NCCP-listed exclusion.',2)
   if c in ['00427','00428','00486']:
    for tox,field in [('DIARRHOEA','diarrhoea'),('MUCOSITIS','mucositis'),('HFS','hand_foot')]:
     if field+'_grade' not in defs:defs[field+'_grade']=select('Current hand-foot syndrome grade',[(i,'Grade '+str(i)) for i in range(4)])
     defs[field+'_worst_grade']=copy.deepcopy(defs[field+'_grade']);defs[field+'_worst_grade'].update(label='Worst '+field.replace('_',' ')+' grade in this episode',demo_value='')
     defs[field+'_occurrence']=select('Occurrence of this '+field.replace('_',' ')+' severity',[(i,str(i)) for i in [1,2,3,4]])
     add(tox+'_GRADE_2_PLUS',atom(field+'_grade','>=',2),'withhold','Delay '+field.replace('_',' ')+' grade ≥2 until grade ≤1; then use worst grade and occurrence to determine subsequent treatment.',5 if c=='00486' else 4)
     comps=['fluorouracil','oxaliplatin'] if c=='00486' and tox!='HFS' else ['fluorouracil']
     for grade,occ,pct in [(2,1,100),(2,2,75),(2,3,50),(2,4,0),(3,1,50),(3,2,0),(4,1,50),(4,2,0)]:
      cond=both(atom(field+'_grade','<=',1),atom(field+'_worst_grade','==',grade),atom(field+'_occurrence','>=' if pct==0 else '==',occ))
      typ='omit' if pct==0 else 'consultant_review' if pct==100 else 'dose_reduce'
      msg=('Omit '+ ' and '.join(comps)+'.' if pct==0 else 'After recovery to grade ≤1, '+('maintain dose' if pct==100 else 'use '+str(pct)+'% of the source reference dose')+' for '+ ' and '.join(comps)+'.')+' Confirm prior reductions and prescription; do not re-escalate a previously reduced dose. Folinic acid is held/omitted with 5-FU.'
      add(f'{tox}_G{grade}_O{occ}',cond,typ,msg,5 if c=='00486' else 4,comps,{k:{'omit':True} if pct==0 else {'dose_percent_of_original':pct} for k in comps} if pct!=100 else None)
    # Grade/occurrence missing after toxicity must not imply that a dose is safe.
  add('HEPATIC_EXACT_BOUNDARY',either(atom(bili,'==',85),atom(ast,'==',180)),'consultant_review','Exactly bilirubin 85 µmol/L or AST 180 U/L is not assigned by the strict < and > source table. Consultant/pharmacy review; no automatic full dose.',4 if c in ['00660','00486'] else 3,['fluorouracil'])
  if 'recent_or_concomitant_brivudine' not in defs:defs['recent_or_concomitant_brivudine']=boolean('Recent/concomitant brivudine, sorivudine or analogue')
  add('BRIVUDINE_INTERACTION',atom('recent_or_concomitant_brivudine','==',True),'contraindicated','Do not combine fluorouracil with brivudine/sorivudine or analogues. Verify the required washout in current product information with pharmacy.',6 if c=='00660' else 4,['fluorouracil'])
  m.update(full_suite_release='0.84.32',sactcheck_encoding_version='0.84.32')
 if c in ['00209','00321']:
  for r in rules:
   if r['action']['type']=='withhold' and 'all' in r:
    r['all']=[x for x in r['all'] if not (x.get('field') in ['delay_weeks','toxicity_delay_weeks','diarrhoea_duration_weeks','stomatitis_duration_weeks'] and x.get('operator')=='<')]
  if c=='00321':add('RENAL_DECIMAL_GAP',both(atom('crcl_ml_min','>',50),atom('crcl_ml_min','<',51)),'consultant_review','Source assigns CrCl 30-50 and 51-80; values between 50 and 51 are unassigned. Do not round to choose capecitabine dose.',4,['capecitabine'])
 if c=='00227':
  add('DIARRHOEA_RECOVERY_CONFLICT',atom('diarrhoea_current_grade','==',1),'consultant_review','Narrative requires treatment-related diarrhoea fully resolved before irinotecan, while Table 4 allows recovery below grade 2. Grade 1 requires consultant review before restart.',3,['irinotecan'])
  defs['renal_impairment_present']=boolean('Clinically impaired renal function (FOLFIRI source exclusion conflict)')
  add('RENAL_SOURCE_EXCLUSION_CONFLICT',atom('renal_impairment_present','==',True),'consultant_review','Source exclusion lists impaired renal function but dose table supplies renal options. Resolve the discrepancy with consultant/pharmacy; do not select a dose automatically.',2,['irinotecan'])
 m.update(source_checked_date='2026-11-04',clinical_audit_release='0.84.32')
 m.setdefault('validation',{}).update(source_document_checked=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,rule_level_source_reconciliation_status='source_reconciled_v08432_independent_review_pending')
 m.setdefault('encoding_maturity',{}).update(source_reconciled=True,reconciled_release='0.84.32',reconciled_date='2026-11-04',clinical_use_authorised=False)
 for r in rules:
  if c in NEW and r.get('source',{}).get('document') in ['Current mapped NCCP source','Current official NCCP regimen']:r['source'].update(document='NCCP '+c+' v'+str(m['nccp_version']),url=m['source_url'])
 save(str(f.relative_to(R)),p)
 save('validation/colorectal-v08432/protocol-before/'+c+'.json',old)
 print(c,len(old['rule_engine']['rules']),'->',len(rules))
