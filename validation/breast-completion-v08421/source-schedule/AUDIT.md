# v0.84.21 source and schedule retrospective proposals

Checked 25 October 2026. Scope: NCCP00207, 00447, 00448, 00568 and 00586. These are source-reconciled development proposals; independent consultant, oncology-pharmacy and patient/PPI review and clinical authorisation remain pending. No live application file was edited by this work package.

## Deliverables and integration

- `authoring.json`: five complete entries using the v0.84.20 authoring contract: patient data, clinician rationale/evidence, longitudinal monitoring, treatment journey, selector metadata, phase support, route and emetic-risk mapping.
- `proposed/`: complete protocol JSONs, not JSON merge patches. `integration-manifest.json` records destination paths and old/new IDs.
- `sources.json`: official source URLs, versions, SHA-256 hashes, dates and trial-source applicability. Retrieved PDFs/text are in `research/`.
- `source-cases.cjs`: 127 source boundary, omission, phase, source and authoring checks. `--integrated` checks the actual protocol destinations after integration. All 127 pass on the proposals.
- `legacy-regression.cjs`: replays 265 relevant cases from the preserved colorectal source audits. All 265 pass. Four historical cases have the descriptive expectation “No hepatotoxicity hold”; the harness checks their recorded action and absence of the hepatotoxicity hold rather than comparing prose with an action code.
- Rebuild proposals in order: `python build_proposals.py`, then `python augment_00568.py`. The augmentation starts from the freshly generated base and should not be run twice without regenerating the base.

Root integration must refresh source registers/caches/metadata and regenerate patient/clinician/PDF surfaces. Existing stable protocol IDs and filenames are retained so routes and legacy references continue to resolve. Current source version is recorded in metadata.nccp_version and metadata.current_source_id. The legacy 00207-head-neck context ID remains available, with official 00207b as an input alias.

The schedule renderer must judge each phase against `phase.active_drugs`. The parent has implemented this independently. This is needed for 00568 maintenance to render two medicines despite three medicines in regimen metadata. For 00586, radiotherapy was incorrectly counted as a medication in `metadata.drugs`, making its one actual medication row appear incomplete; the proposal keeps capecitabine as the medication and radiotherapy as a separate treatment modality/patient component. Numeric tablet days improve display but were not the cause of the missing schedule.

## Findings and changes

| Code | Verified source | Finding and proposed repair |
|---|---|---|
| 00207 | v6; change log 16 September 2026; footer last review 27 January 2025 | Current CRC monotherapy wording requires failure of oxaliplatin- and irinotecan-based therapy **and** intolerance to irinotecan. Head/neck RT indication now explicitly requires platinum ineligibility. Optional indication-specific fields/consultant-review rules preserve partial assessment and keep RAS restricted to CRC. Separate 400 mg/m² loading and 250 mg/m² weekly phases. Correct cetuximab from minimal to low emetic risk. |
| 00447 | v7; change log 27 August 2026; footer last review 21 December 2021 | Version change updates antiemetic links and review schedule, not numerical dose tables. Existing clinical thresholds retained; sources, current-source version/provenance refreshed. Explicit fortnightly pump course, skin/electrolyte care and two-month post-panitumumab checks. |
| 00448 | v5; change log 27 August 2026; footer last review 21 December 2021 | Version change updates antiemetic links and review schedule, not numerical dose tables. Existing clinical thresholds retained. First-/second-line eligibility remains distinct. Atropine/acute cholinergic symptoms distinguished from delayed diarrhoea. Baseline ECG when cardiac function is compromised and INR if taking warfarin are retained in monitoring. |
| 00568 | v5; change log 6 October 2025 | Missing structured schedule: up to four 21-day triplet cycles, then 21-day pembrolizumab/pemetrexed maintenance. Correct high emetic induction and low maintenance. Deep check exposed clinically material legacy assessment omissions; repairs described below. |
| 00586 | v3; change log 27 January 2025 | Display capecitabine 825 mg/m² **twice daily on Days 1–5** of a 7-day cycle, maximum 5–6 cycles. No automatic weekend/missed-radiation make-up dosing. No invented radiation dose. Existing 106 rules retained. |

### 00568 assessment repairs

The prior 25 rules did not encode the current source adequately. The proposal has 76 rules including 16 maintenance-specific chemotherapy branches:

- ECOG review at **>1**, matching eligibility 0–1 (previously >2).
- Independent ANC 1.0–<1.5 and platelets 75–<100 consultant-review bands; ANC <0.5, platelets <50, bleeding and febrile-neutropenia restart reductions. Existing <1 / <75 holds remain, now scoped to chemotherapy.
- Numeric renal entry now reaches pemetrexed <45 mL/min exclusion. Carboplatin ≤20 exclusion and >20–≤30 extreme caution no longer overlap; <60 myelosuppression warning is explicit. Carboplatin rules are suppressed when maintenance is selected.
- Pemetrexed liver limitations distinguish bilirubin >1.5×ULN and AST/ALT >3×ULN without / >5×ULN with hepatic metastases; missing metastasis context requests review.
- Pembrolizumab bilirubin >3×ULN stop, recurrent grade-2 pneumonitis/recurrent grade-3 colitis, serious endocrine/skin/other immune pathways, 12-week recovery/steroid conditions and baseline grade-2 liver-metastasis ≥50% rise for ≥7 days.
- Chemotherapy diarrhoea/hospitalisation, mucositis, neurotoxicity and treatment-related hepatotoxicity pathways preserve component differences. Maintenance branches target pemetrexed alone, with an explicit reminder that carboplatin has stopped.
- The stored renal immune-toxicity input key is retained for portability but its label now requires **creatinine divided by laboratory ULN**, as Table 3 states; it must not mean creatinine divided by baseline.
- Pregnancy/lactation now requests specialist review rather than attributing a blanket contraindication to an exclusion absent from the NCCP00568 source.

These rules flag consultant decisions and source restart percentages. They do not calculate a patient-specific final dose or assert toxicity causation. Existing important limits remain: the clinician must confirm CTCAE grade, immune attribution, renal method and liver-metastasis context. The source itself differs between introductory “toxicity >grade 3 after two reductions” and Table 4 “grade ≥3, consider discontinuation”; the proposal exposes this as consultant review rather than automating a restart. Current prior PD-1/PD-L1 eligibility points to separate NCCP guidance and remains a clinical eligibility check, not an invented universal exclusion.

### Supportive care corrections

The current national NCCP classification V6 Table 7 confirms **cetuximab low**, **carboplatin AUC≥4 high**, and **pemetrexed low**. This resolves the inherited false claim that cetuximab’s regimen and national classification disagree.

The current NCIS Medical Oncology V8 Table 1 has a dedicated carboplatin AUC≥4 row: aprepitant/ondansetron/dexamethasone; no routine olanzapine in that row. It lists metoclopramide on subsequent days without an explicit end day or PRN qualifier: the draft flags the need for a specific prescription. Pemetrexed requires folic acid, B12 and its separate corticosteroid rash prophylaxis throughout induction and maintenance. The draft explicitly requires pharmacy/prescriber reconciliation of the antiemetic and rash dexamethasone schedules, including aprepitant interaction; the two reference schedules must not be added together.

### Evidence and patient presentation

Numerical outcomes reside in clinician evidence cards. Patient evidence metrics are empty for all five codes and explanations are qualitative. Applicability is explicit:

- CO.17 is a historical KRAS subgroup in previously treated CRC. The separate Bonner head/neck RT comparison is not a platinum comparison and was not a specifically platinum-ineligible cohort.
- PRIME used FOLFOX4, not exact NCCP modified FOLFOX-6.
- The 20050181 extended-RAS analysis is second-line. PFS/response improved, but its OS comparison was not significant; no proven OS advantage is asserted.
- KEYNOTE-189 used cisplatin or carboplatin and trial pembrolizumab up to 35 cycles. Neither a carboplatin-only effect estimate nor a universal NCCP 35-cycle stop is inferred.
- NSABP R-04 compares multimodality rectal treatment programmes. Its similar outcomes do not establish capecitabine superiority or an isolated survival gain from this tablet course.

The legacy 00568 patient phases, timeline, day groups, agent explanations and chapter structures are preserved and enriched for renderer portability. All patient source IDs resolve. Baseline, repeated and post-treatment rows are distinct; the whole-course map does not request dates or personal details.

## Remaining integration validation

The package-level source and existing-rule checks pass. Parent integration still needs the shared builder, complete browser interaction, PDF/QR/layout, download-copy and broader regression checks. Clinical approval must remain false regardless of software-test success. The scope here is source/assessment/service-content reconciliation, not a claim that every possible toxicity has been encoded or independently clinically validated.
