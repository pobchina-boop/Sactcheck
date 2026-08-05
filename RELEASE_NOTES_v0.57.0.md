# SACTCheck v0.57.0 — Search-First Library

## Summary
This cumulative release makes deterministic regimen search the primary homepage workflow and reduces the visual prominence of the developing Clinical scenario interpreter.

## Changes
- Moves the complete regimen catalogue and search controls above the project and study-information sections.
- Enlarges and strengthens the visual hierarchy of the main regimen search field.
- Replaces the permanently open Clinical scenario interpreter with a compact expandable control labelled as early development.
- Adds a 175 ms input debounce to avoid re-filtering the full catalogue after every keystroke.
- Caches pre-normalised searchable card documents in memory.
- Runs direct title, alias, NCCP-number and content matching first; close-spelling matching runs only when no direct matches are found.
- Keeps the scenario interpreter separate from the deterministic regimen-search pathway.
- Preserves tumour, treatment-type, status and haematology-route filters.

## Clinical boundary
No protocol rules, dose-modification logic, treatment status logic or partial-assessment behaviour were changed by this release.
