#!/usr/bin/env python3
import json,pathlib
O=pathlib.Path(__file__).resolve().parent
def read(p):return json.loads(p.read_text())
cases=[]
for row in read(O/'raw-failure-ledger.json')['entries']:
 if row['classification']!='historical_broad_neuro_CNS_assumption':continue
 inp=row['input'];code=row['code'];grade=inp.get('current_ifos_neuro_grade',inp.get('encephalopathy_grade'))
 required=['IFO_NEURO_LOCALISATION_UNRESOLVED'] if grade is None or grade<3 else ['IFO_SEVERE_CURRENT_NEURO_HOLD',('IFO_NEURO_STOP' if code=='00754' else 'IFO_CURRENT_NEURO')]
 cases.append({'name':row['name'],'code':code,'input':inp,'kind':'unchanged_historical_neuro_input','historical':{'suite':row['suite'],'trace_index':row['trace_index']},'required':required,'forbidden':['IFO_CURRENT_NEURO' if code=='00754' else 'IFO_CURRENT_CNS_PRODUCT_INTERRUPT'],'ifos_action':'discontinue' if code=='00754' and grade is not None and grade>=3 else 'withhold','no_permanent_stop':code!='00754' or grade is None or grade<3})
traces=read(O/'original-accepted/independent-213-trace.json')
for i in [147,148,149,150,151,194,195,196,197,198]:
 row=traces[i];code=row['protocol_id'].split('-')[1];inp=row['input'];renal=inp['crcl_ml_min']<50 or inp.get('haemodialysis')
 cases.append({'name':'Historical actual renal input '+str(inp['crcl_ml_min'])+' dialysis '+str(inp.get('haemodialysis')),'code':code,'input':inp,'kind':'unchanged_historical_renal_input','historical':{'suite':'independent-213','trace_index':i},'required':['IFO_PRODUCT_IDENTIFICATION_REQUIRED','IFO_PRODUCT_LABS_MISSING','IFO_PRODUCT_UNITS_UNVERIFIED']+(['IFO_RENAL'] if renal else []),'forbidden':[],'ifos_action':'withhold','preserve_non_ifos_actions':True,'no_permanent_stop':True})
product={'ifosfamide_product':'mitoxana_pa2299_028_001','ifosfamide_laboratory_units_verified':True,'serum_creatinine_umol_l':80,'bilirubin_umol_l':10,'alt_uln_multiple':1,'ast_uln_multiple':1,'alp_uln_multiple':1}
unknown_rules=['IFO_PRODUCT_IDENTIFICATION_REQUIRED','IFO_PRODUCT_LABS_MISSING','IFO_PRODUCT_UNITS_UNVERIFIED','IFO_PRODUCT_PHASE_UNRESOLVED','IFO_PRODUCT_UNKNOWN_ABNORMAL']
for code in ['00675','00747','00754']:
 if code=='00754':
  base=read(O/'original-accepted/independent-12-trace.json')[4]['input'];grade_field='encephalopathy_grade';current_id='IFO_CURRENT_NEURO'
 else:base=next(x['input'] for x in traces if x['protocol_id'].split('-')[1]==code and x['input'].get('crcl_ml_min')==50.01);grade_field='current_ifos_neuro_grade';current_id='IFO_CURRENT_CNS_PRODUCT_INTERRUPT'
 base={**base,**product,'crcl_ml_min':80}
 if code!='00754':base['haemodialysis']=False
 for cns in [True,False]:
  inp={**base,grade_field:1,'current_ifosfamide_cns_toxicity':cns}
  cases.append({'name':'Known grade1 '+('current CNS event' if cns else 'explicitly non-CNS event')+' with verified product and actual labs','code':code,'input':inp,'kind':'explicit_current_event_control','required':[current_id if cns else 'IFO_NON_CNS_NEURO_REVIEW'],'forbidden':unknown_rules+(['IFO_NEURO_LOCALISATION_UNRESOLVED'] if cns else [current_id,'IFO_NEURO_LOCALISATION_UNRESOLVED']),'ifos_action':'withhold' if cns else 'consultant_review','no_permanent_stop':True})
 inp={**base,'crcl_ml_min':49 if code=='00754' else 10,grade_field:0,'current_ifosfamide_cns_toxicity':False}
 cases.append({'name':'NCCP low-CrCl review remains after separate product/lab reconciliation','code':code,'input':inp,'kind':'product_resolved_renal_control','required':['IFO_RENAL'],'forbidden':unknown_rules+['IFO_NEURO_LOCALISATION_UNRESOLVED',current_id],'ifos_action':'consultant_review','no_permanent_stop':True,'etoposide_action':'consultant_review' if code!='00754' else None})
assert len(cases)==32
(O/'current-contract-cases.json').write_text(json.dumps({'scope':'23 unchanged historical inputs plus9 explicit context controls; no replacement of original1508 assertions','cases':cases},indent=2)+'\n')
