# v0.83.6 validation record

Base: v0.83.5, commit `da9974b8674e8160701f831f94af2f2086dd2e11`. Source review and implementation: 16–17 October 2026.

| Check | Result |
| --- | --- |
| Source-derived engine scenarios | 534 passed across ten regimens |
| Actual browser decisions | 42 passed: 21 desktop and 21 mobile |
| Full patient and clinic journeys | 20 passed: all ten at 1440 and 390 px |
| Additional service checks | 24 passed: 12 sustainability, four card-context and eight radiotherapy surface checks |
| Static PDFs | 61 documents, 121 pages; no empty pages or out-of-page text; compatibility copies identical |
| Visual PDF inspection | 91 rendered page samples inspected across eight contact sheets, including every document's first page and relevant second pages |
| QR decoding | 40 passed: ten PNGs and printed codes from all ten guides, passports and contact cards |
| Browser-generated clinical PDFs | Six exported assessments checked for release, regimen identity and selected current-level/component outputs |
| Existing protected resources | 24 prior regimens / 180 registered files retain their base hashes; 34 pipelines are now registered |
| Full repository CI | Passed: release gate, security checks, protocol build, complete historical test suite, Pages build and deployable-site integrity |
| Clean committed base plus drop-in | Passed: full `npm run test:ci` on the clean v0.83.5 commit plus these drop-in files; exit code 0 (`overlay-verify.log`) |

These are synthetic software cases entered through actual browser controls, not real-patient observations or an independent human manual audit. They cover selected source boundaries and high-risk scenarios, not every possible clinical combination. Source-derived expectations were specified from NCCP tables and labelled supplementary product information. Passing software tests does not establish clinical accuracy as a percentage or superiority to human review.

## What was exercised

The clinical cases cover RAS and indication context, cetuximab skin occurrence/recovery matrices, infusion reactions and early reactions, respiratory and ocular symptoms, electrolytes, baseline/current/nadir blood counts, recovery windows, renal/hepatic thresholds and equality gaps, DPD, mucositis, diarrhoea, neuropathy, current component dose levels and competing component actions. Ranges and source conflicts stay visible without a fabricated single dose. Omitted domains remain explicitly unassessed.

The main browser record contains 42 final cases. The six 00207 cases were replayed after consolidating the indication selector, and replace their earlier results. `browser-00207.log` records that replay. Full journeys checked eight distinct anatomical targets with the image loaded, date-free patient portal/reference graphs, six access/visit steps, evidence context, clearing a consent draft, and clinic knowledge, consent and supportive-care destinations.

Additional checks opened the actual sustainability link for every regimen on desktop, with representative mobile replays for 00207 and 00210. They verified regimen identity, source-supported delivery information and unquantified environmental fields. Both indication contexts were checked for 00207 and 00210 at both widths. The 00207 radiotherapy graphic was checked on portal, reference, consent and standalone timeline at both widths. Browser work found and fixed lost sustainability context and mobile overflow from long source URLs.

PDF text bounds were checked on all 121 pages. Visual inspection sampled all 61 first pages plus 30 relevant second pages. The five-page passports use the established repeated cycle-page layout. The QR checks decoded rendered printed pages using an independent barcode decoder. Browser screenshots and contact sheets were used internally and are excluded from the distributed update.

## Source limitations and unresolved clinical questions

See `source-map.json` for exact regimen versions, URLs, rule-level page/table citations and changes. Direct binary NCCP PDF requests returned HTTP 403. Official web PDF text and indexed page/table extracts were used; this does not establish downloadable file identity or complete visual verification of every source table. Reconfirm the current official PDFs before clinical adoption.

Declared issues include 00330 weekly-cetuximab restart values that conflict with the diarrhoea table; FOLFIRI recovery intervals; 00328 severe-renal exclusion alongside an adjustment note; FOLFOX-4 Day 2 folinic wording; regimen-specific renal differences; exact hepatic/renal equality gaps; source-specific legacy diarrhoea grades; historical cetuximab licensing footnotes versus current EMA information; and national versus regimen-PDF emetogenic classifications. They remain explicit reviewer questions.

Independent consultant, oncology-pharmacy and patient/PPI review remain pending. `clinical_use_authorised` remains false. No commit, push or deployment was performed by this task.

## Reproduce

- `npm run test:ci`
- `SACT_WRITE_VALIDATION=1 node tests/clinical-audit-v0836.test.cjs`
- `node tests/clinical-audit-v0836.e2e.cjs`
- `node tests/suite-integration-v0836.e2e.cjs`
- `node tools/build-patient-knowledge.cjs --check`
- `node tools/build-complete-pathways.cjs --check`
- `node tools/build-cetuximab-support-v0836.cjs --check`

Browser replays and PDF generation require Playwright and Chromium. `SACT_PLAYWRIGHT_MODULE` can select an installed Playwright module and `CHROMIUM_PATH` a local executable. To regenerate printable resources, use `node tools/build-colorectal-v0836-pdfs.cjs`, then review the files and deliberately refresh protected hashes. Printed files are already included; regeneration is not required to apply the drop-in.
