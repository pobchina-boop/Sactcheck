# SACTCheck Roadmap

## Completed platform milestones

### v0.60.1 landing-page milestone

- Reframed the opening experience around the SACTCheck mission, clinical problem and product advantages.
- Added a visual Find–Assess–Explain–Verify pathway and prominent SACTCheck Engine launch controls.
- Repositioned the quick-start guide as secondary guidance while preserving the feasibility and clinical-safety boundary.
- Preserved the v0.60.0 knowledge base and all clinical protocol files unchanged.

### v0.60.0 knowledge-base milestone

- Expanded the full vertical knowledge base from ten to fifteen regimens.
- Added cross-modality profiles spanning gastrointestinal, gynaecological, lung and breast oncology.
- Added detailed evidence mappings for V303, GOG-158, KEYNOTE-407, ASCENT and TOPAZ-1.
- Preserved all protocol rules and the v0.59.0 organ-function reconciliation unchanged.

### v0.59.0 organ-function milestone

- Completed reconciliation of the 74 protocols marked partial in v0.58.1.
- Added 299 executable component-specific renal/hepatic rules across 70 protocols.
- Recorded four source-reviewed no-prescriptive-adjustment pathways without inventing cutoffs.
- Added full source, audit and hash registers plus universal new-rule execution testing.

### Immediate next priority

- Review the fifteen detailed knowledge profiles with consultant oncology and oncology pharmacy.
- Continue knowledge-base expansion in controlled five-regimen batches.
- Conduct consultant oncology and oncology-pharmacy review of the v0.59.0 organ-function source register.
- Add protocol-version surveillance and “What changed?” comparison as a later controlled milestone.


- Protocol folder structure and generated catalogue
- Standalone rule engine
- Standalone assessment engine
- Generic protocol-driven assessment interface
- Explicit protocol-owned input metadata
- Formal schema 2.x protocol contract
- Browser protocol validator and preview importer
- Node protocol validator and automatic index generator
- GitHub Actions validation/publication workflow
- Explainable findings and documentation output
- Modified FOLFOX-6 legacy-versus-JSON shadow validation
- Regression tests for protocol publication, conditional inputs, weekly paclitaxel and FOLFOX comparison
- In-regimen constrained scenario interpreter with clinician-confirmed structured extraction
- Global regimen-agnostic scenario entry with exact protocol confirmation before assessment

## Current target: clinical review and knowledge-base expansion

1. Review the v0.59.0 74-record source register with consultant oncology and oncology pharmacy.
2. Record reviewer identity, review date, source-version confirmation and any protocol-specific amendments.
3. Continue the regimen knowledge base in five-regimen vertical batches.
4. Retain independent single-value assessment and explicit unassessed-domain output in every new encoding.
5. Develop the NCCP protocol-version tracker and clinically focused “What changed?” view after the current source register is reviewed.
6. Plan prospective usability and decision-time evaluation under the agreed feasibility-study pathway.

## FOLFOX migration milestone

- Keep the legacy FOLFOX screen active.
- Complete consultant and oncology-pharmacy line-by-line source review.
- Add tests immediately above and below each threshold.
- Document intentional differences.
- Switch the public card only after software, clinical, pharmacy and governance review.

## Later work

- Shared component-dose aggregation and clearer multi-drug output
- Offline PWA packaging and service-worker review
- Protocol version expiry and supersession alerts
- Formal audit logging and governance design
- Controlled protocol authoring interface
- Role-based deployment and hospital integration planning


## ECOG context placeholder
- Central placeholder added in v0.31.0. Future implementation should distinguish baseline eligibility from optional ongoing-cycle context and must never block partial/single-value assessments when ECOG is absent.

## Constrained AI progression

- Completed: local in-regimen structured scenario extraction.
- Completed: global local catalogue matching with exact regimen confirmation.
- Next: expand tested clinical vocabulary and ambiguity scenarios without changing the deterministic decision layer.
- Later: consider a secure authenticated hosted language-model explanation service only after governance, data-protection, logging and separate clinical validation requirements are defined.
