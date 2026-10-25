# Vinorelbine source audit — v0.84.20

Checked 25 October 2026. Scope: NCCP 00232 IV vinorelbine v5 and 00259 oral vinorelbine v6. Proposed protocol files only; production integration is owned by the release agent. Source-derived software checks do not constitute consultant/pharmacy validation or clinical-use authorisation; all three approval flags remain false.

## Source reconciliation

The current NCCP IV PDF is v5, amended 11 November 2025, review 11 November 2030. The oral PDF remains v6, with a 21 July 2021 review footer and a final-page annotation that review is as required from 20 May 2026. That annotation is not an invented new version. Exact downloaded SHA-256 hashes and source links are in `sources.json`.

IV v5 retains advanced breast, NSCLC and platinum-refractory advanced ovarian indications (the ovarian use is off-label). Oral v6 retains advanced breast and NSCLC. These indications are preserved in the proposals. The new patient suites and selected trial evidence are explicitly breast-specific.

The historical generic IV SmPC linked from the NCCP reference actually retrieves an eight-page 2013 document. It is recorded as historical, not represented as current. The newer HPRA Navelbine IV SmPC is January 2024; the oral Vinorelbine Accord SmPC text is March 2025, issued 9 April 2025. Supplements are identified on each supplemented rule.

## Material discrepancies and conservative handling

| Topic | Source facts | Proposed response |
|---|---|---|
| IV ANC | NCCP p1 excludes ANC below 1.5. Its p2 table permits 100% at ANC ≥1 and 75% at 0.5–0.99. The source does not explicitly confine the exclusion to baseline. | Withhold/reconcile below 1.5 for any stage; retain the conflicting table information without silently choosing it. Current Navelbine SmPC also delays below 1.5. |
| IV platelets | NCCP gives 75% at 75–99; current Navelbine SmPC delays below 100. | Withhold pending product/local-pharmacy reconciliation; show both sources. NCCP exclusion below 75 remains explicit. |
| IV decimal boundaries | Printed ANC 0.5–0.99 then ≥1, and platelets 75–99 then ≥100, leave fractional gaps. | Review values such as ANC 0.995 or platelets 99.5; no silent rounding. |
| IV infusion | NCCP specifies 50 mL saline over 15 minutes then 250 mL saline flush; Navelbine SmPC specifies 6–10 minutes. | Preserve the NCCP schedule with an explicit product/pharmacy discrepancy. Patient material must not promise an exact total visit time. |
| IV severe liver impairment | NCCP: consider 66% of the original dose. Navelbine SmPC: 20 mg/m². NCCP supplies no numerical severity definition. | Consultant/pharmacy review; no automatic fixed dose, inferred bilirubin bands, or increase of an already lower dose. |
| IV monitoring | NCCP says FBC/renal/liver before each cycle. Navelbine SmPC says blood counts on the day of each new administration. | Explicitly add each-dose counts, including Day 8, as a supplement; renal/liver remain per cycle. |
| Oral liver | Existing rule incorrectly required both AST and ALT ≥1.5 without upper limits or bilirubin conditions. | Correct AST **or** ALT 1.5–2.5 with bilirubin <1.5; companion/profile gaps and values above 2.5 outside the low-bilirubin band are reviewed. Bilirubin 1.5–3 independently identifies the 50 mg/m² target; >3 discontinues. |
| Oral dose history | First-three nadirs and later nadirs while at 80 are distinct. | Prevent unreviewed escalation; on-80 severe/repeated nadirs require delay then 60 for three administrations. Current ANC <0.5 at 80 independently triggers that pathway. Re-escalation is separately reviewed after three at 60 and their nadirs. |
| Oral nadir exactly 1 | Printed Table 4 uses >1 and ≥0.5 to <1. | Flag the unassigned exact boundary when provided as the first-three nadir; no automatic escalation. |
| Oral BSA/rounding | Eleven printed BSA bands provide total doses at 60 and 80; maximum 120 and 160 mg. No 50 mg/m² column. | Preserve exact table; check entered totals against each band and caps. Below 0.95, fractional inter-band values and 50 mg/m² calculations require pharmacy review. A lower total is reviewed, never automatically increased. |
| Grade 4 neuropathy | Both NCCP tables explicitly specify grade 3 discontinuation, not a separate grade 4 row. | Urgently withhold and seek specialist assessment, identifying the source gap; no invented grade 4 dose/restart. |
| Toxicity grading | NCCP does not name a grading edition. | Do not label the protocol’s grades as verified CTCAE v5. Toxicity-specific clinical grading remains necessary. |

## Other reconciled pathways

IV: 30 mg/m² on Days 1 and 8 every 21 days; consultant consideration of 25 mg/m² with poor marrow reserve. Prior febrile neutropenia/myelosuppression delay requires recovery and 25% reduction in subsequent cycles, accounting for original/current doses and reductions already applied. ANC below 1 for **more than** three weeks discontinues. Neuropathy grade 2 waits for recovery to ≤1 before 75% original dose. Grade 3 constipation allows consideration of 75% after management. Other toxicity ≥3 defers one week to ≤1, with consultant discussion for longer delay. Renal impairment and haemodialysis do not automatically reduce the dose.

Oral: weekly, never daily; first three administrations 60 mg/m² then conditional 80. A first-three nadir <0.5, or more than one nadir ≥0.5 and <1, prevents escalation. On 80, the corresponding events require delay/reduction to 60 for the next three administrations; re-escalation is a separate reviewed decision. ANC below 1.5 or platelets below 100 delays each weekly dose. Neuropathy grade 2 holds to ≤1 then uses 60, or 50 if already 60; an existing 50 or lower dose is never raised automatically. Grade 3 neuropathy discontinues; constipation and other toxicities have separate rules. Oral exclusion domains include absorption disorders, significant stomach/small-bowel resection and long-term oxygen. Renal impairment does not import another protocol’s dose bands.

Both: independently actionable pregnancy/breastfeeding/hypersensitivity/infection findings; interactions, yellow fever/other live vaccines, liver-field radiotherapy, acute neurological/bowel/respiratory/cardiac concerns and prior toxicity review. IV extravasation stops the infusion. Oral handling covers whole capsules with food, damaged capsules, no redose after vomiting and product-specific excipients. Neither route is interchangeable mg-for-mg with the other.

## Supportive care and service content

IV is **minimal** emetogenic risk: no routine primary prophylaxis is mandated. Oral is “moderate” in NCCP 00259 and **moderate–high oral** in the current NCCP classification, not the IV moderate steroid/NK1 pathway. Table 5 p8 lists a single 5-HT3 antagonist (ondansetron 8–16 mg total daily **or** granisetron 1–2 mg total daily), continuing on subsequent days. For this weekly regimen the prescriber must specify duration; do not create an indefinite daily plan. Constipation risk and rescue treatment are reviewed separately. No automatic G-CSF, antibiotic, antiviral or PJP prescription is introduced.

`service-facts.json` supplies route-specific treatment timelines, patient mechanism/side-effect explanations, baseline and ongoing monitoring, consent subjects, logistics, oral storage/handling, antiemetic classification, bowel plans and emergency-contact advice. No fixed cycle count or patient-entered date is required. There is no routine anthracycline/trastuzumab-style LVEF surveillance schedule in these sources.

`evidence.json` supplies two exact-schedule primary breast studies: the IV monotherapy arm of GEICAM 2000-04 and Freyer 2003 oral phase II. The GEICAM randomised benefit tests **gemcitabine addition**; it must not be presented as a vinorelbine survival gain. The oral study was small and single-arm, and median OS was not reached. Neither supplies individual prognosis or evidence for the protocols’ lung/ovarian indications.

## Verification

- `node validation/endocrine-next-v08420/vinorelbine/source-cases.cjs --mode baseline`: **90/258 pass, 168 fail**, documenting legacy gaps.
- `--mode proposed`: **258/258 pass**.
- `--mode integrated` reads the final production files after the parent integrates them and writes a separate report.
- Proposed IV protocol: **36 rules, 32 inputs**. Oral: **79 rules, 48 inputs**.
- Strict protocol validator: **0 errors, 0 warnings** for each proposal.
- Source PDF visual checks: IV pp2–3 and oral pp2,4–5, including tables/boundaries.
- Every proposed rule has a source URL, page, document and source version/date; clinically conditional dose actions block automatic numerical prescriptions.
- Existing stable protocol IDs, file names, route/tumour indications, metadata and false approval flags are preserved. `software_tests_completed` remains false for the parent to set after release integration checks.

The software cases cover independent partial inputs, limits, exact boundaries, route separation, all eleven capsule bands, conditional dose history, source conflicts and missing domains. They are not independent clinical approval, patient outcome validation or authorisation for clinical use.
