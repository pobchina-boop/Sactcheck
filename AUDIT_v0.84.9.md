# SACTCheck v0.84.9 audit

Checked 20 October 2026. Current official NCCP documents, relevant current product information and primary evidence were reviewed for this batch. Automated synthetic inputs exercise the actual assessment engine and dose-display adapter, not a parallel reimplementation of their decisions. Boundary values, missing inputs, timing, recurrence, recovery, competing concerns, minimum-dose actions and source-specific grading are covered.

| Treatment | NCCP version | Encoded rules | Passing source-linked checks |
| --- | --- | ---: | ---: |
| Palbociclib | 5a | 34 | 144 / 144 |
| Everolimus + exemestane | 4 | 77 | 120 / 120 |
| Trastuzumab deruxtecan | 3b | 42 | 136 / 136 |
| Sacituzumab govitecan | 3 | 51 | 143 / 143 |
| Olaparib | 5b | 50 | 126 / 126 |
| Total | | 254 | 669 / 669 |

Counts include clinical scenarios and source/schema/rendering assertions. They are not an estimate of clinical accuracy or a substitute for independent review.

## Material findings

- **Palbociclib:** corrected Day 15 count decisions, ambiguous cycle timing, minimum-dose and ILD actions. The current catalogue links v5a. Capsule/tablet food instructions and NCCP/EMA dialysis differences remain explicit. No ribociclib ECG schedule is copied into palbociclib.
- **Everolimus:** two generic rules were insufficient for the regimen's count, febrile-neutropenia, Child–Pugh, stomatitis, pneumonitis, metabolic and other-toxicity pathways. These are now 77 source-linked decisions, with component-specific holds and recovery/recurrence conditions. Its NCCP CTCAE v3 grading is preserved, including the ALT/AST grade-2 boundary above 2.5 × ULN.
- **Enhertu:** an earlier minimum-dose stopping rule could not fire with the available selector. Active ILD, complete recovery, previous symptomatic ILD and delayed recovery now have distinct actions. Baseline LVEF eligibility is separated from ongoing cardiac decisions and rechecks. The wider EMA authorisation is not silently substituted for the NCCP breast indication.
- **Sacituzumab:** Day 1 and Day 8 ANC thresholds, severe diarrhoea/vomiting, febrile neutropenia, qualifying duration/recurrence and minimum-dose actions were reconciled. NCCP/current EU differences in organ-function advice and toxicity-recurrence/duration rules remain visible for oncology/pharmacy reconciliation. The patient suite does not expand NCCP eligibility to HR-positive disease solely because the EU indication is broader.
- **Olaparib:** corrected renal boundary handling, cytopenia/recovery, interacting-medicine and breast-specific eligibility/duration logic. Exact CrCl 30 mL/min and severe impairment differences between NCCP and product information are flagged. The one-year breast adjuvant pathway does not replace ovarian, prostate or pancreatic treatment duration and follow-up.
- **Grading presentation:** the shared educational helper could infer newer toxicity grades for numeric counts or even treat duration/yes-no fields as gradeable measurements. These five protocols now specify the relevant source guidance. Actual renderer checks cover the corrections; nausea and febrile-neutropenia selectors retain the grades that exist in their cited source.

See the individual `palbociclib-audit.md`, `everolimus-audit.md`, `enhertu-AUDIT.md`, `sacituzumab-audit.md` and `olaparib-audit.md` for rule-level findings, primary-source links and limitations. Retrieved-file hashes are retained in `retrieved-source-hashes.json`; source PDFs and extracted full journal text are research inputs and are not distributed in this update.

## Longitudinal and patient safeguards

- No patient dates are needed to understand the treatment chronology or monitoring map.
- Regimen-specific baseline and later checks are separate. Time-based monitoring is not converted into an unconditional cycle number after a delay.
- Advanced-disease response imaging is presented as an individualised plan using the cited ESMO guidance; no universal automatic three-month CT order is created. Early-breast surveillance is distinguished from ongoing treatment-safety blood tests. Tumour markers do not independently dictate a treatment change.
- Only applicable agent-specific symptoms appear on the body maps. Continuous oral regimens retain continuous schedules and individual supportive-care review.
- Separate sacituzumab Day 1 and Day 8 scripts follow the NCCP antiemetic framework, with steroid reconciliation. Enhertu follows its specific NCCP antiemetic row. Oral drug-interaction cautions remain visible.
- Olaparib's shared patient-service routes require a treatment-context choice, and the breast materials identify 00588h throughout.

## Verification and limits

The five integrated suites check local links, source references, date-free timelines, receptor/setting filters, supportive phases, shared-indication routing, real knowledge-base loading/rendering, PDF mirrors and deterministic HTML generation. All 1,934 earlier patient files remain byte-identical to the v0.84.8 baseline.

The 41 new patient PDFs contain 76 pages. Text bounds, page counts and compatibility mirrors passed; 20 QR checks decoded the PNG and printed guide/passport/card destinations. Representative documents from every regimen were rendered and visually inspected, including corrected footer/QR page breaks. The exact release build/security outcome is recorded in `validation/targeted-breast-v0849/release-validation.json`.

No deployed v0.84.9 browser session was available before upload. Interactive browser and clinical workflow review after deployment, independent consultant/oncology-pharmacy validation and patient/PPI testing remain outstanding. The work does not establish clinical-use authorisation.
