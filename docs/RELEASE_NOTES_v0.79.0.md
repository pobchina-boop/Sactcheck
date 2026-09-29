# SACTCheck v0.79.0 — clinic workflow knowledge and consent support

## What changed

The regimen clinic workflow now exposes two distinct patient-facing support paths alongside the clinical assessment and supportive-care modules:

- **Knowledge & Evidence** opens the expanded knowledge profile for the selected regimen when the existing knowledge module reports a profile. Regimens without a detected expanded profile remain visibly marked for a content check; the workflow does not imply that content has been completed.
- **Consent discussion support** generates a regimen-specific printable draft from the current regimen and risk content. The sheet includes treatment identity, medicines, schedule, regimen-linked risks, and writable prompts for expected benefit, alternatives (including no SACT), and patient questions/preferences.

The consent output is explicitly labelled discussion support. It does not collect patient identifiers and does not replace the formal HSE/NCCP consent process or the approved clinical record. Existing consent-content metadata says consultant and oncology-pharmacy review is required, so the workflow labels it **Review** and calls the generated output a draft.

The release also updates the canonical visible app version and cache-busting keys to **0.79.0**. Existing patient-guide, Treatment Passport, antiemetic traffic-light, regimen assessment, and patient-route functionality are retained.

## Implementation boundary

This is workflow integration and document-generation support. It does not alter regimen assessment rules, prescribe treatment, or mark any knowledge/consent content as clinically approved. The expanded knowledge profile remains source-linked content and must be reviewed before clinical reliance.
