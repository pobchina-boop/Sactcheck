# SACTCheck v0.58.0 — Ten-Regimen Knowledge Base

Release date: 5 August 2026

## Scope

v0.58.0 is a cumulative knowledge-base expansion built on the v0.57.0 search-first release. It preserves the deterministic protocol assessment engine and adds five further fully structured regimen profiles, increasing the detailed pilot from five to ten regimens.

## Newly expanded regimens

1. NCCP 00209 v10a — Modified FOLFOX-6
2. NCCP 00515 v7 — Modified FOLFIRINOX
3. NCCP 00722 v2 — TCHP
4. NCCP 00619 v4a — Adjuvant abemaciclib with endocrine therapy
5. NCCP 00831 v2a — Atezolizumab plus bevacizumab for advanced/unresectable hepatocellular carcinoma

## New structured modules

Each of the five new profiles includes:

- regimen role, setting, component rationale and schedule context;
- treatment intent and patient-selection orientation;
- supportive-care requirements and patient education;
- baseline and interval monitoring;
- priority toxicities and urgent-review signals;
- administration and practical day-ward workflow;
- primary trial evidence, key outcomes, limitations and publication links;
- visible source-check and reviewer status.

## Interface changes

- Knowledge sections are numbered dynamically according to the content available for the opened regimen.
- New two-column module cards collapse to a single column on mobile.
- Caution and urgent-review content has differentiated visual treatment.
- Older v0.56.1 profiles remain compatible and continue to display their existing overview, component and evidence sections.

## Governance boundary

The knowledge base is source-linked educational and decision-support content. It does not alter eligibility, protocol rules, dose modifications or SACTCheck treatment status. The current NCCP protocol and local clinical governance remain authoritative.

## Integrity

- All 382 protocol JSON files are byte-for-byte unchanged from v0.57.0.
- Protocol SHA-256 hashes are recorded in `V0580_PROTOCOL_JSON_HASHES.json`.
- No user-facing AI-origin label is present.
