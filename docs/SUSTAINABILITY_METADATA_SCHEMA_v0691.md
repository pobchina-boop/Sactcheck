# SACTCheck Sustainability Regimen Metadata Schema — v0.69.1

## Purpose
This schema provides an auditable place to store regimen-level sustainability drivers without converting them into an unsupported carbon score.

## Profile key
Profiles are keyed by NCCP protocol identifier.

## Structured fields
- Route / delivery classification
- Administration frequency
- Planned treatment encounters per cycle
- Administration / chair time
- Ambulatory pump use
- Cold-chain requirement
- Vial / presentation structure
- Dose-banding opportunity
- Vial-sharing opportunity
- Home / local delivery potential
- Travel-model inputs

## Evidence states
`catalogue_derived`, `source_verified`, `locally_verified`, `modelled`, `not_encoded`, `not_applicable`, `evidence_required`.

## Safety principle
Missing sustainability information remains missing. It is not turned into an assumed CO2e value. Clinical efficacy, safety, patient preference and NCCP criteria remain primary.

## Expansion pathway
Populate these fields regimen-by-regimen alongside future batches-of-three clinical audits. Quantitative CO2e fields should only be introduced after system boundaries, methodology, assumptions and evidence quality are agreed and reviewed.
