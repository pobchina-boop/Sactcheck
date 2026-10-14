# SACTCheck v0.82.2 — complete LFT input audit and reference profiles

This is a cumulative patch for v0.82.1, with or without the earlier v0.82.1 LFT hotfix already installed. It includes that hotfix. Do not apply an older patch over this release.

## Apply

1. Extract the ZIP and copy the CONTENTS of SACTCheck_DROP_IN into the repository root. Merge folders and replace matching files; do not replace whole folders or add a nested SACTCheck_DROP_IN folder.
2. Review the diff. Run `npm run release:gate` and `node tests/creatinine-actual-v0821.test.cjs`.
3. Commit using the accompanying GitHub summary/description, then push your intended branch and check the Pages workflow.
4. Refresh the deployed page. Test a single ALT result, switch LFT profiles and confirm the displayed denominator/multiple changes; test an ALP with the report's ULN. Confirm the selected profile before each patient assessment.

No commit, push or deployment was performed here.

## What changed

- Recursively audited 379 regimen JSON files (the 382 JSON files copied by the build include three schema/index/package metadata files).
- All 465 numeric LFT ×ULN definitions across 251 regimens support actual-result conversion: ALT, AST, combined transaminases, bilirubin and ALP.
- Adds 13 ALP fields previously missed. ALP has no invented default: supply its ULN from the laboratory report. An entered ALP without a positive ULN returns an input error; a blank ALP stays unassessed and does not block other single-value assessments.
- Female/local, provisional male and custom LFT profiles. Existing stored reference values migrate to Custom, retaining their values. Custom LFT limits are restored when returning to Custom after a preset.
- Male ALT and AST are provisionally 40 U/L (not 4), labelled as unverified for CUH; bilirubin 20 µmol/L is the supplied local value. Female/local uses supplied ALT 34, AST 42 and bilirubin 20. The male preset is not a claim of a CUH reference interval.
- Profile switching affects ALT/AST/bilirubin only. ALP and creatinine remain independently editable. The supplied default creatinine ULN 90 µmol/L is female and is not converted into a male reference by selecting the male LFT profile.
- Full numerical precision reaches decision rules. Display multiples are rounded only for readability. Actual entered values are not truncated in the calculation explanation.
- Combined ALT/AST rules calculate each analyte against its own ULN and use the higher entered multiple. Missing values remain explicitly unassessed.
- Invalid/negative entered results reach input validation rather than disappearing as if no result was entered. Invalid edited limits preserve previous valid values. Disabled inputs are excluded from current assessments.
- Changes to reference limits refresh previews and conditional inputs and invalidate the previous displayed assessment. Reset refreshes the displayed denominators.

## Preserved

All protocol JSON files, encoded thresholds/actions, patient portals, patient anatomy, Day 1–21 timeline, QR routes, consent forms and patient PDFs are unchanged from the v0.82.1 hotfix baseline. The 00568 creatinine conversion remains supported. Single-value partial assessment remains supported.

## Reference provenance

User-supplied CUH/local limits are retained as supplied; this release did not independently verify them. NHS Specialist Pharmacy Service gives a general ALT/AST range of 0–40 IU/L, supporting the explicitly provisional 40/40 preset, not a CUH-specific male range:
https://sps.nhs.uk/articles/assessing-liver-function-and-interpreting-liver-blood-tests/

Laboratory methods and reference intervals vary. Use the performing laboratory's report for clinical ×ULN calculations.

See the audit and validation reports for complete scope and limitations.
