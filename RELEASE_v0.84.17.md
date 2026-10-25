# SACTCheck v0.84.17

Five new breast full-service suites and five retrospective upgrades over verified v0.84.16, Git commit 70503e943eaed24817b4da9b04d05d4b6360c82f. Prepared for review and installation; not committed, pushed or deployed by this session.

## Scope

| NCCP | Regimen | Work |
| --- | --- | --- |
| 00262 | EC90, adjuvant | New suite |
| 00263 | EC75, metastatic | New suite |
| 00265 | FEC100, neoadjuvant/adjuvant | New suite |
| 00269 | FEC50, metastatic | New suite |
| 00423 | Doxorubicin 50 / docetaxel 75 (AT), locally advanced/metastatic | New suite |
| 00250 | TC | Retrospective upgrade |
| 00252 | AC every 21 days | Retrospective upgrade |
| 00260 | AC → weekly paclitaxel | Retrospective upgrade |
| 00278 | Dose-dense AC → paclitaxel every 14 days | Retrospective upgrade |
| 00432 | AC → weekly paclitaxel/trastuzumab → trastuzumab continuation | Retrospective upgrade |

## Connected services

The ten regimens connect the treatment assessment engine, clinician knowledge base, treatment rationale and evidence, patient reference information, date-free cycle graphs, agent-specific body maps, longitudinal monitoring maps, consent generator/drafts, guides, passports, wallet cards, logistics and phase-specific supportive-care plans. Numerical trial outcomes remain in the clinician knowledge base; the patient explanation describes selection and alternatives without numerical prognosis.

The maps distinguish baseline, in-treatment, phase-transition and follow-up checks. Cardiac monitoring is risk adapted for anthracyclines, with NCCP requirements distinguished from supplementary ESC guidance. Trastuzumab monitoring continues across the chemotherapy-to-continuation transition. Metastatic imaging is contextualised against treatment cycles; early-stage surveillance, endocrine-linked DEXA, tumour markers, surgery and radiotherapy remain indication-specific. These maps explain expected care; they do not book appointments, detect missed tests or confirm test completion.

The permanent feasibility notice and expandable disclaimer remain visible on the homepage and assessment screens. Independent oncology, pharmacy and patient/PPI review remains pending. No automated Oncotype triage is introduced.

## Audit corrections

- Reconcile EC, FEC and AT against their individual NCCP tables instead of inheriting a common family rule. FEC100 is reconciled to v7 and FEC50 to v8; legacy internal IDs remain stable for existing links.
- Distinguish FEC Day 1 counts from nadir counts and the table applied after a one-week delay. Record previous febrile-neutropenia episodes separately from severity grades. Preserve source alternatives and escalate unassigned boundaries.
- Add DPD, concurrent-radiotherapy and fluoropyrimidine cardiac exclusions. A single AST result drives the absolute 5-FU threshold and the epirubicin ULN calculation, without duplicate entry. EC and FEC use different epirubicin AST bands; their CrCl 20 boundaries also differ.
- Distinguish AT baseline eligibility from ongoing treatment, preserve its source-specific hepatic patterns and flag 75 mg/m² as the existing docetaxel starting dose rather than inventing a reduction. Grade 4 skin toxicity does not silently borrow the grade 3 dose rule.
- Keep AC, taxane and trastuzumab-only supportive prescriptions separate. Align the assessment summary with NCCP V8, including the dedicated AC subsequent-day schedule and reconciliation of docetaxel steroids. Dose-dense G-CSF product/days remain an individual/local prescription.
- Preserve the NCCP 00432 transition after 12 weekly paclitaxel/trastuzumab doses to 21-day trastuzumab under regimen 00200, to complete one total year. Do not reuse weekly missed-dose/loading rules for that continuation schedule.

## Coverage and verification

- 89 authored suites across the platform; 61 of 71 enabled entries explicitly categorised as Breast (85.9%). Ten Breast entries remain. Shared/multisite entries are outside this denominator.
- Ten rationale/evidence profiles reviewed this release; 36 cumulatively reviewed, with 53 remaining in the retrospective queue. These counts do not imply clinical approval.
- 179 new source-derived assessment cases; the baseline passed 46 and failed 133, and the revised implementation passes all 179. Failures include missing coverage and boundary expectations, not 133 distinct clinical errors.
- Existing AC/taxane source regressions, full integration checks, PDF bounds and compatibility checks, QR decoding and scoped preservation are recorded in `validation/anthracycline-v08417/INTEGRATION_REVIEW.md`.

## Install and review

1. Start from the committed v0.84.16 repository and retain its other files.
2. Extract this ZIP and merge its contents into the repository root containing `index.html` and `package.json`. Accept replacement of matching files. Do not upload the ZIP as the website or add an extra enclosing folder.
3. Review, commit and push. After the hosting build finishes, the public version should read v0.84.17.
4. Review FEC100 (00265) for DPD, absolute AST and sequential radiotherapy; EC90 (00262) for the four-cycle course; and AC–TH (00432) for three separate supportive-care phases and continuing echo checks.

No deletions are required. The ZIP includes complete changed/new files, a SHA256 manifest, audit reports, regeneration scripts and commit text. Research PDFs and extracted source text, preview configuration, local screenshots and build dependencies are excluded. Source URLs and retrieval hashes remain in the audit folder.
