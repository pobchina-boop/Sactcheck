# Validation — v0.82.1 LFT / ULN hotfix

Validation performed against the production v0.82.1 GitHub Pages artifact and the current protocol library.

## Passed checks

- JavaScript syntax check: `js/local-lab-profile.js`
- JavaScript syntax check: `js/generic-assessment-ui.js`
- Platform scan: **437 current numeric LFT ×ULN input definitions** identified and all resolve to an automatic actual-result adapter.
- Alias calculations verified for combined ALT/AST, bilirubin and AST-only component-specific fields.
- Highest-of-ALT/AST calculation verified.
- ALT-only partial assessment verified with AST remaining explicitly unassessed.
- Invalid/blank ULN edit verified to preserve the previous validated denominator rather than silently reverting to a default.
- NCCP 00568 hepatic decision boundaries verified unchanged:
  - exactly 3 ×ULN ALT/AST does not cross the encoded `>3` withholding threshold;
  - >3 ×ULN triggers the existing hepatitis withholding rule;
  - exactly 1.5 ×ULN bilirubin does not cross the encoded `>1.5` threshold;
  - >1.5 ×ULN triggers the existing bilirubin withholding rule.
- Existing v0.82.1 00568 creatinine actual-result integration test passes unchanged, including renal threshold boundaries and single-value partial assessment.

## Deployment boundary

This is a drop-in source patch. GitHub Actions / Pages / CodeQL still need to run after the user commits and pushes. Do not treat it as live until the new Pages run is green.
