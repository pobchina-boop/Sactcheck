# Validation — SACTCheck v0.82.2

## Passed

- Recursive inventory of all 379 regimen JSON files; 465 supported numeric LFT ratio definitions across 251 regimens.
- For every mapped definition: actual-result adapter, analyte-specific single-value calculation, and production UI control generation/input collection exercised. Nested haematology folders included.
- Existing absolute U/L and µmol/L inputs and categorical/clinical fields remain unchanged.
- Female/provisional male/custom switching, custom-value restoration, legacy saved-value migration and persistence across reload tested.
- Exact 00568 ALT and bilirubin withholding boundary checks, including values only 0.00001 U/L or µmol/L above/below thresholds and both LFT profiles.
- ALP conversion and missing-ULN rejection; blank/negative/disabled input handling.
- Existing 00568 creatinine UI→engine regression and renal boundary tests.
- Full `npm run release:gate`, Pages build and Pages validation, including 13 protected patient portals and route/PDF integrity checks.
- Hash comparison against v0.82.1 LFT hotfix baseline: no protocol JSON or patient asset changed.
- ZIP integrity and packaged source-byte comparison.

## Boundaries

This is an input-conversion and code-coverage audit. It is not a fresh source-to-rule clinical validation of every regimen, a confirmation of CUH reference intervals, or proof of clinical safety/outcomes.

The production UI functions were exercised with a lightweight document harness. A real Chromium browser was unavailable in this environment; no new visual, mobile, browser end-to-end or live deployment validation is claimed. Local Pages validation is not confirmation of successful publication.
