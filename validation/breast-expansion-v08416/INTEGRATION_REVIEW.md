# Integration review — v0.84.16

Date: 21 October 2026. Baseline: verified v0.84.15, b619d7f. Scope: NCCP 00217, 00350, 00526, 00775 and 00798 new suites; 00204, 00507, 00258, 00722 and 00731 retrospective revisions.

## Evidence and implementation

The early, advanced and vinorelbine folders contain frozen baseline/candidate protocols, source matrices, findings, source provenance and executable cases. The evidence folder contains the primary-source locator register, ten evidence profiles and nineteen endpoint cards. Candidate-stage notes describe the audit stage; integrated-results/final-results and the current application files describe the delivered state.

The source-derived case counts are 168 early-breast, 130 advanced-HER2 and 151 vinorelbine scenarios (449 total). These exercise source boundaries, missing context, active components, route, current versus historical cardiac findings, renal/hepatic handling, delays and reactions. Counts are scenarios, not patients, independent approvals or estimates of clinical accuracy.

Integration adds source-labelled renal/grading metadata, explicit synthetic demo values and route/phase support links to the reviewed candidates. The published product/regimen action thresholds are not presented as a complete toxicity grading dictionary. Actual grade descriptions remain available where the named grading criteria are known; event counts and schedule days remain plain values.

## Document and preservation checks

- 94 distinct patient PDFs, 164 pages, with byte-identical copies under `docs/patient/`.
- 40 successful QR decodes: ten PNGs and the QR on each guide, passport and card.
- Every generated PDF page reviewed in contact sheets, with full-size representative consent, guide, oral-vinorelbine support and monitoring pages. All ten final monitoring maps are three pages; no orphaned fourth page remains.
- HTML links, source IDs, route/day/phase selectors, actual knowledge-base loading/rendering and patient/clinician evidence separation checked.
- 150 explicitly authorised existing patient-file migrations; 2,366 outside-scope patient files preserve baseline hashes.
- Retrospective builder changes are tracked through the established hash-migration helpers.

## Browser checks

The local built site boots as v0.84.16. Search and clinic workflow open the selected regimen; the patient-platform disclosure remains collapsed until requested.

00217: entering platelets 74 triggers the below-75 capecitabine count action with the NCCP page reference. Entering 75 alone triggers no restrictive platelet threshold and explicitly retains 42 unassessed domains; it does not provide treatment clearance. The occurrence selector displays 1, 2, 3 and 4 or later, without severity descriptions. The patient chart shows lapatinib throughout Days 1–21, capecitabine Days 1–14, its rest week and the early cycle-1 ECG window. No date input is required.

00775: selecting on-treatment Day 8 and ANC 0.49 produces the paclitaxel omission action and explicitly says not to move the dose to Day 15. Missing domains remain visible.

00526: selecting oral vinorelbine displays its oral moderate–high prophylaxis review and matching downloads. Switching to HER2-only continuation shows minimal risk/no routine prophylaxis and hides the prior phase's medicines.

## Legacy test migrations

Existing tests were updated narrowly for the authorised version/count/hash migrations, source-specific HFS range, confirmed numeric CrCl metadata, phase-specific emetogenic classifications and exact source count boundaries. No clinical source case group was disabled. Demo fixtures now use a plausible baseline LVEF rather than an inherited value of 2%. Retained grade fields describing a previous episode remain grade fields; only occurrence/event-count inputs lose severity annotations.

## Unresolved source questions retained in the application

- 00350 does not identify a single chemotherapy companion. Its retrieved NCCP document states that adjuvant pertuzumab reimbursement was not approved; current Irish access needs confirmation. Its printed review date has passed.
- TCH/TCHP tables leave certain exact count boundaries unassigned. 00258 baseline cardiac-test wording differs between eligibility and the tests section. 00775 has overlapping neuropathy/reaction wording.
- 00204 has overlapping hepatic rows. 00507 has an exact-90 platelet overlap and neuropathy wording that does not justify silently choosing an automatic dose.
- 00217 has cross-indication Child-Pugh-C context and source diarrhoea-grading limitations. Numeric CrCl is not silently substituted with indexed eGFR.
- Vinorelbine grade ≥3 wording combines restart and discontinuation instructions in the same source cell. Oral Navelbine product guidance is stricter than the generic NCCP combination table for counts and differs for hepatic impairment. These cases retain withhold/review actions instead of an invented resolution.
- Efficacy applicability remains explicit: TRAIN-2 six versus nine cycles, VELVET single-arm IV evidence, separate formulation bridges, different pCR definitions, and whole-strategy rather than isolated-maintenance benefits.

These are review items, not resolved clinical approvals. Independent consultant/pharmacy review and patient/PPI assessment remain outstanding. The reference timelines do not track actual appointments or guarantee that monitoring has occurred.

The final CI result and release checks are recorded in `release-verification.json`.
