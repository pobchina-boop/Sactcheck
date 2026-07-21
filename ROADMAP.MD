# SACTCheck Roadmap

## Completed platform milestones

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

## Current target: validate protocol independence

1. Install and smoke-test v0.17 through Live Server.
2. Confirm conditional required fields behave correctly and optional omissions remain explicit coverage gaps.
3. Complete consultant and oncology-pharmacy review of the weekly-paclitaxel JSON.
4. Add one contrasting multi-agent or immunotherapy regimen using only the schema 2.x JSON workflow.
5. Add protocol-owned regression scenarios so each JSON can carry its own boundary tests.
6. Document source review, reviewer identity, approval status and threshold-boundary evidence for every encoded protocol.

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
