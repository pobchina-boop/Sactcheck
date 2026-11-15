# SACTCheck v0.84.54 audit record

Five new service drafts for existing NCCP protocols; five repeat audits. No increase in the 377-protocol catalogue. The patient registry contains 243 codes, 270 bundle routes and 279 authored routes. This ten-service check does not establish that the whole platform is clinically validated.

## Services

| NCCP | Service | Work | Source status |
|---|---|---|---|
| 00482 | Bicalutamide 50 mg | new service draft | fresh NCCP and product PDF checked |
| 00492 | Prostap 3 DCS 11.25 mg | new service draft | fresh NCCP and product PDF checked |
| 00493 | Prostap 6 DCS 30 mg | new service draft | clarification required: inconsistent Prostap 6 SmPC |
| 00494 | Prostap SR DCS 3.75 mg | new service draft | fresh NCCP and product PDF checked |
| 00848 | Akeega + prednisolone | new service draft | fresh NCCP and product PDF checked |
| 00478 | Goserelin 3.6 mg | retrospective audit | fresh NCCP and product PDF checked |
| 00488 | Triptorelin 22.5 mg | retrospective audit | fresh NCCP and product PDF checked |
| 00489 | Triptorelin 3 mg | retrospective audit | fresh NCCP and product PDF checked |
| 00490 | Eligard 7.5 mg | retrospective audit | fresh NCCP and product PDF checked |
| 00491 | Eligard 45 mg | retrospective audit | fresh NCCP and product PDF checked |

## Assessment and source findings

- Bicalutamide: 50 mg combination with testosterone suppression; hepatic caution and severe liver-change action; coumarin/INR and prohibited interactions; no unsupported chemotherapy blood-count limits.
- Prostap: preserve formulation, route and fixed NCCP 28/84/168-day intervals. Calendar months in the SmPC are not silently substituted. Confirm injection preparation/product, early flare, urinary/spinal symptoms, metabolic/bone/cardiovascular effects and conditional monitoring.
- Prostap 6: current HPRA PDF dated 5 June 2026 has warnings under section 4.3 and Prostap 3 wording under section 4.4. This was confirmed visually on PDF pages 3–4, not just extracted text. Page 3 injection step 5 also mentions intramuscular administration, despite the 30 mg dosing section and NCCP regimen specifying subcutaneous use. The NCCP SC route is retained pending clarification. No other strength’s contraindications were copied. The draft has a source discrepancy flag and a product-reconciliation hold input; it is not marked clinically complete. Pharmacy clarification remains required.
- Akeega: retain NCCP BRCA-mutated mCRPC setting and 10 mg daily prednisolone; newer EMA mHSPC language does not extend this NCCP service or establish reimbursement. Preserve ongoing ADT, fasting and strength-specific administration, regular monitoring and restart-specific intensified monitoring.
- The platform regression caught a numeric baseline anaemia-grade field; it was corrected to the source-specific CTCAE dropdown without weakening the assertion.
- Akeega decision corrections include ALT/AST >=20 ×ULN permanent-stop boundary; ALT-specific concurrent bilirubin criterion; different anaemia versus neutrophil/platelet recovery and recurrence rules; dose history; failure to recover within 28 days; hepatic rechallenge at the source-specific dose. Separate niraparib/abiraterone actions do not automatically stop prednisolone. No invented universal potassium 3.5 mmol/L treatment gate.
- Akeega evidence separates progression benefit from overall survival uncertainty. The MAGNITUDE BRCA subgroup’s final OS estimate does not establish a statistically significant OS benefit; different endpoint cut-offs are disclosed.
- Previous five depots: all ten freshly retrieved NCCP/product PDFs are byte-identical to the previous release. Fixed cloned protocol identity/governance strings and aligned clinician monitoring descriptions to existing patient plans. All 190 patient assets retained exactly.

Source URLs, retrieval times, resolved destinations, bytes and SHA-256 values are in clinical/sources/*-retrievals.json. Each new encoded rule records its source page/section and limitations. Clinical migration before-hashes use verified delivered v0.84.53; the actual Git commit is still v0.84.52.

## Document checks

- Five three-page guides and five one-page wallet sheets: page counts, text bounds, exact anatomy preservation, physical card sizing and QR decoding passed.
- Thirty companion PDFs: 48 pages; 707 retained content units; five passport QRs; both download mirrors verified.
- Five complete handbook sets: 18, 19, 20, 19 and 21 pages (97 total). Five distinct chapter purposes and one contents list per book, exact anatomy/wallet preservation, source retention, fonts and mirrors verified. knowledge.pdf and handbook.pdf are corresponding copies, not extra clinical content.
- Companion consolidation: 176 exact content units retained; 15 repeated metadata/browser-navigation units explicitly reviewed. No clinical clause was waived to obtain a shorter document.
- Visual review covers all five guides, representative consent/passport pages, and complete Bicalutamide, Prostap 6 and Akeega contact sheets. Source images and file hashes are recorded separately.

## Limits

Chromium exits before page navigation with socket() Operation not permitted / SIGABRT. Required browser suite was attempted; interactive desktop/mobile checks remain blocked. Automated static/DOM/PDF tests are not browser evidence. Real iOS/Safari and Android installation, camera scans and physical printing are untested.

No commit, push, merge or deployment was performed. The package is for review; new QR destinations require publication and live-byte verification. Independent clinical, oncology-pharmacy and patient/PPI review remains pending. Placeholder hospital contact numbers must be replaced by the receiving team.

Recovery: full Git bundle and initial refs/status captured before modifications, with verified delivered v0.84.53 ZIP. This is a cloud recovery copy, not an independently protected offline backup. See recovery.json.
