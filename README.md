# Sactcheck
SACTCheck is a clinician-focused oncology decision support tool based on NCCP/HSE systemic anti-cancer therapy protocols. It provides structured pre-treatment assessment, protocol-specific eligibility checks, explainable recommendations and clinical rule summaries to support safe, consistent oncology day-ward prescribing and review.

Copyright © 2026 Dr Paul O’Brien. All rights reserved. This software, clinical rule structure, user interface and associated
documentation may not be copied, modified, distributed, sublicensed, commercialised or incorporated into another product without prior
written permission.

## Generic JSON assessment architecture

The repository now includes a first modular assessment pathway:

- `js/rule-engine.js` evaluates encoded conditions, scope and action priority.
- `js/assessment-engine.js` builds assessment profiles, validates inputs and creates explainable results.
- `js/generic-assessment-ui.js` generates the assessment form from protocol JSON.
- `js/protocol-loader.js` loads protocols from `protocols/index.json` and connects valid JSON protocols to the generic screen.

The existing regimen-specific assessment screens remain in place. The generic pathway currently connects the encoded NCCP 00857 and NCCP 00588 protocol files without replacing the established prototype screens.

Run the project through GitHub Pages, VS Code Live Server or another local HTTP server. Directly opening `index.html` from the file system may prevent browser `fetch()` calls from loading protocol JSON.

### Engine tests

With Node.js installed, run:

```text
node tests/engine.test.js
```

The tests cover normal proceed scenarios, treatment delay, omission, dose reduction, cessation, consultant-review fallbacks and incomplete-data handling.
