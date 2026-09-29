# SACTCheck v0.77.0 - Information Pipeline Home and Stable Patient Routing

## Product direction
- Reframes the homepage around SACTCheck as a regimen-specific oncology information pipeline spanning clinician workflow, patient information, supportive care, evidence and sustainability.
- Removes the automatic launcher/welcome gate so SACTCheck opens directly into the current working homepage.
- Retains the deterministic assessment engine as one component rather than the identity of the whole platform.

## Release consistency
- Adds one canonical public release source (`js/sactcheck-release.js`).
- Aligns the visible title/header across older cumulative modules so the interface no longer visibly cycles through historical release labels during startup.

## Patient routing
- Makes `https://sactcheck.com/patient/00209/` and `/patient/00831/` canonical public routes.
- Retains `/docs/patient/...` as a backwards-compatible route for already-generated QR material.
- Adds a 404 safety-net for known patient routes.
- Extends deployable-site validation to require both canonical and compatibility patient assets.

## Clinical boundary
No protocol threshold, eligibility rule, dose-modification rule or treatment-authorisation logic is changed by this release. The current NCCP source, local governance and clinical judgement remain authoritative.
