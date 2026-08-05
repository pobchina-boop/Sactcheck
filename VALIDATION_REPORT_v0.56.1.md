# SACTCheck v0.56.1 Validation Report

**Release:** v0.56.1 — Five-Regimen Knowledge Base Pilot  
**Validation date:** 5 August 2026  
**Baseline compared:** v0.56.0

## Scope

This report covers the cumulative v0.56.1 repository, with focused validation of:

- five detailed Regimen info pages;
- extended evidence-record fields;
- PubMed, DOI and follow-up-publication links;
- knowledge-base rendering and responsive layout;
- source `index.html` asset references;
- preservation of the Clinical scenario interpreter;
- protocol JSON integrity;
- full historical regression compatibility;
- GitHub Pages build and deployable-site validation.

## Focused knowledge-base results

**PASS**

- Five of five intended regimen profiles are present.
- All five profiles map to published protocol identifiers.
- All five principal evidence records contain population, intervention, comparator, primary endpoint, selected findings, limitations, match type, PMID and DOI.
- Four records contain one or more linked follow-up publications; six follow-up publication records are included in total.
- Fourteen selected finding statements are represented across the five detailed pages.
- Twenty-four reusable drug profiles and eighteen total evidence mappings remain available.
- Current user-facing knowledge-base assets contain no AI-origin label.
- The official NCCP protocol remains separately linked and identified as the operational source.

## Five pilot mappings

| Protocol | Detailed evidence page | Principal publication |
|---|---|---|
| NCCP 00382 v3 | Trifluridine/tipiracil | RECOURSE, PMID 25970050 |
| NCCP 00568 v5 | Pembrolizumab, pemetrexed and carboplatin | KEYNOTE-189, PMID 29658856 |
| NCCP 00655 v3a | Durvalumab after concurrent chemoradiotherapy | PACIFIC, PMID 28885881 |
| NCCP 00857 v3 | Perioperative pembrolizumab and chemotherapy | KEYNOTE-522, PMID 32101663 |
| NCCP 00624 v3 | Carboplatin and pegylated liposomal doxorubicin | CALYPSO, PMID 20498395 |

## Automated pipeline

The complete repository pipeline passed:

- repository security scan;
- protocol index and regimen-card metadata publishing;
- all 381 protocol publishing tests;
- 16 core assessment-engine tests;
- conditional-input and partial-assessment tests;
- complete historical release regression suite;
- v0.56.0 Clinical scenario interpreter refinement tests;
- v0.56.1 regimen-information compatibility tests;
- v0.56.1 five-regimen knowledge-base tests;
- GitHub Pages build;
- deployable-site security and integrity validation.

## Protocol integrity

A relative-path and SHA-256 comparison was performed between the v0.56.0 and v0.56.1 `protocols` directories.

- v0.56.0 protocol-directory JSON files: 382
- v0.56.1 protocol-directory JSON files: 382
- added JSON files: 0
- removed JSON files: 0
- byte-level changes: 0

All 382 JSON files in the protocol directory are byte-for-byte unchanged from v0.56.0. This count includes the published protocol catalogue and protocol schema assets; the publishing suite reports 381 clinical protocol tests.

## Deployment checks

- Source `index.html` references the v0.56.1 knowledge-base CSS, JavaScript and data.
- The generated `_site` contains the same v0.56.1 knowledge-base assets.
- The deployable site includes all 382 protocol-directory JSON files.
- No stale nested `protocols/protocols` directory exists.

## Source and content verification

The principal PMID and DOI identifiers, trial design fields, selected numerical findings and follow-up-publication identifiers were checked for the five pilot records. Automated tests validate the stored identifiers, required fields and stable URL formats. External website availability can change and is not guaranteed by the local test suite.

## Clinical boundary

This release validates software structure, data integrity and internal consistency. It does not constitute independent clinical authorisation of the knowledge-base content.

Before content is marked approved, the final wording, mechanism summaries and evidence-to-protocol mappings should be reviewed and edited by the designated clinician and, where appropriate, oncology pharmacy.
