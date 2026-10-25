# v0.84.18 integration review

Baseline: committed v0.84.17, e6bd944ac3132d517959aa9c227d6bac74a6a9b7. Scope: five new suites (00377, 00378, 00381, 00430, 00749) and five retrospective upgrades (00316, 00433, 00745, 00512, 00815). Source checks dated 2026-10-25. No external deployment or Git push was performed.

## Source audit and assessment checks

| Group | Frozen baseline | Integrated implementation | Audit |
| --- | --- | --- | --- |
| CMF | 68/168 pass | 168/168 pass | `cmf/AUDIT.md`, `cmf/sources.json` |
| Gemcitabine | 61/125 pass | 125/125 pass | `gem/SOURCE_AUDIT.md`, `gem/sources.json` |
| HER2 retrospective | 63/116 pass | 116/116 pass | `her2-retro/AUDIT.md`, `her2-retro/source-provenance.json` |
| Total | 192/409 pass | 409/409 pass | Three `integrated-results.json` reports |

These are source-derived software scenarios, not exhaustive combinations, independent human clinical validation or prescribing authorisation. A baseline failure can represent absent coverage or an expectation at an ambiguous boundary; 217 failed checks do not mean 217 distinct clinical errors.

The source audits preserve printed inequalities, overlapping boundaries, route-specific doses, treatment-day context and unresolved source contradictions. A review action must not become a definitive numeric prescription. The integrated display additionally checks that an SC trastuzumab assessment uses a 600 mg standard-dose reference rather than an IV mg/kg reference.

## Service and regression verification

`npm run test:ci` covers release gates, source scenarios, generated-page parity, the broad historical regression suite, deployable build and site integrity. Historical count fixtures were updated for the expanded coverage: 102 protected patient pipelines, 71 longitudinal breast contexts, 138 protocols with useful dose information and 136 complete schedules. Older source cases requiring baseline LVEF were given an explicit baseline stage. The 00815 hepatic expectation now reflects review of the original-dose percentage; unrelated 00659 expectations remain intact. Numeric renal context fields measured in hours or percent are no longer misclassified as GFR measurements.

Existing independent source suites remain green: AC 526/526, taxane 116/116 and HER2 211/211. The v0.84.17 anthracycline suite remains 179/179. Full-suite checks exercise real knowledge-base loading/rendering, selector changes, local links, no patient numerical efficacy, date-free orientation, approval flags, PDF copies and scoped preservation. Scope hashes are updated only for the explicitly reviewed ten regimens and changed shared builders.

`pdf-validation.json` records 93 PDFs / 163 pages, expected page counts and text bounds. Every PDF matches its compatibility copy. `qr-validation.json` records 40 decoded public destinations without patient identifiers. Visual review covered body-map guides, oral CMF consent and support, a HER2 guide, cycle graphs and monitoring maps; an initial HER2 guide overflow was corrected before release. Final source-link review distinguishes EMA cardiac follow-up and supplementary breast-surveillance guidance from the NCCP regimen.

Browser checks used the local Sites preview and synthetic assessment values: 00430 search/card and evidence panel; Day 8 ANC 0.8 producing review with both medicines at 80% of the actual Day 1 dose; 00316 antibody-only Day 8 selecting a minimal-risk plan without taxane premedication; and the oral CMF date-free treatment map. These are focused interaction checks, not a claim of exhaustive browser/device testing.

`preservation-check.json` verifies 2,704 out-of-scope patient/data/compatibility files unchanged. The two pre-existing temporary PDF files are not part of this release. Historical generated test-report churn unrelated to this batch is excluded; changed AC source fixtures retain their corresponding report.

## Evidence and review limits

The clinician panels state what each cited trial tested and where it differs from the NCCP schedule. Do not use cross-trial percentages to rank regimens. Patient numerical efficacy fields remain empty. The maps do not schedule appointments, confirm completed tests or provide personalised surveillance orders. Consent documents remain review drafts.

All ten protocols retain `clinical_use_authorised: false` and `consultant_reviewed: false`. Independent oncology, pharmacy and patient/PPI review is pending. The feasibility notice remains on the home and assessment flow. This release does not establish approval, current reimbursement, preferred treatment selection or automated genomic-score triage.

## Rebuild the released content

Run from the repository root with the released protocol JSON in place. The clinical source proposal scripts are retained as audit material; do not use them to overwrite later reviewed protocol edits.

```bash
python tools/build-cmf-gem-v08418.py
python tools/build-cmf-gem-v08418-evidence.py
python tools/integrate-cmf-gem-v08418.py
node tools/build-breast-journeys.cjs
SACT_SUITE_CODES=00377,00378,00381,00430,00749,00316,00433,00745,00512,00815 node tools/build-patient-knowledge.cjs
SACT_SUITE_CODES=00377,00378,00381,00430,00749,00316,00433,00745,00512,00815 node tools/build-complete-pathways.cjs
SACT_SUITE_CODES=00377,00378,00381,00430,00749,00316,00433,00745,00512,00815 node tools/build-phase-support-v0838.cjs
npm run protocols:build
python tools/build-cmf-gem-v08418-pdfs.py
python tools/verify-cmf-gem-v08418-pdfs.py
python tools/finalize-cmf-gem-v08418.py
npm run test:ci
```

PDF rendering requires WeasyPrint, Pillow, PyMuPDF and zxing-cpp; QR creation uses qrcode. The scoped environment variable prevents unrelated patient suites being rewritten. The finalizer checks against the frozen baseline and writes the coverage/inventory and explicit migration hashes. See `RELEASE_v0.84.18.md` for installation and `COMMIT_v0.84.18.txt` for GitHub text.
