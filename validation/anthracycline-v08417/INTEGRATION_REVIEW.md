# v0.84.17 integration and source review

Date: 23 October 2026. Baseline: v0.84.16 / 70503e943eaed24817b4da9b04d05d4b6360c82f.

This is software/source reconciliation, not independent clinical validation. Clinical use, consultant approval, oncology-pharmacy approval and patient/PPI review remain pending. All ten protocols retain `clinical_use_authorised: false`. The feasibility-build notice remains visible on the homepage and assessment screens.

## Source and regimen distinctions

| Code | Current NCCP PDF | Principal reconciliation |
| --- | --- | --- |
| 00262 | EC90 v8 | Four 21-day adjuvant cycles; ANC 1 threshold; source boundary/overlap review; epirubicin/cyclophosphamide component actions |
| 00263 | EC75 v7 | Metastatic indication; no invented fixed course; same family renal/hepatic boundaries checked independently |
| 00265 | FEC100 v7 | Six cycles; Day 1 versus delayed/nadir counts; previous FN occurrence; DPD; absolute AST for 5-FU versus ULN for epirubicin; no concurrent radiotherapy |
| 00269 | FEC50 v8 | Metastatic indication, no universal cycle cap; FEC-specific thresholds and exclusions, not copied EC bands |
| 00423 | AT 50/75 v5 | Up to six cycles; baseline versus ongoing counts, baseline neuropathy exclusion, component-specific hepatic patterns and docetaxel dose context |
| 00250 | TC v9 | Retain earlier source-correct rules; unresolved planned tests, rationale/evidence and non-anthracycline pathway |
| 00252 | AC v7 | Four-cycle AC distinct from an AC→taxane sequence; source thresholds retained; lifetime exposure and unresolved tests surfaced |
| 00260 | AC→weekly paclitaxel v7 | Separate AC and weekly taxane support; preserve its own hepatic table; explicit transition monitoring |
| 00278 | Dose-dense AC→paclitaxel v7 | Two 14-day phases; G-CSF required with all cycles but product/dose/days follow local prescription |
| 00432 | AC→weekly paclitaxel/trastuzumab v5 | Three support phases; reassess before trastuzumab, continue 12-week cardiac clock; NCCP transition to q21-day trastuzumab after 12 weekly combination doses |

The official retrieved PDFs and extracted text were used for table review. `sources/manifest.json` retains original/final URLs, retrieval date, bytes and SHA256. Research source files are excluded from the distributable ZIP. Stable legacy protocol IDs are retained where the current PDF version changed, with canonical/current version metadata supplied separately.

### Deliberately unresolved source boundaries

- EC platelet value exactly 100 and the overlapping cyclophosphamide CrCl 20 rows require review. FEC's cyclophosphamide row places CrCl 20 in the 75% band.
- EC and FEC epirubicin bilirubin 51 overlaps are surfaced. FEC uses an AST break at 4×ULN; EC uses 5×ULN. They are not interchangeable.
- FEC 5-FU uses absolute AST U/L. Exact AST 180 and bilirubin 85 are not assigned by the printed strict inequalities; review rather than inventing a boundary. One AST field now supplies both the absolute value and the ULN calculation.
- FEC post-delay ANC 1.49–1.5 and unlisted later occurrences are not rounded or extrapolated. Prior FN episode number is not a CTCAE grade.
- AT doxorubicin bilirubin 50–51 and LVEF exactly 50 require review. Discordant liver rows need component-specific assessment. Docetaxel 75 mg/m² is already the AT starting dose. Grade 4 skin toxicity is not assigned the grade 3 reduction automatically.

## Evidence and audience

Ten clinician profiles include treatment setting, line/prior therapy, selection factors, alternatives and trial applicability. The evidence audit retains named trial, population, comparator, endpoint, timepoint and primary source. EC90 has an explicit direct-evidence gap rather than numbers borrowed from EC75. FEC100's ten-year analysis distinguishes Wilcoxon from log-rank results. AT displays time to progression, not a falsely relabelled PFS endpoint. AC's TC comparison retains TC as the intervention. E1199, CALGB9741 and trastuzumab results are limited to their actual comparisons and populations. Cross-trial arm rates are not ranked.

Patient material explains treatment selection without numerical survival/response comparisons. No automatic Oncotype thresholds or treatment selection are introduced.

## Longitudinal and supportive-care boundaries

The maps use relative milestones without patient dates. NCCP requirements and supplementary ESC/NICE/ESMO guidance are attributed separately. Echo timing is risk adapted; high-risk examples are not presented as a universal schedule. The HER2 clock continues across chemotherapy cessation and schedule changes. Early-stage routine distant-recurrence imaging is distinguished from metastatic response assessment. DEXA relates to endocrine/bone-risk indications and tumour markers are adjuncts, not universal clearance tests.

The map is educational: it does not book tests, detect missed tests or prove a result was reviewed. The team must own ordering, review and follow-up. Local contact numbers remain placeholders.

The NCCP V8 dedicated anthracycline/cyclophosphamide antiemetic row is reflected in AC, EC and FEC support. Its subsequent days do not silently inherit the generic high-risk dexamethasone course. TC/AT reconcile antiemetic dexamethasone with docetaxel premedication. Paclitaxel and trastuzumab-only continuation have separate plans. Support sheets are clinician drafts, not issued patient prescriptions. All require individual prescribing/pharmacy review.

## Verification record

- `source-cases.cjs`: 179 independent source-derived scenarios across all ten protocols. Baseline 46 passed / 133 failed; updated implementation 179 passed. These include new coverage and boundary checks; 133 failures are not 133 distinct clinical errors.
- Existing AC 526 and taxane 116 source cases: pass, preserving source-specific retrospective behaviour.
- `tests/full-suite-v08417.test.cjs`: real knowledge-loader integration, evidence rendering, single-entry AST unit mapping at/around the source boundary, phase selectors, draft links, patient audience separation, dose/schedule presence, PDF copies and scoped hashes.
- Live browser form checks: FEC Day 1 ANC 1.2 triggers delay; AST 181 U/L triggers 5-FU contraindication and the separate epirubicin rule from one entry; complete DPD deficiency triggers 5-FU contraindication. Omitted domains remain explicitly unassessed. Further browser checks are in `browser-validation.json`.
- PDFs: 84 documents / 154 pages, no empty pages or text outside page bounds; compatibility copies identical; all 40 QR decode checks passed. Representative guides, consent forms, phased passports, supportive plans and all pages of selected longitudinal maps visually inspected.
- Preservation: 2,556 patient/data/compatibility files outside the ten authorised regimens retain their baseline SHA256. The manifest records explicit in-scope migrations.
- Full CI, build and security results are recorded in `software-validation.json`. Historical fixed-count/version assertions were updated only for authorised additions/migrations. Source action/boundary checks remain active.

The whole catalogue still contains review items outside this batch. Passing software checks does not establish completeness of clinical encoding, prospective clinical safety, preferred treatment selection or clinical approval.

## Regeneration

The release includes generators so content and PDFs can be reproduced. Use a clean v0.84.17 working copy and review any resulting diff. Run, in order:

1. `python3 validation/anthracycline-v08417/build-protocols.py`
2. `python3 tools/build-anthracycline-v08417.py`
3. `python3 tools/enrich-anthracycline-v08417.py`
4. `python3 tools/polish-anthracycline-v08417.py`
5. `python3 tools/integrate-anthracycline-v08417.py`
6. `python3 tools/complete-anthracycline-integration-v08417.py`
7. `python3 tools/align-anthracycline-support-v08417.py`
8. `node tools/build-breast-journeys.cjs`
9. Run `tools/build-patient-knowledge.cjs`, `tools/build-complete-pathways.cjs` and `tools/build-phase-support-v0838.cjs` with `SACT_SUITE_CODES=00262,00263,00265,00269,00423,00250,00252,00260,00278,00432`.
10. Render with `python3 tools/build-anthracycline-v08417-pdfs.py`; verify with `python3 tools/verify-anthracycline-v08417-pdfs.py`.
11. Run `python3 tools/finalize-anthracycline-v08417.py`, `npm run test:ci`, and visual review. The source builder resets software-test completion; record completion only after verification. Clinical approval flags must remain false unless independently authorised.

Python rendering dependencies: WeasyPrint, qrcode, Pillow, PyMuPDF and zxing-cpp. The scripts do not publish or commit changes. The package tool expects the recorded baseline and produces a merge/replace ZIP with no deletions.
