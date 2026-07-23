# SACTCheck v0.37.1 Validation Report

## Release boundary

Focused engine and interface correction built from the v0.37.0 platform-standardisation baseline. No NCCP dose thresholds were intentionally changed in this release.

## Automated validation

- Full npm regression suite: PASS
- Active regimen protocols audited: 121
- Visible rule-linked single inputs exercised independently: 1,677
- NCCP 00624 ANC-only normal-result regression: PASS
- NCCP 00624 ANC-only restrictive-result regression: PASS
- Existing `when` rule wrapper support: PASS (38 rules now recognised)
- Alias registry entries: 45
- Active regimens with at least one mapped alias: 111 / 121
- Displayed/searchable alias occurrences: 191
- JavaScript syntax checks: PASS
- JSON parse checks: PASS

## Safety behaviour

- A restrictive single value remains immediately actionable.
- A normal single value produces an assessed-domain result rather than a generic insufficient-data message.
- A normal partial result never clears the whole regimen.
- Missing fields remain explicitly unassessed and are not assumed normal.
- A value that reaches one part of a composite rule reports the additional linked context needed to determine the action.
- Formulation-specific alias suppression prevents PLD being labelled as conventional Adriamycin, nab-paclitaxel as Taxol, or Phesgo/ADCs as ordinary trastuzumab products.

## Governance

Trade/common names are search and recognition aids only. They do not identify the product or biosimilar actually stocked or administered. Clinical encodings remain pending consultant, oncology-pharmacy, software and local governance validation before deployment.
