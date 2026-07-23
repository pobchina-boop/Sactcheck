# SACTCheck v0.37.1 — Single-entry assessment and alias support

## Purpose

This focused corrective release enforces meaningful partial assessment from one entered clinical value and adds searchable common/trade-name aliases while preserving official NCCP generic regimen titles.

## Single-entry assessment

- A restrictive rule still returns its immediate hold, delay, reduction, review or discontinuation action when only the relevant value is entered.
- A normal value now returns an explicit **assessed-domain result** when it does not trigger the encoded restrictive threshold.
- The result clearly states that it is not an overall proceed decision and lists all unassessed domains.
- When a rule genuinely requires linked information, the entered value is retained and the exact missing field or treatment context is identified instead of returning a generic insufficient-data message.
- Empty forms remain non-actionable; missing fields are never assumed normal.

## PLD/carboplatin correction

NCCP 00624 now returns a meaningful ANC-only assessment. A normal ANC displays the encoded threshold comparison and a partial domain result; a low ANC continues to trigger the encoded restrictive action. Cycle number, assessment type and current dose levels no longer block independent ANC evaluation.

## Common/trade-name aliases

- Added a central curated alias registry used by catalogue cards, global search and the protocol information panel. The registry currently maps 111 of 121 active regimens using 45 generic-drug entries and 191 displayed alias occurrences.
- Official NCCP generic titles remain the primary names.
- Examples include Caelyx/PLD, Enhertu, Kadcyla/T-DM1, Phesgo, Trodelvy, Abraxane, Keytruda, Tecentriq, Imfinzi, Ibrance, Kisqali and Verzenios.
- Formulation-specific suppression prevents misleading aliases, for example PLD is not labelled as conventional Adriamycin and nab-paclitaxel is not labelled as Taxol.
- Aliases are recognition/search aids only and do not identify the dispensed brand, manufacturer or biosimilar.

## Validation

- Added catalogue-wide regression testing across all 121 active regimens and 1,677 visible rule-linked single inputs; every tested one-value assessment returns a meaningful finding.
- Added support for the existing `when` rule wrapper used by 38 encoded rules, so those rules now participate in normal and partial evaluation.
- Added targeted normal-ANC and low-ANC tests for NCCP 00624.
- Added alias search/display and formulation-safety tests.
- Full legacy regression suite retained.

Clinical encodings remain pending consultant, oncology-pharmacy and local governance validation before clinical deployment.
