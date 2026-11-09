# Pembrolizumab retrospective clinical audit, v0.84.45

Baseline: detached v0.84.44, a4575d67a985c97a1dfa545813a8c1a25b2ed5a2. This folder contains candidate proposals and independent evidence; it does not claim clinical authorisation.

## Current sources

Both NCCP sources were freshly downloaded on 7 November 2026, following the official healthservice.hse.ie links to assets.hse.ie. Initial requests returned403; a normal browser User-Agent and PDF Accept header succeeded. The recorded bytes match the retained v40/v41 source hashes exactly. The EMA Keytruda product information was freshly downloaded independently. `source-retrieval-verified.json` contains precise URLs, timestamps, response status, sizes and SHA256 values.

- 00455 v16: 10pages; p1 indications; pp3–4 eligibility; p4 exclusions; pp5–6 tests/Table1. SHA256 d0f0a2689dcc887a348442192feae9ab65777507936c33ead5693a1793b1e6d6.
- 00558 v13: 9pages; p1 indications; pp3–4 eligibility; p4 exclusions; pp4–6 tests/Table1. SHA256 4390e1196dc42a92d7bbba4e8a2acbd07b4b282801032a0d40b0bfae73a1bcbe.
- EMA Keytruda IV SmPC: §§4.2/Table1,4.4; physical PDF p8 describes overlap syndrome and unknown myocarditis rechallenge safety; p12 addresses immune adverse reactions/restart. SHA256 21cead5023332bedfd8d282d88d0ef3b6d69629389726f7b5f1005555bd01427.

## Findings and corrections

1. Head-and-neck selection had no executable checks for adult status, first-line setting, confirmed HNSCC, disease incurable by local therapies, nasopharyngeal exclusion, validated CPS≥1, or prior curative systemic treatment and progression interval. Added indication-gated checks. The source says progression “within six months”; less than six triggers the exclusion, exact six requires documented consultant/pharmacy interpretation, and missing interval remains unassessed. No calculated eligibility clearance is introduced.
2. Adjuvant RCC lacked clear-cell histology, adult/risk/resection confirmations and the initiation-within12weeks check. The interval applies only when starting adjuvant therapy; later cycles do not become ineligible simply because more than12weeks have elapsed.
3. Urothelial pathways lacked adult, histology, advanced setting, first-line cisplatin-ineligibility and post-platinum progression checks. The first-line CPS≥10 indication versus >10 eligibility discrepancy remains explicit at exactly10. CPS is not imposed on the post-platinum indication.
4. Cervical maintenance lacked adult, persistent/recurrent/metastatic setting, induction-completion and validated CPS≥1 checks. These are not borrowed into other indications.
5. Existing named myocarditis/encephalitis/Guillain–Barré inputs permanently stopped grades3–4 but did not themselves act at grade2. Added a grade2 hold with urgent specialist assessment, preserving the higher-grade stop. EMA overlap myocarditis–myositis–myasthenia gravis is represented separately: highest individual CTCAEv4 grade, grade2 hold, grades3–4 permanent stop.
6. Controlled grade2 adrenal insufficiency/hypophysitis now has a distinct source-supported review path rather than continuing the uncontrolled grade2 hold. Severe endocrine recovery exceptions remain unchanged; clinical review is not automatic clearance.
7. Recovery/taper/consultant booleans alone could not establish the absence of a prior permanent-stop event. A requested restart now holds until that history is explicitly assessed. A documented prior permanent-stop event retains permanent discontinuation even after current recovery. Current recurrent-toxicity/12week criteria still outrank a negative history answer.
8. The 400mg melanoma plan prompt previously referred generally to postoperative versus permitted perioperative treatment. Its recommendation/explanation now explicitly confines the stageIIIB discretionary perioperative option to the separate200mg regimen. Its predicate, action type and components are unchanged. No00558 perioperative route/option is added.

## Independent tests and immutable history

`source-cases.cjs` contains388 source-authored scenarios across both protocols. It does not generate expected outcomes by reading rule predicates. Candidate388/388pass, with positive witnesses for all78new rules. Baseline182/388pass and206fail, documenting the missing pathways and newly required inputs rather than mislabelling baseline findings as new successes. Integrated results are saved separately.

Coverage includes omitted/blank/false/true inputs, CPS0.99/1/1.01 and9.99/10/10.01, progression5.99/6/6.01months, adjuvant RCC11.99/12/12.01weeks, explicit non-starting and other-indication controls, all named cardiac/neuro grades0–4, overlap grades0–4, endocrine/restart interactions, recurrent immune events, preserved liver/renal ULN thresholds and immune-cause attribution. Existing valid source rules remain unchanged. Candidate structural validation returns no errors for either protocol.

`clinical-chain.json` and `verify-chain.cjs` verify14 immutable v40/v41 evidence files; the exact v40 output bytes are the v41 input snapshot. The56pre-v40 rules survive the57rule v40 output and the87/75rule v44 baselines. All162 v44 rule predicates, action types and components are retained in v45. Only the documented00558 melanoma wording correction changes an existing recommendation/explanation. Each candidate adds39rules; the count was derived from the audited omissions, not a target.

Do not edit historical source fixtures or replace their result reports. The v40 “Controlled severe endocrine exception preserved” fixture requires an explicit `pembro_prior_permanent_stop:false` when replayed against v45, because omitted history now correctly holds. Run that historical file through a compatibility wrapper adding only this documented context, with results written outside the historical path. Cases here separately prove omitted, positive and negative history.

## Release integration

- Apply candidates to their existing protocol paths and explicitly migrate nccp-00455-v15b→nccp-00455-v16 and nccp-00558-v12b→nccp-00558-v13 across current consuming registries, data and generated outputs. Do not rewrite immutable historicalaudit inputs.
- Regenerate affected clinician/patient/consent/printoutputs using the established anatomical templates, preserving all previous content and context-specific schedules. No new HNSCC patient route is claimed for these two retrospective families in this batch.
- Run `node validation/head-neck-v08445/retro-immune/source-cases.cjs --mode=integrated` and `node validation/head-neck-v08445/retro-immune/verify-chain.cjs --integrated` after integration.
- Source reconciliation and passing tests are software evidence. Consultant review, oncology-pharmacy review and clinical-use authorisation remain false. Exact six-month HNSCC wording, urothelial CPS10 and any individual rechallenge require clinical interpretation.
