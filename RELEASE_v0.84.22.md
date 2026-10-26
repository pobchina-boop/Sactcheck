# SACTCheck v0.84.22

Five new lung patient portals and five upgraded legacy lung suites, based on committed v0.84.21 (`768d2ff9209a92aa9365cd763153b38ecf4d4481`).

| Work | NCCP regimens |
|---|---|
| New portals | 00455, 00558, 00579, 00576, 00655 |
| Legacy suite upgrades | 00569, 00317, 00318, 00713, 00714 |

All ten connect assessment rules, clinician evidence, patient knowledge, consent support, guide, passport, logistics, treatment journey and separate supportive-care drafts. Patient timelines use treatment stages and monitoring milestones without requiring dates. Patient evidence stays qualitative; clinical evidence distinguishes trial populations and dose/schedule extrapolations.

## Source findings carried through the suite

- Pembrolizumab monotherapy: current 00455 v16 and 00558 v13 sources; preserve canonical protocol/indication identities. Lung patient materials have an explicit scope gate. Adjuvant treatment duration and metastatic 24-month review are kept distinct.
- Pembrolizumab combinations: source-specific toxicity and renal/hepatic actions; 00569 maintenance retains pemetrexed support, whereas 00579 maintenance is pembrolizumab alone. Abnormal blood results alone do not establish immune causation.
- Durvalumab: consolidation eligibility and both schedules; distinguish a treatment hold for AST/ALT >3 to <=10 times ULN from the permanent-stop threshold. Fixed-dose weight qualification and event-specific immune/restart pathways remain explicit.
- Nivolumab/ipilimumab combinations: the first NCCP cycle is 42 days, with chemotherapy on Days 1 and 22 and ipilimumab on Day 1 only. Subsequent Day 1 and Day 22 supportive-care plans are separate.
- Pemetrexed/platinum: source-specific count, renal and toxicity actions; separate mesothelioma, NSCLC, selected neoadjuvant and subsequent maintenance plans. Carboplatin AUC5 uses the audited carboplatin antiemetic pathway.
- Grading aids name the source edition where stated and explicitly leave it unspecified where the source does. They do not silently substitute generic CTCAE v5 definitions.
- Catalogue course labels now preserve induction followed by maintenance, source cycle ranges and time limits through metadata serialization.

## Verification and scope

- 1,613 integrated source-based cases: pembrolizumab monotherapy 233; pembrolizumab combinations 354; durvalumab 408; nivolumab combinations 402; pemetrexed/platinum 216.
- Full CI, security/build checks, strict protocol validation, all-library malformed/blank-input checks, static links and protected-file checks.
- 87 new/updated PDFs, 158 pages, identical patient/download copies and 40 passing QR checks. Representative layouts inspected visually.
- Browser verification of catalogue course labels, durvalumab ALT/blank assessment behavior, pembrolizumab scope routing and maintenance/Day 22 support selectors.
- 377 catalogue protocols retained; 119 registered portals and 116 authored suite records. Development retrospective inventory is 116/116; this is not an independent clinical-approval count.
- 3,690 outside-scope patient files preserved; breast work remains intact.

Binary NCCP PDFs were retrieved and hashed for eight codes. The 00569/00579 binary endpoints returned HTTP403; those audits used retrieved official PDF text and table views. Their saved text-snapshot hashes are identified as text hashes, not PDF hashes. Source URLs, provenance, own audit findings and reproducible assessment cases are included; full third-party source downloads are omitted from the release package.

The feasibility warning remains visible. Consultant, oncology-pharmacy and clinical-use authorisation flags remain false. Shared clinical protocols retain non-lung indications, but this release does not claim a complete new patient suite or new eligibility automation for every non-lung indication. Independent clinical, pharmacy and patient/PPI review remains required.

## Apply

Use `APPLY_UPDATE_v0.84.22.txt`. Extract at the repository root and replace all matching files. No deletions are required. The release was prepared without committing, pushing or externally deploying. A clean-baseline overlay check and SHA-256 manifest accompany the package.
