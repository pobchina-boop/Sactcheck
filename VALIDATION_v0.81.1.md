# SACTCheck v0.81.1 validation

## Scope
Corrective release only. No deterministic NCCP dose, threshold, eligibility or treatment-assessment rules were modified.

## Deployment regression
- Historical `tests/search-first-v0570.test.js` now validates canonical patient routing in `js/patient-asset-registry-v0810.js`, where v0.81 intentionally centralised route ownership.
- The stale assertion requiring the route generator to remain inside `patient-support-v0750.js` has been removed.
- v0.81 architecture test is patch-release tolerant while retaining the same registry, bootstrap, protected-asset and workflow-contract assertions.

## Patient guide fidelity
- All 13 dedicated guides regenerated as exactly two A4 pages.
- Anatomical connector lines are embedded directly into the guide/portal markup and into the generated PDF output; they no longer depend on JavaScript print timing.
- v0.81.1 runtime connector JavaScript explicitly becomes fallback-only when a deterministic static connector layer is present.
- Page 2 restores medicine-specific toxicity summaries above the shared/general effects and urgent-call sections.
- `When to call`, consent-discussion support and QR blocks have explicit spacing; the prior large blank region between consent and QR has been removed.
- 00568 was rendered and visually inspected: central anatomy, numbered connectors and separate pembrolizumab / pemetrexed / carboplatin information are present.
- 00831 and 00713 were additionally spot-rendered to check 9-card anatomy and four-agent layout behaviour.

## QR validation
- 13/13 raw v0.81.1 QR PNGs decoded to `https://sactcheck.com/patient/<code>/`.
- 13/13 QR codes decoded successfully from page 2 after a 300-dpi PDF render.
- No QR contains patient-identifying data.

## File/compatibility validation
- 13/13 canonical patient guide PDFs are 2 pages.
- 13/13 `patient/<code>/guide.pdf` files are byte-identical to their `docs/patient/<code>/guide.pdf` compatibility copies.
- `node tests/v0810-architecture-consolidation.test.js` passes locally against the release files.
- `node tests/v0811-patient-guide-deployment.test.js` passes locally against the release files.

## Live boundary
These are local/package checks. GitHub Pages and the public QR destinations must be rechecked after v0.81.1 is committed and pushed. Do not call public deployment successful until the GitHub Pages workflow is green and the canonical public routes return the new release.
