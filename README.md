# SACTCheck

## Current release

**SACTCheck v0.50.2 — Clinical Copy Refinement**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with structured comparisons against NCCP regimen criteria. v0.50.2 implements consultant feedback on readability and removes duplicated Haematology navigation from the Solid Tumour library.

### v0.50.2 highlights

- Haematology appears only in the dedicated Haematology portal.
- Solid Tumour counts, favourites and recent protocols exclude Haematology regimens.
- The large patient information card has been removed.
- Generic assessment outputs use shorter clinical wording.
- No protocol rule, threshold, source link or treatment encoding changed.
- Complete historical and release specific regression suite passed.

See `RELEASE_NOTES_v0.50.2.md` and `VALIDATION_REPORT_v0.50.2.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. The release is technically encoded and regression-tested, but rule-level clinical content remains pending independent consultant and oncology-pharmacy validation. Always verify decisions against the current official NCCP regimen and local policy.
