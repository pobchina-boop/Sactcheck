# SACTCheck v0.84.45 — head and neck, retrospective audit and patient presentation

This manual update is based on v0.84.44 at `a4575d67a985c97a1dfa545813a8c1a25b2ed5a2`. No commit, push, merge or deployment was performed while preparing it. Apply the complete supplied ZIP over that baseline before committing.

## Clinical scope

Five previously catalogued regimen families gain six indication-specific full patient services. These are new service suites, not five additions to the NCCP protocol catalogue.

| NCCP | New service | Current source |
| --- | --- | --- |
| 00387 | Cisplatin 100 mg/m² every three weeks with head-and-neck radiotherapy | v5 |
| 00385 | Weekly cisplatin with radiotherapy: separate head-and-neck and nasopharyngeal routes | v5 |
| 00207 | Weekly cetuximab with head-and-neck radiotherapy; existing colorectal route kept separate | v6 |
| 00705 | Pembrolizumab, carboplatin and fluorouracil | v2d |
| 00706 | Pembrolizumab, cisplatin and fluorouracil | v3 |

Five retrospective protocol audits cover pembrolizumab 200 mg (00455 v16), pembrolizumab 400 mg (00558 v13), weekly cetuximab/FOLFIRI (00328 v7), cetuximab/modified FOLFOX6 (00733 v2a), and cisplatin/etoposide with thoracic radiotherapy (00456 v4). Shared indications mean the ten protocol audits update nineteen patient contexts, including the existing colorectal cetuximab root and existing pembrolizumab lung, colorectal and melanoma material.

The ten official NCCP PDFs, retrieval records, hashes, page/table references and independent source-derived cases are retained under `validation/head-neck-v08445/`. `clinical-migration.json` binds the implemented protocols to their source and test evidence. The nineteen-context `consistency-matrix.csv` records the full service coverage.

## Findings carried through the services

- Keep regimen-specific blood-count, renal and toxicity boundaries separate. Weekly cisplatin 00385, three-weekly cisplatin 00387 and combination cisplatin 00706 do not share one dose-adjustment table. Ambiguous fractional boundaries require review rather than an invented dose.
- Keep cisplatin administration linked to the prescribed radiotherapy plan, and distinguish hearing and neurological assessment from renal dosing.
- Keep combination chemotherapy and pembrolizumab maintenance separate. Current cytotoxic actions do not leak into maintenance; the 5-FU infusion alternatives and up-to-six combination cycles do not become a universal 96-hour pump or an automatic 24-month pembrolizumab stop.
- A single AST result supplies both its absolute value and the immune-toxicity ULN calculation. A single bilirubin result does the same. Missing ALT is not assumed normal. Clinicians still need to establish the cause of abnormal tests.
- Preserve immune permanent-stop history, recovery and specialist restart decisions, and serious overlapping cardiac, muscle and neurological toxicity. Do not borrow the 00455 perioperative melanoma context for 00558.
- Carry fluorouracil holds/omissions through folinic-acid plans where required, and retain DPD status, relevant interacting medicines, UGT1A1 risk and oxaliplatin neuropathy history.
- Correct the 00456 blood-count equality handling against the actual underlined source-table inequalities. The historical replay records the two affected assertions explicitly.
- Make the NCCP/SmPC cetuximab observation discrepancy and the 00733 two-weekly licensing qualification visible for review. Do not invent a CTCAE version where the cytotoxic source does not specify one.
- Remove an inappropriate generic “approximately two days” claim from the shared fluorouracil mechanism description. Exact infusion duration remains regimen-specific.

These are source-reconciled software encodings. Independent clinical, oncology-pharmacy and patient/PPI approval remains pending; the existing feasibility-build warning remains visible.

## Patient presentation and print

Across 234 authored routes, the portal starts with three clearly separated essentials: schedule/tests and between-treatment expectations; detailed anatomical toxicity information; and the treatment/contact card. Five deeper destinations then lead to the overall treatment, tests, between-treatment information, passport and resources. The detailed OncoWiki remains available.

The nineteen clinically updated routes have three-page packs, separate front/back wallet sheets, automatic regimen-specific QR codes, cutting instructions and 85.6 × 54 mm card panels. Placeholder contact numbers remain labelled examples. Across the whole catalogue, 119 earlier two-page guides remain intentionally preserved alongside their card; the update does not claim that every historical PDF has already become a three-page guide.

All 234 complete handbooks have a logical reading sequence, clear chapter openings, actual contents/folios and offline-readable explanations. The full handbook remains separate from the distilled pack. The consolidation restores 87 previously identified unique clauses across 31 routes; the frozen companion audit and independent checks protect unique instructions while removing duplication. Detailed anatomical pixels, explanatory content and wallet geometry remain protected.

Some optional standalone journey sheets still repeat monitoring maps or have sparse continuation pages. Other recorded UI debt includes the main header library anchor, a reference dose-level table that lists cytotoxic levels during maintenance, old generator-version footers and an inherited CUH contact label. These are recorded rather than described as resolved. The active maintenance schedule/actions and dedicated return-to-library control were exercised successfully.

## Verification evidence

- Current-source scenarios: 1,801 clinical cases plus 12 platinum structural checks; all passed before final packaging.
- Historical replays include 535 cetuximab-family cases, 183 immune cases with two explicitly documented negative-history additions, and 198 thoracic-radiotherapy cases with two source-proven equality corrections.
- Published handbook/reference/guide verification: 234 routes, 702 document outputs, 914 preserved-page comparisons and 468 decoded PDF QR checks, with download mirrors checked.
- Nineteen clinical guide/card bundles: 38 PDFs, guide page counts, anatomical content, card dimensions and image/PDF QR checks.
- Additional current companion PDFs: 128 documents, 231 pages, 3,507 source-text units and 19 PDF QR checks; no content or bounds errors.
- Independent canonical retention: 87 clauses across 31 routes passed.
- Print chronology regression: four tests passed, including repeated day axes, intact label/band groups, full clinical instructions and unchanged anatomical/card content.
- Strict provenance compares 2,484 reviewed asset transitions with original Git blobs, protecting unrelated source and anatomical assets. All 8,396 historical objects required by the regression comparisons were recovered; no history check was waived because the checkout was partial.

`npm run test:ci` passed in a fresh disposable copy (exit code 0). The final release-validation result and full command log are recorded separately in `validation/head-neck-v08445/release-validation.json` and its referenced compressed log. Node 24.22.1 was used; repository CI specifies Node 20.

Interactive Chromium checks covered selected clinician input/phase flows, consent, patient downloads, support plans, indication routing and patient pages at desktop and 390/320-pixel widths. The native automated browser command could not launch Chromium because of a socket EPERM restriction; its escalation was rejected. Supported interactive browser checks are recorded separately and are not reported as a passing native E2E run. Real iPhone/Safari and Android installation, camera scanning and physical printing remain unverified.

The live release was observed as v0.84.44 during preparation. Canonical-route checks distinguish existing destinations from the six unpublished routes. v0.84.45 deployment can only be checked after the manual update is committed and pushed.

## Coverage and boundaries

The catalogue remains 377 protocols: 362 visible solid-tumour entries and 15 hidden haematology entries. Haematology data/code remain present. The patient registry has 203 roots and 234 authored routes. This is the first five-family head-and-neck service batch, not head-and-neck completion or a fresh clinical source audit of all 234 patient routes. The broader consistency audit across every tumour group remains a separate MVP milestone.
