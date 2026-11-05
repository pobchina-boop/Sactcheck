# NCCP 00327 sunitinib 37.5 mg continuous pancreatic NET audit — v0.84.37

Source reconciliation completed 2026-11-05 against the current official NCCP 00327 v5 PDF (revised 15 September 2025, review 15 September 2030) and the current EMA-linked Sutent product information. This is the continuous pancreatic NET schedule, not renal/GIST 50 mg 4-weeks-on/2-weeks-off treatment. See `sources/manifest.json` for retrieval, original URLs, page counts and SHA-256 values; official source PDFs and extracted text are retained. No source-access blocker remains for these two documents.

## Substantive findings and changes

1. **First grade 2 hand-foot syndrome was not held.** The old rule only recognised recurrent grade 2 or grade 3. NCCP Table 3 requires interruption for every grade 2/3 episode; reduction starts at second grade 2 or first grade 3. The missing first-episode hold is now independent of occurrence input.
2. **Recovered severe toxicity lost its history.** Current grade 1 after a grade 3/4 event previously looked like ordinary low-grade toxicity. Highest-episode fields retain generic and HFS decisions through recovery; grade 2 after a generic grade 3/4 event still delays. Recurrence, current prescribed dose and whether the episode adjustment was already implemented remain explicit, preventing duplicate reductions or accidental return to the original dose.
3. **Child-Pugh C source disagreement was hidden.** NCCP Table 2 considers 75% original dose; current EMA §4.2 cannot recommend use in severe hepatic impairment because it was not studied. The action now requires Consultant/pharmacy reconciliation and explicitly blocks numeric calculation. Neither 28.125 mg nor an unsupported capsule-rounded dose is generated.
4. **Asymptomatic cardiac decline overstated mandatory reduction.** NCCP Table 3 says delay until recovery and consider reduction. The action is now withhold, with optional specialist reduction described accurately. Symptomatic decline/clinical heart failure still discontinues. Current measured LVEF<55% independently raises the source cardiac caution; 55% is not below that threshold.
5. **Hypertension lacked stage/severity distinction.** Uncontrolled BP is a pre-treatment exclusion. During treatment, severe hypertension uncontrolled despite management temporarily suspends until controlled; a previous exclusion no longer implies irreversible cessation. Stage/severity missingness prompts review.
6. **HFS offered an unsupported grade 4.** The hand-foot CTCAE v5 aid now offers grades 0–3 and uses pain/instrumental/self-care distinctions. NCCP Table 3 does not name a CTCAE edition, so the UI aid is explicitly separated from source provenance.
7. **Missing organ, monitoring and serious-event pathways added.** Renal impairment/dialysis, thyroid dysfunction, proteinuria/nephrotic syndrome, SJS/TEN/EM, surgery/wound healing, bleeding/anticoagulants, pancreatitis, liver failure, TMA, fistula, angioedema, PRES/seizures, necrotising fasciitis, symptomatic hypoglycaemia, encephalopathy, dental/ONJ and TLS concerns now have named source-grounded pathways. EMA additions are clearly cited as supplements, not attributed to NCCP dose tables.
8. **Escalation and interaction limits remain discretionary.** The continuousNET context uses the source 25 mg inhibitor minimum, 62.5 mg unavoidable-inducer maximum and 12.5 mg steps. The no-response pathway is considered after 8 weeks. The source’s “or” between toxicity bands is explicitly retained as an interpretive limit; both domains are reviewed without automatic escalation.
9. **Narrative quantities cannot become calculated prescriptions.** All actions carry `dose_calculation: specialist_review` and `block_numeric_dose: true`. Reviews appear in the dose-action model as individualised decisions. Immediate stop/hold instructions remain actionable, while percentages and example dose levels remain explanatory text.

10. **The clinician schedule panel had no structured component.** The existing text described continuous dosing, but the supported dose/schedule model produced zero complete phases. Added the page1 source regimen as one37.5mg once-daily PO component with `days: ["Continuous"]`; the28-day interval remains a review cycle without a scheduled off-week. The model now shows one complete phase, and no generic escalation ladder is supplied. The additional executable case verifies phase, dose, route, days, review interval, missed-dose note and source.

## Validation evidence

Run from repository root:

```sh
node validation/neuroendocrine-v08437/sunitinib-source-audit/source-cases.cjs
```

All 339 source cases pass against the actual `js/assessment-engine.js` and `js/protocol-dose-schedule.js`. Every one of 59 rules has at least one executed positive witness. The cases include ANC/platelet boundaries and AND/OR combinations; partial/absent fields; negative/invalid inputs; renal/hepatic bands; first/recurrent/recovered HFS; generic recovery; all current-dose/previous-adjustment combinations; cardiac, thyroid, skin, proteinuria and serious events; eight-week escalation boundaries; and competing stop/hold/review findings. Every dose-model result, including nested actions, is checked for absence of an unintended quantified dose.

`source-case-results.json` retains the identical test inputs and before/after assessment/dose-model snapshots.225 cases change their action compared with the legacy protocol; these are test permutations, **not 225 separate defects**. `criterion-matrix.json` maps all 59 source-cited rules to actual witness cases. `protocol-validation.json` confirms strict schema validation with no errors or warnings, 47 optional inputs, and successful demo-form assessment.

The historical NET catalogue test was also run. It initially failed because its old three-code expectation omitted the now-added CAPTEM 00505 context. That shared-test migration belongs to the release integrator; the original failure is retained in `legacy-net-test.log`. It must not be reported as a pass until rerun after migration.

## Retained limits

- This audit and executable software coverage do not constitute independent clinical or oncology-pharmacy approval; those flags remain false.
- NCCP Table 3’s generic grades do not identify a CTCAE edition. The existing v5 UI aids are labelled as aids; HFS grade 4 is disallowed.
- No invented eGFR cutoff, urine-protein numeric cutoff, QTc dose threshold, fixed TSH threshold, fixed imaging/tumour-marker interval or universal surgery restart interval is supplied.
- The asymptomatic EF narrative uses <50% and >20% below baseline, without resolving percentage-point versus relative-drop interpretation. Table 3’s broader clinical-decline action is preserved; no derived arithmetic decision is fabricated.
- Independent patient-content integration, rendered browser/PDF/anatomy/QR testing, overall release regression, publication and live checks belong to the full-suite release work. This bounded audit did not commit, push or deploy.
