# Batch 3 external PLD clinical review — 18 November 2026

These are external clinical drafts only. No application files were changed. They are not independently approved clinical protocols or a completed release. Source reconciliation used the complete current official extracted text of NCCP 00205 v8 and 00462 v4. Original PDF bytes and visual table pixels were unavailable; neither a PDF hash nor visual table verification is claimed.

## Identity and preservation

| Code | Current source | Existing → proposed protocol ID | Dose / calendar | Indication preserved |
|---|---|---|---|---|
| 00205 | v8; revised 23 July 2025; review due 23 July 2030 | nccp-00205-v8 → unchanged | 50 mg/m² day 1 every 28 days; typically 6 cycles or continuation to progression/toxicity | All four existing breast, ovarian, metastatic soft-tissue sarcoma and endometrial entries retained exactly |
| 00462 | v4; revised 9 April 2025; review due 9 April 2030 | nccp-00462-v4 → unchanged | 20 mg/m² day 1 every 21 days, maximum 6; separately selected 14 day option | AIDS-related Kaposi sarcoma; CD4 <200 and extensive mucocutaneous/visceral disease |

No protocol version alias migration is needed. The existing 00462 indication identifier `00462-sarcoma` remains intact; `00462a` is added as the explicit source/reimbursement code. Application integration must retain the existing shared 00205 contexts and route ownership.

## Findings and resulting behavior

1. **00462 eligibility:** the legacy ECOG >2 rule contradicted the current source's 0–3 eligibility. The draft uses >3 and separately checks the CD4/extent indication. Pre-existing cardiomyopathy remains a caution, not an exclusion. Current product information adds its separate restriction where local therapy or systemic alfa-interferon can effectively treat the Kaposi disease.
2. **Separate count tables:** 00462 now delays below ANC 0.5 or platelets 50; its 50% row applies only to ANC 0.5–0.99 or platelets 50–74. It does not inherit 00205's ANC 1.5 recovery threshold or severe-count growth-factor choice. Both fractional platelet gaps and 00462's ANC >0.99 to <1 gap stay under review. A more severe second count wins over an intermediate value. Recovered counts cannot silently reverse a previous reduced prescription.
3. **00205 count history:** the existing severe ANC <0.5 / platelet <25 priority and paired recovery thresholds are retained. The printed 100% row covers ANC 1.5–1.9; ANC >1.9 now displays a source-interpretation prompt without calling the higher value pathological or inventing a reduction.
4. **Absolute bilirubin:** the old 00462 conversion assumed ULN 20. Both drafts now use the entered absolute µmol/L result: 20–50 selects 75% of original dose, 51–86 selects 50% of original, >86 is not recommended. The >50 to <51 gap is not rounded or interpolated. Contradictory selected bands cannot select a percentage. The UI exposes one raw bilirubin control and derives a hidden absolute field; the separately calculated local-ULN ratio cannot shift these thresholds.
5. **Prescription history:** percentages remain visible as source instructions, but no new mg/m² dose is calculated from an unknown original/current prescription. Earlier reductions, simultaneous toxicities and source choices require reconciliation. The existing dose viewer suppresses an unquantified `dose_reduce` action; using its supported `consultant_review` action with `show_in_dose_actions` keeps the qualitative instruction visible without an engine change.
6. **PPE and stomatitis:** 00462 gains the complete grade/history/0–1–2 week table. Both drafts retain a discontinuation already met at the two-week review even when a later entered grade is 0–2. A restart request requires review of the worst grade, timing, stop history and prescription. Grade 0 alone supplies no new numerical restart dose. Oral mucositis remains an explicitly labelled stomatitis alias.
7. **Cardiac monitoring:** assessment before each additional dose taking lifetime anthracycline exposure above 450 mg/m² is mandatory; this is not an automatic treatment stop. A completed investigation still requires its result to be reviewed. Prior mediastinal irradiation, concurrent cyclophosphamide and pre-existing cardiac disease remain separate cautions below that cumulative threshold.
8. **Administration and formulation:** the pegylated product cannot be replaced by Myocet/non-pegylated or conventional doxorubicin. Current reactions hold treatment; a historical reaction prompts the supervised NCCP modified sequence. NCCP 00462's initial 1 mg/min and subsequent 60-minute instructions differ from the current EMA AIDS-KS 30-minute instruction. A visible oncology/pharmacy reconciliation prompt preserves that conflict; the draft does not silently choose one. The 14 day schedule remains an explicitly selected alternative: the application dose calendar is labelled as the 21 day reference until a separate prescription is confirmed.
9. **Monitoring/support:** 00462 replaces generic monitoring with baseline FBC, renal/liver profile, LDH, ECG and LVEF; before-cycle blood profiles, regular ECG, and LDH/LVEF/PPE assessment as indicated. It retains low emetogenic risk, no usual premedication and 4–7 day PPE prevention advice. It does not invent routine growth-factor, antimicrobial or tumour-marker schedules. 00205's existing monitoring and supportive-care objects are preserved exactly.
10. **Product-specific safety:** current EMA wording supports pregnancy benefit/risk review rather than an invented blanket NCCP exclusion, cessation of breastfeeding before treatment, interruption/investigation of suspected ILD and discontinuation when confirmed. Current-versus-historical adverse events are kept separate.

## Evidence and verification

- NCCP 00205: https://healthservice.hse.ie/documents/6546/205_V8_Peg_Lipo_DOXO_28_day.pdf — p1 indications/calendar/administration; p2 eligibility, tests and Table 1; p3 Tables 2–3; p4 support/cardiac/reaction advice.
- NCCP 00462: https://healthservice.hse.ie/documents/6735/462_v4_PegylatedLiposomalDOX_20mgm2_21_days.pdf — p1 indication/calendar/eligibility/administration; p2 tests and Table 1; p3 Tables 2–3; p4 support/cardiac/reaction advice.
- Current EMA Caelyx extracted text: https://www.ema.europa.eu/en/documents/product-information/caelyx-pegylated-liposomal-epar-product-information_en.pdf — sections 4.2–4.6. Retrieved excerpts and retrieval metadata are saved in `pld-ema-extracted-evidence.txt`. Its file hash identifies that extracted evidence, not original PDF bytes.
- Current complete NCCP texts and original retrieval manifest remain in `../sarcoma-batch3-sources-20261118`. Their exact extracted-text hashes are recorded in `pld-draft-manifest.json`.
- The inherited 00205 historical source hash is preserved in `historical_source_provenance`, explicitly not presented as a newly verified PDF hash.

**283/283 checks pass** using the actual existing assessment engine, dose model, strict protocol validator and raw-laboratory adapter. All 75 authored 00205 rules and all 76 authored 00462 rules are exercised. This establishes tested encoding behavior, not independent clinical approval. Boundary tests include both sides/exact thresholds, competing count severities, missing history, recovery after a previous stop, partial assessments beyond empty input, source contradictions, local ULN 24, component attribution, schedules, source identity and unchanged repository bytes.

Initial test harness findings were resolved explicitly: engine-generated `partial_context_required` messages do not carry drug components, so component assertions apply to every authored clinical rule rather than synthetic context messages. Optional CrCl has an `exists`-only no-adjustment rule and is not listed as an omitted restrictive domain; normal-count cases still require incomplete coverage and explicitly unassessed liver, cardiac and toxicity data. No clinical assertion was disabled to obtain a pass.

## Integration limitations

- No application mutation, shared index rebuild, patient/document generation, browser execution, rendered-page review, publication or deployment was performed in this subtask.
- The source tables have not been visually inspected. Original NCCP/EMA PDF binary hashes remain unavailable.
- All clinical/pharmacy/authorisation flags remain false. `software_tests_completed` in the drafts stays false because full application/release validation has not run; the external clinical test result is recorded separately.
- Source percentages and schedule choices require prescription review. The current administration conflict and printed source gaps must remain visible after integration.
- The baseline SHA guard in the manifest must be checked before application. If a protocol has changed since drafting, reconcile against that changed base rather than overwrite it.

## Reproduce

Run from the workspace root:

```sh
python sarcoma-batch3-drafts-20261118/author-pld-batch3-draft.py
node sarcoma-batch3-drafts-20261118/pld-source-cases.cjs
```

The author reads the two repository protocols and writes only its external `pld-protocols` directory and manifest. The test report is deterministic (source-check date, no runtime timestamp). `pld-checksums.json` captures the final draft, author, tests, report and evidence bytes for the parent's persisted checkpoint.

## Independent draft-review corrections

The frozen five-draft independent suite identified above-reference PLD prescriptions without a reconciliation action, severe current PPE/stomatitis with missing/outside timing requiring a hold, and prior severe00205cytopenia with platelets74.5 failing to retain the explicit recovery hold. Corrected external PLD drafts now review current/original doses above their distinct50/20mg/m² references, withhold grade3–4 toxicity when timing is missing or beyond the table, and require both ANC≥1.5 and platelets≥75 after prior severe00205cytopenia. Missing recovery counts also remain held. The283-case author suite expanded to342 passing cases; both78-rule drafts are fully exercised. Before snapshots are preserved inpld-before-independent-fixes. Independent154-case replay across allfive drafts passed unchanged after allowners corrected their findings. This is software review, not consultant/pharmacy approval.
