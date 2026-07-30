# SACTCheck v0.52.4 — Compact Clinical Inputs & Phase Naming

## Scope

This release refines presentation only. It reduces scrolling in the Bloods and organ function section and makes sequential regimen cards easier to scan.

## Changes

- Empty numeric and text inputs use `Enter value`; empty selectors use `Select…`.
- `Not assessed` is reserved for assessment output and is not shown as an input default.
- Haematology, renal, hepatic, other blood and immunotherapy laboratory inputs share one responsive compact grid.
- Each laboratory card carries a small domain label rather than occupying a separate full-width row.
- Repeated field-level optionality text is removed; one section-level safety statement remains.
- Educational CTCAE grading for laboratory values remains available behind a compact closed guide and appears inline only after a value is entered.
- Result and ULN inputs are displayed compactly with automatic ×ULN feedback after entry.
- Duplicate unit text in ANC and platelet labels is suppressed.
- Nine sequential breast regimen cards now place the current phase first and show the preceding phase in parentheses.

No protocol JSON, clinical rule, threshold, dose band, treatment action or patient-specific dose calculation was changed.
