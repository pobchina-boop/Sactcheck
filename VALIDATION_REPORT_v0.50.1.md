# SACTCheck v0.50.2 Validation Report

## Release scope

Clinical copy and library navigation refinement only. No protocol rule, threshold, source link or treatment encoding was changed.

## Verified changes

- Haematology tile removed from Solid Tumour tumour site navigation.
- Solid Tumour tumour site counts exclude Haematology cards.
- The Haematology option is hidden in the Solid Tumour cancer type selector and restored in the Haematology portal.
- Favourites and recent protocols are filtered to the active library.
- Large patient information study card removed.
- Short privacy reminder retained in the feasibility notice.
- Restrictive generic result changed to “Treatment criteria not met”.
- Restrictive explanatory text changed to “One or more values entered fall outside the protocol treatment criteria.”
- Cache keys updated for modified interface modules.

## Catalogue integrity

- 376 published protocols.
- 361 Solid Tumour protocols.
- 15 Haematology protocols.
- 395 protocol JSON source files excluding the generated index.
- Zero protocol JSON content differences from v0.50.0.

## Automated validation

The complete `npm run test:ci` pipeline passed, including repository security scanning, protocol publishing, historical regression tests, the focused v0.50.2 test, GitHub Pages build and deployable site validation.
