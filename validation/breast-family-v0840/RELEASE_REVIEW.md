# SACTCheck v0.84.0 — sixteen-regimen release review

Prepared 17 October 2026 from v0.83.9, commit `4a2847eb62ea9e59d9f098d2548921ee8f65ae69`.
This is a source-reconciled software and content update. Independent consultant, oncology-pharmacy and patient/PPI review remain pending; clinical-use authorisation remains false.

## Included regimens

| NCCP | Regimen | Source version | Encoded rules |
|---|---|---|---|
| 00252 | AC · every 3 weeks | 7 | 24 |
| 00260 | AC every 3 weeks → weekly paclitaxel | 7 | 47 |
| 00278 | Dose-dense AC → paclitaxel every 2 weeks | 7 | 44 |
| 00316 | Dose-dense AC → fortnightly paclitaxel + weekly trastuzumab | 6 | 62 |
| 00432 | AC → weekly paclitaxel + weekly trastuzumab | 5 | 64 |
| 00433 | Dose-dense AC → weekly paclitaxel + weekly trastuzumab | 6 | 64 |
| 00745 | Dose-dense AC → weekly paclitaxel + 3-weekly trastuzumab | 2a | 59 |
| 00202 | Docetaxel 100 mg/m² · every 3 weeks | 8 | 19 |
| 00203 | Docetaxel 75 mg/m² · every 3 weeks | 7 | 22 |
| 00250 | Docetaxel + cyclophosphamide (TC) | 9 | 28 |
| 00512 | Weekly paclitaxel + weekly trastuzumab → trastuzumab | 5 | 42 |
| 00621 | Paclitaxel · Days 1, 8 and 15 of 28 | 3 | 26 |
| 00258 | TCH → trastuzumab continuation | 9 | 58 |
| 00731 | TCHP · subcutaneous trastuzumab | 2 | 57 |
| 00204 | Docetaxel + pertuzumab + trastuzumab | 11 | 31 |
| 00507 | Weekly paclitaxel + pertuzumab + trastuzumab | 6 | 39 |

The batch contains 686 source-linked rules across sixteen regimens. Reuse applies to component explanations and layout. Indication, route, sequence, dose, toxicity thresholds, monitoring and supportive prescriptions are separately configured.

## What changed

- Rebuilt the clinical decision mappings from the sixteen current official NCCP documents. Audits record source URLs, versions, table pages, ambiguity and SHA-256 fingerprints. Underlined inequalities were checked visually where extraction lost their meaning.
- Completed clinician knowledge and evidence records, patient knowledge and portals, consent aids, two-page visual guides, treatment passports, contact cards, logistics, phase-specific supportive drafts and longitudinal maps.
- Retained date-free cycle charts. Weekly, fortnightly and three-weekly phases have their own visits and expectations. 00621 has D1/8/15 dosing and a planned D22–28 break. 00316 distinguishes fortnightly paclitaxel from weekly trastuzumab; 00507 and 00745 distinguish weekly taxane visits from three-weekly antibody visits.
- Separated AC, taxane and HER2-only supportive prescribing. The clinician risk display now follows the selected treatment phase. Unknown phases do not inherit an old whole-course script. TCH formulation alternatives retain their own schedule mapping.
- Added baseline, treatment, phase-transition and follow-up checks, including cardiac imaging, ECG context, cancer imaging/markers and conditional bone-health assessment. National-regimen intervals and supplemental EMA/ESC/ESMO/NICE guidance are identified separately. The maps explain elapsed time and ownership; they are not an appointment, reminder or completed-test tracking system.
- Added early-treatment pathways and receptor filters, with surgery, radiotherapy, endocrine treatment and HER2 continuation relationships. Neoadjuvant and adjuvant routes are alternatives. Shared 00203/00621 cards retain primary-cancer-specific context instead of imposing breast surveillance or surgery on all indications.
- HER2-only body maps and symptom records contain antibody-specific effects. They do not inherit all chemotherapy effects.
- Improved component reuse planning, including recognition of doxorubicin and cyclophosphamide inside AC acronyms. This map is a development planner, not a declaration of clinical interchangeability.

## Material audit findings and dispositions

| Finding | Implemented disposition |
|---|---|
| Missing or shallow rules; phases did not scope treatment actions | Rebuilt phase-specific assessment rules and reference schedules; missing values remain unassessed. |
| Cytotoxic count problems could affect antibodies | Component-scoped actions; continuing antibodies requires the separate clinical context. |
| Wrong weekly D22 expectation | 00621 is D1/8/15 of a 28-day cycle; D22 is the planned break. |
| Different AC renal/hepatic tables and exact-boundary gaps | Preserve each source; ambiguous overlaps and competing reductions require review. No silent rounding. |
| 00316 and 00507 have different cardiac holds from related cards | Keep their own source criteria. Cardiac timing is preserved across phase changes. |
| Re-loading could select the wrong antibody schedule | Separate weekly IV, q21 IV and SC alternatives; 00745 offers its q21 source schedule. |
| Dose text could disappear during a hold or re-escalate a previously reduced dose | Immediate holds remain visible; specialist-review branches block unsupported numeric doses. Current-dose guards prevent automatic re-escalation. |
| Copied indication metadata | Corrected 00203 a–h, 00621 a–e, 00731a and the restricted metastatic 00507a indication. |
| Source ambiguities in docetaxel liver rows, paclitaxel boundaries and 00507 neuropathy | Explicit consultant/pharmacy review; no invented definitive action. |
| Clinical antiemetic display and generated suite could diverge | Restored protocol risk metadata, separate phase profiles and dynamic phase selection, with regression checks. |

## Verification

- 853/853 source-derived clinical scenarios passed: AC/sequential 526; taxane 116; HER2 combinations 211. Checks exercise the actual assessment engine and the displayed component dose-action model, including boundaries, incomplete inputs, prior toxicity, phase/route mismatches and no automatic dose re-escalation.
- `npm run test:ci` passed: release gate, library regression tests, repository checks, protocol/metadata generation, deployment build and site validation.
- 142 canonical PDFs / 270 pages passed page-boundary and compatibility-copy checks. The 142 compatibility PDFs match exactly. 64 QR images decoded to the intended public regimen portals.
- All sixteen sets of PDF pages were visually reviewed using contact sheets, with detailed inspection of guides, consent, supportive prescriptions and monitoring tables. Metastatic monitoring tables were compacted to avoid an orphan final row.
- All 46 previously protected patient pipelines retain their original protected-file hashes; the registry now contains 62 protected pipelines.
- Version consistency and simulated stale-cache upgrade/current-release reuse checks passed for v0.84.0. The existing release-cache fix remains included.
- The exact drop-in package passed full CI on a clean checkout of v0.83.9 (4a2847e). Protocol/index metadata regenerated without drift; packaged product files were unchanged by CI. Authoring generators also reproduced their outputs without drift. Details are in `package-verification.json`.

## Limits and review priorities

These are automated/source-derived checks, not a prospective clinical safety study or a measured accuracy percentage. They are not exhaustive combinations of every possible patient parameter. A real end-to-end browser session was unavailable in this environment; no claim is made of manual browser testing. Formal clinical, pharmacy, usability and PPI sign-off remain outstanding.

The ESMO 2026 metastatic guideline's monitoring passage was verified from indexed source material; full text was not accessible in this environment. This is not an exhaustive international guideline review. Where NCCP does not specify a universal scan interval, the content says so rather than making one mandatory. No automated Oncotype triage was introduced.

Suggested first review cards: 00316 (two chemotherapy phases plus HER2 continuation), 00731 (neoadjuvant TCH with separate SC trastuzumab and IV pertuzumab), 00507 (weekly paclitaxel with three-weekly HER2 treatment), and 00621 (three weeks on / one week off, shared indications).

Historical regression assertions were updated only where the new audited schema, phase classification, source criteria or coverage counts superseded old expectations. The new source-scenario fixtures remain separate from the encoding generator. Legacy audit tools rewrite their historic report files during CI; those incidental report rewrites are not part of this release.

No commit, push or deployment was performed.
