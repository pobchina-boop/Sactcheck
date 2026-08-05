# Validation Report — SACTCheck v0.56.0

## Release

**Clinical Scenario and Regimen Information**

## Cumulative baseline

This release is built on v0.55.0 and contains the complete global and in-regimen Clinical scenario interpreter workflow, v0.54.0 confirmation controls and Immunotherapy toxicity map refinements. It can be applied as one cumulative repository update.

## Focused Clinical scenario interpreter validation

Automated tests confirmed:

- the exact function name **Clinical scenario interpreter** is retained;
- `bevicizumab` is conservatively recognised as bevacizumab;
- the interpreted correction is displayed rather than applied silently;
- systolic blood pressure 190 mmHg is extracted as candidate clinical information before regimen selection;
- blood pressure 190 is not interpreted as an NCCP protocol number;
- a medicine-only bevacizumab scenario returns several possible bevacizumab protocols;
- candidate protocols can be grouped by tumour context;
- exact protocol selection remains mandatory before structured assessment;
- a selected protocol without a numeric blood-pressure field produces an explicit warning;
- numeric blood pressure is not converted into a Boolean hypertension answer;
- the interpreter does not call the deterministic assessment engine before protocol selection.

## Regimen information and evidence validation

Automated tests confirmed:

- all published JSON-generated regimen cards include a **Regimen info** action;
- legacy-integrated cards receive the same action during catalogue reconciliation;
- the opened assessment engine includes a Regimen info action;
- the knowledge-base data file loads separately from clinical protocol JSON;
- 24 drug profiles contain drug name, type, class, mechanism and review status;
- 18 evidence records contain protocol mapping, publication identifier, clinical context, study design, relevance, limitations, match type and review status;
- all 18 evidence mappings resolve to existing SACTCheck protocol identifiers;
- all 18 publication links use stable PubMed URLs and the PMID agrees with the link;
- the page describes the NCCP protocol as the operational source;
- unmapped regimens show an explicit no-evidence empty state;
- AI-assisted draft summaries are labelled pending clinical and/or pharmacy review.

## Full pipeline

- Repository security scan passed: **864 text files scanned**.
- Protocol index and regimen-card metadata publishing passed.
- **381 protocol publishing tests passed**.
- Complete historical regression suite passed.
- v0.54.0 in-regimen scenario tests passed.
- v0.55.0 global scenario tests passed.
- v0.56.0 focused scenario-refinement tests passed.
- v0.56.0 regimen-information and evidence tests passed.
- GitHub Pages build passed.
- Deployable-site validation passed.
- The deployable site contains the knowledge-base JSON, JavaScript and CSS assets.

## Clinical-file integrity

A byte-for-byte SHA-256 comparison against the v0.55.0 baseline confirmed:

- **382 protocol JSON files in v0.55.0**;
- **382 protocol JSON files in v0.56.0**;
- zero added protocol JSON files;
- zero removed protocol JSON files;
- zero changed protocol JSON files.

No NCCP threshold, rule, recommendation, protocol dose level or patient-specific dose calculation was changed.

## Residual limitations

- Typo recognition is deliberately conservative and does not cover unrestricted spelling variation.
- Medication-only wording may return many possible protocols and requires exact clinician selection.
- Candidate clinical values are not useful for deterministic assessment unless the chosen protocol contains a matching structured input.
- The evidence pilot covers 18 protocol mappings rather than the complete catalogue.
- Drug and evidence summaries are AI-assisted drafts pending Consultant Oncology and oncology-pharmacy review.
- Primary publications may support a medicine or treatment setting without exactly reproducing the current NCCP schedule; the displayed evidence-match category and limitations must therefore be reviewed.
- Automated validation does not constitute clinical validation.

## Release conclusion

The technical release passed the complete repository pipeline. The new functions are suitable for controlled feasibility testing, subject to the existing decision-support boundary and independent clinical review of the evidence content.
