# Breast retrospective source audit — v0.84.19

Checked 25 October 2026 against frozen baseline `6c1050b8a2ced301fe770fe67fd518b5a78566e5`. This audit covers 00202, 00230, 00736, 00743 and 00485. Clinical and oncology pharmacy approval remain pending; no clinical-use authorisation is implied. Stable protocol IDs are preserved, including IDs whose historic version suffix differs from the current source footer.

## Sources and method

The five current official HSE/NCCP PDFs were retrieved afresh, hashed and read in full. Their current versions are 00202 v8, 00230 v7, 00736 v2, 00743 v3 and 00485 v6. All five hashes match the prior source audit copies. There is no invented source-version bump. `sources.json` records URLs, hashes, footer pages/version and the review-date field as printed; 00202 prints a *last reviewed* date rather than a future review deadline.

Dose-table pages were rendered and visually inspected: 00202 p3, 00230 pp2–3, 00736 pp2–4, 00743 p3 and 00485 pp3–4. Research PDFs, extracted text and PNGs remain outside the repository under `research-v19/retro`. Visual inspection corrected an important text-extraction error in 00485 (below). The PDF skill was used for this read-only table inspection.

Two current EMA SmPC supplements are explicit, with their own provenance: Taxotere sections 4.2 and 4.6, and Halaven section 4.4. NCCP dosing tables remain primary for regimen-specific thresholds. Trial abstracts were checked as primary PubMed/MED records through Europe PMC; E1199 and JUST full-text results were also verified from primary publication retrieval. `evidence.json` separates exact schedule evidence from component evidence, historical comparators, and nonrandomized cohorts.

## 00202 — docetaxel 100 every 21 days

Maintained: baseline/ongoing ANC 1.5 threshold; independent severe hepatic limits; explicit review for the overlapping/ambiguous 50% and 75% original-dose liver rows; 100→75→60 neuropathy ladder; grade 3/4 stomatitis reference 60; reconciliation when an existing dose is lower than that reference. Grade-3 skin toxicity remains consultant review of the same source ladder, with no invented grade-4 percentage. Renal/dialysis source wording does not justify an automatic reduction. No routine HER2-style cardiac imaging schedule is introduced.

Changes:

- Distinguish previous febrile neutropenia from a currently acute event. Prior FN remains relevant after counts recover and prompts a documented restart/dose/G-CSF plan.
- Add review for incomplete steroid premedication. The alternative IV steroid is a consultant option, not an automatic duplicate prescription.
- Add immediate stop/no-rechallenge for severe hypersensitivity and urgent hold/assessment for suspected neutropenic enterocolitis.
- Correct breastfeeding provenance: it is not listed in NCCP 00202 exclusions. EMA Taxotere section 4.6 requires breastfeeding to cease during treatment.
- Add the *explicitly labelled* EMA section 4.2 cessation instruction for persistent severe neuropathy at 60 mg/m². NCCP Table 3 ends its numeric ladder at 60; the new stop instruction comes from the current medicine information, not from another regimen. The older taxane regression case that prohibited a stop solely because NCCP lacked a cessation row must be migrated to verify this new provenance and action.
- Replace pathological demonstration values (e.g. platelets 2) with plausible values; demos remain illustrative, not defaults for missing clinical data.

Unresolved: the liver table prints bilirubin “<1–1.5 ULN” with overlapping connectors and leaves boundary questions including ALP exactly 6. No definitive 50%/75% calculation is generated for those patterns. The EMA hepatic table differs from the current NCCP/Giraud table; it is not silently substituted.

## 00230 — nab-paclitaxel 260 every 21 days

No new clinical threshold was needed after fresh review. Preserve the previous audit's baseline versus on-treatment distinction, ANC/platelet recovery, first/second FN reference doses 220/180, reduced-dose history, neuropathy occurrence/recovery, prohibition of re-escalation, and the explicit grade-4 second-event choice (stop **or** hold/reduce). Stop if no response after two cycles remains source-specific.

Moderate/severe hepatic impairment is approximately 80% of the **original** dose, with specialist reconciliation; the weekly regimen's numeric AST/bilirubin exclusion is not copied into this table. Renal impairment and dialysis do not automatically cause dose reduction. The intermediate ANC row prints “220 mg” without `/m²`; that unit discrepancy remains visible rather than silently repaired. Conditional baseline cardiac assessment is tied to history/prior anthracyclines, with ongoing assessment as indicated. Routine premedication is not generally required. Only audit/reconciliation metadata and source-specific monitoring text are refreshed.

## 00736 — nab-paclitaxel 100 on days 1, 8 and 15 every 28 days

No new clinical threshold was needed. Preserve the prior audit's 100→80→60 ladder; day-1 versus in-cycle count interpretation; mixed-band and exact ANC1/platelets75 overlap review; stricter subsequent-cycle recovery wording; prior-FN/myelosuppression-delay context; baseline grade-2 neuropathy exclusion versus recovery-to-grade≤2 conflict; severe-hepatic conflict and strict bilirubin>5 or AST>10 limits. The grade-4 second-event alternatives and no-re-escalation protections remain intact.

NCCP p2 explicitly lists cycle-start FBC/renal/liver tests and day-8 FBC, but does not separately list day-15 FBC. The service must confirm dose-day testing/eligibility; the suite must not claim a source-listed day-15 test schedule. Off-label consent and standard-paclitaxel-unsuitability criteria remain explicit. The 260q21 trial and the 150mg/m² first-line weekly arm are not evidence for this exact 100mg/m² schedule/population.

## 00743 — eribulin base 1.23 on days 1 and 15 every 28 days

Maintained: baseline ANC≥1.5/platelets>100 versus dose-day ANC≥1/platelets≥75; current and historical toxicity distinction; recurrence-confirmed 1.23→0.97→0.62 ladder; consider-discontinuation after recurrence at 0.62; original-dose renal/hepatic percentages; no automatic re-escalation; congenital QT exclusion, risk-based ECG and electrolyte correction. CrCl exactly 50 does not inherit the different 00228 equality gap.

Add explicit negative-confirmation review inputs for the NCCP prior-therapy indication and off-label day1/15q28 consent/DTC governance. The text previously mentioned these but the decision input path did not act on unconfirmed status. Current NCCP says FBC/renal/liver tests at each cycle start. The separately labelled EMA Halaven section 4.4 adds FBC before **every dose**, including day 15; no universal repeated ECG or echo interval is invented. Optional trastuzumab is a separate regimen, not automatically included in this monotherapy.

## 00485 — dose-dense AC followed by weekly paclitaxel

Changes:

- Current FN now holds scheduled chemotherapy pending urgent acute assessment. Previous FN is separately captured; AC's 75% source instruction is not copied to the paclitaxel phase.
- Add explicit AC restart context and both-count recovery requirements, with previous delay reason. **Visual source correction:** Table 1's neutropenia-delay row requires ANC>1 and platelets>100, whereas its thrombocytopenia-delay row requires ANC>1 and platelets≥100. Plain `pdftotext` output loses the underline in ≥ and falsely reports >100 in both rows. At platelets exactly 100 with unknown/mixed prior delay reason, review is required; the thrombocytopenia-only row is not incorrectly held. ANC exactly 1 remains below restart criteria in both rows.
- Add missing assessment-stage review for ANC 1 to <1.5, which cannot silently be treated as on-treatment eligibility.
- Add a planned-dose cumulative-limit check and missing-phase cardiac/exposure review. NCCP's 450mg/m² doxorubicin ceiling includes the proposed exposure and may be lower with individual risk. The software does not calculate a projected total using an assumed dose.
- Add indication confirmation and G-CSF-plan confirmation during dose-dense AC. This G-CSF requirement is not imposed on every weekly taxane dose.
- Suppress paclitaxel numeric hepatic reference doses when they exceed the actual current dose. The baseline displayed 60mg/m² as a “dose reduction” from an entered current50mg/m². Current doses below either the fixed60 or fixed40 reference now require specialist reconciliation, with no numeric restart tile.
- Separate the explicit breastfeeding exclusion from pregnancy's specialist risk-benefit safety review; do not misattribute pregnancy as a printed NCCP exclusion.
- Correct misleading demonstration values for counts, LVEF, renal function, dose and delay count.

Maintained: phase-specific ANC/platelet thresholds including the paclitaxel platelet90 overlap; AC second-delay review; doxorubicin bilirubin20–50/51–86/>86 and the 50–51 gap; cyclophosphamide CrCl10–29/≥30 and the29–30 gap; dialysis may-consider wording; paclitaxel's **fixed60/40mg/m² hepatic targets**, which differ from 00815 percentages; hepatic decimal gaps and missing ALT; neuropathy grade2 subtract10 from actual dose; grade≥3 non-haematological toxicity discontinuation. Multiple reductions still require consultant/pharmacy reconciliation rather than automatic arithmetic stacking.

The patient timeline is four q14 AC cycles followed 14 days later by 12 weekly paclitaxel doses, about20 planned weeks including the final cycle interval. All AC cycles need G-CSF. AC antiemetic and taxane premedication plans are separate. Source cardiac monitoring is driven by anthracycline risk and clinical indication; there is no trastuzumab or fixed12-week HER2 echo schedule. Details are in `service-facts.json`.

## Verification and integration

`source-cases.cjs` runs the real assessment engine and the displayed component-dose model. It uses independent clinical boundary/negative cases and explicit stage/history contexts, rather than checking rule IDs alone. Contraindication text tiles marked `quantified` internally are distinguished from actual numeric restart doses.

- Frozen baseline: **237/282 pass**, **45 expected failures** exposing missing safeguards, missing confirmation paths, corrected source attribution and invalid demo values.
- Proposed JSONs: **282/282 pass**.
- Integrated mode is provided for root to run after copying proposals: `node validation/breast-final-v08419/retro/source-cases.cjs integrated`.

The 45 failed baseline cases are not 45 distinct clinical bugs; several are independent values around the same boundary. Existing nab/eribulin threshold checks remain retained. Prior release harnesses that hard-code source-check dates, encoding-release metadata, monitoring phrases or the old docetaxel cessation expectation should be migrated with explicit rationale; clinical threshold assertions should remain substantive.

No production/shared file was edited by this audit. `proposed/` contains all five canonical candidates, including refreshed metadata for the two nab protocols whose clinical rules were maintained. `evidence.json`, `service-facts.json` and `sources.json` form the integration handoff. All independent consultant, oncology pharmacy and clinical-use authorisation flags remain false.
