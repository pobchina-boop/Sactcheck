# SACTCheck v0.84.12 — five Phesgo suites: source reconciliation and software audit

Checked 20 October 2026 against the retrieved official NCCP documents and EMA Phesgo product information. Base: v0.84.11, commit `d64b3d4a1fc608d02128a1bf02bb5aef7f8ae28e`.

This is source reconciliation and software verification. It is not independent oncology, pharmacy, clinical-use or PPI approval. The person/agent authoring the changes also authored the new cases; a passing percentage is not an estimate of clinical accuracy. All five retain clinical-use-authorised = false.

## Scope and source crosswalk

| NCCP card | Official version | Setting / schedule | Main source sections checked |
|---|---|---|---|
| 00785 | v3 | Metastatic Phesgo maintenance after chemotherapy, every 21 days | Indication and administration pp1–2; assessment, cardiac and dose-gap guidance pp2–4 |
| 00796 | v4 | Metastatic Phesgo + docetaxel Day 1, every 21 days | Indication and dosing pp1–2; cardiac, gap, organ-function and support sections pp2–6 |
| 00797 | v4 | Metastatic Phesgo Day 1 + paclitaxel Days 1, 8, 15, every 21 days; up to 8 paclitaxel cycles | Schedule pp1–2; haematology/neuropathy p4; other toxicity and hepatic rules pp4–5; support p6; unlicensed-use statement p7 |
| 00789 | v3 | Six neoadjuvant TCHP cycles, every 21 days | Schedule/sequence pp1–4; assessments and dose modification pp4–7; supportive care p8 |
| 00790 | v3 | Six neoadjuvant TRAIN-2 cycles: Phesgo/carboplatin Day 1, paclitaxel Days 1 and 8 | Schedule/sequence pp1–6; gap p7; haematology p8; renal/hepatic p9; cardiac/other toxicity pp10–11; support p12 |

Exact URLs, byte counts, retrieval dates and SHA-256 hashes are in `validation/phesgo-v08412/sources.json` and the public source index. Pre-change JSON snapshots are retained beside the cases. Refer to each rule's source page for the individual comparison. EMA section 4.2 supplements formulation-specific heart-failure and reaction rules.

## Inherited problems corrected

1. **00790 contained TCHP/docetaxel rules and component targets.** Rebuilt it for paclitaxel/carboplatin, including Day 1 versus Day 8 count thresholds, Day 8 omission, carboplatin-specific reduction history, and no invented Day 15 replacement dose.
2. **00797 carried an unrelated 28-day paclitaxel object and multiple non-breast indications.** Replaced these with NCCP 00797a, the 21-day Days 1/8/15 pattern, maximum eight paclitaxel cycles, and the NCCP restriction concerning docetaxel suitability. Carried the Irish unlicensed-combination consent requirement into the patient and clinician material.
3. **00789/00790 reused indication 00722a; 00796 lacked structured indications.** Corrected the code-to-indication mapping and regenerated card metadata.
4. **00785 represented the two antibody ingredients as separate administrations.** The dose schedule now presents one combined SC Phesgo product. Ingredient-level explanations remain available without implying two injections.
5. **Early and metastatic cardiac criteria needed separation.** Baseline eligibility, on-treatment LVEF bands, percentage-point change, missing history and urgent cardiac symptoms now have distinct source-linked branches.
6. **Route switches and long gaps could be misread as a new course.** The six-week threshold uses the last dual-HER2 administration, including IV treatment; a first SC visit does not itself imply a loading dose.
7. **Chemotherapy rules and support needed phase boundaries.** Cytotoxic assessment branches are gated off in the HER2-only phase. Day 1 carboplatin, Day 8 paclitaxel and HER2-only support have separate outputs. Early postoperative treatment is a separate MDT/pathology decision; it is not automatically routed to metastatic 00785.
8. **Knowledge, consent, body maps and practical information were incomplete or generic.** Added dedicated content for all five. Maintenance has four relevant symptom areas, without populating a cytotoxic body map. Port/cannula information applies to IV chemotherapy; Phesgo itself needs no IV access or take-home pump.

## Boundaries requiring human source interpretation

- TCHP's printed count bands use strict full-dose inequalities and leave exact/between-band boundaries (including ANC 1.5 and platelets 100) insufficiently clear. These produce review rather than borrowing a neighbouring regimen's inclusive threshold.
- 00797 prints platelets 90 in overlapping full-dose and delay bands. Exact 90 is flagged for review. Decimal gaps between hepatic bilirubin bands are also referred for review.
- Docetaxel's intermediate hepatic table does not unambiguously resolve every mixed AST/ALT/ALP/bilirubin combination. The implementation explains the table and requests review instead of manufacturing a numeric dose for ambiguous combinations; severe exclusion bands are separately encoded.
- TRAIN-2's specific neuropathy instruction and broad grade-3-or-higher toxicity instruction can overlap. Overlap leads to holding/review. For 00797, the neuropathy reduction row is specifically grade 2; grade 3 follows the broader discontinuation rule.
- 00796 does not supply an on-treatment haematology table equivalent to TCHP. The implementation requests review rather than copying one.
- Dose modifications remain component-specific. A dose reduction or review is not a complete prescription, and supplied normal values do not establish that all eligibility or safety domains were assessed.

## Longitudinal content

Every suite includes a date-free cycle graphic and a separate whole-treatment map: baseline assessment, active systemic treatment, phase changes, imaging, cardiac surveillance and follow-up. Early-breast maps also relate chemotherapy, lumpectomy/mastectomy, pathology, postoperative medicines, radiotherapy and endocrine/bone-health care.

- NCCP echo/MUGA: baseline and every 12 weeks during treatment, approximately cycle 5 for an uninterrupted 21-day schedule. Changes of route or phase do not restart elapsed time; concern can require earlier checks.
- The ESC option for six-monthly surveillance is described only for selected asymptomatic low/moderate-risk metastatic patients after a normal first year and an agreed cardiac plan. It is not automatic at maintenance entry.
- Metastatic response assessment is generally every 2–4 months under the cited ESMO guidance, individualised to disease and symptoms; CT chest/abdomen/pelvis is not imposed on every patient.
- Early-breast surveillance distinguishes mammography of remaining breast tissue from symptom-directed investigation. Routine CT/PET/tumour markers are not presented as asymptomatic recurrence screening.
- DEXA relates to fracture risk and the selected endocrine/ovarian-suppression plan, not every Phesgo cycle. Genomic chemotherapy triage is not applied to these HER2-positive cards.

These are educational scheduling and discussion tools. No automated bookings, reminders, result ingestion, overdue alerts or completion tracker are claimed. Each milestone asks the team to identify the booking owner, due window, reviewer and action if overdue.

Primary trial evidence distinguishes the SC formulation (FeDeriCa) from the backbone strategy (CLEOPATRA, weekly paclitaxel phase II, TRYPHAENA or TRAIN-2). TRAIN-2's trial cycle count differs from this NCCP schedule and that limitation is explicit; no survival equivalence or unsupported cross-trial numbers are asserted. International and primary-study links are present in the patient/clinical profiles.

## Verification

### New source-derived assessment cases

Actual production engine and dose-schedule renderer were executed with blank inputs, isolated safety fields, exact and adjacent boundaries, phase transitions, day selection and component-specific actions. Expected outcomes were specified in the source-case file and logged with matched source rules.

| NCCP | Cases | Passed |
|---|---:|---:|
| 00785 | 27 | 27 |
| 00789 | 57 | 57 |
| 00790 | 67 | 67 |
| 00796 | 43 | 43 |
| 00797 | 55 | 55 |

Total: **249/249**, with no failures. Case inputs, expectations and outputs are in `source-case-results.json`; this is reproducible software evidence, not independent clinical validation.

Full-suite contracts exercise the actual knowledge-base loader/renderer for all five, all phase-selector event paths and reset, local service/resource links, HER2/setting navigation, date-free patient content and the preserved-asset baseline. They confirm 2,153 previously authored patient assets are byte-identical to v0.84.11.

Print verification covers 45 distinct patient PDFs (80 pages), their identical compatibility copies, page counts, text bounds, and 20 decoded QR targets. Visual inspection included maintenance and TRAIN-2 guides, passport, consent aids, journey, logistics and phase scripts. Fixed an orphaned journey row and a two-page logistics layout with broken decorative icons.

Browser checks confirmed the maintenance body map and actual TRAIN-2 phase-selector switching (Day 8 and postoperative outputs). The local-preview clinician catalogue remained slow and the browser timed out before an assessment form could be exercised. Therefore manual browser input/output assessment is **not** counted as passed. Automated production-engine cases do not remove this manual-QA limitation.

The final release gate, static build, repository security check and deployable-site integrity check all passed (exit code 0). Results and logs are recorded in the accompanying validation summary. Follow-up independent review should prioritise the source ambiguities above, then manually enter representative cases across each card and confirm the deployed source/version.
