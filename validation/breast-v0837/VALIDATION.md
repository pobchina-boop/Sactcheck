# v0.83.7 validation record

Base: pushed v0.83.6, commit `2c0f2a5965bc20be682eeb7309cecd52e1eac427`. Sources and implementation checked 17 October 2026.

| Check | Observed result |
| --- | --- |
| Source-derived engine cases | 139 passed across five regimens |
| Actual browser decision cases | 34 passed: 17 desktop and 17 mobile |
| Full patient and clinic journeys | 10 passed: five regimens at 1440 and 390 px |
| Additional service checks | 42 passed: filtering, search/reset, both interface modes, sustainability and standalone maps |
| Patient PDFs | 35 documents / 80 pages; no empty pages or text outside the page; identical compatibility copies |
| Visual review | All delivered PDF pages inspected in rendered contact sheets, with detailed views of the complex consent, passport and map layouts; final map pages rechecked after pagination fixes |
| QR decoding | 20 passed: five PNGs and printed codes from every guide, passport and contact card |
| Clinical PDF exports | Two actual browser exports checked for regimen identity and release: ribociclib QT and severe immune pneumonitis |
| Protected patient resources | All 31 prior packages outside this batch retain their registered base hashes; three breast packages intentionally upgraded, two added |
| Complete repository CI | Passed: release gate, security, protocol build, historical tests, Pages build and deployable route/PDF integrity |
| Clean-base drop-in replay | Passed on the final drop-in; details in `overlay-result.json` and `overlay-verify.log` |

## Interpretation

These are synthetic software cases entered through actual browser controls, not real-patient outcomes or an independent human manual audit. Selected thresholds, source gaps, missing inputs and competing components were checked; this does not exhaust every clinical combination or establish a clinical accuracy percentage.

The final browser record replaces the original eight 00857 cases with ten replayed cases after adding the weekly-visit immune-toxicity review guard. `browser-00857.log` documents that replay. Other case inputs and outputs remain unchanged. Active holds were checked to avoid a numeric dose being presented as ready to administer.

Patient journeys exercised the eight symptom targets and loaded anatomy image, date-free cycle graph, phase information, practical logistics, evidence context, consent clearing, and actual workflow destinations for knowledge, consent and supportive care. Shared maps were checked in clinician and patient views. Additional checks exercised every setting/receptor intersection for the selected five, search within active filters, breast/global reset, HER2-positive regimens within the HR-positive/HER2-positive view, patient mode, all five sustainability routes and standalone maps on desktop and mobile. Mobile catalogue overflow was found and fixed.

The one-page consent, two-page guide and five-page passport counts are retained. The five-medicine 00857 passport uses recording pages for its separate phases. The longitudinal maps have a complete landscape stage table on page one and readable explanations over two further pages. The maps require no dates and do not record booked or completed tests.

## Source review and limitations

`source-map.json` records five NCCP source versions, URLs, before/after rule counts and page/table citations for all 234 current rules. The shared map data records the international monitoring sources. Direct binary NCCP PDF requests were blocked; official web-extracted text and indexed page/table material were reviewed. Complete visual source-table verification and original file identity remain limitations.

Declared issues include TCHP count equality/decimal boundaries and component-delay wording; 00857 organ-function gaps and legacy grading terminology; ribociclib NCCP versus current UK manufacturer QT restart instructions, ILD wording and indication/eligibility differences; and conditional guideline cardiac surveillance that must not silently replace NCCP scheduling. These are visible review prompts, not fabricated single-dose answers.

The other breast catalogue classifications are navigation metadata based on existing indications; they have not all received a fresh rule audit. Trial benefits are framed for their studied populations and treatment strategies. No genomic-score triage is active.

Independent consultant, oncology-pharmacy and patient/PPI review remain pending. `clinical_use_authorised` remains false. No commit, push or deployment was performed by this task.

## Reproduce

- `npm run test:ci`
- `SACT_WRITE_VALIDATION=1 node tests/clinical-audit-v0837.test.cjs`
- `node tests/clinical-audit-v0837.e2e.cjs`
- `node tests/suite-integration-v0837.e2e.cjs`
- `node tools/build-breast-journeys.cjs --check`
- `node tools/build-patient-knowledge.cjs --check`
- `node tools/build-complete-pathways.cjs --check`
- `node tools/build-breast-supportive-care-v0837.cjs --check`
- `python tools/verify-breast-pdfs-v0837.py`

Browser replays and PDF generation require Playwright and Chromium. Set `SACT_PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` if these are not in the standard locations. PDF verification uses PyMuPDF, Pillow and zxing-cpp. All generated resources are included; regeneration is not required to apply the update. If content is regenerated, run `node tools/build-breast-v0837-pdfs.cjs`, inspect the PDFs and deliberately refresh the protected hashes.
