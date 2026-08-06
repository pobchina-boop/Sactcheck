**Current development release: v0.61.0** — eighteen-regimen knowledge base with structured evidence-completeness auditing.

# SACTCheck

## Current release

**SACTCheck v0.61.0 — Three-Regimen Expansion and Evidence-Completeness Audit**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.61.0 expands the non-prescriptive regimen knowledge layer while preserving the clinical assessment engine unchanged.

### v0.61.0 highlights

- Adds detailed profiles for XELOX/CAPOX, weekly paclitaxel and trastuzumab deruxtecan.
- Expands the knowledge base from 15 to 18 regimens and from 22 to 42 principal evidence records.
- Audits every existing profile for encoded-indication coverage, mature follow-up, later add-on/combination evidence, sequencing context and important limitations.
- Adds visible evidence-relationship labels and declared residual uncertainties.
- Preserves SUNLIGHT as contextual combination evidence without creating an unencoded Lonsurf–bevacizumab assessment pathway.
- Leaves all 382 clinical protocol JSON files and deterministic decision rules unchanged.

See `RELEASE_NOTES_v0.61.0.md`, `VALIDATION_REPORT_v0.61.0.md`, `THREE_REGIMEN_EVIDENCE_SOURCE_REGISTER_v0.61.0.md`, `EXISTING_KNOWLEDGE_BASE_EVIDENCE_GAP_AUDIT_v0.61.0.md` and `V0610_PROTOCOL_JSON_HASHES.json`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing and evidence auditing do not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
