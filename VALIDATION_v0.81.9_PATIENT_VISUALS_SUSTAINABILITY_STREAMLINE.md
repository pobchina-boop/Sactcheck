# Validation note — v0.81.9 patient visuals + sustainability/card streamlining

## Static checks performed
- `node --check` passes for the modified UI-stability and patient visual scripts.
- Updated v0.81.7 cumulative regression checks assert that card readiness no longer depends on a duplicated Regimen info control.
- Regression markers require Sustainability to remain accessible from both the homepage and Clinic workflow.
- Patient-visual regression markers require the Day 1→21 chronology, safety dock, improved mechanism diagrams and safety-language markers.

## Deployment expectations
The existing Pages release gate should continue to validate:
- v0.81 architecture and protected patient assets;
- 00568 protected anatomy coordinates;
- cumulative passport/SACTCard behaviour;
- card action hydration and the single antiemetic control.

Because `patient/00568/index.html` and protected PDFs are unchanged, the protected patient-asset manifest does not require another hash update.

## Clinical evidence boundary for the chronology
- Carboplatin labelling describes a median haematologic nadir around Day 21 when used as a single agent; combination timing can differ.
- Pemetrexed product information bases subsequent dose adjustment on nadir haematologic counts rather than assigning a single universal nadir day.
- PD-1 immune-mediated adverse reactions can occur at any time during treatment and may also occur after discontinuation.

The visual therefore uses broad bands and explicitly states that it is not a personal forecast or a way to identify a "safe" day.
