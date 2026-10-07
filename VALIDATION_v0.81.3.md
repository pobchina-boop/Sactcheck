# SACTCheck v0.81.3 - local validation

## Scope
Focused refinement of the live NCCP 00568 patient experience. No deterministic NCCP dose, threshold or assessment-engine rules were changed.

## Patient guide
- exactly 2 A4 pages
- `Your medicines` and `Your treatment schedule` are separate populated panels
- pembrolizumab vs pemetrexed/carboplatin colour key is separated from the anatomy map
- anatomy uses the approved rich central figure with agent-attributed callouts
- page 2 contains medicine-specific effects, monitoring, urgent-action wording, consent support and a direct clickable portal link
- rendered QR decoded to `https://sactcheck.com/patient/00568/`
- guide PDF contains clickable links to the live portal and the official NCCP 00568 source

## Patient passport
- 4 A4 pages
- same 8 symptom groups as the anatomy guide: hormones/brain, lungs/breathlessness, heart, liver, kidneys, bowel, skin/nerves, blood/infection
- induction C1-C4 cycle-by-cycle grade matrix
- maintenance M1-M8 cycle-by-cycle grade matrices
- simplified patient-facing dyspnoea grading example using CTCAE-style descriptors
- urgent oncology contact panel and portal QR

## SACTCard
- 2 A4 print pages: front and back at ISO ID-1 credit-card size (85.60 x 53.98 mm)
- front: regimen identity, medicines, schedule and QR
- back: C1-C4 induction stamps, M1-M8 maintenance stamps, continuation field and urgent contact numbers
- QR payload decoded from the source image and from a 400-dpi render of the PDF front
- QR contains regimen information only and no patient-identifying data

## Regression / release checks
- `node tests/v0813-patient-experience.test.js` passes
- changed JavaScript files pass `node -c`
- canonical and `/docs/patient/00568/` guide/passport/SACTCard PDFs are byte-identical
- protected-asset manifest refreshed for 00568 guide, passport, index and SACTCard
- Pages validator now requires the 00568 SACTCard assets and hash parity
- package `test` and `release:gate` chains include the v0.81.3 patient-experience regression test

## Post-deployment checks still required
After commit/push, confirm GitHub Pages stays green, then verify the live 00568 portal, direct guide link, passport link, SACTCard link and physical phone scan of the QR.
