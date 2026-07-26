# SACTCheck v0.47.0 Validation Report

## Release scope

Completion of the current NCCP Neuroendocrine catalogue and the adult portion of the NCCP Tumour Agnostic Therapy catalogue, using SACTCheck v0.46.0 as the baseline.

Catalogue reconciliation date: 2026-07-26.

## Catalogue coverage

### Neuroendocrine

- NCCP 00320 v6 — Everolimus Monotherapy
- NCCP 00327 v5 — Sunitinib 37.5 mg Therapy – 28 day
- NCCP 00642 v2 — Lutetium-177 Oxodotreotide Therapy

Result: 3 of 3 current Neuroendocrine regimen families represented.

### Adult tumour-agnostic therapy

- NCCP 00702 v2 — Entrectinib Monotherapy – Adult
- NCCP 00758 v3 — Larotrectinib Monotherapy – Adult

Result: 2 of 2 adult tumour-agnostic regimen families represented. Paediatric larotrectinib remains intentionally outside the adult SACTCheck scope.

## Repository changes

- New canonical protocol files: 2
- Existing/shared protocols reconciled: 3
- Total unique protocols in SACTCheck: 361
- Neuroendocrine catalogue inputs: 30
- Neuroendocrine catalogue rules: 31
- Adult tumour-agnostic catalogue inputs: 32
- Adult tumour-agnostic catalogue rules: 31
- Combined release-scope inputs: 62
- Combined release-scope rules: 62

## Clinical and contextual verification

The release-specific audit verified:

- exact catalogue membership and NCCP source mapping;
- tissue-specific indication text for shared protocols;
- avoidance of duplicate canonical regimen cards;
- cycle interval, duration and intent metadata;
- sunitinib ANC and platelet boundaries;
- sunitinib hepatic, cardiovascular, hand-foot and toxicity pathways;
- larotrectinib eligibility, interaction, toxicity and hepatic pathways;
- partial assessment from a single relevant entered value;
- missing values remaining explicitly unassessed;
- official NCCP PDF links;
- dedicated Neuroendocrine and Tumour Agnostic navigation.

## Automated testing

Release-specific validation:

- Neuroendocrine protocols checked: 3
- Adult tumour-agnostic protocols checked: 2
- Single-value assessment checks: 61
- Focused v0.47.0 test: passed

Complete historical repository test suite:

- Protocol publishing and schema validation: passed
- Assessment-engine regression tests: passed
- Previous tumour-library completion tests: passed
- Shared-regimen contextual indication tests: passed
- One-page and direct-PDF output tests: passed
- Head and Neck v0.46.0 regression tests: passed
- Process exit code: 0

## Limitations and status

This report establishes source reconciliation, encoded-rule consistency and automated software behaviour. It does not constitute independent clinical validation. All clinical encodings remain prototypes pending review by the relevant consultant oncologist and oncology pharmacist. The official current NCCP protocol remains the source of truth for treatment decisions.
