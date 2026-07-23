# SACTCheck v0.37.2 Validation Report

## Automated validation completed

- Complete `npm test` regression suite: PASSED
- Protocol publishing/validation suite: PASSED
- Existing single-entry assessment suite: PASSED
- CTCAE descriptor suite: PASSED
- Renal-band standardisation suite: PASSED
- v0.37.2 tissue/laboratory UI suite: PASSED
- JavaScript syntax checks for new modules: PASSED

## v0.37.2 focused checks

- CUH ALT ULN = 34 U/L
- CUH AST ULN = 42 U/L
- CUH bilirubin ULN = 20 µmol/L
- TSH range = 0.38–5.33 mIU/L
- Free T4 range = 8–18 pmol/L
- Exact result to ×ULN conversion: verified
- Highest ALT/AST multiple selection: verified
- Single transaminase entry: verified
- 94 existing ALT/AST/bilirubin ULN definitions mapped to automatic calculation
- Immunotherapy blood fields optional: verified
- Immunotherapy blood fields absent from non-ICI protocols: verified
- Tissue icon/colour configuration and landing-page components: verified

## Remaining validation

Formal clinical use still requires source-by-source clinical validation, oncology-pharmacy review, local laboratory/profile confirmation and institutional governance approval.
