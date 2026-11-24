# External retrospective suites: 00100 and 00680

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
| 00100-R01 | baseline: documented positive eligibility and retained reduced prescription | passed | L21–38; L65–73 |
| 00100-R02 | baseline: explicit false high_grade_osteosarcoma despite other reassuring facts | passed | L21–25; L65–68 |
| 00100-R03 | baseline: explicit false postoperative_multiagent_plan_confirmed despite other reassuring facts | passed | L21–25; L34–40 |
| 00100-R04 | baseline: explicit false recovered_from_surgery despite other reassuring facts | passed | L34–38 |
| 00100-R05 | on_treatment: documented positive eligibility and retained reduced prescription | passed | L21–38; L65–73 |
| 00100-R06 | on_treatment: explicit false high_grade_osteosarcoma despite other reassuring facts | failed | L21–25; L65–68 |
| 00100-R07 | on_treatment: explicit false postoperative_multiagent_plan_confirmed despite other reassuring facts | failed | L21–25; L34–40 |
| 00100-R08 | on_treatment: explicit false recovered_from_surgery despite other reassuring facts | failed | L34–38 |
| 00100-R09 | restart: documented positive eligibility and retained reduced prescription | passed | L21–38; L65–73 |
| 00100-R10 | restart: explicit false high_grade_osteosarcoma despite other reassuring facts | failed | L21–25; L65–68 |
| 00100-R11 | restart: explicit false postoperative_multiagent_plan_confirmed despite other reassuring facts | failed | L21–25; L34–40 |
| 00100-R12 | restart: explicit false recovered_from_surgery despite other reassuring facts | failed | L34–38 |
| 00100-R13 | Active inflammation and worsening cardiovascular symptoms survive routine steroid plan | passed | L146–152; L176–177 |
| 00100-R14 | Current severe respiratory reaction with asthma and resolved-restart tick | passed | L138–141 |
| 00100-R15 | Restart prescription above reference with conflicting renal band and Child-Pugh B | passed | L33; L85–105 |
| 00100-R16 | Weekly phase short interval with simultaneous lipophilic drug and high-dose NSAID | passed | L35–37; L171–177 |
| 00100-R17 | Missed-dose extension after chemotherapy with neutropenia and monitoring absent | passed | L35–38; L104–105; L142–145 |
| 00100-R18 | Forty-eight infusions with severe hepatic category and contradictory low renal band | passed | L35–38; L85–105 |
| 00100-R19 | Correct preparation filter does not validate IV bolus or in-line administration filter | passed | L42–51; L146–149 |
| 00100-R20 | Prolonged post-infusion fever despite non-acute flag and no severe reaction grade | passed | L142–145 |
| 00680-R01 | Ewing baseline with all supportive prerequisites and retained reduced daily prescription | passed | L21–33; L48–76; L78–84 |
| 00680-R02 | Relapsed osteosarcoma listed but specialist eligibility plan not confirmed | passed | L21–22; L78–84 |
| 00680-R03 | Relapsed osteosarcoma documented plan with first-cycle source schedule | passed | L21–22; L27–31; L48–76 |
| 00680-R04 | Current low ANC with prior febrile nadir and severe mucositis history | passed | L122–125; L162–163 |
| 00680-R05 | Current thrombocytopenia and active severe mucositis during fluid accumulation | passed | L70–72; L122–125; L162–163 |
| 00680-R06 | Recovered counts at restart retain both FN and severe mucositis dose history | passed | L122–125; L162–163 |
| 00680-R07 | Intermediate counts plus prior mucositis and low CrCl with verified normal product labs | passed | L122–143; L162–163 |
| 00680-R08 | Ongoing hydration with low urine output and increasing weight despite plan tick | passed | L67–72 |
| 00680-R09 | Haematuria and urinary obstruction despite completed urine assessment and mesna | passed | L109; L184–188; L201–202 |
| 00680-R10 | Aprepitant and nephrotoxic interaction with dialysis despite reassuring CrCl | passed | L143; L171; L203–204 |
| 00680-R11 | Completed maximum course with prior FN and reduced current prescription | passed | L27–28; L50–63; L125 |
| 00680-R12 | Current infection during recovery despite counts and prior event now resolved | passed | L27–28; L84; L125 |
| 00680-R13 | Legacy febrile-neutropenia label with missing nadir at non-acute restart | passed | L125 |
| 00680-R14 | Oral final mesna independently verified while new low urine output persists | passed | L59–76; L184–188 |
| 00680-R15 | Current severe mucositis with explicit other nonhaematological grade and normal counts | passed | L27–28; L162–163 |
| 00680-R16 | Isolated other grade3 ongoing toxicity with full treatment safeguards | failed | L27–28; L113–114; L179–180 |
| 00680-R17 | Explicit false indication criteria during ongoing treatment | failed | L21–22; L78–84 |
| 00680-R18 | Recovery-stage indication unresolved with an explicit requested restart | failed | L21–22; L78–84 |
| 00680-R19 | Severe hepatic category plus absent G-CSF despite otherwise verified product and labs | passed | L129–143; L178 |
| 00680-R20 | Cycle4 planning with prior mucositis, new haematuria and no numerical re-escalation | passed | L27–28; L109; L162–163; L171 |
