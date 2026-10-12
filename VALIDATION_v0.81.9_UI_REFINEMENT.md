# Validation — v0.81.9 UI refinement

## Local focused checks completed

- `assets/patient/patient-knowledge.js` passes `node --check`.
- Custom regression `tests/v0819-ux-refinement.test.cjs` passes.
- CSS brace-balance checks pass for all changed stylesheets.
- The new patient knowledge script contains no browser storage, request, beacon or network-call API use.
- No protocol JSON, assessment rules, protected patient PDFs, QR assets, Treatment Passport or SACTCard files are included in this patch.

## Behaviour checked by static contract

### Clinic Workflow
- compact single-column action-list styling is present;
- all existing workflow modules remain represented;
- visual labels include assessment, consent, knowledge, patient portal and original NCCP source;
- supportive-care and extravasation expanded bodies are removed from the at-a-glance landing view rather than deleting the underlying functions.

### Patient knowledge
- date-entry and selected-day state logic is removed from the runtime knowledge script;
- the interactive timeline is replaced at runtime by a static treatment/cycle explanation;
- evidence/source links are promoted near the top of the page;
- the portal landing page hides the redundant “Explore the 21-day timeline” action and reframes the knowledge link as a source-linked reference experience.

## Not claimed

This package has not been pushed from this chat and therefore does not claim GitHub Pages or live-site success. After push, verify Pages/CodeQL and manually inspect Clinic Workflow plus `/patient/00568/knowledge.html` on desktop and mobile.
