# SACTCheck v0.44.0 — Genitourinary Library Validation Report

**Validation date:** 25 July 2026  
**Release:** 0.44.0  
**Scope:** Complete current NCCP Genitourinary SACT catalogue reconciliation and encoding

## Catalogue reconciliation

- 67 unique Genitourinary protocol codes represented
- 21 newly added canonical protocol files
- 46 existing or shared canonical protocols reconciled into the GU catalogue without duplicate cards
- Four GU sections covered: bladder/urothelial, germ-cell, prostate and renal
- Complete SACTCheck indexed library: 329 protocols

## Encoded assessment coverage

- 816 GU input definitions
- 738 GU assessment rules
- 643 automated single-entry assessment checks
- Missing values remain unassessed and do not block a partial assessment
- Clinical and pharmacy validation status remains explicitly pending for encoded prototypes

## Regimen-card metadata

- Every GU protocol has a cycle interval representation
- Treatment intent and duration are displayed when confirmed or safely structured
- 41 GU protocols retain a non-blocking duration review flag where course length is indication-dependent or requires source confirmation
- No duration was guessed solely from palliative intent

## Automated validation

The complete repository test suite passed:

- Command: `npm test`
- Exit code: `0`
- Elapsed time: `20.34 seconds`
- Protocol index validation: passed for 329 protocols
- Regimen-card metadata validation: passed
- Regimen-card metadata coverage: passed for 329 published protocols
- GU release test: passed for 67 protocols, 21 new protocols, 816 inputs, 738 rules and 643 single-entry checks
- Existing Breast, Gastrointestinal, Lung, Sarcoma, Neuro-oncology, Gynaecology and platform regression suites: passed

## Clinical safety status

This release is a source-linked encoded prototype. It is suitable for shadow validation and structured review, but not for autonomous clinical decision-making. Independent Consultant oncologist and oncology-pharmacy validation remains required before formal clinical deployment.
