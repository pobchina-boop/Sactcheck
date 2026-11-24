#!/usr/bin/env python3
import json,pathlib,hashlib,collections
R=pathlib.Path(__file__).resolve().parent
def read(p):return json.loads(p.read_text())
def save(p,v):p.write_text(json.dumps(v,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=read(R/'authenticated-replay-manifest.json')
by_stage={s['stage']:s for s in manifest['stages']}
transitions=read(R.parent/'transition-manifest.json')
allowed=set()
for p in transitions['protocols']:
 before=read(R.parent/p['before']);after=read(R.parent/p['candidate'])
 old=before['rule_engine']['rules'];new=after['rule_engine']['rules']
 assert new[:len(old)]==old
 allowed.update(r['rule_id'] for r in new[len(old):])
assert len(allowed)==6
analysis={'date':'2026-11-18','no_fixture_or_assertion_changes':True,'source_originals_and_application_unchanged':True,'allowed_appended_rule_ids':sorted(allowed),'stages':{},'prior_accepted_transition_failures':[],'new_assertion_failures':[],'new_output_deltas':[],'clinical_approval':False,'pharmacy_approval':False}
for stage,s in by_stage.items():
 analysis['stages'][stage]={}
 for run in s['runs']:
  report=read(pathlib.Path(run['report']))
  records=report.get('results',report.get('cases'));assert isinstance(records,list)
  failures=[r for r in records if r.get('passed') is False or r.get('status')=='failed']
  analysis['stages'][stage][run['name']]={'passed':run['passed'],'failed':run['failed'],'case_count':len(records),'failure_cases':[{'code':r['code'],'name':r['name'],'error':r['error'].split('    at')[0]} for r in failures]}
for suite in ['author-303','author-347','independent-197']:
 a=read(R/'accepted-before'/f'{suite}-trace.json');b=read(R/'corrected-after'/f'{suite}-trace.json')
 assert len(a)==len(b)
 for i,(x,y) in enumerate(zip(a,b)):
  assert x['protocol_id']==y['protocol_id'] and x['input']==y['input']
  if x['observed']==y['observed']:continue
  old={f['ruleId']:f for f in x['observed']['findings']};new={f['ruleId']:f for f in y['observed']['findings']}
  added=set(new)-set(old);removed=set(old)-set(new)
  derived={'PARTIAL_CYCLE_DAY_NO_RESTRICTION','PARTIAL_CYCLE_DAY_CONTEXT_REQUIRED'}
  assert added and added<=allowed|derived and removed<=derived
  assert all(new[k]==v for k,v in old.items() if k in new),'Existing finding changed'
  for k in ['actionType','complete','coverageComplete','invalid','errors']:assert x['observed'][k]==y['observed'][k],f'Unexpected top-level change: {suite}/{i}/{k}'
  inp=x['input']
  if 'IE_ADMINISTRATION_DAY_REVIEW' in added:
   assert inp.get('assessment_phase')=='treatment' or inp.get('restart_requested') is True
   assert inp.get('cycle_day') not in [1,2,3,4,5]
  analysis['new_output_deltas'].append({'suite':suite,'trace_index':i,'protocol_id':y['protocol_id'],'input':y['input'],'added_findings':[new[k] for k in sorted(added)],'removed_engine_derived_findings':[old[k] for k in sorted(removed)],'original_authored_clinical_findings_preserved':True,'overall_action_unchanged':y['observed']['actionType'],'completeness_and_invalid_unchanged':True})
 for fail in analysis['stages']['corrected-after'][suite]['failure_cases']:
  prior=next((r for r in analysis['stages']['accepted-before'][suite]['failure_cases'] if r['code']==fail['code'] and r['name']==fail['name']),None)
  if prior is None:
   assert fail['code']=='00100' and fail['name']=='Every authored rule positively exercised'
   analysis['new_assertion_failures'].append({**fail,'classification':'Historical exhaustive coverage assertion has no fixtures for the three newly appended mifamurtide context review rules; not a changed clinical result.'})
  else:
   if 'Every authored rule' in fail['name']:classification='Historical exhaustive coverage predates accepted product/CNS rules. For00680, the two additional context rules also remain unexercised in the unchanged historical suite.'
   elif 'Current neurotoxicity' in fail['name']:classification='Historical assertion requires NEURO_NOW by ID from an unlocalised grade-only fixture. Accepted CNS clarification now emits localisation/severe-current review or hold as appropriate; this predates the six-rule correction.'
   else:
    assert suite=='independent-197' and fail['name'].startswith('Renal value versus reassuring band')
    classification='Historical fixture lacks supplied-product identity/verified organ context. Accepted product gate withholds ifosfamide, so original exact consultant_review action assertion fails; unchanged by the six-rule correction.'
   analysis['prior_accepted_transition_failures'].append({**fail,'classification':classification,'also_failed_before_correction':True})
analysis['delta_summary']={'new_clinical_assertion_failures':0,'new_historical_coverage_assertion_failures':len(analysis['new_assertion_failures']),'pre_existing_failed_assertions':len(analysis['prior_accepted_transition_failures']),'changed_observation_calls_by_suite':dict(collections.Counter(r['suite'] for r in analysis['new_output_deltas'])),'added_findings_counts':dict(collections.Counter(f['ruleId'] for r in analysis['new_output_deltas'] for f in r['added_findings'])),'removed_engine_derived_findings_counts':dict(collections.Counter(f['ruleId'] for r in analysis['new_output_deltas'] for f in r['removed_engine_derived_findings'])),'existing_authored_clinical_findings_removed_or_modified':0,'overall_action_or_completeness_changes':0,'note':'Assessment call counts are not assertion counts: some structural/UI cases call the engine zero or multiple times. New context rules are assessed by the separate focused suite owned by the source author; no pass total for that suite is asserted here.'}
for p,h in manifest['runtime_and_original_hashes'].items():assert sha(pathlib.Path(p))==h
save(R/'replay-delta-classification.json',analysis)
summary='''# Original v63 assertions: authenticated bounded replay

The accepted clinical checkpoint contains **650 author assertions = 347 mifamurtide/ifosfamide + 303 MAP/doxorubicin–cisplatin**, plus **197 independent assertions**. The earlier message describing358+292 was inaccurate; retained original records were not edited.

| Exact historical suite | Original clinical snapshot | Accepted product/CNS snapshot | Six-rule correction candidate |
|---|---:|---:|---:|
| Mifamurtide/ifosfamide |347 pass,0 fail|337 pass,10 fail|336 pass,11 fail|
| MAP/doxorubicin–cisplatin |303 pass,0 fail|303 pass,0 fail|303 pass,0 fail|
| Independent |197 pass,0 fail|191 pass,6 fail|191 pass,6 fail|

The correction introduces **no new clinical assertion failure**. Its one newly failed historical assertion is an exhaustive rule-coverage check: the original mifamurtide fixtures do not exercise the three newly appended context rules. The pre-existing00680 coverage failure additionally lists its two new context rules. The separate focused correction suite is needed to verify those new paths.

The eight earlier author failures demand the old NEURO_NOW rule ID from unlocalised grade-only fixtures. Accepted CNS semantics now require localisation and preserve current severe-event holds. Two earlier coverage failures predate the product/CNS additions. Six independent renal cases still expect an exact consultant_review component action despite missing product context; the already accepted product gate withholds treatment. These failures were present before this correction and remain preserved, not relabelled as passing tests.

Before-versus-after engine traces show the appended IE_ADMINISTRATION_DAY_REVIEW finding in treatment/restart cases with a missing or out-of-range cycle day. A mifamurtide demo call also gains the three new context findings. Three cycle-day observations replace/remove derived partial-domain summaries: a day-only input changes NO_RESTRICTION to CONTEXT_REQUIRED, and two independent restart fixtures replace their derived summary with the explicit clinical calendar finding. Every earlier authored clinical finding and every overall action/completeness result is unchanged. The JSON delta report contains every affected input, added finding and removed derived summary.

All original scripts execute byte-for-byte, with no fixture or expectation mapping. Three isolated stages retain raw results, logs and observation-only engine traces. Historical repository-byte assertions read explicitly staged authenticated original application protocol bytes; current runtime JS is copied unchanged, and actual current application files are separately hashed and checked unchanged. No application files were modified. No clinical or pharmacy approval is claimed.
'''
summary+='\nChanged engine-observation calls: '+json.dumps(analysis['delta_summary']['changed_observation_calls_by_suite'])+'.\n'
(R/'README.md').write_text(summary)
files=[]
for p in sorted(R.rglob('*')):
 if p.is_file() and p.name!='evidence-manifest.json':files.append({'path':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size})
save(R/'evidence-manifest.json',{'date':'2026-11-18','scope':'Original347+303+197 assertion replays, raw outcomes and exact six-rule delta classification','files':files,'clinical_approval':False,'pharmacy_approval':False})
print(json.dumps(analysis['delta_summary'],indent=2))
print('evidence-manifest SHA256',sha(R/'evidence-manifest.json'))
