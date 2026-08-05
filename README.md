# SACTCheck

**SACTCheck v0.56.0 — Clinical Scenario and Regimen Information**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.56.0 refines the **Clinical scenario interpreter** for medication-only, incomplete and misspelled scenarios and adds a dedicated **Regimen info** page with drug type, mechanism of action and a pilot primary-publication evidence base.

### v0.56.0 highlights

- Conservative typo-tolerant recognition with visible correction wording
- Candidate clinical-value preview before exact regimen selection
- Grouped possible protocols for medicines used across several tumour types
- Explicit handling where the selected protocol has no matching structured field
- A Regimen info visual link on every regimen card and within the assessment engine
- 24 AI-assisted draft drug profiles
- 18 source-linked trial evidence mappings with stable PubMed links
- Complete v0.55.0 and v0.54.0 functionality included cumulatively
- No changes to the protocol JSON clinical content

See `RELEASE_NOTES_v0.56.0.md`, `VALIDATION_REPORT_v0.56.0.md`, `CLINICAL_SCENARIO_INTERPRETER_GOVERNANCE_v0.56.0.md` and `REGIMEN_INFORMATION_EVIDENCE_GOVERNANCE_v0.56.0.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
