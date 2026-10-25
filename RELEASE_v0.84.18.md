# SACTCheck v0.84.18

Five new breast full-service suites and five retrospective upgrades over committed v0.84.17, Git commit e6bd944ac3132d517959aa9c227d6bac74a6a9b7. Prepared for review and installation; not committed, pushed or deployed by this session.

## Scope

| NCCP | Regimen | Work |
| --- | --- | --- |
| 00377 | CMF with oral cyclophosphamide, every 28 days | New suite |
| 00378 | IV CMF, Days 1 and 8 every 28 days | New suite |
| 00381 | IV CMF, Day 1 every 21 days | New suite |
| 00430 | Gemcitabine 1,000 mg/m² / carboplatin AUC2, both Days 1 and 8 | New suite |
| 00749 | Gemcitabine 800 mg/m², Days 1, 8 and 15 every 28 days | New suite |
| 00316 | Dose-dense AC → fortnightly paclitaxel / weekly trastuzumab | Retrospective upgrade |
| 00433 | Dose-dense AC → weekly paclitaxel / weekly trastuzumab | Retrospective upgrade |
| 00745 | Dose-dense AC → weekly paclitaxel / three-weekly trastuzumab | Retrospective upgrade |
| 00512 | Weekly paclitaxel / weekly trastuzumab | Retrospective upgrade |
| 00815 | Weekly paclitaxel / three-weekly trastuzumab, IV or locally approved SC | Retrospective upgrade |

## Connected services

All ten regimens connect the assessment engine, clinician knowledge base, treatment rationale and evidence, patient information, date-free cycle graphs, agent-specific body maps, longitudinal monitoring, consent generator/drafts, guides, passports, wallet cards, logistics and phase/day-specific supportive care. Numerical trial endpoints remain in the clinician knowledge base. Patient explanations describe treatment purpose, selection and alternatives without numerical prognosis.

CMF maps distinguish tablet days from IV visits and separate adjuvant course lengths from metastatic treatment duration. Gemcitabine maps distinguish baseline eligibility, new-cycle checks and later treatment days. HER2 maps retain the cardiac monitoring clock through phase changes, with NCCP and supplementary EMA recommendations separately attributed. The maps explain expected care; they do not book appointments, detect missed tests or confirm test completion.

The permanent feasibility notice and expandable disclaimer remain. Independent oncology, pharmacy and patient/PPI review remains pending. Authored/source-reconciled does not mean approved for routine clinical use.

## Audit corrections

- Reconcile the three CMF protocols against their individual current v6 sources: oral versus IV cyclophosphamide, q28 versus q21 visits, adjuvant versus metastatic indications, DPD status, methotrexate precautions, count thresholds and drug-specific organ-function tables. Preserve overlaps and unassigned boundaries as review decisions. Do not infer extra Day 8 chemotherapy from the q21 source hydration wording.
- Correct the 00430 source/schedule mismatch: use the breast triple-negative regimen, carboplatin AUC2 followed by gemcitabine on BOTH Days 1 and 8, rather than the unrelated ovarian AUC4 schedule. Separate Day 1 recovery/history rules from Day 8 reductions or omission of both medicines; distinguish original-dose percentages from actual Day 1 dose percentages. Surface the source's off-label governance requirement.
- Reconcile 00749 baseline eligibility, Day 1 counts, later-day counts and restart criteria separately. Preserve the source's printed toxicity-grade boundaries and consultant choices instead of silently substituting an assumed rule. Add gemcitabine pulmonary/skin toxicity and organ-function review pathways.
- Distinguish baseline LVEF eligibility from current function and change from baseline across all five retrospective HER2 regimens. Correct 00815 ECOG/baseline counts and preserve hepatic reductions as percentages of the original paclitaxel dose. Do not automatically apply an AC febrile-neutropenia reduction to taxane treatment.
- Keep weekly and three-weekly trastuzumab schedules distinct. For 00815, retain fixed SC 600 mg without an IV loading dose, with local approval and formulation-specific missed-dose review. Flag the source's weekly/q21 missed-dose inconsistency and use EMA information explicitly.
- Keep AC, paclitaxel and trastuzumab-only support separate. Add the 00316 antibody-only Day 8 plan without taxane premedicines. Use current NCCP IV antiemetic guidance; oral cyclophosphamide uses the separately cited oral classification table.
- Reconcile clinician evidence to the population, intervention and endpoint actually studied: CMF cycle/route limitations; gemcitabine's small later-line cohort; the iniparib add-on trial; APT's anthracycline-free population; and the different questions answered by the anthracycline/trastuzumab and dose-density trials.

## Coverage and verification

- 94 authored suites across the platform; 66 of 71 enabled catalogue entries explicitly categorised as Breast (93.0%). Shared/multisite entries are outside that denominator.
- Ten rationale/evidence profiles reviewed this release; 46 cumulatively reviewed. The retrospective queue contains 48 suites across the platform, including 20 Breast entries.
- Five new Breast suites remain: 00545 zoledronic acid, 00605 talazoparib, 00688 atezolizumab/nab-paclitaxel, 00720 neratinib and 00738 bevacizumab/paclitaxel. Availability and current source status must be rechecked when that batch starts.
- 409 new source-derived assessment checks: CMF 168, gemcitabine 125, HER2 retrospective 116. Baseline passed 192 and failed 217; the revised implementation passes all 409. Failures represent test expectations, including missing coverage, and are not a count of distinct clinical errors.
- Full CI, existing AC/taxane/HER2 regressions, 93 PDFs (163 pages), identical download copies, 40 decoded QR destinations and 2,704 preserved out-of-scope patient files are recorded in `validation/cmf-gem-v08418/INTEGRATION_REVIEW.md`.

## Install and review

1. Start from committed v0.84.17 and retain the repository's other files.
2. Extract this ZIP and merge its contents into the repository root containing `index.html` and `package.json`. Replace matching files. Do not upload the ZIP as the website or introduce another enclosing folder.
3. Review, commit and push. After the hosting build, the public version should read v0.84.18.
4. Spot-check oral CMF (00377), the two IV CMF schedules, 00430 Day 8 decisions, the 00316 antibody-only Day 8 support plan and 00815 IV/SC selection.

No deletions are required. The ZIP contains complete changed/new files, a SHA256 manifest, source audits, regeneration scripts and copyable commit text. Downloaded source PDFs/extracted text, preview configuration, local screenshots, build output and dependencies are excluded. Source URLs and retrieval hashes remain in the audit records.
