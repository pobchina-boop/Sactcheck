# SACTCheck v0.52.0 — Protocol Dose & Schedule

## Purpose

Adds the first embedded protocol dosing workspace inside the opened regimen assessment engine. The feature is designed as an NCCP regimen map rather than a patient-specific dose calculator.

## User interface

A new **Dose & Schedule** button appears beside the official NCCP protocol button when structured schedule data are available for the selected regimen.

The in-context panel can display:

- Regimen components
- Protocol starting doses
- Route
- Treatment days
- Cycle length using the existing qNd convention
- Treatment phase and planned course
- A selectable treatment-day view
- Selectable protocol-defined dose levels where structured dose-level data exist
- Source-linked encoded hold, omit, reduction, restart and discontinuation pathways
- Direct access to the official NCCP protocol

The clinician remains inside the regimen assessment engine throughout.

## Coverage

- 376 protocols assessed for feature availability
- 328 protocols have structured schedule data and display the button
- 65 protocols use structured treatment-phase metadata
- 264 protocols use a structured treatment object
- 30 protocols have selectable protocol dose-level groups
- 365 protocols have one or more encoded modification pathways available to the viewer
- 48 protocols do not yet have sufficiently structured schedule metadata; the button remains hidden for these regimens

Detailed coverage is recorded in:

- `V0520_PROTOCOL_DOSE_SCHEDULE_COVERAGE.json`
- `V0520_PROTOCOL_DOSE_SCHEDULE_COVERAGE.csv`
- `V0520_PROTOCOL_DOSE_SCHEDULE_COVERAGE.md`

## Safety and product boundary

This release does not:

- Calculate BSA
- Calculate creatinine clearance or eGFR
- Calculate carboplatin dose
- Multiply a protocol dose by patient measurements
- Apply dose banding, vial rounding or local prescribing rules
- Generate or authorise a prescription
- Link to ONCOassist or another external calculator

Selecting a dose level changes only the protocol information displayed. It does not alter the assessment or produce a patient-specific dose.

## Clinical-content boundary

No protocol JSON file, clinical rule, threshold, action or dose-modification recommendation was changed. The new view reads existing structured regimen metadata and existing source-linked rules.

The current official NCCP protocol and authorised prescribing system remain authoritative. Independent Consultant Oncology and oncology-pharmacy validation remains required.
