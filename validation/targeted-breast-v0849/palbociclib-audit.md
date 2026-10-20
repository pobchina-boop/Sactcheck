# Palbociclib source reconciliation — v0.84.9

Checked 20 October 2026. Scope: NCCP00414 version5a (11 August 2026; last clinical review15 October 2025), pages1–5, with EMA Ibrance SmPC sections4.1–4.8/5.1 (EMA product-information page updated7 March 2025). This is an AI-assisted source reconciliation and synthetic software audit. Consultant/pharmacy validation and clinical-use authorisation remain pending.

## Findings corrected

1. **Day15 thrombocytopenia pathway absent.** The legacy Day15 rule tested ANC only. Platelets25–<50 ×10⁹/L on Day15 of cycles1–2 now follow the NCCP grade3 route, with a Day22 repeat FBC. A grade4 count or febrile/infected grade3 event takes precedence.
2. **An isolated grade3 count did not explain the missing timing reliably.** ANC0.5–<1.0 or platelets25–<50 without timing now identifies the abnormality and requests only linked cycle-day context. Day1 and Day15 have different actions; unrelated inputs remain optional.
3. **The below75mg stop criterion was both too narrow and too automatic.** The old rule required a recurrence flag at75mg, missing definitive reduction triggers such as grade4 counts or persistent severe non-haematological toxicity. Conversely, recurrent/prolonged grade3 is a *consider reduction* criterion, not automatic discontinuation. The corrected rule separates consideration from a documented need for further reduction.
4. **Pulmonary, interaction and eligibility gaps.** Added new/worsening pulmonary-symptom interruption and severeILD permanent discontinuation, StJohn’sWort exclusion, CYP3A inhibitor/inducer review, pregnancy/breastfeeding/hypersensitivity exclusions, HR/HER2/setting/ECOG checks, endocrine-partner prerequisites and pre/perimenopausal ovarian-suppression context.
5. **No authored treatment phase or longitudinal monitoring.** Added the125/100/75mg dose ladder;21on/7off schedule; separate continuous/injection endocrine partner; baseline tests, first-two-cycle Day15 FBC, Day22/within-one-week contingencies and conditional later FBC de-escalation. Renal/liver bloods remain before each cycle.
6. **Generic source labels and wrong page count.** Every34rules now has an exact source URL, page, section where relevant and checked date; NCCP page count is5, not8.

## Source differences preserved

- NCCP expects no renal dose adjustment including haemodialysis; EMA states insufficient haemodialysis evidence. Severe end-stage disease/dialysis retains explicit oncology/pharmacy review without a fabricated percentage reduction.
- NCCP describes **capsules with food**. EMA also authorises **tablets with or without food**. Patient instructions explicitly ask users to check formulation.
- NCCP cytopenia/non-haematological dose tables cite CTCAEv4.0. The source-specific grade/boundary rules are retained; generic platform severity descriptions do not replace event-specific grading.
- NCCP does not prescribe a fixed CT/marker interval or a routine palbociclib-specific ECG/echo schedule. Monitoring content explicitly avoids copying the ribociclib ECG timetable.

## Actual-engine verification

`node validation/targeted-breast-v0849/palbociclib-source-cases.cjs`

**144/144 cases passed;34/34 encoded rules exercised.** Cases include both sides and exact cytopenia boundaries, timing omission, Day1 vsDay15, fever/infection overrides, all dose levels, severe toxicity with absent/present persistence context, liver/renal categories, explicit true/false exclusions, endocrine/ovarian context and competing-rule precedence. The actual visible-dose model was checked to ensure withholding/unresolved states do not present a numeric restart dose; Child-PughC alone displays75mg.

These are source-derived synthetic inputs, not a manual browser audit or proof of clinical correctness. Full-suite UI/integration checks belong to the release owner.

## Evidence interpretation

The config supplies PALOMA-2 and PALOMA-3 results from EMA efficacy tables with populations, analysis dates and endpoint definitions. It explicitly distinguishes improved PFS from the absence of statistically significant OS benefit in the cited prespecified final analyses. It does not infer superiority against anotherCDK4/6 inhibitor or compare medians across unlike populations.

## Current-source verification

The current official catalogue links to `https://healthservice.hse.ie/documents/6457/414_Palbociclib.pdf`, redirecting to `https://assets.hse.ie/media/documents/414_Palbociclib.pdf`. After intermittent403/404responses, the release owner retrieved the current391,022-byte PDF successfully. Full text was reviewed: **version5a,11August2026;5pages; last clinical review15October2025**.

Version5a corrects the reimbursement-status box and changes review scheduling to **as required**, with no changes to the clinical thresholds, dose tables or monitoring used in this audit. Metadata/source links, exact version and review scheduling are updated; the obsolete2030fixed review date is removed. Both current NCCP and EMA source SHA256 hashes are retained in the content brief. No current-source retrieval issue remains for this regimen.

## Rendered grading audit

The actual CTCAE helper originally supplemented the numeric ANC/platelet and grade-related boolean fields with CTCAE v6 educational panels, despite NCCP using v4-era thresholds. The non-haematological selector displayed a v4 label but linked the v5 reference. These UI inconsistencies are now corrected through explicit source-specific metadata.

Only the actual non-haematological grade selector carries `ctcae_version: "4.0"`, with the official NCI v4.03 reference and individually authored general severity anchors. It explicitly requires the named adverse-event criterion. Numeric/binary fields carry `grading_source_label` and NCCP table guidance but no CTCAE version marker that could misclassify them as grade selectors. All six helper panels disable numeric auto-grading and unrelated v5/v6 comparisons. The eight added actual-renderer checks bring the audit to144/144passing scenarios, with34/34rules exercised.
