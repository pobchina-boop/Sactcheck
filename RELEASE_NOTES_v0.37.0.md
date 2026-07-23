# SACTCheck v0.37.0 - Platform Standardisation

## Purpose

v0.37.0 is a platform-wide consistency release. It does not add a new five-regimen batch. Instead, it applies the same catalogue, supportive-care, CTCAE and renal-input standards across the complete active protocol library.

## Catalogue restructuring

All 121 active NCCP regimen protocols now carry an explicit treatment class and catalogue section:

- 88 Chemotherapy & combination SACT
- 22 Targeted & HER2 therapies
- 5 Immunotherapy
- 5 Endocrine (hormonal) therapies
- 1 Bone-modifying therapy

Pure endocrine medicines are separated from chemotherapy in the catalogue while remaining available through global search and tumour-site filtering:

- NCCP 00253 Tamoxifen
- NCCP 00254 Anastrozole
- NCCP 00361 Fulvestrant
- NCCP 00371 Letrozole
- NCCP 00376 Exemestane

Targeted/endocrine combinations retain their appropriate targeted-therapy section and treatment-class metadata rather than being mislabelled as cytotoxic chemotherapy.

## Antiemetic and supportive-care standardisation

A central supportive-care registry now covers all 121 active regimens and records:

- emetogenic risk;
- source and mapping basis;
- day/phase-specific profiles where risk changes during treatment;
- acute and subsequent-day class guidance;
- breakthrough-emesis guidance;
- local-document status and validation warnings.

Current mapping distribution:

- 28 high risk
- 15 moderate risk
- 22 low risk
- 27 minimal risk
- 7 oral moderate-high
- 8 oral minimal-low
- 13 phase-dependent
- 1 variable because the companion chemotherapy is not fixed

The mapping follows NCCP SACT Antiemetic Guidance V6 (2025): combination therapy is classified by the most emetogenic active component, and multi-day/multi-phase regimens use day- or phase-specific guidance.

Legacy per-protocol supportive-care links were reconciled with the central registry. Minimal-risk biologics and oral SACT no longer open an inappropriate parenteral low/moderate prescription sheet. Phase-dependent regimens no longer display a misleading single static script before the treatment phase is selected.

The included CUH prescription sheets are older local working documents from 2021. They are labelled as requiring oncology-pharmacy reconciliation with NCCP V6 and current local policy before clinical deployment.

## CTCAE grading upgrade

All 415 genuine grade-based toxicity inputs now:

- use a Grade 0-4 selector;
- declare CTCAE v5.0;
- identify a toxicity-specific grading category;
- display practical assessment guidance beside the selector;
- display the meaning of every available grade beside the control;
- link to the NCI CTCAE v5.0 source.

The descriptor library now distinguishes, where applicable:

- diarrhoea from combined diarrhoea/colitis;
- oral mucositis from combined mucositis/diarrhoea;
- maculopapular from acneiform rash;
- infusion reaction from allergic reaction and hypersensitivity/anaphylaxis;
- myocarditis, myositis, Guillain-Barre syndrome and other serious neurological toxicities;
- protocol-relevant hepatic, renal, cardiovascular, pulmonary, gastrointestinal and cutaneous toxicities.

Broad catch-all fields such as "other non-haematological toxicity" explicitly require the clinician to identify the named adverse event and use that event's own CTCAE criterion. Generic severity anchors are displayed only as a screening aid and are not presented as a substitute for a named CTCAE term.

CTCAE v5.0 is retained because the existing encoded NCCP rules were built and reviewed against that controlled terminology. CTCAE v6.0 is now available from NCI, but migration to it requires a separate term-by-term controlled change rather than a silent version substitution.

## Renal-input standardisation

Tiered renal rules now use protocol-specific categorical selectors instead of requiring an exact CrCl/eGFR/GFR value:

- 32 protocol-specific renal-band fields are active;
- each band has a clinician-facing label and a deterministic decision value;
- dialysis appears as an explicit option where the protocol has a dialysis pathway;
- assessment documentation preserves the selected band label.

Twenty-seven continuous renal fields remain numerical because they are used for carboplatin/Calvert dosing. These are explicitly marked as exact-value exceptions rather than being converted to artificial bands.

## Interface changes

- Added a Treatment Category filter.
- Grouped catalogue cards under visible treatment-section headings.
- Retained global search and tumour-site filtering across all sections.
- Added treatment-class chips to regimen cards.
- Added a supportive-care summary panel to protocol assessments.
- Added separate access to the NCCP antiemetic source when a local prescription sheet is displayed.
- Added full CTCAE grading guidance immediately beside applicable grade controls.
- Removed the obsolete nested v0.17 preview application from `protocols/`; the folder now contains protocol data, schema, shared profiles and the generated index only.

## Quality assurance

The release audit confirms:

- 121 active regimen protocols;
- no duplicate protocol IDs;
- no duplicate NCCP regimen codes;
- no duplicate normalised regimen titles;
- no active regimen placeholders or drafts;
- no active regimen left in the unclassified/supportive-other section;
- 129 JSON files parsed without error, including schema/index/supporting files;
- 415 CTCAE-enabled fields;
- 32 renal-band fields;
- 27 exact carboplatin renal fields.

The complete automated regression suite passes. Automated testing establishes software consistency only; all clinical encodings and local supportive-care scripts remain pending consultant, oncology-pharmacy and governance validation before clinical use.
