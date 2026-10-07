# SACTCheck v0.81.2 validation

## Scope
Corrective release only: anatomical registration of patient-guide callouts plus deployment-gate hardening. No deterministic NCCP dose, threshold or assessment-rule changes.

## Local checks completed
- v0.81.0 architecture consolidation gate: PASS under v0.81.2.
- v0.81.1 patient-guide/deployment gate: PASS under v0.81.2.
- v0.81.2 anatomy/deployment regression: PASS.
- Changed JavaScript/test syntax checks: PASS.
- All 13 canonical patient guides remain exactly two A4 pages.
- All 13 rendered page-2 QR codes decode at 220 dpi to `https://sactcheck.com/patient/<code>/`.
- Canonical and `/docs/patient/` compatibility guide PDFs remain byte-identical for each code.
- Protected patient-asset manifest refreshed after the intentional visual change.
- 00568, 00831 and 00209 page-1 renders visually reviewed after coordinate correction.
- 00568 v0.81.1 -> v0.81.2 PDF visual diff confirms the substantive change is concentrated on page 1 anatomy registration; page 2 is materially unchanged apart from release text.

## Root cause corrected
The guide PDF used an aspect-ratio-preserving anatomy image inside a taller fixed bounding box, while pin coordinates were calculated against the full bounding box. This produced vertical letterboxing and displaced pins upward (for example heart -> neck and liver -> lung). v0.81.2 calculates/positions callouts against the actual rendered anatomy dimensions and widens the guide anatomy column so the HTML guide uses the same coordinate frame.

## QR status
The QR images themselves decode correctly. At the time this package was built, the public site still served v0.79.0 because GitHub Pages had not successfully deployed v0.81.x. Therefore live QR navigation cannot be signed off until the post-push Pages workflow succeeds and the public `/patient/<code>/` routes are confirmed.

## Post-push acceptance gate
1. GitHub Pages `Build and validate production site` passes.
2. `Deploy production site` passes.
3. `https://sactcheck.com/` reports v0.81.2.
4. `https://sactcheck.com/patient/00568/` returns the dedicated portal.
5. A physical phone-camera scan of the 00568 guide QR opens that route.
