# Validation — 00568 patient regimen page overhaul

## Structural checks completed
- canonical page remains `patient/00568/index.html`
- canonical URL remains `https://sactcheck.com/patient/00568/`
- all internal section anchors resolve
- no link from the canonical page requires `knowledge.html`
- no phase selector, patient-entered date or clickable day control remains on the canonical page
- visual guide, Treatment Passport and SACTCard links remain present
- official NCCP 00568 v5 source is visible near the top and again in the source section
- KEYNOTE-189 evidence link is present

## Protected anatomy checks completed
The existing 00568 anatomy component and its fixed anchor positions are retained, including heart, liver, kidney, bowel and blood/vessel markers.

## Protected-asset manifest
`data/protected-patient-assets-v0810.json` is updated only for the new 00568 `index.html` hash/byte count and the v0.81.9 policy note. Existing guide, passport and SACTCard hashes are retained.

## Scope boundary
This is the 00568 gold-standard patient page only. It does not yet propagate the wiki-style page to the other dedicated patient regimens.

## Live deployment
Not claimed by this local package. GitHub Pages should be checked after commit/push.
