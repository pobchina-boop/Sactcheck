# SACTCheck

SACTCheck is a clinician-focused oncology decision-support prototype based on NCCP/HSE systemic anti-cancer therapy protocols. It provides structured pre-treatment assessment, protocol-specific eligibility checks, explainable recommendations and copyable documentation to support consistent oncology day-ward review.

Copyright © 2026 Dr Paul O’Brien. All rights reserved. This software, clinical rule structure, user interface and associated documentation may not be copied, modified, distributed, sublicensed, commercialised or incorporated into another product without prior written permission.

## v0.26 protocol-driven assessment platform

The repository supports a reviewed **schema 2.x protocol JSON** as the only regimen-specific source file required for publication. v0.17 adds conditional visibility and requirement rules so irrelevant fields no longer block an assessment.

A protocol JSON describes its own:

- metadata, NCCP code/version, tumour group and source;
- assessment profiles;
- input labels, units, control types, options, ranges and demonstration values;
- core, optional and conditionally required inputs using `visible_when` and `required_when`;
- deterministic decision rules and action priority;
- explanations, component-specific actions and source references;
- validation and migration status.

The browser then generates the assessment form and evaluates the protocol without adding regimen-specific JavaScript or HTML.

### Core modules

- `js/rule-engine.js` — deterministic rule evaluation and action priority.
- `js/protocol-validator.js` — structural and semantic protocol validation.
- `js/assessment-engine.js` — assessment profiles, explicit input definitions and explainable results.
- `js/generic-assessment-ui.js` — protocol-generated forms and documentation.
- `js/protocol-loader.js` — loads the generated protocol catalogue.
- `js/protocol-importer-ui.js` — local JSON validation and preview before publication.
- `tools/build-protocol-index.js` — scans `protocols/`, validates files and rebuilds `protocols/index.json`.
- `.github/workflows/protocol-library.yml` — validates JSON changes, runs regression tests and commits the generated catalogue.

The live generic JSON pathway now includes weekly paclitaxel, olaparib, Modified FOLFOX-6, XELOX/CAPOX, FOLFIRINOX and FOLFIRI. Each published protocol remains subject to consultant, oncology-pharmacy and local governance review before clinical deployment.

## Adding a protocol

1. Copy `protocols/_template/protocol-template.json`.
2. Encode and clinically review the new protocol.
3. Open SACTCheck and select **Preview protocol JSON**.
4. Correct every validation error and review all warnings.
5. Place the file in the appropriate tumour-site folder under `protocols/`.
6. Commit and push the single JSON file.
7. GitHub Actions validates the library, runs regression tests and rebuilds `protocols/index.json` automatically.

A malformed protocol blocks publication rather than silently appearing in the catalogue. See `PROTOCOL_AUTHORING_GUIDE.md` for the complete authoring and validation workflow.

## Local use

Run the project through GitHub Pages, VS Code Live Server or another local HTTP server. Directly opening `index.html` from the file system may prevent browser `fetch()` calls from loading protocol JSON.

## Automated tests

With Node.js installed:

```text
npm test
```

Current expected results:

- 9 protocol-publishing tests passed;
- 13 generic assessment-engine tests passed;
- 7 conditional-input tests passed;
- 24 weekly-paclitaxel JSON boundary tests passed;
- 17 FOLFOX shadow-comparison tests passed.

Automated validation does not constitute clinical validation. Consultant review, oncology-pharmacy review, source verification, boundary testing, governance and local authorisation remain required before clinical deployment.
