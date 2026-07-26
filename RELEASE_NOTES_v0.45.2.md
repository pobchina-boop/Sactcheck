# SACTCheck v0.45.2

## One-page clinical assessment output

This release replaces direct printing of the full multi-page assessment screen with a dedicated concise A4 output intended for clinical documentation.

### Output structure

The one-page summary contains:

- regimen title and NCCP code/version;
- active tumour group and indication;
- treatment intent, duration and cycle interval where encoded;
- cycle/day or other entered treatment context;
- anonymous assessment ID and timestamp;
- a non-directive encoded-criteria result;
- entered patient values beside the applicable encoded criteria;
- prioritised abnormal, hold, modification and review findings;
- a compact list of unassessed domains;
- a clinician decision and optional concise rationale/override;
- SACTCheck version and a permanent decision-support disclaimer.

### Safety-language changes

The printable summary uses criteria-based wording rather than treatment-authorisation language. Examples include:

- `No encoded protocol criterion breached`
- `Partial assessment - no restrictive criterion triggered in assessed domains`
- `Encoded criteria require clinical review`

The output does not use `safe to treat`, `treatment approved` or `cleared for chemotherapy` terminology.

### One-page mechanism

All clinically important restrictive or review-triggering findings are retained. Routine clear/recorded entries are capped to preserve a concise A4 record, and any additional routine values are explicitly noted as remaining available in the detailed electronic assessment. Unassessed domains are compressed into one line and are never assumed normal.

### Detailed output retained

The full finding cards, Rule Explorer, detailed copyable assessment summary and text download remain available for validation, discrepancy review and audit.

### Disclaimer

> SACTCheck applies encoded NCCP protocol criteria to clinician-entered information. This output does not constitute treatment clearance and does not replace complete clinical assessment, the current official NCCP protocol, prescribing information, local policy or professional judgement. The responsible oncology clinician retains responsibility for the final treatment decision.

### Validation status

The complete automated repository suite passed. A representative long-regimen fixture containing ten table rows, a long indication, unassessed domains and a clinician rationale rendered as a single unclipped A4 page. Clinical protocol encodings remain pending independent consultant and oncology-pharmacy validation.
