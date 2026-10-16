# Full-suite regimen standard

Use NCCP 00568 as the design and interaction reference. Expand three regimens
per batch. A batch is complete only when each applicable service below is
connected to the correct protocol and its limitations are visible.

| Service | Acceptance requirement |
| --- | --- |
| Identity and source | NCCP code/version, indication and current official source agree across surfaces. |
| Clinical assessment | Start each batch by auditing the decision map against that exact published NCCP regimen, including eligibility, boundaries, timing, components and dose levels. Correct discrepancies before completing the suite; missing inputs remain unassessed and source ambiguities prompt review. |
| Clinical knowledge and evidence | Selection, administration, monitoring, supportive care, linked trial context and patient resources are accessible. |
| Consent | Correct regimen opens from the clinic; printable medicine-specific risk aid includes individual benefit, alternatives and discussion space. |
| Supportive care | Regimen-derived plan and printable PDF work; route and phase exceptions are preserved. |
| Interactions and extravasation | Medicines resolve consistently; oral medicines do not receive infusion guidance; unmapped data remains explicit. |
| Other suite modules | Existing applicable services, including sustainability, remain accessible; available evidence is not overstated. |
| Patient reference | Substantive plain-language chapters, practical actions, FAQs, medicine mechanisms, sources and contextualised evidence. |
| Cycle graph | Use the 00568 Day 1–X axis, colour bands, broad symptom patterns and source context. Show the full graph on the portal and knowledge page without date entry or schedule selection; state alternative prescribed schedules in plain text. |
| Chemotherapy/radiotherapy relationship | Where RT is part of the pathway, show aligned treatment rows on a shared course axis: concurrent overlap or clearly ordered phases. Distinguish weekly/cycle timing from the whole course. Require no dates, do not invent surgery intervals, and update previously completed applicable knowledge, patient and printable surfaces. Use the shared treatment-relationship renderer. |
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

Batch 2 (v0.83.2): 00227 FOLFIRI; 00449 FOLFIRI + bevacizumab; 00446 modified FOLFOX-6 + bevacizumab. Shared port/PICC and pump education also added to 00209.

Colorectal is the first tissue library being completed to this standard. Candidate inventory: `data/colorectal-suite-progress-v0832.json`; source catalogue reconciliation is required before any completeness claim. Eleven colorectal software packages are expanded as of v0.83.5; independent clinical/pharmacy/PPI review remains pending.

Batch 3 (v0.83.4): 00216 capecitabine; 00586 capecitabine + radiotherapy; 00623 bevacizumab + capecitabine.

Batch 4 (v0.83.5): 00225 panitumumab; 00447 panitumumab + modified FOLFOX-6; 00448 panitumumab + FOLFIRI. Clinical and patient knowledge updates are required in every batch, together with consent, practical support and source-linked evidence. Retrospective course graphics cover 00586 and the existing 00655 durvalumab knowledge/patient materials. Provide copyable commit summary and description with each release.

Future breast patient timelines and monitoring logistics must consult `docs/BREAST_PATIENT_REFERENCE_MATERIALS.md` and the privately retained consultant decks.
