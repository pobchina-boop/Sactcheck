# SACTCheck v0.84.10 — mission-led homepage

Prepared 20 October 2026. Cumulative update for v0.84.8 or v0.84.9.

## Apply this update

1. Extract SACTCheck_v0.84.10_UPDATE.zip.
2. Copy the extracted contents into the existing Sactcheck repository root, preserving folders and replacing matching files. Upload the extracted files, not the ZIP itself.
3. Commit and push using GITHUB_COMMIT_v0.84.10.txt, then wait for the GitHub Pages deployment to finish.
4. Reload the website and check that the footer shows v0.84.10.

No deletions are required. This is an update for the existing repository, not a standalone website. It includes the v0.84.9 five-regimen expansion, so that ZIP does not need to be applied separately. Nothing has been committed, pushed or deployed by the assistant.

## What changed

The navy mission section now says “Operationalising NCCP protocols at the point of care.” Search remains directly below the mission. Four explanatory boxes show Treatment assessment, Clinic workflow, Patient platform, and Monitoring and milestones. Available resources vary by regimen. Desktop cards use four columns, tablet cards two, and phone cards one. About us remains the only header action, with the NCCP tracker in Clinic workflow.

The public release and cache metadata advance to v0.84.10. Clinical and knowledge content retain their v0.84.9 release identity. All clinical rules and patient content from the delivered v0.84.9 update are byte-preserved.

The included v0.84.9 update adds palbociclib, everolimus/exemestane, trastuzumab deruxtecan, sacituzumab govitecan and breast-adjuvant olaparib across the assessment engine, knowledge, consent, supportive care and patient services. See AUDIT_v0.84.9.md and RELEASE_v0.84.9.md for that batch's scope and audit limitations. These earlier documents describe the clinical baseline; this document is the current application guide.

## Verification

Passed existing landing-page, About/navigation, keyboard focus/modal, current-release and cache-upgrade checks. The historical homepage routing test now uses the current release, the existing modal behaviour test and the canonical patient asset registry instead of obsolete version strings and removed implementation helpers. Current/next-patch card hydration, architecture, repository security and deployment validation passed. The build includes 382 protocol JSON files and preserves 77 registered patient portals.

The browser showed v0.84.10 with the mission, search, four service boxes and About us link. It was still loading the regimen library when observed; the screenshot service then timed out. A complete visual review, mobile rendering check and browser search interaction could not be verified in this environment. No deployment or live-site verification is claimed.

The full clinical suite was not rerun for this presentation-only change; the previous v0.84.9 audit is included, and its clinical/patient content was compared byte-for-byte. Source and clinical validation limitations from that release still apply.
