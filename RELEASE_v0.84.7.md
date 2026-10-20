# SACTCheck v0.84.7 — Immediate search and simpler navigation

Update for committed v0.84.6 (`6ea0ab55531bf6155e7ac0ec34c436356792829e`). Apply these complete replacement files over v0.84.6.

## Changes

- Keep SACTCheck branding and one **About us** action in the homepage header. Remove the header's secondary actions, version badge and study badge.
- Put the actual regimen search directly below the header in the initial HTML, before portal choices, tissue filters and the catalogue. Retain one search field, ranked suggestions, clearing, keyboard access and existing search behaviour.
- Replace the large homepage introduction with a compact search section. The full mission, service description and founder information remain on the About page.
- Keep a short feasibility/privacy/source notice below search; retain the existing fuller notice on assessment and supporting screens.
- Move NCCP tracker access into **Clinic workflow → NCCP source**, alongside the official PDF. The tracker source register opens filtered to the selected regimen's NCCP code. Source and tracker actions use a clear column with 44-pixel minimum targets.
- Keep Validation workspace, Study information and Sustainability available in the footer. Remove the large injected sustainability banner by using its existing anchor in the footer.
- Replace the low-resolution symposium poster crop with Paul's supplied original portrait, displayed at its natural aspect ratio. Preserve his biography and `paul.obrien3@hse.ie` contact link.
- Align package, bootstrap, release metadata, patient-asset release references and cache keys to v0.84.7. Clinical content remains at its existing release.

## Verification

- `npm run test:ci` passed: release gates, source/security checks, protocol build, regression suite, Pages build and deployed-site validation.
- After adding the new portrait, landing/About checks, source/security checks, Pages build and deployed-site validation passed again. About-page links and assets resolve in both the repository and `_site` output.
- A workflow interaction check exercised the real workflow module with two successive regimen selections: the tracker received the current NCCP code, the workflow overlay closed, and an unavailable tracker retained the workflow with an explanatory message.
- JavaScript syntax and whitespace checks passed. Existing clinical rules, protocol JSON, patient guidance and knowledge-base content were not changed. Protected patient assets remain covered by the release gates.
- The local release has not had a fresh visual browser review: the available audit browser cannot reach the local preview server. Review desktop/mobile appearance after deployment. Automated checks are technical regression checks, not independent clinical validation.

## Apply and review

1. Extract `SACTCheck_v0.84.7_UPDATE.zip` into the existing v0.84.6 repository, preserving folders and replacing matching files. No patch command is needed.
2. Commit and push the extracted files with the text in `GITHUB_COMMIT_v0.84.7.txt`.
3. After deployment, refresh the homepage and confirm the footer says v0.84.7. Check the single About us header action and immediately accessible search.
4. Select a regimen, open Clinic workflow, then Open NCCP tracker under NCCP source. Confirm the source-register search contains that regimen's NCCP code.
5. Open About us and confirm the new portrait loads beside the founder biography and contact email.

This package has not itself been committed, pushed or deployed.
