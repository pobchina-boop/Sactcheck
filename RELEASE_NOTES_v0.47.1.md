# SACTCheck v0.47.1 — Clinician-Focused Usability Release

## Purpose

This release reorganises the complete adult solid-tumour application around the fastest routine clinical workflow: find the correct regimen, confirm the indication and schedule, identify the applicable encoded criterion, and retain access to the detailed rule basis when required.

No protocol assessment rules or NCCP clinical source content were deliberately changed in this release.

## Library and navigation

- Reconciled the visible catalogue with the 361 enabled canonical protocol records.
- Removed non-canonical placeholder/legacy cards after canonical protocol loading.
- Prevented shared legacy-card targets from suppressing distinct canonical regimens.
- Promoted global regimen search above tumour-site navigation.
- Search covers regimen title, drugs, trade names, NCCP number and indication.
- Added a clear-filters control and `/` keyboard shortcut.
- Added local favourites and the five most recently opened protocols without requiring login or patient data.
- Strengthened the selected tumour-site state.
- Marked Haematology as limited pilot coverage rather than implying a complete library.
- Moved raw JSON preview controls behind explicit `?debug=1` developer mode.
- Shortened the normal version display and added an expandable release summary.

## Regimen cards

- Simplified card hierarchy around regimen, indication, schedule, source and clinical validation status.
- Combined NCCP source and validation status into one clinician-facing badge.
- Moved trade names, engine format and rule counts into expandable protocol details.
- Added whole-card keyboard and pointer launch while preserving separate PDF actions.
- Added local favourite controls.
- Added explicit multi-phase schedule labels for AC/paclitaxel and other common phased regimens.

## Assessment result

- Replaced directive display headings with transparent encoded-criteria language.
- Added a priority patient-value versus encoded-criterion comparison immediately below the outcome.
- Combined applicable-rule, evaluated-rule and completeness metrics into one concise summary.
- Condensed the on-screen decision-support disclaimer while retaining the complete PDF disclaimer.
- Replaced the long open unassessed-domain section with a compact partial-assessment strip.
- Collapsed detailed findings, component interpretation and text export by default.
- Retained the direct adaptive PDF generator and separated final clinician decision from the calculated result.

## Accessibility and readability

- Increased clinical text and badge contrast.
- Added clear keyboard focus states.
- Avoided relying on colour alone for status communication.
- Added empty-search feedback and aria-live catalogue counts.
- Made the prototype notice minimisable for the current browser session.

## Release status

- 361 enabled canonical protocols.
- Full historical and release-specific automated suite passed.
- Clinical encodings remain pending independent consultant-oncologist and oncology-pharmacy validation where indicated.
