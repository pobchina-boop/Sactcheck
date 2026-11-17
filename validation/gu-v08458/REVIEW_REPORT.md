# SACTCheck v0.84.58 — ten suites plus five retrospective audits

Manual review package based on v0.84.57 commit `0eba2249a65dce9bcdf6be1b2115869b9563cd38`. No commit, push or deployment was performed.

## Scope and audit coverage

| NCCP | Regimen | Work | Focused cases | Handbook pages |
|---|---|---|---:|---:|
| 00282 | Gemcitabine and cisplatin 70 mg/m² — 28-day | new authored suite | 39 | 24 |
| 00622 | Gemcitabine and split-dose cisplatin 35 mg/m² — 21-day | new authored suite | 32 | 25 |
| 00628 | Adjuvant gemcitabine and cisplatin 70 mg/m² — upper-tract urothelial cancer | new authored suite | 31 | 24 |
| 00450 | Mitomycin and five-day fluorouracil with bladder radiotherapy | new authored suite | 10 | 26 |
| 00759 | Gemcitabine 100 mg/m² with bladder radiotherapy | new authored suite | 9 | 21 |
| 00333 | Dose-dense MVAC — 14-day | new authored suite | 51 | 28 |
| 00337 | CMV before definitive treatment — 21-day | new authored suite | 35 | 26 |
| 00338 | MVAC — 28-day | new authored suite | 49 | 30 |
| 00583 | Pembrolizumab 200 mg with axitinib | new authored suite | 46 | 22 |
| 00846 | Enfortumab vedotin monotherapy | new authored suite | 21 | 22 |
| 00104 | Axitinib Monotherapy | retrospective | 23 | retained |
| 00518 | Cabozantinib Monotherapy | retrospective | 26 | retained |
| 00564 | Tivozanib Monotherapy | retrospective | 31 | retained |
| 00326 | Temsirolimus Therapy | retrospective | 20 | retained |
| 00588 | Olaparib (Tablet) Monotherapy | retrospective | 15 | retained |

All ten new suites cover the assessment inputs/rules, source-linked knowledge base, clinical workflow and monitoring, phase-specific supportive care, generic plus agent-specific consent, patient portal/anatomical effects, printable guide, handbook, passport, card and QR destinations. These are authored suites for existing encoded NCCP protocols, not ten new unique protocol codes.

## What passed

- 323 new-suite and 115 retrospective source/engine cases: 438/438. Missing inputs and source ambiguities do not authorise treatment.
- Ten-suite integration checks and current v0.84.57-to-v0.84.58 protected-content verification passed. 12,578 protected baseline files and 129 historical evidence records were checked against the current baseline or explicitly recorded transitions. This is separate from the older historical chain.
- All 377 protocol entries rebuilt; card metadata coverage passed after fixing raw authoring metadata being copied into the normalized sidecar.
- LFT audit, core engine/schema/conditional inputs, integrated lab-dose checks, GU library, chronology, UI-refresh and workflow unit checks passed. See raw logs for exact scope.
- Final ten handbook/guide builds and independent verifier: 50 preserved-page comparisons and 20 printed QR checks. Pack verification checks anatomical pixels, aspect ratio, card dimensions and text geometry. All 10 consents preserve their current HTML risk statements in PDFs.
- Final document freshness audit: 111 artifact checks plus 60 final book-PDF mirror comparisons. Standalone companion current-input hashes remained current.
- Global design/consent publication check: 299 routes, 3,426 documents, zero pending changes.
- Local site build and 105 HTTP paths passed, including current version, PDFs and byte equality with source files. Repository security scan passed. These are not browser or live-deployment tests.

## Actual validation limits

- Chromium preflight was blocked by socket permissions. No repeated launch, escalation, browser/device pass or deployment check is claimed.
- Full CI, the complete historical provenance chain and the full deployable-site validator could not complete in this partial Git checkout. Tracing showed historical `git ls-tree -rlz` triggering lazy retrieval of unavailable blobs. With lazy fetching disabled it fails promptly. A new preflight reports this before CI; its two parsing tests pass. A full checkout with retained historical objects is required for the unchanged full gates.
- Some combined commands exit nonzero after successful subchecks because they reach this historical-data blocker. Their status is retained as failed/blocked, not relabelled passed.
- A companion renderer exited 139 after writing group2 outputs; separate current-input/content/geometry/mirror/QR verification passed. Both facts are recorded.
- Independent consultant/oncology-pharmacy approval and clinical-use authorisation remain false. This is a feasibility/review build. Example contact details must be replaced by the treating service before patient use.

## Material clinical distinctions retained

- Gemcitabine/cisplatin schedules are separate:28-day, split-dose21-day and four-cycle adjuvant upper-tract21-day. Source-specific renal/count boundaries and gaps remain explicit.
- Mitomycin is an IV bolus; each 5-FU pump runs120 hours on days 1–5 and 22–26 with radiotherapy. Weekly radiosensitising gemcitabine is 100 mg/m², not 1000.
- Dose-dense MVAC is the cited advanced-disease protocol with G-CSF days 3–7; CMV is a 21-day neoadjuvant schedule with mandatory folinic-acid rescue; conventional MVAC separates 3 neoadjuvant, 4 adjuvant and up to 6 advanced-disease cycles.
- Pembrolizumab/axitinib distinguishes immune toxicity from TKI toxicity, preserves the no-dose-reduction rule for pembrolizumab, and requires clinician confirmation for the ambiguous source urine-protein ratio threshold.
- Enfortumab monotherapy retains day 1/8/15 timing, capped dose levels, skin/neuropathy/lung/glucose holds or stops and renal/dialysis review. It is not the enfortumab/pembrolizumab combination.
- Generic chemotherapy, immunotherapy and/or targeted-treatment risk sections remain alongside agent-specific consent risks. The immune supplement includes neurological, endocrine, eye, pancreas, blood and delayed/permanent effects.
- National NCIS v8 low-risk antiemetics are reconciled; historical local/CUH adjuncts, including PPI, remain explicit local alternatives requiring prescription/interaction review. Methotrexate/PPI and vinblastine/aprepitant interactions are highlighted.

## Source conflicts needing clinical/pharmacy reconciliation

00622 has conflicting renal eligibility/dose-table statements;00337 has a 14-day footer against the 21-day treatment-body schedule;00759 is the latest listed source retrieved but its stated review date has expired;00846 NCCP/EMA dialysis wording is not treated as proven dosing safety. Exact numeric gaps or conflicting thresholds trigger review rather than invented interpolation. Source PDFs and hashes are included.

## Retrospective preservation

All five freshly retrieved NCCP PDFs match the preceding audit source bytes. Four freshly retrieved EMA product documents match prior files; current Lynparza information was reviewed through the official web PDF after direct download returned 429, so no fresh Lynparza byte-hash claim is made. Across the five routes, 185 files retain identical bytes. Ten knowledge-print HTML files changed through the canonical UI publication pass; their visible clinical text, external sources and anatomical targets remain identical, and local asset paths resolve. The breast 00588 route and the lung 00568 pitch suite remain protected by the current-baseline audit.

## Remaining authored-suite coverage

The catalogue contains 377 encoded protocols, with 15 haematology protocols hidden. 261 unique codes have at least one authored suite, 291 bundles and 299 discoverable routes. 101 of 362 visible solid-tumour codes lack an authored suite. This is a coverage measure, not a claim that all existing suites or indication contexts are clinically validated.

Six GU codes remain: 00453 carboplatin AUC 7/etoposide 750; 00602 TIP; 00807 intravesical BCG; 00885 erdafitinib; 00894 intravesical gemcitabine/docetaxel; 00945 enfortumab/pembrolizumab.

## Reproduction and next step

Use a complete checkout retaining historical objects. The included manual-validation workflow uses full history and separates browser/regression jobs, with logs retained. It has not been dispatched. Run the existing complete gates and browser checks before considering release readiness. Node used here: 24.22.1; the workflow uses Node 20. No test assertions or clinical acceptance criteria were removed to work around the environment.

Detailed evidence: `audit-matrix.json`, `coverage.json`, `clinical/`, `pdf/`, `software/`, and `asset-migrations.json`.
