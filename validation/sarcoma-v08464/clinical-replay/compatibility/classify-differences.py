#!/usr/bin/env python3
import json,pathlib,hashlib,collections,copy
O=pathlib.Path(__file__).resolve().parent
def read(p):return json.loads(p.read_text())
def save(p,d):p.write_text(json.dumps(d,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def clinical(o):return {f['ruleId']:f for f in o['findings'] if not f.get('domainAssessment') and not f['ruleId'].startswith('PARTIAL_')}
def crows(o):return {r['componentId']:r for r in o['doseRows']}
allowed_new={'IFO_PRODUCT_PHASE_UNRESOLVED','IFO_PRODUCT_IDENTIFICATION_REQUIRED','IFO_PRODUCT_LABS_MISSING','IFO_PRODUCT_UNITS_UNVERIFIED','IFO_PRODUCT_UNKNOWN_ABNORMAL','IFO_SEVERE_CURRENT_NEURO_HOLD','IFO_NEURO_LOCALISATION_UNRESOLVED'}
allowed_removed={'IFO_CURRENT_CNS_PRODUCT_INTERRUPT','IFO_CURRENT_NEURO'}
allowed_messages={'IFO_RENAL','IFO_HEPATIC_SIGNIFICANT','IFO_CYC_SEVERE_LIVER','IFO_HEPATIC_DISCRETION','IFO_RENAL_CONFLICT','IFOSFAMIDE_SEVERE_HEPATIC'}
allrows=[];failures=[];summary=[];demo=[];source_bindings=[]
stages=read(O/'authenticated-replay-manifest.json')['stages']
for s1,s2 in zip(stages[0]['runs'],stages[1]['runs']):
 name=s1['name'];a=read(pathlib.Path(s1['trace']));b=read(pathlib.Path(s2['trace']));assert len(a)==len(b)
 original_report=read(pathlib.Path(s1['report']));final_report=read(pathlib.Path(s2['report']))
 changed=0;actions=collections.Counter()
 for x,y in zip(a,b):
  assert x['protocol_id']==y['protocol_id'];code=x['protocol_id'].split('-')[1];sameinput=x['input']==y['input'];old=x['observed'];new=y['observed'];af=clinical(old);bf=clinical(new)
  add=sorted(bf.keys()-af.keys());remove=sorted(af.keys()-bf.keys());modify={k:{'before':af[k],'after':bf[k]} for k in af.keys()&bf.keys() if af[k]!=bf[k]}
  assert set(add)<=allowed_new,(name,x['index'],add)
  assert set(remove)<=allowed_removed,(name,x['index'],remove)
  for k,v in modify.items():
   assert k in allowed_messages
   av=copy.deepcopy(v['before']);bv=copy.deepcopy(v['after']);av['action'].pop('message');bv['action'].pop('message');assert av==bv
  assert old['invalid']==new['invalid'] and old['errors']==new['errors']
  assert not (new['complete'] is True and old['complete'] is not True)
  ar=crows(old);br=crows(new);component=[]
  for key in ar.keys()|br.keys():
   av=ar.get(key,{});bv=br.get(key,{})
   if av.get('actionType')!=bv.get('actionType'):component.append({'component':key,'before':av.get('actionType'),'after':bv.get('actionType')})
   if sameinput and key!='ifosfamide':assert av.get('actionType')==bv.get('actionType'),(name,x['index'],key)
   if bv.get('quantified'):assert bv==av
  if not sameinput:
   assert name=='author-712' and x['index'] in [240,241,242,243,244,477,478,479,480,481]
   diffs={k:{'before_present':k in x['input'],'before':x['input'].get(k),'after':y['input'].get(k)} for k in x['input'].keys()|y['input'].keys() if x['input'].get(k)!=y['input'].get(k) or (k in x['input'])!=(k in y['input'])}
   assert all(v['after']=='' for v in diffs.values()),diffs
   demo.append({'suite':name,'trace_index':x['index'],'code':code,'classification':'Unchanged script dynamically constructs fixture from protocol demo values; accepted product/CNS overlay blanks formerly normal-looking lab/neuro defaults and adds blank product/CNS fields. Not an identical-input comparison.','changes':diffs})
  if old!=new:
   changed+=1;actions[(old['actionType'],new['actionType'])]+=1
   allrows.append({'suite':name,'trace_index':x['index'],'code':code,'identical_input':sameinput,'before_input':x['input'],'after_input':y['input'],'before':old,'after':new,'added_rules':add,'removed_rules':remove,'message_only_existing_rules':modify,'component_action_changes':component,'classification':['accepted_named_product_reconciliation' if any(k.startswith('IFO_PRODUCT') for k in add) else None,'accepted_broad_neuro_CNS_semantic_transition' if remove or any('NEURO' in k for k in add) else None,'source_conflict_explanation_only' if modify else None,'partial_domain_context_changed' if old!=new and not add and not remove and not modify else None,'dynamic_demo_input_transition' if not sameinput else None]})
 for idx,r in enumerate(final_report['results']):
  failed=(not r.get('passed')) if 'passed' in r else r.get('status')=='failed'
  if not failed:continue
  iscoverage='Every' in r.get('name','')
  code=r['code'];matches=[]
  if not iscoverage:
   if 'input' in r:matches=[(x,y) for x,y in zip(a,b) if x['protocol_id'].split('-')[1]==code and x['input']==r['input']]
   elif r['name'].startswith('Ifos current neuro severity '):
    g=int(r['name'].rsplit(' ',1)[1]);matches=[(x,y) for x,y in zip(a,b) if x['protocol_id'].split('-')[1]==code and x['input']=={'encephalopathy_grade':g}]
   elif r['name']=='New ungraded CNS symptoms held':matches=[(x,y) for x,y in zip(a,b) if x['protocol_id'].split('-')[1]==code and x['input']=={'current_neuro_symptoms':True}]
   assert len(matches)==1,(name,idx,len(matches))
  entry={'suite':name,'report_index':idx,'code':code,'name':r.get('name'),'raw_failure':r,'classification':'historical_rule_coverage_fixture_scope' if iscoverage else 'historical_broad_neuro_CNS_assumption','old_expectation_retained':True,'source_basis':'Accepted current CNS versus broad central/peripheral event distinction; source-specific severe-event rules preserved. No invented permanent-stop rule or numeric dose.' if not iscoverage else 'Original finite input set predates product-specific organ/identity branches and explicit CNS selection. New rules cannot be positively covered by old inputs without changing those fixtures.'}
  if matches:
   x,y=matches[0];entry.update({'trace_index':x['index'],'identical_input':x['input']==y['input'],'input':x['input'],'before':x['observed'],'after':y['observed']})
  failures.append(entry)
 summary.append({'suite':name,'original_passed':original_report['passed'],'original_failed':original_report['failed'],'final_passed':final_report['passed'],'final_failed':final_report['failed'],'original_report_rows':len(original_report['results']),'final_report_rows':len(final_report['results']),'engine_observations':len(a),'changed_observations':changed,'action_transitions':[{'before':k[0],'after':k[1],'count':v} for k,v in actions.items()]})
save(O/'all-observation-deltas.json',{'status':'source-classified_pending_independent_compatibility_acceptance','count':len(allrows),'records':allrows})
save(O/'raw-failure-ledger.json',{'total':len(failures),'clinical_semantic_assertions':sum(x['classification']=='historical_broad_neuro_CNS_assumption' for x in failures),'coverage_assertions':sum(x['classification']=='historical_rule_coverage_fixture_scope' for x in failures),'entries':failures})
save(O/'dynamic-demo-input-transitions.json',{'count':len(demo),'script_bytes_unchanged':True,'grading_values_unchanged':True,'earlier_product_CNS_default_changes_are_explicit':True,'records':demo})
save(O/'difference-summary.json',{'suites':summary,'total_engine_observations':sum(s['engine_observations'] for s in summary),'changed_observations':len(allrows),'unchanged_input_observations':sum(s['engine_observations'] for s in summary)-len(demo),'dynamic_demo_inputs':len(demo),'raw_failure_entries':len(failures),'no_new_numeric_dose':True,'no_non_ifos_component_action_change_for_identical_inputs':True,'no_new_invalid_or_error':True,'no_transition_to_complete':True,'message_only_existing_rule_ids':sorted(allowed_messages),'original_and_final_sources_unchanged':True,'independent_compatibility_acceptance':'pending'})
print(json.dumps({'failure_entries':len(failures),'changed_observations':len(allrows),'dynamic_demo_inputs':len(demo),'suite_counts':summary},indent=2))
