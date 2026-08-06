# SACTCheck v0.60.1 Validation Report

**Validation date:** 6 August 2026  
**Release:** 0.60.1

## Scope

This validation covers the mission-led landing page, opening modal, responsive product-positioning interface, launch-to-engine pathway and regression integrity of the existing clinical application.

## Results

| Validation area | Result |
|---|---|
| Focused v0.60.1 landing-page test | Passed |
| Complete cumulative Node test suite | Passed |
| Repository security scan | Passed |
| GitHub Pages build | Passed |
| Deployable-site validation | Passed |
| Protocol JSON hash comparison against v0.60.0 | Passed |
| Protocol JSON files changed | 0 / 382 |

## Interface checks

- Mission statement present in the automatic introduction and homepage.
- “Why SACTCheck” explanation present.
- Find–Assess–Explain–Verify visual pathway present.
- **Launch SACTCheck Engine** available in three locations.
- Engine launch closes the modal, moves to the library and focuses regimen search using the established study-release controller.
- Three-step quick-start retained as optional secondary guidance.
- Clinical decision-support boundary retained and made more prominent.
- Mobile, tablet and desktop CSS breakpoints included.

## Regression boundary

The release does not change clinical protocol content or deterministic assessment behaviour. All 382 protocol JSON files match the v0.60.0 SHA-256 register.

## Outstanding validation

The product remains a feasibility build. Independent consultant oncology, oncology-pharmacy, usability and formal clinical validation remain required before routine clinical deployment.
