# SACTCheck v0.52.2 validation report

## Validation scope

This release validates the integration of the generic assessment interface with the Protocol Dose & Schedule engine. It does not constitute independent source validation of every encoded dose-modification rule.

## Interface controls verified

- Regimen-relevant laboratory inputs are presented in a consolidated Bloods and organ function section.
- Haematology, renal, hepatic, other laboratory and immunotherapy endocrine inputs have separate visual domains.
- CTCAE and clinical toxicity fields remain separate from laboratory inputs.
- Other eligibility and treatment-context criteria remain outside the laboratory section.
- The dose-modification prompt is hidden when no entered value produces a dose action.
- Missing inputs remain unassessed and never imply standard-dose suitability.

## Dose-engine controls verified

- Uses assessment findings rather than repeating generic rule cards.
- Resolves actions independently for each component.
- Supports percentage dose bands, fixed dose levels, explicit target doses, absolute dose reductions, hold/delay, omit, discontinue and contraindication actions.
- Applies the most restrictive action as governing while retaining all other triggered actions.
- Calculates only the protocol dose unit already present in the regimen source metadata.
- Contains no numeric patient-dose entry form, BSA calculation, renal-function formula, Calvert calculation or ONCOassist link.

## Focused test cases

| Protocol/context | Expected result | Verified result |
|---|---|---|
| AC, ANC 1.2 and platelets 80 | Both components at 75% | Doxorubicin 45 mg/m²; cyclophosphamide 450 mg/m² |
| AC, renal band <10 mL/min | Cyclophosphamide 50% | Cyclophosphamide 300 mg/m² |
| AC, ANC/platelet 75% band plus bilirubin >3×ULN | Omit doxorubicin; retain cyclophosphamide 75% | Component-specific governing actions resolved correctly |
| AC, ANC 0.8 | Delay/no dose now | Both components show no dose now |
| Modified FOLFOX-6, neuropathy grade 2 | Oxaliplatin dose level -1 | Oxaliplatin 65 mg/m² |
| AC, no values entered | No dose modification inferred | No dose rows displayed |

## Automated validation

The complete `npm run test:ci` pipeline passed:

- Repository security check: 797 text files scanned, passed.
- Protocol publishing validation: 381 clinical protocol files plus authoring template, passed.
- Historical assessment and interface regression suite, passed.
- v0.52.2 integrated laboratory and dose-modification tests, passed.
- GitHub Pages production build: 382 protocol JSON files copied, passed.
- Deployable-site validation, passed.

## Clinical-content integrity

A SHA-256 comparison against the v0.52.1 release confirmed:

- Clinical protocol JSON files compared: 381
- Changed clinical protocol JSON files: 0
- Missing clinical protocol JSON files: 0
- Added clinical protocol JSON files: 0

No clinical threshold, rule condition or recommendation was edited in this release. The interface and dose-resolution layer expose actions already present in the encoded assessment content. Independent Consultant Oncology and oncology-pharmacy validation remains required.
