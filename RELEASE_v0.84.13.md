# SACTCheck v0.84.13

Apply this cumulative update over v0.84.12. Extract the ZIP and copy its contents into the repository root, preserving folders and replacing matching files. Commit the extracted files, not the ZIP. No deletion is required. The package does not deploy or push a commit.

## Five new full suites

| NCCP | Pathway |
|---|---|
| 00858 | Pembrolizumab 200 mg q3w + weekly carboplatin AUC1.5/paclitaxel → q21 AC |
| 00860 | Pembrolizumab 400 mg q6w + carboplatin AUC5 q21/weekly paclitaxel → dose-dense AC |
| 00861 | Pembrolizumab 400 mg q6w + weekly carboplatin AUC1.5/paclitaxel → dose-dense AC |
| 00348 | Carboplatin AUC6 q21/weekly paclitaxel → dose-dense AC |
| 00734 | Weekly carboplatin AUC2/paclitaxel → dose-dense AC |

Each suite includes source-reconciled assessment rules, clinician knowledge, plain-language patient rationale, date-free phase timelines, agent-specific maps, longitudinal monitoring and surgery/radiation sequencing, consent tools, phase-specific supportive prescriptions, visual guide, passport, treatment card, line/visit logistics, QR routes and source-constrained sustainability metadata.

00857 receives the same rationale/evidence display and revised patient pathway. This is a content revision; its previously reconciled clinical rules remain unchanged.

## Retrospective rollout

The reusable clinician evidence display is in place, with six reviewed profiles. The rest is deliberately staged: 73 other authored suites remain in the indication-specific rationale/evidence review queue. The inventory covers all 79 authored patient knowledge suites, including original gold-standard 00568; this is not a clinical-validation count. Eight other registry entries are not counted as authored full-suite knowledge records.

Recommended review order: HER2-directed breast pathways; HR-positive endocrine/CDK4/6 pathways; remaining breast cytotoxic/targeted treatments; then colorectal and the other tissue libraries. Use batches of five where source and indication checks are distinct; reuse presentation only when the clinical content has been checked separately. Each pass must check comparator, population, line, exact schedule applicability, endpoint definition/time point, absolute effect, uncertainty, harms, maturity and audience separation.

Breast longitudinal maps now cover 56 of 83 catalogue contexts (67.5%). This measures authored longitudinal coverage, not completed clinical validation.

Start a review with 00860: it demonstrates six-weekly immunotherapy across a chemotherapy phase change. Use 00734 to check weekly platinum and the evidence-gap presentation; use 00857 to inspect the retrospective changes.

Quantitative clinical evidence remains in clinician knowledge for these six pathways. The software/source checks do not constitute oncology/pharmacy sign-off. Browser interaction verification remains incomplete because the supported preview browser was blocked by environment policy.
