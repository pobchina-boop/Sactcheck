# v0.84.35 PDF visual review

Review date: 5 November 2026. Scope: the ten routes in `../scope.json` only.

The release retains the established detailed anatomical artwork, numbered organ anchors, connectors and regimen-specific descriptions. The five retrospective profiles retain exactly the same anchor identifiers, order and coordinates as the pre-batch snapshot; `anatomy-preservation.json` records that comparison. Text updates reflect the current authored profiles, and the verifier checks their complete retention in both the concise guide and full reference.

## Findings corrected during review

1. The initial guide render clipped the final lines of the hormonal/neurological warning on 00551 and 00900, and the cardiac warning on 00890. PDF text extraction still contained those lines, so a page-boundary/text-retention pass did not prove they were visually readable. The scoped v0.84.35 print stylesheet increases symptom-card space while preserving every word, the 9.5pt type size, and the 146mm artwork/pin/connector geometry. No historical stylesheet was changed. A new layout assertion checks each card's text boxes against its padded bottom and right edge.
2. The two-line phase note on the 00551 and 00900 wallet backs pushed the final reminder onto the cut border. The fix reduces only record-block and paragraph spacing. It preserves all text, font sizes, QR size, record height and the 85.6 × 54mm panel dimensions. The wallet validation now checks content clearance as well as physical size.
3. Final phase-support regeneration exposed an instruction duplicated with only a whitespace difference (`below3` / `below 3`). The source owner normalized and deduplicated it. The affected 00447/00448 phase PDFs and their exact bound-handbook pages were refreshed, preserving every other handbook page. A new assertion checks whitespace-normalized bullet uniqueness and retention of each authored phase instruction in its PDF. The two `late-support-refresh*.json` files record the final source/PDF hashes.

The relevant source stylesheet and wrapper hashes are recorded for every final handbook render in `handbooks.json`. A source-hash check rejects PDFs rendered before a later HTML, profile, stylesheet or wrapper change.

## Visual evidence

Individually inspected representative renders include:

| File | Inspection |
| --- | --- |
| `00551-guide-p1.png` | Treatment phases and monitoring table remain distinct and readable. |
| `00551-guide-p2.png` | Full hormonal/neurological warning fits; artwork and all eight anchors retained. |
| `00890-guide-p2.png` | Cardiac warning fits; full eight-organ anatomy and urgent-action block retained. |
| `00900-guide-p1.png` | Combination-to-maintenance schedule, duration and follow-up are visible on one page. |
| `00447-guide-p2.png` | Retrospective anatomical layout retains its established anchors and descriptions. |
| `00890-reference-anatomy.png` | Full-reference anatomical page retains all detail without fragmented cards. |
| `00551-guide-p3.png` | Front/back wallet, record, regimen QR, cut/fold instructions and phone instructions. |
| `00448-consent-form-p1.png` | One-page consent form retains drug-specific material risks and signature space. |
| `00448-handbook-p1.png` | Seven sections appear in logical order with correct page references. |
| `00447-support-fourteen_day_cycle-p1.png` | Final phase instructions fit on one page with the normalized instruction present once. |
| `00448-support-fourteen_day_cycle-p1.png` | Final phase instructions and regimen-specific supportive prescription fit on one page. |

`all-anatomy-contact-sheet.png` provides an overview of all ten guide anatomy pages. Automated checks cover all scoped PDFs; representative visual inspection is not a claim that every one of the 794 pages received individual human review.

## Automated evidence

- 106 PDFs, 794 pages; nonempty pages, text within page boundaries and byte-identical `patient/` / `docs/patient/` mirrors.
- Ten three-page guides and ten one-page A4 wallet sheets.
- Forty QR checks: both QR PNGs plus QR codes rasterized from each guide and wallet PDF. Destinations match the exact regimen route and intended information page.
- All authored full-reference paragraphs, table entries, section headings and anatomical descriptions retained.
- Ten complete handbooks with seven ordered sections, correct contents and embedded support sheets. Length varies from 35 to 45 pages because full content is retained.
- Five retrospective anatomical pin maps preserved exactly.
- Anatomy-card and wallet-panel text-fit checks supplement PDF text extraction.

See `verification.log`, `all-pdf-validation.json`, `handbook-validation.json`, `wallet-dimensions.json`, `qr-validation.json`, `anatomy-card-geometry.json` and `handbooks.json` for the current machine evidence.

## Limits

One editorial redundancy remains in the 00448 phase-support sheet: the three short bullets about panitumumab premedication, the delayed-diarrhoea plan, and skin/electrolyte monitoring also appear together in a later combined bullet. The instructions agree; no information is missing or contradictory. This is recorded for later content refinement, and the current PDF faithfully matches the frozen authored source.

This evidence verifies locally generated files. It does not establish deployment or successful responses from new canonical URLs. Decoding a QR does not verify a phone camera journey. Physical printing/cutting, real iPhone/Safari and Android/Chrome installation, and independent clinical/pharmacy/PPI review remain unverified here.

The separate Playwright runner could not launch Chromium because the runtime returned a socket `EPERM` error. Its result records zero executed browser states rather than claiming a browser pass. See `../browser/results.json`. The parent integration task may add independent browser evidence separately.
