# SACTCheck v0.48.0 validation report

## Release scope
Feasibility-study presentation release built from the user-supplied `sactcheckbeforepolish.zip` baseline. The release adds branding, onboarding, installable icons and tester-support materials. It does not alter protocol logic.

## Automated validation
- Complete repository `npm test` suite: **passed**.
- Protocol publishing validation: **366 publishing tests passed**.
- Canonical regimen index: **361 enabled protocols**.
- Historical engine, single-value, tumour-library, shared-indication, direct-PDF, clinician-UI and regimen-search regression suites: **passed**.
- New v0.48.0 study-release regression test: **passed**.
- JavaScript syntax check for `js/study-release.js`: **passed**.
- SVG/XML parse checks for the logo assets: **passed**.
- Web-app manifest JSON parse: **passed**.
- Local HTTP checks for the app, branding, stylesheet, onboarding script, manifest and quick-start guide: **HTTP 200**.
- HTML parser checks for the main app and quick-start guide: **passed**.

## Clinical-content preservation
The current `protocols/**/*.json` files were SHA-256 compared with the uploaded baseline:

- Protocol JSON files compared: **382**
- Protocol JSON files changed: **0**

The v0.48.0 work is therefore presentation, onboarding and release-support only.

## Added study-release components
- SACTCheck shield/document/check logo and scalable mark.
- Branded header and clinician landing panel.
- First-use feasibility-study information modal.
- Favicon, Apple touch icon, Android/PWA icons and web-app manifest.
- Quick-start guide.
- Feasibility feedback-form template.
- Tester invitation text.
- Explainer-video embed recorded in `TODO.md` as the next task; no unfinished video placeholder is exposed in the study build.

## Distribution boundary
Use hypothetical, non-identifiable scenarios only. SACTCheck does not prescribe, authorise or confirm treatment safety. The current official NCCP protocol, complete clinical assessment, local policy and independent oncology judgement remain decisive.
