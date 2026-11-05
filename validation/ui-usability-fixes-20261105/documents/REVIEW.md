# Independent PDF and preservation verification

Baseline: `4dc3ee85f61f58586f95e7e6e914bd6ed35b15ed`. Checked the actual PDFs in the working checkout after the scoped UI refresh. This audit did not regenerate or change any PDF or application file.

## Results

- 49 references: all 9,559 nonempty authored main paragraphs, second/third-level headings and table cells are present (6,292 established long-block checks plus 3,267 shorter blocks). All 918 reference pages and 1,678 bound-handbook pages have in-bounds text and identical published/compatibility copies.
- All 49 handbooks have the seven expected named contents sections, one correct `Handbook n / total` folio on each page, and no second centered reference-page counter in the bound reference section.
- All **711 original non-reference handbook pages** preserve exact extracted text after removing only the single expected old/new global folio. All 711 also have **pixel-identical 72 dpi renders** across the full page width above the bottom 25-point global-folio margin. This compares original book sections from Git directly with their corresponding new TOC ranges; no current standalone support PDF is used as a substitute.
- All 149 regenerated consent aids match the generator's recorded output/source/baseline hashes. Each remains one portrait A4 page, retains the complete case-sensitive original PDF text, retains the entire source consent text (case normalized only for CSS text-transform), stays within page bounds, has the corrected `#526975` caption color and an identical compatibility copy.
- 1,098 existing guide, wallet-sheet and passport PDFs are unchanged against Git. All 316 tracked image files are unchanged, including the detailed anatomical illustrations. Direct byte comparisons covered 1,102 retained PDF/anatomy files.
- All 49 three-page packs and 49 one-page wallet sheets retain the expected anatomy explanations, schedule and monitoring text, mirror copies and page counts. **147 actual QR decodes** passed: 49 PNGs plus 49 pack and 49 wallet PDF rasters. Each is the exact regimen-specific `https://sactcheck.com/patient/<route>/knowledge.html` destination.
- **No failures** in these independent checks. Full per-route data: [independent-document-audit.json](independent-document-audit.json).

## Actual visual inspection

The following actual PDF pages were rendered at 144 dpi and opened for visual inspection:

- 00555 handbook pages 13 and 14, both baseline and refreshed copies: the new pump band says `48 hours; disconnect as arranged`, matching the authored 48-hour schedule. The delayed-diarrhoea label and instruction stay in the same row; the continued chart repeats the day axis; the obsolete centered reference counters are absent. No clipping or lost chart instruction was seen in these pages.
- All three pages of the final 00555 patient pack: the treatment overview, detailed anatomical toxicity drawing with all eight numbered callouts, urgent-help information, front/back wallet panel and QR are retained and readable at the rendered size. The underlying PDF is byte-identical to baseline.
- The baseline and final 00568 one-page consent aid: all risk columns, fields, confirmation checkboxes, signature lines and governance text are visible. Signature/footer captions are darker. The refreshed renderer uses a different installed font and has slightly different vertical text geometry; it is **not** claimed to be pixel-identical to the baseline.

Representative evidence:

| Document | Before | After |
| --- | --- | --- |
| 00555 handbook p13 | [PNG](00555-handbook-page-13-before.png) | [PNG](00555-handbook-page-13-after.png) |
| 00555 handbook p14 | [PNG](00555-handbook-page-14-before.png) | [PNG](00555-handbook-page-14-after.png) |
| 00555 pack overview | [PNG](00555-guide-page-01-before.png) | [PNG](00555-guide-page-01-after.png) |
| 00555 pack anatomy | [PNG](00555-guide-page-02-before.png) | [PNG](00555-guide-page-02-after.png) |
| 00555 pack wallet | [PNG](00555-guide-page-03-before.png) | [PNG](00555-guide-page-03-after.png) |
| 00568 consent | [PNG](00568-consent-form-page-01-before.png) | [PNG](00568-consent-form-page-01-after.png) |

## Limits and actual differences

New reference pages use the installed Liberation/Noto fonts rather than the previous Nimbus/DejaVu fonts. They also contain the intended semantic chronology layout and corrected labels. Fresh reference pages therefore have different line wrapping and pagination; 18 handbook routes changed length, with 1,693 total baseline handbook pages becoming 1,678. The 711 retained non-reference pages remain exact as described above. Full route page-count differences are recorded in the JSON.

The 9,559-block comparison uses NFKC/alphanumeric normalization, extending the established reference verifier to also cover all nonempty blocks shorter than 25 normalized characters; the preserved non-reference section comparison uses exact extracted text and does not normalize words, numbers, punctuation or whitespace. Consent comparisons normalize only whitespace, soft hyphens and standard Unicode ligatures, and preserve case for old/new PDF comparison.

Only the representative rendered pages listed above were visually opened in this independent pass; automated checks covered the full affected set. Actual printer output, camera scanning, real-device PDF accessibility/reading order and live QR destination responses were not established by this local document audit. Consent source footer metadata still says v0.84.27, as it did before; it was retained rather than silently rewritten during this UI-only refresh. This report does not establish clinical source validity, production deployment or release readiness.
