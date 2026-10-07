# SACTCheck v0.81.2 — Pages validator correction

## Scope
This is a deployment-test-only patch. It changes only `tools/validate-pages-site.js` plus release notes in this ZIP. It does not modify the runtime application or any clinical/patient assets.

## Defect corrected
The production Pages run for v0.81.2 completed the main clinical regression suite and successfully built `_site`, then failed in the final deployable-site validator because that validator still required `app.version === "0.81.0"`.

Current repository metadata is v0.81.2 (`package.json`, `data/app-release.json`). The hard-coded validator therefore rejected a correct cumulative release.

## New contract
The validator now reads the repository `package.json` and requires:

- `app.version` is present
- `app.release === app.version`
- `app.version === package.version`
- if `display_version` is present, it equals `v${package.version}`

No literal current release number is embedded in this check, so ordinary patch/minor release increments will not require editing the validator again.

## Checks retained unchanged
The validator still checks:
- required public files
- one canonical patient-asset registry
- dedicated guides protected ahead of legacy dynamic rendering
- workflow/app schema separation
- bootstrap ordering
- all registered patient portals
- canonical/compatibility PDF parity
- protected patient-asset hashes
- 00568 rich-guide size guard
- 404 compatibility mapping
- no development-only files in the public artefact
- no credential-like files

## Local patch validation
- JavaScript syntax checked with Node.
- Dynamic release-contract logic checked against current v0.81.2 package/app metadata.
- ZIP integrity checked.

The complete GitHub Pages run cannot be claimed here because it only occurs after this patch is committed. Post-push success must be verified from GitHub Actions and then on the live public site.
