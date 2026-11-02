# v0.84.29 source audit: topotecan and oral etoposide

Audited 2 November 2026. New full-suite proposals: 00311 IV topotecan, 00587 oral topotecan and 00388 oral etoposide. Retrospective: 00319 carboplatin plus oral etoposide. This records source reconciliation and software checks; independent oncology, pharmacy and patient/PPI review remains pending. Clinical-use authorisation remains false.

## Source provenance

The four current official NCCP PDFs were retrieved as actual bytes, extracted with layout preservation and checked against rendered dose-table pages. Initial automated HTTP requests returned 403; a normal browser User-Agent succeeded. Hashes below are of downloaded PDF bytes, not a web search extract. Full text hashes and source URLs are in `sources.json`.

| Regimen | Current source | Source date / review policy | Dose-table pages | PDF SHA-256 |
|---|---|---|---|---|
| 00311 | v4, 4 pages | Last reviewed 16 April 2025; next review 16 April 2030 | 2–3 | `c9702d21a86249ee3e4e452f7b163309dc0f8046de649c53ef680d7a58a17b0c` |
| 00587 | v2, 4 pages | Last reviewed 6 January 2021; printed review date 6 January 2026 | 2–3 | `75e08e0724b7f74bc1a8749650ab460ad5cdec682c83c016d5be22dd65349fd2` |
| 00388 | v4, 3 pages | Last reviewed 21 August 2026; review as required | 2 | `a6f65f2f352d4f0d418ff97e43154ac96b69cd2557a0be8ae139aeda4c981aeb` |
| 00319 | v5, 6 pages | Last reviewed 12 September 2025; next review 12 September 2030 | 3–4 | `0c110d0ae75bcbb056c2ed3b83df8c0a23a7330536ceb343359060f420b169de` |

00388's previous version-specific URL no longer resolves; the catalogue now links `388_oral_etoposide_.pdf`, v4. The currently linked 00587 PDF has passed its printed review date. This is recorded explicitly; no newer source or renewed clinical approval is inferred. `metadata.review_date` identifies this encoding audit; separate fields preserve NCCP last-review and next-review dates.

Primary product cross-checks: EMA Hycamtin product information, including separate IV and capsule sections; HPRA Vepesid SmPC dated 27 February 2024. Product-source conflicts are exposed for clinical resolution, rather than silently overriding NCCP or inventing an intermediate threshold.

## Corrections and decision boundaries

### 00311 IV topotecan

- Corrected indication identity: 00311b is relapsed SCLC; 00311a is ovarian disease and c/d are unlicensed fallopian/peritoneal indications. The new patient suite is explicitly lung scoped.
- Kept the NCCP five-day infusion schedule, 21-day interval and six-cycle course cap. The consultant's possible three-/four-day modification is described without generating an unsupervised alternative prescription.
- Added assessment-stage distinction, Hb recovery, prior prolonged severe neutropenia/febrile neutropenia/infection and thrombocytopenia history, neutropenia-related delay, ILD and course review.
- NCCP initial ANC wording is strictly above 1.5; the EMA threshold includes 1.5. Exact 1.5 at baseline is flagged for reconciliation. Subsequent-course ANC recovery starts at 1.0; platelets at 100 and Hb at 9 g/dL.
- Kept IV renal 20–39 mL/min at 50%. The printed 39-to-40 decimal gap is unresolved. Below 20 or on haemodialysis is not routine use; NCCP's exceptional consideration of 25% is a specialist choice, not an automatic authorisation or a categorical ban.
- IV bilirubin and non-haematological reductions remain IV specific. No oral 0.4 mg/m² decrement or oral renal band is substituted.

### 00587 oral topotecan

- Removed legacy IV 20–39/50% renal dose findings from the oral protocol. The oral source uses 30–49 mL/min, 83% / 1.9 mg/m²/day, with later escalation only after consultant review. The 49-to-50 decimal gap and insufficient data below 30 remain explicit.
- Preserved the additional oral WBC recovery criterion of at least 3, alongside ANC, platelets and Hb. Baseline versus subsequent marrow assessment is separate.
- Added absorption exclusions, capsule dose confirmation, missed/vomited-dose review, diarrhoea-specific interruption/reduction and confirmed-versus-suspected ILD handling. The IV generic 0.25 mg/m² reduction is not applied to capsules.
- Capsule information covers whole-capsule use, refrigeration at 2–8°C, no freezing, food flexibility and no automatic replacement/double dose. Six planned cycles do not imply that a patient must complete six cycles despite progression or toxicity.

### 00388 oral etoposide

- Reconciled v4 eligibility, including ECOG 0–3, and all three alternative schedules: 50 mg twice daily Days 1–7; 100 mg/m² twice daily Days 1–3; or 50 mg/m² once daily Days 1–21. They are alternative prescriptions, not consecutive phases.
- Added a canonical schedule selector and complete `schedule_7d`, `schedule_3d`, `schedule_21d` patient/clinical/journey/support contexts. No fixed total cycle count is invented.
- Preserved the source-specific 15–50 inclusive renal band at 75%, rather than copying the different 00319 table. Exact 50 is not silently treated as full dose by the old “≥50” category.
- Replaced a generic bilirubin-ratio approach with the source's absolute bilirubin and AST thresholds. The derived absolute bilirubin connection is supplied for the existing single-entry UI.
- Count-table decimal gaps remain review cases. NCCP's reduced-dose marrow row also differs from the product's starting/new-cycle requirements; the display identifies the source reduction but requires consultant/pharmacy reconciliation before restarting.
- The continuous 21-day NCCP schedule specifies a 21-day repeat without a rest week; the product describes a rest/recovery period after the prolonged schedule. This is an explicit source conflict. The software neither inserts nor removes a rest week automatically.

### 00319 retrospective: correction to the previous audit

The v0.84.23 audit incorrectly described Table 1 as using inclusive full-dose boundaries. Fresh visual inspection of the current v5 PDF shows **ANC >1.0 and platelets >100**. The PDF SHA-256 is unchanged from the earlier audit: this is a correction to our interpretation, not a claimed NCCP source update.

Two new consultant-review rules cover exact ANC 1.0 and exact platelets 100. Adjacent-value tests cover 0.999/1.000/1.001 and 99.99/100/100.01. The prior 50-to-below-75 platelet gap remains unresolved. Existing v0.84.23 regression expectations at exact 1.0 and 100 must be revised during integration; retaining an older assertion of “no finding” would preserve the audit error.

The retrospective retains 00319's distinct 10–50 renal band and bilirubin/albumin/renal-function hepatic logic. These must not be replaced by 00388 monotherapy thresholds. The bilirubin absolute-value derivation is connected. Support metadata distinguishes high-risk carboplatin Day 1 from oral-etoposide-only Days 2–3; the integrated support UI must select the actual treatment day and retain a single reconciled prevention/rescue plan.

## Dose-viewer integration findings

The three newly completed suites previously had a treatment title but no machine-readable administration rows. Explicit dose models now carry drug, route, source dose/unit/frequency, dosing days, interval and course duration. 00388 models are separately labelled alternatives, with `oral_schedule` selecting the relevant reference; their doses are not added or treated as sequential phases. The three-day and 21-day references are tested separately.

Adding starting doses exposed another risk: the generic dose viewer could parse a conditional exceptional percentage from consultant-review prose as a definite numeric dose. All unresolved review actions now block that parsing and are visible as review actions. The IV below-20 renal exception is tested as non-numeric. Oral renal 1.9 mg/m² is the source's rounded target from full 2.3 mg/m², not a calculated 1.909. Missing or already reduced current-dose history triggers a higher-priority review to prevent automatic escalation. In 00388, percentages refer to the documented starting dose, and a schedule/source conflict or higher hepatic-review threshold outranks a coincident reduction.

## Patient information and evidence scope

All four canonical records include the new distilled patient summary. The three 00388 schedule contexts have their own complete summary and day coverage. Compact summaries contain three monitoring rows (four for 00319), two between-cycle expectations, source-labelled mandatory tests versus team-agreed disease review, short card schedules and no assumed universal scan/tumour-marker interval. Longer monitoring and journey content retains extra detail, including indicated audiology for 00319. The 21-day etoposide wallet card explicitly requires team confirmation of the next start and says not to restart without approval. Topotecan cards use six cycle spaces; the ongoing etoposide regimens use a null fixed-cycle count.

Evidence claims stay tied to the studied population and schedule:

- von Pawel 1999: IV topotecan versus CAV in recurrent SCLC; similar observed survival, without a superiority claim. Toxicity percentages denominated by treatment course are labelled as such.
- O'Brien 2006: oral topotecan plus supportive care versus supportive care alone in people unsuitable for standard IV treatment. Historical survival and serious harms do not predict an individual's outcome.
- Eckardt 2007: oral versus IV topotecan is contextual product evidence; similar reported activity is not converted into an unsupported proof of equivalence.
- Johnson 1990: small uncontrolled prolonged oral-etoposide study in recurrent SCLC. It does not validate all three source schedules or establish a comparative survival benefit.
- Existing 00319 evidence limitations remain: platinum-choice evidence and studies using other schedules are not represented as trials of the exact current all-oral-etoposide/carboplatin regimen.

## Validation and integration

| Protocol | Previous rules | Proposed rules | Source/content cases |
|---|---:|---:|---:|
| 00311 | 13 | 22 | 80 |
| 00587 | 13 | 28 | 93 |
| 00388 | 11 | 22 | 61 |
| 00319 | 37 | 39 | 41 |
| Total | 74 | 111 | 275 |

`node validation/lung-cytotoxic-v08429/oral-topo/source-cases.cjs` passes **275/275**, including blank/partial inputs, strict schema, route-specific thresholds, adjacent boundaries, source conflicts, seven patient records, all 21 cycle days, finite versus ongoing card counts, compact-summary limits and valid monitoring/timeline/support/urgent/chronology source references. `--integrated` exercises the installed canonical protocols; the parent release pipeline owns that result, PDF rendering, download copies, QR decoding, browser interaction and wider regression tests.

No canonical repository files, deployment or commits are changed by this bounded package. `proposed/`, `authoring.json`, `consent-profile-updates.json` and this audit are the integration deliverables. The builder scripts share `finalize.py` for the final compact summaries and provenance corrections. Review-status fields intentionally remain pending independent review.
