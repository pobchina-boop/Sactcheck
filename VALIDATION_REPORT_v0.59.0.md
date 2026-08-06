# SACTCheck v0.59.0 Validation Report

Validation date: 5 August 2026

## Release scope

Library-wide renal and hepatic reconciliation of the 74 records marked partially rule-encoded in v0.58.1.

## Automated validation summary

| Check | Result |
|---|---|
| Complete cumulative `npm test` suite | Passed |
| Focused v0.59.0 reconciliation suite | Passed |
| Protocol schema and publishing validation | Passed — 381 publishing checks |
| Reconciliation audit | Passed — 74/74 resolved, 0 partial records, 0 audit issues |
| New-rule execution coverage | Passed — all 299 v0.59.0 rules triggered through the live assessment engine |
| Protocol SHA-256 integrity comparison | Passed — 382 JSON files, 74 intentional changes, 0 additions, 0 removals |
| Repository security check | Passed |
| GitHub Pages build | Passed |
| Deployable-site security/structure validation | Passed |

## Reconciliation distribution

| Resolution | Records |
|---|---:|
| Structured organ-function rules | 70 |
| Source-reviewed absence of a prescriptive adjustment table | 4 |
| Remaining partial rule encoding | 0 |
| Total reconciliation scope | 74 |

## Rule-engine verification

The focused test suite constructs an input witness for every rule whose ID begins `OF590_`, passes that input through the production assessment engine and verifies that the intended rule appears in the returned findings. This covers **299 of 299** new rules.

Additional sentinel tests verify representative pathways for:

- pegylated liposomal doxorubicin bilirubin bands;
- cisplatin renal bands and fluorouracil absolute bilirubin restrictions;
- gemcitabine hepatic adjustment;
- intravenous and oral topotecan renal/hepatic pathways;
- lutetium-177 oxodotreotide renal and hepatic pathways;
- pemigatinib, fruquintinib, tepotinib and everolimus organ-function pathways.

## Partial-assessment verification

For all 74 records, the test suite confirms that:

- organ-function inputs remain optional;
- every organ-function input has a demonstration value;
- single-value or single-band assessment remains available;
- omitted domains remain explicit coverage gaps;
- no protocol is left with the v0.58.1 `partial_rule_encoding` state;
- no protocol is marked clinically authorised by this automated release.

## Data-integrity comparison

- Protocol JSON files in hash register: **382**
- Published catalogue entries: **376**
- Protocol source records included in publishing validation: **380**, plus the authoring template
- Protocol files changed from v0.58.1: **74**
- Protocol files added: **0**
- Protocol files removed: **0**

Files outside the 74-protocol clinical scope changed only where required for versioning, testing, audit outputs, documentation, catalogue generation or deployable-site packaging.

## Known boundaries

- The release does not claim independent consultant or oncology-pharmacy approval.
- The release does not convert monitoring-only laboratory requirements into invented dose thresholds.
- The release does not infer a whole-regimen action where component-specific source actions differ.
- Four mapped biologic protocols are explicitly recorded as having no prescriptive organ-function adjustment table in the mapped source rather than being assigned artificial cutoffs.
- Current official NCCP documents and local governance remain the operational authority.
