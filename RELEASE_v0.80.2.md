# SACTCheck v0.80.2 — reference anatomy and printable patient outputs

Corrects v0.80.1's substituted illustration and missing print styles. Reuses the actual approved atezolizumab/bevacizumab anatomy asset and three-column numbered-card format for all seven patient pipelines. The image is byte-identical to the reference.

Print actions now open a styled standalone guide. Each regimen has a generated two-page A4 guide, eight-page treatment passport and bundled QR image. Regimen-specific schedules and drug-attributed toxicity cards use the existing patient content. The detailed portals retain their clinical content. The mandatory release checklist is included.

## Verified output

| NCCP | Reference anatomy / cards | Guide | Passport | Exported QR decode | Public route |
|---|---|---|---|---|---|
| 00209 | Checked | 2 pages | 8 pages | Guide + passport passed | HTTP 200 |
| 00568 | Checked | 2 pages | 8 pages | Guide + passport passed | HTTP 404 |
| 00857 | Checked | 2 pages | 8 pages | Guide + passport passed | HTTP 404 |
| 00722 | Checked | 2 pages | 8 pages | Guide + passport passed | HTTP 404 |
| 00382 | Checked | 2 pages | 8 pages | Guide + passport passed | HTTP 404 |
| 00619 | Checked | 2 pages | 8 pages | Guide + passport passed | HTTP 404 |
| 00831 | Checked | 2 pages | 8 pages | Guide + passport passed | HTTP 200 |

Rendered guide layouts and passport samples inspected; all 70 exported PDF pages checked for text outside page bounds. All seven guides loaded the 846×1859 reference image and connectors. All seven mobile portals passed horizontal-overflow checks. Actual application print-button popups loaded the corresponding guide and anatomy; passport buttons resolved to the corresponding PDF. Each exported QR was decoded from the PDF raster and matched its regimen URL.

Public checks on 30 September 2026: 00209 and 00831 return HTTP 200. The other five return HTTP 404. Therefore live QR destination checks remain FAILED/PENDING DEPLOYMENT for those five; this is a correction package for review and deployment, not a claim that the public release is ready. Recheck all seven destinations and their content after deployment.

The supplied Pages build script successfully built the patched source with 382 protocol JSON files. All seven portals and both PDFs per regimen appear in `_site/docs/patient/`. The targeted v0.80.2 runtime/artifact test passed. The full clinical-engine regression suite was not run for this presentation fix. This is not a fresh clinical validation of NCCP content.

## Apply

Extract into the existing SACTCheck repository root, replacing matching files. This is a drop-in patch, not a standalone repository. Run `npm run test:v0802`, then the repository's usual CI and Pages deployment. Verify all seven public routes after deployment. Do not announce live QR completion until those checks pass.

No older consent-content dataset is included. Existing clinical protocol data and build tooling remain supplied by the host repository.
