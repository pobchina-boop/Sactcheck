# Scenario Interpreter Governance — v0.54.0

## Intended function

Translate de-identified natural-language scenario text into candidate values for fields already present in the currently opened SACTCheck regimen.

## Prohibited function

The interpreter must not:

- diagnose a condition;
- select a regimen;
- invent a clinical value;
- infer a missing result as normal;
- generate or alter a protocol threshold;
- independently recommend treatment;
- calculate a patient-specific final chemotherapy dose;
- override the deterministic assessment engine;
- transmit scenario text to an unapproved external service;
- retain patient-identifiable information.

## Required sequence

Scenario text → candidate structured values → clinician confirmation → existing assessment form → deterministic SACTCheck engine → source-linked output.

## Validation requirement

Every supported extraction type should be tested using positive, negative, ambiguous, out-of-range, unit-variant and identifier-containing examples before broader clinical evaluation.
