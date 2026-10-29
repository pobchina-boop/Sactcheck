# 00689 retrospective suite audit — v0.84.26

Checked 29 October 2026. Proposal only: independent consultant and oncology pharmacy review and clinical-use authorisation remain false. Software checks are not clinical approval.

## Source state and meaningful changes

NCCP 00689 remains version 4 (14 June 2024), review date 24 March 2028. The freshly downloaded binary and extracted text hashes exactly match the v23 audit. There is no invented NCCP version upgrade. Version history and critical schedule/count/organ-function tables were visually reviewed. `sources.json` records URLs, versions, retrieval, hashes and visually reviewed pages; original PDFs and renders are in `research/`.

Current EMA Tecentriq product information (EPAR update 21 July 2026), section 4.4 pp14–15, supports three separately attributed supplemental action pathways:

- Clinically suspected immune myocarditis: withhold atezolizumab and obtain prompt cardiology work-up. Confirmed Grade 2 or higher: retain permanent discontinuation. Previous grade-triggered action wording incorrectly said suspected myocarditis; diagnosis and suspicion now have distinct inputs and messages.
- Suspected Grade 1 pericarditis or Grade 2 or higher pericardial disorder: withhold and obtain prompt cardiology assessment. Confirmed Grade 2 or higher retains permanent discontinuation.
- Confirmed immune myositis with inability to reduce corticosteroids to prednisone-equivalent 10 mg/day or less within 12 weeks after onset: permanently discontinue. This is an explicitly clinician-confirmed recovery context; an isolated steroid dose or unrelated prescription does not imply this condition.

All three apply to atezolizumab alone in either phase. Stronger confirmed-event actions dominate concurrent suspicion holds in the real dose renderer. Cytotoxic limitations remain separately attributed. The current product warning about myocarditis/myositis/myasthenia overlap is carried into clinician notes, patient urgent symptoms, consent support and journey notes. Symptoms do not become diagnoses. No automatic treatment restart is introduced.

A current primary-publication check identified the 2024 IMbrella A/IMpower133 exploratory long-term report (PMID39306923). A third clinician evidence endpoint explicitly identifies five-year OS12% (95%CI7–17), cutoff16 March2023, median follow-up59.4 months, 18 of26 eligible rollover and absent long-term control-arm data. This is not a five-year randomised comparison or personal prognosis. Existing 2018 primary PFS and 2021 updated OS analyses are retained. Patient evidence remains qualitative with empty metrics. The trial used IV atezolizumab and IV etoposide; it did not randomise the SC or oral alternatives.

Existing run-together prose around days, doses, follow-up and trial results was normalised. Legacy field names remain compatible. Etoposide numeric CrCl is now classified as source-threshold numeric, distinct from the exact continuous GFR used for Calvert dosing.

## Validated boundaries preserved

Induction is four 21-day cycles; maintenance contains atezolizumab alone every21 days without a fixed total duration. Atezolizumab1200 mg IV or1875 mg SC requires explicit route selection. Etoposide100 mg/m² IV Days1–3 versus IV Day1 followed by100 mg/m² orally twice daily Days2–3 remains explicit. The1680 mg/28-day atezolizumab alternative remains a separate00593 prescribing decision.

Visual NCCP Table5 confirms ANC≥1 and platelets≥100 for its full-dose row, ANC0.5–<1 or platelets75–<100 delay, ANC<0.5/prior febrile neutropenia or platelets<50 delay and consider25% cytotoxic reduction. Platelets50–<75 are genuinely unassigned and remain consultant review; no interpolation.

Carboplatin GFR≤20: do not give; >20–≤30: extreme caution; cap125. Formula-based dosing requires creatinine within48h; isotope context requires creatinine≤110% of reference. Etoposide CrCl10–50:75% original dose; >50:normal source row; <10 outside dialysis is unassigned. Dialysis consideration75%; bilirubin≥50 or low albumin consideration50%. Coexisting reductions are not multiplied and a previous lower dose is not escalated automatically. Discordant legacy renal bands and exact values retain adverse evidence and prompt reconciliation.

Maintenance does not emit cytotoxic dose modifications. Isolated hepatic or renal labs do not establish immune attribution. Source-unspecified CTCAE edition is not silently converted to CTCAE5. Event-specific holds, discontinuations and recovery qualifications remain distinct.

## Full-suite consistency

Complete authoring preserves baseline eligibility, risk/benefit, consent, patient explanations, agent effects, passport/day guides, route choices, supporting medicines, relative treatment phases and monitoring. NCCP baseline viral screening and organ assessment, FBC/renal/liver/glucose before cycles, and thyroid every3–6 weeks remain. Scans follow the consultant's plan; no invented universal scan or cardiac imaging interval.

NCIS V8 2025 Table1 pp4–5 was visually rechecked: the dedicated carboplatin AUC≥4 row has NK1 antagonist/5-HT3 antagonist/corticosteroid, without the generic high-risk row's automatic olanzapine. Multiday antiemetics account for each day and two days afterwards. Induction/oral alternative support remains separately authored and reconciled into one prescription; maintenance has no copied chemotherapy prophylaxis. Existing pregnancy/fertility, emergency, oral capsule handling and after-treatment immune safety advice is retained.

## Validation and handoff

Proposal contains84 rules and83 optional inputs. `node validation/lung-next-v08426/atezo-combo-retro/source-cases.cjs`:297/297 pass, strict validator zero errors/warnings. Includes273 retained source checks and24 added checks for supplemental pathways, absence/false/phase controls, component attribution, permanent-stop precedence, concurrent cytotoxic restrictions, patient warnings and exploratory-evidence limitations. Real assessment engine and real dose model are exercised. `--integrated` targets canonical files after root integration; no canonical files were edited by this bounded audit.

Deliverables: `proposed/00689-atezolizumab-carboplatin-etoposide.json`, `authoring.json`, `source-cases.cjs`, `baseline-protocol.json`, `sources.json`, build scripts and proposed results. Baseline fixture is outside research so packaged tests can run when research PDFs are excluded. Existing v23 tests hard-code date/release/source/endpoints assumptions; root must migrate these to allow the dated EMA supplemental sources, third endpoint and updated release without weakening clinical boundary assertions.
