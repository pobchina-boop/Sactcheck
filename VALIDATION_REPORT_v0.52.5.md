# Validation Report — SACTCheck v0.52.5

## Scope

Validation focused on navigation from an assessment-result dose prompt to the embedded protocol dose workspace, including protocols with encoded component-specific dose actions but no complete structured schedule.

## Reproduction case

NCCP 00705 pembrolizumab, carboplatin and 5-fluorouracil was used to reproduce the defect:

- the protocol does not currently pass the complete structured-schedule gate;
- AST 500 U/L triggers the encoded fluorouracil contraindication;
- v0.52.4 displayed the result prompt but closed the panel during rendering because schedule data were absent.

## Corrective tests

The v0.52.5 regression test confirms:

- the test protocol has no complete structured schedule;
- the encoded AST rule produces a fluorouracil dose-action row;
- the result prompt uses **Review dose action**;
- opening the control reveals the embedded panel;
- the panel displays fluorouracil, the governing **Do not administer** action and the no-dose outcome;
- a transparent notice states that the complete regimen schedule is not yet structured;
- the normal header schedule button remains hidden;
- no placeholder schedule is generated.

## Regression boundary

All clinical protocol JSON files must remain unchanged from v0.52.4. The complete security, protocol-publishing, historical regression, GitHub Pages build and deployable-site validation pipeline must pass before release.

Independent Consultant Oncology and oncology-pharmacy validation remains required. The current official NCCP protocol and authorised prescribing system remain authoritative.
