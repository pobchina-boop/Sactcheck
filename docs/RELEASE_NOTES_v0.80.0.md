# SACTCheck v0.80.0 - seven-regimen patient pipeline expansion

This release makes the atezolizumab + bevacizumab patient portal pattern the patient-content standard and connects the clinic workflow directly to dedicated regimen pages.

## Dedicated pipelines
- NCCP 00831 atezolizumab + bevacizumab (HCC) - retained as the visual gold standard
- NCCP 00209 modified FOLFOX-6 - now routed to a dedicated visual page rather than the generic patient-guide renderer
- NCCP 00568 pembrolizumab + pemetrexed + carboplatin
- NCCP 00857 pembrolizumab + carboplatin/paclitaxel followed by AC
- NCCP 00722 TCHP
- NCCP 00382 trifluridine/tipiracil (Lonsurf)
- NCCP 00619 adjuvant abemaciclib + endocrine therapy

Each pipeline provides treatment identity, phase/schedule explanation, patient-first side effects with anatomical anchoring, monitoring/support, escalation language, a Treatment Passport section and source traceability.

## Routing fix
The clinic workflow now checks the NCCP regimen code and opens a stable `docs/patient/<code>/` route for these seven regimens. This specifically fixes the non-opening 00831 clinic-workflow patient action and stops 00209 from falling back to the generic body figure. Other regimens retain the existing generic patient-content fallback.

## Governance boundary
Patient pages are clinical-review prototypes. They do not replace the current NCCP source, formal consent, prescribing review, pharmacy verification, local emergency instructions or clinical judgement.

## Final source reconciliation
- NCCP 00382 is aligned to the current HSE Lonsurf source, version 4 (last reviewed 01/07/2026).
- NCCP 00619 is aligned to the current HSE abemaciclib source, version 4a.
- NCCP 00722 and 00857 patient pages link directly to their official HSE regimen PDFs rather than only the tumour-group catalogue page.
- The v0.79 workflow/patient-support modules are now explicitly loaded by `index.html`, closing the packaging-to-runtime integration gap identified during v0.80 validation.
