# SACTCheck v0.52.5 — Dose Action Navigation

## Summary

This corrective release fixes the **Review dose & schedule** control shown after an assessment triggers a protocol dose action.

The defect occurred when a protocol had a valid encoded component-specific dose action but did not yet have a complete structured schedule. The result prompt appeared, but the Dose & Schedule module refused to open because schedule metadata were unavailable.

## Corrected behaviour

- A result-linked dose prompt now opens the embedded dose workspace whenever an applicable encoded dose action exists.
- If a complete structured schedule is available, the button reads **Review dose & schedule**.
- If only an encoded dose action is available, the button reads **Review dose action**.
- The action-only panel displays:
  - affected component;
  - entered trigger;
  - governing protocol action;
  - resulting protocol-level dose or no-dose outcome;
  - simultaneously triggered secondary rules;
  - source reference and official NCCP protocol link.
- The normal header **Dose & Schedule** button remains hidden when no actual structured schedule or dose-level table exists.

## Safety boundary

The action-only panel does not invent missing schedule data. It does not calculate BSA, creatinine clearance, Calvert carboplatin dose, dose banding, vial rounding or a patient-specific final dose.

No clinical protocol JSON file, threshold, rule condition, recommendation or dose calculation was changed.
