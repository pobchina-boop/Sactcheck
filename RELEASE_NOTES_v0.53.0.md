# SACTCheck v0.53.0 — Immunotherapy Visual Safety

## Summary

This release adds an original organ-system visual safety panel to immune-checkpoint inhibitor regimens inside the opened assessment engine.

The panel provides a rapid visual map of common immune-mediated toxicity domains and links each organ tile to the regimen's existing structured inputs, associated laboratory tests and deterministic assessment findings.

It is a navigation and communication layer. It does not create new management rules or replace the current NCCP protocol, local immune-toxicity pathway, product information or clinical judgement.

## Interface

A new **Immune safety** control appears only for supported immune-checkpoint inhibitor regimens.

The panel contains nine domains:

- Lung
- Bowel
- Liver
- Endocrine
- Kidney
- Skin
- Neurological
- Cardiac / muscle
- Infusion / systemic

Each tile shows one of four states:

- No data
- Data entered
- Review / withhold
- Urgent / stop

Selecting a tile shows:

- focused symptoms and examination prompts;
- common associated tests;
- structured inputs available in that regimen;
- current restrictive encoded findings, where triggered;
- a control to return directly to a relevant assessment input.

## Blood and monitoring links

The visual panel reuses the existing regimen assessment fields. Examples include:

- ALT, AST and bilirubin for liver toxicity;
- TSH and free T4, with cortisol, ACTH, glucose and ketones where structured, for endocrine toxicity;
- creatinine and eGFR for renal toxicity;
- oxygenation, pneumonitis symptoms and relevant clinical grades for lung toxicity;
- diarrhoea and colitis grades for bowel toxicity;
- troponin, ECG or CK-related fields where present for cardiac or muscle toxicity.

Blank domains remain unassessed. Entering a value can mark a tile as **Data entered**, but only an existing encoded restrictive finding can create a review, withholding, discontinuation or urgent state.

## Source framework

The panel provides direct access to:

- the current official NCCP regimen;
- ESMO guidance on immunotherapy toxicities;
- SITC guidance on immune-checkpoint inhibitor-related adverse events;
- relevant EMA product-information pages for the immune-checkpoint inhibitor components detected in the regimen.

The visual design is original to SACTCheck and does not reproduce the pharmaceutical educational poster that prompted the concept.

## Coverage

The v0.53.0 audit identifies:

- 49 supported immune-checkpoint inhibitor protocols;
- 9 visual organ systems;
- 0 clinical protocol JSON changes.

The control remains hidden for non-ICI regimens.

## Safety boundary

The panel does not independently diagnose an immune-related adverse event. It does not add corticosteroid dosing, a new toxicity-management algorithm, a patient-specific dose calculation or an autonomous treatment decision.

All treatment actions displayed by the panel originate from findings already produced by the deterministic SACTCheck assessment engine. The current official NCCP protocol, local immune-toxicity pathway, current product information, authorised prescribing system and treating clinician remain authoritative.
