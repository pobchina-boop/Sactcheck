# SACTCheck v0.84.41 — melanoma contexts and solid-tumour focus

Manual review package, dated 6 November 2026. Apply after the complete v0.84.40 update. Extract the ZIP into the repository root while preserving folders; do not upload the ZIP itself as website content. No commit, push, merge or deployment was performed for v0.84.41.

## Scope

Four existing shared NCCP protocols gain full melanoma services: pembrolizumab 200 mg every 3 weeks (00455), pembrolizumab 400 mg every 6 weeks (00558), nivolumab every 2 weeks (00483), and nivolumab every 4 weeks (00484). Advanced and adjuvant contexts are authored separately for each. The 200 mg pembrolizumab protocol also has a separate, discretionary perioperative stage IIIB pathway: three doses before surgery and fifteen afterwards. This is **four newly completed melanoma catalogue entries and nine new patient contexts**, not nine new medicines.

Five retrospective contexts are reviewed: the retained lung services for those four protocols, and the colorectal nivolumab 3 mg/kg/ipilimumab 1 mg/kg service (00551). The separate colorectal pembrolizumab services remain preserved.

Skin/melanoma now has **9 of 16 catalogue entries with authored suites; 7 remain**. Outstanding: 00551 melanoma, 00535 avelumab, 00102 vemurafenib, 00105 ipilimumab, 00237 dabrafenib, 00373 cobimetinib/vemurafenib, and 00464 dacarbazine. These counts describe authored service coverage, not independent clinical approval or a completed global consistency audit.

## Clinical audit and corrections

All five official HSE/NCCP PDFs were freshly retrieved successfully. Their bytes match the preceding audit: 00455 v16, 00558 v13, 00483/00484 v13a and 00551 v7a. URLs, retrieval dates and SHA-256 hashes are in `validation/skin-melanoma-v08441/source-retrieval.json`; retained source PDFs and earlier detailed immune-toxicity matrices are included in the cumulative v40/v41 evidence.

The principal clinical gap was in pembrolizumab melanoma eligibility. Existing toxicity rules and ECOG/duration limits did not fully encode previous advanced systemic treatment, adult/refractory indication confirmation, stage/resection, initiation timing or perioperative phase counts. New source-linked rules now require review for missing/contradictory history, more than one previous advanced systemic treatment, unconfirmed stage/resection, or stage IIB/IIC initiation beyond twelve weeks after surgery. The surgery window applies at initiation, not every later cycle. The 200 mg perioperative pathway requires explicit stage IIIB eligibility and holds automatic continuation above its 3/15 phase limits. It is not offered as a six-weekly 400 mg schedule.

The new 196 source-derived scenarios pass. The unchanged baseline failed 72 of these new assertions, demonstrating the missing safeguards rather than merely exercising matching code. The existing 183 retrospective immune-toxicity cases also pass, including component-specific hold/stop/restart safeguards. The original toxicity predicates were retained. The wide regression suite caught and corrected a 400 mg rule referencing unavailable perioperative select values.

Nivolumab advanced/adjuvant ECOG criteria remain distinct. Melanoma IV treatment under 00484 remains a 60-minute infusion; the shorter oesophageal/GEJ exception is not imported. IV and subcutaneous doses remain distinct. Adjuvant duration is twelve months rather than an invented fixed number of stamps. Pembrolizumab thyroid checks every 3–6 weeks can fall between six-weekly treatment visits; nivolumab monthly thyroid monitoring and at-least-five-month post-treatment vigilance are retained. No universal scan or tumour-marker interval was invented.

The six primary pivotal trial reports are dated and matched to disease stage, comparator and endpoint. Historical weight-based trial doses are not presented as direct comparisons of current fixed IV or subcutaneous regimens. Perioperative S1801 evidence is explicitly broader than the NCCP stage IIIB note; event-free survival is not labelled overall survival. See `evidence-sources.json` and the context-specific knowledge profiles.

## Full service and presentation

Each new context has assessment linkage, clinician knowledge/evidence, consent, phase-specific supportive care, monitoring, patient portal, OncoWiki, passport, logistics, three-page guide, wallet sheet and complete handbook. All fourteen affected patient routes now have the three-page layout. Page 2 retains the detailed anatomical illustration and eight organ/symptom anchors; page 3 retains front/back 85.6 × 54 mm wallet panels, cut/fold instructions, exact context QR, example contacts and home-screen instructions. The perioperative card records the three preoperative doses and directs postoperative recording to the passport. Paper stamps do not update an online personal record.

The five retrospective profiles retain all original clinical text and anatomical descriptions outside their explicitly migrated summary/layout fields; the preservation comparison is retained. Complete handbooks remain extensive (approximately 31–39 pages); this release does not claim to have finished the future editorial shortening work.

The haematology service tab, dedicated protocol cards and launch paths are hidden; saved haematology preferences fall back to solid tumours. All 377 catalogue protocols remain in source, including fifteen unchanged dedicated haematology protocols; 362 remain visible. Shared solid-tumour protocols and their complete source indications remain intact. Blood-count/haematological-toxicity assessment for solid tumours is preserved. The visibility change is reversible in the single presentation policy module.

## Validation and limits

The final PDF audit covers **142 PDFs, 970 aggregate pages and 56 QR checks**, with zero findings. All fourteen guides have three pages; consent forms and wallet sheets have one page; mirrored PDFs match. Checks include retained text, bounds, anatomy labels, card dimensions, exact QR PNG decoding and QR decoding from rasterized PDFs. Representative schedule, anatomy, card and reference pages were visually inspected. Reference-text verification removes only the physical folio footer when joining page-split paragraphs; it does not remove clinical text.

Managed Chrome checks covered all fourteen patient routes at 390 and 1280 px iframe widths (375/1265 px document area after scrollbars), with zero horizontal overflow, zero broken images and the detailed body map present. Functional checks covered navigation, expansion, PDF download, the 12/12.01-week initiation boundary, evidence context selection, consent routing and phase support. The separate `test:patient-browser` runner could not launch Chromium because its local socket was blocked by the execution environment; an escalation request was rejected by environment policy. Managed-browser checks are reported separately and do not mean that entire automated suite passed.

Release validation uses Node 24.22.1; repository CI specifies Node 20. PDF tools use the recorded WeasyPrint/font configuration. The four handbook chronology print tests passed. `npm run test:ci`, the Pages build and site-security validation passed in both the working checkout and a clean v0.84.40 copy with the ZIP applied. Every packaged application file matched its expected hash before testing, and six internally served routes matched the built bytes exactly. Full logs and outcomes are recorded in `validation/skin-melanoma-v08441/release-validation.json`.

At the final publication check, GitHub main was v0.84.40 at `16544753f4bc9c18114506a1722f8e737f4c1a1b`, and the canonical live release module reported v0.84.40. New v41 sample URLs returned 404 as expected before this manual update. Local `origin` is a recovery history bundle, not current GitHub main. The delta was prepared against the exact delivered v40 package, whose SHA-256 is `04a0e171db683b7de3c84b89a976bb0cabff73ac18fc8770376ee6b698bcf29b`.

Independent consultant, oncology-pharmacy and patient/PPI approval remains pending. Example telephone numbers must be replaced before patient use. Real-device installation, camera scanning and physical printing were not tested. A fresh local recovery snapshot was taken before changes; it is not a separately protected offline backup. The overall cross-tumour consistency audit remains outstanding.
