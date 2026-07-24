# SACTCheck v0.38.0 validation report

Date: 24 July 2026

## Release scope

- 145 distinct indexed NCCP regimen protocols.
- 26 fully encoded prostate regimen protocols corresponding to the current NCCP prostate catalogue.
- 24 new Genitourinary JSON files.
- Two existing shared protocols upgraded/confirmed for prostate use: NCCP 00203 and NCCP 00588.
- No prostate placeholders or drafts.

## Automated results

- Protocol publisher/validator: PASS — 150 checks.
- Complete npm regression suite: PASS.
- Platform standardisation audit: PASS — 145 regimens, 434 CTCAE fields, 32 renal-band fields and 27 exact carboplatin renal fields.
- Whole-library single-entry audit: PASS — 145 regimens and 1,849 visible rule-linked inputs.
- Tissue/laboratory UI audit: PASS — 100 automatic ULN adapters.
- Prostate library audit: PASS — 26 protocols and 180 independently tested prostate inputs.
- Protocol index uniqueness: PASS — 145 unique IDs and paths.
- Official NCCP PDF-link audit: PASS.

## Prostate release safeguards

- Current NCCP prostate code set checked explicitly in regression tests.
- Single-field assessment required for every visible rule-linked prostate input.
- No prostate input remains browser-blocking through `required: true` or a non-empty `required_inputs` list.
- Grade-based inputs require CTCAE version, category, assessment guidance and displayed grade explanations.
- Tiered renal pathways are represented by protocol-specific selectors rather than exact numerical entry.
- Shared protocols 00203 and 00588 remain single canonical files to avoid duplication.
- Akeega resolves to its combination alias without being mislabeled as single-agent Zejula or Zytiga.
- Relugolix dose escalation with an unavoidable combined inducer is represented as consultant/pharmacy review, not dose reduction.

## Validation boundary

Automated testing verifies JSON structure, engine behaviour, catalogue integrity, partial-assessment behaviour and encoded boundary examples. It cannot independently certify that every clinical interpretation of every NCCP statement is correct. Formal source-by-source consultant and oncology-pharmacy review remains required before the tool is authorised to replace any established clinical check.
