# SACTCheck

## Current release

**SACTCheck v0.38.2 — Tumour-site metadata integrity hotfix**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. This release corrects the tumour-site classification of NCCP 00688 atezolizumab + nab-paclitaxel and adds safeguards preventing conflicting singular and plural tumour-site metadata from contaminating catalogue filters.

### v0.38.2 highlights

- NCCP 00688 is classified and displayed as Breast only.
- The regimen no longer appears under Genitourinary or Lung filters.
- Protocol validation now fails when `tumour_group` conflicts with `tumour_groups`.
- Catalogue loading and assessment display use a safe primary-tumour fallback if inconsistent metadata is encountered.
- Full library tumour-site consistency regression testing added.
- All v0.38.1 title casing, alias precision and active-tissue display fixes retained.
- Complete prostate library, tissue UI, automatic ULN calculations and single-value assessment retained.

See `RELEASE_NOTES_v0.38.2.md` and `UPDATE_INSTRUCTIONS_v0.38.2.txt`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Always verify the assessment against the current official NCCP regimen, current local policy, oncology-pharmacy review and consultant judgement.
