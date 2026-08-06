# SACTCheck v0.60.2 Validation Report

**Validation date:** 6 August 2026  
**Release:** 0.60.2

## Scope

This validation covers the corrected landing-page order, mission-hero persistence, search-before-scenario hierarchy, removal of the catalogue-end promotional block and regression integrity of the clinical application.

## Results

| Validation area | Result |
|---|---|
| Focused v0.60.2 landing-position test | Passed |
| Complete cumulative Node test suite | Passed |
| Repository security scan | Passed |
| GitHub Pages build | Passed |
| Deployable-site validation | Passed |
| Protocol JSON hash comparison against v0.60.1 | Passed |
| Protocol JSON files changed | 0 / 382 |

## Interface checks

- Persistent mission hero is the first substantive section inside the library screen.
- Solid Tumour/Haematology selector remains below the hero.
- SACTCheck Engine regimen search appears before the collapsed clinical scenario interpreter.
- Runtime layout code no longer moves the catalogue ahead of the hero.
- Detailed product and feasibility content remains accessible inside the welcome modal rather than after the regimen cards.
- Launch controls still close the modal where relevant, scroll to the engine and focus regimen search.
- Responsive desktop, tablet and mobile rules remain present.

## Regression boundary

The release does not change clinical protocol content or deterministic assessment behaviour. All 382 protocol JSON files match the v0.60.1 SHA-256 register.

## Outstanding validation

The product remains a feasibility build. Independent consultant oncology, oncology-pharmacy, usability and formal clinical validation remain required before routine clinical deployment. A final device-specific visual check should be completed after deployment.
