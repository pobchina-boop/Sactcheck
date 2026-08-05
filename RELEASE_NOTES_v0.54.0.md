# SACTCheck v0.54.0 — Constrained Scenario Interpreter

## Summary

SACTCheck v0.54.0 adds a local constrained scenario interpreter inside the opened regimen assessment engine. A clinician can describe a scenario in natural clinical language, review the structured values identified by the interpreter and confirm which values should be copied into the existing deterministic assessment form.

The interpreter does not determine the protocol action. It only translates confirmed scenario text into existing regimen fields. The established SACTCheck assessment and dose-modification engines remain authoritative for the encoded result.

## Workflow

1. Open the relevant regimen.
2. Select **Scenario interpreter**.
3. Enter a de-identified clinical scenario.
4. Select **Extract fields**.
5. Review and confirm each proposed structured value.
6. Select **Apply confirmed values** or **Apply and assess**.
7. Review the deterministic SACTCheck result and current official NCCP protocol.

## Supported extraction in this first iteration

The local interpreter recognises common forms of:

- ANC, platelets, haemoglobin and white-cell count
- Creatinine, creatinine clearance and eGFR
- Bilirubin, ALT, AST and ALP
- TSH, free T4, cortisol, ACTH, glucose and ketones
- ECOG performance status
- Cycle number and treatment day where the regimen exposes those fields
- Current protocol dose level where an encoded selector exists
- Explicit febrile-neutropenia history, pregnancy, breastfeeding, dialysis and hypersensitivity; current afebrile status is not treated as equivalent to no previous febrile neutropenia
- Named CTCAE-style toxicity grades where a matching regimen field exists
- Protocol-specific renal bands when an exact CrCl/eGFR value is stated

Only fields already defined by the opened regimen can be populated.

## Safety controls

- Scenario text is processed locally in the browser.
- No external model, API or internet service receives the scenario.
- No API key is embedded in the static site.
- Extracted values are displayed before application.
- The clinician must confirm each value.
- Unconfirmed and absent values remain blank and unassessed.
- Possible patient-identifiable information generates a warning.
- Mentions of medicines that may not match the opened regimen generate a regimen-context warning.
- The interpreter cannot create a new threshold, clinical rule, dose band or treatment action.
- The interpreter cannot diagnose, prescribe, clear treatment or override the deterministic result.

## Immunotherapy refinements included

- The panel heading is now **Immunotherapy toxicity map**.
- Unnecessary hyphenated wording has been reduced.
- Tile status wording is framed as decision support: **Review pathway** and **Urgent clinical review**.
- Organ-specific navigation buttons close the map, expand the relevant assessment control, scroll to it, focus it and briefly highlight it.
- If no dedicated mapped input exists, the panel displays **No dedicated input in this regimen** rather than a non-functional button.

## Clinical content boundary

All 382 protocol JSON files remain byte-for-byte unchanged from v0.53.0. No NCCP threshold, assessment rule, treatment recommendation, dose level or protocol-dose calculation was modified.

Independent Consultant Oncology and oncology-pharmacy validation remains required. The current official NCCP regimen and authorised prescribing system remain authoritative.
