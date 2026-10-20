# SACTCheck v0.84.5

**Revised package: this supersedes the first v0.84.5 ZIP and includes all three screenshot requests.**

Based on committed v0.84.4 (`73e8a0bc3e4c2a1e869bb0b879ce2241b182cbc0`).

## Changes
- Remove routine glucose and blood-ketone inputs from the immunotherapy form. Keep underlying safety rules intact; omitted domains remain unassessed.
- Organise blood inputs into labelled organ groups with wider responsive columns, consistent spacing, more readable labels and full-width single-analyte controls.
- Arrange all patient-platform links in Clinic workflow as one full-width column at every viewport size, with consistent spacing and a minimum 44px action height.
- Remove the manual Anonymous assessment ID field and the empty Assessment details panel from the shared Treatment assessment engine.
- Preserve the assessment-profile selector for protocols with multiple profiles. Its entire section is hidden when only one profile exists.
- Generate an anonymous reference when an assessment runs, retaining that reference across PDF and text exports of that result.
- Synchronise public release labels, bootstrap, asset cache parameters and patient registry to v0.84.5.

## Verification
- All CI stages passed: release gates, security checks, protocol build, existing tests, deployable site build and site validation. The local rerun needed a fresh generated-site directory after an ENOTEMPTY cleanup error; the fresh build and site validation passed.
- The production presentation filter was checked across all 394 assessment profiles in the 376 canonical protocols; only the requested immunotherapy controls are omitted.
- `npm run test:interface` passed, including the additional regression check for assessment and PDF/text output without a manual-ID element, with and without browser crypto.
- No protocol rules, knowledge-base content, patient PDFs or clinical thresholds were changed.
- The live v0.84.4 website was visually reviewed. This local v0.84.5 build has not had a fresh live-browser visual check: the audit browser could not reach the local preview server. Recheck the two changed areas after deployment.

## Apply
Extract `SACTCheck_v0.84.5_UPDATE.zip` into the existing v0.84.4 repository, preserving the folders and replacing matching files. These are complete replacement files; no patch command is needed. Commit and push the extracted files using `GITHUB_COMMIT_v0.84.5.txt`.
