# SACTCheck v0.84.60 — first five sarcoma review suites

**Status: five authored review suites; scoped clinical, integration, document and static-build checks passed.** Independent consultant and oncology-pharmacy approval remain pending. The archive acceptance record reports the final baseline-preservation result after this source snapshot is frozen.

This update builds on v0.84.59 at commit `c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c` and adds full review suites for NCCP 00500 (doxorubicin), 00391 and 00392 (the distinct doxorubicin/ifosfamide schedules), 00501 (gemcitabine/docetaxel) and 00511 (dacarbazine). Source IDs and source versions are unchanged: 3, 5, 5, 4 and 2 respectively. Five previous GU suites—00453, 00602, 00807, 00894 and 00945—received a fresh retrospective audit without changing their patient documents.

## Clinical decision and workflow changes

The clinical review distinguishes treatment stage, current toxicity, prior-cycle events and recovery. Partial assessments continue to request missing decisions and do not authorise treatment. Source-boundary checks use the actual assessment engine and include laboratory-adapter inputs, component-level actions and recovery/history conditions.

- Doxorubicin-containing regimens use absolute bilirubin concentrations where the source table is in micromoles per litre. Local laboratory values and unit conversion are checked separately from multiples of the upper limit of normal.
- The two doxorubicin/ifosfamide regimens retain their own haematology boundaries, renal/hepatic rules and schedule-specific support; one schedule's equality rules are not substituted for the other.
- Gemcitabine/docetaxel separates Day 1, Day 8 and a delayed Day 8 assessment. The hepatic review uses the regimen's 675 mg/m² gemcitabine starting dose and does not import an 800 mg/m² dose from another pathway. Ambiguous docetaxel hepatic-table combinations require specialist review instead of an inferred numeric prescription.
- Dacarbazine distinguishes a percentage of the previous dose after neutropenic sepsis from a percentage of the original dose. Overlapping renal boundaries and absent haemodialysis guidance remain explicit review points. The source's inconsistent dose header, ICD description and elapsed review date are retained as source limitations for independent review.

An additional independent software review found three genuine 00501 gaps before release: low-count recovery, a contradictory neuropathy/recovery message and an incompatible planned Day 8/cycle-day combination. The unchanged independent script reproduced 11 failures in the frozen original protocols and passed all 112 cases after the corrections. The author suite now passes 265 cases. This is additional adversarial software verification, not independent clinical approval.

These are review-oriented software safeguards, not autonomous prescriptions or a substitute for the official source, local policy and the authorised prescribing process. The unchanged decision engine consumes the five revised protocol records.

## Patient and service integration

The five routes connect the clinical decision tool with supportive-care phases, treatment journeys, the clinical knowledge base, patient portal, full handbook, concise guide, contact card, passport and consent material. Generic chemotherapy risks are combined with regimen-specific risks for the consent discussion. The approved anatomy, wallet and QR layout remains the required document contract.

The public version and cache keys advance to 0.84.60 while historical module versions remain distinct. The complete catalogue remains 377 protocols. The registered patient service grows to 272 codes, 302 bundle routes and 310 visual routes. Earlier release tests retain their exact historical counts and add only explicit 0.84.60 expectations.

## Evidence currently available

| Check | Result | Evidence |
|---|---:|---|
| New sarcoma clinical cases | 265 / 265 passed | `clinical/source-case-results.json` |
| Independent adverse-case replay against final protocols | 112 / 112 passed; same expectations previously exposed 11 failures | `independent-review/current-independent-results.json`, `logs/independent-replay-portability-01/` |
| Fresh five-regimen GU retrospective cases | 173 / 173 passed | `retrospective/source-case-results.json` |
| Protocol validation, index and card metadata build | Passed; 377 protocols | `logs/protocol-build-05/` |
| Public/module version and stale-cache upgrade checks | Passed | `logs/version-cache-20261118.log/` |
| Renal-field semantic regression (including unchanged 00453) | Passed | `logs/renal-quantity-classification-03/` |
| Sarcoma catalogue legacy compatibility with exact v60 branches | Passed | `logs/sarcoma-legacy-compatibility-04/` |
| Full platform/general regression | Blocked by missing historical Git object | `logs/platform-semantic-regression-02/` |
| Five-suite patient/document integration | Passed | `logs/scoped-suite-final/` |
| Published PDF layout/content checks | Passed: 51 canonical PDFs, 51 identical mirrors; five handbooks with105 pages, 26companions with806 source units, five consents with576 source units | `pdf/document-stage-status.json`, `pdf/final-pdf-manifest.json` |
| Final current-baseline preservation | Run after this source snapshot is frozen; final result accompanies archive | External final preservation log |
| Previous GU suite | Passed | `logs/previous-suite-final/` |
| Current security check, version and static site build | Passed | `logs/security-final/`, `logs/version-final/`, `logs/pages-final/` |
| Global patient design/publication/consent stability | Passed: zero pending changes across310 routes | `logs/design-final/` |
| Local HTTP status and exact served bytes | Passed:34 checks | `local-http.json` |
| Full site-security validation | Blocked by same missing historical Git object | `logs/site-final/` |

The current baseline manifest contains all 20,819 pre-edit tracked files. Every embedded SHA-256 and byte length was compared with the independent external freeze. The v59 migration remains byte-for-byte unchanged and is pinned by the new preservation helper. Final migration recording must occur after all generated documents and evidence settle.

Minor presentation limitations remain: two standalone ifosfamide journey PDFs have a short third-page cancer-response card; orange anatomy-marker diamond numerals retain a rotated appearance. Full text, distinct marker positions and document bounds pass. These are recorded in `pdf/presentation-limitations.json`.

## Explicit acceptance limits

The clinical source manifest distinguishes current HSE/NCCP web-extracted PDF text from original PDF bytes. Direct original-PDF acquisition returned HTTP 403. Saved text hashes are text hashes; the screenshot tool returned text markers/references without viewable image pixels, so visual source-table layout verification is unverified. Retrieval references are not image-file hashes. Original binary PDF provenance and source-owner clarification of ambiguous boundaries remain pending.

System Chromium cannot launch because of the environment's socket restrictions. Browser acceptance is blocked; static and PDF checks are separate evidence. The historical availability preflight found **5,507 missing entries** at commit `c19bef57ca5ae49816ad851f2b551b76af32fa5d`. Full historical CI is blocked. The platform/general regression also reaches an unavailable historical object, `a4575d67a985c97a1dfa545813a8c1a25b2ed5a2:package.json`, through the retained v45 provenance helper; this check is blocked, not passed. The initial bounded platform attempt timed out, and the single no-lazy-fetch retry exposed that exact object failure. Its raw evidence is retained at `../sarcoma60-evidence/history-preflight-01/`; the historical gates remain enabled and unchanged in purpose. The same failing preflight and browser launch are not repeatedly attempted.

Formal clinical and pharmacy approvals remain false in the validation register. Scoped software cases are reported separately from the incomplete full software/browser acceptance. No commit, push or deployment has been performed. Update archives must place repository-relative files directly at their root, with evidence and user instructions separate.

Runtime: Node.js24.22.1 here; repository CI targets Node20. The exact Python/PDF/font runtime is recorded in `pdf/document-runtime.json`. No claim of a Node20 run is made.
