# SACTCheck

## Current release

**SACTCheck v0.38.1 — Complete prostate treatment library**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. This release completes the current prostate treatment deck as fully encoded clinical prototypes while preserving tissue-specific navigation, automatic local ULN calculations, optional immunotherapy endocrine bloods, searchable trade-name aliases and single-entry partial assessment.

### v0.38.1 highlights

- 26 distinct current NCCP prostate regimen protocols, with no prostate placeholders.
- 24 new Genitourinary JSON protocols plus upgrades to the shared NCCP 00203 docetaxel and NCCP 00588 olaparib protocols.
- Prostate endocrine/ADT, chemotherapy, PARP-combination, olaparib and radium-223 treatment pathways.
- Official NCCP PDF access, treatment schedules, eligibility/exclusions, monitoring and decision rules.
- CTCAE explanations beside grade-based controls.
- Protocol-specific tiered renal selectors where the source uses renal categories.
- Oral and parenteral supportive-care mappings and prostate trade-name aliases.
- Single-value assessment retained across all 145 active regimens.
- Complete regression suite passed, including 180 prostate single-input checks.

See `RELEASE_NOTES_v0.38.1.md`, `PROSTATE_LIBRARY_SOURCES_v0.38.1.md` and `VALIDATION_REPORT_v0.38.1.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Always verify the assessment against the current official NCCP regimen, current local policy, oncology-pharmacy review and consultant judgement.

The encoded protocols are fully structured software prototypes, but formal consultant, oncology-pharmacy and governance validation remains pending before clinical deployment outside a controlled shadow-validation process.
