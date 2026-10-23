# SACTCheck v0.84.16

Five new breast full-service suites and five retrospective upgrades, prepared over verified v0.84.15 (Git commit b619d7f). This package is for review and installation; it has not been committed, pushed or deployed by this development session.

Updated 23 October 2026 (UI revision 5): restore the prominent, persistent feasibility notice above the homepage and assessment screens. The visible status says “Feasibility evaluation build — not for routine clinical use”; its expandable explanation and the About page describe pending independent validation, draft-document limits, privacy and project independence. Search remains directly accessible. This revised ZIP replaces the earlier v0.84.16 download; install this one package over v0.84.15.

## Regimens

| NCCP | Treatment | Work |
| --- | --- | --- |
| 00217 | Lapatinib + capecitabine | New suite |
| 00350 | IV pertuzumab/trastuzumab with separately selected chemotherapy | New suite |
| 00526 | IV pertuzumab/trastuzumab + IV or oral vinorelbine | New suite |
| 00775 | IV TRAIN-2: paclitaxel/carboplatin/pertuzumab/trastuzumab | New suite |
| 00798 | Phesgo + IV or oral vinorelbine | New suite |
| 00204 | IV pertuzumab/trastuzumab + docetaxel | Retrospective upgrade |
| 00507 | IV pertuzumab/trastuzumab + weekly paclitaxel | Retrospective upgrade |
| 00258 | TCH | Retrospective upgrade |
| 00722 | IV TCHP | Retrospective upgrade |
| 00731 | TCHP with separate subcutaneous trastuzumab | Retrospective upgrade |

00731 is not Phesgo. IV and oral vinorelbine are alternatives, not concurrent components. 00350 describes the antibody framework; its companion chemotherapy requires separate selection and assessment.

## Connected services

All ten suites connect the assessment engine, clinician knowledge and treatment rationale, clinician-only quantitative evidence, patient reference and sparse phase-specific body maps, date-free cycle graphs, whole-course monitoring maps, consent drafts, treatment guides, passports, wallet cards, administration logistics and route/day/phase-specific supportive-care documents.

The longitudinal maps distinguish baseline checks, checks during treatment and follow-up. They show cardiac monitoring relative to cycles without resetting the clock at maintenance or route changes. Surgery, radiotherapy, endocrine treatment, imaging and bone-health assessment are conditional on indication and the agreed care plan. These are reference maps, not appointment bookings, reminders or a system that detects missed tests.

Numeric survival and response evidence stays in the clinician knowledge base. Nineteen endpoint cards across ten profiles retain trial population, comparator, endpoint, timepoint and applicability limits. Patient rationale explains why treatment may be selected without adding numerical survival comparisons.

## Material source corrections

- Replace the incorrect fixed TCHP models in 00350 and 00775. TRAIN-2 follows the NCCP six-cycle Day 1/Day 8 schedule; an omitted Day 8 dose is not moved to Day 15. Trial evidence used nine cycles and is labelled accordingly.
- Correct lapatinib/capecitabine blood-count and component-specific toxicity handling, recurrence and delay context, DPD/brivudine exclusions, and confirmed CrCl versus indexed eGFR. Show continuous lapatinib through the capecitabine rest week and the early ECG separately from the echo schedule.
- Add explicit IV/oral vinorelbine selection, route-specific blood checks and antiemetic plans, source-correct delay/restart wording and active-component handling. Correct Phesgo reload information so it cannot inherit IV antibody doses.
- Preserve differing baseline and on-treatment cardiac thresholds across protocols. Exact unassigned count boundaries and conflicting source tables continue to require review.
- Prevent occurrence counts and treatment days from displaying CTCAE severity descriptions. Actual toxicity grades retain their explanations. Newly added source-defined adverse-event inputs do not invent a CTCAE version or a grading table absent from the source.
- Restore complete synthetic demonstration inputs. Demonstration values do not prefill live assessments.

## Validation and limits

See `validation/breast-expansion-v08416/INTEGRATION_REVIEW.md` and the machine-readable reports for completed checks and remaining source questions. Source/software verification does not establish clinical accuracy, independent clinical approval or suitability for an individual patient. Independent oncology, pharmacy and patient/PPI review remains pending.

The authored breast coverage is 56 of 71 enabled catalogue entries explicitly categorised as Breast (78.9%); 15 remain. Shared/multisite entries are excluded from that denominator. Across the whole platform, 84 suites are authored; 26 have the newer rationale/evidence review, leaving 58 in that retrospective queue. Authored and reviewed here do not mean clinically approved.

## Install

1. Start from the existing v0.84.15 repository. Keep its other files.
2. Extract the ZIP and merge its contents into the repository root, where `index.html` and `package.json` already live. Accept replacement of matching files. Do not place the extracted contents inside an additional nested folder and do not upload the ZIP itself as the website.
3. Review the changes, commit and push. The version indicators should read v0.84.16 once your hosting build has deployed.
4. Smoke-check 00217 (cycle/ECG), 00526 or 00798 (oral/IV support selection), 00775 (Day 1/Day 8), and 00350 (separate companion chemotherapy). A missing companion regimen must not produce a complete chemotherapy prescription.

No file deletions are required. `UPDATE_MANIFEST_v0.84.16.json` lists the exact included paths and SHA256 digests. Research PDFs, extracted publications, preview configuration and build dependencies are excluded; source locators and provenance remain in the audit folder.

## Commit summary

v0.84.16: add five breast suites and upgrade five HER2 pathways

## Commit description

Add full-service suites for NCCP 00217, 00350, 00526, 00775 and 00798, and retrospectively upgrade 00204, 00507, 00258, 00722 and 00731.

Reconcile assessment rules with the NCCP sources, including TRAIN-2 timing, the separate chemotherapy requirement for 00350, lapatinib/capecitabine toxicity and renal context, IV/oral vinorelbine differences, Phesgo reloads and phase-specific cardiac checks.

Connect clinician rationale and evidence, patient timelines and monitoring maps, consent, guides, passports, logistics and route/day/phase-specific supportive care. Keep numerical efficacy evidence in the clinician knowledge base. Fix severity descriptions appearing on occurrence counts and treatment days.

Restore a persistent feasibility-build notice and expandable disclaimer on the homepage and assessment screens, with matching clinical-boundary wording on the About page. State that independent clinical and oncology-pharmacy validation is pending and that the platform is not for routine clinical use.

Verify 449 new source-derived scenarios, 10 evidence profiles, 94 PDFs and 40 QR destinations, with scoped preservation of existing patient assets. Independent clinical/pharmacy and patient/PPI review remains pending.
