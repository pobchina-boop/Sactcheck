# SACTCheck v0.71.2 - Consent Hardening

## Why this patch exists
Clinician review of the streamlined consent output identified three issues to correct before moving on to the Regimen Workflow Engine:

1. occasional replacement question marks caused by PDF glyph conversion,
2. schedule text needed to come directly from structured regimen administration data rather than a loose summary,
3. the immunotherapy consent block needed more explicit serious immune-related adverse events.

## PDF / encoding
The direct two-page PDF exporter now normalises common oncology symbols before rendering and strips unsupported glyphs rather than replacing them with question marks.

Covered explicitly:
- multiplication and inequality symbols,
- superscripts,
- non-breaking and typographic dashes,
- bullet/middle-dot characters,
- common Greek letters and micro symbols,
- typographic quotes and ellipsis.

Regression tests prevent reintroduction of replacement-question-mark output.

## Regimen schedule
The consent schedule is now assembled directly from `treatment_phases[].administration[]`:
- cycle length,
- treatment day,
- medicine,
- administration route where encoded.

The builder no longer invents a schedule from a regimen title. If structured administration data are unavailable, it states:
`Structured schedule unavailable - verify against the current NCCP regimen.`

## Immunotherapy consent audit
The generic immune-checkpoint-inhibitor block now explicitly includes:
- pneumonitis,
- diarrhoea / colitis,
- hepatitis,
- endocrine toxicity,
- nephritis,
- severe skin toxicity,
- myocarditis / pericarditis,
- neurological immune toxicity including encephalitis, neuropathy and myasthenic syndromes,
- myositis / neuromuscular toxicity,
- ocular inflammation,
- pancreatitis / pancreatic inflammation,
- delayed or persistent immune toxicity,
- rare life-threatening or fatal immune toxicity,
- possible need for steroids, other immunosuppression or hormone replacement.

This keeps the consent concise while ensuring serious material immune-related risks are visibly represented.

## Layout
The streamlined consent remains fixed to two A4 pages for double-sided printing:
- Page 1: treatment context, generic SACT/chemotherapy, regimen/agent-specific risks
- Page 2: immunotherapy where applicable, consent discussion, signatures and governance

## Governance
- Current NCCP regimen remains authoritative.
- Current medicine information, HSE consent policy and patient-specific material risks must still be reviewed.
- Consent content remains pending independent Consultant Oncology and oncology-pharmacy validation.
- No protocol JSON, treatment threshold, eligibility rule, dose action or deterministic assessment logic is changed by v0.71.2.
