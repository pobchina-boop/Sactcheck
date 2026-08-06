# SACTCheck v0.60.0 Validation Report

Validation date: 6 August 2026

## Release scope

Cumulative expansion of the detailed regimen knowledge base from ten to fifteen profiles. The deterministic assessment engine, organ-function reconciliation rules and all protocol JSON files remain unchanged from v0.59.0.

## Automated validation

| Check | Result |
|---|---|
| Focused v0.60.0 knowledge-base suite | Passed |
| v0.58.0 historical knowledge-base compatibility suite | Passed |
| v0.59.0 organ-function reconciliation suite | Passed |
| Complete historical `npm test` suite | Passed |
| Repository security check | Passed — 924 text files scanned |
| GitHub Pages build | Passed — 382 protocol JSON files copied |
| Deployable-site validation | Passed |
| JavaScript syntax check | Passed through Node test loading |
| Protocol JSON hash comparison with v0.59.0 | Passed — 382/382 unchanged |

## Knowledge-base validation

- Schema version: 1.2
- Release: 0.60.0
- Detailed regimen profiles: 15
- Drug profiles: 25
- Evidence records: 21
- New full-module profiles: 5
- New/enriched primary evidence mappings: V303, GOG-158, KEYNOTE-407, ASCENT and TOPAZ-1
- Stable PubMed links are present for each primary publication.
- DOI links are present for each new primary evidence record.
- Each new profile contains patient-selection, supportive-care, monitoring/toxicity and administration modules.
- Each profile contains a visible draft-review state and source-check date.
- User-facing knowledge content contains no AI-origin label.

## Clinical content controls

- Shared NCCP protocols are not presented as having one universal evidence population.
- Trial-to-protocol mismatches are explicitly documented, including multi-indication FOLFIRI and carboplatin/paclitaxel protocols.
- Cytotoxic and immune-mediated toxicities remain separated in the pembrolizumab and durvalumab combination profiles.
- Carboplatin and cisplatin workflow content retains renal-exposure, hydration and electrolyte safeguards.
- The sacituzumab profile includes neutropenia, diarrhoea, infusion reaction and UGT1A1 risk orientation.
- The NCCP 00897 source-review-date issue is surfaced rather than concealed.

## Regression protection

- All 299 v0.59.0 organ-function rules and the 74-record reconciliation register remain in place.
- The v0.57.0 search-first layout, debounced indexed search and conditional fuzzy matching remain unchanged.
- The frozen v0.58.0 data file remains available for historical regression testing.
- No protocol JSON was added, removed or modified.

## Clinical review status

Automated software and structural validation are not equivalent to independent clinical validation. The five new profiles are source-checked drafts pending consultant oncology and oncology-pharmacy review. The current official NCCP PDF and local governance remain the operational source.
