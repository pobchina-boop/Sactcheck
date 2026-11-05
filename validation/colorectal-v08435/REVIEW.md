# SACTCheck v0.84.35 — cumulative colorectal review candidate

Prepared 5 November 2026 from verified GitHub main c19bef57ca5ae49816ad851f2b551b76af32fa5d (v0.84.33). This is the manual download workflow: no commit, push or deployment. The ZIP includes the unpublished v0.84.34 work and this next five-new/five-retrospective batch. Use this cumulative package instead of applying the older v34 ZIP afterwards.

## This batch

| NCCP | Current source | Context | Work |
|---|---|---|---|
| 00455 | v16 | Pembrolizumab 200 mg every 21 days | New colorectal context; existing lung bundle preserved |
| 00558 | v13 | Pembrolizumab 400 mg every 42 days | New colorectal context; existing lung bundle preserved |
| 00551 | v7a | Nivolumab 3 mg/kg plus ipilimumab, colorectal after chemotherapy | New colorectal full suite and source audit |
| 00890 | v2a | Fruquintinib | New oral full suite and source audit |
| 00900 | v1a | Nivolumab 240 mg plus ipilimumab, first-line colorectal | New full suite and source audit |
| 00732 | v2 | Fortnightly cetuximab | Retrospective clinical and full-suite audit |
| 00585 | v5b | Fortnightly cetuximab plus FOLFIRI | Retrospective clinical and full-suite audit |
| 00733 | v2a | Cetuximab plus modified FOLFOX-6 | Retrospective clinical and full-suite audit |
| 00447 | v7 | Panitumumab plus modified FOLFOX-6 | Retrospective clinical and full-suite audit |
| 00448 | v5 | Panitumumab plus FOLFIRI | Retrospective clinical and full-suite audit |

## Clinical audit and findings

Fresh official NCCP PDFs were retrieved successfully, with supplementary current EMA and supportive-care sources. Source URLs, versions, hashes, retained PDFs, page/table citations and rule matrices are in the three source-audit folders. HSE access did not block this batch.

**2,092 source-derived assessment cases pass:** 504 pembrolizumab, 599 nivolumab/fruquintinib and 989 retrospective EGFR-regimen cases. These exercise the actual assessment engine, including missing/null inputs, threshold boundaries, treatment phase, component attribution, recovery, recurrence and previous dose. They are software scenarios, not a count of clinical defects or proof of exhaustive validation. The inherited v34 batch has 1,747 additional source cases.

Key corrections and distinctions:

- Pembrolizumab colorectal selection is first-line metastatic MSI-H OR dMMR disease. Lung PD-L1 criteria are not imported. NCCP ECOG eligibility and trial ECOG populations remain distinct. Thyroid testing every 3–6 weeks is retained even for six-weekly infusions; no automatic fixed two-year stop is invented.
- 00551 and 00900 do not share a generic maintenance schedule. The 00551 CRC rows distinguish IV and subcutaneous continuation and an ambiguity in adjacent general source wording; 00900 has its own IV options and 24-month course limit. Immune endocrine, colitis, hepatic and organ-impairment pathways retain protocol-specific handling. CTCAE v4 source grades are not falsely labelled with v5 descriptors.
- Fruquintinib uses its own 5→4→3 mg dose floor, recovery/recurrence and proteinuria, hepatic, skin and bleeding pathways. Blood pressure is weekly during the first month, then monthly. The source's exact 12-hour missed-dose boundary is referred for prescription/pharmacy clarification rather than guessed.
- Retrospective EGFR combinations now account for previous dose and recovery before restart, component-specific holds, medication interactions and DPD-related hazards. The 00733 and 00447 severe-renal instructions are deliberately different. Intolerable panitumumab skin toxicity is not cleared solely by a grade below 3.
- Trial findings are attached to the disease setting, dose and combination actually studied. Where an exact regimen relies on exposure bridging or a source requires consultant choice, that limitation remains explicit.

The clinician knowledge base, consent aids, patient information, monitoring, treatment maps, passports and phase-specific support were reconciled with these findings. There are 662 additional KB/support content assertions and five new-profile contract checks. Existing lung contexts are preserved. The ten-context consistency matrix accompanies this report; it is not a site-wide consistency audit.

## Patient output and visual inspection

Each context retains the approved three-page sequence: schedule/tests/between-cycle expectations; rich anatomical toxicity illustration with numbered anchors and drug-specific descriptions; then the wallet panels, automatic QR, cutting instructions and phone-installation guidance. Example contact numbers remain clearly labelled. Full OncoWiki references and seven-section printable handbooks retain the extensive information.

Final checks cover **106 PDFs / 794 pages**, matching download mirrors, ten three-page guides, ten one-page wallet sheets, full-reference text retention and 85.6 × 54 mm wallet panels. **40 QR decodes** verify intended image and rasterized-PDF destinations. This does not verify that new destinations are deployed or that a real phone camera scans them.

Visual inspection found and corrected clipped anatomical-card text and two wallet cut-border overflows. Spacing changed; text, font sizes, body-image proportions, pins and connector geometry were retained. All five retrospective anatomical pin maps match the baseline exactly. A new card-content-fit check catches text clipping that simple page-boundary extraction missed. Duplicate supportive instructions caused by spacing variants were removed and the affected phase PDFs/handbook pages refreshed.

The complete handbooks remain 35–45 pages. Their length and further editorial refinement remain later tasks. A noncontradictory repeated summary bullet in 00448 phase support is recorded in the visual report; no safety information is missing. This package is not described as editorially final.

## Validation and limits

The uninterrupted `npm run test:ci` passed with exit 0, including the release gate, security checks, protocol generation, application tests, Pages build, retained breast/lung/colorectal checks, patient UI/provenance and v34/v35 source cases. Four handbook chronology/print tests also passed. The cumulative ZIP was applied to a clean c19bef57 baseline: all 3,839 v34/v35 source cases, eleven asset-migration/provenance tests, Pages build and site security/route/PDF integrity passed. Seven internal HTTP checks returned 200 and matched the built release, catalogue and PDFs. Tested Node 24.22.1; repository CI specifies Node 20. Full logs and machine-readable evidence accompany this report. Browser automation is a separate blocked check.

Manual desktop review opened all ten patient portals and all ten expanded full references. The rich anatomical maps loaded without broken images or horizontal document overflow at the observed desktop width. Fruquintinib portal, panitumumab/FOLFIRI anatomy and the consent navigation/form received visual inspection. This is partial desktop evidence, not a complete browser test suite.

Automated browser checks are blocked: the new runner cannot launch Chromium because of socket EPERM (0 of 80 states ran); the historical `test:patient-browser` also lacks its expected bundled browser executable. Neither is recorded as a pass. Mobile layouts, complete console/network coverage, clinician assessment UI journeys, real-device installation, camera scanning and physical printing remain unverified. The assessment engine cases do not replace those UI checks.

Independent oncology, oncology-pharmacy and patient/PPI review remains pending. The package has not been committed, pushed or deployed. Before a production merge, complete the blocked browser checks and remaining review in a permitted environment; after authorised publication, verify the exact commit's Pages result, canonical version, pages, PDFs and QR destinations.

## Progress

The historical completed-software count remains **31 of 41 candidate colorectal contexts**. The cumulative package implements the remaining ten contexts across v34 and v35, recorded as pending release validation rather than prematurely marking 41 released. This is the project's candidate inventory, not a claim of national catalogue completeness. The five v35 retrospectives are selected older EGFR suites; 00692 and the overall cross-tumour consistency review still require separate attention.
