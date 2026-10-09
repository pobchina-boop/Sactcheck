# Local validation — v0.81.9

Date: 8 October 2026. **No live deployment validation claimed.**

## Passed

- `npm run test:ci`: release gate, repository security, generated protocol build, complete npm regression chain, Pages build and final public-site validator.
- Generated-protocol diff gate: protocols/index.json, regimen-card metadata and review CSV unchanged.
- New generated-page freshness, canonical identity, phase content, privacy and consent-routing contract checks; integrated into release:gate.
- New browser journeys on source and final `_site`, at widths 1440 and 390: portal → knowledge; all 21 day controls; December-to-January date arithmetic; correct next-cycle date; maintenance excludes carboplatin; date/day/phase interactions make zero requests; no local/session storage writes; reload clears the date; clinician knowledge opens; consent opens its own page; draft text appears in print mode; clear entries works; no page JavaScript errors.
- JavaScript-disabled knowledge content and expanded full-cycle text remain accessible.
- Existing reliability browser suite against final `_site`: cold and warm loads, complete cards, no repeated/idle card child mutations, guide opens dedicated PDF, workflow opens, ANC 0.8 alone produces a partial result with missing domains unassessed.
- Desktop/mobile screenshot review: no page-wide horizontal overflow; timeline scrolls within its own region on mobile.
- Consent sample PDF rendered and visually inspected: two A4 pages, entered test text visible, no clipped text. User-entered long content can expand pagination; this is not an exactly-two-page constraint.
- Approved 00568 guide/passport/card PDF and anatomy image hashes unchanged from delivered v0.81.8. Anatomy section markup unchanged. All protocol JSON unchanged from checked main.
- Final drop-in archive CRC, extracted byte comparisons and SHA-256 verified during packaging.

## Environment and boundaries

Local Node 24.19.0; Playwright 1.62.1; available Chromium 153. GitHub workflow uses Node 20, so this is the same command sequence rather than an identical runner environment. Browser scripts are provided as separate npm commands, not automatically installed or run by the existing Pages workflow. Tests exercise real Chromium interaction, not Safari or physical devices.

After final print-CSS adjustments, the generated content check, Pages build, site validator and final-build journeys were rerun. The full npm chain had already passed before those presentation-only changes.

No new guide/passport/card PDFs or QR images were generated in the v0.81.9 feature changes. Existing approved 00568 PDFs were preserved; the cumulative package also carries previously validated v0.81.8 guide repairs. New clinical prose is source-linked and marked for clinical/PPI review; technical tests do not certify clinical completeness.

New source content was checked against NCCP 00568 v5, HSE safety guidance, Macmillan medicine information, Cancer Research UK pemetrexed information and NCI carboplatin/nausea information. Original diagrams explain mechanisms schematically. Timeline bands do not encode numerical probabilities or predicted nadir dates.

Evidence: validation/v0819/ contains CI output, browser results and preserved-asset hashes. See RELEASE_v0.81.9.md for the post-deployment acceptance checklist.
