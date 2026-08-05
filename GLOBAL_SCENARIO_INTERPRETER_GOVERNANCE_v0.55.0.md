# Global Clinical Scenario Interpreter Governance — v0.55.0

## Intended function

Provide a local, regimen-agnostic entry point that identifies possible NCCP protocols from de-identified clinical scenario text and transfers the scenario into the existing constrained in-regimen workflow only after the clinician confirms the exact protocol.

## Required sequence

De-identified scenario → local catalogue matching → possible protocol list → clinician selects exact regimen → candidate structured values → clinician confirms values → existing assessment form → deterministic SACTCheck engine → source-linked output.

## Prohibited function

Before exact regimen selection, the global interpreter must not:

- produce a clinical assessment;
- state that treatment should proceed, be withheld or be modified;
- diagnose a condition;
- select one protocol silently when credible alternatives remain;
- combine rules from multiple protocols;
- infer that missing information is normal;
- generate a patient-specific dose;
- send text to an external model or service;
- retain patient-identifiable information.

After regimen selection, the existing v0.54.0 governance boundary remains applicable.

## Ambiguity handling

When several protocols remain plausible, the interface must display the alternatives and require manual selection. When no single protocol contains all medicines mentioned, each candidate must show the unmatched medicines. No protocol result is generated until selection occurs.

## Privacy handling

Possible MRNs, hospital numbers, dates of birth, contact details or other identifier markers generate a warning and block transfer into the regimen workflow until the text is corrected.

## Validation requirement

Validation should include:

- exact NCCP-number scenarios;
- generic and trade-name scenarios;
- single-drug and multi-drug regimens;
- ambiguous regimen names;
- disease-only scenarios;
- unmatched medicine combinations;
- identifier-containing scenarios;
- unsupported language;
- confirmation that no assessment engine is invoked before exact protocol selection.
