# SACTCheck v0.55.0 — Global Clinical Scenario Interpreter

## Summary

SACTCheck v0.55.0 adds a standalone **Clinical scenario interpreter** to the main library screen. It allows a clinician to begin with a de-identified free-text oncology scenario instead of manually locating a regimen first.

The global interpreter is regimen agnostic only at the point of entry. It searches the local SACTCheck catalogue, displays possible NCCP protocol matches and requires the clinician to select the exact regimen before any structured extraction or protocol assessment can occur.

This is a cumulative release and includes every change introduced in v0.54.0, including the in-regimen constrained scenario interpreter and the Immunotherapy toxicity map navigation and copy refinements.

## Global workflow

1. Open the SACTCheck main library screen.
2. Enter a de-identified scenario in **Clinical scenario interpreter**.
3. Select **Find matching regimen**.
4. Review the possible NCCP protocol matches.
5. Select and confirm the exact regimen.
6. Review the candidate structured values identified by the existing in-regimen interpreter.
7. Confirm which values should be copied into the assessment form.
8. Run the deterministic SACTCheck assessment.
9. Review the current official NCCP protocol and apply clinical judgement.

## Catalogue matching

The global interpreter can recognise controlled disease and regimen language including:

- common tumour descriptions and abbreviations;
- NCCP regimen numbers;
- generic drug names;
- selected regimen acronyms;
- common trade names already recognised by SACTCheck;
- multi-drug combinations where the mentioned components are present in the same protocol.

Possible protocols are ranked locally. The interface shows which disease or regimen terms matched each protocol and flags medicines mentioned in the scenario that are not represented in that protocol.

Where no single protocol matches every named medicine, the interface explicitly states this and requires exact regimen selection or manual catalogue search.

## v0.54.0 functionality included

The cumulative package also includes:

- the in-regimen **Scenario interpreter**;
- local extraction of common laboratory results, ECOG, cycle/day context, dose level and named toxicity grades;
- clinician confirmation before any value is applied;
- **Apply confirmed values** and **Apply and assess** workflows;
- identifier and regimen-context warnings;
- the renamed **Immunotherapy toxicity map**;
- organ-specific navigation to relevant inputs;
- non-directive decision-support wording such as **Review pathway** and **Urgent clinical review**.

## Safety controls

- Scenario text is processed locally in the browser.
- No scenario text is sent to an external AI service.
- No API key is embedded in the static site.
- The global interpreter cannot generate a clinical assessment before exact regimen selection.
- It cannot silently select a protocol where several matches remain possible.
- Possible patient-identifiable information blocks progression until removed.
- The original scenario is handed to the in-regimen interpreter only after protocol selection.
- Every extracted clinical value remains subject to clinician confirmation.
- Missing or unconfirmed values remain blank and unassessed.
- The deterministic SACTCheck engine remains the sole source of the encoded protocol result.
- The system does not diagnose, prescribe, clear treatment or calculate a patient-specific final dose.

## Clinical content boundary

All 382 protocol JSON files remain byte-for-byte unchanged from v0.54.0. No NCCP threshold, assessment rule, treatment recommendation, protocol dose level or dose calculation was changed.

Independent Consultant Oncology and oncology-pharmacy validation remains required. The current official NCCP regimen, local policy and authorised prescribing system remain authoritative.
