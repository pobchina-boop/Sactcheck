# SACTCheck v0.80.4 local validation

Date: 2026-10-01

## Scope

This is a stability and patient-portal release. It does not alter the deterministic NCCP dose-threshold assessment rules.

The release protects and republishes the original seven dedicated patient portals:

- 00209 modified FOLFOX-6
- 00382 trifluridine/tipiracil (Lonsurf)
- 00568 pembrolizumab + pemetrexed + carboplatin
- 00619 adjuvant abemaciclib + endocrine therapy
- 00722 TCHP
- 00831 atezolizumab + bevacizumab
- 00857 pembrolizumab + carboplatin/paclitaxel -> AC

It adds six fixed-route pemetrexed-family portals:

- 00222 pemetrexed monotherapy
- 00317 pemetrexed + cisplatin
- 00318 pemetrexed + carboplatin
- 00569 pembrolizumab + pemetrexed + cisplatin
- 00713 nivolumab + ipilimumab + pemetrexed + carboplatin
- 00714 nivolumab + ipilimumab + pemetrexed + cisplatin

Together with 00568, these are the seven fixed pemetrexed-containing NCCP entries represented in the current SACTCheck lung library and cross-checked against the current HSE/NCCP Lung SACT catalogue. Pembrolizumab + pemetrexed without platinum is represented as the maintenance phase of 00568/00569 rather than being given an invented standalone NCCP code.

## Local portal validation - PASS

- 13 canonical `/patient/<code>/` portal directories present.
- 13 `/docs/patient/<code>/` compatibility copies present.
- Every portal contains `index.html`, `guide.html`, `guide.pdf` and `passport.pdf`.
- All 13 HTML portals use the rich central-anatomy format and identify the canonical `https://sactcheck.com/patient/<code>/` destination.
- The seven previously approved portals retain regimen-specific protected content markers.
- 00568 specifically retains pembrolizumab immune attribution plus pemetrexed/carboplatin chemotherapy attribution, including hormones/brain, lungs, heart, liver, kidneys, bowel, skin/nerves and blood/infection domains.
- 00831 retains the atezolizumab-versus-bevacizumab anatomy language used as the visual reference standard.

## PDF validation - PASS

- 13 visual treatment guides: 2 pages each.
- 13 treatment passports: 8 pages each.
- All 26 PDFs are openable by PyMuPDF preflight.
- All 13 guide PDFs contain embedded anatomy artwork; the release gate rejects unexpectedly small guide files to prevent a repeat of the v0.80.3 visual downgrade.
- Render inspection was performed on the complete guide set and representative passport pages; no missing anatomy image, black-square glyph, major overlap or clipping was identified.

## QR validation - PASS locally

39 decode checks passed:

- 13 source QR PNGs
- 13 QR codes rendered from page 2 of each guide PDF
- 13 QR codes rendered from page 1 of each passport PDF

Every decoded value is exactly:

`https://sactcheck.com/patient/<NCCP-code>/`

This validates QR generation and embedded PDF QR readability locally. It does **not** prove that the public route is live until GitHub Pages successfully deploys this commit.

## Clinic Workflow fix - PASS by static/release regression checks

- Public app release: 0.80.4.
- Workflow-data schema release: 0.78.0.
- The workflow engine now validates `data/regimen-workflow-v0750.json` against its own 0.78.0 data contract rather than requiring it to equal the public app release.
- Workflow data is prewarmed before regimen cards are rendered.
- The v0.80.4 regression test verifies the independent workflow-data contract.

## Antiemetic traffic-light fix - PASS by static/release regression checks

- The regimen traffic-light click is captured by `antiemetic-print-v0804.js`.
- It calls the existing regimen-derived `openSupportivePdf()` workflow.
- The printable supportive-care PDF therefore uses the resolved regimen-specific antiemetic plan while retaining the NCCP source link in the card/workflow.
- No autonomous prescribing behaviour is introduced; prescribing output remains clinician-controlled and review-dependent.

## Regimen-card loading stability - PASS by static/release regression checks

- The second dynamic UI bootstrap has been removed from `study-release.js`.
- Patient support, workflow, passport, antiemetic and interface modules are each loaded once in `index.html` before `protocol-loader.js`.
- Workflow-data prewarming begins early.
- Card action space is reserved and the antiemetic slot is reserved while enrichment completes, reducing the visible two-buttons-then-all-buttons layout jump.
- Workflow installation is idempotent to avoid duplicate event bindings.

## Release regression gate - PASS

`node tests/v0804-stability.test.js`

Result:

`v0.80.4 stability gate passed: 13 patient portals, fixed workflow-data contract, stable card bootstrap and printable antiemetic action.`

The gate checks canonical routing, rich anatomy markers, protected original-portal markers, embedded guide artwork, passport size floor, module bootstrap order, workflow-data version separation and printable antiemetic wiring.

## Live deployment status - NOT YET VERIFIED

This package has been validated locally. GitHub Actions and the public `sactcheck.com` routes cannot be signed off until the v0.80.4 package is committed and pushed. After deployment, the required final checks are:

1. GitHub Pages build = success.
2. CodeQL = success.
3. All 13 canonical `/patient/<code>/` routes return successfully.
4. A phone-camera scan of representative printed/rendered QR codes reaches the canonical live route.
5. Clinic Workflow opens from a live regimen card without the workflow-data error.
6. Clicking the visible emetogenic traffic light opens the printable antiemetic/supportive-care output.
7. Regimen cards do not visibly jump from a two-action state to the complete action set.

## Clinical governance

The new patient-facing content remains a clinical-review prototype. Current NCCP/HSE regimen sources, formal consent, prescribing/pharmacy verification, local policy and individual clinical judgement remain authoritative.
