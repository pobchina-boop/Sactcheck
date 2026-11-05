# SACTCheck v0.84.37 — neuroendocrine full-suite review package

Prepared 5 November 2026. Manual incremental update **after v0.84.36**. No commit, push, merge or deployment was performed.

## Scope and baseline

This completes the four-regimen NET catalogue scope: the three entries on the NCCP neuroendocrine regimen page plus pancreatic NET CAPTEM from the oral/GI catalogue. There are five NET indications across four regimens. This is not a claim that all neuroendocrine cancer care, somatostatin-analogue prescribing, NEC, all grade-3 NETs, lung NETs or molecular/site-overlap regimens have been completed.

The preserved local baseline is the previously prepared v0.84.36 manual update. Remote main was verified as **cd4e04061195cbe794c54498c92ad4db35961143 (v0.84.35)**. The local Git HEAD is historical and is not the release baseline. Apply v0.84.36 before this ZIP; do not infer that v0.84.36 is already published from this report.

| NCCP code | Suite | Current primary source | Passing source cases | Rules exercised |
|---|---|---|---:|---:|
| 00320 | Everolimus — explicit NET context | NCCP v6, 24 February 2026 | 568 | 90 |
| 00327 | Sunitinib 37.5 mg — pancreatic NET | NCCP v5, 15 September 2025 | 339 | 59 |
| 00505 | Capecitabine + temozolomide (CAPTEM) | NCCP v5, 11 November 2025 | 653 | 86 |
| 00642 | Lutetium-177 oxodotreotide (Lutathera/PRRT) | NCCP v2 | 405 | 86 |
| **Total** | **Four suites / five NET indications** | **All four official PDFs retrieved and retained** | **1,965** | **321** |

Source URLs, document hashes, page/table citations, baseline comparisons and individual case results are under `validation/neuroendocrine-v08437/`. Passing software cases are not independent clinical authorisation. Pre-change failing-case totals include missing metadata, provenance and safeguards; they are not counts of distinct clinical errors.

## Main audit findings and changes

**Everolimus:** expanded blood-count, febrile-neutropenia, stomatitis, pneumonitis, metabolic, recurrence and recovery pathways. Hepatic dose branches require the relevant treatment context and dose history; reduced-dose patients cannot silently return to the standard dose. Removed an unsupported generic liver-test interruption rule. The shared kidney-cancer indication remains intact, while the new NET patient suite requires explicit NET routing.

**Sunitinib:** corrected the first grade-2 hand–foot reaction pathway, recovery/history handling, hypertension and cardiac-function decisions. HFS grading ends at grade 3. The NCCP/EMA severe hepatic-impairment disagreement is visible for specialist review. The clinician schedule now shows continuous 37.5 mg once daily without a scheduled off-week or an unconditional escalation ladder.

**CAPTEM:** distinguished pretreatment from treatment-day/restart counts, nadirs, recurrence, DPD and organ-function assessment. The regimen remains six planned 28-day cycles: capecitabine Days 1–14, temozolomide Days 10–14, neither on Days 15–28. Source-table and renal-dose uncertainties require specialist review. Real dose-renderer checks prevent narrative percentages becoming an unintended numerical prescription. The oral antiemetic plan follows the temozolomide days rather than the entire 28-day cycle.

**PRRT:** expanded eligibility, SSTR, marrow, renal, hepatic, recovery, recurrence, interval and prior-activity pathways. The below-30 and 30-to-below-40 renal branches remain distinct. Overlapping platelet thresholds and the interpretation of a prolonged interval are flagged rather than silently resolved. The supportive-care plan specifies the 5-HT3/amino-acid sequence and the corticosteroid restriction. Displaying the standard 7,400 MBq schedule does not override hold, stop or specialist-only restart decisions.

**Clinical interface:** browser review found tumour differentiation/grade being mistaken for toxicity grade. Indication options no longer acquire generic CTCAE prose, and NET differentiation appears under treatment context without drug-toxicity attribution. Eighty-seven focused UI checks protect this distinction and genuine toxicity grading.

## Complete service consistency

Each row below has an authored clinician knowledge/evidence profile, consent support, source-specific monitoring, phase/support plan, patient portal, full OncoWiki, passport, three-page guide, front/back wallet card and complete printable handbook.

| Patient route | Schedule and monitoring | Anatomy | Passport/card record | Three-page guide | Reference PDF | Complete handbook |
|---|---|---|---|---:|---:|---:|
| `00320/neuroendocrine` | Continuous daily; source-required safety checks distinguished from individual imaging/markers | 8 detailed anchors | Ongoing treatment/review record | 3 pages | 20 pages | 38 pages |
| `00327` | Continuous daily; no routine off-week | 8 detailed anchors | Ongoing treatment/review record | 3 pages | 19 pages | 37 pages |
| `00505` | Separate capecitabine/temozolomide days and rest interval | 8 detailed anchors | Six planned cycles | 3 pages | 22 pages | 40 pages |
| `00642` | Four administrations, usually eight weeks apart; individual SSA/radiation plan | 8 detailed anchors | Four administration stamps | 3 pages | 27 pages | 47 pages |

The three-page structure is preserved: schedule/tests/between-treatment expectations; detailed anatomical toxicity anchoring; wallet panels, QR, cut/fold instructions, contacts and webapp instructions. Wallet panels are 85.6 × 54 mm at 100% A4 print scale. Phone numbers are explicitly labelled examples and must be replaced before patient use. The QR opens regimen-specific OncoWiki information; paper stamps do not update an online cycle record.

All existing patient suites are retained. Registration checks prove the original 174 entries plus exactly these four additions. The protocol catalogue remains 377 entries; the added CAPTEM NET context increases the tissue review contexts from 456 to 457. Shared presentation changes are versioned and bounded; unrelated patient/PDF bytes remain subject to the existing provenance chain.

## Use of the supplied reference

The uploaded **NCCN Guidelines for Patients: Neuroendocrine Tumors (2026), 80 pages** informed original patient education and care-record prompts. The passport now records primary site, differentiation, grade/Ki-67, stage, functioning status, SSTR findings, goals, treatment plan, tests, symptoms, questions and personal priorities. PRRT has additional coordination/precaution fields.

The OncoWiki explains grade versus stage, NET versus NEC, receptor expression versus hormone secretion, conditional imaging/markers, nutrition, symptoms, support and shared decisions. No universal CT/MRI, PET, chromogranin-A, 5-HIAA or hormone schedule has been invented. NCCP sources control the Irish regimen rules; the US patient guide does not expand indications or prescribing authority.

A page-to-content reference map is retained. Original wording and the established SACTCheck anatomical illustrations are used. The uploaded PDF/artwork is not redistributed and no NCCN endorsement is claimed. CAPTEM EMA supplementary information was reviewed through web retrieval; a fresh full supplementary EMA PDF download was rate-limited. Its current primary NCCP PDF was retrieved and retained.

## Validation and remaining review

- 6,820 patient files outside the NET scope and 378 other protocol JSON files (including templates) match the preserved v0.84.36 baseline byte-for-byte.
- Twenty-four internal HTTP routes return 200 with contents matching the built release, including all four portals, OncoWiki pages, guides, handbooks and QR PNGs. The built catalogue matches all 377 source entries.
- All 1,965 NET cases pass; all 321 encoded rules are exercised, with threshold, stage, recurrence/history and dose-output safeguards.
- Forty unique PDFs, 80 matching primary/compatibility copies, 324 pages, 16 exact QR decoding checks, zero automated PDF findings.
- Visual inspection includes every guide, wallet and consent page, all 88 reference pages in contact sheets, and targeted full-size anatomy/passport/handbook pages. It is not a claim of full-size reading of every handbook page.
- All four portals were inspected at desktop and 340 CSS-pixel width using ordinary browser zoom. No horizontal document overflow or broken loaded images was observed. CAPTEM navigation, expanded anatomy and an actual guide download were exercised. Everolimus context routing and PRRT renal boundaries were checked directly.
- Local JavaScript validation used Node 24.22.1; repository CI specifies Node 20. A separate Node 20 run was not performed here. PDF renderer/font versions and hashes are retained in the QA report.
- Full automated browser execution is **blocked** by the runtime Chromium socket restriction. Browser developer-tools emulation is also restricted; no bypass was attempted. Narrow-width checks are not real-device testing.
- Real iPhone/Safari and Android/Chrome installation, physical printing and camera scanning remain unverified. QR destinations are correct encoded canonical paths, but these new routes are not verified live because this package has not been deployed.
- Long references retain some whitespace, including a sparse explanatory continuation before the dedicated anatomy page in CAPTEM/PRRT. The clinical text is retained; handbook concision remains a later editorial refinement.
- Independent consultant, oncology-pharmacy and patient/PPI review remains pending. Local test success is not approval for routine clinical use.
- All repository CI stages passed on the clean-applied package. The run was resumed at the provenance stage after populating the disposable clone’s initially empty Git index; no application change or assertion was bypassed. This was not a single uninterrupted exit-zero CI invocation. Full logs and exact status are in `validation/neuroendocrine-v08437/release-validation.json`.

A dated pre-edit recovery snapshot preserves the starting source, Git history, refs, patches and checksums. It is on the same cloud filesystem; no separately protected offline backup was created by this task.

## Applying the manual update

1. Confirm that the v0.84.36 files have been applied to your repository. This v0.84.37 ZIP is incremental, not a replacement for that earlier ZIP.
2. Extract the ZIP and copy its contents into the repository root, preserving the folder structure. Upload the extracted files rather than the ZIP itself.
3. Review the diff, use `V08437_COMMIT_MESSAGE.txt`, then commit and push using your usual process.
4. After your deployment, verify the version and the four patient routes, PDF downloads and QR destinations. This report does not certify a deployment.
