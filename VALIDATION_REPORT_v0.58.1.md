# SACTCheck v0.58.1 Validation Report

Validation date: 5 August 2026

## Release scope

Clinical source reconciliation of NCCP 00450 and 00451, plus a library-wide audit and maturity correction for renal/hepatic rule coverage.

## Automated validation

| Check | Result |
|---|---|
| Complete historical `npm test` suite | Passed |
| Focused v0.58.1 organ-function regression suite | Passed |
| Protocol schema/publishing validation | Passed — 381 source protocol records scanned and 376 published catalogue entries retained |
| Repository security check | Passed |
| Organ-function rule-coverage audit | Passed — 0 rule-level claim mismatches |
| GitHub Pages build | Passed — 382 protocol JSON files copied |
| Deployable-site validation | Passed |
| Protocol SHA-256 integrity register | Created — 382 JSON files, 76 intentional changes, 0 additions, 0 removals |

## Protocol-level regression coverage

The focused suite verifies:

- all new fields are optional and support partial assessment;
- platelet 80 ×10⁹/L produces a delay finding;
- platelet 40 ×10⁹/L produces delay plus subsequent 5-fluorouracil dose-reduction consideration;
- CrCl 8 mL/min produces the mitomycin 75% pathway;
- bilirubin 90 μmol/L produces the source 5-fluorouracil contraindication pathway;
- AST 200 U/L produces the source 5-fluorouracil contraindication pathway;
- AST above 2 × ULN produces mitomycin consultant/clinical-decision review;
- moderate hepatic impairment produces the one-third initial 5-fluorouracil reduction pathway;
- grade 3 diarrhoea produces delay until recovery and 50% subsequent 5-fluorouracil reduction;
- high-dose mitomycin with CrCl 40 mL/min produces consultant review;
- NCCP 00450 no longer exposes the prior generic hepatic ratio inputs;
- the library-wide mismatch count remains zero.

## Library integrity

- Source protocol JSON count: 381
- JSON files included in the protocol hash register: 382, including the catalogue index
- Published catalogue count: 376
- Detailed knowledge-base profiles: 10
- Changed protocol records: 76
- Unchanged protocol records: 305
- Added protocol records: 0
- Removed protocol records: 0

Of the 76 changed protocol records, two received full source-rule reconciliation and 74 received maturity/provenance corrections only.

## Clinical review status

Automated validation demonstrates internal consistency and regression protection; it does not constitute clinical authorisation. NCCP 00450 and 00451 remain marked for consultant oncology and oncology-pharmacy review. Protocols classified as partially rule-encoded require manual review of the official NCCP PDF for organ-function decisions not yet represented as structured rules.
