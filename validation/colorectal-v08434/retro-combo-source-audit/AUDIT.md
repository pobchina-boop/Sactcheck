# Cetuximab combination source audit — v0.84.34

Checked 5 November 2026. Scope: NCCP 00328 v7 (weekly cetuximab + fortnightly FOLFIRI), 00330 v6 (weekly cetuximab + fortnightly irinotecan), and 00331 v7 (fortnightly cetuximab + fortnightly irinotecan).

## Evidence and result

All three current official NCCP PDFs were retrieved from the catalogue links and retained with SHA-256 provenance in `sources.json`. Text extraction and rendered table images are retained. The 00330 table was visually rechecked after interruption: its weekly cetuximab restart-dose inconsistency is present in the source, not an extraction artefact.

The current manufacturer listing also supplied the 26-page CAMPTO SmPC. Its actual revision is **10/2024, CF 24_0**, even though the listing shows an update in September 2026. Those dates are not interchangeable. Sections 4.2 and 4.3 support the explicitly supplementary recovery, reduction and exclusion pathways. Earlier retained HPRA PDFs are historical comparison material; current rule citations use the retrieved manufacturer document.

`source-cases.cjs` executes the actual assessment engine and dose renderer. **525/525 current cases pass.** The same cases against retained pre-change protocols produce **276 passes and 249 failures**. These are test scenarios, not 249 separate clinical defects. Protocol schema and complete-form validation passed. Broad release regression, patient-content integration, browser journeys, PDFs and QR validation remain the parent release task's responsibility.

## Findings and corrections

| Area | Finding | Current behavior |
|---|---|---|
| Current diarrhoea, 00328 | Irinotecan alone was held although Table 5 holds FOLFIRI from grade 2 | All FOLFIRI components are held at grade 2+, including both 5-FU components and dependent folinic acid. Residual grade 1 still holds irinotecan under p3. |
| Current diarrhoea, 00330/331 | The combination table was not reflected in the component hold | Grade 3–4 holds both cetuximab and irinotecan. |
| Recovery attribution, 00330/331 | Complete-resolution requirement incorrectly attributed to an NCCP page | CAMPTO §4.2 p2 now supports it explicitly; NCCP Table 3 recovery to grade ≤2 remains a disclosed discrepancy. |
| Restart dose history | Absolute restart rows could recommend a dose above the patient's existing reduced dose | Exact prior component doses are required for numeric table doses. Missing/lower previous doses produce review without a calculated dose. |
| Overlapping nadir rows | A severe nadir in one cell could coexist with a moderate reduction from the other | Severe row takes precedence. Both nadirs are required to establish the moderate band. |
| Skin interval | Severe skin toxicity at exactly two weeks could avoid the failed-recovery stop | Maximum interruption boundary includes two weeks; recovered skin beyond that window receives review without a restart calculation. |
| Missing context | Missing recovery grade, interruption or failure flag could hide an unfinished decision | Explicit review pathways accompany unassessed inputs; values are never treated as normal. |
| Febrile neutropenia, 00328 | A broad history could invoke the exact two-level reduction table | The exact grade 4 neutropenia plus grade ≥2 fever flag is required; broader FN receives review under the SmPC range. |
| Baseline eligibility | Adequate marrow/organ function was narrative only | Explicit failed-confirmation review inputs, without invented numerical cutoffs. |
| Additional source cautions | Pelvic RT, cardiac history, baseline loose stools, Gilbert syndrome and renal DPD-phenotyping caution were incompletely operationalised | Regimen-specific review pathways; no fixed dose invented for qualitative cautions. |
| Interaction exclusions | St John's Wort and live attenuated vaccines were only implicit in a general interaction review | Explicit irinotecan contraindication flags from current CAMPTO §4.3; full pharmacist interaction review remains necessary. |

## Source discrepancies deliberately not “solved” by software

1. **00330 Table 3:** cetuximab 400/300 mg/m² restart values conflict with weekly 250 mg/m² maintenance. No numeric restart dose is generated for this combined decision. Consultant/pharmacy resolution is required.
2. **00328 Table 2:** the maximum ANC interruption is two weeks, but its stopping clause says four weeks. Between two and four weeks the hold and source-conflict review remain; no automatic resumption.
3. **00328 Table 3:** exact equality at bilirubin 85 µmol/L or AST 180 U/L is not allocated by its strict inequalities. Equality produces review, not a fabricated dose band.
4. **00330/331 versus CAMPTO:** the NCCP diarrhoea table permits grade ≤2 recovery, while CAMPTO requires complete diarrhoea resolution. The more restrictive irinotecan hold remains with explicit attribution and a review of component timing.
5. **Renal recommendations differ:** 00328 does not supply the <10 mL/min 50–66% range found in 00330/331. It is not copied across. For 00330/331 the range remains a specialist choice; no midpoint is calculated. CAMPTO notes absent renal evidence.

## Coverage and limits

`source-to-rule-matrix.json` records source domains, mapped rule IDs, exact rule conditions/actions and manual responsibilities. Administration sequence, infusion rates, observation, baseline and serial tests, post-treatment electrolyte surveillance, antiemetics, premedication, diarrhoea rescue, line/pump care, disease assessment and the complete interaction review are also identified; a rule-engine test does not validate their delivery in the rest of the suite.

The tests cover eligibility, RAS, blood-count and bilirubin boundaries, renal thresholds/dialysis, current component holds, skin recurrence and two-week equality, absent/invalid prior doses, no escalation, combined stop/restart conflicts, source-dose ambiguities, DPD categories, absolute 5-FU liver boundaries, and relative FOLFIRI dose levels through discontinuation.

These are source reconciliation and software checks. They do not constitute independent consultant, oncology-pharmacy or patient/PPI sign-off, nor clinical-use authorisation. Those flags remain false. No production push or deployment was performed by this audit.

## Reproduction

```sh
node validation/colorectal-v08434/retro-combo-source-audit/source-cases.cjs
node validation/colorectal-v08434/retro-combo-source-audit/source-cases.cjs --before
node tests/protocol-validator.test.js
```

The `--before` command intentionally exits nonzero because it exercises the old defects. `apply-audit.py` is the interrupted first-pass authoring script and is **not an idempotent build command**; do not run it on current protocols. The committed JSON and tests are the release inputs. `finish-audit.py` and `source-matrix.py` document subsequent corrections; rerunning authoring scripts is unnecessary for validation.


## Final grading attribution correction

Reviewed retained NCCP 00328/00330/00331 source texts, current CAMPTO section 4.2 (NCI-CTC, edition unspecified), and EMA Erbitux section 4.4 (CTCAE, edition unspecified). Removed unsupported source attribution to CTCAE v5 from 20 graded inputs. Existing interface descriptions remain explicitly orientation only with their separate reference; no source-edition conversion is asserted. Numeric rule thresholds, options and rule-engine actions are unchanged. Actual-engine cases rerun: 525/525 pass. Protocol validator rerun: 382 publishing tests pass. See grading-attribution-review.json. Authoring scripts are historical, non-idempotent and must not be rerun over the finished data.
