# SACTCheck

## Current release

**SACTCheck v0.37.2 — Tissue UI and automatic local ULN calculations**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. The current release preserves the platform-wide single-entry assessment architecture and adds tissue-specific visual navigation, actual-result hepatic laboratory entry and optional immunotherapy endocrine bloods.

### v0.37.2 highlights

- Stable icon and colour system for tumour-site catalogue pages and regimen cards.
- Tissue landing banners with treatment-class counts and one-tap filtering.
- Actual ALT, AST and bilirubin entry with central CUH ULNs and automatic ×ULN calculation.
- Combined transaminase pathways use the highest calculated ALT/AST multiple while still permitting either result to be entered alone.
- Optional immunotherapy-only TSH, free T4, cortisol, ACTH, glucose and ketone inputs.
- Existing single-entry assessment, CTCAE descriptions, renal bands, supportive-care mappings and trade-name search retained.
- Full regression suite passed, including 94 automatic ALT/AST/bilirubin ULN mappings.

See `RELEASE_NOTES_v0.37.2.md` and `VALIDATION_REPORT_v0.37.2.md` for the release boundary and automated checks.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Always verify the assessment against the current official NCCP regimen, current local policy, oncology-pharmacy review and consultant judgement.

The included local CUH supportive-medicine PDFs date from 2021 and require formal reconciliation with NCCP V6 and current local policy before clinical deployment. The encoded protocols remain pending formal consultant, oncology-pharmacy and governance validation.
