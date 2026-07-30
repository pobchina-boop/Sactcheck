# SACTCheck v0.51.0 Validation Report

**Release:** Solid Tumour Reconciliation  
**Validation date:** 29 July 2026

## Repository and catalogue checks

- 376 indexed protocols
- 361 Solid Tumour protocols
- 15 Haematology protocols
- 5,879 Solid Tumour input definitions
- 5,577 Solid Tumour encoded rules
- Zero duplicate Solid Tumour protocol IDs, index IDs, NCCP codes, indexed paths or source URLs
- Zero orphaned clinical protocol JSON files
- Zero unspecified Solid Tumour source versions
- Zero forced assessment-launch inputs
- Zero static required input flags
- Zero protocols missing the v0.51.0 partial-assessment or reconciliation metadata

## Source-version checks

Twelve source versions were manually resolved from current official NCCP PDFs. Publication and review metadata were stored where displayed in the source. Two direct PDF addresses were corrected.

All 361 Solid Tumour source links were checked structurally for HTTPS and an approved HSE host. This automated check confirms the stored address format and ownership; it is not a claim that every remote server response was live-tested during every future build.

## Assessment tests

- A rule-linked single value produced a meaningful assessment in every one of the 361 Solid Tumour protocols.
- 6,162 numeric comparison leaves were exercised at their exact boundary and immediately above or below the boundary as applicable.
- The full historical regression suite passed after optional-input standardisation.
- Complete multi-value test scenarios continue to return their previously expected encoded actions.

## Clinical-content preservation

A structured comparison with v0.50.3 found:

- 0 changes to the 361 Solid Tumour `rule_engine` objects
- 0 changes to treatment structures, treatment phases, indications, supportive-care blocks, dose-modification blocks or clinical notes
- 0 changes to the 15 Haematology protocol JSON files

The intended protocol changes are confined to source metadata, reconciliation metadata, optional-input declarations and form visibility.

## Governance backlog

The structural audit passes, but metadata completion remains an explicit manual work queue:

- 254 protocols do not yet store a publication date
- 253 protocols do not yet store a review or last-reviewed date
- 191 protocols are not yet explicitly marked as having undergone manual source-document review in the structured validation metadata

These findings are not treated as automated release failures because historical NCCP documents use inconsistent header formats and many SACTCheck encodings pre-date the current metadata model. They must be addressed during protocol-by-protocol clinical and pharmacy validation.

## Overall result

The full `npm run test:ci` pipeline passed, including repository security scanning, protocol-index generation, the complete historical regression suite, the dedicated v0.51.0 reconciliation tests, GitHub Pages build and deployable-site validation.

This is a technical reconciliation and software-validation result. It does not authorise autonomous clinical use or replace the current NCCP regimen, local policy or clinician judgement.
