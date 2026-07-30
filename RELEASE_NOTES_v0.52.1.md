# SACTCheck v0.52.1 — Dose & Schedule Clarity

## Purpose

Corrects the first Protocol Dose & Schedule implementation after clinical interface review showed excessive visual clutter, duplicated assessment criteria and placeholder rows without actual dosing information.

## Changes

- Removes the generic “Protocol dose modification pathways” section.
- Stops converting eligibility, CTCAE, blood-count and other assessment rules into dosing content.
- Removes all “Not structured” dose and route placeholders from the viewer.
- Hides the Dose & Schedule button when useful structured dose or schedule data are not available.
- Displays a compact protocol schedule only when actual component doses and treatment days are structured.
- Displays a genuine dose-level ladder only when explicit protocol dose-level data are present.
- Shows starting dose, dose level -1, dose level -2 and subsequent defined levels in one comparison table.
- Adds a selector that highlights the chosen dose-level column without calculating a patient-specific dose.
- Prevents a partial single-component schedule from being presented as the complete schedule for a multi-agent regimen.

## Coverage

- 82 of 376 protocols have a useful Dose & Schedule view.
- 77 protocols have a complete structured schedule with actual doses and treatment days.
- 23 protocols have genuine protocol dose-level tables.
- 294 protocols hide the button pending adequate structured dosing metadata.

## Safety boundary

This release does not calculate BSA, renal function, carboplatin dose, weight-based dose or a final prescribed dose. It contains no ONCOassist link. The current NCCP protocol and authorised prescribing system remain authoritative.

All clinical protocol JSON files remain byte-for-byte unchanged from v0.52.0. No assessment rule, threshold, treatment recommendation or toxicity output was changed.
