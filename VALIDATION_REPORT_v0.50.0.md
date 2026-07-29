# SACTCheck v0.50.0 Validation Report — Multiple Myeloma Core

Validation date: 29 July 2026

## Release inventory

- 376 indexed protocols overall.
- 361 pre-existing solid-tumour protocols retained in the index without changes to their catalogue rows or protocol JSON bytes.
- 15 Haematology plasma-cell protocols.
- 10 protocols added in v0.50.0.
- 253 optional Haematology inputs and 229 encoded Haematology rules overall.
- The ten new protocols contribute 175 inputs and 149 rules.
- Zero mandatory assessment-launch inputs across the 15 Haematology protocols.
- Route distribution: 2 oral-only, 8 mixed oral/parenteral and 5 parenteral-only protocols.

## Automated checks

- Full `npm run test:ci` pipeline passed.
- Repository security scan passed.
- Protocol index generation passed.
- 381 protocol-publishing tests passed.
- Historical assessment-engine, conditional-input, regimen-specific and catalogue-regression suites passed.
- v0.50.0 focused Multiple Myeloma expansion test passed.
- GitHub Pages build and deployable-site validation passed.
- Central supportive-care map covers all 376 protocols.
- The 15 Haematology regimens remain labelled `variable` for supportive-care risk pending specialist pharmacy reconciliation.

## Visual system

The Haematology portal uses a blood-red identity while preserving independent clinical-result colours. White-text contrast ratios are:

- `#5C0712`: 14.1:1
- `#8B0D1E`: 9.7:1
- `#B5162B`: 6.7:1
- `#D42A3F`: 5.0:1

## Clinical boundary

All 15 Haematology encodings remain pending independent Consultant Haematologist and haematology-pharmacy validation. Software-test completion is not clinical authorisation. The tool must not be used to clear treatment without manual verification against the current NCCP protocol and local policy.
