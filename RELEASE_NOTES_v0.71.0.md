# SACTCheck v0.71.0 — Regimen-Specific SACT Consent Builder

## Purpose
Adds a regimen-card **Consent** button that generates a clinician-reviewable, regimen-specific SACT consent discussion draft.

The builder layers:
1. regimen metadata and current NCCP source,
2. generic cytotoxic chemotherapy consent content when applicable,
3. generic immune-checkpoint-inhibitor consent content when applicable,
4. mapped agent-specific material-risk prompts for the medicines in the exact regimen,
5. clinician-entered patient-specific benefit, alternatives, consequences of no treatment and additional material risks.

## Consent-policy alignment
The interface explicitly requires completion of:
- expected benefit / aim of treatment,
- reasonable alternatives,
- what may happen if treatment does not proceed,
- patient-specific material risks,
- treatment intent confirmation,
- pregnancy / contraception / fertility discussion where relevant,
- patient questions / additional discussion.

The content is designed to support the HSE National Consent Policy and the NCCP SACT consent process. It does not replace either.

## Immunotherapy
The generic immune-checkpoint-inhibitor layer includes:
- pneumonitis,
- diarrhoea / colitis,
- hepatitis,
- endocrinopathies,
- nephritis,
- skin toxicity,
- infusion reactions,
- less common neurological / cardiac / muscle / ocular / haematological immune toxicity,
- delayed and persistent immune toxicity,
- possible need for steroids, other immunosuppression, hormone replacement, treatment interruption or discontinuation.

## Agent-specific content
The initial structured library covers more than 50 commonly used oncology medicines across:
- cytotoxic chemotherapy,
- immune checkpoint inhibitors,
- anti-VEGF / EGFR / HER2 therapy,
- antibody-drug conjugates,
- CDK4/6 inhibitors,
- PARP inhibitors,
- selected TKIs,
- prostate/endocrine therapies,
- myeloma/haematology agents.

Unmapped medicines are never guessed. They are displayed as **manual agent review required**.

## Privacy / data handling
The builder does not request or persist patient name, MRN, DOB or other direct identifiers.
Patient identifiers appear only as blank lines on the printable form and should be completed in the approved clinical record or after printing.
Consent data are not written to localStorage or sessionStorage.

## Output
- Live regimen-specific preview.
- Clinician-selectable risk prompts.
- Free-text patient-specific consent domains.
- Copyable consent discussion text.
- Print / Save PDF workflow.
- Current NCCP regimen source link.
- Mobile-responsive interface.

## Governance
- Current NCCP source remains authoritative.
- Agent-specific consent prompts are structured draft content pending independent Consultant Oncology and oncology-pharmacy review.
- The generator does not autonomously provide consent, treatment clearance or a patient-specific recommendation.
- Existing v0.70.0 and v0.70.1 clinical source-reconciliation layers are preserved.
- No protocol JSON or deterministic assessment rule is changed by this feature release.
