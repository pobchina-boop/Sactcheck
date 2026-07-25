# SACTCheck

## Current release

**SACTCheck v0.45.1 — Tissue-specific shared-regimen indication hotfix**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. This hotfix corrects the display and selection of indications for regimens shared across more than one tumour library.

### v0.45.1 highlights

- Shared regimen cards display the indication relevant to the active tumour-site filter.
- The selected tissue context is carried into the assessment screen.
- The relevant indication is preselected while all encoded indications remain available.
- Indication options are labelled by tumour group for shared protocols.
- 134 indications across 37 shared protocol files now carry explicit tumour-group metadata.
- Unresolved source/index mismatches use a safe verification message rather than an unrelated indication.
- Complete historical and release-specific regression suite passed.

See `RELEASE_NOTES_v0.45.1.md` and `V0451_CONTEXTUAL_INDICATION_AUDIT.json`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. The release is technically encoded and regression-tested, but rule-level clinical content remains pending independent consultant and oncology-pharmacy validation. Always verify decisions against the current official NCCP regimen and local policy.
