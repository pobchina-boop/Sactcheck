# SACTCheck v0.49.0 Validation Report

## Release identity

- Release: **v0.49.0 — Haematology Foundation**
- Build type: **complete repository drag-and-drop release**
- Starting baseline: clean committed **v0.48.4** repository supplied by the product owner
- Build date: **29 July 2026**

## Catalogue integrity

- Canonical protocols: **366**
- Existing solid-tumour protocols: **361**
- New haematology protocols: **5**
- Original solid-tumour protocol JSON files changed: **0**
- Original solid-tumour protocol JSON files missing: **0**

The original 361 non-index protocol JSON files were compared byte-for-byte against the clean v0.48.4 baseline.

## Haemato-oncology content

Initial plasma-cell disorder protocols:

1. NCCP 00270 — Bortezomib and dexamethasone
2. NCCP 00435 — Bortezomib maintenance, 14-day schedule
3. NCCP 00416 — Lenalidomide, bortezomib and dexamethasone, 21-day schedule
4. NCCP 00643 — Lenalidomide, bortezomib and dexamethasone, 28-day schedule
5. NCCP 00275 — Bortezomib, melphalan and prednisolone

Encoded haem foundation totals:

- Optional input definitions: **78**
- Encoded rules: **80**
- Required launch inputs: **0**
- Input definitions marked mandatory: **0**

## Integration checks

- Separate Solid Tumour and Haematology library domains integrated into the main application
- Burgundy haematology visual identity integrated
- Plasma-cell disorders family navigation integrated
- Route classification integrated for parenteral-only and mixed oral/parenteral regimens
- Five haem protocols included in the main canonical protocol catalogue
- Search, official source links, partial assessment and shared decision-engine pathways retained
- Supportive-care classification explicitly marked for specialist haematology pharmacy review rather than inferred

## Automated testing

The complete `npm run test:ci` pipeline passed, including:

- Source security checks
- Protocol-index generation
- Regimen-card metadata generation
- Validation of all **366** canonical protocol JSON files
- Historical regression suites
- Single-entry and partial-assessment tests
- Haemato-oncology v0.49.0 focused tests
- GitHub Pages build
- Deployable-site validation

Focused haem test result:

> v0.49.0 haem foundation passed: 5 protocols, 78 optional inputs, 80 rules.

## Clinical governance boundary

The five haematology encodings remain preliminary technical prototypes. They require independent review by a Consultant Haematologist and haematology pharmacist before clinical use. SACTCheck v0.49.0 must not be used as an autonomous treatment-clearance system.
