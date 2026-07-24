# SACTCheck v0.39.0 — Complete Gastrointestinal Library

Release date: 24 July 2026

## Scope

This release completes the gastrointestinal deck against the current official NCCP Gastro-intestinal SACT catalogue snapshot. All 93 distinct regimen documents are represented by active assessment JSON; no GI card has placeholder or draft status.

## Catalogue coverage

- Colorectal: 35 protocols
- Upper gastrointestinal: 25 protocols
- Pancreatic: 11 protocols
- Hepatobiliary/HCC: 8 protocols
- Anal and rectal chemoradiation: 6 protocols
- Neuroendocrine: 3 protocols
- Five additional protocols span more than one GI subgroup

The release includes cytotoxic chemotherapy, anti-VEGF and anti-EGFR therapy, HER2-directed therapy, checkpoint immunotherapy, oral targeted therapy, chemoradiation and radionuclide therapy. Canonical shared protocols are reused rather than duplicated.

## Assessment standards

Each GI protocol has an active rule engine, optional inputs, official source link, treatment and indication metadata, supportive-care mapping and single-entry partial-assessment support. Missing fields remain unassessed and do not block a result or become assumed normal.

CTCAE-driven fields are linked to the central CTCAE v5.0 descriptor library so the actual toxicity-specific grade definitions and practical assessment guidance appear beside the control.

ALT, AST and bilirubin fields continue to accept actual results and are converted automatically using the configurable local ULN profile. Protocol-specific CrCl/eGFR selectors are used where the source decision is categorical; exact CrCl remains available for carboplatin Calvert dosing.

## Search and navigation

Common names, acronyms and trade names are searchable while official NCCP generic titles remain primary. New GI aliases include Erbitux, Yervoy, Fruzaqla, Tibsovo, Lenvima, Lutathera, Pemazyre, Nexavar, Teysuno, Tevimbra, Paraplatin, Platinol, Pharmorubicin and Temodal.

## Technical validation

- 210 distinct protocols in the complete library
- 93 GI protocols
- 1,712 GI input definitions
- 1,798 GI decision rules
- no duplicate NCCP codes or protocol IDs
- no GI placeholder/draft statuses
- protocol index rebuilt
- central supportive-care registry rebuilt for all 210 protocols
- full automated regression suite run before packaging and repeated against the extracted release
- ZIP integrity checked

## Clinical-governance status

“Fully encoded” in this release means that every official GI catalogue card is an active, assessable JSON protocol rather than a placeholder. It does not mean formal clinical approval. Independent line-by-line consultant and oncology-pharmacy validation remains required before institutional deployment.
