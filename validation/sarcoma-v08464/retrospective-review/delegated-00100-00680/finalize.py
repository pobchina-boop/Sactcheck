from pathlib import Path
import hashlib,json,shutil
h=Path(__file__).resolve().parent;r=h.parent.parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=r/'sarcoma-v63-v64-integration-handoff-20261118/integration-handoff.json'
shutil.copyfile(source,h/'provenance/integration-handoff.json')
handoff=json.loads(source.read_text());pinned=json.loads((h/'input-manifest.json').read_text());report=json.loads((h/'results.initial.json').read_text())
ver=[]
for code in ['00100','00680']:
    entry=next(p for rel in handoff['releases'] for p in rel['protocols'] if p['code']==code)
    local=next(x for x in pinned['files'] if x['kind']=='accepted_candidate' and Path(x['path']).name.startswith(code))
    src=next(x for x in pinned['files'] if x['kind']=='official_extracted_text_not_pdf_binary' and Path(x['path']).name.startswith(code))
    assert entry['final_candidate']['sha256']==local['sha256'];assert entry['source']['text']['sha256']==src['sha256']
    ver.append({'code':code,'candidate_matches_handoff':True,'source_matches_handoff':True,'candidate_sha256':local['sha256'],'source_sha256':src['sha256']})
accept=json.loads((h/'provenance/independent-acceptance-addendum.json').read_text());assert ver[1]['candidate_sha256']==accept['candidate_hashes']['00680']
(h/'provenance-verification.json').write_text(json.dumps({'verified_date':'2026-11-18','handoff_sha256':sha(h/'provenance/integration-handoff.json'),'candidate_and_source_checks':ver,'00680_matches_independent_acceptance_addendum':True,'clinical_approval':False},indent=2)+'\n')
findings=[{'id':'MIF_EXPLICIT_FALSE_CONTEXT_LOST_OUTSIDE_BASELINE','scenario_ids':['00100-R06','00100-R07','00100-R08','00100-R10','00100-R11','00100-R12'],'classification':'specific_source_eligibility_or_recovery_context_requires_review','observation':'The three known-false facts trigger MIF_BASELINE_CONTEXT at baseline, but each produces only partial no-restriction findings outside baseline; no component dose-action row. Positive matched counterparts remain unrestricted.','scope':'High-grade osteosarcoma, postoperative multi-agent plan, recovery from surgery; chemotherapy explicitly incomplete.','source':'00100 L21–25,L34–38,L65–73','expected_scope':'At least explicit specialist clarification/restriction; no novel numeric dose or automatic permanent discontinuation.','status':'open_candidate_finding_no_fix_applied'},{'id':'HDIFO_EXPLICIT_FALSE_ELIGIBILITY_LOST_OUTSIDE_BASELINE','scenario_ids':['00680-R17','00680-R18'],'classification':'specific_source_eligibility_context_requires_review','observation':'Known-false indication_criteria_confirmed has no actionable effect in treatment or recovery with an explicit restart request.','source':'00680 L21–22,L78–84','expected_scope':'Clarify source eligibility; do not infer another indication or a dose.','status':'open_candidate_finding_no_fix_applied'},{'id':'HDIFO_OTHER_TOXICITY_REVIEW_POLICY_GAP','scenario_ids':['00680-R16'],'classification':'source_policy_question_not_an_established_numeric_algorithm','observation':'Valid other_nonhaem_toxicity_grade:3 is accepted but absent from clinical findings and component dose actions with otherwise reassuring current context.','source':'00680 L27–28,L113–114,L179–180','expected_scope':'Explicit named-event/clinical review only. The NCCP text does not specify a universal grade3 hold, dose reduction or permanent stop for this field.','status':'open_source_policy_review_no_conflict_resolution'}]
(h/'findings.json').write_text(json.dumps({'total_failed_scenarios':9,'finding_groups':3,'groups':findings,'shared_outcome':{'action':'proceed_with_caution','complete':False,'coverageComplete':False,'clinical_findings':[],'dose_action_rows':[]},'scope_note':'Not a claim of whole-patient clearance, nine independent defects, or clinical approval. The deficiency is loss of actionable review for explicitly entered adverse context.'},indent=2)+'\n')
rows=[]
for c in report['results']:
    rows.append('| '+ ' | '.join([c['id'],c['name'].replace('|','/'),c['status'],c['source_citations'][0]['line_markers']])+' |')
readme='''# External retrospective suites: 00100 and 00680

Forty fresh scenario inputs were executed with frozen copies of the actual SACTCheck assessment engine and dose model against the exact accepted external candidates: **31 passed, 9 failed**. There are **20 scenarios per regimen**, not 40 per regimen. These are two of the parent’s five audited regimens.

| Regimen | Distinct scenarios | Passed | Failed |
|---|---:|---:|---:|
|00100 mifamurtide|20|14|6|
|00680 high-dose ifosfamide|20|17|3|
|Total|40|31|9|

`results.initial.json` is immutable first-run evidence. No invalid fixtures or fixture corrections occurred. `findings.json` groups the nine failed scenarios into three findings; it does not claim nine independent clinical defects. All nine produced `proceed_with_caution`, incomplete coverage, only partial findings and no component dose-action rows. This is not a whole-patient clearance output; the concern is failure to act on explicit adverse context.

The mifamurtide matrix contrasts baseline, ongoing treatment and restart using three separate explicitly false eligibility/recovery inputs and matched positive counterparts. Chemotherapy is explicitly not complete, so the absent postoperative plan is not an inference from completed chemotherapy. The high-dose ifosfamide suite combines course, indication, history, organ function, support, current toxicity and existing reduced prescriptions. It does not add another product-threshold or CNS boundary matrix. The one generic grade3 toxicity finding asks for named-event clinical review under unacceptable-toxicity language; **the source provides no universal grade3 percentage, hold or permanent-stop algorithm**.

Both complete saved official extracted source texts were read. `provenance-verification.json` verifies both candidate and source hashes against the integration handoff, and the00680 candidate against the independent acceptance addendum. Every execution pins the actual engine, rule engine, endocrine dependency and dose model. No old application protocol is imported. The current product/CNS corrections remain intact.

## Reproduce

Use Node.js (tested with v24.22.1). From this directory run:

```bash
node run.cjs --out results.replay.json
```

Exit code1 means the preserved candidate findings remain; it is expected for the supplied candidate. The runner refuses to overwrite an existing result. It needs no application checkout, network, installed packages or browser. `prepare.py` is the preserved authoring/freezing provenance script and is not needed for replay; do not rerun it to replace frozen inputs.

`cases.json` contains every full input, expectation, source line citation, rationale and expectation classification. `results.initial.json` adds actual findings, complete dose-model rows and schedule models. No numerical administration dose, compounded percentage or automatic re-escalation was generated. Schedule assertions separately verify the2mg/m² mifamurtide phases and48-infusion total, and the5-day ifosfamide/three distinct mesna rows including day6 final support.

The deduplication reference contains667 prior report inputs (197 independent draft cases,347 product-contract cases and123 future-five semantic cases). All40 full canonical inputs are distinct within this suite and have zero exact matches against those667. This exact comparison supplements the stated design differences; it is not itself proof of semantic novelty. These previous tests are not included in the new40 count.

## Findings and limits

1. Mifamurtide: explicit false high-grade osteosarcoma, postoperative multi-agent plan or surgical recovery is restricted at baseline but ignored during ongoing treatment and restart (six failed scenarios).
2. High-dose ifosfamide: explicit false source eligibility is ignored during treatment and requested restart (two failed scenarios).
3. High-dose ifosfamide: accepted generic current other-grade3 toxicity input produces no explicit clinical review (one source-policy question, not a source-defined dose algorithm).

All findings remain open for source-author/clinical governance review. No candidate, application or git files were changed. The package provides software assessment/dose-model evidence only: no browser/UI screenshot verification, PDF visual-table review, PDF-binary hash validation, local supplied-product verification, clinical approval or pharmacy approval. Source conflicts remain unresolved, and the existing product/CNS boundary evidence is not relabelled as newly tested here.

## Scenario index

| ID | Scenario | Outcome | NCCP source line markers |
|---|---|---|---|
'''+ '\n'.join(rows)+'\n'
(h/'README.md').write_text(readme)
# Last file records exact portable artifact bytes; it excludes itself and future replay outputs.
files=[p for p in h.rglob('*') if p.is_file() and p.name!='evidence-manifest.json' and 'portability-check' not in p.parts and p.suffix!='gz']
(h/'evidence-manifest.json').write_text(json.dumps({'created_date':'2026-11-18','files':[{'path':str(p.relative_to(h)),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(files)],'initial_result_sha256':sha(h/'results.initial.json'),'cases_sha256':sha(h/'cases.json'),'fixture_corrections':[]},indent=2)+'\n')
print(json.dumps({'files':len(files),'findings_groups':len(findings),'initial_result_sha256':sha(h/'results.initial.json'),'cases_sha256':sha(h/'cases.json')}))
