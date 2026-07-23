# SACTCheck

## Current release

**SACTCheck v0.37.0 - Platform Standardisation**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. The current release contains 121 active regimen protocols and standardises catalogue classification, supportive-care mapping, CTCAE grading guidance and renal-input handling across the complete library.

### v0.37.0 highlights

- Separate catalogue sections for chemotherapy/combination SACT, targeted/HER2 therapy, immunotherapy, endocrine therapy and bone-modifying therapy.
- Pure endocrine medicines such as tamoxifen, anastrozole, letrozole, exemestane and fulvestrant are no longer displayed as chemotherapy.
- Central NCCP V6 emetogenic-risk/supportive-care mapping for all 121 regimens.
- Beside-control CTCAE v5.0 Grade 0-4 definitions and practical assessment guidance for 415 toxicity inputs.
- Protocol-specific renal-band selectors for 32 categorical renal fields.
- Exact continuous renal entry retained for 27 carboplatin/Calvert dosing fields.
- No duplicate protocol IDs, NCCP codes or normalised regimen titles.
- No active regimen placeholders.
- Obsolete nested v0.17 preview files removed from the protocol-data folder.

See `RELEASE_NOTES_v0.37.0.md` and `STANDARDISATION_AUDIT_v0.37.0.md` for the full release boundary and validation findings.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Always verify the assessment against the current official NCCP regimen, current local policy, oncology-pharmacy review and consultant judgement.

The included local CUH supportive-medicine PDFs date from 2021 and require formal reconciliation with NCCP V6 and current local policy before clinical deployment. The encoded protocols remain pending formal consultant, oncology-pharmacy and governance validation.
