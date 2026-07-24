# SACTCheck v0.40.0 Validation Report

## Catalogue integrity

- Complete protocol index: 248 distinct protocol IDs and 248 distinct NCCP codes.
- Lung deck: 59 distinct NCCP codes matching the release inventory.
- No Lung placeholders or draft cards.
- No duplicate Lung protocol IDs or NCCP codes.
- NCCP 00507, 00797 and 00688 are excluded from Lung by permanent tumour-site regression tests.

## Lung encoding coverage

- 997 visible/input definitions across the 59 Lung protocols.
- 955 encoded decision rules.
- 786 visible rule-linked inputs individually assessed in isolation.
- 220 toxicity-grade fields with CTCAE v5.0 metadata and beside-control grading guidance.
- 24 protocol-specific tiered renal inputs.
- 14 exact CrCl/GFR inputs retained for carboplatin/Calvert use.
- Optional endocrine blood fields are present on all Lung immunotherapy protocols and remain non-blocking.

## Platform regression

- Complete historical and current automated test suite passed in the working release folder.
- Protocol validator, rule engine, single-entry assessment, tissue metadata, aliases, supportive care, ULN conversion and catalogue tests passed.
- Release-specific Lung inventory and behaviour test passed.

## Clinical status

The software assertions establish internal consistency and expected engine behaviour. They do not constitute independent clinical sign-off. Rule-level clinical content remains pending consultant and oncology-pharmacy validation against the current official NCCP source documents before formal institutional deployment.
