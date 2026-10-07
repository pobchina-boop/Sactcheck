# Validation — SACTCheck v0.81.4

## Patient-output checks
- 00568 passport redesigned around symptoms rather than organs/systems.
- Symptom severity table uses patient language informed by NCI CTCAE v6.0 severity concepts.
- Red-flag symptoms are explicitly separated from self-grading.
- Induction table covers C1-C4; maintenance tables cover M1-M8.
- Passport renders as 5 pages: treatment/symptom overview, grading reference, induction log, maintenance M1-M4, maintenance M5-M8.
- `passport.html` is browser-readable and links to the printable PDF.
- SACTCard remains printable and is now explicitly surfaced from the portal and browser preview.

## Regression/deployment fixes
- v0.81.1 guide regression accepts the protected PDF-wrapper architecture while still requiring deterministic anatomy in the live portal.
- v0.81.2 anatomy regression is patch-release tolerant and checks anatomical anchors in the canonical portal rather than the PDF wrapper.
- final Pages validator requires the 00568 browser passport and SACTCard assets.

## Local checks
- canonical and compatibility `passport.pdf` are byte-identical.
- canonical and compatibility `sactcard.pdf` are byte-identical.
- v0.81.3 and v0.81.4 focused tests pass in the drop-in package.
- changed JavaScript/test files pass Node syntax checks.

Live deployment is not claimed until the GitHub Pages workflow passes after push.
