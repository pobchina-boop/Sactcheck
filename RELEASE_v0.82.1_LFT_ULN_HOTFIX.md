# SACTCheck v0.82.1 — LFT / ULN calculation hotfix

## Scope

Focused clinical-input reliability patch on top of the current green v0.82.1 release. This patch does **not** alter any NCCP threshold, dose-modification rule, action ranking, patient portal, consent asset, antiemetic prescription, Treatment Passport, SACTCard or protected patient PDF.

## What changed

- Expands automatic actual-result → ×ULN conversion to all numeric liver-function ratio fields identified across the current protocol library, including historical and component-specific aliases such as:
  - `ast_alt_uln_multiple`
  - `ast_alt_uln`
  - `capecitabine_alt_ast_uln`
  - `capecitabine_bilirubin_uln`
  - `irinotecan_bilirubin_uln`
  - `epirubicin_ast_uln`
  - `mitomycin_ast_uln`
  - singular/plural transaminase ULN fields.
- Combined transaminase rules now calculate ALT/ULN and AST/ULN separately and pass the **higher entered multiple** to the existing protocol rule.
- A legacy field named `alt_uln_multiple` but explicitly labelled ALT/AST is treated as a combined transaminase field when the full protocol definition is available.
- Single-analyte partial assessment is preserved: if only ALT or only AST is entered, the entered value is assessed and the missing analyte is explicitly shown as **not entered / not assumed normal**.
- Calculation previews now show the actual result, the exact ULN denominator, the calculated multiple and, for combined rules, the selected highest entered transaminase.
- Invalid edited ULNs no longer silently fall back to another/default denominator. The UI keeps the previous validated laboratory limits and tells the user the edit was rejected.
- Keeps the v0.82.1 00568 creatinine actual-value → ×ULN conversion unchanged.
- Updates only the cache keys for the LFT conversion/UI modules so browsers fetch the hotfix without changing the public app release number.
- Replaces the stale homepage release-summary text with the current laboratory-input reliability summary.

## Clinical boundary preserved

This patch changes input conversion and transparency only. Existing encoded protocol comparisons such as `>3 ×ULN` ALT/AST or `>1.5 ×ULN` bilirubin remain unchanged.
