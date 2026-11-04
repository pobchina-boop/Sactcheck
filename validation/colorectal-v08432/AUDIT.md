# v0.84.32 — colorectal suite and decision-rule audit

Release prepared against v0.84.31, commit `0a8ee052fb3315d11cb07d9a9747b6e1c7322229`. Sources checked 4 November 2026. This is source reconciliation and software verification; independent consultant, oncology-pharmacy and patient/PPI review remain pending. No clinical-use authorisation is implied.

## Scope and source identity

| Scope | NCCP | Regimen | Source version |
|---|---|---|---|
| New full suite | 00660 | 5-FU / folinic acid, 14-day | 2b |
| New full suite | 00421 | Continuous-infusion 5-FU with radiotherapy | 6, updated from recorded v4 |
| New full suite | 00427 | Modified Roswell Park | 6 |
| New full suite | 00428 | Modified QUASAR weekly | 6 |
| New full suite | 00486 | FLOX | 8 |
| Retrospective | 00209 | Modified FOLFOX-6 | 10a |
| Retrospective | 00321 | CAPOX / XELOX | 9 |
| Retrospective | 00227 | FOLFIRI | 9 |
| Retrospective | 00586 | Capecitabine with radiotherapy | 3 |
| Retrospective | 00623 | Bevacizumab with capecitabine | 3a |

`sources.json` records official URLs, versions and SHA-256 hashes for all ten retrieved PDFs. The five retrospective PDFs match their previous source snapshots. Original findings and pre-change protocols are retained in the adjacent source-audit and protocol-before directories. The 00421 internal protocol identifier remains stable for existing links; its source-version metadata is now v6.

## Clinical decision changes

| Finding | Correction and safety mechanism |
|---|---|
| Platelet thresholds were over-generalised | 00421, 00427 and 00428 hold below 100 ×10⁹/L. FLOX holds below 75; its 75–<100 footnote requires consultant assessment. The regimens do not inherit one shared platelet rule. |
| 00660 recovery and nadir rules differed from neighbouring regimens | Preserved its platelet-nadir “maintain dose” action, four-week persistent platelet stop, explicit review for the source's intermediate delay gap, and two-level reduction after recovered grade-4 stomatitis. |
| Liver thresholds and exclusions could produce overconfident doses | Retained absolute bilirubin >85 µmol/L / AST >180 U/L contraindication logic; exact boundary values require review. Modified Roswell Park and QUASAR expose the severe-hepatic exclusion/table conflict instead of automatically selecting a half dose. |
| Toxicity recurrence lacked full regimen-specific handling | Added diarrhoea, stomatitis and hand–foot recurrence pathways where the source specifies them. Did not invent a recurrence matrix for 00421. FLOX neuropathy actions identify oxaliplatin separately from 5-FU/folinic acid. |
| FLOX renal recommendations require judgement | Exact CrCl 30 mL/min requires review; severe impairment/dialysis wording remains a consultant decision, not an automatic calculated dose. Removed a non-source 5-FU renal rule from this regimen. |
| Optional duration fields suppressed immediate hold findings in mFOLFOX6 and CAPOX | Low counts and active toxicity now trigger the source-specific hold even if duration is blank. Higher-priority persistent-toxicity stop rules remain. Other omitted domains still remain unassessed. |
| Current dose history was absent from level reductions | 00660, mFOLFOX6, CAPOX and FOLFIRI now request current component dose levels. A missing level produces a request for confirmation, not a numeric reduced dose. Reductions are relative to the confirmed current level, preventing silent re-escalation. |
| CAPOX has an unrounded renal table gap | CrCl >50 and <51 mL/min requires review; no rounding is used to infer a dose. Baseline and subsequent-cycle blood-count criteria remain distinct. |
| FOLFIRI contains source conflicts | Grade-1 diarrhoea exposes the full-resolution narrative versus table ambiguity. Renal exclusion/table conflict and existing recovery-delay uncertainty remain visible. |
| Monitoring needed clearer patient-facing transfer | CAPOX includes conditional INR checks. Bevacizumab/capecitabine includes weekly INR until warfarin dose is stable, then before each cycle; the summary also states blood-pressure/urine monitoring and conditional ECHO. mFOLFOX6 explicitly cautions against ice chips with oxaliplatin. |
| FLOX supportive care changes by treatment day | Moderate emetogenic risk on Days 1/15/29; low on Days 8/22/36. The clinician selects the treatment day before a script is offered. |

Eligibility, DPD status, brivudine interactions, severe count reductions, source boundaries and component-specific actions are covered by the new source-based cases. Source conflicts are unresolved clinical questions, not software defects that can safely be “smoothed out”.

## Connected service suite

All ten contexts connect assessment, knowledge/evidence, consent support, supportive care, treatment/monitoring journey, logistics, patient portal, passport and downloadable PDFs. Pump information is included where applicable. The new schedules remain distinct: a 46-hour q14d pump, a continuous seven-day pump with radiotherapy, weekly-six/rest-two Roswell Park, weekly QUASAR and day-specific FLOX over three 56-day cycles.

Evidence cards identify the actual trial population, comparator and endpoint. No borrowed numerical benefit is assigned to 00660 or 00421. Historical Roswell Park comparison, QUASAR relative risk/calculated absolute benefit assumptions, and FLOX disease-free versus overall-survival results are distinguished. These statements still require clinical review before patient use.

## Patient presentation

The three shared improvements apply to 39 routes: explicit treatment context/source/document revision; standard schedule versus individual written plan; and unmistakable example contacts with an unfilled local backup route. The three-page pack retains schedule/testing, rich anatomical toxicity anchors, and a front/back cut-and-fold wallet card with a regimen-specific OncoWiki QR code and phone instructions. FOLFOX and CAPOX now have eight distinct anatomical callouts rather than the earlier four-card simplification.

The complete printable handbook retains the extended reference, monitoring plan, supportive care, logistics, passport and card in a numbered sequence with a contents page/bookmarks. Printed source addresses and expanded reference text support offline use. Further editorial shortening and paper usability work remain; the full handbook is intentionally not reduced to the three-page summary.

## Verification and limits

- Full `test:ci` command graph: 262 commands; final results are recorded in `FINAL-results.json`.
- New clinical source cases: 205, plus integrated current-dose and missing-history checks in `full-suite-v08432.test.cjs`.
- 39 three-page packs and 39 one-page wallet-card sheets; all anatomical text checked for retention.
- 117 QR checks against exact regimen OncoWiki destinations.
- 39 full-reference/handbook pairs; 4,414 reference text blocks checked; matching download copies and no out-of-page text blocks.
- 66 consent, passport, logistics, supportive-care, journey and relevant pump companion PDFs checked for boundaries and matching download copies.
- Desktop browser sample: FLOX patient navigation/OncoWiki; 00660 missing-history and confirmed-dose-level assessment. Details in `browser-visual-review.json`.
- Base-to-release hashes and protected-asset checks limit clinical protocol changes to the ten named codes and patient presentation changes to the recorded 39 routes.

These checks test encoded behaviour, file consistency and selected presentation paths. They are not independent clinical validation, exhaustive browser/accessibility testing or patient comprehension testing. Example telephone numbers must be replaced before patient issue. Sources can change after the recorded check date.

The working colorectal inventory is now 26 of 41 encoded candidate contexts, with 15 remaining in `coverage.json`. This is not a claim that every national NCCP colorectal treatment option has been catalogued or completed.
