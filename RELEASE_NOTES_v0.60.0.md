# SACTCheck v0.60.0 — Fifteen-Regimen Knowledge Base

Release date: 6 August 2026

## Scope

v0.60.0 is a cumulative knowledge-base expansion built on the v0.59.0 library-wide organ-function release. It adds five complete vertical regimen profiles, increasing the detailed knowledge base from ten to fifteen regimens. No protocol assessment rule, threshold, dose action or protocol JSON file is changed.

## Newly expanded regimens

1. NCCP 00227 v9 — FOLFIRI
2. NCCP 00303 v6 — Carboplatin AUC 5–7.5 and paclitaxel 175 mg/m² every 21 days
3. NCCP 00579 v5a — Pembrolizumab, paclitaxel and carboplatin AUC6 for metastatic squamous NSCLC
4. NCCP 00794 v3 — Sacituzumab govitecan
5. NCCP 00897 v3 — Durvalumab, gemcitabine and cisplatin for advanced biliary tract cancer

## Structured content added

Each profile contains:

- regimen role, treatment setting, mechanism and schedule context;
- treatment intent and patient-selection orientation;
- indication-specific evidence-mapping limitations;
- supportive care, premedication and patient education;
- baseline and interval monitoring;
- priority toxicities and urgent-review signals;
- practical day-ward administration workflow;
- primary trial population, comparator, endpoint, key results and direct publication links;
- source-check date and visible consultant/oncology-pharmacy review status.

## Evidence mappings

- V303 for the irinotecan/fluorouracil/folinic-acid colorectal backbone
- GOG-158 for carboplatin/paclitaxel in optimally resected stage III ovarian cancer
- KEYNOTE-407 for first-line pembrolizumab plus carboplatin/taxane in metastatic squamous NSCLC
- ASCENT for sacituzumab govitecan in previously treated metastatic triple-negative breast cancer
- TOPAZ-1 for durvalumab plus gemcitabine/cisplatin followed by durvalumab maintenance in advanced biliary tract cancer

Evidence summaries explicitly state when a pivotal trial is narrower than the multi-indication NCCP protocol. The TOPAZ-1 profile also flags that the current official NCCP 00897 PDF is version 3 but its stated review date has passed, requiring confirmation against the live NCCP listing.

## Interface and data changes

- The knowledge module now loads `data/regimen-knowledge-base-v0600.json`.
- The cumulative data set contains 15 regimen profiles, 25 drug profiles and 21 evidence records.
- A structured sacituzumab-govitecan medicine profile has been added.
- The homepage release marker and knowledge-base cache versions have been updated to v0.60.0.
- The search-first library and collapsed early-development Clinical Scenario Interpreter are preserved.

## Governance boundary

The knowledge base is source-linked clinical information and decision-support orientation. It does not modify the deterministic assessment engine or authorise treatment. All five new profiles remain drafts pending independent consultant oncology and oncology-pharmacy review. The current official NCCP protocol, authorised prescribing system, local policy and clinical judgement remain authoritative.

## Integrity

- All 382 protocol JSON files are byte-for-byte unchanged from v0.59.0.
- Protocol SHA-256 hashes are recorded in `V0600_PROTOCOL_JSON_HASHES.json`.
- Source mapping is recorded in `NEXT_FIVE_REGIMEN_SOURCE_REGISTER_v0.60.0.md`.
- No user-facing AI-origin label is present.
