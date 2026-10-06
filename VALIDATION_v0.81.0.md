# SACTCheck v0.81.0 - Validation Report

## Local package checks completed

### Architecture/user-journey gate

PASS - `tests/v0810-architecture-consolidation.test.js`

Verified:

- one 13-code patient-asset registry;
- dedicated 00568 Patient Guide resolves to `/patient/00568/guide.pdf` rather than `about:blank`;
- dedicated routing guard appears before legacy fallback rendering;
- workflow has no independent `DEDICATED_PATIENT_PIPELINES` map;
- workflow uses the canonical registry for portal/passport actions;
- workflow-data contract remains independently pinned to 0.78.0;
- runtime/cache supervisor loads before the protocol loader;
- patient registry loads before patient support/workflow;
- old v0.80.4 UI-stability/antiemetic-print boot references are removed;
- protected asset hashes and sizes match;
- compatibility PDFs are byte-identical to canonical PDFs;
- all 13 compatibility routes identify the canonical public destination;
- 00568 retains the approved rich anatomy markers and guide size.

### Historical patient-content fixture gate

PASS - updated `tests/v0804-stability.test.js`

The test now protects the v0.80.4 clinical/visual assets while allowing v0.81.0 to replace duplicate compatibility HTML with redirects.

### JavaScript syntax

PASS for the new/modified runtime files:

- `patient-asset-registry-v0810.js`
- `patient-support-v0750.js`
- `regimen-workflow-engine-v0750.js`
- `runtime-performance-v0810.js`
- `ui-stability-v0810.js`
- `antiemetic-print-v0810.js`
- `system-health-audit-v0810.js`
- `validate-pages-site.js`

### PDF regression verification

The patient PDFs were not regenerated in v0.81.0. They are protected v0.80.4 content assets.

- 13/13 guides: 2 pages.
- 13/13 passports: 8 pages.
- 13/13 guide QR codes decoded from rendered PDFs to the expected canonical `/patient/<code>/` URL.
- 13/13 passport QR codes decoded from rendered PDFs to the expected canonical `/patient/<code>/` URL.
- Canonical and compatibility guide/passport PDF hashes match for every code.
- 00568 and 00831 guides were re-rendered and visually inspected; central anatomy and treatment/agent attribution remain intact.

### Release-schema correction

The v0.80.4 production Pages run failed because `data/app-release.json` used prose in the `release` field while the established contract requires `release == package.version`.

v0.81.0 restores:

- package version = 0.81.0
- app version = 0.81.0
- app release = 0.81.0
- prose description in `summary`

## Checks deliberately not claimed yet

### Full repository regression suite

NOT YET RUN against v0.81.0 in GitHub CI at package-generation time. This ZIP is a drop-in overlay, not a full repository checkout in the local execution environment. The repository Pages workflow will run the early release gate and then the complete regression suite after the ZIP is committed.

### Live GitHub Pages deployment

NOT YET VERIFIED. The current public repository run before this release is still the failed v0.80.4 Pages run. After v0.81.0 is committed, live validation requires:

1. release architecture gate green;
2. repository security checks green;
3. generated-protocol diff check green;
4. full `npm test` green;
5. Pages artefact validation green;
6. Pages deployment green;
7. public checks of canonical portal/guide/passport routes and representative QR scans.

Local validation and live deployment validation are intentionally reported separately.
