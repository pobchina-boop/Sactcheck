# Full-suite regimen standard

Use NCCP 00568 as the design and interaction reference. Expand three regimens
per batch. A batch is complete only when each applicable service below is
connected to the correct protocol and its limitations are visible.

| Service | Acceptance requirement |
| --- | --- |
| Identity and source | NCCP code/version, indication and current official source agree across surfaces. |
| Clinical assessment | Existing encoded rules work; missing inputs remain unassessed. |
| Clinical knowledge and evidence | Selection, administration, monitoring, supportive care, linked trial context and patient resources are accessible. |
| Consent | Correct regimen opens from the clinic; printable medicine-specific risk aid includes individual benefit, alternatives and discussion space. |
| Supportive care | Regimen-derived plan and printable PDF work; route and phase exceptions are preserved. |
| Interactions and extravasation | Medicines resolve consistently; oral medicines do not receive infusion guidance; unmapped data remains explicit. |
| Other suite modules | Existing applicable services, including sustainability, remain accessible; available evidence is not overstated. |
| Patient reference | Substantive plain-language chapters, practical actions, FAQs, medicine mechanisms, sources and contextualised evidence. |
| Timeline | Correct cycle length, medicine days, rest periods, optional schedules, date rollover and clear/reset controls. |
| Visual guide | Regimen-specific anatomical map, clear callouts and practical support; readable, unclipped print output. |
| Passport | Medicines separately identified, one cycle per page, symptom reporting and urgent-contact guidance; no invented validation status. |
| Contact card and QR | Correct canonical portal, readable print layout, no encoded patient details. |
| Release integrity | Registry, compatibility routes, version tags, protected hashes, generated parity, desktop/mobile journeys and deployable-site CI all pass. |
| Review | Software verification is recorded separately from clinical, pharmacy and patient/PPI approval. |

Batch 1: 00209 modified FOLFOX-6; 00321 CAPOX/XELOX; 00226 weekly paclitaxel.
Each new patient profile retains draft review status. Shared generators read
`data/patient-knowledge/{code}.json`; do not copy indication-specific evidence,
maintenance schedules or medicine warnings from an unrelated regimen.

Build: `node tools/build-patient-knowledge.cjs`, then
`node tools/build-complete-pathways.cjs`. Render PDFs with
`node tools/render-full-suite.cjs` (Playwright and Chromium required; optional
`CHROMIUM_PATH` selects an installed browser). Refresh protected-asset hashes
after intentionally regenerating a protected PDF. Run `npm run test:ci`,
`node tests/full-suite-v0830.e2e.cjs` and the 00568 reference browser regression.

Changing medicines or clinical recommendations requires source review.
Passing CI does not validate clinical content or authorise treatment.
