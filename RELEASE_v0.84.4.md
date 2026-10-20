# SACTCheck v0.84.4

Prepared 20 October 2026 against v0.84.3, commit 21a5f7588b63f884c210e93ecb1e17d81131c81d.

## Changes

- Fix the overlapping patient actions inside Clinic workflow. Remove the competing CSS labels and duplicate action decorator; arrange patient resources in a responsive grid.
- Give all 376 regimen cards three primary destinations: Clinic workflow, Patient platform and NCCP source. Preserve assessment, consent, knowledge, supportive care and other services inside the workflow.
- Use Treatment assessment engine and Run assessment engine. Remove the retired Clinical scenario interpreter entry points.
- Use AST/ALT and Bilirubin headings. Show measured results, units, the applicable upper limit and concise abnormality context without calculation equations; preserve the full-precision ratio passed to the existing rules.
- Replace prefilled local oncology, switchboard and day-unit numbers with placeholders in patient pages, guides, passports, cards and their generators. Keep 112/999. Update 265 text files and 382 PDF copies, representing 191 unique PDFs.
- Add source-labelled St James's Hospital examples for TSH, free T4, timed cortisol and ACTH in immunotherapy assessments, with editable reporting-laboratory limits. These are not universal Irish national intervals or NCCP treatment thresholds.
- Add current/recent steroid history, agent, dose/frequency, route, duration and last dose/taper. Carry cortisol sampling time and steroid context into results and the downloadable assessment; missing history stays unknown.
- Keep the v0.84.3 AC antiemetic phase-selection fix and existing regimen content. No protocol JSON dose or hold thresholds changed in this update.

## Validation

- `npm run test:ci` passed: release gate, source cases, protocol build/validation, regression suite, security checks, site build and deployed-asset integrity checks.
- 709 new interface, reference-boundary, partial-input, steroid, export and contact-migration assertions passed.
- Chromium at 1440px and 390px: checked all 376 card action sets; opened the 00568 patient platform and Clinic workflow; entered an isolated low ANC, bilirubin, timed cortisol plus steroids, unknown history, and valid/invalid custom reference limits; downloaded the assessment PDF. No runtime errors, missing assets, page overflow or overlapping patient buttons.
- PDF review: all 191 unique edited documents retain page counts, all text tokens outside the audited substitutions, and the pixels and placement of visible images including QR codes. No local telephone numbers remain in the edited documents. The original clinical content is preserved.
- Visually inspected the desktop/phone workflow, hormone output, exported assessment and representative guide/passport/card contact panels, including the older 00568 wallet card.
- Version/cache and deployment checks passed for v0.84.4 and 72 protected patient pipelines.

The evidence audit is in `validation/interface-v0844`. This is software verification and source checking, not a new independent consultant/pharmacy sign-off or a fresh audit of every NCCP regimen.

## Install

Extract the update archive. Copy the contents of `SACTCheck_v0.84.4_UPDATE` into the existing v0.84.3 repository root, replacing the matching files and merging folders. Do not upload the ZIP itself or place the update folder inside the site. Commit the changed files and push using the supplied summary/description. Check GitHub Actions succeeds and `data/app-release.json` reports 0.84.4 after deployment.
