# SACTCheck v0.69.1 — Sustainability Deployment + Metadata Foundation

## Fixed
- Fixes the production GitHub Pages 404 affecting `sustainability.html`.
- Adds `sustainability.html` to the explicit Pages top-level allow-list.
- Makes production validation fail if the Sustainability page or required assets are omitted.

## Added
- Structured regimen-level sustainability metadata schema.
- Dedicated runtime sustainability metadata module.
- Metadata readiness display showing which regimen fields are actually resolved.
- Fields for route, frequency, treatment encounters, chair time, ambulatory pump, cold chain, vial structure, dose banding, vial sharing, home/local delivery and travel-model inputs.
- Evidence/status states separating catalogue-derived, verified, modelled and unresolved information.

## Governance
No regimen carbon score is generated. Unknown fields remain unknown. No NCCP clinical rule, dose threshold or protocol JSON is changed.
