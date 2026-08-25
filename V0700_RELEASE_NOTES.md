# SACTCheck v0.70.0 — Consolidated Source Reconciliation & Knowledge Expansion

## Purpose
This drop-in consolidates the updates that were planned but not cleanly applied after the v0.68.0 audit, while preserving the v0.69.1 Sustainability work and v0.69.2 engine-first homepage.

## Included
- Cumulative release/version reconciliation to v0.70.0.
- NCCP 00101 Version 8 source reconciliation:
  - removes the unsupported platelet-alone <100 delay interpretation;
  - retains the independently supported ANC ≥1.5 requirement;
  - adds severe nausea/vomiting, renal-failure and CYP3A review pathways.
- NCCP 00256 Version 7 source reconciliation:
  - fixes the malformed Day-8 mixed condition;
  - adds Day-15 branches and preserves NCCP alternative strategies as clinician choices.
- NCCP 00783 Version 2a source reconciliation:
  - separates baseline (ANC ≥1.5 / platelets ≥100) from ongoing Day-1 (ANC ≥1.5 / platelets ≥75) thresholds;
  - adds occurrence-specific count dose pathways;
  - corrects bevacizumab proteinuria logic;
  - adds hypertension/fistula/bleeding/thrombosis discontinuation pathways;
  - updates the regimen to the NCCP source-stated overall high emetogenic risk.
- Knowledge base: 30 → at least 33 detailed regimen profiles.
- Evidence: TROPIC, PROSELICA, CARD, MPACT (+ long-term follow-up), TRIBE (+ mature OS follow-up) and TRIBE2.
- Sustainability: source-constrained route/frequency/encounter/pump metadata for the same three regimens, with no invented carbon estimates or environmental ranking.
- New v0.70.0 regression tests.
- Timestamped local backup before modification.

## Governance
This is still a feasibility / pre-validation build. The updater does not mark any protocol as independently consultant reviewed, oncology-pharmacy reviewed, or authorised for clinical use. Current NCCP source documents remain authoritative.

## Clinical source documents
- NCCP 00101 Version 8 — Cabazitaxel and Prednisolone Therapy
  https://healthservice.hse.ie/documents/6536/108_cabazitaxel_and_prednisoLONE.pdf
- NCCP 00256 Version 7 — nab-Paclitaxel and Gemcitabine Therapy
  https://healthservice.hse.ie/documents/6360/256_v7_nab-PACLitaxel_and_Gemcitabine.pdf
- NCCP 00783 Version 2a — Bevacizumab 5 mg/kg and FOLFOXIRI Therapy
  https://healthservice.hse.ie/documents/6660/783_v2a_Bev_5_FOLFOXIRI_therapy.pdf

## Evidence links
- TROPIC — PMID 20888992
- PROSELICA — PMID 28809610
- CARD — PMID 31566937
- MPACT — PMID 24131140; long-term follow-up PMID 25638248
- TRIBE — PMID 25337750; mature follow-up PMID 26338525
- TRIBE2 — PMID 32164906
