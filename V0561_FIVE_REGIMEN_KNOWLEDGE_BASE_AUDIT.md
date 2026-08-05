# v0.56.1 Five-Regimen Knowledge Base Audit

## Audit result

**PASS — 5 of 5 detailed regimen profiles meet the v0.56.1 structural requirements.**

## Coverage

- Five regimen profiles
- Five principal trial mappings
- Five verified PubMed identifiers
- Five DOI links
- Six linked follow-up publications
- Twenty-four reusable drug profiles retained
- Eighteen total protocol-to-evidence mappings retained

## Structural checks

Each pilot page contains:

- an existing published protocol identifier;
- a regimen overview;
- treatment setting;
- component rationale;
- schedule context;
- at least three orientation points;
- trial population;
- intervention and comparator;
- primary endpoint;
- at least two selected findings;
- limitations;
- match type;
- stable PubMed and DOI links;
- review status.

## Interface checks

- Regimen info links remain available on published regimen cards.
- Regimen info remains available inside the opened assessment engine.
- The five pages render a Regimen at a glance section.
- Component mechanisms and component rationale are displayed separately.
- Primary and follow-up publications are separately linked.
- Limitations and the NCCP operational-source boundary are visible.
- The exact function name Clinical scenario interpreter is preserved.

## Safety checks

- No evidence record is imported into the deterministic rule engine.
- No evidence result changes an NCCP threshold, recommendation or dose action.
- No patient-specific final dose is calculated by the information page.
- Current user-facing knowledge-base content contains no AI-origin label.
- Missing evidence continues to produce an explicit empty state.
