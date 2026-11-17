# v0.84.57 audit record

Baseline: v0.84.56, `90ae67a0a3f565cb57f73072137c52c4851fec5b`. Source retrieval: 16 November 2026. This records implemented content and executable checks, not independent clinical approval or deployment acceptance.

## New suites

| Route | Treatment | NCCP version | Batch source scenarios |
|---|---|---|---:|
| 00104 | Axitinib Monotherapy | 6 | 21 |
| 00518 | Cabozantinib Monotherapy | 3 | 24 |
| 00564 | Tivozanib Monotherapy | 3 | 29 |
| 00326 | Temsirolimus Therapy | 4 | 18 |
| 00588/prostate | Olaparib monotherapy | 5b | 13 |

The five new routes account for 105 scenarios. A further 10 focused repeat scenarios cover the preceding batch, giving 115/115 current-batch scenarios. Separately, all 169 prior-batch source scenarios were replayed against the current encodings. Results and inputs are retained, rather than reporting only a pass count.

## Consistency checks

| Layer | Five new routes | Previous five routes | Evidence |
|---|---|---|---|
| Assessment and source boundaries | Current NCCP/EMA sources; numeric and review-only actions tested | Sources re-retrieved; prior cases replayed; 10 additional probes | `clinical/source-case-results.json`, `software/repeat-source-cases.log` |
| Clinician knowledge | Rationale, eligibility, evidence, source caveats and monitoring authored; context selection tested | Cabazitaxel platelet wording corrected to match existing review-only rule | KB addenda v0.84.56/v0.84.57; full-suite tests |
| Workflow and support | Explicit authored schedule, monitoring and support plans | Retained plans and route integration rechecked | Full-suite v0.84.56/v0.84.57 tests |
| Consent | Applicable generic targeted-treatment section plus agent-specific risks; two-page outputs | Existing applicable generic categories and agent-specific risks rechecked | `consent-inventory.json`, `pdf/consent-build.json`, `clinical/repeat-patient-audit.json` |
| Patient portal and illustration | Detailed regimen-specific anatomy and patient-language content | Existing patient assets preserved byte-for-byte | Patient profiles, visual-review record, repeat audit |
| Guides, wallet and handbooks | Three-page guides; card dimensions; full offline handbook; text retention and published mirrors verified | 190 retained files checked, including guides, cards, consents, handbooks and mirrors | PDF verification reports; repeat audit |
| QR | Image and PDF codes decoded; exact regimen destinations checked locally | Guide/card codes decoded again | `pdf/qr-png.json`, handbook verification, repeat audit |
| Browser and devices | Real Chromium attempt blocked by `socket() Operation not permitted` | No new device acceptance claimed | `software/browser-blocked.log` |

### Clinically meaningful changes and boundaries

- Cabozantinib now uses the retrieved NCCP v3 document. The previous v2 identifier remains compatible, so stored links do not silently resolve to another regimen.
- Olaparib keeps every original breast rule unchanged. Five additional eligibility rules are explicitly gated to the prostate monotherapy indication. Breast and prostate knowledge/patient routes require the appropriate context; unsupported indications do not inherit prostate information.
- Tivozanib only offers the encoded numeric reduction when the current 1,340 microgram dose is confirmed. Unknown dose history, already-reduced dosing and the Child–Pugh B scheduling conflict retain review blocks. The source's alternate-day issue is not converted into an invented daily dose.
- The four renal supportive-care classifications are checked against the current NCCP sections: oral minimal-to-low risk for axitinib, cabozantinib and tivozanib; low risk for temsirolimus. The risk map and selected national guidance script must agree with the source-reconciled protocol.
- Source disagreements and unclear recovery wording remain visible review requirements. Passing software checks does not resolve them clinically.
- The repeat audit corrected cabazitaxel KB wording about isolated low platelets. The existing assessment already required consultant review and blocked numeric dosing; that rule was retained.

## Preservation and validation limits

The committed v0.84.56 archive was reconciled with Git: all 413 members matched. The repeat patient audit verifies 190 unchanged files across `00101`, `00257`, `00313`, `00546` and `00203/prostate`. Earlier migration records are preserved. A narrowly recorded update to the historical olaparib regression script validates the current version and new prostate rule coverage while retaining all 126 historical scenarios and the pinned original breast rules.

Full CI remains incomplete because the remaining run lost its controllable session. The focused batch checks and general-suite checks have separate passing evidence; they do not establish an overall CI pass. The final software outcomes are recorded in `VALIDATION_v0.84.57.json`; initial failures and corrected reruns are retained. Runtime here is Node 24, whereas repository CI specifies Node 20. Browser/device checks, physical printing/camera scanning, live publication acceptance and independent consultant/pharmacy approval remain outstanding. The five new live routes returned 404 before publication, as expected for an unapplied update.

The separate 00493 source clarification remains open. A local recovery snapshot was created before this batch; no independent offline backup is claimed.
