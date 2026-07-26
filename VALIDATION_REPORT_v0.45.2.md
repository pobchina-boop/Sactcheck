# SACTCheck v0.45.2 validation report

## Scope

Validation of the one-page printable/PDF clinical assessment output and associated decision-support language against the v0.45.1 contextual-indication baseline.

## Automated checks

- Complete historical repository test suite: **passed**.
- Focused v0.45.2 one-page output test: **passed**.
- Assessment engine version and cache integration: **passed**.
- Output module loads before the generic assessment UI: **passed**.
- A4 print stylesheet and print-only body state: **passed**.
- Clinician decision and rationale fields: **passed**.
- Screen, PDF and text-summary disclaimer presence: **passed**.
- Non-directive wording test excluding `safe to treat`, `treatment approved` and `cleared`: **passed**.
- Existing single-value partial assessment behaviour: **unchanged and passed**.
- Existing v0.45.1 tissue-specific shared-indication tests: **passed**.

## PDF layout verification

A representative output fixture was generated with:

- a long multi-agent regimen title;
- a long neoadjuvant indication;
- 10 entered-value/criterion rows;
- two clinically important triggered findings;
- three additional routine values retained electronically;
- a long unassessed-domain list;
- a clinician decision and concise rationale;
- the full permanent disclaimer.

The fixture rendered to **one A4 portrait page** with no clipped text, overlaps or missing content. The rendered PNG was visually inspected after PDF generation.

## Output prioritisation

- Critical, hold, dose-modification and review/context rows are always retained.
- Routine met/recorded rows are included up to the configured one-page allowance.
- Omitted routine rows are counted and explicitly stated as available in the detailed electronic assessment.
- Unassessed domains are listed compactly and explicitly described as not assumed normal.

## Clinical limitation

This release validates software behaviour and output layout. It does not constitute independent clinical validation of the encoded NCCP rules. Protocol-level consultant and oncology-pharmacy review remains required before clinical deployment or reliance.
