# v0.84.19 integration review

Baseline: committed v0.84.18, `6c1050b8a2ced301fe770fe67fd518b5a78566e5`. Source checks dated 2026-10-25. Scope: new 00545/00605/00688/00720/00738 and retrospective 00202/00230/00736/00743/00485. No Git push or external deployment.

## Source scenarios

| Audit | Frozen baseline | Integrated | Records |
| --- | --- | --- | --- |
| Bone-modifying treatment | 22/105 | 105/105 | `bone/` |
| Oral therapy | 57/219 | 219/219 | `oral/` |
| IV combinations | 58/177 | 177/177 | `iv/` |
| Retrospective cytotoxics | 237/282 | 282/282 | `retro/` |
| Total | 374/783 | 783/783 | `*/integrated-results.json` |

Thirteen additional arithmetic guard checks verify missing/invalid operands, zero/negative denominator rejection, exact boundary behaviour, ignored supplied calculated values and rejection of calculation chains. The helper is opt-in; existing explicitly entered fields retain their behaviour. Source scenarios are software evidence, not exhaustive combinations or independent clinical validation. Failed baseline cases do not represent that many distinct clinical errors.

Each group records current official source URLs, versions, retrieval hashes, service facts and evidence. Source proposals are retained as audit material; they are not regeneration inputs for overwriting the final integrated protocols. Integration adds source-check metadata, supportive-care mappings, display/category guidance and six-calendar-month wording.

## Regression and user-facing verification

Final `npm run test:ci` completed successfully (exit 0) after the course-card metadata corrections. This includes the release gate, security checks, protocol build, full regression suite, site build and deployable-site validation. See `verification-results.json` and `full-ci-output.txt`.

The release gate exercises the actual knowledge-base loader/render, clinical evidence, date-free patient pages, all 17 support plans, source links, prescription-phase selection, approval flags, compatibility copies, generated-page parity and explicit preservation hashes. Existing AC, taxane, HER2, nab-paclitaxel, eribulin and other source suites remain part of CI.

Course-card metadata explicitly separates prior adjuvant therapy from current advanced-disease intent, the nab-paclitaxel two-cycle response assessment from overall treatment duration, daily oral dosing from administrative review blocks, and both adjuvant/neoadjuvant uses of 00485.

Historical fixtures were migrated explicitly: 107 protected patient pipelines; 76 longitudinal breast contexts including shared entries; 140 protocols with useful dose information, 138 complete schedules and 49 dose-level tables. Numeric renal bands and source grading retain their audited rationale. Derived fields are tested through their visible operands and reject injected computed values; they are not treated as directly editable inputs. The docetaxel100-at60 test now cites the EMA supplement rather than asserting that absence from NCCP means no cessation pathway.

Browser checks used the managed local Sites preview and synthetic values only:

- 00545 search and clinic route; baseline creatinine100/current144 produced calculated rise44 and the renal-hold finding. The ratio1.44 was displayed with missing restart context flagged. No duplicate delta/ratio input was requested; other domains remained unassessed.
- 00720 selector displayed 4mg loperamide three times daily in weeks1–2 and twice daily in weeks3–8, with one plan visible at a time.
- 00688 Day8 displayed nab-paclitaxel alone, its low-risk antiemetics and no routine solvent-taxane steroids; atezolizumab-only continuation removed routine chemotherapy antiemetics.
- Updated monitoring maps were visually reviewed for six-monthly zoledronic acid, neratinib and the AC-to-weekly-paclitaxel sequence.

`pdf-validation.json` records 87 PDFs/157 pages, page counts and text bounds; compatibility copies are byte-identical. `qr-validation.json` records 40 decoded destinations. Visual inspection covered body maps, guides, consent aids and monitoring-map layouts. These checks are not exhaustive browser/device or accessibility certification.

`preservation-check.json` verifies 2,900 outside-scope patient/data/compatibility files unchanged. Historical generated report churn unrelated to changed fixtures is excluded from the release. Current clinical/pharmacy approval flags remain false. The maps do not book, confirm or certify completed monitoring, and patient numerical trial outcomes remain empty.

## Reproduction

Use the final protocol JSONs in this release. Keep source-proposal generation separate from reviewed production files.

```bash
python3 tools/build-breast-final-v08419.py
python3 tools/build-breast-final-v08419-evidence.py
python3 tools/integrate-breast-final-v08419.py
node tools/build-breast-journeys.cjs
SACT_SUITE_CODES=00545,00605,00688,00720,00738,00202,00230,00736,00743,00485 node tools/build-patient-knowledge.cjs
SACT_SUITE_CODES=00545,00605,00688,00720,00738,00202,00230,00736,00743,00485 node tools/build-complete-pathways.cjs
SACT_SUITE_CODES=00545,00605,00688,00720,00738,00202,00230,00736,00743,00485 node tools/build-phase-support-v0838.cjs
npm run protocols:build
python3 tools/build-breast-final-v08419-pdfs.py
python3 tools/verify-breast-final-v08419-pdfs.py
python3 tools/finalize-breast-final-v08419.py
npm run test:ci
```

PDF generation uses WeasyPrint; verification uses PyMuPDF, Pillow and zxing-cpp; QR generation uses qrcode. The scoped environment variable prevents unintended rewrites of other patient bundles. All source conflicts and exact-boundary review states documented in the individual audits remain unresolved pending human review.
