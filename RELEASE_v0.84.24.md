# SACTCheck v0.84.24

Based on committed v0.84.23 (`d17f8c486ca4cb3dce5b74833ffac7945d28b3af`).

This release completes five targeted lung service suites and modernises the two remaining legacy patient portals. Every regimen includes an audit of its existing decision tool, clinician knowledge and evidence, the consent pathway, patient reference, body map, guide, passport, treatment card, relative treatment/monitoring journey and supportive-care plan.

| NCCP | Service suite | Change |
|---|---|---|
| 00353 | Osimertinib | New full suite; separate NCCP monotherapy indications and treatment intent |
| 00401 | Alectinib | New full suite; separate adjuvant and advanced settings |
| 00562 | Brigatinib | New full suite; NCCP v4, lead-in/escalation and interruption pathways |
| 00570 | Lorlatinib | New full suite; metabolic, neurological, cardiac and interaction pathways |
| 00243 | Crizotinib | New full suite; separate ALK/ROS1 and treatment-line evidence |
| 00382 | Trifluridine/tipiracil | Legacy upgrade; NCCP v4 colorectal monotherapy scope and treatment-day/count boundaries |
| 00831 | Atezolizumab/bevacizumab for HCC | Legacy upgrade; component-specific immune and anti-VEGF decisions and IV/SC atezolizumab routes |

## Audit findings carried through the suite

- Preserve each medicine's blood-count, liver, kidney and toxicity rules. Ambiguous or conflicting sources remain explicit review pathways; the tool does not multiply unrelated reductions into a new dose.
- Separate baseline eligibility from on-treatment toxicity, suspected events from confirmed events, and withholding from permanent discontinuation or a qualified restart.
- Update brigatinib and trifluridine/tipiracil to freshly retrieved NCCP v4 sources. Lorlatinib's available migrated source remains v3: cached/indexed v4 claims and a failing legacy URL are recorded as a provenance discrepancy. First-line product-label/trial information is not presented as verified new NCCP eligibility.
- Correct oral emetic-risk classifications where specified by the regimen, without automatically applying an intravenous chemotherapy prescription.
- Separate clinician trial evidence by population, indication and comparator. Patient materials give qualitative explanations, not personal survival predictions.
- Continuous oral treatment uses review milestones without fabricated 21/28-day chemotherapy cycles or patient date entry. Fixed adjuvant treatment limits remain distinct from ongoing advanced treatment.
- Add medicine-specific consent-generator profiles for the ALK inhibitors, alongside the regimen-level consent discussion aids.
- Preserve the existing HCC contact-card download and all patient bundles outside this seven-regimen scope.

## Verification

- All 225 commands expanded from the full `test:ci` workflow passed. The exact `npm --script-shell=bash run test:ci` command also passed after applying the ZIP to a fresh v0.84.23 checkout (exit 0).
- All 1,676 new source-derived assessment, boundary and dose-display cases passed against the integrated protocols.
- 56 primary PDFs, 105 pages: page boundaries checked, complete guide support/urgent paragraphs retained, rendered layouts reviewed and download copies identical. Two HCC contact-card compatibility copies also match the current card.
- 28 QR checks passed, including rendered guide, passport and treatment-card codes.
- All 4,210 patient assets outside the seven-regimen scope remain byte-identical to v0.84.23.
- 129 authored full suites and registered patient bundles; the authored-suite retrospective development review queue is clear. These counts do not mean every lung regimen or indication is covered.
- Browser checks covered blank and partial assessment safety, visible dose actions, continuous schedules, consent, indication-specific knowledge, support selection, anatomy and patient interactions.
- The HCC legacy consent renderer now retains every medicine-specific risk; adding new risks no longer hides jaw-bone damage or PRES through its old eight-item limit.

## Governance and application

This is a feasibility evaluation build. Source checks and software tests do not establish independent clinical approval. Consultant, oncology pharmacy and patient/PPI review remain pending. All clinical-use authorisation flags remain false.

Apply the overlay at the repository root and approve all matching replacements. Retain all other files. No files are deleted; no commit, push or deployment is performed by this package. See `APPLY_UPDATE_v0.84.24.txt` and the complete SHA-256 manifest.
