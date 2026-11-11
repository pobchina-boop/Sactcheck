# SACTCheck v0.84.48 — induction TPF and weekly carboplatin suites

Manual review package based on v0.84.47, Git `5380c7d8665645d54b06c76011d420efc4e767a6`. No commit, push or deployment was performed. This is a feasibility build; independent clinical, oncology-pharmacy and patient/PPI review remain outstanding.

## Scope

Five new full service suites for existing protocols; no new protocol catalogue entries. The catalogue remains 377 protocols. Authored patient routes increase from 244 to 249. The registry contains 213 protocol codes and 240 bundle routes; nine additional legacy/specialised authored routes are counted by the publication inventory, not by the registry bundle count.

| New service | Current official source | Treatment distinction |
|---|---|---|
| 00315 | v7a | Docetaxel 75 / cisplatin 75 / fluorouracil 1000 induction, three 21-day cycles |
| 00323 | v7b | Docetaxel 75 / cisplatin 100 / fluorouracil 1000, three cycles, then separately assessed carboplatin chemoradiation |
| 00324 | v6b | Docetaxel 75 / cisplatin 75 / fluorouracil 750, four cycles, then radiotherapy |
| 00332 | v4 | Carboplatin AUC1.5 weekly for seven planned doses during radiotherapy |
| 00419/head_neck | v6 | Carboplatin AUC2 weekly for six planned doses during radiotherapy; HNSCC patient information only |

Retrospective audits: 00314, 00552, 00417, 00418 and 00696. Their clinician grading labels are corrected to disclose the unspecified NCCP edition; patient documents and dose actions are retained. These were selected for this batch because they were the immediately preceding additions; no pre-existing ordered retrospective queue was inferred.

## What was audited

| Component | Checks and changes |
|---|---|
| Clinical decision tool | Fresh official NCCP source retrieval for all ten; source/table references and hashes retained. Baseline versus treatment-day criteria, raw laboratory/ULN handling, count boundaries, component-specific renal/hepatic actions, toxicity, recurrence, recovery, dose history and permanent-stop logic checked with the actual engine and dose display. |
| Clinical workflow and supportive care | Exact treatment phases, active medicines and source-bound selectors; induction support does not follow the patient into radiotherapy-only or later carboplatin phases. Existing CUH adjunct references, including the PPI, are retained for the five new authored plans, with national/local distinctions visible. |
| Knowledge base | Five regimen-specific clinician profiles, indication/intent, treatment sequencing, evidence limitations and source-linked outcomes. Monitoring rows agree with the patient profiles. No universal imaging/tumour-marker panel invented. |
| Consent | Agent-specific risks, radiation/phase scope, alternatives, supportive-care discussion and signatures retained in complete HTML and one-page A4 forms. Off-label/unlicensed source requirements remain explicit where applicable. |
| Patient portal | Exact regimen/context routing, source-linked monitoring, treatment journey, logistics, support, port/pump information where applicable, and clinical-to-patient consistency. Cervical/unselected 00419 requests go to a scope guard. |
| Patient pack and wallet | Three-page guide, unchanged detailed anatomical image pixels/scale, complete toxicity callouts, 85.6 × 54 mm wallet panels, readable bounds and exact decoded QR destinations. |
| Handbook | Five complete books using the current five-chapter layout, one contents page, full-page chapter openers, scoped clinical content and complete support supplements. Companion retention audit accounts for all clinical clauses and table rows. |
| Retrospective preservation | Fresh byte comparison of every profile and patient/docs asset for all five retrospective routes against Git47; fresh guide/wallet page-count and QR decoding. Existing current-standard books retained unchanged. |

## Substantive corrections

- New assessment fields now carry explicit demo values. All ten audited protocols now carry source-specific grading labels. NCCP edition-unspecified grades are not presented as an asserted CTCAE v5 standard. These are display/demo metadata corrections; source predicates and component actions are unchanged.
- 00315: source-specific count reductions, mandatory G-CSF support, renal dose bands, component-specific hepatic decisions and recovery/history safeguards.
- 00323/00324: separate baseline renal exclusion from on-treatment adjustment; preserve docetaxel **75 mg/m²** rather than misinterpreting it as **75%**; distinguish three- and four-cycle pathways and their later treatment phases.
- 00332: seven weekly doses, concurrent-radiation guard and explicit review at source boundary gaps.
- 00419: update the encoded protocol from v4 to current v6, six weekly doses, corrected count/recovery logic and renal safeguards. Preserve the existing shared clinical protocol and its cervical indication, with separate HNSCC patient content. Add an explicit old-ID compatibility mapping.
- 00418 retrospective: keep the conservative 20–30 renal review action, but correctly label that cutoff as an authored safety policy requiring local validation. NCCP 00418 itself specifies ≤20 and <60, not a 30 cutoff.

Source ambiguities remain visible: the 00332 radiation-start timing anchor; fractional count/source gaps; and the 00419 reference to subsequent 00552, whose indication is specifically nasopharyngeal disease. The software does not resolve these by inventing a universal treatment sequence.

## Verification evidence

- Current official PDFs, extracted text, retrieval details and SHA-256: `validation/head-neck-v08448/sources/`.
- TPF source scenarios: 181/181; carboplatin plus retrospective scenarios: 130/130. These are scenario counts, not counts of independent clinical defects.
- Complete ten-route suite checks: context, source version, consent risks, monitoring and 90 PDF mirror checks.
- New PDF outputs: 39 companion PDFs (73 pages), five three-page guides, five wallet sheets and ten knowledge/handbook PDFs. Handbook lengths: 36, 38, 38, 30 and 30 pages.
- Pack verification: anatomy pixels/physical scale, callout and wallet internal bounds, complete text, wallet dimensions, QR PNGs and rasterised PDF QR decoding.
- Final book verification: five routes, 25 preserved-page checks and ten QR checks; both public mirrors equal the verified PDFs. Book assembly deliberately re-renders guide page one from final HTML while preserving the reviewed anatomical/wallet pages; the staged pack report and final book report document those separate stages. The newly approved pack baseline is retained in `pdf/approved-pack-baseline.zip`; it is not a previous-release baseline.
- Companion verification: 1,386 text units, five QR checks, zero failed documents; 420 retained companion units and 21 reviewed UI/metadata exclusions in the content consolidation audit.
- Regenerated historical reports are archived under `checks/regenerated-legacy-reports.zip`; original historical report files remain unchanged.
- Retrospective asset proof: `checks/retrospective-assets.json`. Original source PDFs for the five retrospective regimens remain byte-identical to the v47 sources.
- Exact scope and immutable before/after inventory: `scope.json` and `asset-migrations.json`. Historical migration records and unrelated clinical/patient assets remain protected.
- Representative rendered pack, consent and handbook pages were visually reviewed. Automated document checks cover the full five new routes; this is not a visual inspection of every page by an independent reviewer.
- CI stages: all 31 configured stages passed across the initial run and logged continuations. The initial `npm run test:ci` stopped on an obsolete 00419 maintenance-phase expectation; the remaining stages were rerun/resumed after exact source-bound, migration-membership and version-allowlist corrections. No assertions were skipped. This does not claim a zero exit from the original monolithic command. Final clinician grading metadata was additionally checked by all nine commands in `checks/final-focused-checks.json`. Tested runtime: Node 24.22.1 (CI specifies Node 20); Python 3.12.14, WeasyPrint 70.0, PyMuPDF 1.26.6.

## Blocked and unverified stages

The required patient-browser command was attempted and failed before tests could run because Chromium could not create its singleton Unix socket (`Operation not permitted`). The managed browser could not access the local preview (bearer-token error), and local-file navigation was disallowed. No browser-policy bypass was attempted. Evidence is in `checks/patient-browser.log`.

Desktop/mobile interactive behavior, Safari/iPhone and Android installation, camera scanning, physical printing, live QR destinations and exact-commit deployment are therefore **unverified**. QR decoding verifies the embedded destination, not whether the new URL has already been deployed. This package is for review and is not represented as an end-to-end production-ready release.

Recovery checkpoint: a source archive, full Git bundle and checksums were created before editing. They are in the same managed workspace, not an independently stored offline backup.

## Apply

See `APPLY_v0.84.48.txt`. Copy the ZIP's contents into the existing v0.84.47 repository, accepting file replacements; do not delete the repository. Retain full Git history for the pinned historical checks. Use a review/development branch while browser verification is outstanding. The repository's main branch can deploy automatically when pushed; do not treat this manual ZIP as an instruction to bypass the outstanding browser gate.
