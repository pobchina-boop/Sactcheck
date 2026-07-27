# SACTCheck v0.48.4 validation report

## Release scope

- Baseline: SACTCheck v0.48.3 ranked-search release.
- Change type: catalogue usability and privacy wording only.
- Clinical protocol JSON changes: **0**.
- NCCP thresholds or assessment-rule changes: **0**.

## Oral anti-cancer medicines category

- 361 canonical published regimens retained.
- 96 regimens classified as containing an oral anti-cancer medicine.
- Classification uses protocol treatment class, anti-cancer drug identity, formulation and route metadata.
- Confirmed included examples:
  - Palbociclib
  - Olaparib monotherapy
  - XELOX / CAPOX
  - Capecitabine monotherapy
  - Temozolomide-containing regimens
  - Abiraterone, enzalutamide and other applicable oral targeted/endocrine protocols
- Confirmed exclusion example:
  - IV docetaxel with oral prednisolone is not classified solely because prednisolone is administered orally.

The category is intentionally broad and identifies regimens containing a substantive oral anti-cancer component. Local Oral Anti-Cancer Service scope may be narrower; for example, it may exclude endocrine-only medicines or mixed IV/oral regimens. That local operational scope should be confirmed before presenting the filter as an exact service worklist.

## Privacy and interface wording

- Removed `Patient-agnostic` from the active interface.
- Removed `hypothetical` wording from the active interface and quick-start guide.
- Added the heading `No patient-identifiable information required`.
- Retained explicit instructions not to enter names, hospital numbers, dates of birth, contact details or other identifying information.

## Search and navigation

- Added Oral anti-cancer medicines to the treatment-category selector.
- Added an Oral anti-cancer medicine badge to matching cards.
- Added oral-regimen counts and shortcuts to tumour-site landing pages.
- Added search support for oral SACT, OAM, OACM and common oral-agent shorthand.

## Automated validation

- `npm run test:ci`: passed.
- Repository security scan: passed.
- Protocol publishing/validation suite: passed.
- Full application regression suite: passed.
- v0.48.4 oral-service regression tests: passed.
- GitHub Pages build: passed.
- Deployable-site validation: passed.
- 382 protocol JSON files compared with the v0.48.3 baseline: **0 changed**.
- ZIP integrity tests: passed.
