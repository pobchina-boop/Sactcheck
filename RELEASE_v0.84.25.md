# SACTCheck v0.84.25

Based on committed v0.84.24 (`a3f8a2744c5753413f230004118056ce8b20baf9`).

Five new targeted lung service suites and five retrospective upgrades now include the existing clinical decision tool audit, clinician knowledge and evidence, consent content, patient portal and anatomy, guide, passport, contact card, treatment/monitoring journey, supportive-care plans and practical logistics.

| NCCP | Suite | Change |
|---|---|---|
| 00823 | Tepotinib | New full suite; METex14 and prior-treatment setting |
| 00702 | Entrectinib | New full suite; separate adult ROS1 and NTRK contexts |
| 00221 | Afatinib | New full suite; EGFR, toxicity/recovery and organ-function pathways |
| 00565 | Dacomitinib | New full suite; EGFR, dose levels, hepatic/renal context and interactions |
| 00340 | Ceritinib | New full suite; post-crizotinib NCCP scope and current fed dosing |
| 00203 | Docetaxel 75 | Separate previously treated NSCLC suite; retain breast suite |
| 00226 | Weekly paclitaxel | Separate relapsed/refractory SCLC suite, including off-label status; retain breast suite |
| 00232 | IV vinorelbine | Separate lung suite; preserve existing breast content |
| 00259 | Oral vinorelbine | Separate lung suite and route-specific evidence; preserve breast content |
| 00215 | Bevacizumab 15 mg/kg | Lung platinum/erlotinib contexts kept distinct; preserve breast content |

## Audit findings carried through the services

- Source conflicts remain explicit review decisions: tepotinib severe renal impairment, afatinib renal/hepatic restrictions, dacomitinib renal/hepatic and acid-suppression qualifiers, and ceritinib source exclusions versus dose tables. The software does not invent a dose to resolve a disagreement.
- Preserve suspected versus confirmed lung toxicity, liver attribution and recovery conditions, restart versus discontinuation, exact toxicity grading editions and source-defined boundaries. Entrectinib hyperuricaemia does not invent a CTCAE v4 grade 2.
- Ceritinib uses the current 450 mg with-food schedule; its older 750 mg fasting trial evidence stays labelled. Tepotinib distinguishes 450 mg active drug from the trial's equivalent 500 mg salt dose.
- Weekly paclitaxel's lung context is relapsed/refractory small-cell disease, not NSCLC. Its small study used a different schedule and cannot supply a comparative survival claim. Docetaxel's six-cycle NSCLC cap does not transfer to breast cancer.
- Keep IV and oral vinorelbine evidence separate. Keep bevacizumab chemotherapy and erlotinib contexts separate. Single-arm evidence displays the actual outcome and explicitly states that no comparator exists; duration of response is defined for responders.
- Add indication selectors for shared patient links and clinician profiles. The current tumour context is evaluated on each selection. Unknown contexts do not inherit breast or lung evidence, monitoring journeys or treatment-duration assumptions. Sustainability metadata also follows the selected context without inventing carbon estimates.
- Fix a hidden current-toxicity field that could prevent weekly-paclitaxel completeness. Existing source-specific boundary and missing-value behaviour remains tested.
- Continuous oral plans use review milestones without fabricated chemotherapy cycles or patient date entry. PDF milestones retain their explanations and both monitoring tables; anatomy positions and connector layering are corrected for the new guides.

## Verification

- All 234 commands expanded from `test:ci` passed. The exact `npm --script-shell=bash run test:ci` command also passed on a fresh v0.84.24 checkout with the overlay applied (exit 0).
- All 2,603 source-derived assessment, boundary, display and retained regression cases in the six v0.84.25 audit groups passed against the integrated protocols.
- 80 primary PDFs / 150 pages: rendered visual review, page boundaries, complete guide support/urgent paragraphs and full milestone explanations checked. Compatibility download copies match byte for byte.
- 40 QR checks passed, including rendered guide, passport and treatment-card QR codes.
- All 4,437 pre-existing patient files remain byte-identical to committed v0.84.24.
- Browser checks covered empty/partial assessment, severe renal source conflict, lung/breast knowledge and download switching, patient selector navigation, milestone expansion, ceritinib consent, anatomy, guide opening and oral support selection.
- Coverage: 134 canonical authored patient records plus five separate lung contexts, totalling 139 context suites. Catalogue count remains 377 protocols. These counts do not mean every lung regimen or every indication is complete.

## Governance and application

This is a feasibility evaluation build. Source reconciliation, visual review and software tests do not establish independent clinical approval. Consultant, oncology-pharmacy and patient/PPI review remain pending; all clinical-use authorisation flags remain false.

Apply the overlay at the repository root and approve all matching replacements. Retain all other files. The package deletes nothing and does not commit, push or deploy. See `APPLY_UPDATE_v0.84.25.txt` and the complete SHA-256 manifest.
