# v0.84.29 — lung cytotoxic suites and retrospective audit

Checked 2 November 2026. Base: the supplied v0.84.28 update, following GitHub v0.84.27 commit 527b0c12f840f3c4e78f48afc7537d434bb7a037. This is a local release package, not a pushed commit or deployment.

## Scope and audit method

Five new suites: 00284 gemcitabine monotherapy; 00311 IV topotecan; 00587 oral topotecan; 00388 oral etoposide; 00614 carboplatin/vinorelbine. Five retrospective reviews: 00319 carboplatin/oral etoposide; 00232 IV vinorelbine; 00259 oral vinorelbine; 00203 docetaxel; 00222 pemetrexed.

All ten official source documents were retrieved and reconciled. Source-index records retain official URLs, document versions, retrieval methods and PDF/text hashes. Dose tables were inspected visually as well as extracted. The oral etoposide source is now v4; its stable internal protocol ID retains its historic v3 suffix for compatibility. Source conflicts and unspecified boundaries remain explicit review decisions.

The audit covers clinical rules and dose views, knowledge and evidence, consent risks, supportive care, patient information, passport, logistics, timelines, download copies, QR destinations and regression preservation. It does not establish independent clinical approval.

## Findings addressed

- Oral/IV topotecan: remove conflicting renal pathways; preserve the separate oral target and require the current prescribed dose before offering a numeric target. Already-reduced or missing doses trigger review rather than escalation.
- Oral etoposide: three mutually exclusive prescribed schedules, each with its own patient route and QR. No combined all-schedules guide. The source/SmPC discrepancy about the prolonged schedule and rest period requires consultant/pharmacy confirmation; no automatic restart instruction.
- Carboplatin/oral etoposide: correct the previous non-strict interpretation of the source blood-count thresholds. Exact boundary values now require review. Day 1 carboplatin support is separate from later oral etoposide days.
- Gemcitabine: separate baseline, cycle initiation, within-cycle and post-omission rules; preserve strict boundary gaps and the ambiguous printed non-haematological toxicity wording. The pancreatic six-cycle course is separate from open-ended lung treatment. No invented universal imaging or tumour-marker interval.
- Carboplatin/vinorelbine: replace imported oral-monotherapy liver rules and generic count thresholds with its own source. Preserve Day 1 versus Day 8 and IV versus oral support; missing route/day stays unresolved. Capture the 48-hour and 110% creatinine checks and route-specific reference doses.
- Vinorelbine retrospectives: retain route-specific thresholds and escalation histories; add explicit pre-dose FBC review and its source attribution. Preserve breast patient bundles.
- Docetaxel/pemetrexed retrospectives: review serious pulmonary, bowel and skin warnings, vaccination cautions, source/SmPC differences, medication support and monitoring. Docetaxel's lung course cap remains distinct from breast duration.
- Shared-context integration: preserve breast and lung knowledge-base and sustainability selectors when updating a shared regimen. Tests verify context switching. Correct a stale breast-only heading in the new oral-vinorelbine lung knowledge page.
- Reference-dose integration: selecting an alternative uses its actual starting dose. Without the prescribed context, dose output asks for confirmation and suppresses an assumed numeric dose.

## Patient design

Twelve complete routes have a three-page pack: six canonical routes, three oral-etoposide schedule routes and three separate lung contexts. Page 1 gives purpose, schedule, overall treatment, intra-cycle expectations and a before/during/after testing table. Required-by-regimen, conditional and team-agreed checks are distinguished. Page 2 contains the numbered anatomical toxicity visual and urgent guidance. Page 3 contains an 85.6 × 54 mm front/back wallet card with cut/fold instructions, exact treatment QR, cycle record and home-screen shortcut instructions.

Fixed-cycle stamps are used only where the source defines the course. Other cards have a rolling record. The team records completion; a stamp does not approve the next dose. QR codes contain public treatment URLs, not patient details or a digital cycle record. Contact numbers are visibly EXAMPLE placeholders pending local replacement. Additional local resources remain for Paul to supply.

Five patient sections are My treatment, Between treatments, My tests and checks, My treatment passport, and Help and resources. A single menu replaces the section row on narrow screens; urgent help remains outside the selected panels. Without JavaScript, all sections remain readable. The new template is limited to this batch, not a claim that every historical patient portal has been migrated.

## Verification

- 871 integrated source cases: 275 oral/topotecan; 215 gemcitabine/vinorelbine; 381 docetaxel/pemetrexed including retained pemetrexed cases.
- 255/255 CI leaf commands passed, preserving command order, including all historical suites and deployable-site checks. The extracted update also passes all 255 commands on a clean copy of the supplied v0.84.28 baseline.
- 99 PDFs, 194 pages; all canonical/download copies identical; all 48 QR decoding checks passed. All twelve main packs have three pages.
- 5296 pre-existing patient files unchanged; 147 existing files changed within the declared patient scope; no unexpected changes. Shared canonical breast content is preserved.
- Browser observations and limitations are recorded in browser-QA.json. Physical printer output, phone installation and clinical/PPI usability have not been validated by automated checks.

## Coverage and next work

Lung has 53 of 59 catalogue regimens with authored service coverage. The six remaining are 00214 bevacizumab 7.5 mg/kg; 00279 cisplatin/etoposide/radiotherapy (21-day); 00309 weekly carboplatin/paclitaxel/radiotherapy; 00372 nintedanib with docetaxel; 00456 cisplatin/etoposide/thoracic radiotherapy (28-day); and 00561 carboplatin/etoposide/thoracic radiotherapy (28-day). Combined-modality schedules merit the next focused batch, with related retrospective monitoring and patient-timeline review.

The catalogue has 154 canonical records, including two selectors; 152 complete canonical bundles plus 14 separate context bundles give 166 complete patient bundles. These are content-coverage counts, not clinical-approval counts.

## Source audit details

See oral-topo/audit.md, gem-vino/audit.md and doc-pem-retro/AUDIT.md, plus data/lung-cytotoxic-v08429-source-index.json and the retained source-case reports. Independent consultant, oncology-pharmacy and patient/PPI review remains pending.
