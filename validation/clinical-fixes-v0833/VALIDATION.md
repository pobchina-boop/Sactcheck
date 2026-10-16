# v0.83.3 validation record

Base: v0.83.2 / 894e830240699de7e0ea5f2037f8b220bb11eca3.
Date: 16 October 2026. Environment: local release candidate; synthetic inputs.

| Check | Result |
| --- | --- |
| Full `npm run test:ci` | PASS: release gates, security checks, protocol build, regression suites, static build and deployable-site checks |
| Source-based clinical cases | PASS: 88 cases across 00227, 00449 and 00446 |
| Additional shared-module assertions | PASS: separate/aliased 5-FU routes, generic actions with specific overrides, competing reductions, source pages, antiemetic maps and four scenario-parser renal boundaries |
| Clinical browser entry | PASS: 31 cases — 22 desktop (1440px), nine mobile (390px) |
| Clinic/patient journeys | PASS: six journeys — three regimens at both widths; portal, knowledge, date-free chronology, port/pump guidance, consent reset, workflow/knowledge links and supportive-care availability |
| Assessment PDF exports | PASS: six downloaded examples; output text checked and representative layouts visually inspected |
| Patient assets | PASS: no content changes in patient/, docs/patient/, assets/patient/ or data/patient-knowledge/; protected hashes for all 18 portals retained |
| Diff whitespace | PASS: `git diff --check` |

`engine-cases.json` records inputs, expected action, observed action, source-labelled findings and component output. `browser-cases.json` records the values entered through actual controls, visible results, dose text and generated PDF names. `patient-journeys.json` records the six patient/workflow journeys. Logs and six anonymous example PDFs are included. Browser screenshots are internal QA and are not distributed.

The current NCCP source versions were opened and checked on the date above. Exact unassigned boundaries request clinical review. The retained 00227 renal recommendation differs intentionally from 00449. The revised 00449 renal UI uses clinically assessed severity rather than a borrowed numerical dosing threshold. Local LFT conversion remains available and was exercised with bilirubin 61 µmol/L / ULN 20, yielding 3.05 ×ULN.

Scope: the audited defects and their connected outputs, not a complete clinical validation of every branch in these regimens or of the 376-regimen library. No real patient data or prescribing system was used. Consultant and oncology-pharmacy approval remain pending. The package has not been pushed or deployed by this task; verify the live version and the corrected examples after deployment.
