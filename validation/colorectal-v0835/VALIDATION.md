# v0.83.5 validation record

Base commit: `3bcc2409ff0f203edaaab81c615772b47da37720` (v0.83.4). Source review: 16 October 2026.

| Check | Result |
| --- | --- |
| Source-derived engine cases | 186 passed across 00225, 00447 and 00448 |
| Actual browser decision cases | 31 passed: 21 desktop, 10 mobile |
| Patient and clinic journeys | 6 passed: all three regimens at 1440 and 390 px |
| Retrospective course surfaces | 12 passed: 00586 portal/reference/consent/timeline and 00655 clinical knowledge/patient guide, both widths |
| Static PDFs | 20 documents, 39 pages; matching compatibility copies; rendered pages visually reviewed |
| Printed QR checks | All three new guides, passport covers and SACT cards, plus the 00586 guide, decoded to their public regimen portal |
| Durvalumab fallback output | Two-page patient guide rendered; local QR decoded; separate course graphic inspected |
| Browser-generated clinical PDFs | Five exported assessments checked for release, regimen identity and current-level/component decisions |
| Repository CI | `npm run test:ci` passed, including release, security, protocol, full test suite, Pages build and deployable-site validation |
| Protected content | 24 registered pipelines; intentional changes confined to the three additions and 00586 retrofit |
| Clean base plus overlay | PASS: full `npm run test:ci` on a clean archive of the stated v0.83.4 base plus the overlay; see `overlay-verify.log` |

These are synthetic software tests entered through real browser controls, not observations of real patients and not a human manual audit. They cover selected boundary and high-risk cases; they are not exhaustive proofs of every possible clinical combination. The engine cases were specified from source thresholds, timings and component actions rather than generated from the rules being tested.

The decision cases include RAS status, ECOG, skin episode/recovery matrices, infusion reactions, ILD and respiratory symptoms, eyes, electrolytes, organ impairment, baseline versus on-treatment blood counts, count nadirs, source equality gaps, DPD, neuropathy, residual diarrhoea and multiple simultaneous component actions. Dose checks cover an already reduced component and missing dose-level context.

Browser journeys checked the eight distinct anatomical targets and loaded illustration; no date inputs on patient portal/reference; the shared 14-day chronology; six practical access/infusion steps; trial context; clearing a consent draft; and correct clinic knowledge, supportive-care PDF and consent destinations. The mobile run found and fixed overflow from a long clinical rule heading. The retrospective guide check found and replaced the external durvalumab QR dependency with a local asset.

## Source limitations and unresolved decisions

The audit targets NCCP 00225 v6, 00447 v6b and 00448 v4b. HSE migration/redirect failures affected retrieval of the combination sources. Published versioned documents and indexed page/table extracts were used; current catalogue destinations were recorded. This does not establish that every latest unversioned PDF was retrievable or unchanged. Reconfirm the official copies before clinical adoption.

00447/00448 broadly exclude organ impairment while also providing organ-function dose guidance. 00448's ANC recovery wording differs between two and four weeks. Exact fluorouracil bilirubin 85 / AST 180 equality is not resolved by the printed inequalities. These remain explicit review prompts rather than invented numerical instructions. Supplementary SmPC safety is labelled as supplementary.

Consultant, oncology-pharmacy and patient/PPI review remain pending. `clinical_use_authorised` remains false. No commit, push or deployment was performed by this task.

## Reproduce

- `npm run protocols:build`
- `npm run test:ci`
- `SACT_WRITE_VALIDATION=1 node tests/clinical-audit-v0835.test.cjs`
- `node tests/clinical-audit-v0835.e2e.cjs`
- `node tests/treatment-relationship-v0835.e2e.cjs`

Browser runs require Playwright and Chromium; set `CHROMIUM_PATH` to a local binary if needed. See `source-map.json`, `engine-cases.json`, `browser-cases.json`, `patient-journeys.json`, `treatment-relationship-journeys.json`, `pdf-validation.json` and the logs for evidence. Screenshots are internal QA and are not included in the release.
